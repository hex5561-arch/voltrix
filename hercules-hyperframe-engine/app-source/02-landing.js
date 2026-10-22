function yL() {
  return (0, q.jsxs)(`div`, {
    className: `relative overflow-hidden`,
    children: [
      (0, q.jsx)(`div`, {
        className: `pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_55%),radial-gradient(ellipse_at_90%_40%,color-mix(in_oklch,var(--accent)_18%,transparent),transparent_50%)]`,
      }),
      (0, q.jsxs)(`div`, {
        className: `relative mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6 sm:pt-24`,
        children: [
          (0, q.jsx)(gL.p, {
            initial: { opacity: 0, y: 8 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, ease: `easeOut` },
            className: `font-mono text-xs uppercase tracking-[0.25em] text-primary`,
            children: `Topic in. Narrated film out.`,
          }),
          (0, q.jsxs)(gL.h1, {
            initial: { opacity: 0, y: 16 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.1, ease: `easeOut` },
            className: `max-w-4xl pt-5 text-5xl font-semibold leading-[1.02] tracking-tight text-balance sm:text-7xl`,
            children: [
              `Explainer videos, `,
              (0, q.jsx)(`span`, {
                className: `font-serif font-normal italic`,
                children: `directed`,
              }),
              ` by AI.`,
            ],
          }),
          (0, q.jsx)(gL.p, {
            initial: { opacity: 0, y: 16 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.2, ease: `easeOut` },
            className: `max-w-xl pt-6 text-lg text-muted-foreground`,
            children: `Describe any idea. HyperFrames writes, voices, and animates a three-act motion graphics video you can watch in seconds.`,
          }),
          (0, q.jsx)(gL.div, {
            initial: { opacity: 0, y: 16 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.6, delay: 0.3, ease: `easeOut` },
            className: `pt-8`,
            children: (0, q.jsx)(EE, {
              size: `lg`,
              signInText: `Start making videos`,
              className: `rounded-xl`,
            }),
          }),
          (0, q.jsx)(gL.div, {
            initial: { opacity: 0, y: 24 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.7, delay: 0.45, ease: `easeOut` },
            className: `pt-16`,
            children: (0, q.jsxs)(`div`, {
              className: `overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.16_0.03_262)] shadow-2xl`,
              children: [
                (0, q.jsxs)(`div`, {
                  className: `flex items-center justify-between border-b border-white/10 px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-white/60`,
                  children: [
                    (0, q.jsx)(`span`, { children: `HyperFrames / Live` }),
                    (0, q.jsxs)(`span`, {
                      className: `flex items-center gap-2`,
                      children: [
                        (0, q.jsx)(`span`, {
                          className: `size-2 rounded-full bg-red-500`,
                        }),
                        ` On air`,
                      ],
                    }),
                  ],
                }),
                (0, q.jsx)(`div`, {
                  className: `grid grid-cols-3`,
                  children: vL.map((e, t) =>
                    (0, q.jsxs)(
                      gL.div,
                      {
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        transition: {
                          duration: 0.6,
                          delay: 0.7 + t * 0.15,
                          ease: `easeOut`,
                        },
                        className: `relative aspect-[4/3] border-white/10 not-last:border-r sm:aspect-video`,
                        style: {
                          background: `radial-gradient(circle at 50% 55%, oklch(0.72 0.15 ${205 + t * 60} / 0.55), transparent 60%)`,
                        },
                        children: [
                          (0, q.jsx)(gL.div, {
                            className: `absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 sm:size-24`,
                            style: {
                              borderColor: `oklch(0.85 0.13 ${205 + t * 60})`,
                            },
                            animate: {
                              scale: [1, 1.12, 1],
                              rotate: [0, 90, 0],
                            },
                            transition: {
                              duration: 4,
                              delay: t * 0.4,
                              repeat: 1 / 0,
                              ease: `easeInOut`,
                            },
                          }),
                          (0, q.jsxs)(`span`, {
                            className: `absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-white/70 sm:text-xs`,
                            children: [`Act `, t + 1, ` / `, e],
                          }),
                        ],
                      },
                      e,
                    ),
                  ),
                }),
                (0, q.jsx)(`div`, {
                  className: `border-t border-white/10 px-5 py-4 text-center text-sm text-white/80 sm:text-base`,
                  children: `“Each token asks every other token: how much should I care about you?”`,
                }),
              ],
            }),
          }),
          (0, q.jsx)(`div`, {
            className: `grid gap-6 pt-16 sm:grid-cols-3`,
            children: _L.map((e) =>
              (0, q.jsxs)(
                `div`,
                {
                  className: `space-y-2`,
                  children: [
                    (0, q.jsx)(e.icon, { className: `size-5 text-primary` }),
                    (0, q.jsx)(`h3`, {
                      className: `font-medium`,
                      children: e.title,
                    }),
                    (0, q.jsx)(`p`, {
                      className: `text-sm text-muted-foreground`,
                      children: e.body,
                    }),
                  ],
                },
                e.title,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}
