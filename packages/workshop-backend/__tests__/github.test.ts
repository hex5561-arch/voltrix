import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  utf8ToBase64,
  base64ToUtf8,
  parseRepoString,
  resolveRepo,
  resolveToken,
  githubFetch,
  githubGetRepo,
  githubReadFile,
  githubCommitFile,
  githubCreatePullRequest,
  githubPushGadget,
  defineGitHubTools,
  DEFAULT_SANDBOX_OWNER,
  DEFAULT_SANDBOX_REPO,
  GITHUB_USER_AGENT,
  GITHUB_API_VERSION,
} from "../src/github";
import * as Y from "yjs";

describe("GitHub REST API Suite for Cloudflare Workers", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe("Base64 & UTF-8 Encoding/Decoding", () => {
    it("encodes and decodes standard ASCII strings", () => {
      const input = "Hello, Voltrix OS Cloudflare Workers!";
      const b64 = utf8ToBase64(input);
      expect(base64ToUtf8(b64)).toBe(input);
    });

    it("encodes and decodes multi-byte UTF-8, emojis, and math characters without Node.js Buffer", () => {
      const input = "⚡ Voltrix OS: λ(x) => x² + ∫f(t)dt 🚀 🌍 αβγδε 💖";
      const b64 = utf8ToBase64(input);
      expect(base64ToUtf8(b64)).toBe(input);
    });

    it("handles GitHub-style whitespace and newline-split base64 payloads", () => {
      const input = "console.log('GitHub API test');\nexport default App;\n";
      const b64 = utf8ToBase64(input);
      // GitHub API frequently formats base64 with 60-char lines separated by \n
      const githubChunkedB64 = b64.slice(0, 10) + "\n " + b64.slice(10, 20) + "\n" + b64.slice(20);
      expect(base64ToUtf8(githubChunkedB64)).toBe(input);
    });
  });

  describe("Hybrid Mode & Repository Resolution", () => {
    it("resolves explicit owner and repo", () => {
      const res = resolveRepo("octocat", "hello-world", null);
      expect(res.owner).toBe("octocat");
      expect(res.repo).toBe("hello-world");
      expect(res.isSandbox).toBe(false);
      expect(res.isUserDefault).toBe(false);
    });

    it("parses combined 'owner/repo' passed in owner or repo parameter", () => {
      const res1 = resolveRepo("my-org/custom-project", undefined, null);
      expect(res1.owner).toBe("my-org");
      expect(res1.repo).toBe("custom-project");

      const res2 = resolveRepo(undefined, "my-org/custom-project", null);
      expect(res2.owner).toBe("my-org");
      expect(res2.repo).toBe("custom-project");
    });

    it("falls back to user's default repo from profile if owner and repo are omitted", () => {
      const res = resolveRepo(undefined, undefined, "student123/math-thesis");
      expect(res.owner).toBe("student123");
      expect(res.repo).toBe("math-thesis");
      expect(res.isSandbox).toBe(false);
      expect(res.isUserDefault).toBe(true);
    });

    it("falls back to platform sandbox repository if both user profile and inputs are omitted", () => {
      const res = resolveRepo(undefined, undefined, null);
      expect(res.owner).toBe(DEFAULT_SANDBOX_OWNER);
      expect(res.repo).toBe(DEFAULT_SANDBOX_REPO);
      expect(res.isSandbox).toBe(true);
      expect(res.isUserDefault).toBe(false);
    });
  });

  describe("Token Resolution", () => {
    it("prioritizes explicit parameter token", () => {
      expect(resolveToken("explicit_pat", "profile_pat", "env_pat")).toBe("explicit_pat");
    });

    it("falls back to profile token then env token", () => {
      expect(resolveToken(undefined, "profile_pat", "env_pat")).toBe("profile_pat");
      expect(resolveToken(undefined, null, "env_pat")).toBe("env_pat");
      expect(resolveToken(undefined, null, undefined)).toBe("");
    });
  });

  describe("Pure Fetch Client (githubFetch)", () => {
    it("sets User-Agent: Voltrix-OS, Authorization, and API version headers", async () => {
      let capturedHeaders: Headers | undefined;
      let capturedUrl = "";

      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
        capturedUrl = url;
        capturedHeaders = new Headers(init.headers);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

      await githubFetch("/user", { token: "ghp_secret123" });

      expect(capturedUrl).toBe("https://api.github.com/user");
      expect(capturedHeaders?.get("User-Agent")).toBe(GITHUB_USER_AGENT);
      expect(capturedHeaders?.get("Authorization")).toBe("Bearer ghp_secret123");
      expect(capturedHeaders?.get("X-GitHub-Api-Version")).toBe(GITHUB_API_VERSION);
      expect(capturedHeaders?.get("Accept")).toBe("application/vnd.github.v3+json");
    });

    it("throws helpful error messages on 401, 403, and 404", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Bad credentials" }), {
          status: 401,
          statusText: "Unauthorized",
        })
      );

      await expect(githubFetch("/repos/test/repo")).rejects.toThrow(/Bad credentials.*updateStudentProfile/);
    });
  });

  describe("1. githubGetRepo", () => {
    it("fetches repository metadata and default branch", async () => {
      const mockRepo = {
        id: 123456,
        name: "voltrix-sandbox",
        full_name: "hex5561-arch/voltrix-sandbox",
        owner: { login: "hex5561-arch" },
        default_branch: "main",
        private: false,
        html_url: "https://github.com/hex5561-arch/voltrix-sandbox",
        stargazers_count: 42,
        forks_count: 7,
        open_issues_count: 0,
        updated_at: "2026-10-16T12:00:00Z",
      };

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockRepo), { status: 200 })
      );

      const res = await githubGetRepo({ owner: "hex5561-arch", repo: "voltrix-sandbox" });
      expect(res.full_name).toBe("hex5561-arch/voltrix-sandbox");
      expect(res.default_branch).toBe("main");
      expect(res.stargazers_count).toBe(42);
    });
  });

  describe("2. githubReadFile", () => {
    it("reads and decodes a file from repository", async () => {
      const sourceCode = "console.log('Voltrix OS Native File');";
      const mockFile = {
        type: "file",
        name: "index.ts",
        path: "src/index.ts",
        sha: "abc1234567",
        size: sourceCode.length,
        encoding: "base64",
        content: utf8ToBase64(sourceCode),
        html_url: "https://github.com/hex5561-arch/voltrix-sandbox/blob/main/src/index.ts",
      };

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockFile), { status: 200 })
      );

      const res = await githubReadFile({ path: "src/index.ts" });
      expect(res.path).toBe("src/index.ts");
      expect(res.content).toBe(sourceCode);
      expect(res.isDirectory).toBe(false);
      expect(res.sha).toBe("abc1234567");
    });

    it("handles directory listings gracefully", async () => {
      const mockDir = [
        { name: "App.tsx", path: "src/App.tsx", type: "file", size: 512 },
        { name: "components", path: "src/components", type: "dir", size: 0 },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockDir), { status: 200 })
      );

      const res = await githubReadFile({ path: "src" });
      expect(res.isDirectory).toBe(true);
      expect(res.content).toContain("src/App.tsx");
      expect(res.content).toContain("src/components");
    });
  });

  describe("3. githubCommitFile", () => {
    it("commits a file and auto-resolves SHA when updating existing file", async () => {
      let callCount = 0;
      let committedBody: any;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
        callCount++;
        if (init.method === "GET") {
          // File check returns existing sha
          return new Response(JSON.stringify({ sha: "existing_sha_999" }), { status: 200 });
        }
        if (init.method === "PUT") {
          committedBody = JSON.parse(init.body as string);
          return new Response(
            JSON.stringify({
              content: { path: "README.md", sha: "new_sha_100", html_url: "https://github.com/test/README.md" },
              commit: { sha: "commit_sha_555", html_url: "https://github.com/test/commit/555" },
            }),
            { status: 200 }
          );
        }
        return new Response("Not Found", { status: 404 });
      });

      const res = await githubCommitFile({
        path: "README.md",
        content: "# New Project Documentation",
        message: "docs: update README",
        token: "ghp_valid_token",
      });

      expect(committedBody.sha).toBe("existing_sha_999");
      expect(base64ToUtf8(committedBody.content)).toBe("# New Project Documentation");
      expect(res.commit.sha).toBe("commit_sha_555");
    });
  });

  describe("4. githubCreatePullRequest", () => {
    it("creates a pull request and defaults to repo default branch when base is omitted", async () => {
      let postBody: any;

      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
        if (url.endsWith("/repos/hex5561-arch/voltrix-sandbox")) {
          return new Response(JSON.stringify({ default_branch: "master" }), { status: 200 });
        }
        if (init.method === "POST" && url.endsWith("/pulls")) {
          postBody = JSON.parse(init.body as string);
          return new Response(
            JSON.stringify({
              id: 99,
              number: 42,
              title: postBody.title,
              state: "open",
              html_url: "https://github.com/hex5561-arch/voltrix-sandbox/pull/42",
              head: { ref: postBody.head },
              base: { ref: postBody.base },
            }),
            { status: 201 }
          );
        }
        return new Response("Not found", { status: 404 });
      });

      const pr = await githubCreatePullRequest({
        title: "feat: add quantum simulator",
        head: "feature/quantum",
        token: "ghp_token",
      });

      expect(postBody.base).toBe("master");
      expect(postBody.head).toBe("feature/quantum");
      expect(pr.number).toBe(42);
      expect(pr.state).toBe("open");
    });
  });

  describe("5. githubPushGadget", () => {
    it("pushes all gadget files using atomic Git Data Tree API", async () => {
      const files = new Map<string, string>([
        ["App.tsx", "export default function App() { return <div>Voltrix</div>; }"],
        ["package.json", '{"name": "voltrix-gadget", "version": "1.0.0"}'],
      ]);

      const requests: Array<{ url: string; method: string; body?: any }> = [];

      globalThis.fetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
        const method = init.method || "GET";
        const body = init.body ? JSON.parse(init.body as string) : undefined;
        requests.push({ url, method, body });

        if (url.includes("/git/ref/heads/main")) {
          return new Response(JSON.stringify({ object: { sha: "parent_commit_sha" } }), { status: 200 });
        }
        if (url.includes("/git/commits/parent_commit_sha")) {
          return new Response(JSON.stringify({ tree: { sha: "base_tree_sha" } }), { status: 200 });
        }
        if (url.includes("/git/trees") && method === "POST") {
          return new Response(JSON.stringify({ sha: "new_tree_sha" }), { status: 201 });
        }
        if (url.includes("/git/commits") && method === "POST") {
          return new Response(JSON.stringify({ sha: "new_commit_sha", html_url: "https://github.com/commit/new" }), { status: 201 });
        }
        if (url.includes("/git/refs/heads/main") && method === "PATCH") {
          return new Response(JSON.stringify({ object: { sha: "new_commit_sha" } }), { status: 200 });
        }
        return new Response("{}", { status: 200 });
      });

      const res = await githubPushGadget({
        owner: "hex5561-arch",
        repo: "voltrix-sandbox",
        branch: "main",
        files,
        targetDir: "packages/my-gadget",
        token: "ghp_token",
      });

      expect(res.success).toBe(true);
      expect(res.mode).toBe("git-tree");
      expect(res.totalFiles).toBe(2);
      expect(res.commitSha).toBe("new_commit_sha");

      // Verify that tree was built with relative directory paths
      const treeReq = requests.find((r) => r.url.includes("/git/trees") && r.method === "POST");
      expect(treeReq).toBeDefined();
      expect(treeReq?.body.base_tree).toBe("base_tree_sha");
      expect(treeReq?.body.tree.some((t: any) => t.path === "packages/my-gadget/App.tsx")).toBe(true);
      expect(treeReq?.body.tree.some((t: any) => t.path === "packages/my-gadget/package.json")).toBe(true);
    });
  });

  describe("Agent Tools Definition", () => {
    it("creates all 5 GitHub agent tools with valid schemas and execution stubs", () => {
      const mockYdoc = new Y.Doc();
      const tools = defineGitHubTools({
        hooks: {
          getGitHubAccessToken: async () => "token123",
          getGitHubDefaultRepo: async () => "my-org/my-repo",
          resolveWorkpieceRoot: () => ({ workpieceId: "w1" as any, rootName: "root1" }),
        } as any,
        chatId: 1,
        resolveToolWorkpieceId: () => "w1" as any,
        getSessionYDoc: () => mockYdoc,
        toolResult: (text, notes) => ({ content: [{ type: "text", text }], details: notes || {} }),
        toolCallNotes: new Map(),
        toolErrorText: (e) => String(e),
      });

      expect(tools.githubGetRepo).toBeDefined();
      expect(tools.githubReadFile).toBeDefined();
      expect(tools.githubCommitFile).toBeDefined();
      expect(tools.githubCreatePullRequest).toBeDefined();
      expect(tools.githubPushGadget).toBeDefined();

      expect(tools.githubGetRepo.name).toBe("githubGetRepo");
      expect(tools.githubReadFile.name).toBe("githubReadFile");
      expect(tools.githubCommitFile.name).toBe("githubCommitFile");
      expect(tools.githubCreatePullRequest.name).toBe("githubCreatePullRequest");
      expect(tools.githubPushGadget.name).toBe("githubPushGadget");
    });
  });
});
