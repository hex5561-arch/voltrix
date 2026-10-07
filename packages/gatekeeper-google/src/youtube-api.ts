/**
 * YouTube Data API v3 wrapper for gatekeeper-google.
 * Handles video upload (resumable), channel info, list, update, delete.
 */

import type {
  YouTubeChannelInfo,
  YouTubePrivacyStatus,
  YouTubeUploadOptions,
  YouTubeUploadResult,
  YouTubeVideoInfo,
} from "./types.js";

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const YT_UPLOAD_BASE = "https://www.googleapis.com/upload/youtube/v3";

export class YouTubeApi {
  readonly #token: () => Promise<string>;

  constructor(getToken: () => Promise<string>) {
    this.#token = getToken;
  }

  async #get(path: string, params: Record<string, string> = {}): Promise<unknown> {
    const token = await this.#token();
    const url = new URL(`${YT_BASE}/${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`YouTube API GET /${path} failed (${res.status}): ${err}`);
    }
    return res.json();
  }

  async #delete(path: string, params: Record<string, string> = {}): Promise<void> {
    const token = await this.#token();
    const url = new URL(`${YT_BASE}/${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.text();
      throw new Error(`YouTube API DELETE /${path} failed (${res.status}): ${err}`);
    }
  }

  async #put(path: string, params: Record<string, string>, body: unknown): Promise<unknown> {
    const token = await this.#token();
    const url = new URL(`${YT_BASE}/${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`YouTube API PUT /${path} failed (${res.status}): ${err}`);
    }
    return res.json();
  }

  // ── Channel ─────────────────────────────────────────────────────────

  async getChannel(): Promise<YouTubeChannelInfo> {
    const data = await this.#get("channels", {
      part: "snippet,statistics",
      mine: "true",
    }) as { items?: YouTubeChannelRaw[] };

    const item = data.items?.[0];
    if (!item) throw new Error("No YouTube channel found for this account.");

    return parseChannel(item);
  }

  // ── Videos ──────────────────────────────────────────────────────────

  async listVideos(maxResults = 10): Promise<YouTubeVideoInfo[]> {
    // Step 1: get video IDs from the channel's uploads playlist
    const channelData = await this.#get("channels", {
      part: "contentDetails",
      mine: "true",
    }) as { items?: { contentDetails: { relatedPlaylists: { uploads: string } } }[] };

    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylistId) throw new Error("Could not find uploads playlist for channel.");

    const playlistData = await this.#get("playlistItems", {
      part: "contentDetails",
      playlistId: uploadsPlaylistId,
      maxResults: String(Math.min(maxResults, 50)),
    }) as { items?: { contentDetails: { videoId: string } }[] };

    const videoIds = (playlistData.items ?? []).map(i => i.contentDetails.videoId);
    if (videoIds.length === 0) return [];

    // Step 2: get full video details
    const videoData = await this.#get("videos", {
      part: "snippet,contentDetails,statistics,status",
      id: videoIds.join(","),
    }) as { items?: YouTubeVideoRaw[] };

    return (videoData.items ?? []).map(parseVideo);
  }

  async updateVideo(
    videoId: string,
    updates: Partial<Pick<YouTubeUploadOptions, "title" | "description" | "privacyStatus" | "tags">>,
  ): Promise<YouTubeVideoInfo> {
    // Need current snippet to avoid blanking fields
    const current = await this.#get("videos", {
      part: "snippet,status",
      id: videoId,
    }) as { items?: YouTubeVideoRaw[] };

    const item = current.items?.[0];
    if (!item) throw new Error(`Video ${videoId} not found.`);

    const snippet = {
      title: updates.title ?? item.snippet.title,
      description: updates.description ?? item.snippet.description,
      tags: updates.tags ?? item.snippet.tags ?? [],
      categoryId: item.snippet.categoryId ?? "27",
    };
    const status = {
      privacyStatus: updates.privacyStatus ?? item.status?.privacyStatus ?? "unlisted",
    };

    const result = await this.#put("videos", { part: "snippet,status" }, {
      id: videoId,
      snippet,
      status,
    }) as YouTubeVideoRaw;

    return parseVideo(result);
  }

  async deleteVideo(videoId: string): Promise<void> {
    await this.#delete("videos", { id: videoId });
  }

  // ── Upload (resumable) ───────────────────────────────────────────────
  // YouTube requires resumable upload for anything > 5 MB.
  // We initiate a resumable session, then stream the video bytes.

  async uploadVideo(
    videoData: string,
    mimeType: string,
    options: YouTubeUploadOptions,
  ): Promise<YouTubeUploadResult> {
    const token = await this.#token();

    const metadata = {
      snippet: {
        title: options.title.slice(0, 100),
        description: (options.description ?? "").slice(0, 5000),
        tags: options.tags ?? [],
        categoryId: options.categoryId ?? "27", // 27 = Education
      },
      status: {
        privacyStatus: options.privacyStatus ?? "unlisted",
      },
    };

    // Resolve video bytes
    let videoBytes: Uint8Array;
    if (videoData.startsWith("http://") || videoData.startsWith("https://")) {
      const fetchRes = await fetch(videoData);
      if (!fetchRes.ok) throw new Error(`Failed to fetch video from URL (${fetchRes.status})`);
      videoBytes = new Uint8Array(await fetchRes.arrayBuffer());
    } else {
      // Assume base64
      const binary = atob(videoData);
      videoBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) videoBytes[i] = binary.charCodeAt(i);
    }

    // Step 1: initiate resumable upload session
    const initRes = await fetch(
      `${YT_UPLOAD_BASE}/videos?uploadType=resumable&part=snippet,status`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": String(videoBytes.byteLength),
        },
        body: JSON.stringify(metadata),
      },
    );

    if (!initRes.ok) {
      const err = await initRes.text();
      throw new Error(`YouTube upload initiation failed (${initRes.status}): ${err}`);
    }

    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) throw new Error("YouTube did not return a resumable upload URL.");

    // Step 2: upload the video bytes
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(videoBytes.byteLength),
      },
      body: videoBytes,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`YouTube video upload failed (${uploadRes.status}): ${err}`);
    }

    const result = await uploadRes.json() as YouTubeVideoRaw;
    const videoId = result.id;

    return {
      videoId,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      privacyStatus: (result.status?.privacyStatus ?? options.privacyStatus ?? "unlisted") as YouTubePrivacyStatus,
      title: result.snippet?.title ?? options.title,
    };
  }
}

// ── Raw API response types ────────────────────────────────────────────

type YouTubeChannelRaw = {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    thumbnails?: { high?: { url: string } };
  };
  statistics?: {
    subscriberCount?: string;
    videoCount?: string;
    hiddenSubscriberCount?: boolean;
  };
};

type YouTubeVideoRaw = {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    tags?: string[];
    categoryId?: string;
    thumbnails?: { high?: { url: string }; maxres?: { url: string } };
  };
  status?: {
    privacyStatus: string;
  };
  contentDetails?: {
    duration: string;
  };
  statistics?: {
    viewCount?: string;
  };
};

function parseChannel(raw: YouTubeChannelRaw): YouTubeChannelInfo {
  return {
    id: raw.id,
    title: raw.snippet.title,
    description: raw.snippet.description,
    customUrl: raw.snippet.customUrl,
    thumbnailUrl: raw.snippet.thumbnails?.high?.url,
    subscriberCount: raw.statistics?.hiddenSubscriberCount
      ? undefined
      : raw.statistics?.subscriberCount,
    videoCount: raw.statistics?.videoCount,
  };
}

function parseVideo(raw: YouTubeVideoRaw): YouTubeVideoInfo {
  return {
    id: raw.id,
    title: raw.snippet.title,
    description: raw.snippet.description,
    publishedAt: raw.snippet.publishedAt,
    channelId: raw.snippet.channelId,
    channelTitle: raw.snippet.channelTitle,
    privacyStatus: (raw.status?.privacyStatus ?? "unlisted") as YouTubePrivacyStatus,
    thumbnailUrl: raw.snippet.thumbnails?.maxres?.url ?? raw.snippet.thumbnails?.high?.url,
    viewCount: raw.statistics?.viewCount,
    duration: raw.contentDetails?.duration,
  };
}
