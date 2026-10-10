import re
import sys

filepath = 'packages/workshop-frontend/src/ChatInterface.tsx'
with open(filepath, 'r') as f:
    content = f.read()

if 'Television' not in content:
    # find GraduationCap import and add Television
    content = re.sub(r'(import \{[^}]*GraduationCap[^}]*)(\} from \'@phosphor-icons/react\')', r'\1, Television \2', content)

vtube1 = """
            <DropdownMenu.Item
              onClick={() => {
                window.location.href = '/vtube';
              }}
              className="!h-auto rounded-md !px-2.5 !py-2 text-[12.5px] leading-4 text-kumo-default transition-colors data-highlighted:bg-kumo-tint flex items-center gap-2 cursor-pointer"
            >
              <Television size={15} weight="fill" className="text-blue-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium text-blue-400">V-Tube (Academic Tube)</span>
                <span className="text-[10.5px] text-kumo-inactive">Distraction-free lectures</span>
              </div>
            </DropdownMenu.Item>
"""

vtube2 = """
                        <DropdownMenu.Item
                          onClick={() => {
                            window.location.href = '/vtube';
                          }}
                          className="!h-auto rounded-md !px-2.5 !py-2 text-[12.5px] leading-4 text-kumo-default transition-colors data-highlighted:bg-kumo-tint flex items-center gap-2 cursor-pointer"
                        >
                          <Television size={15} weight="fill" className="text-blue-400 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-medium text-blue-400">V-Tube (Academic Tube)</span>
                            <span className="text-[10.5px] text-kumo-inactive">Distraction-free lectures</span>
                          </div>
                        </DropdownMenu.Item>
"""

marker1 = '              <span className="font-medium text-emerald-400">Live Exam Gadget</span>'
parts = content.split(marker1)

if len(parts) == 3:
    part0, part1, part2 = parts
    # Backtrack to the start of the DropdownMenu.Item
    idx1 = part0.rfind('<DropdownMenu.Item')
    if idx1 != -1:
        part0 = part0[:idx1] + vtube1 + part0[idx1:]
    
    idx2 = part1.rfind('<DropdownMenu.Item')
    if idx2 != -1:
        part1 = part1[:idx2] + vtube2 + part1[idx2:]
        
    content = part0 + marker1 + part1 + marker1 + part2

with open(filepath, 'w') as f:
    f.write(content)

print("done")
