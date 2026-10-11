import sys
import re

file_path = "cloudflare-os/packages/workshop-backend/src/youtube-engine.ts"
with open(file_path, "r") as f:
    content = f.read()

# Replace handleYouTubeIngestRequest signature
content = content.replace(
    "export async function handleYouTubeIngestRequest(req: Request): Promise<Response> {",
    "export async function handleYouTubeIngestRequest(req: Request, env: any): Promise<Response> {"
)

# Replace the beginning variables initialization
original_init = """  const videoId = extractYouTubeId(youtubeUrl);
  const normalizedUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : youtubeUrl;"""

new_init = """  const videoId = extractYouTubeId(youtubeUrl);
  const normalizedUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : youtubeUrl;

  const kvKey = `vtube:ingest:${videoId || normalizedUrl}`;
  try {
    if (env && env.BLUEPRINTS) {
      const cached = await env.BLUEPRINTS.get(kvKey, "json");
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
  } catch (e) {}"""

content = content.replace(original_init, new_init)

original_return = """  return new Response(JSON.stringify({
    success: true,
    videoId: videoId || normalizedUrl,
    youtubeUrl: normalizedUrl,
    title: finalTitle,
    author: finalAuthor,
    words: wordCount,
    chapters: catalogEntry?.chapters || [],
    takeaways: catalogEntry?.takeaways || [],
    content: extractedText
  }), {"""

new_return = """  const responseData = {
    success: true,
    videoId: videoId || normalizedUrl,
    youtubeUrl: normalizedUrl,
    title: finalTitle,
    author: finalAuthor,
    words: wordCount,
    chapters: catalogEntry?.chapters || [],
    takeaways: catalogEntry?.takeaways || [],
    content: extractedText
  };

  try {
    if (env && env.BLUEPRINTS) {
      await env.BLUEPRINTS.put(kvKey, JSON.stringify(responseData));
    }
  } catch (e) {}

  return new Response(JSON.stringify(responseData), {"""

content = content.replace(original_return, new_return)

with open(file_path, "w") as f:
    f.write(content)
