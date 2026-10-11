import sys

file_path = "cloudflare-os/packages/workshop-frontend/src/ChatInterface.tsx"

with open(file_path, "r") as f:
    content = f.read()

# I messed up by inserting two V-Tube entries and also the formatting is bad.
# Let's clean it up.
import re
# We just need to remove the first set of duplicated V-Tube (Academic Tube) entries we added

bad_entry = """                        <DropdownMenu.Item
                          onClick={() => {
                            window.open('/vtube', '_blank');
                          }}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-kumo-default hover:bg-kumo-hover hover:text-kumo-default cursor-pointer outline-none"
                        >
                          <span className="text-lg">📺</span>
                          <span>V-Tube (Academic Tube)</span>
                        </DropdownMenu.Item>

"""

content = content.replace(bad_entry, "")

with open(file_path, "w") as f:
    f.write(content)
