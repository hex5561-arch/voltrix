import sys
import glob
import os

files = glob.glob("cloudflare-os/packages/workshop-frontend/src/components/vtube/*.tsx")
for file_path in files:
    with open(file_path, "r") as f:
        content = f.read()
    content = content.replace("import React, {", "import {")
    content = content.replace("import React from 'react';", "")
    with open(file_path, "w") as f:
        f.write(content)
