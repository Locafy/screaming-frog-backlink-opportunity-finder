# Locafy Public Repository Implementation Plan

## Objective

Turn the existing MIT-licensed Screaming Frog backlink snippet into a safe, useful, and maintainable public repository owned by Locafy.

## User story

As an SEO practitioner using Screaming Frog, I want to analyze each crawled page with OpenAI web search so I can identify qualified backlink prospects and practical outreach angles without manually starting the research from scratch.

## Scope

- Rebrand the project as a Locafy-maintained open-source utility.
- Preserve the original author's MIT copyright and document the derivative work.
- Replace the synchronous, brittle API call with a Promise-based Responses API integration that Screaming Frog can await.
- Use the current web search tool and parse message output even when tool-call items precede it.
- Add API-key, page-content, HTTP, and malformed-response handling without leaking secrets.
- Bound submitted page content to make cost and latency more predictable.
- Provide setup, usage, security, privacy, limitations, and troubleshooting documentation.
- Add dependency-free automated tests for the snippet's critical paths.
- Publish the validated code as a public repository in the Locafy GitHub organization.

## Non-goals

- Automatically contacting, buying links from, or submitting to discovered sites.
- Guaranteeing that a suggested site accepts contributions or is an appropriate target.
- Replacing human review, relationship building, or SEO due diligence.
- Providing a server-side API-key proxy or a hosted application.
- Crawling websites outside Screaming Frog.

## Implementation

### 1. Harden `backlink-snippet.js`

- Introduce a compact configuration block for the local API key, model, content limit, and opportunity count.
- Select meaningful page text from `article`, `main`, or `body`; normalize whitespace and truncate it.
- Return clear Screaming Frog errors for missing credentials or content.
- Call `POST /v1/responses` asynchronously with the `web_search` tool.
- Ask for evidence-led prospects with URL, relevance, suggested asset, pitch angle, and verification note.
- Extract every `output_text` part from message output instead of assuming the first output item contains text.
- Surface sanitized API and network errors.

### 2. Rewrite project documentation

- Explain what the project does and does not automate.
- Document prerequisites and precise Screaming Frog installation steps.
- Explain API-key handling, third-party data sharing, cost/rate-limit considerations, and manual qualification.
- Add configuration, output, troubleshooting, contribution, and source-attribution sections.
- Link to authoritative Screaming Frog and OpenAI documentation.

### 3. Add open-source repository support

- Retain the original copyright and add Locafy's derivative-work copyright.
- Add `ATTRIBUTION.md`, `CONTRIBUTING.md`, `SECURITY.md`, and `.gitignore`.
- Add a dependency-free `package.json` test workflow.

### 4. Add automated validation

- Execute the snippet in a Node VM using mocked Screaming Frog, DOM, and fetch interfaces.
- Test missing-key rejection, content selection/truncation, current Responses API request shape, tool-call-aware output extraction, HTTP failures, and empty pages.
- Run the complete test suite, package dry run, and secret-pattern scan.

### 5. Publish to GitHub

- Commit the complete, validated change atomically.
- Fast-forward the feature branch into `main`.
- Preserve the source repository as the `upstream` remote.
- Create `Locafy/screaming-frog-backlink-opportunity-finder` as a public repository, push `main`, and add a description, homepage, and discoverability topics.
- Verify public visibility, default branch, remotes, and repository metadata.

## Acceptance criteria

- The snippet returns a Promise compatible with Screaming Frog extraction snippets.
- No real API key or secret is committed.
- Responses containing a web-search tool call followed by a message are parsed correctly.
- Expected user and API failure modes produce actionable errors.
- Tests pass using only the Node.js standard library.
- Original MIT attribution remains visible.
- The final GitHub repository is publicly accessible under the Locafy organization with `main` as its default branch.

## Validation commands

```bash
npm test
npm pack --dry-run
rg -n --hidden --glob '!.git/**' 'sk-(proj-)?[A-Za-z0-9_-]{20,}' .
git diff --check
```
