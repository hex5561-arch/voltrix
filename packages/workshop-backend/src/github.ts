/**
 * GitHub REST API Client & Version Control Suite for Cloudflare Workers
 *
 * Implements pure fetch-based GitHub REST API operations with zero external npm dependencies.
 * Headers: User-Agent: Voltrix-OS, Authorization: Bearer <token>, Accept: application/vnd.github.v3+json.
 * Supports UTF-8 safe base64 encoding/decoding, hybrid repository routing (user repo vs. hex5561-arch/voltrix-sandbox),
 * atomic Git Data Tree commits, and direct gadget export from session Y.Docs.
 */

import { Type, type TSchema } from "@earendil-works/pi-ai";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import type { AiToolCall, StudentProfile, WorkpieceId } from "@gadgets/workshop-shared/api";
import type * as Y from "yjs";
import type { AgentHooks } from "./agent";

// ============================================================================
// Constants & Configuration
// ============================================================================

export const DEFAULT_SANDBOX_OWNER = "hex5561-arch";
export const DEFAULT_SANDBOX_REPO = "voltrix-sandbox";
export const GITHUB_API_BASE = "https://api.github.com";
export const GITHUB_USER_AGENT = "Voltrix-OS";
export const GITHUB_API_VERSION = "2022-11-28";

