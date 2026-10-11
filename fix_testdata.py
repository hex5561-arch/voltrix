import os
import shutil

src = "cloudflare-os/packages/whatsapp/src/index.ts"
dest_dir = "cloudflare-os/scripts/release/testdata/fixture-bundles/whatsapp"
os.makedirs(dest_dir, exist_ok=True)
with open(os.path.join(dest_dir, "index.js"), "w") as f:
    f.write("console.log('whatsapp');")
with open(os.path.join(dest_dir, "wrangler.json"), "w") as f:
    f.write('{"name":"whatsapp","main":"index.js"}')

dest_dir = "cloudflare-os/scripts/release/testdata/fixture-bundles/gatekeeper-webhook"
os.makedirs(dest_dir, exist_ok=True)
with open(os.path.join(dest_dir, "index.js"), "w") as f:
    f.write("console.log('gatekeeper-webhook');")
with open(os.path.join(dest_dir, "wrangler.json"), "w") as f:
    f.write('{"name":"gatekeeper-webhook","main":"index.js"}')
