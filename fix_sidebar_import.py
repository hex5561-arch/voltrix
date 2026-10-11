import sys

file_path = "cloudflare-os/packages/workshop-frontend/src/components/AppShell/Sidebar.tsx"

with open(file_path, "r") as f:
    content = f.read()

content = content.replace("  Television,\n, Television } from '@phosphor-icons/react'", "  Television\n} from '@phosphor-icons/react'")
content = content.replace("  Television,\n} from '@phosphor-icons/react'", "  Television\n} from '@phosphor-icons/react'")

with open(file_path, "w") as f:
    f.write(content)