// Type inference helper mirroring agent.ts defineTool
function defineTool<TParameters extends TSchema>(def: AgentTool<TParameters>): AgentTool {
  return def;
}

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface GitHubRepoMetadata {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
    type: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  default_branch: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  visibility: string;
  pushed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GitHubFileMetadata {
  type: "file" | "dir" | "submodule" | "symlink";
  encoding?: string;
  size: number;
  name: string;
  path: string;
  content?: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  download_url: string | null;
}

export interface GitHubReadFileResult {
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
  html_url: string;
  branch?: string;
  isDirectory?: boolean;
  entries?: Array<{ name: string; path: string; type: string; size: number }>;
}

export interface GitHubCommitResult {
  content: {
    name: string;
    path: string;
    sha: string;
    size: number;
    html_url: string;
  } | null;
  commit: {
    sha: string;
    html_url: string;
    message: string;
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
    tree: { sha: string; url: string };
  };
}

export interface GitHubPullRequestResult {
  id: number;
  number: number;
  html_url: string;
  state: string;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  head: {
    label: string;
    ref: string;
    sha: string;
    repo: { full_name: string; html_url: string };
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    repo: { full_name: string; html_url: string };
  };
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

export interface GitHubPushGadgetResult {
  success: boolean;
  repo: string;
  owner: string;
  branch: string;
  commitSha: string;
  commitUrl: string;
  filesCommitted: string[];
  totalFiles: number;
  mode: "git-tree" | "contents-api";
  targetDir?: string;
}

export interface RepoResolution {
  owner: string;
  repo: string;
  isSandbox: boolean;
  isUserDefault: boolean;
}

// ============================================================================
// Encoding / Decoding Utilities (Cloudflare Workers Native)
// ============================================================================

/**
 * Converts a UTF-8 string to a base64 string safely without Node.js `Buffer`.
 * Correctly handles multi-byte UTF-8, emojis, and special characters.
 */
export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a base64 string to a UTF-8 string safely without Node.js `Buffer`.
 * Correctly handles multi-byte UTF-8, emojis, and newlines inserted by GitHub's API.
 */
export function base64ToUtf8(b64: string): string {
  const cleanB64 = b64.replace(/\s+/g, "");
  const binary = atob(cleanB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// ============================================================================
// Hybrid Repository & Token Resolution
// ============================================================================

/**
 * Parse a combined "owner/repo" string if present.
 */
export function parseRepoString(input?: string): { owner?: string; repo?: string } {
  if (!input) return {};
  const trimmed = input.trim();
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    return { owner: parts[0]?.trim(), repo: parts.slice(1).join("/").trim() };
  }
  return { repo: trimmed };
}

/**
 * Resolves repository target according to Voltrix OS hybrid routing:
 * 1. Explicit owner & repo provided by caller / tool argument.
 * 2. User's default repository from their academic / student profile (githubDefaultRepo).
 * 3. Platform sandbox repository (`hex5561-arch/voltrix-sandbox`).
 */
export function resolveRepo(
  owner?: string,
  repo?: string,
  userDefaultRepo?: string | null
): RepoResolution {
  // If either owner or repo has slash "owner/repo", parse it
  if (owner && owner.includes("/")) {
    const parsed = parseRepoString(owner);
    owner = parsed.owner;
    if (!repo) repo = parsed.repo;
  }
  if (repo && repo.includes("/")) {
    const parsed = parseRepoString(repo);
    if (!owner) owner = parsed.owner;
    repo = parsed.repo;
  }

  if (owner && repo) {
    const isSandbox =
      owner.toLowerCase() === DEFAULT_SANDBOX_OWNER.toLowerCase() &&
      repo.toLowerCase() === DEFAULT_SANDBOX_REPO.toLowerCase();
    return {
      owner,
      repo,
      isSandbox,
      isUserDefault: false,
    };
  }

  // Check user profile default repo
  if (userDefaultRepo && userDefaultRepo.includes("/")) {
    const parsed = parseRepoString(userDefaultRepo);
    if (parsed.owner && parsed.repo) {
      return {
        owner: owner || parsed.owner,
        repo: repo || parsed.repo,
        isSandbox: false,
        isUserDefault: true,
      };
    }
  }

  // Fallback to platform sandbox repository
  return {
    owner: owner || DEFAULT_SANDBOX_OWNER,
    repo: repo || DEFAULT_SANDBOX_REPO,
    isSandbox: true,
    isUserDefault: false,
  };
}

/**
 * Resolves GitHub access token with hierarchy:
 * 1. Explicit token parameter.
 * 2. User profile token (StudentProfile.githubToken).
 * 3. Connected gatekeeper account / environment token.
 */
export function resolveToken(
  explicitToken?: string,
  profileToken?: string | null,
  envToken?: string | null
): string {
  const token = explicitToken?.trim() || profileToken?.trim() || envToken?.trim() || "";
  return token;
}

// ============================================================================
// Core GitHub HTTP Client (Pure Fetch)
// ============================================================================

export interface GitHubRequestOptions {
  method?: string;
  token?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function githubFetch<T>(
  endpoint: string,
  options: GitHubRequestOptions = {}
): Promise<{ status: number; data: T; headers: Headers }> {
  const url = endpoint.startsWith("http") ? endpoint : `${GITHUB_API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const method = options.method || "GET";
  const reqHeaders: Record<string, string> = {
    "User-Agent": GITHUB_USER_AGENT,
    "Accept": "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    ...(options.headers || {}),
  };

  if (options.token) {
    reqHeaders["Authorization"] = `Bearer ${options.token}`;
  }

  const fetchInit: RequestInit = {
    method,
    headers: reqHeaders,
  };

  if (options.body !== undefined && method !== "GET" && method !== "HEAD") {
    reqHeaders["Content-Type"] = "application/json";
    fetchInit.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchInit);

  if (!response.ok) {
    const errText = await response.text();
    let detailMsg = `GitHub API error (${response.status} ${response.statusText})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.message) {
        detailMsg += `: ${errJson.message}`;
      }
      if (errJson.errors && Array.isArray(errJson.errors)) {
        detailMsg += ` (${errJson.errors.map((e: any) => e.message || JSON.stringify(e)).join(", ")})`;
      }
      if (errJson.documentation_url) {
        detailMsg += ` [Doc: ${errJson.documentation_url}]`;
      }
    } catch {
      if (errText) {
        detailMsg += `: ${errText.slice(0, 250)}`;
      }
    }

    if (response.status === 401) {
      detailMsg += " — Bad credentials or expired GitHub token. Update token via updateStudentProfile({ githubToken: '...' }).";
    } else if (response.status === 403) {
      detailMsg += " — Access forbidden or rate limit exceeded. Verify token permissions (repo scope).";
    } else if (response.status === 404) {
      detailMsg += " — Resource or repository not found. Ensure repository exists and token has access.";
    }

    const err = new Error(detailMsg);
    (err as any).status = response.status;
    (err as any).statusText = response.statusText;
    throw err;
  }

  if (response.status === 204) {
    return { status: response.status, data: null as unknown as T, headers: response.headers };
  }

  const data = (await response.json()) as T;
  return { status: response.status, data, headers: response.headers };
}

// ============================================================================
// GitHub REST API Suite Methods
// ============================================================================

/**
 * 1. githubGetRepo: Fetch repo metadata and default branch.
 */
export async function githubGetRepo(params: {
  owner?: string;
  repo?: string;
  token?: string;
  userDefaultRepo?: string | null;
}): Promise<GitHubRepoMetadata> {
  const { owner, repo } = resolveRepo(params.owner, params.repo, params.userDefaultRepo);
  const token = resolveToken(params.token);

  const res = await githubFetch<GitHubRepoMetadata>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
    token: token || undefined,
  });
  return res.data;
}

