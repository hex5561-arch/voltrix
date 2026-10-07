import { Cursor } from "@gadgets/workshop-shared/gatekeeper";

export type { Cursor };

// ── Plain data types ────────────────────────────────────────────────

/** An email address with optional display name. */
export type EmailAddress = {
  address: string;
  name?: string;
}

export type GmailThreadInfo = {
  id: string;
  /** Preview text when Gmail includes one for this response format. */
  snippet?: string;
  subject: string;
  messageCount: number;
}

export type GmailMessageInfo = {
  id: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  subject: string;
  timestamp: Date;
  labels: GmailLabel[];
}

/** Email content in available formats. Both fields may be absent for bodyless messages. */
export type EmailContent = {
  text?: string;
  html?: string;
}

// ── Capability interfaces ───────────────────────────────────────────
// These are RPC stubs — all methods are async. Capabilities can be
// passed across Worker boundaries and retain their access rights.

/** A single entry from the thread cursor, including metadata and a thread capability. */
export type GmailThreadEntry = {
  info: GmailThreadInfo;
  thread: GmailThread;
}

export interface GmailSession {
  /** List the most recent threads available to this binding (the inbox for a
   *  whole-mailbox binding, or the connected search/label scope). Returns a
   *  cursor that lazily fetches pages from the Gmail API as consumed. */
  listThreads(): Promise<Cursor<GmailThreadEntry>>;

  /** Search for threads matching a Gmail query (e.g. "from:bob@example.com").
   *  Returns a cursor that lazily fetches pages as consumed. */
  search(query: string): Promise<Cursor<GmailThreadEntry>>;

  /** Compose and send a new email. Only available when the whole mailbox is
   *  connected; on a search- or label-scoped binding this throws (use a
   *  message's reply()/forward() instead). */
  send(to: string[], subject: string, body: string): Promise<void>;
}

export interface GmailThread {
  /** Get thread metadata (subject, snippet, message count, etc). */
  getMetadata(): Promise<GmailThreadInfo>;

  /** Get all messages in the thread as capabilities. */
  messages(): Promise<GmailMessage[]>;

  /**
   * Get the subset of messages in the thread that `address` sent or was a
   * recipient of (to/cc/bcc).
   *
   * Use this when composing a reply addressed to `address` so the thread
   * history the agent reads matches the history that `address` can see —
   * avoiding accidental leaks of side-conversations that branched off the
   * thread without that recipient.
   *
   * Caveats:
   * - Bcc recipients: a message Bcc'd to `address` is included here, but
   *   only if this mailbox is the one that sent it (Bcc headers are
   *   stripped from recipients' copies).
   * - Distribution lists: if a message was sent to a list that `address`
   *   is a member of, it will NOT be included because the gatekeeper has
   *   no way to enumerate list membership. Consumers that care about this
   *   should pass the list address in addition to the individual's.
   * - Address matching is case-insensitive and exact; aliases are not
   *   resolved. Pass all known addresses for a person if needed.
   */
  messagesVisibleTo(address: string): Promise<GmailMessage[]>;

  /** Remove from inbox (add to archive). */
  archive(): Promise<void>;

  /** Move to trash. */
  trash(): Promise<void>;

  /** Mark all messages in thread as read. */
  markRead(): Promise<void>;

  /** Mark all messages in thread as unread. */
  markUnread(): Promise<void>;
}

export interface GmailMessage {
  /** Get message metadata (from, to, subject, timestamp, labels). */
  getMetadata(): Promise<GmailMessageInfo>;

  /** Get the thread this message belongs to. */
  thread(): Promise<GmailThread>;

  /** Get the message content. Returns plain text and/or HTML as available. */
  getContent(): Promise<EmailContent>;

  /** Reply to the sender only. */
  reply(body: string): Promise<void>;

  /** Reply to all recipients. */
  replyAll(body: string): Promise<void>;

  /** Forward the message to new recipients. */
  forward(to: string[], body?: string): Promise<void>;
}

// ── Gmail labels ────────────────────────────────────────────────────

/** Well-known Gmail system label names. */
export type GmailSystemLabel =
  | "INBOX" | "TRASH" | "SPAM" | "UNREAD" | "STARRED"
  | "IMPORTANT" | "SENT" | "DRAFT" | "CHAT"
  | "CATEGORY_PRIMARY" | "CATEGORY_PERSONAL" | "CATEGORY_SOCIAL"
  | "CATEGORY_PROMOTIONS" | "CATEGORY_UPDATES" | "CATEGORY_FORUMS";

