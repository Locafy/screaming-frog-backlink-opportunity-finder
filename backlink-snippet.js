/**
 * Locafy Backlink Opportunity Finder
 *
 * Screaming Frog Custom JavaScript extraction snippet. Add your OpenAI API
 * key below in your local Screaming Frog configuration. Never commit it.
 */

const CONFIG = Object.freeze({
  apiKey: 'YOUR_OPENAI_API_KEY',
  model: 'gpt-5',
  maxContentChars: 12000,
  maxOpportunities: 10
});

function getPageText() {
  const selectors = ['article', 'main', 'body'];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const text = element && typeof element.innerText === 'string'
      ? element.innerText.replace(/\s+/g, ' ').trim()
      : '';

    if (text) {
      return text.slice(0, CONFIG.maxContentChars);
    }
  }

  return '';
}

function getPageUrl() {
  return document.location && document.location.href
    ? document.location.href
    : 'URL unavailable';
}

function getOutputText(response) {
  if (!response || !Array.isArray(response.output)) {
    return '';
  }

  return response.output
    .filter((item) => item && item.type === 'message' && Array.isArray(item.content))
    .flatMap((item) => item.content)
    .filter((part) => part && part.type === 'output_text' && typeof part.text === 'string')
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join('\n\n');
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]');
}

if (!CONFIG.apiKey || CONFIG.apiKey === 'YOUR_OPENAI_API_KEY') {
  return seoSpider.error(
    'Add your OpenAI API key to CONFIG.apiKey before running this snippet.'
  );
}

const pageContent = getPageText();

if (!pageContent) {
  return seoSpider.error('No readable article, main, or body text was found on this page.');
}

const prompt = `You are an SEO prospecting analyst researching editorially earned backlink opportunities.

Source page: ${getPageUrl()}

Using current web search, find up to ${CONFIG.maxOpportunities} relevant, reputable websites that could reasonably link to this page or a stronger supporting asset based on it.

Rules:
- Return only sites and URLs you can verify through web search.
- Prioritize genuine editorial fit, topical relevance, and a specific reason to link.
- Exclude obvious link farms, generic paid-link lists, direct competitors, and unrelated directories.
- Do not claim that a site accepts pitches unless you find evidence.
- Treat every result as a lead that still requires human qualification.

Return a concise Markdown table with these columns:
1. Prospect and URL
2. Why it is relevant
3. Suggested linkable asset
4. Outreach angle
5. What to verify manually

Page content:
${pageContent}`;

return fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CONFIG.apiKey}`
  },
  body: JSON.stringify({
    model: CONFIG.model,
    tools: [{ type: 'web_search' }],
    input: prompt
  })
})
  .then(async (response) => {
    const responseText = await response.text();
    let payload;

    try {
      payload = responseText ? JSON.parse(responseText) : {};
    } catch (_error) {
      throw new Error(`OpenAI returned an unreadable response (HTTP ${response.status}).`);
    }

    if (!response.ok) {
      const apiMessage = payload && payload.error && payload.error.message;
      throw new Error(
        `OpenAI API request failed (HTTP ${response.status})${apiMessage ? `: ${apiMessage}` : '.'}`
      );
    }

    const outputText = getOutputText(payload);

    if (!outputText) {
      throw new Error('OpenAI returned no message text for this page.');
    }

    return seoSpider.data(outputText);
  })
  .catch((error) => seoSpider.error(`Backlink finder failed: ${safeErrorMessage(error)}`));
