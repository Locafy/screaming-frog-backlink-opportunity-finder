# Screaming Frog Backlink Opportunity Finder

A custom JavaScript extraction snippet that combines [Screaming Frog SEO Spider](https://www.screamingfrog.co.uk/seo-spider/) with OpenAI web search to turn crawled page content into a shortlist of backlink prospects and outreach angles.

Maintained by [Locafy](https://www.locafy.com/).

## What it does

For every page Screaming Frog processes, the snippet:

1. Extracts readable text from the page's `article`, `main`, or `body` element.
2. Sends a bounded portion of that text to the OpenAI Responses API.
3. Uses web search to find relevant, verifiable prospect sites.
4. Returns a Markdown table with the prospect URL, relevance, suggested asset, outreach angle, and items to verify manually.

It finds research leads. It does **not** contact websites, submit forms, purchase links, or guarantee that a prospect will provide a backlink.

## Requirements

- Screaming Frog SEO Spider with Custom JavaScript support
- JavaScript rendering enabled for the crawl
- An OpenAI API key with access to the Responses API and web search
- API billing configured in your OpenAI account

## Setup

1. Download [`backlink-snippet.js`](./backlink-snippet.js).
2. Open the file locally and replace `YOUR_OPENAI_API_KEY` with your OpenAI API key.
3. In Screaming Frog, open **Configuration → Custom → Custom JavaScript**.
4. Add a new **Extraction** snippet and paste in the complete JavaScript file.
5. Give the snippet a descriptive name, such as `Backlink Opportunities`.
6. Enable JavaScript rendering for the crawl, enter the URLs you want to analyze, and start the crawl.
7. Review the snippet's results in Screaming Frog's **Custom JavaScript** results tab.

Screaming Frog waits for the Promise returned by the snippet, so each API result is attached to the page that produced it.

## Configuration

The editable settings are at the top of `backlink-snippet.js`:

```js
const CONFIG = Object.freeze({
  apiKey: 'YOUR_OPENAI_API_KEY',
  model: 'gpt-5',
  maxContentChars: 12000,
  maxOpportunities: 10
});
```

- `apiKey`: Add this only to your local copy or local Screaming Frog snippet.
- `model`: Change this to another model that supports the Responses API and web search.
- `maxContentChars`: Caps the page content sent per request to help control latency and cost.
- `maxOpportunities`: Controls the requested shortlist size. Actual output can be smaller.

## Review every prospect

AI-assisted prospecting is a starting point, not approval to reach out. Before using a result, verify:

- The page and domain are live, relevant, and editorially credible.
- The suggested relationship or contribution route actually exists.
- The site is not a link farm, private blog network, or paid-link scheme.
- Your proposed asset contributes something specific that the target's readers need.
- The contact method and message comply with applicable laws and site policies.

## Security, privacy, and cost

The snippet sends page content to OpenAI. Do not use it on pages containing personal, confidential, client-restricted, or otherwise sensitive information unless you are authorized to send that content to a third party.

An API key pasted into a browser-executed snippet is a local secret with real account privileges. Never commit it, share an exported snippet containing it, record it in screenshots, or use it on an untrusted machine. Rotate the key immediately if it is exposed. See [SECURITY.md](./SECURITY.md) for reporting project vulnerabilities.

Each crawled page can create an API request and web-search usage. Test against a small URL list first, monitor OpenAI usage, and control Screaming Frog crawl speed to avoid unexpected spend or rate limits.

## Troubleshooting

- **“Add your OpenAI API key”** — Replace only the placeholder in your local copy.
- **HTTP 401 or 403** — Check the API key, project permissions, and billing access.
- **HTTP 429** — Reduce crawl concurrency or pause until the applicable rate limit resets.
- **No readable text** — Confirm the rendered page contains text in `article`, `main`, or `body`.
- **Request blocked in the browser** — A site's Content Security Policy can prevent third-party requests. Use Screaming Frog's JavaScript debugging workflow to inspect the failure.
- **No message text** — Confirm the selected model supports web search through the Responses API.

Useful references:

- [Screaming Frog: Custom JavaScript configuration](https://www.screamingfrog.co.uk/seo-spider/user-guide/configuration/#custom-javascript)
- [Screaming Frog: Crawl with ChatGPT](https://www.screamingfrog.co.uk/seo-spider/tutorials/how-to-crawl-with-chatgpt/)
- [Screaming Frog: Debug custom JavaScript snippets](https://www.screamingfrog.co.uk/seo-spider/tutorials/how-to-debug-custom-javascript-snippets/)
- [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [OpenAI web search guide](https://developers.openai.com/api/docs/guides/tools-web-search)

## Development

The test suite uses only Node.js built-ins:

```bash
npm test
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) before proposing a change.

## License and attribution

Released under the [MIT License](./LICENSE). This project is adapted from Metehan Yesilyurt's original [`screaming-frog-automated-backlink-outreach`](https://github.com/metehan777/screaming-frog-automated-backlink-outreach) project. See [ATTRIBUTION.md](./ATTRIBUTION.md) for details.
