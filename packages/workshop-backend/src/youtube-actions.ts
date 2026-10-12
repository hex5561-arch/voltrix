/**
 * Live YouTube Data API v3 integration for Voltrix OS V-Tube layer.
 * Executes live likes and channel subscriptions directly on YouTube via user Google OAuth credentials.
 */

export const KNOWN_CHANNEL_IDS: Record<string, string> = {
  '3Blue1Brown': 'UCYO_jab_esuFRV4b17AJtAw',
  'MIT OpenCourseWare': 'UCEBb1b_L6zDS3xTUrIALZOw',
  'MIT OpenCourseWare (Prof. Gilbert Strang)': 'UCEBb1b_L6zDS3xTUrIALZOw',
  'MIT OpenCourseWare (Prof. Erik Demaine)': 'UCEBb1b_L6zDS3xTUrIALZOw',
  'Andrej Karpathy': 'UCXUPKJO5MZQN11Pq7YS_vFQ',
  'Abdul Bari': 'UCZCFT11CWBi3MHNlGf019nw',
  'freeCodeCamp.org / Prof. David J. Malan': 'UC8butISFwT-Wl7EV0hUK0BQ',
  'Prof. Walter Lewin (MIT Physics)': 'UCiEHVhv0SBMpP75JbzJShqw',
  'StatQuest with Josh Starmer': 'UCtYLUTtgS3k1Fg4y5tAhLbw',
  'Khan Academy': 'UC4a-Gbdw7vOaccHmFo40b9g',
  'Veritasium': 'UCHnyfMqiRRG1u-2MsSQLbXA',
  'Computerphile': 'UC9-y-6csu5WGm29I7JiwpnA',
  'Numberphile': 'UCoxcjq-8xIDTYp3uz647V5A',
  'Stanford University': 'UC-EnprmCZ3OXyAoG7v3VNCA',
  'Steve Brunton': 'UCm5mt-A4w61lknZ9lCsZtBw',
};

const CHANNEL_ID_CACHE = new Map<string, string>(Object.entries(KNOWN_CHANNEL_IDS));

