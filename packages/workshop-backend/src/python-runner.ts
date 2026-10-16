/**
 * python-runner.ts
 * ────────────────
 * Scientific Python Execution Engine for Voltrix OS.
 * Supports SymPy, NumPy, SciPy, Pandas, and Matplotlib.
 *
 * Execution modes:
 *  1. Direct Subprocess (Host / Vitest / Node.js)
 *  2. HTTP Runner Service (/run on local port 8788 / 9190)
 *  3. Edge Queue in Cloudflare R2 (python-jobs/{id}.json)
 */

export interface PythonPlot {
  filename: string;
  path?: string;
  url?: string;
  base64?: string;
  size?: number;
}

export interface PythonRunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  result: string | null;
  latex: string | null;
  plots: PythonPlot[];
  executionTimeMs?: number;
  error?: string;
}

export interface RunPythonParams {
  code: string;
  timeoutMs?: number;
  runnerUrl?: string;
  bucket?: R2Bucket | null;
  mode?: "auto" | "http" | "direct" | "queue";
  userId?: string;
}

export interface PythonJob {
  id: string;
  code: string;
  status: "queued" | "running" | "ready" | "failed";
  createdAt: string;
  updatedAt: string;
  timeoutMs?: number;
  result?: PythonRunResult;
  error?: string;
  userId?: string;
}

const JOBS_PREFIX = "python-jobs/";
const PENDING_INDEX_KEY = "python-jobs/_index/pending.json";
const RECENT_INDEX_KEY = "python-jobs/_index/recent.json";

// ─────────────────────────────────────────────────────────────────────────────
// R2 Queue Pipeline (Mirrors hf-jobs.ts)
// ─────────────────────────────────────────────────────────────────────────────

