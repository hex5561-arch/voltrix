import { n as e, r as t, t as n } from "./index-DCwt71jy.js";
var r = (...e) =>
    e
      .filter((e, t, n) => !!e && e.trim() !== `` && n.indexOf(e) === t)
      .join(` `)
      .trim(),
  i = (e) => e.replace(/([a-z0-9])([A-Z])/g, `$1-$2`).toLowerCase(),
  a = (e) =>
    e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) =>
      n ? n.toUpperCase() : t.toLowerCase(),
    ),
  o = (e) => {
    let t = a(e);
    return t.charAt(0).toUpperCase() + t.slice(1);
  },
  s = {
    xmlns: `http://www.w3.org/2000/svg`,
    width: 24,
    height: 24,
    viewBox: `0 0 24 24`,
    fill: `none`,
    stroke: `currentColor`,
    strokeWidth: 2,
    strokeLinecap: `round`,
    strokeLinejoin: `round`,
  },
  c = (e) => {
    for (let t in e)
      if (t.startsWith(`aria-`) || t === `role` || t === `title`) return !0;
    return !1;
  },
  l = t(e()),
  u = (0, l.forwardRef)(
    (
      {
        color: e = `currentColor`,
        size: t = 24,
        strokeWidth: n = 2,
        absoluteStrokeWidth: i,
        className: a = ``,
        children: o,
        iconNode: u,
        ...d
      },
      f,
    ) =>
      (0, l.createElement)(
        `svg`,
        {
          ref: f,
          ...s,
          width: t,
          height: t,
          stroke: e,
          strokeWidth: i ? (Number(n) * 24) / Number(t) : n,
          className: r(`lucide`, a),
          ...(!o && !c(d) && { "aria-hidden": `true` }),
          ...d,
        },
        [
          ...u.map(([e, t]) => (0, l.createElement)(e, t)),
          ...(Array.isArray(o) ? o : [o]),
        ],
      ),
  ),
  d = (e, t) => {
    let n = (0, l.forwardRef)(({ className: n, ...a }, s) =>
      (0, l.createElement)(u, {
        ref: s,
        iconNode: t,
        className: r(`lucide-${i(o(e))}`, `lucide-${e}`, n),
        ...a,
      }),
    );
    return ((n.displayName = o(e)), n);
  },
  f = d(`mic-off`, [
    [`path`, { d: `M12 19v3`, key: `npa21l` }],
    [`path`, { d: `M15 9.34V5a3 3 0 0 0-5.68-1.33`, key: `1gzdoj` }],
    [`path`, { d: `M16.95 16.95A7 7 0 0 1 5 12v-2`, key: `cqa7eg` }],
    [`path`, { d: `M18.89 13.23A7 7 0 0 0 19 12v-2`, key: `16hl24` }],
    [`path`, { d: `m2 2 20 20`, key: `1ooewy` }],
    [`path`, { d: `M9 9v3a3 3 0 0 0 5.12 2.12`, key: `r2i35w` }],
  ]),
  p = d(`mic`, [
    [`path`, { d: `M12 19v3`, key: `npa21l` }],
    [`path`, { d: `M19 10v2a7 7 0 0 1-14 0v-2`, key: `1vc78b` }],
    [
      `rect`,
      { x: `9`, y: `2`, width: `6`, height: `13`, rx: `3`, key: `s6n7sd` },
    ],
  ]),
  m = d(`phone-off`, [
    [
      `path`,
      {
        d: `M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272`,
        key: `1wngk7`,
      },
    ],
    [`path`, { d: `M22 2 2 22`, key: `y4kqgn` }],
    [
      `path`,
      {
        d: `M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473`,
        key: `10hv5p`,
      },
    ],
  ]),
  h = d(`phone`, [
    [
      `path`,
      {
        d: `M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384`,
        key: `9njp5v`,
      },
    ],
  ]),
  g = d(`play`, [
    [
      `path`,
      {
        d: `M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z`,
        key: `10ikf1`,
      },
    ],
  ]),
  _ = {
    status: `idle`,
    error: null,
    hasConnected: !1,
    finalized: null,
    muted: !1,
    playbackBlocked: !1,
  };
