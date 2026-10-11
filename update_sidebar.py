import sys

file_path = "cloudflare-os/packages/workshop-frontend/src/components/AppShell/Sidebar.tsx"

with open(file_path, "r") as f:
    content = f.read()

import_statement = "import { Television } from '@phosphor-icons/react'"
if import_statement not in content:
    # Need to find existing phosphor-icons imports and add Television
    import_lines = [line for line in content.split("\n") if "from '@phosphor-icons/react'" in line]
    if import_lines:
        line = import_lines[0]
        if "Television" not in line:
            new_line = line.replace("}", ", Television }")
            content = content.replace(line, new_line)

sidebar_item = """            <SidebarItem
              to="/outputs"
              label="Outputs"
              icon={<Stack size={14} weight="regular" />}
              collapsed={collapsed}
            />
            <SidebarItem
              to="/vtube"
              label="V-Tube"
              icon={<Television size={14} weight="regular" />}
              collapsed={collapsed}
            />"""

content = content.replace("""            <SidebarItem
              to="/outputs"
              label="Outputs"
              icon={<Stack size={14} weight="regular" />}
              collapsed={collapsed}
            />""", sidebar_item)

with open(file_path, "w") as f:
    f.write(content)
