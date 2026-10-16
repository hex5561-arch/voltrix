import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runPythonDirect,
  runPythonHttp,
  runPython,
  createPythonJob,
  getPythonJob,
  updatePythonJob,
  pollPendingPythonJobs,
  listRecentPythonJobs,
  formatPythonRunOutput,
  type PythonRunResult,
} from "../src/python-runner.js";

function createMockR2Bucket(): R2Bucket {
  const store = new Map<string, { body: string; metadata?: any }>();
  return {
    async put(key: string, value: any, options?: any) {
      const body = typeof value === "string" ? value : JSON.stringify(value);
      store.set(key, { body, metadata: options?.httpMetadata });
      return { key };
    },
    async get(key: string) {
      const item = store.get(key);
      if (!item) return null;
      return {
        key,
        text: async () => item.body,
        json: async () => JSON.parse(item.body),
      };
    },
    async delete(key: string) {
      store.delete(key);
    },
  } as unknown as R2Bucket;
}

describe("Voltrix Scientific Python Execution Engine", () => {
  describe("Subprocess Guard in Edge Worker Isolation", () => {
    it("safely guards direct execution inside workerd", async () => {
      const res = await runPythonDirect("print('isolated')", 5000);
      expect(res.success).toBe(false);
      expect(res.stderr).toContain("Direct execution requires Node.js host environment");
    });
  });

  describe("Output Formatter (formatPythonRunOutput)", () => {
    it("formats complete execution output with Markdown, LaTeX, and plot embeds", () => {
      const mockResult: PythonRunResult = {
        success: true,
        stdout: "Computed 5 eigenvalues.\n",
        stderr: "",
        result: "[2.5, 1.2, 0.8, -0.4, -1.9]",
        latex: "\\lambda_1 = 2.5, \\quad \\lambda_2 = 1.2",
        plots: [
          {
            filename: "plot_spectral.png",
            url: "https://voltrix.stream/api/hf-videos/plot_spectral.png",
            base64: "AAAA",
          },
        ],
        executionTimeMs: 45,
      };

      const formatted = formatPythonRunOutput(mockResult);

      expect(formatted).toContain("🐍 **Scientific Python Execution Output**");
      expect(formatted).toContain("**Standard Output:**");
      expect(formatted).toContain("Computed 5 eigenvalues.");
      expect(formatted).toContain("**Evaluated Result:**");
      expect(formatted).toContain("[2.5, 1.2, 0.8, -0.4, -1.9]");
      expect(formatted).toContain("**LaTeX Representation:**");
      expect(formatted).toContain("$$\n\\lambda_1 = 2.5, \\quad \\lambda_2 = 1.2\n$$");
      expect(formatted).toContain("![plot_spectral.png](https://voltrix.stream/api/hf-videos/plot_spectral.png)");
      expect(formatted).toContain("*Figure: `plot_spectral.png`*");
      expect(formatted).toContain("*Executed in 45ms*");
    });

    it("formats error outputs with alert formatting", () => {
      const mockError: PythonRunResult = {
        success: false,
        stdout: "",
        stderr: "IndexError: list index out of range",
        result: null,
        latex: null,
        plots: [],
      };

      const formatted = formatPythonRunOutput(mockError);
      expect(formatted).toContain("⚠️ **Execution Error / Traceback:**");
      expect(formatted).toContain("IndexError: list index out of range");
    });
  });

  describe("HTTP Runner Service Integration (runPythonHttp)", () => {
    it("posts payload to runner endpoint and parses response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stdout: "HTTP Run OK\n",
          stderr: "",
          result: "100",
          latex: "100",
          plots: [],
          executionTimeMs: 12,
        }),
      });
      globalThis.fetch = mockFetch;

      const res = await runPythonHttp("http://127.0.0.1:8788/run", "10**2", 5000);
      expect(res.success).toBe(true);
      expect(res.result).toBe("100");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:8788/run",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "10**2", timeoutMs: 5000 }),
        })
      );
    });

    it("handles HTTP errors gracefully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      const res = await runPythonHttp("http://127.0.0.1:8788/run", "x", 5000);
      expect(res.success).toBe(false);
      expect(res.stderr).toContain("Runner HTTP error (500)");
    });
  });

  describe("Cloudflare R2 Queue Pipeline (python-jobs)", () => {
    let bucket: R2Bucket;

    beforeEach(() => {
      bucket = createMockR2Bucket();
    });

    it("creates, retrieves, and updates python jobs in R2", async () => {
      const job = await createPythonJob(bucket, {
        code: "import sympy as sp; sp.pi.evalf()",
        timeoutMs: 10000,
        userId: "scholar-42",
      });

      expect(job.id).toMatch(/^py-/);
      expect(job.status).toBe("queued");
      expect(job.userId).toBe("scholar-42");

      const fetched = await getPythonJob(bucket, job.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.code).toContain("sp.pi.evalf()");

      const pending = await pollPendingPythonJobs(bucket);
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe(job.id);

      // Update to running
      await updatePythonJob(bucket, job.id, { status: "running" });
      const runningJob = await getPythonJob(bucket, job.id);
      expect(runningJob!.status).toBe("running");

      // Update to ready with result
      const mockResult: PythonRunResult = {
        success: true,
        stdout: "",
        stderr: "",
        result: "3.14159265358979",
        latex: "3.14159265358979",
        plots: [],
        executionTimeMs: 25,
      };

      await updatePythonJob(bucket, job.id, {
        status: "ready",
        result: mockResult,
      });

      const completed = await getPythonJob(bucket, job.id);
      expect(completed!.status).toBe("ready");
      expect(completed!.result?.result).toContain("3.14159");

      // Verify removed from pending
      const pendingAfter = await pollPendingPythonJobs(bucket);
      expect(pendingAfter.length).toBe(0);

      // Verify present in recent list
      const recent = await listRecentPythonJobs(bucket);
      expect(recent.length).toBe(1);
      expect(recent[0].id).toBe(job.id);
    });
  });

  describe("Unified runPython Dispatcher", () => {
    it("dispatches to queue mode when explicitly requested", async () => {
      const bucket = createMockR2Bucket();
      const res = await runPython({
        code: "print('queued')",
        mode: "queue",
        bucket,
        userId: "test-user",
      });

      expect(res.success).toBe(true);
      expect(res.stdout).toContain("Job queued");
      expect(res.result).toMatch(/^queued:py-/);
    });

    it("dispatches via HTTP runner when runnerUrl is specified", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stdout: "Calculation finished\n",
          stderr: "",
          result: "42",
          latex: "42",
          plots: [],
          executionTimeMs: 15,
        }),
      });

      const res = await runPython({
        code: "6 * 7",
        runnerUrl: "http://127.0.0.1:8788",
        mode: "http",
      });

      expect(res.success).toBe(true);
      expect(res.result).toBe("42");
    });

    it("falls back to R2 queue when in Worker environment and bucket is supplied", async () => {
      // Mock fetch failure
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));
      const bucket = createMockR2Bucket();

      const res = await runPython({
        code: "diff(sin(x), x)",
        bucket,
        mode: "auto",
      });

      expect(res.success).toBe(true);
      expect(res.stdout).toContain("Job queued in R2");
      expect(res.result).toMatch(/^queued:py-/);
    });
  });
});