/** A Gmail label — either a well-known system label or a custom user label. */
export type GmailLabel =
  | { id: string; name: GmailSystemLabel; type: "system" }
  | { id: string; name: string; type: "custom" };


// ── YouTube ─────────────────────────────────────────────────────────

/** Privacy status for a YouTube video or playlist. */
export type YouTubePrivacyStatus = "public" | "unlisted" | "private";

/** Metadata for a YouTube video. */
export type YouTubeVideoInfo = {
  /** YouTube video ID. */
  id: string;
  /** Video title. */
  title: string;
  /** Video description. */
  description: string;
  /** Privacy status. */
  privacyStatus: YouTubePrivacyStatus;
  /** ISO 8601 publish timestamp. */
  publishedAt: string;
  /** YouTube channel ID. */
  channelId: string;
  /** Channel display name. */
  channelTitle: string;
  /** Thumbnail URL (high-res when available). */
  thumbnailUrl?: string;
  /** View count as a string (YouTube API returns strings for large numbers). */
  viewCount?: string;
  /** Duration in ISO 8601 format (e.g. "PT3M42S"). */
  duration?: string;
};

/** Result returned after a successful video upload. */
export type YouTubeUploadResult = {
  /** YouTube video ID. */
  videoId: string;
  /** Full watch URL: https://www.youtube.com/watch?v=<videoId> */
  watchUrl: string;
  /** Privacy status as set at upload time. */
  privacyStatus: YouTubePrivacyStatus;
  /** Video title as stored by YouTube. */
  title: string;
};

/** Options for uploading a video to YouTube. */
export type YouTubeUploadOptions = {
  /** Video title (max 100 chars). */
  title: string;
  /** Video description (max 5000 chars). */
  description?: string;
  /** Privacy status. Defaults to "unlisted". */
  privacyStatus?: YouTubePrivacyStatus;
  /** Comma-separated tags (max 500 chars total). */
  tags?: string[];
  /** YouTube category ID (e.g. "27" for Education). Defaults to Education. */
  categoryId?: string;
};

/** YouTube channel information. */
export type YouTubeChannelInfo = {
  /** Channel ID. */
  id: string;
  /** Channel title. */
  title: string;
  /** Channel description. */
  description: string;
  /** Subscriber count (string, may be hidden). */
  subscriberCount?: string;
  /** Total video count. */
  videoCount?: string;
  /** Channel thumbnail URL. */
  thumbnailUrl?: string;
  /** Custom URL handle (e.g. "@VoltrixStudents"). */
  customUrl?: string;
};

/**
 * YouTube session — upload videos and manage a connected YouTube channel.
 * Requires the youtube.upload and youtube OAuth scopes.
 */
export interface YouTubeSession {
  /**
   * Get information about the authenticated YouTube channel.
   */
  getChannel(): Promise<YouTubeChannelInfo>;

  /**
   * Upload a video to YouTube from a URL or base64-encoded data.
   *
   * @param videoData  URL of the video file (https://...) or base64-encoded video bytes.
   * @param mimeType   MIME type of the video (e.g. "video/mp4").
   * @param options    Upload metadata: title, description, privacy, tags.
   */
  uploadVideo(
    videoData: string,
    mimeType: string,
    options: YouTubeUploadOptions,
  ): Promise<YouTubeUploadResult>;

  /**
   * List the most recent videos on the connected channel.
   *
   * @param maxResults  Number of videos to return (1–50, default 10).
   */
  listVideos(maxResults?: number): Promise<YouTubeVideoInfo[]>;

  /**
   * Update the title, description, privacy, or tags of an existing video.
   *
   * @param videoId  YouTube video ID.
   * @param updates  Fields to update.
   */
  updateVideo(
    videoId: string,
    updates: Partial<Pick<YouTubeUploadOptions, "title" | "description" | "privacyStatus" | "tags">>,
  ): Promise<YouTubeVideoInfo>;

  /**
   * Delete a video from the channel.
   *
   * @param videoId  YouTube video ID.
   */
  deleteVideo(videoId: string): Promise<void>;
}
