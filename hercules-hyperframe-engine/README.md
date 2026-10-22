# HyperFrame Engine (Hercules) — extracted, pending revision

Source: https://hyperframe-engine-177519.onhercules.app/ (extracted 2026-10-22)
Hercules App ID: 01M5G6CJS1SSPZ1VGJT0YM9RV1 · Convex backend: dusty-herring-264.convex.cloud

No source map is published, so this is decompiled from the minified bundle (identifiers are mangled).

- raw/            original deployed index.html, JS bundle, CSS (byte-exact)
- full/           prettier-formatted full bundle (libs + app)
- app-source/     app-only regions of the formatted bundle:
  - 01-auth-layout.js          auth callback / layout
  - 02-landing.js              landing hero ("Describe any idea. HyperFrames writes, voices, animates a three-act video")
  - 03-hyperframes-studio.js   studio: gE.hyperframes.compositions.{start,list,get,remove}

Convex API used: hyperframes.compositions.{start,list,get,remove}, users.updateCurrentUser.
Stack: React 19, Vite, Tailwind, Radix, framer-motion, react-hook-form, Convex.