/**
 * 2. githubReadFile: Read file or directory contents from repository.
 */
export async function githubReadFile(params: {
  owner?: string;
  repo?: string;
  path: string;
  branch?: string;
  token?: string;
  userDefaultRepo?: string | null;
}): Promise<GitHubReadFileResult> {
  const { owner, repo } = resolveRepo(params.owner, params.repo, params.userDefaultRepo);
  const token = resolveToken(params.token);
  const cleanPath = params.path.replace(/^\/+/, "");

  let endpoint = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}`;
  if (params.branch) {
    endpoint += `?ref=${encodeURIComponent(params.branch)}`;
  }

  const res = await githubFetch<GitHubFileMetadata | GitHubFileMetadata[]>(endpoint, {
    token: token || undefined,
  });

  if (Array.isArray(res.data)) {
    // Path points to a directory
    const entries = res.data.map(item => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
    }));
    const listing = entries
      .map(e => `• ${e.type === "dir" ? "📁" : "📄"} \`${e.path}\` (${e.size} bytes)`)
      .join("\n");
    return {
      path: cleanPath,
      sha: "",
      size: 0,
      content: listing,
      encoding: "utf-8",
      html_url: `https://github.com/${owner}/${repo}/tree/${params.branch || "HEAD"}/${cleanPath}`,
      isDirectory: true,
      entries,
    };
  }

  const fileData = res.data;
  let decoded = "";
  if (fileData.content && fileData.encoding === "base64") {
    decoded = base64ToUtf8(fileData.content);
  } else if (fileData.content) {
    decoded = fileData.content;
  }

  return {
    path: fileData.path,
    sha: fileData.sha,
    size: fileData.size,
    content: decoded,
    encoding: fileData.encoding || "utf-8",
    html_url: fileData.html_url,
    branch: params.branch,
    isDirectory: false,
  };
}

/**
 * 3. githubCommitFile: Create or update a single file.
 * Auto-fetches the existing file's SHA if `sha` is not provided to prevent 409 Conflict.
 */
export async function githubCommitFile(params: {
  owner?: string;
  repo?: string;
  path: string;
  content: string;
  message: string;
  branch?: string;
  sha?: string;
  token?: string;
  userDefaultRepo?: string | null;
}): Promise<GitHubCommitResult> {
  const { owner, repo } = resolveRepo(params.owner, params.repo, params.userDefaultRepo);
  const token = resolveToken(params.token);
  if (!token) {
    throw new Error(
      "GitHub authentication token required to commit files. Set your token via updateStudentProfile({ githubToken: '...' }) or provide 'token' parameter."
    );
  }

  const cleanPath = params.path.replace(/^\/+/, "");
  let sha = params.sha;

  // If SHA was not provided, check if the file already exists to obtain current SHA
  if (!sha) {
    try {
      let checkUrl = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}`;
      if (params.branch) {
        checkUrl += `?ref=${encodeURIComponent(params.branch)}`;
      }
      const existing = await githubFetch<GitHubFileMetadata>(checkUrl, { token });
      if (existing.data && !Array.isArray(existing.data) && existing.data.sha) {
        sha = existing.data.sha;
      }
    } catch {
      // 404 means the file does not exist yet; proceed without sha
    }
  }

  const payload: Record<string, unknown> = {
    message: params.message,
    content: utf8ToBase64(params.content),
  };
  if (params.branch) {
    payload.branch = params.branch;
  }
  if (sha) {
    payload.sha = sha;
  }

  const res = await githubFetch<GitHubCommitResult>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}`,
    {
      method: "PUT",
      token,
      body: payload,
    }
  );
  return res.data;
}

