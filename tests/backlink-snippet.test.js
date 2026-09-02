const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const snippet = readFileSync(join(__dirname, '..', 'backlink-snippet.js'), 'utf8');

function createDocument(content = {}, href = 'https://example.com/source-page') {
  return {
    location: { href },
    querySelector(selector) {
      const text = content[selector];
      return typeof text === 'string' ? { innerText: text } : null;
    }
  };
}

function createResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    async text() {
      return typeof payload === 'string' ? payload : JSON.stringify(payload);
    }
  };
}

async function runSnippet({
  apiKey = 'test-api-key',
  content = { article: 'Useful source content' },
  fetchImpl = async () => createResponse({
    output: [{ type: 'message', content: [{ type: 'output_text', text: 'Result' }] }]
  }),
  href,
  maxContentChars
} = {}) {
  let configuredSnippet = snippet.replace(
    "apiKey: 'YOUR_OPENAI_API_KEY'",
    `apiKey: '${apiKey}'`
  );

  if (maxContentChars) {
    configuredSnippet = configuredSnippet.replace(
      'maxContentChars: 12000',
      `maxContentChars: ${maxContentChars}`
    );
  }

  const context = {
    document: createDocument(content, href),
    Error,
    fetch: fetchImpl,
    seoSpider: {
      data(value) {
        return { type: 'data', value };
      },
      error(value) {
        return { type: 'error', value };
      }
    }
  };

  const script = new vm.Script(`(function () {\n${configuredSnippet}\n})()`);
  return script.runInNewContext(context);
}

test('rejects the unchanged API-key placeholder without making a request', async () => {
  let requested = false;
  const result = await runSnippet({
    apiKey: 'YOUR_OPENAI_API_KEY',
    fetchImpl: async () => {
      requested = true;
      throw new Error('fetch should not run');
    }
  });

  assert.equal(result.type, 'error');
  assert.match(result.value, /Add your OpenAI API key/);
  assert.equal(requested, false);
});

test('uses article text first, normalizes it, truncates it, and sends a web-search request', async () => {
  let request;
  const result = await runSnippet({
    content: {
      article: '  Article\n\ncontent that is deliberately long  ',
      main: 'Main content should not be selected',
      body: 'Body content should not be selected'
    },
    maxContentChars: 20,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return createResponse({
        output: [{ type: 'message', content: [{ type: 'output_text', text: 'Prospects' }] }]
      });
    }
  });

  const body = JSON.parse(request.options.body);
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(request.options.method, 'POST');
  assert.equal(body.model, 'gpt-5');
  assert.deepEqual(body.tools, [{ type: 'web_search' }]);
  assert.match(body.input, /Source page: https:\/\/example\.com\/source-page/);
  assert.match(body.input, /Page content:\nArticle content that/);
  assert.doesNotMatch(body.input, /Main content/);
  assert.deepEqual(result, { type: 'data', value: 'Prospects' });
});

test('extracts message text when a web-search tool call precedes it', async () => {
  const result = await runSnippet({
    fetchImpl: async () => createResponse({
      output: [
        { type: 'web_search_call', id: 'search_1', status: 'completed' },
        {
          type: 'message',
          content: [
            { type: 'output_text', text: 'First section' },
            { type: 'output_text', text: 'Second section' }
          ]
        }
      ]
    })
  });

  assert.deepEqual(result, {
    type: 'data',
    value: 'First section\n\nSecond section'
  });
});

test('returns a useful, redacted API error', async () => {
  const result = await runSnippet({
    fetchImpl: async () => createResponse(
      { error: { message: 'Invalid credential sk-sensitive-example' } },
      { ok: false, status: 401 }
    )
  });

  assert.equal(result.type, 'error');
  assert.match(result.value, /HTTP 401/);
  assert.match(result.value, /\[redacted\]/);
  assert.doesNotMatch(result.value, /sk-sensitive-example/);
});

test('rejects pages without readable content', async () => {
  let requested = false;
  const result = await runSnippet({
    content: {},
    fetchImpl: async () => {
      requested = true;
      throw new Error('fetch should not run');
    }
  });

  assert.equal(result.type, 'error');
  assert.match(result.value, /No readable/);
  assert.equal(requested, false);
});

test('returns an error when a successful response has no message text', async () => {
  const result = await runSnippet({
    fetchImpl: async () => createResponse({
      output: [{ type: 'web_search_call', status: 'completed' }]
    })
  });

  assert.equal(result.type, 'error');
  assert.match(result.value, /no message text/);
});
