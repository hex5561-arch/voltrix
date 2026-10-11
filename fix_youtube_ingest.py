import sys

file_path = "cloudflare-os/packages/workshop-backend/src/youtube-engine.ts"
with open(file_path, "r") as f:
    content = f.read()

# I want to add KV storage logic for video ingest.
# However, youtube-engine.ts does not currently have access to `env`.
# We need to pass `env: any` to handleYouTubeIngestRequest.
# And then update `server.ts` to pass `env`.

ingest_func_start = "export async function handleYouTubeIngestRequest(req: Request): Promise<Response> {"
ingest_func_new = "export async function handleYouTubeIngestRequest(req: Request, env: any): Promise<Response> {"

content = content.replace(ingest_func_start, ingest_func_new)

# Now, before returning, cache the extracted text in KV
return_start = "return new Response(JSON.stringify({"

kv_cache_logic = """
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
  } catch (e) {
    // Ignore KV error
  }

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
  } catch (e) {
    // Ignore KV error
  }

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
"""

# We need to carefully replace the end of the function. Let's just find the `return new Response(` block and replace it.
import re
pattern = r"return new Response\(JSON\.stringify\(\{\s*success:\s*true,.*?\}\),\s*\{\s*status:\s*200,\s*headers:\s*\{\s*'Content-Type':\s*'application/json',\s*'Access-Control-Allow-Origin':\s*'\*'\s*\}\s*\}\);"

content = re.sub(pattern, kv_cache_logic, content, flags=re.DOTALL)


# Wait, I should also check at the BEGINNING of the function if it's in KV so we don't fetch from Jina every time.
# Yes, `kvKey` is known after `const normalizedUrl = ...`
# Let's insert the cache check after `normalizedUrl`.
cache_check_logic = """
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
    "const normalizedUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : youtubeUrl;\n" + cache_check_logic
)

with open(file_path, "w") as f:
    f.write(content)

file_path_server = "cloudflare-os/packages/workshop-backend/src/server.ts"
with open(file_path_server, "r") as f:
    content_server = f.read()

content_server = content_server.replace("return handleYouTubeIngestRequest(req);", "return handleYouTubeIngestRequest(req, env);")

with open(file_path_server, "w") as f:
    f.write(content_server)