export async function resolveChannelId(
  channelIdOrAuthor: string,
  videoId?: string,
  accessToken?: string
): Promise<string | null> {
  if (!channelIdOrAuthor && !videoId) return null;

  // Check direct channel ID format (UC...)
  if (channelIdOrAuthor && channelIdOrAuthor.startsWith('UC') && channelIdOrAuthor.length === 24) {
    return channelIdOrAuthor;
  }

  // Check known channels cache
  const normalized = channelIdOrAuthor?.trim();
  if (normalized && CHANNEL_ID_CACHE.has(normalized)) {
    return CHANNEL_ID_CACHE.get(normalized)!;
  }

  // Look for partial name match in known channels
  if (normalized) {
    for (const [name, id] of CHANNEL_ID_CACHE.entries()) {
      if (normalized.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(normalized.toLowerCase())) {
        return id;
      }
    }
  }

  // If we have videoId and an accessToken or API key, query YouTube API directly
  if (videoId && accessToken) {
    try {
      const resp = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${encodeURIComponent(videoId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (resp.ok) {
        const data = await resp.json() as any;
        const cid = data.items?.[0]?.snippet?.channelId;
        if (cid) {
          if (normalized) CHANNEL_ID_CACHE.set(normalized, cid);
          return cid;
        }
      }
    } catch {
      // Fallback below
    }
  }

  return null;
}

/**
 * Executes a live Like / Unlike on YouTube via YouTube Data API v3
 * Endpoint: POST https://www.googleapis.com/youtube/v3/videos/rate
 */
export async function executeYouTubeLike(
  videoId: string,
  rating: 'like' | 'none',
  accessToken: string
): Promise<{ success: boolean; status: number; message?: string; details?: any }> {
  if (!videoId) {
    return { success: false, status: 400, message: 'Missing videoId' };
  }
  if (!accessToken) {
    return { success: false, status: 401, message: 'Missing YouTube access token. Please connect Google account.' };
  }

  const endpoint = `https://www.googleapis.com/youtube/v3/videos/rate?id=${encodeURIComponent(videoId)}&rating=${encodeURIComponent(rating)}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Length': '0',
      },
    });

    if (res.status === 204 || res.ok) {
      return {
        success: true,
        status: 200,
        message: rating === 'like' ? 'Video liked on YouTube successfully!' : 'Video unliked on YouTube successfully!',
      };
    }

    const errText = await res.text();
    let errJson: any;
    try {
      errJson = JSON.parse(errText);
    } catch {
      errJson = errText;
    }

    return {
      success: false,
      status: res.status,
      message: res.status === 401 ? 'YouTube authorization expired or invalid' : 'Failed to rate video on YouTube',
      details: errJson,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      message: err?.message || 'Network error executing YouTube like',
    };
  }
}

/**
 * Executes a live Subscribe / Unsubscribe on YouTube via YouTube Data API v3
 * Endpoint: POST/DELETE https://www.googleapis.com/youtube/v3/subscriptions
 */
export async function executeYouTubeSubscribe(params: {
  channelId?: string;
  author?: string;
  videoId?: string;
  action: 'subscribe' | 'unsubscribe';
  subscriptionId?: string;
  accessToken: string;
}): Promise<{ success: boolean; status: number; subscriptionId?: string; channelId?: string; message: string; details?: any }> {
  const { channelId, author, videoId, action, subscriptionId, accessToken } = params;

  if (!accessToken) {
    return {
      success: false,
      status: 401,
      message: 'Missing YouTube access token. Please connect Google account.',
    };
  }

  // Handle Unsubscribe
  if (action === 'unsubscribe') {
    if (!subscriptionId) {
      return {
        success: false,
        status: 400,
        message: 'subscriptionId required to delete YouTube subscription',
      };
    }

    try {
      const delRes = await fetch(
        `https://www.googleapis.com/youtube/v3/subscriptions?id=${encodeURIComponent(subscriptionId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (delRes.status === 204 || delRes.ok) {
        return {
          success: true,
          status: 200,
          message: 'Unsubscribed from channel on YouTube successfully!',
        };
      }

      const errText = await delRes.text();
      return {
        success: false,
        status: delRes.status,
        message: 'Failed to unsubscribe on YouTube',
        details: errText,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 500,
        message: err?.message || 'Network error unsubscribing on YouTube',
      };
    }
  }

  // Handle Subscribe
  const targetChannelId = await resolveChannelId(channelId || author || '', videoId, accessToken);
  if (!targetChannelId) {
    return {
      success: false,
      status: 400,
      message: `Could not identify YouTube channel ID for '${author || channelId || videoId}'`,
    };
  }

  try {
    const subRes = await fetch('https://www.googleapis.com/youtube/v3/subscriptions?part=snippet', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId: targetChannelId,
          },
        },
      }),
    });

    if (subRes.ok) {
      const data = await subRes.json() as any;
      return {
        success: true,
        status: 200,
        subscriptionId: data?.id,
        channelId: targetChannelId,
        message: 'Subscribed to channel on YouTube successfully!',
      };
    }

    const errText = await subRes.text();
    let errJson: any;
    try {
      errJson = JSON.parse(errText);
    } catch {
      errJson = errText;
    }

    // Check if already subscribed
    if (subRes.status === 400 && errText.includes('subscriptionDuplicate')) {
      return {
        success: true,
        status: 200,
        channelId: targetChannelId,
        message: 'Already subscribed to channel on YouTube!',
      };
    }

    return {
      success: false,
      status: subRes.status,
      channelId: targetChannelId,
      message: subRes.status === 401 ? 'YouTube authorization expired or invalid' : 'Failed to subscribe on YouTube',
      details: errJson,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      message: err?.message || 'Network error subscribing on YouTube',
    };
  }
}