function v(e = {}) {
  let t = (0, l.useRef)(null),
    n = (0, l.useRef)(null),
    r = (0, l.useRef)(!1),
    i = (0, l.useRef)(e),
    [a, o] = (0, l.useState)(_);
  ((0, l.useEffect)(() => {
    i.current = e;
  }),
    (0, l.useEffect)(
      () => (
        (r.current = !0),
        () => {
          r.current = !1;
          let e = n.current;
          ((n.current = null), e?.stop());
        }
      ),
      [],
    ));
  let s = (0, l.useCallback)(() => {
      if (!r.current || n.current) return;
      let e = t.current;
      if (!e) {
        o((e) => ({ ...e, error: `Voice playback is not mounted.` }));
        return;
      }
      let a;
      try {
        ((a = new URL(i.current.url ?? `/api/live`, window.location.href)),
          a.protocol === `https:` && (a.protocol = `wss:`),
          a.protocol === `http:` && (a.protocol = `ws:`));
      } catch {
        o((e) => ({ ...e, error: `Invalid voice connection URL.` }));
        return;
      }
      let s = y({
        url: a.href,
        voice: i.current.voice,
        audio: e,
        onEvent(e) {
          if (!(!r.current || n.current !== s)) {
            e.type === `app.connected`
              ? o((e) => ({ ...e, status: `connected`, hasConnected: !0 }))
              : e.type === `app.stopping`
                ? o((e) => ({ ...e, status: `stopping`, playbackBlocked: !1 }))
                : e.type === `app.closed`
                  ? ((n.current = null),
                    o((t) => ({
                      ...t,
                      status: `closed`,
                      muted: !1,
                      playbackBlocked: !1,
                      finalized: e.finalized === !0,
                    })))
                  : e.type === `app.playback.blocked` ||
                      e.type === `app.playback.resumed`
                    ? o((t) => ({
                        ...t,
                        playbackBlocked: e.type === `app.playback.blocked`,
                      }))
                    : [`app.error`, `gateway.error`, `error`].includes(
                        e.type,
                      ) &&
                      o((t) => ({
                        ...t,
                        error: e.error?.message ?? `Voice request failed.`,
                      }));
            try {
              Promise.resolve(i.current.onEvent?.(e)).catch((e) => {
                console.error(`Live UI event handler failed`, e);
              });
            } catch (e) {
              console.error(`Live UI event handler failed`, e);
            }
          }
        },
      });
      ((n.current = s), o({ ..._, status: `connecting` }), s.start());
    }, []),
    c = (0, l.useCallback)(() => {
      n.current?.stop();
    }, []),
    u = (0, l.useCallback)((e) => {
      n.current?.setMuted(e) && o((t) => ({ ...t, muted: e }));
    }, []),
    d = (0, l.useCallback)(() => {
      n.current?.resumePlayback();
    }, []);
  return {
    ...a,
    audioRef: t,
    start: s,
    stop: c,
    setMuted: u,
    resumePlayback: d,
  };
}
function y(e) {
  let t = `idle`,
    n,
    r,
    i,
    a,
    o,
    s,
    c,
    l,
    u = 0,
    d = 0,
    f = !1,
    p = !1,
    m = !1;
  function h() {
    return t === `starting`;
  }
  function g(e) {
    n?.readyState === WebSocket.OPEN && n.send(JSON.stringify(e));
  }
  function _() {
    (a?.getTracks().forEach((e) => e.stop()),
      o &&
        e.audio.srcObject === o &&
        (e.audio.pause(), (e.audio.srcObject = null)));
  }
  function v() {
    t !== `closed` &&
      ((t = `closed`),
      clearInterval(s),
      clearTimeout(c),
      l?.(),
      window.removeEventListener(`pagehide`, y),
      _(),
      i?.close(),
      r?.close(),
      n?.close(),
      e.onEvent({ type: `app.closed`, finalized: p }));
  }
  function y() {
    if (t !== `stopping` && t !== `closed`) {
      t = `stopping`;
      try {
        g({ type: `session.close` });
      } catch {
        return v();
      }
      (_(),
        l?.(),
        clearInterval(s),
        clearTimeout(c),
        (c = setTimeout(v, 15e3)),
        e.onEvent({ type: `app.stopping` }),
        (!n || n.readyState !== WebSocket.OPEN) && v());
    }
  }
  function b(e) {
    return t !== `starting` && t !== `active`
      ? !1
      : ((m = e),
        a?.getAudioTracks().forEach((e) => {
          e.enabled = !m;
        }),
        !0);
  }
  async function x() {
    if (!((t !== `starting` && t !== `active`) || !e.audio.srcObject))
      try {
        (await e.audio.play(),
          (t === `starting` || t === `active`) &&
            e.onEvent({ type: `app.playback.resumed` }));
      } catch {
        (t === `starting` || t === `active`) &&
          e.onEvent({ type: `app.playback.blocked` });
      }
  }
  function S(n) {
    t !== `stopping` &&
      t !== `closed` &&
      (e.onEvent({ type: `app.error`, error: { message: n } }), y());
  }
  function C(n) {
    t !== `stopping` &&
      t !== `closed` &&
      e.onEvent({
        type: `app.error`,
        error: {
          message:
            {
              startup_timeout: `Voice startup timed out. Start a new call to retry.`,
              initial_heartbeat_timeout: `Voice media did not connect. Start a new call to retry.`,
              heartbeat_timeout: `Voice connection was lost. Start a new call to retry.`,
              gateway_shutdown: `The voice service restarted. Start a new call to reconnect.`,
              inactivity_timeout: `The voice call ended after inactivity.`,
              duration_limit: `The voice call reached its duration limit. Start a new call to continue.`,
            }[n ?? ``] ??
            `The voice call ended unexpectedly. Start a new call to retry.`,
        },
      });
  }
  function w() {
    return r?.connectionState === `connected` && i?.readyState === `open`;
  }
  function T() {
    if (t === `active`) {
      if (Date.now() - u >= 5e3) return S(`Voice control connection lost`);
      if (Date.now() - d >= 5e3) return S(`Voice media connection lost`);
      if (w())
        try {
          (g({ type: `gateway.heartbeat` }), (d = Date.now()));
        } catch {
          S(`Voice control connection failed`);
        }
    }
  }
  function E() {
    if (!(!f || !w()))
      if (h()) {
        if (
          ((t = `active`),
          clearTimeout(c),
          (u = Date.now()),
          (d = Date.now()),
          (s = setInterval(T, 1e3)),
          T(),
          t !== `active`)
        )
          return;
        (g({ type: `app.ready` }), e.onEvent({ type: `app.connected` }));
      } else T();
  }
  async function D(e) {
    if (!(!h() || !r)) {
      if (f || e.transport?.type !== `webrtc` || !e.transport.sdp)
        throw Error(`Invalid voice session answer`);
      ((f = !0),
        clearTimeout(c),
        (c = setTimeout(
          () =>
            S(
              `Voice media did not connect within 12 seconds. Start a new call to retry.`,
            ),
          12e3,
        )),
        await r.setRemoteDescription({ type: `answer`, sdp: e.transport.sdp }),
        E());
    }
  }
  async function O(e) {
    e.iceGatheringState !== `complete` &&
      (await new Promise((t, n) => {
        let r = setTimeout(
          () => i(Error(`Voice network setup timed out`)),
          1e4,
        );
        function i(i) {
          (clearTimeout(r),
            e.removeEventListener(`icegatheringstatechange`, a),
            (l = void 0),
            i ? n(i) : t());
        }
        function a() {
          e.iceGatheringState === `complete` && i();
        }
        ((l = () => i(Error(`Call ended`))),
          e.addEventListener(`icegatheringstatechange`, a),
          a());
      }));
  }
  async function ee() {
    if (t === `idle`) {
      ((t = `starting`), window.addEventListener(`pagehide`, y));
      try {
        let s = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: !0, noiseSuppression: !0 },
        });
        if (((a = s), !h())) {
          s.getTracks().forEach((e) => e.stop());
          return;
        }
        let l = new RTCPeerConnection();
        r = l;
        for (let e of s.getAudioTracks())
          ((e.enabled = !m), e.addEventListener(`ended`, y), l.addTrack(e, s));
        if (
          (l.addEventListener(`track`, ({ track: n }) => {
            t !== `stopping` &&
              t !== `closed` &&
              ((o = new MediaStream([n])), (e.audio.srcObject = o), x());
          }),
          l.addEventListener(`connectionstatechange`, () => {
            l.connectionState === `failed`
              ? S(`Voice media connection failed. Start a new call to retry.`)
              : l.connectionState === `closed`
                ? S(`Voice media connection closed`)
                : E();
          }),
          (i = l.createDataChannel(`oai-events`)),
          i.addEventListener(`open`, E),
          i.addEventListener(`message`, ({ data: e }) => {
            try {
              JSON.parse(e).type === `session.started` && E();
            } catch {
              S(`Invalid voice session event`);
            }
          }),
          i.addEventListener(`error`, () => S(`Voice media connection failed`)),
          i.addEventListener(`close`, y),
          await l.setLocalDescription(await l.createOffer()),
          !h() || (await O(l), !h()))
        )
          return;
        let d = l.localDescription?.sdp;
        if (!d) throw Error(`Missing voice session offer`);
        ((n = new WebSocket(e.url)),
          (c = setTimeout(() => S(`Voice session did not start`), 5e4)),
          (n.onopen = () => {
            if (!h()) return v();
            g({ type: `app.start`, sdp: d, voice: e.voice });
          }),
          (n.onmessage = ({ data: t }) => {
            try {
              let n = JSON.parse(t);
              if (n.type === `gateway.session.created`)
                D(n).catch(() => S(`Voice media negotiation failed`));
              else if (n.type === `session.started`) E();
              else if (n.type === `gateway.heartbeat.ack`) u = Date.now();
              else if (n.type === `session.closed`)
                return (
                  (p =
                    typeof n.usage?.seconds == `number` &&
                    Number.isFinite(n.usage.seconds) &&
                    n.usage.seconds >= 0),
                  C(n.reason),
                  e.onEvent(n),
                  v()
                );
              else if (
                n.type === `gateway.session.closing` ||
                n.type === `gateway.error` ||
                n.type === `app.error`
              )
                return (
                  n.type === `gateway.session.closing` && C(n.reason),
                  e.onEvent(n),
                  y()
                );
              e.onEvent(n);
            } catch {
              S(`Invalid voice event`);
            }
          }),
          (n.onerror = () => S(`Voice connection failed`)),
          (n.onclose = () => {
            (t !== `stopping` &&
              t !== `closed` &&
              e.onEvent({
                type: `app.error`,
                error: { message: `Voice control connection closed` },
              }),
              v());
          }));
      } catch (e) {
        S(e instanceof Error ? e.message : `Microphone startup failed`);
      }
    }
  }
  return { start: ee, stop: y, setMuted: b, resumePlayback: x };
}
var b = [
  {
    id: `marin`,
    name: `Marin`,
    region: `North American`,
    presentation: `Feminine`,
    language: `English`,
    accent: `a natural North American English accent`,
  },
  {
    id: `gleam`,
    name: `Gleam`,
    region: `North American`,
    presentation: `Feminine`,
    language: `English`,
    accent: `a natural North American English accent`,
  },
  {
    id: `meridian`,
    name: `Meridian`,
    region: `North American`,
    presentation: `Masculine`,
    language: `English`,
    accent: `a natural North American English accent`,
  },
  {
    id: `vesper`,
    name: `Vesper`,
    region: `British`,
    presentation: `Masculine`,
    language: `English`,
    accent: `a natural British English accent`,
  },
  {
    id: `willow`,
    name: `Willow`,
    region: `Irish`,
    presentation: `Feminine`,
    language: `English`,
    accent: `a natural Irish English accent`,
  },
  {
    id: `stone`,
    name: `Stone`,
    region: `Irish`,
    presentation: `Masculine`,
    language: `English`,
    accent: `a natural Irish English accent`,
  },
  {
    id: `quartz`,
    name: `Quartz`,
    region: `Australian`,
    presentation: `Feminine`,
    language: `English`,
    accent: `a natural Australian English accent`,
  },
  {
    id: `ripple`,
    name: `Ripple`,
    region: `Australian`,
    presentation: `Masculine`,
    language: `English`,
    accent: `a natural Australian English accent`,
  },
  {
    id: `delta`,
    name: `Delta`,
    region: `Southern U.S.`,
    presentation: `Feminine`,
    language: `English`,
    accent: `a natural Southern U.S. English accent`,
  },
  {
    id: `cinder`,
    name: `Cinder`,
    region: `Southern U.S.`,
    presentation: `Masculine`,
    language: `English`,
    accent: `a natural Southern U.S. English accent`,
  },
  {
    id: `beacon`,
    name: `Beacon`,
    region: `Filipino`,
    presentation: `Masculine`,
    language: `English`,
    accent: `a natural Filipino English accent`,
  },
  {
    id: `bossa`,
    name: `Bossa`,
    region: `Brazilian`,
    presentation: `Feminine`,
    language: `Portuguese`,
    accent: `sotaque brasileiro natural`,
  },
  {
    id: `tempo`,
    name: `Tempo`,
    region: `Brazilian`,
    presentation: `Masculine`,
    language: `Portuguese`,
    accent: `sotaque brasileiro natural`,
  },
];
function x(e) {
  return b.find((t) => t.id === e) ?? b[0];
}
function S(e) {
  var t,
    n,
    r = ``;
  if (typeof e == `string` || typeof e == `number`) r += e;
  else if (typeof e == `object`)
    if (Array.isArray(e)) {
      var i = e.length;
      for (t = 0; t < i; t++)
        e[t] && (n = S(e[t])) && (r && (r += ` `), (r += n));
    } else for (n in e) e[n] && (r && (r += ` `), (r += n));
  return r;
}
function C() {
  for (var e, t, n = 0, r = ``, i = arguments.length; n < i; n++)
    (e = arguments[n]) && (t = S(e)) && (r && (r += ` `), (r += t));
  return r;
}
var w = (e, t) => {
    let n = Array(e.length + t.length);
    for (let t = 0; t < e.length; t++) n[t] = e[t];
    for (let r = 0; r < t.length; r++) n[e.length + r] = t[r];
    return n;
  },
  T = (e, t) => ({ classGroupId: e, validator: t }),
  E = (e = new Map(), t = null, n) => ({
    nextPart: e,
    validators: t,
    classGroupId: n,
  }),
  D = `-`,
  O = [],
  ee = `arbitrary..`,
  te = (e) => {
    let t = j(e),
      { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
    return {
      getClassGroupId: (e) => {
        if (e.startsWith(`[`) && e.endsWith(`]`)) return A(e);
        let n = e.split(D);
        return k(n, +(n[0] === `` && n.length > 1), t);
      },
      getConflictingClassGroupIds: (e, t) => {
        if (t) {
          let t = r[e],
            i = n[e];
          return t ? (i ? w(i, t) : t) : i || O;
        }
        return n[e] || O;
      },
    };
  },
  k = (e, t, n) => {
    if (e.length - t === 0) return n.classGroupId;
    let r = e[t],
      i = n.nextPart.get(r);
    if (i) {
      let n = k(e, t + 1, i);
      if (n) return n;
    }
    let a = n.validators;
    if (a === null) return;
    let o = t === 0 ? e.join(D) : e.slice(t).join(D),
      s = a.length;
    for (let e = 0; e < s; e++) {
      let t = a[e];
      if (t.validator(o)) return t.classGroupId;
    }
  },
  A = (e) =>
    e.slice(1, -1).indexOf(`:`) === -1
      ? void 0
      : (() => {
          let t = e.slice(1, -1),
            n = t.indexOf(`:`),
            r = t.slice(0, n);
          return r ? ee + r : void 0;
        })(),
  j = (e) => {
    let { theme: t, classGroups: n } = e;
    return ne(n, t);
  },
  ne = (e, t) => {
    let n = E();
    for (let r in e) {
      let i = e[r];
      M(i, n, r, t);
    }
    return n;
  },
  M = (e, t, n, r) => {
    let i = e.length;
    for (let a = 0; a < i; a++) {
      let i = e[a];
      N(i, t, n, r);
    }
  },
  N = (e, t, n, r) => {
    if (typeof e == `string`) {
      re(e, t, n);
      return;
    }
    if (typeof e == `function`) {
      ie(e, t, n, r);
      return;
    }
    ae(e, t, n, r);
  },
  re = (e, t, n) => {
    let r = e === `` ? t : P(t, e);
    r.classGroupId = n;
  },
  ie = (e, t, n, r) => {
    if (F(e)) {
      M(e(r), t, n, r);
      return;
    }
    (t.validators === null && (t.validators = []), t.validators.push(T(n, e)));
  },
  ae = (e, t, n, r) => {
    let i = Object.entries(e),
      a = i.length;
    for (let e = 0; e < a; e++) {
      let [a, o] = i[e];
      M(o, P(t, a), n, r);
    }
  },
  P = (e, t) => {
    let n = e,
      r = t.split(D),
      i = r.length;
    for (let e = 0; e < i; e++) {
      let t = r[e],
        i = n.nextPart.get(t);
      (i || ((i = E()), n.nextPart.set(t, i)), (n = i));
    }
    return n;
  },
  F = (e) => `isThemeGetter` in e && e.isThemeGetter === !0,
  I = (e) => {
    if (e < 1) return { get: () => void 0, set: () => {} };
    let t = 0,
      n = Object.create(null),
      r = Object.create(null),
      i = (i, a) => {
        ((n[i] = a),
          t++,
          t > e && ((t = 0), (r = n), (n = Object.create(null))));
      };
    return {
      get(e) {
        let t = n[e];
        if (t !== void 0) return t;
        if ((t = r[e]) !== void 0) return (i(e, t), t);
      },
      set(e, t) {
        e in n ? (n[e] = t) : i(e, t);
      },
    };
  },
  L = `!`,
  oe = `:`,
  R = [],
  se = (e, t, n, r, i) => ({
    modifiers: e,
    hasImportantModifier: t,
    baseClassName: n,
    maybePostfixModifierPosition: r,
    isExternal: i,
  }),
  z = (e) => {
    let { prefix: t, experimentalParseClassName: n } = e,
      r = (e) => {
        let t = [],
          n = 0,
          r = 0,
          i = 0,
          a,
          o = e.length;
        for (let s = 0; s < o; s++) {
          let o = e[s];
          if (n === 0 && r === 0) {
            if (o === oe) {
              (t.push(e.slice(i, s)), (i = s + 1));
              continue;
            }
            if (o === `/`) {
              a = s;
              continue;
            }
          }
          o === `[`
            ? n++
            : o === `]`
              ? n--
              : o === `(`
                ? r++
                : o === `)` && r--;
        }
        let s = t.length === 0 ? e : e.slice(i),
          c = s,
          l = !1;
        s.endsWith(L)
          ? ((c = s.slice(0, -1)), (l = !0))
          : s.startsWith(L) && ((c = s.slice(1)), (l = !0));
        let u = a && a > i ? a - i : void 0;
        return se(t, l, c, u);
      };
    if (t) {
      let e = t + oe,
        n = r;
      r = (t) =>
        t.startsWith(e) ? n(t.slice(e.length)) : se(R, !1, t, void 0, !0);
    }
    if (n) {
      let e = r;
      r = (t) => n({ className: t, parseClassName: e });
    }
    return r;
  },
  B = (e) => {
    let t = new Map();
    return (
      e.orderSensitiveModifiers.forEach((e, n) => {
        t.set(e, 1e6 + n);
      }),
      (e) => {
        let n = [],
          r = [];
        for (let i = 0; i < e.length; i++) {
          let a = e[i],
            o = a[0] === `[`,
            s = t.has(a);
          o || s
            ? (r.length > 0 && (r.sort(), n.push(...r), (r = [])), n.push(a))
            : r.push(a);
        }
        return (r.length > 0 && (r.sort(), n.push(...r)), n);
      }
    );
  },
  ce = (e) => ({
    cache: I(e.cacheSize),
    parseClassName: z(e),
    sortModifiers: B(e),
    postfixLookupClassGroupIds: V(e),
    ...te(e),
  }),
  V = (e) => {
    let t = Object.create(null),
      n = e.postfixLookupClassGroups;
    if (n) for (let e = 0; e < n.length; e++) t[n[e]] = !0;
    return t;
  },
  le = /\s+/,
  ue = (e, t) => {
    let {
        parseClassName: n,
        getClassGroupId: r,
        getConflictingClassGroupIds: i,
        sortModifiers: a,
        postfixLookupClassGroupIds: o,
      } = t,
      s = [],
      c = e.trim().split(le),
      l = ``;
    for (let e = c.length - 1; e >= 0; --e) {
      let t = c[e],
        {
          isExternal: u,
          modifiers: d,
          hasImportantModifier: f,
          baseClassName: p,
          maybePostfixModifierPosition: m,
        } = n(t);
      if (u) {
        l = t + (l.length > 0 ? ` ` + l : l);
        continue;
      }
      let h = !!m,
        g;
      if (h) {
        g = r(p.substring(0, m));
        let e = g && o[g] ? r(p) : void 0;
        e && e !== g && ((g = e), (h = !1));
      } else g = r(p);
      if (!g) {
        if (!h) {
          l = t + (l.length > 0 ? ` ` + l : l);
          continue;
        }
        if (((g = r(p)), !g)) {
          l = t + (l.length > 0 ? ` ` + l : l);
          continue;
        }
        h = !1;
      }
      let _ = d.length === 0 ? `` : d.length === 1 ? d[0] : a(d).join(`:`),
        v = f ? _ + L : _,
        y = v + g;
      if (s.indexOf(y) > -1) continue;
      s.push(y);
      let b = i(g, h);
      for (let e = 0; e < b.length; ++e) {
        let t = b[e];
        s.push(v + t);
      }
      l = t + (l.length > 0 ? ` ` + l : l);
    }
    return l;
  },
  de = (...e) => {
    let t = 0,
      n,
      r,
      i = ``;
    for (; t < e.length;)
      (n = e[t++]) && (r = fe(n)) && (i && (i += ` `), (i += r));
    return i;
  },
  fe = (e) => {
    if (typeof e == `string`) return e;
    let t,
      n = ``;
    for (let r = 0; r < e.length; r++)
      e[r] && (t = fe(e[r])) && (n && (n += ` `), (n += t));
    return n;
  },
  pe = (e, ...t) => {
    let n,
      r,
      i,
      a,
      o = (o) => (
        (n = ce(t.reduce((e, t) => t(e), e()))),
        (r = n.cache.get),
        (i = n.cache.set),
        (a = s),
        s(o)
      ),
      s = (e) => {
        let t = r(e);
        if (t) return t;
        let a = ue(e, n);
        return (i(e, a), a);
      };
    return ((a = o), (...e) => a(de(...e)));
  },
  me = [],
  H = (e) => {
    let t = (t) => t[e] || me;
    return ((t.isThemeGetter = !0), t);
  },
  he = /^\[(?:(\w[\w-]*):)?(.+)\]$/i,
  ge = /^\((?:(\w[\w-]*):)?(.+)\)$/i,
  _e = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,
  ve = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
  ye =
    /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
  be = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,
  xe = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
  Se =
    /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
  U = (e) => _e.test(e),
  W = (e) => !!e && !Number.isNaN(Number(e)),
  G = (e) => !!e && Number.isInteger(Number(e)),
  Ce = (e) => e.endsWith(`%`) && W(e.slice(0, -1)),
  K = (e) => ve.test(e),
  we = () => !0,
  Te = (e) => ye.test(e) && !be.test(e),
  Ee = () => !1,
  De = (e) => xe.test(e),
  Oe = (e) => Se.test(e),
  ke = (e) => !q(e) && !Y(e),
  Ae = (e) =>
    e.startsWith(`@container`) &&
    ((e[10] === `/` && e[11] !== void 0) ||
      (e[11] === `s` && e[16] !== void 0 && e.startsWith(`-size/`, 10)) ||
      (e[11] === `n` && e[18] !== void 0 && e.startsWith(`-normal/`, 10))),
  je = (e) => Z(e, Ke, Ee),
  q = (e) => he.test(e),
  J = (e) => Z(e, qe, Te),
  Me = (e) => Z(e, Je, W),
  Ne = (e) => Z(e, Xe, we),
  Pe = (e) => Z(e, Ye, Ee),
  Fe = (e) => Z(e, We, Ee),
  Ie = (e) => Z(e, Ge, Oe),
  Le = (e) => Z(e, Ze, De),
  Y = (e) => ge.test(e),
  X = (e) => Q(e, qe),
  Re = (e) => Q(e, Ye),
  ze = (e) => Q(e, We),
  Be = (e) => Q(e, Ke),
  Ve = (e) => Q(e, Ge),
  He = (e) => Q(e, Ze, !0),
  Ue = (e) => Q(e, Xe, !0),
  Z = (e, t, n) => {
    let r = he.exec(e);
    return r ? (r[1] ? t(r[1]) : n(r[2])) : !1;
  },
  Q = (e, t, n = !1) => {
    let r = ge.exec(e);
    return r ? (r[1] ? t(r[1]) : n) : !1;
  },
  We = (e) => e === `position` || e === `percentage`,
  Ge = (e) => e === `image` || e === `url`,
  Ke = (e) => e === `length` || e === `size` || e === `bg-size`,
  qe = (e) => e === `length`,
  Je = (e) => e === `number`,
  Ye = (e) => e === `family-name`,
  Xe = (e) => e === `number` || e === `weight`,
  Ze = (e) => e === `shadow`,
  Qe = pe(() => {
    let e = H(`color`),
      t = H(`font`),
      n = H(`text`),
      r = H(`font-weight`),
      i = H(`tracking`),
      a = H(`leading`),
      o = H(`breakpoint`),
      s = H(`container`),
      c = H(`spacing`),
      l = H(`radius`),
      u = H(`shadow`),
      d = H(`inset-shadow`),
      f = H(`text-shadow`),
      p = H(`drop-shadow`),
      m = H(`blur`),
      h = H(`perspective`),
      g = H(`aspect`),
      _ = H(`ease`),
      v = H(`animate`),
      y = () => [
        `auto`,
        `avoid`,
        `all`,
        `avoid-page`,
        `page`,
        `left`,
        `right`,
        `column`,
      ],
      b = () => [
        `center`,
        `top`,
        `bottom`,
        `left`,
        `right`,
        `top-left`,
        `left-top`,
        `top-right`,
        `right-top`,
        `bottom-right`,
        `right-bottom`,
        `bottom-left`,
        `left-bottom`,
      ],
      x = () => [...b(), Y, q],
      S = () => [`auto`, `hidden`, `clip`, `visible`, `scroll`],
      C = () => [`auto`, `contain`, `none`],
      w = () => [Y, q, c],
      T = () => [U, `full`, `auto`, ...w()],
      E = () => [G, `none`, `subgrid`, Y, q],
      D = () => [`auto`, { span: [`full`, G, Y, q] }, G, Y, q],
      O = () => [G, `auto`, Y, q],
      ee = () => [`auto`, `min`, `max`, `fr`, Y, q],
      te = () => [
        `start`,
        `end`,
        `center`,
        `between`,
        `around`,
        `evenly`,
        `stretch`,
        `baseline`,
        `center-safe`,
        `end-safe`,
      ],
      k = () => [
        `start`,
        `end`,
        `center`,
        `stretch`,
        `center-safe`,
        `end-safe`,
      ],
      A = () => [`auto`, ...w()],
      j = () => [
        U,
        `auto`,
        `full`,
        `dvw`,
        `dvh`,
        `lvw`,
        `lvh`,
        `svw`,
        `svh`,
        `min`,
        `max`,
        `fit`,
        ...w(),
      ],
      ne = () => [
        U,
        `screen`,
        `full`,
        `dvw`,
        `lvw`,
        `svw`,
        `min`,
        `max`,
        `fit`,
        ...w(),
      ],
      M = () => [
        U,
        `screen`,
        `full`,
        `lh`,
        `dvh`,
        `lvh`,
        `svh`,
        `min`,
        `max`,
        `fit`,
        ...w(),
      ],
      N = () => [e, Y, q],
      re = () => [...b(), ze, Fe, { position: [Y, q] }],
      ie = () => [`no-repeat`, { repeat: [``, `x`, `y`, `space`, `round`] }],
      ae = () => [`auto`, `cover`, `contain`, Be, je, { size: [Y, q] }],
      P = () => [Ce, X, J],
      F = () => [``, `none`, `full`, l, Y, q],
      I = () => [``, W, X, J],
      L = () => [`solid`, `dashed`, `dotted`, `double`],
      oe = () => [
        `normal`,
        `multiply`,
        `screen`,
        `overlay`,
        `darken`,
        `lighten`,
        `color-dodge`,
        `color-burn`,
        `hard-light`,
        `soft-light`,
        `difference`,
        `exclusion`,
        `hue`,
        `saturation`,
        `color`,
        `luminosity`,
      ],
      R = () => [W, Ce, ze, Fe],
      se = () => [``, `none`, m, Y, q],
      z = () => [`none`, W, Y, q],
      B = () => [`none`, W, Y, q],
      ce = () => [W, Y, q],
      V = () => [U, `full`, ...w()];
    return {
      cacheSize: 500,
      theme: {
        animate: [`spin`, `ping`, `pulse`, `bounce`],
        aspect: [`video`],
        blur: [K],
        breakpoint: [K],
        color: [we],
        container: [K],
        "drop-shadow": [K],
        ease: [`in`, `out`, `in-out`],
        font: [ke],
        "font-weight": [
          `thin`,
          `extralight`,
          `light`,
          `normal`,
          `medium`,
          `semibold`,
          `bold`,
          `extrabold`,
          `black`,
        ],
        "inset-shadow": [K],
        leading: [`none`, `tight`, `snug`, `normal`, `relaxed`, `loose`],
        perspective: [
          `dramatic`,
          `near`,
          `normal`,
          `midrange`,
          `distant`,
          `none`,
        ],
        radius: [K],
        shadow: [K],
        spacing: [`px`, W],
        text: [K],
        "text-shadow": [K],
        tracking: [`tighter`, `tight`, `normal`, `wide`, `wider`, `widest`],
      },
      classGroups: {
        aspect: [{ aspect: [`auto`, `square`, U, q, Y, g] }],
        container: [`container`],
        "container-type": [{ "@container": [``, `normal`, `size`, Y, q] }],
        "container-named": [Ae],
        columns: [{ columns: [W, q, Y, s] }],
        "break-after": [{ "break-after": y() }],
        "break-before": [{ "break-before": y() }],
        "break-inside": [
          { "break-inside": [`auto`, `avoid`, `avoid-page`, `avoid-column`] },
        ],
        "box-decoration": [{ "box-decoration": [`slice`, `clone`] }],
        box: [{ box: [`border`, `content`] }],
        display: [
          `block`,
          `inline-block`,
          `inline`,
          `flex`,
          `inline-flex`,
          `table`,
          `inline-table`,
          `table-caption`,
          `table-cell`,
          `table-column`,
          `table-column-group`,
          `table-footer-group`,
          `table-header-group`,
          `table-row-group`,
          `table-row`,
          `flow-root`,
          `grid`,
          `inline-grid`,
          `contents`,
          `list-item`,
          `hidden`,
        ],
        sr: [`sr-only`, `not-sr-only`],
        float: [{ float: [`right`, `left`, `none`, `start`, `end`] }],
        clear: [{ clear: [`left`, `right`, `both`, `none`, `start`, `end`] }],
        isolation: [`isolate`, `isolation-auto`],
        "object-fit": [
          { object: [`contain`, `cover`, `fill`, `none`, `scale-down`] },
        ],
        "object-position": [{ object: x() }],
        overflow: [{ overflow: S() }],
        "overflow-x": [{ "overflow-x": S() }],
        "overflow-y": [{ "overflow-y": S() }],
        overscroll: [{ overscroll: C() }],
        "overscroll-x": [{ "overscroll-x": C() }],
        "overscroll-y": [{ "overscroll-y": C() }],
        position: [`static`, `fixed`, `absolute`, `relative`, `sticky`],
        inset: [{ inset: T() }],
        "inset-x": [{ "inset-x": T() }],
        "inset-y": [{ "inset-y": T() }],
        start: [{ "inset-s": T(), start: T() }],
        end: [{ "inset-e": T(), end: T() }],
        "inset-bs": [{ "inset-bs": T() }],
        "inset-be": [{ "inset-be": T() }],
        top: [{ top: T() }],
        right: [{ right: T() }],
        bottom: [{ bottom: T() }],
        left: [{ left: T() }],
        visibility: [`visible`, `invisible`, `collapse`],
        z: [{ z: [G, `auto`, Y, q] }],
        basis: [{ basis: [U, `full`, `auto`, s, ...w()] }],
        "flex-direction": [
          { flex: [`row`, `row-reverse`, `col`, `col-reverse`] },
        ],
        "flex-wrap": [{ flex: [`nowrap`, `wrap`, `wrap-reverse`] }],
        flex: [{ flex: [W, U, `auto`, `initial`, `none`, q] }],
        grow: [{ grow: [``, W, Y, q] }],
        shrink: [{ shrink: [``, W, Y, q] }],
        order: [{ order: [G, `first`, `last`, `none`, Y, q] }],
        "grid-cols": [{ "grid-cols": E() }],
        "col-start-end": [{ col: D() }],
        "col-start": [{ "col-start": O() }],
        "col-end": [{ "col-end": O() }],
        "grid-rows": [{ "grid-rows": E() }],
        "row-start-end": [{ row: D() }],
        "row-start": [{ "row-start": O() }],
        "row-end": [{ "row-end": O() }],
        "grid-flow": [
          { "grid-flow": [`row`, `col`, `dense`, `row-dense`, `col-dense`] },
        ],
        "auto-cols": [{ "auto-cols": ee() }],
        "auto-rows": [{ "auto-rows": ee() }],
        gap: [{ gap: w() }],
        "gap-x": [{ "gap-x": w() }],
        "gap-y": [{ "gap-y": w() }],
        "justify-content": [{ justify: [...te(), `normal`] }],
        "justify-items": [{ "justify-items": [...k(), `normal`] }],
        "justify-self": [{ "justify-self": [`auto`, ...k()] }],
        "align-content": [{ content: [`normal`, ...te()] }],
        "align-items": [{ items: [...k(), { baseline: [``, `last`] }] }],
        "align-self": [{ self: [`auto`, ...k(), { baseline: [``, `last`] }] }],
        "place-content": [{ "place-content": te() }],
        "place-items": [{ "place-items": [...k(), `baseline`] }],
        "place-self": [{ "place-self": [`auto`, ...k()] }],
        p: [{ p: w() }],
        px: [{ px: w() }],
        py: [{ py: w() }],
        ps: [{ ps: w() }],
        pe: [{ pe: w() }],
        pbs: [{ pbs: w() }],
        pbe: [{ pbe: w() }],
        pt: [{ pt: w() }],
        pr: [{ pr: w() }],
        pb: [{ pb: w() }],
        pl: [{ pl: w() }],
        m: [{ m: A() }],
        mx: [{ mx: A() }],
        my: [{ my: A() }],
        ms: [{ ms: A() }],
        me: [{ me: A() }],
        mbs: [{ mbs: A() }],
        mbe: [{ mbe: A() }],
        mt: [{ mt: A() }],
        mr: [{ mr: A() }],
        mb: [{ mb: A() }],
        ml: [{ ml: A() }],
        "space-x": [{ "space-x": w() }],
        "space-x-reverse": [`space-x-reverse`],
        "space-y": [{ "space-y": w() }],
        "space-y-reverse": [`space-y-reverse`],
        size: [{ size: j() }],
        "inline-size": [{ inline: [`auto`, ...ne()] }],
        "min-inline-size": [{ "min-inline": [`auto`, ...ne()] }],
        "max-inline-size": [{ "max-inline": [`none`, ...ne()] }],
        "block-size": [{ block: [`auto`, ...M()] }],
        "min-block-size": [{ "min-block": [`auto`, ...M()] }],
        "max-block-size": [{ "max-block": [`none`, ...M()] }],
        w: [{ w: [s, `screen`, ...j()] }],
        "min-w": [{ "min-w": [s, `screen`, `none`, ...j()] }],
        "max-w": [
          { "max-w": [s, `screen`, `none`, `prose`, { screen: [o] }, ...j()] },
        ],
        h: [{ h: [`screen`, `lh`, ...j()] }],
        "min-h": [{ "min-h": [`screen`, `lh`, `none`, ...j()] }],
        "max-h": [{ "max-h": [`screen`, `lh`, ...j()] }],
        "font-size": [{ text: [`base`, n, X, J] }],
        "font-smoothing": [`antialiased`, `subpixel-antialiased`],
        "font-style": [`italic`, `not-italic`],
        "font-weight": [{ font: [r, Ue, Ne] }],
        "font-stretch": [
          {
            "font-stretch": [
              `ultra-condensed`,
              `extra-condensed`,
              `condensed`,
              `semi-condensed`,
              `normal`,
              `semi-expanded`,
              `expanded`,
              `extra-expanded`,
              `ultra-expanded`,
              Ce,
              q,
            ],
          },
        ],
        "font-family": [{ font: [Re, Pe, t] }],
        "font-features": [{ "font-features": [q] }],
        "fvn-normal": [`normal-nums`],
        "fvn-ordinal": [`ordinal`],
        "fvn-slashed-zero": [`slashed-zero`],
        "fvn-figure": [`lining-nums`, `oldstyle-nums`],
        "fvn-spacing": [`proportional-nums`, `tabular-nums`],
        "fvn-fraction": [`diagonal-fractions`, `stacked-fractions`],
        tracking: [{ tracking: [i, Y, q] }],
        "line-clamp": [{ "line-clamp": [W, `none`, Y, Me] }],
        leading: [{ leading: [a, ...w()] }],
        "list-image": [{ "list-image": [`none`, Y, q] }],
        "list-style-position": [{ list: [`inside`, `outside`] }],
        "list-style-type": [{ list: [`disc`, `decimal`, `none`, Y, q] }],
        "text-alignment": [
          { text: [`left`, `center`, `right`, `justify`, `start`, `end`] },
        ],
        "placeholder-color": [{ placeholder: N() }],
        "text-color": [{ text: N() }],
        "text-decoration": [
          `underline`,
          `overline`,
          `line-through`,
          `no-underline`,
        ],
        "text-decoration-style": [{ decoration: [...L(), `wavy`] }],
        "text-decoration-thickness": [
          { decoration: [W, `from-font`, `auto`, Y, J] },
        ],
        "text-decoration-color": [{ decoration: N() }],
        "underline-offset": [{ "underline-offset": [W, `auto`, Y, q] }],
        "text-transform": [
          `uppercase`,
          `lowercase`,
          `capitalize`,
          `normal-case`,
        ],
        "text-overflow": [`truncate`, `text-ellipsis`, `text-clip`],
        "text-wrap": [{ text: [`wrap`, `nowrap`, `balance`, `pretty`] }],
        indent: [{ indent: w() }],
        "tab-size": [{ tab: [G, Y, q] }],
        "vertical-align": [
          {
            align: [
              `baseline`,
              `top`,
              `middle`,
              `bottom`,
              `text-top`,
              `text-bottom`,
              `sub`,
              `super`,
              Y,
              q,
            ],
          },
        ],
        whitespace: [
          {
            whitespace: [
              `normal`,
              `nowrap`,
              `pre`,
              `pre-line`,
              `pre-wrap`,
              `break-spaces`,
            ],
          },
        ],
        break: [{ break: [`normal`, `words`, `all`, `keep`] }],
        wrap: [{ wrap: [`break-word`, `anywhere`, `normal`] }],
        hyphens: [{ hyphens: [`none`, `manual`, `auto`] }],
        content: [{ content: [`none`, Y, q] }],
        "bg-attachment": [{ bg: [`fixed`, `local`, `scroll`] }],
        "bg-clip": [{ "bg-clip": [`border`, `padding`, `content`, `text`] }],
        "bg-origin": [{ "bg-origin": [`border`, `padding`, `content`] }],
        "bg-position": [{ bg: re() }],
        "bg-repeat": [{ bg: ie() }],
        "bg-size": [{ bg: ae() }],
        "bg-image": [
          {
            bg: [
              `none`,
              {
                linear: [
                  { to: [`t`, `tr`, `r`, `br`, `b`, `bl`, `l`, `tl`] },
                  G,
                  Y,
                  q,
                ],
                radial: [``, Y, q],
                conic: [G, Y, q],
              },
              Ve,
              Ie,
            ],
          },
        ],
        "bg-color": [{ bg: N() }],
        "gradient-from-pos": [{ from: P() }],
        "gradient-via-pos": [{ via: P() }],
        "gradient-to-pos": [{ to: P() }],
        "gradient-from": [{ from: N() }],
        "gradient-via": [{ via: N() }],
        "gradient-to": [{ to: N() }],
        rounded: [{ rounded: F() }],
        "rounded-s": [{ "rounded-s": F() }],
        "rounded-e": [{ "rounded-e": F() }],
        "rounded-t": [{ "rounded-t": F() }],
        "rounded-r": [{ "rounded-r": F() }],
        "rounded-b": [{ "rounded-b": F() }],
        "rounded-l": [{ "rounded-l": F() }],
        "rounded-ss": [{ "rounded-ss": F() }],
        "rounded-se": [{ "rounded-se": F() }],
        "rounded-ee": [{ "rounded-ee": F() }],
        "rounded-es": [{ "rounded-es": F() }],
        "rounded-tl": [{ "rounded-tl": F() }],
        "rounded-tr": [{ "rounded-tr": F() }],
        "rounded-br": [{ "rounded-br": F() }],
        "rounded-bl": [{ "rounded-bl": F() }],
        "border-w": [{ border: I() }],
        "border-w-x": [{ "border-x": I() }],
        "border-w-y": [{ "border-y": I() }],
        "border-w-s": [{ "border-s": I() }],
        "border-w-e": [{ "border-e": I() }],
        "border-w-bs": [{ "border-bs": I() }],
        "border-w-be": [{ "border-be": I() }],
        "border-w-t": [{ "border-t": I() }],
        "border-w-r": [{ "border-r": I() }],
        "border-w-b": [{ "border-b": I() }],
        "border-w-l": [{ "border-l": I() }],
        "divide-x": [{ "divide-x": I() }],
        "divide-x-reverse": [`divide-x-reverse`],
        "divide-y": [{ "divide-y": I() }],
        "divide-y-reverse": [`divide-y-reverse`],
        "border-style": [{ border: [...L(), `hidden`, `none`] }],
        "divide-style": [{ divide: [...L(), `hidden`, `none`] }],
        "border-color": [{ border: N() }],
        "border-color-x": [{ "border-x": N() }],
        "border-color-y": [{ "border-y": N() }],
        "border-color-s": [{ "border-s": N() }],
        "border-color-e": [{ "border-e": N() }],
        "border-color-bs": [{ "border-bs": N() }],
        "border-color-be": [{ "border-be": N() }],
        "border-color-t": [{ "border-t": N() }],
        "border-color-r": [{ "border-r": N() }],
        "border-color-b": [{ "border-b": N() }],
        "border-color-l": [{ "border-l": N() }],
        "divide-color": [{ divide: N() }],
        "outline-style": [{ outline: [...L(), `none`, `hidden`] }],
        "outline-offset": [{ "outline-offset": [W, Y, q] }],
        "outline-w": [{ outline: [``, W, X, J] }],
        "outline-color": [{ outline: N() }],
        shadow: [{ shadow: [``, `none`, u, He, Le] }],
        "shadow-color": [{ shadow: N() }],
        "inset-shadow": [{ "inset-shadow": [`none`, d, He, Le] }],
        "inset-shadow-color": [{ "inset-shadow": N() }],
        "ring-w": [{ ring: I() }],
        "ring-w-inset": [`ring-inset`],
        "ring-color": [{ ring: N() }],
        "ring-offset-w": [{ "ring-offset": [W, J] }],
        "ring-offset-color": [{ "ring-offset": N() }],
        "inset-ring-w": [{ "inset-ring": I() }],
        "inset-ring-color": [{ "inset-ring": N() }],
        "text-shadow": [{ "text-shadow": [`none`, f, He, Le] }],
        "text-shadow-color": [{ "text-shadow": N() }],
        opacity: [{ opacity: [W, Y, q] }],
        "mix-blend": [
          { "mix-blend": [...oe(), `plus-darker`, `plus-lighter`] },
        ],
        "bg-blend": [{ "bg-blend": oe() }],
        "mask-clip": [
          {
            "mask-clip": [
              `border`,
              `padding`,
              `content`,
              `fill`,
              `stroke`,
              `view`,
            ],
          },
          `mask-no-clip`,
        ],
        "mask-composite": [
          { mask: [`add`, `subtract`, `intersect`, `exclude`] },
        ],
        "mask-image-linear-pos": [{ "mask-linear": [W] }],
        "mask-image-linear-from-pos": [{ "mask-linear-from": R() }],
        "mask-image-linear-to-pos": [{ "mask-linear-to": R() }],
        "mask-image-linear-from-color": [{ "mask-linear-from": N() }],
        "mask-image-linear-to-color": [{ "mask-linear-to": N() }],
        "mask-image-t-from-pos": [{ "mask-t-from": R() }],
        "mask-image-t-to-pos": [{ "mask-t-to": R() }],
        "mask-image-t-from-color": [{ "mask-t-from": N() }],
        "mask-image-t-to-color": [{ "mask-t-to": N() }],
        "mask-image-r-from-pos": [{ "mask-r-from": R() }],
        "mask-image-r-to-pos": [{ "mask-r-to": R() }],
        "mask-image-r-from-color": [{ "mask-r-from": N() }],
        "mask-image-r-to-color": [{ "mask-r-to": N() }],
        "mask-image-b-from-pos": [{ "mask-b-from": R() }],
        "mask-image-b-to-pos": [{ "mask-b-to": R() }],
        "mask-image-b-from-color": [{ "mask-b-from": N() }],
        "mask-image-b-to-color": [{ "mask-b-to": N() }],
        "mask-image-l-from-pos": [{ "mask-l-from": R() }],
        "mask-image-l-to-pos": [{ "mask-l-to": R() }],
        "mask-image-l-from-color": [{ "mask-l-from": N() }],
        "mask-image-l-to-color": [{ "mask-l-to": N() }],
        "mask-image-x-from-pos": [{ "mask-x-from": R() }],
        "mask-image-x-to-pos": [{ "mask-x-to": R() }],
        "mask-image-x-from-color": [{ "mask-x-from": N() }],
        "mask-image-x-to-color": [{ "mask-x-to": N() }],
        "mask-image-y-from-pos": [{ "mask-y-from": R() }],
        "mask-image-y-to-pos": [{ "mask-y-to": R() }],
        "mask-image-y-from-color": [{ "mask-y-from": N() }],
        "mask-image-y-to-color": [{ "mask-y-to": N() }],
        "mask-image-radial": [{ "mask-radial": [Y, q] }],
        "mask-image-radial-from-pos": [{ "mask-radial-from": R() }],
        "mask-image-radial-to-pos": [{ "mask-radial-to": R() }],
        "mask-image-radial-from-color": [{ "mask-radial-from": N() }],
        "mask-image-radial-to-color": [{ "mask-radial-to": N() }],
        "mask-image-radial-shape": [{ "mask-radial": [`circle`, `ellipse`] }],
        "mask-image-radial-size": [
          {
            "mask-radial": [
              { closest: [`side`, `corner`], farthest: [`side`, `corner`] },
            ],
          },
        ],
        "mask-image-radial-pos": [{ "mask-radial-at": b() }],
        "mask-image-conic-pos": [{ "mask-conic": [W] }],
        "mask-image-conic-from-pos": [{ "mask-conic-from": R() }],
        "mask-image-conic-to-pos": [{ "mask-conic-to": R() }],
        "mask-image-conic-from-color": [{ "mask-conic-from": N() }],
        "mask-image-conic-to-color": [{ "mask-conic-to": N() }],
        "mask-mode": [{ mask: [`alpha`, `luminance`, `match`] }],
        "mask-origin": [
          {
            "mask-origin": [
              `border`,
              `padding`,
              `content`,
              `fill`,
              `stroke`,
              `view`,
            ],
          },
        ],
        "mask-position": [{ mask: re() }],
        "mask-repeat": [{ mask: ie() }],
        "mask-size": [{ mask: ae() }],
        "mask-type": [{ "mask-type": [`alpha`, `luminance`] }],
        "mask-image": [{ mask: [`none`, Y, q] }],
        filter: [{ filter: [``, `none`, Y, q] }],
        blur: [{ blur: se() }],
        brightness: [{ brightness: [W, Y, q] }],
        contrast: [{ contrast: [W, Y, q] }],
        "drop-shadow": [{ "drop-shadow": [``, `none`, p, He, Le] }],
        "drop-shadow-color": [{ "drop-shadow": N() }],
        grayscale: [{ grayscale: [``, W, Y, q] }],
        "hue-rotate": [{ "hue-rotate": [W, Y, q] }],
        invert: [{ invert: [``, W, Y, q] }],
        saturate: [{ saturate: [W, Y, q] }],
        sepia: [{ sepia: [``, W, Y, q] }],
        "backdrop-filter": [{ "backdrop-filter": [``, `none`, Y, q] }],
        "backdrop-blur": [{ "backdrop-blur": se() }],
        "backdrop-brightness": [{ "backdrop-brightness": [W, Y, q] }],
        "backdrop-contrast": [{ "backdrop-contrast": [W, Y, q] }],
        "backdrop-grayscale": [{ "backdrop-grayscale": [``, W, Y, q] }],
        "backdrop-hue-rotate": [{ "backdrop-hue-rotate": [W, Y, q] }],
        "backdrop-invert": [{ "backdrop-invert": [``, W, Y, q] }],
        "backdrop-opacity": [{ "backdrop-opacity": [W, Y, q] }],
        "backdrop-saturate": [{ "backdrop-saturate": [W, Y, q] }],
        "backdrop-sepia": [{ "backdrop-sepia": [``, W, Y, q] }],
        "border-collapse": [{ border: [`collapse`, `separate`] }],
        "border-spacing": [{ "border-spacing": w() }],
        "border-spacing-x": [{ "border-spacing-x": w() }],
        "border-spacing-y": [{ "border-spacing-y": w() }],
        "table-layout": [{ table: [`auto`, `fixed`] }],
        caption: [{ caption: [`top`, `bottom`] }],
        transition: [
          {
            transition: [
              ``,
              `all`,
              `colors`,
              `opacity`,
              `shadow`,
              `transform`,
              `none`,
              Y,
              q,
            ],
          },
        ],
        "transition-behavior": [{ transition: [`normal`, `discrete`] }],
        duration: [{ duration: [W, `initial`, Y, q] }],
        ease: [{ ease: [`linear`, `initial`, _, Y, q] }],
        delay: [{ delay: [W, Y, q] }],
        animate: [{ animate: [`none`, v, Y, q] }],
        backface: [{ backface: [`hidden`, `visible`] }],
        perspective: [{ perspective: [h, Y, q] }],
        "perspective-origin": [{ "perspective-origin": x() }],
        rotate: [{ rotate: z() }],
        "rotate-x": [{ "rotate-x": z() }],
        "rotate-y": [{ "rotate-y": z() }],
        "rotate-z": [{ "rotate-z": z() }],
        scale: [{ scale: B() }],
        "scale-x": [{ "scale-x": B() }],
        "scale-y": [{ "scale-y": B() }],
        "scale-z": [{ "scale-z": B() }],
        "scale-3d": [`scale-3d`],
        skew: [{ skew: ce() }],
        "skew-x": [{ "skew-x": ce() }],
        "skew-y": [{ "skew-y": ce() }],
        transform: [{ transform: [Y, q, ``, `none`, `gpu`, `cpu`] }],
        "transform-origin": [{ origin: x() }],
        "transform-style": [{ transform: [`3d`, `flat`] }],
        translate: [{ translate: V() }],
        "translate-x": [{ "translate-x": V() }],
        "translate-y": [{ "translate-y": V() }],
        "translate-z": [{ "translate-z": V() }],
        "translate-none": [`translate-none`],
        zoom: [{ zoom: [G, Y, q] }],
        accent: [{ accent: N() }],
        appearance: [{ appearance: [`none`, `auto`] }],
        "caret-color": [{ caret: N() }],
        "color-scheme": [
          {
            scheme: [
              `normal`,
              `dark`,
              `light`,
              `light-dark`,
              `only-dark`,
              `only-light`,
            ],
          },
        ],
        cursor: [
          {
            cursor: [
              `auto`,
              `default`,
              `pointer`,
              `wait`,
              `text`,
              `move`,
              `help`,
              `not-allowed`,
              `none`,
              `context-menu`,
              `progress`,
              `cell`,
              `crosshair`,
              `vertical-text`,
              `alias`,
              `copy`,
              `no-drop`,
              `grab`,
              `grabbing`,
              `all-scroll`,
              `col-resize`,
              `row-resize`,
              `n-resize`,
              `e-resize`,
              `s-resize`,
              `w-resize`,
              `ne-resize`,
              `nw-resize`,
              `se-resize`,
              `sw-resize`,
              `ew-resize`,
              `ns-resize`,
              `nesw-resize`,
              `nwse-resize`,
              `zoom-in`,
              `zoom-out`,
              Y,
              q,
            ],
          },
        ],
        "field-sizing": [{ "field-sizing": [`fixed`, `content`] }],
        "pointer-events": [{ "pointer-events": [`auto`, `none`] }],
        resize: [{ resize: [`none`, ``, `y`, `x`] }],
        "scroll-behavior": [{ scroll: [`auto`, `smooth`] }],
        "scrollbar-thumb-color": [{ "scrollbar-thumb": N() }],
        "scrollbar-track-color": [{ "scrollbar-track": N() }],
        "scrollbar-gutter": [
          { "scrollbar-gutter": [`auto`, `stable`, `both`] },
        ],
        "scrollbar-w": [{ scrollbar: [`auto`, `thin`, `none`] }],
        "scroll-m": [{ "scroll-m": w() }],
        "scroll-mx": [{ "scroll-mx": w() }],
        "scroll-my": [{ "scroll-my": w() }],
        "scroll-ms": [{ "scroll-ms": w() }],
        "scroll-me": [{ "scroll-me": w() }],
        "scroll-mbs": [{ "scroll-mbs": w() }],
        "scroll-mbe": [{ "scroll-mbe": w() }],
        "scroll-mt": [{ "scroll-mt": w() }],
        "scroll-mr": [{ "scroll-mr": w() }],
        "scroll-mb": [{ "scroll-mb": w() }],
        "scroll-ml": [{ "scroll-ml": w() }],
        "scroll-p": [{ "scroll-p": w() }],
        "scroll-px": [{ "scroll-px": w() }],
        "scroll-py": [{ "scroll-py": w() }],
        "scroll-ps": [{ "scroll-ps": w() }],
        "scroll-pe": [{ "scroll-pe": w() }],
        "scroll-pbs": [{ "scroll-pbs": w() }],
        "scroll-pbe": [{ "scroll-pbe": w() }],
        "scroll-pt": [{ "scroll-pt": w() }],
        "scroll-pr": [{ "scroll-pr": w() }],
        "scroll-pb": [{ "scroll-pb": w() }],
        "scroll-pl": [{ "scroll-pl": w() }],
        "snap-align": [{ snap: [`start`, `end`, `center`, `align-none`] }],
        "snap-stop": [{ snap: [`normal`, `always`] }],
        "snap-type": [{ snap: [`none`, `x`, `y`, `both`] }],
        "snap-strictness": [{ snap: [`mandatory`, `proximity`] }],
        touch: [{ touch: [`auto`, `none`, `manipulation`] }],
        "touch-x": [{ "touch-pan": [`x`, `left`, `right`] }],
        "touch-y": [{ "touch-pan": [`y`, `up`, `down`] }],
        "touch-pz": [`touch-pinch-zoom`],
        select: [{ select: [`none`, `text`, `all`, `auto`] }],
        "will-change": [
          { "will-change": [`auto`, `scroll`, `contents`, `transform`, Y, q] },
        ],
        fill: [{ fill: [`none`, ...N()] }],
        "stroke-w": [{ stroke: [W, X, J, Me] }],
        stroke: [{ stroke: [`none`, ...N()] }],
        "forced-color-adjust": [{ "forced-color-adjust": [`auto`, `none`] }],
      },
      conflictingClassGroups: {
        "container-named": [`container-type`],
        overflow: [`overflow-x`, `overflow-y`],
        overscroll: [`overscroll-x`, `overscroll-y`],
        inset: [
          `inset-x`,
          `inset-y`,
          `inset-bs`,
          `inset-be`,
          `start`,
          `end`,
          `top`,
          `right`,
          `bottom`,
          `left`,
        ],
        "inset-x": [`right`, `left`],
        "inset-y": [`top`, `bottom`],
        flex: [`basis`, `grow`, `shrink`],
        gap: [`gap-x`, `gap-y`],
        p: [`px`, `py`, `ps`, `pe`, `pbs`, `pbe`, `pt`, `pr`, `pb`, `pl`],
        px: [`pr`, `pl`],
        py: [`pt`, `pb`],
        m: [`mx`, `my`, `ms`, `me`, `mbs`, `mbe`, `mt`, `mr`, `mb`, `ml`],
        mx: [`mr`, `ml`],
        my: [`mt`, `mb`],
        size: [`w`, `h`],
        "font-size": [`leading`],
        "fvn-normal": [
          `fvn-ordinal`,
          `fvn-slashed-zero`,
          `fvn-figure`,
          `fvn-spacing`,
          `fvn-fraction`,
        ],
        "fvn-ordinal": [`fvn-normal`],
        "fvn-slashed-zero": [`fvn-normal`],
        "fvn-figure": [`fvn-normal`],
        "fvn-spacing": [`fvn-normal`],
        "fvn-fraction": [`fvn-normal`],
        "line-clamp": [`display`, `overflow`],
        rounded: [
          `rounded-s`,
          `rounded-e`,
          `rounded-t`,
          `rounded-r`,
          `rounded-b`,
          `rounded-l`,
          `rounded-ss`,
          `rounded-se`,
          `rounded-ee`,
          `rounded-es`,
          `rounded-tl`,
          `rounded-tr`,
          `rounded-br`,
          `rounded-bl`,
        ],
        "rounded-s": [`rounded-ss`, `rounded-es`],
        "rounded-e": [`rounded-se`, `rounded-ee`],
        "rounded-t": [`rounded-tl`, `rounded-tr`],
        "rounded-r": [`rounded-tr`, `rounded-br`],
        "rounded-b": [`rounded-br`, `rounded-bl`],
        "rounded-l": [`rounded-tl`, `rounded-bl`],
        "border-spacing": [`border-spacing-x`, `border-spacing-y`],
        "border-w": [
          `border-w-x`,
          `border-w-y`,
          `border-w-s`,
          `border-w-e`,
          `border-w-bs`,
          `border-w-be`,
          `border-w-t`,
          `border-w-r`,
          `border-w-b`,
          `border-w-l`,
        ],
        "border-w-x": [`border-w-r`, `border-w-l`],
        "border-w-y": [`border-w-t`, `border-w-b`],
        "border-color": [
          `border-color-x`,
          `border-color-y`,
          `border-color-s`,
          `border-color-e`,
          `border-color-bs`,
          `border-color-be`,
          `border-color-t`,
          `border-color-r`,
          `border-color-b`,
          `border-color-l`,
        ],
        "border-color-x": [`border-color-r`, `border-color-l`],
        "border-color-y": [`border-color-t`, `border-color-b`],
        translate: [`translate-x`, `translate-y`, `translate-none`],
        "translate-none": [
          `translate`,
          `translate-x`,
          `translate-y`,
          `translate-z`,
        ],
        "scroll-m": [
          `scroll-mx`,
          `scroll-my`,
          `scroll-ms`,
          `scroll-me`,
          `scroll-mbs`,
          `scroll-mbe`,
          `scroll-mt`,
          `scroll-mr`,
          `scroll-mb`,
          `scroll-ml`,
        ],
        "scroll-mx": [`scroll-mr`, `scroll-ml`],
        "scroll-my": [`scroll-mt`, `scroll-mb`],
        "scroll-p": [
          `scroll-px`,
          `scroll-py`,
          `scroll-ps`,
          `scroll-pe`,
          `scroll-pbs`,
          `scroll-pbe`,
          `scroll-pt`,
          `scroll-pr`,
          `scroll-pb`,
          `scroll-pl`,
        ],
        "scroll-px": [`scroll-pr`, `scroll-pl`],
        "scroll-py": [`scroll-pt`, `scroll-pb`],
        touch: [`touch-x`, `touch-y`, `touch-pz`],
        "touch-x": [`touch`],
        "touch-y": [`touch`],
        "touch-pz": [`touch`],
      },
      conflictingClassGroupModifiers: { "font-size": [`leading`] },
      postfixLookupClassGroups: [`container-type`],
      orderSensitiveModifiers: [
        `*`,
        `**`,
        `after`,
        `backdrop`,
        `before`,
        `details-content`,
        `file`,
        `first-letter`,
        `first-line`,
        `marker`,
        `placeholder`,
        `selection`,
      ],
    };
  });
function $e(...e) {
  return Qe(C(e));
}
var $ = n();
function et() {
  let [e, t] = (0, l.useState)(`marin`),
    [n, r] = (0, l.useState)([]),
    i = v({
      onEvent: (0, l.useCallback)((e) => {
        let t = e,
          n =
            t.type === `session.input_transcript.delta`
              ? `user`
              : t.type === `session.output_transcript.delta`
                ? `assistant`
                : null;
        if (!n || typeof t.delta != `string`) return;
        let i = t.delta;
        r((e) => {
          let t = e[e.length - 1];
          return t && t.role === n
            ? [...e.slice(0, -1), { role: n, text: t.text + i }]
            : [...e, { role: n, text: i }];
        });
      }, []),
      voice: e,
    }),
    a = i.status === `idle` || i.status === `closed`,
    o = i.status === `connected`,
    s = x(e);
  return (0, $.jsx)(`main`, {
    className: `min-h-screen px-5 py-10 md:py-16`,
    children: (0, $.jsxs)(`div`, {
      className: `mx-auto max-w-5xl`,
      children: [
        (0, $.jsxs)(`header`, {
          className: `mb-10 text-center`,
          children: [
            (0, $.jsx)(`h1`, {
              className: `font-display text-5xl md:text-6xl`,
              children: `Hearth`,
            }),
            (0, $.jsx)(`p`, {
              className: `mt-3 text-muted-foreground`,
              children: `Pick a voice, press call, and just talk.`,
            }),
          ],
        }),
        (0, $.jsxs)(`div`, {
          className: `grid gap-8 md:grid-cols-[1fr_1.1fr]`,
          children: [
            (0, $.jsxs)(`section`, {
              children: [
                (0, $.jsx)(`h2`, {
                  className: `mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground`,
                  children: `Voices`,
                }),
                (0, $.jsx)(`div`, {
                  className: `grid grid-cols-2 gap-2 sm:grid-cols-3`,
                  children: b.map((n) =>
                    (0, $.jsxs)(
                      `button`,
                      {
                        disabled: !a,
                        onClick: () => t(n.id),
                        className: $e(
                          `rounded-lg border bg-card p-3 text-left transition disabled:opacity-50`,
                          n.id === e
                            ? `border-primary ring-1 ring-primary`
                            : `hover:border-muted-foreground`,
                        ),
                        children: [
                          (0, $.jsx)(`div`, {
                            className: `font-display text-lg`,
                            children: n.name,
                          }),
                          (0, $.jsxs)(`div`, {
                            className: `text-xs text-muted-foreground`,
                            children: [n.region, ` · `, n.presentation],
                          }),
                        ],
                      },
                      n.id,
                    ),
                  ),
                }),
                !a &&
                  (0, $.jsx)(`p`, {
                    className: `mt-3 text-xs text-muted-foreground`,
                    children: `End the call to switch voices.`,
                  }),
              ],
            }),
            (0, $.jsxs)(`section`, {
              className: `flex flex-col items-center rounded-2xl border bg-card p-8`,
              children: [
                (0, $.jsx)(`div`, {
                  className: $e(
                    `orb h-36 w-36`,
                    o && `animate-breathe`,
                    a && `opacity-60`,
                  ),
                }),
                (0, $.jsx)(`div`, {
                  className: `mt-5 font-display text-2xl`,
                  children: s.name,
                }),
                (0, $.jsx)(`div`, {
                  className: `text-sm text-muted-foreground`,
                  role: `status`,
                  children: o
                    ? `Listening…`
                    : i.status === `connecting`
                      ? `Connecting…`
                      : i.status === `stopping`
                        ? `Ending…`
                        : `${s.region} ${s.language}`,
                }),
                i.error &&
                  (0, $.jsx)(`p`, {
                    role: `alert`,
                    className: `mt-3 text-sm text-destructive`,
                    children: i.error,
                  }),
                (0, $.jsx)(`div`, {
                  className: `mt-6 flex gap-3`,
                  children: a
                    ? (0, $.jsxs)(`button`, {
                        onClick: () => {
                          (r([]), i.start());
                        },
                        className: `inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground`,
                        children: [
                          (0, $.jsx)(h, { className: `h-4 w-4` }),
                          ` Call `,
                          s.name,
                        ],
                      })
                    : (0, $.jsxs)($.Fragment, {
                        children: [
                          (0, $.jsx)(`button`, {
                            disabled: !o,
                            onClick: () => i.setMuted(!i.muted),
                            "aria-label": i.muted ? `Unmute` : `Mute`,
                            className: `rounded-full bg-secondary p-3 text-secondary-foreground disabled:opacity-50`,
                            children: i.muted
                              ? (0, $.jsx)(f, { className: `h-5 w-5` })
                              : (0, $.jsx)(p, { className: `h-5 w-5` }),
                          }),
                          (0, $.jsxs)(`button`, {
                            disabled: i.status === `stopping`,
                            onClick: i.stop,
                            className: `inline-flex items-center gap-2 rounded-full bg-destructive px-6 py-3 font-semibold text-destructive-foreground`,
                            children: [
                              (0, $.jsx)(m, { className: `h-4 w-4` }),
                              ` End call`,
                            ],
                          }),
                        ],
                      }),
                }),
                i.playbackBlocked &&
                  (0, $.jsxs)(`button`, {
                    onClick: i.resumePlayback,
                    className: `mt-3 inline-flex items-center gap-2 text-sm text-primary`,
                    children: [
                      (0, $.jsx)(g, { className: `h-4 w-4` }),
                      ` Tap to hear `,
                      s.name,
                    ],
                  }),
                (0, $.jsx)(`audio`, { ref: i.audioRef, className: `sr-only` }),
                (0, $.jsx)(`div`, {
                  className: `mt-8 max-h-72 w-full space-y-3 overflow-y-auto text-sm`,
                  children: n.map((e, t) =>
                    (0, $.jsx)(
                      `p`,
                      {
                        className: $e(
                          e.role === `user`
                            ? `ml-8 rounded-xl bg-secondary px-3 py-2 text-right`
                            : `mr-8`,
                        ),
                        children: e.text,
                      },
                      t,
                    ),
                  ),
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
export { et as component };
