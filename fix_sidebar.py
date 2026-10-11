import sys

file_path = "cloudflare-os/packages/workshop-frontend/src/components/AppShell/Sidebar.tsx"

with open(file_path, "r") as f:
    content = f.read()

# Replace duplicated V-Tube entry
content = content.replace("""            <SidebarItem
              to="/vtube"
              label="V-Tube"
              icon={<Television size={14} weight="regular" />}
              collapsed={collapsed}
            />
            <SidebarItem
              to="/vtube"
              label="V-Tube"
              icon={<Television size={14} weight="regular" />}
              collapsed={collapsed}
            />""", """            <SidebarItem
              to="/vtube"
              label="V-Tube"
              icon={<Television size={14} weight="regular" />}
              collapsed={collapsed}
            />""")

with open(file_path, "w") as f:
    f.write(content)
