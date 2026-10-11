import sys

file_path = "cloudflare-os/packages/workshop-backend/src/youtube-engine.ts"
with open(file_path, "r") as f:
    content = f.read()

vtube_handlers = """
/**
 * Handle GET /api/vtube/feed requests.
 */
export async function handleVTubeFeedRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const discipline = url.searchParams.get('discipline')?.toLowerCase();
  const courses = url.searchParams.get('courses')?.toLowerCase().split(',').filter(Boolean);

  let feed = ACADEMIC_DISCOVERY_CATALOG;

  if (discipline) {
    // Sort items matching discipline to the top, but don't strictly filter out the rest
    feed = [...ACADEMIC_DISCOVERY_CATALOG].sort((a, b) => {
      const aMatch = a.discipline.toLowerCase().includes(discipline);
      const bMatch = b.discipline.toLowerCase().includes(discipline);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  return new Response(JSON.stringify({ success: true, feed }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle GET /api/vtube/video/:id requests.
 */
export async function handleVTubeVideoRequest(req: Request, videoId: string): Promise<Response> {
  const video = ACADEMIC_DISCOVERY_CATALOG.find(c => c.videoId === videoId);

  if (!video) {
    return new Response(JSON.stringify({ success: false, error: 'Video not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true, video }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
"""

if "handleVTubeFeedRequest" not in content:
    content += "\n" + vtube_handlers

with open(file_path, "w") as f:
    f.write(content)