/**
 * 4. githubCreatePullRequest: Create a Pull Request against a target branch.
 */
export async function githubCreatePullRequest(params: {
  owner?: string;
  repo?: string;
  title: string;
  body?: string;
  head: string;
  base?: string;
  token?: string;
  userDefaultRepo?: string | null;
}): Promise<GitHubPullRequestResult> {
  const { owner, repo } = resolveRepo(params.owner, params.repo, params.userDefaultRepo);
  const token = resolveToken(params.token);
  if (!token) {
    throw new Error(
      "GitHub authentication token required to create a pull request. Set your token via updateStudentProfile({ githubToken: '...' })."
    );
  }

  let baseBranch = params.base;
  if (!baseBranch) {
    const repoInfo = await githubGetRepo({ owner, repo, token });
    baseBranch = repoInfo.default_branch || "main";
  }

  const payload = {
    title: params.title,
    body: params.body || "",
    head: params.head,
    base: baseBranch,
  };

  const res = await githubFetch<GitHubPullRequestResult>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`,
    {
      method: "POST",
      token,
      body: payload,
    }
  );
  return res.data;
}

/**
 * 5. githubPushGadget: Export all files of a Gadget and commit them to the repository.
 * Uses atomic Git Data Trees API for a single clean commit when possible, with graceful fallback.
 */
export async function githubPushGadget(params: {
  owner?: string;
  repo?: string;
  files: Map<string, string> | Record<string, string>;
  targetDir?: string;
  branch?: string;
  commitMessage?: string;
  token?: string;
  userDefaultRepo?: string | null;
}): Promise<GitHubPushGadgetResult> {
  const { owner, repo } = resolveRepo(params.owner, params.repo, params.userDefaultRepo);
  const token = resolveToken(params.token);
  if (!token) {
    throw new Error(
      "GitHub authentication token required to push gadget files. Set your token via updateStudentProfile({ githubToken: '...' })."
    );
  }

  // Normalize file map
  const fileEntries: Array<[string, string]> =
    params.files instanceof Map ? [...params.files.entries()] : Object.entries(params.files);

  if (fileEntries.length === 0) {
    throw new Error("Cannot push gadget: No files found in workpiece.");
  }

  // Determine branch: provided or default
  let branchName = params.branch;
  if (!branchName) {
    const repoMeta = await githubGetRepo({ owner, repo, token });
    branchName = repoMeta.default_branch || "main";
  }

  const cleanTargetDir = (params.targetDir || "").replace(/^\/+|\/+$/g, "");
  const commitMsg =
    params.commitMessage ||
    `Export Gadget from Voltrix OS (${fileEntries.length} files)${cleanTargetDir ? ` to /${cleanTargetDir}` : ""}`;

  // Attempt Atomic Git Data API (Tree + Commit + Ref update)
  try {
    // 1. Get branch head reference
    const refRes = await githubFetch<{ object: { sha: string } }>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodeURIComponent(branchName)}`,
      { token }
    );
    const parentCommitSha = refRes.data.object.sha;

    // 2. Get commit's tree SHA
    const parentCommitRes = await githubFetch<{ tree: { sha: string } }>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits/${parentCommitSha}`,
      { token }
    );
    const baseTreeSha = parentCommitRes.data.tree.sha;

    // 3. Build tree objects
    const treeItems = fileEntries.map(([filename, content]) => {
      const filePath = cleanTargetDir ? `${cleanTargetDir}/${filename}` : filename;
      return {
        path: filePath,
        mode: "100644" as const,
        type: "blob" as const,
        content,
      };
    });

    // 4. Create new tree
    const treeRes = await githubFetch<{ sha: string }>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees`,
      {
        method: "POST",
        token,
        body: {
          base_tree: baseTreeSha,
          tree: treeItems,
        },
      }
    );
    const newTreeSha = treeRes.data.sha;

    // 5. Create new commit
    const newCommitRes = await githubFetch<{ sha: string; html_url: string }>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits`,
      {
        method: "POST",
        token,
        body: {
          message: commitMsg,
          tree: newTreeSha,
          parents: [parentCommitSha],
        },
      }
    );
    const newCommitSha = newCommitRes.data.sha;

    // 6. Update branch ref
    await githubFetch(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs/heads/${encodeURIComponent(branchName)}`,
      {
        method: "PATCH",
        token,
        body: {
          sha: newCommitSha,
          force: false,
        },
      }
    );

    return {
      success: true,
      repo: `${owner}/${repo}`,
      owner,
      branch: branchName,
      commitSha: newCommitSha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
      filesCommitted: fileEntries.map(([f]) => (cleanTargetDir ? `${cleanTargetDir}/${f}` : f)),
      totalFiles: fileEntries.length,
      mode: "git-tree",
      targetDir: cleanTargetDir || undefined,
    };
  } catch (treeError) {
    // Fallback: If repo is brand new / empty or git ref update fails, commit files sequentially
    const committedFiles: string[] = [];
    let lastCommitSha = "";
    let lastCommitUrl = "";

    for (const [filename, content] of fileEntries) {
      const filePath = cleanTargetDir ? `${cleanTargetDir}/${filename}` : filename;
      const res = await githubCommitFile({
        owner,
        repo,
        path: filePath,
        content,
        message: `${commitMsg} — [${filename}]`,
        branch: branchName,
        token,
      });
      committedFiles.push(filePath);
      lastCommitSha = res.commit.sha;
      lastCommitUrl = res.commit.html_url;
    }

    return {
      success: true,
      repo: `${owner}/${repo}`,
      owner,
      branch: branchName,
      commitSha: lastCommitSha,
      commitUrl: lastCommitUrl,
      filesCommitted: committedFiles,
      totalFiles: committedFiles.length,
      mode: "contents-api",
      targetDir: cleanTargetDir || undefined,
    };
  }
}

