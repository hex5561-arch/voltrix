import sys

file_path = "cloudflare-os/packages/workshop-frontend/src/ChatInterface.tsx"

with open(file_path, "r") as f:
    content = f.read()

if "Television" not in content.split("from '@phosphor-icons/react'")[0]:
    import_lines = [line for line in content.split("\n") if "from '@phosphor-icons/react'" in line]
    if import_lines:
        line = import_lines[0]
        if "Television" not in line:
            new_line = line.replace("}", ", Television }")
            content = content.replace(line, new_line)

with open(file_path, "w") as f:
    f.write(content)
