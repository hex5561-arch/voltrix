import sys

file_path = "cloudflare-os/packages/workshop-frontend/src/routes/vtube.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Fix React unused error
content = content.replace("import React, { useEffect, useState } from 'react';", "import { useEffect, useState } from 'react';")
# Fix link
content = content.replace("to={`/vtube/${lecture.videoId}`}", "to=\"/vtube/$videoId\" params={{ videoId: lecture.videoId }}")

with open(file_path, "w") as f:
    f.write(content)


file_path = "cloudflare-os/packages/workshop-frontend/src/routes/vtube_.$videoId.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Fix React unused error
content = content.replace("import React, { useEffect, useState, useRef } from 'react';", "import { useEffect, useState } from 'react';")

with open(file_path, "w") as f:
    f.write(content)
