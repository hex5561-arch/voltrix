import sys

file_path = "cloudflare-os/packages/workshop-backend/src/server.ts"

with open(file_path, "r") as f:
    content = f.read()

import_statement = "import { handleYouTubeSearchRequest, handleYouTubeIngestRequest"
new_import = "import { handleYouTubeSearchRequest, handleYouTubeIngestRequest, handleVTubeFeedRequest, handleVTubeVideoRequest } from \"./youtube-engine.js\";"

content = content.replace(
    "import { handleYouTubeSearchRequest, handleYouTubeIngestRequest } from \"./youtube-engine.js\";",
    new_import
)

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

if "handleVTubeFeedRequest" not in content:
    content = content.replace(
        """    if (url.pathname === "/api/youtube/search" || url.pathname === "/api/youtube-search") {""",
        vtube_routes + """\n    if (url.pathname === "/api/youtube/search" || url.pathname === "/api/youtube-search") {"""
    )

with open(file_path, "w") as f:
    f.write(content)
