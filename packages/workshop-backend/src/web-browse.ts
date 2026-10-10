// Built-in WebBrowse capability for the agent.
//
// Uses Cloudflare Browser Run's "markdown" Quick Action with the Kitesurf engine. Kitesurf is a
// lightweight browser built in Rust/Wasm that runs entirely on Workers: it executes JavaScript,
// renders CSS, and converts the resulting DOM directly to Markdown — so the agent gets accurate
// content from React/Vue SPAs, Hacker News, npm, documentation sites, etc., without the memory
// and CPU overhead of a full Chromium instance (3–7× cheaper).
//
// The "markdown" Quick Action renders the page, waits for scripts to settle, then converts the
// DOM to Markdown in one step — no separate toMarkdown call needed.
//
// Kitesurf is stateless by design: each session is an isolated V8 isolate with no cookies,
// localStorage, or prior browsing state. It is free during beta.
//
// Fallback: if BROWSER is not bound (self-hosted deployments that omit Browser Run), getBrowserEnv
// returns null and the tool surfaces a clear error rather than crashing.
//
// SSRF protection: only https:// URLs to public hosts are allowed — same rule as webFetch.
// workerd's `global_fetch_strictly_public` flag applies to the Worker itself; the Kitesurf
// isolate is a separate sandboxed environment, so we validate here before passing the URL over.

import { validateWebFetchUrl } from "./web-fetch";

/**
 * The bindings webBrowse needs. Kept narrow so the caller can stub them in tests.
 * No AI binding required — the "markdown" action does its own HTML→Markdown conversion.
 */
export type WebBrowseEnv = {
  browser: BrowserRun;
};

export type WebBrowseInput = {
  url: string;
};

export type WebBrowseResult = {
  finalUrl: string;
  body: string;
  /** True when the response indicated the body was truncated. */
  truncated: boolean;
};

/**
 * Format a WebBrowseResult as a single string for the agent: YAML frontmatter then body.
 * Matches the shape of formatWebFetchResult so the agent sees a consistent interface.
 */
export function formatWebBrowseResult(result: WebBrowseResult): string {
  return [
    "---",
    `url: ${result.finalUrl}`,
    `engine: kitesurf`,
    `truncated: ${result.truncated}`,
    "---",
    "",
    result.body,
  ].join("\n");
}

/**
 * Render a public HTTPS URL using Kitesurf (via Browser Run's "markdown" Quick Action) and
 * return its content as Markdown. JavaScript is executed before extraction, so SPAs and
 * dynamically rendered pages are handled correctly.
 *
 * Throws if:
 * - The URL is invalid or non-HTTPS.
 * - The BROWSER binding is absent (not configured for this deployment).
 * - Browser Run returns a non-2xx status or a failure response.
 */
export async function webBrowse(
  env: WebBrowseEnv,
  input: WebBrowseInput,
): Promise<WebBrowseResult> {
  // Validate URL — same rules as webFetch (https:// only, no embedded credentials).
  const parsed = validateWebFetchUrl(input.url);

  // The `browser` field for Kitesurf is a newer addition to the Quick Action API that the
  // current workers-types version doesn't yet include in BrowserRunCommonOptions. Cast to
  // include it; the runtime accepts it and the Kitesurf docs confirm the field name.
  const options = { url: parsed.toString(), browser: "kitesurf" } as Parameters<
    BrowserRun["quickAction"]
  >[1];

  const response = await env.browser.quickAction("markdown", options);

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json() as { errors?: Array<{ message: string }> };
      detail = body.errors?.[0]?.message ? `: ${body.errors[0].message}` : "";
    } catch {
      // ignore parse failure
    }
    throw new Error(
      `Browser Run returned HTTP ${response.status} for ${parsed.toString()}${detail}`,
    );
  }

  // Response is BrowserRunMarkdownSuccessResponse: { success: true, result: string }
  const data = await response.json() as { success: boolean; result?: string };
  if (!data.success || typeof data.result !== "string") {
    throw new Error(`Browser Run returned an unexpected response for ${parsed.toString()}`);
  }

  // The final URL after redirects is available on the response object.
  const finalUrl = response.url || parsed.toString();

  return {
    finalUrl,
    body: data.result,
    truncated: false,
  };
}
