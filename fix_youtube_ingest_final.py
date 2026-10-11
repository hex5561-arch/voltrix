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

# Insert KV lookup
lookup_logic = """
  const kvKey = `vtube:ingest:${videoId || normalizedUrl}`;
  try {
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
  } catch (e) {}
"""

content = content.replace(
    "const normalizedUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : youtubeUrl;",
    "const normalizedUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : youtubeUrl;\n" + lookup_logic
)

# Replace return logic to cache it
return_logic = """
  const responseData = {
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
    await env.BLUEPRINTS.put(kvKey, JSON.stringify(responseData));
  } catch (e) {}

  return new Response(JSON.stringify(responseData), {
"""

pattern = r"return new Response\(JSON\.stringify\(\{\s*success:\s*true.*?content:\s*extractedText\s*\}\),\s*\{"
content = re.sub(pattern, return_logic, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)
