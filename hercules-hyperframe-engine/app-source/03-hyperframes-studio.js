function bz(e) {
  return [
    { key: `storyboard`, label: `Storyboard`, status: e.steps.storyboard },
    { key: `narration`, label: `Voice`, status: e.steps.narration },
    ...e.actSteps.map((e, t) => ({
      key: `act-${t + 1}`,
      label: `Act ${t + 1}`,
      status: e,
    })),
    { key: `assemble`, label: `Assemble`, status: e.steps.assemble },
  ];
}
function xz(e) {
  let t = bz(e);
  return (
    t.reduce(
      (e, t) =>
        e + (t.status === `pending` ? 0 : t.status === `working` ? 0.5 : 1),
      0,
    ) / t.length
  );
}
function Sz(e) {
  return e === `queued` || e === `running`;
}
function Cz(e) {
  if (e === void 0) return `--:--`;
  let t = Math.round(e);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, `0`)}`;
}
var wz = [205, 285, 160, 30, 330, 250];
function Tz(e) {
  let t = 0;
  for (let n of e) t = (t * 31 + n.charCodeAt(0)) | 0;
  return wz[Math.abs(t) % wz.length];
}
function Ez(e, t) {
  if (e instanceof ca) {
    let t = e.data;
    if (
      t &&
      typeof t == `object` &&
      `message` in t &&
      typeof t.message == `string`
    )
      return t.message;
  }
  return t;
}
var Dz = Eu({
    topic: Ql()
      .trim()
      .min(3, `Use at least 3 characters`)
      .max(200, `Keep it under 200 characters`),
  }),
  Oz = [
    `How transformers pay attention`,
    `Why the sky is blue`,
    `Fourier transforms in 60 seconds`,
    `How black holes bend light`,
  ];
function kz({ disabled: e }) {
  let t = kp(gE.hyperframes.compositions.start),
    [n, r] = (0, w.useState)(!1),
    i = lz({ resolver: yz(Dz), defaultValues: { topic: `` } }),
    a = sR({ control: i.control, name: `topic` }),
    o = i.formState.errors.topic?.message,
    s = async (e) => {
      r(!0);
      try {
        (await t({ topic: e.topic }),
          i.reset(),
          cg.success(`Your video is in production`));
      } catch (e) {
        cg.error(Ez(e, `Could not start the video`));
      } finally {
        r(!1);
      }
    },
    c = e || n;
  return (0, q.jsxs)(`form`, {
    onSubmit: i.handleSubmit(s),
    className: `space-y-4`,
    children: [
      (0, q.jsxs)(`div`, {
        className: dE(
          `group relative rounded-2xl border bg-card p-2 shadow-sm transition-shadow focus-within:shadow-lg focus-within:ring-2 focus-within:ring-ring/40`,
          o && `border-destructive`,
        ),
        children: [
          (0, q.jsx)(`label`, {
            htmlFor: `topic`,
            className: `sr-only`,
            children: `Video topic`,
          }),
          (0, q.jsx)(`textarea`, {
            id: `topic`,
            rows: 2,
            maxLength: 200,
            placeholder: `Explain how vaccines train the immune system`,
            className: `w-full resize-none bg-transparent px-3 pt-3 pb-12 text-lg leading-snug outline-none placeholder:text-muted-foreground/70 sm:text-xl`,
            onKeyDown: (e) => {
              e.key === `Enter` &&
                !e.shiftKey &&
                (e.preventDefault(), i.handleSubmit(s)());
            },
            ...i.register(`topic`),
          }),
          (0, q.jsxs)(`div`, {
            className: `absolute right-2 bottom-2 left-3 flex items-center justify-between gap-3`,
            children: [
              (0, q.jsxs)(`span`, {
                className: `font-mono text-[11px] text-muted-foreground`,
                children: [a.length, `/`, 200],
              }),
              (0, q.jsxs)(SE, {
                type: `submit`,
                disabled: c,
                className: `cursor-pointer rounded-xl`,
                children: [
                  n ? (0, q.jsx)(_E, {}) : null,
                  `Make video`,
                  (0, q.jsx)(Eh, { className: `size-4` }),
                ],
              }),
            ],
          }),
        ],
      }),
      o
        ? (0, q.jsx)(`p`, {
            className: `text-sm text-destructive`,
            children: o,
          })
        : null,
      e
        ? (0, q.jsx)(`p`, {
            className: `text-sm text-muted-foreground`,
            children: `You have 3 videos in production. A slot opens when one finishes.`,
          })
        : null,
      (0, q.jsx)(`div`, {
        className: `flex flex-wrap gap-2`,
        children: Oz.map((e) =>
          (0, q.jsx)(
            `button`,
            {
              type: `button`,
              onClick: () => i.setValue(`topic`, e, { shouldValidate: !0 }),
              className: `cursor-pointer rounded-full border border-border bg-background/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground`,
              children: e,
            },
            e,
          ),
        ),
      }),
    ],
  });
}
var Az = 365.2425,
  jz = 43200,
  Mz = 1440,
  Nz = 86400;
(Nz * 7, ((Nz * Az) / 12) * 3);
var Pz = Symbol.for(`constructDateFrom`);
function Fz(e, t) {
  return typeof e == `function`
    ? e(t)
    : e && typeof e == `object` && Pz in e
      ? e[Pz](t)
      : e instanceof Date
        ? new e.constructor(t)
        : new Date(t);
}
function Iz(e, t) {
  return Fz(t || e, e);
}
var Lz = {};
function Rz() {
  return Lz;
}
function zz(e) {
  let t = Iz(e),
    n = new Date(
      Date.UTC(
        t.getFullYear(),
        t.getMonth(),
        t.getDate(),
        t.getHours(),
        t.getMinutes(),
        t.getSeconds(),
        t.getMilliseconds(),
      ),
    );
  return (n.setUTCFullYear(t.getFullYear()), e - +n);
}
function Bz(e, ...t) {
  let n = Fz.bind(null, e || t.find((e) => typeof e == `object`));
  return t.map(n);
}
function Vz(e, t) {
  let n = Iz(e) - +Iz(t);
  return n < 0 ? -1 : n > 0 ? 1 : n;
}
function Hz(e) {
  return Fz(e, Date.now());
}
function Uz(e, t, n) {
  let [r, i] = Bz(n?.in, e, t),
    a = r.getFullYear() - i.getFullYear(),
    o = r.getMonth() - i.getMonth();
  return a * 12 + o;
}
function Wz(e) {
  return (t) => {
    let n = (e ? Math[e] : Math.trunc)(t);
    return n === 0 ? 0 : n;
  };
}
function Gz(e, t) {
  return Iz(e) - +Iz(t);
}
function Kz(e, t) {
  let n = Iz(e, t?.in);
  return (n.setHours(23, 59, 59, 999), n);
}
function qz(e, t) {
  let n = Iz(e, t?.in),
    r = n.getMonth();
  return (
    n.setFullYear(n.getFullYear(), r + 1, 0),
    n.setHours(23, 59, 59, 999),
    n
  );
}
function Jz(e, t) {
  let n = Iz(e, t?.in);
  return +Kz(n, t) == +qz(n, t);
}
function Yz(e, t, n) {
  let [r, i, a] = Bz(n?.in, e, e, t),
    o = Vz(i, a),
    s = Math.abs(Uz(i, a));
  if (s < 1) return 0;
  (i.getMonth() === 1 && i.getDate() > 27 && i.setDate(30),
    i.setMonth(i.getMonth() - o * s));
  let c = Vz(i, a) === -o;
  Jz(r) && s === 1 && Vz(r, a) === 1 && (c = !1);
  let l = o * (s - +c);
  return l === 0 ? 0 : l;
}
function Xz(e, t, n) {
  let r = Gz(e, t) / 1e3;
  return Wz(n?.roundingMethod)(r);
}
var Zz = {
    lessThanXSeconds: {
      one: `less than a second`,
      other: `less than {{count}} seconds`,
    },
    xSeconds: { one: `1 second`, other: `{{count}} seconds` },
    halfAMinute: `half a minute`,
    lessThanXMinutes: {
      one: `less than a minute`,
      other: `less than {{count}} minutes`,
    },
    xMinutes: { one: `1 minute`, other: `{{count}} minutes` },
    aboutXHours: { one: `about 1 hour`, other: `about {{count}} hours` },
    xHours: { one: `1 hour`, other: `{{count}} hours` },
    xDays: { one: `1 day`, other: `{{count}} days` },
    aboutXWeeks: { one: `about 1 week`, other: `about {{count}} weeks` },
    xWeeks: { one: `1 week`, other: `{{count}} weeks` },
    aboutXMonths: { one: `about 1 month`, other: `about {{count}} months` },
    xMonths: { one: `1 month`, other: `{{count}} months` },
    aboutXYears: { one: `about 1 year`, other: `about {{count}} years` },
    xYears: { one: `1 year`, other: `{{count}} years` },
    overXYears: { one: `over 1 year`, other: `over {{count}} years` },
    almostXYears: { one: `almost 1 year`, other: `almost {{count}} years` },
  },
  Qz = (e, t, n) => {
    let r,
      i = Zz[e];
    return (
      (r =
        typeof i == `string`
          ? i
          : t === 1
            ? i.one
            : i.other.replace(`{{count}}`, t.toString())),
      n?.addSuffix
        ? n.comparison && n.comparison > 0
          ? `in ` + r
          : r + ` ago`
        : r
    );
  };
function $z(e) {
  return (t = {}) => {
    let n = t.width ? String(t.width) : e.defaultWidth;
    return e.formats[n] || e.formats[e.defaultWidth];
  };
}
var eB = {
    date: $z({
      formats: {
        full: `EEEE, MMMM do, y`,
        long: `MMMM do, y`,
        medium: `MMM d, y`,
        short: `MM/dd/yyyy`,
      },
      defaultWidth: `full`,
    }),
    time: $z({
      formats: {
        full: `h:mm:ss a zzzz`,
        long: `h:mm:ss a z`,
        medium: `h:mm:ss a`,
        short: `h:mm a`,
      },
      defaultWidth: `full`,
    }),
    dateTime: $z({
      formats: {
        full: `{{date}} 'at' {{time}}`,
        long: `{{date}} 'at' {{time}}`,
        medium: `{{date}}, {{time}}`,
        short: `{{date}}, {{time}}`,
      },
      defaultWidth: `full`,
    }),
  },
  tB = {
    lastWeek: `'last' eeee 'at' p`,
    yesterday: `'yesterday at' p`,
    today: `'today at' p`,
    tomorrow: `'tomorrow at' p`,
    nextWeek: `eeee 'at' p`,
    other: `P`,
  },
  nB = (e, t, n, r) => tB[e];
function rB(e) {
  return (t, n) => {
    let r = n?.context ? String(n.context) : `standalone`,
      i;
    if (r === `formatting` && e.formattingValues) {
      let t = e.defaultFormattingWidth || e.defaultWidth,
        r = n?.width ? String(n.width) : t;
      i = e.formattingValues[r] || e.formattingValues[t];
    } else {
      let t = e.defaultWidth,
        r = n?.width ? String(n.width) : e.defaultWidth;
      i = e.values[r] || e.values[t];
    }
    let a = e.argumentCallback ? e.argumentCallback(t) : t;
    return i[a];
  };
}
var iB = {
  ordinalNumber: (e, t) => {
    let n = Number(e),
      r = n % 100;
    if (r > 20 || r < 10)
      switch (r % 10) {
        case 1:
          return n + `st`;
        case 2:
          return n + `nd`;
        case 3:
          return n + `rd`;
      }
    return n + `th`;
  },
  era: rB({
    values: {
      narrow: [`B`, `A`],
      abbreviated: [`BC`, `AD`],
      wide: [`Before Christ`, `Anno Domini`],
    },
    defaultWidth: `wide`,
  }),
  quarter: rB({
    values: {
      narrow: [`1`, `2`, `3`, `4`],
      abbreviated: [`Q1`, `Q2`, `Q3`, `Q4`],
      wide: [`1st quarter`, `2nd quarter`, `3rd quarter`, `4th quarter`],
    },
    defaultWidth: `wide`,
    argumentCallback: (e) => e - 1,
  }),
  month: rB({
    values: {
      narrow: [`J`, `F`, `M`, `A`, `M`, `J`, `J`, `A`, `S`, `O`, `N`, `D`],
      abbreviated: [
        `Jan`,
        `Feb`,
        `Mar`,
        `Apr`,
        `May`,
        `Jun`,
        `Jul`,
        `Aug`,
        `Sep`,
        `Oct`,
        `Nov`,
        `Dec`,
      ],
      wide: [
        `January`,
        `February`,
        `March`,
        `April`,
        `May`,
        `June`,
        `July`,
        `August`,
        `September`,
        `October`,
        `November`,
        `December`,
      ],
    },
    defaultWidth: `wide`,
  }),
  day: rB({
    values: {
      narrow: [`S`, `M`, `T`, `W`, `T`, `F`, `S`],
      short: [`Su`, `Mo`, `Tu`, `We`, `Th`, `Fr`, `Sa`],
      abbreviated: [`Sun`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`],
      wide: [
        `Sunday`,
        `Monday`,
        `Tuesday`,
        `Wednesday`,
        `Thursday`,
        `Friday`,
        `Saturday`,
      ],
    },
    defaultWidth: `wide`,
  }),
  dayPeriod: rB({
    values: {
      narrow: {
        am: `a`,
        pm: `p`,
        midnight: `mi`,
        noon: `n`,
        morning: `morning`,
        afternoon: `afternoon`,
        evening: `evening`,
        night: `night`,
      },
      abbreviated: {
        am: `AM`,
        pm: `PM`,
        midnight: `midnight`,
        noon: `noon`,
        morning: `morning`,
        afternoon: `afternoon`,
        evening: `evening`,
        night: `night`,
      },
      wide: {
        am: `a.m.`,
        pm: `p.m.`,
        midnight: `midnight`,
        noon: `noon`,
        morning: `morning`,
        afternoon: `afternoon`,
        evening: `evening`,
        night: `night`,
      },
    },
    defaultWidth: `wide`,
    formattingValues: {
      narrow: {
        am: `a`,
        pm: `p`,
        midnight: `mi`,
        noon: `n`,
        morning: `in the morning`,
        afternoon: `in the afternoon`,
        evening: `in the evening`,
        night: `at night`,
      },
      abbreviated: {
        am: `AM`,
        pm: `PM`,
        midnight: `midnight`,
        noon: `noon`,
        morning: `in the morning`,
        afternoon: `in the afternoon`,
        evening: `in the evening`,
        night: `at night`,
      },
      wide: {
        am: `a.m.`,
        pm: `p.m.`,
        midnight: `midnight`,
        noon: `noon`,
        morning: `in the morning`,
        afternoon: `in the afternoon`,
        evening: `in the evening`,
        night: `at night`,
      },
    },
    defaultFormattingWidth: `wide`,
  }),
};
function aB(e) {
  return (t, n = {}) => {
    let r = n.width,
      i = (r && e.matchPatterns[r]) || e.matchPatterns[e.defaultMatchWidth],
      a = t.match(i);
    if (!a) return null;
    let o = a[0],
      s = (r && e.parsePatterns[r]) || e.parsePatterns[e.defaultParseWidth],
      c = Array.isArray(s) ? sB(s, (e) => e.test(o)) : oB(s, (e) => e.test(o)),
      l;
    ((l = e.valueCallback ? e.valueCallback(c) : c),
      (l = n.valueCallback ? n.valueCallback(l) : l));
    let u = t.slice(o.length);
    return { value: l, rest: u };
  };
}
function oB(e, t) {
  for (let n in e)
    if (Object.prototype.hasOwnProperty.call(e, n) && t(e[n])) return n;
}
function sB(e, t) {
  for (let n = 0; n < e.length; n++) if (t(e[n])) return n;
}
function cB(e) {
  return (t, n = {}) => {
    let r = t.match(e.matchPattern);
    if (!r) return null;
    let i = r[0],
      a = t.match(e.parsePattern);
    if (!a) return null;
    let o = e.valueCallback ? e.valueCallback(a[0]) : a[0];
    o = n.valueCallback ? n.valueCallback(o) : o;
    let s = t.slice(i.length);
    return { value: o, rest: s };
  };
}
var lB = {
  code: `en-US`,
  formatDistance: Qz,
  formatLong: eB,
  formatRelative: nB,
  localize: iB,
  match: {
    ordinalNumber: cB({
      matchPattern: /^(\d+)(th|st|nd|rd)?/i,
      parsePattern: /\d+/i,
      valueCallback: (e) => parseInt(e, 10),
    }),
    era: aB({
      matchPatterns: {
        narrow: /^(b|a)/i,
        abbreviated:
          /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
        wide: /^(before christ|before common era|anno domini|common era)/i,
      },
      defaultMatchWidth: `wide`,
      parsePatterns: { any: [/^b/i, /^(a|c)/i] },
      defaultParseWidth: `any`,
    }),
    quarter: aB({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^q[1234]/i,
        wide: /^[1234](th|st|nd|rd)? quarter/i,
      },
      defaultMatchWidth: `wide`,
      parsePatterns: { any: [/1/i, /2/i, /3/i, /4/i] },
      defaultParseWidth: `any`,
      valueCallback: (e) => e + 1,
    }),
    month: aB({
      matchPatterns: {
        narrow: /^[jfmasond]/i,
        abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
        wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      },
      defaultMatchWidth: `wide`,
      parsePatterns: {
        narrow: [
          /^j/i,
          /^f/i,
          /^m/i,
          /^a/i,
          /^m/i,
          /^j/i,
          /^j/i,
          /^a/i,
          /^s/i,
          /^o/i,
          /^n/i,
          /^d/i,
        ],
        any: [
          /^ja/i,
          /^f/i,
          /^mar/i,
          /^ap/i,
          /^may/i,
          /^jun/i,
          /^jul/i,
          /^au/i,
          /^s/i,
          /^o/i,
          /^n/i,
          /^d/i,
        ],
      },
      defaultParseWidth: `any`,
    }),
    day: aB({
      matchPatterns: {
        narrow: /^[smtwf]/i,
        short: /^(su|mo|tu|we|th|fr|sa)/i,
        abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
        wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
      },
      defaultMatchWidth: `wide`,
      parsePatterns: {
        narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
        any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
      },
      defaultParseWidth: `any`,
    }),
    dayPeriod: aB({
      matchPatterns: {
        narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
        any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
      },
      defaultMatchWidth: `any`,
      parsePatterns: {
        any: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /^mi/i,
          noon: /^no/i,
          morning: /morning/i,
          afternoon: /afternoon/i,
          evening: /evening/i,
          night: /night/i,
        },
      },
      defaultParseWidth: `any`,
    }),
  },
  options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
};
function uB(e, t, n) {
  let r = Rz(),
    i = n?.locale ?? r.locale ?? lB,
    a = Vz(e, t);
  if (isNaN(a)) throw RangeError(`Invalid time value`);
  let o = Object.assign({}, n, { addSuffix: n?.addSuffix, comparison: a }),
    [s, c] = Bz(n?.in, ...(a > 0 ? [t, e] : [e, t])),
    l = Xz(c, s),
    u = (zz(c) - zz(s)) / 1e3,
    d = Math.round((l - u) / 60),
    f;
  if (d < 2)
    return n?.includeSeconds
      ? l < 5
        ? i.formatDistance(`lessThanXSeconds`, 5, o)
        : l < 10
          ? i.formatDistance(`lessThanXSeconds`, 10, o)
          : l < 20
            ? i.formatDistance(`lessThanXSeconds`, 20, o)
            : l < 40
              ? i.formatDistance(`halfAMinute`, 0, o)
              : l < 60
                ? i.formatDistance(`lessThanXMinutes`, 1, o)
                : i.formatDistance(`xMinutes`, 1, o)
      : d === 0
        ? i.formatDistance(`lessThanXMinutes`, 1, o)
        : i.formatDistance(`xMinutes`, d, o);
  if (d < 45) return i.formatDistance(`xMinutes`, d, o);
  if (d < 90) return i.formatDistance(`aboutXHours`, 1, o);
  if (d < 1440) {
    let e = Math.round(d / 60);
    return i.formatDistance(`aboutXHours`, e, o);
  }
  if (d < 2520) return i.formatDistance(`xDays`, 1, o);
  if (d < 43200) {
    let e = Math.round(d / Mz);
    return i.formatDistance(`xDays`, e, o);
  }
  if (d < 86400)
    return ((f = Math.round(d / jz)), i.formatDistance(`aboutXMonths`, f, o));
  if (((f = Yz(c, s)), f < 12)) {
    let e = Math.round(d / jz);
    return i.formatDistance(`xMonths`, e, o);
  }
  {
    let e = f % 12,
      t = Math.trunc(f / 12);
    return e < 3
      ? i.formatDistance(`aboutXYears`, t, o)
      : e < 9
        ? i.formatDistance(`overXYears`, t, o)
        : i.formatDistance(`almostXYears`, t + 1, o);
  }
}
function dB(e, t) {
  return uB(e, Hz(e), t);
}
function fB({ className: e, ...t }) {
  return (0, q.jsx)(`div`, {
    "data-slot": `card`,
    className: dE(
      `flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm`,
      e,
    ),
    ...t,
  });
}
function pB({ className: e, value: t, ...n }) {
  return (0, q.jsx)(gw, {
    "data-slot": `progress`,
    className: dE(
      `relative h-2 w-full overflow-hidden rounded-full bg-primary/20`,
      e,
    ),
    ...n,
    children: (0, q.jsx)(_w, {
      "data-slot": `progress-indicator`,
      className: `h-full w-full flex-1 bg-primary transition-all`,
      style: { transform: `translateX(-${100 - (t || 0)}%)` },
    }),
  });
}
function mB({ ...e }) {
  return (0, q.jsx)(Lb, { "data-slot": `alert-dialog`, ...e });
}
function hB({ ...e }) {
  return (0, q.jsx)(Rb, { "data-slot": `alert-dialog-trigger`, ...e });
}
function gB({ ...e }) {
  return (0, q.jsx)(zb, { "data-slot": `alert-dialog-portal`, ...e });
}
function _B({ className: e, ...t }) {
  return (0, q.jsx)(Bb, {
    "data-slot": `alert-dialog-overlay`,
    className: dE(
      `fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0`,
      e,
    ),
    ...t,
  });
}
function vB({ className: e, size: t = `default`, ...n }) {
  return (0, q.jsxs)(gB, {
    children: [
      (0, q.jsx)(_B, {}),
      (0, q.jsx)(Vb, {
        "data-slot": `alert-dialog-content`,
        "data-size": t,
        className: dE(
          `group/alert-dialog-content fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[size=sm]:max-w-xs data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[size=default]:sm:max-w-lg`,
          e,
        ),
        ...n,
      }),
    ],
  });
}
function yB({ className: e, ...t }) {
  return (0, q.jsx)(`div`, {
    "data-slot": `alert-dialog-header`,
    className: dE(
      `grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]`,
      e,
    ),
    ...t,
  });
}
function bB({ className: e, ...t }) {
  return (0, q.jsx)(`div`, {
    "data-slot": `alert-dialog-footer`,
    className: dE(
      `flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end`,
      e,
    ),
    ...t,
  });
}
function xB({ className: e, ...t }) {
  return (0, q.jsx)(Wb, {
    "data-slot": `alert-dialog-title`,
    className: dE(
      `text-lg font-semibold sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2`,
      e,
    ),
    ...t,
  });
}
function SB({ className: e, ...t }) {
  return (0, q.jsx)(Gb, {
    "data-slot": `alert-dialog-description`,
    className: dE(`text-sm text-muted-foreground`, e),
    ...t,
  });
}
function CB({
  className: e,
  variant: t = `default`,
  size: n = `default`,
  ...r
}) {
  return (0, q.jsx)(SE, {
    variant: t,
    size: n,
    asChild: !0,
    children: (0, q.jsx)(Hb, {
      "data-slot": `alert-dialog-action`,
      className: dE(e),
      ...r,
    }),
  });
}
function wB({
  className: e,
  variant: t = `outline`,
  size: n = `default`,
  ...r
}) {
  return (0, q.jsx)(SE, {
    variant: t,
    size: n,
    asChild: !0,
    children: (0, q.jsx)(Ub, {
      "data-slot": `alert-dialog-cancel`,
      className: dE(e),
      ...r,
    }),
  });
}
function TB({ compositionId: e, label: t, onDeleted: n }) {
  let r = kp(gE.hyperframes.compositions.remove),
    [i, a] = (0, w.useState)(!1);
  return (0, q.jsxs)(mB, {
    children: [
      (0, q.jsx)(hB, {
        asChild: !0,
        children: (0, q.jsx)(SE, {
          variant: `ghost`,
          size: `icon`,
          className: `size-8 cursor-pointer`,
          "aria-label": `Delete ${t}`,
          children: (0, q.jsx)(Uh, { className: `size-4` }),
        }),
      }),
      (0, q.jsxs)(vB, {
        children: [
          (0, q.jsxs)(yB, {
            children: [
              (0, q.jsx)(xB, { children: `Delete this video?` }),
              (0, q.jsx)(SB, {
                children: `"${t}" and its voice tracks will be removed for good.`,
              }),
            ],
          }),
          (0, q.jsxs)(bB, {
            children: [
              (0, q.jsx)(wB, {
                className: `cursor-pointer`,
                children: `Keep it`,
              }),
              (0, q.jsx)(CB, {
                onClick: async () => {
                  a(!0);
                  try {
                    (await r({ compositionId: e }),
                      cg.success(`Video deleted`),
                      n?.());
                  } catch (e) {
                    cg.error(Ez(e, `Could not delete the video`));
                  } finally {
                    a(!1);
                  }
                },
                disabled: i,
                className: `cursor-pointer bg-destructive text-white hover:bg-destructive/90`,
                children: `Delete`,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
var EB = {
  pending: `border-border text-muted-foreground`,
  working: `border-primary text-primary`,
  done: `border-primary bg-primary text-primary-foreground`,
  fallback: `border-accent bg-accent text-accent-foreground`,
};
function DB({ status: e }) {
  return e === `done`
    ? (0, q.jsx)(Oh, { className: `size-3.5` })
    : e === `fallback`
      ? (0, q.jsx)(Hh, { className: `size-3.5` })
      : e === `working`
        ? (0, q.jsx)(gL.span, {
            className: `size-2 rounded-full bg-primary`,
            animate: { scale: [1, 1.6, 1], opacity: [1, 0.4, 1] },
            transition: { duration: 1.2, repeat: 1 / 0, ease: `easeInOut` },
          })
        : (0, q.jsx)(Ah, { className: `size-3.5` });
}
function OB({ composition: e }) {
  let t = bz(e);
  return (0, q.jsx)(`ol`, {
    className: `grid grid-cols-6 gap-1.5`,
    children: t.map((e, n) =>
      (0, q.jsxs)(
        `li`,
        {
          className: `flex min-w-0 flex-col items-center gap-2`,
          children: [
            (0, q.jsxs)(`div`, {
              className: `flex w-full items-center`,
              children: [
                (0, q.jsx)(`span`, {
                  className: dE(
                    `h-px flex-1`,
                    n === 0 ? `bg-transparent` : `bg-border`,
                  ),
                }),
                (0, q.jsx)(`span`, {
                  className: dE(
                    `flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors`,
                    EB[e.status],
                  ),
                  title:
                    e.status === `fallback`
                      ? `Used a built-in backup`
                      : e.status,
                  children: (0, q.jsx)(DB, { status: e.status }),
                }),
                (0, q.jsx)(`span`, {
                  className: dE(
                    `h-px flex-1`,
                    n === t.length - 1 ? `bg-transparent` : `bg-border`,
                  ),
                }),
              ],
            }),
            (0, q.jsx)(`span`, {
              className: dE(
                `w-full truncate text-center font-mono text-[10px] uppercase tracking-wider`,
                e.status === `pending`
                  ? `text-muted-foreground`
                  : `text-foreground`,
              ),
              children: e.label,
            }),
          ],
        },
        e.key,
      ),
    ),
  });
}
function kB({ composition: e }) {
  let t = Tz(e._id);
  return (0, q.jsxs)(`div`, {
    className: `relative aspect-video overflow-hidden rounded-t-xl`,
    style: {
      background: `radial-gradient(circle at 25% 30%, oklch(0.7 0.16 ${t} / 0.9), transparent 55%), radial-gradient(circle at 80% 75%, oklch(0.6 0.18 ${t + 70} / 0.8), transparent 50%), oklch(0.18 0.03 ${t + 40})`,
    },
    children: [
      (0, q.jsx)(`div`, {
        className: `absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(255,255,255,.08)_95%),linear-gradient(90deg,transparent_95%,rgba(255,255,255,.08)_95%)] bg-[size:24px_24px]`,
      }),
      (0, q.jsx)(`div`, {
        className: `absolute top-3 left-3 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white/80`,
        children: `3 acts`,
      }),
      (0, q.jsx)(`div`, {
        className: `absolute right-3 bottom-3 rounded bg-black/50 px-1.5 py-0.5 font-mono text-xs text-white`,
        children: Cz(e.totalDurationSec),
      }),
      (0, q.jsx)(`div`, {
        className: `absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100`,
        children: (0, q.jsx)(`span`, {
          className: `flex size-14 items-center justify-center rounded-full bg-white/90 text-black shadow-xl`,
          children: (0, q.jsx)(Bh, {
            className: `size-6 translate-x-0.5 fill-current`,
          }),
        }),
      }),
    ],
  });
}
function AB({ composition: e }) {
  let t = e.title ?? e.topic;
  return (0, q.jsxs)(fB, {
    className: `group relative gap-0 overflow-hidden pt-0 pb-0 transition-shadow hover:shadow-lg`,
    children: [
      (0, q.jsx)(wn, {
        to: `/watch/${e._id}`,
        className: `cursor-pointer`,
        "aria-label": `Play ${t}`,
        children: (0, q.jsx)(kB, { composition: e }),
      }),
      (0, q.jsxs)(`div`, {
        className: `flex items-start justify-between gap-2 p-4`,
        children: [
          (0, q.jsxs)(wn, {
            to: `/watch/${e._id}`,
            className: `min-w-0 cursor-pointer`,
            children: [
              (0, q.jsx)(`h3`, {
                className: `truncate font-medium`,
                children: t,
              }),
              (0, q.jsx)(`p`, {
                className: `truncate text-xs text-muted-foreground`,
                children: dB(new Date(e.createdAt), { addSuffix: !0 }),
              }),
            ],
          }),
          (0, q.jsx)(TB, { compositionId: e._id, label: t }),
        ],
      }),
    ],
  });
}
function jB({ composition: e }) {
  return (0, q.jsxs)(fB, {
    className: `gap-3 border-destructive/40 p-4`,
    children: [
      (0, q.jsxs)(`div`, {
        className: `flex items-start justify-between gap-2`,
        children: [
          (0, q.jsxs)(`div`, {
            className: `flex min-w-0 items-start gap-3`,
            children: [
              (0, q.jsx)(Wh, {
                className: `mt-0.5 size-4 shrink-0 text-destructive`,
              }),
              (0, q.jsxs)(`div`, {
                className: `min-w-0`,
                children: [
                  (0, q.jsx)(`h3`, {
                    className: `truncate font-medium`,
                    children: e.topic,
                  }),
                  (0, q.jsx)(`p`, {
                    className: `text-sm text-muted-foreground`,
                    children: `This video could not be finished.`,
                  }),
                ],
              }),
            ],
          }),
          (0, q.jsx)(TB, { compositionId: e._id, label: e.topic }),
        ],
      }),
      e.error
        ? (0, q.jsxs)(`details`, {
            className: `text-xs text-muted-foreground`,
            children: [
              (0, q.jsx)(`summary`, {
                className: `cursor-pointer`,
                children: `Details`,
              }),
              (0, q.jsx)(`p`, {
                className: `pt-1 break-words`,
                children: e.error,
              }),
            ],
          })
        : null,
    ],
  });
}
function MB({ composition: e }) {
  let t = xz(e);
  return (0, q.jsx)(gL.div, {
    layout: !0,
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    children: (0, q.jsxs)(fB, {
      className: `gap-5 p-5`,
      children: [
        (0, q.jsxs)(`div`, {
          className: `flex items-start justify-between gap-3`,
          children: [
            (0, q.jsxs)(`div`, {
              className: `min-w-0`,
              children: [
                (0, q.jsx)(`p`, {
                  className: `font-mono text-[10px] uppercase tracking-widest text-primary`,
                  children: e.status === `queued` ? `Queued` : `In production`,
                }),
                (0, q.jsx)(`h3`, {
                  className: `truncate text-lg font-medium`,
                  children: e.topic,
                }),
              ],
            }),
            (0, q.jsxs)(`span`, {
              className: `font-mono text-sm text-muted-foreground`,
              children: [Math.round(t * 100), `%`],
            }),
          ],
        }),
        (0, q.jsx)(OB, { composition: e }),
        (0, q.jsx)(pB, { value: t * 100, className: `h-1` }),
      ],
    }),
  });
}
var NB = 3;
function PB({ children: e, count: t }) {
  return (0, q.jsxs)(`div`, {
    className: `flex items-baseline gap-3 pb-4`,
    children: [
      (0, q.jsx)(`h2`, {
        className: `font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground`,
        children: e,
      }),
      t === void 0
        ? null
        : (0, q.jsx)(`span`, {
            className: `font-mono text-xs text-muted-foreground/70`,
            children: t,
          }),
      (0, q.jsx)(`span`, { className: `h-px flex-1 bg-border` }),
    ],
  });
}
function FB() {
  let e = Op(gE.hyperframes.compositions.list, {}),
    t = e?.filter((e) => Sz(e.status)) ?? [],
    n = e?.filter((e) => e.status === `done`) ?? [],
    r = e?.filter((e) => e.status === `failed`) ?? [];
  return (0, q.jsxs)(`div`, {
    className: `mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6 sm:py-14`,
    children: [
      (0, q.jsxs)(`section`, {
        className: `mx-auto max-w-3xl space-y-6`,
        children: [
          (0, q.jsxs)(`div`, {
            className: `space-y-2`,
            children: [
              (0, q.jsxs)(`h1`, {
                className: `text-4xl font-semibold tracking-tight text-balance sm:text-5xl`,
                children: [
                  `What should we `,
                  (0, q.jsx)(`span`, {
                    className: `font-serif font-normal italic text-primary`,
                    children: `explain`,
                  }),
                  ` today?`,
                ],
              }),
              (0, q.jsx)(`p`, {
                className: `text-muted-foreground`,
                children: `Type a topic. A director plans three acts, records the voice, and animates each scene.`,
              }),
            ],
          }),
          (0, q.jsx)(kz, { disabled: t.length >= NB }),
        ],
      }),
      t.length > 0
        ? (0, q.jsxs)(`section`, {
            children: [
              (0, q.jsx)(PB, { count: t.length, children: `In production` }),
              (0, q.jsx)(`div`, {
                className: `grid gap-4 md:grid-cols-2`,
                children: (0, q.jsx)(bF, {
                  mode: `popLayout`,
                  children: t.map((e) =>
                    (0, q.jsx)(MB, { composition: e }, e._id),
                  ),
                }),
              }),
            ],
          })
        : null,
      (0, q.jsxs)(`section`, {
        children: [
          (0, q.jsx)(PB, { count: e ? n.length : void 0, children: `Library` }),
          e === void 0
            ? (0, q.jsx)(`div`, {
                className: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3`,
                children: Array.from({ length: 3 }).map((e, t) =>
                  (0, q.jsxs)(
                    `div`,
                    {
                      className: `space-y-3`,
                      children: [
                        (0, q.jsx)(OE, {
                          className: `aspect-video w-full rounded-xl`,
                        }),
                        (0, q.jsx)(OE, { className: `h-4 w-2/3` }),
                      ],
                    },
                    t,
                  ),
                ),
              })
            : n.length === 0 && r.length === 0
              ? (0, q.jsx)(bL, {
                  className: `border`,
                  children: (0, q.jsxs)(xL, {
                    children: [
                      (0, q.jsx)(CL, {
                        variant: `icon`,
                        children: (0, q.jsx)(jh, {}),
                      }),
                      (0, q.jsx)(wL, { children: `No videos yet` }),
                      (0, q.jsx)(TL, {
                        children: `Finished videos show up here. Start with a topic above.`,
                      }),
                    ],
                  }),
                })
              : (0, q.jsxs)(`div`, {
                  className: `grid gap-5 sm:grid-cols-2 lg:grid-cols-3`,
                  children: [
                    n.map((e) => (0, q.jsx)(AB, { composition: e }, e._id)),
                    r.map((e) => (0, q.jsx)(jB, { composition: e }, e._id)),
                  ],
                }),
        ],
      }),
    ],
  });
}
function IB() {
  return (0, q.jsxs)(`div`, {
    className: `min-h-screen bg-background`,
    children: [
      (0, q.jsx)(DE, {}),
      (0, q.jsxs)(`main`, {
        children: [
          (0, q.jsx)(Wp, {
            children: (0, q.jsxs)(`div`, {
              className: `mx-auto max-w-3xl space-y-4 px-4 py-14`,
              children: [
                (0, q.jsx)(OE, { className: `h-12 w-3/4` }),
                (0, q.jsx)(OE, { className: `h-28 w-full rounded-2xl` }),
              ],
            }),
          }),
          (0, q.jsx)(Up, { children: (0, q.jsx)(yL, {}) }),
          (0, q.jsx)(Hp, { children: (0, q.jsx)(FB, {}) }),
        ],
      }),
    ],
  });
}
function LB() {
  let e = lt();
  return (
    (0, w.useEffect)(() => {
      console.error(
        `404 Error: User attempted to access non-existent route:`,
        e.pathname,
      );
    }, [e.pathname]),
    (0, q.jsx)(`div`, {
      className: `min-h-screen flex items-center justify-center bg-background`,
      children: (0, q.jsxs)(`div`, {
        className: `text-center space-y-6`,
        children: [
          (0, q.jsxs)(`div`, {
            className: `space-y-2`,
            children: [
              (0, q.jsx)(`h1`, {
                className: `text-6xl font-bold text-muted-foreground`,
                children: `404`,
              }),
              (0, q.jsx)(`h2`, {
                className: `text-2xl font-semibold`,
                children: `Page Not Found`,
              }),
            ],
          }),
          (0, q.jsx)(`p`, {
            className: `text-lg text-muted-foreground max-w-md mx-auto`,
            children: `This page does not exist.`,
          }),
          (0, q.jsx)(`div`, {
            className: `pt-4`,
            children: (0, q.jsx)(SE, {
              asChild: !0,
              children: (0, q.jsx)(wn, { to: `/`, children: `Return to Home` }),
            }),
          }),
        ],
      }),
    })
  );
}
function RB({ ...e }) {
  return (0, q.jsx)(JC, { "data-slot": `popover`, ...e });
}
function zB({ ...e }) {
  return (0, q.jsx)(YC, { "data-slot": `popover-trigger`, ...e });
}
function BB({ className: e, align: t = `center`, sideOffset: n = 4, ...r }) {
  return (0, q.jsx)(XC, {
    children: (0, q.jsx)(ZC, {
      "data-slot": `popover-content`,
      align: t,
      sideOffset: n,
      className: dE(
        `z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95`,
        e,
      ),
      ...r,
    }),
  });
}
function VB() {
  let e = (0, w.useRef)(null),
    [t, n] = (0, w.useState)(!1);
  return (
    (0, w.useEffect)(() => {
      let e = () => n(!!document.fullscreenElement);
      return (
        document.addEventListener(`fullscreenchange`, e),
        () => document.removeEventListener(`fullscreenchange`, e)
      );
    }, []),
    {
      ref: e,
      isFull: t,
      toggle: async () => {
        document.fullscreenElement
          ? await document.exitFullscreen()
          : await e.current?.requestFullscreen?.();
      },
    }
  );
}
function HB({ composition: e }) {
  return (0, q.jsxs)(RB, {
    children: [
      (0, q.jsx)(zB, {
        asChild: !0,
        children: (0, q.jsx)(SE, {
          variant: `ghost`,
          size: `icon`,
          className: `size-9 cursor-pointer text-white hover:bg-white/10 hover:text-white`,
          "aria-label": `About this video`,
          children: (0, q.jsx)(Ph, { className: `size-4` }),
        }),
      }),
      (0, q.jsxs)(BB, {
        align: `end`,
        className: `w-80 space-y-3`,
        children: [
          (0, q.jsx)(`p`, {
            className: `font-mono text-[10px] uppercase tracking-widest text-muted-foreground`,
            children: `Topic`,
          }),
          (0, q.jsx)(`p`, { className: `text-sm`, children: e.topic }),
          (0, q.jsx)(`ol`, {
            className: `space-y-2 border-t pt-3`,
            children: e.scenes.map((e) =>
              (0, q.jsxs)(
                `li`,
                {
                  className: `flex items-baseline justify-between gap-3 text-sm`,
                  children: [
                    (0, q.jsxs)(`span`, {
                      className: `min-w-0 truncate`,
                      children: [
                        (0, q.jsxs)(`span`, {
                          className: `font-mono text-xs text-muted-foreground`,
                          children: [`Act `, e.actNumber, ` `],
                        }),
                        e.title,
                      ],
                    }),
                    (0, q.jsx)(`span`, {
                      className: `font-mono text-xs text-muted-foreground`,
                      children: Cz(e.startSec),
                    }),
                  ],
                },
                e.sceneId,
              ),
            ),
          }),
          e.storyboardSource && e.storyboardSource !== `ai`
            ? (0, q.jsx)(`p`, {
                className: `border-t pt-3 text-xs text-muted-foreground`,
                children: `Parts of this video use built-in backup visuals.`,
              })
            : null,
        ],
      }),
    ],
  });
}
function UB({ composition: e, onDeleted: t }) {
  let { ref: n, isFull: r, toggle: i } = VB(),
    a = e.title ?? e.topic;
  return (0, q.jsxs)(`div`, {
    ref: n,
    className: `flex h-svh flex-col bg-black text-white`,
    children: [
      (0, q.jsxs)(`div`, {
        className: `flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-3 sm:px-5`,
        children: [
          (0, q.jsx)(SE, {
            asChild: !0,
            variant: `ghost`,
            size: `icon`,
            className: `size-9 cursor-pointer text-white hover:bg-white/10 hover:text-white`,
            children: (0, q.jsx)(wn, {
              to: `/`,
              "aria-label": `Back to studio`,
              children: (0, q.jsx)(Th, { className: `size-4` }),
            }),
          }),
          (0, q.jsxs)(`div`, {
            className: `min-w-0 flex-1`,
            children: [
              (0, q.jsx)(`h1`, {
                className: `truncate text-sm font-medium sm:text-base`,
                children: a,
              }),
              (0, q.jsxs)(`p`, {
                className: `font-mono text-[10px] uppercase tracking-widest text-white/50`,
                children: [`3 acts / `, Cz(e.totalDurationSec)],
              }),
            ],
          }),
          (0, q.jsx)(HB, { composition: e }),
          (0, q.jsx)(`div`, {
            className: `text-white [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white`,
            children: (0, q.jsx)(TB, {
              compositionId: e._id,
              label: a,
              onDeleted: t,
            }),
          }),
          (0, q.jsx)(SE, {
            variant: `ghost`,
            size: `icon`,
            onClick: () => void i(),
            className: `size-9 cursor-pointer text-white hover:bg-white/10 hover:text-white`,
            "aria-label": r ? `Exit full screen` : `Full screen`,
            children: r
              ? (0, q.jsx)(Vh, { className: `size-4` })
              : (0, q.jsx)(Mh, { className: `size-4` }),
          }),
        ],
      }),
      e.masterHtmlUrl
        ? (0, q.jsx)(`iframe`, {
            title: a,
            src: e.masterHtmlUrl,
            sandbox: `allow-scripts`,
            allow: `autoplay; fullscreen`,
            className: `w-full flex-1 border-0 bg-black`,
          })
        : (0, q.jsx)(`div`, {
            className: `flex flex-1 items-center justify-center text-sm text-white/60`,
            children: `This video file is missing.`,
          }),
    ],
  });
}
function WB({ children: e }) {
  return (0, q.jsx)(`div`, {
    className: `flex min-h-svh items-center justify-center bg-background px-4`,
    children: e,
  });
}
function GB({ id: e }) {
  let t = ft(),
    n = Op(gE.hyperframes.compositions.get, { compositionId: e });
  return n === void 0
    ? (0, q.jsxs)(`div`, {
        className: `flex h-svh flex-col bg-black`,
        children: [
          (0, q.jsx)(`div`, { className: `h-14 border-b border-white/10` }),
          (0, q.jsx)(OE, { className: `m-6 flex-1 bg-white/10` }),
        ],
      })
    : n === null
      ? (0, q.jsx)(WB, {
          children: (0, q.jsxs)(bL, {
            children: [
              (0, q.jsxs)(xL, {
                children: [
                  (0, q.jsx)(CL, {
                    variant: `icon`,
                    children: (0, q.jsx)(Nh, {}),
                  }),
                  (0, q.jsx)(wL, { children: `Video not found` }),
                  (0, q.jsx)(TL, { children: `It may have been deleted.` }),
                ],
              }),
              (0, q.jsx)(EL, {
                children: (0, q.jsx)(SE, {
                  asChild: !0,
                  size: `sm`,
                  className: `cursor-pointer`,
                  children: (0, q.jsx)(wn, {
                    to: `/`,
                    children: `Back to studio`,
                  }),
                }),
              }),
            ],
          }),
        })
      : Sz(n.status) || n.status === `failed`
        ? (0, q.jsx)(WB, {
            children: (0, q.jsxs)(`div`, {
              className: `w-full max-w-lg space-y-6 text-center`,
              children: [
                (0, q.jsx)(`p`, {
                  className: `font-mono text-xs uppercase tracking-widest text-primary`,
                  children:
                    n.status === `failed`
                      ? `Could not finish`
                      : `Still in production`,
                }),
                (0, q.jsx)(`h1`, {
                  className: `text-2xl font-semibold text-balance`,
                  children: n.topic,
                }),
                (0, q.jsx)(OB, { composition: n }),
                (0, q.jsx)(SE, {
                  asChild: !0,
                  size: `sm`,
                  variant: `secondary`,
                  className: `cursor-pointer`,
                  children: (0, q.jsx)(wn, {
                    to: `/`,
                    children: `Back to studio`,
                  }),
                }),
              ],
            }),
          })
        : (0, q.jsx)(UB, {
            composition: n,
            onDeleted: () => t(`/`, { replace: !0 }),
          });
}
function KB() {
  let { id: e } = mt();
  return (0, q.jsxs)(q.Fragment, {
    children: [
      (0, q.jsx)(Wp, {
        children: (0, q.jsx)(`div`, { className: `h-svh bg-black` }),
      }),
      (0, q.jsx)(Up, {
        children: (0, q.jsx)(WB, {
          children: (0, q.jsxs)(bL, {
            children: [
              (0, q.jsxs)(xL, {
                children: [
                  (0, q.jsx)(wL, { children: `Sign in to watch` }),
                  (0, q.jsx)(TL, {
                    children: `Your videos are private to your account.`,
                  }),
                ],
              }),
              (0, q.jsx)(EL, { children: (0, q.jsx)(EE, { size: `sm` }) }),
            ],
          }),
        }),
      }),
      (0, q.jsx)(Hp, { children: e ? (0, q.jsx)(GB, { id: e }) : null }),
    ],
  });
}
function qB() {
  return (0, q.jsx)(pE, {
    children: (0, q.jsx)(Cn, {
      children: (0, q.jsxs)(Rt, {
        children: [
          (0, q.jsx)(It, { path: `/`, element: (0, q.jsx)(IB, {}) }),
          (0, q.jsx)(It, {
            path: `/auth/callback`,
            element: (0, q.jsx)(TE, {}),
          }),
          (0, q.jsx)(It, { path: `/watch/:id`, element: (0, q.jsx)(KB, {}) }),
          (0, q.jsx)(It, { path: `*`, element: (0, q.jsx)(LB, {}) }),
        ],
      }),
    }),
  });
}
(0, Fn.createRoot)(document.getElementById(`root`)).render((0, q.jsx)(qB, {}));
