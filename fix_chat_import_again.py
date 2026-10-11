import sys

file_path = "cloudflare-os/packages/workshop-frontend/src/ChatInterface.tsx"

with open(file_path, "r") as f:
    content = f.read()

# I see it's imported like this
# import {
#   CaretDown,
# ...
# } from "@phosphor-icons/react";
# So my previous script failed to find it.

import_lines = []
in_import = False
start_idx = -1
end_idx = -1

lines = content.split('\n')
for i, line in enumerate(lines):
    if "from \"@phosphor-icons/react\"" in line:
        end_idx = i
        break
    if "} from \"@phosphor-icons/react\"" in line:
        end_idx = i
        break

if end_idx != -1:
    for i in range(end_idx - 1, 0, -1):
        if "import {" in lines[i]:
            start_idx = i
            break

if start_idx != -1 and end_idx != -1:
    import_block = '\n'.join(lines[start_idx:end_idx+1])
    if "Television" not in import_block:
        lines.insert(end_idx, "  Television,")
        content = '\n'.join(lines)
        with open(file_path, "w") as f:
            f.write(content)