export async function createPythonJob(
  bucket: R2Bucket,
  params: { code: string; timeoutMs?: number; userId?: string }
): Promise<PythonJob> {
  const jobId = `py-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const job: PythonJob = {
    id: jobId,
    code: params.code,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    timeoutMs: params.timeoutMs || 10000,
    userId: params.userId || "anonymous",
  };

  // 1. Save job record
  await bucket.put(`${JOBS_PREFIX}${jobId}.json`, JSON.stringify(job, null, 2), {
    httpMetadata: { contentType: "application/json" },
  });

  // 2. Add to pending index
  try {
    const pendingObj = await bucket.get(PENDING_INDEX_KEY);
    let pendingList: string[] = [];
    if (pendingObj) {
      pendingList = (await pendingObj.json()) as string[];
    }
    if (!pendingList.includes(jobId)) {
      pendingList.push(jobId);
    }
    await bucket.put(PENDING_INDEX_KEY, JSON.stringify(pendingList), {
      httpMetadata: { contentType: "application/json" },
    });
  } catch (err) {
    console.warn("[PythonRunner] Failed to update pending index:", err);
  }

  // 3. Add to recent index
  try {
    const recentObj = await bucket.get(RECENT_INDEX_KEY);
    let recentList: string[] = [];
    if (recentObj) {
      recentList = (await recentObj.json()) as string[];
    }
    recentList = [jobId, ...recentList.filter((id) => id !== jobId)].slice(0, 50);
    await bucket.put(RECENT_INDEX_KEY, JSON.stringify(recentList), {
      httpMetadata: { contentType: "application/json" },
    });
  } catch (err) {
    console.warn("[PythonRunner] Failed to update recent index:", err);
  }

  return job;
}

export async function getPythonJob(
  bucket: R2Bucket,
  jobId: string
): Promise<PythonJob | null> {
  const obj = await bucket.get(`${JOBS_PREFIX}${jobId}.json`);
  if (!obj) return null;
  return (await obj.json()) as PythonJob;
}

export async function updatePythonJob(
  bucket: R2Bucket,
  jobId: string,
  update: Partial<PythonJob>
): Promise<PythonJob | null> {
  const existing = await getPythonJob(bucket, jobId);
  if (!existing) return null;

  const updated: PythonJob = {
    ...existing,
    ...update,
    updatedAt: new Date().toISOString(),
  };

  if (update.status === "ready" || update.status === "failed") {
    try {
      const pendingObj = await bucket.get(PENDING_INDEX_KEY);
      if (pendingObj) {
        const pendingList = (await pendingObj.json()) as string[];
        const filtered = pendingList.filter((id) => id !== jobId);
        await bucket.put(PENDING_INDEX_KEY, JSON.stringify(filtered), {
          httpMetadata: { contentType: "application/json" },
        });
      }
    } catch (err) {
      console.warn("[PythonRunner] Failed to pop from pending index:", err);
    }
  }

  await bucket.put(`${JOBS_PREFIX}${jobId}.json`, JSON.stringify(updated, null, 2), {
    httpMetadata: { contentType: "application/json" },
  });

  return updated;
}

export async function pollPendingPythonJobs(bucket: R2Bucket): Promise<PythonJob[]> {
  const pendingObj = await bucket.get(PENDING_INDEX_KEY);
  if (!pendingObj) return [];

  const jobIds = (await pendingObj.json()) as string[];
  const jobs: PythonJob[] = [];

  for (const id of jobIds.slice(0, 10)) {
    const job = await getPythonJob(bucket, id);
    if (job) jobs.push(job);
  }

  return jobs;
}

export async function listRecentPythonJobs(
  bucket: R2Bucket,
  limit = 10
): Promise<PythonJob[]> {
  const recentObj = await bucket.get(RECENT_INDEX_KEY);
  if (!recentObj) return [];

  const jobIds = (await recentObj.json()) as string[];
  const jobs: PythonJob[] = [];

  for (const id of jobIds.slice(0, limit)) {
    const job = await getPythonJob(bucket, id);
    if (job) jobs.push(job);
  }

  return jobs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct Subprocess Execution (Host / Node.js / Vitest)
// ─────────────────────────────────────────────────────────────────────────────

export async function runPythonDirect(
  code: string,
  timeoutMs = 10000
): Promise<PythonRunResult> {
  const startTime = Date.now();
  if (
    typeof (globalThis as any).WebSocketPair !== "undefined" ||
    typeof (globalThis as any).caches?.default !== "undefined" ||
    (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers")
  ) {
    return {
      success: false,
      stdout: "",
      stderr: "Direct execution requires Node.js host environment. Use HTTP runner or R2 queue.",
      result: null,
      latex: null,
      plots: [],
      executionTimeMs: 0,
    };
  }

  try {
    const cp = await import("node:child_process");
    const fs = await import("node:fs");

    const pythonBin =
      process.env.PYTHON_BIN ||
      (fs.existsSync("/home/voltrix/.venv/bin/python3")
        ? "/home/voltrix/.venv/bin/python3"
        : "python3");

    const runnerScript =
      process.env.PY_RUNNER_SCRIPT || "/home/voltrix/scripts/py-runner.py";

    return await new Promise<PythonRunResult>((resolve) => {
      const payload = JSON.stringify({ code, timeoutMs });
      const proc = cp.spawn(pythonBin, [runnerScript], {
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
        },
      });

      let stdout = "";
      let stderr = "";
      let finished = false;

      const timer = setTimeout(() => {
        finished = true;
        proc.kill("SIGKILL");
        resolve({
          success: false,
          stdout,
          stderr: `Execution timed out after ${timeoutMs}ms.`,
          result: null,
          latex: null,
          plots: [],
          executionTimeMs: Date.now() - startTime,
        });
      }, timeoutMs + 1000);

      proc.stdout.on("data", (d) => {
        stdout += d.toString();
      });

      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });

      proc.on("close", () => {
        clearTimeout(timer);
        if (finished) return;

        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch (err) {
          resolve({
            success: false,
            stdout,
            stderr: (stderr + "\n" + (err instanceof Error ? err.message : String(err))).trim(),
            result: null,
            latex: null,
            plots: [],
            executionTimeMs: Date.now() - startTime,
          });
        }
      });

      proc.on("error", (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          stdout,
          stderr: `Failed to spawn Python process: ${err.message}`,
          result: null,
          latex: null,
          plots: [],
          executionTimeMs: Date.now() - startTime,
        });
      });

      proc.stdin.write(payload);
      proc.stdin.end();
    });
  } catch (e) {
    return {
      success: false,
      stdout: "",
      stderr: `Direct execution unavailable in this environment: ${e instanceof Error ? e.message : String(e)}`,
      result: null,
      latex: null,
      plots: [],
      executionTimeMs: Date.now() - startTime,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Execution Mode
// ─────────────────────────────────────────────────────────────────────────────

export async function runPythonHttp(
  runnerUrl: string,
  code: string,
  timeoutMs = 10000
): Promise<PythonRunResult> {
  const startTime = Date.now();
  const endpoint = runnerUrl.endsWith("/run") ? runnerUrl : `${runnerUrl.replace(/\/+$/, "")}/run`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs + 2000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, timeoutMs }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        stdout: "",
        stderr: `Runner HTTP error (${res.status}): ${errText}`,
        result: null,
        latex: null,
        plots: [],
        executionTimeMs: Date.now() - startTime,
      };
    }

    const data = (await res.json()) as PythonRunResult;
    return data;
  } catch (err) {
    clearTimeout(timer);
    return {
      success: false,
      stdout: "",
      stderr: `Failed to reach Python runner service at ${endpoint}: ${err instanceof Error ? err.message : String(err)}`,
      result: null,
      latex: null,
      plots: [],
      executionTimeMs: Date.now() - startTime,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Master Unified runPython Dispatcher
// ─────────────────────────────────────────────────────────────────────────────

export async function runPython(params: RunPythonParams): Promise<PythonRunResult> {
  const { code, timeoutMs = 10000, runnerUrl, bucket, mode = "auto", userId } = params;

  if (mode === "direct") {
    return runPythonDirect(code, timeoutMs);
  }

  if (mode === "http") {
    const targetUrl = runnerUrl || process.env.PY_RUNNER_URL || "http://127.0.0.1:8788";
    return runPythonHttp(targetUrl, code, timeoutMs);
  }

  if (mode === "queue") {
    if (!bucket) {
      throw new Error("R2 bucket is required for queue mode execution.");
    }
    const job = await createPythonJob(bucket, { code, timeoutMs, userId });
    return {
      success: true,
      stdout: `Job queued for host execution (Job ID: ${job.id})`,
      stderr: "",
      result: `queued:${job.id}`,
      latex: null,
      plots: [],
    };
  }

  // mode === "auto"
  // 1. If explicit runnerUrl or PY_RUNNER_URL is given, try HTTP first
  const preferredUrl = runnerUrl || (typeof process !== "undefined" ? process.env?.PY_RUNNER_URL : undefined);
  if (preferredUrl) {
    try {
      const res = await runPythonHttp(preferredUrl, code, timeoutMs);
      if (res.success || !res.stderr.includes("Failed to reach Python runner service")) {
        return res;
      }
    } catch {
      // Fall through to next option
    }
  }

  const isWorkerd =
    typeof (globalThis as any).WebSocketPair !== "undefined" ||
    typeof (globalThis as any).caches?.default !== "undefined" ||
    (typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers");

  // 2. If in native Node.js host environment (not workerd), try direct execution
  if (!isWorkerd && typeof process !== "undefined" && process.versions?.node) {
    try {
      const res = await runPythonDirect(code, timeoutMs);
      if (res.success || !res.stderr.includes("Direct execution unavailable")) {
        return res;
      }
    } catch {
      // Fall through to queue
    }
  }

  // 3. Fallback to default local runner if reachable
  try {
    const localRes = await runPythonHttp("http://127.0.0.1:8788", code, timeoutMs);
    if (localRes.success || !localRes.stderr.includes("Failed to reach Python runner service")) {
      return localRes;
    }
  } catch {
    // Continue
  }

  // 4. Edge worker fallback: enqueue into R2
  if (bucket) {
    const job = await createPythonJob(bucket, { code, timeoutMs, userId });
    return {
      success: true,
      stdout: `Job queued in R2 for background daemon execution (Job ID: ${job.id})`,
      stderr: "",
      result: `queued:${job.id}`,
      latex: null,
      plots: [],
    };
  }

  return {
    success: false,
    stdout: "",
    stderr: "No Python runner service reachable and no storage bucket available for queuing.",
    result: null,
    latex: null,
    plots: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatter for AI Agent and User UI
// ─────────────────────────────────────────────────────────────────────────────

export function formatPythonRunOutput(res: PythonRunResult): string {
  let output = `🐍 **Scientific Python Execution Output**\n\n`;

  if (res.stdout && res.stdout.trim()) {
    output += `**Standard Output:**\n\`\`\`\n${res.stdout.trim()}\n\`\`\`\n\n`;
  }

  if (res.result !== null && res.result !== undefined && res.result !== "") {
    output += `**Evaluated Result:**\n\`\`\`python\n${res.result}\n\`\`\`\n\n`;
  }

  if (res.latex && res.latex.trim()) {
    output += `**LaTeX Representation:**\n$$\n${res.latex}\n$$\n\n`;
  }

  if (res.plots && res.plots.length > 0) {
    output += `**Generated Visualizations (${res.plots.length}):**\n\n`;
    for (const plot of res.plots) {
      const imgSrc = plot.url || (plot.base64 ? `data:image/png;base64,${plot.base64}` : "");
      if (imgSrc) {
        output += `![${plot.filename}](${imgSrc})\n`;
      }
      output += `*Figure: \`${plot.filename}\`*\n\n`;
    }
  }

  if (!res.success) {
    output += `⚠️ **Execution Error / Traceback:**\n\`\`\`\n${res.stderr || res.error || "Unknown error"}\n\`\`\`\n\n`;
  } else if (res.stderr && res.stderr.trim()) {
    output += `**Standard Error:**\n\`\`\`\n${res.stderr.trim()}\n\`\`\`\n\n`;
  }

  if (res.executionTimeMs !== undefined) {
    output += `*Executed in ${res.executionTimeMs}ms*\n`;
  }

  return output.trim();
}
