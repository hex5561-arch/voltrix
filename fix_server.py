import sys

file_path = "cloudflare-os/packages/workshop-backend/src/server.ts"

with open(file_path, "r") as f:
    content = f.read()

vtube_routes = """
    if (req.method === "GET" && url.pathname === "/api/vtube/feed") {
      return handleVTubeFeedRequest(req);
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/vtube/video/")) {
      const videoId = url.pathname.split("/").pop();
      if (videoId) {
        return handleVTubeVideoRequest(req, videoId);
      }
    }
"""

if "handleVTubeFeedRequest(req)" not in content:
    content = content.replace(
        """    if (url.pathname === "/api/youtube/search" || url.pathname === "/api/youtube-search") {""",
        vtube_routes + """\n    if (url.pathname === "/api/youtube/search" || url.pathname === "/api/youtube-search") {"""
    )

with open(file_path, "w") as f:
    f.write(content)