// ============================================================================
// Schemas & Agent Tool Factory for agent.ts
// ============================================================================

export interface GitHubToolContext {
  hooks: AgentHooks;
  chatId: number;
  resolveToolWorkpieceId: (workpiece?: string) => WorkpieceId | undefined;
  getSessionYDoc: () => Y.Doc;
  toolResult: (text: string, notes?: Partial<AiToolCall>) => { content: Array<{ type: "text"; text: string }>; details: Partial<AiToolCall> };
  toolCallNotes: Map<string, Partial<AiToolCall>>;
  toolErrorText: (error: unknown) => string;
}

export function defineGitHubTools(ctx: GitHubToolContext): Record<string, AgentTool> {
  const { hooks, chatId, resolveToolWorkpieceId, getSessionYDoc, toolResult, toolCallNotes, toolErrorText } = ctx;

  const resolveActiveTokenAndDefaultRepo = async () => {
    let token: string | null = null;
    let defaultRepo: string | null = null;

    if (hooks.getGitHubAccessToken) {
      token = await hooks.getGitHubAccessToken();
    }
    if (hooks.getGitHubDefaultRepo) {
      defaultRepo = await hooks.getGitHubDefaultRepo();
    }
    if (!token || !defaultRepo) {
      if (hooks.getUserAccountIdentity) {
        const id = await hooks.getUserAccountIdentity();
        if (!token && id?.studentProfile?.githubToken) {
          token = id.studentProfile.githubToken;
        }
        if (!defaultRepo && id?.studentProfile?.githubDefaultRepo) {
          defaultRepo = id.studentProfile.githubDefaultRepo;
        }
      }
    }
    return { token, defaultRepo };
  };

  return {
    githubGetRepo: defineTool({
      name: "githubGetRepo",
      label: "Get GitHub repository metadata",
      description:
        "Fetches repository metadata, description, default branch, visibility, and statistics. " +
        "Supports hybrid mode: if owner/repo are omitted, automatically queries the user's default repository or platform sandbox (hex5561-arch/voltrix-sandbox).",
      parameters: Type.Object({
        owner: Type.Optional(Type.String({ description: "Repository owner or organization name. Omit for user default/sandbox." })),
        repo: Type.Optional(Type.String({ description: "Repository name or 'owner/repo'. Omit for user default/sandbox." })),
        token: Type.Optional(Type.String({ description: "Optional GitHub Personal Access Token override." })),
      }),
      execute: async (toolCallId, { owner, repo, token: explicitToken }) => {
        try {
          const { token: contextToken, defaultRepo } = await resolveActiveTokenAndDefaultRepo();
          const token = explicitToken || contextToken || undefined;
          const metadata = await githubGetRepo({ owner, repo, token, userDefaultRepo: defaultRepo });

          const isSandbox =
            metadata.full_name.toLowerCase() === `${DEFAULT_SANDBOX_OWNER}/${DEFAULT_SANDBOX_REPO}`.toLowerCase();

          const formatted =
            `📦 **GitHub Repository Metadata: [${metadata.full_name}](${metadata.html_url})**\n\n` +
            `• **Repository:** \`${metadata.full_name}\` ${isSandbox ? "🧪 *(Platform Sandbox)*" : ""}\n` +
            `• **Default Branch:** \`${metadata.default_branch}\`\n` +
            `• **Visibility:** ${metadata.private ? "🔒 Private" : "🌐 Public"}\n` +
            `• **Description:** ${metadata.description || "*(No description provided)*"}\n` +
            `• **Stats:** ⭐ ${metadata.stargazers_count} stars | 🍴 ${metadata.forks_count} forks | ⚠️ ${metadata.open_issues_count} open issues\n` +
            `• **Last Updated:** ${new Date(metadata.updated_at).toLocaleString()}`;

          return toolResult(formatted, { output: formatted, metadata } as Partial<AiToolCall>);
        } catch (error) {
          toolCallNotes.set(toolCallId, { error: toolErrorText(error) });
          throw error;
        }
      },
    }),

    githubReadFile: defineTool({
      name: "githubReadFile",
      label: "Read file from GitHub repository",
      description:
        "Reads file contents or lists directory entries from a GitHub repository with UTF-8 base64 decoding. " +
        "Supports hybrid mode: if owner/repo are omitted, uses user's default repo or sandbox (hex5561-arch/voltrix-sandbox).",
      parameters: Type.Object({
        path: Type.String({ description: "File or directory path in the repository (e.g. 'README.md', 'src/index.ts')." }),
        owner: Type.Optional(Type.String({ description: "Repository owner. Omit for user default/sandbox." })),
        repo: Type.Optional(Type.String({ description: "Repository name or 'owner/repo'. Omit for user default/sandbox." })),
        branch: Type.Optional(Type.String({ description: "Branch or commit ref. Defaults to repository's default branch." })),
        token: Type.Optional(Type.String({ description: "Optional GitHub Personal Access Token override." })),
      }),
      execute: async (toolCallId, { path, owner, repo, branch, token: explicitToken }) => {
        try {
          const { token: contextToken, defaultRepo } = await resolveActiveTokenAndDefaultRepo();
          const token = explicitToken || contextToken || undefined;
          const res = await githubReadFile({ owner, repo, path, branch, token, userDefaultRepo: defaultRepo });

          if (res.isDirectory) {
            const formatted =
              `📁 **GitHub Directory Listing: \`${res.path}\`**\n\n` +
              `${res.content}\n\n` +
              `[View Directory on GitHub](${res.html_url})`;
            return toolResult(formatted, { output: formatted, path: res.path, isDirectory: true } as Partial<AiToolCall>);
          }

          const formatted =
            `📄 **GitHub File: [\`${res.path}\`](${res.html_url})** (${res.size} bytes, SHA: \`${res.sha.slice(0, 7)}\`)\n\n` +
            `\`\`\`\n${res.content}\n\`\`\``;

          return toolResult(formatted, { output: res.content, sha: res.sha, path: res.path } as Partial<AiToolCall>);
        } catch (error) {
          toolCallNotes.set(toolCallId, { error: toolErrorText(error) });
          throw error;
        }
      },
    }),

    githubCommitFile: defineTool({
      name: "githubCommitFile",
      label: "Create or update file on GitHub",
      description:
        "Commits (creates or updates) a file in a GitHub repository using pure fetch. " +
        "Automatically detects and supplies current file SHA when modifying existing files. " +
        "Supports hybrid mode: defaults to user repo or platform sandbox.",
      parameters: Type.Object({
        path: Type.String({ description: "Path where the file should be committed (e.g. 'src/App.tsx')." }),
        content: Type.String({ description: "UTF-8 content of the file." }),
        message: Type.String({ description: "Git commit message." }),
        owner: Type.Optional(Type.String({ description: "Repository owner. Omit for user default/sandbox." })),
        repo: Type.Optional(Type.String({ description: "Repository name. Omit for user default/sandbox." })),
        branch: Type.Optional(Type.String({ description: "Target branch name. Defaults to repo default branch." })),
        sha: Type.Optional(Type.String({ description: "Blob SHA if updating existing file. If omitted, auto-discovered." })),
        token: Type.Optional(Type.String({ description: "Optional GitHub Personal Access Token override." })),
      }),
      execute: async (toolCallId, { path, content, message, owner, repo, branch, sha, token: explicitToken }) => {
        try {
          const { token: contextToken, defaultRepo } = await resolveActiveTokenAndDefaultRepo();
          const token = explicitToken || contextToken || undefined;
          const res = await githubCommitFile({
            owner,
            repo,
            path,
            content,
            message,
            branch,
            sha,
            token,
            userDefaultRepo: defaultRepo,
          });

          const formatted =
            `✅ **File Committed Successfully to GitHub!**\n\n` +
            `• **File Path:** \`${path}\`\n` +
            `• **Commit Message:** "${message}"\n` +
            `• **Commit SHA:** \`${res.commit.sha.slice(0, 7)}\`\n` +
            `• **Commit Link:** [View Commit on GitHub](${res.commit.html_url})\n` +
            (res.content ? `• **File Link:** [View File on GitHub](${res.content.html_url})\n` : "");

          return toolResult(formatted, { output: formatted, commitSha: res.commit.sha } as Partial<AiToolCall>);
        } catch (error) {
          toolCallNotes.set(toolCallId, { error: toolErrorText(error) });
          throw error;
        }
      },
    }),

    githubCreatePullRequest: defineTool({
      name: "githubCreatePullRequest",
      label: "Create GitHub Pull Request",
      description:
        "Opens a Pull Request in the target repository from head branch to base branch. " +
        "If base branch is omitted, automatically uses the repository's default branch. " +
        "Supports hybrid mode: defaults to user repo or platform sandbox.",
      parameters: Type.Object({
        title: Type.String({ description: "Pull request title." }),
        head: Type.String({ description: "The name of the branch where your changes are implemented." }),
        body: Type.Optional(Type.String({ description: "Detailed description / markdown body for the pull request." })),
        base: Type.Optional(Type.String({ description: "The name of the branch you want changes pulled into (defaults to repository default branch)." })),
        owner: Type.Optional(Type.String({ description: "Repository owner. Omit for user default/sandbox." })),
        repo: Type.Optional(Type.String({ description: "Repository name. Omit for user default/sandbox." })),
        token: Type.Optional(Type.String({ description: "Optional GitHub Personal Access Token override." })),
      }),
      execute: async (toolCallId, { title, head, body, base, owner, repo, token: explicitToken }) => {
        try {
          const { token: contextToken, defaultRepo } = await resolveActiveTokenAndDefaultRepo();
          const token = explicitToken || contextToken || undefined;
          const pr = await githubCreatePullRequest({
            title,
            head,
            body,
            base,
            owner,
            repo,
            token,
            userDefaultRepo: defaultRepo,
          });

          const formatted =
            `🎉 **Pull Request Created Successfully!**\n\n` +
            `• **PR #${pr.number}:** [${pr.title}](${pr.html_url})\n` +
            `• **Status:** ${pr.state.toUpperCase()}\n` +
            `• **Branches:** \`${pr.head.ref}\` ➔ \`${pr.base.ref}\`\n` +
            `• **URL:** ${pr.html_url}\n\n` +
            (pr.body ? `**Description:**\n> ${pr.body.split("\n").join("\n> ")}\n` : "");

          return toolResult(formatted, { output: formatted, prNumber: pr.number, prUrl: pr.html_url } as Partial<AiToolCall>);
        } catch (error) {
          toolCallNotes.set(toolCallId, { error: toolErrorText(error) });
          throw error;
        }
      },
    }),

    githubPushGadget: defineTool({
      name: "githubPushGadget",
      label: "Push all Gadget files to GitHub repository",
      description:
        "Exports all files of a Gadget directly from the active session Y.Doc and commits them into the repository. " +
        "Uses atomic Git Data API tree commits for single clean commits. " +
        "Supports hybrid mode: if owner/repo are omitted, commits to user's default repo or platform sandbox (hex5561-arch/voltrix-sandbox).",
      parameters: Type.Object({
        workpiece: Type.Optional(Type.String({ description: "Binding name of the gadget (e.g. env.my_gadget). Defaults to workspace default gadget." })),
        targetDir: Type.Optional(Type.String({ description: "Subdirectory path in the repo to commit files into (e.g. 'src/gadget', 'packages/calculator'). Omit for repo root." })),
        branch: Type.Optional(Type.String({ description: "Target branch name. Defaults to repository default branch." })),
        commitMessage: Type.Optional(Type.String({ description: "Custom commit message. Defaults to automated descriptive message." })),
        owner: Type.Optional(Type.String({ description: "Repository owner. Omit for user default/sandbox." })),
        repo: Type.Optional(Type.String({ description: "Repository name. Omit for user default/sandbox." })),
        token: Type.Optional(Type.String({ description: "Optional GitHub Personal Access Token override." })),
      }),
      execute: async (toolCallId, { workpiece, targetDir, branch, commitMessage, owner, repo, token: explicitToken }) => {
        try {
          const resolved = hooks.resolveWorkpieceRoot(resolveToolWorkpieceId(workpiece), true, chatId);
          const ydoc = getSessionYDoc();
          const fileMap = ydoc.getMap<Y.Text>(resolved.rootName);

          const files = new Map<string, string>();
          for (const [filename, ytext] of fileMap.entries()) {
            files.set(filename, ytext.toString());
          }

          if (files.size === 0) {
            throw new Error(`Gadget "${workpiece || "default"}" contains no files to push.`);
          }

          const { token: contextToken, defaultRepo } = await resolveActiveTokenAndDefaultRepo();
          const token = explicitToken || contextToken || undefined;

          const res = await githubPushGadget({
            owner,
            repo,
            files,
            targetDir,
            branch,
            commitMessage,
            token,
            userDefaultRepo: defaultRepo,
          });

          const formatted =
            `🚀 **Gadget Exported and Pushed to GitHub Successfully!**\n\n` +
            `• **Repository:** [${res.repo}](https://github.com/${res.repo})\n` +
            `• **Branch:** \`${res.branch}\`\n` +
            `• **Target Directory:** \`${res.targetDir ? `/${res.targetDir}` : "/ (Repository Root)"}\`\n` +
            `• **Commit Mode:** \`${res.mode}\`\n` +
            `• **Commit SHA:** [\`${res.commitSha.slice(0, 7)}\`](${res.commitUrl})\n` +
            `• **Files Committed (${res.totalFiles}):**\n` +
            res.filesCommitted.map(f => `  - \`${f}\``).join("\n") + "\n\n" +
            `[View Changes on GitHub](${res.commitUrl})`;

          return toolResult(formatted, {
            output: formatted,
            commitSha: res.commitSha,
            commitUrl: res.commitUrl,
            filesCount: res.totalFiles,
            repo: res.repo,
          } as Partial<AiToolCall>);
        } catch (error) {
          toolCallNotes.set(toolCallId, { error: toolErrorText(error) });
          throw error;
        }
      },
    }),
  };
}
