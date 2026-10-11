import sys

file_path = "cloudflare-os/packages/workshop-frontend/src/ChatInterface.tsx"

with open(file_path, "r") as f:
    content = f.read()

# I need to add "📺 V-Tube (Academic Tube)" inside the 🎓 Academic Tools dropdown
# Let's find the DropdownMenu.Content associated with Academic Tools.
dropdown_start = """                      <DropdownMenu.Content className="themed-floating-shadow !z-[1100] !min-w-[220px] rounded-lg border border-kumo-line bg-kumo-base p-1.5 shadow-xl">"""

# Replace in multiple occurrences if applicable. Let's just do a specific replace.
vtube_item = """                        <DropdownMenu.Item
                          onClick={() => {
                            window.open('/vtube', '_blank');
                          }}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-kumo-default hover:bg-kumo-hover hover:text-kumo-default cursor-pointer outline-none"
                        >
                          <span className="text-lg">📺</span>
                          <span>V-Tube (Academic Tube)</span>
                        </DropdownMenu.Item>
"""

import re
# We need to find the Content inside the Academic Tools dropdown.
# Academic Tools button is:
# aria-label="Academic Tools"
# <GraduationCap size={15} weight="bold" className="text-emerald-500" />
# It's at line 7066 and 7491. Let's do a regex replacement after DropdownMenu.Content in these specific blocks.

pattern = r'(<button[^>]*aria-label="Academic Tools"[^>]*>.*?<DropdownMenu\.Content[^>]*>)'

content = re.sub(pattern, r'\1\n' + vtube_item, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)
