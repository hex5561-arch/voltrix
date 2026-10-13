/**
 * hf-jobs.ts
 * ──────────
 * Background Rendering Pipeline & Queue for HyperFrames Videos.
 * Manages video render jobs in Cloudflare R2:
 *  - hf-jobs/{id}.json           (job metadata and parameters)
 *  - hf-jobs/_index/pending.json (queue of jobs awaiting local host daemon render)
 *  - hf-jobs/_index/recent.json  (recent completed/running jobs)
 */

export interface HyperFramesSceneMeta {
  title: string;
  duration: number; // in seconds
  description: string;
  timecode?: string;
}

export interface HyperFramesJob {
  id: string;
  slug: string;
  topic: string;
  title: string;
  preset: string; // e.g. "cobalt-grid", "cartesian", "code-editorial"
  durationSeconds: number;
  durationDisplay: string;
  status: "queued" | "rendering" | "ready" | "failed";
  progressPercent: number; // 0 - 100
  createdAt: string;
  updatedAt: string;
  interactiveUrl?: string; // e.g. "https://voltrix.stream/s/slug"
  mp4Url?: string; // e.g. "/api/hf-videos/slug.mp4"
  error?: string;
  scenes?: HyperFramesSceneMeta[];
  htmlContent?: string;
  userId?: string;
}

export interface CreateJobParams {
  slug: string;
  topic: string;
  title?: string;
  preset?: string;
  durationSeconds?: number;
  durationDisplay?: string;
  interactiveUrl?: string;
  scenes?: HyperFramesSceneMeta[];
  htmlContent?: string;
  userId?: string;
}

export interface UpdateJobParams {
  status?: "queued" | "rendering" | "ready" | "failed";
  progressPercent?: number;
  mp4Url?: string;
  error?: string;
}

const JOBS_PREFIX = "hf-jobs/";
const PENDING_INDEX_KEY = "hf-jobs/_index/pending.json";
const RECENT_INDEX_KEY = "hf-jobs/_index/recent.json";

function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Creates a new HyperFrames video render job.
 */
export async function createHyperFramesJob(
  bucket: R2Bucket,
  params: CreateJobParams
): Promise<HyperFramesJob> {
  const cleanSlug = slugify(params.slug || params.topic || "explainer-video");
  const jobId = `hf-${cleanSlug}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const durationSec = params.durationSeconds || 120;
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const durationDisplay = params.durationDisplay || `${mins}:${secs.toString().padStart(2, "0")}`;

  const job: HyperFramesJob = {
    id: jobId,
    slug: cleanSlug,
    topic: params.topic,
    title: params.title || `${params.topic} Explained`,
    preset: params.preset || "cobalt-grid",
    durationSeconds: durationSec,
    durationDisplay,
    status: "queued",
    progressPercent: 0,
    createdAt: now,
    updatedAt: now,
    interactiveUrl: params.interactiveUrl || `https://voltrix.stream/s/${cleanSlug}`,
    mp4Url: `/api/hf-videos/${cleanSlug}.mp4`,
    scenes: params.scenes || [],
    htmlContent: params.htmlContent,
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
    console.warn("Failed to update pending index:", err);
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
    console.warn("Failed to update recent index:", err);
  }

  return job;
}

/**
 * Retrieves a single job by ID.
 */
export async function getHyperFramesJob(
  bucket: R2Bucket,
  jobId: string
): Promise<HyperFramesJob | null> {
  const obj = await bucket.get(`${JOBS_PREFIX}${jobId}.json`);
  if (!obj) return null;
  return (await obj.json()) as HyperFramesJob;
}

/**
 * Updates a job's progress or completion state.
 */
export async function updateHyperFramesJob(
  bucket: R2Bucket,
  jobId: string,
  update: UpdateJobParams
): Promise<HyperFramesJob | null> {
  const existing = await getHyperFramesJob(bucket, jobId);
  if (!existing) return null;

  const updated: HyperFramesJob = {
    ...existing,
    ...update,
    updatedAt: new Date().toISOString(),
  };

  // If status reached terminal state (ready or failed), remove from pending queue
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
      console.warn("Failed to pop from pending index:", err);
    }
  }

  await bucket.put(`${JOBS_PREFIX}${jobId}.json`, JSON.stringify(updated, null, 2), {
    httpMetadata: { contentType: "application/json" },
  });

  return updated;
}

/**
 * Polls active jobs from the pending queue for the host daemon.
 */
export async function pollPendingHyperFramesJobs(
  bucket: R2Bucket
): Promise<HyperFramesJob[]> {
  const pendingObj = await bucket.get(PENDING_INDEX_KEY);
  if (!pendingObj) return [];

  const jobIds = (await pendingObj.json()) as string[];
  const jobs: HyperFramesJob[] = [];

  for (const id of jobIds.slice(0, 10)) {
    const job = await getHyperFramesJob(bucket, id);
    if (job) {
      jobs.push(job);
    }
  }

  return jobs;
}

/**
 * Returns recent jobs for dashboard / UI.
 */
export async function listRecentHyperFramesJobs(
  bucket: R2Bucket,
  limit = 10
): Promise<HyperFramesJob[]> {
  const recentObj = await bucket.get(RECENT_INDEX_KEY);
  if (!recentObj) return [];

  const jobIds = (await recentObj.json()) as string[];
  const jobs: HyperFramesJob[] = [];

  for (const id of jobIds.slice(0, limit)) {
    const job = await getHyperFramesJob(bucket, id);
    if (job) jobs.push(job);
  }

  return jobs;
}
