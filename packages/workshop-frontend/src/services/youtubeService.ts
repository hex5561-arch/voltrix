/**
 * YouTube API Client Service for Voltrix OS
 * Handles live YouTube likes, subscriptions, and OAuth token management.
 */

const TOKEN_KEY = 'youtube_access_token';
const SUBS_MAP_KEY = 'youtube_subscriptions_map'; // Maps channelId -> subscriptionId

export function getYouTubeAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setYouTubeAccessToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new CustomEvent('voltrix:youtube-connected', { detail: { token } }));
  } catch {}
}

export function removeYouTubeAccessToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('voltrix:youtube-disconnected'));
  } catch {}
}

export function isYouTubeConnected(): boolean {
  return Boolean(getYouTubeAccessToken());
}

export function getStoredSubscriptionId(channelOrAuthor: string): string | undefined {
  try {
    const raw = localStorage.getItem(SUBS_MAP_KEY);
    if (!raw) return undefined;
    const map = JSON.parse(raw);
    return map[channelOrAuthor];
  } catch {
    return undefined;
  }
}

export function setStoredSubscriptionId(channelOrAuthor: string, subscriptionId: string): void {
  try {
    const raw = localStorage.getItem(SUBS_MAP_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[channelOrAuthor] = subscriptionId;
    localStorage.setItem(SUBS_MAP_KEY, JSON.stringify(map));
  } catch {}
}

export function removeStoredSubscriptionId(channelOrAuthor: string): void {
  try {
    const raw = localStorage.getItem(SUBS_MAP_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[channelOrAuthor];
    localStorage.setItem(SUBS_MAP_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Initiates Google OAuth with YouTube scopes.
 */
export async function startYouTubeOAuthConnect(currentPath?: string): Promise<void> {
  const returnPath = currentPath || window.location.pathname;
  try {
    sessionStorage.setItem('voltrix:yt_return_path', returnPath);
  } catch {}

  // Always use the registered, fixed redirect URI to prevent dynamic subpath mismatches
  const redirectUri = `${window.location.origin}/vtube`;
  const res = await fetch(`/api/auth/oauth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}&scope=youtube`);
  const data = await res.json() as { enabled?: boolean; url?: string };
  if (data?.url) {
    window.location.href = data.url;
  } else {
    throw new Error('Could not initiate Google YouTube authorization');
  }
}

/**
 * Executes a Live Like or Unlike on YouTube
 */
export async function executeLiveYouTubeLike(
  videoId: string,
  willLike: boolean
): Promise<{ success: boolean; message: string; requiresAuth?: boolean }> {
  const token = getYouTubeAccessToken();
  if (!token) {
    return {
      success: false,
      message: 'Connect your Google account to like on YouTube',
      requiresAuth: true,
    };
  }

  try {
    const res = await fetch('/api/vtube/youtube/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        videoId,
        rating: willLike ? 'like' : 'none',
      }),
    });

    const data = await res.json() as any;
    if (res.status === 401 || data?.status === 401) {
      removeYouTubeAccessToken();
      return {
        success: false,
        message: 'YouTube session expired. Please reconnect.',
        requiresAuth: true,
      };
    }

    return {
      success: data?.success ?? res.ok,
      message: data?.message || (willLike ? 'Liked on YouTube' : 'Unliked on YouTube'),
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to sync like with YouTube',
    };
  }
}

/**
 * Executes a Live Subscribe or Unsubscribe on YouTube
 */
export async function executeLiveYouTubeSubscribe(params: {
  author: string;
  videoId?: string;
  channelId?: string;
  willSubscribe: boolean;
}): Promise<{ success: boolean; message: string; requiresAuth?: boolean; subscriptionId?: string }> {
  const token = getYouTubeAccessToken();
  if (!token) {
    return {
      success: false,
      message: 'Connect your Google account to subscribe on YouTube',
      requiresAuth: true,
    };
  }

  const { author, videoId, channelId, willSubscribe } = params;
  const subscriptionId = getStoredSubscriptionId(author);

  try {
    const res = await fetch('/api/vtube/youtube/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        author,
        videoId,
        channelId,
        action: willSubscribe ? 'subscribe' : 'unsubscribe',
        subscriptionId: willSubscribe ? undefined : subscriptionId,
      }),
    });

    const data = await res.json() as any;
    if (res.status === 401 || data?.status === 401) {
      removeYouTubeAccessToken();
      return {
        success: false,
        message: 'YouTube session expired. Please reconnect.',
        requiresAuth: true,
      };
    }

    if (willSubscribe && data?.subscriptionId) {
      setStoredSubscriptionId(author, data.subscriptionId);
    } else if (!willSubscribe) {
      removeStoredSubscriptionId(author);
    }

    return {
      success: data?.success ?? res.ok,
      message: data?.message || (willSubscribe ? 'Subscribed on YouTube' : 'Unsubscribed on YouTube'),
      subscriptionId: data?.subscriptionId,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to sync subscription with YouTube',
    };
  }
}
