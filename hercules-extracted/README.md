# Hercules App Extraction (`parent-child-hyperframes-engine-820977`)

- **Live URL**: `https://parent-child-hyperframes-engine-820977.onhercules.app/`
- **Application ID**: `01M5G2BB3K84NTF2V8JTWY8CWE`
- **Backend Infrastructure**: Convex Cloud (`https://combative-mule-469.convex.cloud`)
- **Authentication**: Hercules Auth (`https://01m5g2bb3k84ntf2v8jtwy8cwe.hercules-auth.com`)

## Extraction Summary
- Unlike Emergent, Hercules deployed with `sourcemap: false`, minifying the client code into `/assets/index-BHbZDnfZ.js` (533 KB).
- The bundle was extracted, deobfuscated, and pretty-printed into 29,890 formatted lines in `index.formatted.js`.
- Inspection of the route tree confirms Hercules initialized the app with the standard starter template:
  - Route `/`: `Fv()` ("Welcome to Your Blank App / Start chatting to build your app")
  - Route `/auth/callback`: `Pv()` (Hercules auth sync)
  - Route `*`: `Iv()` (404 Page Not Found)
- The components have been decompiled into modern TypeScript JSX under `src/`.
