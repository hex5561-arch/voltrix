var e = Object.create,
  t = Object.defineProperty,
  n = Object.getOwnPropertyDescriptor,
  r = Object.getOwnPropertyNames,
  i = Object.getPrototypeOf,
  a = Object.prototype.hasOwnProperty,
  o = (e, t) => () => (
    t || (e((t = { exports: {} }).exports, t), (e = null)),
    t.exports
  ),
  s = (e, i, o, s) => {
    if ((i && typeof i == `object`) || typeof i == `function`)
      for (var c = r(i), l = 0, u = c.length, d; l < u; l++)
        ((d = c[l]),
          !a.call(e, d) &&
            d !== o &&
            t(e, d, {
              get: ((e) => i[e]).bind(null, d),
              enumerable: !(s = n(i, d)) || s.enumerable,
            }));
    return e;
  },
  c = (n, r, o) => (
    (o = n == null ? {} : e(i(n))),
    s(
      r || !n || !n.__esModule || !a.call(n, `default`)
        ? t(o, `default`, { value: n, enumerable: !0 })
        : o,
      n,
    )
  );
(function () {
  let e = document.createElement(`link`).relList;
  if (e && e.supports && e.supports(`modulepreload`)) return;
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
  new MutationObserver((e) => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes)
          e.tagName === `LINK` && e.rel === `modulepreload` && n(e);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(e) {
    let t = {};
    return (
      e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      (t.credentials =
        e.crossOrigin === `use-credentials`
          ? `include`
          : e.crossOrigin === `anonymous`
            ? `omit`
            : `same-origin`),
      t
    );
  }
  function n(e) {
    if (e.ep) return;
    e.ep = !0;
    let n = t(e);
    fetch(e.href, n);
  }
})();
var l = o((e) => {
    function t(e, t) {
      var n = e.length;
      e.push(t);
      a: for (; 0 < n;) {
        var r = (n - 1) >>> 1,
          a = e[r];
        if (0 < i(a, t)) ((e[r] = t), (e[n] = a), (n = r));
        else break a;
      }
    }
    function n(e) {
      return e.length === 0 ? null : e[0];
    }
    function r(e) {
      if (e.length === 0) return null;
      var t = e[0],
        n = e.pop();
      if (n !== t) {
        e[0] = n;
        a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
          var s = 2 * (r + 1) - 1,
            c = e[s],
            l = s + 1,
            u = e[l];
          if (0 > i(c, n))
            l < a && 0 > i(u, c)
              ? ((e[r] = u), (e[l] = n), (r = l))
              : ((e[r] = c), (e[s] = n), (r = s));
          else if (l < a && 0 > i(u, n)) ((e[r] = u), (e[l] = n), (r = l));
          else break a;
        }
      }
      return t;
    }
    function i(e, t) {
      var n = e.sortIndex - t.sortIndex;
      return n === 0 ? e.id - t.id : n;
    }
    if (
      ((e.unstable_now = void 0),
      typeof performance == `object` && typeof performance.now == `function`)
    ) {
      var a = performance;
      e.unstable_now = function () {
        return a.now();
      };
    } else {
      var o = Date,
        s = o.now();
      e.unstable_now = function () {
        return o.now() - s;
      };
    }
    var c = [],
      l = [],
      u = 1,
      d = null,
      f = 3,
      p = !1,
      m = !1,
      h = !1,
      g = !1,
      _ = typeof setTimeout == `function` ? setTimeout : null,
      v = typeof clearTimeout == `function` ? clearTimeout : null,
      y = typeof setImmediate < `u` ? setImmediate : null;
    function b(e) {
      for (var i = n(l); i !== null;) {
        if (i.callback === null) r(l);
        else if (i.startTime <= e)
          (r(l), (i.sortIndex = i.expirationTime), t(c, i));
        else break;
        i = n(l);
      }
    }
    function x(e) {
      if (((h = !1), b(e), !m))
        if (n(c) !== null) ((m = !0), S || ((S = !0), E()));
        else {
          var t = n(l);
          t !== null && ie(x, t.startTime - e);
        }
    }
    var S = !1,
      C = -1,
      w = 5,
      T = -1;
    function ee() {
      return g ? !0 : !(e.unstable_now() - T < w);
    }
    function te() {
      if (((g = !1), S)) {
        var t = e.unstable_now();
        T = t;
        var i = !0;
        try {
          a: {
            ((m = !1), h && ((h = !1), v(C), (C = -1)), (p = !0));
            var a = f;
            try {
              b: {
                for (
                  b(t), d = n(c);
                  d !== null && !(d.expirationTime > t && ee());
                ) {
                  var o = d.callback;
                  if (typeof o == `function`) {
                    ((d.callback = null), (f = d.priorityLevel));
                    var s = o(d.expirationTime <= t);
                    if (((t = e.unstable_now()), typeof s == `function`)) {
                      ((d.callback = s), b(t), (i = !0));
                      break b;
                    }
                    (d === n(c) && r(c), b(t));
                  } else r(c);
                  d = n(c);
                }
                if (d !== null) i = !0;
                else {
                  var u = n(l);
                  (u !== null && ie(x, u.startTime - t), (i = !1));
                }
              }
              break a;
            } finally {
              ((d = null), (f = a), (p = !1));
            }
          }
        } finally {
          i ? E() : (S = !1);
        }
      }
    }
    var E;
    if (typeof y == `function`)
      E = function () {
        y(te);
      };
    else if (typeof MessageChannel < `u`) {
      var ne = new MessageChannel(),
        re = ne.port2;
      ((ne.port1.onmessage = te),
        (E = function () {
          re.postMessage(null);
        }));
    } else
      E = function () {
        _(te, 0);
      };
    function ie(t, n) {
      C = _(function () {
        t(e.unstable_now());
      }, n);
    }
    ((e.unstable_IdlePriority = 5),
      (e.unstable_ImmediatePriority = 1),
      (e.unstable_LowPriority = 4),
      (e.unstable_NormalPriority = 3),
      (e.unstable_Profiling = null),
      (e.unstable_UserBlockingPriority = 2),
      (e.unstable_cancelCallback = function (e) {
        e.callback = null;
      }),
      (e.unstable_forceFrameRate = function (e) {
        0 > e || 125 < e
          ? console.error(
              `forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`,
            )
          : (w = 0 < e ? Math.floor(1e3 / e) : 5);
      }),
      (e.unstable_getCurrentPriorityLevel = function () {
        return f;
      }),
      (e.unstable_next = function (e) {
        switch (f) {
          case 1:
          case 2:
          case 3:
            var t = 3;
            break;
          default:
            t = f;
        }
        var n = f;
        f = t;
        try {
          return e();
        } finally {
          f = n;
        }
      }),
      (e.unstable_requestPaint = function () {
        g = !0;
      }),
      (e.unstable_runWithPriority = function (e, t) {
        switch (e) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            e = 3;
        }
        var n = f;
        f = e;
        try {
          return t();
        } finally {
          f = n;
        }
      }),
      (e.unstable_scheduleCallback = function (r, i, a) {
        var o = e.unstable_now();
        switch (
          (typeof a == `object` && a
            ? ((a = a.delay), (a = typeof a == `number` && 0 < a ? o + a : o))
            : (a = o),
          r)
        ) {
          case 1:
            var s = -1;
            break;
          case 2:
            s = 250;
            break;
          case 5:
            s = 1073741823;
            break;
          case 4:
            s = 1e4;
            break;
          default:
            s = 5e3;
        }
        return (
          (s = a + s),
          (r = {
            id: u++,
            callback: i,
            priorityLevel: r,
            startTime: a,
            expirationTime: s,
            sortIndex: -1,
          }),
          a > o
            ? ((r.sortIndex = a),
              t(l, r),
              n(c) === null &&
                r === n(l) &&
                (h ? (v(C), (C = -1)) : (h = !0), ie(x, a - o)))
            : ((r.sortIndex = s),
              t(c, r),
              m || p || ((m = !0), S || ((S = !0), E()))),
          r
        );
      }),
      (e.unstable_shouldYield = ee),
      (e.unstable_wrapCallback = function (e) {
        var t = f;
        return function () {
          var n = f;
          f = t;
          try {
            return e.apply(this, arguments);
          } finally {
            f = n;
          }
        };
      }));
  }),
  u = o((e, t) => {
    t.exports = l();
  }),
  d = o((e) => {
    var t = Symbol.for(`react.transitional.element`),
      n = Symbol.for(`react.portal`),
      r = Symbol.for(`react.fragment`),
      i = Symbol.for(`react.strict_mode`),
      a = Symbol.for(`react.profiler`),
      o = Symbol.for(`react.consumer`),
      s = Symbol.for(`react.context`),
      c = Symbol.for(`react.forward_ref`),
      l = Symbol.for(`react.suspense`),
      u = Symbol.for(`react.memo`),
      d = Symbol.for(`react.lazy`),
      f = Symbol.for(`react.activity`),
      p = Symbol.iterator;
    function m(e) {
      return typeof e != `object` || !e
        ? null
        : ((e = (p && e[p]) || e[`@@iterator`]),
          typeof e == `function` ? e : null);
    }
    var h = {
        isMounted: function () {
          return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
      },
      g = Object.assign,
      _ = {};
    function v(e, t, n) {
      ((this.props = e),
        (this.context = t),
        (this.refs = _),
        (this.updater = n || h));
    }
    ((v.prototype.isReactComponent = {}),
      (v.prototype.setState = function (e, t) {
        if (typeof e != `object` && typeof e != `function` && e != null)
          throw Error(
            `takes an object of state variables to update or a function which returns an object of state variables.`,
          );
        this.updater.enqueueSetState(this, e, t, `setState`);
      }),
      (v.prototype.forceUpdate = function (e) {
        this.updater.enqueueForceUpdate(this, e, `forceUpdate`);
      }));
    function y() {}
    y.prototype = v.prototype;
    function b(e, t, n) {
      ((this.props = e),
        (this.context = t),
        (this.refs = _),
        (this.updater = n || h));
    }
    var x = (b.prototype = new y());
    ((x.constructor = b), g(x, v.prototype), (x.isPureReactComponent = !0));
    var S = Array.isArray;
    function C() {}
    var w = { H: null, A: null, T: null, S: null },
      T = Object.prototype.hasOwnProperty;
    function ee(e, n, r) {
      var i = r.ref;
      return {
        $$typeof: t,
        type: e,
        key: n,
        ref: i === void 0 ? null : i,
        props: r,
      };
    }
    function te(e, t) {
      return ee(e.type, t, e.props);
    }
    function E(e) {
      return typeof e == `object` && !!e && e.$$typeof === t;
    }
    function ne(e) {
      var t = { "=": `=0`, ":": `=2` };
      return (
        `$` +
        e.replace(/[=:]/g, function (e) {
          return t[e];
        })
      );
    }
    var re = /\/+/g;
    function ie(e, t) {
      return typeof e == `object` && e && e.key != null
        ? ne(`` + e.key)
        : t.toString(36);
    }
    function ae(e) {
      switch (e.status) {
        case `fulfilled`:
          return e.value;
        case `rejected`:
          throw e.reason;
        default:
          switch (
            (typeof e.status == `string`
              ? e.then(C, C)
              : ((e.status = `pending`),
                e.then(
                  function (t) {
                    e.status === `pending` &&
                      ((e.status = `fulfilled`), (e.value = t));
                  },
                  function (t) {
                    e.status === `pending` &&
                      ((e.status = `rejected`), (e.reason = t));
                  },
                )),
            e.status)
          ) {
            case `fulfilled`:
              return e.value;
            case `rejected`:
              throw e.reason;
          }
      }
      throw e;
    }
    function oe(e, r, i, a, o) {
      var s = typeof e;
      (s === `undefined` || s === `boolean`) && (e = null);
      var c = !1;
      if (e === null) c = !0;
      else
        switch (s) {
          case `bigint`:
          case `string`:
          case `number`:
            c = !0;
            break;
          case `object`:
            switch (e.$$typeof) {
              case t:
              case n:
                c = !0;
                break;
              case d:
                return ((c = e._init), oe(c(e._payload), r, i, a, o));
            }
        }
      if (c)
        return (
          (o = o(e)),
          (c = a === `` ? `.` + ie(e, 0) : a),
          S(o)
            ? ((i = ``),
              c != null && (i = c.replace(re, `$&/`) + `/`),
              oe(o, r, i, ``, function (e) {
                return e;
              }))
            : o != null &&
              (E(o) &&
                (o = te(
                  o,
                  i +
                    (o.key == null || (e && e.key === o.key)
                      ? ``
                      : (`` + o.key).replace(re, `$&/`) + `/`) +
                    c,
                )),
              r.push(o)),
          1
        );
      c = 0;
      var l = a === `` ? `.` : a + `:`;
      if (S(e))
        for (var u = 0; u < e.length; u++)
          ((a = e[u]), (s = l + ie(a, u)), (c += oe(a, r, i, s, o)));
      else if (((u = m(e)), typeof u == `function`))
        for (e = u.call(e), u = 0; !(a = e.next()).done;)
          ((a = a.value), (s = l + ie(a, u++)), (c += oe(a, r, i, s, o)));
      else if (s === `object`) {
        if (typeof e.then == `function`) return oe(ae(e), r, i, a, o);
        throw (
          (r = String(e)),
          Error(
            `Objects are not valid as a React child (found: ` +
              (r === `[object Object]`
                ? `object with keys {` + Object.keys(e).join(`, `) + `}`
                : r) +
              `). If you meant to render a collection of children, use an array instead.`,
          )
        );
      }
      return c;
    }
    function se(e, t, n) {
      if (e == null) return e;
      var r = [],
        i = 0;
      return (
        oe(e, r, ``, ``, function (e) {
          return t.call(n, e, i++);
        }),
        r
      );
    }
    function ce(e) {
      if (e._status === -1) {
        var t = e._result;
        ((t = t()),
          t.then(
            function (t) {
              (e._status === 0 || e._status === -1) &&
                ((e._status = 1), (e._result = t));
            },
            function (t) {
              (e._status === 0 || e._status === -1) &&
                ((e._status = 2), (e._result = t));
            },
          ),
          e._status === -1 && ((e._status = 0), (e._result = t)));
      }
      if (e._status === 1) return e._result.default;
      throw e._result;
    }
    var D =
        typeof reportError == `function`
          ? reportError
          : function (e) {
              if (
                typeof window == `object` &&
                typeof window.ErrorEvent == `function`
              ) {
                var t = new window.ErrorEvent(`error`, {
                  bubbles: !0,
                  cancelable: !0,
                  message:
                    typeof e == `object` && e && typeof e.message == `string`
                      ? String(e.message)
                      : String(e),
                  error: e,
                });
                if (!window.dispatchEvent(t)) return;
              } else if (
                typeof process == `object` &&
                typeof process.emit == `function`
              ) {
                process.emit(`uncaughtException`, e);
                return;
              }
              console.error(e);
            },
      O = {
        map: se,
        forEach: function (e, t, n) {
          se(
            e,
            function () {
              t.apply(this, arguments);
            },
            n,
          );
        },
        count: function (e) {
          var t = 0;
          return (
            se(e, function () {
              t++;
            }),
            t
          );
        },
        toArray: function (e) {
          return (
            se(e, function (e) {
              return e;
            }) || []
          );
        },
        only: function (e) {
          if (!E(e))
            throw Error(
              `React.Children.only expected to receive a single React element child.`,
            );
          return e;
        },
      };
    ((e.Activity = f),
      (e.Children = O),
      (e.Component = v),
      (e.Fragment = r),
      (e.Profiler = a),
      (e.PureComponent = b),
      (e.StrictMode = i),
      (e.Suspense = l),
      (e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = w),
      (e.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function (e) {
          return w.H.useMemoCache(e);
        },
      }),
      (e.cache = function (e) {
        return function () {
          return e.apply(null, arguments);
        };
      }),
      (e.cacheSignal = function () {
        return null;
      }),
      (e.cloneElement = function (e, t, n) {
        if (e == null)
          throw Error(
            `The argument must be a React element, but you passed ` + e + `.`,
          );
        var r = g({}, e.props),
          i = e.key;
        if (t != null)
          for (a in (t.key !== void 0 && (i = `` + t.key), t))
            !T.call(t, a) ||
              a === `key` ||
              a === `__self` ||
              a === `__source` ||
              (a === `ref` && t.ref === void 0) ||
              (r[a] = t[a]);
        var a = arguments.length - 2;
        if (a === 1) r.children = n;
        else if (1 < a) {
          for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
          r.children = o;
        }
        return ee(e.type, i, r);
      }),
      (e.createContext = function (e) {
        return (
          (e = {
            $$typeof: s,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
          }),
          (e.Provider = e),
          (e.Consumer = { $$typeof: o, _context: e }),
          e
        );
      }),
      (e.createElement = function (e, t, n) {
        var r,
          i = {},
          a = null;
        if (t != null)
          for (r in (t.key !== void 0 && (a = `` + t.key), t))
            T.call(t, r) &&
              r !== `key` &&
              r !== `__self` &&
              r !== `__source` &&
              (i[r] = t[r]);
        var o = arguments.length - 2;
        if (o === 1) i.children = n;
        else if (1 < o) {
          for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
          i.children = s;
        }
        if (e && e.defaultProps)
          for (r in ((o = e.defaultProps), o)) i[r] === void 0 && (i[r] = o[r]);
        return ee(e, a, i);
      }),
      (e.createRef = function () {
        return { current: null };
      }),
      (e.forwardRef = function (e) {
        return { $$typeof: c, render: e };
      }),
      (e.isValidElement = E),
      (e.lazy = function (e) {
        return {
          $$typeof: d,
          _payload: { _status: -1, _result: e },
          _init: ce,
        };
      }),
      (e.memo = function (e, t) {
        return { $$typeof: u, type: e, compare: t === void 0 ? null : t };
      }),
      (e.startTransition = function (e) {
        var t = w.T,
          n = {};
        w.T = n;
        try {
          var r = e(),
            i = w.S;
          (i !== null && i(n, r),
            typeof r == `object` &&
              r &&
              typeof r.then == `function` &&
              r.then(C, D));
        } catch (e) {
          D(e);
        } finally {
          (t !== null && n.types !== null && (t.types = n.types), (w.T = t));
        }
      }),
      (e.unstable_useCacheRefresh = function () {
        return w.H.useCacheRefresh();
      }),
      (e.use = function (e) {
        return w.H.use(e);
      }),
      (e.useActionState = function (e, t, n) {
        return w.H.useActionState(e, t, n);
      }),
      (e.useCallback = function (e, t) {
        return w.H.useCallback(e, t);
      }),
      (e.useContext = function (e) {
        return w.H.useContext(e);
      }),
      (e.useDebugValue = function () {}),
      (e.useDeferredValue = function (e, t) {
        return w.H.useDeferredValue(e, t);
      }),
      (e.useEffect = function (e, t) {
        return w.H.useEffect(e, t);
      }),
      (e.useEffectEvent = function (e) {
        return w.H.useEffectEvent(e);
      }),
      (e.useId = function () {
        return w.H.useId();
      }),
      (e.useImperativeHandle = function (e, t, n) {
        return w.H.useImperativeHandle(e, t, n);
      }),
      (e.useInsertionEffect = function (e, t) {
        return w.H.useInsertionEffect(e, t);
      }),
      (e.useLayoutEffect = function (e, t) {
        return w.H.useLayoutEffect(e, t);
      }),
      (e.useMemo = function (e, t) {
        return w.H.useMemo(e, t);
      }),
      (e.useOptimistic = function (e, t) {
        return w.H.useOptimistic(e, t);
      }),
      (e.useReducer = function (e, t, n) {
        return w.H.useReducer(e, t, n);
      }),
      (e.useRef = function (e) {
        return w.H.useRef(e);
      }),
      (e.useState = function (e) {
        return w.H.useState(e);
      }),
      (e.useSyncExternalStore = function (e, t, n) {
        return w.H.useSyncExternalStore(e, t, n);
      }),
      (e.useTransition = function () {
        return w.H.useTransition();
      }),
      (e.version = `19.2.8`));
  }),
  f = o((e, t) => {
    t.exports = d();
  }),
  p = o((e) => {
    var t = f();
    function n(e) {
      var t = `https://react.dev/errors/` + e;
      if (1 < arguments.length) {
        t += `?args[]=` + encodeURIComponent(arguments[1]);
        for (var n = 2; n < arguments.length; n++)
          t += `&args[]=` + encodeURIComponent(arguments[n]);
      }
      return (
        `Minified React error #` +
        e +
        `; visit ` +
        t +
        ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
      );
    }
    function r() {}
    var i = {
        d: {
          f: r,
          r: function () {
            throw Error(n(522));
          },
          D: r,
          C: r,
          L: r,
          m: r,
          X: r,
          S: r,
          M: r,
        },
        p: 0,
        findDOMNode: null,
      },
      a = Symbol.for(`react.portal`);
    function o(e, t, n) {
      var r =
        3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
      return {
        $$typeof: a,
        key: r == null ? null : `` + r,
        children: e,
        containerInfo: t,
        implementation: n,
      };
    }
    var s = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function c(e, t) {
      if (e === `font`) return ``;
      if (typeof t == `string`) return t === `use-credentials` ? t : ``;
    }
    ((e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i),
      (e.createPortal = function (e, t) {
        var r =
          2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!t || (t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11))
          throw Error(n(299));
        return o(e, t, null, r);
      }),
      (e.flushSync = function (e) {
        var t = s.T,
          n = i.p;
        try {
          if (((s.T = null), (i.p = 2), e)) return e();
        } finally {
          ((s.T = t), (i.p = n), i.d.f());
        }
      }),
      (e.preconnect = function (e, t) {
        typeof e == `string` &&
          (t
            ? ((t = t.crossOrigin),
              (t =
                typeof t == `string`
                  ? t === `use-credentials`
                    ? t
                    : ``
                  : void 0))
            : (t = null),
          i.d.C(e, t));
      }),
      (e.prefetchDNS = function (e) {
        typeof e == `string` && i.d.D(e);
      }),
      (e.preinit = function (e, t) {
        if (typeof e == `string` && t && typeof t.as == `string`) {
          var n = t.as,
            r = c(n, t.crossOrigin),
            a = typeof t.integrity == `string` ? t.integrity : void 0,
            o = typeof t.fetchPriority == `string` ? t.fetchPriority : void 0;
          n === `style`
            ? i.d.S(
                e,
                typeof t.precedence == `string` ? t.precedence : void 0,
                { crossOrigin: r, integrity: a, fetchPriority: o },
              )
            : n === `script` &&
              i.d.X(e, {
                crossOrigin: r,
                integrity: a,
                fetchPriority: o,
                nonce: typeof t.nonce == `string` ? t.nonce : void 0,
              });
        }
      }),
      (e.preinitModule = function (e, t) {
        if (typeof e == `string`)
          if (typeof t == `object` && t) {
            if (t.as == null || t.as === `script`) {
              var n = c(t.as, t.crossOrigin);
              i.d.M(e, {
                crossOrigin: n,
                integrity:
                  typeof t.integrity == `string` ? t.integrity : void 0,
                nonce: typeof t.nonce == `string` ? t.nonce : void 0,
              });
            }
          } else t ?? i.d.M(e);
      }),
      (e.preload = function (e, t) {
        if (
          typeof e == `string` &&
          typeof t == `object` &&
          t &&
          typeof t.as == `string`
        ) {
          var n = t.as,
            r = c(n, t.crossOrigin);
          i.d.L(e, n, {
            crossOrigin: r,
            integrity: typeof t.integrity == `string` ? t.integrity : void 0,
            nonce: typeof t.nonce == `string` ? t.nonce : void 0,
            type: typeof t.type == `string` ? t.type : void 0,
            fetchPriority:
              typeof t.fetchPriority == `string` ? t.fetchPriority : void 0,
            referrerPolicy:
              typeof t.referrerPolicy == `string` ? t.referrerPolicy : void 0,
            imageSrcSet:
              typeof t.imageSrcSet == `string` ? t.imageSrcSet : void 0,
            imageSizes: typeof t.imageSizes == `string` ? t.imageSizes : void 0,
            media: typeof t.media == `string` ? t.media : void 0,
          });
        }
      }),
      (e.preloadModule = function (e, t) {
        if (typeof e == `string`)
          if (t) {
            var n = c(t.as, t.crossOrigin);
            i.d.m(e, {
              as: typeof t.as == `string` && t.as !== `script` ? t.as : void 0,
              crossOrigin: n,
              integrity: typeof t.integrity == `string` ? t.integrity : void 0,
            });
          } else i.d.m(e);
      }),
      (e.requestFormReset = function (e) {
        i.d.r(e);
      }),
      (e.unstable_batchedUpdates = function (e, t) {
        return e(t);
      }),
      (e.useFormState = function (e, t, n) {
        return s.H.useFormState(e, t, n);
      }),
      (e.useFormStatus = function () {
        return s.H.useHostTransitionStatus();
      }),
      (e.version = `19.2.8`));
  }),
  m = o((e, t) => {
    function n() {
      if (!(
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` ||
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`
      ))
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
        } catch (e) {
          console.error(e);
        }
    }
    (n(), (t.exports = p()));
  }),
  h = o((e) => {
    var t = u(),
      n = f(),
      r = m();
    function i(e) {
      var t = `https://react.dev/errors/` + e;
      if (1 < arguments.length) {
        t += `?args[]=` + encodeURIComponent(arguments[1]);
        for (var n = 2; n < arguments.length; n++)
          t += `&args[]=` + encodeURIComponent(arguments[n]);
      }
      return (
        `Minified React error #` +
        e +
        `; visit ` +
        t +
        ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
      );
    }
    function a(e) {
      return !(
        !e ||
        (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11)
      );
    }
    function o(e) {
      var t = e,
        n = e;
      if (e.alternate) for (; t.return;) t = t.return;
      else {
        e = t;
        do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return));
        while (e);
      }
      return t.tag === 3 ? n : null;
    }
    function s(e) {
      if (e.tag === 13) {
        var t = e.memoizedState;
        if (
          (t === null &&
            ((e = e.alternate), e !== null && (t = e.memoizedState)),
          t !== null)
        )
          return t.dehydrated;
      }
      return null;
    }
    function c(e) {
      if (e.tag === 31) {
        var t = e.memoizedState;
        if (
          (t === null &&
            ((e = e.alternate), e !== null && (t = e.memoizedState)),
          t !== null)
        )
          return t.dehydrated;
      }
      return null;
    }
    function l(e) {
      if (o(e) !== e) throw Error(i(188));
    }
    function d(e) {
      var t = e.alternate;
      if (!t) {
        if (((t = o(e)), t === null)) throw Error(i(188));
        return t === e ? e : null;
      }
      for (var n = e, r = t; ;) {
        var a = n.return;
        if (a === null) break;
        var s = a.alternate;
        if (s === null) {
          if (((r = a.return), r !== null)) {
            n = r;
            continue;
          }
          break;
        }
        if (a.child === s.child) {
          for (s = a.child; s;) {
            if (s === n) return (l(a), e);
            if (s === r) return (l(a), t);
            s = s.sibling;
          }
          throw Error(i(188));
        }
        if (n.return !== r.return) ((n = a), (r = s));
        else {
          for (var c = !1, u = a.child; u;) {
            if (u === n) {
              ((c = !0), (n = a), (r = s));
              break;
            }
            if (u === r) {
              ((c = !0), (r = a), (n = s));
              break;
            }
            u = u.sibling;
          }
          if (!c) {
            for (u = s.child; u;) {
              if (u === n) {
                ((c = !0), (n = s), (r = a));
                break;
              }
              if (u === r) {
                ((c = !0), (r = s), (n = a));
                break;
              }
              u = u.sibling;
            }
            if (!c) throw Error(i(189));
          }
        }
        if (n.alternate !== r) throw Error(i(190));
      }
      if (n.tag !== 3) throw Error(i(188));
      return n.stateNode.current === n ? e : t;
    }
    function p(e) {
      var t = e.tag;
      if (t === 5 || t === 26 || t === 27 || t === 6) return e;
      for (e = e.child; e !== null;) {
        if (((t = p(e)), t !== null)) return t;
        e = e.sibling;
      }
      return null;
    }
    var h = Object.assign,
      g = Symbol.for(`react.element`),
      _ = Symbol.for(`react.transitional.element`),
      v = Symbol.for(`react.portal`),
      y = Symbol.for(`react.fragment`),
      b = Symbol.for(`react.strict_mode`),
      x = Symbol.for(`react.profiler`),
      S = Symbol.for(`react.consumer`),
      C = Symbol.for(`react.context`),
      w = Symbol.for(`react.forward_ref`),
      T = Symbol.for(`react.suspense`),
      ee = Symbol.for(`react.suspense_list`),
      te = Symbol.for(`react.memo`),
      E = Symbol.for(`react.lazy`),
      ne = Symbol.for(`react.activity`),
      re = Symbol.for(`react.memo_cache_sentinel`),
      ie = Symbol.iterator;
    function ae(e) {
      return typeof e != `object` || !e
        ? null
        : ((e = (ie && e[ie]) || e[`@@iterator`]),
          typeof e == `function` ? e : null);
    }
    var oe = Symbol.for(`react.client.reference`);
    function se(e) {
      if (e == null) return null;
      if (typeof e == `function`)
        return e.$$typeof === oe ? null : e.displayName || e.name || null;
      if (typeof e == `string`) return e;
      switch (e) {
        case y:
          return `Fragment`;
        case x:
          return `Profiler`;
        case b:
          return `StrictMode`;
        case T:
          return `Suspense`;
        case ee:
          return `SuspenseList`;
        case ne:
          return `Activity`;
      }
      if (typeof e == `object`)
        switch (e.$$typeof) {
          case v:
            return `Portal`;
          case C:
            return e.displayName || `Context`;
          case S:
            return (e._context.displayName || `Context`) + `.Consumer`;
          case w:
            var t = e.render;
            return (
              (e = e.displayName),
              (e ||=
                ((e = t.displayName || t.name || ``),
                e === `` ? `ForwardRef` : `ForwardRef(` + e + `)`)),
              e
            );
          case te:
            return (
              (t = e.displayName || null),
              t === null ? se(e.type) || `Memo` : t
            );
          case E:
            ((t = e._payload), (e = e._init));
            try {
              return se(e(t));
            } catch {}
        }
      return null;
    }
    var ce = Array.isArray,
      D = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      O = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      le = { pending: !1, data: null, method: null, action: null },
      ue = [],
      de = -1;
    function k(e) {
      return { current: e };
    }
    function A(e) {
      0 > de || ((e.current = ue[de]), (ue[de] = null), de--);
    }
    function j(e, t) {
      (de++, (ue[de] = e.current), (e.current = t));
    }
    var fe = k(null),
      M = k(null),
      pe = k(null),
      me = k(null);
    function he(e, t) {
      switch ((j(pe, t), j(M, e), j(fe, null), t.nodeType)) {
        case 9:
        case 11:
          e = (e = t.documentElement) && (e = e.namespaceURI) ? Wd(e) : 0;
          break;
        default:
          if (((e = t.tagName), (t = t.namespaceURI)))
            ((t = Wd(t)), (e = Gd(t, e)));
          else
            switch (e) {
              case `svg`:
                e = 1;
                break;
              case `math`:
                e = 2;
                break;
              default:
                e = 0;
            }
      }
      (A(fe), j(fe, e));
    }
    function ge() {
      (A(fe), A(M), A(pe));
    }
    function _e(e) {
      e.memoizedState !== null && j(me, e);
      var t = fe.current,
        n = Gd(t, e.type);
      t !== n && (j(M, e), j(fe, n));
    }
    function ve(e) {
      (M.current === e && (A(fe), A(M)),
        me.current === e && (A(me), (tp._currentValue = le)));
    }
    var ye, be;
    function xe(e) {
      if (ye === void 0)
        try {
          throw Error();
        } catch (e) {
          var t = e.stack.trim().match(/\n( *(at )?)/);
          ((ye = (t && t[1]) || ``),
            (be =
              -1 <
              e.stack.indexOf(`
    at`)
                ? ` (<anonymous>)`
                : -1 < e.stack.indexOf(`@`)
                  ? `@unknown:0:0`
                  : ``));
        }
      return (
        `
` +
        ye +
        e +
        be
      );
    }
    var Se = !1;
    function Ce(e, t) {
      if (!e || Se) return ``;
      Se = !0;
      var n = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      try {
        var r = {
          DetermineComponentFrameRoot: function () {
            try {
              if (t) {
                var n = function () {
                  throw Error();
                };
                if (
                  (Object.defineProperty(n.prototype, "props", {
                    set: function () {
                      throw Error();
                    },
                  }),
                  typeof Reflect == `object` && Reflect.construct)
                ) {
                  try {
                    Reflect.construct(n, []);
                  } catch (e) {
                    var r = e;
                  }
                  Reflect.construct(e, [], n);
                } else {
                  try {
                    n.call();
                  } catch (e) {
                    r = e;
                  }
                  e.call(n.prototype);
                }
              } else {
                try {
                  throw Error();
                } catch (e) {
                  r = e;
                }
                (n = e()) &&
                  typeof n.catch == `function` &&
                  n.catch(function () {});
              }
            } catch (e) {
              if (e && r && typeof e.stack == `string`)
                return [e.stack, r.stack];
            }
            return [null, null];
          },
        };
        r.DetermineComponentFrameRoot.displayName = `DetermineComponentFrameRoot`;
        var i = Object.getOwnPropertyDescriptor(
          r.DetermineComponentFrameRoot,
          `name`,
        );
        i &&
          i.configurable &&
          Object.defineProperty(r.DetermineComponentFrameRoot, "name", {
            value: `DetermineComponentFrameRoot`,
          });
        var a = r.DetermineComponentFrameRoot(),
          o = a[0],
          s = a[1];
        if (o && s) {
          var c = o.split(`
`),
            l = s.split(`
`);
          for (
            i = r = 0;
            r < c.length && !c[r].includes(`DetermineComponentFrameRoot`);
          )
            r++;
          for (; i < l.length && !l[i].includes(`DetermineComponentFrameRoot`);)
            i++;
          if (r === c.length || i === l.length)
            for (
              r = c.length - 1, i = l.length - 1;
              1 <= r && 0 <= i && c[r] !== l[i];
            )
              i--;
          for (; 1 <= r && 0 <= i; r--, i--)
            if (c[r] !== l[i]) {
              if (r !== 1 || i !== 1)
                do
                  if ((r--, i--, 0 > i || c[r] !== l[i])) {
                    var u =
                      `
` + c[r].replace(` at new `, ` at `);
                    return (
                      e.displayName &&
                        u.includes(`<anonymous>`) &&
                        (u = u.replace(`<anonymous>`, e.displayName)),
                      u
                    );
                  }
                while (1 <= r && 0 <= i);
              break;
            }
        }
      } finally {
        ((Se = !1), (Error.prepareStackTrace = n));
      }
      return (n = e ? e.displayName || e.name : ``) ? xe(n) : ``;
    }
    function we(e, t) {
      switch (e.tag) {
        case 26:
        case 27:
        case 5:
          return xe(e.type);
        case 16:
          return xe(`Lazy`);
        case 13:
          return e.child !== t && t !== null
            ? xe(`Suspense Fallback`)
            : xe(`Suspense`);
        case 19:
          return xe(`SuspenseList`);
        case 0:
        case 15:
          return Ce(e.type, !1);
        case 11:
          return Ce(e.type.render, !1);
        case 1:
          return Ce(e.type, !0);
        case 31:
          return xe(`Activity`);
        default:
          return ``;
      }
    }
    function Te(e) {
      try {
        var t = ``,
          n = null;
        do ((t += we(e, n)), (n = e), (e = e.return));
        while (e);
        return t;
      } catch (e) {
        return (
          `
Error generating stack: ` +
          e.message +
          `
` +
          e.stack
        );
      }
    }
    var Ee = Object.prototype.hasOwnProperty,
      De = t.unstable_scheduleCallback,
      Oe = t.unstable_cancelCallback,
      ke = t.unstable_shouldYield,
      Ae = t.unstable_requestPaint,
      je = t.unstable_now,
      Me = t.unstable_getCurrentPriorityLevel,
      Ne = t.unstable_ImmediatePriority,
      Pe = t.unstable_UserBlockingPriority,
      Fe = t.unstable_NormalPriority,
      Ie = t.unstable_LowPriority,
      Le = t.unstable_IdlePriority,
      Re = t.log,
      ze = t.unstable_setDisableYieldValue,
      Be = null,
      Ve = null;
    function He(e) {
      if (
        (typeof Re == `function` && ze(e),
        Ve && typeof Ve.setStrictMode == `function`)
      )
        try {
          Ve.setStrictMode(Be, e);
        } catch {}
    }
    var Ue = Math.clz32 ? Math.clz32 : Ke,
      We = Math.log,
      Ge = Math.LN2;
    function Ke(e) {
      return ((e >>>= 0), e === 0 ? 32 : (31 - ((We(e) / Ge) | 0)) | 0);
    }
    var qe = 256,
      Je = 262144,
      Ye = 4194304;
    function Xe(e) {
      var t = e & 42;
      if (t !== 0) return t;
      switch (e & -e) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 4:
          return 4;
        case 8:
          return 8;
        case 16:
          return 16;
        case 32:
          return 32;
        case 64:
          return 64;
        case 128:
          return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
          return e & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return e & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return e & 62914560;
        case 67108864:
          return 67108864;
        case 134217728:
          return 134217728;
        case 268435456:
          return 268435456;
        case 536870912:
          return 536870912;
        case 1073741824:
          return 0;
        default:
          return e;
      }
    }
    function Ze(e, t, n) {
      var r = e.pendingLanes;
      if (r === 0) return 0;
      var i = 0,
        a = e.suspendedLanes,
        o = e.pingedLanes;
      e = e.warmLanes;
      var s = r & 134217727;
      return (
        s === 0
          ? ((s = r & ~a),
            s === 0
              ? o === 0
                ? n || ((n = r & ~e), n !== 0 && (i = Xe(n)))
                : (i = Xe(o))
              : (i = Xe(s)))
          : ((r = s & ~a),
            r === 0
              ? ((o &= s),
                o === 0
                  ? n || ((n = s & ~e), n !== 0 && (i = Xe(n)))
                  : (i = Xe(o)))
              : (i = Xe(r))),
        i === 0
          ? 0
          : t !== 0 &&
              t !== i &&
              (t & a) === 0 &&
              ((a = i & -i), (n = t & -t), a >= n || (a === 32 && n & 4194048))
            ? t
            : i
      );
    }
    function Qe(e, t) {
      return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
    }
    function $e(e, t) {
      switch (e) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
          return t + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return t + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return -1;
      }
    }
    function et() {
      var e = Ye;
      return ((Ye <<= 1), !(Ye & 62914560) && (Ye = 4194304), e);
    }
    function tt(e) {
      for (var t = [], n = 0; 31 > n; n++) t.push(e);
      return t;
    }
    function nt(e, t) {
      ((e.pendingLanes |= t),
        t !== 268435456 &&
          ((e.suspendedLanes = 0), (e.pingedLanes = 0), (e.warmLanes = 0)));
    }
    function rt(e, t, n, r, i, a) {
      var o = e.pendingLanes;
      ((e.pendingLanes = n),
        (e.suspendedLanes = 0),
        (e.pingedLanes = 0),
        (e.warmLanes = 0),
        (e.expiredLanes &= n),
        (e.entangledLanes &= n),
        (e.errorRecoveryDisabledLanes &= n),
        (e.shellSuspendCounter = 0));
      var s = e.entanglements,
        c = e.expirationTimes,
        l = e.hiddenUpdates;
      for (n = o & ~n; 0 < n;) {
        var u = 31 - Ue(n),
          d = 1 << u;
        ((s[u] = 0), (c[u] = -1));
        var f = l[u];
        if (f !== null)
          for (l[u] = null, u = 0; u < f.length; u++) {
            var p = f[u];
            p !== null && (p.lane &= -536870913);
          }
        n &= ~d;
      }
      (r !== 0 && it(e, r, 0),
        a !== 0 &&
          i === 0 &&
          e.tag !== 0 &&
          (e.suspendedLanes |= a & ~(o & ~t)));
    }
    function it(e, t, n) {
      ((e.pendingLanes |= t), (e.suspendedLanes &= ~t));
      var r = 31 - Ue(t);
      ((e.entangledLanes |= t),
        (e.entanglements[r] = e.entanglements[r] | 1073741824 | (n & 261930)));
    }
    function at(e, t) {
      var n = (e.entangledLanes |= t);
      for (e = e.entanglements; n;) {
        var r = 31 - Ue(n),
          i = 1 << r;
        ((i & t) | (e[r] & t) && (e[r] |= t), (n &= ~i));
      }
    }
    function ot(e, t) {
      var n = t & -t;
      return (
        (n = n & 42 ? 1 : st(n)),
        (n & (e.suspendedLanes | t)) === 0 ? n : 0
      );
    }
    function st(e) {
      switch (e) {
        case 2:
          e = 1;
          break;
        case 8:
          e = 4;
          break;
        case 32:
          e = 16;
          break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          e = 128;
          break;
        case 268435456:
          e = 134217728;
          break;
        default:
          e = 0;
      }
      return e;
    }
    function ct(e) {
      return (
        (e &= -e),
        2 < e ? (8 < e ? (e & 134217727 ? 32 : 268435456) : 8) : 2
      );
    }
    function lt() {
      var e = O.p;
      return e === 0 ? ((e = window.event), e === void 0 ? 32 : _p(e.type)) : e;
    }
    function ut(e, t) {
      var n = O.p;
      try {
        return ((O.p = e), t());
      } finally {
        O.p = n;
      }
    }
    var dt = Math.random().toString(36).slice(2),
      ft = `__reactFiber$` + dt,
      pt = `__reactProps$` + dt,
      mt = `__reactContainer$` + dt,
      ht = `__reactEvents$` + dt,
      gt = `__reactListeners$` + dt,
      _t = `__reactHandles$` + dt,
      vt = `__reactResources$` + dt,
      yt = `__reactMarker$` + dt;
    function bt(e) {
      (delete e[ft], delete e[pt], delete e[ht], delete e[gt], delete e[_t]);
    }
    function xt(e) {
      var t = e[ft];
      if (t) return t;
      for (var n = e.parentNode; n;) {
        if ((t = n[mt] || n[ft])) {
          if (
            ((n = t.alternate),
            t.child !== null || (n !== null && n.child !== null))
          )
            for (e = mf(e); e !== null;) {
              if ((n = e[ft])) return n;
              e = mf(e);
            }
          return t;
        }
        ((e = n), (n = e.parentNode));
      }
      return null;
    }
    function St(e) {
      if ((e = e[ft] || e[mt])) {
        var t = e.tag;
        if (
          t === 5 ||
          t === 6 ||
          t === 13 ||
          t === 31 ||
          t === 26 ||
          t === 27 ||
          t === 3
        )
          return e;
      }
      return null;
    }
    function Ct(e) {
      var t = e.tag;
      if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
      throw Error(i(33));
    }
    function wt(e) {
      var t = e[vt];
      return (
        (t ||= e[vt] =
          { hoistableStyles: new Map(), hoistableScripts: new Map() }),
        t
      );
    }
    function Tt(e) {
      e[yt] = !0;
    }
    var Et = new Set(),
      Dt = {};
    function Ot(e, t) {
      (kt(e, t), kt(e + `Capture`, t));
    }
    function kt(e, t) {
      for (Dt[e] = t, e = 0; e < t.length; e++) Et.add(t[e]);
    }
    var At = RegExp(
        `^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`,
      ),
      jt = {},
      Mt = {};
    function Nt(e) {
      return Ee.call(Mt, e)
        ? !0
        : Ee.call(jt, e)
          ? !1
          : At.test(e)
            ? (Mt[e] = !0)
            : ((jt[e] = !0), !1);
    }
    function Pt(e, t, n) {
      if (Nt(t))
        if (n === null) e.removeAttribute(t);
        else {
          switch (typeof n) {
            case `undefined`:
            case `function`:
            case `symbol`:
              e.removeAttribute(t);
              return;
            case `boolean`:
              var r = t.toLowerCase().slice(0, 5);
              if (r !== `data-` && r !== `aria-`) {
                e.removeAttribute(t);
                return;
              }
          }
          e.setAttribute(t, `` + n);
        }
    }
    function Ft(e, t, n) {
      if (n === null) e.removeAttribute(t);
      else {
        switch (typeof n) {
          case `undefined`:
          case `function`:
          case `symbol`:
          case `boolean`:
            e.removeAttribute(t);
            return;
        }
        e.setAttribute(t, `` + n);
      }
    }
    function It(e, t, n, r) {
      if (r === null) e.removeAttribute(n);
      else {
        switch (typeof r) {
          case `undefined`:
          case `function`:
          case `symbol`:
          case `boolean`:
            e.removeAttribute(n);
            return;
        }
        e.setAttributeNS(t, n, `` + r);
      }
    }
    function Lt(e) {
      switch (typeof e) {
        case `bigint`:
        case `boolean`:
        case `number`:
        case `string`:
        case `undefined`:
          return e;
        case `object`:
          return e;
        default:
          return ``;
      }
    }
    function Rt(e) {
      var t = e.type;
      return (
        (e = e.nodeName) &&
        e.toLowerCase() === `input` &&
        (t === `checkbox` || t === `radio`)
      );
    }
    function zt(e, t, n) {
      var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
      if (
        !e.hasOwnProperty(t) &&
        r !== void 0 &&
        typeof r.get == `function` &&
        typeof r.set == `function`
      ) {
        var i = r.get,
          a = r.set;
        return (
          Object.defineProperty(e, t, {
            configurable: !0,
            get: function () {
              return i.call(this);
            },
            set: function (e) {
              ((n = `` + e), a.call(this, e));
            },
          }),
          Object.defineProperty(e, t, { enumerable: r.enumerable }),
          {
            getValue: function () {
              return n;
            },
            setValue: function (e) {
              n = `` + e;
            },
            stopTracking: function () {
              ((e._valueTracker = null), delete e[t]);
            },
          }
        );
      }
    }
    function Bt(e) {
      if (!e._valueTracker) {
        var t = Rt(e) ? `checked` : `value`;
        e._valueTracker = zt(e, t, `` + e[t]);
      }
    }
    function Vt(e) {
      if (!e) return !1;
      var t = e._valueTracker;
      if (!t) return !0;
      var n = t.getValue(),
        r = ``;
      return (
        e && (r = Rt(e) ? (e.checked ? `true` : `false`) : e.value),
        (e = r),
        e !== n && (t.setValue(e), !0)
      );
    }
    function Ht(e) {
      if (((e ||= typeof document < `u` ? document : void 0), e === void 0))
        return null;
      try {
        return e.activeElement || e.body;
      } catch {
        return e.body;
      }
    }
    var Ut = /[\n"\\]/g;
    function Wt(e) {
      return e.replace(Ut, function (e) {
        return `\\` + e.charCodeAt(0).toString(16) + ` `;
      });
    }
    function Gt(e, t, n, r, i, a, o, s) {
      ((e.name = ``),
        o != null &&
        typeof o != `function` &&
        typeof o != `symbol` &&
        typeof o != `boolean`
          ? (e.type = o)
          : e.removeAttribute(`type`),
        t == null
          ? (o !== `submit` && o !== `reset`) || e.removeAttribute(`value`)
          : o === `number`
            ? ((t === 0 && e.value === ``) || e.value != t) &&
              (e.value = `` + Lt(t))
            : e.value !== `` + Lt(t) && (e.value = `` + Lt(t)),
        t == null
          ? n == null
            ? r != null && e.removeAttribute(`value`)
            : qt(e, o, Lt(n))
          : qt(e, o, Lt(t)),
        i == null && a != null && (e.defaultChecked = !!a),
        i != null &&
          (e.checked = i && typeof i != `function` && typeof i != `symbol`),
        s != null &&
        typeof s != `function` &&
        typeof s != `symbol` &&
        typeof s != `boolean`
          ? (e.name = `` + Lt(s))
          : e.removeAttribute(`name`));
    }
    function Kt(e, t, n, r, i, a, o, s) {
      if (
        (a != null &&
          typeof a != `function` &&
          typeof a != `symbol` &&
          typeof a != `boolean` &&
          (e.type = a),
        t != null || n != null)
      ) {
        if (!((a !== `submit` && a !== `reset`) || t != null)) {
          Bt(e);
          return;
        }
        ((n = n == null ? `` : `` + Lt(n)),
          (t = t == null ? n : `` + Lt(t)),
          s || t === e.value || (e.value = t),
          (e.defaultValue = t));
      }
      ((r ??= i),
        (r = typeof r != `function` && typeof r != `symbol` && !!r),
        (e.checked = s ? e.checked : !!r),
        (e.defaultChecked = !!r),
        o != null &&
          typeof o != `function` &&
          typeof o != `symbol` &&
          typeof o != `boolean` &&
          (e.name = o),
        Bt(e));
    }
    function qt(e, t, n) {
      (t === `number` && Ht(e.ownerDocument) === e) ||
        e.defaultValue === `` + n ||
        (e.defaultValue = `` + n);
    }
    function Jt(e, t, n, r) {
      if (((e = e.options), t)) {
        t = {};
        for (var i = 0; i < n.length; i++) t[`$` + n[i]] = !0;
        for (n = 0; n < e.length; n++)
          ((i = t.hasOwnProperty(`$` + e[n].value)),
            e[n].selected !== i && (e[n].selected = i),
            i && r && (e[n].defaultSelected = !0));
      } else {
        for (n = `` + Lt(n), t = null, i = 0; i < e.length; i++) {
          if (e[i].value === n) {
            ((e[i].selected = !0), r && (e[i].defaultSelected = !0));
            return;
          }
          t !== null || e[i].disabled || (t = e[i]);
        }
        t !== null && (t.selected = !0);
      }
    }
    function Yt(e, t, n) {
      if (
        t != null &&
        ((t = `` + Lt(t)), t !== e.value && (e.value = t), n == null)
      ) {
        e.defaultValue !== t && (e.defaultValue = t);
        return;
      }
      e.defaultValue = n == null ? `` : `` + Lt(n);
    }
    function Xt(e, t, n, r) {
      if (t == null) {
        if (r != null) {
          if (n != null) throw Error(i(92));
          if (ce(r)) {
            if (1 < r.length) throw Error(i(93));
            r = r[0];
          }
          n = r;
        }
        ((n ??= ``), (t = n));
      }
      ((n = Lt(t)),
        (e.defaultValue = n),
        (r = e.textContent),
        r === n && r !== `` && r !== null && (e.value = r),
        Bt(e));
    }
    function Zt(e, t) {
      if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
          n.nodeValue = t;
          return;
        }
      }
      e.textContent = t;
    }
    var Qt = new Set(
      `animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(
        ` `,
      ),
    );
    function $t(e, t, n) {
      var r = t.indexOf(`--`) === 0;
      n == null || typeof n == `boolean` || n === ``
        ? r
          ? e.setProperty(t, ``)
          : t === `float`
            ? (e.cssFloat = ``)
            : (e[t] = ``)
        : r
          ? e.setProperty(t, n)
          : typeof n != `number` || n === 0 || Qt.has(t)
            ? t === `float`
              ? (e.cssFloat = n)
              : (e[t] = (`` + n).trim())
            : (e[t] = n + `px`);
    }
    function en(e, t, n) {
      if (t != null && typeof t != `object`) throw Error(i(62));
      if (((e = e.style), n != null)) {
        for (var r in n)
          !n.hasOwnProperty(r) ||
            (t != null && t.hasOwnProperty(r)) ||
            (r.indexOf(`--`) === 0
              ? e.setProperty(r, ``)
              : r === `float`
                ? (e.cssFloat = ``)
                : (e[r] = ``));
        for (var a in t)
          ((r = t[a]), t.hasOwnProperty(a) && n[a] !== r && $t(e, a, r));
      } else for (var o in t) t.hasOwnProperty(o) && $t(e, o, t[o]);
    }
    function tn(e) {
      if (e.indexOf(`-`) === -1) return !1;
      switch (e) {
        case `annotation-xml`:
        case `color-profile`:
        case `font-face`:
        case `font-face-src`:
        case `font-face-uri`:
        case `font-face-format`:
        case `font-face-name`:
        case `missing-glyph`:
          return !1;
        default:
          return !0;
      }
    }
    var nn = new Map([
        [`acceptCharset`, `accept-charset`],
        [`htmlFor`, `for`],
        [`httpEquiv`, `http-equiv`],
        [`crossOrigin`, `crossorigin`],
        [`accentHeight`, `accent-height`],
        [`alignmentBaseline`, `alignment-baseline`],
        [`arabicForm`, `arabic-form`],
        [`baselineShift`, `baseline-shift`],
        [`capHeight`, `cap-height`],
        [`clipPath`, `clip-path`],
        [`clipRule`, `clip-rule`],
        [`colorInterpolation`, `color-interpolation`],
        [`colorInterpolationFilters`, `color-interpolation-filters`],
        [`colorProfile`, `color-profile`],
        [`colorRendering`, `color-rendering`],
        [`dominantBaseline`, `dominant-baseline`],
        [`enableBackground`, `enable-background`],
        [`fillOpacity`, `fill-opacity`],
        [`fillRule`, `fill-rule`],
        [`floodColor`, `flood-color`],
        [`floodOpacity`, `flood-opacity`],
        [`fontFamily`, `font-family`],
        [`fontSize`, `font-size`],
        [`fontSizeAdjust`, `font-size-adjust`],
        [`fontStretch`, `font-stretch`],
        [`fontStyle`, `font-style`],
        [`fontVariant`, `font-variant`],
        [`fontWeight`, `font-weight`],
        [`glyphName`, `glyph-name`],
        [`glyphOrientationHorizontal`, `glyph-orientation-horizontal`],
        [`glyphOrientationVertical`, `glyph-orientation-vertical`],
        [`horizAdvX`, `horiz-adv-x`],
        [`horizOriginX`, `horiz-origin-x`],
        [`imageRendering`, `image-rendering`],
        [`letterSpacing`, `letter-spacing`],
        [`lightingColor`, `lighting-color`],
        [`markerEnd`, `marker-end`],
        [`markerMid`, `marker-mid`],
        [`markerStart`, `marker-start`],
        [`overlinePosition`, `overline-position`],
        [`overlineThickness`, `overline-thickness`],
        [`paintOrder`, `paint-order`],
        [`panose-1`, `panose-1`],
        [`pointerEvents`, `pointer-events`],
        [`renderingIntent`, `rendering-intent`],
        [`shapeRendering`, `shape-rendering`],
        [`stopColor`, `stop-color`],
        [`stopOpacity`, `stop-opacity`],
        [`strikethroughPosition`, `strikethrough-position`],
        [`strikethroughThickness`, `strikethrough-thickness`],
        [`strokeDasharray`, `stroke-dasharray`],
        [`strokeDashoffset`, `stroke-dashoffset`],
        [`strokeLinecap`, `stroke-linecap`],
        [`strokeLinejoin`, `stroke-linejoin`],
        [`strokeMiterlimit`, `stroke-miterlimit`],
        [`strokeOpacity`, `stroke-opacity`],
        [`strokeWidth`, `stroke-width`],
        [`textAnchor`, `text-anchor`],
        [`textDecoration`, `text-decoration`],
        [`textRendering`, `text-rendering`],
        [`transformOrigin`, `transform-origin`],
        [`underlinePosition`, `underline-position`],
        [`underlineThickness`, `underline-thickness`],
        [`unicodeBidi`, `unicode-bidi`],
        [`unicodeRange`, `unicode-range`],
        [`unitsPerEm`, `units-per-em`],
        [`vAlphabetic`, `v-alphabetic`],
        [`vHanging`, `v-hanging`],
        [`vIdeographic`, `v-ideographic`],
        [`vMathematical`, `v-mathematical`],
        [`vectorEffect`, `vector-effect`],
        [`vertAdvY`, `vert-adv-y`],
        [`vertOriginX`, `vert-origin-x`],
        [`vertOriginY`, `vert-origin-y`],
        [`wordSpacing`, `word-spacing`],
        [`writingMode`, `writing-mode`],
        [`xmlnsXlink`, `xmlns:xlink`],
        [`xHeight`, `x-height`],
      ]),
      rn =
        /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
    function an(e) {
      return rn.test(`` + e)
        ? `javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`
        : e;
    }
    function on() {}
    var sn = null;
    function cn(e) {
      return (
        (e = e.target || e.srcElement || window),
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
      );
    }
    var ln = null,
      un = null;
    function dn(e) {
      var t = St(e);
      if (t && (e = t.stateNode)) {
        var n = e[pt] || null;
        a: switch (((e = t.stateNode), t.type)) {
          case `input`:
            if (
              (Gt(
                e,
                n.value,
                n.defaultValue,
                n.defaultValue,
                n.checked,
                n.defaultChecked,
                n.type,
                n.name,
              ),
              (t = n.name),
              n.type === `radio` && t != null)
            ) {
              for (n = e; n.parentNode;) n = n.parentNode;
              for (
                n = n.querySelectorAll(
                  `input[name="` + Wt(`` + t) + `"][type="radio"]`,
                ),
                  t = 0;
                t < n.length;
                t++
              ) {
                var r = n[t];
                if (r !== e && r.form === e.form) {
                  var a = r[pt] || null;
                  if (!a) throw Error(i(90));
                  Gt(
                    r,
                    a.value,
                    a.defaultValue,
                    a.defaultValue,
                    a.checked,
                    a.defaultChecked,
                    a.type,
                    a.name,
                  );
                }
              }
              for (t = 0; t < n.length; t++)
                ((r = n[t]), r.form === e.form && Vt(r));
            }
            break a;
          case `textarea`:
            Yt(e, n.value, n.defaultValue);
            break a;
          case `select`:
            ((t = n.value), t != null && Jt(e, !!n.multiple, t, !1));
        }
      }
    }
    var fn = !1;
    function pn(e, t, n) {
      if (fn) return e(t, n);
      fn = !0;
      try {
        return e(t);
      } finally {
        if (
          ((fn = !1),
          (ln !== null || un !== null) &&
            (wu(), ln && ((t = ln), (e = un), (un = ln = null), dn(t), e)))
        )
          for (t = 0; t < e.length; t++) dn(e[t]);
      }
    }
    function mn(e, t) {
      var n = e.stateNode;
      if (n === null) return null;
      var r = n[pt] || null;
      if (r === null) return null;
      n = r[t];
      a: switch (t) {
        case `onClick`:
        case `onClickCapture`:
        case `onDoubleClick`:
        case `onDoubleClickCapture`:
        case `onMouseDown`:
        case `onMouseDownCapture`:
        case `onMouseMove`:
        case `onMouseMoveCapture`:
        case `onMouseUp`:
        case `onMouseUpCapture`:
        case `onMouseEnter`:
          ((r = !r.disabled) ||
            ((e = e.type),
            (r =
              e !== `button` &&
              e !== `input` &&
              e !== `select` &&
              e !== `textarea`)),
            (e = !r));
          break a;
        default:
          e = !1;
      }
      if (e) return null;
      if (n && typeof n != `function`) throw Error(i(231, t, typeof n));
      return n;
    }
    var hn = !(
        typeof window > `u` ||
        window.document === void 0 ||
        window.document.createElement === void 0
      ),
      gn = !1;
    if (hn)
      try {
        var _n = {};
        (Object.defineProperty(_n, "passive", {
          get: function () {
            gn = !0;
          },
        }),
          window.addEventListener(`test`, _n, _n),
          window.removeEventListener(`test`, _n, _n));
      } catch {
        gn = !1;
      }
    var vn = null,
      yn = null,
      bn = null;
    function xn() {
      if (bn) return bn;
      var e,
        t = yn,
        n = t.length,
        r,
        i = `value` in vn ? vn.value : vn.textContent,
        a = i.length;
      for (e = 0; e < n && t[e] === i[e]; e++);
      var o = n - e;
      for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
      return (bn = i.slice(e, 1 < r ? 1 - r : void 0));
    }
    function Sn(e) {
      var t = e.keyCode;
      return (
        `charCode` in e
          ? ((e = e.charCode), e === 0 && t === 13 && (e = 13))
          : (e = t),
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
      );
    }
    function Cn() {
      return !0;
    }
    function wn() {
      return !1;
    }
    function Tn(e) {
      function t(t, n, r, i, a) {
        for (var o in ((this._reactName = t),
        (this._targetInst = r),
        (this.type = n),
        (this.nativeEvent = i),
        (this.target = a),
        (this.currentTarget = null),
        e))
          e.hasOwnProperty(o) && ((t = e[o]), (this[o] = t ? t(i) : i[o]));
        return (
          (this.isDefaultPrevented = (
            i.defaultPrevented == null
              ? !1 === i.returnValue
              : i.defaultPrevented
          )
            ? Cn
            : wn),
          (this.isPropagationStopped = wn),
          this
        );
      }
      return (
        h(t.prototype, {
          preventDefault: function () {
            this.defaultPrevented = !0;
            var e = this.nativeEvent;
            e &&
              (e.preventDefault
                ? e.preventDefault()
                : typeof e.returnValue != `unknown` && (e.returnValue = !1),
              (this.isDefaultPrevented = Cn));
          },
          stopPropagation: function () {
            var e = this.nativeEvent;
            e &&
              (e.stopPropagation
                ? e.stopPropagation()
                : typeof e.cancelBubble != `unknown` && (e.cancelBubble = !0),
              (this.isPropagationStopped = Cn));
          },
          persist: function () {},
          isPersistent: Cn,
        }),
        t
      );
    }
    var En = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (e) {
          return e.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
      },
      Dn = Tn(En),
      On = h({}, En, { view: 0, detail: 0 }),
      kn = Tn(On),
      An,
      jn,
      Mn,
      Nn = h({}, On, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: Wn,
        button: 0,
        buttons: 0,
        relatedTarget: function (e) {
          return e.relatedTarget === void 0
            ? e.fromElement === e.srcElement
              ? e.toElement
              : e.fromElement
            : e.relatedTarget;
        },
        movementX: function (e) {
          return `movementX` in e
            ? e.movementX
            : (e !== Mn &&
                (Mn && e.type === `mousemove`
                  ? ((An = e.screenX - Mn.screenX),
                    (jn = e.screenY - Mn.screenY))
                  : (jn = An = 0),
                (Mn = e)),
              An);
        },
        movementY: function (e) {
          return `movementY` in e ? e.movementY : jn;
        },
      }),
      Pn = Tn(Nn),
      Fn = Tn(h({}, Nn, { dataTransfer: 0 })),
      In = Tn(h({}, On, { relatedTarget: 0 })),
      Ln = Tn(
        h({}, En, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
      ),
      Rn = Tn(
        h({}, En, {
          clipboardData: function (e) {
            return `clipboardData` in e
              ? e.clipboardData
              : window.clipboardData;
          },
        }),
      ),
      zn = Tn(h({}, En, { data: 0 })),
      Bn = {
        Esc: `Escape`,
        Spacebar: ` `,
        Left: `ArrowLeft`,
        Up: `ArrowUp`,
        Right: `ArrowRight`,
        Down: `ArrowDown`,
        Del: `Delete`,
        Win: `OS`,
        Menu: `ContextMenu`,
        Apps: `ContextMenu`,
        Scroll: `ScrollLock`,
        MozPrintableKey: `Unidentified`,
      },
      Vn = {
        8: `Backspace`,
        9: `Tab`,
        12: `Clear`,
        13: `Enter`,
        16: `Shift`,
        17: `Control`,
        18: `Alt`,
        19: `Pause`,
        20: `CapsLock`,
        27: `Escape`,
        32: ` `,
        33: `PageUp`,
        34: `PageDown`,
        35: `End`,
        36: `Home`,
        37: `ArrowLeft`,
        38: `ArrowUp`,
        39: `ArrowRight`,
        40: `ArrowDown`,
        45: `Insert`,
        46: `Delete`,
        112: `F1`,
        113: `F2`,
        114: `F3`,
        115: `F4`,
        116: `F5`,
        117: `F6`,
        118: `F7`,
        119: `F8`,
        120: `F9`,
        121: `F10`,
        122: `F11`,
        123: `F12`,
        144: `NumLock`,
        145: `ScrollLock`,
        224: `Meta`,
      },
      Hn = {
        Alt: `altKey`,
        Control: `ctrlKey`,
        Meta: `metaKey`,
        Shift: `shiftKey`,
      };
    function Un(e) {
      var t = this.nativeEvent;
      return t.getModifierState
        ? t.getModifierState(e)
        : (e = Hn[e])
          ? !!t[e]
          : !1;
    }
    function Wn() {
      return Un;
    }
    var Gn = Tn(
        h({}, On, {
          key: function (e) {
            if (e.key) {
              var t = Bn[e.key] || e.key;
              if (t !== `Unidentified`) return t;
            }
            return e.type === `keypress`
              ? ((e = Sn(e)), e === 13 ? `Enter` : String.fromCharCode(e))
              : e.type === `keydown` || e.type === `keyup`
                ? Vn[e.keyCode] || `Unidentified`
                : ``;
          },
          code: 0,
          location: 0,
          ctrlKey: 0,
          shiftKey: 0,
          altKey: 0,
          metaKey: 0,
          repeat: 0,
          locale: 0,
          getModifierState: Wn,
          charCode: function (e) {
            return e.type === `keypress` ? Sn(e) : 0;
          },
          keyCode: function (e) {
            return e.type === `keydown` || e.type === `keyup` ? e.keyCode : 0;
          },
          which: function (e) {
            return e.type === `keypress`
              ? Sn(e)
              : e.type === `keydown` || e.type === `keyup`
                ? e.keyCode
                : 0;
          },
        }),
      ),
      Kn = Tn(
        h({}, Nn, {
          pointerId: 0,
          width: 0,
          height: 0,
          pressure: 0,
          tangentialPressure: 0,
          tiltX: 0,
          tiltY: 0,
          twist: 0,
          pointerType: 0,
          isPrimary: 0,
        }),
      ),
      qn = Tn(
        h({}, On, {
          touches: 0,
          targetTouches: 0,
          changedTouches: 0,
          altKey: 0,
          metaKey: 0,
          ctrlKey: 0,
          shiftKey: 0,
          getModifierState: Wn,
        }),
      ),
      N = Tn(h({}, En, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 })),
      Jn = Tn(
        h({}, Nn, {
          deltaX: function (e) {
            return `deltaX` in e
              ? e.deltaX
              : `wheelDeltaX` in e
                ? -e.wheelDeltaX
                : 0;
          },
          deltaY: function (e) {
            return `deltaY` in e
              ? e.deltaY
              : `wheelDeltaY` in e
                ? -e.wheelDeltaY
                : `wheelDelta` in e
                  ? -e.wheelDelta
                  : 0;
          },
          deltaZ: 0,
          deltaMode: 0,
        }),
      ),
      Yn = Tn(h({}, En, { newState: 0, oldState: 0 })),
      Xn = [9, 13, 27, 32],
      Zn = hn && `CompositionEvent` in window,
      Qn = null;
    hn && `documentMode` in document && (Qn = document.documentMode);
    var $n = hn && `TextEvent` in window && !Qn,
      er = hn && (!Zn || (Qn && 8 < Qn && 11 >= Qn)),
      tr = ` `,
      nr = !1;
    function rr(e, t) {
      switch (e) {
        case `keyup`:
          return Xn.indexOf(t.keyCode) !== -1;
        case `keydown`:
          return t.keyCode !== 229;
        case `keypress`:
        case `mousedown`:
        case `focusout`:
          return !0;
        default:
          return !1;
      }
    }
    function ir(e) {
      return (
        (e = e.detail),
        typeof e == `object` && `data` in e ? e.data : null
      );
    }
    var ar = !1;
    function or(e, t) {
      switch (e) {
        case `compositionend`:
          return ir(t);
        case `keypress`:
          return t.which === 32 ? ((nr = !0), tr) : null;
        case `textInput`:
          return ((e = t.data), e === tr && nr ? null : e);
        default:
          return null;
      }
    }
    function sr(e, t) {
      if (ar)
        return e === `compositionend` || (!Zn && rr(e, t))
          ? ((e = xn()), (bn = yn = vn = null), (ar = !1), e)
          : null;
      switch (e) {
        case `paste`:
          return null;
        case `keypress`:
          if (
            !(t.ctrlKey || t.altKey || t.metaKey) ||
            (t.ctrlKey && t.altKey)
          ) {
            if (t.char && 1 < t.char.length) return t.char;
            if (t.which) return String.fromCharCode(t.which);
          }
          return null;
        case `compositionend`:
          return er && t.locale !== `ko` ? null : t.data;
        default:
          return null;
      }
    }
    var cr = {
      color: !0,
      date: !0,
      datetime: !0,
      "datetime-local": !0,
      email: !0,
      month: !0,
      number: !0,
      password: !0,
      range: !0,
      search: !0,
      tel: !0,
      text: !0,
      time: !0,
      url: !0,
      week: !0,
    };
    function lr(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t === `input` ? !!cr[e.type] : t === `textarea`;
    }
    function ur(e, t, n, r) {
      (ln ? (un ? un.push(r) : (un = [r])) : (ln = r),
        (t = kd(t, `onChange`)),
        0 < t.length &&
          ((n = new Dn(`onChange`, `change`, null, n, r)),
          e.push({ event: n, listeners: t })));
    }
    var dr = null,
      fr = null;
    function pr(e) {
      Sd(e, 0);
    }
    function mr(e) {
      if (Vt(Ct(e))) return e;
    }
    function hr(e, t) {
      if (e === `change`) return t;
    }
    var gr = !1;
    if (hn) {
      var _r;
      if (hn) {
        var vr = `oninput` in document;
        if (!vr) {
          var yr = document.createElement(`div`);
          (yr.setAttribute(`oninput`, `return;`),
            (vr = typeof yr.oninput == `function`));
        }
        _r = vr;
      } else _r = !1;
      gr = _r && (!document.documentMode || 9 < document.documentMode);
    }
    function br() {
      dr && (dr.detachEvent(`onpropertychange`, xr), (fr = dr = null));
    }
    function xr(e) {
      if (e.propertyName === `value` && mr(fr)) {
        var t = [];
        (ur(t, fr, e, cn(e)), pn(pr, t));
      }
    }
    function Sr(e, t, n) {
      e === `focusin`
        ? (br(), (dr = t), (fr = n), dr.attachEvent(`onpropertychange`, xr))
        : e === `focusout` && br();
    }
    function Cr(e) {
      if (e === `selectionchange` || e === `keyup` || e === `keydown`)
        return mr(fr);
    }
    function wr(e, t) {
      if (e === `click`) return mr(t);
    }
    function Tr(e, t) {
      if (e === `input` || e === `change`) return mr(t);
    }
    function Er(e, t) {
      return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
    }
    var Dr = typeof Object.is == `function` ? Object.is : Er;
    function Or(e, t) {
      if (Dr(e, t)) return !0;
      if (typeof e != `object` || !e || typeof t != `object` || !t) return !1;
      var n = Object.keys(e),
        r = Object.keys(t);
      if (n.length !== r.length) return !1;
      for (r = 0; r < n.length; r++) {
        var i = n[r];
        if (!Ee.call(t, i) || !Dr(e[i], t[i])) return !1;
      }
      return !0;
    }
    function kr(e) {
      for (; e && e.firstChild;) e = e.firstChild;
      return e;
    }
    function Ar(e, t) {
      var n = kr(e);
      e = 0;
      for (var r; n;) {
        if (n.nodeType === 3) {
          if (((r = e + n.textContent.length), e <= t && r >= t))
            return { node: n, offset: t - e };
          e = r;
        }
        a: {
          for (; n;) {
            if (n.nextSibling) {
              n = n.nextSibling;
              break a;
            }
            n = n.parentNode;
          }
          n = void 0;
        }
        n = kr(n);
      }
    }
    function jr(e, t) {
      return e && t
        ? e === t
          ? !0
          : e && e.nodeType === 3
            ? !1
            : t && t.nodeType === 3
              ? jr(e, t.parentNode)
              : `contains` in e
                ? e.contains(t)
                : e.compareDocumentPosition
                  ? !!(e.compareDocumentPosition(t) & 16)
                  : !1
        : !1;
    }
    function Mr(e) {
      e =
        e != null &&
        e.ownerDocument != null &&
        e.ownerDocument.defaultView != null
          ? e.ownerDocument.defaultView
          : window;
      for (var t = Ht(e.document); t instanceof e.HTMLIFrameElement;) {
        try {
          var n = typeof t.contentWindow.location.href == `string`;
        } catch {
          n = !1;
        }
        if (n) e = t.contentWindow;
        else break;
        t = Ht(e.document);
      }
      return t;
    }
    function Nr(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return (
        t &&
        ((t === `input` &&
          (e.type === `text` ||
            e.type === `search` ||
            e.type === `tel` ||
            e.type === `url` ||
            e.type === `password`)) ||
          t === `textarea` ||
          e.contentEditable === `true`)
      );
    }
    var Pr = hn && `documentMode` in document && 11 >= document.documentMode,
      Fr = null,
      Ir = null,
      Lr = null,
      Rr = !1;
    function zr(e, t, n) {
      var r =
        n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
      Rr ||
        Fr == null ||
        Fr !== Ht(r) ||
        ((r = Fr),
        `selectionStart` in r && Nr(r)
          ? (r = { start: r.selectionStart, end: r.selectionEnd })
          : ((r = (
              (r.ownerDocument && r.ownerDocument.defaultView) ||
              window
            ).getSelection()),
            (r = {
              anchorNode: r.anchorNode,
              anchorOffset: r.anchorOffset,
              focusNode: r.focusNode,
              focusOffset: r.focusOffset,
            })),
        (Lr && Or(Lr, r)) ||
          ((Lr = r),
          (r = kd(Ir, `onSelect`)),
          0 < r.length &&
            ((t = new Dn(`onSelect`, `select`, null, t, n)),
            e.push({ event: t, listeners: r }),
            (t.target = Fr))));
    }
    function Br(e, t) {
      var n = {};
      return (
        (n[e.toLowerCase()] = t.toLowerCase()),
        (n[`Webkit` + e] = `webkit` + t),
        (n[`Moz` + e] = `moz` + t),
        n
      );
    }
    var Vr = {
        animationend: Br(`Animation`, `AnimationEnd`),
        animationiteration: Br(`Animation`, `AnimationIteration`),
        animationstart: Br(`Animation`, `AnimationStart`),
        transitionrun: Br(`Transition`, `TransitionRun`),
        transitionstart: Br(`Transition`, `TransitionStart`),
        transitioncancel: Br(`Transition`, `TransitionCancel`),
        transitionend: Br(`Transition`, `TransitionEnd`),
      },
      Hr = {},
      Ur = {};
    hn &&
      ((Ur = document.createElement(`div`).style),
      `AnimationEvent` in window ||
        (delete Vr.animationend.animation,
        delete Vr.animationiteration.animation,
        delete Vr.animationstart.animation),
      `TransitionEvent` in window || delete Vr.transitionend.transition);
    function Wr(e) {
      if (Hr[e]) return Hr[e];
      if (!Vr[e]) return e;
      var t = Vr[e],
        n;
      for (n in t) if (t.hasOwnProperty(n) && n in Ur) return (Hr[e] = t[n]);
      return e;
    }
    var Gr = Wr(`animationend`),
      Kr = Wr(`animationiteration`),
      qr = Wr(`animationstart`),
      Jr = Wr(`transitionrun`),
      Yr = Wr(`transitionstart`),
      Xr = Wr(`transitioncancel`),
      Zr = Wr(`transitionend`),
      Qr = new Map(),
      $r =
        `abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(
          ` `,
        );
    $r.push(`scrollEnd`);
    function ei(e, t) {
      (Qr.set(e, t), Ot(t, [e]));
    }
    var ti =
        typeof reportError == `function`
          ? reportError
          : function (e) {
              if (
                typeof window == `object` &&
                typeof window.ErrorEvent == `function`
              ) {
                var t = new window.ErrorEvent(`error`, {
                  bubbles: !0,
                  cancelable: !0,
                  message:
                    typeof e == `object` && e && typeof e.message == `string`
                      ? String(e.message)
                      : String(e),
                  error: e,
                });
                if (!window.dispatchEvent(t)) return;
              } else if (
                typeof process == `object` &&
                typeof process.emit == `function`
              ) {
                process.emit(`uncaughtException`, e);
                return;
              }
              console.error(e);
            },
      ni = [],
      ri = 0,
      ii = 0;
    function ai() {
      for (var e = ri, t = (ii = ri = 0); t < e;) {
        var n = ni[t];
        ni[t++] = null;
        var r = ni[t];
        ni[t++] = null;
        var i = ni[t];
        ni[t++] = null;
        var a = ni[t];
        if (((ni[t++] = null), r !== null && i !== null)) {
          var o = r.pending;
          (o === null ? (i.next = i) : ((i.next = o.next), (o.next = i)),
            (r.pending = i));
        }
        a !== 0 && li(n, i, a);
      }
    }
    function oi(e, t, n, r) {
      ((ni[ri++] = e),
        (ni[ri++] = t),
        (ni[ri++] = n),
        (ni[ri++] = r),
        (ii |= r),
        (e.lanes |= r),
        (e = e.alternate),
        e !== null && (e.lanes |= r));
    }
    function si(e, t, n, r) {
      return (oi(e, t, n, r), ui(e));
    }
    function ci(e, t) {
      return (oi(e, null, null, t), ui(e));
    }
    function li(e, t, n) {
      e.lanes |= n;
      var r = e.alternate;
      r !== null && (r.lanes |= n);
      for (var i = !1, a = e.return; a !== null;)
        ((a.childLanes |= n),
          (r = a.alternate),
          r !== null && (r.childLanes |= n),
          a.tag === 22 &&
            ((e = a.stateNode), e === null || e._visibility & 1 || (i = !0)),
          (e = a),
          (a = a.return));
      return e.tag === 3
        ? ((a = e.stateNode),
          i &&
            t !== null &&
            ((i = 31 - Ue(n)),
            (e = a.hiddenUpdates),
            (r = e[i]),
            r === null ? (e[i] = [t]) : r.push(t),
            (t.lane = n | 536870912)),
          a)
        : null;
    }
    function ui(e) {
      if (50 < hu) throw ((hu = 0), (gu = null), Error(i(185)));
      for (var t = e.return; t !== null;) ((e = t), (t = e.return));
      return e.tag === 3 ? e.stateNode : null;
    }
    var di = {};
    function fi(e, t, n, r) {
      ((this.tag = e),
        (this.key = n),
        (this.sibling =
          this.child =
          this.return =
          this.stateNode =
          this.type =
          this.elementType =
            null),
        (this.index = 0),
        (this.refCleanup = this.ref = null),
        (this.pendingProps = t),
        (this.dependencies =
          this.memoizedState =
          this.updateQueue =
          this.memoizedProps =
            null),
        (this.mode = r),
        (this.subtreeFlags = this.flags = 0),
        (this.deletions = null),
        (this.childLanes = this.lanes = 0),
        (this.alternate = null));
    }
    function pi(e, t, n, r) {
      return new fi(e, t, n, r);
    }
    function mi(e) {
      return ((e = e.prototype), !(!e || !e.isReactComponent));
    }
    function hi(e, t) {
      var n = e.alternate;
      return (
        n === null
          ? ((n = pi(e.tag, t, e.key, e.mode)),
            (n.elementType = e.elementType),
            (n.type = e.type),
            (n.stateNode = e.stateNode),
            (n.alternate = e),
            (e.alternate = n))
          : ((n.pendingProps = t),
            (n.type = e.type),
            (n.flags = 0),
            (n.subtreeFlags = 0),
            (n.deletions = null)),
        (n.flags = e.flags & 65011712),
        (n.childLanes = e.childLanes),
        (n.lanes = e.lanes),
        (n.child = e.child),
        (n.memoizedProps = e.memoizedProps),
        (n.memoizedState = e.memoizedState),
        (n.updateQueue = e.updateQueue),
        (t = e.dependencies),
        (n.dependencies =
          t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
        (n.sibling = e.sibling),
        (n.index = e.index),
        (n.ref = e.ref),
        (n.refCleanup = e.refCleanup),
        n
      );
    }
    function gi(e, t) {
      e.flags &= 65011714;
      var n = e.alternate;
      return (
        n === null
          ? ((e.childLanes = 0),
            (e.lanes = t),
            (e.child = null),
            (e.subtreeFlags = 0),
            (e.memoizedProps = null),
            (e.memoizedState = null),
            (e.updateQueue = null),
            (e.dependencies = null),
            (e.stateNode = null))
          : ((e.childLanes = n.childLanes),
            (e.lanes = n.lanes),
            (e.child = n.child),
            (e.subtreeFlags = 0),
            (e.deletions = null),
            (e.memoizedProps = n.memoizedProps),
            (e.memoizedState = n.memoizedState),
            (e.updateQueue = n.updateQueue),
            (e.type = n.type),
            (t = n.dependencies),
            (e.dependencies =
              t === null
                ? null
                : { lanes: t.lanes, firstContext: t.firstContext })),
        e
      );
    }
    function _i(e, t, n, r, a, o) {
      var s = 0;
      if (((r = e), typeof e == `function`)) mi(e) && (s = 1);
      else if (typeof e == `string`)
        s = Kf(e, n, fe.current)
          ? 26
          : e === `html` || e === `head` || e === `body`
            ? 27
            : 5;
      else
        a: switch (e) {
          case ne:
            return (
              (e = pi(31, n, t, a)),
              (e.elementType = ne),
              (e.lanes = o),
              e
            );
          case y:
            return vi(n.children, a, o, t);
          case b:
            ((s = 8), (a |= 24));
            break;
          case x:
            return (
              (e = pi(12, n, t, a | 2)),
              (e.elementType = x),
              (e.lanes = o),
              e
            );
          case T:
            return (
              (e = pi(13, n, t, a)),
              (e.elementType = T),
              (e.lanes = o),
              e
            );
          case ee:
            return (
              (e = pi(19, n, t, a)),
              (e.elementType = ee),
              (e.lanes = o),
              e
            );
          default:
            if (typeof e == `object` && e)
              switch (e.$$typeof) {
                case C:
                  s = 10;
                  break a;
                case S:
                  s = 9;
                  break a;
                case w:
                  s = 11;
                  break a;
                case te:
                  s = 14;
                  break a;
                case E:
                  ((s = 16), (r = null));
                  break a;
              }
            ((s = 29),
              (n = Error(i(130, e === null ? `null` : typeof e, ``))),
              (r = null));
        }
      return (
        (t = pi(s, n, t, a)),
        (t.elementType = e),
        (t.type = r),
        (t.lanes = o),
        t
      );
    }
    function vi(e, t, n, r) {
      return ((e = pi(7, e, r, t)), (e.lanes = n), e);
    }
    function yi(e, t, n) {
      return ((e = pi(6, e, null, t)), (e.lanes = n), e);
    }
    function bi(e) {
      var t = pi(18, null, null, 0);
      return ((t.stateNode = e), t);
    }
    function xi(e, t, n) {
      return (
        (t = pi(4, e.children === null ? [] : e.children, e.key, t)),
        (t.lanes = n),
        (t.stateNode = {
          containerInfo: e.containerInfo,
          pendingChildren: null,
          implementation: e.implementation,
        }),
        t
      );
    }
    var Si = new WeakMap();
    function Ci(e, t) {
      if (typeof e == `object` && e) {
        var n = Si.get(e);
        return n === void 0
          ? ((t = { value: e, source: t, stack: Te(t) }), Si.set(e, t), t)
          : n;
      }
      return { value: e, source: t, stack: Te(t) };
    }
    var wi = [],
      Ti = 0,
      Ei = null,
      Di = 0,
      Oi = [],
      ki = 0,
      Ai = null,
      ji = 1,
      Mi = ``;
    function Ni(e, t) {
      ((wi[Ti++] = Di), (wi[Ti++] = Ei), (Ei = e), (Di = t));
    }
    function Pi(e, t, n) {
      ((Oi[ki++] = ji), (Oi[ki++] = Mi), (Oi[ki++] = Ai), (Ai = e));
      var r = ji;
      e = Mi;
      var i = 32 - Ue(r) - 1;
      ((r &= ~(1 << i)), (n += 1));
      var a = 32 - Ue(t) + i;
      if (30 < a) {
        var o = i - (i % 5);
        ((a = (r & ((1 << o) - 1)).toString(32)),
          (r >>= o),
          (i -= o),
          (ji = (1 << (32 - Ue(t) + i)) | (n << i) | r),
          (Mi = a + e));
      } else ((ji = (1 << a) | (n << i) | r), (Mi = e));
    }
    function Fi(e) {
      e.return !== null && (Ni(e, 1), Pi(e, 1, 0));
    }
    function Ii(e) {
      for (; e === Ei;)
        ((Ei = wi[--Ti]), (wi[Ti] = null), (Di = wi[--Ti]), (wi[Ti] = null));
      for (; e === Ai;)
        ((Ai = Oi[--ki]),
          (Oi[ki] = null),
          (Mi = Oi[--ki]),
          (Oi[ki] = null),
          (ji = Oi[--ki]),
          (Oi[ki] = null));
    }
    function Li(e, t) {
      ((Oi[ki++] = ji),
        (Oi[ki++] = Mi),
        (Oi[ki++] = Ai),
        (ji = t.id),
        (Mi = t.overflow),
        (Ai = e));
    }
    var Ri = null,
      zi = null,
      P = !1,
      Bi = null,
      Vi = !1,
      Hi = Error(i(519));
    function Ui(e) {
      throw (
        Yi(
          Ci(
            Error(
              i(
                418,
                1 < arguments.length && arguments[1] !== void 0 && arguments[1]
                  ? `text`
                  : `HTML`,
                ``,
              ),
            ),
            e,
          ),
        ),
        Hi
      );
    }
    function Wi(e) {
      var t = e.stateNode,
        n = e.type,
        r = e.memoizedProps;
      switch (((t[ft] = e), (t[pt] = r), n)) {
        case `dialog`:
          (Y(`cancel`, t), Y(`close`, t));
          break;
        case `iframe`:
        case `object`:
        case `embed`:
          Y(`load`, t);
          break;
        case `video`:
        case `audio`:
          for (n = 0; n < bd.length; n++) Y(bd[n], t);
          break;
        case `source`:
          Y(`error`, t);
          break;
        case `img`:
        case `image`:
        case `link`:
          (Y(`error`, t), Y(`load`, t));
          break;
        case `details`:
          Y(`toggle`, t);
          break;
        case `input`:
          (Y(`invalid`, t),
            Kt(
              t,
              r.value,
              r.defaultValue,
              r.checked,
              r.defaultChecked,
              r.type,
              r.name,
              !0,
            ));
          break;
        case `select`:
          Y(`invalid`, t);
          break;
        case `textarea`:
          (Y(`invalid`, t), Xt(t, r.value, r.defaultValue, r.children));
      }
      ((n = r.children),
        (typeof n != `string` &&
          typeof n != `number` &&
          typeof n != `bigint`) ||
        t.textContent === `` + n ||
        !0 === r.suppressHydrationWarning ||
        Fd(t.textContent, n)
          ? (r.popover != null && (Y(`beforetoggle`, t), Y(`toggle`, t)),
            r.onScroll != null && Y(`scroll`, t),
            r.onScrollEnd != null && Y(`scrollend`, t),
            r.onClick != null && (t.onclick = on),
            (t = !0))
          : (t = !1),
        t || Ui(e, !0));
    }
    function Gi(e) {
      for (Ri = e.return; Ri;)
        switch (Ri.tag) {
          case 5:
          case 31:
          case 13:
            Vi = !1;
            return;
          case 27:
          case 3:
            Vi = !0;
            return;
          default:
            Ri = Ri.return;
        }
    }
    function Ki(e) {
      if (e !== Ri) return !1;
      if (!P) return (Gi(e), (P = !0), !1);
      var t = e.tag,
        n;
      if (
        ((n = t !== 3 && t !== 27) &&
          ((n = t === 5) &&
            ((n = e.type),
            (n =
              n === `form` || n === `button` || Kd(e.type, e.memoizedProps))),
          (n = !n)),
        n && zi && Ui(e),
        Gi(e),
        t === 13)
      ) {
        if (((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e))
          throw Error(i(317));
        zi = pf(e);
      } else if (t === 31) {
        if (((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e))
          throw Error(i(317));
        zi = pf(e);
      } else
        t === 27
          ? ((t = zi),
            ef(e.type) ? ((e = ff), (ff = null), (zi = e)) : (zi = t))
          : (zi = Ri ? df(e.stateNode.nextSibling) : null);
      return !0;
    }
    function qi() {
      ((zi = Ri = null), (P = !1));
    }
    function Ji() {
      var e = Bi;
      return (
        e !== null &&
          (tu === null ? (tu = e) : tu.push.apply(tu, e), (Bi = null)),
        e
      );
    }
    function Yi(e) {
      Bi === null ? (Bi = [e]) : Bi.push(e);
    }
    var Xi = k(null),
      Zi = null,
      Qi = null;
    function $i(e, t, n) {
      (j(Xi, t._currentValue), (t._currentValue = n));
    }
    function ea(e) {
      ((e._currentValue = Xi.current), A(Xi));
    }
    function ta(e, t, n) {
      for (; e !== null;) {
        var r = e.alternate;
        if (
          ((e.childLanes & t) === t
            ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t)
            : ((e.childLanes |= t), r !== null && (r.childLanes |= t)),
          e === n)
        )
          break;
        e = e.return;
      }
    }
    function na(e, t, n, r) {
      var a = e.child;
      for (a !== null && (a.return = e); a !== null;) {
        var o = a.dependencies;
        if (o !== null) {
          var s = a.child;
          o = o.firstContext;
          a: for (; o !== null;) {
            var c = o;
            o = a;
            for (var l = 0; l < t.length; l++)
              if (c.context === t[l]) {
                ((o.lanes |= n),
                  (c = o.alternate),
                  c !== null && (c.lanes |= n),
                  ta(o.return, n, e),
                  r || (s = null));
                break a;
              }
            o = c.next;
          }
        } else if (a.tag === 18) {
          if (((s = a.return), s === null)) throw Error(i(341));
          ((s.lanes |= n),
            (o = s.alternate),
            o !== null && (o.lanes |= n),
            ta(s, n, e),
            (s = null));
        } else s = a.child;
        if (s !== null) s.return = a;
        else
          for (s = a; s !== null;) {
            if (s === e) {
              s = null;
              break;
            }
            if (((a = s.sibling), a !== null)) {
              ((a.return = s.return), (s = a));
              break;
            }
            s = s.return;
          }
        a = s;
      }
    }
    function ra(e, t, n, r) {
      e = null;
      for (var a = t, o = !1; a !== null;) {
        if (!o) {
          if (a.flags & 524288) o = !0;
          else if (a.flags & 262144) break;
        }
        if (a.tag === 10) {
          var s = a.alternate;
          if (s === null) throw Error(i(387));
          if (((s = s.memoizedProps), s !== null)) {
            var c = a.type;
            Dr(a.pendingProps.value, s.value) ||
              (e === null ? (e = [c]) : e.push(c));
          }
        } else if (a === me.current) {
          if (((s = a.alternate), s === null)) throw Error(i(387));
          s.memoizedState.memoizedState !== a.memoizedState.memoizedState &&
            (e === null ? (e = [tp]) : e.push(tp));
        }
        a = a.return;
      }
      (e !== null && na(t, e, n, r), (t.flags |= 262144));
    }
    function ia(e) {
      for (e = e.firstContext; e !== null;) {
        if (!Dr(e.context._currentValue, e.memoizedValue)) return !0;
        e = e.next;
      }
      return !1;
    }
    function aa(e) {
      ((Zi = e),
        (Qi = null),
        (e = e.dependencies),
        e !== null && (e.firstContext = null));
    }
    function oa(e) {
      return ca(Zi, e);
    }
    function sa(e, t) {
      return (Zi === null && aa(e), ca(e, t));
    }
    function ca(e, t) {
      var n = t._currentValue;
      if (((t = { context: t, memoizedValue: n, next: null }), Qi === null)) {
        if (e === null) throw Error(i(308));
        ((Qi = t),
          (e.dependencies = { lanes: 0, firstContext: t }),
          (e.flags |= 524288));
      } else Qi = Qi.next = t;
      return n;
    }
    var la =
        typeof AbortController < `u`
          ? AbortController
          : function () {
              var e = [],
                t = (this.signal = {
                  aborted: !1,
                  addEventListener: function (t, n) {
                    e.push(n);
                  },
                });
              this.abort = function () {
                ((t.aborted = !0),
                  e.forEach(function (e) {
                    return e();
                  }));
              };
            },
      F = t.unstable_scheduleCallback,
      ua = t.unstable_NormalPriority,
      da = {
        $$typeof: C,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0,
      };
    function fa() {
      return { controller: new la(), data: new Map(), refCount: 0 };
    }
    function pa(e) {
      (e.refCount--,
        e.refCount === 0 &&
          F(ua, function () {
            e.controller.abort();
          }));
    }
    var ma = null,
      ha = 0,
      ga = 0,
      _a = null;
    function va(e, t) {
      if (ma === null) {
        var n = (ma = []);
        ((ha = 0),
          (ga = md()),
          (_a = {
            status: `pending`,
            value: void 0,
            then: function (e) {
              n.push(e);
            },
          }));
      }
      return (ha++, t.then(ya, ya), t);
    }
    function ya() {
      if (--ha === 0 && ma !== null) {
        _a !== null && (_a.status = `fulfilled`);
        var e = ma;
        ((ma = null), (ga = 0), (_a = null));
        for (var t = 0; t < e.length; t++) (0, e[t])();
      }
    }
    function I(e, t) {
      var n = [],
        r = {
          status: `pending`,
          value: null,
          reason: null,
          then: function (e) {
            n.push(e);
          },
        };
      return (
        e.then(
          function () {
            ((r.status = `fulfilled`), (r.value = t));
            for (var e = 0; e < n.length; e++) (0, n[e])(t);
          },
          function (e) {
            for (r.status = `rejected`, r.reason = e, e = 0; e < n.length; e++)
              (0, n[e])(void 0);
          },
        ),
        r
      );
    }
    var ba = D.S;
    D.S = function (e, t) {
      ((iu = je()),
        typeof t == `object` && t && typeof t.then == `function` && va(e, t),
        ba !== null && ba(e, t));
    };
    var xa = k(null);
    function Sa() {
      var e = xa.current;
      return e === null ? H.pooledCache : e;
    }
    function Ca(e, t) {
      t === null ? j(xa, xa.current) : j(xa, t.pool);
    }
    function wa() {
      var e = Sa();
      return e === null ? null : { parent: da._currentValue, pool: e };
    }
    var Ta = Error(i(460)),
      Ea = Error(i(474)),
      Da = Error(i(542)),
      Oa = { then: function () {} };
    function ka(e) {
      return ((e = e.status), e === `fulfilled` || e === `rejected`);
    }
    function Aa(e, t, n) {
      switch (
        ((n = e[n]),
        n === void 0 ? e.push(t) : n !== t && (t.then(on, on), (t = n)),
        t.status)
      ) {
        case `fulfilled`:
          return t.value;
        case `rejected`:
          throw ((e = t.reason), Na(e), e);
        default:
          if (typeof t.status == `string`) t.then(on, on);
          else {
            if (((e = H), e !== null && 100 < e.shellSuspendCounter))
              throw Error(i(482));
            ((e = t),
              (e.status = `pending`),
              e.then(
                function (e) {
                  if (t.status === `pending`) {
                    var n = t;
                    ((n.status = `fulfilled`), (n.value = e));
                  }
                },
                function (e) {
                  if (t.status === `pending`) {
                    var n = t;
                    ((n.status = `rejected`), (n.reason = e));
                  }
                },
              ));
          }
          switch (t.status) {
            case `fulfilled`:
              return t.value;
            case `rejected`:
              throw ((e = t.reason), Na(e), e);
          }
          throw ((L = t), Ta);
      }
    }
    function ja(e) {
      try {
        var t = e._init;
        return t(e._payload);
      } catch (e) {
        throw typeof e == `object` && e && typeof e.then == `function`
          ? ((L = e), Ta)
          : e;
      }
    }
    var L = null;
    function Ma() {
      if (L === null) throw Error(i(459));
      var e = L;
      return ((L = null), e);
    }
    function Na(e) {
      if (e === Ta || e === Da) throw Error(i(483));
    }
    var Pa = null,
      Fa = 0;
    function Ia(e) {
      var t = Fa;
      return ((Fa += 1), Pa === null && (Pa = []), Aa(Pa, e, t));
    }
    function La(e, t) {
      ((t = t.props.ref), (e.ref = t === void 0 ? null : t));
    }
    function Ra(e, t) {
      throw t.$$typeof === g
        ? Error(i(525))
        : ((e = Object.prototype.toString.call(t)),
          Error(
            i(
              31,
              e === `[object Object]`
                ? `object with keys {` + Object.keys(t).join(`, `) + `}`
                : e,
            ),
          ));
    }
    function za(e) {
      function t(t, n) {
        if (e) {
          var r = t.deletions;
          r === null ? ((t.deletions = [n]), (t.flags |= 16)) : r.push(n);
        }
      }
      function n(n, r) {
        if (!e) return null;
        for (; r !== null;) (t(n, r), (r = r.sibling));
        return null;
      }
      function r(e) {
        for (var t = new Map(); e !== null;)
          (e.key === null ? t.set(e.index, e) : t.set(e.key, e),
            (e = e.sibling));
        return t;
      }
      function a(e, t) {
        return ((e = hi(e, t)), (e.index = 0), (e.sibling = null), e);
      }
      function o(t, n, r) {
        return (
          (t.index = r),
          e
            ? ((r = t.alternate),
              r === null
                ? ((t.flags |= 67108866), n)
                : ((r = r.index), r < n ? ((t.flags |= 67108866), n) : r))
            : ((t.flags |= 1048576), n)
        );
      }
      function s(t) {
        return (e && t.alternate === null && (t.flags |= 67108866), t);
      }
      function c(e, t, n, r) {
        return t === null || t.tag !== 6
          ? ((t = yi(n, e.mode, r)), (t.return = e), t)
          : ((t = a(t, n)), (t.return = e), t);
      }
      function l(e, t, n, r) {
        var i = n.type;
        return i === y
          ? d(e, t, n.props.children, r, n.key)
          : t !== null &&
              (t.elementType === i ||
                (typeof i == `object` &&
                  i &&
                  i.$$typeof === E &&
                  ja(i) === t.type))
            ? ((t = a(t, n.props)), La(t, n), (t.return = e), t)
            : ((t = _i(n.type, n.key, n.props, null, e.mode, r)),
              La(t, n),
              (t.return = e),
              t);
      }
      function u(e, t, n, r) {
        return t === null ||
          t.tag !== 4 ||
          t.stateNode.containerInfo !== n.containerInfo ||
          t.stateNode.implementation !== n.implementation
          ? ((t = xi(n, e.mode, r)), (t.return = e), t)
          : ((t = a(t, n.children || [])), (t.return = e), t);
      }
      function d(e, t, n, r, i) {
        return t === null || t.tag !== 7
          ? ((t = vi(n, e.mode, r, i)), (t.return = e), t)
          : ((t = a(t, n)), (t.return = e), t);
      }
      function f(e, t, n) {
        if (
          (typeof t == `string` && t !== ``) ||
          typeof t == `number` ||
          typeof t == `bigint`
        )
          return ((t = yi(`` + t, e.mode, n)), (t.return = e), t);
        if (typeof t == `object` && t) {
          switch (t.$$typeof) {
            case _:
              return (
                (n = _i(t.type, t.key, t.props, null, e.mode, n)),
                La(n, t),
                (n.return = e),
                n
              );
            case v:
              return ((t = xi(t, e.mode, n)), (t.return = e), t);
            case E:
              return ((t = ja(t)), f(e, t, n));
          }
          if (ce(t) || ae(t))
            return ((t = vi(t, e.mode, n, null)), (t.return = e), t);
          if (typeof t.then == `function`) return f(e, Ia(t), n);
          if (t.$$typeof === C) return f(e, sa(e, t), n);
          Ra(e, t);
        }
        return null;
      }
      function p(e, t, n, r) {
        var i = t === null ? null : t.key;
        if (
          (typeof n == `string` && n !== ``) ||
          typeof n == `number` ||
          typeof n == `bigint`
        )
          return i === null ? c(e, t, `` + n, r) : null;
        if (typeof n == `object` && n) {
          switch (n.$$typeof) {
            case _:
              return n.key === i ? l(e, t, n, r) : null;
            case v:
              return n.key === i ? u(e, t, n, r) : null;
            case E:
              return ((n = ja(n)), p(e, t, n, r));
          }
          if (ce(n) || ae(n)) return i === null ? d(e, t, n, r, null) : null;
          if (typeof n.then == `function`) return p(e, t, Ia(n), r);
          if (n.$$typeof === C) return p(e, t, sa(e, n), r);
          Ra(e, n);
        }
        return null;
      }
      function m(e, t, n, r, i) {
        if (
          (typeof r == `string` && r !== ``) ||
          typeof r == `number` ||
          typeof r == `bigint`
        )
          return ((e = e.get(n) || null), c(t, e, `` + r, i));
        if (typeof r == `object` && r) {
          switch (r.$$typeof) {
            case _:
              return (
                (e = e.get(r.key === null ? n : r.key) || null),
                l(t, e, r, i)
              );
            case v:
              return (
                (e = e.get(r.key === null ? n : r.key) || null),
                u(t, e, r, i)
              );
            case E:
              return ((r = ja(r)), m(e, t, n, r, i));
          }
          if (ce(r) || ae(r))
            return ((e = e.get(n) || null), d(t, e, r, i, null));
          if (typeof r.then == `function`) return m(e, t, n, Ia(r), i);
          if (r.$$typeof === C) return m(e, t, n, sa(t, r), i);
          Ra(t, r);
        }
        return null;
      }
      function h(i, a, s, c) {
        for (
          var l = null, u = null, d = a, h = (a = 0), g = null;
          d !== null && h < s.length;
          h++
        ) {
          d.index > h ? ((g = d), (d = null)) : (g = d.sibling);
          var _ = p(i, d, s[h], c);
          if (_ === null) {
            d === null && (d = g);
            break;
          }
          (e && d && _.alternate === null && t(i, d),
            (a = o(_, a, h)),
            u === null ? (l = _) : (u.sibling = _),
            (u = _),
            (d = g));
        }
        if (h === s.length) return (n(i, d), P && Ni(i, h), l);
        if (d === null) {
          for (; h < s.length; h++)
            ((d = f(i, s[h], c)),
              d !== null &&
                ((a = o(d, a, h)),
                u === null ? (l = d) : (u.sibling = d),
                (u = d)));
          return (P && Ni(i, h), l);
        }
        for (d = r(d); h < s.length; h++)
          ((g = m(d, i, h, s[h], c)),
            g !== null &&
              (e &&
                g.alternate !== null &&
                d.delete(g.key === null ? h : g.key),
              (a = o(g, a, h)),
              u === null ? (l = g) : (u.sibling = g),
              (u = g)));
        return (
          e &&
            d.forEach(function (e) {
              return t(i, e);
            }),
          P && Ni(i, h),
          l
        );
      }
      function g(a, s, c, l) {
        if (c == null) throw Error(i(151));
        for (
          var u = null, d = null, h = s, g = (s = 0), _ = null, v = c.next();
          h !== null && !v.done;
          g++, v = c.next()
        ) {
          h.index > g ? ((_ = h), (h = null)) : (_ = h.sibling);
          var y = p(a, h, v.value, l);
          if (y === null) {
            h === null && (h = _);
            break;
          }
          (e && h && y.alternate === null && t(a, h),
            (s = o(y, s, g)),
            d === null ? (u = y) : (d.sibling = y),
            (d = y),
            (h = _));
        }
        if (v.done) return (n(a, h), P && Ni(a, g), u);
        if (h === null) {
          for (; !v.done; g++, v = c.next())
            ((v = f(a, v.value, l)),
              v !== null &&
                ((s = o(v, s, g)),
                d === null ? (u = v) : (d.sibling = v),
                (d = v)));
          return (P && Ni(a, g), u);
        }
        for (h = r(h); !v.done; g++, v = c.next())
          ((v = m(h, a, g, v.value, l)),
            v !== null &&
              (e &&
                v.alternate !== null &&
                h.delete(v.key === null ? g : v.key),
              (s = o(v, s, g)),
              d === null ? (u = v) : (d.sibling = v),
              (d = v)));
        return (
          e &&
            h.forEach(function (e) {
              return t(a, e);
            }),
          P && Ni(a, g),
          u
        );
      }
      function b(e, r, o, c) {
        if (
          (typeof o == `object` &&
            o &&
            o.type === y &&
            o.key === null &&
            (o = o.props.children),
          typeof o == `object` && o)
        ) {
          switch (o.$$typeof) {
            case _:
              a: {
                for (var l = o.key; r !== null;) {
                  if (r.key === l) {
                    if (((l = o.type), l === y)) {
                      if (r.tag === 7) {
                        (n(e, r.sibling),
                          (c = a(r, o.props.children)),
                          (c.return = e),
                          (e = c));
                        break a;
                      }
                    } else if (
                      r.elementType === l ||
                      (typeof l == `object` &&
                        l &&
                        l.$$typeof === E &&
                        ja(l) === r.type)
                    ) {
                      (n(e, r.sibling),
                        (c = a(r, o.props)),
                        La(c, o),
                        (c.return = e),
                        (e = c));
                      break a;
                    }
                    n(e, r);
                    break;
                  }
                  (t(e, r), (r = r.sibling));
                }
                o.type === y
                  ? ((c = vi(o.props.children, e.mode, c, o.key)),
                    (c.return = e),
                    (e = c))
                  : ((c = _i(o.type, o.key, o.props, null, e.mode, c)),
                    La(c, o),
                    (c.return = e),
                    (e = c));
              }
              return s(e);
            case v:
              a: {
                for (l = o.key; r !== null;) {
                  if (r.key === l)
                    if (
                      r.tag === 4 &&
                      r.stateNode.containerInfo === o.containerInfo &&
                      r.stateNode.implementation === o.implementation
                    ) {
                      (n(e, r.sibling),
                        (c = a(r, o.children || [])),
                        (c.return = e),
                        (e = c));
                      break a;
                    } else {
                      n(e, r);
                      break;
                    }
                  (t(e, r), (r = r.sibling));
                }
                ((c = xi(o, e.mode, c)), (c.return = e), (e = c));
              }
              return s(e);
            case E:
              return ((o = ja(o)), b(e, r, o, c));
          }
          if (ce(o)) return h(e, r, o, c);
          if (ae(o)) {
            if (((l = ae(o)), typeof l != `function`)) throw Error(i(150));
            return ((o = l.call(o)), g(e, r, o, c));
          }
          if (typeof o.then == `function`) return b(e, r, Ia(o), c);
          if (o.$$typeof === C) return b(e, r, sa(e, o), c);
          Ra(e, o);
        }
        return (typeof o == `string` && o !== ``) ||
          typeof o == `number` ||
          typeof o == `bigint`
          ? ((o = `` + o),
            r !== null && r.tag === 6
              ? (n(e, r.sibling), (c = a(r, o)), (c.return = e), (e = c))
              : (n(e, r), (c = yi(o, e.mode, c)), (c.return = e), (e = c)),
            s(e))
          : n(e, r);
      }
      return function (e, t, n, r) {
        try {
          Fa = 0;
          var i = b(e, t, n, r);
          return ((Pa = null), i);
        } catch (t) {
          if (t === Ta || t === Da) throw t;
          var a = pi(29, t, null, e.mode);
          return ((a.lanes = r), (a.return = e), a);
        }
      };
    }
    var Ba = za(!0),
      Va = za(!1),
      Ha = !1;
    function Ua(e) {
      e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, lanes: 0, hiddenCallbacks: null },
        callbacks: null,
      };
    }
    function Wa(e, t) {
      ((e = e.updateQueue),
        t.updateQueue === e &&
          (t.updateQueue = {
            baseState: e.baseState,
            firstBaseUpdate: e.firstBaseUpdate,
            lastBaseUpdate: e.lastBaseUpdate,
            shared: e.shared,
            callbacks: null,
          }));
    }
    function Ga(e) {
      return { lane: e, tag: 0, payload: null, callback: null, next: null };
    }
    function Ka(e, t, n) {
      var r = e.updateQueue;
      if (r === null) return null;
      if (((r = r.shared), V & 2)) {
        var i = r.pending;
        return (
          i === null ? (t.next = t) : ((t.next = i.next), (i.next = t)),
          (r.pending = t),
          (t = ui(e)),
          li(e, null, n),
          t
        );
      }
      return (oi(e, r, t, n), ui(e));
    }
    function qa(e, t, n) {
      if (((t = t.updateQueue), t !== null && ((t = t.shared), n & 4194048))) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), at(e, n));
      }
    }
    function Ja(e, t) {
      var n = e.updateQueue,
        r = e.alternate;
      if (r !== null && ((r = r.updateQueue), n === r)) {
        var i = null,
          a = null;
        if (((n = n.firstBaseUpdate), n !== null)) {
          do {
            var o = {
              lane: n.lane,
              tag: n.tag,
              payload: n.payload,
              callback: null,
              next: null,
            };
            (a === null ? (i = a = o) : (a = a.next = o), (n = n.next));
          } while (n !== null);
          a === null ? (i = a = t) : (a = a.next = t);
        } else i = a = t;
        ((n = {
          baseState: r.baseState,
          firstBaseUpdate: i,
          lastBaseUpdate: a,
          shared: r.shared,
          callbacks: r.callbacks,
        }),
          (e.updateQueue = n));
        return;
      }
      ((e = n.lastBaseUpdate),
        e === null ? (n.firstBaseUpdate = t) : (e.next = t),
        (n.lastBaseUpdate = t));
    }
    var Ya = !1;
    function Xa() {
      if (Ya) {
        var e = _a;
        if (e !== null) throw e;
      }
    }
    function Za(e, t, n, r) {
      Ya = !1;
      var i = e.updateQueue;
      Ha = !1;
      var a = i.firstBaseUpdate,
        o = i.lastBaseUpdate,
        s = i.shared.pending;
      if (s !== null) {
        i.shared.pending = null;
        var c = s,
          l = c.next;
        ((c.next = null), o === null ? (a = l) : (o.next = l), (o = c));
        var u = e.alternate;
        u !== null &&
          ((u = u.updateQueue),
          (s = u.lastBaseUpdate),
          s !== o &&
            (s === null ? (u.firstBaseUpdate = l) : (s.next = l),
            (u.lastBaseUpdate = c)));
      }
      if (a !== null) {
        var d = i.baseState;
        ((o = 0), (u = l = c = null), (s = a));
        do {
          var f = s.lane & -536870913,
            p = f !== s.lane;
          if (p ? (W & f) === f : (r & f) === f) {
            (f !== 0 && f === ga && (Ya = !0),
              u !== null &&
                (u = u.next =
                  {
                    lane: 0,
                    tag: s.tag,
                    payload: s.payload,
                    callback: null,
                    next: null,
                  }));
            a: {
              var m = e,
                g = s;
              f = t;
              var _ = n;
              switch (g.tag) {
                case 1:
                  if (((m = g.payload), typeof m == `function`)) {
                    d = m.call(_, d, f);
                    break a;
                  }
                  d = m;
                  break a;
                case 3:
                  m.flags = (m.flags & -65537) | 128;
                case 0:
                  if (
                    ((m = g.payload),
                    (f = typeof m == `function` ? m.call(_, d, f) : m),
                    f == null)
                  )
                    break a;
                  d = h({}, d, f);
                  break a;
                case 2:
                  Ha = !0;
              }
            }
            ((f = s.callback),
              f !== null &&
                ((e.flags |= 64),
                p && (e.flags |= 8192),
                (p = i.callbacks),
                p === null ? (i.callbacks = [f]) : p.push(f)));
          } else
            ((p = {
              lane: f,
              tag: s.tag,
              payload: s.payload,
              callback: s.callback,
              next: null,
            }),
              u === null ? ((l = u = p), (c = d)) : (u = u.next = p),
              (o |= f));
          if (((s = s.next), s === null)) {
            if (((s = i.shared.pending), s === null)) break;
            ((p = s),
              (s = p.next),
              (p.next = null),
              (i.lastBaseUpdate = p),
              (i.shared.pending = null));
          }
        } while (1);
        (u === null && (c = d),
          (i.baseState = c),
          (i.firstBaseUpdate = l),
          (i.lastBaseUpdate = u),
          a === null && (i.shared.lanes = 0),
          (K |= o),
          (e.lanes = o),
          (e.memoizedState = d));
      }
    }
    function Qa(e, t) {
      if (typeof e != `function`) throw Error(i(191, e));
      e.call(t);
    }
    function $a(e, t) {
      var n = e.callbacks;
      if (n !== null)
        for (e.callbacks = null, e = 0; e < n.length; e++) Qa(n[e], t);
    }
    var eo = k(null),
      to = k(0);
    function no(e, t) {
      ((e = Jl), j(to, e), j(eo, t), (Jl = e | t.baseLanes));
    }
    function ro() {
      (j(to, Jl), j(eo, eo.current));
    }
    function io() {
      ((Jl = to.current), A(eo), A(to));
    }
    var ao = k(null),
      oo = null;
    function so(e) {
      var t = e.alternate;
      (j(po, po.current & 1),
        j(ao, e),
        oo === null &&
          (t === null || eo.current !== null || t.memoizedState !== null) &&
          (oo = e));
    }
    function co(e) {
      (j(po, po.current), j(ao, e), oo === null && (oo = e));
    }
    function lo(e) {
      e.tag === 22
        ? (j(po, po.current), j(ao, e), oo === null && (oo = e))
        : uo(e);
    }
    function uo() {
      (j(po, po.current), j(ao, ao.current));
    }
    function fo(e) {
      (A(ao), oo === e && (oo = null), A(po));
    }
    var po = k(0);
    function mo(e) {
      for (var t = e; t !== null;) {
        if (t.tag === 13) {
          var n = t.memoizedState;
          if (n !== null && ((n = n.dehydrated), n === null || cf(n) || lf(n)))
            return t;
        } else if (
          t.tag === 19 &&
          (t.memoizedProps.revealOrder === `forwards` ||
            t.memoizedProps.revealOrder === `backwards` ||
            t.memoizedProps.revealOrder === `unstable_legacy-backwards` ||
            t.memoizedProps.revealOrder === `together`)
        ) {
          if (t.flags & 128) return t;
        } else if (t.child !== null) {
          ((t.child.return = t), (t = t.child));
          continue;
        }
        if (t === e) break;
        for (; t.sibling === null;) {
          if (t.return === null || t.return === e) return null;
          t = t.return;
        }
        ((t.sibling.return = t.return), (t = t.sibling));
      }
      return null;
    }
    var ho = 0,
      R = null,
      z = null,
      go = null,
      _o = !1,
      vo = !1,
      yo = !1,
      bo = 0,
      xo = 0,
      So = null,
      Co = 0;
    function wo() {
      throw Error(i(321));
    }
    function To(e, t) {
      if (t === null) return !1;
      for (var n = 0; n < t.length && n < e.length; n++)
        if (!Dr(e[n], t[n])) return !1;
      return !0;
    }
    function Eo(e, t, n, r, i, a) {
      return (
        (ho = a),
        (R = t),
        (t.memoizedState = null),
        (t.updateQueue = null),
        (t.lanes = 0),
        (D.H = e === null || e.memoizedState === null ? Hs : Us),
        (yo = !1),
        (a = n(r, i)),
        (yo = !1),
        vo && (a = Oo(t, n, r, i)),
        Do(e),
        a
      );
    }
    function Do(e) {
      D.H = Vs;
      var t = z !== null && z.next !== null;
      if (((ho = 0), (go = z = R = null), (_o = !1), (xo = 0), (So = null), t))
        throw Error(i(300));
      e === null ||
        oc ||
        ((e = e.dependencies), e !== null && ia(e) && (oc = !0));
    }
    function Oo(e, t, n, r) {
      R = e;
      var a = 0;
      do {
        if ((vo && (So = null), (xo = 0), (vo = !1), 25 <= a))
          throw Error(i(301));
        if (((a += 1), (go = z = null), e.updateQueue != null)) {
          var o = e.updateQueue;
          ((o.lastEffect = null),
            (o.events = null),
            (o.stores = null),
            o.memoCache != null && (o.memoCache.index = 0));
        }
        ((D.H = Ws), (o = t(n, r)));
      } while (vo);
      return o;
    }
    function ko() {
      var e = D.H,
        t = e.useState()[0];
      return (
        (t = typeof t.then == `function` ? Io(t) : t),
        (e = e.useState()[0]),
        (z === null ? null : z.memoizedState) !== e && (R.flags |= 1024),
        t
      );
    }
    function Ao() {
      var e = bo !== 0;
      return ((bo = 0), e);
    }
    function jo(e, t, n) {
      ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~n));
    }
    function Mo(e) {
      if (_o) {
        for (e = e.memoizedState; e !== null;) {
          var t = e.queue;
          (t !== null && (t.pending = null), (e = e.next));
        }
        _o = !1;
      }
      ((ho = 0), (go = z = R = null), (vo = !1), (xo = bo = 0), (So = null));
    }
    function No() {
      var e = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null,
      };
      return (
        go === null ? (R.memoizedState = go = e) : (go = go.next = e),
        go
      );
    }
    function Po() {
      if (z === null) {
        var e = R.alternate;
        e = e === null ? null : e.memoizedState;
      } else e = z.next;
      var t = go === null ? R.memoizedState : go.next;
      if (t !== null) ((go = t), (z = e));
      else {
        if (e === null)
          throw R.alternate === null ? Error(i(467)) : Error(i(310));
        ((z = e),
          (e = {
            memoizedState: z.memoizedState,
            baseState: z.baseState,
            baseQueue: z.baseQueue,
            queue: z.queue,
            next: null,
          }),
          go === null ? (R.memoizedState = go = e) : (go = go.next = e));
      }
      return go;
    }
    function Fo() {
      return { lastEffect: null, events: null, stores: null, memoCache: null };
    }
    function Io(e) {
      var t = xo;
      return (
        (xo += 1),
        So === null && (So = []),
        (e = Aa(So, e, t)),
        (t = R),
        (go === null ? t.memoizedState : go.next) === null &&
          ((t = t.alternate),
          (D.H = t === null || t.memoizedState === null ? Hs : Us)),
        e
      );
    }
    function Lo(e) {
      if (typeof e == `object` && e) {
        if (typeof e.then == `function`) return Io(e);
        if (e.$$typeof === C) return oa(e);
      }
      throw Error(i(438, String(e)));
    }
    function Ro(e) {
      var t = null,
        n = R.updateQueue;
      if ((n !== null && (t = n.memoCache), t == null)) {
        var r = R.alternate;
        r !== null &&
          ((r = r.updateQueue),
          r !== null &&
            ((r = r.memoCache),
            r != null &&
              (t = {
                data: r.data.map(function (e) {
                  return e.slice();
                }),
                index: 0,
              })));
      }
      if (
        ((t ??= { data: [], index: 0 }),
        n === null && ((n = Fo()), (R.updateQueue = n)),
        (n.memoCache = t),
        (n = t.data[t.index]),
        n === void 0)
      )
        for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = re;
      return (t.index++, n);
    }
    function zo(e, t) {
      return typeof t == `function` ? t(e) : t;
    }
    function Bo(e) {
      return Vo(Po(), z, e);
    }
    function Vo(e, t, n) {
      var r = e.queue;
      if (r === null) throw Error(i(311));
      r.lastRenderedReducer = n;
      var a = e.baseQueue,
        o = r.pending;
      if (o !== null) {
        if (a !== null) {
          var s = a.next;
          ((a.next = o.next), (o.next = s));
        }
        ((t.baseQueue = a = o), (r.pending = null));
      }
      if (((o = e.baseState), a === null)) e.memoizedState = o;
      else {
        t = a.next;
        var c = (s = null),
          l = null,
          u = t,
          d = !1;
        do {
          var f = u.lane & -536870913;
          if (f === u.lane ? (ho & f) === f : (W & f) === f) {
            var p = u.revertLane;
            if (p === 0)
              (l !== null &&
                (l = l.next =
                  {
                    lane: 0,
                    revertLane: 0,
                    gesture: null,
                    action: u.action,
                    hasEagerState: u.hasEagerState,
                    eagerState: u.eagerState,
                    next: null,
                  }),
                f === ga && (d = !0));
            else if ((ho & p) === p) {
              ((u = u.next), p === ga && (d = !0));
              continue;
            } else
              ((f = {
                lane: 0,
                revertLane: u.revertLane,
                gesture: null,
                action: u.action,
                hasEagerState: u.hasEagerState,
                eagerState: u.eagerState,
                next: null,
              }),
                l === null ? ((c = l = f), (s = o)) : (l = l.next = f),
                (R.lanes |= p),
                (K |= p));
            ((f = u.action),
              yo && n(o, f),
              (o = u.hasEagerState ? u.eagerState : n(o, f)));
          } else
            ((p = {
              lane: f,
              revertLane: u.revertLane,
              gesture: u.gesture,
              action: u.action,
              hasEagerState: u.hasEagerState,
              eagerState: u.eagerState,
              next: null,
            }),
              l === null ? ((c = l = p), (s = o)) : (l = l.next = p),
              (R.lanes |= f),
              (K |= f));
          u = u.next;
        } while (u !== null && u !== t);
        if (
          (l === null ? (s = o) : (l.next = c),
          !Dr(o, e.memoizedState) && ((oc = !0), d && ((n = _a), n !== null)))
        )
          throw n;
        ((e.memoizedState = o),
          (e.baseState = s),
          (e.baseQueue = l),
          (r.lastRenderedState = o));
      }
      return (a === null && (r.lanes = 0), [e.memoizedState, r.dispatch]);
    }
    function Ho(e) {
      var t = Po(),
        n = t.queue;
      if (n === null) throw Error(i(311));
      n.lastRenderedReducer = e;
      var r = n.dispatch,
        a = n.pending,
        o = t.memoizedState;
      if (a !== null) {
        n.pending = null;
        var s = (a = a.next);
        do ((o = e(o, s.action)), (s = s.next));
        while (s !== a);
        (Dr(o, t.memoizedState) || (oc = !0),
          (t.memoizedState = o),
          t.baseQueue === null && (t.baseState = o),
          (n.lastRenderedState = o));
      }
      return [o, r];
    }
    function Uo(e, t, n) {
      var r = R,
        a = Po(),
        o = P;
      if (o) {
        if (n === void 0) throw Error(i(407));
        n = n();
      } else n = t();
      var s = !Dr((z || a).memoizedState, n);
      if (
        (s && ((a.memoizedState = n), (oc = !0)),
        (a = a.queue),
        ps(Ko.bind(null, r, a, e), [e]),
        a.getSnapshot !== t || s || (go !== null && go.memoizedState.tag & 1))
      ) {
        if (
          ((r.flags |= 2048),
          cs(9, { destroy: void 0 }, Go.bind(null, r, a, n, t), null),
          H === null)
        )
          throw Error(i(349));
        o || ho & 127 || Wo(r, t, n);
      }
      return n;
    }
    function Wo(e, t, n) {
      ((e.flags |= 16384),
        (e = { getSnapshot: t, value: n }),
        (t = R.updateQueue),
        t === null
          ? ((t = Fo()), (R.updateQueue = t), (t.stores = [e]))
          : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
    }
    function Go(e, t, n, r) {
      ((t.value = n), (t.getSnapshot = r), qo(t) && Jo(e));
    }
    function Ko(e, t, n) {
      return n(function () {
        qo(t) && Jo(e);
      });
    }
    function qo(e) {
      var t = e.getSnapshot;
      e = e.value;
      try {
        var n = t();
        return !Dr(e, n);
      } catch {
        return !0;
      }
    }
    function Jo(e) {
      var t = ci(e, 2);
      t !== null && yu(t, e, 2);
    }
    function Yo(e) {
      var t = No();
      if (typeof e == `function`) {
        var n = e;
        if (((e = n()), yo)) {
          He(!0);
          try {
            n();
          } finally {
            He(!1);
          }
        }
      }
      return (
        (t.memoizedState = t.baseState = e),
        (t.queue = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: zo,
          lastRenderedState: e,
        }),
        t
      );
    }
    function Xo(e, t, n, r) {
      return ((e.baseState = n), Vo(e, z, typeof r == `function` ? r : zo));
    }
    function Zo(e, t, n, r, a) {
      if (Rs(e)) throw Error(i(485));
      if (((e = t.action), e !== null)) {
        var o = {
          payload: a,
          action: e,
          next: null,
          isTransition: !0,
          status: `pending`,
          value: null,
          reason: null,
          listeners: [],
          then: function (e) {
            o.listeners.push(e);
          },
        };
        (D.T === null ? (o.isTransition = !1) : n(!0),
          r(o),
          (n = t.pending),
          n === null
            ? ((o.next = t.pending = o), Qo(t, o))
            : ((o.next = n.next), (t.pending = n.next = o)));
      }
    }
    function Qo(e, t) {
      var n = t.action,
        r = t.payload,
        i = e.state;
      if (t.isTransition) {
        var a = D.T,
          o = {};
        D.T = o;
        try {
          var s = n(i, r),
            c = D.S;
          (c !== null && c(o, s), $o(e, t, s));
        } catch (n) {
          B(e, t, n);
        } finally {
          (a !== null && o.types !== null && (a.types = o.types), (D.T = a));
        }
      } else
        try {
          ((a = n(i, r)), $o(e, t, a));
        } catch (n) {
          B(e, t, n);
        }
    }
    function $o(e, t, n) {
      typeof n == `object` && n && typeof n.then == `function`
        ? n.then(
            function (n) {
              es(e, t, n);
            },
            function (n) {
              return B(e, t, n);
            },
          )
        : es(e, t, n);
    }
    function es(e, t, n) {
      ((t.status = `fulfilled`),
        (t.value = n),
        ts(t),
        (e.state = n),
        (t = e.pending),
        t !== null &&
          ((n = t.next),
          n === t
            ? (e.pending = null)
            : ((n = n.next), (t.next = n), Qo(e, n))));
    }
    function B(e, t, n) {
      var r = e.pending;
      if (((e.pending = null), r !== null)) {
        r = r.next;
        do ((t.status = `rejected`), (t.reason = n), ts(t), (t = t.next));
        while (t !== r);
      }
      e.action = null;
    }
    function ts(e) {
      e = e.listeners;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
    function ns(e, t) {
      return t;
    }
    function rs(e, t) {
      if (P) {
        var n = H.formState;
        if (n !== null) {
          a: {
            var r = R;
            if (P) {
              if (zi) {
                b: {
                  for (var i = zi, a = Vi; i.nodeType !== 8;) {
                    if (!a) {
                      i = null;
                      break b;
                    }
                    if (((i = df(i.nextSibling)), i === null)) {
                      i = null;
                      break b;
                    }
                  }
                  ((a = i.data), (i = a === `F!` || a === `F` ? i : null));
                }
                if (i) {
                  ((zi = df(i.nextSibling)), (r = i.data === `F!`));
                  break a;
                }
              }
              Ui(r);
            }
            r = !1;
          }
          r && (t = n[0]);
        }
      }
      return (
        (n = No()),
        (n.memoizedState = n.baseState = t),
        (r = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: ns,
          lastRenderedState: t,
        }),
        (n.queue = r),
        (n = Fs.bind(null, R, r)),
        (r.dispatch = n),
        (r = Yo(!1)),
        (a = Ls.bind(null, R, !1, r.queue)),
        (r = No()),
        (i = { state: t, dispatch: null, action: e, pending: null }),
        (r.queue = i),
        (n = Zo.bind(null, R, i, a, n)),
        (i.dispatch = n),
        (r.memoizedState = e),
        [t, n, !1]
      );
    }
    function is(e) {
      return as(Po(), z, e);
    }
    function as(e, t, n) {
      if (
        ((t = Vo(e, t, ns)[0]),
        (e = Bo(zo)[0]),
        typeof t == `object` && t && typeof t.then == `function`)
      )
        try {
          var r = Io(t);
        } catch (e) {
          throw e === Ta ? Da : e;
        }
      else r = t;
      t = Po();
      var i = t.queue,
        a = i.dispatch;
      return (
        n !== t.memoizedState &&
          ((R.flags |= 2048),
          cs(9, { destroy: void 0 }, os.bind(null, i, n), null)),
        [r, a, e]
      );
    }
    function os(e, t) {
      e.action = t;
    }
    function ss(e) {
      var t = Po(),
        n = z;
      if (n !== null) return as(t, n, e);
      (Po(), (t = t.memoizedState), (n = Po()));
      var r = n.queue.dispatch;
      return ((n.memoizedState = e), [t, r, !1]);
    }
    function cs(e, t, n, r) {
      return (
        (e = { tag: e, create: n, deps: r, inst: t, next: null }),
        (t = R.updateQueue),
        t === null && ((t = Fo()), (R.updateQueue = t)),
        (n = t.lastEffect),
        n === null
          ? (t.lastEffect = e.next = e)
          : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e)),
        e
      );
    }
    function ls() {
      return Po().memoizedState;
    }
    function us(e, t, n, r) {
      var i = No();
      ((R.flags |= e),
        (i.memoizedState = cs(
          1 | t,
          { destroy: void 0 },
          n,
          r === void 0 ? null : r,
        )));
    }
    function ds(e, t, n, r) {
      var i = Po();
      r = r === void 0 ? null : r;
      var a = i.memoizedState.inst;
      z !== null && r !== null && To(r, z.memoizedState.deps)
        ? (i.memoizedState = cs(t, a, n, r))
        : ((R.flags |= e), (i.memoizedState = cs(1 | t, a, n, r)));
    }
    function fs(e, t) {
      us(8390656, 8, e, t);
    }
    function ps(e, t) {
      ds(2048, 8, e, t);
    }
    function ms(e) {
      R.flags |= 4;
      var t = R.updateQueue;
      if (t === null) ((t = Fo()), (R.updateQueue = t), (t.events = [e]));
      else {
        var n = t.events;
        n === null ? (t.events = [e]) : n.push(e);
      }
    }
    function hs(e) {
      var t = Po().memoizedState;
      return (
        ms({ ref: t, nextImpl: e }),
        function () {
          if (V & 2) throw Error(i(440));
          return t.impl.apply(void 0, arguments);
        }
      );
    }
    function gs(e, t) {
      return ds(4, 2, e, t);
    }
    function _s(e, t) {
      return ds(4, 4, e, t);
    }
    function vs(e, t) {
      if (typeof t == `function`) {
        e = e();
        var n = t(e);
        return function () {
          typeof n == `function` ? n() : t(null);
        };
      }
      if (t != null)
        return (
          (e = e()),
          (t.current = e),
          function () {
            t.current = null;
          }
        );
    }
    function ys(e, t, n) {
      ((n = n == null ? null : n.concat([e])),
        ds(4, 4, vs.bind(null, t, e), n));
    }
    function bs() {}
    function xs(e, t) {
      var n = Po();
      t = t === void 0 ? null : t;
      var r = n.memoizedState;
      return t !== null && To(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
    }
    function Ss(e, t) {
      var n = Po();
      t = t === void 0 ? null : t;
      var r = n.memoizedState;
      if (t !== null && To(t, r[1])) return r[0];
      if (((r = e()), yo)) {
        He(!0);
        try {
          e();
        } finally {
          He(!1);
        }
      }
      return ((n.memoizedState = [r, t]), r);
    }
    function Cs(e, t, n) {
      return n === void 0 || (ho & 1073741824 && !(W & 261930))
        ? (e.memoizedState = t)
        : ((e.memoizedState = n), (e = vu()), (R.lanes |= e), (K |= e), n);
    }
    function ws(e, t, n, r) {
      return Dr(n, t)
        ? n
        : eo.current === null
          ? !(ho & 42) || (ho & 1073741824 && !(W & 261930))
            ? ((oc = !0), (e.memoizedState = n))
            : ((e = vu()), (R.lanes |= e), (K |= e), t)
          : ((e = Cs(e, n, r)), Dr(e, t) || (oc = !0), e);
    }
    function Ts(e, t, n, r, i) {
      var a = O.p;
      O.p = a !== 0 && 8 > a ? a : 8;
      var o = D.T,
        s = {};
      ((D.T = s), Ls(e, !1, t, n));
      try {
        var c = i(),
          l = D.S;
        (l !== null && l(s, c),
          typeof c == `object` && c && typeof c.then == `function`
            ? Is(e, t, I(c, r), _u(e))
            : Is(e, t, r, _u(e)));
      } catch (n) {
        Is(e, t, { then: function () {}, status: `rejected`, reason: n }, _u());
      } finally {
        ((O.p = a),
          o !== null && s.types !== null && (o.types = s.types),
          (D.T = o));
      }
    }
    function Es() {}
    function Ds(e, t, n, r) {
      if (e.tag !== 5) throw Error(i(476));
      var a = Os(e).queue;
      Ts(
        e,
        a,
        t,
        le,
        n === null
          ? Es
          : function () {
              return (ks(e), n(r));
            },
      );
    }
    function Os(e) {
      var t = e.memoizedState;
      if (t !== null) return t;
      t = {
        memoizedState: le,
        baseState: le,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: zo,
          lastRenderedState: le,
        },
        next: null,
      };
      var n = {};
      return (
        (t.next = {
          memoizedState: n,
          baseState: n,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: zo,
            lastRenderedState: n,
          },
          next: null,
        }),
        (e.memoizedState = t),
        (e = e.alternate),
        e !== null && (e.memoizedState = t),
        t
      );
    }
    function ks(e) {
      var t = Os(e);
      (t.next === null && (t = e.alternate.memoizedState),
        Is(e, t.next.queue, {}, _u()));
    }
    function As() {
      return oa(tp);
    }
    function js() {
      return Po().memoizedState;
    }
    function Ms() {
      return Po().memoizedState;
    }
    function Ns(e) {
      for (var t = e.return; t !== null;) {
        switch (t.tag) {
          case 24:
          case 3:
            var n = _u();
            e = Ga(n);
            var r = Ka(t, e, n);
            (r !== null && (yu(r, t, n), qa(r, t, n)),
              (t = { cache: fa() }),
              (e.payload = t));
            return;
        }
        t = t.return;
      }
    }
    function Ps(e, t, n) {
      var r = _u();
      ((n = {
        lane: r,
        revertLane: 0,
        gesture: null,
        action: n,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      }),
        Rs(e)
          ? zs(t, n)
          : ((n = si(e, t, n, r)), n !== null && (yu(n, e, r), Bs(n, t, r))));
    }
    function Fs(e, t, n) {
      Is(e, t, n, _u());
    }
    function Is(e, t, n, r) {
      var i = {
        lane: r,
        revertLane: 0,
        gesture: null,
        action: n,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      };
      if (Rs(e)) zs(t, i);
      else {
        var a = e.alternate;
        if (
          e.lanes === 0 &&
          (a === null || a.lanes === 0) &&
          ((a = t.lastRenderedReducer), a !== null)
        )
          try {
            var o = t.lastRenderedState,
              s = a(o, n);
            if (((i.hasEagerState = !0), (i.eagerState = s), Dr(s, o)))
              return (oi(e, t, i, 0), H === null && ai(), !1);
          } catch {}
        if (((n = si(e, t, i, r)), n !== null))
          return (yu(n, e, r), Bs(n, t, r), !0);
      }
      return !1;
    }
    function Ls(e, t, n, r) {
      if (
        ((r = {
          lane: 2,
          revertLane: md(),
          gesture: null,
          action: r,
          hasEagerState: !1,
          eagerState: null,
          next: null,
        }),
        Rs(e))
      ) {
        if (t) throw Error(i(479));
      } else ((t = si(e, n, r, 2)), t !== null && yu(t, e, 2));
    }
    function Rs(e) {
      var t = e.alternate;
      return e === R || (t !== null && t === R);
    }
    function zs(e, t) {
      vo = _o = !0;
      var n = e.pending;
      (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)),
        (e.pending = t));
    }
    function Bs(e, t, n) {
      if (n & 4194048) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), at(e, n));
      }
    }
    var Vs = {
      readContext: oa,
      use: Lo,
      useCallback: wo,
      useContext: wo,
      useEffect: wo,
      useImperativeHandle: wo,
      useLayoutEffect: wo,
      useInsertionEffect: wo,
      useMemo: wo,
      useReducer: wo,
      useRef: wo,
      useState: wo,
      useDebugValue: wo,
      useDeferredValue: wo,
      useTransition: wo,
      useSyncExternalStore: wo,
      useId: wo,
      useHostTransitionStatus: wo,
      useFormState: wo,
      useActionState: wo,
      useOptimistic: wo,
      useMemoCache: wo,
      useCacheRefresh: wo,
    };
    Vs.useEffectEvent = wo;
    var Hs = {
        readContext: oa,
        use: Lo,
        useCallback: function (e, t) {
          return ((No().memoizedState = [e, t === void 0 ? null : t]), e);
        },
        useContext: oa,
        useEffect: fs,
        useImperativeHandle: function (e, t, n) {
          ((n = n == null ? null : n.concat([e])),
            us(4194308, 4, vs.bind(null, t, e), n));
        },
        useLayoutEffect: function (e, t) {
          return us(4194308, 4, e, t);
        },
        useInsertionEffect: function (e, t) {
          us(4, 2, e, t);
        },
        useMemo: function (e, t) {
          var n = No();
          t = t === void 0 ? null : t;
          var r = e();
          if (yo) {
            He(!0);
            try {
              e();
            } finally {
              He(!1);
            }
          }
          return ((n.memoizedState = [r, t]), r);
        },
        useReducer: function (e, t, n) {
          var r = No();
          if (n !== void 0) {
            var i = n(t);
            if (yo) {
              He(!0);
              try {
                n(t);
              } finally {
                He(!1);
              }
            }
          } else i = t;
          return (
            (r.memoizedState = r.baseState = i),
            (e = {
              pending: null,
              lanes: 0,
              dispatch: null,
              lastRenderedReducer: e,
              lastRenderedState: i,
            }),
            (r.queue = e),
            (e = e.dispatch = Ps.bind(null, R, e)),
            [r.memoizedState, e]
          );
        },
        useRef: function (e) {
          var t = No();
          return ((e = { current: e }), (t.memoizedState = e));
        },
        useState: function (e) {
          e = Yo(e);
          var t = e.queue,
            n = Fs.bind(null, R, t);
          return ((t.dispatch = n), [e.memoizedState, n]);
        },
        useDebugValue: bs,
        useDeferredValue: function (e, t) {
          return Cs(No(), e, t);
        },
        useTransition: function () {
          var e = Yo(!1);
          return (
            (e = Ts.bind(null, R, e.queue, !0, !1)),
            (No().memoizedState = e),
            [!1, e]
          );
        },
        useSyncExternalStore: function (e, t, n) {
          var r = R,
            a = No();
          if (P) {
            if (n === void 0) throw Error(i(407));
            n = n();
          } else {
            if (((n = t()), H === null)) throw Error(i(349));
            W & 127 || Wo(r, t, n);
          }
          a.memoizedState = n;
          var o = { value: n, getSnapshot: t };
          return (
            (a.queue = o),
            fs(Ko.bind(null, r, o, e), [e]),
            (r.flags |= 2048),
            cs(9, { destroy: void 0 }, Go.bind(null, r, o, n, t), null),
            n
          );
        },
        useId: function () {
          var e = No(),
            t = H.identifierPrefix;
          if (P) {
            var n = Mi,
              r = ji;
            ((n = (r & ~(1 << (32 - Ue(r) - 1))).toString(32) + n),
              (t = `_` + t + `R_` + n),
              (n = bo++),
              0 < n && (t += `H` + n.toString(32)),
              (t += `_`));
          } else ((n = Co++), (t = `_` + t + `r_` + n.toString(32) + `_`));
          return (e.memoizedState = t);
        },
        useHostTransitionStatus: As,
        useFormState: rs,
        useActionState: rs,
        useOptimistic: function (e) {
          var t = No();
          t.memoizedState = t.baseState = e;
          var n = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: null,
            lastRenderedState: null,
          };
          return (
            (t.queue = n),
            (t = Ls.bind(null, R, !0, n)),
            (n.dispatch = t),
            [e, t]
          );
        },
        useMemoCache: Ro,
        useCacheRefresh: function () {
          return (No().memoizedState = Ns.bind(null, R));
        },
        useEffectEvent: function (e) {
          var t = No(),
            n = { impl: e };
          return (
            (t.memoizedState = n),
            function () {
              if (V & 2) throw Error(i(440));
              return n.impl.apply(void 0, arguments);
            }
          );
        },
      },
      Us = {
        readContext: oa,
        use: Lo,
        useCallback: xs,
        useContext: oa,
        useEffect: ps,
        useImperativeHandle: ys,
        useInsertionEffect: gs,
        useLayoutEffect: _s,
        useMemo: Ss,
        useReducer: Bo,
        useRef: ls,
        useState: function () {
          return Bo(zo);
        },
        useDebugValue: bs,
        useDeferredValue: function (e, t) {
          return ws(Po(), z.memoizedState, e, t);
        },
        useTransition: function () {
          var e = Bo(zo)[0],
            t = Po().memoizedState;
          return [typeof e == `boolean` ? e : Io(e), t];
        },
        useSyncExternalStore: Uo,
        useId: js,
        useHostTransitionStatus: As,
        useFormState: is,
        useActionState: is,
        useOptimistic: function (e, t) {
          return Xo(Po(), z, e, t);
        },
        useMemoCache: Ro,
        useCacheRefresh: Ms,
      };
    Us.useEffectEvent = hs;
    var Ws = {
      readContext: oa,
      use: Lo,
      useCallback: xs,
      useContext: oa,
      useEffect: ps,
      useImperativeHandle: ys,
      useInsertionEffect: gs,
      useLayoutEffect: _s,
      useMemo: Ss,
      useReducer: Ho,
      useRef: ls,
      useState: function () {
        return Ho(zo);
      },
      useDebugValue: bs,
      useDeferredValue: function (e, t) {
        var n = Po();
        return z === null ? Cs(n, e, t) : ws(n, z.memoizedState, e, t);
      },
      useTransition: function () {
        var e = Ho(zo)[0],
          t = Po().memoizedState;
        return [typeof e == `boolean` ? e : Io(e), t];
      },
      useSyncExternalStore: Uo,
      useId: js,
      useHostTransitionStatus: As,
      useFormState: ss,
      useActionState: ss,
      useOptimistic: function (e, t) {
        var n = Po();
        return z === null
          ? ((n.baseState = e), [e, n.queue.dispatch])
          : Xo(n, z, e, t);
      },
      useMemoCache: Ro,
      useCacheRefresh: Ms,
    };
    Ws.useEffectEvent = hs;
    function Gs(e, t, n, r) {
      ((t = e.memoizedState),
        (n = n(r, t)),
        (n = n == null ? t : h({}, t, n)),
        (e.memoizedState = n),
        e.lanes === 0 && (e.updateQueue.baseState = n));
    }
    var Ks = {
      enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var r = _u(),
          i = Ga(r);
        ((i.payload = t),
          n != null && (i.callback = n),
          (t = Ka(e, i, r)),
          t !== null && (yu(t, e, r), qa(t, e, r)));
      },
      enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var r = _u(),
          i = Ga(r);
        ((i.tag = 1),
          (i.payload = t),
          n != null && (i.callback = n),
          (t = Ka(e, i, r)),
          t !== null && (yu(t, e, r), qa(t, e, r)));
      },
      enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = _u(),
          r = Ga(n);
        ((r.tag = 2),
          t != null && (r.callback = t),
          (t = Ka(e, r, n)),
          t !== null && (yu(t, e, n), qa(t, e, n)));
      },
    };
    function qs(e, t, n, r, i, a, o) {
      return (
        (e = e.stateNode),
        typeof e.shouldComponentUpdate == `function`
          ? e.shouldComponentUpdate(r, a, o)
          : t.prototype && t.prototype.isPureReactComponent
            ? !Or(n, r) || !Or(i, a)
            : !0
      );
    }
    function Js(e, t, n, r) {
      ((e = t.state),
        typeof t.componentWillReceiveProps == `function` &&
          t.componentWillReceiveProps(n, r),
        typeof t.UNSAFE_componentWillReceiveProps == `function` &&
          t.UNSAFE_componentWillReceiveProps(n, r),
        t.state !== e && Ks.enqueueReplaceState(t, t.state, null));
    }
    function Ys(e, t) {
      var n = t;
      if (`ref` in t) for (var r in ((n = {}), t)) r !== `ref` && (n[r] = t[r]);
      if ((e = e.defaultProps))
        for (var i in (n === t && (n = h({}, n)), e))
          n[i] === void 0 && (n[i] = e[i]);
      return n;
    }
    function Xs(e) {
      ti(e);
    }
    function Zs(e) {
      console.error(e);
    }
    function Qs(e) {
      ti(e);
    }
    function $s(e, t) {
      try {
        var n = e.onUncaughtError;
        n(t.value, { componentStack: t.stack });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function ec(e, t, n) {
      try {
        var r = e.onCaughtError;
        r(n.value, {
          componentStack: n.stack,
          errorBoundary: t.tag === 1 ? t.stateNode : null,
        });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function tc(e, t, n) {
      return (
        (n = Ga(n)),
        (n.tag = 3),
        (n.payload = { element: null }),
        (n.callback = function () {
          $s(e, t);
        }),
        n
      );
    }
    function nc(e) {
      return ((e = Ga(e)), (e.tag = 3), e);
    }
    function rc(e, t, n, r) {
      var i = n.type.getDerivedStateFromError;
      if (typeof i == `function`) {
        var a = r.value;
        ((e.payload = function () {
          return i(a);
        }),
          (e.callback = function () {
            ec(t, n, r);
          }));
      }
      var o = n.stateNode;
      o !== null &&
        typeof o.componentDidCatch == `function` &&
        (e.callback = function () {
          (ec(t, n, r),
            typeof i != `function` &&
              (su === null ? (su = new Set([this])) : su.add(this)));
          var e = r.stack;
          this.componentDidCatch(r.value, {
            componentStack: e === null ? `` : e,
          });
        });
    }
    function ic(e, t, n, r, a) {
      if (
        ((n.flags |= 32768),
        typeof r == `object` && r && typeof r.then == `function`)
      ) {
        if (
          ((t = n.alternate),
          t !== null && ra(t, n, a, !0),
          (n = ao.current),
          n !== null)
        ) {
          switch (n.tag) {
            case 31:
            case 13:
              return (
                oo === null
                  ? ju()
                  : n.alternate === null && Yl === 0 && (Yl = 3),
                (n.flags &= -257),
                (n.flags |= 65536),
                (n.lanes = a),
                r === Oa
                  ? (n.flags |= 16384)
                  : ((t = n.updateQueue),
                    t === null ? (n.updateQueue = new Set([r])) : t.add(r),
                    Yu(e, r, a)),
                !1
              );
            case 22:
              return (
                (n.flags |= 65536),
                r === Oa
                  ? (n.flags |= 16384)
                  : ((t = n.updateQueue),
                    t === null
                      ? ((t = {
                          transitions: null,
                          markerInstances: null,
                          retryQueue: new Set([r]),
                        }),
                        (n.updateQueue = t))
                      : ((n = t.retryQueue),
                        n === null ? (t.retryQueue = new Set([r])) : n.add(r)),
                    Yu(e, r, a)),
                !1
              );
          }
          throw Error(i(435, n.tag));
        }
        return (Yu(e, r, a), ju(), !1);
      }
      if (P)
        return (
          (t = ao.current),
          t === null
            ? (r !== Hi && ((t = Error(i(423), { cause: r })), Yi(Ci(t, n))),
              (e = e.current.alternate),
              (e.flags |= 65536),
              (a &= -a),
              (e.lanes |= a),
              (r = Ci(r, n)),
              (a = tc(e.stateNode, r, a)),
              Ja(e, a),
              Yl !== 4 && (Yl = 2))
            : (!(t.flags & 65536) && (t.flags |= 256),
              (t.flags |= 65536),
              (t.lanes = a),
              r !== Hi && ((e = Error(i(422), { cause: r })), Yi(Ci(e, n)))),
          !1
        );
      var o = Error(i(520), { cause: r });
      if (
        ((o = Ci(o, n)),
        eu === null ? (eu = [o]) : eu.push(o),
        Yl !== 4 && (Yl = 2),
        t === null)
      )
        return !0;
      ((r = Ci(r, n)), (n = t));
      do {
        switch (n.tag) {
          case 3:
            return (
              (n.flags |= 65536),
              (e = a & -a),
              (n.lanes |= e),
              (e = tc(n.stateNode, r, e)),
              Ja(n, e),
              !1
            );
          case 1:
            if (
              ((t = n.type),
              (o = n.stateNode),
              !(n.flags & 128) &&
                (typeof t.getDerivedStateFromError == `function` ||
                  (o !== null &&
                    typeof o.componentDidCatch == `function` &&
                    (su === null || !su.has(o)))))
            )
              return (
                (n.flags |= 65536),
                (a &= -a),
                (n.lanes |= a),
                (a = nc(a)),
                rc(a, e, n, r),
                Ja(n, a),
                !1
              );
        }
        n = n.return;
      } while (n !== null);
      return !1;
    }
    var ac = Error(i(461)),
      oc = !1;
    function sc(e, t, n, r) {
      t.child = e === null ? Va(t, null, n, r) : Ba(t, e.child, n, r);
    }
    function cc(e, t, n, r, i) {
      n = n.render;
      var a = t.ref;
      if (`ref` in r) {
        var o = {};
        for (var s in r) s !== `ref` && (o[s] = r[s]);
      } else o = r;
      return (
        aa(t),
        (r = Eo(e, t, n, o, a, i)),
        (s = Ao()),
        e !== null && !oc
          ? (jo(e, t, i), Mc(e, t, i))
          : (P && s && Fi(t), (t.flags |= 1), sc(e, t, r, i), t.child)
      );
    }
    function lc(e, t, n, r, i) {
      if (e === null) {
        var a = n.type;
        return typeof a == `function` &&
          !mi(a) &&
          a.defaultProps === void 0 &&
          n.compare === null
          ? ((t.tag = 15), (t.type = a), uc(e, t, a, r, i))
          : ((e = _i(n.type, null, r, t, t.mode, i)),
            (e.ref = t.ref),
            (e.return = t),
            (t.child = e));
      }
      if (((a = e.child), !Nc(e, i))) {
        var o = a.memoizedProps;
        if (
          ((n = n.compare),
          (n = n === null ? Or : n),
          n(o, r) && e.ref === t.ref)
        )
          return Mc(e, t, i);
      }
      return (
        (t.flags |= 1),
        (e = hi(a, r)),
        (e.ref = t.ref),
        (e.return = t),
        (t.child = e)
      );
    }
    function uc(e, t, n, r, i) {
      if (e !== null) {
        var a = e.memoizedProps;
        if (Or(a, r) && e.ref === t.ref)
          if (((oc = !1), (t.pendingProps = r = a), Nc(e, i)))
            e.flags & 131072 && (oc = !0);
          else return ((t.lanes = e.lanes), Mc(e, t, i));
      }
      return vc(e, t, n, r, i);
    }
    function dc(e, t, n, r) {
      var i = r.children,
        a = e === null ? null : e.memoizedState;
      if (
        (e === null &&
          t.stateNode === null &&
          (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null,
          }),
        r.mode === `hidden`)
      ) {
        if (t.flags & 128) {
          if (((a = a === null ? n : a.baseLanes | n), e !== null)) {
            for (r = t.child = e.child, i = 0; r !== null;)
              ((i = i | r.lanes | r.childLanes), (r = r.sibling));
            r = i & ~a;
          } else ((r = 0), (t.child = null));
          return pc(e, t, a, n, r);
        }
        if (n & 536870912)
          ((t.memoizedState = { baseLanes: 0, cachePool: null }),
            e !== null && Ca(t, a === null ? null : a.cachePool),
            a === null ? ro() : no(t, a),
            lo(t));
        else
          return (
            (r = t.lanes = 536870912),
            pc(e, t, a === null ? n : a.baseLanes | n, n, r)
          );
      } else
        a === null
          ? (e !== null && Ca(t, null), ro(), uo(t))
          : (Ca(t, a.cachePool), no(t, a), uo(t), (t.memoizedState = null));
      return (sc(e, t, i, n), t.child);
    }
    function fc(e, t) {
      return (
        (e !== null && e.tag === 22) ||
          t.stateNode !== null ||
          (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null,
          }),
        t.sibling
      );
    }
    function pc(e, t, n, r, i) {
      var a = Sa();
      return (
        (a = a === null ? null : { parent: da._currentValue, pool: a }),
        (t.memoizedState = { baseLanes: n, cachePool: a }),
        e !== null && Ca(t, null),
        ro(),
        lo(t),
        e !== null && ra(e, t, r, !0),
        (t.childLanes = i),
        null
      );
    }
    function mc(e, t) {
      return (
        (t = Dc({ mode: t.mode, children: t.children }, e.mode)),
        (t.ref = e.ref),
        (e.child = t),
        (t.return = e),
        t
      );
    }
    function hc(e, t, n) {
      return (
        Ba(t, e.child, null, n),
        (e = mc(t, t.pendingProps)),
        (e.flags |= 2),
        fo(t),
        (t.memoizedState = null),
        e
      );
    }
    function gc(e, t, n) {
      var r = t.pendingProps,
        a = !!(t.flags & 128);
      if (((t.flags &= -129), e === null)) {
        if (P) {
          if (r.mode === `hidden`)
            return ((e = mc(t, r)), (t.lanes = 536870912), fc(null, e));
          if (
            (co(t),
            (e = zi)
              ? ((e = sf(e, Vi)),
                (e = e !== null && e.data === `&` ? e : null),
                e !== null &&
                  ((t.memoizedState = {
                    dehydrated: e,
                    treeContext: Ai === null ? null : { id: ji, overflow: Mi },
                    retryLane: 536870912,
                    hydrationErrors: null,
                  }),
                  (n = bi(e)),
                  (n.return = t),
                  (t.child = n),
                  (Ri = t),
                  (zi = null)))
              : (e = null),
            e === null)
          )
            throw Ui(t);
          return ((t.lanes = 536870912), null);
        }
        return mc(t, r);
      }
      var o = e.memoizedState;
      if (o !== null) {
        var s = o.dehydrated;
        if ((co(t), a))
          if (t.flags & 256) ((t.flags &= -257), (t = hc(e, t, n)));
          else if (t.memoizedState !== null)
            ((t.child = e.child), (t.flags |= 128), (t = null));
          else throw Error(i(558));
        else if (
          (oc || ra(e, t, n, !1), (a = (n & e.childLanes) !== 0), oc || a)
        ) {
          if (
            ((r = H),
            r !== null && ((s = ot(r, n)), s !== 0 && s !== o.retryLane))
          )
            throw ((o.retryLane = s), ci(e, s), yu(r, e, s), ac);
          (ju(), (t = hc(e, t, n)));
        } else
          ((e = o.treeContext),
            (zi = df(s.nextSibling)),
            (Ri = t),
            (P = !0),
            (Bi = null),
            (Vi = !1),
            e !== null && Li(t, e),
            (t = mc(t, r)),
            (t.flags |= 4096));
        return t;
      }
      return (
        (e = hi(e.child, { mode: r.mode, children: r.children })),
        (e.ref = t.ref),
        (t.child = e),
        (e.return = t),
        e
      );
    }
    function _c(e, t) {
      var n = t.ref;
      if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
      else {
        if (typeof n != `function` && typeof n != `object`) throw Error(i(284));
        (e === null || e.ref !== n) && (t.flags |= 4194816);
      }
    }
    function vc(e, t, n, r, i) {
      return (
        aa(t),
        (n = Eo(e, t, n, r, void 0, i)),
        (r = Ao()),
        e !== null && !oc
          ? (jo(e, t, i), Mc(e, t, i))
          : (P && r && Fi(t), (t.flags |= 1), sc(e, t, n, i), t.child)
      );
    }
    function yc(e, t, n, r, i, a) {
      return (
        aa(t),
        (t.updateQueue = null),
        (n = Oo(t, r, n, i)),
        Do(e),
        (r = Ao()),
        e !== null && !oc
          ? (jo(e, t, a), Mc(e, t, a))
          : (P && r && Fi(t), (t.flags |= 1), sc(e, t, n, a), t.child)
      );
    }
    function bc(e, t, n, r, i) {
      if ((aa(t), t.stateNode === null)) {
        var a = di,
          o = n.contextType;
        (typeof o == `object` && o && (a = oa(o)),
          (a = new n(r, a)),
          (t.memoizedState =
            a.state !== null && a.state !== void 0 ? a.state : null),
          (a.updater = Ks),
          (t.stateNode = a),
          (a._reactInternals = t),
          (a = t.stateNode),
          (a.props = r),
          (a.state = t.memoizedState),
          (a.refs = {}),
          Ua(t),
          (o = n.contextType),
          (a.context = typeof o == `object` && o ? oa(o) : di),
          (a.state = t.memoizedState),
          (o = n.getDerivedStateFromProps),
          typeof o == `function` &&
            (Gs(t, n, o, r), (a.state = t.memoizedState)),
          typeof n.getDerivedStateFromProps == `function` ||
            typeof a.getSnapshotBeforeUpdate == `function` ||
            (typeof a.UNSAFE_componentWillMount != `function` &&
              typeof a.componentWillMount != `function`) ||
            ((o = a.state),
            typeof a.componentWillMount == `function` && a.componentWillMount(),
            typeof a.UNSAFE_componentWillMount == `function` &&
              a.UNSAFE_componentWillMount(),
            o !== a.state && Ks.enqueueReplaceState(a, a.state, null),
            Za(t, r, a, i),
            Xa(),
            (a.state = t.memoizedState)),
          typeof a.componentDidMount == `function` && (t.flags |= 4194308),
          (r = !0));
      } else if (e === null) {
        a = t.stateNode;
        var s = t.memoizedProps,
          c = Ys(n, s);
        a.props = c;
        var l = a.context,
          u = n.contextType;
        ((o = di), typeof u == `object` && u && (o = oa(u)));
        var d = n.getDerivedStateFromProps;
        ((u =
          typeof d == `function` ||
          typeof a.getSnapshotBeforeUpdate == `function`),
          (s = t.pendingProps !== s),
          u ||
            (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
              typeof a.componentWillReceiveProps != `function`) ||
            ((s || l !== o) && Js(t, a, r, o)),
          (Ha = !1));
        var f = t.memoizedState;
        ((a.state = f),
          Za(t, r, a, i),
          Xa(),
          (l = t.memoizedState),
          s || f !== l || Ha
            ? (typeof d == `function` &&
                (Gs(t, n, d, r), (l = t.memoizedState)),
              (c = Ha || qs(t, n, c, r, f, l, o))
                ? (u ||
                    (typeof a.UNSAFE_componentWillMount != `function` &&
                      typeof a.componentWillMount != `function`) ||
                    (typeof a.componentWillMount == `function` &&
                      a.componentWillMount(),
                    typeof a.UNSAFE_componentWillMount == `function` &&
                      a.UNSAFE_componentWillMount()),
                  typeof a.componentDidMount == `function` &&
                    (t.flags |= 4194308))
                : (typeof a.componentDidMount == `function` &&
                    (t.flags |= 4194308),
                  (t.memoizedProps = r),
                  (t.memoizedState = l)),
              (a.props = r),
              (a.state = l),
              (a.context = o),
              (r = c))
            : (typeof a.componentDidMount == `function` && (t.flags |= 4194308),
              (r = !1)));
      } else {
        ((a = t.stateNode),
          Wa(e, t),
          (o = t.memoizedProps),
          (u = Ys(n, o)),
          (a.props = u),
          (d = t.pendingProps),
          (f = a.context),
          (l = n.contextType),
          (c = di),
          typeof l == `object` && l && (c = oa(l)),
          (s = n.getDerivedStateFromProps),
          (l =
            typeof s == `function` ||
            typeof a.getSnapshotBeforeUpdate == `function`) ||
            (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
              typeof a.componentWillReceiveProps != `function`) ||
            ((o !== d || f !== c) && Js(t, a, r, c)),
          (Ha = !1),
          (f = t.memoizedState),
          (a.state = f),
          Za(t, r, a, i),
          Xa());
        var p = t.memoizedState;
        o !== d ||
        f !== p ||
        Ha ||
        (e !== null && e.dependencies !== null && ia(e.dependencies))
          ? (typeof s == `function` && (Gs(t, n, s, r), (p = t.memoizedState)),
            (u =
              Ha ||
              qs(t, n, u, r, f, p, c) ||
              (e !== null && e.dependencies !== null && ia(e.dependencies)))
              ? (l ||
                  (typeof a.UNSAFE_componentWillUpdate != `function` &&
                    typeof a.componentWillUpdate != `function`) ||
                  (typeof a.componentWillUpdate == `function` &&
                    a.componentWillUpdate(r, p, c),
                  typeof a.UNSAFE_componentWillUpdate == `function` &&
                    a.UNSAFE_componentWillUpdate(r, p, c)),
                typeof a.componentDidUpdate == `function` && (t.flags |= 4),
                typeof a.getSnapshotBeforeUpdate == `function` &&
                  (t.flags |= 1024))
              : (typeof a.componentDidUpdate != `function` ||
                  (o === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 4),
                typeof a.getSnapshotBeforeUpdate != `function` ||
                  (o === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 1024),
                (t.memoizedProps = r),
                (t.memoizedState = p)),
            (a.props = r),
            (a.state = p),
            (a.context = c),
            (r = u))
          : (typeof a.componentDidUpdate != `function` ||
              (o === e.memoizedProps && f === e.memoizedState) ||
              (t.flags |= 4),
            typeof a.getSnapshotBeforeUpdate != `function` ||
              (o === e.memoizedProps && f === e.memoizedState) ||
              (t.flags |= 1024),
            (r = !1));
      }
      return (
        (a = r),
        _c(e, t),
        (r = !!(t.flags & 128)),
        a || r
          ? ((a = t.stateNode),
            (n =
              r && typeof n.getDerivedStateFromError != `function`
                ? null
                : a.render()),
            (t.flags |= 1),
            e !== null && r
              ? ((t.child = Ba(t, e.child, null, i)),
                (t.child = Ba(t, null, n, i)))
              : sc(e, t, n, i),
            (t.memoizedState = a.state),
            (e = t.child))
          : (e = Mc(e, t, i)),
        e
      );
    }
    function xc(e, t, n, r) {
      return (qi(), (t.flags |= 256), sc(e, t, n, r), t.child);
    }
    var Sc = {
      dehydrated: null,
      treeContext: null,
      retryLane: 0,
      hydrationErrors: null,
    };
    function Cc(e) {
      return { baseLanes: e, cachePool: wa() };
    }
    function wc(e, t, n) {
      return ((e = e === null ? 0 : e.childLanes & ~n), t && (e |= Ql), e);
    }
    function Tc(e, t, n) {
      var r = t.pendingProps,
        a = !1,
        o = !!(t.flags & 128),
        s;
      if (
        ((s = o) ||
          (s =
            e !== null && e.memoizedState === null ? !1 : !!(po.current & 2)),
        s && ((a = !0), (t.flags &= -129)),
        (s = !!(t.flags & 32)),
        (t.flags &= -33),
        e === null)
      ) {
        if (P) {
          if (
            (a ? so(t) : uo(t),
            (e = zi)
              ? ((e = sf(e, Vi)),
                (e = e !== null && e.data !== `&` ? e : null),
                e !== null &&
                  ((t.memoizedState = {
                    dehydrated: e,
                    treeContext: Ai === null ? null : { id: ji, overflow: Mi },
                    retryLane: 536870912,
                    hydrationErrors: null,
                  }),
                  (n = bi(e)),
                  (n.return = t),
                  (t.child = n),
                  (Ri = t),
                  (zi = null)))
              : (e = null),
            e === null)
          )
            throw Ui(t);
          return (lf(e) ? (t.lanes = 32) : (t.lanes = 536870912), null);
        }
        var c = r.children;
        return (
          (r = r.fallback),
          a
            ? (uo(t),
              (a = t.mode),
              (c = Dc({ mode: `hidden`, children: c }, a)),
              (r = vi(r, a, n, null)),
              (c.return = t),
              (r.return = t),
              (c.sibling = r),
              (t.child = c),
              (r = t.child),
              (r.memoizedState = Cc(n)),
              (r.childLanes = wc(e, s, n)),
              (t.memoizedState = Sc),
              fc(null, r))
            : (so(t), Ec(t, c))
        );
      }
      var l = e.memoizedState;
      if (l !== null && ((c = l.dehydrated), c !== null)) {
        if (o)
          t.flags & 256
            ? (so(t), (t.flags &= -257), (t = Oc(e, t, n)))
            : t.memoizedState === null
              ? (uo(t),
                (c = r.fallback),
                (a = t.mode),
                (r = Dc({ mode: `visible`, children: r.children }, a)),
                (c = vi(c, a, n, null)),
                (c.flags |= 2),
                (r.return = t),
                (c.return = t),
                (r.sibling = c),
                (t.child = r),
                Ba(t, e.child, null, n),
                (r = t.child),
                (r.memoizedState = Cc(n)),
                (r.childLanes = wc(e, s, n)),
                (t.memoizedState = Sc),
                (t = fc(null, r)))
              : (uo(t), (t.child = e.child), (t.flags |= 128), (t = null));
        else if ((so(t), lf(c))) {
          if (((s = c.nextSibling && c.nextSibling.dataset), s)) var u = s.dgst;
          ((s = u),
            (r = Error(i(419))),
            (r.stack = ``),
            (r.digest = s),
            Yi({ value: r, source: null, stack: null }),
            (t = Oc(e, t, n)));
        } else if (
          (oc || ra(e, t, n, !1), (s = (n & e.childLanes) !== 0), oc || s)
        ) {
          if (
            ((s = H),
            s !== null && ((r = ot(s, n)), r !== 0 && r !== l.retryLane))
          )
            throw ((l.retryLane = r), ci(e, r), yu(s, e, r), ac);
          (cf(c) || ju(), (t = Oc(e, t, n)));
        } else
          cf(c)
            ? ((t.flags |= 192), (t.child = e.child), (t = null))
            : ((e = l.treeContext),
              (zi = df(c.nextSibling)),
              (Ri = t),
              (P = !0),
              (Bi = null),
              (Vi = !1),
              e !== null && Li(t, e),
              (t = Ec(t, r.children)),
              (t.flags |= 4096));
        return t;
      }
      return a
        ? (uo(t),
          (c = r.fallback),
          (a = t.mode),
          (l = e.child),
          (u = l.sibling),
          (r = hi(l, { mode: `hidden`, children: r.children })),
          (r.subtreeFlags = l.subtreeFlags & 65011712),
          u === null
            ? ((c = vi(c, a, n, null)), (c.flags |= 2))
            : (c = hi(u, c)),
          (c.return = t),
          (r.return = t),
          (r.sibling = c),
          (t.child = r),
          fc(null, r),
          (r = t.child),
          (c = e.child.memoizedState),
          c === null
            ? (c = Cc(n))
            : ((a = c.cachePool),
              a === null
                ? (a = wa())
                : ((l = da._currentValue),
                  (a = a.parent === l ? a : { parent: l, pool: l })),
              (c = { baseLanes: c.baseLanes | n, cachePool: a })),
          (r.memoizedState = c),
          (r.childLanes = wc(e, s, n)),
          (t.memoizedState = Sc),
          fc(e.child, r))
        : (so(t),
          (n = e.child),
          (e = n.sibling),
          (n = hi(n, { mode: `visible`, children: r.children })),
          (n.return = t),
          (n.sibling = null),
          e !== null &&
            ((s = t.deletions),
            s === null ? ((t.deletions = [e]), (t.flags |= 16)) : s.push(e)),
          (t.child = n),
          (t.memoizedState = null),
          n);
    }
    function Ec(e, t) {
      return (
        (t = Dc({ mode: `visible`, children: t }, e.mode)),
        (t.return = e),
        (e.child = t)
      );
    }
    function Dc(e, t) {
      return ((e = pi(22, e, null, t)), (e.lanes = 0), e);
    }
    function Oc(e, t, n) {
      return (
        Ba(t, e.child, null, n),
        (e = Ec(t, t.pendingProps.children)),
        (e.flags |= 2),
        (t.memoizedState = null),
        e
      );
    }
    function kc(e, t, n) {
      e.lanes |= t;
      var r = e.alternate;
      (r !== null && (r.lanes |= t), ta(e.return, t, n));
    }
    function Ac(e, t, n, r, i, a) {
      var o = e.memoizedState;
      o === null
        ? (e.memoizedState = {
            isBackwards: t,
            rendering: null,
            renderingStartTime: 0,
            last: r,
            tail: n,
            tailMode: i,
            treeForkCount: a,
          })
        : ((o.isBackwards = t),
          (o.rendering = null),
          (o.renderingStartTime = 0),
          (o.last = r),
          (o.tail = n),
          (o.tailMode = i),
          (o.treeForkCount = a));
    }
    function jc(e, t, n) {
      var r = t.pendingProps,
        i = r.revealOrder,
        a = r.tail;
      r = r.children;
      var o = po.current,
        s = !!(o & 2);
      if (
        (s ? ((o = (o & 1) | 2), (t.flags |= 128)) : (o &= 1),
        j(po, o),
        sc(e, t, r, n),
        (r = P ? Di : 0),
        !s && e !== null && e.flags & 128)
      )
        a: for (e = t.child; e !== null;) {
          if (e.tag === 13) e.memoizedState !== null && kc(e, n, t);
          else if (e.tag === 19) kc(e, n, t);
          else if (e.child !== null) {
            ((e.child.return = e), (e = e.child));
            continue;
          }
          if (e === t) break a;
          for (; e.sibling === null;) {
            if (e.return === null || e.return === t) break a;
            e = e.return;
          }
          ((e.sibling.return = e.return), (e = e.sibling));
        }
      switch (i) {
        case `forwards`:
          for (n = t.child, i = null; n !== null;)
            ((e = n.alternate),
              e !== null && mo(e) === null && (i = n),
              (n = n.sibling));
          ((n = i),
            n === null
              ? ((i = t.child), (t.child = null))
              : ((i = n.sibling), (n.sibling = null)),
            Ac(t, !1, i, n, a, r));
          break;
        case `backwards`:
        case `unstable_legacy-backwards`:
          for (n = null, i = t.child, t.child = null; i !== null;) {
            if (((e = i.alternate), e !== null && mo(e) === null)) {
              t.child = i;
              break;
            }
            ((e = i.sibling), (i.sibling = n), (n = i), (i = e));
          }
          Ac(t, !0, n, null, a, r);
          break;
        case `together`:
          Ac(t, !1, null, null, void 0, r);
          break;
        default:
          t.memoizedState = null;
      }
      return t.child;
    }
    function Mc(e, t, n) {
      if (
        (e !== null && (t.dependencies = e.dependencies),
        (K |= t.lanes),
        (n & t.childLanes) === 0)
      )
        if (e !== null) {
          if ((ra(e, t, n, !1), (n & t.childLanes) === 0)) return null;
        } else return null;
      if (e !== null && t.child !== e.child) throw Error(i(153));
      if (t.child !== null) {
        for (
          e = t.child, n = hi(e, e.pendingProps), t.child = n, n.return = t;
          e.sibling !== null;
        )
          ((e = e.sibling),
            (n = n.sibling = hi(e, e.pendingProps)),
            (n.return = t));
        n.sibling = null;
      }
      return t.child;
    }
    function Nc(e, t) {
      return (
        (e.lanes & t) !== 0 || ((e = e.dependencies), !!(e !== null && ia(e)))
      );
    }
    function Pc(e, t, n) {
      switch (t.tag) {
        case 3:
          (he(t, t.stateNode.containerInfo),
            $i(t, da, e.memoizedState.cache),
            qi());
          break;
        case 27:
        case 5:
          _e(t);
          break;
        case 4:
          he(t, t.stateNode.containerInfo);
          break;
        case 10:
          $i(t, t.type, t.memoizedProps.value);
          break;
        case 31:
          if (t.memoizedState !== null) return ((t.flags |= 128), co(t), null);
          break;
        case 13:
          var r = t.memoizedState;
          if (r !== null)
            return r.dehydrated === null
              ? (n & t.child.childLanes) === 0
                ? (so(t), (e = Mc(e, t, n)), e === null ? null : e.sibling)
                : Tc(e, t, n)
              : (so(t), (t.flags |= 128), null);
          so(t);
          break;
        case 19:
          var i = !!(e.flags & 128);
          if (
            ((r = (n & t.childLanes) !== 0),
            (r ||= (ra(e, t, n, !1), (n & t.childLanes) !== 0)),
            i)
          ) {
            if (r) return jc(e, t, n);
            t.flags |= 128;
          }
          if (
            ((i = t.memoizedState),
            i !== null &&
              ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
            j(po, po.current),
            r)
          )
            break;
          return null;
        case 22:
          return ((t.lanes = 0), dc(e, t, n, t.pendingProps));
        case 24:
          $i(t, da, e.memoizedState.cache);
      }
      return Mc(e, t, n);
    }
    function Fc(e, t, n) {
      if (e !== null)
        if (e.memoizedProps !== t.pendingProps) oc = !0;
        else {
          if (!Nc(e, n) && !(t.flags & 128)) return ((oc = !1), Pc(e, t, n));
          oc = !!(e.flags & 131072);
        }
      else ((oc = !1), P && t.flags & 1048576 && Pi(t, Di, t.index));
      switch (((t.lanes = 0), t.tag)) {
        case 16:
          a: {
            var r = t.pendingProps;
            if (((e = ja(t.elementType)), (t.type = e), typeof e == `function`))
              mi(e)
                ? ((r = Ys(e, r)), (t.tag = 1), (t = bc(null, t, e, r, n)))
                : ((t.tag = 0), (t = vc(null, t, e, r, n)));
            else {
              if (e != null) {
                var a = e.$$typeof;
                if (a === w) {
                  ((t.tag = 11), (t = cc(null, t, e, r, n)));
                  break a;
                }
                if (a === te) {
                  ((t.tag = 14), (t = lc(null, t, e, r, n)));
                  break a;
                }
              }
              throw ((t = se(e) || e), Error(i(306, t, ``)));
            }
          }
          return t;
        case 0:
          return vc(e, t, t.type, t.pendingProps, n);
        case 1:
          return ((r = t.type), (a = Ys(r, t.pendingProps)), bc(e, t, r, a, n));
        case 3:
          a: {
            if ((he(t, t.stateNode.containerInfo), e === null))
              throw Error(i(387));
            r = t.pendingProps;
            var o = t.memoizedState;
            ((a = o.element), Wa(e, t), Za(t, r, null, n));
            var s = t.memoizedState;
            if (
              ((r = s.cache),
              $i(t, da, r),
              r !== o.cache && na(t, [da], n, !0),
              Xa(),
              (r = s.element),
              o.isDehydrated)
            )
              if (
                ((o = { element: r, isDehydrated: !1, cache: s.cache }),
                (t.updateQueue.baseState = o),
                (t.memoizedState = o),
                t.flags & 256)
              ) {
                t = xc(e, t, r, n);
                break a;
              } else if (r !== a) {
                ((a = Ci(Error(i(424)), t)), Yi(a), (t = xc(e, t, r, n)));
                break a;
              } else {
                switch (((e = t.stateNode.containerInfo), e.nodeType)) {
                  case 9:
                    e = e.body;
                    break;
                  default:
                    e = e.nodeName === `HTML` ? e.ownerDocument.body : e;
                }
                for (
                  zi = df(e.firstChild),
                    Ri = t,
                    P = !0,
                    Bi = null,
                    Vi = !0,
                    n = Va(t, null, r, n),
                    t.child = n;
                  n;
                )
                  ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
              }
            else {
              if ((qi(), r === a)) {
                t = Mc(e, t, n);
                break a;
              }
              sc(e, t, r, n);
            }
            t = t.child;
          }
          return t;
        case 26:
          return (
            _c(e, t),
            e === null
              ? (n = Mf(t.type, null, t.pendingProps, null))
                ? (t.memoizedState = n)
                : P ||
                  ((n = t.type),
                  (e = t.pendingProps),
                  (r = Ud(pe.current).createElement(n)),
                  (r[ft] = t),
                  (r[pt] = e),
                  Ld(r, n, e),
                  Tt(r),
                  (t.stateNode = r))
              : (t.memoizedState = Mf(
                  t.type,
                  e.memoizedProps,
                  t.pendingProps,
                  e.memoizedState,
                )),
            null
          );
        case 27:
          return (
            _e(t),
            e === null &&
              P &&
              ((r = t.stateNode = hf(t.type, t.pendingProps, pe.current)),
              (Ri = t),
              (Vi = !0),
              (a = zi),
              ef(t.type) ? ((ff = a), (zi = df(r.firstChild))) : (zi = a)),
            sc(e, t, t.pendingProps.children, n),
            _c(e, t),
            e === null && (t.flags |= 4194304),
            t.child
          );
        case 5:
          return (
            e === null &&
              P &&
              ((a = r = zi) &&
                ((r = af(r, t.type, t.pendingProps, Vi)),
                r === null
                  ? (a = !1)
                  : ((t.stateNode = r),
                    (Ri = t),
                    (zi = df(r.firstChild)),
                    (Vi = !1),
                    (a = !0))),
              a || Ui(t)),
            _e(t),
            (a = t.type),
            (o = t.pendingProps),
            (s = e === null ? null : e.memoizedProps),
            (r = o.children),
            Kd(a, o) ? (r = null) : s !== null && Kd(a, s) && (t.flags |= 32),
            t.memoizedState !== null &&
              ((a = Eo(e, t, ko, null, null, n)), (tp._currentValue = a)),
            _c(e, t),
            sc(e, t, r, n),
            t.child
          );
        case 6:
          return (
            e === null &&
              P &&
              ((e = n = zi) &&
                ((n = of(n, t.pendingProps, Vi)),
                n === null
                  ? (e = !1)
                  : ((t.stateNode = n), (Ri = t), (zi = null), (e = !0))),
              e || Ui(t)),
            null
          );
        case 13:
          return Tc(e, t, n);
        case 4:
          return (
            he(t, t.stateNode.containerInfo),
            (r = t.pendingProps),
            e === null ? (t.child = Ba(t, null, r, n)) : sc(e, t, r, n),
            t.child
          );
        case 11:
          return cc(e, t, t.type, t.pendingProps, n);
        case 7:
          return (sc(e, t, t.pendingProps, n), t.child);
        case 8:
          return (sc(e, t, t.pendingProps.children, n), t.child);
        case 12:
          return (sc(e, t, t.pendingProps.children, n), t.child);
        case 10:
          return (
            (r = t.pendingProps),
            $i(t, t.type, r.value),
            sc(e, t, r.children, n),
            t.child
          );
        case 9:
          return (
            (a = t.type._context),
            (r = t.pendingProps.children),
            aa(t),
            (a = oa(a)),
            (r = r(a)),
            (t.flags |= 1),
            sc(e, t, r, n),
            t.child
          );
        case 14:
          return lc(e, t, t.type, t.pendingProps, n);
        case 15:
          return uc(e, t, t.type, t.pendingProps, n);
        case 19:
          return jc(e, t, n);
        case 31:
          return gc(e, t, n);
        case 22:
          return dc(e, t, n, t.pendingProps);
        case 24:
          return (
            aa(t),
            (r = oa(da)),
            e === null
              ? ((a = Sa()),
                a === null &&
                  ((a = H),
                  (o = fa()),
                  (a.pooledCache = o),
                  o.refCount++,
                  o !== null && (a.pooledCacheLanes |= n),
                  (a = o)),
                (t.memoizedState = { parent: r, cache: a }),
                Ua(t),
                $i(t, da, a))
              : ((e.lanes & n) !== 0 && (Wa(e, t), Za(t, null, null, n), Xa()),
                (a = e.memoizedState),
                (o = t.memoizedState),
                a.parent === r
                  ? ((r = o.cache),
                    $i(t, da, r),
                    r !== a.cache && na(t, [da], n, !0))
                  : ((a = { parent: r, cache: r }),
                    (t.memoizedState = a),
                    t.lanes === 0 &&
                      (t.memoizedState = t.updateQueue.baseState = a),
                    $i(t, da, r))),
            sc(e, t, t.pendingProps.children, n),
            t.child
          );
        case 29:
          throw t.pendingProps;
      }
      throw Error(i(156, t.tag));
    }
    function Ic(e) {
      e.flags |= 4;
    }
    function Lc(e, t, n, r, i) {
      if (((t = !!(e.mode & 32)) && (t = !1), t)) {
        if (((e.flags |= 16777216), (i & 335544128) === i))
          if (e.stateNode.complete) e.flags |= 8192;
          else if (Ou()) e.flags |= 8192;
          else throw ((L = Oa), Ea);
      } else e.flags &= -16777217;
    }
    function Rc(e, t) {
      if (t.type !== `stylesheet` || t.state.loading & 4) e.flags &= -16777217;
      else if (((e.flags |= 16777216), !qf(t)))
        if (Ou()) e.flags |= 8192;
        else throw ((L = Oa), Ea);
    }
    function zc(e, t) {
      (t !== null && (e.flags |= 4),
        e.flags & 16384 &&
          ((t = e.tag === 22 ? 536870912 : et()), (e.lanes |= t), ($l |= t)));
    }
    function Bc(e, t) {
      if (!P)
        switch (e.tailMode) {
          case `hidden`:
            t = e.tail;
            for (var n = null; t !== null;)
              (t.alternate !== null && (n = t), (t = t.sibling));
            n === null ? (e.tail = null) : (n.sibling = null);
            break;
          case `collapsed`:
            n = e.tail;
            for (var r = null; n !== null;)
              (n.alternate !== null && (r = n), (n = n.sibling));
            r === null
              ? t || e.tail === null
                ? (e.tail = null)
                : (e.tail.sibling = null)
              : (r.sibling = null);
        }
    }
    function Vc(e) {
      var t = e.alternate !== null && e.alternate.child === e.child,
        n = 0,
        r = 0;
      if (t)
        for (var i = e.child; i !== null;)
          ((n |= i.lanes | i.childLanes),
            (r |= i.subtreeFlags & 65011712),
            (r |= i.flags & 65011712),
            (i.return = e),
            (i = i.sibling));
      else
        for (i = e.child; i !== null;)
          ((n |= i.lanes | i.childLanes),
            (r |= i.subtreeFlags),
            (r |= i.flags),
            (i.return = e),
            (i = i.sibling));
      return ((e.subtreeFlags |= r), (e.childLanes = n), t);
    }
    function Hc(e, t, n) {
      var r = t.pendingProps;
      switch ((Ii(t), t.tag)) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
          return (Vc(t), null);
        case 1:
          return (Vc(t), null);
        case 3:
          return (
            (n = t.stateNode),
            (r = null),
            e !== null && (r = e.memoizedState.cache),
            t.memoizedState.cache !== r && (t.flags |= 2048),
            ea(da),
            ge(),
            n.pendingContext &&
              ((n.context = n.pendingContext), (n.pendingContext = null)),
            (e === null || e.child === null) &&
              (Ki(t)
                ? Ic(t)
                : e === null ||
                  (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                  ((t.flags |= 1024), Ji())),
            Vc(t),
            null
          );
        case 26:
          var a = t.type,
            o = t.memoizedState;
          return (
            e === null
              ? (Ic(t),
                o === null ? (Vc(t), Lc(t, a, null, r, n)) : (Vc(t), Rc(t, o)))
              : o
                ? o === e.memoizedState
                  ? (Vc(t), (t.flags &= -16777217))
                  : (Ic(t), Vc(t), Rc(t, o))
                : ((e = e.memoizedProps),
                  e !== r && Ic(t),
                  Vc(t),
                  Lc(t, a, e, r, n)),
            null
          );
        case 27:
          if (
            (ve(t),
            (n = pe.current),
            (a = t.type),
            e !== null && t.stateNode != null)
          )
            e.memoizedProps !== r && Ic(t);
          else {
            if (!r) {
              if (t.stateNode === null) throw Error(i(166));
              return (Vc(t), null);
            }
            ((e = fe.current),
              Ki(t) ? Wi(t, e) : ((e = hf(a, r, n)), (t.stateNode = e), Ic(t)));
          }
          return (Vc(t), null);
        case 5:
          if ((ve(t), (a = t.type), e !== null && t.stateNode != null))
            e.memoizedProps !== r && Ic(t);
          else {
            if (!r) {
              if (t.stateNode === null) throw Error(i(166));
              return (Vc(t), null);
            }
            if (((o = fe.current), Ki(t))) Wi(t, o);
            else {
              var s = Ud(pe.current);
              switch (o) {
                case 1:
                  o = s.createElementNS(`http://www.w3.org/2000/svg`, a);
                  break;
                case 2:
                  o = s.createElementNS(
                    `http://www.w3.org/1998/Math/MathML`,
                    a,
                  );
                  break;
                default:
                  switch (a) {
                    case `svg`:
                      o = s.createElementNS(`http://www.w3.org/2000/svg`, a);
                      break;
                    case `math`:
                      o = s.createElementNS(
                        `http://www.w3.org/1998/Math/MathML`,
                        a,
                      );
                      break;
                    case `script`:
                      ((o = s.createElement(`div`)),
                        (o.innerHTML = `<script><\/script>`),
                        (o = o.removeChild(o.firstChild)));
                      break;
                    case `select`:
                      ((o =
                        typeof r.is == `string`
                          ? s.createElement(`select`, { is: r.is })
                          : s.createElement(`select`)),
                        r.multiple
                          ? (o.multiple = !0)
                          : r.size && (o.size = r.size));
                      break;
                    default:
                      o =
                        typeof r.is == `string`
                          ? s.createElement(a, { is: r.is })
                          : s.createElement(a);
                  }
              }
              ((o[ft] = t), (o[pt] = r));
              a: for (s = t.child; s !== null;) {
                if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
                else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
                  ((s.child.return = s), (s = s.child));
                  continue;
                }
                if (s === t) break a;
                for (; s.sibling === null;) {
                  if (s.return === null || s.return === t) break a;
                  s = s.return;
                }
                ((s.sibling.return = s.return), (s = s.sibling));
              }
              t.stateNode = o;
              a: switch ((Ld(o, a, r), a)) {
                case `button`:
                case `input`:
                case `select`:
                case `textarea`:
                  r = !!r.autoFocus;
                  break a;
                case `img`:
                  r = !0;
                  break a;
                default:
                  r = !1;
              }
              r && Ic(t);
            }
          }
          return (
            Vc(t),
            Lc(
              t,
              t.type,
              e === null ? null : e.memoizedProps,
              t.pendingProps,
              n,
            ),
            null
          );
        case 6:
          if (e && t.stateNode != null) e.memoizedProps !== r && Ic(t);
          else {
            if (typeof r != `string` && t.stateNode === null)
              throw Error(i(166));
            if (((e = pe.current), Ki(t))) {
              if (
                ((e = t.stateNode),
                (n = t.memoizedProps),
                (r = null),
                (a = Ri),
                a !== null)
              )
                switch (a.tag) {
                  case 27:
                  case 5:
                    r = a.memoizedProps;
                }
              ((e[ft] = t),
                (e = !!(
                  e.nodeValue === n ||
                  (r !== null && !0 === r.suppressHydrationWarning) ||
                  Fd(e.nodeValue, n)
                )),
                e || Ui(t, !0));
            } else
              ((e = Ud(e).createTextNode(r)), (e[ft] = t), (t.stateNode = e));
          }
          return (Vc(t), null);
        case 31:
          if (((n = t.memoizedState), e === null || e.memoizedState !== null)) {
            if (((r = Ki(t)), n !== null)) {
              if (e === null) {
                if (!r) throw Error(i(318));
                if (
                  ((e = t.memoizedState),
                  (e = e === null ? null : e.dehydrated),
                  !e)
                )
                  throw Error(i(557));
                e[ft] = t;
              } else
                (qi(),
                  !(t.flags & 128) && (t.memoizedState = null),
                  (t.flags |= 4));
              (Vc(t), (e = !1));
            } else
              ((n = Ji()),
                e !== null &&
                  e.memoizedState !== null &&
                  (e.memoizedState.hydrationErrors = n),
                (e = !0));
            if (!e) return t.flags & 256 ? (fo(t), t) : (fo(t), null);
            if (t.flags & 128) throw Error(i(558));
          }
          return (Vc(t), null);
        case 13:
          if (
            ((r = t.memoizedState),
            e === null ||
              (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
          ) {
            if (((a = Ki(t)), r !== null && r.dehydrated !== null)) {
              if (e === null) {
                if (!a) throw Error(i(318));
                if (
                  ((a = t.memoizedState),
                  (a = a === null ? null : a.dehydrated),
                  !a)
                )
                  throw Error(i(317));
                a[ft] = t;
              } else
                (qi(),
                  !(t.flags & 128) && (t.memoizedState = null),
                  (t.flags |= 4));
              (Vc(t), (a = !1));
            } else
              ((a = Ji()),
                e !== null &&
                  e.memoizedState !== null &&
                  (e.memoizedState.hydrationErrors = a),
                (a = !0));
            if (!a) return t.flags & 256 ? (fo(t), t) : (fo(t), null);
          }
          return (
            fo(t),
            t.flags & 128
              ? ((t.lanes = n), t)
              : ((n = r !== null),
                (e = e !== null && e.memoizedState !== null),
                n &&
                  ((r = t.child),
                  (a = null),
                  r.alternate !== null &&
                    r.alternate.memoizedState !== null &&
                    r.alternate.memoizedState.cachePool !== null &&
                    (a = r.alternate.memoizedState.cachePool.pool),
                  (o = null),
                  r.memoizedState !== null &&
                    r.memoizedState.cachePool !== null &&
                    (o = r.memoizedState.cachePool.pool),
                  o !== a && (r.flags |= 2048)),
                n !== e && n && (t.child.flags |= 8192),
                zc(t, t.updateQueue),
                Vc(t),
                null)
          );
        case 4:
          return (
            ge(),
            e === null && Td(t.stateNode.containerInfo),
            Vc(t),
            null
          );
        case 10:
          return (ea(t.type), Vc(t), null);
        case 19:
          if ((A(po), (r = t.memoizedState), r === null)) return (Vc(t), null);
          if (((a = !!(t.flags & 128)), (o = r.rendering), o === null))
            if (a) Bc(r, !1);
            else {
              if (Yl !== 0 || (e !== null && e.flags & 128))
                for (e = t.child; e !== null;) {
                  if (((o = mo(e)), o !== null)) {
                    for (
                      t.flags |= 128,
                        Bc(r, !1),
                        e = o.updateQueue,
                        t.updateQueue = e,
                        zc(t, e),
                        t.subtreeFlags = 0,
                        e = n,
                        n = t.child;
                      n !== null;
                    )
                      (gi(n, e), (n = n.sibling));
                    return (
                      j(po, (po.current & 1) | 2),
                      P && Ni(t, r.treeForkCount),
                      t.child
                    );
                  }
                  e = e.sibling;
                }
              r.tail !== null &&
                je() > au &&
                ((t.flags |= 128), (a = !0), Bc(r, !1), (t.lanes = 4194304));
            }
          else {
            if (!a)
              if (((e = mo(o)), e !== null)) {
                if (
                  ((t.flags |= 128),
                  (a = !0),
                  (e = e.updateQueue),
                  (t.updateQueue = e),
                  zc(t, e),
                  Bc(r, !0),
                  r.tail === null &&
                    r.tailMode === `hidden` &&
                    !o.alternate &&
                    !P)
                )
                  return (Vc(t), null);
              } else
                2 * je() - r.renderingStartTime > au &&
                  n !== 536870912 &&
                  ((t.flags |= 128), (a = !0), Bc(r, !1), (t.lanes = 4194304));
            r.isBackwards
              ? ((o.sibling = t.child), (t.child = o))
              : ((e = r.last),
                e === null ? (t.child = o) : (e.sibling = o),
                (r.last = o));
          }
          return r.tail === null
            ? (Vc(t), null)
            : ((e = r.tail),
              (r.rendering = e),
              (r.tail = e.sibling),
              (r.renderingStartTime = je()),
              (e.sibling = null),
              (n = po.current),
              j(po, a ? (n & 1) | 2 : n & 1),
              P && Ni(t, r.treeForkCount),
              e);
        case 22:
        case 23:
          return (
            fo(t),
            io(),
            (r = t.memoizedState !== null),
            e === null
              ? r && (t.flags |= 8192)
              : (e.memoizedState !== null) !== r && (t.flags |= 8192),
            r
              ? n & 536870912 &&
                !(t.flags & 128) &&
                (Vc(t), t.subtreeFlags & 6 && (t.flags |= 8192))
              : Vc(t),
            (n = t.updateQueue),
            n !== null && zc(t, n.retryQueue),
            (n = null),
            e !== null &&
              e.memoizedState !== null &&
              e.memoizedState.cachePool !== null &&
              (n = e.memoizedState.cachePool.pool),
            (r = null),
            t.memoizedState !== null &&
              t.memoizedState.cachePool !== null &&
              (r = t.memoizedState.cachePool.pool),
            r !== n && (t.flags |= 2048),
            e !== null && A(xa),
            null
          );
        case 24:
          return (
            (n = null),
            e !== null && (n = e.memoizedState.cache),
            t.memoizedState.cache !== n && (t.flags |= 2048),
            ea(da),
            Vc(t),
            null
          );
        case 25:
          return null;
        case 30:
          return null;
      }
      throw Error(i(156, t.tag));
    }
    function Uc(e, t) {
      switch ((Ii(t), t.tag)) {
        case 1:
          return (
            (e = t.flags),
            e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 3:
          return (
            ea(da),
            ge(),
            (e = t.flags),
            e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 26:
        case 27:
        case 5:
          return (ve(t), null);
        case 31:
          if (t.memoizedState !== null) {
            if ((fo(t), t.alternate === null)) throw Error(i(340));
            qi();
          }
          return (
            (e = t.flags),
            e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 13:
          if (
            (fo(t), (e = t.memoizedState), e !== null && e.dehydrated !== null)
          ) {
            if (t.alternate === null) throw Error(i(340));
            qi();
          }
          return (
            (e = t.flags),
            e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 19:
          return (A(po), null);
        case 4:
          return (ge(), null);
        case 10:
          return (ea(t.type), null);
        case 22:
        case 23:
          return (
            fo(t),
            io(),
            e !== null && A(xa),
            (e = t.flags),
            e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 24:
          return (ea(da), null);
        case 25:
          return null;
        default:
          return null;
      }
    }
    function Wc(e, t) {
      switch ((Ii(t), t.tag)) {
        case 3:
          (ea(da), ge());
          break;
        case 26:
        case 27:
        case 5:
          ve(t);
          break;
        case 4:
          ge();
          break;
        case 31:
          t.memoizedState !== null && fo(t);
          break;
        case 13:
          fo(t);
          break;
        case 19:
          A(po);
          break;
        case 10:
          ea(t.type);
          break;
        case 22:
        case 23:
          (fo(t), io(), e !== null && A(xa));
          break;
        case 24:
          ea(da);
      }
    }
    function Gc(e, t) {
      try {
        var n = t.updateQueue,
          r = n === null ? null : n.lastEffect;
        if (r !== null) {
          var i = r.next;
          n = i;
          do {
            if ((n.tag & e) === e) {
              r = void 0;
              var a = n.create,
                o = n.inst;
              ((r = a()), (o.destroy = r));
            }
            n = n.next;
          } while (n !== i);
        }
      } catch (e) {
        q(t, t.return, e);
      }
    }
    function Kc(e, t, n) {
      try {
        var r = t.updateQueue,
          i = r === null ? null : r.lastEffect;
        if (i !== null) {
          var a = i.next;
          r = a;
          do {
            if ((r.tag & e) === e) {
              var o = r.inst,
                s = o.destroy;
              if (s !== void 0) {
                ((o.destroy = void 0), (i = t));
                var c = n,
                  l = s;
                try {
                  l();
                } catch (e) {
                  q(i, c, e);
                }
              }
            }
            r = r.next;
          } while (r !== a);
        }
      } catch (e) {
        q(t, t.return, e);
      }
    }
    function qc(e) {
      var t = e.updateQueue;
      if (t !== null) {
        var n = e.stateNode;
        try {
          $a(t, n);
        } catch (t) {
          q(e, e.return, t);
        }
      }
    }
    function Jc(e, t, n) {
      ((n.props = Ys(e.type, e.memoizedProps)), (n.state = e.memoizedState));
      try {
        n.componentWillUnmount();
      } catch (n) {
        q(e, t, n);
      }
    }
    function Yc(e, t) {
      try {
        var n = e.ref;
        if (n !== null) {
          switch (e.tag) {
            case 26:
            case 27:
            case 5:
              var r = e.stateNode;
              break;
            case 30:
              r = e.stateNode;
              break;
            default:
              r = e.stateNode;
          }
          typeof n == `function` ? (e.refCleanup = n(r)) : (n.current = r);
        }
      } catch (n) {
        q(e, t, n);
      }
    }
    function Xc(e, t) {
      var n = e.ref,
        r = e.refCleanup;
      if (n !== null)
        if (typeof r == `function`)
          try {
            r();
          } catch (n) {
            q(e, t, n);
          } finally {
            ((e.refCleanup = null),
              (e = e.alternate),
              e != null && (e.refCleanup = null));
          }
        else if (typeof n == `function`)
          try {
            n(null);
          } catch (n) {
            q(e, t, n);
          }
        else n.current = null;
    }
    function Zc(e) {
      var t = e.type,
        n = e.memoizedProps,
        r = e.stateNode;
      try {
        a: switch (t) {
          case `button`:
          case `input`:
          case `select`:
          case `textarea`:
            n.autoFocus && r.focus();
            break a;
          case `img`:
            n.src ? (r.src = n.src) : n.srcSet && (r.srcset = n.srcSet);
        }
      } catch (t) {
        q(e, e.return, t);
      }
    }
    function Qc(e, t, n) {
      try {
        var r = e.stateNode;
        (Rd(r, e.type, n, t), (r[pt] = t));
      } catch (t) {
        q(e, e.return, t);
      }
    }
    function $c(e) {
      return (
        e.tag === 5 ||
        e.tag === 3 ||
        e.tag === 26 ||
        (e.tag === 27 && ef(e.type)) ||
        e.tag === 4
      );
    }
    function el(e) {
      a: for (;;) {
        for (; e.sibling === null;) {
          if (e.return === null || $c(e.return)) return null;
          e = e.return;
        }
        for (
          e.sibling.return = e.return, e = e.sibling;
          e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
        ) {
          if (
            (e.tag === 27 && ef(e.type)) ||
            e.flags & 2 ||
            e.child === null ||
            e.tag === 4
          )
            continue a;
          ((e.child.return = e), (e = e.child));
        }
        if (!(e.flags & 2)) return e.stateNode;
      }
    }
    function tl(e, t, n) {
      var r = e.tag;
      if (r === 5 || r === 6)
        ((e = e.stateNode),
          t
            ? (n.nodeType === 9
                ? n.body
                : n.nodeName === `HTML`
                  ? n.ownerDocument.body
                  : n
              ).insertBefore(e, t)
            : ((t =
                n.nodeType === 9
                  ? n.body
                  : n.nodeName === `HTML`
                    ? n.ownerDocument.body
                    : n),
              t.appendChild(e),
              (n = n._reactRootContainer),
              n != null || t.onclick !== null || (t.onclick = on)));
      else if (
        r !== 4 &&
        (r === 27 && ef(e.type) && ((n = e.stateNode), (t = null)),
        (e = e.child),
        e !== null)
      )
        for (tl(e, t, n), e = e.sibling; e !== null;)
          (tl(e, t, n), (e = e.sibling));
    }
    function nl(e, t, n) {
      var r = e.tag;
      if (r === 5 || r === 6)
        ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
      else if (
        r !== 4 &&
        (r === 27 && ef(e.type) && (n = e.stateNode), (e = e.child), e !== null)
      )
        for (nl(e, t, n), e = e.sibling; e !== null;)
          (nl(e, t, n), (e = e.sibling));
    }
    function rl(e) {
      var t = e.stateNode,
        n = e.memoizedProps;
      try {
        for (var r = e.type, i = t.attributes; i.length;)
          t.removeAttributeNode(i[0]);
        (Ld(t, r, n), (t[ft] = e), (t[pt] = n));
      } catch (t) {
        q(e, e.return, t);
      }
    }
    var il = !1,
      al = !1,
      ol = !1,
      sl = typeof WeakSet == `function` ? WeakSet : Set,
      cl = null;
    function ll(e, t) {
      if (((e = e.containerInfo), (Vd = up), (e = Mr(e)), Nr(e))) {
        if (`selectionStart` in e)
          var n = { start: e.selectionStart, end: e.selectionEnd };
        else
          a: {
            n = ((n = e.ownerDocument) && n.defaultView) || window;
            var r = n.getSelection && n.getSelection();
            if (r && r.rangeCount !== 0) {
              n = r.anchorNode;
              var a = r.anchorOffset,
                o = r.focusNode;
              r = r.focusOffset;
              try {
                (n.nodeType, o.nodeType);
              } catch {
                n = null;
                break a;
              }
              var s = 0,
                c = -1,
                l = -1,
                u = 0,
                d = 0,
                f = e,
                p = null;
              b: for (;;) {
                for (
                  var m;
                  f !== n || (a !== 0 && f.nodeType !== 3) || (c = s + a),
                    f !== o || (r !== 0 && f.nodeType !== 3) || (l = s + r),
                    f.nodeType === 3 && (s += f.nodeValue.length),
                    (m = f.firstChild) !== null;
                )
                  ((p = f), (f = m));
                for (;;) {
                  if (f === e) break b;
                  if (
                    (p === n && ++u === a && (c = s),
                    p === o && ++d === r && (l = s),
                    (m = f.nextSibling) !== null)
                  )
                    break;
                  ((f = p), (p = f.parentNode));
                }
                f = m;
              }
              n = c === -1 || l === -1 ? null : { start: c, end: l };
            } else n = null;
          }
        n ||= { start: 0, end: 0 };
      } else n = null;
      for (
        Hd = { focusedElem: e, selectionRange: n }, up = !1, cl = t;
        cl !== null;
      )
        if (((t = cl), (e = t.child), t.subtreeFlags & 1028 && e !== null))
          ((e.return = t), (cl = e));
        else
          for (; cl !== null;) {
            switch (((t = cl), (o = t.alternate), (e = t.flags), t.tag)) {
              case 0:
                if (
                  e & 4 &&
                  ((e = t.updateQueue),
                  (e = e === null ? null : e.events),
                  e !== null)
                )
                  for (n = 0; n < e.length; n++)
                    ((a = e[n]), (a.ref.impl = a.nextImpl));
                break;
              case 11:
              case 15:
                break;
              case 1:
                if (e & 1024 && o !== null) {
                  ((e = void 0),
                    (n = t),
                    (a = o.memoizedProps),
                    (o = o.memoizedState),
                    (r = n.stateNode));
                  try {
                    var h = Ys(n.type, a);
                    ((e = r.getSnapshotBeforeUpdate(h, o)),
                      (r.__reactInternalSnapshotBeforeUpdate = e));
                  } catch (e) {
                    q(n, n.return, e);
                  }
                }
                break;
              case 3:
                if (e & 1024) {
                  if (
                    ((e = t.stateNode.containerInfo), (n = e.nodeType), n === 9)
                  )
                    rf(e);
                  else if (n === 1)
                    switch (e.nodeName) {
                      case `HEAD`:
                      case `HTML`:
                      case `BODY`:
                        rf(e);
                        break;
                      default:
                        e.textContent = ``;
                    }
                }
                break;
              case 5:
              case 26:
              case 27:
              case 6:
              case 4:
              case 17:
                break;
              default:
                if (e & 1024) throw Error(i(163));
            }
            if (((e = t.sibling), e !== null)) {
              ((e.return = t.return), (cl = e));
              break;
            }
            cl = t.return;
          }
    }
    function ul(e, t, n) {
      var r = n.flags;
      switch (n.tag) {
        case 0:
        case 11:
        case 15:
          (Tl(e, n), r & 4 && Gc(5, n));
          break;
        case 1:
          if ((Tl(e, n), r & 4))
            if (((e = n.stateNode), t === null))
              try {
                e.componentDidMount();
              } catch (e) {
                q(n, n.return, e);
              }
            else {
              var i = Ys(n.type, t.memoizedProps);
              t = t.memoizedState;
              try {
                e.componentDidUpdate(
                  i,
                  t,
                  e.__reactInternalSnapshotBeforeUpdate,
                );
              } catch (e) {
                q(n, n.return, e);
              }
            }
          (r & 64 && qc(n), r & 512 && Yc(n, n.return));
          break;
        case 3:
          if ((Tl(e, n), r & 64 && ((e = n.updateQueue), e !== null))) {
            if (((t = null), n.child !== null))
              switch (n.child.tag) {
                case 27:
                case 5:
                  t = n.child.stateNode;
                  break;
                case 1:
                  t = n.child.stateNode;
              }
            try {
              $a(e, t);
            } catch (e) {
              q(n, n.return, e);
            }
          }
          break;
        case 27:
          t === null && r & 4 && rl(n);
        case 26:
        case 5:
          (Tl(e, n), t === null && r & 4 && Zc(n), r & 512 && Yc(n, n.return));
          break;
        case 12:
          Tl(e, n);
          break;
        case 31:
          (Tl(e, n), r & 4 && gl(e, n));
          break;
        case 13:
          (Tl(e, n),
            r & 4 && _l(e, n),
            r & 64 &&
              ((e = n.memoizedState),
              e !== null &&
                ((e = e.dehydrated),
                e !== null && ((n = J.bind(null, n)), uf(e, n)))));
          break;
        case 22:
          if (((r = n.memoizedState !== null || il), !r)) {
            ((t = (t !== null && t.memoizedState !== null) || al), (i = il));
            var a = al;
            ((il = r),
              (al = t) && !a ? Dl(e, n, !!(n.subtreeFlags & 8772)) : Tl(e, n),
              (il = i),
              (al = a));
          }
          break;
        case 30:
          break;
        default:
          Tl(e, n);
      }
    }
    function dl(e) {
      var t = e.alternate;
      (t !== null && ((e.alternate = null), dl(t)),
        (e.child = null),
        (e.deletions = null),
        (e.sibling = null),
        e.tag === 5 && ((t = e.stateNode), t !== null && bt(t)),
        (e.stateNode = null),
        (e.return = null),
        (e.dependencies = null),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.pendingProps = null),
        (e.stateNode = null),
        (e.updateQueue = null));
    }
    var fl = null,
      pl = !1;
    function ml(e, t, n) {
      for (n = n.child; n !== null;) (hl(e, t, n), (n = n.sibling));
    }
    function hl(e, t, n) {
      if (Ve && typeof Ve.onCommitFiberUnmount == `function`)
        try {
          Ve.onCommitFiberUnmount(Be, n);
        } catch {}
      switch (n.tag) {
        case 26:
          (al || Xc(n, t),
            ml(e, t, n),
            n.memoizedState
              ? n.memoizedState.count--
              : n.stateNode &&
                ((n = n.stateNode), n.parentNode.removeChild(n)));
          break;
        case 27:
          al || Xc(n, t);
          var r = fl,
            i = pl;
          (ef(n.type) && ((fl = n.stateNode), (pl = !1)),
            ml(e, t, n),
            gf(n.stateNode),
            (fl = r),
            (pl = i));
          break;
        case 5:
          al || Xc(n, t);
        case 6:
          if (
            ((r = fl),
            (i = pl),
            (fl = null),
            ml(e, t, n),
            (fl = r),
            (pl = i),
            fl !== null)
          )
            if (pl)
              try {
                (fl.nodeType === 9
                  ? fl.body
                  : fl.nodeName === `HTML`
                    ? fl.ownerDocument.body
                    : fl
                ).removeChild(n.stateNode);
              } catch (e) {
                q(n, t, e);
              }
            else
              try {
                fl.removeChild(n.stateNode);
              } catch (e) {
                q(n, t, e);
              }
          break;
        case 18:
          fl !== null &&
            (pl
              ? ((e = fl),
                tf(
                  e.nodeType === 9
                    ? e.body
                    : e.nodeName === `HTML`
                      ? e.ownerDocument.body
                      : e,
                  n.stateNode,
                ),
                Ip(e))
              : tf(fl, n.stateNode));
          break;
        case 4:
          ((r = fl),
            (i = pl),
            (fl = n.stateNode.containerInfo),
            (pl = !0),
            ml(e, t, n),
            (fl = r),
            (pl = i));
          break;
        case 0:
        case 11:
        case 14:
        case 15:
          (Kc(2, n, t), al || Kc(4, n, t), ml(e, t, n));
          break;
        case 1:
          (al ||
            (Xc(n, t),
            (r = n.stateNode),
            typeof r.componentWillUnmount == `function` && Jc(n, t, r)),
            ml(e, t, n));
          break;
        case 21:
          ml(e, t, n);
          break;
        case 22:
          ((al = (r = al) || n.memoizedState !== null), ml(e, t, n), (al = r));
          break;
        default:
          ml(e, t, n);
      }
    }
    function gl(e, t) {
      if (
        t.memoizedState === null &&
        ((e = t.alternate), e !== null && ((e = e.memoizedState), e !== null))
      ) {
        e = e.dehydrated;
        try {
          Ip(e);
        } catch (e) {
          q(t, t.return, e);
        }
      }
    }
    function _l(e, t) {
      if (
        t.memoizedState === null &&
        ((e = t.alternate),
        e !== null &&
          ((e = e.memoizedState),
          e !== null && ((e = e.dehydrated), e !== null)))
      )
        try {
          Ip(e);
        } catch (e) {
          q(t, t.return, e);
        }
    }
    function vl(e) {
      switch (e.tag) {
        case 31:
        case 13:
        case 19:
          var t = e.stateNode;
          return (t === null && (t = e.stateNode = new sl()), t);
        case 22:
          return (
            (e = e.stateNode),
            (t = e._retryCache),
            t === null && (t = e._retryCache = new sl()),
            t
          );
        default:
          throw Error(i(435, e.tag));
      }
    }
    function yl(e, t) {
      var n = vl(e);
      t.forEach(function (t) {
        if (!n.has(t)) {
          n.add(t);
          var r = Qu.bind(null, e, t);
          t.then(r, r);
        }
      });
    }
    function bl(e, t) {
      var n = t.deletions;
      if (n !== null)
        for (var r = 0; r < n.length; r++) {
          var a = n[r],
            o = e,
            s = t,
            c = s;
          a: for (; c !== null;) {
            switch (c.tag) {
              case 27:
                if (ef(c.type)) {
                  ((fl = c.stateNode), (pl = !1));
                  break a;
                }
                break;
              case 5:
                ((fl = c.stateNode), (pl = !1));
                break a;
              case 3:
              case 4:
                ((fl = c.stateNode.containerInfo), (pl = !0));
                break a;
            }
            c = c.return;
          }
          if (fl === null) throw Error(i(160));
          (hl(o, s, a),
            (fl = null),
            (pl = !1),
            (o = a.alternate),
            o !== null && (o.return = null),
            (a.return = null));
        }
      if (t.subtreeFlags & 13886)
        for (t = t.child; t !== null;) (Sl(t, e), (t = t.sibling));
    }
    var xl = null;
    function Sl(e, t) {
      var n = e.alternate,
        r = e.flags;
      switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          (bl(t, e),
            Cl(e),
            r & 4 && (Kc(3, e, e.return), Gc(3, e), Kc(5, e, e.return)));
          break;
        case 1:
          (bl(t, e),
            Cl(e),
            r & 512 && (al || n === null || Xc(n, n.return)),
            r & 64 &&
              il &&
              ((e = e.updateQueue),
              e !== null &&
                ((r = e.callbacks),
                r !== null &&
                  ((n = e.shared.hiddenCallbacks),
                  (e.shared.hiddenCallbacks = n === null ? r : n.concat(r))))));
          break;
        case 26:
          var a = xl;
          if (
            (bl(t, e),
            Cl(e),
            r & 512 && (al || n === null || Xc(n, n.return)),
            r & 4)
          ) {
            var o = n === null ? null : n.memoizedState;
            if (((r = e.memoizedState), n === null))
              if (r === null)
                if (e.stateNode === null) {
                  a: {
                    ((r = e.type),
                      (n = e.memoizedProps),
                      (a = a.ownerDocument || a));
                    b: switch (r) {
                      case `title`:
                        ((o = a.getElementsByTagName(`title`)[0]),
                          (!o ||
                            o[yt] ||
                            o[ft] ||
                            o.namespaceURI === `http://www.w3.org/2000/svg` ||
                            o.hasAttribute(`itemprop`)) &&
                            ((o = a.createElement(r)),
                            a.head.insertBefore(
                              o,
                              a.querySelector(`head > title`),
                            )),
                          Ld(o, r, n),
                          (o[ft] = e),
                          Tt(o),
                          (r = o));
                        break a;
                      case `link`:
                        var s = Wf(`link`, `href`, a).get(r + (n.href || ``));
                        if (s) {
                          for (var c = 0; c < s.length; c++)
                            if (
                              ((o = s[c]),
                              o.getAttribute(`href`) ===
                                (n.href == null || n.href === ``
                                  ? null
                                  : n.href) &&
                                o.getAttribute(`rel`) ===
                                  (n.rel == null ? null : n.rel) &&
                                o.getAttribute(`title`) ===
                                  (n.title == null ? null : n.title) &&
                                o.getAttribute(`crossorigin`) ===
                                  (n.crossOrigin == null
                                    ? null
                                    : n.crossOrigin))
                            ) {
                              s.splice(c, 1);
                              break b;
                            }
                        }
                        ((o = a.createElement(r)),
                          Ld(o, r, n),
                          a.head.appendChild(o));
                        break;
                      case `meta`:
                        if (
                          (s = Wf(`meta`, `content`, a).get(
                            r + (n.content || ``),
                          ))
                        ) {
                          for (c = 0; c < s.length; c++)
                            if (
                              ((o = s[c]),
                              o.getAttribute(`content`) ===
                                (n.content == null ? null : `` + n.content) &&
                                o.getAttribute(`name`) ===
                                  (n.name == null ? null : n.name) &&
                                o.getAttribute(`property`) ===
                                  (n.property == null ? null : n.property) &&
                                o.getAttribute(`http-equiv`) ===
                                  (n.httpEquiv == null ? null : n.httpEquiv) &&
                                o.getAttribute(`charset`) ===
                                  (n.charSet == null ? null : n.charSet))
                            ) {
                              s.splice(c, 1);
                              break b;
                            }
                        }
                        ((o = a.createElement(r)),
                          Ld(o, r, n),
                          a.head.appendChild(o));
                        break;
                      default:
                        throw Error(i(468, r));
                    }
                    ((o[ft] = e), Tt(o), (r = o));
                  }
                  e.stateNode = r;
                } else Gf(a, e.type, e.stateNode);
              else e.stateNode = zf(a, r, e.memoizedProps);
            else
              o === r
                ? r === null &&
                  e.stateNode !== null &&
                  Qc(e, e.memoizedProps, n.memoizedProps)
                : (o === null
                    ? n.stateNode !== null &&
                      ((n = n.stateNode), n.parentNode.removeChild(n))
                    : o.count--,
                  r === null
                    ? Gf(a, e.type, e.stateNode)
                    : zf(a, r, e.memoizedProps));
          }
          break;
        case 27:
          (bl(t, e),
            Cl(e),
            r & 512 && (al || n === null || Xc(n, n.return)),
            n !== null && r & 4 && Qc(e, e.memoizedProps, n.memoizedProps));
          break;
        case 5:
          if (
            (bl(t, e),
            Cl(e),
            r & 512 && (al || n === null || Xc(n, n.return)),
            e.flags & 32)
          ) {
            a = e.stateNode;
            try {
              Zt(a, ``);
            } catch (t) {
              q(e, e.return, t);
            }
          }
          (r & 4 &&
            e.stateNode != null &&
            ((a = e.memoizedProps), Qc(e, a, n === null ? a : n.memoizedProps)),
            r & 1024 && (ol = !0));
          break;
        case 6:
          if ((bl(t, e), Cl(e), r & 4)) {
            if (e.stateNode === null) throw Error(i(162));
            ((r = e.memoizedProps), (n = e.stateNode));
            try {
              n.nodeValue = r;
            } catch (t) {
              q(e, e.return, t);
            }
          }
          break;
        case 3:
          if (
            ((Uf = null),
            (a = xl),
            (xl = yf(t.containerInfo)),
            bl(t, e),
            (xl = a),
            Cl(e),
            r & 4 && n !== null && n.memoizedState.isDehydrated)
          )
            try {
              Ip(t.containerInfo);
            } catch (t) {
              q(e, e.return, t);
            }
          ol && ((ol = !1), wl(e));
          break;
        case 4:
          ((r = xl),
            (xl = yf(e.stateNode.containerInfo)),
            bl(t, e),
            Cl(e),
            (xl = r));
          break;
        case 12:
          (bl(t, e), Cl(e));
          break;
        case 31:
          (bl(t, e),
            Cl(e),
            r & 4 &&
              ((r = e.updateQueue),
              r !== null && ((e.updateQueue = null), yl(e, r))));
          break;
        case 13:
          (bl(t, e),
            Cl(e),
            e.child.flags & 8192 &&
              (e.memoizedState !== null) !=
                (n !== null && n.memoizedState !== null) &&
              (ru = je()),
            r & 4 &&
              ((r = e.updateQueue),
              r !== null && ((e.updateQueue = null), yl(e, r))));
          break;
        case 22:
          a = e.memoizedState !== null;
          var l = n !== null && n.memoizedState !== null,
            u = il,
            d = al;
          if (
            ((il = u || a),
            (al = d || l),
            bl(t, e),
            (al = d),
            (il = u),
            Cl(e),
            r & 8192)
          )
            a: for (
              t = e.stateNode,
                t._visibility = a ? t._visibility & -2 : t._visibility | 1,
                a && (n === null || l || il || al || El(e)),
                n = null,
                t = e;
              ;
            ) {
              if (t.tag === 5 || t.tag === 26) {
                if (n === null) {
                  l = n = t;
                  try {
                    if (((o = l.stateNode), a))
                      ((s = o.style),
                        typeof s.setProperty == `function`
                          ? s.setProperty(`display`, `none`, `important`)
                          : (s.display = `none`));
                    else {
                      c = l.stateNode;
                      var f = l.memoizedProps.style,
                        p =
                          f != null && f.hasOwnProperty(`display`)
                            ? f.display
                            : null;
                      c.style.display =
                        p == null || typeof p == `boolean`
                          ? ``
                          : (`` + p).trim();
                    }
                  } catch (e) {
                    q(l, l.return, e);
                  }
                }
              } else if (t.tag === 6) {
                if (n === null) {
                  l = t;
                  try {
                    l.stateNode.nodeValue = a ? `` : l.memoizedProps;
                  } catch (e) {
                    q(l, l.return, e);
                  }
                }
              } else if (t.tag === 18) {
                if (n === null) {
                  l = t;
                  try {
                    var m = l.stateNode;
                    a ? nf(m, !0) : nf(l.stateNode, !1);
                  } catch (e) {
                    q(l, l.return, e);
                  }
                }
              } else if (
                ((t.tag !== 22 && t.tag !== 23) ||
                  t.memoizedState === null ||
                  t === e) &&
                t.child !== null
              ) {
                ((t.child.return = t), (t = t.child));
                continue;
              }
              if (t === e) break a;
              for (; t.sibling === null;) {
                if (t.return === null || t.return === e) break a;
                (n === t && (n = null), (t = t.return));
              }
              (n === t && (n = null),
                (t.sibling.return = t.return),
                (t = t.sibling));
            }
          r & 4 &&
            ((r = e.updateQueue),
            r !== null &&
              ((n = r.retryQueue),
              n !== null && ((r.retryQueue = null), yl(e, n))));
          break;
        case 19:
          (bl(t, e),
            Cl(e),
            r & 4 &&
              ((r = e.updateQueue),
              r !== null && ((e.updateQueue = null), yl(e, r))));
          break;
        case 30:
          break;
        case 21:
          break;
        default:
          (bl(t, e), Cl(e));
      }
    }
    function Cl(e) {
      var t = e.flags;
      if (t & 2) {
        try {
          for (var n, r = e.return; r !== null;) {
            if ($c(r)) {
              n = r;
              break;
            }
            r = r.return;
          }
          if (n == null) throw Error(i(160));
          switch (n.tag) {
            case 27:
              var a = n.stateNode;
              nl(e, el(e), a);
              break;
            case 5:
              var o = n.stateNode;
              (n.flags & 32 && (Zt(o, ``), (n.flags &= -33)), nl(e, el(e), o));
              break;
            case 3:
            case 4:
              var s = n.stateNode.containerInfo;
              tl(e, el(e), s);
              break;
            default:
              throw Error(i(161));
          }
        } catch (t) {
          q(e, e.return, t);
        }
        e.flags &= -3;
      }
      t & 4096 && (e.flags &= -4097);
    }
    function wl(e) {
      if (e.subtreeFlags & 1024)
        for (e = e.child; e !== null;) {
          var t = e;
          (wl(t),
            t.tag === 5 && t.flags & 1024 && t.stateNode.reset(),
            (e = e.sibling));
        }
    }
    function Tl(e, t) {
      if (t.subtreeFlags & 8772)
        for (t = t.child; t !== null;) (ul(e, t.alternate, t), (t = t.sibling));
    }
    function El(e) {
      for (e = e.child; e !== null;) {
        var t = e;
        switch (t.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            (Kc(4, t, t.return), El(t));
            break;
          case 1:
            Xc(t, t.return);
            var n = t.stateNode;
            (typeof n.componentWillUnmount == `function` && Jc(t, t.return, n),
              El(t));
            break;
          case 27:
            gf(t.stateNode);
          case 26:
          case 5:
            (Xc(t, t.return), El(t));
            break;
          case 22:
            t.memoizedState === null && El(t);
            break;
          case 30:
            El(t);
            break;
          default:
            El(t);
        }
        e = e.sibling;
      }
    }
    function Dl(e, t, n) {
      for (n &&= !!(t.subtreeFlags & 8772), t = t.child; t !== null;) {
        var r = t.alternate,
          i = e,
          a = t,
          o = a.flags;
        switch (a.tag) {
          case 0:
          case 11:
          case 15:
            (Dl(i, a, n), Gc(4, a));
            break;
          case 1:
            if (
              (Dl(i, a, n),
              (r = a),
              (i = r.stateNode),
              typeof i.componentDidMount == `function`)
            )
              try {
                i.componentDidMount();
              } catch (e) {
                q(r, r.return, e);
              }
            if (((r = a), (i = r.updateQueue), i !== null)) {
              var s = r.stateNode;
              try {
                var c = i.shared.hiddenCallbacks;
                if (c !== null)
                  for (
                    i.shared.hiddenCallbacks = null, i = 0;
                    i < c.length;
                    i++
                  )
                    Qa(c[i], s);
              } catch (e) {
                q(r, r.return, e);
              }
            }
            (n && o & 64 && qc(a), Yc(a, a.return));
            break;
          case 27:
            rl(a);
          case 26:
          case 5:
            (Dl(i, a, n), n && r === null && o & 4 && Zc(a), Yc(a, a.return));
            break;
          case 12:
            Dl(i, a, n);
            break;
          case 31:
            (Dl(i, a, n), n && o & 4 && gl(i, a));
            break;
          case 13:
            (Dl(i, a, n), n && o & 4 && _l(i, a));
            break;
          case 22:
            (a.memoizedState === null && Dl(i, a, n), Yc(a, a.return));
            break;
          case 30:
            break;
          default:
            Dl(i, a, n);
        }
        t = t.sibling;
      }
    }
    function Ol(e, t) {
      var n = null;
      (e !== null &&
        e.memoizedState !== null &&
        e.memoizedState.cachePool !== null &&
        (n = e.memoizedState.cachePool.pool),
        (e = null),
        t.memoizedState !== null &&
          t.memoizedState.cachePool !== null &&
          (e = t.memoizedState.cachePool.pool),
        e !== n && (e != null && e.refCount++, n != null && pa(n)));
    }
    function kl(e, t) {
      ((e = null),
        t.alternate !== null && (e = t.alternate.memoizedState.cache),
        (t = t.memoizedState.cache),
        t !== e && (t.refCount++, e != null && pa(e)));
    }
    function Al(e, t, n, r) {
      if (t.subtreeFlags & 10256)
        for (t = t.child; t !== null;) (jl(e, t, n, r), (t = t.sibling));
    }
    function jl(e, t, n, r) {
      var i = t.flags;
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          (Al(e, t, n, r), i & 2048 && Gc(9, t));
          break;
        case 1:
          Al(e, t, n, r);
          break;
        case 3:
          (Al(e, t, n, r),
            i & 2048 &&
              ((e = null),
              t.alternate !== null && (e = t.alternate.memoizedState.cache),
              (t = t.memoizedState.cache),
              t !== e && (t.refCount++, e != null && pa(e))));
          break;
        case 12:
          if (i & 2048) {
            (Al(e, t, n, r), (e = t.stateNode));
            try {
              var a = t.memoizedProps,
                o = a.id,
                s = a.onPostCommit;
              typeof s == `function` &&
                s(
                  o,
                  t.alternate === null ? `mount` : `update`,
                  e.passiveEffectDuration,
                  -0,
                );
            } catch (e) {
              q(t, t.return, e);
            }
          } else Al(e, t, n, r);
          break;
        case 31:
          Al(e, t, n, r);
          break;
        case 13:
          Al(e, t, n, r);
          break;
        case 23:
          break;
        case 22:
          ((a = t.stateNode),
            (o = t.alternate),
            t.memoizedState === null
              ? a._visibility & 2
                ? Al(e, t, n, r)
                : ((a._visibility |= 2),
                  Ml(e, t, n, r, !!(t.subtreeFlags & 10256) || !1))
              : a._visibility & 2
                ? Al(e, t, n, r)
                : Nl(e, t),
            i & 2048 && Ol(o, t));
          break;
        case 24:
          (Al(e, t, n, r), i & 2048 && kl(t.alternate, t));
          break;
        default:
          Al(e, t, n, r);
      }
    }
    function Ml(e, t, n, r, i) {
      for (i &&= !!(t.subtreeFlags & 10256) || !1, t = t.child; t !== null;) {
        var a = e,
          o = t,
          s = n,
          c = r,
          l = o.flags;
        switch (o.tag) {
          case 0:
          case 11:
          case 15:
            (Ml(a, o, s, c, i), Gc(8, o));
            break;
          case 23:
            break;
          case 22:
            var u = o.stateNode;
            (o.memoizedState === null
              ? ((u._visibility |= 2), Ml(a, o, s, c, i))
              : u._visibility & 2
                ? Ml(a, o, s, c, i)
                : Nl(a, o),
              i && l & 2048 && Ol(o.alternate, o));
            break;
          case 24:
            (Ml(a, o, s, c, i), i && l & 2048 && kl(o.alternate, o));
            break;
          default:
            Ml(a, o, s, c, i);
        }
        t = t.sibling;
      }
    }
    function Nl(e, t) {
      if (t.subtreeFlags & 10256)
        for (t = t.child; t !== null;) {
          var n = e,
            r = t,
            i = r.flags;
          switch (r.tag) {
            case 22:
              (Nl(n, r), i & 2048 && Ol(r.alternate, r));
              break;
            case 24:
              (Nl(n, r), i & 2048 && kl(r.alternate, r));
              break;
            default:
              Nl(n, r);
          }
          t = t.sibling;
        }
    }
    var Pl = 8192;
    function Fl(e, t, n) {
      if (e.subtreeFlags & Pl)
        for (e = e.child; e !== null;) (Il(e, t, n), (e = e.sibling));
    }
    function Il(e, t, n) {
      switch (e.tag) {
        case 26:
          (Fl(e, t, n),
            e.flags & Pl &&
              e.memoizedState !== null &&
              Jf(n, xl, e.memoizedState, e.memoizedProps));
          break;
        case 5:
          Fl(e, t, n);
          break;
        case 3:
        case 4:
          var r = xl;
          ((xl = yf(e.stateNode.containerInfo)), Fl(e, t, n), (xl = r));
          break;
        case 22:
          e.memoizedState === null &&
            ((r = e.alternate),
            r !== null && r.memoizedState !== null
              ? ((r = Pl), (Pl = 16777216), Fl(e, t, n), (Pl = r))
              : Fl(e, t, n));
          break;
        default:
          Fl(e, t, n);
      }
    }
    function Ll(e) {
      var t = e.alternate;
      if (t !== null && ((e = t.child), e !== null)) {
        t.child = null;
        do ((t = e.sibling), (e.sibling = null), (e = t));
        while (e !== null);
      }
    }
    function Rl(e) {
      var t = e.deletions;
      if (e.flags & 16) {
        if (t !== null)
          for (var n = 0; n < t.length; n++) {
            var r = t[n];
            ((cl = r), Vl(r, e));
          }
        Ll(e);
      }
      if (e.subtreeFlags & 10256)
        for (e = e.child; e !== null;) (zl(e), (e = e.sibling));
    }
    function zl(e) {
      switch (e.tag) {
        case 0:
        case 11:
        case 15:
          (Rl(e), e.flags & 2048 && Kc(9, e, e.return));
          break;
        case 3:
          Rl(e);
          break;
        case 12:
          Rl(e);
          break;
        case 22:
          var t = e.stateNode;
          e.memoizedState !== null &&
          t._visibility & 2 &&
          (e.return === null || e.return.tag !== 13)
            ? ((t._visibility &= -3), Bl(e))
            : Rl(e);
          break;
        default:
          Rl(e);
      }
    }
    function Bl(e) {
      var t = e.deletions;
      if (e.flags & 16) {
        if (t !== null)
          for (var n = 0; n < t.length; n++) {
            var r = t[n];
            ((cl = r), Vl(r, e));
          }
        Ll(e);
      }
      for (e = e.child; e !== null;) {
        switch (((t = e), t.tag)) {
          case 0:
          case 11:
          case 15:
            (Kc(8, t, t.return), Bl(t));
            break;
          case 22:
            ((n = t.stateNode),
              n._visibility & 2 && ((n._visibility &= -3), Bl(t)));
            break;
          default:
            Bl(t);
        }
        e = e.sibling;
      }
    }
    function Vl(e, t) {
      for (; cl !== null;) {
        var n = cl;
        switch (n.tag) {
          case 0:
          case 11:
          case 15:
            Kc(8, n, t);
            break;
          case 23:
          case 22:
            if (
              n.memoizedState !== null &&
              n.memoizedState.cachePool !== null
            ) {
              var r = n.memoizedState.cachePool.pool;
              r != null && r.refCount++;
            }
            break;
          case 24:
            pa(n.memoizedState.cache);
        }
        if (((r = n.child), r !== null)) ((r.return = n), (cl = r));
        else
          a: for (n = e; cl !== null;) {
            r = cl;
            var i = r.sibling,
              a = r.return;
            if ((dl(r), r === n)) {
              cl = null;
              break a;
            }
            if (i !== null) {
              ((i.return = a), (cl = i));
              break a;
            }
            cl = a;
          }
      }
    }
    var Hl = {
        getCacheForType: function (e) {
          var t = oa(da),
            n = t.data.get(e);
          return (n === void 0 && ((n = e()), t.data.set(e, n)), n);
        },
        cacheSignal: function () {
          return oa(da).controller.signal;
        },
      },
      Ul = typeof WeakMap == `function` ? WeakMap : Map,
      V = 0,
      H = null,
      U = null,
      W = 0,
      G = 0,
      Wl = null,
      Gl = !1,
      Kl = !1,
      ql = !1,
      Jl = 0,
      Yl = 0,
      K = 0,
      Xl = 0,
      Zl = 0,
      Ql = 0,
      $l = 0,
      eu = null,
      tu = null,
      nu = !1,
      ru = 0,
      iu = 0,
      au = 1 / 0,
      ou = null,
      su = null,
      cu = 0,
      lu = null,
      uu = null,
      du = 0,
      fu = 0,
      pu = null,
      mu = null,
      hu = 0,
      gu = null;
    function _u() {
      return V & 2 && W !== 0 ? W & -W : D.T === null ? lt() : md();
    }
    function vu() {
      if (Ql === 0)
        if (!(W & 536870912) || P) {
          var e = Je;
          ((Je <<= 1), !(Je & 3932160) && (Je = 262144), (Ql = e));
        } else Ql = 536870912;
      return ((e = ao.current), e !== null && (e.flags |= 32), Ql);
    }
    function yu(e, t, n) {
      (((e === H && (G === 2 || G === 9)) || e.cancelPendingCommit !== null) &&
        (Eu(e, 0), Cu(e, W, Ql, !1)),
        nt(e, n),
        (!(V & 2) || e !== H) &&
          (e === H && (!(V & 2) && (Xl |= n), Yl === 4 && Cu(e, W, Ql, !1)),
          od(e)));
    }
    function bu(e, t, n) {
      if (V & 6) throw Error(i(327));
      var r = (!n && !(t & 127) && (t & e.expiredLanes) === 0) || Qe(e, t),
        a = r ? Pu(e, t) : Mu(e, t, !0),
        o = r;
      do {
        if (a === 0) {
          Kl && !r && Cu(e, t, 0, !1);
          break;
        }
        if (((n = e.current.alternate), o && !Su(n))) {
          ((a = Mu(e, t, !1)), (o = !1));
          continue;
        }
        if (a === 2) {
          if (((o = t), e.errorRecoveryDisabledLanes & o)) var s = 0;
          else
            ((s = e.pendingLanes & -536870913),
              (s = s === 0 ? (s & 536870912 ? 536870912 : 0) : s));
          if (s !== 0) {
            t = s;
            a: {
              var c = e;
              a = eu;
              var l = c.current.memoizedState.isDehydrated;
              if ((l && (Eu(c, s).flags |= 256), (s = Mu(c, s, !1)), s !== 2)) {
                if (ql && !l) {
                  ((c.errorRecoveryDisabledLanes |= o), (Xl |= o), (a = 4));
                  break a;
                }
                ((o = tu),
                  (tu = a),
                  o !== null &&
                    (tu === null ? (tu = o) : tu.push.apply(tu, o)));
              }
              a = s;
            }
            if (((o = !1), a !== 2)) continue;
          }
        }
        if (a === 1) {
          (Eu(e, 0), Cu(e, t, 0, !0));
          break;
        }
        a: {
          switch (((r = e), (o = a), o)) {
            case 0:
            case 1:
              throw Error(i(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              Cu(r, t, Ql, !Gl);
              break a;
            case 2:
              tu = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(i(329));
          }
          if ((t & 62914560) === t && ((a = ru + 300 - je()), 10 < a)) {
            if ((Cu(r, t, Ql, !Gl), Ze(r, 0, !0) !== 0)) break a;
            ((du = t),
              (r.timeoutHandle = Yd(
                xu.bind(
                  null,
                  r,
                  n,
                  tu,
                  ou,
                  nu,
                  t,
                  Ql,
                  Xl,
                  $l,
                  Gl,
                  o,
                  `Throttled`,
                  -0,
                  0,
                ),
                a,
              )));
            break a;
          }
          xu(r, n, tu, ou, nu, t, Ql, Xl, $l, Gl, o, null, -0, 0);
        }
        break;
      } while (1);
      od(e);
    }
    function xu(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
      if (
        ((e.timeoutHandle = -1),
        (d = t.subtreeFlags),
        d & 8192 || (d & 16785408) == 16785408)
      ) {
        ((d = {
          stylesheets: null,
          count: 0,
          imgCount: 0,
          imgBytes: 0,
          suspenseyImages: [],
          waitingForImages: !0,
          waitingForViewTransition: !1,
          unsuspend: on,
        }),
          Il(t, a, d));
        var m =
          (a & 62914560) === a
            ? ru - je()
            : (a & 4194048) === a
              ? iu - je()
              : 0;
        if (((m = Xf(d, m)), m !== null)) {
          ((du = a),
            (e.cancelPendingCommit = m(
              Vu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p),
            )),
            Cu(e, a, o, !l));
          return;
        }
      }
      Vu(e, t, a, n, r, i, o, s, c);
    }
    function Su(e) {
      for (var t = e; ;) {
        var n = t.tag;
        if (
          (n === 0 || n === 11 || n === 15) &&
          t.flags & 16384 &&
          ((n = t.updateQueue), n !== null && ((n = n.stores), n !== null))
        )
          for (var r = 0; r < n.length; r++) {
            var i = n[r],
              a = i.getSnapshot;
            i = i.value;
            try {
              if (!Dr(a(), i)) return !1;
            } catch {
              return !1;
            }
          }
        if (((n = t.child), t.subtreeFlags & 16384 && n !== null))
          ((n.return = t), (t = n));
        else {
          if (t === e) break;
          for (; t.sibling === null;) {
            if (t.return === null || t.return === e) return !0;
            t = t.return;
          }
          ((t.sibling.return = t.return), (t = t.sibling));
        }
      }
      return !0;
    }
    function Cu(e, t, n, r) {
      ((t &= ~Zl),
        (t &= ~Xl),
        (e.suspendedLanes |= t),
        (e.pingedLanes &= ~t),
        r && (e.warmLanes |= t),
        (r = e.expirationTimes));
      for (var i = t; 0 < i;) {
        var a = 31 - Ue(i),
          o = 1 << a;
        ((r[a] = -1), (i &= ~o));
      }
      n !== 0 && it(e, n, t);
    }
    function wu() {
      return V & 6 ? !0 : (sd(0, !1), !1);
    }
    function Tu() {
      if (U !== null) {
        if (G === 0) var e = U.return;
        else ((e = U), (Qi = Zi = null), Mo(e), (Pa = null), (Fa = 0), (e = U));
        for (; e !== null;) (Wc(e.alternate, e), (e = e.return));
        U = null;
      }
    }
    function Eu(e, t) {
      var n = e.timeoutHandle;
      (n !== -1 && ((e.timeoutHandle = -1), Xd(n)),
        (n = e.cancelPendingCommit),
        n !== null && ((e.cancelPendingCommit = null), n()),
        (du = 0),
        Tu(),
        (H = e),
        (U = n = hi(e.current, null)),
        (W = t),
        (G = 0),
        (Wl = null),
        (Gl = !1),
        (Kl = Qe(e, t)),
        (ql = !1),
        ($l = Ql = Zl = Xl = K = Yl = 0),
        (tu = eu = null),
        (nu = !1),
        t & 8 && (t |= t & 32));
      var r = e.entangledLanes;
      if (r !== 0)
        for (e = e.entanglements, r &= t; 0 < r;) {
          var i = 31 - Ue(r),
            a = 1 << i;
          ((t |= e[i]), (r &= ~a));
        }
      return ((Jl = t), ai(), n);
    }
    function Du(e, t) {
      ((R = null),
        (D.H = Vs),
        t === Ta || t === Da
          ? ((t = Ma()), (G = 3))
          : t === Ea
            ? ((t = Ma()), (G = 4))
            : (G =
                t === ac
                  ? 8
                  : typeof t == `object` && t && typeof t.then == `function`
                    ? 6
                    : 1),
        (Wl = t),
        U === null && ((Yl = 1), $s(e, Ci(t, e.current))));
    }
    function Ou() {
      var e = ao.current;
      return e === null
        ? !0
        : (W & 4194048) === W
          ? oo === null
          : (W & 62914560) === W || W & 536870912
            ? e === oo
            : !1;
    }
    function ku() {
      var e = D.H;
      return ((D.H = Vs), e === null ? Vs : e);
    }
    function Au() {
      var e = D.A;
      return ((D.A = Hl), e);
    }
    function ju() {
      ((Yl = 4),
        Gl || ((W & 4194048) !== W && ao.current !== null) || (Kl = !0),
        (!(K & 134217727) && !(Xl & 134217727)) ||
          H === null ||
          Cu(H, W, Ql, !1));
    }
    function Mu(e, t, n) {
      var r = V;
      V |= 2;
      var i = ku(),
        a = Au();
      ((H !== e || W !== t) && ((ou = null), Eu(e, t)), (t = !1));
      var o = Yl;
      a: do
        try {
          if (G !== 0 && U !== null) {
            var s = U,
              c = Wl;
            switch (G) {
              case 8:
                (Tu(), (o = 6));
                break a;
              case 3:
              case 2:
              case 9:
              case 6:
                ao.current === null && (t = !0);
                var l = G;
                if (((G = 0), (Wl = null), Ru(e, s, c, l), n && Kl)) {
                  o = 0;
                  break a;
                }
                break;
              default:
                ((l = G), (G = 0), (Wl = null), Ru(e, s, c, l));
            }
          }
          (Nu(), (o = Yl));
          break;
        } catch (t) {
          Du(e, t);
        }
      while (1);
      return (
        t && e.shellSuspendCounter++,
        (Qi = Zi = null),
        (V = r),
        (D.H = i),
        (D.A = a),
        U === null && ((H = null), (W = 0), ai()),
        o
      );
    }
    function Nu() {
      for (; U !== null;) Iu(U);
    }
    function Pu(e, t) {
      var n = V;
      V |= 2;
      var r = ku(),
        a = Au();
      H !== e || W !== t
        ? ((ou = null), (au = je() + 500), Eu(e, t))
        : (Kl = Qe(e, t));
      a: do
        try {
          if (G !== 0 && U !== null) {
            t = U;
            var o = Wl;
            b: switch (G) {
              case 1:
                ((G = 0), (Wl = null), Ru(e, t, o, 1));
                break;
              case 2:
              case 9:
                if (ka(o)) {
                  ((G = 0), (Wl = null), Lu(t));
                  break;
                }
                ((t = function () {
                  ((G !== 2 && G !== 9) || H !== e || (G = 7), od(e));
                }),
                  o.then(t, t));
                break a;
              case 3:
                G = 7;
                break a;
              case 4:
                G = 5;
                break a;
              case 7:
                ka(o)
                  ? ((G = 0), (Wl = null), Lu(t))
                  : ((G = 0), (Wl = null), Ru(e, t, o, 7));
                break;
              case 5:
                var s = null;
                switch (U.tag) {
                  case 26:
                    s = U.memoizedState;
                  case 5:
                  case 27:
                    var c = U;
                    if (s ? qf(s) : c.stateNode.complete) {
                      ((G = 0), (Wl = null));
                      var l = c.sibling;
                      if (l !== null) U = l;
                      else {
                        var u = c.return;
                        u === null ? (U = null) : ((U = u), zu(u));
                      }
                      break b;
                    }
                }
                ((G = 0), (Wl = null), Ru(e, t, o, 5));
                break;
              case 6:
                ((G = 0), (Wl = null), Ru(e, t, o, 6));
                break;
              case 8:
                (Tu(), (Yl = 6));
                break a;
              default:
                throw Error(i(462));
            }
          }
          Fu();
          break;
        } catch (t) {
          Du(e, t);
        }
      while (1);
      return (
        (Qi = Zi = null),
        (D.H = r),
        (D.A = a),
        (V = n),
        U === null ? ((H = null), (W = 0), ai(), Yl) : 0
      );
    }
    function Fu() {
      for (; U !== null && !ke();) Iu(U);
    }
    function Iu(e) {
      var t = Fc(e.alternate, e, Jl);
      ((e.memoizedProps = e.pendingProps), t === null ? zu(e) : (U = t));
    }
    function Lu(e) {
      var t = e,
        n = t.alternate;
      switch (t.tag) {
        case 15:
        case 0:
          t = yc(n, t, t.pendingProps, t.type, void 0, W);
          break;
        case 11:
          t = yc(n, t, t.pendingProps, t.type.render, t.ref, W);
          break;
        case 5:
          Mo(t);
        default:
          (Wc(n, t), (t = U = gi(t, Jl)), (t = Fc(n, t, Jl)));
      }
      ((e.memoizedProps = e.pendingProps), t === null ? zu(e) : (U = t));
    }
    function Ru(e, t, n, r) {
      ((Qi = Zi = null), Mo(t), (Pa = null), (Fa = 0));
      var i = t.return;
      try {
        if (ic(e, i, t, n, W)) {
          ((Yl = 1), $s(e, Ci(n, e.current)), (U = null));
          return;
        }
      } catch (t) {
        if (i !== null) throw ((U = i), t);
        ((Yl = 1), $s(e, Ci(n, e.current)), (U = null));
        return;
      }
      t.flags & 32768
        ? (P || r === 1
            ? (e = !0)
            : Kl || W & 536870912
              ? (e = !1)
              : ((Gl = e = !0),
                (r === 2 || r === 9 || r === 3 || r === 6) &&
                  ((r = ao.current),
                  r !== null && r.tag === 13 && (r.flags |= 16384))),
          Bu(t, e))
        : zu(t);
    }
    function zu(e) {
      var t = e;
      do {
        if (t.flags & 32768) {
          Bu(t, Gl);
          return;
        }
        e = t.return;
        var n = Hc(t.alternate, t, Jl);
        if (n !== null) {
          U = n;
          return;
        }
        if (((t = t.sibling), t !== null)) {
          U = t;
          return;
        }
        U = t = e;
      } while (t !== null);
      Yl === 0 && (Yl = 5);
    }
    function Bu(e, t) {
      do {
        var n = Uc(e.alternate, e);
        if (n !== null) {
          ((n.flags &= 32767), (U = n));
          return;
        }
        if (
          ((n = e.return),
          n !== null &&
            ((n.flags |= 32768), (n.subtreeFlags = 0), (n.deletions = null)),
          !t && ((e = e.sibling), e !== null))
        ) {
          U = e;
          return;
        }
        U = e = n;
      } while (e !== null);
      ((Yl = 6), (U = null));
    }
    function Vu(e, t, n, r, a, o, s, c, l) {
      e.cancelPendingCommit = null;
      do Ku();
      while (cu !== 0);
      if (V & 6) throw Error(i(327));
      if (t !== null) {
        if (t === e.current) throw Error(i(177));
        if (
          ((o = t.lanes | t.childLanes),
          (o |= ii),
          rt(e, n, o, s, c, l),
          e === H && ((U = H = null), (W = 0)),
          (uu = t),
          (lu = e),
          (du = n),
          (fu = o),
          (pu = a),
          (mu = r),
          t.subtreeFlags & 10256 || t.flags & 10256
            ? ((e.callbackNode = null),
              (e.callbackPriority = 0),
              $u(Fe, function () {
                return (qu(), null);
              }))
            : ((e.callbackNode = null), (e.callbackPriority = 0)),
          (r = !!(t.flags & 13878)),
          t.subtreeFlags & 13878 || r)
        ) {
          ((r = D.T), (D.T = null), (a = O.p), (O.p = 2), (s = V), (V |= 4));
          try {
            ll(e, t, n);
          } finally {
            ((V = s), (O.p = a), (D.T = r));
          }
        }
        ((cu = 1), Hu(), Uu(), Wu());
      }
    }
    function Hu() {
      if (cu === 1) {
        cu = 0;
        var e = lu,
          t = uu,
          n = !!(t.flags & 13878);
        if (t.subtreeFlags & 13878 || n) {
          ((n = D.T), (D.T = null));
          var r = O.p;
          O.p = 2;
          var i = V;
          V |= 4;
          try {
            Sl(t, e);
            var a = Hd,
              o = Mr(e.containerInfo),
              s = a.focusedElem,
              c = a.selectionRange;
            if (
              o !== s &&
              s &&
              s.ownerDocument &&
              jr(s.ownerDocument.documentElement, s)
            ) {
              if (c !== null && Nr(s)) {
                var l = c.start,
                  u = c.end;
                if ((u === void 0 && (u = l), `selectionStart` in s))
                  ((s.selectionStart = l),
                    (s.selectionEnd = Math.min(u, s.value.length)));
                else {
                  var d = s.ownerDocument || document,
                    f = (d && d.defaultView) || window;
                  if (f.getSelection) {
                    var p = f.getSelection(),
                      m = s.textContent.length,
                      h = Math.min(c.start, m),
                      g = c.end === void 0 ? h : Math.min(c.end, m);
                    !p.extend && h > g && ((o = g), (g = h), (h = o));
                    var _ = Ar(s, h),
                      v = Ar(s, g);
                    if (
                      _ &&
                      v &&
                      (p.rangeCount !== 1 ||
                        p.anchorNode !== _.node ||
                        p.anchorOffset !== _.offset ||
                        p.focusNode !== v.node ||
                        p.focusOffset !== v.offset)
                    ) {
                      var y = d.createRange();
                      (y.setStart(_.node, _.offset),
                        p.removeAllRanges(),
                        h > g
                          ? (p.addRange(y), p.extend(v.node, v.offset))
                          : (y.setEnd(v.node, v.offset), p.addRange(y)));
                    }
                  }
                }
              }
              for (d = [], p = s; (p = p.parentNode);)
                p.nodeType === 1 &&
                  d.push({ element: p, left: p.scrollLeft, top: p.scrollTop });
              for (
                typeof s.focus == `function` && s.focus(), s = 0;
                s < d.length;
                s++
              ) {
                var b = d[s];
                ((b.element.scrollLeft = b.left),
                  (b.element.scrollTop = b.top));
              }
            }
            ((up = !!Vd), (Hd = Vd = null));
          } finally {
            ((V = i), (O.p = r), (D.T = n));
          }
        }
        ((e.current = t), (cu = 2));
      }
    }
    function Uu() {
      if (cu === 2) {
        cu = 0;
        var e = lu,
          t = uu,
          n = !!(t.flags & 8772);
        if (t.subtreeFlags & 8772 || n) {
          ((n = D.T), (D.T = null));
          var r = O.p;
          O.p = 2;
          var i = V;
          V |= 4;
          try {
            ul(e, t.alternate, t);
          } finally {
            ((V = i), (O.p = r), (D.T = n));
          }
        }
        cu = 3;
      }
    }
    function Wu() {
      if (cu === 4 || cu === 3) {
        ((cu = 0), Ae());
        var e = lu,
          t = uu,
          n = du,
          r = mu;
        t.subtreeFlags & 10256 || t.flags & 10256
          ? (cu = 5)
          : ((cu = 0), (uu = lu = null), Gu(e, e.pendingLanes));
        var i = e.pendingLanes;
        if (
          (i === 0 && (su = null),
          ct(n),
          (t = t.stateNode),
          Ve && typeof Ve.onCommitFiberRoot == `function`)
        )
          try {
            Ve.onCommitFiberRoot(Be, t, void 0, (t.current.flags & 128) == 128);
          } catch {}
        if (r !== null) {
          ((t = D.T), (i = O.p), (O.p = 2), (D.T = null));
          try {
            for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
              var s = r[o];
              a(s.value, { componentStack: s.stack });
            }
          } finally {
            ((D.T = t), (O.p = i));
          }
        }
        (du & 3 && Ku(),
          od(e),
          (i = e.pendingLanes),
          n & 261930 && i & 42
            ? e === gu
              ? hu++
              : ((hu = 0), (gu = e))
            : (hu = 0),
          sd(0, !1));
      }
    }
    function Gu(e, t) {
      (e.pooledCacheLanes &= t) === 0 &&
        ((t = e.pooledCache), t != null && ((e.pooledCache = null), pa(t)));
    }
    function Ku() {
      return (Hu(), Uu(), Wu(), qu());
    }
    function qu() {
      if (cu !== 5) return !1;
      var e = lu,
        t = fu;
      fu = 0;
      var n = ct(du),
        r = D.T,
        a = O.p;
      try {
        ((O.p = 32 > n ? 32 : n), (D.T = null), (n = pu), (pu = null));
        var o = lu,
          s = du;
        if (((cu = 0), (uu = lu = null), (du = 0), V & 6)) throw Error(i(331));
        var c = V;
        if (
          ((V |= 4),
          zl(o.current),
          jl(o, o.current, s, n),
          (V = c),
          sd(0, !1),
          Ve && typeof Ve.onPostCommitFiberRoot == `function`)
        )
          try {
            Ve.onPostCommitFiberRoot(Be, o);
          } catch {}
        return !0;
      } finally {
        ((O.p = a), (D.T = r), Gu(e, t));
      }
    }
    function Ju(e, t, n) {
      ((t = Ci(n, t)),
        (t = tc(e.stateNode, t, 2)),
        (e = Ka(e, t, 2)),
        e !== null && (nt(e, 2), od(e)));
    }
    function q(e, t, n) {
      if (e.tag === 3) Ju(e, e, n);
      else
        for (; t !== null;) {
          if (t.tag === 3) {
            Ju(t, e, n);
            break;
          }
          if (t.tag === 1) {
            var r = t.stateNode;
            if (
              typeof t.type.getDerivedStateFromError == `function` ||
              (typeof r.componentDidCatch == `function` &&
                (su === null || !su.has(r)))
            ) {
              ((e = Ci(n, e)),
                (n = nc(2)),
                (r = Ka(t, n, 2)),
                r !== null && (rc(n, r, t, e), nt(r, 2), od(r)));
              break;
            }
          }
          t = t.return;
        }
    }
    function Yu(e, t, n) {
      var r = e.pingCache;
      if (r === null) {
        r = e.pingCache = new Ul();
        var i = new Set();
        r.set(t, i);
      } else ((i = r.get(t)), i === void 0 && ((i = new Set()), r.set(t, i)));
      i.has(n) ||
        ((ql = !0), i.add(n), (e = Xu.bind(null, e, t, n)), t.then(e, e));
    }
    function Xu(e, t, n) {
      var r = e.pingCache;
      (r !== null && r.delete(t),
        (e.pingedLanes |= e.suspendedLanes & n),
        (e.warmLanes &= ~n),
        H === e &&
          (W & n) === n &&
          (Yl === 4 || (Yl === 3 && (W & 62914560) === W && 300 > je() - ru)
            ? !(V & 2) && Eu(e, 0)
            : (Zl |= n),
          $l === W && ($l = 0)),
        od(e));
    }
    function Zu(e, t) {
      (t === 0 && (t = et()), (e = ci(e, t)), e !== null && (nt(e, t), od(e)));
    }
    function J(e) {
      var t = e.memoizedState,
        n = 0;
      (t !== null && (n = t.retryLane), Zu(e, n));
    }
    function Qu(e, t) {
      var n = 0;
      switch (e.tag) {
        case 31:
        case 13:
          var r = e.stateNode,
            a = e.memoizedState;
          a !== null && (n = a.retryLane);
          break;
        case 19:
          r = e.stateNode;
          break;
        case 22:
          r = e.stateNode._retryCache;
          break;
        default:
          throw Error(i(314));
      }
      (r !== null && r.delete(t), Zu(e, n));
    }
    function $u(e, t) {
      return De(e, t);
    }
    var ed = null,
      td = null,
      nd = !1,
      rd = !1,
      id = !1,
      ad = 0;
    function od(e) {
      (e !== td &&
        e.next === null &&
        (td === null ? (ed = td = e) : (td = td.next = e)),
        (rd = !0),
        nd || ((nd = !0), pd()));
    }
    function sd(e, t) {
      if (!id && rd) {
        id = !0;
        do
          for (var n = !1, r = ed; r !== null;) {
            if (!t)
              if (e !== 0) {
                var i = r.pendingLanes;
                if (i === 0) var a = 0;
                else {
                  var o = r.suspendedLanes,
                    s = r.pingedLanes;
                  ((a = (1 << (31 - Ue(42 | e) + 1)) - 1),
                    (a &= i & ~(o & ~s)),
                    (a = a & 201326741 ? (a & 201326741) | 1 : a ? a | 2 : 0));
                }
                a !== 0 && ((n = !0), fd(r, a));
              } else
                ((a = W),
                  (a = Ze(
                    r,
                    r === H ? a : 0,
                    r.cancelPendingCommit !== null || r.timeoutHandle !== -1,
                  )),
                  !(a & 3) || Qe(r, a) || ((n = !0), fd(r, a)));
            r = r.next;
          }
        while (n);
        id = !1;
      }
    }
    function cd() {
      ld();
    }
    function ld() {
      rd = nd = !1;
      var e = 0;
      ad !== 0 && Jd() && (e = ad);
      for (var t = je(), n = null, r = ed; r !== null;) {
        var i = r.next,
          a = ud(r, t);
        (a === 0
          ? ((r.next = null),
            n === null ? (ed = i) : (n.next = i),
            i === null && (td = n))
          : ((n = r), (e !== 0 || a & 3) && (rd = !0)),
          (r = i));
      }
      ((cu !== 0 && cu !== 5) || sd(e, !1), ad !== 0 && (ad = 0));
    }
    function ud(e, t) {
      for (
        var n = e.suspendedLanes,
          r = e.pingedLanes,
          i = e.expirationTimes,
          a = e.pendingLanes & -62914561;
        0 < a;
      ) {
        var o = 31 - Ue(a),
          s = 1 << o,
          c = i[o];
        (c === -1
          ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = $e(s, t))
          : c <= t && (e.expiredLanes |= s),
          (a &= ~s));
      }
      if (
        ((t = H),
        (n = W),
        (n = Ze(
          e,
          e === t ? n : 0,
          e.cancelPendingCommit !== null || e.timeoutHandle !== -1,
        )),
        (r = e.callbackNode),
        n === 0 ||
          (e === t && (G === 2 || G === 9)) ||
          e.cancelPendingCommit !== null)
      )
        return (
          r !== null && r !== null && Oe(r),
          (e.callbackNode = null),
          (e.callbackPriority = 0)
        );
      if (!(n & 3) || Qe(e, n)) {
        if (((t = n & -n), t === e.callbackPriority)) return t;
        switch ((r !== null && Oe(r), ct(n))) {
          case 2:
          case 8:
            n = Pe;
            break;
          case 32:
            n = Fe;
            break;
          case 268435456:
            n = Le;
            break;
          default:
            n = Fe;
        }
        return (
          (r = dd.bind(null, e)),
          (n = De(n, r)),
          (e.callbackPriority = t),
          (e.callbackNode = n),
          t
        );
      }
      return (
        r !== null && r !== null && Oe(r),
        (e.callbackPriority = 2),
        (e.callbackNode = null),
        2
      );
    }
    function dd(e, t) {
      if (cu !== 0 && cu !== 5)
        return ((e.callbackNode = null), (e.callbackPriority = 0), null);
      var n = e.callbackNode;
      if (Ku() && e.callbackNode !== n) return null;
      var r = W;
      return (
        (r = Ze(
          e,
          e === H ? r : 0,
          e.cancelPendingCommit !== null || e.timeoutHandle !== -1,
        )),
        r === 0
          ? null
          : (bu(e, r, t),
            ud(e, je()),
            e.callbackNode != null && e.callbackNode === n
              ? dd.bind(null, e)
              : null)
      );
    }
    function fd(e, t) {
      if (Ku()) return null;
      bu(e, t, !0);
    }
    function pd() {
      Qd(function () {
        V & 6 ? De(Ne, cd) : ld();
      });
    }
    function md() {
      if (ad === 0) {
        var e = ga;
        (e === 0 && ((e = qe), (qe <<= 1), !(qe & 261888) && (qe = 256)),
          (ad = e));
      }
      return ad;
    }
    function hd(e) {
      return e == null || typeof e == `symbol` || typeof e == `boolean`
        ? null
        : typeof e == `function`
          ? e
          : an(`` + e);
    }
    function gd(e, t) {
      var n = t.ownerDocument.createElement(`input`);
      return (
        (n.name = t.name),
        (n.value = t.value),
        e.id && n.setAttribute(`form`, e.id),
        t.parentNode.insertBefore(n, t),
        (e = new FormData(e)),
        n.parentNode.removeChild(n),
        e
      );
    }
    function _d(e, t, n, r, i) {
      if (t === `submit` && n && n.stateNode === i) {
        var a = hd((i[pt] || null).action),
          o = r.submitter;
        o &&
          ((t = (t = o[pt] || null)
            ? hd(t.formAction)
            : o.getAttribute(`formAction`)),
          t !== null && ((a = t), (o = null)));
        var s = new Dn(`action`, `action`, null, r, i);
        e.push({
          event: s,
          listeners: [
            {
              instance: null,
              listener: function () {
                if (r.defaultPrevented) {
                  if (ad !== 0) {
                    var e = o ? gd(i, o) : new FormData(i);
                    Ds(
                      n,
                      { pending: !0, data: e, method: i.method, action: a },
                      null,
                      e,
                    );
                  }
                } else
                  typeof a == `function` &&
                    (s.preventDefault(),
                    (e = o ? gd(i, o) : new FormData(i)),
                    Ds(
                      n,
                      { pending: !0, data: e, method: i.method, action: a },
                      a,
                      e,
                    ));
              },
              currentTarget: i,
            },
          ],
        });
      }
    }
    for (var vd = 0; vd < $r.length; vd++) {
      var yd = $r[vd];
      ei(yd.toLowerCase(), `on` + (yd[0].toUpperCase() + yd.slice(1)));
    }
    (ei(Gr, `onAnimationEnd`),
      ei(Kr, `onAnimationIteration`),
      ei(qr, `onAnimationStart`),
      ei(`dblclick`, `onDoubleClick`),
      ei(`focusin`, `onFocus`),
      ei(`focusout`, `onBlur`),
      ei(Jr, `onTransitionRun`),
      ei(Yr, `onTransitionStart`),
      ei(Xr, `onTransitionCancel`),
      ei(Zr, `onTransitionEnd`),
      kt(`onMouseEnter`, [`mouseout`, `mouseover`]),
      kt(`onMouseLeave`, [`mouseout`, `mouseover`]),
      kt(`onPointerEnter`, [`pointerout`, `pointerover`]),
      kt(`onPointerLeave`, [`pointerout`, `pointerover`]),
      Ot(
        `onChange`,
        `change click focusin focusout input keydown keyup selectionchange`.split(
          ` `,
        ),
      ),
      Ot(
        `onSelect`,
        `focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(
          ` `,
        ),
      ),
      Ot(`onBeforeInput`, [`compositionend`, `keypress`, `textInput`, `paste`]),
      Ot(
        `onCompositionEnd`,
        `compositionend focusout keydown keypress keyup mousedown`.split(` `),
      ),
      Ot(
        `onCompositionStart`,
        `compositionstart focusout keydown keypress keyup mousedown`.split(` `),
      ),
      Ot(
        `onCompositionUpdate`,
        `compositionupdate focusout keydown keypress keyup mousedown`.split(
          ` `,
        ),
      ));
    var bd =
        `abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(
          ` `,
        ),
      xd = new Set(
        `beforetoggle cancel close invalid load scroll scrollend toggle`
          .split(` `)
          .concat(bd),
      );
    function Sd(e, t) {
      t = !!(t & 4);
      for (var n = 0; n < e.length; n++) {
        var r = e[n],
          i = r.event;
        r = r.listeners;
        a: {
          var a = void 0;
          if (t)
            for (var o = r.length - 1; 0 <= o; o--) {
              var s = r[o],
                c = s.instance,
                l = s.currentTarget;
              if (((s = s.listener), c !== a && i.isPropagationStopped()))
                break a;
              ((a = s), (i.currentTarget = l));
              try {
                a(i);
              } catch (e) {
                ti(e);
              }
              ((i.currentTarget = null), (a = c));
            }
          else
            for (o = 0; o < r.length; o++) {
              if (
                ((s = r[o]),
                (c = s.instance),
                (l = s.currentTarget),
                (s = s.listener),
                c !== a && i.isPropagationStopped())
              )
                break a;
              ((a = s), (i.currentTarget = l));
              try {
                a(i);
              } catch (e) {
                ti(e);
              }
              ((i.currentTarget = null), (a = c));
            }
        }
      }
    }
    function Y(e, t) {
      var n = t[ht];
      n === void 0 && (n = t[ht] = new Set());
      var r = e + `__bubble`;
      n.has(r) || (Ed(t, e, 2, !1), n.add(r));
    }
    function Cd(e, t, n) {
      var r = 0;
      (t && (r |= 4), Ed(n, e, r, t));
    }
    var wd = `_reactListening` + Math.random().toString(36).slice(2);
    function Td(e) {
      if (!e[wd]) {
        ((e[wd] = !0),
          Et.forEach(function (t) {
            t !== `selectionchange` &&
              (xd.has(t) || Cd(t, !1, e), Cd(t, !0, e));
          }));
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        t === null || t[wd] || ((t[wd] = !0), Cd(`selectionchange`, !1, t));
      }
    }
    function Ed(e, t, n, r) {
      switch (_p(t)) {
        case 2:
          var i = dp;
          break;
        case 8:
          i = fp;
          break;
        default:
          i = pp;
      }
      ((n = i.bind(null, t, n, e)),
        (i = void 0),
        !gn ||
          (t !== `touchstart` && t !== `touchmove` && t !== `wheel`) ||
          (i = !0),
        r
          ? i === void 0
            ? e.addEventListener(t, n, !0)
            : e.addEventListener(t, n, { capture: !0, passive: i })
          : i === void 0
            ? e.addEventListener(t, n, !1)
            : e.addEventListener(t, n, { passive: i }));
    }
    function Dd(e, t, n, r, i) {
      var a = r;
      if (!(t & 1) && !(t & 2) && r !== null)
        a: for (;;) {
          if (r === null) return;
          var s = r.tag;
          if (s === 3 || s === 4) {
            var c = r.stateNode.containerInfo;
            if (c === i) break;
            if (s === 4)
              for (s = r.return; s !== null;) {
                var l = s.tag;
                if ((l === 3 || l === 4) && s.stateNode.containerInfo === i)
                  return;
                s = s.return;
              }
            for (; c !== null;) {
              if (((s = xt(c)), s === null)) return;
              if (((l = s.tag), l === 5 || l === 6 || l === 26 || l === 27)) {
                r = a = s;
                continue a;
              }
              c = c.parentNode;
            }
          }
          r = r.return;
        }
      pn(function () {
        var r = a,
          i = cn(n),
          s = [];
        a: {
          var c = Qr.get(e);
          if (c !== void 0) {
            var l = Dn,
              u = e;
            switch (e) {
              case `keypress`:
                if (Sn(n) === 0) break a;
              case `keydown`:
              case `keyup`:
                l = Gn;
                break;
              case `focusin`:
                ((u = `focus`), (l = In));
                break;
              case `focusout`:
                ((u = `blur`), (l = In));
                break;
              case `beforeblur`:
              case `afterblur`:
                l = In;
                break;
              case `click`:
                if (n.button === 2) break a;
              case `auxclick`:
              case `dblclick`:
              case `mousedown`:
              case `mousemove`:
              case `mouseup`:
              case `mouseout`:
              case `mouseover`:
              case `contextmenu`:
                l = Pn;
                break;
              case `drag`:
              case `dragend`:
              case `dragenter`:
              case `dragexit`:
              case `dragleave`:
              case `dragover`:
              case `dragstart`:
              case `drop`:
                l = Fn;
                break;
              case `touchcancel`:
              case `touchend`:
              case `touchmove`:
              case `touchstart`:
                l = qn;
                break;
              case Gr:
              case Kr:
              case qr:
                l = Ln;
                break;
              case Zr:
                l = N;
                break;
              case `scroll`:
              case `scrollend`:
                l = kn;
                break;
              case `wheel`:
                l = Jn;
                break;
              case `copy`:
              case `cut`:
              case `paste`:
                l = Rn;
                break;
              case `gotpointercapture`:
              case `lostpointercapture`:
              case `pointercancel`:
              case `pointerdown`:
              case `pointermove`:
              case `pointerout`:
              case `pointerover`:
              case `pointerup`:
                l = Kn;
                break;
              case `toggle`:
              case `beforetoggle`:
                l = Yn;
            }
            var d = !!(t & 4),
              f = !d && (e === `scroll` || e === `scrollend`),
              p = d ? (c === null ? null : c + `Capture`) : c;
            d = [];
            for (var m = r, h; m !== null;) {
              var g = m;
              if (
                ((h = g.stateNode),
                (g = g.tag),
                (g !== 5 && g !== 26 && g !== 27) ||
                  h === null ||
                  p === null ||
                  ((g = mn(m, p)), g != null && d.push(Od(m, g, h))),
                f)
              )
                break;
              m = m.return;
            }
            0 < d.length &&
              ((c = new l(c, u, null, n, i)),
              s.push({ event: c, listeners: d }));
          }
        }
        if (!(t & 7)) {
          a: {
            if (
              ((c = e === `mouseover` || e === `pointerover`),
              (l = e === `mouseout` || e === `pointerout`),
              c &&
                n !== sn &&
                (u = n.relatedTarget || n.fromElement) &&
                (xt(u) || u[mt]))
            )
              break a;
            if (
              (l || c) &&
              ((c =
                i.window === i
                  ? i
                  : (c = i.ownerDocument)
                    ? c.defaultView || c.parentWindow
                    : window),
              l
                ? ((u = n.relatedTarget || n.toElement),
                  (l = r),
                  (u = u ? xt(u) : null),
                  u !== null &&
                    ((f = o(u)),
                    (d = u.tag),
                    u !== f || (d !== 5 && d !== 27 && d !== 6)) &&
                    (u = null))
                : ((l = null), (u = r)),
              l !== u)
            ) {
              if (
                ((d = Pn),
                (g = `onMouseLeave`),
                (p = `onMouseEnter`),
                (m = `mouse`),
                (e === `pointerout` || e === `pointerover`) &&
                  ((d = Kn),
                  (g = `onPointerLeave`),
                  (p = `onPointerEnter`),
                  (m = `pointer`)),
                (f = l == null ? c : Ct(l)),
                (h = u == null ? c : Ct(u)),
                (c = new d(g, m + `leave`, l, n, i)),
                (c.target = f),
                (c.relatedTarget = h),
                (g = null),
                xt(i) === r &&
                  ((d = new d(p, m + `enter`, u, n, i)),
                  (d.target = h),
                  (d.relatedTarget = f),
                  (g = d)),
                (f = g),
                l && u)
              )
                b: {
                  for (d = Ad, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;
                  g = 0;
                  for (var _ = m; _; _ = d(_)) g++;
                  for (; 0 < h - g;) ((p = d(p)), h--);
                  for (; 0 < g - h;) ((m = d(m)), g--);
                  for (; h--;) {
                    if (p === m || (m !== null && p === m.alternate)) {
                      d = p;
                      break b;
                    }
                    ((p = d(p)), (m = d(m)));
                  }
                  d = null;
                }
              else d = null;
              (l !== null && jd(s, c, l, d, !1),
                u !== null && f !== null && jd(s, f, u, d, !0));
            }
          }
          a: {
            if (
              ((c = r ? Ct(r) : window),
              (l = c.nodeName && c.nodeName.toLowerCase()),
              l === `select` || (l === `input` && c.type === `file`))
            )
              var v = hr;
            else if (lr(c))
              if (gr) v = Tr;
              else {
                v = Cr;
                var y = Sr;
              }
            else
              ((l = c.nodeName),
                !l ||
                l.toLowerCase() !== `input` ||
                (c.type !== `checkbox` && c.type !== `radio`)
                  ? r && tn(r.elementType) && (v = hr)
                  : (v = wr));
            if ((v &&= v(e, r))) {
              ur(s, v, n, i);
              break a;
            }
            (y && y(e, c, r),
              e === `focusout` &&
                r &&
                c.type === `number` &&
                r.memoizedProps.value != null &&
                qt(c, `number`, c.value));
          }
          switch (((y = r ? Ct(r) : window), e)) {
            case `focusin`:
              (lr(y) || y.contentEditable === `true`) &&
                ((Fr = y), (Ir = r), (Lr = null));
              break;
            case `focusout`:
              Lr = Ir = Fr = null;
              break;
            case `mousedown`:
              Rr = !0;
              break;
            case `contextmenu`:
            case `mouseup`:
            case `dragend`:
              ((Rr = !1), zr(s, n, i));
              break;
            case `selectionchange`:
              if (Pr) break;
            case `keydown`:
            case `keyup`:
              zr(s, n, i);
          }
          var b;
          if (Zn)
            b: {
              switch (e) {
                case `compositionstart`:
                  var x = `onCompositionStart`;
                  break b;
                case `compositionend`:
                  x = `onCompositionEnd`;
                  break b;
                case `compositionupdate`:
                  x = `onCompositionUpdate`;
                  break b;
              }
              x = void 0;
            }
          else
            ar
              ? rr(e, n) && (x = `onCompositionEnd`)
              : e === `keydown` &&
                n.keyCode === 229 &&
                (x = `onCompositionStart`);
          (x &&
            (er &&
              n.locale !== `ko` &&
              (ar || x !== `onCompositionStart`
                ? x === `onCompositionEnd` && ar && (b = xn())
                : ((vn = i),
                  (yn = `value` in vn ? vn.value : vn.textContent),
                  (ar = !0))),
            (y = kd(r, x)),
            0 < y.length &&
              ((x = new zn(x, e, null, n, i)),
              s.push({ event: x, listeners: y }),
              b ? (x.data = b) : ((b = ir(n)), b !== null && (x.data = b)))),
            (b = $n ? or(e, n) : sr(e, n)) &&
              ((x = kd(r, `onBeforeInput`)),
              0 < x.length &&
                ((y = new zn(`onBeforeInput`, `beforeinput`, null, n, i)),
                s.push({ event: y, listeners: x }),
                (y.data = b))),
            _d(s, e, r, n, i));
        }
        Sd(s, t);
      });
    }
    function Od(e, t, n) {
      return { instance: e, listener: t, currentTarget: n };
    }
    function kd(e, t) {
      for (var n = t + `Capture`, r = []; e !== null;) {
        var i = e,
          a = i.stateNode;
        if (
          ((i = i.tag),
          (i !== 5 && i !== 26 && i !== 27) ||
            a === null ||
            ((i = mn(e, n)),
            i != null && r.unshift(Od(e, i, a)),
            (i = mn(e, t)),
            i != null && r.push(Od(e, i, a))),
          e.tag === 3)
        )
          return r;
        e = e.return;
      }
      return [];
    }
    function Ad(e) {
      if (e === null) return null;
      do e = e.return;
      while (e && e.tag !== 5 && e.tag !== 27);
      return e || null;
    }
    function jd(e, t, n, r, i) {
      for (var a = t._reactName, o = []; n !== null && n !== r;) {
        var s = n,
          c = s.alternate,
          l = s.stateNode;
        if (((s = s.tag), c !== null && c === r)) break;
        ((s !== 5 && s !== 26 && s !== 27) ||
          l === null ||
          ((c = l),
          i
            ? ((l = mn(n, a)), l != null && o.unshift(Od(n, l, c)))
            : i || ((l = mn(n, a)), l != null && o.push(Od(n, l, c)))),
          (n = n.return));
      }
      o.length !== 0 && e.push({ event: t, listeners: o });
    }
    var Md = /\r\n?/g,
      Nd = /\u0000|\uFFFD/g;
    function Pd(e) {
      return (typeof e == `string` ? e : `` + e)
        .replace(
          Md,
          `
`,
        )
        .replace(Nd, ``);
    }
    function Fd(e, t) {
      return ((t = Pd(t)), Pd(e) === t);
    }
    function X(e, t, n, r, a, o) {
      switch (n) {
        case `children`:
          typeof r == `string`
            ? t === `body` || (t === `textarea` && r === ``) || Zt(e, r)
            : (typeof r == `number` || typeof r == `bigint`) &&
              t !== `body` &&
              Zt(e, `` + r);
          break;
        case `className`:
          Ft(e, `class`, r);
          break;
        case `tabIndex`:
          Ft(e, `tabindex`, r);
          break;
        case `dir`:
        case `role`:
        case `viewBox`:
        case `width`:
        case `height`:
          Ft(e, n, r);
          break;
        case `style`:
          en(e, r, o);
          break;
        case `data`:
          if (t !== `object`) {
            Ft(e, `data`, r);
            break;
          }
        case `src`:
        case `href`:
          if (r === `` && (t !== `a` || n !== `href`)) {
            e.removeAttribute(n);
            break;
          }
          if (
            r == null ||
            typeof r == `function` ||
            typeof r == `symbol` ||
            typeof r == `boolean`
          ) {
            e.removeAttribute(n);
            break;
          }
          ((r = an(`` + r)), e.setAttribute(n, r));
          break;
        case `action`:
        case `formAction`:
          if (typeof r == `function`) {
            e.setAttribute(
              n,
              `javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`,
            );
            break;
          }
          if (
            (typeof o == `function` &&
              (n === `formAction`
                ? (t !== `input` && X(e, t, `name`, a.name, a, null),
                  X(e, t, `formEncType`, a.formEncType, a, null),
                  X(e, t, `formMethod`, a.formMethod, a, null),
                  X(e, t, `formTarget`, a.formTarget, a, null))
                : (X(e, t, `encType`, a.encType, a, null),
                  X(e, t, `method`, a.method, a, null),
                  X(e, t, `target`, a.target, a, null))),
            r == null || typeof r == `symbol` || typeof r == `boolean`)
          ) {
            e.removeAttribute(n);
            break;
          }
          ((r = an(`` + r)), e.setAttribute(n, r));
          break;
        case `onClick`:
          r != null && (e.onclick = on);
          break;
        case `onScroll`:
          r != null && Y(`scroll`, e);
          break;
        case `onScrollEnd`:
          r != null && Y(`scrollend`, e);
          break;
        case `dangerouslySetInnerHTML`:
          if (r != null) {
            if (typeof r != `object` || !(`__html` in r)) throw Error(i(61));
            if (((n = r.__html), n != null)) {
              if (a.children != null) throw Error(i(60));
              e.innerHTML = n;
            }
          }
          break;
        case `multiple`:
          e.multiple = r && typeof r != `function` && typeof r != `symbol`;
          break;
        case `muted`:
          e.muted = r && typeof r != `function` && typeof r != `symbol`;
          break;
        case `suppressContentEditableWarning`:
        case `suppressHydrationWarning`:
        case `defaultValue`:
        case `defaultChecked`:
        case `innerHTML`:
        case `ref`:
          break;
        case `autoFocus`:
          break;
        case `xlinkHref`:
          if (
            r == null ||
            typeof r == `function` ||
            typeof r == `boolean` ||
            typeof r == `symbol`
          ) {
            e.removeAttribute(`xlink:href`);
            break;
          }
          ((n = an(`` + r)),
            e.setAttributeNS(`http://www.w3.org/1999/xlink`, `xlink:href`, n));
          break;
        case `contentEditable`:
        case `spellCheck`:
        case `draggable`:
        case `value`:
        case `autoReverse`:
        case `externalResourcesRequired`:
        case `focusable`:
        case `preserveAlpha`:
          r != null && typeof r != `function` && typeof r != `symbol`
            ? e.setAttribute(n, `` + r)
            : e.removeAttribute(n);
          break;
        case `inert`:
        case `allowFullScreen`:
        case `async`:
        case `autoPlay`:
        case `controls`:
        case `default`:
        case `defer`:
        case `disabled`:
        case `disablePictureInPicture`:
        case `disableRemotePlayback`:
        case `formNoValidate`:
        case `hidden`:
        case `loop`:
        case `noModule`:
        case `noValidate`:
        case `open`:
        case `playsInline`:
        case `readOnly`:
        case `required`:
        case `reversed`:
        case `scoped`:
        case `seamless`:
        case `itemScope`:
          r && typeof r != `function` && typeof r != `symbol`
            ? e.setAttribute(n, ``)
            : e.removeAttribute(n);
          break;
        case `capture`:
        case `download`:
          !0 === r
            ? e.setAttribute(n, ``)
            : !1 !== r &&
                r != null &&
                typeof r != `function` &&
                typeof r != `symbol`
              ? e.setAttribute(n, r)
              : e.removeAttribute(n);
          break;
        case `cols`:
        case `rows`:
        case `size`:
        case `span`:
          r != null &&
          typeof r != `function` &&
          typeof r != `symbol` &&
          !isNaN(r) &&
          1 <= r
            ? e.setAttribute(n, r)
            : e.removeAttribute(n);
          break;
        case `rowSpan`:
        case `start`:
          r == null ||
          typeof r == `function` ||
          typeof r == `symbol` ||
          isNaN(r)
            ? e.removeAttribute(n)
            : e.setAttribute(n, r);
          break;
        case `popover`:
          (Y(`beforetoggle`, e), Y(`toggle`, e), Pt(e, `popover`, r));
          break;
        case `xlinkActuate`:
          It(e, `http://www.w3.org/1999/xlink`, `xlink:actuate`, r);
          break;
        case `xlinkArcrole`:
          It(e, `http://www.w3.org/1999/xlink`, `xlink:arcrole`, r);
          break;
        case `xlinkRole`:
          It(e, `http://www.w3.org/1999/xlink`, `xlink:role`, r);
          break;
        case `xlinkShow`:
          It(e, `http://www.w3.org/1999/xlink`, `xlink:show`, r);
          break;
        case `xlinkTitle`:
          It(e, `http://www.w3.org/1999/xlink`, `xlink:title`, r);
          break;
        case `xlinkType`:
          It(e, `http://www.w3.org/1999/xlink`, `xlink:type`, r);
          break;
        case `xmlBase`:
          It(e, `http://www.w3.org/XML/1998/namespace`, `xml:base`, r);
          break;
        case `xmlLang`:
          It(e, `http://www.w3.org/XML/1998/namespace`, `xml:lang`, r);
          break;
        case `xmlSpace`:
          It(e, `http://www.w3.org/XML/1998/namespace`, `xml:space`, r);
          break;
        case `is`:
          Pt(e, `is`, r);
          break;
        case `innerText`:
        case `textContent`:
          break;
        default:
          (!(2 < n.length) ||
            (n[0] !== `o` && n[0] !== `O`) ||
            (n[1] !== `n` && n[1] !== `N`)) &&
            ((n = nn.get(n) || n), Pt(e, n, r));
      }
    }
    function Id(e, t, n, r, a, o) {
      switch (n) {
        case `style`:
          en(e, r, o);
          break;
        case `dangerouslySetInnerHTML`:
          if (r != null) {
            if (typeof r != `object` || !(`__html` in r)) throw Error(i(61));
            if (((n = r.__html), n != null)) {
              if (a.children != null) throw Error(i(60));
              e.innerHTML = n;
            }
          }
          break;
        case `children`:
          typeof r == `string`
            ? Zt(e, r)
            : (typeof r == `number` || typeof r == `bigint`) && Zt(e, `` + r);
          break;
        case `onScroll`:
          r != null && Y(`scroll`, e);
          break;
        case `onScrollEnd`:
          r != null && Y(`scrollend`, e);
          break;
        case `onClick`:
          r != null && (e.onclick = on);
          break;
        case `suppressContentEditableWarning`:
        case `suppressHydrationWarning`:
        case `innerHTML`:
        case `ref`:
          break;
        case `innerText`:
        case `textContent`:
          break;
        default:
          if (!Dt.hasOwnProperty(n))
            a: {
              if (
                n[0] === `o` &&
                n[1] === `n` &&
                ((a = n.endsWith(`Capture`)),
                (t = n.slice(2, a ? n.length - 7 : void 0)),
                (o = e[pt] || null),
                (o = o == null ? null : o[n]),
                typeof o == `function` && e.removeEventListener(t, o, a),
                typeof r == `function`)
              ) {
                (typeof o != `function` &&
                  o !== null &&
                  (n in e
                    ? (e[n] = null)
                    : e.hasAttribute(n) && e.removeAttribute(n)),
                  e.addEventListener(t, r, a));
                break a;
              }
              n in e
                ? (e[n] = r)
                : !0 === r
                  ? e.setAttribute(n, ``)
                  : Pt(e, n, r);
            }
      }
    }
    function Ld(e, t, n) {
      switch (t) {
        case `div`:
        case `span`:
        case `svg`:
        case `path`:
        case `a`:
        case `g`:
        case `p`:
        case `li`:
          break;
        case `img`:
          (Y(`error`, e), Y(`load`, e));
          var r = !1,
            a = !1,
            o;
          for (o in n)
            if (n.hasOwnProperty(o)) {
              var s = n[o];
              if (s != null)
                switch (o) {
                  case `src`:
                    r = !0;
                    break;
                  case `srcSet`:
                    a = !0;
                    break;
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    throw Error(i(137, t));
                  default:
                    X(e, t, o, s, n, null);
                }
            }
          (a && X(e, t, `srcSet`, n.srcSet, n, null),
            r && X(e, t, `src`, n.src, n, null));
          return;
        case `input`:
          Y(`invalid`, e);
          var c = (o = s = a = null),
            l = null,
            u = null;
          for (r in n)
            if (n.hasOwnProperty(r)) {
              var d = n[r];
              if (d != null)
                switch (r) {
                  case `name`:
                    a = d;
                    break;
                  case `type`:
                    s = d;
                    break;
                  case `checked`:
                    l = d;
                    break;
                  case `defaultChecked`:
                    u = d;
                    break;
                  case `value`:
                    o = d;
                    break;
                  case `defaultValue`:
                    c = d;
                    break;
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    if (d != null) throw Error(i(137, t));
                    break;
                  default:
                    X(e, t, r, d, n, null);
                }
            }
          Kt(e, o, c, l, u, s, a, !1);
          return;
        case `select`:
          for (a in (Y(`invalid`, e), (r = s = o = null), n))
            if (n.hasOwnProperty(a) && ((c = n[a]), c != null))
              switch (a) {
                case `value`:
                  o = c;
                  break;
                case `defaultValue`:
                  s = c;
                  break;
                case `multiple`:
                  r = c;
                default:
                  X(e, t, a, c, n, null);
              }
          ((t = o),
            (n = s),
            (e.multiple = !!r),
            t == null ? n != null && Jt(e, !!r, n, !0) : Jt(e, !!r, t, !1));
          return;
        case `textarea`:
          for (s in (Y(`invalid`, e), (o = a = r = null), n))
            if (n.hasOwnProperty(s) && ((c = n[s]), c != null))
              switch (s) {
                case `value`:
                  r = c;
                  break;
                case `defaultValue`:
                  a = c;
                  break;
                case `children`:
                  o = c;
                  break;
                case `dangerouslySetInnerHTML`:
                  if (c != null) throw Error(i(91));
                  break;
                default:
                  X(e, t, s, c, n, null);
              }
          Xt(e, r, a, o);
          return;
        case `option`:
          for (l in n)
            if (n.hasOwnProperty(l) && ((r = n[l]), r != null))
              switch (l) {
                case `selected`:
                  e.selected =
                    r && typeof r != `function` && typeof r != `symbol`;
                  break;
                default:
                  X(e, t, l, r, n, null);
              }
          return;
        case `dialog`:
          (Y(`beforetoggle`, e), Y(`toggle`, e), Y(`cancel`, e), Y(`close`, e));
          break;
        case `iframe`:
        case `object`:
          Y(`load`, e);
          break;
        case `video`:
        case `audio`:
          for (r = 0; r < bd.length; r++) Y(bd[r], e);
          break;
        case `image`:
          (Y(`error`, e), Y(`load`, e));
          break;
        case `details`:
          Y(`toggle`, e);
          break;
        case `embed`:
        case `source`:
        case `link`:
          (Y(`error`, e), Y(`load`, e));
        case `area`:
        case `base`:
        case `br`:
        case `col`:
        case `hr`:
        case `keygen`:
        case `meta`:
        case `param`:
        case `track`:
        case `wbr`:
        case `menuitem`:
          for (u in n)
            if (n.hasOwnProperty(u) && ((r = n[u]), r != null))
              switch (u) {
                case `children`:
                case `dangerouslySetInnerHTML`:
                  throw Error(i(137, t));
                default:
                  X(e, t, u, r, n, null);
              }
          return;
        default:
          if (tn(t)) {
            for (d in n)
              n.hasOwnProperty(d) &&
                ((r = n[d]), r !== void 0 && Id(e, t, d, r, n, void 0));
            return;
          }
      }
      for (c in n)
        n.hasOwnProperty(c) &&
          ((r = n[c]), r != null && X(e, t, c, r, n, null));
    }
    function Rd(e, t, n, r) {
      switch (t) {
        case `div`:
        case `span`:
        case `svg`:
        case `path`:
        case `a`:
        case `g`:
        case `p`:
        case `li`:
          break;
        case `input`:
          var a = null,
            o = null,
            s = null,
            c = null,
            l = null,
            u = null,
            d = null;
          for (m in n) {
            var f = n[m];
            if (n.hasOwnProperty(m) && f != null)
              switch (m) {
                case `checked`:
                  break;
                case `value`:
                  break;
                case `defaultValue`:
                  l = f;
                default:
                  r.hasOwnProperty(m) || X(e, t, m, null, r, f);
              }
          }
          for (var p in r) {
            var m = r[p];
            if (((f = n[p]), r.hasOwnProperty(p) && (m != null || f != null)))
              switch (p) {
                case `type`:
                  o = m;
                  break;
                case `name`:
                  a = m;
                  break;
                case `checked`:
                  u = m;
                  break;
                case `defaultChecked`:
                  d = m;
                  break;
                case `value`:
                  s = m;
                  break;
                case `defaultValue`:
                  c = m;
                  break;
                case `children`:
                case `dangerouslySetInnerHTML`:
                  if (m != null) throw Error(i(137, t));
                  break;
                default:
                  m !== f && X(e, t, p, m, r, f);
              }
          }
          Gt(e, s, c, l, u, d, o, a);
          return;
        case `select`:
          for (o in ((m = s = c = p = null), n))
            if (((l = n[o]), n.hasOwnProperty(o) && l != null))
              switch (o) {
                case `value`:
                  break;
                case `multiple`:
                  m = l;
                default:
                  r.hasOwnProperty(o) || X(e, t, o, null, r, l);
              }
          for (a in r)
            if (
              ((o = r[a]),
              (l = n[a]),
              r.hasOwnProperty(a) && (o != null || l != null))
            )
              switch (a) {
                case `value`:
                  p = o;
                  break;
                case `defaultValue`:
                  c = o;
                  break;
                case `multiple`:
                  s = o;
                default:
                  o !== l && X(e, t, a, o, r, l);
              }
          ((t = c),
            (n = s),
            (r = m),
            p == null
              ? !!r != !!n &&
                (t == null ? Jt(e, !!n, n ? [] : ``, !1) : Jt(e, !!n, t, !0))
              : Jt(e, !!n, p, !1));
          return;
        case `textarea`:
          for (c in ((m = p = null), n))
            if (
              ((a = n[c]),
              n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c))
            )
              switch (c) {
                case `value`:
                  break;
                case `children`:
                  break;
                default:
                  X(e, t, c, null, r, a);
              }
          for (s in r)
            if (
              ((a = r[s]),
              (o = n[s]),
              r.hasOwnProperty(s) && (a != null || o != null))
            )
              switch (s) {
                case `value`:
                  p = a;
                  break;
                case `defaultValue`:
                  m = a;
                  break;
                case `children`:
                  break;
                case `dangerouslySetInnerHTML`:
                  if (a != null) throw Error(i(91));
                  break;
                default:
                  a !== o && X(e, t, s, a, r, o);
              }
          Yt(e, p, m);
          return;
        case `option`:
          for (var h in n)
            if (
              ((p = n[h]),
              n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h))
            )
              switch (h) {
                case `selected`:
                  e.selected = !1;
                  break;
                default:
                  X(e, t, h, null, r, p);
              }
          for (l in r)
            if (
              ((p = r[l]),
              (m = n[l]),
              r.hasOwnProperty(l) && p !== m && (p != null || m != null))
            )
              switch (l) {
                case `selected`:
                  e.selected =
                    p && typeof p != `function` && typeof p != `symbol`;
                  break;
                default:
                  X(e, t, l, p, r, m);
              }
          return;
        case `img`:
        case `link`:
        case `area`:
        case `base`:
        case `br`:
        case `col`:
        case `embed`:
        case `hr`:
        case `keygen`:
        case `meta`:
        case `param`:
        case `source`:
        case `track`:
        case `wbr`:
        case `menuitem`:
          for (var g in n)
            ((p = n[g]),
              n.hasOwnProperty(g) &&
                p != null &&
                !r.hasOwnProperty(g) &&
                X(e, t, g, null, r, p));
          for (u in r)
            if (
              ((p = r[u]),
              (m = n[u]),
              r.hasOwnProperty(u) && p !== m && (p != null || m != null))
            )
              switch (u) {
                case `children`:
                case `dangerouslySetInnerHTML`:
                  if (p != null) throw Error(i(137, t));
                  break;
                default:
                  X(e, t, u, p, r, m);
              }
          return;
        default:
          if (tn(t)) {
            for (var _ in n)
              ((p = n[_]),
                n.hasOwnProperty(_) &&
                  p !== void 0 &&
                  !r.hasOwnProperty(_) &&
                  Id(e, t, _, void 0, r, p));
            for (d in r)
              ((p = r[d]),
                (m = n[d]),
                !r.hasOwnProperty(d) ||
                  p === m ||
                  (p === void 0 && m === void 0) ||
                  Id(e, t, d, p, r, m));
            return;
          }
      }
      for (var v in n)
        ((p = n[v]),
          n.hasOwnProperty(v) &&
            p != null &&
            !r.hasOwnProperty(v) &&
            X(e, t, v, null, r, p));
      for (f in r)
        ((p = r[f]),
          (m = n[f]),
          !r.hasOwnProperty(f) ||
            p === m ||
            (p == null && m == null) ||
            X(e, t, f, p, r, m));
    }
    function zd(e) {
      switch (e) {
        case `css`:
        case `script`:
        case `font`:
        case `img`:
        case `image`:
        case `input`:
        case `link`:
          return !0;
        default:
          return !1;
      }
    }
    function Bd() {
      if (typeof performance.getEntriesByType == `function`) {
        for (
          var e = 0, t = 0, n = performance.getEntriesByType(`resource`), r = 0;
          r < n.length;
          r++
        ) {
          var i = n[r],
            a = i.transferSize,
            o = i.initiatorType,
            s = i.duration;
          if (a && s && zd(o)) {
            for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
              var c = n[r],
                l = c.startTime;
              if (l > s) break;
              var u = c.transferSize,
                d = c.initiatorType;
              u &&
                zd(d) &&
                ((c = c.responseEnd),
                (o += u * (c < s ? 1 : (s - l) / (c - l))));
            }
            if ((--r, (t += (8 * (a + o)) / (i.duration / 1e3)), e++, 10 < e))
              break;
          }
        }
        if (0 < e) return t / e / 1e6;
      }
      return navigator.connection &&
        ((e = navigator.connection.downlink), typeof e == `number`)
        ? e
        : 5;
    }
    var Vd = null,
      Hd = null;
    function Ud(e) {
      return e.nodeType === 9 ? e : e.ownerDocument;
    }
    function Wd(e) {
      switch (e) {
        case `http://www.w3.org/2000/svg`:
          return 1;
        case `http://www.w3.org/1998/Math/MathML`:
          return 2;
        default:
          return 0;
      }
    }
    function Gd(e, t) {
      if (e === 0)
        switch (t) {
          case `svg`:
            return 1;
          case `math`:
            return 2;
          default:
            return 0;
        }
      return e === 1 && t === `foreignObject` ? 0 : e;
    }
    function Kd(e, t) {
      return (
        e === `textarea` ||
        e === `noscript` ||
        typeof t.children == `string` ||
        typeof t.children == `number` ||
        typeof t.children == `bigint` ||
        (typeof t.dangerouslySetInnerHTML == `object` &&
          t.dangerouslySetInnerHTML !== null &&
          t.dangerouslySetInnerHTML.__html != null)
      );
    }
    var qd = null;
    function Jd() {
      var e = window.event;
      return e && e.type === `popstate`
        ? e !== qd && ((qd = e), !0)
        : ((qd = null), !1);
    }
    var Yd = typeof setTimeout == `function` ? setTimeout : void 0,
      Xd = typeof clearTimeout == `function` ? clearTimeout : void 0,
      Zd = typeof Promise == `function` ? Promise : void 0,
      Qd =
        typeof queueMicrotask == `function`
          ? queueMicrotask
          : Zd === void 0
            ? Yd
            : function (e) {
                return Zd.resolve(null).then(e).catch($d);
              };
    function $d(e) {
      setTimeout(function () {
        throw e;
      });
    }
    function ef(e) {
      return e === `head`;
    }
    function tf(e, t) {
      var n = t,
        r = 0;
      do {
        var i = n.nextSibling;
        if ((e.removeChild(n), i && i.nodeType === 8))
          if (((n = i.data), n === `/$` || n === `/&`)) {
            if (r === 0) {
              (e.removeChild(i), Ip(t));
              return;
            }
            r--;
          } else if (
            n === `$` ||
            n === `$?` ||
            n === `$~` ||
            n === `$!` ||
            n === `&`
          )
            r++;
          else if (n === `html`) gf(e.ownerDocument.documentElement);
          else if (n === `head`) {
            ((n = e.ownerDocument.head), gf(n));
            for (var a = n.firstChild; a;) {
              var o = a.nextSibling,
                s = a.nodeName;
              (a[yt] ||
                s === `SCRIPT` ||
                s === `STYLE` ||
                (s === `LINK` && a.rel.toLowerCase() === `stylesheet`) ||
                n.removeChild(a),
                (a = o));
            }
          } else n === `body` && gf(e.ownerDocument.body);
        n = i;
      } while (n);
      Ip(t);
    }
    function nf(e, t) {
      var n = e;
      e = 0;
      do {
        var r = n.nextSibling;
        if (
          (n.nodeType === 1
            ? t
              ? ((n._stashedDisplay = n.style.display),
                (n.style.display = `none`))
              : ((n.style.display = n._stashedDisplay || ``),
                n.getAttribute(`style`) === `` && n.removeAttribute(`style`))
            : n.nodeType === 3 &&
              (t
                ? ((n._stashedText = n.nodeValue), (n.nodeValue = ``))
                : (n.nodeValue = n._stashedText || ``)),
          r && r.nodeType === 8)
        )
          if (((n = r.data), n === `/$`)) {
            if (e === 0) break;
            e--;
          } else (n !== `$` && n !== `$?` && n !== `$~` && n !== `$!`) || e++;
        n = r;
      } while (n);
    }
    function rf(e) {
      var t = e.firstChild;
      for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
        var n = t;
        switch (((t = t.nextSibling), n.nodeName)) {
          case `HTML`:
          case `HEAD`:
          case `BODY`:
            (rf(n), bt(n));
            continue;
          case `SCRIPT`:
          case `STYLE`:
            continue;
          case `LINK`:
            if (n.rel.toLowerCase() === `stylesheet`) continue;
        }
        e.removeChild(n);
      }
    }
    function af(e, t, n, r) {
      for (; e.nodeType === 1;) {
        var i = n;
        if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
          if (!r && (e.nodeName !== `INPUT` || e.type !== `hidden`)) break;
        } else if (!r)
          if (t === `input` && e.type === `hidden`) {
            var a = i.name == null ? null : `` + i.name;
            if (i.type === `hidden` && e.getAttribute(`name`) === a) return e;
          } else return e;
        else if (!e[yt])
          switch (t) {
            case `meta`:
              if (!e.hasAttribute(`itemprop`)) break;
              return e;
            case `link`:
              if (
                ((a = e.getAttribute(`rel`)),
                (a === `stylesheet` && e.hasAttribute(`data-precedence`)) ||
                  a !== i.rel ||
                  e.getAttribute(`href`) !==
                    (i.href == null || i.href === `` ? null : i.href) ||
                  e.getAttribute(`crossorigin`) !==
                    (i.crossOrigin == null ? null : i.crossOrigin) ||
                  e.getAttribute(`title`) !==
                    (i.title == null ? null : i.title))
              )
                break;
              return e;
            case `style`:
              if (e.hasAttribute(`data-precedence`)) break;
              return e;
            case `script`:
              if (
                ((a = e.getAttribute(`src`)),
                (a !== (i.src == null ? null : i.src) ||
                  e.getAttribute(`type`) !== (i.type == null ? null : i.type) ||
                  e.getAttribute(`crossorigin`) !==
                    (i.crossOrigin == null ? null : i.crossOrigin)) &&
                  a &&
                  e.hasAttribute(`async`) &&
                  !e.hasAttribute(`itemprop`))
              )
                break;
              return e;
            default:
              return e;
          }
        if (((e = df(e.nextSibling)), e === null)) break;
      }
      return null;
    }
    function of(e, t, n) {
      if (t === ``) return null;
      for (; e.nodeType !== 3;)
        if (
          ((e.nodeType !== 1 ||
            e.nodeName !== `INPUT` ||
            e.type !== `hidden`) &&
            !n) ||
          ((e = df(e.nextSibling)), e === null)
        )
          return null;
      return e;
    }
    function sf(e, t) {
      for (; e.nodeType !== 8;)
        if (
          ((e.nodeType !== 1 ||
            e.nodeName !== `INPUT` ||
            e.type !== `hidden`) &&
            !t) ||
          ((e = df(e.nextSibling)), e === null)
        )
          return null;
      return e;
    }
    function cf(e) {
      return e.data === `$?` || e.data === `$~`;
    }
    function lf(e) {
      return (
        e.data === `$!` ||
        (e.data === `$?` && e.ownerDocument.readyState !== `loading`)
      );
    }
    function uf(e, t) {
      var n = e.ownerDocument;
      if (e.data === `$~`) e._reactRetry = t;
      else if (e.data !== `$?` || n.readyState !== `loading`) t();
      else {
        var r = function () {
          (t(), n.removeEventListener(`DOMContentLoaded`, r));
        };
        (n.addEventListener(`DOMContentLoaded`, r), (e._reactRetry = r));
      }
    }
    function df(e) {
      for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === 1 || t === 3) break;
        if (t === 8) {
          if (
            ((t = e.data),
            t === `$` ||
              t === `$!` ||
              t === `$?` ||
              t === `$~` ||
              t === `&` ||
              t === `F!` ||
              t === `F`)
          )
            break;
          if (t === `/$` || t === `/&`) return null;
        }
      }
      return e;
    }
    var ff = null;
    function pf(e) {
      e = e.nextSibling;
      for (var t = 0; e;) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === `/$` || n === `/&`) {
            if (t === 0) return df(e.nextSibling);
            t--;
          } else
            (n !== `$` &&
              n !== `$!` &&
              n !== `$?` &&
              n !== `$~` &&
              n !== `&`) ||
              t++;
        }
        e = e.nextSibling;
      }
      return null;
    }
    function mf(e) {
      e = e.previousSibling;
      for (var t = 0; e;) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (
            n === `$` ||
            n === `$!` ||
            n === `$?` ||
            n === `$~` ||
            n === `&`
          ) {
            if (t === 0) return e;
            t--;
          } else (n !== `/$` && n !== `/&`) || t++;
        }
        e = e.previousSibling;
      }
      return null;
    }
    function hf(e, t, n) {
      switch (((t = Ud(n)), e)) {
        case `html`:
          if (((e = t.documentElement), !e)) throw Error(i(452));
          return e;
        case `head`:
          if (((e = t.head), !e)) throw Error(i(453));
          return e;
        case `body`:
          if (((e = t.body), !e)) throw Error(i(454));
          return e;
        default:
          throw Error(i(451));
      }
    }
    function gf(e) {
      for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
      bt(e);
    }
    var _f = new Map(),
      vf = new Set();
    function yf(e) {
      return typeof e.getRootNode == `function`
        ? e.getRootNode()
        : e.nodeType === 9
          ? e
          : e.ownerDocument;
    }
    var bf = O.d;
    O.d = { f: xf, r: Sf, D: Tf, C: Ef, L: Df, m: Of, X: Af, S: kf, M: jf };
    function xf() {
      var e = bf.f(),
        t = wu();
      return e || t;
    }
    function Sf(e) {
      var t = St(e);
      t !== null && t.tag === 5 && t.type === `form` ? ks(t) : bf.r(e);
    }
    var Cf = typeof document > `u` ? null : document;
    function wf(e, t, n) {
      var r = Cf;
      if (r && typeof t == `string` && t) {
        var i = Wt(t);
        ((i = `link[rel="` + e + `"][href="` + i + `"]`),
          typeof n == `string` && (i += `[crossorigin="` + n + `"]`),
          vf.has(i) ||
            (vf.add(i),
            (e = { rel: e, crossOrigin: n, href: t }),
            r.querySelector(i) === null &&
              ((t = r.createElement(`link`)),
              Ld(t, `link`, e),
              Tt(t),
              r.head.appendChild(t))));
      }
    }
    function Tf(e) {
      (bf.D(e), wf(`dns-prefetch`, e, null));
    }
    function Ef(e, t) {
      (bf.C(e, t), wf(`preconnect`, e, t));
    }
    function Df(e, t, n) {
      bf.L(e, t, n);
      var r = Cf;
      if (r && e && t) {
        var i = `link[rel="preload"][as="` + Wt(t) + `"]`;
        t === `image` && n && n.imageSrcSet
          ? ((i += `[imagesrcset="` + Wt(n.imageSrcSet) + `"]`),
            typeof n.imageSizes == `string` &&
              (i += `[imagesizes="` + Wt(n.imageSizes) + `"]`))
          : (i += `[href="` + Wt(e) + `"]`);
        var a = i;
        switch (t) {
          case `style`:
            a = Nf(e);
            break;
          case `script`:
            a = Lf(e);
        }
        _f.has(a) ||
          ((e = h(
            {
              rel: `preload`,
              href: t === `image` && n && n.imageSrcSet ? void 0 : e,
              as: t,
            },
            n,
          )),
          _f.set(a, e),
          r.querySelector(i) !== null ||
            (t === `style` && r.querySelector(Pf(a))) ||
            (t === `script` && r.querySelector(Rf(a))) ||
            ((t = r.createElement(`link`)),
            Ld(t, `link`, e),
            Tt(t),
            r.head.appendChild(t)));
      }
    }
    function Of(e, t) {
      bf.m(e, t);
      var n = Cf;
      if (n && e) {
        var r = t && typeof t.as == `string` ? t.as : `script`,
          i =
            `link[rel="modulepreload"][as="` +
            Wt(r) +
            `"][href="` +
            Wt(e) +
            `"]`,
          a = i;
        switch (r) {
          case `audioworklet`:
          case `paintworklet`:
          case `serviceworker`:
          case `sharedworker`:
          case `worker`:
          case `script`:
            a = Lf(e);
        }
        if (
          !_f.has(a) &&
          ((e = h({ rel: `modulepreload`, href: e }, t)),
          _f.set(a, e),
          n.querySelector(i) === null)
        ) {
          switch (r) {
            case `audioworklet`:
            case `paintworklet`:
            case `serviceworker`:
            case `sharedworker`:
            case `worker`:
            case `script`:
              if (n.querySelector(Rf(a))) return;
          }
          ((r = n.createElement(`link`)),
            Ld(r, `link`, e),
            Tt(r),
            n.head.appendChild(r));
        }
      }
    }
    function kf(e, t, n) {
      bf.S(e, t, n);
      var r = Cf;
      if (r && e) {
        var i = wt(r).hoistableStyles,
          a = Nf(e);
        t ||= `default`;
        var o = i.get(a);
        if (!o) {
          var s = { loading: 0, preload: null };
          if ((o = r.querySelector(Pf(a)))) s.loading = 5;
          else {
            ((e = h({ rel: `stylesheet`, href: e, "data-precedence": t }, n)),
              (n = _f.get(a)) && Vf(e, n));
            var c = (o = r.createElement(`link`));
            (Tt(c),
              Ld(c, `link`, e),
              (c._p = new Promise(function (e, t) {
                ((c.onload = e), (c.onerror = t));
              })),
              c.addEventListener(`load`, function () {
                s.loading |= 1;
              }),
              c.addEventListener(`error`, function () {
                s.loading |= 2;
              }),
              (s.loading |= 4),
              Bf(o, t, r));
          }
          ((o = { type: `stylesheet`, instance: o, count: 1, state: s }),
            i.set(a, o));
        }
      }
    }
    function Af(e, t) {
      bf.X(e, t);
      var n = Cf;
      if (n && e) {
        var r = wt(n).hoistableScripts,
          i = Lf(e),
          a = r.get(i);
        a ||
          ((a = n.querySelector(Rf(i))),
          a ||
            ((e = h({ src: e, async: !0 }, t)),
            (t = _f.get(i)) && Hf(e, t),
            (a = n.createElement(`script`)),
            Tt(a),
            Ld(a, `link`, e),
            n.head.appendChild(a)),
          (a = { type: `script`, instance: a, count: 1, state: null }),
          r.set(i, a));
      }
    }
    function jf(e, t) {
      bf.M(e, t);
      var n = Cf;
      if (n && e) {
        var r = wt(n).hoistableScripts,
          i = Lf(e),
          a = r.get(i);
        a ||
          ((a = n.querySelector(Rf(i))),
          a ||
            ((e = h({ src: e, async: !0, type: `module` }, t)),
            (t = _f.get(i)) && Hf(e, t),
            (a = n.createElement(`script`)),
            Tt(a),
            Ld(a, `link`, e),
            n.head.appendChild(a)),
          (a = { type: `script`, instance: a, count: 1, state: null }),
          r.set(i, a));
      }
    }
    function Mf(e, t, n, r) {
      var a = (a = pe.current) ? yf(a) : null;
      if (!a) throw Error(i(446));
      switch (e) {
        case `meta`:
        case `title`:
          return null;
        case `style`:
          return typeof n.precedence == `string` && typeof n.href == `string`
            ? ((t = Nf(n.href)),
              (n = wt(a).hoistableStyles),
              (r = n.get(t)),
              r ||
                ((r = { type: `style`, instance: null, count: 0, state: null }),
                n.set(t, r)),
              r)
            : { type: `void`, instance: null, count: 0, state: null };
        case `link`:
          if (
            n.rel === `stylesheet` &&
            typeof n.href == `string` &&
            typeof n.precedence == `string`
          ) {
            e = Nf(n.href);
            var o = wt(a).hoistableStyles,
              s = o.get(e);
            if (
              (s ||
                ((a = a.ownerDocument || a),
                (s = {
                  type: `stylesheet`,
                  instance: null,
                  count: 0,
                  state: { loading: 0, preload: null },
                }),
                o.set(e, s),
                (o = a.querySelector(Pf(e))) &&
                  !o._p &&
                  ((s.instance = o), (s.state.loading = 5)),
                _f.has(e) ||
                  ((n = {
                    rel: `preload`,
                    as: `style`,
                    href: n.href,
                    crossOrigin: n.crossOrigin,
                    integrity: n.integrity,
                    media: n.media,
                    hrefLang: n.hrefLang,
                    referrerPolicy: n.referrerPolicy,
                  }),
                  _f.set(e, n),
                  o || If(a, e, n, s.state))),
              t && r === null)
            )
              throw Error(i(528, ``));
            return s;
          }
          if (t && r !== null) throw Error(i(529, ``));
          return null;
        case `script`:
          return (
            (t = n.async),
            (n = n.src),
            typeof n == `string` &&
            t &&
            typeof t != `function` &&
            typeof t != `symbol`
              ? ((t = Lf(n)),
                (n = wt(a).hoistableScripts),
                (r = n.get(t)),
                r ||
                  ((r = {
                    type: `script`,
                    instance: null,
                    count: 0,
                    state: null,
                  }),
                  n.set(t, r)),
                r)
              : { type: `void`, instance: null, count: 0, state: null }
          );
        default:
          throw Error(i(444, e));
      }
    }
    function Nf(e) {
      return `href="` + Wt(e) + `"`;
    }
    function Pf(e) {
      return `link[rel="stylesheet"][` + e + `]`;
    }
    function Ff(e) {
      return h({}, e, { "data-precedence": e.precedence, precedence: null });
    }
    function If(e, t, n, r) {
      e.querySelector(`link[rel="preload"][as="style"][` + t + `]`)
        ? (r.loading = 1)
        : ((t = e.createElement(`link`)),
          (r.preload = t),
          t.addEventListener(`load`, function () {
            return (r.loading |= 1);
          }),
          t.addEventListener(`error`, function () {
            return (r.loading |= 2);
          }),
          Ld(t, `link`, n),
          Tt(t),
          e.head.appendChild(t));
    }
    function Lf(e) {
      return `[src="` + Wt(e) + `"]`;
    }
    function Rf(e) {
      return `script[async]` + e;
    }
    function zf(e, t, n) {
      if ((t.count++, t.instance === null))
        switch (t.type) {
          case `style`:
            var r = e.querySelector(`style[data-href~="` + Wt(n.href) + `"]`);
            if (r) return ((t.instance = r), Tt(r), r);
            var a = h({}, n, {
              "data-href": n.href,
              "data-precedence": n.precedence,
              href: null,
              precedence: null,
            });
            return (
              (r = (e.ownerDocument || e).createElement(`style`)),
              Tt(r),
              Ld(r, `style`, a),
              Bf(r, n.precedence, e),
              (t.instance = r)
            );
          case `stylesheet`:
            a = Nf(n.href);
            var o = e.querySelector(Pf(a));
            if (o) return ((t.state.loading |= 4), (t.instance = o), Tt(o), o);
            ((r = Ff(n)),
              (a = _f.get(a)) && Vf(r, a),
              (o = (e.ownerDocument || e).createElement(`link`)),
              Tt(o));
            var s = o;
            return (
              (s._p = new Promise(function (e, t) {
                ((s.onload = e), (s.onerror = t));
              })),
              Ld(o, `link`, r),
              (t.state.loading |= 4),
              Bf(o, n.precedence, e),
              (t.instance = o)
            );
          case `script`:
            return (
              (o = Lf(n.src)),
              (a = e.querySelector(Rf(o)))
                ? ((t.instance = a), Tt(a), a)
                : ((r = n),
                  (a = _f.get(o)) && ((r = h({}, n)), Hf(r, a)),
                  (e = e.ownerDocument || e),
                  (a = e.createElement(`script`)),
                  Tt(a),
                  Ld(a, `link`, r),
                  e.head.appendChild(a),
                  (t.instance = a))
            );
          case `void`:
            return null;
          default:
            throw Error(i(443, t.type));
        }
      else
        t.type === `stylesheet` &&
          !(t.state.loading & 4) &&
          ((r = t.instance), (t.state.loading |= 4), Bf(r, n.precedence, e));
      return t.instance;
    }
    function Bf(e, t, n) {
      for (
        var r = n.querySelectorAll(
            `link[rel="stylesheet"][data-precedence],style[data-precedence]`,
          ),
          i = r.length ? r[r.length - 1] : null,
          a = i,
          o = 0;
        o < r.length;
        o++
      ) {
        var s = r[o];
        if (s.dataset.precedence === t) a = s;
        else if (a !== i) break;
      }
      a
        ? a.parentNode.insertBefore(e, a.nextSibling)
        : ((t = n.nodeType === 9 ? n.head : n),
          t.insertBefore(e, t.firstChild));
    }
    function Vf(e, t) {
      ((e.crossOrigin ??= t.crossOrigin),
        (e.referrerPolicy ??= t.referrerPolicy),
        (e.title ??= t.title));
    }
    function Hf(e, t) {
      ((e.crossOrigin ??= t.crossOrigin),
        (e.referrerPolicy ??= t.referrerPolicy),
        (e.integrity ??= t.integrity));
    }
    var Uf = null;
    function Wf(e, t, n) {
      if (Uf === null) {
        var r = new Map(),
          i = (Uf = new Map());
        i.set(n, r);
      } else ((i = Uf), (r = i.get(n)), r || ((r = new Map()), i.set(n, r)));
      if (r.has(e)) return r;
      for (
        r.set(e, null), n = n.getElementsByTagName(e), i = 0;
        i < n.length;
        i++
      ) {
        var a = n[i];
        if (
          !(
            a[yt] ||
            a[ft] ||
            (e === `link` && a.getAttribute(`rel`) === `stylesheet`)
          ) &&
          a.namespaceURI !== `http://www.w3.org/2000/svg`
        ) {
          var o = a.getAttribute(t) || ``;
          o = e + o;
          var s = r.get(o);
          s ? s.push(a) : r.set(o, [a]);
        }
      }
      return r;
    }
    function Gf(e, t, n) {
      ((e = e.ownerDocument || e),
        e.head.insertBefore(
          n,
          t === `title` ? e.querySelector(`head > title`) : null,
        ));
    }
    function Kf(e, t, n) {
      if (n === 1 || t.itemProp != null) return !1;
      switch (e) {
        case `meta`:
        case `title`:
          return !0;
        case `style`:
          if (
            typeof t.precedence != `string` ||
            typeof t.href != `string` ||
            t.href === ``
          )
            break;
          return !0;
        case `link`:
          if (
            typeof t.rel != `string` ||
            typeof t.href != `string` ||
            t.href === `` ||
            t.onLoad ||
            t.onError
          )
            break;
          switch (t.rel) {
            case `stylesheet`:
              return (
                (e = t.disabled),
                typeof t.precedence == `string` && e == null
              );
            default:
              return !0;
          }
        case `script`:
          if (
            t.async &&
            typeof t.async != `function` &&
            typeof t.async != `symbol` &&
            !t.onLoad &&
            !t.onError &&
            t.src &&
            typeof t.src == `string`
          )
            return !0;
      }
      return !1;
    }
    function qf(e) {
      return !(e.type === `stylesheet` && !(e.state.loading & 3));
    }
    function Jf(e, t, n, r) {
      if (
        n.type === `stylesheet` &&
        (typeof r.media != `string` || !1 !== matchMedia(r.media).matches) &&
        !(n.state.loading & 4)
      ) {
        if (n.instance === null) {
          var i = Nf(r.href),
            a = t.querySelector(Pf(i));
          if (a) {
            ((t = a._p),
              typeof t == `object` &&
                t &&
                typeof t.then == `function` &&
                (e.count++, (e = Zf.bind(e)), t.then(e, e)),
              (n.state.loading |= 4),
              (n.instance = a),
              Tt(a));
            return;
          }
          ((a = t.ownerDocument || t),
            (r = Ff(r)),
            (i = _f.get(i)) && Vf(r, i),
            (a = a.createElement(`link`)),
            Tt(a));
          var o = a;
          ((o._p = new Promise(function (e, t) {
            ((o.onload = e), (o.onerror = t));
          })),
            Ld(a, `link`, r),
            (n.instance = a));
        }
        (e.stylesheets === null && (e.stylesheets = new Map()),
          e.stylesheets.set(n, t),
          (t = n.state.preload) &&
            !(n.state.loading & 3) &&
            (e.count++,
            (n = Zf.bind(e)),
            t.addEventListener(`load`, n),
            t.addEventListener(`error`, n)));
      }
    }
    var Yf = 0;
    function Xf(e, t) {
      return (
        e.stylesheets && e.count === 0 && $f(e, e.stylesheets),
        0 < e.count || 0 < e.imgCount
          ? function (n) {
              var r = setTimeout(function () {
                if ((e.stylesheets && $f(e, e.stylesheets), e.unsuspend)) {
                  var t = e.unsuspend;
                  ((e.unsuspend = null), t());
                }
              }, 6e4 + t);
              0 < e.imgBytes && Yf === 0 && (Yf = 62500 * Bd());
              var i = setTimeout(
                function () {
                  if (
                    ((e.waitingForImages = !1),
                    e.count === 0 &&
                      (e.stylesheets && $f(e, e.stylesheets), e.unsuspend))
                  ) {
                    var t = e.unsuspend;
                    ((e.unsuspend = null), t());
                  }
                },
                (e.imgBytes > Yf ? 50 : 800) + t,
              );
              return (
                (e.unsuspend = n),
                function () {
                  ((e.unsuspend = null), clearTimeout(r), clearTimeout(i));
                }
              );
            }
          : null
      );
    }
    function Zf() {
      if (
        (this.count--,
        this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))
      ) {
        if (this.stylesheets) $f(this, this.stylesheets);
        else if (this.unsuspend) {
          var e = this.unsuspend;
          ((this.unsuspend = null), e());
        }
      }
    }
    var Qf = null;
    function $f(e, t) {
      ((e.stylesheets = null),
        e.unsuspend !== null &&
          (e.count++,
          (Qf = new Map()),
          t.forEach(ep, e),
          (Qf = null),
          Zf.call(e)));
    }
    function ep(e, t) {
      if (!(t.state.loading & 4)) {
        var n = Qf.get(e);
        if (n) var r = n.get(null);
        else {
          ((n = new Map()), Qf.set(e, n));
          for (
            var i = e.querySelectorAll(
                `link[data-precedence],style[data-precedence]`,
              ),
              a = 0;
            a < i.length;
            a++
          ) {
            var o = i[a];
            (o.nodeName === `LINK` || o.getAttribute(`media`) !== `not all`) &&
              (n.set(o.dataset.precedence, o), (r = o));
          }
          r && n.set(null, r);
        }
        ((i = t.instance),
          (o = i.getAttribute(`data-precedence`)),
          (a = n.get(o) || r),
          a === r && n.set(null, i),
          n.set(o, i),
          this.count++,
          (r = Zf.bind(this)),
          i.addEventListener(`load`, r),
          i.addEventListener(`error`, r),
          a
            ? a.parentNode.insertBefore(i, a.nextSibling)
            : ((e = e.nodeType === 9 ? e.head : e),
              e.insertBefore(i, e.firstChild)),
          (t.state.loading |= 4));
      }
    }
    var tp = {
      $$typeof: C,
      Provider: null,
      Consumer: null,
      _currentValue: le,
      _currentValue2: le,
      _threadCount: 0,
    };
    function np(e, t, n, r, i, a, o, s, c) {
      ((this.tag = 1),
        (this.containerInfo = e),
        (this.pingCache = this.current = this.pendingChildren = null),
        (this.timeoutHandle = -1),
        (this.callbackNode =
          this.next =
          this.pendingContext =
          this.context =
          this.cancelPendingCommit =
            null),
        (this.callbackPriority = 0),
        (this.expirationTimes = tt(-1)),
        (this.entangledLanes =
          this.shellSuspendCounter =
          this.errorRecoveryDisabledLanes =
          this.expiredLanes =
          this.warmLanes =
          this.pingedLanes =
          this.suspendedLanes =
          this.pendingLanes =
            0),
        (this.entanglements = tt(0)),
        (this.hiddenUpdates = tt(null)),
        (this.identifierPrefix = r),
        (this.onUncaughtError = i),
        (this.onCaughtError = a),
        (this.onRecoverableError = o),
        (this.pooledCache = null),
        (this.pooledCacheLanes = 0),
        (this.formState = c),
        (this.incompleteTransitions = new Map()));
    }
    function rp(e, t, n, r, i, a, o, s, c, l, u, d) {
      return (
        (e = new np(e, t, n, o, c, l, u, d, s)),
        (t = 1),
        !0 === a && (t |= 24),
        (a = pi(3, null, null, t)),
        (e.current = a),
        (a.stateNode = e),
        (t = fa()),
        t.refCount++,
        (e.pooledCache = t),
        t.refCount++,
        (a.memoizedState = { element: r, isDehydrated: n, cache: t }),
        Ua(a),
        e
      );
    }
    function ip(e) {
      return e ? ((e = di), e) : di;
    }
    function ap(e, t, n, r, i, a) {
      ((i = ip(i)),
        r.context === null ? (r.context = i) : (r.pendingContext = i),
        (r = Ga(t)),
        (r.payload = { element: n }),
        (a = a === void 0 ? null : a),
        a !== null && (r.callback = a),
        (n = Ka(e, r, t)),
        n !== null && (yu(n, e, t), qa(n, e, t)));
    }
    function op(e, t) {
      if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
      }
    }
    function sp(e, t) {
      (op(e, t), (e = e.alternate) && op(e, t));
    }
    function cp(e) {
      if (e.tag === 13 || e.tag === 31) {
        var t = ci(e, 67108864);
        (t !== null && yu(t, e, 67108864), sp(e, 67108864));
      }
    }
    function lp(e) {
      if (e.tag === 13 || e.tag === 31) {
        var t = _u();
        t = st(t);
        var n = ci(e, t);
        (n !== null && yu(n, e, t), sp(e, t));
      }
    }
    var up = !0;
    function dp(e, t, n, r) {
      var i = D.T;
      D.T = null;
      var a = O.p;
      try {
        ((O.p = 2), pp(e, t, n, r));
      } finally {
        ((O.p = a), (D.T = i));
      }
    }
    function fp(e, t, n, r) {
      var i = D.T;
      D.T = null;
      var a = O.p;
      try {
        ((O.p = 8), pp(e, t, n, r));
      } finally {
        ((O.p = a), (D.T = i));
      }
    }
    function pp(e, t, n, r) {
      if (up) {
        var i = mp(r);
        if (i === null) (Dd(e, t, r, hp, n), Ep(e, r));
        else if (Op(i, e, t, n, r)) r.stopPropagation();
        else if ((Ep(e, r), t & 4 && -1 < Tp.indexOf(e))) {
          for (; i !== null;) {
            var a = St(i);
            if (a !== null)
              switch (a.tag) {
                case 3:
                  if (
                    ((a = a.stateNode), a.current.memoizedState.isDehydrated)
                  ) {
                    var o = Xe(a.pendingLanes);
                    if (o !== 0) {
                      var s = a;
                      for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
                        var c = 1 << (31 - Ue(o));
                        ((s.entanglements[1] |= c), (o &= ~c));
                      }
                      (od(a), !(V & 6) && ((au = je() + 500), sd(0, !1)));
                    }
                  }
                  break;
                case 31:
                case 13:
                  ((s = ci(a, 2)), s !== null && yu(s, a, 2), wu(), sp(a, 2));
              }
            if (((a = mp(r)), a === null && Dd(e, t, r, hp, n), a === i)) break;
            i = a;
          }
          i !== null && r.stopPropagation();
        } else Dd(e, t, r, null, n);
      }
    }
    function mp(e) {
      return ((e = cn(e)), gp(e));
    }
    var hp = null;
    function gp(e) {
      if (((hp = null), (e = xt(e)), e !== null)) {
        var t = o(e);
        if (t === null) e = null;
        else {
          var n = t.tag;
          if (n === 13) {
            if (((e = s(t)), e !== null)) return e;
            e = null;
          } else if (n === 31) {
            if (((e = c(t)), e !== null)) return e;
            e = null;
          } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated)
              return t.tag === 3 ? t.stateNode.containerInfo : null;
            e = null;
          } else t !== e && (e = null);
        }
      }
      return ((hp = e), null);
    }
    function _p(e) {
      switch (e) {
        case `beforetoggle`:
        case `cancel`:
        case `click`:
        case `close`:
        case `contextmenu`:
        case `copy`:
        case `cut`:
        case `auxclick`:
        case `dblclick`:
        case `dragend`:
        case `dragstart`:
        case `drop`:
        case `focusin`:
        case `focusout`:
        case `input`:
        case `invalid`:
        case `keydown`:
        case `keypress`:
        case `keyup`:
        case `mousedown`:
        case `mouseup`:
        case `paste`:
        case `pause`:
        case `play`:
        case `pointercancel`:
        case `pointerdown`:
        case `pointerup`:
        case `ratechange`:
        case `reset`:
        case `resize`:
        case `seeked`:
        case `submit`:
        case `toggle`:
        case `touchcancel`:
        case `touchend`:
        case `touchstart`:
        case `volumechange`:
        case `change`:
        case `selectionchange`:
        case `textInput`:
        case `compositionstart`:
        case `compositionend`:
        case `compositionupdate`:
        case `beforeblur`:
        case `afterblur`:
        case `beforeinput`:
        case `blur`:
        case `fullscreenchange`:
        case `focus`:
        case `hashchange`:
        case `popstate`:
        case `select`:
        case `selectstart`:
          return 2;
        case `drag`:
        case `dragenter`:
        case `dragexit`:
        case `dragleave`:
        case `dragover`:
        case `mousemove`:
        case `mouseout`:
        case `mouseover`:
        case `pointermove`:
        case `pointerout`:
        case `pointerover`:
        case `scroll`:
        case `touchmove`:
        case `wheel`:
        case `mouseenter`:
        case `mouseleave`:
        case `pointerenter`:
        case `pointerleave`:
          return 8;
        case `message`:
          switch (Me()) {
            case Ne:
              return 2;
            case Pe:
              return 8;
            case Fe:
            case Ie:
              return 32;
            case Le:
              return 268435456;
            default:
              return 32;
          }
        default:
          return 32;
      }
    }
    var vp = !1,
      yp = null,
      bp = null,
      xp = null,
      Sp = new Map(),
      Cp = new Map(),
      wp = [],
      Tp =
        `mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(
          ` `,
        );
    function Ep(e, t) {
      switch (e) {
        case `focusin`:
        case `focusout`:
          yp = null;
          break;
        case `dragenter`:
        case `dragleave`:
          bp = null;
          break;
        case `mouseover`:
        case `mouseout`:
          xp = null;
          break;
        case `pointerover`:
        case `pointerout`:
          Sp.delete(t.pointerId);
          break;
        case `gotpointercapture`:
        case `lostpointercapture`:
          Cp.delete(t.pointerId);
      }
    }
    function Dp(e, t, n, r, i, a) {
      return e === null || e.nativeEvent !== a
        ? ((e = {
            blockedOn: t,
            domEventName: n,
            eventSystemFlags: r,
            nativeEvent: a,
            targetContainers: [i],
          }),
          t !== null && ((t = St(t)), t !== null && cp(t)),
          e)
        : ((e.eventSystemFlags |= r),
          (t = e.targetContainers),
          i !== null && t.indexOf(i) === -1 && t.push(i),
          e);
    }
    function Op(e, t, n, r, i) {
      switch (t) {
        case `focusin`:
          return ((yp = Dp(yp, e, t, n, r, i)), !0);
        case `dragenter`:
          return ((bp = Dp(bp, e, t, n, r, i)), !0);
        case `mouseover`:
          return ((xp = Dp(xp, e, t, n, r, i)), !0);
        case `pointerover`:
          var a = i.pointerId;
          return (Sp.set(a, Dp(Sp.get(a) || null, e, t, n, r, i)), !0);
        case `gotpointercapture`:
          return (
            (a = i.pointerId),
            Cp.set(a, Dp(Cp.get(a) || null, e, t, n, r, i)),
            !0
          );
      }
      return !1;
    }
    function kp(e) {
      var t = xt(e.target);
      if (t !== null) {
        var n = o(t);
        if (n !== null) {
          if (((t = n.tag), t === 13)) {
            if (((t = s(n)), t !== null)) {
              ((e.blockedOn = t),
                ut(e.priority, function () {
                  lp(n);
                }));
              return;
            }
          } else if (t === 31) {
            if (((t = c(n)), t !== null)) {
              ((e.blockedOn = t),
                ut(e.priority, function () {
                  lp(n);
                }));
              return;
            }
          } else if (
            t === 3 &&
            n.stateNode.current.memoizedState.isDehydrated
          ) {
            e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
            return;
          }
        }
      }
      e.blockedOn = null;
    }
    function Ap(e) {
      if (e.blockedOn !== null) return !1;
      for (var t = e.targetContainers; 0 < t.length;) {
        var n = mp(e.nativeEvent);
        if (n === null) {
          n = e.nativeEvent;
          var r = new n.constructor(n.type, n);
          ((sn = r), n.target.dispatchEvent(r), (sn = null));
        } else return ((t = St(n)), t !== null && cp(t), (e.blockedOn = n), !1);
        t.shift();
      }
      return !0;
    }
    function jp(e, t, n) {
      Ap(e) && n.delete(t);
    }
    function Mp() {
      ((vp = !1),
        yp !== null && Ap(yp) && (yp = null),
        bp !== null && Ap(bp) && (bp = null),
        xp !== null && Ap(xp) && (xp = null),
        Sp.forEach(jp),
        Cp.forEach(jp));
    }
    function Np(e, n) {
      e.blockedOn === n &&
        ((e.blockedOn = null),
        vp ||
          ((vp = !0),
          t.unstable_scheduleCallback(t.unstable_NormalPriority, Mp)));
    }
    var Pp = null;
    function Fp(e) {
      Pp !== e &&
        ((Pp = e),
        t.unstable_scheduleCallback(t.unstable_NormalPriority, function () {
          Pp === e && (Pp = null);
          for (var t = 0; t < e.length; t += 3) {
            var n = e[t],
              r = e[t + 1],
              i = e[t + 2];
            if (typeof r != `function`) {
              if (gp(r || n) === null) continue;
              break;
            }
            var a = St(n);
            a !== null &&
              (e.splice(t, 3),
              (t -= 3),
              Ds(
                a,
                { pending: !0, data: i, method: n.method, action: r },
                r,
                i,
              ));
          }
        }));
    }
    function Ip(e) {
      function t(t) {
        return Np(t, e);
      }
      (yp !== null && Np(yp, e),
        bp !== null && Np(bp, e),
        xp !== null && Np(xp, e),
        Sp.forEach(t),
        Cp.forEach(t));
      for (var n = 0; n < wp.length; n++) {
        var r = wp[n];
        r.blockedOn === e && (r.blockedOn = null);
      }
      for (; 0 < wp.length && ((n = wp[0]), n.blockedOn === null);)
        (kp(n), n.blockedOn === null && wp.shift());
      if (((n = (e.ownerDocument || e).$$reactFormReplay), n != null))
        for (r = 0; r < n.length; r += 3) {
          var i = n[r],
            a = n[r + 1],
            o = i[pt] || null;
          if (typeof a == `function`) o || Fp(n);
          else if (o) {
            var s = null;
            if (a && a.hasAttribute(`formAction`)) {
              if (((i = a), (o = a[pt] || null))) s = o.formAction;
              else if (gp(i) !== null) continue;
            } else s = o.action;
            (typeof s == `function`
              ? (n[r + 1] = s)
              : (n.splice(r, 3), (r -= 3)),
              Fp(n));
          }
        }
    }
    function Lp() {
      function e(e) {
        e.canIntercept &&
          e.info === `react-transition` &&
          e.intercept({
            handler: function () {
              return new Promise(function (e) {
                return (i = e);
              });
            },
            focusReset: `manual`,
            scroll: `manual`,
          });
      }
      function t() {
        (i !== null && (i(), (i = null)), r || setTimeout(n, 20));
      }
      function n() {
        if (!r && !navigation.transition) {
          var e = navigation.currentEntry;
          e &&
            e.url != null &&
            navigation.navigate(e.url, {
              state: e.getState(),
              info: `react-transition`,
              history: `replace`,
            });
        }
      }
      if (typeof navigation == `object`) {
        var r = !1,
          i = null;
        return (
          navigation.addEventListener(`navigate`, e),
          navigation.addEventListener(`navigatesuccess`, t),
          navigation.addEventListener(`navigateerror`, t),
          setTimeout(n, 100),
          function () {
            ((r = !0),
              navigation.removeEventListener(`navigate`, e),
              navigation.removeEventListener(`navigatesuccess`, t),
              navigation.removeEventListener(`navigateerror`, t),
              i !== null && (i(), (i = null)));
          }
        );
      }
    }
    function Rp(e) {
      this._internalRoot = e;
    }
    ((zp.prototype.render = Rp.prototype.render =
      function (e) {
        var t = this._internalRoot;
        if (t === null) throw Error(i(409));
        var n = t.current;
        ap(n, _u(), e, t, null, null);
      }),
      (zp.prototype.unmount = Rp.prototype.unmount =
        function () {
          var e = this._internalRoot;
          if (e !== null) {
            this._internalRoot = null;
            var t = e.containerInfo;
            (ap(e.current, 2, null, e, null, null), wu(), (t[mt] = null));
          }
        }));
    function zp(e) {
      this._internalRoot = e;
    }
    zp.prototype.unstable_scheduleHydration = function (e) {
      if (e) {
        var t = lt();
        e = { blockedOn: null, target: e, priority: t };
        for (var n = 0; n < wp.length && t !== 0 && t < wp[n].priority; n++);
        (wp.splice(n, 0, e), n === 0 && kp(e));
      }
    };
    var Bp = n.version;
    if (Bp !== `19.2.8`) throw Error(i(527, Bp, `19.2.8`));
    O.findDOMNode = function (e) {
      var t = e._reactInternals;
      if (t === void 0)
        throw typeof e.render == `function`
          ? Error(i(188))
          : ((e = Object.keys(e).join(`,`)), Error(i(268, e)));
      return (
        (e = d(t)),
        (e = e === null ? null : p(e)),
        (e = e === null ? null : e.stateNode),
        e
      );
    };
    var Vp = {
      bundleType: 0,
      version: `19.2.8`,
      rendererPackageName: `react-dom`,
      currentDispatcherRef: D,
      reconcilerVersion: `19.2.8`,
    };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < `u`) {
      var Hp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!Hp.isDisabled && Hp.supportsFiber)
        try {
          ((Be = Hp.inject(Vp)), (Ve = Hp));
        } catch {}
    }
    e.createRoot = function (e, t) {
      if (!a(e)) throw Error(i(299));
      var n = !1,
        r = ``,
        o = Xs,
        s = Zs,
        c = Qs;
      return (
        t != null &&
          (!0 === t.unstable_strictMode && (n = !0),
          t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
          t.onUncaughtError !== void 0 && (o = t.onUncaughtError),
          t.onCaughtError !== void 0 && (s = t.onCaughtError),
          t.onRecoverableError !== void 0 && (c = t.onRecoverableError)),
        (t = rp(e, 1, !1, null, null, n, r, null, o, s, c, Lp)),
        (e[mt] = t.current),
        Td(e),
        new Rp(t)
      );
    };
  }),
  g = o((e, t) => {
    function n() {
      if (!(
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` ||
        typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`
      ))
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
        } catch (e) {
          console.error(e);
        }
    }
    (n(), (t.exports = h()));
  }),
  _ = `modulepreload`,
  v = function (e) {
    return `/` + e;
  },
  y = {},
  b = function (e, t, n) {
    let r = Promise.resolve();
    if (t && t.length > 0) {
      let e = document.getElementsByTagName(`link`),
        i = document.querySelector(`meta[property=csp-nonce]`),
        a = i?.nonce || i?.getAttribute(`nonce`);
      function o(e) {
        return Promise.all(
          e.map((e) =>
            Promise.resolve(e).then(
              (e) => ({ status: `fulfilled`, value: e }),
              (e) => ({ status: `rejected`, reason: e }),
            ),
          ),
        );
      }
      function s(e) {
        return import.meta.resolve
          ? import.meta.resolve(e)
          : new URL(e, import.meta.url).href;
      }
      r = o(
        t.map((t) => {
          if (((t = v(t, n)), (t = s(t)), t in y)) return;
          y[t] = !0;
          let r = t.endsWith(`.css`);
          for (let n = e.length - 1; n >= 0; n--) {
            let i = e[n];
            if (i.href === t && (!r || i.rel === `stylesheet`)) return;
          }
          let i = document.createElement(`link`);
          if (
            ((i.rel = r ? `stylesheet` : _),
            r || (i.as = `script`),
            (i.crossOrigin = ``),
            (i.href = t),
            a && i.setAttribute(`nonce`, a),
            document.head.appendChild(i),
            r)
          )
            return new Promise((e, n) => {
              (i.addEventListener(`load`, e),
                i.addEventListener(`error`, () =>
                  n(Error(`Unable to preload CSS for ${t}`)),
                ));
            });
        }),
      );
    }
    function i(e) {
      let t = new Event(`vite:preloadError`, { cancelable: !0 });
      if (((t.payload = e), window.dispatchEvent(t), !t.defaultPrevented))
        throw e;
    }
    return r.then((t) => {
      for (let e of t || []) e.status === `rejected` && i(e.reason);
      return e().catch(i);
    });
  },
  x = c(f(), 1),
  S = /^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i,
  C = /^[\\/]{2}/;
function w(e, t) {
  return t + e.replace(/\\/g, `/`);
}
var T = `popstate`;
function ee(e) {
  return (
    typeof e == `object` &&
    !!e &&
    `pathname` in e &&
    `search` in e &&
    `hash` in e &&
    `state` in e &&
    `key` in e
  );
}
function te(e = {}) {
  function t(e, t) {
    let n = t.state?.masked,
      { pathname: r, search: i, hash: a } = n || e.location;
    return ae(
      ``,
      { pathname: r, search: i, hash: a },
      (t.state && t.state.usr) || null,
      (t.state && t.state.key) || `default`,
      n
        ? {
            pathname: e.location.pathname,
            search: e.location.search,
            hash: e.location.hash,
          }
        : void 0,
    );
  }
  function n(e, t) {
    return typeof t == `string` ? t : oe(t);
  }
  return ce(t, n, null, e);
}
function E(e, t) {
  if (e === !1 || e == null) throw Error(t);
}
function ne(e, t) {
  if (!e) {
    typeof console < `u` && console.warn(t);
    try {
      throw Error(t);
    } catch {}
  }
}
function re() {
  return Math.random().toString(36).substring(2, 10);
}
function ie(e, t) {
  return {
    usr: e.state,
    key: e.key,
    idx: t,
    masked: e.mask
      ? { pathname: e.pathname, search: e.search, hash: e.hash }
      : void 0,
  };
}
function ae(e, t, n = null, r, i) {
  return {
    pathname: typeof e == `string` ? e : e.pathname,
    search: ``,
    hash: ``,
    ...(typeof t == `string` ? se(t) : t),
    state: n,
    key: (t && t.key) || r || re(),
    mask: i,
  };
}
function oe({ pathname: e = `/`, search: t = ``, hash: n = `` }) {
  return (
    t && t !== `?` && (e += t.charAt(0) === `?` ? t : `?` + t),
    n && n !== `#` && (e += n.charAt(0) === `#` ? n : `#` + n),
    e
  );
}
function se(e) {
  let t = {};
  if (e) {
    let n = e.indexOf(`#`);
    n >= 0 && ((t.hash = e.substring(n)), (e = e.substring(0, n)));
    let r = e.indexOf(`?`);
    (r >= 0 && ((t.search = e.substring(r)), (e = e.substring(0, r))),
      e && (t.pathname = e));
  }
  return t;
}
function ce(e, t, n, r = {}) {
  let { window: i = document.defaultView, v5Compat: a = !1 } = r,
    o = i.history,
    s = `POP`,
    c = null,
    l = u();
  l ?? ((l = 0), o.replaceState({ ...o.state, idx: l }, ``));
  function u() {
    return (o.state || { idx: null }).idx;
  }
  function d() {
    s = `POP`;
    let e = u(),
      t = e == null ? null : e - l;
    ((l = e), c && c({ action: s, location: h.location, delta: t }));
  }
  function f(e, t) {
    s = `PUSH`;
    let r = ee(e) ? e : ae(h.location, e, t);
    (n && n(r, e), (l = u() + 1));
    let d = ie(r, l),
      f = h.createHref(r.mask || r);
    try {
      o.pushState(d, ``, f);
    } catch (e) {
      if (e instanceof DOMException && e.name === `DataCloneError`) throw e;
      i.location.assign(f);
    }
    a && c && c({ action: s, location: h.location, delta: 1 });
  }
  function p(e, t) {
    s = `REPLACE`;
    let r = ee(e) ? e : ae(h.location, e, t);
    (n && n(r, e), (l = u()));
    let i = ie(r, l),
      d = h.createHref(r.mask || r);
    (o.replaceState(i, ``, d),
      a && c && c({ action: s, location: h.location, delta: 0 }));
  }
  function m(e) {
    return D(i, e);
  }
  let h = {
    get action() {
      return s;
    },
    get location() {
      return e(i, o);
    },
    listen(e) {
      if (c) throw Error(`A history only accepts one active listener`);
      return (
        i.addEventListener(T, d),
        (c = e),
        () => {
          (i.removeEventListener(T, d), (c = null));
        }
      );
    },
    createHref(e) {
      return t(i, e);
    },
    createURL: m,
    encodeLocation(e) {
      let t = m(e);
      return { pathname: t.pathname, search: t.search, hash: t.hash };
    },
    push: f,
    replace: p,
    go(e) {
      return o.go(e);
    },
  };
  return h;
}
function D(e, t, n = !1) {
  let r = `http://localhost`;
  (e &&
    (r = e.location.origin === `null` ? e.location.href : e.location.origin),
    E(r, `No window.location.(origin|href) available to create URL`));
  let i = typeof t == `string` ? t : oe(t);
  return (
    (i = i.replace(/ $/, `%20`)),
    !n && C.test(i) && (i = r + i),
    new URL(i, r)
  );
}
function O(e, t, n = `/`) {
  return le(e, t, n, !1);
}
function le(e, t, n, r, i) {
  let a = we((typeof t == `string` ? se(t) : t).pathname || `/`, n);
  if (a == null) return null;
  let o = i ?? ue(e),
    s = null,
    c = Ce(a);
  for (let e = 0; s == null && e < o.length; ++e) s = ye(o[e], c, r);
  return s;
}
function ue(e) {
  let t = de(e);
  return (A(t), t);
}
function de(e, t = [], n = [], r = ``, i = !1) {
  let a = (e, a, o = i, s) => {
    let c = {
      relativePath: s === void 0 ? e.path || `` : s,
      caseSensitive: e.caseSensitive === !0,
      childrenIndex: a,
      route: e,
    };
    if (c.relativePath.startsWith(`/`)) {
      if (!c.relativePath.startsWith(r) && o) return;
      (E(
        c.relativePath.startsWith(r),
        `Absolute route path "${c.relativePath}" nested under path "${r}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`,
      ),
        (c.relativePath = c.relativePath.slice(r.length)));
    }
    let l = Me([r, c.relativePath]),
      u = n.concat(c);
    (e.children &&
      e.children.length > 0 &&
      (E(
        e.index !== !0,
        `Index routes must not have child routes. Please remove all child routes from route path "${l}".`,
      ),
      de(e.children, t, u, l, o)),
      !(e.path == null && !e.index) &&
        t.push({
          path: l,
          score: _e(l, e.index),
          routesMeta: u.map((e, t) => {
            let [n, r] = Se(
              e.relativePath,
              e.caseSensitive,
              t === u.length - 1,
            );
            return { ...e, matcher: n, compiledParams: r };
          }),
        }));
  };
  return (
    e.forEach((e, t) => {
      if (e.path === `` || !e.path?.includes(`?`)) a(e, t);
      else for (let n of k(e.path)) a(e, t, !0, n);
    }),
    t
  );
}
function k(e) {
  let t = e.split(`/`);
  if (t.length === 0) return [];
  let [n, ...r] = t,
    i = n.endsWith(`?`),
    a = n.replace(/\?$/, ``);
  if (r.length === 0) return i ? [a, ``] : [a];
  let o = k(r.join(`/`)),
    s = [];
  return (
    s.push(...o.map((e) => (e === `` ? a : [a, e].join(`/`)))),
    i && s.push(...o),
    s.map((t) => (e.startsWith(`/`) && t === `` ? `/` : t))
  );
}
function A(e) {
  e.sort((e, t) =>
    e.score === t.score
      ? ve(
          e.routesMeta.map((e) => e.childrenIndex),
          t.routesMeta.map((e) => e.childrenIndex),
        )
      : t.score - e.score,
  );
}
var j = /^:[\w-]+$/,
  fe = 3,
  M = 2,
  pe = 1,
  me = 10,
  he = -2,
  ge = (e) => e === `*`;
function _e(e, t) {
  let n = e.split(`/`),
    r = n.length;
  return (
    n.some(ge) && (r += he),
    t && (r += M),
    n
      .filter((e) => !ge(e))
      .reduce((e, t) => e + (j.test(t) ? fe : t === `` ? pe : me), r)
  );
}
function ve(e, t) {
  return e.length === t.length && e.slice(0, -1).every((e, n) => e === t[n])
    ? e[e.length - 1] - t[t.length - 1]
    : 0;
}
function ye(e, t, n = !1) {
  let { routesMeta: r } = e,
    i = {},
    a = `/`,
    o = [];
  for (let e = 0; e < r.length; ++e) {
    let s = r[e],
      c = e === r.length - 1,
      l = a === `/` ? t : t.slice(a.length) || `/`,
      u = { path: s.relativePath, caseSensitive: s.caseSensitive, end: c },
      d =
        s.matcher && s.compiledParams
          ? xe(u, l, s.matcher, s.compiledParams)
          : be(u, l),
      f = s.route;
    if (
      (!d &&
        c &&
        n &&
        !r[r.length - 1].route.index &&
        (d = be(
          { path: s.relativePath, caseSensitive: s.caseSensitive, end: !1 },
          l,
        )),
      !d)
    )
      return null;
    (Object.assign(i, d.params),
      o.push({
        params: i,
        pathname: Me([a, d.pathname]),
        pathnameBase: Pe(Me([a, d.pathnameBase])),
        route: f,
      }),
      d.pathnameBase !== `/` && (a = Me([a, d.pathnameBase])));
  }
  return o;
}
function be(e, t) {
  typeof e == `string` && (e = { path: e, caseSensitive: !1, end: !0 });
  let [n, r] = Se(e.path, e.caseSensitive, e.end);
  return xe(e, t, n, r);
}
function xe(e, t, n, r) {
  let i = t.match(n);
  if (!i) return null;
  let a = i[0],
    o = a.replace(/(.)\/+$/, `$1`),
    s = i.slice(1);
  return {
    params: r.reduce((e, { paramName: t, isOptional: n }, r) => {
      if (t === `*`) {
        let e = s[r] || ``;
        o = a.slice(0, a.length - e.length).replace(/(.)\/+$/, `$1`);
      }
      let i = s[r];
      return ((e[t] = n && !i ? void 0 : (i || ``).replace(/%2F/g, `/`)), e);
    }, {}),
    pathname: a,
    pathnameBase: o,
    pattern: e,
  };
}
function Se(e, t = !1, n = !0) {
  ne(
    e === `*` || !e.endsWith(`*`) || e.endsWith(`/*`),
    `Route path "${e}" will be treated as if it were "${e.replace(/\*$/, `/*`)}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${e.replace(/\*$/, `/*`)}".`,
  );
  let r = [],
    i =
      `^` +
      e
        .replace(/\/*\*?$/, ``)
        .replace(/^\/*/, `/`)
        .replace(/[\\.*+^${}|()[\]]/g, `\\$&`)
        .replace(/\/:([\w-]+)(\?)?/g, (e, t, n, i, a) => {
          if ((r.push({ paramName: t, isOptional: n != null }), n)) {
            let t = a.charAt(i + e.length);
            return t && t !== `/` ? `/([^\\/]*)` : `(?:/([^\\/]*))?`;
          }
          return `/([^\\/]+)`;
        })
        .replace(/\/([\w-]+)\?(\/|$)/g, `(/$1)?$2`);
  return (
    e.endsWith(`*`)
      ? (r.push({ paramName: `*` }),
        (i += e === `*` || e === `/*` ? `(.*)$` : `(?:\\/(.+)|\\/*)$`))
      : n
        ? (i += `\\/*$`)
        : e !== `` && e !== `/` && (i += `(?:(?=\\/|$))`),
    [new RegExp(i, t ? void 0 : `i`), r]
  );
}
function Ce(e) {
  try {
    return e
      .split(`/`)
      .map((e) => decodeURIComponent(e).replace(/\//g, `%2F`))
      .join(`/`);
  } catch (t) {
    return (
      ne(
        !1,
        `The URL path "${e}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${t}).`,
      ),
      e
    );
  }
}
function we(e, t) {
  if (t === `/`) return e;
  if (!e.toLowerCase().startsWith(t.toLowerCase())) return null;
  let n = t.endsWith(`/`) ? t.length - 1 : t.length,
    r = e.charAt(n);
  return r && r !== `/` ? null : e.slice(n) || `/`;
}
function Te(e, t = `/`) {
  let {
      pathname: n,
      search: r = ``,
      hash: i = ``,
    } = typeof e == `string` ? se(e) : e,
    a;
  return (
    n
      ? ((n = je(n)),
        (a = n.startsWith(`/`) ? Ee(n.substring(1), `/`) : Ee(n, t)))
      : (a = t),
    { pathname: a, search: Fe(r), hash: Ie(i) }
  );
}
function Ee(e, t) {
  let n = Ne(t).split(`/`);
  return (
    e.split(`/`).forEach((e) => {
      e === `..` ? n.length > 1 && n.pop() : e !== `.` && n.push(e);
    }),
    n.length > 1 ? n.join(`/`) : `/`
  );
}
function De(e, t, n, r) {
  return `Cannot include a '${e}' character in a manually specified \`to.${t}\` field [${JSON.stringify(r)}].  Please separate it out to the \`to.${n}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
}
function Oe(e) {
  return e.filter(
    (e, t) => t === 0 || (e.route.path && e.route.path.length > 0),
  );
}
function ke(e) {
  let t = Oe(e);
  return t.map((e, n) => (n === t.length - 1 ? e.pathname : e.pathnameBase));
}
function Ae(e, t, n, r = !1) {
  let i;
  typeof e == `string`
    ? (i = se(e))
    : ((i = { ...e }),
      E(
        !i.pathname || !i.pathname.includes(`?`),
        De(`?`, `pathname`, `search`, i),
      ),
      E(
        !i.pathname || !i.pathname.includes(`#`),
        De(`#`, `pathname`, `hash`, i),
      ),
      E(!i.search || !i.search.includes(`#`), De(`#`, `search`, `hash`, i)));
  let a = e === `` || i.pathname === ``,
    o = a ? `/` : i.pathname,
    s;
  if (o == null) s = n;
  else {
    let e = t.length - 1;
    if (!r && o.startsWith(`..`)) {
      let t = o.split(`/`);
      for (; t[0] === `..`;) (t.shift(), --e);
      i.pathname = t.join(`/`);
    }
    s = e >= 0 ? t[e] : `/`;
  }
  let c = Te(i, s),
    l = o && o !== `/` && o.endsWith(`/`),
    u = (a || o === `.`) && n.endsWith(`/`);
  return (!c.pathname.endsWith(`/`) && (l || u) && (c.pathname += `/`), c);
}
var je = (e) => e.replace(/[\\/]{2,}/g, `/`),
  Me = (e) => je(e.join(`/`)),
  Ne = (e) => e.replace(/\/+$/, ``),
  Pe = (e) => Ne(e).replace(/^\/*/, `/`),
  Fe = (e) => (!e || e === `?` ? `` : e.startsWith(`?`) ? e : `?` + e),
  Ie = (e) => (!e || e === `#` ? `` : e.startsWith(`#`) ? e : `#` + e),
  Le = class {
    constructor(e, t, n, r = !1) {
      ((this.status = e),
        (this.statusText = t || ``),
        (this.internal = r),
        n instanceof Error
          ? ((this.data = n.toString()), (this.error = n))
          : (this.data = n));
    }
  };
function Re(e) {
  return (
    e != null &&
    typeof e.status == `number` &&
    typeof e.statusText == `string` &&
    typeof e.internal == `boolean` &&
    `data` in e
  );
}
function ze(e) {
  return Me(e.map((e) => e.route.path).filter(Boolean)) || `/`;
}
var Be =
  typeof window < `u` &&
  window.document !== void 0 &&
  window.document.createElement !== void 0;
function Ve(e, t) {
  let n = e;
  if (typeof n != `string` || !S.test(n))
    return { absoluteURL: void 0, isExternal: !1, to: n };
  let r = n,
    i = !1;
  if (Be)
    try {
      let e = new URL(window.location.href),
        r = C.test(n) ? new URL(w(n, e.protocol)) : new URL(n),
        a = we(r.pathname, t);
      r.origin === e.origin && a != null
        ? (n = a + r.search + r.hash)
        : (i = !0);
    } catch {
      ne(
        !1,
        `<Link to="${n}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`,
      );
    }
  return { absoluteURL: r, isExternal: i, to: n };
}
Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);
var He = [`POST`, `PUT`, `PATCH`, `DELETE`];
new Set(He);
var Ue = [`GET`, ...He];
new Set(Ue);
var We = [
  `about:`,
  `blob:`,
  `chrome:`,
  `chrome-untrusted:`,
  `content:`,
  `data:`,
  `devtools:`,
  `file:`,
  `filesystem:`,
  `javascript:`,
];
function Ge(e) {
  try {
    return We.includes(new URL(e).protocol);
  } catch {
    return !1;
  }
}
var Ke = x.createContext(null);
Ke.displayName = `DataRouter`;
var qe = x.createContext(null);
qe.displayName = `DataRouterState`;
var Je = x.createContext(!1);
function Ye() {
  return x.useContext(Je);
}
var Xe = x.createContext({ isTransitioning: !1 });
Xe.displayName = `ViewTransition`;
var Ze = x.createContext(new Map());
Ze.displayName = `Fetchers`;
var Qe = x.createContext(null);
Qe.displayName = `Await`;
var $e = x.createContext(null);
$e.displayName = `Navigation`;
var et = x.createContext(null);
et.displayName = `Location`;
var tt = x.createContext({ outlet: null, matches: [], isDataRoute: !1 });
tt.displayName = `Route`;
var nt = x.createContext(null);
nt.displayName = `RouteError`;
var rt = `REACT_ROUTER_ERROR`,
  it = `REDIRECT`,
  at = `ROUTE_ERROR_RESPONSE`;
function ot(e) {
  if (e.startsWith(`${rt}:${it}:{`))
    try {
      let t = JSON.parse(e.slice(28));
      if (
        typeof t == `object` &&
        t &&
        typeof t.status == `number` &&
        typeof t.statusText == `string` &&
        typeof t.location == `string` &&
        typeof t.reloadDocument == `boolean` &&
        typeof t.replace == `boolean`
      )
        return t;
    } catch {}
}
function st(e) {
  if (e.startsWith(`${rt}:${at}:{`))
    try {
      let t = JSON.parse(e.slice(40));
      if (
        typeof t == `object` &&
        t &&
        typeof t.status == `number` &&
        typeof t.statusText == `string`
      )
        return new Le(t.status, t.statusText, t.data);
    } catch {}
}
function ct(e, { relative: t } = {}) {
  E(lt(), `useHref() may be used only in the context of a <Router> component.`);
  let { basename: n, navigator: r } = x.useContext($e),
    { hash: i, pathname: a, search: o } = ht(e, { relative: t }),
    s = a;
  return (
    n !== `/` && (s = a === `/` ? n : Me([n, a])),
    r.createHref({ pathname: s, search: o, hash: i })
  );
}
function lt() {
  return x.useContext(et) != null;
}
function ut() {
  return (
    E(
      lt(),
      `useLocation() may be used only in the context of a <Router> component.`,
    ),
    x.useContext(et).location
  );
}
var dt = `You should call navigate() in a React.useEffect(), not when your component is first rendered.`;
function ft(e) {
  x.useContext($e).static || x.useLayoutEffect(e);
}
function pt() {
  let { isDataRoute: e } = x.useContext(tt);
  return e ? Mt() : mt();
}
function mt() {
  E(
    lt(),
    `useNavigate() may be used only in the context of a <Router> component.`,
  );
  let e = x.useContext(Ke),
    { basename: t, navigator: n } = x.useContext($e),
    { matches: r } = x.useContext(tt),
    { pathname: i } = ut(),
    a = JSON.stringify(ke(r)),
    o = x.useRef(!1);
  return (
    ft(() => {
      o.current = !0;
    }),
    x.useCallback(
      (r, s = {}) => {
        if ((ne(o.current, dt), !o.current)) return;
        if (typeof r == `number`) {
          n.go(r);
          return;
        }
        let c = Ae(r, JSON.parse(a), i, s.relative === `path`);
        (e == null &&
          t !== `/` &&
          (c.pathname = c.pathname === `/` ? t : Me([t, c.pathname])),
          (s.replace ? n.replace : n.push)(c, s.state, s));
      },
      [t, n, a, i, e],
    )
  );
}
x.createContext(null);
function ht(e, { relative: t } = {}) {
  let { matches: n } = x.useContext(tt),
    { pathname: r } = ut(),
    i = JSON.stringify(ke(n));
  return x.useMemo(() => Ae(e, JSON.parse(i), r, t === `path`), [e, i, r, t]);
}
function gt(e, t) {
  return _t(e, t);
}
function _t(e, t, n) {
  E(
    lt(),
    `useRoutes() may be used only in the context of a <Router> component.`,
  );
  let { navigator: r } = x.useContext($e),
    { matches: i } = x.useContext(tt),
    a = i[i.length - 1],
    o = a ? a.params : {},
    s = a ? a.pathname : `/`,
    c = a ? a.pathnameBase : `/`,
    l = a && a.route;
  {
    let e = (l && l.path) || ``;
    Pt(
      s,
      !l || e.endsWith(`*`) || e.endsWith(`*?`),
      `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${s}" (under <Route path="${e}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${e}"> to <Route path="${e === `/` ? `*` : `${e}/*`}">.`,
    );
  }
  let u = ut(),
    d;
  if (t) {
    let e = typeof t == `string` ? se(t) : t;
    (E(
      c === `/` || e.pathname?.startsWith(c),
      `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${c}" but pathname "${e.pathname}" was given in the \`location\` prop.`,
    ),
      (d = e));
  } else d = u;
  let f = d.pathname || `/`,
    p = f;
  if (c !== `/`) {
    let e = c.replace(/^\//, ``).split(`/`);
    p = `/` + f.replace(/^\//, ``).split(`/`).slice(e.length).join(`/`);
  }
  let m =
    n && n.state.matches.length
      ? n.state.matches.map((e) =>
          Object.assign(e, { route: n.manifest[e.route.id] || e.route }),
        )
      : O(e, { pathname: p });
  (ne(
    l || m != null,
    `No routes matched location "${d.pathname}${d.search}${d.hash}" `,
  ),
    ne(
      m == null ||
        m[m.length - 1].route.element !== void 0 ||
        m[m.length - 1].route.Component !== void 0 ||
        m[m.length - 1].route.lazy !== void 0,
      `Matched leaf route at location "${d.pathname}${d.search}${d.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`,
    ));
  let h = wt(
    m &&
      m.map((e) =>
        Object.assign({}, e, {
          params: Object.assign({}, o, e.params),
          pathname: Me([
            c,
            r.encodeLocation
              ? r.encodeLocation(
                  e.pathname
                    .replace(/%/g, `%25`)
                    .replace(/\?/g, `%3F`)
                    .replace(/#/g, `%23`),
                ).pathname
              : e.pathname,
          ]),
          pathnameBase:
            e.pathnameBase === `/`
              ? c
              : Me([
                  c,
                  r.encodeLocation
                    ? r.encodeLocation(
                        e.pathnameBase
                          .replace(/%/g, `%25`)
                          .replace(/\?/g, `%3F`)
                          .replace(/#/g, `%23`),
                      ).pathname
                    : e.pathnameBase,
                ]),
        }),
      ),
    i,
    n,
  );
  return t && h
    ? x.createElement(
        et.Provider,
        {
          value: {
            location: {
              pathname: `/`,
              search: ``,
              hash: ``,
              state: null,
              key: `default`,
              mask: void 0,
              ...d,
            },
            navigationType: `POP`,
          },
        },
        h,
      )
    : h;
}
function vt() {
  let e = jt(),
    t = Re(e)
      ? `${e.status} ${e.statusText}`
      : e instanceof Error
        ? e.message
        : JSON.stringify(e),
    n = e instanceof Error ? e.stack : null,
    r = `rgba(200,200,200, 0.5)`,
    i = { padding: `0.5rem`, backgroundColor: r },
    a = { padding: `2px 4px`, backgroundColor: r },
    o = null;
  return (
    console.error(`Error handled by React Router default ErrorBoundary:`, e),
    (o = x.createElement(
      x.Fragment,
      null,
      x.createElement(`p`, null, `💿 Hey developer 👋`),
      x.createElement(
        `p`,
        null,
        `You can provide a way better UX than this when your app throws errors by providing your own `,
        x.createElement(`code`, { style: a }, `ErrorBoundary`),
        ` or`,
        ` `,
        x.createElement(`code`, { style: a }, `errorElement`),
        ` prop on your route.`,
      ),
    )),
    x.createElement(
      x.Fragment,
      null,
      x.createElement(`h2`, null, `Unexpected Application Error!`),
      x.createElement(`h3`, { style: { fontStyle: `italic` } }, t),
      n ? x.createElement(`pre`, { style: i }, n) : null,
      o,
    )
  );
}
var yt = x.createElement(vt, null),
  bt = class extends x.Component {
    constructor(e) {
      (super(e),
        (this.state = {
          location: e.location,
          revalidation: e.revalidation,
          error: e.error,
        }));
    }
    static getDerivedStateFromError(e) {
      return { error: e };
    }
    static getDerivedStateFromProps(e, t) {
      return t.location !== e.location ||
        (t.revalidation !== `idle` && e.revalidation === `idle`)
        ? { error: e.error, location: e.location, revalidation: e.revalidation }
        : {
            error: e.error === void 0 ? t.error : e.error,
            location: t.location,
            revalidation: e.revalidation || t.revalidation,
          };
    }
    componentDidCatch(e, t) {
      this.props.onError
        ? this.props.onError(e, t)
        : console.error(
            `React Router caught the following error during render`,
            e,
          );
    }
    render() {
      let e = this.state.error;
      if (
        this.context &&
        typeof e == `object` &&
        e &&
        `digest` in e &&
        typeof e.digest == `string`
      ) {
        let t = st(e.digest);
        t && (e = t);
      }
      let t =
        e === void 0
          ? this.props.children
          : x.createElement(
              tt.Provider,
              { value: this.props.routeContext },
              x.createElement(nt.Provider, {
                value: e,
                children: this.props.component,
              }),
            );
      return this.context ? x.createElement(St, { error: e }, t) : t;
    }
  };
bt.contextType = Je;
var xt = new WeakMap();
function St({ children: e, error: t }) {
  let { basename: n } = x.useContext($e);
  if (
    typeof t == `object` &&
    t &&
    `digest` in t &&
    typeof t.digest == `string`
  ) {
    let e = ot(t.digest);
    if (e) {
      let r = xt.get(t);
      if (r) throw r;
      let i = Ve(e.location, n),
        a = i.absoluteURL || i.to;
      if (Ge(a)) throw Error(`Invalid redirect location`);
      if (Be && !xt.get(t))
        if (i.isExternal || e.reloadDocument) window.location.href = a;
        else {
          let n = Promise.resolve().then(() =>
            window.__reactRouterDataRouter.navigate(i.to, {
              replace: e.replace,
            }),
          );
          throw (xt.set(t, n), n);
        }
      return x.createElement(`meta`, {
        httpEquiv: `refresh`,
        content: `0;url=${a}`,
      });
    }
  }
  return e;
}
function Ct({ routeContext: e, match: t, children: n }) {
  let r = x.useContext(Ke);
  return (
    r &&
      r.static &&
      r.staticContext &&
      (t.route.errorElement || t.route.ErrorBoundary) &&
      (r.staticContext._deepestRenderedBoundaryId = t.route.id),
    x.createElement(tt.Provider, { value: e }, n)
  );
}
function wt(e, t = [], n) {
  let r = n?.state;
  if (e == null) {
    if (!r) return null;
    if (r.errors) e = r.matches;
    else if (t.length === 0 && !r.initialized && r.matches.length > 0)
      e = r.matches;
    else return null;
  }
  let i = e,
    a = r?.errors;
  if (a != null) {
    let e = i.findIndex((e) => e.route.id && a?.[e.route.id] !== void 0);
    (E(
      e >= 0,
      `Could not find a matching route for errors on route IDs: ${Object.keys(a).join(`,`)}`,
    ),
      (i = i.slice(0, Math.min(i.length, e + 1))));
  }
  let o = !1,
    s = -1;
  if (n && r) {
    o = r.renderFallback;
    for (let e = 0; e < i.length; e++) {
      let t = i[e];
      if (
        ((t.route.HydrateFallback || t.route.hydrateFallbackElement) && (s = e),
        t.route.id)
      ) {
        let { loaderData: e, errors: a } = r,
          c =
            t.route.loader &&
            !e.hasOwnProperty(t.route.id) &&
            (!a || a[t.route.id] === void 0);
        if (t.route.lazy || c) {
          (n.isStatic && (o = !0), (i = s >= 0 ? i.slice(0, s + 1) : [i[0]]));
          break;
        }
      }
    }
  }
  let c = n?.onError,
    l =
      r && c
        ? (e, t) => {
            c(e, {
              location: r.location,
              params: r.matches?.[0]?.params ?? {},
              pattern: ze(r.matches),
              errorInfo: t,
            });
          }
        : void 0;
  return i.reduceRight((e, n, c) => {
    let u,
      d = !1,
      f = null,
      p = null;
    r &&
      ((u = a && n.route.id ? a[n.route.id] : void 0),
      (f = n.route.errorElement || yt),
      o &&
        (s < 0 && c === 0
          ? (Pt(
              `route-fallback`,
              !1,
              "No `HydrateFallback` element provided to render during initial hydration",
            ),
            (d = !0),
            (p = null))
          : s === c &&
            ((d = !0), (p = n.route.hydrateFallbackElement || null))));
    let m = t.concat(i.slice(0, c + 1)),
      h = () => {
        let t;
        return (
          (t = u
            ? f
            : d
              ? p
              : n.route.Component
                ? x.createElement(n.route.Component, null)
                : n.route.element
                  ? n.route.element
                  : e),
          x.createElement(Ct, {
            match: n,
            routeContext: { outlet: e, matches: m, isDataRoute: r != null },
            children: t,
          })
        );
      };
    return r && (n.route.ErrorBoundary || n.route.errorElement || c === 0)
      ? x.createElement(bt, {
          location: r.location,
          revalidation: r.revalidation,
          component: f,
          error: u,
          children: h(),
          routeContext: { outlet: null, matches: m, isDataRoute: !0 },
          onError: l,
        })
      : h();
  }, null);
}
function Tt(e) {
  return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function Et(e) {
  let t = x.useContext(Ke);
  return (E(t, Tt(e)), t);
}
function Dt(e) {
  let t = x.useContext(qe);
  return (E(t, Tt(e)), t);
}
function Ot(e) {
  let t = x.useContext(tt);
  return (E(t, Tt(e)), t);
}
function kt(e) {
  let t = Ot(e),
    n = t.matches[t.matches.length - 1];
  return (
    E(n.route.id, `${e} can only be used on routes that contain a unique "id"`),
    n.route.id
  );
}
function At() {
  return kt(`useRouteId`);
}
function jt() {
  let e = x.useContext(nt),
    t = Dt(`useRouteError`),
    n = kt(`useRouteError`);
  return e === void 0 ? t.errors?.[n] : e;
}
function Mt() {
  let { router: e } = Et(`useNavigate`),
    t = kt(`useNavigate`),
    n = x.useRef(!1);
  return (
    ft(() => {
      n.current = !0;
    }),
    x.useCallback(
      async (r, i = {}) => {
        (ne(n.current, dt),
          n.current &&
            (typeof r == `number`
              ? await e.navigate(r)
              : await e.navigate(r, { fromRouteId: t, ...i })));
      },
      [e, t],
    )
  );
}
var Nt = {};
function Pt(e, t, n) {
  !t && !Nt[e] && ((Nt[e] = !0), ne(!1, n));
}
x.memo(Ft);
function Ft({
  routes: e,
  manifest: t,
  future: n,
  state: r,
  isStatic: i,
  onError: a,
}) {
  return _t(e, void 0, {
    manifest: t,
    state: r,
    isStatic: i,
    onError: a,
    future: n,
  });
}
function It(e) {
  E(
    !1,
    `A <Route> is only ever to be used as the child of <Routes> element, never rendered directly. Please wrap your <Route> in a <Routes>.`,
  );
}
function Lt({
  basename: e = `/`,
  children: t = null,
  location: n,
  navigationType: r = `POP`,
  navigator: i,
  static: a = !1,
  useTransitions: o,
}) {
  E(
    !lt(),
    `You cannot render a <Router> inside another <Router>. You should never have more than one in your app.`,
  );
  let s = e.replace(/^\/*/, `/`),
    c = x.useMemo(
      () => ({
        basename: s,
        navigator: i,
        static: a,
        useTransitions: o,
        future: {},
      }),
      [s, i, a, o],
    );
  typeof n == `string` && (n = se(n));
  let {
      pathname: l = `/`,
      search: u = ``,
      hash: d = ``,
      state: f = null,
      key: p = `default`,
      mask: m,
    } = n,
    h = x.useMemo(() => {
      let e = we(l, s);
      return e == null
        ? null
        : {
            location: {
              pathname: e,
              search: u,
              hash: d,
              state: f,
              key: p,
              mask: m,
            },
            navigationType: r,
          };
    }, [s, l, u, d, f, p, r, m]);
  return (
    ne(
      h != null,
      `<Router basename="${s}"> is not able to match the URL "${l}${u}${d}" because it does not start with the basename, so the <Router> won't render anything.`,
    ),
    h == null
      ? null
      : x.createElement(
          $e.Provider,
          { value: c },
          x.createElement(et.Provider, { children: t, value: h }),
        )
  );
}
function Rt({ children: e, location: t }) {
  return gt(zt(e), t);
}
x.Component;
function zt(e, t = []) {
  let n = [];
  return (
    x.Children.forEach(e, (e, r) => {
      if (!x.isValidElement(e)) return;
      let i = [...t, r];
      if (e.type === x.Fragment) {
        n.push.apply(n, zt(e.props.children, i));
        return;
      }
      (E(
        e.type === It,
        `[${typeof e.type == `string` ? e.type : e.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`,
      ),
        E(
          !e.props.index || !e.props.children,
          `An index route cannot have child routes.`,
        ));
      let a = {
        id: e.props.id || i.join(`-`),
        caseSensitive: e.props.caseSensitive,
        element: e.props.element,
        Component: e.props.Component,
        index: e.props.index,
        path: e.props.path,
        middleware: e.props.middleware,
        loader: e.props.loader,
        action: e.props.action,
        hydrateFallbackElement: e.props.hydrateFallbackElement,
        HydrateFallback: e.props.HydrateFallback,
        errorElement: e.props.errorElement,
        ErrorBoundary: e.props.ErrorBoundary,
        hasErrorBoundary:
          e.props.hasErrorBoundary === !0 ||
          e.props.ErrorBoundary != null ||
          e.props.errorElement != null,
        shouldRevalidate: e.props.shouldRevalidate,
        handle: e.props.handle,
        lazy: e.props.lazy,
      };
      (e.props.children && (a.children = zt(e.props.children, i)), n.push(a));
    }),
    n
  );
}
var Bt = `get`,
  Vt = `application/x-www-form-urlencoded`;
function Ht(e) {
  return typeof HTMLElement < `u` && e instanceof HTMLElement;
}
function Ut(e) {
  return Ht(e) && e.tagName.toLowerCase() === `button`;
}
function Wt(e) {
  return Ht(e) && e.tagName.toLowerCase() === `form`;
}
function Gt(e) {
  return Ht(e) && e.tagName.toLowerCase() === `input`;
}
function Kt(e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
function qt(e, t) {
  return e.button === 0 && (!t || t === `_self`) && !Kt(e);
}
var Jt = null;
function Yt() {
  if (Jt === null)
    try {
      (new FormData(document.createElement(`form`), 0), (Jt = !1));
    } catch {
      Jt = !0;
    }
  return Jt;
}
var Xt = new Set([
  `application/x-www-form-urlencoded`,
  `multipart/form-data`,
  `text/plain`,
]);
function Zt(e) {
  return e != null && !Xt.has(e)
    ? (ne(
        !1,
        `"${e}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${Vt}"`,
      ),
      null)
    : e;
}
function Qt(e, t) {
  let n, r, i, a, o;
  if (Wt(e)) {
    let o = e.getAttribute(`action`);
    ((r = o ? we(o, t) : null),
      (n = e.getAttribute(`method`) || Bt),
      (i = Zt(e.getAttribute(`enctype`)) || Vt),
      (a = new FormData(e)));
  } else if (Ut(e) || (Gt(e) && (e.type === `submit` || e.type === `image`))) {
    let o = e.form;
    if (o == null)
      throw Error(
        `Cannot submit a <button> or <input type="submit"> without a <form>`,
      );
    let s = e.getAttribute(`formaction`) || o.getAttribute(`action`);
    if (
      ((r = s ? we(s, t) : null),
      (n = e.getAttribute(`formmethod`) || o.getAttribute(`method`) || Bt),
      (i =
        Zt(e.getAttribute(`formenctype`)) ||
        Zt(o.getAttribute(`enctype`)) ||
        Vt),
      (a = new FormData(o, e)),
      !Yt())
    ) {
      let { name: t, type: n, value: r } = e;
      if (n === `image`) {
        let e = t ? `${t}.` : ``;
        (a.append(`${e}x`, `0`), a.append(`${e}y`, `0`));
      } else t && a.append(t, r);
    }
  } else if (Ht(e))
    throw Error(
      `Cannot submit element that is not <form>, <button>, or <input type="submit|image">`,
    );
  else ((n = Bt), (r = null), (i = Vt), (o = e));
  return (
    a && i === `text/plain` && ((o = a), (a = void 0)),
    { action: r, method: n.toLowerCase(), encType: i, formData: a, body: o }
  );
}
Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);
function $t(e, t) {
  if (e === !1 || e == null) throw Error(t);
}
function en(e, t, n, r) {
  let i =
    typeof e == `string`
      ? new URL(
          e,
          typeof window > `u`
            ? `server://singlefetch/`
            : window.location.origin,
        )
      : e;
  return (
    (i.pathname = n
      ? i.pathname.endsWith(`/`)
        ? `${i.pathname}_.${r}`
        : `${i.pathname}.${r}`
      : i.pathname === `/`
        ? `_root.${r}`
        : t && we(i.pathname, t) === `/`
          ? `${Ne(t)}/_root.${r}`
          : `${Ne(i.pathname)}.${r}`),
    i
  );
}
async function tn(e, t) {
  if (e.id in t) return t[e.id];
  try {
    let n = await b(() => import(e.module), []);
    return ((t[e.id] = n), n);
  } catch (t) {
    return (
      console.error(
        `Error loading route module \`${e.module}\`, reloading page...`,
      ),
      console.error(t),
      window.__reactRouterContext && window.__reactRouterContext.isSpaMode,
      window.location.reload(),
      new Promise(() => {})
    );
  }
}
function nn(e) {
  return e != null && typeof e.page == `string`;
}
function rn(e) {
  return e == null
    ? !1
    : e.href == null
      ? e.rel === `preload` &&
        typeof e.imageSrcSet == `string` &&
        typeof e.imageSizes == `string`
      : typeof e.rel == `string` && typeof e.href == `string`;
}
async function an(e, t, n) {
  return un(
    (
      await Promise.all(
        e.map(async (e) => {
          let r = t.routes[e.route.id];
          if (r) {
            let e = await tn(r, n);
            return e.links ? e.links() : [];
          }
          return [];
        }),
      )
    )
      .flat(1)
      .filter(rn)
      .filter((e) => e.rel === `stylesheet` || e.rel === `preload`)
      .map((e) =>
        e.rel === `stylesheet`
          ? { ...e, rel: `prefetch`, as: `style` }
          : { ...e, rel: `prefetch` },
      ),
  );
}
function on(e, t, n, r, i, a) {
  let o = (e, t) => !n[t] || e.route.id !== n[t].route.id,
    s = (e, t) =>
      n[t].pathname !== e.pathname ||
      (n[t].route.path?.endsWith(`*`) && n[t].params[`*`] !== e.params[`*`]);
  return a === `assets`
    ? t.filter((e, t) => o(e, t) || s(e, t))
    : a === `data`
      ? t.filter((t, a) => {
          let c = r.routes[t.route.id];
          if (!c || !c.hasLoader) return !1;
          if (o(t, a) || s(t, a)) return !0;
          if (t.route.shouldRevalidate) {
            let r = t.route.shouldRevalidate({
              currentUrl: new URL(
                i.pathname + i.search + i.hash,
                window.origin,
              ),
              currentParams: n[0]?.params || {},
              nextUrl: new URL(e, window.origin),
              nextParams: t.params,
              defaultShouldRevalidate: !0,
            });
            if (typeof r == `boolean`) return r;
          }
          return !0;
        })
      : [];
}
function sn(e, t, { includeHydrateFallback: n } = {}) {
  return cn(
    e
      .map((e) => {
        let r = t.routes[e.route.id];
        if (!r) return [];
        let i = [r.module];
        return (
          r.clientActionModule && (i = i.concat(r.clientActionModule)),
          r.clientLoaderModule && (i = i.concat(r.clientLoaderModule)),
          n &&
            r.hydrateFallbackModule &&
            (i = i.concat(r.hydrateFallbackModule)),
          r.imports && (i = i.concat(r.imports)),
          i
        );
      })
      .flat(1),
  );
}
function cn(e) {
  return [...new Set(e)];
}
function ln(e) {
  let t = {},
    n = Object.keys(e).sort();
  for (let r of n) t[r] = e[r];
  return t;
}
function un(e, t) {
  let n = new Set(),
    r = new Set(t);
  return e.reduce((e, i) => {
    if (t && !nn(i) && i.as === `script` && i.href && r.has(i.href)) return e;
    let a = JSON.stringify(ln(i));
    return (n.has(a) || (n.add(a), e.push({ key: a, link: i })), e);
  }, []);
}
function dn() {
  let e = x.useContext(Ke);
  return (
    $t(
      e,
      `You must render this element inside a <DataRouterContext.Provider> element`,
    ),
    e
  );
}
function fn() {
  let e = x.useContext(qe);
  return (
    $t(
      e,
      `You must render this element inside a <DataRouterStateContext.Provider> element`,
    ),
    e
  );
}
var pn = x.createContext(void 0);
pn.displayName = `FrameworkContext`;
function mn() {
  let e = x.useContext(pn);
  return (
    $t(e, `You must render this element inside a <HydratedRouter> element`),
    e
  );
}
function hn(e, t) {
  let n = x.useContext(pn),
    [r, i] = x.useState(!1),
    [a, o] = x.useState(!1),
    {
      onFocus: s,
      onBlur: c,
      onMouseEnter: l,
      onMouseLeave: u,
      onTouchStart: d,
    } = t,
    f = x.useRef(null);
  (x.useEffect(() => {
    if ((e === `render` && o(!0), e === `viewport`)) {
      let e = new IntersectionObserver(
        (e) => {
          e.forEach((e) => {
            o(e.isIntersecting);
          });
        },
        { threshold: 0.5 },
      );
      return (
        f.current && e.observe(f.current),
        () => {
          e.disconnect();
        }
      );
    }
  }, [e]),
    x.useEffect(() => {
      if (r) {
        let e = setTimeout(() => {
          o(!0);
        }, 100);
        return () => {
          clearTimeout(e);
        };
      }
    }, [r]));
  let p = () => {
      i(!0);
    },
    m = () => {
      (i(!1), o(!1));
    };
  return n
    ? e === `intent`
      ? [
          a,
          f,
          {
            onFocus: gn(s, p),
            onBlur: gn(c, m),
            onMouseEnter: gn(l, p),
            onMouseLeave: gn(u, m),
            onTouchStart: gn(d, p),
          },
        ]
      : [a, f, {}]
    : [!1, f, {}];
}
function gn(e, t) {
  return (n) => {
    (e && e(n), n.defaultPrevented || t(n));
  };
}
function _n({ page: e, ...t }) {
  let n = Ye(),
    { nonce: r } = mn(),
    { router: i } = dn(),
    a = x.useMemo(() => O(i.routes, e, i.basename), [i.routes, e, i.basename]);
  return a
    ? (t.nonce == null && r && (t = { ...t, nonce: r }),
      n
        ? x.createElement(yn, { page: e, matches: a, ...t })
        : x.createElement(bn, { page: e, matches: a, ...t }))
    : null;
}
function vn(e) {
  let { manifest: t, routeModules: n } = mn(),
    [r, i] = x.useState([]);
  return (
    x.useEffect(() => {
      let r = !1;
      return (
        an(e, t, n).then((e) => {
          r || i(e);
        }),
        () => {
          r = !0;
        }
      );
    }, [e, t, n]),
    r
  );
}
function yn({ page: e, matches: t, ...n }) {
  let r = ut(),
    { future: i } = mn(),
    { basename: a } = dn(),
    o = x.useMemo(() => {
      if (e === r.pathname + r.search + r.hash) return [];
      let n = en(e, a, i.v8_trailingSlashAwareDataRequests, `rsc`),
        o = !1,
        s = [];
      for (let e of t)
        typeof e.route.shouldRevalidate == `function`
          ? (o = !0)
          : s.push(e.route.id);
      return (
        o && s.length > 0 && n.searchParams.set(`_routes`, s.join(`,`)),
        [n.pathname + n.search]
      );
    }, [a, i.v8_trailingSlashAwareDataRequests, e, r, t]);
  return x.createElement(
    x.Fragment,
    null,
    o.map((e) =>
      x.createElement(`link`, {
        key: e,
        rel: `prefetch`,
        as: `fetch`,
        href: e,
        ...n,
      }),
    ),
  );
}
function bn({ page: e, matches: t, ...n }) {
  let r = ut(),
    { future: i, manifest: a, routeModules: o } = mn(),
    { basename: s } = dn(),
    { loaderData: c, matches: l } = fn(),
    u = x.useMemo(() => on(e, t, l, a, r, `data`), [e, t, l, a, r]),
    d = x.useMemo(() => on(e, t, l, a, r, `assets`), [e, t, l, a, r]),
    f = x.useMemo(() => {
      if (e === r.pathname + r.search + r.hash) return [];
      let n = new Set(),
        l = !1;
      if (
        (t.forEach((e) => {
          let t = a.routes[e.route.id];
          !t ||
            !t.hasLoader ||
            ((!u.some((t) => t.route.id === e.route.id) &&
              e.route.id in c &&
              o[e.route.id]?.shouldRevalidate) ||
            t.hasClientLoader
              ? (l = !0)
              : n.add(e.route.id));
        }),
        n.size === 0)
      )
        return [];
      let d = en(e, s, i.v8_trailingSlashAwareDataRequests, `data`);
      return (
        l &&
          n.size > 0 &&
          d.searchParams.set(
            `_routes`,
            t
              .filter((e) => n.has(e.route.id))
              .map((e) => e.route.id)
              .join(`,`),
          ),
        [d.pathname + d.search]
      );
    }, [s, i.v8_trailingSlashAwareDataRequests, c, r, a, u, t, e, o]),
    p = x.useMemo(() => sn(d, a), [d, a]),
    m = vn(d);
  return x.createElement(
    x.Fragment,
    null,
    f.map((e) =>
      x.createElement(`link`, {
        key: e,
        rel: `prefetch`,
        as: `fetch`,
        href: e,
        ...n,
      }),
    ),
    p.map((e) =>
      x.createElement(`link`, { key: e, rel: `modulepreload`, href: e, ...n }),
    ),
    m.map(({ key: e, link: t }) =>
      x.createElement(`link`, {
        key: e,
        nonce: n.nonce,
        ...t,
        crossOrigin: t.crossOrigin ?? n.crossOrigin,
      }),
    ),
  );
}
function xn(...e) {
  return (t) => {
    e.forEach((e) => {
      typeof e == `function` ? e(t) : e != null && (e.current = t);
    });
  };
}
x.Component;
var Sn =
  typeof window < `u` &&
  window.document !== void 0 &&
  window.document.createElement !== void 0;
try {
  Sn && (window.__reactRouterVersion = `7.18.2`);
} catch {}
function Cn({ basename: e, children: t, useTransitions: n, window: r }) {
  let i = x.useRef();
  i.current ??= te({ window: r, v5Compat: !0 });
  let a = i.current,
    [o, s] = x.useState({ action: a.action, location: a.location }),
    c = x.useCallback(
      (e) => {
        n === !1 ? s(e) : x.startTransition(() => s(e));
      },
      [n],
    );
  return (
    x.useLayoutEffect(() => a.listen(c), [a, c]),
    x.createElement(Lt, {
      basename: e,
      children: t,
      location: o.location,
      navigationType: o.action,
      navigator: a,
      useTransitions: n,
    })
  );
}
var wn = x.forwardRef(function (
  {
    onClick: e,
    discover: t = `render`,
    prefetch: n = `none`,
    relative: r,
    reloadDocument: i,
    replace: a,
    mask: o,
    state: s,
    target: c,
    to: l,
    preventScrollReset: u,
    viewTransition: d,
    defaultShouldRevalidate: f,
    ...p
  },
  m,
) {
  let { basename: h, navigator: g, useTransitions: _ } = x.useContext($e),
    v = typeof l == `string` && S.test(l),
    y = Ve(l, h);
  l = y.to;
  let b = ct(l, { relative: r }),
    C = ut(),
    w = null;
  if (o) {
    let e = Ae(o, [], C.mask ? C.mask.pathname : `/`, !0);
    (h !== `/` && (e.pathname = e.pathname === `/` ? h : Me([h, e.pathname])),
      (w = g.createHref(e)));
  }
  let [T, ee, te] = hn(n, p),
    E = kn(l, {
      replace: a,
      mask: o,
      state: s,
      target: c,
      preventScrollReset: u,
      relative: r,
      viewTransition: d,
      defaultShouldRevalidate: f,
      useTransitions: _,
    });
  function ne(t) {
    (e && e(t), t.defaultPrevented || E(t));
  }
  let re = !(y.isExternal || i),
    ie = x.createElement(`a`, {
      ...p,
      ...te,
      href: (re ? w : void 0) || y.absoluteURL || b,
      onClick: re ? ne : e,
      ref: xn(m, ee),
      target: c,
      "data-discover": !v && t === `render` ? `true` : void 0,
    });
  return T && !v
    ? x.createElement(x.Fragment, null, ie, x.createElement(_n, { page: b }))
    : ie;
});
wn.displayName = `Link`;
var Tn = x.forwardRef(function (
  {
    "aria-current": e = `page`,
    caseSensitive: t = !1,
    className: n = ``,
    end: r = !1,
    style: i,
    to: a,
    viewTransition: o,
    children: s,
    ...c
  },
  l,
) {
  let u = ht(a, { relative: c.relative }),
    d = ut(),
    f = x.useContext(qe),
    { navigator: p, basename: m } = x.useContext($e),
    h = f != null && Pn(u) && o === !0,
    g = p.encodeLocation ? p.encodeLocation(u).pathname : u.pathname,
    _ = d.pathname,
    v =
      f && f.navigation && f.navigation.location
        ? f.navigation.location.pathname
        : null;
  (t ||
    ((_ = _.toLowerCase()),
    (v = v ? v.toLowerCase() : null),
    (g = g.toLowerCase())),
    v && m && (v = we(v, m) || v));
  let y = g !== `/` && g.endsWith(`/`) ? g.length - 1 : g.length,
    b = _ === g || (!r && _.startsWith(g) && _.charAt(y) === `/`),
    S =
      v != null &&
      (v === g || (!r && v.startsWith(g) && v.charAt(g.length) === `/`)),
    C = { isActive: b, isPending: S, isTransitioning: h },
    w = b ? e : void 0,
    T;
  T =
    typeof n == `function`
      ? n(C)
      : [
          n,
          b ? `active` : null,
          S ? `pending` : null,
          h ? `transitioning` : null,
        ]
          .filter(Boolean)
          .join(` `);
  let ee = typeof i == `function` ? i(C) : i;
  return x.createElement(
    wn,
    {
      ...c,
      "aria-current": w,
      className: T,
      ref: l,
      style: ee,
      to: a,
      viewTransition: o,
    },
    typeof s == `function` ? s(C) : s,
  );
});
Tn.displayName = `NavLink`;
var En = x.forwardRef(
  (
    {
      discover: e = `render`,
      fetcherKey: t,
      navigate: n,
      reloadDocument: r,
      replace: i,
      state: a,
      method: o = Bt,
      action: s,
      onSubmit: c,
      relative: l,
      preventScrollReset: u,
      viewTransition: d,
      defaultShouldRevalidate: f,
      ...p
    },
    m,
  ) => {
    let { useTransitions: h } = x.useContext($e),
      g = Mn(),
      _ = Nn(s, { relative: l }),
      v = o.toLowerCase() === `get` ? `get` : `post`,
      y = typeof s == `string` && S.test(s);
    return x.createElement(`form`, {
      ref: m,
      method: v,
      action: _,
      onSubmit: r
        ? c
        : (e) => {
            if ((c && c(e), e.defaultPrevented)) return;
            e.preventDefault();
            let r = e.nativeEvent.submitter,
              s = r?.getAttribute(`formmethod`) || o,
              p = () =>
                g(r || e.currentTarget, {
                  fetcherKey: t,
                  method: s,
                  navigate: n,
                  replace: i,
                  state: a,
                  relative: l,
                  preventScrollReset: u,
                  viewTransition: d,
                  defaultShouldRevalidate: f,
                });
            h && n !== !1 ? x.startTransition(() => p()) : p();
          },
      ...p,
      "data-discover": !y && e === `render` ? `true` : void 0,
    });
  },
);
En.displayName = `Form`;
function Dn(e) {
  return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function On(e) {
  let t = x.useContext(Ke);
  return (E(t, Dn(e)), t);
}
function kn(
  e,
  {
    target: t,
    replace: n,
    mask: r,
    state: i,
    preventScrollReset: a,
    relative: o,
    viewTransition: s,
    defaultShouldRevalidate: c,
    useTransitions: l,
  } = {},
) {
  let u = pt(),
    d = ut(),
    f = ht(e, { relative: o });
  return x.useCallback(
    (p) => {
      if (qt(p, t)) {
        p.preventDefault();
        let t = n === void 0 ? oe(d) === oe(f) : n,
          m = () =>
            u(e, {
              replace: t,
              mask: r,
              state: i,
              preventScrollReset: a,
              relative: o,
              viewTransition: s,
              defaultShouldRevalidate: c,
            });
        l ? x.startTransition(() => m()) : m();
      }
    },
    [d, u, f, n, r, i, t, e, a, o, s, c, l],
  );
}
var An = 0,
  jn = () => `__${String(++An)}__`;
function Mn() {
  let { router: e } = On(`useSubmit`),
    { basename: t } = x.useContext($e),
    n = At(),
    r = e.fetch,
    i = e.navigate;
  return x.useCallback(
    async (e, a = {}) => {
      let { action: o, method: s, encType: c, formData: l, body: u } = Qt(e, t);
      if (a.navigate === !1) {
        let e = a.fetcherKey || jn();
        await r(e, n, a.action || o, {
          defaultShouldRevalidate: a.defaultShouldRevalidate,
          preventScrollReset: a.preventScrollReset,
          formData: l,
          body: u,
          formMethod: a.method || s,
          formEncType: a.encType || c,
          flushSync: a.flushSync,
        });
      } else
        await i(a.action || o, {
          defaultShouldRevalidate: a.defaultShouldRevalidate,
          preventScrollReset: a.preventScrollReset,
          formData: l,
          body: u,
          formMethod: a.method || s,
          formEncType: a.encType || c,
          replace: a.replace,
          state: a.state,
          fromRouteId: n,
          flushSync: a.flushSync,
          viewTransition: a.viewTransition,
        });
    },
    [r, i, t, n],
  );
}
function Nn(e, { relative: t } = {}) {
  let { basename: n } = x.useContext($e),
    r = x.useContext(tt);
  E(r, `useFormAction must be used inside a RouteContext`);
  let [i] = r.matches.slice(-1),
    a = { ...ht(e || `.`, { relative: t }) },
    o = ut();
  if (e == null) {
    a.search = o.search;
    let e = new URLSearchParams(a.search),
      t = e.getAll(`index`);
    if (t.some((e) => e === ``)) {
      (e.delete(`index`),
        t.filter((e) => e).forEach((t) => e.append(`index`, t)));
      let n = e.toString();
      a.search = n ? `?${n}` : ``;
    }
  }
  return (
    (!e || e === `.`) &&
      i.route.index &&
      (a.search = a.search ? a.search.replace(/^\?/, `?index&`) : `?index`),
    n !== `/` && (a.pathname = a.pathname === `/` ? n : Me([n, a.pathname])),
    oe(a)
  );
}
function Pn(e, { relative: t } = {}) {
  let n = x.useContext(Xe);
  E(
    n != null,
    "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?",
  );
  let { basename: r } = On(`useViewTransitionState`),
    i = ht(e, { relative: t });
  if (!n.isTransitioning) return !1;
  let a = we(n.currentLocation.pathname, r) || n.currentLocation.pathname,
    o = we(n.nextLocation.pathname, r) || n.nextLocation.pathname;
  return be(i.pathname, o) != null || be(i.pathname, a) != null;
}
var Fn = g(),
  In = `__herculesAuthRefresh`,
  Ln = new Map();
async function Rn(e, t) {
  return new Promise((n, r) => {
    let i = () =>
        t()
          .then(n)
          .catch(r)
          .finally(() => {
            let t = Ln.get(e),
              n = t.waiting.shift();
            t.running = n ? n() : null;
          }),
      a = Ln.get(e);
    (a || ((a = { running: null, waiting: [] }), Ln.set(e, a)),
      a.running === null ? (a.running = i()) : a.waiting.push(i));
  });
}
async function zn(e) {
  return typeof navigator < `u` && navigator.locks
    ? navigator.locks.request(In, e)
    : Rn(In, e);
}
var Bn = class extends Error {};
Bn.prototype.name = `InvalidTokenError`;
function Vn(e) {
  return decodeURIComponent(
    atob(e).replace(/(.)/g, (e, t) => {
      let n = t.charCodeAt(0).toString(16).toUpperCase();
      return (n.length < 2 && (n = `0` + n), `%` + n);
    }),
  );
}
function Hn(e) {
  let t = e.replace(/-/g, `+`).replace(/_/g, `/`);
  switch (t.length % 4) {
    case 0:
      break;
    case 2:
      t += `==`;
      break;
    case 3:
      t += `=`;
      break;
    default:
      throw Error(`base64 string is not of the correct length`);
  }
  try {
    return Vn(t);
  } catch {
    return atob(t);
  }
}
function Un(e, t) {
  if (typeof e != `string`)
    throw new Bn(`Invalid token specified: must be a string`);
  t ||= {};
  let n = t.header === !0 ? 0 : 1,
    r = e.split(`.`)[n];
  if (typeof r != `string`)
    throw new Bn(`Invalid token specified: missing part #${n + 1}`);
  let i;
  try {
    i = Hn(r);
  } catch (e) {
    throw new Bn(
      `Invalid token specified: invalid base64 for part #${n + 1} (${e.message})`,
    );
  }
  try {
    return JSON.parse(i);
  } catch (e) {
    throw new Bn(
      `Invalid token specified: invalid json for part #${n + 1} (${e.message})`,
    );
  }
}
var Wn = {
    debug: () => void 0,
    info: () => void 0,
    warn: () => void 0,
    error: () => void 0,
  },
  Gn,
  Kn,
  qn = ((e) => (
    (e[(e.NONE = 0)] = `NONE`),
    (e[(e.ERROR = 1)] = `ERROR`),
    (e[(e.WARN = 2)] = `WARN`),
    (e[(e.INFO = 3)] = `INFO`),
    (e[(e.DEBUG = 4)] = `DEBUG`),
    e
  ))(qn || {});
((e) => {
  function t() {
    ((Gn = 3), (Kn = Wn));
  }
  e.reset = t;
  function n(e) {
    if (!(0 <= e && e <= 4)) throw Error(`Invalid log level`);
    Gn = e;
  }
  e.setLevel = n;
  function r(e) {
    Kn = e;
  }
  e.setLogger = r;
})((qn ||= {}));
var N = class e {
  constructor(e) {
    this._name = e;
  }
  debug(...t) {
    Gn >= 4 && Kn.debug(e._format(this._name, this._method), ...t);
  }
  info(...t) {
    Gn >= 3 && Kn.info(e._format(this._name, this._method), ...t);
  }
  warn(...t) {
    Gn >= 2 && Kn.warn(e._format(this._name, this._method), ...t);
  }
  error(...t) {
    Gn >= 1 && Kn.error(e._format(this._name, this._method), ...t);
  }
  throw(e) {
    throw (this.error(e), e);
  }
  create(e) {
    let t = Object.create(this);
    return ((t._method = e), t.debug(`begin`), t);
  }
  static createStatic(t, n) {
    let r = new e(`${t}.${n}`);
    return (r.debug(`begin`), r);
  }
  static _format(e, t) {
    let n = `[${e}]`;
    return t ? `${n} ${t}:` : n;
  }
  static debug(t, ...n) {
    Gn >= 4 && Kn.debug(e._format(t), ...n);
  }
  static info(t, ...n) {
    Gn >= 3 && Kn.info(e._format(t), ...n);
  }
  static warn(t, ...n) {
    Gn >= 2 && Kn.warn(e._format(t), ...n);
  }
  static error(t, ...n) {
    Gn >= 1 && Kn.error(e._format(t), ...n);
  }
};
qn.reset();
var Jn = class {
    static decode(e) {
      try {
        return Un(e);
      } catch (e) {
        throw (N.error(`JwtUtils.decode`, e), e);
      }
    }
    static async generateSignedJwt(e, t, n) {
      let r = `${Qn.encodeBase64Url(new TextEncoder().encode(JSON.stringify(e)))}.${Qn.encodeBase64Url(new TextEncoder().encode(JSON.stringify(t)))}`,
        i = await window.crypto.subtle.sign(
          { name: `ECDSA`, hash: { name: `SHA-256` } },
          n,
          new TextEncoder().encode(r),
        );
      return `${r}.${Qn.encodeBase64Url(new Uint8Array(i))}`;
    }
    static async generateSignedJwtWithHmac(e, t, n) {
      let r = `${Qn.encodeBase64Url(new TextEncoder().encode(JSON.stringify(e)))}.${Qn.encodeBase64Url(new TextEncoder().encode(JSON.stringify(t)))}`,
        i = await window.crypto.subtle.sign(
          `HMAC`,
          n,
          new TextEncoder().encode(r),
        );
      return `${r}.${Qn.encodeBase64Url(new Uint8Array(i))}`;
    }
  },
  Yn = `10000000-1000-4000-8000-100000000000`,
  Xn = (e) =>
    btoa([...new Uint8Array(e)].map((e) => String.fromCharCode(e)).join(``)),
  Zn = class e {
    static _randomWord() {
      let e = new Uint32Array(1);
      return (crypto.getRandomValues(e), e[0]);
    }
    static generateUUIDv4() {
      return Yn.replace(/[018]/g, (t) =>
        (t ^ (e._randomWord() & (15 >> (t / 4)))).toString(16),
      ).replace(/-/g, ``);
    }
    static generateCodeVerifier() {
      return e.generateUUIDv4() + e.generateUUIDv4() + e.generateUUIDv4();
    }
    static async generateCodeChallenge(e) {
      if (!crypto.subtle)
        throw Error(
          `Crypto.subtle is available only in secure contexts (HTTPS).`,
        );
      try {
        let t = new TextEncoder().encode(e);
        return Xn(await crypto.subtle.digest(`SHA-256`, t))
          .replace(/\+/g, `-`)
          .replace(/\//g, `_`)
          .replace(/=+$/, ``);
      } catch (e) {
        throw (N.error(`CryptoUtils.generateCodeChallenge`, e), e);
      }
    }
    static generateBasicAuth(e, t) {
      return Xn(new TextEncoder().encode([e, t].join(`:`)));
    }
    static async hash(e, t) {
      let n = new TextEncoder().encode(t),
        r = await crypto.subtle.digest(e, n);
      return new Uint8Array(r);
    }
    static async customCalculateJwkThumbprint(t) {
      let n;
      switch (t.kty) {
        case `RSA`:
          n = { e: t.e, kty: t.kty, n: t.n };
          break;
        case `EC`:
          n = { crv: t.crv, kty: t.kty, x: t.x, y: t.y };
          break;
        case `OKP`:
          n = { crv: t.crv, kty: t.kty, x: t.x };
          break;
        case `oct`:
          n = { crv: t.k, kty: t.kty };
          break;
        default:
          throw Error(`Unknown jwk type`);
      }
      let r = await e.hash(`SHA-256`, JSON.stringify(n));
      return e.encodeBase64Url(r);
    }
    static async generateDPoPProof({
      url: t,
      accessToken: n,
      httpMethod: r,
      keyPair: i,
      nonce: a,
    }) {
      let o,
        s,
        c = {
          jti: window.crypto.randomUUID(),
          htm: r ?? `GET`,
          htu: t,
          iat: Math.floor(Date.now() / 1e3),
        };
      (n &&
        ((o = await e.hash(`SHA-256`, n)),
        (s = e.encodeBase64Url(o)),
        (c.ath = s)),
        a && (c.nonce = a));
      try {
        let e = await crypto.subtle.exportKey(`jwk`, i.publicKey),
          t = {
            alg: `ES256`,
            typ: `dpop+jwt`,
            jwk: { crv: e.crv, kty: e.kty, x: e.x, y: e.y },
          };
        return await Jn.generateSignedJwt(t, c, i.privateKey);
      } catch (e) {
        throw e instanceof TypeError
          ? Error(`Error exporting dpop public key: ${e.message}`)
          : e;
      }
    }
    static async generateDPoPJkt(t) {
      try {
        let n = await crypto.subtle.exportKey(`jwk`, t.publicKey);
        return await e.customCalculateJwkThumbprint(n);
      } catch (e) {
        throw e instanceof TypeError
          ? Error(`Could not retrieve dpop keys from storage: ${e.message}`)
          : e;
      }
    }
    static async generateDPoPKeys() {
      return await window.crypto.subtle.generateKey(
        { name: `ECDSA`, namedCurve: `P-256` },
        !1,
        [`sign`, `verify`],
      );
    }
    static async generateClientAssertionJwt(t, n, r, i = `HS256`) {
      let a = Math.floor(Date.now() / 1e3),
        o = { alg: i, typ: `JWT` },
        s = {
          iss: t,
          sub: t,
          aud: r,
          jti: e.generateUUIDv4(),
          exp: a + 300,
          iat: a,
        },
        c = { HS256: `SHA-256`, HS384: `SHA-384`, HS512: `SHA-512` }[i];
      if (!c)
        throw Error(
          `Unsupported algorithm: ${i}. Supported algorithms are: HS256, HS384, HS512`,
        );
      let l = new TextEncoder(),
        u = await crypto.subtle.importKey(
          `raw`,
          l.encode(n),
          { name: `HMAC`, hash: c },
          !1,
          [`sign`],
        );
      return await Jn.generateSignedJwtWithHmac(o, s, u);
    }
  };
Zn.encodeBase64Url = (e) =>
  Xn(e).replace(/=/g, ``).replace(/\+/g, `-`).replace(/\//g, `_`);
var Qn = Zn,
  $n = class {
    constructor(e) {
      ((this._name = e),
        (this._callbacks = []),
        (this._logger = new N(`Event('${this._name}')`)));
    }
    addHandler(e) {
      return (this._callbacks.push(e), () => this.removeHandler(e));
    }
    removeHandler(e) {
      let t = this._callbacks.lastIndexOf(e);
      t >= 0 && this._callbacks.splice(t, 1);
    }
    async raise(...e) {
      this._logger.debug(`raise:`, ...e);
      for (let t of this._callbacks) await t(...e);
    }
  },
  er = class {
    static center({ ...e }) {
      return (
        (e.width ??=
          [800, 720, 600, 480].find((e) => e <= window.outerWidth / 1.618) ??
          360),
        (e.left ??= Math.max(
          0,
          Math.round(window.screenX + (window.outerWidth - e.width) / 2),
        )),
        e.height != null &&
          (e.top ??= Math.max(
            0,
            Math.round(window.screenY + (window.outerHeight - e.height) / 2),
          )),
        e
      );
    }
    static serialize(e) {
      return Object.entries(e)
        .filter(([, e]) => e != null)
        .map(
          ([e, t]) => `${e}=${typeof t == `boolean` ? (t ? `yes` : `no`) : t}`,
        )
        .join(`,`);
    }
  },
  tr = class e extends $n {
    constructor() {
      (super(...arguments),
        (this._logger = new N(`Timer('${this._name}')`)),
        (this._timerHandle = null),
        (this._expiration = 0),
        (this._callback = () => {
          let t = this._expiration - e.getEpochTime();
          (this._logger.debug(`timer completes in`, t),
            this._expiration <= e.getEpochTime() &&
              (this.cancel(), super.raise()));
        }));
    }
    static getEpochTime() {
      return Math.floor(Date.now() / 1e3);
    }
    init(t) {
      let n = this._logger.create(`init`);
      t = Math.max(Math.floor(t), 1);
      let r = e.getEpochTime() + t;
      if (this.expiration === r && this._timerHandle) {
        n.debug(
          `skipping since already initialized for expiration at`,
          this.expiration,
        );
        return;
      }
      (this.cancel(), n.debug(`using duration`, t), (this._expiration = r));
      let i = Math.min(t, 5);
      this._timerHandle = setInterval(this._callback, i * 1e3);
    }
    get expiration() {
      return this._expiration;
    }
    cancel() {
      (this._logger.create(`cancel`),
        (this._timerHandle &&= (clearInterval(this._timerHandle), null)));
    }
  },
  nr = class {
    static readParams(e, t = `query`) {
      if (!e) throw TypeError(`Invalid URL`);
      let n = new URL(e, `http://127.0.0.1`)[
        t === `fragment` ? `hash` : `search`
      ];
      return new URLSearchParams(n.slice(1));
    }
  },
  rr = `;`,
  ir = class extends Error {
    constructor(e, t) {
      if (
        (super(e.error_description || e.error || ``),
        (this.form = t),
        (this.name = `ErrorResponse`),
        !e.error)
      )
        throw (
          N.error(`ErrorResponse`, `No error passed`),
          Error(`No error passed`)
        );
      ((this.error = e.error),
        (this.error_description = e.error_description ?? null),
        (this.error_uri = e.error_uri ?? null),
        (this.state = e.userState),
        (this.session_state = e.session_state ?? null),
        (this.url_state = e.url_state));
    }
  },
  ar = class extends Error {
    constructor(e) {
      (super(e), (this.name = `ErrorTimeout`));
    }
  },
  or = class {
    constructor(e) {
      ((this._logger = new N(`AccessTokenEvents`)),
        (this._expiringTimer = new tr(`Access token expiring`)),
        (this._expiredTimer = new tr(`Access token expired`)),
        (this._expiringNotificationTimeInSeconds =
          e.expiringNotificationTimeInSeconds));
    }
    async load(e) {
      let t = this._logger.create(`load`);
      if (e.access_token && e.expires_in !== void 0) {
        let n = e.expires_in;
        if ((t.debug(`access token present, remaining duration:`, n), n > 0)) {
          let e = n - this._expiringNotificationTimeInSeconds;
          (e <= 0 && (e = 1),
            t.debug(`registering expiring timer, raising in`, e, `seconds`),
            this._expiringTimer.init(e));
        } else
          (t.debug(
            `canceling existing expiring timer because we're past expiration.`,
          ),
            this._expiringTimer.cancel());
        let r = n + 1;
        (t.debug(`registering expired timer, raising in`, r, `seconds`),
          this._expiredTimer.init(r));
      } else (this._expiringTimer.cancel(), this._expiredTimer.cancel());
    }
    async unload() {
      (this._logger.debug(`unload: canceling existing access token timers`),
        this._expiringTimer.cancel(),
        this._expiredTimer.cancel());
    }
    addAccessTokenExpiring(e) {
      return this._expiringTimer.addHandler(e);
    }
    removeAccessTokenExpiring(e) {
      this._expiringTimer.removeHandler(e);
    }
    addAccessTokenExpired(e) {
      return this._expiredTimer.addHandler(e);
    }
    removeAccessTokenExpired(e) {
      this._expiredTimer.removeHandler(e);
    }
  },
  sr = class {
    constructor(e, t, n, r, i) {
      ((this._callback = e),
        (this._client_id = t),
        (this._intervalInSeconds = r),
        (this._stopOnError = i),
        (this._logger = new N(`CheckSessionIFrame`)),
        (this._timer = null),
        (this._session_state = null),
        (this._message = (e) => {
          e.origin === this._frame_origin &&
            e.source === this._frame.contentWindow &&
            (e.data === `error`
              ? (this._logger.error(
                  `error message from check session op iframe`,
                ),
                this._stopOnError && this.stop())
              : e.data === `changed`
                ? (this._logger.debug(
                    `changed message from check session op iframe`,
                  ),
                  this.stop(),
                  this._callback())
                : this._logger.debug(
                    e.data + ` message from check session op iframe`,
                  ));
        }));
      let a = new URL(n);
      ((this._frame_origin = a.origin),
        (this._frame = window.document.createElement(`iframe`)),
        (this._frame.style.visibility = `hidden`),
        (this._frame.style.position = `fixed`),
        (this._frame.style.left = `-1000px`),
        (this._frame.style.top = `0`),
        (this._frame.width = `0`),
        (this._frame.height = `0`),
        (this._frame.src = a.href));
    }
    load() {
      return new Promise((e) => {
        ((this._frame.onload = () => {
          e();
        }),
          window.document.body.appendChild(this._frame),
          window.addEventListener(`message`, this._message, !1));
      });
    }
    start(e) {
      if (this._session_state === e) return;
      (this._logger.create(`start`), this.stop(), (this._session_state = e));
      let t = () => {
        !this._frame.contentWindow ||
          !this._session_state ||
          this._frame.contentWindow.postMessage(
            this._client_id + ` ` + this._session_state,
            this._frame_origin,
          );
      };
      (t(), (this._timer = setInterval(t, this._intervalInSeconds * 1e3)));
    }
    stop() {
      (this._logger.create(`stop`),
        (this._session_state = null),
        (this._timer &&= (clearInterval(this._timer), null)));
    }
  },
  cr = class {
    constructor() {
      ((this._logger = new N(`InMemoryWebStorage`)), (this._data = {}));
    }
    clear() {
      (this._logger.create(`clear`), (this._data = {}));
    }
    getItem(e) {
      return (this._logger.create(`getItem('${e}')`), this._data[e]);
    }
    setItem(e, t) {
      (this._logger.create(`setItem('${e}')`), (this._data[e] = t));
    }
    removeItem(e) {
      (this._logger.create(`removeItem('${e}')`), delete this._data[e]);
    }
    get length() {
      return Object.getOwnPropertyNames(this._data).length;
    }
    key(e) {
      return Object.getOwnPropertyNames(this._data)[e];
    }
  },
  lr = class extends Error {
    constructor(e, t) {
      (super(t), (this.name = `ErrorDPoPNonce`), (this.nonce = e));
    }
  },
  ur = class {
    constructor(e = [], t = null, n = {}) {
      ((this._jwtHandler = t),
        (this._extraHeaders = n),
        (this._logger = new N(`JsonService`)),
        (this._contentTypes = []),
        this._contentTypes.push(...e, `application/json`),
        t && this._contentTypes.push(`application/jwt`));
    }
    async fetchWithTimeout(e, t = {}) {
      let { timeoutInSeconds: n, ...r } = t;
      if (!n) return await fetch(e, r);
      let i = new AbortController(),
        a = setTimeout(() => i.abort(), n * 1e3);
      try {
        return await fetch(e, { ...t, signal: i.signal });
      } catch (e) {
        throw e instanceof DOMException && e.name === `AbortError`
          ? new ar(`Network timed out`)
          : e;
      } finally {
        clearTimeout(a);
      }
    }
    async getJson(e, { token: t, credentials: n, timeoutInSeconds: r } = {}) {
      let i = this._logger.create(`getJson`),
        a = { Accept: this._contentTypes.join(`, `) };
      (t &&
        (i.debug(`token passed, setting Authorization header`),
        (a.Authorization = `Bearer ` + t)),
        this._appendExtraHeaders(a));
      let o;
      try {
        (i.debug(`url:`, e),
          (o = await this.fetchWithTimeout(e, {
            method: `GET`,
            headers: a,
            timeoutInSeconds: r,
            credentials: n,
          })));
      } catch (e) {
        throw (i.error(`Network Error`), e);
      }
      i.debug(`HTTP response received, status`, o.status);
      let s = o.headers.get(`Content-Type`);
      if (
        (s &&
          !this._contentTypes.find((e) => s.startsWith(e)) &&
          i.throw(
            Error(
              `Invalid response Content-Type: ${s ?? `undefined`}, from URL: ${e}`,
            ),
          ),
        o.ok && this._jwtHandler && s?.startsWith(`application/jwt`))
      )
        return await this._jwtHandler(await o.text());
      let c;
      try {
        c = await o.json();
      } catch (e) {
        throw (
          i.error(`Error parsing JSON response`, e),
          o.ok ? e : Error(`${o.statusText} (${o.status})`)
        );
      }
      if (!o.ok)
        throw (
          i.error(`Error from server:`, c),
          c.error
            ? new ir(c)
            : Error(`${o.statusText} (${o.status}): ${JSON.stringify(c)}`)
        );
      return c;
    }
    async postForm(
      e,
      {
        body: t,
        basicAuth: n,
        timeoutInSeconds: r,
        initCredentials: i,
        extraHeaders: a,
      },
    ) {
      let o = this._logger.create(`postForm`),
        s = {
          Accept: this._contentTypes.join(`, `),
          "Content-Type": `application/x-www-form-urlencoded`,
          ...a,
        };
      (n !== void 0 && (s.Authorization = `Basic ` + n),
        this._appendExtraHeaders(s));
      let c;
      try {
        (o.debug(`url:`, e),
          (c = await this.fetchWithTimeout(e, {
            method: `POST`,
            headers: s,
            body: t,
            timeoutInSeconds: r,
            credentials: i,
          })));
      } catch (e) {
        throw (o.error(`Network error`), e);
      }
      o.debug(`HTTP response received, status`, c.status);
      let l = c.headers.get(`Content-Type`);
      if (l && !this._contentTypes.find((e) => l.startsWith(e)))
        throw Error(
          `Invalid response Content-Type: ${l ?? `undefined`}, from URL: ${e}`,
        );
      let u = await c.text(),
        d = {};
      if (u)
        try {
          d = JSON.parse(u);
        } catch (e) {
          throw (
            o.error(`Error parsing JSON response`, e),
            c.ok ? e : Error(`${c.statusText} (${c.status})`)
          );
        }
      if (!c.ok)
        throw (
          o.error(`Error from server:`, d),
          c.headers.has(`dpop-nonce`)
            ? new lr(c.headers.get(`dpop-nonce`), `${JSON.stringify(d)}`)
            : d.error
              ? new ir(d, t)
              : Error(`${c.statusText} (${c.status}): ${JSON.stringify(d)}`)
        );
      return d;
    }
    _appendExtraHeaders(e) {
      let t = this._logger.create(`appendExtraHeaders`),
        n = Object.keys(this._extraHeaders),
        r = [`accept`, `content-type`],
        i = [`authorization`];
      n.length !== 0 &&
        n.forEach((n) => {
          if (r.includes(n.toLocaleLowerCase())) {
            t.warn(`Protected header could not be set`, n, r);
            return;
          }
          if (i.includes(n.toLocaleLowerCase()) && Object.keys(e).includes(n)) {
            t.warn(`Header could not be overridden`, n, i);
            return;
          }
          let a =
            typeof this._extraHeaders[n] == `function`
              ? this._extraHeaders[n]()
              : this._extraHeaders[n];
          a && a !== `` && (e[n] = a);
        });
    }
  },
  dr = class {
    constructor(e) {
      ((this._settings = e),
        (this._logger = new N(`MetadataService`)),
        (this._signingKeys = null),
        (this._metadata = null),
        (this._metadataUrl = this._settings.metadataUrl),
        (this._jsonService = new ur(
          [`application/jwk-set+json`],
          null,
          this._settings.extraHeaders,
        )),
        this._settings.signingKeys &&
          (this._logger.debug(`using signingKeys from settings`),
          (this._signingKeys = this._settings.signingKeys)),
        this._settings.metadata &&
          (this._logger.debug(`using metadata from settings`),
          (this._metadata = this._settings.metadata)),
        this._settings.fetchRequestCredentials &&
          (this._logger.debug(`using fetchRequestCredentials from settings`),
          (this._fetchRequestCredentials =
            this._settings.fetchRequestCredentials)));
    }
    resetSigningKeys() {
      this._signingKeys = null;
    }
    async getMetadata() {
      let e = this._logger.create(`getMetadata`);
      if (this._metadata)
        return (e.debug(`using cached values`), this._metadata);
      if (!this._metadataUrl)
        throw (
          e.throw(Error(`No authority or metadataUrl configured on settings`)),
          null
        );
      e.debug(`getting metadata from`, this._metadataUrl);
      let t = await this._jsonService.getJson(this._metadataUrl, {
        credentials: this._fetchRequestCredentials,
        timeoutInSeconds: this._settings.requestTimeoutInSeconds,
      });
      return (
        e.debug(`merging remote JSON with seed metadata`),
        (this._metadata = Object.assign({}, t, this._settings.metadataSeed)),
        this._metadata
      );
    }
    getIssuer() {
      return this._getMetadataProperty(`issuer`);
    }
    getAuthorizationEndpoint() {
      return this._getMetadataProperty(`authorization_endpoint`);
    }
    getUserInfoEndpoint() {
      return this._getMetadataProperty(`userinfo_endpoint`);
    }
    getTokenEndpoint(e = !0) {
      return this._getMetadataProperty(`token_endpoint`, e);
    }
    getCheckSessionIframe() {
      return this._getMetadataProperty(`check_session_iframe`, !0);
    }
    getEndSessionEndpoint() {
      return this._getMetadataProperty(`end_session_endpoint`, !0);
    }
    getRevocationEndpoint(e = !0) {
      return this._getMetadataProperty(`revocation_endpoint`, e);
    }
    getKeysEndpoint(e = !0) {
      return this._getMetadataProperty(`jwks_uri`, e);
    }
    async _getMetadataProperty(e, t = !1) {
      let n = this._logger.create(`_getMetadataProperty('${e}')`),
        r = await this.getMetadata();
      if ((n.debug(`resolved`), r[e] === void 0)) {
        if (t === !0) {
          n.warn(`Metadata does not contain optional property`);
          return;
        }
        n.throw(Error(`Metadata does not contain property ` + e));
      }
      return r[e];
    }
    async getSigningKeys() {
      let e = this._logger.create(`getSigningKeys`);
      if (this._signingKeys)
        return (e.debug(`returning signingKeys from cache`), this._signingKeys);
      let t = await this.getKeysEndpoint(!1);
      e.debug(`got jwks_uri`, t);
      let n = await this._jsonService.getJson(t, {
        timeoutInSeconds: this._settings.requestTimeoutInSeconds,
      });
      if ((e.debug(`got key set`, n), !Array.isArray(n.keys)))
        throw (e.throw(Error(`Missing keys on keyset`)), null);
      return ((this._signingKeys = n.keys), this._signingKeys);
    }
  },
  fr = class {
    constructor({ prefix: e = `oidc.`, store: t = localStorage } = {}) {
      ((this._logger = new N(`WebStorageStateStore`)),
        (this._store = t),
        (this._prefix = e));
    }
    async set(e, t) {
      (this._logger.create(`set('${e}')`),
        (e = this._prefix + e),
        await this._store.setItem(e, t));
    }
    async get(e) {
      return (
        this._logger.create(`get('${e}')`),
        (e = this._prefix + e),
        await this._store.getItem(e)
      );
    }
    async remove(e) {
      (this._logger.create(`remove('${e}')`), (e = this._prefix + e));
      let t = await this._store.getItem(e);
      return (await this._store.removeItem(e), t);
    }
    async getAllKeys() {
      this._logger.create(`getAllKeys`);
      let e = await this._store.length,
        t = [];
      for (let n = 0; n < e; n++) {
        let e = await this._store.key(n);
        e &&
          e.indexOf(this._prefix) === 0 &&
          t.push(e.substr(this._prefix.length));
      }
      return t;
    }
  },
  pr = `code`,
  mr = `openid`,
  hr = `client_secret_post`,
  gr = 900,
  _r = class {
    constructor({
      authority: e,
      metadataUrl: t,
      metadata: n,
      signingKeys: r,
      metadataSeed: i,
      client_id: a,
      client_secret: o,
      response_type: s = pr,
      scope: c = mr,
      redirect_uri: l,
      post_logout_redirect_uri: u,
      client_authentication: d = hr,
      token_endpoint_auth_signing_alg: f = `HS256`,
      prompt: p,
      display: m,
      max_age: h,
      ui_locales: g,
      acr_values: _,
      resource: v,
      response_mode: y,
      filterProtocolClaims: b = !0,
      loadUserInfo: x = !1,
      requestTimeoutInSeconds: S,
      staleStateAgeInSeconds: C = gr,
      mergeClaimsStrategy: w = { array: `replace` },
      disablePKCE: T = !1,
      stateStore: ee,
      revokeTokenAdditionalContentTypes: te,
      fetchRequestCredentials: E,
      refreshTokenAllowedScope: ne,
      extraQueryParams: re = {},
      extraTokenParams: ie = {},
      extraHeaders: ae = {},
      dpop: oe,
      omitScopeWhenRequesting: se = !1,
    }) {
      if (
        ((this.authority = e),
        t
          ? (this.metadataUrl = t)
          : ((this.metadataUrl = e),
            e &&
              (this.metadataUrl.endsWith(`/`) || (this.metadataUrl += `/`),
              (this.metadataUrl += `.well-known/openid-configuration`))),
        (this.metadata = n),
        (this.metadataSeed = i),
        (this.signingKeys = r),
        (this.client_id = a),
        (this.client_secret = o),
        (this.response_type = s),
        (this.scope = c),
        (this.redirect_uri = l),
        (this.post_logout_redirect_uri = u),
        (this.client_authentication = d),
        (this.token_endpoint_auth_signing_alg = f),
        (this.prompt = p),
        (this.display = m),
        (this.max_age = h),
        (this.ui_locales = g),
        (this.acr_values = _),
        (this.resource = v),
        (this.response_mode = y),
        (this.filterProtocolClaims = b ?? !0),
        (this.loadUserInfo = !!x),
        (this.staleStateAgeInSeconds = C),
        (this.mergeClaimsStrategy = w),
        (this.omitScopeWhenRequesting = se),
        (this.disablePKCE = !!T),
        (this.revokeTokenAdditionalContentTypes = te),
        (this.fetchRequestCredentials = E || `same-origin`),
        (this.requestTimeoutInSeconds = S),
        ee)
      )
        this.stateStore = ee;
      else {
        let e = typeof window < `u` ? window.localStorage : new cr();
        this.stateStore = new fr({ store: e });
      }
      if (
        ((this.refreshTokenAllowedScope = ne),
        (this.extraQueryParams = re),
        (this.extraTokenParams = ie),
        (this.extraHeaders = ae),
        (this.dpop = oe),
        this.dpop && !this.dpop?.store)
      )
        throw Error(`A DPoPStore is required when dpop is enabled`);
    }
  },
  vr = class {
    constructor(e, t) {
      ((this._settings = e),
        (this._metadataService = t),
        (this._logger = new N(`UserInfoService`)),
        (this._getClaimsFromJwt = async (e) => {
          let t = this._logger.create(`_getClaimsFromJwt`);
          try {
            let n = Jn.decode(e);
            return (t.debug(`JWT decoding successful`), n);
          } catch (e) {
            throw (t.error(`Error parsing JWT response`), e);
          }
        }),
        (this._jsonService = new ur(
          void 0,
          this._getClaimsFromJwt,
          this._settings.extraHeaders,
        )));
    }
    async getClaims(e) {
      let t = this._logger.create(`getClaims`);
      e || this._logger.throw(Error(`No token passed`));
      let n = await this._metadataService.getUserInfoEndpoint();
      t.debug(`got userinfo url`, n);
      let r = await this._jsonService.getJson(n, {
        token: e,
        credentials: this._settings.fetchRequestCredentials,
        timeoutInSeconds: this._settings.requestTimeoutInSeconds,
      });
      return (t.debug(`got claims`, r), r);
    }
  },
  yr = class {
    constructor(e, t) {
      ((this._settings = e),
        (this._metadataService = t),
        (this._logger = new N(`TokenClient`)),
        (this._jsonService = new ur(
          this._settings.revokeTokenAdditionalContentTypes,
          null,
          this._settings.extraHeaders,
        )));
    }
    async exchangeCode({
      grant_type: e = `authorization_code`,
      redirect_uri: t = this._settings.redirect_uri,
      client_id: n = this._settings.client_id,
      client_secret: r = this._settings.client_secret,
      extraHeaders: i,
      ...a
    }) {
      let o = this._logger.create(`exchangeCode`);
      (n || o.throw(Error(`A client_id is required`)),
        t || o.throw(Error(`A redirect_uri is required`)),
        a.code || o.throw(Error(`A code is required`)));
      let s = new URLSearchParams({ grant_type: e, redirect_uri: t });
      for (let [e, t] of Object.entries(a)) t != null && s.set(e, t);
      if (
        (this._settings.client_authentication === `client_secret_basic` ||
          this._settings.client_authentication === `client_secret_jwt`) &&
        r == null
      )
        throw (o.throw(Error(`A client_secret is required`)), null);
      let c,
        l = await this._metadataService.getTokenEndpoint(!1);
      switch (this._settings.client_authentication) {
        case `client_secret_basic`:
          c = Qn.generateBasicAuth(n, r);
          break;
        case `client_secret_post`:
          (s.append(`client_id`, n), r && s.append(`client_secret`, r));
          break;
        case `client_secret_jwt`: {
          let e = await Qn.generateClientAssertionJwt(
            n,
            r,
            l,
            this._settings.token_endpoint_auth_signing_alg,
          );
          (s.append(`client_id`, n),
            s.append(
              `client_assertion_type`,
              `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`,
            ),
            s.append(`client_assertion`, e));
          break;
        }
      }
      o.debug(`got token endpoint`);
      let u = await this._jsonService.postForm(l, {
        body: s,
        basicAuth: c,
        timeoutInSeconds: this._settings.requestTimeoutInSeconds,
        initCredentials: this._settings.fetchRequestCredentials,
        extraHeaders: i,
      });
      return (o.debug(`got response`), u);
    }
    async exchangeCredentials({
      grant_type: e = `password`,
      client_id: t = this._settings.client_id,
      client_secret: n = this._settings.client_secret,
      scope: r = this._settings.scope,
      ...i
    }) {
      let a = this._logger.create(`exchangeCredentials`);
      t || a.throw(Error(`A client_id is required`));
      let o = new URLSearchParams({ grant_type: e });
      this._settings.omitScopeWhenRequesting || o.set(`scope`, r);
      for (let [e, t] of Object.entries(i)) t != null && o.set(e, t);
      if (
        (this._settings.client_authentication === `client_secret_basic` ||
          this._settings.client_authentication === `client_secret_jwt`) &&
        n == null
      )
        throw (a.throw(Error(`A client_secret is required`)), null);
      let s,
        c = await this._metadataService.getTokenEndpoint(!1);
      switch (this._settings.client_authentication) {
        case `client_secret_basic`:
          s = Qn.generateBasicAuth(t, n);
          break;
        case `client_secret_post`:
          (o.append(`client_id`, t), n && o.append(`client_secret`, n));
          break;
        case `client_secret_jwt`: {
          let e = await Qn.generateClientAssertionJwt(
            t,
            n,
            c,
            this._settings.token_endpoint_auth_signing_alg,
          );
          (o.append(`client_id`, t),
            o.append(
              `client_assertion_type`,
              `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`,
            ),
            o.append(`client_assertion`, e));
          break;
        }
      }
      a.debug(`got token endpoint`);
      let l = await this._jsonService.postForm(c, {
        body: o,
        basicAuth: s,
        timeoutInSeconds: this._settings.requestTimeoutInSeconds,
        initCredentials: this._settings.fetchRequestCredentials,
      });
      return (a.debug(`got response`), l);
    }
    async exchangeRefreshToken({
      grant_type: e = `refresh_token`,
      client_id: t = this._settings.client_id,
      client_secret: n = this._settings.client_secret,
      timeoutInSeconds: r,
      extraHeaders: i,
      ...a
    }) {
      let o = this._logger.create(`exchangeRefreshToken`);
      (t || o.throw(Error(`A client_id is required`)),
        a.refresh_token || o.throw(Error(`A refresh_token is required`)));
      let s = new URLSearchParams({ grant_type: e });
      for (let [e, t] of Object.entries(a))
        Array.isArray(t)
          ? t.forEach((t) => s.append(e, t))
          : t != null && s.set(e, t);
      if (
        (this._settings.client_authentication === `client_secret_basic` ||
          this._settings.client_authentication === `client_secret_jwt`) &&
        n == null
      )
        throw (o.throw(Error(`A client_secret is required`)), null);
      let c,
        l = await this._metadataService.getTokenEndpoint(!1);
      switch (this._settings.client_authentication) {
        case `client_secret_basic`:
          c = Qn.generateBasicAuth(t, n);
          break;
        case `client_secret_post`:
          (s.append(`client_id`, t), n && s.append(`client_secret`, n));
          break;
        case `client_secret_jwt`: {
          let e = await Qn.generateClientAssertionJwt(
            t,
            n,
            l,
            this._settings.token_endpoint_auth_signing_alg,
          );
          (s.append(`client_id`, t),
            s.append(
              `client_assertion_type`,
              `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`,
            ),
            s.append(`client_assertion`, e));
          break;
        }
      }
      o.debug(`got token endpoint`);
      let u = await this._jsonService.postForm(l, {
        body: s,
        basicAuth: c,
        timeoutInSeconds: r,
        initCredentials: this._settings.fetchRequestCredentials,
        extraHeaders: i,
      });
      return (o.debug(`got response`), u);
    }
    async revoke(e) {
      let t = this._logger.create(`revoke`);
      e.token || t.throw(Error(`A token is required`));
      let n = await this._metadataService.getRevocationEndpoint(!1);
      t.debug(
        `got revocation endpoint, revoking ${e.token_type_hint ?? `default token type`}`,
      );
      let r = new URLSearchParams();
      for (let [t, n] of Object.entries(e)) n != null && r.set(t, n);
      (r.set(`client_id`, this._settings.client_id),
        this._settings.client_secret &&
          r.set(`client_secret`, this._settings.client_secret),
        await this._jsonService.postForm(n, {
          body: r,
          timeoutInSeconds: this._settings.requestTimeoutInSeconds,
        }),
        t.debug(`got response`));
    }
  },
  br = class {
    constructor(e, t, n) {
      ((this._settings = e),
        (this._metadataService = t),
        (this._claimsService = n),
        (this._logger = new N(`ResponseValidator`)),
        (this._userInfoService = new vr(this._settings, this._metadataService)),
        (this._tokenClient = new yr(this._settings, this._metadataService)));
    }
    async validateSigninResponse(e, t, n) {
      let r = this._logger.create(`validateSigninResponse`);
      (this._processSigninState(e, t),
        r.debug(`state processed`),
        await this._processCode(e, t, n),
        r.debug(`code processed`),
        e.isOpenId && this._validateIdTokenAttributes(e, ``, t.nonce),
        r.debug(`tokens validated`),
        await this._processClaims(e, t?.skipUserInfo, e.isOpenId),
        r.debug(`claims processed`));
    }
    async validateCredentialsResponse(e, t) {
      let n = this._logger.create(`validateCredentialsResponse`),
        r = e.isOpenId && !!e.id_token;
      (r && this._validateIdTokenAttributes(e),
        n.debug(`tokens validated`),
        await this._processClaims(e, t, r),
        n.debug(`claims processed`));
    }
    async validateRefreshResponse(e, t) {
      let n = this._logger.create(`validateRefreshResponse`);
      ((e.userState = t.data),
        (e.session_state ??= t.session_state),
        (e.scope ??= t.scope),
        e.isOpenId &&
          e.id_token &&
          (this._validateIdTokenAttributes(e, t.id_token),
          n.debug(`ID Token validated`)),
        e.id_token || ((e.id_token = t.id_token), (e.profile = t.profile)));
      let r = e.isOpenId && !!e.id_token;
      (await this._processClaims(e, !1, r), n.debug(`claims processed`));
    }
    validateSignoutResponse(e, t) {
      let n = this._logger.create(`validateSignoutResponse`);
      if (
        (t.id !== e.state && n.throw(Error(`State does not match`)),
        n.debug(`state validated`),
        (e.userState = t.data),
        e.error)
      )
        throw (n.warn(`Response was error`, e.error), new ir(e));
    }
    _processSigninState(e, t) {
      let n = this._logger.create(`_processSigninState`);
      if (
        (t.id !== e.state && n.throw(Error(`State does not match`)),
        t.client_id || n.throw(Error(`No client_id on state`)),
        t.authority || n.throw(Error(`No authority on state`)),
        this._settings.authority !== t.authority &&
          n.throw(Error(`authority mismatch on settings vs. signin state`)),
        this._settings.client_id &&
          this._settings.client_id !== t.client_id &&
          n.throw(Error(`client_id mismatch on settings vs. signin state`)),
        n.debug(`state validated`),
        (e.userState = t.data),
        (e.url_state = t.url_state),
        (e.scope ??= t.scope),
        e.error)
      )
        throw (n.warn(`Response was error`, e.error), new ir(e));
      t.code_verifier && !e.code && n.throw(Error(`Expected code in response`));
    }
    async _processClaims(e, t = !1, n = !0) {
      let r = this._logger.create(`_processClaims`);
      if (
        ((e.profile = this._claimsService.filterProtocolClaims(e.profile)),
        t || !this._settings.loadUserInfo || !e.access_token)
      ) {
        r.debug(`not loading user info`);
        return;
      }
      r.debug(`loading user info`);
      let i = await this._userInfoService.getClaims(e.access_token);
      (r.debug(`user info claims received from user info endpoint`),
        n &&
          i.sub !== e.profile.sub &&
          r.throw(
            Error(
              `subject from UserInfo response does not match subject in ID Token`,
            ),
          ),
        (e.profile = this._claimsService.mergeClaims(
          e.profile,
          this._claimsService.filterProtocolClaims(i),
        )),
        r.debug(`user info claims received, updated profile:`, e.profile));
    }
    async _processCode(e, t, n) {
      let r = this._logger.create(`_processCode`);
      if (e.code) {
        r.debug(`Validating code`);
        let i = await this._tokenClient.exchangeCode({
          client_id: t.client_id,
          client_secret: t.client_secret,
          code: e.code,
          redirect_uri: t.redirect_uri,
          code_verifier: t.code_verifier,
          extraHeaders: n,
          ...t.extraTokenParams,
        });
        Object.assign(e, i);
      } else r.debug(`No code to process`);
    }
    _validateIdTokenAttributes(e, t, n) {
      let r = this._logger.create(`_validateIdTokenAttributes`);
      r.debug(`decoding ID Token JWT`);
      let i = Jn.decode(e.id_token ?? ``);
      if (
        (i.sub || r.throw(Error(`ID Token is missing a subject claim`)),
        n &&
          i.nonce !== n &&
          r.throw(
            Error(`nonce in id_token does not match nonce in client storage`),
          ),
        t)
      ) {
        let e = Jn.decode(t);
        (i.sub !== e.sub &&
          r.throw(Error(`sub in id_token does not match current sub`)),
          i.auth_time &&
            i.auth_time !== e.auth_time &&
            r.throw(
              Error(`auth_time in id_token does not match original auth_time`),
            ),
          i.azp &&
            i.azp !== e.azp &&
            r.throw(Error(`azp in id_token does not match original azp`)),
          !i.azp &&
            e.azp &&
            r.throw(
              Error(`azp not in id_token, but present in original id_token`),
            ));
      }
      e.profile = i;
    }
  },
  xr = class e {
    constructor(e) {
      ((this.id = e.id || Qn.generateUUIDv4()),
        (this.data = e.data),
        (this.created =
          e.created && e.created > 0 ? e.created : tr.getEpochTime()),
        (this.request_type = e.request_type),
        (this.url_state = e.url_state));
    }
    toStorageString() {
      return (
        new N(`State`).create(`toStorageString`),
        JSON.stringify({
          id: this.id,
          data: this.data,
          created: this.created,
          request_type: this.request_type,
          url_state: this.url_state,
        })
      );
    }
    static fromStorageString(t) {
      return (
        N.createStatic(`State`, `fromStorageString`),
        Promise.resolve(new e(JSON.parse(t)))
      );
    }
    static async clearStaleState(t, n) {
      let r = N.createStatic(`State`, `clearStaleState`),
        i = tr.getEpochTime() - n,
        a = await t.getAllKeys();
      r.debug(`got keys`, a);
      for (let n = 0; n < a.length; n++) {
        let o = a[n],
          s = await t.get(o),
          c = !1;
        if (s)
          try {
            let t = await e.fromStorageString(s);
            (r.debug(`got item from key:`, o, t.created),
              t.created <= i && (c = !0));
          } catch (e) {
            (r.error(`Error parsing state for key:`, o, e), (c = !0));
          }
        else (r.debug(`no item in storage for key:`, o), (c = !0));
        c && (r.debug(`removed item for key:`, o), t.remove(o));
      }
    }
  },
  Sr = class e extends xr {
    constructor(e) {
      (super(e),
        (this.code_verifier = e.code_verifier),
        (this.code_challenge = e.code_challenge),
        (this.authority = e.authority),
        (this.client_id = e.client_id),
        (this.redirect_uri = e.redirect_uri),
        (this.scope = e.scope),
        (this.client_secret = e.client_secret),
        (this.extraTokenParams = e.extraTokenParams),
        (this.response_mode = e.response_mode),
        (this.skipUserInfo = e.skipUserInfo),
        (this.nonce = e.nonce));
    }
    static async create(t) {
      let n =
          t.code_verifier === !0
            ? Qn.generateCodeVerifier()
            : t.code_verifier || void 0,
        r = n ? await Qn.generateCodeChallenge(n) : void 0;
      return new e({ ...t, code_verifier: n, code_challenge: r });
    }
    toStorageString() {
      return (
        new N(`SigninState`).create(`toStorageString`),
        JSON.stringify({
          id: this.id,
          data: this.data,
          created: this.created,
          request_type: this.request_type,
          url_state: this.url_state,
          code_verifier: this.code_verifier,
          authority: this.authority,
          client_id: this.client_id,
          redirect_uri: this.redirect_uri,
          scope: this.scope,
          client_secret: this.client_secret,
          extraTokenParams: this.extraTokenParams,
          response_mode: this.response_mode,
          skipUserInfo: this.skipUserInfo,
          nonce: this.nonce,
        })
      );
    }
    static fromStorageString(t) {
      N.createStatic(`SigninState`, `fromStorageString`);
      let n = JSON.parse(t);
      return e.create(n);
    }
  },
  Cr = class e {
    constructor(e) {
      ((this.url = e.url), (this.state = e.state));
    }
    static async create({
      url: t,
      authority: n,
      client_id: r,
      redirect_uri: i,
      response_type: a,
      scope: o,
      state_data: s,
      response_mode: c,
      request_type: l,
      client_secret: u,
      nonce: d,
      url_state: f,
      resource: p,
      skipUserInfo: m,
      extraQueryParams: h,
      extraTokenParams: g,
      disablePKCE: _,
      dpopJkt: v,
      omitScopeWhenRequesting: y,
      ...b
    }) {
      if (!t) throw (this._logger.error(`create: No url passed`), Error(`url`));
      if (!r)
        throw (
          this._logger.error(`create: No client_id passed`),
          Error(`client_id`)
        );
      if (!i)
        throw (
          this._logger.error(`create: No redirect_uri passed`),
          Error(`redirect_uri`)
        );
      if (!a)
        throw (
          this._logger.error(`create: No response_type passed`),
          Error(`response_type`)
        );
      if (!o)
        throw (this._logger.error(`create: No scope passed`), Error(`scope`));
      if (!n)
        throw (
          this._logger.error(`create: No authority passed`),
          Error(`authority`)
        );
      let x = await Sr.create({
          data: s,
          request_type: l,
          url_state: f,
          code_verifier: !_,
          client_id: r,
          authority: n,
          redirect_uri: i,
          response_mode: c,
          client_secret: u,
          scope: o,
          extraTokenParams: g,
          skipUserInfo: m,
          nonce: d,
        }),
        S = new URL(t);
      (S.searchParams.append(`client_id`, r),
        S.searchParams.append(`redirect_uri`, i),
        S.searchParams.append(`response_type`, a),
        y || S.searchParams.append(`scope`, o),
        d && S.searchParams.append(`nonce`, d),
        v && S.searchParams.append(`dpop_jkt`, v));
      let C = x.id;
      (f && (C = `${C}${rr}${f}`),
        S.searchParams.append(`state`, C),
        x.code_challenge &&
          (S.searchParams.append(`code_challenge`, x.code_challenge),
          S.searchParams.append(`code_challenge_method`, `S256`)),
        p &&
          (Array.isArray(p) ? p : [p]).forEach((e) =>
            S.searchParams.append(`resource`, e),
          ));
      for (let [e, t] of Object.entries({ response_mode: c, ...b, ...h }))
        t != null && S.searchParams.append(e, t.toString());
      return new e({ url: S.href, state: x });
    }
  };
Cr._logger = new N(`SigninRequest`);
var wr = Cr,
  Tr = `openid`,
  Er = class {
    constructor(e) {
      if (
        ((this.access_token = ``),
        (this.token_type = ``),
        (this.profile = {}),
        (this.state = e.get(`state`)),
        (this.session_state = e.get(`session_state`)),
        this.state)
      ) {
        let e = decodeURIComponent(this.state).split(rr);
        ((this.state = e[0]),
          e.length > 1 && (this.url_state = e.slice(1).join(rr)));
      }
      ((this.error = e.get(`error`)),
        (this.error_description = e.get(`error_description`)),
        (this.error_uri = e.get(`error_uri`)),
        (this.code = e.get(`code`)));
    }
    get expires_in() {
      if (this.expires_at !== void 0)
        return this.expires_at - tr.getEpochTime();
    }
    set expires_in(e) {
      (typeof e == `string` && (e = Number(e)),
        e !== void 0 &&
          e >= 0 &&
          (this.expires_at = Math.floor(e) + tr.getEpochTime()));
    }
    get isOpenId() {
      return this.scope?.split(` `).includes(Tr) || !!this.id_token;
    }
  },
  Dr = class {
    constructor({
      url: e,
      state_data: t,
      id_token_hint: n,
      post_logout_redirect_uri: r,
      extraQueryParams: i,
      request_type: a,
      client_id: o,
      url_state: s,
    }) {
      if (((this._logger = new N(`SignoutRequest`)), !e))
        throw (this._logger.error(`ctor: No url passed`), Error(`url`));
      let c = new URL(e);
      if (
        (n && c.searchParams.append(`id_token_hint`, n),
        o && c.searchParams.append(`client_id`, o),
        r && (c.searchParams.append(`post_logout_redirect_uri`, r), t || s))
      ) {
        this.state = new xr({ data: t, request_type: a, url_state: s });
        let e = this.state.id;
        (s && (e = `${e}${rr}${s}`), c.searchParams.append(`state`, e));
      }
      for (let [e, t] of Object.entries({ ...i }))
        t != null && c.searchParams.append(e, t.toString());
      this.url = c.href;
    }
  },
  Or = class {
    constructor(e) {
      if (((this.state = e.get(`state`)), this.state)) {
        let e = decodeURIComponent(this.state).split(rr);
        ((this.state = e[0]),
          e.length > 1 && (this.url_state = e.slice(1).join(rr)));
      }
      ((this.error = e.get(`error`)),
        (this.error_description = e.get(`error_description`)),
        (this.error_uri = e.get(`error_uri`)));
    }
  },
  kr = [`nbf`, `jti`, `auth_time`, `nonce`, `acr`, `amr`, `azp`, `at_hash`],
  Ar = [`sub`, `iss`, `aud`, `exp`, `iat`],
  jr = class {
    constructor(e) {
      ((this._settings = e), (this._logger = new N(`ClaimsService`)));
    }
    filterProtocolClaims(e) {
      let t = { ...e };
      if (this._settings.filterProtocolClaims) {
        let e;
        e = Array.isArray(this._settings.filterProtocolClaims)
          ? this._settings.filterProtocolClaims
          : kr;
        for (let n of e) Ar.includes(n) || delete t[n];
      }
      return t;
    }
    mergeClaims(e, t) {
      let n = { ...e };
      for (let [e, r] of Object.entries(t))
        if (n[e] !== r)
          if (Array.isArray(n[e]) || Array.isArray(r))
            if (this._settings.mergeClaimsStrategy.array == `replace`) n[e] = r;
            else {
              let t = Array.isArray(n[e]) ? n[e] : [n[e]];
              for (let e of Array.isArray(r) ? r : [r])
                t.includes(e) || t.push(e);
              n[e] = t;
            }
          else
            n[e] =
              typeof n[e] == `object` && typeof r == `object`
                ? this.mergeClaims(n[e], r)
                : r;
      return n;
    }
  },
  Mr = class {
    constructor(e, t) {
      ((this.keys = e), (this.nonce = t));
    }
  },
  Nr = class {
    constructor(e, t) {
      ((this._logger = new N(`OidcClient`)),
        (this.settings = e instanceof _r ? e : new _r(e)),
        (this.metadataService = t ?? new dr(this.settings)),
        (this._claimsService = new jr(this.settings)),
        (this._validator = new br(
          this.settings,
          this.metadataService,
          this._claimsService,
        )),
        (this._tokenClient = new yr(this.settings, this.metadataService)));
    }
    async createSigninRequest({
      state: e,
      request: t,
      request_uri: n,
      request_type: r,
      id_token_hint: i,
      login_hint: a,
      skipUserInfo: o,
      nonce: s,
      url_state: c,
      response_type: l = this.settings.response_type,
      scope: u = this.settings.scope,
      redirect_uri: d = this.settings.redirect_uri,
      prompt: f = this.settings.prompt,
      display: p = this.settings.display,
      max_age: m = this.settings.max_age,
      ui_locales: h = this.settings.ui_locales,
      acr_values: g = this.settings.acr_values,
      resource: _ = this.settings.resource,
      response_mode: v = this.settings.response_mode,
      extraQueryParams: y = this.settings.extraQueryParams,
      extraTokenParams: b = this.settings.extraTokenParams,
      dpopJkt: x,
      omitScopeWhenRequesting: S = this.settings.omitScopeWhenRequesting,
    }) {
      let C = this._logger.create(`createSigninRequest`);
      if (l !== `code`)
        throw Error(
          `Only the Authorization Code flow (with PKCE) is supported`,
        );
      let w = await this.metadataService.getAuthorizationEndpoint();
      C.debug(`Received authorization endpoint`, w);
      let T = await wr.create({
        url: w,
        authority: this.settings.authority,
        client_id: this.settings.client_id,
        redirect_uri: d,
        response_type: l,
        scope: u,
        state_data: e,
        url_state: c,
        prompt: f,
        display: p,
        max_age: m,
        ui_locales: h,
        id_token_hint: i,
        login_hint: a,
        acr_values: g,
        dpopJkt: x,
        resource: _,
        request: t,
        request_uri: n,
        extraQueryParams: y,
        extraTokenParams: b,
        request_type: r,
        response_mode: v,
        client_secret: this.settings.client_secret,
        skipUserInfo: o,
        nonce: s,
        disablePKCE: this.settings.disablePKCE,
        omitScopeWhenRequesting: S,
      });
      await this.clearStaleState();
      let ee = T.state;
      return (
        await this.settings.stateStore.set(ee.id, ee.toStorageString()),
        T
      );
    }
    async readSigninResponseState(e, t = !1) {
      let n = this._logger.create(`readSigninResponseState`),
        r = new Er(nr.readParams(e, this.settings.response_mode));
      if (!r.state) throw (n.throw(Error(`No state in response`)), null);
      let i = await this.settings.stateStore[t ? `remove` : `get`](r.state);
      if (!i)
        throw (n.throw(Error(`No matching state found in storage`)), null);
      return { state: await Sr.fromStorageString(i), response: r };
    }
    async processSigninResponse(e, t, n = !0) {
      let r = this._logger.create(`processSigninResponse`),
        { state: i, response: a } = await this.readSigninResponseState(e, n);
      if (
        (r.debug(`received state from storage; validating response`),
        this.settings.dpop && this.settings.dpop.store)
      ) {
        let e = await this.getDpopProof(this.settings.dpop.store);
        t = { ...t, DPoP: e };
      }
      try {
        await this._validator.validateSigninResponse(a, i, t);
      } catch (e) {
        if (e instanceof lr && this.settings.dpop) {
          let n = await this.getDpopProof(this.settings.dpop.store, e.nonce);
          ((t.DPoP = n), await this._validator.validateSigninResponse(a, i, t));
        } else throw e;
      }
      return a;
    }
    async getDpopProof(e, t) {
      let n, r;
      return (
        (await e.getAllKeys()).includes(this.settings.client_id)
          ? ((r = await e.get(this.settings.client_id)),
            r.nonce !== t &&
              t &&
              ((r.nonce = t), await e.set(this.settings.client_id, r)))
          : ((n = await Qn.generateDPoPKeys()),
            (r = new Mr(n, t)),
            await e.set(this.settings.client_id, r)),
        await Qn.generateDPoPProof({
          url: await this.metadataService.getTokenEndpoint(!1),
          httpMethod: `POST`,
          keyPair: r.keys,
          nonce: r.nonce,
        })
      );
    }
    async processResourceOwnerPasswordCredentials({
      username: e,
      password: t,
      skipUserInfo: n = !1,
      extraTokenParams: r = {},
    }) {
      let i = await this._tokenClient.exchangeCredentials({
          username: e,
          password: t,
          ...r,
        }),
        a = new Er(new URLSearchParams());
      return (
        Object.assign(a, i),
        await this._validator.validateCredentialsResponse(a, n),
        a
      );
    }
    async useRefreshToken({
      state: e,
      redirect_uri: t,
      resource: n,
      timeoutInSeconds: r,
      extraHeaders: i,
      extraTokenParams: a,
    }) {
      let o = this._logger.create(`useRefreshToken`),
        s;
      if (this.settings.refreshTokenAllowedScope === void 0) s = e.scope;
      else {
        let t = this.settings.refreshTokenAllowedScope.split(` `);
        s = (e.scope?.split(` `) || []).filter((e) => t.includes(e)).join(` `);
      }
      if (this.settings.dpop && this.settings.dpop.store) {
        let e = await this.getDpopProof(this.settings.dpop.store);
        i = { ...i, DPoP: e };
      }
      let c;
      try {
        c = await this._tokenClient.exchangeRefreshToken({
          refresh_token: e.refresh_token,
          scope: s,
          redirect_uri: t,
          resource: n,
          timeoutInSeconds: r,
          extraHeaders: i,
          ...a,
        });
      } catch (o) {
        if (o instanceof lr && this.settings.dpop)
          ((i.DPoP = await this.getDpopProof(
            this.settings.dpop.store,
            o.nonce,
          )),
            (c = await this._tokenClient.exchangeRefreshToken({
              refresh_token: e.refresh_token,
              scope: s,
              redirect_uri: t,
              resource: n,
              timeoutInSeconds: r,
              extraHeaders: i,
              ...a,
            })));
        else throw o;
      }
      let l = new Er(new URLSearchParams());
      return (
        Object.assign(l, c),
        o.debug(`validating response`, l),
        await this._validator.validateRefreshResponse(l, { ...e, scope: s }),
        l
      );
    }
    async createSignoutRequest({
      state: e,
      id_token_hint: t,
      client_id: n,
      request_type: r,
      url_state: i,
      post_logout_redirect_uri: a = this.settings.post_logout_redirect_uri,
      extraQueryParams: o = this.settings.extraQueryParams,
    } = {}) {
      let s = this._logger.create(`createSignoutRequest`),
        c = await this.metadataService.getEndSessionEndpoint();
      if (!c) throw (s.throw(Error(`No end session endpoint`)), null);
      (s.debug(`Received end session endpoint`, c),
        !n && a && !t && (n = this.settings.client_id));
      let l = new Dr({
        url: c,
        id_token_hint: t,
        client_id: n,
        post_logout_redirect_uri: a,
        state_data: e,
        extraQueryParams: o,
        request_type: r,
        url_state: i,
      });
      await this.clearStaleState();
      let u = l.state;
      return (
        u &&
          (s.debug(`Signout request has state to persist`),
          await this.settings.stateStore.set(u.id, u.toStorageString())),
        l
      );
    }
    async readSignoutResponseState(e, t = !1) {
      let n = this._logger.create(`readSignoutResponseState`),
        r = new Or(nr.readParams(e, this.settings.response_mode));
      if (!r.state) {
        if ((n.debug(`No state in response`), r.error))
          throw (n.warn(`Response was error:`, r.error), new ir(r));
        return { state: void 0, response: r };
      }
      let i = await this.settings.stateStore[t ? `remove` : `get`](r.state);
      if (!i)
        throw (n.throw(Error(`No matching state found in storage`)), null);
      return { state: await xr.fromStorageString(i), response: r };
    }
    async processSignoutResponse(e) {
      let t = this._logger.create(`processSignoutResponse`),
        { state: n, response: r } = await this.readSignoutResponseState(e, !0);
      return (
        n
          ? (t.debug(`Received state from storage; validating response`),
            this._validator.validateSignoutResponse(r, n))
          : t.debug(`No state from storage; skipping response validation`),
        r
      );
    }
    clearStaleState() {
      return (
        this._logger.create(`clearStaleState`),
        xr.clearStaleState(
          this.settings.stateStore,
          this.settings.staleStateAgeInSeconds,
        )
      );
    }
    async revokeToken(e, t) {
      return (
        this._logger.create(`revokeToken`),
        await this._tokenClient.revoke({ token: e, token_type_hint: t })
      );
    }
  },
  Pr = class {
    constructor(e) {
      ((this._userManager = e),
        (this._logger = new N(`SessionMonitor`)),
        (this._start = async (e) => {
          let t = e.session_state;
          if (!t) return;
          let n = this._logger.create(`_start`);
          if (
            (e.profile
              ? ((this._sub = e.profile.sub),
                n.debug(`session_state`, t, `, sub`, this._sub))
              : ((this._sub = void 0),
                n.debug(`session_state`, t, `, anonymous user`)),
            this._checkSessionIFrame)
          ) {
            this._checkSessionIFrame.start(t);
            return;
          }
          try {
            let e =
              await this._userManager.metadataService.getCheckSessionIframe();
            if (e) {
              n.debug(`initializing check session iframe`);
              let r = this._userManager.settings.client_id,
                i = this._userManager.settings.checkSessionIntervalInSeconds,
                a = this._userManager.settings.stopCheckSessionOnError,
                o = new sr(this._callback, r, e, i, a);
              (await o.load(), (this._checkSessionIFrame = o), o.start(t));
            } else n.warn(`no check session iframe found in the metadata`);
          } catch (e) {
            n.error(
              `Error from getCheckSessionIframe:`,
              e instanceof Error ? e.message : e,
            );
          }
        }),
        (this._stop = () => {
          let e = this._logger.create(`_stop`);
          if (
            ((this._sub = void 0),
            this._checkSessionIFrame && this._checkSessionIFrame.stop(),
            this._userManager.settings.monitorAnonymousSession)
          ) {
            let t = setInterval(async () => {
              clearInterval(t);
              try {
                let e = await this._userManager.querySessionStatus();
                if (e) {
                  let t = {
                    session_state: e.session_state,
                    profile: e.sub ? { sub: e.sub } : null,
                  };
                  this._start(t);
                }
              } catch (t) {
                e.error(
                  `error from querySessionStatus`,
                  t instanceof Error ? t.message : t,
                );
              }
            }, 1e3);
          }
        }),
        (this._callback = async () => {
          let e = this._logger.create(`_callback`);
          try {
            let t = await this._userManager.querySessionStatus(),
              n = !0;
            (t && this._checkSessionIFrame
              ? t.sub === this._sub
                ? ((n = !1),
                  this._checkSessionIFrame.start(t.session_state),
                  e.debug(
                    `same sub still logged in at OP, session state has changed, restarting check session iframe; session_state`,
                    t.session_state,
                  ),
                  await this._userManager.events._raiseUserSessionChanged())
                : e.debug(`different subject signed into OP`, t.sub)
              : e.debug(`subject no longer signed into OP`),
              n
                ? this._sub
                  ? await this._userManager.events._raiseUserSignedOut()
                  : await this._userManager.events._raiseUserSignedIn()
                : e.debug(`no change in session detected, no event to raise`));
          } catch (t) {
            this._sub &&
              (e.debug(
                `Error calling queryCurrentSigninSession; raising signed out event`,
                t,
              ),
              await this._userManager.events._raiseUserSignedOut());
          }
        }),
        e || this._logger.throw(Error(`No user manager passed`)),
        this._userManager.events.addUserLoaded(this._start),
        this._userManager.events.addUserUnloaded(this._stop),
        this._init().catch((e) => {
          this._logger.error(e);
        }));
    }
    async _init() {
      this._logger.create(`_init`);
      let e = await this._userManager.getUser();
      if (e) this._start(e);
      else if (this._userManager.settings.monitorAnonymousSession) {
        let e = await this._userManager.querySessionStatus();
        if (e) {
          let t = {
            session_state: e.session_state,
            profile: e.sub ? { sub: e.sub } : null,
          };
          this._start(t);
        }
      }
    }
  },
  Fr = class e {
    constructor(e) {
      ((this.id_token = e.id_token),
        (this.session_state = e.session_state ?? null),
        (this.access_token = e.access_token),
        (this.refresh_token = e.refresh_token),
        (this.token_type = e.token_type),
        (this.scope = e.scope),
        (this.profile = e.profile),
        (this.expires_at = e.expires_at),
        (this.state = e.userState),
        (this.url_state = e.url_state));
    }
    get expires_in() {
      if (this.expires_at !== void 0)
        return this.expires_at - tr.getEpochTime();
    }
    set expires_in(e) {
      e !== void 0 && (this.expires_at = Math.floor(e) + tr.getEpochTime());
    }
    get expired() {
      let e = this.expires_in;
      if (e !== void 0) return e <= 0;
    }
    get scopes() {
      return this.scope?.split(` `) ?? [];
    }
    toStorageString() {
      return (
        new N(`User`).create(`toStorageString`),
        JSON.stringify({
          id_token: this.id_token,
          session_state: this.session_state,
          access_token: this.access_token,
          refresh_token: this.refresh_token,
          token_type: this.token_type,
          scope: this.scope,
          profile: this.profile,
          expires_at: this.expires_at,
        })
      );
    }
    static fromStorageString(t) {
      return (
        N.createStatic(`User`, `fromStorageString`),
        new e(JSON.parse(t))
      );
    }
  },
  Ir = `oidc-client`,
  Lr = class {
    constructor() {
      ((this._abort = new $n(`Window navigation aborted`)),
        (this._disposeHandlers = new Set()),
        (this._window = null));
    }
    async navigate(e) {
      let t = this._logger.create(`navigate`);
      if (!this._window)
        throw Error(`Attempted to navigate on a disposed window`);
      (t.debug(`setting URL in window`), this._window.location.replace(e.url));
      let { url: n, keepOpen: r } = await new Promise((n, r) => {
        let i = (i) => {
          let a = i.data,
            o = e.scriptOrigin ?? window.location.origin;
          if (i.origin === o && a?.source === Ir) {
            try {
              let n = nr.readParams(a.url, e.response_mode).get(`state`);
              if (
                (n || t.warn(`no state found in response url`),
                i.source !== this._window && n !== e.state)
              )
                return;
            } catch {
              (this._dispose(), r(Error(`Invalid response from window`)));
            }
            n(a);
          }
        };
        (window.addEventListener(`message`, i, !1),
          this._disposeHandlers.add(() =>
            window.removeEventListener(`message`, i, !1),
          ));
        let a = new BroadcastChannel(`oidc-client-popup-${e.state}`);
        (a.addEventListener(`message`, i, !1),
          this._disposeHandlers.add(() => a.close()),
          this._disposeHandlers.add(
            this._abort.addHandler((e) => {
              (this._dispose(), r(e));
            }),
          ));
      });
      return (
        t.debug(`got response from window`),
        this._dispose(),
        r || this.close(),
        { url: n }
      );
    }
    _dispose() {
      this._logger.create(`_dispose`);
      for (let e of this._disposeHandlers) e();
      this._disposeHandlers.clear();
    }
    static _notifyParent(e, t, n = !1, r = window.location.origin) {
      let i = { source: Ir, url: t, keepOpen: n },
        a = new N(`_notifyParent`);
      if (e)
        (a.debug(`With parent. Using parent.postMessage.`),
          e.postMessage(i, r));
      else {
        a.debug(`No parent. Using BroadcastChannel.`);
        let e = new URL(t).searchParams.get(`state`);
        if (!e)
          throw Error(
            `No parent and no state in URL. Can't complete notification.`,
          );
        let n = new BroadcastChannel(`oidc-client-popup-${e}`);
        (n.postMessage(i), n.close());
      }
    }
  },
  Rr = {
    location: !1,
    toolbar: !1,
    height: 640,
    closePopupWindowAfterInSeconds: -1,
  },
  zr = `_blank`,
  Br = 60,
  Vr = 2,
  Hr = 10,
  Ur = class extends _r {
    constructor(e) {
      let {
        popup_redirect_uri: t = e.redirect_uri,
        popup_post_logout_redirect_uri: n = e.post_logout_redirect_uri,
        popupWindowFeatures: r = Rr,
        popupWindowTarget: i = zr,
        redirectMethod: a = `assign`,
        redirectTarget: o = `self`,
        iframeNotifyParentOrigin: s = e.iframeNotifyParentOrigin,
        iframeScriptOrigin: c = e.iframeScriptOrigin,
        requestTimeoutInSeconds: l,
        silent_redirect_uri: u = e.redirect_uri,
        silentRequestTimeoutInSeconds: d,
        automaticSilentRenew: f = !0,
        validateSubOnSilentRenew: p = !0,
        includeIdTokenInSilentRenew: m = !1,
        monitorSession: h = !1,
        monitorAnonymousSession: g = !1,
        checkSessionIntervalInSeconds: _ = Vr,
        query_status_response_type: v = `code`,
        stopCheckSessionOnError: y = !0,
        revokeTokenTypes: b = [`access_token`, `refresh_token`],
        revokeTokensOnSignout: x = !1,
        includeIdTokenInSilentSignout: S = !1,
        accessTokenExpiringNotificationTimeInSeconds: C = Br,
        maxSilentRenewTimeoutRetries: w,
        userStore: T,
      } = e;
      if (
        (super(e),
        (this.popup_redirect_uri = t),
        (this.popup_post_logout_redirect_uri = n),
        (this.popupWindowFeatures = r),
        (this.popupWindowTarget = i),
        (this.redirectMethod = a),
        (this.redirectTarget = o),
        (this.iframeNotifyParentOrigin = s),
        (this.iframeScriptOrigin = c),
        (this.silent_redirect_uri = u),
        (this.silentRequestTimeoutInSeconds = d || l || Hr),
        (this.automaticSilentRenew = f),
        (this.validateSubOnSilentRenew = p),
        (this.includeIdTokenInSilentRenew = m),
        (this.monitorSession = h),
        (this.monitorAnonymousSession = g),
        (this.checkSessionIntervalInSeconds = _),
        (this.stopCheckSessionOnError = y),
        (this.query_status_response_type = v),
        (this.revokeTokenTypes = b),
        (this.revokeTokensOnSignout = x),
        (this.includeIdTokenInSilentSignout = S),
        (this.accessTokenExpiringNotificationTimeInSeconds = C),
        (this.maxSilentRenewTimeoutRetries = w),
        T)
      )
        this.userStore = T;
      else {
        let e = typeof window < `u` ? window.sessionStorage : new cr();
        this.userStore = new fr({ store: e });
      }
    }
  },
  Wr = class e extends Lr {
    constructor({ silentRequestTimeoutInSeconds: t = Hr }) {
      (super(),
        (this._logger = new N(`IFrameWindow`)),
        (this._timeoutInSeconds = t),
        (this._frame = e.createHiddenIframe()),
        (this._window = this._frame.contentWindow));
    }
    static createHiddenIframe() {
      let e = window.document.createElement(`iframe`);
      return (
        (e.style.visibility = `hidden`),
        (e.style.position = `fixed`),
        (e.style.left = `-1000px`),
        (e.style.top = `0`),
        (e.width = `0`),
        (e.height = `0`),
        window.document.body.appendChild(e),
        e
      );
    }
    async navigate(e) {
      this._logger.debug(`navigate: Using timeout of:`, this._timeoutInSeconds);
      let t = setTimeout(
        () =>
          void this._abort.raise(new ar(`IFrame timed out without a response`)),
        this._timeoutInSeconds * 1e3,
      );
      return (
        this._disposeHandlers.add(() => clearTimeout(t)),
        await super.navigate(e)
      );
    }
    close() {
      var e;
      ((this._frame &&=
        (this._frame.parentNode &&
          (this._frame.addEventListener(
            `load`,
            (e) => {
              var t;
              let n = e.target;
              ((t = n.parentNode) == null || t.removeChild(n),
                this._abort.raise(Error(`IFrame removed from DOM`)));
            },
            !0,
          ),
          (e = this._frame.contentWindow) == null ||
            e.location.replace(`about:blank`)),
        null)),
        (this._window = null));
    }
    static notifyParent(e, t) {
      return super._notifyParent(window.parent, e, !1, t);
    }
  },
  Gr = class {
    constructor(e) {
      ((this._settings = e), (this._logger = new N(`IFrameNavigator`)));
    }
    async prepare({
      silentRequestTimeoutInSeconds: e = this._settings
        .silentRequestTimeoutInSeconds,
    }) {
      return new Wr({ silentRequestTimeoutInSeconds: e });
    }
    async callback(e) {
      (this._logger.create(`callback`),
        Wr.notifyParent(e, this._settings.iframeNotifyParentOrigin));
    }
  },
  Kr = 500,
  qr = 1e3,
  Jr = class extends Lr {
    constructor({
      popupWindowTarget: e = zr,
      popupWindowFeatures: t = {},
      popupSignal: n,
      popupAbortOnClose: r,
    }) {
      (super(), (this._logger = new N(`PopupWindow`)));
      let i = er.center({ ...Rr, ...t });
      ((this._window = window.open(void 0, e, er.serialize(i))),
        (this.abortOnClose = !!r),
        n &&
          n.addEventListener(`abort`, () => {
            this._abort.raise(Error(n.reason ?? `Popup aborted`));
          }),
        t.closePopupWindowAfterInSeconds &&
          t.closePopupWindowAfterInSeconds > 0 &&
          setTimeout(() => {
            if (
              !this._window ||
              typeof this._window.closed != `boolean` ||
              this._window.closed
            ) {
              this._abort.raise(Error(`Popup blocked by user`));
              return;
            }
            this.close();
          }, t.closePopupWindowAfterInSeconds * qr));
    }
    async navigate(e) {
      var t;
      (t = this._window) == null || t.focus();
      let n = setInterval(() => {
          (!this._window || this._window.closed) &&
            (this._logger.debug(`Popup closed by user or isolated by redirect`),
            r(),
            this._disposeHandlers.delete(r),
            this.abortOnClose &&
              this._abort.raise(Error(`Popup closed by user`)));
        }, Kr),
        r = () => clearInterval(n);
      return (this._disposeHandlers.add(r), await super.navigate(e));
    }
    close() {
      (this._window &&
        (this._window.closed ||
          (this._window.close(), this._abort.raise(Error(`Popup closed`)))),
        (this._window = null));
    }
    static notifyOpener(e, t) {
      (super._notifyParent(window.opener, e, t),
        !t && !window.opener && window.close());
    }
  },
  Yr = class {
    constructor(e) {
      ((this._settings = e), (this._logger = new N(`PopupNavigator`)));
    }
    async prepare({
      popupWindowFeatures: e = this._settings.popupWindowFeatures,
      popupWindowTarget: t = this._settings.popupWindowTarget,
      popupSignal: n,
      popupAbortOnClose: r,
    }) {
      return new Jr({
        popupWindowFeatures: e,
        popupWindowTarget: t,
        popupSignal: n,
        popupAbortOnClose: r,
      });
    }
    async callback(e, { keepOpen: t = !1 }) {
      (this._logger.create(`callback`), Jr.notifyOpener(e, t));
    }
  },
  Xr = class {
    constructor(e) {
      ((this._settings = e), (this._logger = new N(`RedirectNavigator`)));
    }
    async prepare({
      redirectMethod: e = this._settings.redirectMethod,
      redirectTarget: t = this._settings.redirectTarget,
    }) {
      this._logger.create(`prepare`);
      let n = window.self;
      t === `top` && (n = window.top ?? window.self);
      let r = n.location[e].bind(n.location),
        i;
      return {
        navigate: async (e) => (
          this._logger.create(`navigate`),
          await new Promise((t, n) => {
            ((i = n),
              window.addEventListener(`pageshow`, () =>
                t(window.location.href),
              ),
              r(e.url));
          })
        ),
        close: () => {
          (this._logger.create(`close`),
            i?.(Error(`Redirect aborted`)),
            n.stop());
        },
      };
    }
    async callback() {}
  },
  Zr = class extends or {
    constructor(e) {
      (super({
        expiringNotificationTimeInSeconds:
          e.accessTokenExpiringNotificationTimeInSeconds,
      }),
        (this._logger = new N(`UserManagerEvents`)),
        (this._userLoaded = new $n(`User loaded`)),
        (this._userUnloaded = new $n(`User unloaded`)),
        (this._silentRenewError = new $n(`Silent renew error`)),
        (this._userSignedIn = new $n(`User signed in`)),
        (this._userSignedOut = new $n(`User signed out`)),
        (this._userSessionChanged = new $n(`User session changed`)));
    }
    async load(e, t = !0) {
      (await super.load(e), t && (await this._userLoaded.raise(e)));
    }
    async unload() {
      (await super.unload(), await this._userUnloaded.raise());
    }
    addUserLoaded(e) {
      return this._userLoaded.addHandler(e);
    }
    removeUserLoaded(e) {
      return this._userLoaded.removeHandler(e);
    }
    addUserUnloaded(e) {
      return this._userUnloaded.addHandler(e);
    }
    removeUserUnloaded(e) {
      return this._userUnloaded.removeHandler(e);
    }
    addSilentRenewError(e) {
      return this._silentRenewError.addHandler(e);
    }
    removeSilentRenewError(e) {
      return this._silentRenewError.removeHandler(e);
    }
    async _raiseSilentRenewError(e) {
      await this._silentRenewError.raise(e);
    }
    addUserSignedIn(e) {
      return this._userSignedIn.addHandler(e);
    }
    removeUserSignedIn(e) {
      this._userSignedIn.removeHandler(e);
    }
    async _raiseUserSignedIn() {
      await this._userSignedIn.raise();
    }
    addUserSignedOut(e) {
      return this._userSignedOut.addHandler(e);
    }
    removeUserSignedOut(e) {
      this._userSignedOut.removeHandler(e);
    }
    async _raiseUserSignedOut() {
      await this._userSignedOut.raise();
    }
    addUserSessionChanged(e) {
      return this._userSessionChanged.addHandler(e);
    }
    removeUserSessionChanged(e) {
      this._userSessionChanged.removeHandler(e);
    }
    async _raiseUserSessionChanged() {
      await this._userSessionChanged.raise();
    }
  },
  Qr = class {
    constructor(e) {
      ((this._userManager = e),
        (this._logger = new N(`SilentRenewService`)),
        (this._isStarted = !1),
        (this._retryTimer = new tr(`Retry Silent Renew`)),
        (this._timeoutRetryCount = 0),
        (this._tokenExpiring = async () => {
          let e = this._logger.create(`_tokenExpiring`);
          try {
            (await this._userManager.signinSilent(),
              (this._timeoutRetryCount = 0),
              e.debug(`silent token renewal successful`));
          } catch (t) {
            if (t instanceof ar) {
              this._timeoutRetryCount++;
              let n = this._userManager.settings.maxSilentRenewTimeoutRetries;
              if (n !== void 0 && this._timeoutRetryCount > n) {
                (e.error(
                  `Timeout retry limit reached (${this._timeoutRetryCount} > ${n}), raising silentRenewError:`,
                  t,
                ),
                  (this._timeoutRetryCount = 0),
                  await this._userManager.events._raiseSilentRenewError(t));
                return;
              }
              (e.warn(
                `ErrorTimeout from signinSilent (attempt ${this._timeoutRetryCount}), retry in 5s:`,
                t,
              ),
                this._retryTimer.init(5));
              return;
            }
            (e.error(`Error from signinSilent:`, t),
              (this._timeoutRetryCount = 0),
              await this._userManager.events._raiseSilentRenewError(t));
          }
        }));
    }
    async start() {
      let e = this._logger.create(`start`);
      if (!this._isStarted) {
        ((this._isStarted = !0),
          this._userManager.events.addAccessTokenExpiring(this._tokenExpiring),
          this._retryTimer.addHandler(this._tokenExpiring));
        try {
          await this._userManager.getUser();
        } catch (t) {
          e.error(`getUser error`, t);
        }
      }
    }
    stop() {
      this._isStarted &&=
        (this._retryTimer.cancel(),
        this._retryTimer.removeHandler(this._tokenExpiring),
        this._userManager.events.removeAccessTokenExpiring(this._tokenExpiring),
        !1);
    }
  },
  $r = class {
    constructor(e) {
      ((this.refresh_token = e.refresh_token),
        (this.id_token = e.id_token),
        (this.session_state = e.session_state),
        (this.scope = e.scope),
        (this.profile = e.profile),
        (this.data = e.state));
    }
  },
  ei = class {
    constructor(e, t, n, r) {
      ((this._logger = new N(`UserManager`)),
        (this.settings = new Ur(e)),
        (this._client = new Nr(e)),
        (this._redirectNavigator = t ?? new Xr(this.settings)),
        (this._popupNavigator = n ?? new Yr(this.settings)),
        (this._iframeNavigator = r ?? new Gr(this.settings)),
        (this._events = new Zr(this.settings)),
        (this._silentRenewService = new Qr(this)),
        this.settings.automaticSilentRenew && this.startSilentRenew(),
        (this._sessionMonitor = null),
        this.settings.monitorSession && (this._sessionMonitor = new Pr(this)));
    }
    get events() {
      return this._events;
    }
    get metadataService() {
      return this._client.metadataService;
    }
    async getUser(e = !1) {
      let t = this._logger.create(`getUser`),
        n = await this._loadUser();
      return n
        ? (t.info(`user loaded`), await this._events.load(n, e), n)
        : (t.info(`user not found in storage`), null);
    }
    async removeUser() {
      let e = this._logger.create(`removeUser`);
      (await this.storeUser(null),
        e.info(`user removed from storage`),
        await this._events.unload());
    }
    async signinRedirect(e = {}) {
      this._logger.create(`signinRedirect`);
      let { redirectMethod: t, ...n } = e,
        r;
      this.settings.dpop?.bind_authorization_code &&
        (r = await this.generateDPoPJkt(this.settings.dpop));
      let i = await this._redirectNavigator.prepare({ redirectMethod: t });
      await this._signinStart({ request_type: `si:r`, dpopJkt: r, ...n }, i);
    }
    async signinRedirectCallback(e = window.location.href) {
      let t = this._logger.create(`signinRedirectCallback`),
        n = await this._signinEnd(e);
      return (
        n.profile && n.profile.sub
          ? t.info(`success, signed in subject`, n.profile.sub)
          : t.info(`no subject`),
        n
      );
    }
    async signinResourceOwnerCredentials({
      username: e,
      password: t,
      skipUserInfo: n = !1,
    }) {
      let r = this._logger.create(`signinResourceOwnerCredential`),
        i = await this._client.processResourceOwnerPasswordCredentials({
          username: e,
          password: t,
          skipUserInfo: n,
          extraTokenParams: this.settings.extraTokenParams,
        });
      r.debug(`got signin response`);
      let a = await this._buildUser(i);
      return (
        a.profile && a.profile.sub
          ? r.info(`success, signed in subject`, a.profile.sub)
          : r.info(`no subject`),
        a
      );
    }
    async signinPopup(e = {}) {
      let t = this._logger.create(`signinPopup`),
        n;
      this.settings.dpop?.bind_authorization_code &&
        (n = await this.generateDPoPJkt(this.settings.dpop));
      let {
          popupWindowFeatures: r,
          popupWindowTarget: i,
          popupSignal: a,
          popupAbortOnClose: o,
          ...s
        } = e,
        c = this.settings.popup_redirect_uri;
      c || t.throw(Error(`No popup_redirect_uri configured`));
      let l = await this._popupNavigator.prepare({
          popupWindowFeatures: r,
          popupWindowTarget: i,
          popupSignal: a,
          popupAbortOnClose: o,
        }),
        u = await this._signin(
          {
            request_type: `si:p`,
            redirect_uri: c,
            display: `popup`,
            dpopJkt: n,
            ...s,
          },
          l,
        );
      return (
        u &&
          (u.profile && u.profile.sub
            ? t.info(`success, signed in subject`, u.profile.sub)
            : t.info(`no subject`)),
        u
      );
    }
    async signinPopupCallback(e = window.location.href, t = !1) {
      let n = this._logger.create(`signinPopupCallback`);
      (await this._popupNavigator.callback(e, { keepOpen: t }),
        n.info(`success`));
    }
    async signinSilent(e = {}) {
      let t = this._logger.create(`signinSilent`),
        { silentRequestTimeoutInSeconds: n, ...r } = e,
        i = await this._loadUser();
      if (!e.forceIframeAuth && i?.refresh_token) {
        t.debug(`using refresh token`);
        let e = new $r(i);
        return await this._useRefreshToken({
          state: e,
          redirect_uri: r.redirect_uri,
          resource: r.resource,
          extraTokenParams: r.extraTokenParams,
          timeoutInSeconds: n,
        });
      }
      let a;
      this.settings.dpop?.bind_authorization_code &&
        (a = await this.generateDPoPJkt(this.settings.dpop));
      let o = this.settings.silent_redirect_uri;
      o || t.throw(Error(`No silent_redirect_uri configured`));
      let s;
      i &&
        this.settings.validateSubOnSilentRenew &&
        (t.debug(`subject prior to silent renew:`, i.profile.sub),
        (s = i.profile.sub));
      let c = await this._iframeNavigator.prepare({
        silentRequestTimeoutInSeconds: n,
      });
      return (
        (i = await this._signin(
          {
            request_type: `si:s`,
            redirect_uri: o,
            prompt: `none`,
            id_token_hint: this.settings.includeIdTokenInSilentRenew
              ? i?.id_token
              : void 0,
            dpopJkt: a,
            ...r,
          },
          c,
          s,
        )),
        i &&
          (i.profile?.sub
            ? t.info(`success, signed in subject`, i.profile.sub)
            : t.info(`no subject`)),
        i
      );
    }
    async _useRefreshToken(e) {
      let t = await this._client.useRefreshToken({
          timeoutInSeconds: this.settings.silentRequestTimeoutInSeconds,
          ...e,
        }),
        n = new Fr({ ...e.state, ...t });
      return (await this.storeUser(n), await this._events.load(n), n);
    }
    async signinSilentCallback(e = window.location.href) {
      let t = this._logger.create(`signinSilentCallback`);
      (await this._iframeNavigator.callback(e), t.info(`success`));
    }
    async signinCallback(e = window.location.href) {
      let { state: t } = await this._client.readSigninResponseState(e);
      switch (t.request_type) {
        case `si:r`:
          return await this.signinRedirectCallback(e);
        case `si:p`:
          await this.signinPopupCallback(e);
          break;
        case `si:s`:
          await this.signinSilentCallback(e);
          break;
        default:
          throw Error(`invalid request_type in state`);
      }
    }
    async signoutCallback(e = window.location.href, t = !1) {
      let { state: n } = await this._client.readSignoutResponseState(e);
      if (n)
        switch (n.request_type) {
          case `so:r`:
            return await this.signoutRedirectCallback(e);
          case `so:p`:
            await this.signoutPopupCallback(e, t);
            break;
          case `so:s`:
            await this.signoutSilentCallback(e);
            break;
          default:
            throw Error(`invalid request_type in state`);
        }
    }
    async querySessionStatus(e = {}) {
      let t = this._logger.create(`querySessionStatus`),
        { silentRequestTimeoutInSeconds: n, ...r } = e,
        i = this.settings.silent_redirect_uri;
      i || t.throw(Error(`No silent_redirect_uri configured`));
      let a = await this._loadUser(),
        o = await this._iframeNavigator.prepare({
          silentRequestTimeoutInSeconds: n,
        }),
        s = await this._signinStart(
          {
            request_type: `si:s`,
            redirect_uri: i,
            prompt: `none`,
            id_token_hint: this.settings.includeIdTokenInSilentRenew
              ? a?.id_token
              : void 0,
            response_type: this.settings.query_status_response_type,
            scope: `openid`,
            skipUserInfo: !0,
            ...r,
          },
          o,
        );
      try {
        let e = await this._client.processSigninResponse(s.url, {});
        return (
          t.debug(`got signin response`),
          e.session_state && e.profile.sub
            ? (t.info(`success for subject`, e.profile.sub),
              { session_state: e.session_state, sub: e.profile.sub })
            : (t.info(`success, user not authenticated`), null)
        );
      } catch (e) {
        if (this.settings.monitorAnonymousSession && e instanceof ir)
          switch (e.error) {
            case `login_required`:
            case `consent_required`:
            case `interaction_required`:
            case `account_selection_required`:
              return (
                t.info(`success for anonymous user`),
                { session_state: e.session_state }
              );
          }
        throw e;
      }
    }
    async _signin(e, t, n) {
      let r = await this._signinStart(e, t);
      return await this._signinEnd(r.url, n);
    }
    async _signinStart(e, t) {
      let n = this._logger.create(`_signinStart`);
      try {
        let r = await this._client.createSigninRequest(e);
        return (
          n.debug(`got signin request`),
          await t.navigate({
            url: r.url,
            state: r.state.id,
            response_mode: r.state.response_mode,
            scriptOrigin: this.settings.iframeScriptOrigin,
          })
        );
      } catch (e) {
        throw (
          n.debug(`error after preparing navigator, closing navigator window`),
          t.close(),
          e
        );
      }
    }
    async _signinEnd(e, t) {
      let n = this._logger.create(`_signinEnd`),
        r = await this._client.processSigninResponse(e, {});
      return (n.debug(`got signin response`), await this._buildUser(r, t));
    }
    async _buildUser(e, t) {
      let n = this._logger.create(`_buildUser`),
        r = new Fr(e);
      if (t) {
        if (t !== r.profile.sub)
          throw (
            n.debug(
              `current user does not match user returned from signin. sub from signin:`,
              r.profile.sub,
            ),
            new ir({ ...e, error: `login_required` })
          );
        n.debug(`current user matches user returned from signin`);
      }
      return (
        await this.storeUser(r),
        n.debug(`user stored`),
        await this._events.load(r),
        r
      );
    }
    async signoutRedirect(e = {}) {
      let t = this._logger.create(`signoutRedirect`),
        { redirectMethod: n, ...r } = e,
        i = await this._redirectNavigator.prepare({ redirectMethod: n });
      (await this._signoutStart(
        {
          request_type: `so:r`,
          post_logout_redirect_uri: this.settings.post_logout_redirect_uri,
          ...r,
        },
        i,
      ),
        t.info(`success`));
    }
    async signoutRedirectCallback(e = window.location.href) {
      let t = this._logger.create(`signoutRedirectCallback`),
        n = await this._signoutEnd(e);
      return (t.info(`success`), n);
    }
    async signoutPopup(e = {}) {
      let t = this._logger.create(`signoutPopup`),
        {
          popupWindowFeatures: n,
          popupWindowTarget: r,
          popupSignal: i,
          ...a
        } = e,
        o = this.settings.popup_post_logout_redirect_uri,
        s = await this._popupNavigator.prepare({
          popupWindowFeatures: n,
          popupWindowTarget: r,
          popupSignal: i,
        });
      (await this._signout(
        {
          request_type: `so:p`,
          post_logout_redirect_uri: o,
          state: o == null ? void 0 : {},
          ...a,
        },
        s,
      ),
        t.info(`success`));
    }
    async signoutPopupCallback(e = window.location.href, t = !1) {
      let n = this._logger.create(`signoutPopupCallback`);
      (await this._popupNavigator.callback(e, { keepOpen: t }),
        n.info(`success`));
    }
    async _signout(e, t) {
      let n = await this._signoutStart(e, t);
      return await this._signoutEnd(n.url);
    }
    async _signoutStart(e = {}, t) {
      let n = this._logger.create(`_signoutStart`);
      try {
        let r = await this._loadUser();
        (n.debug(`loaded current user from storage`),
          this.settings.revokeTokensOnSignout &&
            (await this._revokeInternal(r)));
        let i = e.id_token_hint || (r && r.id_token);
        (i &&
          (n.debug(`setting id_token_hint in signout request`),
          (e.id_token_hint = i)),
          await this.removeUser(),
          n.debug(`user removed, creating signout request`));
        let a = await this._client.createSignoutRequest(e);
        return (
          n.debug(`got signout request`),
          await t.navigate({
            url: a.url,
            state: a.state?.id,
            scriptOrigin: this.settings.iframeScriptOrigin,
          })
        );
      } catch (e) {
        throw (
          n.debug(`error after preparing navigator, closing navigator window`),
          t.close(),
          e
        );
      }
    }
    async _signoutEnd(e) {
      let t = this._logger.create(`_signoutEnd`),
        n = await this._client.processSignoutResponse(e);
      return (t.debug(`got signout response`), n);
    }
    async signoutSilent(e = {}) {
      let t = this._logger.create(`signoutSilent`),
        { silentRequestTimeoutInSeconds: n, ...r } = e,
        i = this.settings.includeIdTokenInSilentSignout
          ? (await this._loadUser())?.id_token
          : void 0,
        a = this.settings.popup_post_logout_redirect_uri,
        o = await this._iframeNavigator.prepare({
          silentRequestTimeoutInSeconds: n,
        });
      (await this._signout(
        {
          request_type: `so:s`,
          post_logout_redirect_uri: a,
          id_token_hint: i,
          ...r,
        },
        o,
      ),
        t.info(`success`));
    }
    async signoutSilentCallback(e = window.location.href) {
      let t = this._logger.create(`signoutSilentCallback`);
      (await this._iframeNavigator.callback(e), t.info(`success`));
    }
    async revokeTokens(e) {
      let t = await this._loadUser();
      await this._revokeInternal(t, e);
    }
    async _revokeInternal(e, t = this.settings.revokeTokenTypes) {
      let n = this._logger.create(`_revokeInternal`);
      if (!e) return;
      let r = t.filter((t) => typeof e[t] == `string`);
      if (!r.length) {
        n.debug(`no need to revoke due to no token(s)`);
        return;
      }
      for (let t of r)
        (await this._client.revokeToken(e[t], t),
          n.info(`${t} revoked successfully`),
          t !== `access_token` && (e[t] = null));
      (await this.storeUser(e),
        n.debug(`user stored`),
        await this._events.load(e));
    }
    startSilentRenew() {
      (this._logger.create(`startSilentRenew`),
        this._silentRenewService.start());
    }
    stopSilentRenew() {
      this._silentRenewService.stop();
    }
    get _userStoreKey() {
      return `user:${this.settings.authority}:${this.settings.client_id}`;
    }
    async _loadUser() {
      let e = this._logger.create(`_loadUser`),
        t = await this.settings.userStore.get(this._userStoreKey);
      return t
        ? (e.debug(`user storageString loaded`), Fr.fromStorageString(t))
        : (e.debug(`no user storageString`), null);
    }
    async storeUser(e) {
      let t = this._logger.create(`storeUser`);
      if (e) {
        t.debug(`storing user`);
        let n = e.toStorageString();
        await this.settings.userStore.set(this._userStoreKey, n);
      } else
        (this._logger.debug(`removing user`),
          await this.settings.userStore.remove(this._userStoreKey),
          this.settings.dpop &&
            (await this.settings.dpop.store.remove(this.settings.client_id)));
    }
    async clearStaleState() {
      await this._client.clearStaleState();
    }
    async dpopProof(e, t, n, r) {
      let i = await this.settings.dpop?.store?.get(this.settings.client_id);
      if (i)
        return await Qn.generateDPoPProof({
          url: e,
          accessToken: t?.access_token,
          httpMethod: n,
          keyPair: i.keys,
          nonce: r,
        });
    }
    async generateDPoPJkt(e) {
      let t = await e.store.get(this.settings.client_id);
      return (
        t ||
          ((t = new Mr(await Qn.generateDPoPKeys())),
          await e.store.set(this.settings.client_id, t)),
        await Qn.generateDPoPJkt(t.keys)
      );
    }
  },
  ti = x.createContext(void 0);
ti.displayName = `AuthContext`;
var ni = { isLoading: !0, isAuthenticated: !1 },
  ri = (e, t) => {
    switch (t.type) {
      case `INITIALISED`:
      case `USER_LOADED`:
        return {
          ...e,
          user: t.user,
          isLoading: !1,
          isAuthenticated: t.user ? !t.user.expired : !1,
          error: void 0,
        };
      case `USER_SIGNED_OUT`:
      case `USER_UNLOADED`:
        return { ...e, user: void 0, isAuthenticated: !1 };
      case `NAVIGATOR_INIT`:
        return { ...e, isLoading: !0, activeNavigator: t.method };
      case `NAVIGATOR_CLOSE`:
        return { ...e, isLoading: !1, activeNavigator: void 0 };
      case `ERROR`: {
        let n = t.error;
        return (
          (n.toString = () => `${n.name}: ${n.message}`),
          { ...e, isLoading: !1, error: n }
        );
      }
      default: {
        let n = TypeError(`unknown type ${t.type}`),
          r = {
            name: n.name,
            message: n.message,
            innerError: n,
            stack: n.stack,
            source: `unknown`,
          };
        return (
          (r.toString = () => `${r.name}: ${r.message}`),
          { ...e, isLoading: !1, error: r }
        );
      }
    }
  },
  ii = (e = window.location) => {
    let t = new URLSearchParams(e.search);
    return !!(
      ((t.get(`code`) || t.get(`error`)) && t.get(`state`)) ||
      ((t = new URLSearchParams(e.hash.replace(`#`, `?`))),
      (t.get(`code`) || t.get(`error`)) && t.get(`state`))
    );
  },
  ai = li(`signinCallback`, `Sign-in failed`),
  oi = li(`signoutCallback`, `Sign-out failed`),
  si = li(`renewSilent`, `Renew silent failed`);
function ci(e, t) {
  return {
    name: ui(e, `name`, () => `Error`),
    message: ui(e, `message`, () => t),
    stack: ui(e, `stack`, () => Error().stack),
    innerError: e,
  };
}
function li(e, t) {
  return (n) => ({ ...ci(n, t), source: e });
}
function ui(e, t, n) {
  if (e && typeof e == `object`) {
    let n = e[t];
    if (typeof n == `string`) return n;
  }
  return n();
}
for (
  var di = [
      `clearStaleState`,
      `querySessionStatus`,
      `revokeTokens`,
      `startSilentRenew`,
      `stopSilentRenew`,
    ],
    fi = [
      `signinPopup`,
      `signinSilent`,
      `signinRedirect`,
      `signinResourceOwnerCredentials`,
      `signoutPopup`,
      `signoutRedirect`,
      `signoutSilent`,
    ],
    pi = (e) => () => {
      throw Error(
        `UserManager#${e} was called from an unsupported context. If this is a server-rendered page, defer this call with useEffect() or pass a custom UserManager implementation.`,
      );
    },
    mi = typeof window > `u` ? null : ei,
    hi = (e) => {
      let {
          children: t,
          onSigninCallback: n,
          skipSigninCallback: r,
          matchSignoutCallback: i,
          onSignoutCallback: a,
          onRemoveUser: o,
          userManager: s = null,
          ...c
        } = e,
        [l] = x.useState(() => s ?? (mi ? new mi(c) : { settings: c })),
        [u, d] = x.useReducer(ri, ni),
        f = x.useMemo(
          () =>
            Object.assign(
              { settings: l.settings, events: l.events },
              Object.fromEntries(di.map((e) => [e, l[e]?.bind(l) ?? pi(e)])),
              Object.fromEntries(
                fi.map((e) => [
                  e,
                  l[e]
                    ? async (t) => {
                        d({ type: `NAVIGATOR_INIT`, method: e });
                        try {
                          return await l[e](t);
                        } catch (n) {
                          return (
                            d({
                              type: `ERROR`,
                              error: {
                                ...ci(
                                  n,
                                  `Unknown error while executing ${e}(...).`,
                                ),
                                source: e,
                                args: t,
                              },
                            }),
                            null
                          );
                        } finally {
                          d({ type: `NAVIGATOR_CLOSE` });
                        }
                      }
                    : pi(e),
                ]),
              ),
            ),
          [l],
        ),
        p = x.useRef(!1);
      (x.useEffect(() => {
        !l ||
          p.current ||
          ((p.current = !0),
          (async () => {
            try {
              let e = null;
              (ii() &&
                !r &&
                ((e = await l.signinCallback()), n && (await n(e))),
                (e ||= await l.getUser()),
                d({ type: `INITIALISED`, user: e }));
            } catch (e) {
              d({ type: `ERROR`, error: ai(e) });
            }
            try {
              if (i && i(l.settings)) {
                let e = await l.signoutCallback();
                a && (await a(e));
              }
            } catch (e) {
              d({ type: `ERROR`, error: oi(e) });
            }
          })());
      }, [l, r, n, a, i]),
        x.useEffect(() => {
          if (!l) return;
          let e = (e) => {
            d({ type: `USER_LOADED`, user: e });
          };
          l.events.addUserLoaded(e);
          let t = () => {
            d({ type: `USER_UNLOADED` });
          };
          l.events.addUserUnloaded(t);
          let n = () => {
            d({ type: `USER_SIGNED_OUT` });
          };
          l.events.addUserSignedOut(n);
          let r = (e) => {
            d({ type: `ERROR`, error: si(e) });
          };
          return (
            l.events.addSilentRenewError(r),
            () => {
              (l.events.removeUserLoaded(e),
                l.events.removeUserUnloaded(t),
                l.events.removeUserSignedOut(n),
                l.events.removeSilentRenewError(r));
            }
          );
        }, [l]));
      let m = x.useCallback(async () => {
          (await l.removeUser(), o && (await o()));
        }, [l, o]),
        h = x.useMemo(() => ({ ...u, ...f, removeUser: m }), [u, f, m]);
      return x.createElement(ti.Provider, { value: h }, t);
    },
    gi = () => {
      let e = x.useContext(ti);
      return (
        e ||
          console.warn(
            `AuthProvider context is undefined, please verify you are calling useAuth() as child of a <AuthProvider> component.`,
          ),
        e
      );
    },
    _i = [],
    vi = [],
    yi = Uint8Array,
    bi = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`,
    xi = 0,
    Si = bi.length;
  xi < Si;
  ++xi
)
  ((_i[xi] = bi[xi]), (vi[bi.charCodeAt(xi)] = xi));
((vi[45] = 62), (vi[95] = 63));
function Ci(e) {
  var t = e.length;
  if (t % 4 > 0) throw Error(`Invalid string. Length must be a multiple of 4`);
  var n = e.indexOf(`=`);
  n === -1 && (n = t);
  var r = n === t ? 0 : 4 - (n % 4);
  return [n, r];
}
function wi(e, t, n) {
  return ((t + n) * 3) / 4 - n;
}
function Ti(e) {
  var t,
    n = Ci(e),
    r = n[0],
    i = n[1],
    a = new yi(wi(e, r, i)),
    o = 0,
    s = i > 0 ? r - 4 : r,
    c;
  for (c = 0; c < s; c += 4)
    ((t =
      (vi[e.charCodeAt(c)] << 18) |
      (vi[e.charCodeAt(c + 1)] << 12) |
      (vi[e.charCodeAt(c + 2)] << 6) |
      vi[e.charCodeAt(c + 3)]),
      (a[o++] = (t >> 16) & 255),
      (a[o++] = (t >> 8) & 255),
      (a[o++] = t & 255));
  return (
    i === 2 &&
      ((t = (vi[e.charCodeAt(c)] << 2) | (vi[e.charCodeAt(c + 1)] >> 4)),
      (a[o++] = t & 255)),
    i === 1 &&
      ((t =
        (vi[e.charCodeAt(c)] << 10) |
        (vi[e.charCodeAt(c + 1)] << 4) |
        (vi[e.charCodeAt(c + 2)] >> 2)),
      (a[o++] = (t >> 8) & 255),
      (a[o++] = t & 255)),
    a
  );
}
function Ei(e) {
  return (
    _i[(e >> 18) & 63] + _i[(e >> 12) & 63] + _i[(e >> 6) & 63] + _i[e & 63]
  );
}
function Di(e, t, n) {
  for (var r, i = [], a = t; a < n; a += 3)
    ((r =
      ((e[a] << 16) & 16711680) + ((e[a + 1] << 8) & 65280) + (e[a + 2] & 255)),
      i.push(Ei(r)));
  return i.join(``);
}
function Oi(e) {
  for (
    var t, n = e.length, r = n % 3, i = [], a = 16383, o = 0, s = n - r;
    o < s;
    o += a
  )
    i.push(Di(e, o, o + a > s ? s : o + a));
  return (
    r === 1
      ? ((t = e[n - 1]), i.push(_i[t >> 2] + _i[(t << 4) & 63] + `==`))
      : r === 2 &&
        ((t = (e[n - 2] << 8) + e[n - 1]),
        i.push(_i[t >> 10] + _i[(t >> 4) & 63] + _i[(t << 2) & 63] + `=`)),
    i.join(``)
  );
}
function ki(e) {
  if (e === void 0) return {};
  if (!ji(e))
    throw Error(
      `The arguments to a Convex function must be an object. Received: ${e}`,
    );
  return e;
}
function Ai(e) {
  if (e === void 0)
    throw Error(
      `Client created with undefined deployment address. If you used an environment variable, check that it's set.`,
    );
  if (typeof e != `string`)
    throw Error(`Invalid deployment address: found ${e}".`);
  if (!(e.startsWith(`http:`) || e.startsWith(`https:`)))
    throw Error(
      `Invalid deployment address: Must start with "https://" or "http://". Found "${e}".`,
    );
  try {
    new URL(e);
  } catch {
    throw Error(
      `Invalid deployment address: "${e}" is not a valid URL. If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`,
    );
  }
  if (e.endsWith(`.convex.site`))
    throw Error(
      `Invalid deployment address: "${e}" ends with .convex.site, which is used for HTTP Actions. Convex deployment URLs typically end with .convex.cloud? If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`,
    );
}
function ji(e) {
  let t = typeof e == `object`,
    n = Object.getPrototypeOf(e),
    r =
      n === null || n === Object.prototype || n?.constructor?.name === `Object`;
  return t && r;
}
var Mi = !0,
  Ni = BigInt(`-9223372036854775808`),
  Pi = BigInt(`9223372036854775807`),
  Fi = BigInt(`0`),
  Ii = BigInt(`8`),
  Li = BigInt(`256`),
  Ri = `This commit timestamp is unresolved: its value is assigned when the mutation commits. Read the document after the mutation completes to get its value.`,
  zi = class {
    [Symbol.toPrimitive](e) {
      if (e === `string`) return this.toString();
      throw Error(Ri);
    }
    valueOf() {
      throw Error(Ri);
    }
    toJSON() {
      throw Error(Ri);
    }
    toString() {
      return `[unresolved commit timestamp]`;
    }
  },
  P = new zi();
function Bi(e) {
  return Number.isNaN(e) || !Number.isFinite(e) || Object.is(e, -0);
}
function Vi(e) {
  e < Fi && (e -= Ni + Ni);
  let t = e.toString(16);
  t.length % 2 == 1 && (t = `0` + t);
  let n = new Uint8Array(new ArrayBuffer(8)),
    r = 0;
  for (let i of t.match(/.{2}/g).reverse())
    (n.set([parseInt(i, 16)], r++), (e >>= Ii));
  return Oi(n);
}
function Hi(e) {
  let t = Ti(e);
  if (t.byteLength !== 8)
    throw Error(`Received ${t.byteLength} bytes, expected 8 for $integer`);
  let n = Fi,
    r = Fi;
  for (let e of t) ((n += BigInt(e) * Li ** r), r++);
  return (n > Pi && (n += Ni + Ni), n);
}
function Ui(e) {
  if (e < Ni || Pi < e)
    throw Error(`BigInt ${e} does not fit into a 64-bit signed integer.`);
  let t = new ArrayBuffer(8);
  return (new DataView(t).setBigInt64(0, e, !0), Oi(new Uint8Array(t)));
}
function Wi(e) {
  let t = Ti(e);
  if (t.byteLength !== 8)
    throw Error(`Received ${t.byteLength} bytes, expected 8 for $integer`);
  return new DataView(t.buffer).getBigInt64(0, !0);
}
var Gi = DataView.prototype.setBigInt64 ? Ui : Vi,
  Ki = DataView.prototype.getBigInt64 ? Wi : Hi,
  qi = 1024;
function Ji(e) {
  if (e.length > qi)
    throw Error(`Field name ${e} exceeds maximum field name length ${qi}.`);
  if (e.startsWith(`$`))
    throw Error(`Field name ${e} starts with a '$', which is reserved.`);
  for (let t = 0; t < e.length; t += 1) {
    let n = e.charCodeAt(t);
    if (n < 32 || n >= 127)
      throw Error(
        `Field name ${e} has invalid character '${e[t]}': Field names can only contain non-control ASCII characters`,
      );
  }
}
function Yi(e) {
  if (
    e === null ||
    typeof e == `boolean` ||
    typeof e == `number` ||
    typeof e == `string`
  )
    return e;
  if (Array.isArray(e)) return e.map((e) => Yi(e));
  if (typeof e != `object`) throw Error(`Unexpected type of ${e}`);
  let t = Object.entries(e);
  if (t.length === 1) {
    let n = t[0][0];
    if (n === `$bytes`) {
      if (typeof e.$bytes != `string`)
        throw Error(`Malformed $bytes field on ${e}`);
      return Ti(e.$bytes).buffer;
    }
    if (n === `$integer`) {
      if (typeof e.$integer != `string`)
        throw Error(`Malformed $integer field on ${e}`);
      return Ki(e.$integer);
    }
    if (n === `$float`) {
      if (typeof e.$float != `string`)
        throw Error(`Malformed $float field on ${e}`);
      let t = Ti(e.$float);
      if (t.byteLength !== 8)
        throw Error(`Received ${t.byteLength} bytes, expected 8 for $float`);
      let n = new DataView(t.buffer).getFloat64(0, Mi);
      if (!Bi(n)) throw Error(`Float ${n} should be encoded as a number`);
      return n;
    }
    if (n === `$commitTs`) {
      if (e.$commitTs !== null)
        throw Error(`Malformed $commitTs field on ${e}`);
      return P;
    }
    if (n === `$set`)
      throw Error(
        `Received a Set which is no longer supported as a Convex type.`,
      );
    if (n === `$map`)
      throw Error(
        `Received a Map which is no longer supported as a Convex type.`,
      );
  }
  let n = {};
  for (let [t, r] of Object.entries(e)) (Ji(t), (n[t] = Yi(r)));
  return n;
}
var Xi = 16384;
function Zi(e) {
  let t = JSON.stringify(e, (e, t) =>
    t === void 0 ? `undefined` : typeof t == `bigint` ? `${t.toString()}n` : t,
  );
  if (t.length > Xi) {
    let e = 16370,
      n = t.codePointAt(e - 1);
    return (
      n !== void 0 && n > 65535 && --e,
      t.substring(0, e) + `[...truncated]`
    );
  }
  return t;
}
function Qi(e, t, n, r) {
  if (e === void 0) {
    let e = n && ` (present at path ${n} in original object ${Zi(t)})`;
    throw Error(
      `undefined is not a valid Convex value${e}. To learn about Convex's supported types, see https://docs.convex.dev/using/types.`,
    );
  }
  if (e === null) return e;
  if (typeof e == `bigint`) {
    if (e < Ni || Pi < e)
      throw Error(`BigInt ${e} does not fit into a 64-bit signed integer.`);
    return { $integer: Gi(e) };
  }
  if (typeof e == `number`)
    if (Bi(e)) {
      let t = new ArrayBuffer(8);
      return (
        new DataView(t).setFloat64(0, e, Mi),
        { $float: Oi(new Uint8Array(t)) }
      );
    } else return e;
  if (typeof e == `boolean` || typeof e == `string`) return e;
  if (e instanceof ArrayBuffer) return { $bytes: Oi(new Uint8Array(e)) };
  if (e instanceof zi) return { $commitTs: null };
  if (Array.isArray(e)) return e.map((e, r) => Qi(e, t, n + `[${r}]`, !1));
  if (e instanceof Set) throw Error($i(n, `Set`, [...e], t));
  if (e instanceof Map) throw Error($i(n, `Map`, [...e], t));
  if (!ji(e)) {
    let r = e?.constructor?.name,
      i = r ? `${r} ` : ``;
    throw Error($i(n, i, e, t));
  }
  let i = {},
    a = Object.entries(e);
  a.sort(([e, t], [n, r]) => (e === n ? 0 : e < n ? -1 : 1));
  for (let [e, o] of a)
    o === void 0
      ? r && (Ji(e), (i[e] = ea(o, t, n + `.${e}`)))
      : (Ji(e), (i[e] = Qi(o, t, n + `.${e}`, !1)));
  return i;
}
function $i(e, t, n, r) {
  return e
    ? `${t}${Zi(n)} is not a supported Convex type (present at path ${e} in original object ${Zi(r)}). To learn about Convex's supported types, see https://docs.convex.dev/using/types.`
    : `${t}${Zi(n)} is not a supported Convex type.`;
}
function ea(e, t, n) {
  if (e === void 0) return { $undefined: null };
  if (t === void 0)
    throw Error(
      `Programming error. Current value is ${Zi(e)} but original value is undefined`,
    );
  return Qi(e, t, n, !1);
}
function ta(e) {
  return Qi(e, e, ``, !1);
}
var na = Object.defineProperty,
  ra = (e, t, n) =>
    t in e
      ? na(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  ia = (e, t, n) => ra(e, typeof t == `symbol` ? t : t + ``, n),
  aa,
  oa,
  sa = Symbol.for(`ConvexError`),
  ca = class extends ((oa = Error), (aa = sa), oa) {
    constructor(e) {
      (super(typeof e == `string` ? e : Zi(e)),
        ia(this, `name`, `ConvexError`),
        ia(this, `data`),
        ia(this, aa, !0),
        (this.data = e));
    }
  },
  la;
function F(e, t, n) {
  function r(n, r) {
    if (
      (n._zod ||
        Object.defineProperty(n, "_zod", {
          value: { def: r, constr: o, traits: new Set() },
          enumerable: !1,
        }),
      n._zod.traits.has(e))
    )
      return;
    (n._zod.traits.add(e), t(n, r));
    let i = o.prototype,
      a = Object.keys(i);
    for (let e = 0; e < a.length; e++) {
      let t = a[e];
      t in n || (n[t] = i[t].bind(n));
    }
  }
  let i = n?.Parent ?? Object;
  class a extends i {}
  Object.defineProperty(a, "name", { value: e });
  function o(e) {
    var t;
    let i = n?.Parent ? new a() : this;
    (r(i, e), (t = i._zod).deferred ?? (t.deferred = []));
    for (let e of i._zod.deferred) e();
    return i;
  }
  return (
    Object.defineProperty(o, "init", { value: r }),
    Object.defineProperty(o, Symbol.hasInstance, {
      value: (t) =>
        n?.Parent && t instanceof n.Parent ? !0 : t?._zod?.traits?.has(e),
    }),
    Object.defineProperty(o, "name", { value: e }),
    o
  );
}
var ua = class extends Error {
    constructor() {
      super(
        `Encountered Promise during synchronous parse. Use .parseAsync() instead.`,
      );
    }
  },
  da = class extends Error {
    constructor(e) {
      (super(`Encountered unidirectional transform during encode: ${e}`),
        (this.name = `ZodEncodeError`));
    }
  };
(la = globalThis).__zod_globalConfig ?? (la.__zod_globalConfig = {});
var fa = globalThis.__zod_globalConfig;
function pa(e) {
  return (e && Object.assign(fa, e), fa);
}
function ma(e) {
  let t = Object.values(e).filter((e) => typeof e == `number`);
  return Object.entries(e)
    .filter(([e, n]) => t.indexOf(+e) === -1)
    .map(([e, t]) => t);
}
function ha(e, t) {
  return typeof t == `bigint` ? t.toString() : t;
}
function ga(e) {
  return {
    get value() {
      {
        let t = e();
        return (Object.defineProperty(this, "value", { value: t }), t);
      }
    },
  };
}
function _a(e) {
  return e == null;
}
function va(e) {
  let t = +!!e.startsWith(`^`),
    n = e.endsWith(`$`) ? e.length - 1 : e.length;
  return e.slice(t, n);
}
var ya = Symbol(`evaluating`);
function I(e, t, n) {
  let r;
  Object.defineProperty(e, t, {
    get() {
      if (r !== ya) return (r === void 0 && ((r = ya), (r = n())), r);
    },
    set(n) {
      Object.defineProperty(e, t, { value: n });
    },
    configurable: !0,
  });
}
function ba(e, t, n) {
  Object.defineProperty(e, t, {
    value: n,
    writable: !0,
    enumerable: !0,
    configurable: !0,
  });
}
function xa(...e) {
  let t = {};
  for (let n of e) {
    let e = Object.getOwnPropertyDescriptors(n);
    Object.assign(t, e);
  }
  return Object.defineProperties({}, t);
}
function Sa(e) {
  return JSON.stringify(e);
}
function Ca(e) {
  return e
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, ``)
    .replace(/[\s_-]+/g, `-`)
    .replace(/^-+|-+$/g, ``);
}
var wa = `captureStackTrace` in Error ? Error.captureStackTrace : (...e) => {};
function Ta(e) {
  return typeof e == `object` && !!e && !Array.isArray(e);
}
var Ea = ga(() => {
  if (
    fa.jitless ||
    (typeof navigator < `u` && navigator?.userAgent?.includes(`Cloudflare`))
  )
    return !1;
  try {
    return (Function(``), !0);
  } catch {
    return !1;
  }
});
function Da(e) {
  if (Ta(e) === !1) return !1;
  let t = e.constructor;
  if (t === void 0 || typeof t != `function`) return !0;
  let n = t.prototype;
  return (
    Ta(n) !== !1 &&
    Object.prototype.hasOwnProperty.call(n, `isPrototypeOf`) !== !1
  );
}
function Oa(e) {
  return Da(e)
    ? { ...e }
    : Array.isArray(e)
      ? [...e]
      : e instanceof Map
        ? new Map(e)
        : e instanceof Set
          ? new Set(e)
          : e;
}
var ka = new Set([`string`, `number`, `symbol`]);
function Aa(e) {
  return e.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
}
function ja(e, t, n) {
  let r = new e._zod.constr(t ?? e._zod.def);
  return ((!t || n?.parent) && (r._zod.parent = e), r);
}
function L(e) {
  let t = e;
  if (!t) return {};
  if (typeof t == `string`) return { error: () => t };
  if (t?.message !== void 0) {
    if (t?.error !== void 0)
      throw Error("Cannot specify both `message` and `error` params");
    t.error = t.message;
  }
  return (
    delete t.message,
    typeof t.error == `string` ? { ...t, error: () => t.error } : t
  );
}
function Ma(e) {
  return Object.keys(e).filter(
    (t) => e[t]._zod.optin === `optional` && e[t]._zod.optout === `optional`,
  );
}
(-Number.MAX_VALUE, Number.MAX_VALUE);
function Na(e, t) {
  let n = e._zod.def,
    r = n.checks;
  if (r && r.length > 0)
    throw Error(
      `.pick() cannot be used on object schemas containing refinements`,
    );
  return ja(
    e,
    xa(e._zod.def, {
      get shape() {
        let e = {};
        for (let r in t) {
          if (!(r in n.shape)) throw Error(`Unrecognized key: "${r}"`);
          t[r] && (e[r] = n.shape[r]);
        }
        return (ba(this, `shape`, e), e);
      },
      checks: [],
    }),
  );
}
function Pa(e, t) {
  let n = e._zod.def,
    r = n.checks;
  if (r && r.length > 0)
    throw Error(
      `.omit() cannot be used on object schemas containing refinements`,
    );
  return ja(
    e,
    xa(e._zod.def, {
      get shape() {
        let r = { ...e._zod.def.shape };
        for (let e in t) {
          if (!(e in n.shape)) throw Error(`Unrecognized key: "${e}"`);
          t[e] && delete r[e];
        }
        return (ba(this, `shape`, r), r);
      },
      checks: [],
    }),
  );
}
function Fa(e, t) {
  if (!Da(t)) throw Error(`Invalid input to extend: expected a plain object`);
  let n = e._zod.def.checks;
  if (n && n.length > 0) {
    let n = e._zod.def.shape;
    for (let e in t)
      if (Object.getOwnPropertyDescriptor(n, e) !== void 0)
        throw Error(
          "Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.",
        );
  }
  return ja(
    e,
    xa(e._zod.def, {
      get shape() {
        let n = { ...e._zod.def.shape, ...t };
        return (ba(this, `shape`, n), n);
      },
    }),
  );
}
function Ia(e, t) {
  if (!Da(t))
    throw Error(`Invalid input to safeExtend: expected a plain object`);
  return ja(
    e,
    xa(e._zod.def, {
      get shape() {
        let n = { ...e._zod.def.shape, ...t };
        return (ba(this, `shape`, n), n);
      },
    }),
  );
}
function La(e, t) {
  if (e._zod.def.checks?.length)
    throw Error(
      `.merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.`,
    );
  return ja(
    e,
    xa(e._zod.def, {
      get shape() {
        let n = { ...e._zod.def.shape, ...t._zod.def.shape };
        return (ba(this, `shape`, n), n);
      },
      get catchall() {
        return t._zod.def.catchall;
      },
      checks: t._zod.def.checks ?? [],
    }),
  );
}
function Ra(e, t, n) {
  let r = t._zod.def.checks;
  if (r && r.length > 0)
    throw Error(
      `.partial() cannot be used on object schemas containing refinements`,
    );
  return ja(
    t,
    xa(t._zod.def, {
      get shape() {
        let r = t._zod.def.shape,
          i = { ...r };
        if (n)
          for (let t in n) {
            if (!(t in r)) throw Error(`Unrecognized key: "${t}"`);
            n[t] &&
              (i[t] = e ? new e({ type: `optional`, innerType: r[t] }) : r[t]);
          }
        else
          for (let t in r)
            i[t] = e ? new e({ type: `optional`, innerType: r[t] }) : r[t];
        return (ba(this, `shape`, i), i);
      },
      checks: [],
    }),
  );
}
function za(e, t, n) {
  return ja(
    t,
    xa(t._zod.def, {
      get shape() {
        let r = t._zod.def.shape,
          i = { ...r };
        if (n)
          for (let t in n) {
            if (!(t in i)) throw Error(`Unrecognized key: "${t}"`);
            n[t] && (i[t] = new e({ type: `nonoptional`, innerType: r[t] }));
          }
        else
          for (let t in r)
            i[t] = new e({ type: `nonoptional`, innerType: r[t] });
        return (ba(this, `shape`, i), i);
      },
    }),
  );
}
function Ba(e, t = 0) {
  if (e.aborted === !0) return !0;
  for (let n = t; n < e.issues.length; n++)
    if (e.issues[n]?.continue !== !0) return !0;
  return !1;
}
function Va(e, t = 0) {
  if (e.aborted === !0) return !0;
  for (let n = t; n < e.issues.length; n++)
    if (e.issues[n]?.continue === !1) return !0;
  return !1;
}
function Ha(e, t) {
  return t.map((t) => {
    var n;
    return ((n = t).path ?? (n.path = []), t.path.unshift(e), t);
  });
}
function Ua(e) {
  return typeof e == `string` ? e : e?.message;
}
function Wa(e, t, n) {
  let r = e.message
      ? e.message
      : (Ua(e.inst?._zod.def?.error?.(e)) ??
        Ua(t?.error?.(e)) ??
        Ua(n.customError?.(e)) ??
        Ua(n.localeError?.(e)) ??
        `Invalid input`),
    { inst: i, continue: a, input: o, ...s } = e;
  return ((s.path ??= []), (s.message = r), t?.reportInput && (s.input = o), s);
}
function Ga(e) {
  return Array.isArray(e)
    ? `array`
    : typeof e == `string`
      ? `string`
      : `unknown`;
}
function Ka(...e) {
  let [t, n, r] = e;
  return typeof t == `string`
    ? { message: t, code: `custom`, input: n, inst: r }
    : { ...t };
}
var qa = (e, t) => {
    ((e.name = `$ZodError`),
      Object.defineProperty(e, "_zod", { value: e._zod, enumerable: !1 }),
      Object.defineProperty(e, "issues", { value: t, enumerable: !1 }),
      (e.message = JSON.stringify(t, ha, 2)),
      Object.defineProperty(e, "toString", {
        value: () => e.message,
        enumerable: !1,
      }));
  },
  Ja = F(`$ZodError`, qa),
  Ya = F(`$ZodError`, qa, { Parent: Error });
function Xa(e, t = (e) => e.message) {
  let n = {},
    r = [];
  for (let i of e.issues)
    i.path.length > 0
      ? ((n[i.path[0]] = n[i.path[0]] || []), n[i.path[0]].push(t(i)))
      : r.push(t(i));
  return { formErrors: r, fieldErrors: n };
}
function Za(e, t = (e) => e.message) {
  let n = { _errors: [] },
    r = (e, i = []) => {
      for (let a of e.issues)
        if (a.code === `invalid_union` && a.errors.length)
          a.errors.map((e) => r({ issues: e }, [...i, ...a.path]));
        else if (a.code === `invalid_key`)
          r({ issues: a.issues }, [...i, ...a.path]);
        else if (a.code === `invalid_element`)
          r({ issues: a.issues }, [...i, ...a.path]);
        else {
          let e = [...i, ...a.path];
          if (e.length === 0) n._errors.push(t(a));
          else {
            let r = n,
              i = 0;
            for (; i < e.length;) {
              let n = e[i];
              (i === e.length - 1
                ? ((r[n] = r[n] || { _errors: [] }), r[n]._errors.push(t(a)))
                : (r[n] = r[n] || { _errors: [] }),
                (r = r[n]),
                i++);
            }
          }
        }
    };
  return (r(e), n);
}
var Qa = (e) => (t, n, r, i) => {
    let a = r ? { ...r, async: !1 } : { async: !1 },
      o = t._zod.run({ value: n, issues: [] }, a);
    if (o instanceof Promise) throw new ua();
    if (o.issues.length) {
      let t = new (i?.Err ?? e)(o.issues.map((e) => Wa(e, a, pa())));
      throw (wa(t, i?.callee), t);
    }
    return o.value;
  },
  $a = (e) => async (t, n, r, i) => {
    let a = r ? { ...r, async: !0 } : { async: !0 },
      o = t._zod.run({ value: n, issues: [] }, a);
    if ((o instanceof Promise && (o = await o), o.issues.length)) {
      let t = new (i?.Err ?? e)(o.issues.map((e) => Wa(e, a, pa())));
      throw (wa(t, i?.callee), t);
    }
    return o.value;
  },
  eo = (e) => (t, n, r) => {
    let i = r ? { ...r, async: !1 } : { async: !1 },
      a = t._zod.run({ value: n, issues: [] }, i);
    if (a instanceof Promise) throw new ua();
    return a.issues.length
      ? {
          success: !1,
          error: new (e ?? Ja)(a.issues.map((e) => Wa(e, i, pa()))),
        }
      : { success: !0, data: a.value };
  },
  to = eo(Ya),
  no = (e) => async (t, n, r) => {
    let i = r ? { ...r, async: !0 } : { async: !0 },
      a = t._zod.run({ value: n, issues: [] }, i);
    return (
      a instanceof Promise && (a = await a),
      a.issues.length
        ? { success: !1, error: new e(a.issues.map((e) => Wa(e, i, pa()))) }
        : { success: !0, data: a.value }
    );
  },
  ro = no(Ya),
  io = (e) => (t, n, r) => {
    let i = r ? { ...r, direction: `backward` } : { direction: `backward` };
    return Qa(e)(t, n, i);
  },
  ao = (e) => (t, n, r) => Qa(e)(t, n, r),
  oo = (e) => async (t, n, r) => {
    let i = r ? { ...r, direction: `backward` } : { direction: `backward` };
    return $a(e)(t, n, i);
  },
  so = (e) => async (t, n, r) => $a(e)(t, n, r),
  co = (e) => (t, n, r) => {
    let i = r ? { ...r, direction: `backward` } : { direction: `backward` };
    return eo(e)(t, n, i);
  },
  lo = (e) => (t, n, r) => eo(e)(t, n, r),
  uo = (e) => async (t, n, r) => {
    let i = r ? { ...r, direction: `backward` } : { direction: `backward` };
    return no(e)(t, n, i);
  },
  fo = (e) => async (t, n, r) => no(e)(t, n, r),
  po = /^[cC][0-9a-z]{6,}$/,
  mo = /^[0-9a-z]+$/,
  ho = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,
  R = /^[0-9a-vA-V]{20}$/,
  z = /^[A-Za-z0-9]{27}$/,
  go = /^[a-zA-Z0-9_-]{21}$/,
  _o =
    /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
  vo =
    /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
  yo = (e) =>
    e
      ? RegExp(
          `^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`,
        )
      : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
  bo =
    /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,
  xo = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function So() {
  return new RegExp(xo, `u`);
}
var Co =
    /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  wo =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,
  To =
    /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
  Eo =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  Do =
    /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,
  Oo = /^[A-Za-z0-9_-]*$/,
  ko = /^https?$/,
  Ao = /^\+[1-9]\d{6,14}$/,
  jo = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`,
  Mo = RegExp(`^${jo}$`);
function No(e) {
  let t = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  return typeof e.precision == `number`
    ? e.precision === -1
      ? `${t}`
      : e.precision === 0
        ? `${t}:[0-5]\\d`
        : `${t}:[0-5]\\d\\.\\d{${e.precision}}`
    : `${t}(?::[0-5]\\d(?:\\.\\d+)?)?`;
}
function Po(e) {
  return RegExp(`^${No(e)}$`);
}
function Fo(e) {
  let t = No({ precision: e.precision }),
    n = [`Z`];
  (e.local && n.push(``),
    e.offset && n.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`));
  let r = `${t}(?:${n.join(`|`)})`;
  return RegExp(`^${jo}T(?:${r})$`);
}
var Io = (e) => {
    let t = e
      ? `[\\s\\S]{${e?.minimum ?? 0},${e?.maximum ?? ``}}`
      : `[\\s\\S]*`;
    return RegExp(`^${t}$`);
  },
  Lo = /^[^A-Z]*$/,
  Ro = /^[^a-z]*$/,
  zo = F(`$ZodCheck`, (e, t) => {
    var n;
    ((e._zod ??= {}),
      (e._zod.def = t),
      (n = e._zod).onattach ?? (n.onattach = []));
  }),
  Bo = F(`$ZodCheckMaxLength`, (e, t) => {
    var n;
    (zo.init(e, t),
      (n = e._zod.def).when ??
        (n.when = (e) => {
          let t = e.value;
          return !_a(t) && t.length !== void 0;
        }),
      e._zod.onattach.push((e) => {
        let n = e._zod.bag.maximum ?? 1 / 0;
        t.maximum < n && (e._zod.bag.maximum = t.maximum);
      }),
      (e._zod.check = (n) => {
        let r = n.value;
        if (r.length <= t.maximum) return;
        let i = Ga(r);
        n.issues.push({
          origin: i,
          code: `too_big`,
          maximum: t.maximum,
          inclusive: !0,
          input: r,
          inst: e,
          continue: !t.abort,
        });
      }));
  }),
  Vo = F(`$ZodCheckMinLength`, (e, t) => {
    var n;
    (zo.init(e, t),
      (n = e._zod.def).when ??
        (n.when = (e) => {
          let t = e.value;
          return !_a(t) && t.length !== void 0;
        }),
      e._zod.onattach.push((e) => {
        let n = e._zod.bag.minimum ?? -1 / 0;
        t.minimum > n && (e._zod.bag.minimum = t.minimum);
      }),
      (e._zod.check = (n) => {
        let r = n.value;
        if (r.length >= t.minimum) return;
        let i = Ga(r);
        n.issues.push({
          origin: i,
          code: `too_small`,
          minimum: t.minimum,
          inclusive: !0,
          input: r,
          inst: e,
          continue: !t.abort,
        });
      }));
  }),
  Ho = F(`$ZodCheckLengthEquals`, (e, t) => {
    var n;
    (zo.init(e, t),
      (n = e._zod.def).when ??
        (n.when = (e) => {
          let t = e.value;
          return !_a(t) && t.length !== void 0;
        }),
      e._zod.onattach.push((e) => {
        let n = e._zod.bag;
        ((n.minimum = t.length), (n.maximum = t.length), (n.length = t.length));
      }),
      (e._zod.check = (n) => {
        let r = n.value,
          i = r.length;
        if (i === t.length) return;
        let a = Ga(r),
          o = i > t.length;
        n.issues.push({
          origin: a,
          ...(o
            ? { code: `too_big`, maximum: t.length }
            : { code: `too_small`, minimum: t.length }),
          inclusive: !0,
          exact: !0,
          input: n.value,
          inst: e,
          continue: !t.abort,
        });
      }));
  }),
  Uo = F(`$ZodCheckStringFormat`, (e, t) => {
    var n, r;
    (zo.init(e, t),
      e._zod.onattach.push((e) => {
        let n = e._zod.bag;
        ((n.format = t.format),
          t.pattern && ((n.patterns ??= new Set()), n.patterns.add(t.pattern)));
      }),
      t.pattern
        ? ((n = e._zod).check ??
          (n.check = (n) => {
            ((t.pattern.lastIndex = 0),
              !t.pattern.test(n.value) &&
                n.issues.push({
                  origin: `string`,
                  code: `invalid_format`,
                  format: t.format,
                  input: n.value,
                  ...(t.pattern ? { pattern: t.pattern.toString() } : {}),
                  inst: e,
                  continue: !t.abort,
                }));
          }))
        : ((r = e._zod).check ?? (r.check = () => {})));
  }),
  Wo = F(`$ZodCheckRegex`, (e, t) => {
    (Uo.init(e, t),
      (e._zod.check = (n) => {
        ((t.pattern.lastIndex = 0),
          !t.pattern.test(n.value) &&
            n.issues.push({
              origin: `string`,
              code: `invalid_format`,
              format: `regex`,
              input: n.value,
              pattern: t.pattern.toString(),
              inst: e,
              continue: !t.abort,
            }));
      }));
  }),
  Go = F(`$ZodCheckLowerCase`, (e, t) => {
    ((t.pattern ??= Lo), Uo.init(e, t));
  }),
  Ko = F(`$ZodCheckUpperCase`, (e, t) => {
    ((t.pattern ??= Ro), Uo.init(e, t));
  }),
  qo = F(`$ZodCheckIncludes`, (e, t) => {
    zo.init(e, t);
    let n = Aa(t.includes),
      r = new RegExp(
        typeof t.position == `number` ? `^.{${t.position}}${n}` : n,
      );
    ((t.pattern = r),
      e._zod.onattach.push((e) => {
        let t = e._zod.bag;
        ((t.patterns ??= new Set()), t.patterns.add(r));
      }),
      (e._zod.check = (n) => {
        n.value.includes(t.includes, t.position) ||
          n.issues.push({
            origin: `string`,
            code: `invalid_format`,
            format: `includes`,
            includes: t.includes,
            input: n.value,
            inst: e,
            continue: !t.abort,
          });
      }));
  }),
  Jo = F(`$ZodCheckStartsWith`, (e, t) => {
    zo.init(e, t);
    let n = RegExp(`^${Aa(t.prefix)}.*`);
    ((t.pattern ??= n),
      e._zod.onattach.push((e) => {
        let t = e._zod.bag;
        ((t.patterns ??= new Set()), t.patterns.add(n));
      }),
      (e._zod.check = (n) => {
        n.value.startsWith(t.prefix) ||
          n.issues.push({
            origin: `string`,
            code: `invalid_format`,
            format: `starts_with`,
            prefix: t.prefix,
            input: n.value,
            inst: e,
            continue: !t.abort,
          });
      }));
  }),
  Yo = F(`$ZodCheckEndsWith`, (e, t) => {
    zo.init(e, t);
    let n = RegExp(`.*${Aa(t.suffix)}$`);
    ((t.pattern ??= n),
      e._zod.onattach.push((e) => {
        let t = e._zod.bag;
        ((t.patterns ??= new Set()), t.patterns.add(n));
      }),
      (e._zod.check = (n) => {
        n.value.endsWith(t.suffix) ||
          n.issues.push({
            origin: `string`,
            code: `invalid_format`,
            format: `ends_with`,
            suffix: t.suffix,
            input: n.value,
            inst: e,
            continue: !t.abort,
          });
      }));
  }),
  Xo = F(`$ZodCheckOverwrite`, (e, t) => {
    (zo.init(e, t),
      (e._zod.check = (e) => {
        e.value = t.tx(e.value);
      }));
  }),
  Zo = class {
    constructor(e = []) {
      ((this.content = []), (this.indent = 0), this && (this.args = e));
    }
    indented(e) {
      ((this.indent += 1), e(this), --this.indent);
    }
    write(e) {
      if (typeof e == `function`) {
        (e(this, { execution: `sync` }), e(this, { execution: `async` }));
        return;
      }
      let t = e
          .split(
            `
`,
          )
          .filter((e) => e),
        n = Math.min(...t.map((e) => e.length - e.trimStart().length)),
        r = t
          .map((e) => e.slice(n))
          .map((e) => ` `.repeat(this.indent * 2) + e);
      for (let e of r) this.content.push(e);
    }
    compile() {
      let e = Function,
        t = this?.args,
        n = [...(this?.content ?? [``]).map((e) => `  ${e}`)];
      return new e(
        ...t,
        n.join(`
`),
      );
    }
  },
  Qo = { major: 4, minor: 4, patch: 3 },
  $o = F(`$ZodType`, (e, t) => {
    var n;
    ((e ??= {}),
      (e._zod.def = t),
      (e._zod.bag = e._zod.bag || {}),
      (e._zod.version = Qo));
    let r = [...(e._zod.def.checks ?? [])];
    e._zod.traits.has(`$ZodCheck`) && r.unshift(e);
    for (let t of r) for (let n of t._zod.onattach) n(e);
    if (r.length === 0)
      ((n = e._zod).deferred ?? (n.deferred = []),
        e._zod.deferred?.push(() => {
          e._zod.run = e._zod.parse;
        }));
    else {
      let t = (e, t, n) => {
          let r = Ba(e),
            i;
          for (let a of t) {
            if (a._zod.def.when) {
              if (Va(e) || !a._zod.def.when(e)) continue;
            } else if (r) continue;
            let t = e.issues.length,
              o = a._zod.check(e);
            if (o instanceof Promise && n?.async === !1) throw new ua();
            if (i || o instanceof Promise)
              i = (i ?? Promise.resolve()).then(async () => {
                (await o, e.issues.length !== t && (r ||= Ba(e, t)));
              });
            else {
              if (e.issues.length === t) continue;
              r ||= Ba(e, t);
            }
          }
          return i ? i.then(() => e) : e;
        },
        n = (n, i, a) => {
          if (Ba(n)) return ((n.aborted = !0), n);
          let o = t(i, r, a);
          if (o instanceof Promise) {
            if (a.async === !1) throw new ua();
            return o.then((t) => e._zod.parse(t, a));
          }
          return e._zod.parse(o, a);
        };
      e._zod.run = (i, a) => {
        if (a.skipChecks) return e._zod.parse(i, a);
        if (a.direction === `backward`) {
          let t = e._zod.parse(
            { value: i.value, issues: [] },
            { ...a, skipChecks: !0 },
          );
          return t instanceof Promise ? t.then((e) => n(e, i, a)) : n(t, i, a);
        }
        let o = e._zod.parse(i, a);
        if (o instanceof Promise) {
          if (a.async === !1) throw new ua();
          return o.then((e) => t(e, r, a));
        }
        return t(o, r, a);
      };
    }
    I(e, `~standard`, () => ({
      validate: (t) => {
        try {
          let n = to(e, t);
          return n.success ? { value: n.data } : { issues: n.error?.issues };
        } catch {
          return ro(e, t).then((e) =>
            e.success ? { value: e.data } : { issues: e.error?.issues },
          );
        }
      },
      vendor: `zod`,
      version: 1,
    }));
  }),
  es = F(`$ZodString`, (e, t) => {
    ($o.init(e, t),
      (e._zod.pattern =
        [...(e?._zod.bag?.patterns ?? [])].pop() ?? Io(e._zod.bag)),
      (e._zod.parse = (n, r) => {
        if (t.coerce)
          try {
            n.value = String(n.value);
          } catch {}
        return (
          typeof n.value == `string` ||
            n.issues.push({
              expected: `string`,
              code: `invalid_type`,
              input: n.value,
              inst: e,
            }),
          n
        );
      }));
  }),
  B = F(`$ZodStringFormat`, (e, t) => {
    (Uo.init(e, t), es.init(e, t));
  }),
  ts = F(`$ZodGUID`, (e, t) => {
    ((t.pattern ??= vo), B.init(e, t));
  }),
  ns = F(`$ZodUUID`, (e, t) => {
    if (t.version) {
      let e = { v1: 1, v2: 2, v3: 3, v4: 4, v5: 5, v6: 6, v7: 7, v8: 8 }[
        t.version
      ];
      if (e === void 0) throw Error(`Invalid UUID version: "${t.version}"`);
      t.pattern ??= yo(e);
    } else t.pattern ??= yo();
    B.init(e, t);
  }),
  rs = F(`$ZodEmail`, (e, t) => {
    ((t.pattern ??= bo), B.init(e, t));
  }),
  is = F(`$ZodURL`, (e, t) => {
    (B.init(e, t),
      (e._zod.check = (n) => {
        try {
          let r = n.value.trim();
          if (
            !t.normalize &&
            t.protocol?.source === ko.source &&
            !/^https?:\/\//i.test(r)
          ) {
            n.issues.push({
              code: `invalid_format`,
              format: `url`,
              note: `Invalid URL format`,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
            return;
          }
          let i = new URL(r);
          (t.hostname &&
            ((t.hostname.lastIndex = 0),
            t.hostname.test(i.hostname) ||
              n.issues.push({
                code: `invalid_format`,
                format: `url`,
                note: `Invalid hostname`,
                pattern: t.hostname.source,
                input: n.value,
                inst: e,
                continue: !t.abort,
              })),
            t.protocol &&
              ((t.protocol.lastIndex = 0),
              t.protocol.test(
                i.protocol.endsWith(`:`) ? i.protocol.slice(0, -1) : i.protocol,
              ) ||
                n.issues.push({
                  code: `invalid_format`,
                  format: `url`,
                  note: `Invalid protocol`,
                  pattern: t.protocol.source,
                  input: n.value,
                  inst: e,
                  continue: !t.abort,
                })),
            (n.value = t.normalize ? i.href : r));
          return;
        } catch {
          n.issues.push({
            code: `invalid_format`,
            format: `url`,
            input: n.value,
            inst: e,
            continue: !t.abort,
          });
        }
      }));
  }),
  as = F(`$ZodEmoji`, (e, t) => {
    ((t.pattern ??= So()), B.init(e, t));
  }),
  os = F(`$ZodNanoID`, (e, t) => {
    ((t.pattern ??= go), B.init(e, t));
  }),
  ss = F(`$ZodCUID`, (e, t) => {
    ((t.pattern ??= po), B.init(e, t));
  }),
  cs = F(`$ZodCUID2`, (e, t) => {
    ((t.pattern ??= mo), B.init(e, t));
  }),
  ls = F(`$ZodULID`, (e, t) => {
    ((t.pattern ??= ho), B.init(e, t));
  }),
  us = F(`$ZodXID`, (e, t) => {
    ((t.pattern ??= R), B.init(e, t));
  }),
  ds = F(`$ZodKSUID`, (e, t) => {
    ((t.pattern ??= z), B.init(e, t));
  }),
  fs = F(`$ZodISODateTime`, (e, t) => {
    ((t.pattern ??= Fo(t)), B.init(e, t));
  }),
  ps = F(`$ZodISODate`, (e, t) => {
    ((t.pattern ??= Mo), B.init(e, t));
  }),
  ms = F(`$ZodISOTime`, (e, t) => {
    ((t.pattern ??= Po(t)), B.init(e, t));
  }),
  hs = F(`$ZodISODuration`, (e, t) => {
    ((t.pattern ??= _o), B.init(e, t));
  }),
  gs = F(`$ZodIPv4`, (e, t) => {
    ((t.pattern ??= Co), B.init(e, t), (e._zod.bag.format = `ipv4`));
  }),
  _s = F(`$ZodIPv6`, (e, t) => {
    ((t.pattern ??= wo),
      B.init(e, t),
      (e._zod.bag.format = `ipv6`),
      (e._zod.check = (n) => {
        try {
          new URL(`http://[${n.value}]`);
        } catch {
          n.issues.push({
            code: `invalid_format`,
            format: `ipv6`,
            input: n.value,
            inst: e,
            continue: !t.abort,
          });
        }
      }));
  }),
  vs = F(`$ZodCIDRv4`, (e, t) => {
    ((t.pattern ??= To), B.init(e, t));
  }),
  ys = F(`$ZodCIDRv6`, (e, t) => {
    ((t.pattern ??= Eo),
      B.init(e, t),
      (e._zod.check = (n) => {
        let r = n.value.split(`/`);
        try {
          if (r.length !== 2) throw Error();
          let [e, t] = r;
          if (!t) throw Error();
          let n = Number(t);
          if (`${n}` !== t || n < 0 || n > 128) throw Error();
          new URL(`http://[${e}]`);
        } catch {
          n.issues.push({
            code: `invalid_format`,
            format: `cidrv6`,
            input: n.value,
            inst: e,
            continue: !t.abort,
          });
        }
      }));
  });
function bs(e) {
  if (e === ``) return !0;
  if (/\s/.test(e) || e.length % 4 != 0) return !1;
  try {
    return (atob(e), !0);
  } catch {
    return !1;
  }
}
var xs = F(`$ZodBase64`, (e, t) => {
  ((t.pattern ??= Do),
    B.init(e, t),
    (e._zod.bag.contentEncoding = `base64`),
    (e._zod.check = (n) => {
      bs(n.value) ||
        n.issues.push({
          code: `invalid_format`,
          format: `base64`,
          input: n.value,
          inst: e,
          continue: !t.abort,
        });
    }));
});
function Ss(e) {
  if (!Oo.test(e)) return !1;
  let t = e.replace(/[-_]/g, (e) => (e === `-` ? `+` : `/`));
  return bs(t.padEnd(Math.ceil(t.length / 4) * 4, `=`));
}
var Cs = F(`$ZodBase64URL`, (e, t) => {
    ((t.pattern ??= Oo),
      B.init(e, t),
      (e._zod.bag.contentEncoding = `base64url`),
      (e._zod.check = (n) => {
        Ss(n.value) ||
          n.issues.push({
            code: `invalid_format`,
            format: `base64url`,
            input: n.value,
            inst: e,
            continue: !t.abort,
          });
      }));
  }),
  ws = F(`$ZodE164`, (e, t) => {
    ((t.pattern ??= Ao), B.init(e, t));
  });
function Ts(e, t = null) {
  try {
    let n = e.split(`.`);
    if (n.length !== 3) return !1;
    let [r] = n;
    if (!r) return !1;
    let i = JSON.parse(atob(r));
    return !(
      (`typ` in i && i?.typ !== `JWT`) ||
      !i.alg ||
      (t && (!(`alg` in i) || i.alg !== t))
    );
  } catch {
    return !1;
  }
}
var Es = F(`$ZodJWT`, (e, t) => {
    (B.init(e, t),
      (e._zod.check = (n) => {
        Ts(n.value, t.alg) ||
          n.issues.push({
            code: `invalid_format`,
            format: `jwt`,
            input: n.value,
            inst: e,
            continue: !t.abort,
          });
      }));
  }),
  Ds = F(`$ZodUnknown`, (e, t) => {
    ($o.init(e, t), (e._zod.parse = (e) => e));
  }),
  Os = F(`$ZodNever`, (e, t) => {
    ($o.init(e, t),
      (e._zod.parse = (t, n) => (
        t.issues.push({
          expected: `never`,
          code: `invalid_type`,
          input: t.value,
          inst: e,
        }),
        t
      )));
  });
function ks(e, t, n) {
  (e.issues.length && t.issues.push(...Ha(n, e.issues)),
    (t.value[n] = e.value));
}
var As = F(`$ZodArray`, (e, t) => {
  ($o.init(e, t),
    (e._zod.parse = (n, r) => {
      let i = n.value;
      if (!Array.isArray(i))
        return (
          n.issues.push({
            expected: `array`,
            code: `invalid_type`,
            input: i,
            inst: e,
          }),
          n
        );
      n.value = Array(i.length);
      let a = [];
      for (let e = 0; e < i.length; e++) {
        let o = i[e],
          s = t.element._zod.run({ value: o, issues: [] }, r);
        s instanceof Promise ? a.push(s.then((t) => ks(t, n, e))) : ks(s, n, e);
      }
      return a.length ? Promise.all(a).then(() => n) : n;
    }));
});
function js(e, t, n, r, i, a) {
  let o = n in r;
  if (e.issues.length) {
    if (i && a && !o) return;
    t.issues.push(...Ha(n, e.issues));
  }
  if (!o && !i) {
    e.issues.length ||
      t.issues.push({
        code: `invalid_type`,
        expected: `nonoptional`,
        input: void 0,
        path: [n],
      });
    return;
  }
  e.value === void 0 ? o && (t.value[n] = void 0) : (t.value[n] = e.value);
}
function Ms(e) {
  let t = Object.keys(e.shape);
  for (let n of t)
    if (!e.shape?.[n]?._zod?.traits?.has(`$ZodType`))
      throw Error(`Invalid element at key "${n}": expected a Zod schema`);
  let n = Ma(e.shape);
  return {
    ...e,
    keys: t,
    keySet: new Set(t),
    numKeys: t.length,
    optionalKeys: new Set(n),
  };
}
function Ns(e, t, n, r, i, a) {
  let o = [],
    s = i.keySet,
    c = i.catchall._zod,
    l = c.def.type,
    u = c.optin === `optional`,
    d = c.optout === `optional`;
  for (let i in t) {
    if (i === `__proto__` || s.has(i)) continue;
    if (l === `never`) {
      o.push(i);
      continue;
    }
    let a = c.run({ value: t[i], issues: [] }, r);
    a instanceof Promise
      ? e.push(a.then((e) => js(e, n, i, t, u, d)))
      : js(a, n, i, t, u, d);
  }
  return (
    o.length &&
      n.issues.push({ code: `unrecognized_keys`, keys: o, input: t, inst: a }),
    e.length ? Promise.all(e).then(() => n) : n
  );
}
var Ps = F(`$ZodObject`, (e, t) => {
    if (($o.init(e, t), !Object.getOwnPropertyDescriptor(t, `shape`)?.get)) {
      let e = t.shape;
      Object.defineProperty(t, "shape", {
        get: () => {
          let n = { ...e };
          return (Object.defineProperty(t, "shape", { value: n }), n);
        },
      });
    }
    let n = ga(() => Ms(t));
    I(e._zod, `propValues`, () => {
      let e = t.shape,
        n = {};
      for (let t in e) {
        let r = e[t]._zod;
        if (r.values) {
          n[t] ?? (n[t] = new Set());
          for (let e of r.values) n[t].add(e);
        }
      }
      return n;
    });
    let r = Ta,
      i = t.catchall,
      a;
    e._zod.parse = (t, o) => {
      a ??= n.value;
      let s = t.value;
      if (!r(s))
        return (
          t.issues.push({
            expected: `object`,
            code: `invalid_type`,
            input: s,
            inst: e,
          }),
          t
        );
      t.value = {};
      let c = [],
        l = a.shape;
      for (let e of a.keys) {
        let n = l[e],
          r = n._zod.optin === `optional`,
          i = n._zod.optout === `optional`,
          a = n._zod.run({ value: s[e], issues: [] }, o);
        a instanceof Promise
          ? c.push(a.then((n) => js(n, t, e, s, r, i)))
          : js(a, t, e, s, r, i);
      }
      return i
        ? Ns(c, s, t, o, n.value, e)
        : c.length
          ? Promise.all(c).then(() => t)
          : t;
    };
  }),
  Fs = F(`$ZodObjectJIT`, (e, t) => {
    Ps.init(e, t);
    let n = e._zod.parse,
      r = ga(() => Ms(t)),
      i = (e) => {
        let t = new Zo([`shape`, `payload`, `ctx`]),
          n = r.value,
          i = (e) => {
            let t = Sa(e);
            return `shape[${t}]._zod.run({ value: input[${t}], issues: [] }, ctx)`;
          };
        t.write(`const input = payload.value;`);
        let a = Object.create(null),
          o = 0;
        for (let e of n.keys) a[e] = `key_${o++}`;
        t.write(`const newResult = {};`);
        for (let r of n.keys) {
          let n = a[r],
            o = Sa(r),
            s = e[r],
            c = s?._zod?.optin === `optional`,
            l = s?._zod?.optout === `optional`;
          (t.write(`const ${n} = ${i(r)};`),
            c && l
              ? t.write(`
        if (${n}.issues.length) {
          if (${o} in input) {
            payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${o}, ...iss.path] : [${o}]
            })));
          }
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `)
              : c
                ? t.write(`
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${o}, ...iss.path] : [${o}]
          })));
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `)
                : t.write(`
        const ${n}_present = ${o} in input;
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${o}, ...iss.path] : [${o}]
          })));
        }
        if (!${n}_present && !${n}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${o}]
          });
        }

        if (${n}_present) {
          if (${n}.value === undefined) {
            newResult[${o}] = undefined;
          } else {
            newResult[${o}] = ${n}.value;
          }
        }

      `));
        }
        (t.write(`payload.value = newResult;`), t.write(`return payload;`));
        let s = t.compile();
        return (t, n) => s(e, t, n);
      },
      a,
      o = Ta,
      s = !fa.jitless,
      c = s && Ea.value,
      l = t.catchall,
      u;
    e._zod.parse = (d, f) => {
      u ??= r.value;
      let p = d.value;
      return o(p)
        ? s && c && f?.async === !1 && f.jitless !== !0
          ? ((a ||= i(t.shape)), (d = a(d, f)), l ? Ns([], p, d, f, u, e) : d)
          : n(d, f)
        : (d.issues.push({
            expected: `object`,
            code: `invalid_type`,
            input: p,
            inst: e,
          }),
          d);
    };
  });
function Is(e, t, n, r) {
  for (let n of e) if (n.issues.length === 0) return ((t.value = n.value), t);
  let i = e.filter((e) => !Ba(e));
  return i.length === 1
    ? ((t.value = i[0].value), i[0])
    : (t.issues.push({
        code: `invalid_union`,
        input: t.value,
        inst: n,
        errors: e.map((e) => e.issues.map((e) => Wa(e, r, pa()))),
      }),
      t);
}
var Ls = F(`$ZodUnion`, (e, t) => {
    ($o.init(e, t),
      I(e._zod, `optin`, () =>
        t.options.some((e) => e._zod.optin === `optional`)
          ? `optional`
          : void 0,
      ),
      I(e._zod, `optout`, () =>
        t.options.some((e) => e._zod.optout === `optional`)
          ? `optional`
          : void 0,
      ),
      I(e._zod, `values`, () => {
        if (t.options.every((e) => e._zod.values))
          return new Set(t.options.flatMap((e) => Array.from(e._zod.values)));
      }),
      I(e._zod, `pattern`, () => {
        if (t.options.every((e) => e._zod.pattern)) {
          let e = t.options.map((e) => e._zod.pattern);
          return RegExp(`^(${e.map((e) => va(e.source)).join(`|`)})$`);
        }
      }));
    let n = t.options.length === 1 ? t.options[0]._zod.run : null;
    e._zod.parse = (r, i) => {
      if (n) return n(r, i);
      let a = !1,
        o = [];
      for (let e of t.options) {
        let t = e._zod.run({ value: r.value, issues: [] }, i);
        if (t instanceof Promise) (o.push(t), (a = !0));
        else {
          if (t.issues.length === 0) return t;
          o.push(t);
        }
      }
      return a ? Promise.all(o).then((t) => Is(t, r, e, i)) : Is(o, r, e, i);
    };
  }),
  Rs = F(`$ZodIntersection`, (e, t) => {
    ($o.init(e, t),
      (e._zod.parse = (e, n) => {
        let r = e.value,
          i = t.left._zod.run({ value: r, issues: [] }, n),
          a = t.right._zod.run({ value: r, issues: [] }, n);
        return i instanceof Promise || a instanceof Promise
          ? Promise.all([i, a]).then(([t, n]) => Bs(e, t, n))
          : Bs(e, i, a);
      }));
  });
function zs(e, t) {
  if (e === t || (e instanceof Date && t instanceof Date && +e == +t))
    return { valid: !0, data: e };
  if (Da(e) && Da(t)) {
    let n = Object.keys(t),
      r = Object.keys(e).filter((e) => n.indexOf(e) !== -1),
      i = { ...e, ...t };
    for (let n of r) {
      let r = zs(e[n], t[n]);
      if (!r.valid)
        return { valid: !1, mergeErrorPath: [n, ...r.mergeErrorPath] };
      i[n] = r.data;
    }
    return { valid: !0, data: i };
  }
  if (Array.isArray(e) && Array.isArray(t)) {
    if (e.length !== t.length) return { valid: !1, mergeErrorPath: [] };
    let n = [];
    for (let r = 0; r < e.length; r++) {
      let i = e[r],
        a = t[r],
        o = zs(i, a);
      if (!o.valid)
        return { valid: !1, mergeErrorPath: [r, ...o.mergeErrorPath] };
      n.push(o.data);
    }
    return { valid: !0, data: n };
  }
  return { valid: !1, mergeErrorPath: [] };
}
function Bs(e, t, n) {
  let r = new Map(),
    i;
  for (let n of t.issues)
    if (n.code === `unrecognized_keys`) {
      i ??= n;
      for (let e of n.keys) (r.has(e) || r.set(e, {}), (r.get(e).l = !0));
    } else e.issues.push(n);
  for (let t of n.issues)
    if (t.code === `unrecognized_keys`)
      for (let e of t.keys) (r.has(e) || r.set(e, {}), (r.get(e).r = !0));
    else e.issues.push(t);
  let a = [...r].filter(([, e]) => e.l && e.r).map(([e]) => e);
  if ((a.length && i && e.issues.push({ ...i, keys: a }), Ba(e))) return e;
  let o = zs(t.value, n.value);
  if (!o.valid)
    throw Error(
      `Unmergable intersection. Error path: ${JSON.stringify(o.mergeErrorPath)}`,
    );
  return ((e.value = o.data), e);
}
var Vs = F(`$ZodEnum`, (e, t) => {
    $o.init(e, t);
    let n = ma(t.entries),
      r = new Set(n);
    ((e._zod.values = r),
      (e._zod.pattern = RegExp(
        `^(${n
          .filter((e) => ka.has(typeof e))
          .map((e) => (typeof e == `string` ? Aa(e) : e.toString()))
          .join(`|`)})$`,
      )),
      (e._zod.parse = (t, i) => {
        let a = t.value;
        return (
          r.has(a) ||
            t.issues.push({
              code: `invalid_value`,
              values: n,
              input: a,
              inst: e,
            }),
          t
        );
      }));
  }),
  Hs = F(`$ZodTransform`, (e, t) => {
    ($o.init(e, t),
      (e._zod.optin = `optional`),
      (e._zod.parse = (n, r) => {
        if (r.direction === `backward`) throw new da(e.constructor.name);
        let i = t.transform(n.value, n);
        if (r.async)
          return (i instanceof Promise ? i : Promise.resolve(i)).then(
            (e) => ((n.value = e), (n.fallback = !0), n),
          );
        if (i instanceof Promise) throw new ua();
        return ((n.value = i), (n.fallback = !0), n);
      }));
  });
function Us(e, t) {
  return t === void 0 && (e.issues.length || e.fallback)
    ? { issues: [], value: void 0 }
    : e;
}
var Ws = F(`$ZodOptional`, (e, t) => {
    ($o.init(e, t),
      (e._zod.optin = `optional`),
      (e._zod.optout = `optional`),
      I(e._zod, `values`, () =>
        t.innerType._zod.values
          ? new Set([...t.innerType._zod.values, void 0])
          : void 0,
      ),
      I(e._zod, `pattern`, () => {
        let e = t.innerType._zod.pattern;
        return e ? RegExp(`^(${va(e.source)})?$`) : void 0;
      }),
      (e._zod.parse = (e, n) => {
        if (t.innerType._zod.optin === `optional`) {
          let r = e.value,
            i = t.innerType._zod.run(e, n);
          return i instanceof Promise ? i.then((e) => Us(e, r)) : Us(i, r);
        }
        return e.value === void 0 ? e : t.innerType._zod.run(e, n);
      }));
  }),
  Gs = F(`$ZodExactOptional`, (e, t) => {
    (Ws.init(e, t),
      I(e._zod, `values`, () => t.innerType._zod.values),
      I(e._zod, `pattern`, () => t.innerType._zod.pattern),
      (e._zod.parse = (e, n) => t.innerType._zod.run(e, n)));
  }),
  Ks = F(`$ZodNullable`, (e, t) => {
    ($o.init(e, t),
      I(e._zod, `optin`, () => t.innerType._zod.optin),
      I(e._zod, `optout`, () => t.innerType._zod.optout),
      I(e._zod, `pattern`, () => {
        let e = t.innerType._zod.pattern;
        return e ? RegExp(`^(${va(e.source)}|null)$`) : void 0;
      }),
      I(e._zod, `values`, () =>
        t.innerType._zod.values
          ? new Set([...t.innerType._zod.values, null])
          : void 0,
      ),
      (e._zod.parse = (e, n) =>
        e.value === null ? e : t.innerType._zod.run(e, n)));
  }),
  qs = F(`$ZodDefault`, (e, t) => {
    ($o.init(e, t),
      (e._zod.optin = `optional`),
      I(e._zod, `values`, () => t.innerType._zod.values),
      (e._zod.parse = (e, n) => {
        if (n.direction === `backward`) return t.innerType._zod.run(e, n);
        if (e.value === void 0) return ((e.value = t.defaultValue), e);
        let r = t.innerType._zod.run(e, n);
        return r instanceof Promise ? r.then((e) => Js(e, t)) : Js(r, t);
      }));
  });
function Js(e, t) {
  return (e.value === void 0 && (e.value = t.defaultValue), e);
}
var Ys = F(`$ZodPrefault`, (e, t) => {
    ($o.init(e, t),
      (e._zod.optin = `optional`),
      I(e._zod, `values`, () => t.innerType._zod.values),
      (e._zod.parse = (e, n) => (
        n.direction === `backward` ||
          (e.value === void 0 && (e.value = t.defaultValue)),
        t.innerType._zod.run(e, n)
      )));
  }),
  Xs = F(`$ZodNonOptional`, (e, t) => {
    ($o.init(e, t),
      I(e._zod, `values`, () => {
        let e = t.innerType._zod.values;
        return e ? new Set([...e].filter((e) => e !== void 0)) : void 0;
      }),
      (e._zod.parse = (n, r) => {
        let i = t.innerType._zod.run(n, r);
        return i instanceof Promise ? i.then((t) => Zs(t, e)) : Zs(i, e);
      }));
  });
function Zs(e, t) {
  return (
    !e.issues.length &&
      e.value === void 0 &&
      e.issues.push({
        code: `invalid_type`,
        expected: `nonoptional`,
        input: e.value,
        inst: t,
      }),
    e
  );
}
var Qs = F(`$ZodCatch`, (e, t) => {
    ($o.init(e, t),
      (e._zod.optin = `optional`),
      I(e._zod, `optout`, () => t.innerType._zod.optout),
      I(e._zod, `values`, () => t.innerType._zod.values),
      (e._zod.parse = (e, n) => {
        if (n.direction === `backward`) return t.innerType._zod.run(e, n);
        let r = t.innerType._zod.run(e, n);
        return r instanceof Promise
          ? r.then(
              (r) => (
                (e.value = r.value),
                r.issues.length &&
                  ((e.value = t.catchValue({
                    ...e,
                    error: { issues: r.issues.map((e) => Wa(e, n, pa())) },
                    input: e.value,
                  })),
                  (e.issues = []),
                  (e.fallback = !0)),
                e
              ),
            )
          : ((e.value = r.value),
            r.issues.length &&
              ((e.value = t.catchValue({
                ...e,
                error: { issues: r.issues.map((e) => Wa(e, n, pa())) },
                input: e.value,
              })),
              (e.issues = []),
              (e.fallback = !0)),
            e);
      }));
  }),
  $s = F(`$ZodPipe`, (e, t) => {
    ($o.init(e, t),
      I(e._zod, `values`, () => t.in._zod.values),
      I(e._zod, `optin`, () => t.in._zod.optin),
      I(e._zod, `optout`, () => t.out._zod.optout),
      I(e._zod, `propValues`, () => t.in._zod.propValues),
      (e._zod.parse = (e, n) => {
        if (n.direction === `backward`) {
          let r = t.out._zod.run(e, n);
          return r instanceof Promise
            ? r.then((e) => ec(e, t.in, n))
            : ec(r, t.in, n);
        }
        let r = t.in._zod.run(e, n);
        return r instanceof Promise
          ? r.then((e) => ec(e, t.out, n))
          : ec(r, t.out, n);
      }));
  });
function ec(e, t, n) {
  return e.issues.length
    ? ((e.aborted = !0), e)
    : t._zod.run({ value: e.value, issues: e.issues, fallback: e.fallback }, n);
}
var tc = F(`$ZodReadonly`, (e, t) => {
  ($o.init(e, t),
    I(e._zod, `propValues`, () => t.innerType._zod.propValues),
    I(e._zod, `values`, () => t.innerType._zod.values),
    I(e._zod, `optin`, () => t.innerType?._zod?.optin),
    I(e._zod, `optout`, () => t.innerType?._zod?.optout),
    (e._zod.parse = (e, n) => {
      if (n.direction === `backward`) return t.innerType._zod.run(e, n);
      let r = t.innerType._zod.run(e, n);
      return r instanceof Promise ? r.then(nc) : nc(r);
    }));
});
function nc(e) {
  return ((e.value = Object.freeze(e.value)), e);
}
var rc = F(`$ZodCustom`, (e, t) => {
  (zo.init(e, t),
    $o.init(e, t),
    (e._zod.parse = (e, t) => e),
    (e._zod.check = (n) => {
      let r = n.value,
        i = t.fn(r);
      if (i instanceof Promise) return i.then((t) => ic(t, n, r, e));
      ic(i, n, r, e);
    }));
});
function ic(e, t, n, r) {
  if (!e) {
    let e = {
      code: `custom`,
      input: n,
      inst: r,
      path: [...(r._zod.def.path ?? [])],
      continue: !r._zod.def.abort,
    };
    (r._zod.def.params && (e.params = r._zod.def.params), t.issues.push(Ka(e)));
  }
}
var ac,
  oc = class {
    constructor() {
      ((this._map = new WeakMap()), (this._idmap = new Map()));
    }
    add(e, ...t) {
      let n = t[0];
      return (
        this._map.set(e, n),
        n && typeof n == `object` && `id` in n && this._idmap.set(n.id, e),
        this
      );
    }
    clear() {
      return ((this._map = new WeakMap()), (this._idmap = new Map()), this);
    }
    remove(e) {
      let t = this._map.get(e);
      return (
        t && typeof t == `object` && `id` in t && this._idmap.delete(t.id),
        this._map.delete(e),
        this
      );
    }
    get(e) {
      let t = e._zod.parent;
      if (t) {
        let n = { ...(this.get(t) ?? {}) };
        delete n.id;
        let r = { ...n, ...this._map.get(e) };
        return Object.keys(r).length ? r : void 0;
      }
      return this._map.get(e);
    }
    has(e) {
      return this._map.has(e);
    }
  };
function sc() {
  return new oc();
}
(ac = globalThis).__zod_globalRegistry ?? (ac.__zod_globalRegistry = sc());
var cc = globalThis.__zod_globalRegistry;
function lc(e, t) {
  return new e({ type: `string`, ...L(t) });
}
function uc(e, t) {
  return new e({
    type: `string`,
    format: `email`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function dc(e, t) {
  return new e({
    type: `string`,
    format: `guid`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function fc(e, t) {
  return new e({
    type: `string`,
    format: `uuid`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function pc(e, t) {
  return new e({
    type: `string`,
    format: `uuid`,
    check: `string_format`,
    abort: !1,
    version: `v4`,
    ...L(t),
  });
}
function mc(e, t) {
  return new e({
    type: `string`,
    format: `uuid`,
    check: `string_format`,
    abort: !1,
    version: `v6`,
    ...L(t),
  });
}
function hc(e, t) {
  return new e({
    type: `string`,
    format: `uuid`,
    check: `string_format`,
    abort: !1,
    version: `v7`,
    ...L(t),
  });
}
function gc(e, t) {
  return new e({
    type: `string`,
    format: `url`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function _c(e, t) {
  return new e({
    type: `string`,
    format: `emoji`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function vc(e, t) {
  return new e({
    type: `string`,
    format: `nanoid`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function yc(e, t) {
  return new e({
    type: `string`,
    format: `cuid`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function bc(e, t) {
  return new e({
    type: `string`,
    format: `cuid2`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function xc(e, t) {
  return new e({
    type: `string`,
    format: `ulid`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function Sc(e, t) {
  return new e({
    type: `string`,
    format: `xid`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function Cc(e, t) {
  return new e({
    type: `string`,
    format: `ksuid`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function wc(e, t) {
  return new e({
    type: `string`,
    format: `ipv4`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function Tc(e, t) {
  return new e({
    type: `string`,
    format: `ipv6`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function Ec(e, t) {
  return new e({
    type: `string`,
    format: `cidrv4`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function Dc(e, t) {
  return new e({
    type: `string`,
    format: `cidrv6`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function Oc(e, t) {
  return new e({
    type: `string`,
    format: `base64`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function kc(e, t) {
  return new e({
    type: `string`,
    format: `base64url`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function Ac(e, t) {
  return new e({
    type: `string`,
    format: `e164`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function jc(e, t) {
  return new e({
    type: `string`,
    format: `jwt`,
    check: `string_format`,
    abort: !1,
    ...L(t),
  });
}
function Mc(e, t) {
  return new e({
    type: `string`,
    format: `datetime`,
    check: `string_format`,
    offset: !1,
    local: !1,
    precision: null,
    ...L(t),
  });
}
function Nc(e, t) {
  return new e({
    type: `string`,
    format: `date`,
    check: `string_format`,
    ...L(t),
  });
}
function Pc(e, t) {
  return new e({
    type: `string`,
    format: `time`,
    check: `string_format`,
    precision: null,
    ...L(t),
  });
}
function Fc(e, t) {
  return new e({
    type: `string`,
    format: `duration`,
    check: `string_format`,
    ...L(t),
  });
}
function Ic(e) {
  return new e({ type: `unknown` });
}
function Lc(e, t) {
  return new e({ type: `never`, ...L(t) });
}
function Rc(e, t) {
  return new Bo({ check: `max_length`, ...L(t), maximum: e });
}
function zc(e, t) {
  return new Vo({ check: `min_length`, ...L(t), minimum: e });
}
function Bc(e, t) {
  return new Ho({ check: `length_equals`, ...L(t), length: e });
}
function Vc(e, t) {
  return new Wo({
    check: `string_format`,
    format: `regex`,
    ...L(t),
    pattern: e,
  });
}
function Hc(e) {
  return new Go({ check: `string_format`, format: `lowercase`, ...L(e) });
}
function Uc(e) {
  return new Ko({ check: `string_format`, format: `uppercase`, ...L(e) });
}
function Wc(e, t) {
  return new qo({
    check: `string_format`,
    format: `includes`,
    ...L(t),
    includes: e,
  });
}
function Gc(e, t) {
  return new Jo({
    check: `string_format`,
    format: `starts_with`,
    ...L(t),
    prefix: e,
  });
}
function Kc(e, t) {
  return new Yo({
    check: `string_format`,
    format: `ends_with`,
    ...L(t),
    suffix: e,
  });
}
function qc(e) {
  return new Xo({ check: `overwrite`, tx: e });
}
function Jc(e) {
  return qc((t) => t.normalize(e));
}
function Yc() {
  return qc((e) => e.trim());
}
function Xc() {
  return qc((e) => e.toLowerCase());
}
function Zc() {
  return qc((e) => e.toUpperCase());
}
function Qc() {
  return qc((e) => Ca(e));
}
function $c(e, t, n) {
  return new e({ type: `array`, element: t, ...L(n) });
}
function el(e, t, n) {
  return new e({ type: `custom`, check: `custom`, fn: t, ...L(n) });
}
function tl(e, t) {
  let n = nl(
    (t) => (
      (t.addIssue = (e) => {
        if (typeof e == `string`) t.issues.push(Ka(e, t.value, n._zod.def));
        else {
          let r = e;
          (r.fatal && (r.continue = !1),
            (r.code ??= `custom`),
            (r.input ??= t.value),
            (r.inst ??= n),
            (r.continue ??= !n._zod.def.abort),
            t.issues.push(Ka(r)));
        }
      }),
      e(t.value, t)
    ),
    t,
  );
  return n;
}
function nl(e, t) {
  let n = new zo({ check: `custom`, ...L(t) });
  return ((n._zod.check = e), n);
}
function rl(e) {
  let t = e?.target ?? `draft-2020-12`;
  return (
    t === `draft-4` && (t = `draft-04`),
    t === `draft-7` && (t = `draft-07`),
    {
      processors: e.processors ?? {},
      metadataRegistry: e?.metadata ?? cc,
      target: t,
      unrepresentable: e?.unrepresentable ?? `throw`,
      override: e?.override ?? (() => {}),
      io: e?.io ?? `output`,
      counter: 0,
      seen: new Map(),
      cycles: e?.cycles ?? `ref`,
      reused: e?.reused ?? `inline`,
      external: e?.external ?? void 0,
    }
  );
}
function il(e, t, n = { path: [], schemaPath: [] }) {
  var r;
  let i = e._zod.def,
    a = t.seen.get(e);
  if (a)
    return (
      a.count++,
      n.schemaPath.includes(e) && (a.cycle = n.path),
      a.schema
    );
  let o = { schema: {}, count: 1, cycle: void 0, path: n.path };
  t.seen.set(e, o);
  let s = e._zod.toJSONSchema?.();
  if (s) o.schema = s;
  else {
    let r = { ...n, schemaPath: [...n.schemaPath, e], path: n.path };
    if (e._zod.processJSONSchema) e._zod.processJSONSchema(t, o.schema, r);
    else {
      let n = o.schema,
        a = t.processors[i.type];
      if (!a)
        throw Error(
          `[toJSONSchema]: Non-representable type encountered: ${i.type}`,
        );
      a(e, t, n, r);
    }
    let a = e._zod.parent;
    a && ((o.ref ||= a), il(a, t, r), (t.seen.get(a).isParent = !0));
  }
  let c = t.metadataRegistry.get(e);
  return (
    c && Object.assign(o.schema, c),
    t.io === `input` &&
      sl(e) &&
      (delete o.schema.examples, delete o.schema.default),
    t.io === `input` &&
      `_prefault` in o.schema &&
      ((r = o.schema).default ?? (r.default = o.schema._prefault)),
    delete o.schema._prefault,
    t.seen.get(e).schema
  );
}
function al(e, t) {
  let n = e.seen.get(t);
  if (!n) throw Error(`Unprocessed schema. This is a bug in Zod.`);
  let r = new Map();
  for (let t of e.seen.entries()) {
    let n = e.metadataRegistry.get(t[0])?.id;
    if (n) {
      let e = r.get(n);
      if (e && e !== t[0])
        throw Error(
          `Duplicate schema id "${n}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`,
        );
      r.set(n, t[0]);
    }
  }
  let i = (t) => {
      let r = e.target === `draft-2020-12` ? `$defs` : `definitions`;
      if (e.external) {
        let n = e.external.registry.get(t[0])?.id,
          i = e.external.uri ?? ((e) => e);
        if (n) return { ref: i(n) };
        let a = t[1].defId ?? t[1].schema.id ?? `schema${e.counter++}`;
        return (
          (t[1].defId = a),
          { defId: a, ref: `${i(`__shared`)}#/${r}/${a}` }
        );
      }
      if (t[1] === n) return { ref: `#` };
      let i = `#/${r}/`,
        a = t[1].schema.id ?? `__schema${e.counter++}`;
      return { defId: a, ref: i + a };
    },
    a = (e) => {
      if (e[1].schema.$ref) return;
      let t = e[1],
        { ref: n, defId: r } = i(e);
      ((t.def = { ...t.schema }), r && (t.defId = r));
      let a = t.schema;
      for (let e in a) delete a[e];
      a.$ref = n;
    };
  if (e.cycles === `throw`)
    for (let t of e.seen.entries()) {
      let e = t[1];
      if (e.cycle)
        throw Error(`Cycle detected: #/${e.cycle?.join(`/`)}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
    }
  for (let n of e.seen.entries()) {
    let r = n[1];
    if (t === n[0]) {
      a(n);
      continue;
    }
    if (e.external) {
      let r = e.external.registry.get(n[0])?.id;
      if (t !== n[0] && r) {
        a(n);
        continue;
      }
    }
    if (e.metadataRegistry.get(n[0])?.id) {
      a(n);
      continue;
    }
    if (r.cycle) {
      a(n);
      continue;
    }
    if (r.count > 1 && e.reused === `ref`) {
      a(n);
      continue;
    }
  }
}
function ol(e, t) {
  let n = e.seen.get(t);
  if (!n) throw Error(`Unprocessed schema. This is a bug in Zod.`);
  let r = (t) => {
    let n = e.seen.get(t);
    if (n.ref === null) return;
    let i = n.def ?? n.schema,
      a = { ...i },
      o = n.ref;
    if (((n.ref = null), o)) {
      r(o);
      let n = e.seen.get(o),
        s = n.schema;
      if (
        (s.$ref &&
        (e.target === `draft-07` ||
          e.target === `draft-04` ||
          e.target === `openapi-3.0`)
          ? ((i.allOf = i.allOf ?? []), i.allOf.push(s))
          : Object.assign(i, s),
        Object.assign(i, a),
        t._zod.parent === o)
      )
        for (let e in i)
          e !== `$ref` && e !== `allOf` && (e in a || delete i[e]);
      if (s.$ref && n.def)
        for (let e in i)
          e !== `$ref` &&
            e !== `allOf` &&
            e in n.def &&
            JSON.stringify(i[e]) === JSON.stringify(n.def[e]) &&
            delete i[e];
    }
    let s = t._zod.parent;
    if (s && s !== o) {
      r(s);
      let t = e.seen.get(s);
      if (t?.schema.$ref && ((i.$ref = t.schema.$ref), t.def))
        for (let e in i)
          e !== `$ref` &&
            e !== `allOf` &&
            e in t.def &&
            JSON.stringify(i[e]) === JSON.stringify(t.def[e]) &&
            delete i[e];
    }
    e.override({ zodSchema: t, jsonSchema: i, path: n.path ?? [] });
  };
  for (let t of [...e.seen.entries()].reverse()) r(t[0]);
  let i = {};
  if (
    (e.target === `draft-2020-12`
      ? (i.$schema = `https://json-schema.org/draft/2020-12/schema`)
      : e.target === `draft-07`
        ? (i.$schema = `http://json-schema.org/draft-07/schema#`)
        : e.target === `draft-04`
          ? (i.$schema = `http://json-schema.org/draft-04/schema#`)
          : e.target,
    e.external?.uri)
  ) {
    let n = e.external.registry.get(t)?.id;
    if (!n) throw Error("Schema is missing an `id` property");
    i.$id = e.external.uri(n);
  }
  Object.assign(i, n.def ?? n.schema);
  let a = e.metadataRegistry.get(t)?.id;
  a !== void 0 && i.id === a && delete i.id;
  let o = e.external?.defs ?? {};
  for (let t of e.seen.entries()) {
    let e = t[1];
    e.def &&
      e.defId &&
      (e.def.id === e.defId && delete e.def.id, (o[e.defId] = e.def));
  }
  e.external ||
    (Object.keys(o).length > 0 &&
      (e.target === `draft-2020-12` ? (i.$defs = o) : (i.definitions = o)));
  try {
    let n = JSON.parse(JSON.stringify(i));
    return (
      Object.defineProperty(n, "~standard", {
        value: {
          ...t[`~standard`],
          jsonSchema: {
            input: ll(t, `input`, e.processors),
            output: ll(t, `output`, e.processors),
          },
        },
        enumerable: !1,
        writable: !1,
      }),
      n
    );
  } catch {
    throw Error(`Error converting schema to JSON.`);
  }
}
function sl(e, t) {
  let n = t ?? { seen: new Set() };
  if (n.seen.has(e)) return !1;
  n.seen.add(e);
  let r = e._zod.def;
  if (r.type === `transform`) return !0;
  if (r.type === `array`) return sl(r.element, n);
  if (r.type === `set`) return sl(r.valueType, n);
  if (r.type === `lazy`) return sl(r.getter(), n);
  if (
    r.type === `promise` ||
    r.type === `optional` ||
    r.type === `nonoptional` ||
    r.type === `nullable` ||
    r.type === `readonly` ||
    r.type === "default" ||
    r.type === `prefault`
  )
    return sl(r.innerType, n);
  if (r.type === `intersection`) return sl(r.left, n) || sl(r.right, n);
  if (r.type === `record` || r.type === `map`)
    return sl(r.keyType, n) || sl(r.valueType, n);
  if (r.type === `pipe`)
    return e._zod.traits.has(`$ZodCodec`) ? !0 : sl(r.in, n) || sl(r.out, n);
  if (r.type === `object`) {
    for (let e in r.shape) if (sl(r.shape[e], n)) return !0;
    return !1;
  }
  if (r.type === `union`) {
    for (let e of r.options) if (sl(e, n)) return !0;
    return !1;
  }
  if (r.type === `tuple`) {
    for (let e of r.items) if (sl(e, n)) return !0;
    return !!(r.rest && sl(r.rest, n));
  }
  return !1;
}
var cl =
    (e, t = {}) =>
    (n) => {
      let r = rl({ ...n, processors: t });
      return (il(e, r), al(r, e), ol(r, e));
    },
  ll =
    (e, t, n = {}) =>
    (r) => {
      let { libraryOptions: i, target: a } = r ?? {},
        o = rl({ ...(i ?? {}), target: a, io: t, processors: n });
      return (il(e, o), al(o, e), ol(o, e));
    },
  ul = {
    guid: `uuid`,
    url: `uri`,
    datetime: `date-time`,
    json_string: `json-string`,
    regex: ``,
  },
  dl = (e, t, n, r) => {
    let i = n;
    i.type = `string`;
    let {
      minimum: a,
      maximum: o,
      format: s,
      patterns: c,
      contentEncoding: l,
    } = e._zod.bag;
    if (
      (typeof a == `number` && (i.minLength = a),
      typeof o == `number` && (i.maxLength = o),
      s &&
        ((i.format = ul[s] ?? s),
        i.format === `` && delete i.format,
        s === `time` && delete i.format),
      l && (i.contentEncoding = l),
      c && c.size > 0)
    ) {
      let e = [...c];
      e.length === 1
        ? (i.pattern = e[0].source)
        : e.length > 1 &&
          (i.allOf = [
            ...e.map((e) => ({
              ...(t.target === `draft-07` ||
              t.target === `draft-04` ||
              t.target === `openapi-3.0`
                ? { type: `string` }
                : {}),
              pattern: e.source,
            })),
          ]);
    }
  },
  fl = (e, t, n, r) => {
    n.not = {};
  },
  pl = (e, t, n, r) => {
    let i = e._zod.def,
      a = ma(i.entries);
    (a.every((e) => typeof e == `number`) && (n.type = `number`),
      a.every((e) => typeof e == `string`) && (n.type = `string`),
      (n.enum = a));
  },
  ml = (e, t, n, r) => {
    if (t.unrepresentable === `throw`)
      throw Error(`Custom types cannot be represented in JSON Schema`);
  },
  hl = (e, t, n, r) => {
    if (t.unrepresentable === `throw`)
      throw Error(`Transforms cannot be represented in JSON Schema`);
  },
  gl = (e, t, n, r) => {
    let i = n,
      a = e._zod.def,
      { minimum: o, maximum: s } = e._zod.bag;
    (typeof o == `number` && (i.minItems = o),
      typeof s == `number` && (i.maxItems = s),
      (i.type = `array`),
      (i.items = il(a.element, t, { ...r, path: [...r.path, `items`] })));
  },
  _l = (e, t, n, r) => {
    let i = n,
      a = e._zod.def;
    ((i.type = `object`), (i.properties = {}));
    let o = a.shape;
    for (let e in o)
      i.properties[e] = il(o[e], t, {
        ...r,
        path: [...r.path, `properties`, e],
      });
    let s = new Set(Object.keys(o)),
      c = new Set(
        [...s].filter((e) => {
          let n = a.shape[e]._zod;
          return t.io === `input` ? n.optin === void 0 : n.optout === void 0;
        }),
      );
    (c.size > 0 && (i.required = Array.from(c)),
      a.catchall?._zod.def.type === `never`
        ? (i.additionalProperties = !1)
        : a.catchall
          ? a.catchall &&
            (i.additionalProperties = il(a.catchall, t, {
              ...r,
              path: [...r.path, `additionalProperties`],
            }))
          : t.io === `output` && (i.additionalProperties = !1));
  },
  vl = (e, t, n, r) => {
    let i = e._zod.def,
      a = i.inclusive === !1,
      o = i.options.map((e, n) =>
        il(e, t, { ...r, path: [...r.path, a ? `oneOf` : `anyOf`, n] }),
      );
    a ? (n.oneOf = o) : (n.anyOf = o);
  },
  yl = (e, t, n, r) => {
    let i = e._zod.def,
      a = il(i.left, t, { ...r, path: [...r.path, `allOf`, 0] }),
      o = il(i.right, t, { ...r, path: [...r.path, `allOf`, 1] }),
      s = (e) => `allOf` in e && Object.keys(e).length === 1;
    n.allOf = [...(s(a) ? a.allOf : [a]), ...(s(o) ? o.allOf : [o])];
  },
  bl = (e, t, n, r) => {
    let i = e._zod.def,
      a = il(i.innerType, t, r),
      o = t.seen.get(e);
    t.target === `openapi-3.0`
      ? ((o.ref = i.innerType), (n.nullable = !0))
      : (n.anyOf = [a, { type: `null` }]);
  },
  xl = (e, t, n, r) => {
    let i = e._zod.def;
    il(i.innerType, t, r);
    let a = t.seen.get(e);
    a.ref = i.innerType;
  },
  Sl = (e, t, n, r) => {
    let i = e._zod.def;
    il(i.innerType, t, r);
    let a = t.seen.get(e);
    ((a.ref = i.innerType),
      (n.default = JSON.parse(JSON.stringify(i.defaultValue))));
  },
  Cl = (e, t, n, r) => {
    let i = e._zod.def;
    il(i.innerType, t, r);
    let a = t.seen.get(e);
    ((a.ref = i.innerType),
      t.io === `input` &&
        (n._prefault = JSON.parse(JSON.stringify(i.defaultValue))));
  },
  wl = (e, t, n, r) => {
    let i = e._zod.def;
    il(i.innerType, t, r);
    let a = t.seen.get(e);
    a.ref = i.innerType;
    let o;
    try {
      o = i.catchValue(void 0);
    } catch {
      throw Error(`Dynamic catch values are not supported in JSON Schema`);
    }
    n.default = o;
  },
  Tl = (e, t, n, r) => {
    let i = e._zod.def,
      a = i.in._zod.traits.has(`$ZodTransform`),
      o = t.io === `input` ? (a ? i.out : i.in) : i.out;
    il(o, t, r);
    let s = t.seen.get(e);
    s.ref = o;
  },
  El = (e, t, n, r) => {
    let i = e._zod.def;
    il(i.innerType, t, r);
    let a = t.seen.get(e);
    ((a.ref = i.innerType), (n.readOnly = !0));
  },
  Dl = (e, t, n, r) => {
    let i = e._zod.def;
    il(i.innerType, t, r);
    let a = t.seen.get(e);
    a.ref = i.innerType;
  },
  Ol = F(`ZodISODateTime`, (e, t) => {
    (fs.init(e, t), K.init(e, t));
  });
function kl(e) {
  return Mc(Ol, e);
}
var Al = F(`ZodISODate`, (e, t) => {
  (ps.init(e, t), K.init(e, t));
});
function jl(e) {
  return Nc(Al, e);
}
var Ml = F(`ZodISOTime`, (e, t) => {
  (ms.init(e, t), K.init(e, t));
});
function Nl(e) {
  return Pc(Ml, e);
}
var Pl = F(`ZodISODuration`, (e, t) => {
  (hs.init(e, t), K.init(e, t));
});
function Fl(e) {
  return Fc(Pl, e);
}
var Il = F(
    `ZodError`,
    (e, t) => {
      (Ja.init(e, t),
        (e.name = `ZodError`),
        Object.defineProperties(e, {
          format: { value: (t) => Za(e, t) },
          flatten: { value: (t) => Xa(e, t) },
          addIssue: {
            value: (t) => {
              (e.issues.push(t), (e.message = JSON.stringify(e.issues, ha, 2)));
            },
          },
          addIssues: {
            value: (t) => {
              (e.issues.push(...t),
                (e.message = JSON.stringify(e.issues, ha, 2)));
            },
          },
          isEmpty: {
            get() {
              return e.issues.length === 0;
            },
          },
        }));
    },
    { Parent: Error },
  ),
  Ll = Qa(Il),
  Rl = $a(Il),
  zl = eo(Il),
  Bl = no(Il),
  Vl = io(Il),
  Hl = ao(Il),
  Ul = oo(Il),
  V = so(Il),
  H = co(Il),
  U = lo(Il),
  W = uo(Il),
  G = fo(Il),
  Wl = new WeakMap();
function Gl(e, t, n) {
  let r = Object.getPrototypeOf(e),
    i = Wl.get(r);
  if ((i || ((i = new Set()), Wl.set(r, i)), !i.has(t))) {
    i.add(t);
    for (let e in n) {
      let t = n[e];
      Object.defineProperty(r, e, {
        configurable: !0,
        enumerable: !1,
        get() {
          let n = t.bind(this);
          return (
            Object.defineProperty(this, e, {
              configurable: !0,
              writable: !0,
              enumerable: !0,
              value: n,
            }),
            n
          );
        },
        set(t) {
          Object.defineProperty(this, e, {
            configurable: !0,
            writable: !0,
            enumerable: !0,
            value: t,
          });
        },
      });
    }
  }
}
var Kl = F(
    `ZodType`,
    (e, t) => (
      $o.init(e, t),
      Object.assign(e[`~standard`], {
        jsonSchema: { input: ll(e, `input`), output: ll(e, `output`) },
      }),
      (e.toJSONSchema = cl(e, {})),
      (e.def = t),
      (e.type = t.type),
      Object.defineProperty(e, "_def", { value: t }),
      (e.parse = (t, n) => Ll(e, t, n, { callee: e.parse })),
      (e.safeParse = (t, n) => zl(e, t, n)),
      (e.parseAsync = async (t, n) => Rl(e, t, n, { callee: e.parseAsync })),
      (e.safeParseAsync = async (t, n) => Bl(e, t, n)),
      (e.spa = e.safeParseAsync),
      (e.encode = (t, n) => Vl(e, t, n)),
      (e.decode = (t, n) => Hl(e, t, n)),
      (e.encodeAsync = async (t, n) => Ul(e, t, n)),
      (e.decodeAsync = async (t, n) => V(e, t, n)),
      (e.safeEncode = (t, n) => H(e, t, n)),
      (e.safeDecode = (t, n) => U(e, t, n)),
      (e.safeEncodeAsync = async (t, n) => W(e, t, n)),
      (e.safeDecodeAsync = async (t, n) => G(e, t, n)),
      Gl(e, `ZodType`, {
        check(...e) {
          let t = this.def;
          return this.clone(
            xa(t, {
              checks: [
                ...(t.checks ?? []),
                ...e.map((e) =>
                  typeof e == `function`
                    ? {
                        _zod: {
                          check: e,
                          def: { check: `custom` },
                          onattach: [],
                        },
                      }
                    : e,
                ),
              ],
            }),
            { parent: !0 },
          );
        },
        with(...e) {
          return this.check(...e);
        },
        clone(e, t) {
          return ja(this, e, t);
        },
        brand() {
          return this;
        },
        register(e, t) {
          return (e.add(this, t), this);
        },
        refine(e, t) {
          return this.check(Yu(e, t));
        },
        superRefine(e, t) {
          return this.check(Xu(e, t));
        },
        overwrite(e) {
          return this.check(qc(e));
        },
        optional() {
          return Mu(this);
        },
        exactOptional() {
          return Pu(this);
        },
        nullable() {
          return Iu(this);
        },
        nullish() {
          return Mu(Iu(this));
        },
        nonoptional(e) {
          return Hu(this, e);
        },
        array() {
          return bu(this);
        },
        or(e) {
          return wu([this, e]);
        },
        and(e) {
          return Eu(this, e);
        },
        transform(e) {
          return Ku(this, Au(e));
        },
        default(e) {
          return Ru(this, e);
        },
        prefault(e) {
          return Bu(this, e);
        },
        catch(e) {
          return Wu(this, e);
        },
        pipe(e) {
          return Ku(this, e);
        },
        readonly() {
          return Ju(this);
        },
        describe(e) {
          let t = this.clone();
          return (cc.add(t, { description: e }), t);
        },
        meta(...e) {
          if (e.length === 0) return cc.get(this);
          let t = this.clone();
          return (cc.add(t, e[0]), t);
        },
        isOptional() {
          return this.safeParse(void 0).success;
        },
        isNullable() {
          return this.safeParse(null).success;
        },
        apply(e) {
          return e(this);
        },
      }),
      Object.defineProperty(e, "description", {
        get() {
          return cc.get(e)?.description;
        },
        configurable: !0,
      }),
      e
    ),
  ),
  ql = F(`_ZodString`, (e, t) => {
    (es.init(e, t),
      Kl.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => dl(e, t, n, r)));
    let n = e._zod.bag;
    ((e.format = n.format ?? null),
      (e.minLength = n.minimum ?? null),
      (e.maxLength = n.maximum ?? null),
      Gl(e, `_ZodString`, {
        regex(...e) {
          return this.check(Vc(...e));
        },
        includes(...e) {
          return this.check(Wc(...e));
        },
        startsWith(...e) {
          return this.check(Gc(...e));
        },
        endsWith(...e) {
          return this.check(Kc(...e));
        },
        min(...e) {
          return this.check(zc(...e));
        },
        max(...e) {
          return this.check(Rc(...e));
        },
        length(...e) {
          return this.check(Bc(...e));
        },
        nonempty(...e) {
          return this.check(zc(1, ...e));
        },
        lowercase(e) {
          return this.check(Hc(e));
        },
        uppercase(e) {
          return this.check(Uc(e));
        },
        trim() {
          return this.check(Yc());
        },
        normalize(...e) {
          return this.check(Jc(...e));
        },
        toLowerCase() {
          return this.check(Xc());
        },
        toUpperCase() {
          return this.check(Zc());
        },
        slugify() {
          return this.check(Qc());
        },
      }));
  }),
  Jl = F(`ZodString`, (e, t) => {
    (es.init(e, t),
      ql.init(e, t),
      (e.email = (t) => e.check(uc(Xl, t))),
      (e.url = (t) => e.check(gc($l, t))),
      (e.jwt = (t) => e.check(jc(mu, t))),
      (e.emoji = (t) => e.check(_c(eu, t))),
      (e.guid = (t) => e.check(dc(Zl, t))),
      (e.uuid = (t) => e.check(fc(Ql, t))),
      (e.uuidv4 = (t) => e.check(pc(Ql, t))),
      (e.uuidv6 = (t) => e.check(mc(Ql, t))),
      (e.uuidv7 = (t) => e.check(hc(Ql, t))),
      (e.nanoid = (t) => e.check(vc(tu, t))),
      (e.guid = (t) => e.check(dc(Zl, t))),
      (e.cuid = (t) => e.check(yc(nu, t))),
      (e.cuid2 = (t) => e.check(bc(ru, t))),
      (e.ulid = (t) => e.check(xc(iu, t))),
      (e.base64 = (t) => e.check(Oc(du, t))),
      (e.base64url = (t) => e.check(kc(fu, t))),
      (e.xid = (t) => e.check(Sc(au, t))),
      (e.ksuid = (t) => e.check(Cc(ou, t))),
      (e.ipv4 = (t) => e.check(wc(su, t))),
      (e.ipv6 = (t) => e.check(Tc(cu, t))),
      (e.cidrv4 = (t) => e.check(Ec(lu, t))),
      (e.cidrv6 = (t) => e.check(Dc(uu, t))),
      (e.e164 = (t) => e.check(Ac(pu, t))),
      (e.datetime = (t) => e.check(kl(t))),
      (e.date = (t) => e.check(jl(t))),
      (e.time = (t) => e.check(Nl(t))),
      (e.duration = (t) => e.check(Fl(t))));
  });
function Yl(e) {
  return lc(Jl, e);
}
var K = F(`ZodStringFormat`, (e, t) => {
    (B.init(e, t), ql.init(e, t));
  }),
  Xl = F(`ZodEmail`, (e, t) => {
    (rs.init(e, t), K.init(e, t));
  }),
  Zl = F(`ZodGUID`, (e, t) => {
    (ts.init(e, t), K.init(e, t));
  }),
  Ql = F(`ZodUUID`, (e, t) => {
    (ns.init(e, t), K.init(e, t));
  }),
  $l = F(`ZodURL`, (e, t) => {
    (is.init(e, t), K.init(e, t));
  }),
  eu = F(`ZodEmoji`, (e, t) => {
    (as.init(e, t), K.init(e, t));
  }),
  tu = F(`ZodNanoID`, (e, t) => {
    (os.init(e, t), K.init(e, t));
  }),
  nu = F(`ZodCUID`, (e, t) => {
    (ss.init(e, t), K.init(e, t));
  }),
  ru = F(`ZodCUID2`, (e, t) => {
    (cs.init(e, t), K.init(e, t));
  }),
  iu = F(`ZodULID`, (e, t) => {
    (ls.init(e, t), K.init(e, t));
  }),
  au = F(`ZodXID`, (e, t) => {
    (us.init(e, t), K.init(e, t));
  }),
  ou = F(`ZodKSUID`, (e, t) => {
    (ds.init(e, t), K.init(e, t));
  }),
  su = F(`ZodIPv4`, (e, t) => {
    (gs.init(e, t), K.init(e, t));
  }),
  cu = F(`ZodIPv6`, (e, t) => {
    (_s.init(e, t), K.init(e, t));
  }),
  lu = F(`ZodCIDRv4`, (e, t) => {
    (vs.init(e, t), K.init(e, t));
  }),
  uu = F(`ZodCIDRv6`, (e, t) => {
    (ys.init(e, t), K.init(e, t));
  }),
  du = F(`ZodBase64`, (e, t) => {
    (xs.init(e, t), K.init(e, t));
  }),
  fu = F(`ZodBase64URL`, (e, t) => {
    (Cs.init(e, t), K.init(e, t));
  }),
  pu = F(`ZodE164`, (e, t) => {
    (ws.init(e, t), K.init(e, t));
  }),
  mu = F(`ZodJWT`, (e, t) => {
    (Es.init(e, t), K.init(e, t));
  }),
  hu = F(`ZodUnknown`, (e, t) => {
    (Ds.init(e, t),
      Kl.init(e, t),
      (e._zod.processJSONSchema = (e, t, n) => void 0));
  });
function gu() {
  return Ic(hu);
}
var _u = F(`ZodNever`, (e, t) => {
  (Os.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => fl(e, t, n, r)));
});
function vu(e) {
  return Lc(_u, e);
}
var yu = F(`ZodArray`, (e, t) => {
  (As.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => gl(e, t, n, r)),
    (e.element = t.element),
    Gl(e, `ZodArray`, {
      min(e, t) {
        return this.check(zc(e, t));
      },
      nonempty(e) {
        return this.check(zc(1, e));
      },
      max(e, t) {
        return this.check(Rc(e, t));
      },
      length(e, t) {
        return this.check(Bc(e, t));
      },
      unwrap() {
        return this.element;
      },
    }));
});
function bu(e, t) {
  return $c(yu, e, t);
}
var xu = F(`ZodObject`, (e, t) => {
  (Fs.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => _l(e, t, n, r)),
    I(e, `shape`, () => t.shape),
    Gl(e, `ZodObject`, {
      keyof() {
        return Ou(Object.keys(this._zod.def.shape));
      },
      catchall(e) {
        return this.clone({ ...this._zod.def, catchall: e });
      },
      passthrough() {
        return this.clone({ ...this._zod.def, catchall: gu() });
      },
      loose() {
        return this.clone({ ...this._zod.def, catchall: gu() });
      },
      strict() {
        return this.clone({ ...this._zod.def, catchall: vu() });
      },
      strip() {
        return this.clone({ ...this._zod.def, catchall: void 0 });
      },
      extend(e) {
        return Fa(this, e);
      },
      safeExtend(e) {
        return Ia(this, e);
      },
      merge(e) {
        return La(this, e);
      },
      pick(e) {
        return Na(this, e);
      },
      omit(e) {
        return Pa(this, e);
      },
      partial(...e) {
        return Ra(ju, this, e[0]);
      },
      required(...e) {
        return za(Vu, this, e[0]);
      },
    }));
});
function Su(e, t) {
  return new xu({ type: `object`, shape: e ?? {}, ...L(t) });
}
var Cu = F(`ZodUnion`, (e, t) => {
  (Ls.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => vl(e, t, n, r)),
    (e.options = t.options));
});
function wu(e, t) {
  return new Cu({ type: `union`, options: e, ...L(t) });
}
var Tu = F(`ZodIntersection`, (e, t) => {
  (Rs.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => yl(e, t, n, r)));
});
function Eu(e, t) {
  return new Tu({ type: `intersection`, left: e, right: t });
}
var Du = F(`ZodEnum`, (e, t) => {
  (Vs.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => pl(e, t, n, r)),
    (e.enum = t.entries),
    (e.options = Object.values(t.entries)));
  let n = new Set(Object.keys(t.entries));
  ((e.extract = (e, r) => {
    let i = {};
    for (let r of e)
      if (n.has(r)) i[r] = t.entries[r];
      else throw Error(`Key ${r} not found in enum`);
    return new Du({ ...t, checks: [], ...L(r), entries: i });
  }),
    (e.exclude = (e, r) => {
      let i = { ...t.entries };
      for (let t of e)
        if (n.has(t)) delete i[t];
        else throw Error(`Key ${t} not found in enum`);
      return new Du({ ...t, checks: [], ...L(r), entries: i });
    }));
});
function Ou(e, t) {
  return new Du({
    type: `enum`,
    entries: Array.isArray(e) ? Object.fromEntries(e.map((e) => [e, e])) : e,
    ...L(t),
  });
}
var ku = F(`ZodTransform`, (e, t) => {
  (Hs.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => hl(e, t, n, r)),
    (e._zod.parse = (n, r) => {
      if (r.direction === `backward`) throw new da(e.constructor.name);
      n.addIssue = (r) => {
        if (typeof r == `string`) n.issues.push(Ka(r, n.value, t));
        else {
          let t = r;
          (t.fatal && (t.continue = !1),
            (t.code ??= `custom`),
            (t.input ??= n.value),
            (t.inst ??= e),
            n.issues.push(Ka(t)));
        }
      };
      let i = t.transform(n.value, n);
      return i instanceof Promise
        ? i.then((e) => ((n.value = e), (n.fallback = !0), n))
        : ((n.value = i), (n.fallback = !0), n);
    }));
});
function Au(e) {
  return new ku({ type: `transform`, transform: e });
}
var ju = F(`ZodOptional`, (e, t) => {
  (Ws.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => Dl(e, t, n, r)),
    (e.unwrap = () => e._zod.def.innerType));
});
function Mu(e) {
  return new ju({ type: `optional`, innerType: e });
}
var Nu = F(`ZodExactOptional`, (e, t) => {
  (Gs.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => Dl(e, t, n, r)),
    (e.unwrap = () => e._zod.def.innerType));
});
function Pu(e) {
  return new Nu({ type: `optional`, innerType: e });
}
var Fu = F(`ZodNullable`, (e, t) => {
  (Ks.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => bl(e, t, n, r)),
    (e.unwrap = () => e._zod.def.innerType));
});
function Iu(e) {
  return new Fu({ type: `nullable`, innerType: e });
}
var Lu = F(`ZodDefault`, (e, t) => {
  (qs.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => Sl(e, t, n, r)),
    (e.unwrap = () => e._zod.def.innerType),
    (e.removeDefault = e.unwrap));
});
function Ru(e, t) {
  return new Lu({
    type: `default`,
    innerType: e,
    get defaultValue() {
      return typeof t == `function` ? t() : Oa(t);
    },
  });
}
var zu = F(`ZodPrefault`, (e, t) => {
  (Ys.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => Cl(e, t, n, r)),
    (e.unwrap = () => e._zod.def.innerType));
});
function Bu(e, t) {
  return new zu({
    type: `prefault`,
    innerType: e,
    get defaultValue() {
      return typeof t == `function` ? t() : Oa(t);
    },
  });
}
var Vu = F(`ZodNonOptional`, (e, t) => {
  (Xs.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => xl(e, t, n, r)),
    (e.unwrap = () => e._zod.def.innerType));
});
function Hu(e, t) {
  return new Vu({ type: `nonoptional`, innerType: e, ...L(t) });
}
var Uu = F(`ZodCatch`, (e, t) => {
  (Qs.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => wl(e, t, n, r)),
    (e.unwrap = () => e._zod.def.innerType),
    (e.removeCatch = e.unwrap));
});
function Wu(e, t) {
  return new Uu({
    type: `catch`,
    innerType: e,
    catchValue: typeof t == `function` ? t : () => t,
  });
}
var Gu = F(`ZodPipe`, (e, t) => {
  ($s.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => Tl(e, t, n, r)),
    (e.in = t.in),
    (e.out = t.out));
});
function Ku(e, t) {
  return new Gu({ type: `pipe`, in: e, out: t });
}
var qu = F(`ZodReadonly`, (e, t) => {
  (tc.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => El(e, t, n, r)),
    (e.unwrap = () => e._zod.def.innerType));
});
function Ju(e) {
  return new qu({ type: `readonly`, innerType: e });
}
var q = F(`ZodCustom`, (e, t) => {
  (rc.init(e, t),
    Kl.init(e, t),
    (e._zod.processJSONSchema = (t, n, r) => ml(e, t, n, r)));
});
function Yu(e, t = {}) {
  return el(q, e, t);
}
function Xu(e, t) {
  return tl(e, t);
}
var Zu = o((e) => {
    var t = Symbol.for(`react.transitional.element`),
      n = Symbol.for(`react.fragment`);
    function r(e, n, r) {
      var i = null;
      if (
        (r !== void 0 && (i = `` + r),
        n.key !== void 0 && (i = `` + n.key),
        `key` in n)
      )
        for (var a in ((r = {}), n)) a !== `key` && (r[a] = n[a]);
      else r = n;
      return (
        (n = r.ref),
        { $$typeof: t, type: e, key: i, ref: n === void 0 ? null : n, props: r }
      );
    }
    ((e.Fragment = n), (e.jsx = r), (e.jsxs = r));
  }),
  J = o((e, t) => {
    t.exports = Zu();
  })(),
  Qu = 2e4,
  $u = `No matching state found in storage`,
  ed = `hercules-auth:missing-state-retry`,
  td = Su({ message: Yl() });
function nd(e) {
  if (e.source !== `signinCallback` || e.message !== $u) return !1;
  let t = new URL(window.location.href);
  if (!t.searchParams.has(`code`)) return !1;
  try {
    if (window.sessionStorage.getItem(ed) !== null) return !1;
    window.sessionStorage.setItem(ed, `1`);
  } catch {
    return !1;
  }
  return (
    t.searchParams.delete(`code`),
    t.searchParams.delete(`state`),
    window.history.replaceState({}, document.title, t.toString()),
    !0
  );
}
function rd(e = {}) {
  let {
      timeoutMs: t = Qu,
      isBackendAuthenticated: n = !0,
      onSync: r,
      onSuccess: i,
      onNoAuthParams: a,
    } = e,
    { isLoading: o, isAuthenticated: s, error: c, signinRedirect: l } = gi(),
    [u, d] = (0, x.useState)(`processing-oauth`),
    [f, p] = (0, x.useState)(null),
    m = (0, x.useRef)(!0),
    h = (0, x.useRef)(ii()),
    g = (0, x.useRef)(!1),
    _ = (0, x.useRef)(null);
  ((0, x.useEffect)(
    () => (
      (m.current = !0),
      (g.current = !1),
      () => {
        m.current = !1;
      }
    ),
    [],
  ),
    (0, x.useEffect)(() => {
      if (u === `success` || u === `error`) return;
      let e = setTimeout(() => {
        m.current &&
          (d(`error`), p(`Authentication timed out. Please try again.`));
      }, t);
      return () => clearTimeout(e);
    }, [u, t]),
    (0, x.useEffect)(() => {
      if (u === `processing-oauth` || u === `waiting-backend`) {
        if (c) {
          if (c === _.current) return;
          if (nd(c)) {
            ((_.current = c), l());
            return;
          }
          (d(`error`), p(c.message || `Authentication failed`));
          return;
        }
        if (!h.current && !o && !s) {
          a?.();
          return;
        }
        if (!o && s && u === `processing-oauth`) {
          d(`waiting-backend`);
          return;
        }
        if (h.current && !o && !s && !c && u === `processing-oauth`) {
          let e = setTimeout(() => {
            m.current &&
              !s &&
              (d(`error`),
              p(`Authentication was cancelled or failed. Please try again.`));
          }, 500);
          return () => clearTimeout(e);
        }
      }
    }, [o, s, c, u, a, l]),
    (0, x.useEffect)(() => {
      if (u !== `waiting-backend` || !n || g.current) return;
      g.current = !0;
      async function e() {
        if (m.current) {
          d(`syncing`);
          try {
            (r && (await r()), m.current && d(`success`));
          } catch (e) {
            if ((console.error(`Auth callback sync failed:`, e), !m.current))
              return;
            if (e instanceof ca) {
              let t = td.safeParse(e.data);
              if (t.success) {
                (d(`error`), p(t.data.message));
                return;
              }
            }
            let t =
              e instanceof Error
                ? e.message
                : `Failed to complete authentication. Please try again.`;
            (d(`error`), p(t));
          }
        }
      }
      e();
    }, [u, n, r]),
    (0, x.useEffect)(() => {
      u === `success` && i?.();
    }, [u, i]));
  let v = (0, x.useCallback)(async () => {
    try {
      await l();
    } catch (e) {
      console.error(`Failed to restart auth:`, e);
    }
  }, [l]);
  return {
    status: u,
    error: f,
    isLoading: u !== `success` && u !== `error`,
    isSuccess: u === `success`,
    isError: u === `error`,
    retry: v,
  };
}
function id(e, t) {
  let n = new URL(e),
    r = n.searchParams.getAll(`id_token_hint`),
    i = r[0];
  if (!i || r.length !== 1) return e;
  let a;
  try {
    a = Un(i).sid;
  } catch {
    return e;
  }
  if (typeof a == `string` && a.length > 0) return e;
  let o = n.searchParams.getAll(`client_id`);
  return o.length > 1 || (o.length === 1 && o[0] !== t)
    ? e
    : (n.searchParams.delete(`id_token_hint`),
      n.searchParams.set(`client_id`, t),
      n.toString());
}
var ad = 5e3;
function od() {
  if (typeof window > `u`) return !1;
  try {
    return window.self !== window.top;
  } catch {
    return !0;
  }
}
async function sd(e) {
  return (
    await fetch(e, {
      mode: `no-cors`,
      credentials: `omit`,
      signal: AbortSignal.timeout(ad),
    }).catch(() => void 0),
    { url: e }
  );
}
var cd = class extends ei {
    _signoutStart(e = {}, t) {
      return e.request_type === `so:r`
        ? super._signoutStart(e, {
            close: () => t.close(),
            navigate: (e) => {
              let n = id(e.url, this.settings.client_id);
              return this.settings.redirectTarget !== `top` && od()
                ? sd(n)
                : t.navigate({ ...e, url: n });
            },
          })
        : super._signoutStart(e, t);
    }
  },
  ld = `hercules_impersonation_session_id`,
  ud = `hercules_impersonation_token`;
function dd(e, t) {
  return `hercules.impersonation.${e}.${t}`;
}
function fd(e, t) {
  typeof window > `u` ||
    window.localStorage.setItem(
      e,
      JSON.stringify({ sessionId: t, startedAt: new Date().toISOString() }),
    );
}
function pd(e) {
  return (e.searchParams.delete(ld), e.searchParams.delete(ud), e);
}
var md = 1e4;
function hd() {
  window.history.replaceState({}, document.title, window.location.pathname);
}
function gd() {
  window.location.pathname = ``;
}
var _d = { onSignoutCallback: gd, onSigninCallback: hd },
  vd = (0, x.createContext)(null);
function yd() {
  let e = (0, x.useContext)(vd);
  if (!e) throw Error(`HerculesAuthProviderContext not found`);
  return e;
}
function bd() {
  try {
    return window.localStorage;
  } catch {
    try {
      return window.sessionStorage;
    } catch {
      return new cr();
    }
  }
}
function xd() {
  return (0, J.jsx)(`div`, {
    role: `status`,
    "aria-label": `Loading`,
    style: {
      position: `fixed`,
      inset: 0,
      display: `grid`,
      placeItems: `center`,
      pointerEvents: `none`,
    },
    children: (0, J.jsxs)(`svg`, {
      width: `32`,
      height: `32`,
      viewBox: `0 0 24 24`,
      fill: `none`,
      stroke: `currentColor`,
      strokeWidth: `2.5`,
      "aria-hidden": `true`,
      children: [
        (0, J.jsx)(`circle`, { cx: `12`, cy: `12`, r: `10`, opacity: `0.25` }),
        (0, J.jsx)(`path`, {
          d: `M22 12a10 10 0 0 0-10-10`,
          strokeLinecap: `round`,
          children: (0, J.jsx)(`animateTransform`, {
            attributeName: `transform`,
            type: `rotate`,
            from: `0 12 12`,
            to: `360 12 12`,
            dur: `0.8s`,
            repeatCount: `indefinite`,
          }),
        }),
      ],
    }),
  });
}
function Sd({ children: e, loadingFallback: t, skipRecovery: n }) {
  let { user: r, isLoading: i, signinSilent: a } = gi(),
    o = r?.expired === !0,
    s = (0, x.useRef)(!1),
    c = (0, x.useRef)(a);
  c.current = a;
  let [l, u] = (0, x.useState)(!1),
    [d, f] = (0, x.useState)(!1);
  return (
    (0, x.useEffect)(() => {
      if (n) {
        ((s.current = !0), u(!0));
        return;
      }
      if (i || s.current) return;
      if (((s.current = !0), !r || !o)) {
        u(!0);
        return;
      }
      f(!0);
      let e = () => {
        (f(!1), u(!0));
      };
      (setTimeout(e, md),
        zn(async () => {
          await Promise.race([
            c.current().catch(() => void 0),
            new Promise((e) => setTimeout(e, 15e3)),
          ]);
        }).finally(e));
    }, [i, n, o]),
    !n && (d || (!l && !i && o))
      ? (0, J.jsx)(J.Fragment, { children: t })
      : (0, J.jsx)(J.Fragment, { children: e })
  );
}
function Y({
  children: e,
  userManagerSettings: t,
  authority: n,
  client_id: r,
  loadingFallback: i = (0, J.jsx)(xd, {}),
  ...a
}) {
  let o = t?.automaticSilentRenew === !0,
    [{ userManager: s, impersonationStorageKey: c }] = (0, x.useState)(() => {
      let e = t?.authority ?? n,
        i = t?.client_id ?? r;
      return {
        userManager: new cd({
          ...t,
          authority: e,
          client_id: i,
          prompt: t?.prompt ?? `select_account`,
          response_type: t?.response_type ?? `code`,
          scope: t?.scope ?? `openid profile email offline_access`,
          redirect_uri:
            t?.redirect_uri ?? `${window.location.origin}/auth/callback`,
          post_logout_redirect_uri:
            t?.post_logout_redirect_uri ?? window.location.origin,
          userStore: t?.userStore ?? new fr({ store: bd() }),
          stateStore: t?.stateStore ?? new fr({ store: bd() }),
          automaticSilentRenew: t?.automaticSilentRenew ?? !1,
          silentRequestTimeoutInSeconds:
            t?.silentRequestTimeoutInSeconds ?? md / 1e3,
        }),
        impersonationStorageKey: dd(e, i),
      };
    });
  return (
    (0, x.useEffect)(() => {
      if (o) return;
      let e = null,
        t = 0,
        n = !1,
        r = s.events,
        i = () => {
          n ||
            zn(async () => {
              if (!n)
                try {
                  (await s.signinSilent(), (t = 0));
                } catch (a) {
                  if (n) return;
                  if (a instanceof Error && a.name === `ErrorTimeout`) {
                    t++;
                    let n = s.settings.maxSilentRenewTimeoutRetries;
                    if (n !== void 0 && t > n) {
                      ((t = 0), r._raiseSilentRenewError?.(a));
                      return;
                    }
                    e = setTimeout(() => {
                      ((e = null), i());
                    }, 5e3);
                  } else ((t = 0), r._raiseSilentRenewError?.(a));
                }
            });
        },
        a = () => i();
      return (
        s.events.addAccessTokenExpiring(a),
        () => {
          ((n = !0),
            s.events.removeAccessTokenExpiring(a),
            e !== null && clearTimeout(e));
        }
      );
    }, [s, o]),
    (0, J.jsx)(vd.Provider, {
      value: { userManager: s, impersonationStorageKey: c },
      children: (0, J.jsxs)(hi, {
        userManager: s,
        ..._d,
        ...a,
        children: [
          (0, J.jsx)(Cd, { storageKey: c }),
          (0, J.jsx)(Sd, {
            loadingFallback: i,
            skipRecovery: wd(),
            children: e,
          }),
        ],
      }),
    })
  );
}
function Cd({ storageKey: e }) {
  let t = gi(),
    n = (0, x.useRef)(!1);
  return (
    (0, x.useEffect)(() => {
      if (n.current || typeof window > `u`) return;
      let r = new URL(window.location.href),
        i = r.searchParams.get(ld),
        a = r.searchParams.get(ud);
      if (!(!i && !a)) {
        if (!i || !a) {
          window.history.replaceState({}, document.title, pd(r).toString());
          return;
        }
        t.isLoading ||
          ((n.current = !0),
          fd(e, i),
          window.history.replaceState({}, document.title, pd(r).toString()),
          (async () => {
            (t.isAuthenticated && (await t.removeUser()),
              await t.signinRedirect({
                extraQueryParams: { [ld]: i, [ud]: a },
              }));
          })());
      }
    }, [t, e]),
    null
  );
}
function wd() {
  if (typeof window > `u`) return !1;
  let e = new URL(window.location.href).searchParams;
  return (
    e.has(`hercules_impersonation_session_id`) &&
    e.has(`hercules_impersonation_token`)
  );
}
function Td() {
  let { userManager: e } = yd(),
    t = gi(),
    { signoutRedirect: n, removeUser: r, signinRedirect: i } = t,
    a = (0, x.useCallback)(async () => {
      (await e.metadataService.getEndSessionEndpoint()) == null
        ? await r()
        : await n();
    }, [e, n, r]),
    o = (0, x.useCallback)(
      async (e) => {
        let t =
          e?.returnTo ??
          window.location.pathname +
            window.location.search +
            window.location.hash;
        await i({ state: { returnTo: t } });
      },
      [i],
    );
  return (0, x.useMemo)(() => ({ ...t, signout: a, signin: o }), [t, a, o]);
}
function Ed({ children: e }) {
  return (0, J.jsx)(Y, {
    authority: `https://01m5g2bb3k84ntf2v8jtwy8cwe.hercules-auth.com`,
    client_id: `nzcKwHZHbiMhpdoSgLSaaqWiEDfibQEE`,
    userManagerSettings: {
      prompt: `select_account`,
      response_type: `code`,
      scope: `openid profile email offline_access`,
      redirect_uri: `${window.location.origin}/auth/callback`,
    },
    children: e,
  });
}
var Dd = `1.43.0`,
  Od = Object.defineProperty,
  kd = (e, t, n) =>
    t in e
      ? Od(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  Ad = (e, t, n) => kd(e, typeof t == `symbol` ? t : t + ``, n),
  jd = `color:rgb(0, 145, 255)`;
function Md(e) {
  switch (e) {
    case `query`:
      return `Q`;
    case `mutation`:
      return `M`;
    case `action`:
      return `A`;
    case `any`:
      return `?`;
  }
}
var Nd = class {
  constructor(e) {
    (Ad(this, `_onLogLineFuncs`),
      Ad(this, `_verbose`),
      (this._onLogLineFuncs = {}),
      (this._verbose = e.verbose));
  }
  addLogLineListener(e) {
    let t = Math.random().toString(36).substring(2, 15);
    for (let e = 0; e < 10 && this._onLogLineFuncs[t] !== void 0; e++)
      t = Math.random().toString(36).substring(2, 15);
    return (
      (this._onLogLineFuncs[t] = e),
      () => {
        delete this._onLogLineFuncs[t];
      }
    );
  }
  logVerbose(...e) {
    if (this._verbose)
      for (let t of Object.values(this._onLogLineFuncs))
        t(`debug`, `${new Date().toISOString()}`, ...e);
  }
  log(...e) {
    for (let t of Object.values(this._onLogLineFuncs)) t(`info`, ...e);
  }
  warn(...e) {
    for (let t of Object.values(this._onLogLineFuncs)) t(`warn`, ...e);
  }
  error(...e) {
    for (let t of Object.values(this._onLogLineFuncs)) t(`error`, ...e);
  }
};
function Pd(e) {
  let t = new Nd(e);
  return (
    t.addLogLineListener((e, ...t) => {
      switch (e) {
        case `debug`:
          console.debug(...t);
          break;
        case `info`:
          console.log(...t);
          break;
        case `warn`:
          console.warn(...t);
          break;
        case `error`:
          console.error(...t);
          break;
        default:
          console.log(...t);
      }
    }),
    t
  );
}
function Fd(e) {
  return new Nd(e);
}
function X(e, t, n, r, i) {
  let a = Md(n);
  if (
    (typeof i == `object` &&
      (i = `ConvexError ${JSON.stringify(i.errorData, null, 2)}`),
    t === `info`)
  ) {
    let t = i.match(/^\[.*?\] /);
    if (t === null) {
      e.error(`[CONVEX ${a}(${r})] Could not parse console.log`);
      return;
    }
    let n = i.slice(1, t[0].length - 2),
      o = i.slice(t[0].length);
    e.log(`%c[CONVEX ${a}(${r})] [${n}]`, jd, o);
  } else e.error(`[CONVEX ${a}(${r})] ${i}`);
}
function Id(e, t) {
  let n = `[CONVEX FATAL ERROR] ${t}`;
  return (e.error(n), Error(n));
}
function Ld(e, t, n) {
  return `[CONVEX ${Md(e)}(${t})] ${n.errorMessage}
  Called by client`;
}
function Rd(e, t) {
  return ((t.data = e.errorData), t);
}
function zd(e) {
  let t = e.split(`:`),
    n,
    r;
  return (
    t.length === 1
      ? ((n = t[0]), (r = `default`))
      : ((n = t.slice(0, t.length - 1).join(`:`)), (r = t[t.length - 1])),
    n.endsWith(`.js`) && (n = n.slice(0, -3)),
    `${n}:${r}`
  );
}
function Bd(e, t) {
  return JSON.stringify({ udfPath: zd(e), args: ta(t) });
}
function Vd(e, t, n) {
  let { initialNumItems: r, id: i } = n;
  return JSON.stringify({
    type: `paginated`,
    udfPath: zd(e),
    args: ta(t),
    options: ta({ initialNumItems: r, id: i }),
  });
}
var Hd = Object.defineProperty,
  Ud = (e, t, n) =>
    t in e
      ? Hd(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  Wd = (e, t, n) => Ud(e, typeof t == `symbol` ? t : t + ``, n),
  Gd = class {
    constructor() {
      (Wd(this, `nextQueryId`),
        Wd(this, `querySetVersion`),
        Wd(this, `querySet`),
        Wd(this, `queryIdToToken`),
        Wd(this, `identityVersion`),
        Wd(this, `auth`),
        Wd(this, `outstandingQueriesOlderThanRestart`),
        Wd(this, `outstandingAuthOlderThanRestart`),
        Wd(this, `paused`),
        Wd(this, `pendingQuerySetModifications`),
        (this.nextQueryId = 0),
        (this.querySetVersion = 0),
        (this.identityVersion = 0),
        (this.querySet = new Map()),
        (this.queryIdToToken = new Map()),
        (this.outstandingQueriesOlderThanRestart = new Set()),
        (this.outstandingAuthOlderThanRestart = !1),
        (this.paused = !1),
        (this.pendingQuerySetModifications = new Map()));
    }
    hasSyncedPastLastReconnect() {
      return (
        this.outstandingQueriesOlderThanRestart.size === 0 &&
        !this.outstandingAuthOlderThanRestart
      );
    }
    markAuthCompletion() {
      this.outstandingAuthOlderThanRestart = !1;
    }
    subscribe(e, t, n, r) {
      let i = zd(e),
        a = Bd(i, t),
        o = this.querySet.get(a);
      if (o !== void 0)
        return (
          (o.numSubscribers += 1),
          {
            queryToken: a,
            modification: null,
            unsubscribe: () => this.removeSubscriber(a),
          }
        );
      {
        let e = this.nextQueryId++,
          o = {
            id: e,
            canonicalizedUdfPath: i,
            args: t,
            numSubscribers: 1,
            journal: n,
            componentPath: r,
          };
        (this.querySet.set(a, o), this.queryIdToToken.set(e, a));
        let s = this.querySetVersion,
          c = this.querySetVersion + 1,
          l = {
            type: `Add`,
            queryId: e,
            udfPath: i,
            args: [ta(t)],
            journal: n,
            componentPath: r,
          };
        return (
          this.paused
            ? this.pendingQuerySetModifications.set(e, l)
            : (this.querySetVersion = c),
          {
            queryToken: a,
            modification: {
              type: `ModifyQuerySet`,
              baseVersion: s,
              newVersion: c,
              modifications: [l],
            },
            unsubscribe: () => this.removeSubscriber(a),
          }
        );
      }
    }
    transition(e) {
      for (let t of e.modifications)
        switch (t.type) {
          case `QueryUpdated`:
          case `QueryFailed`: {
            this.outstandingQueriesOlderThanRestart.delete(t.queryId);
            let e = t.journal;
            if (e !== void 0) {
              let n = this.queryIdToToken.get(t.queryId);
              n !== void 0 && (this.querySet.get(n).journal = e);
            }
            break;
          }
          case `QueryRemoved`:
            this.outstandingQueriesOlderThanRestart.delete(t.queryId);
            break;
          default:
            throw Error(`Invalid modification ${t.type}`);
        }
    }
    queryId(e, t) {
      let n = Bd(zd(e), t),
        r = this.querySet.get(n);
      return r === void 0 ? null : r.id;
    }
    isCurrentOrNewerAuthVersion(e) {
      return e >= this.identityVersion;
    }
    getAuth() {
      return this.auth;
    }
    setAuth(e) {
      this.auth = { tokenType: `User`, value: e };
      let t = this.identityVersion;
      return (
        this.paused || (this.identityVersion = t + 1),
        { type: `Authenticate`, baseVersion: t, ...this.auth }
      );
    }
    setAdminAuth(e, t) {
      let n = { tokenType: `Admin`, value: e, impersonating: t };
      this.auth = n;
      let r = this.identityVersion;
      return (
        this.paused || (this.identityVersion = r + 1),
        { type: `Authenticate`, baseVersion: r, ...n }
      );
    }
    clearAuth() {
      ((this.auth = void 0), this.markAuthCompletion());
      let e = this.identityVersion;
      return (
        this.paused || (this.identityVersion = e + 1),
        { type: `Authenticate`, tokenType: `None`, baseVersion: e }
      );
    }
    hasAuth() {
      return !!this.auth;
    }
    isNewAuth(e) {
      return this.auth?.value !== e;
    }
    queryPath(e) {
      let t = this.queryIdToToken.get(e);
      return t ? this.querySet.get(t).canonicalizedUdfPath : null;
    }
    queryArgs(e) {
      let t = this.queryIdToToken.get(e);
      return t ? this.querySet.get(t).args : null;
    }
    queryToken(e) {
      return this.queryIdToToken.get(e) ?? null;
    }
    queryJournal(e) {
      return this.querySet.get(e)?.journal;
    }
    restart() {
      (this.unpause(), this.outstandingQueriesOlderThanRestart.clear());
      let e = [];
      for (let t of this.querySet.values()) {
        let n = {
          type: `Add`,
          queryId: t.id,
          udfPath: t.canonicalizedUdfPath,
          args: [ta(t.args)],
          journal: t.journal,
          componentPath: t.componentPath,
        };
        (e.push(n), this.outstandingQueriesOlderThanRestart.add(t.id));
      }
      this.querySetVersion = 1;
      let t = {
        type: `ModifyQuerySet`,
        baseVersion: 0,
        newVersion: 1,
        modifications: e,
      };
      if (!this.auth) return ((this.identityVersion = 0), [t, void 0]);
      this.outstandingAuthOlderThanRestart = !0;
      let n = { type: `Authenticate`, baseVersion: 0, ...this.auth };
      return ((this.identityVersion = 1), [t, n]);
    }
    pause() {
      this.paused = !0;
    }
    resume() {
      let e =
          this.pendingQuerySetModifications.size > 0
            ? {
                type: `ModifyQuerySet`,
                baseVersion: this.querySetVersion,
                newVersion: ++this.querySetVersion,
                modifications: Array.from(
                  this.pendingQuerySetModifications.values(),
                ),
              }
            : void 0,
        t =
          this.auth === void 0
            ? void 0
            : {
                type: `Authenticate`,
                baseVersion: this.identityVersion++,
                ...this.auth,
              };
      return (this.unpause(), [e, t]);
    }
    unpause() {
      ((this.paused = !1), this.pendingQuerySetModifications.clear());
    }
    removeSubscriber(e) {
      let t = this.querySet.get(e);
      if (t.numSubscribers > 1) return (--t.numSubscribers, null);
      {
        (this.querySet.delete(e),
          this.queryIdToToken.delete(t.id),
          this.outstandingQueriesOlderThanRestart.delete(t.id));
        let n = this.querySetVersion,
          r = this.querySetVersion + 1,
          i = { type: `Remove`, queryId: t.id };
        return (
          this.paused
            ? this.pendingQuerySetModifications.has(t.id)
              ? this.pendingQuerySetModifications.delete(t.id)
              : this.pendingQuerySetModifications.set(t.id, i)
            : (this.querySetVersion = r),
          {
            type: `ModifyQuerySet`,
            baseVersion: n,
            newVersion: r,
            modifications: [i],
          }
        );
      }
    }
  },
  Kd = Object.defineProperty,
  qd = (e, t, n) =>
    t in e
      ? Kd(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  Jd = (e, t, n) => qd(e, typeof t == `symbol` ? t : t + ``, n),
  Yd = class {
    constructor(e, t) {
      ((this.logger = e),
        (this.markConnectionStateDirty = t),
        Jd(this, `inflightRequests`),
        Jd(this, `requestsOlderThanRestart`),
        Jd(this, `inflightMutationsCount`, 0),
        Jd(this, `inflightActionsCount`, 0),
        (this.inflightRequests = new Map()),
        (this.requestsOlderThanRestart = new Set()));
    }
    request(e, t) {
      let n = new Promise((n) => {
        let r = t ? `Requested` : `NotSent`;
        (this.inflightRequests.set(e.requestId, {
          message: e,
          status: { status: r, requestedAt: new Date(), onResult: n },
        }),
          e.type === `Mutation`
            ? this.inflightMutationsCount++
            : e.type === `Action` && this.inflightActionsCount++);
      });
      return (this.markConnectionStateDirty(), n);
    }
    onResponse(e) {
      let t = this.inflightRequests.get(e.requestId);
      if (t === void 0 || t.status.status === `Completed`) return null;
      let n = t.message.type === `Mutation` ? `mutation` : `action`,
        r = t.message.udfPath;
      for (let t of e.logLines) X(this.logger, `info`, n, r, t);
      let i = t.status,
        a,
        o;
      if (e.success)
        ((a = { success: !0, logLines: e.logLines, value: Yi(e.result) }),
          (o = () => i.onResult(a)));
      else {
        let t = e.result,
          { errorData: s } = e;
        (X(this.logger, `error`, n, r, t),
          (a = {
            success: !1,
            errorMessage: t,
            errorData: s === void 0 ? void 0 : Yi(s),
            logLines: e.logLines,
          }),
          (o = () => i.onResult(a)));
      }
      return e.type === `ActionResponse` || !e.success
        ? (o(),
          this.inflightRequests.delete(e.requestId),
          this.requestsOlderThanRestart.delete(e.requestId),
          t.message.type === `Action`
            ? this.inflightActionsCount--
            : t.message.type === `Mutation` && this.inflightMutationsCount--,
          this.markConnectionStateDirty(),
          { requestId: e.requestId, result: a })
        : ((t.status = {
            status: `Completed`,
            result: a,
            ts: e.ts,
            onResolve: o,
          }),
          null);
    }
    removeCompleted(e) {
      let t = new Map();
      for (let [n, r] of this.inflightRequests.entries()) {
        let i = r.status;
        i.status === `Completed` &&
          i.ts.lessThanOrEqual(e) &&
          (i.onResolve(),
          t.set(n, i.result),
          r.message.type === `Mutation`
            ? this.inflightMutationsCount--
            : r.message.type === `Action` && this.inflightActionsCount--,
          this.inflightRequests.delete(n),
          this.requestsOlderThanRestart.delete(n));
      }
      return (t.size > 0 && this.markConnectionStateDirty(), t);
    }
    restart() {
      this.requestsOlderThanRestart = new Set(this.inflightRequests.keys());
      let e = [];
      for (let [t, n] of this.inflightRequests) {
        if (n.status.status === `NotSent`) {
          ((n.status.status = `Requested`), e.push(n.message));
          continue;
        }
        if (n.message.type === `Mutation`) e.push(n.message);
        else if (n.message.type === `Action`) {
          if (
            (this.inflightRequests.delete(t),
            this.requestsOlderThanRestart.delete(t),
            this.inflightActionsCount--,
            n.status.status === `Completed`)
          )
            throw Error(`Action should never be in 'Completed' state`);
          n.status.onResult({
            success: !1,
            errorMessage: `Connection lost while action was in flight`,
            logLines: [],
          });
        }
      }
      return (this.markConnectionStateDirty(), e);
    }
    resume() {
      let e = [];
      for (let [, t] of this.inflightRequests)
        if (t.status.status === `NotSent`) {
          ((t.status.status = `Requested`), e.push(t.message));
          continue;
        }
      return e;
    }
    hasIncompleteRequests() {
      for (let e of this.inflightRequests.values())
        if (e.status.status === `Requested`) return !0;
      return !1;
    }
    hasInflightRequests() {
      return this.inflightRequests.size > 0;
    }
    hasSyncedPastLastReconnect() {
      return this.requestsOlderThanRestart.size === 0;
    }
    timeOfOldestInflightRequest() {
      if (this.inflightRequests.size === 0) return null;
      let e = Date.now();
      for (let t of this.inflightRequests.values())
        t.status.status !== `Completed` &&
          t.status.requestedAt.getTime() < e &&
          (e = t.status.requestedAt.getTime());
      return new Date(e);
    }
    inflightMutations() {
      return this.inflightMutationsCount;
    }
    inflightActions() {
      return this.inflightActionsCount;
    }
  },
  Xd = Symbol.for(`functionName`),
  Zd = Symbol.for(`toReferencePath`);
function Qd(e) {
  return e[Zd] ?? null;
}
function $d(e) {
  return e.startsWith(`function://`);
}
function ef(e) {
  let t;
  if (typeof e == `string`) t = $d(e) ? { functionHandle: e } : { name: e };
  else if (e[Xd]) t = { name: e[Xd] };
  else {
    let n = Qd(e);
    if (!n) throw Error(`${e} is not a functionReference`);
    t = { reference: n };
  }
  return t;
}
function tf(e) {
  let t = ef(e);
  if (t.name === void 0)
    throw t.functionHandle === void 0
      ? t.reference === void 0
        ? Error(
            `Expected function reference like "api.file.func" or "internal.file.func", but received ${JSON.stringify(t)}`,
          )
        : Error(
            `Expected function reference in the current component like "api.file.func" or "internal.file.func", but received reference ${t.reference}`,
          )
      : Error(
          `Expected function reference like "api.file.func" or "internal.file.func", but received function handle ${t.functionHandle}`,
        );
  if (typeof e == `string`) return e;
  let n = e[Xd];
  if (!n) throw Error(`${e} is not a functionReference`);
  return n;
}
function nf(e) {
  return { [Xd]: e };
}
function rf(e = []) {
  return new Proxy(
    {},
    {
      get(t, n) {
        if (typeof n == `string`) return rf([...e, n]);
        if (n === Xd) {
          if (e.length < 2) {
            let t = [`api`, ...e].join(`.`);
            throw Error(
              `API path is expected to be of the form \`api.moduleName.functionName\`. Found: \`${t}\``,
            );
          }
          let t = e.slice(0, -1).join(`/`),
            n = e[e.length - 1];
          return n === "default" ? t : t + `:` + n;
        }
        if (n === Symbol.toStringTag) return `FunctionReference`;
      },
    },
  );
}
var af = rf(),
  of = Object.defineProperty,
  sf = (e, t, n) =>
    t in e
      ? of(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  cf = (e, t, n) => sf(e, typeof t == `symbol` ? t : t + ``, n),
  lf = class e {
    constructor(e) {
      (cf(this, `queryResults`),
        cf(this, `modifiedQueries`),
        (this.queryResults = e),
        (this.modifiedQueries = []));
    }
    getQuery(t, ...n) {
      let r = ki(n[0]),
        i = tf(t),
        a = this.queryResults.get(Bd(i, r));
      if (a !== void 0) return e.queryValue(a.result);
    }
    getAllQueries(t) {
      let n = [],
        r = tf(t);
      for (let t of this.queryResults.values())
        t.udfPath === zd(r) &&
          n.push({ args: t.args, value: e.queryValue(t.result) });
      return n;
    }
    setQuery(e, t, n) {
      let r = ki(t),
        i = tf(e),
        a = Bd(i, r),
        o;
      o = n === void 0 ? void 0 : { success: !0, value: n, logLines: [] };
      let s = { udfPath: i, args: r, result: o };
      (this.queryResults.set(a, s), this.modifiedQueries.push(a));
    }
    static queryValue(e) {
      if (e !== void 0 && e.success) return e.value;
    }
  },
  uf = class {
    constructor() {
      (cf(this, `queryResults`),
        cf(this, `optimisticUpdates`),
        (this.queryResults = new Map()),
        (this.optimisticUpdates = []));
    }
    ingestQueryResultsFromServer(e, t) {
      this.optimisticUpdates = this.optimisticUpdates.filter(
        (e) => !t.has(e.mutationId),
      );
      let n = this.queryResults;
      this.queryResults = new Map(e);
      let r = new lf(this.queryResults);
      for (let e of this.optimisticUpdates) e.update(r);
      let i = [];
      for (let [e, t] of this.queryResults) {
        let r = n.get(e);
        (r === void 0 || r.result !== t.result) && i.push(e);
      }
      return i;
    }
    applyOptimisticUpdate(e, t) {
      this.optimisticUpdates.push({ update: e, mutationId: t });
      let n = new lf(this.queryResults);
      return (e(n), n.modifiedQueries);
    }
    rawQueryResult(e) {
      let t = this.queryResults.get(e);
      if (t !== void 0) return t.result;
    }
    queryResult(e) {
      let t = this.queryResults.get(e);
      if (t === void 0) return;
      let n = t.result;
      if (n !== void 0) {
        if (n.success) return n.value;
        throw n.errorData === void 0
          ? Error(Ld(`query`, t.udfPath, n))
          : Rd(n, new ca(Ld(`query`, t.udfPath, n)));
      }
    }
    hasQueryResult(e) {
      return this.queryResults.get(e) !== void 0;
    }
    queryLogs(e) {
      return this.queryResults.get(e)?.result?.logLines;
    }
  },
  df = Object.defineProperty,
  ff = (e, t, n) =>
    t in e
      ? df(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  pf = (e, t, n) => ff(e, typeof t == `symbol` ? t : t + ``, n),
  mf = class e {
    constructor(e, t) {
      (pf(this, `low`),
        pf(this, `high`),
        pf(this, `__isUnsignedLong__`),
        (this.low = e | 0),
        (this.high = t | 0),
        (this.__isUnsignedLong__ = !0));
    }
    static isLong(e) {
      return (e && e.__isUnsignedLong__) === !0;
    }
    static fromBytesLE(t) {
      return new e(
        t[0] | (t[1] << 8) | (t[2] << 16) | (t[3] << 24),
        t[4] | (t[5] << 8) | (t[6] << 16) | (t[7] << 24),
      );
    }
    toBytesLE() {
      let e = this.high,
        t = this.low;
      return [
        t & 255,
        (t >>> 8) & 255,
        (t >>> 16) & 255,
        t >>> 24,
        e & 255,
        (e >>> 8) & 255,
        (e >>> 16) & 255,
        e >>> 24,
      ];
    }
    static fromNumber(t) {
      return isNaN(t) || t < 0
        ? hf
        : t >= vf
          ? yf
          : new e((t % _f) | 0, (t / _f) | 0);
    }
    toString() {
      return (BigInt(this.high) * BigInt(_f) + BigInt(this.low)).toString();
    }
    equals(t) {
      return (
        e.isLong(t) || (t = e.fromValue(t)),
        this.high >>> 31 == 1 && t.high >>> 31 == 1
          ? !1
          : this.high === t.high && this.low === t.low
      );
    }
    notEquals(e) {
      return !this.equals(e);
    }
    comp(t) {
      return (
        e.isLong(t) || (t = e.fromValue(t)),
        this.equals(t)
          ? 0
          : t.high >>> 0 > this.high >>> 0 ||
              (t.high === this.high && t.low >>> 0 > this.low >>> 0)
            ? -1
            : 1
      );
    }
    lessThanOrEqual(e) {
      return this.comp(e) <= 0;
    }
    static fromValue(t) {
      return typeof t == `number` ? e.fromNumber(t) : new e(t.low, t.high);
    }
  },
  hf = new mf(0, 0),
  gf = 65536,
  _f = gf * gf,
  vf = _f * _f,
  yf = new mf(-1, -1),
  bf = Object.defineProperty,
  xf = (e, t, n) =>
    t in e
      ? bf(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  Sf = (e, t, n) => xf(e, typeof t == `symbol` ? t : t + ``, n),
  Cf = class {
    constructor(e, t) {
      (Sf(this, `version`),
        Sf(this, `remoteQuerySet`),
        Sf(this, `queryPath`),
        Sf(this, `logger`),
        (this.version = { querySet: 0, ts: mf.fromNumber(0), identity: 0 }),
        (this.remoteQuerySet = new Map()),
        (this.queryPath = e),
        (this.logger = t));
    }
    transition(e) {
      let t = e.startVersion;
      if (
        this.version.querySet !== t.querySet ||
        this.version.ts.notEquals(t.ts) ||
        this.version.identity !== t.identity
      )
        throw Error(
          `Invalid start version: ${t.ts.toString()}:${t.querySet}:${t.identity}, transitioning from ${this.version.ts.toString()}:${this.version.querySet}:${this.version.identity}`,
        );
      for (let t of e.modifications)
        switch (t.type) {
          case `QueryUpdated`: {
            let e = this.queryPath(t.queryId);
            if (e)
              for (let n of t.logLines) X(this.logger, `info`, `query`, e, n);
            let n = Yi(t.value ?? null);
            this.remoteQuerySet.set(t.queryId, {
              success: !0,
              value: n,
              logLines: t.logLines,
            });
            break;
          }
          case `QueryFailed`: {
            let e = this.queryPath(t.queryId);
            if (e)
              for (let n of t.logLines) X(this.logger, `info`, `query`, e, n);
            let { errorData: n } = t;
            this.remoteQuerySet.set(t.queryId, {
              success: !1,
              errorMessage: t.errorMessage,
              errorData: n === void 0 ? void 0 : Yi(n),
              logLines: t.logLines,
            });
            break;
          }
          case `QueryRemoved`:
            this.remoteQuerySet.delete(t.queryId);
            break;
          default:
            throw Error(`Invalid modification ${t.type}`);
        }
      this.version = e.endVersion;
    }
    remoteQueryResults() {
      return this.remoteQuerySet;
    }
    timestamp() {
      return this.version.ts;
    }
  };
function wf(e) {
  let t = Ti(e);
  return mf.fromBytesLE(Array.from(t));
}
function Tf(e) {
  return Oi(new Uint8Array(e.toBytesLE()));
}
function Ef(e) {
  switch (e.type) {
    case `FatalError`:
    case `AuthError`:
    case `ActionResponse`:
    case `TransitionChunk`:
    case `Ping`:
      return { ...e };
    case `MutationResponse`:
      return e.success ? { ...e, ts: wf(e.ts) } : { ...e };
    case `Transition`:
      return {
        ...e,
        startVersion: { ...e.startVersion, ts: wf(e.startVersion.ts) },
        endVersion: { ...e.endVersion, ts: wf(e.endVersion.ts) },
      };
  }
}
function Df(e) {
  switch (e.type) {
    case `Authenticate`:
    case `ModifyQuerySet`:
    case `Mutation`:
    case `Action`:
    case `Event`:
      return { ...e };
    case `Connect`:
      return e.maxObservedTimestamp === void 0
        ? { ...e, maxObservedTimestamp: void 0 }
        : { ...e, maxObservedTimestamp: Tf(e.maxObservedTimestamp) };
  }
}
var Of = Object.defineProperty,
  kf = (e, t, n) =>
    t in e
      ? Of(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  Af = (e, t, n) => kf(e, typeof t == `symbol` ? t : t + ``, n),
  jf = 1e3,
  Mf = 1001,
  Nf = 1005,
  Pf = 4040,
  Ff;
function If() {
  return (
    Ff === void 0 && (Ff = Date.now()),
    typeof performance > `u` || !performance.now
      ? Date.now()
      : Math.round(Ff + performance.now())
  );
}
function Lf() {
  return `t=${Math.round((If() - Ff) / 100) / 10}s`;
}
var Rf = {
  InternalServerError: { timeout: 1e3 },
  SubscriptionsWorkerFullError: { timeout: 3e3 },
  TooManyConcurrentRequests: { timeout: 3e3 },
  CommitterFullError: { timeout: 3e3 },
  AwsTooManyRequestsException: { timeout: 3e3 },
  ExecuteFullError: { timeout: 3e3 },
  SystemTimeoutError: { timeout: 3e3 },
  ExpiredInQueue: { timeout: 3e3 },
  VectorIndexesUnavailable: { timeout: 1e3 },
  SearchIndexesUnavailable: { timeout: 1e3 },
  TableSummariesUnavailable: { timeout: 1e3 },
  VectorIndexTooLarge: { timeout: 3e3 },
  SearchIndexTooLarge: { timeout: 3e3 },
  TooManyWritesInTimePeriod: { timeout: 3e3 },
};
function zf(e) {
  if (e === void 0) return `Unknown`;
  for (let t of Object.keys(Rf)) if (e.startsWith(t)) return t;
  return `Unknown`;
}
var Bf = class {
  constructor(e, t, n, r, i, a) {
    ((this.markConnectionStateDirty = i),
      (this.debug = a),
      Af(this, `socket`),
      Af(this, `connectionCount`),
      Af(this, `_hasEverConnected`, !1),
      Af(this, `lastCloseReason`),
      Af(this, `transitionChunkBuffer`, null),
      Af(this, `defaultInitialBackoff`),
      Af(this, `maxBackoff`),
      Af(this, `retries`),
      Af(this, `serverInactivityThreshold`),
      Af(this, `reconnectDueToServerInactivityTimeout`),
      Af(this, `scheduledReconnect`, null),
      Af(this, `networkOnlineHandler`, null),
      Af(this, `pendingNetworkRecoveryInfo`, null),
      Af(this, `uri`),
      Af(this, `onOpen`),
      Af(this, `onResume`),
      Af(this, `onMessage`),
      Af(this, `webSocketConstructor`),
      Af(this, `logger`),
      Af(this, `onServerDisconnectError`),
      (this.webSocketConstructor = n),
      (this.socket = { state: `disconnected` }),
      (this.connectionCount = 0),
      (this.lastCloseReason = `InitialConnect`),
      (this.defaultInitialBackoff = 1e3),
      (this.maxBackoff = 16e3),
      (this.retries = 0),
      (this.serverInactivityThreshold = 6e4),
      (this.reconnectDueToServerInactivityTimeout = null),
      (this.uri = e),
      (this.onOpen = t.onOpen),
      (this.onResume = t.onResume),
      (this.onMessage = t.onMessage),
      (this.onServerDisconnectError = t.onServerDisconnectError),
      (this.logger = r),
      this.setupNetworkListener(),
      this.connect());
  }
  setSocketState(e) {
    ((this.socket = e),
      this._logVerbose(
        `socket state changed: ${this.socket.state}, paused: ${`paused` in this.socket ? this.socket.paused : void 0}`,
      ),
      this.markConnectionStateDirty());
  }
  setupNetworkListener() {
    typeof window > `u` ||
      typeof window.addEventListener != `function` ||
      (this.networkOnlineHandler === null &&
        ((this.networkOnlineHandler = () => {
          (this._logVerbose(`network online event detected`),
            this.tryReconnectImmediately());
        }),
        window.addEventListener(`online`, this.networkOnlineHandler),
        this._logVerbose(`network online event listener registered`)));
  }
  cleanupNetworkListener() {
    this.networkOnlineHandler &&
      typeof window < `u` &&
      typeof window.removeEventListener == `function` &&
      (window.removeEventListener(`online`, this.networkOnlineHandler),
      (this.networkOnlineHandler = null),
      this._logVerbose(`network online event listener removed`));
  }
  assembleTransition(e) {
    if (
      e.partNumber < 0 ||
      e.partNumber >= e.totalParts ||
      e.totalParts === 0 ||
      (this.transitionChunkBuffer &&
        (this.transitionChunkBuffer.totalParts !== e.totalParts ||
          this.transitionChunkBuffer.transitionId !== e.transitionId))
    )
      throw (
        (this.transitionChunkBuffer = null),
        Error(`Invalid TransitionChunk`)
      );
    if (
      (this.transitionChunkBuffer === null &&
        (this.transitionChunkBuffer = {
          chunks: [],
          totalParts: e.totalParts,
          transitionId: e.transitionId,
        }),
      e.partNumber !== this.transitionChunkBuffer.chunks.length)
    ) {
      let t = this.transitionChunkBuffer.chunks.length;
      throw (
        (this.transitionChunkBuffer = null),
        Error(
          `TransitionChunk received out of order: expected part ${t}, got ${e.partNumber}`,
        )
      );
    }
    if (
      (this.transitionChunkBuffer.chunks.push(e.chunk),
      this.transitionChunkBuffer.chunks.length === e.totalParts)
    ) {
      let e = this.transitionChunkBuffer.chunks.join(``);
      this.transitionChunkBuffer = null;
      let t = Ef(JSON.parse(e));
      if (t.type !== `Transition`)
        throw Error(
          `Expected Transition, got ${t.type} after assembling chunks`,
        );
      return t;
    }
    return null;
  }
  connect() {
    if (this.socket.state === `terminated`) return;
    if (this.socket.state !== `disconnected` && this.socket.state !== `stopped`)
      throw Error(
        `Didn't start connection from disconnected state: ` + this.socket.state,
      );
    let e = new this.webSocketConstructor(this.uri);
    (this._logVerbose(`constructed WebSocket`),
      this.setSocketState({ state: `connecting`, ws: e, paused: `no` }),
      this.resetServerInactivityTimeout(),
      (e.onopen = () => {
        if (
          (this.logger.logVerbose(`begin ws.onopen`),
          this.socket.state !== `connecting`)
        )
          throw Error(`onopen called with socket not in connecting state`);
        if (
          (this.setSocketState({
            state: `ready`,
            ws: e,
            paused: this.socket.paused === `yes` ? `uninitialized` : `no`,
          }),
          this.resetServerInactivityTimeout(),
          this.socket.paused === `no` &&
            ((this._hasEverConnected = !0),
            this.onOpen({
              connectionCount: this.connectionCount,
              lastCloseReason: this.lastCloseReason,
              clientTs: If(),
            })),
          this.lastCloseReason !== `InitialConnect` &&
            (this.lastCloseReason
              ? this.logger.log(
                  `WebSocket reconnected at`,
                  Lf(),
                  `after disconnect due to`,
                  this.lastCloseReason,
                )
              : this.logger.log(`WebSocket reconnected at`, Lf())),
          (this.connectionCount += 1),
          (this.lastCloseReason = null),
          this.pendingNetworkRecoveryInfo !== null)
        ) {
          let { timeSavedMs: e } = this.pendingNetworkRecoveryInfo;
          ((this.pendingNetworkRecoveryInfo = null),
            this.sendMessage({
              type: `Event`,
              eventType: `NetworkRecoveryReconnect`,
              event: { timeSavedMs: e },
            }),
            this.logger.log(
              `Network recovery reconnect saved ~${Math.round(e / 1e3)}s of waiting`,
            ));
        }
      }),
      (e.onerror = (e) => {
        this.transitionChunkBuffer = null;
        let t = e.message;
        t && this.logger.log(`WebSocket error message: ${t}`);
      }),
      (e.onmessage = (e) => {
        this.resetServerInactivityTimeout();
        let t = e.data.length,
          n = Ef(JSON.parse(e.data));
        if (
          (this._logVerbose(`received ws message with type ${n.type}`),
          n.type !== `Ping`)
        ) {
          if (n.type === `TransitionChunk`) {
            let e = this.assembleTransition(n);
            if (!e) return;
            ((n = e),
              this._logVerbose(`assembled full ws message of type ${n.type}`));
          }
          (this.transitionChunkBuffer !== null &&
            ((this.transitionChunkBuffer = null),
            this.logger.log(
              `Received unexpected ${n.type} while buffering TransitionChunks`,
            )),
            n.type === `Transition` &&
              this.reportLargeTransition({ messageLength: t, transition: n }),
            this.onMessage(n).hasSyncedPastLastReconnect &&
              ((this.retries = 0), this.markConnectionStateDirty()));
        }
      }),
      (e.onclose = (e) => {
        if (
          (this._logVerbose(`begin ws.onclose`),
          (this.transitionChunkBuffer = null),
          this.lastCloseReason === null &&
            (this.lastCloseReason = e.reason || `closed with code ${e.code}`),
          e.code !== jf && e.code !== Mf && e.code !== Nf && e.code !== Pf)
        ) {
          let t = `WebSocket closed with code ${e.code}`;
          (e.reason && (t += `: ${e.reason}`),
            this.logger.log(t),
            this.onServerDisconnectError &&
              e.reason &&
              this.onServerDisconnectError(t));
        }
        let t = zf(e.reason);
        this.scheduleReconnect(t);
      }));
  }
  socketState() {
    return this.socket.state;
  }
  sendMessage(e) {
    let t = {
      type: e.type,
      ...(e.type === `Authenticate` && e.tokenType === `User`
        ? { value: `...${e.value.slice(-7)}` }
        : {}),
    };
    if (this.socket.state === `ready` && this.socket.paused === `no`) {
      let n = Df(e),
        r = JSON.stringify(n),
        i = !1;
      try {
        (this.socket.ws.send(r), (i = !0));
      } catch (e) {
        (this.logger.log(
          `Failed to send message on WebSocket, reconnecting: ${e}`,
        ),
          this.closeAndReconnect(`FailedToSendMessage`));
      }
      return (
        this._logVerbose(
          `${i ? `sent` : `failed to send`} message with type ${e.type}: ${JSON.stringify(t)}`,
        ),
        !0
      );
    }
    return (
      this._logVerbose(
        `message not sent (socket state: ${this.socket.state}, paused: ${`paused` in this.socket ? this.socket.paused : void 0}): ${JSON.stringify(t)}`,
      ),
      !1
    );
  }
  resetServerInactivityTimeout() {
    this.socket.state !== `terminated` &&
      (this.reconnectDueToServerInactivityTimeout !== null &&
        (clearTimeout(this.reconnectDueToServerInactivityTimeout),
        (this.reconnectDueToServerInactivityTimeout = null)),
      (this.reconnectDueToServerInactivityTimeout = setTimeout(() => {
        this.closeAndReconnect(`InactiveServer`);
      }, this.serverInactivityThreshold)));
  }
  scheduleReconnect(e) {
    ((this.scheduledReconnect &&=
      (clearTimeout(this.scheduledReconnect.timeout), null)),
      (this.socket = { state: `disconnected` }));
    let t = this.nextBackoff(e);
    (this.markConnectionStateDirty(),
      this.logger.log(`Attempting reconnect in ${Math.round(t)}ms`));
    let n = If(),
      r = setTimeout(() => {
        this.scheduledReconnect?.timeout === r &&
          ((this.scheduledReconnect = null), this.connect());
      }, t);
    this.scheduledReconnect = { timeout: r, scheduledAt: n, backoffMs: t };
  }
  closeAndReconnect(e) {
    switch (
      (this._logVerbose(`begin closeAndReconnect with reason ${e}`),
      this.socket.state)
    ) {
      case `disconnected`:
      case `terminated`:
      case `stopped`:
        return;
      case `connecting`:
      case `ready`:
        ((this.lastCloseReason = e),
          this.close(),
          this.scheduleReconnect(`client`));
        return;
      default:
        this.socket;
    }
  }
  close() {
    switch (((this.transitionChunkBuffer = null), this.socket.state)) {
      case `disconnected`:
      case `terminated`:
      case `stopped`:
        return Promise.resolve();
      case `connecting`: {
        let e = this.socket.ws;
        return (
          (e.onmessage = (e) => {
            this._logVerbose(`Ignoring message received after close`);
          }),
          new Promise((t) => {
            ((e.onclose = () => {
              (this._logVerbose(`Closed after connecting`), t());
            }),
              (e.onopen = () => {
                (this._logVerbose(`Opened after connecting`), e.close());
              }));
          })
        );
      }
      case `ready`: {
        this._logVerbose(`ws.close called`);
        let e = this.socket.ws;
        e.onmessage = (e) => {
          this._logVerbose(`Ignoring message received after close`);
        };
        let t = new Promise((t) => {
          e.onclose = () => {
            t();
          };
        });
        return (e.close(), t);
      }
      default:
        return (this.socket, Promise.resolve());
    }
  }
  terminate() {
    switch (
      (this.reconnectDueToServerInactivityTimeout &&
        clearTimeout(this.reconnectDueToServerInactivityTimeout),
      (this.scheduledReconnect &&=
        (clearTimeout(this.scheduledReconnect.timeout), null)),
      this.cleanupNetworkListener(),
      this.socket.state)
    ) {
      case `terminated`:
      case `stopped`:
      case `disconnected`:
      case `connecting`:
      case `ready`: {
        let e = this.close();
        return (this.setSocketState({ state: `terminated` }), e);
      }
      default:
        throw (
          this.socket,
          Error(`Invalid websocket state: ${this.socket.state}`)
        );
    }
  }
  stop() {
    switch (this.socket.state) {
      case `terminated`:
        return Promise.resolve();
      case `connecting`:
      case `stopped`:
      case `disconnected`:
      case `ready`: {
        this.cleanupNetworkListener();
        let e = this.close();
        return ((this.socket = { state: `stopped` }), e);
      }
      default:
        return (this.socket, Promise.resolve());
    }
  }
  tryRestart() {
    switch (this.socket.state) {
      case `stopped`:
        break;
      case `terminated`:
      case `connecting`:
      case `ready`:
      case `disconnected`:
        this.logger.logVerbose(`Restart called without stopping first`);
        return;
      default:
        this.socket;
    }
    (this.setupNetworkListener(), this.connect());
  }
  pause() {
    switch (this.socket.state) {
      case `disconnected`:
      case `stopped`:
      case `terminated`:
        return;
      case `connecting`:
      case `ready`:
        this.socket = { ...this.socket, paused: `yes` };
        return;
      default:
        this.socket;
        return;
    }
  }
  tryReconnectImmediately() {
    if (
      (this._logVerbose(`tryReconnectImmediately called`),
      this.socket.state !== `disconnected`)
    ) {
      this._logVerbose(
        `tryReconnectImmediately called but socket state is ${this.socket.state}, no action taken`,
      );
      return;
    }
    let e = null;
    if (this.scheduledReconnect) {
      let t = If() - this.scheduledReconnect.scheduledAt;
      ((e = Math.max(0, this.scheduledReconnect.backoffMs - t)),
        this._logVerbose(
          `would have waited ${Math.round(e)}ms more (backoff was ${Math.round(this.scheduledReconnect.backoffMs)}ms, elapsed ${Math.round(t)}ms)`,
        ),
        clearTimeout(this.scheduledReconnect.timeout),
        (this.scheduledReconnect = null),
        this._logVerbose(`canceled scheduled reconnect`));
    }
    (this.logger.log(`Network recovery detected, reconnecting immediately`),
      (this.pendingNetworkRecoveryInfo =
        e === null ? null : { timeSavedMs: e }),
      this.connect());
  }
  resume() {
    switch (this.socket.state) {
      case `connecting`:
        this.socket = { ...this.socket, paused: `no` };
        return;
      case `ready`:
        this.socket.paused === `uninitialized`
          ? ((this.socket = { ...this.socket, paused: `no` }),
            (this._hasEverConnected = !0),
            this.onOpen({
              connectionCount: this.connectionCount,
              lastCloseReason: this.lastCloseReason,
              clientTs: If(),
            }))
          : this.socket.paused === `yes` &&
            ((this.socket = { ...this.socket, paused: `no` }), this.onResume());
        return;
      case `terminated`:
      case `stopped`:
      case `disconnected`:
        return;
      default:
        this.socket;
    }
    this.connect();
  }
  connectionState() {
    return {
      isConnected: this.socket.state === `ready`,
      hasEverConnected: this._hasEverConnected,
      connectionCount: this.connectionCount,
      connectionRetries: this.retries,
    };
  }
  _logVerbose(e) {
    this.logger.logVerbose(e);
  }
  nextBackoff(e) {
    let t =
      (e === `client`
        ? 100
        : e === `Unknown`
          ? this.defaultInitialBackoff
          : Rf[e].timeout) *
      2 ** this.retries;
    this.retries += 1;
    let n = Math.min(t, this.maxBackoff);
    return n + n * (Math.random() - 0.5);
  }
  reportLargeTransition({ transition: e, messageLength: t }) {
    if (e.clientClockSkew === void 0 || e.serverTs === void 0) return;
    let n = If() - e.clientClockSkew - e.serverTs / 1e6,
      r = `${Math.round(n)}ms`,
      i = `${Math.round(t / 1e4) / 100}MB`,
      a = t / (n / 1e3),
      o = `${Math.round(a / 1e4) / 100}MB per second`;
    (this._logVerbose(`received ${i} transition in ${r} at ${o}`),
      t > 2e7
        ? this.logger.log(
            `received query results totaling more that 20MB (${i}) which will take a long time to download on slower connections`,
          )
        : n > 2e4 &&
          this.logger.log(
            `received query results totaling ${i} which took more than 20s to arrive (${r})`,
          ),
      this.debug &&
        this.sendMessage({
          type: `Event`,
          eventType: `ClientReceivedTransition`,
          event: { transitionTransitTime: n, messageLength: t },
        }));
  }
};
function Vf() {
  return Hf();
}
function Hf() {
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (e) => {
    let t = (Math.random() * 16) | 0;
    return (e === `x` ? t : (t & 3) | 8).toString(16);
  });
}
var Uf = class extends Error {};
Uf.prototype.name = `InvalidTokenError`;
function Wf(e) {
  return decodeURIComponent(
    atob(e).replace(/(.)/g, (e, t) => {
      let n = t.charCodeAt(0).toString(16).toUpperCase();
      return (n.length < 2 && (n = `0` + n), `%` + n);
    }),
  );
}
function Gf(e) {
  let t = e.replace(/-/g, `+`).replace(/_/g, `/`);
  switch (t.length % 4) {
    case 0:
      break;
    case 2:
      t += `==`;
      break;
    case 3:
      t += `=`;
      break;
    default:
      throw Error(`base64 string is not of the correct length`);
  }
  try {
    return Wf(t);
  } catch {
    return atob(t);
  }
}
function Kf(e, t) {
  if (typeof e != `string`)
    throw new Uf(`Invalid token specified: must be a string`);
  t ||= {};
  let n = t.header === !0 ? 0 : 1,
    r = e.split(`.`)[n];
  if (typeof r != `string`)
    throw new Uf(`Invalid token specified: missing part #${n + 1}`);
  let i;
  try {
    i = Gf(r);
  } catch (e) {
    throw new Uf(
      `Invalid token specified: invalid base64 for part #${n + 1} (${e.message})`,
    );
  }
  try {
    return JSON.parse(i);
  } catch (e) {
    throw new Uf(
      `Invalid token specified: invalid json for part #${n + 1} (${e.message})`,
    );
  }
}
var qf = Object.defineProperty,
  Jf = (e, t, n) =>
    t in e
      ? qf(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  Yf = (e, t, n) => Jf(e, typeof t == `symbol` ? t : t + ``, n),
  Xf = 1728e6,
  Zf = 2,
  Qf = class {
    constructor(e, t, n) {
      (Yf(this, `authState`, { state: `noAuth` }),
        Yf(this, `configVersion`, 0),
        Yf(this, `syncState`),
        Yf(this, `authenticate`),
        Yf(this, `stopSocket`),
        Yf(this, `tryRestartSocket`),
        Yf(this, `pauseSocket`),
        Yf(this, `resumeSocket`),
        Yf(this, `clearAuth`),
        Yf(this, `logger`),
        Yf(this, `refreshTokenLeewaySeconds`),
        Yf(this, `initialAuthTokenReuse`),
        Yf(this, `lastRefreshChange`),
        Yf(this, `tokenConfirmationAttempts`, 0),
        (this.syncState = e),
        (this.authenticate = t.authenticate),
        (this.stopSocket = t.stopSocket),
        (this.tryRestartSocket = t.tryRestartSocket),
        (this.pauseSocket = t.pauseSocket),
        (this.resumeSocket = t.resumeSocket),
        (this.clearAuth = t.clearAuth),
        (this.logger = n.logger),
        (this.refreshTokenLeewaySeconds = n.refreshTokenLeewaySeconds),
        (this.initialAuthTokenReuse = n.initialAuthTokenReuse),
        (this.lastRefreshChange = !1));
    }
    notifyRefreshChange(e) {
      this.authState.state !== `noAuth` &&
        this.authState.state !== `initialRefetch` &&
        this.authState.config.onRefreshChange &&
        this.lastRefreshChange !== e &&
        ((this.lastRefreshChange = e),
        this.authState.config.onRefreshChange(e));
    }
    async setConfig(e, t, n) {
      (this.resetAuthState(),
        this._logVerbose(`pausing WS for auth token fetch`),
        this.pauseSocket());
      let r = await this.fetchTokenAndGuardAgainstRace(e, {
        forceRefreshToken: !1,
      });
      if (r.isFromOutdatedConfig) return;
      let i = { fetchToken: e, onAuthChange: t, onRefreshChange: n };
      (r.value
        ? (this.setAuthState({
            state: `waitingForServerConfirmationOfCachedToken`,
            config: i,
            hasRetried: !1,
          }),
          this.authenticate(r.value))
        : (this.setAuthState({ state: `initialRefetch`, config: i }),
          await this.refetchToken()),
        this._logVerbose(`resuming WS after auth token fetch`),
        this.resumeSocket());
    }
    onTransition(e) {
      if (
        this.syncState.isCurrentOrNewerAuthVersion(e.endVersion.identity) &&
        !(e.endVersion.identity <= e.startVersion.identity)
      ) {
        if (
          (this._logVerbose(
            `auth state is ${this.authState.state} when handling transition`,
          ),
          this.syncState.markAuthCompletion(),
          this.authState.state === `waitingForServerConfirmationOfCachedToken`)
        ) {
          this._logVerbose(`server confirmed auth token is valid`);
          let t = this.syncState.getAuth()?.value;
          (this.initialAuthTokenReuse && t
            ? this.scheduleTokenRefetch(t, e.clientClockSkew)
            : this.refetchToken(),
            this.authState.config.onAuthChange(!0));
          return;
        }
        this.authState.state === `waitingForServerConfirmationOfFreshToken` &&
          (this._logVerbose(`server confirmed new auth token is valid`),
          this.notifyRefreshChange(!1),
          this.scheduleTokenRefetch(this.authState.token),
          (this.tokenConfirmationAttempts = 0),
          this.authState.hadAuth || this.authState.config.onAuthChange(!0));
      }
    }
    onAuthError(e) {
      if (
        e.authUpdateAttempted === !1 &&
        (this.authState.state === `waitingForServerConfirmationOfFreshToken` ||
          this.authState.state === `waitingForServerConfirmationOfCachedToken`)
      ) {
        this._logVerbose(`ignoring non-auth token expired error`);
        return;
      }
      let { baseVersion: t } = e;
      if (!this.syncState.isCurrentOrNewerAuthVersion(t + 1)) {
        this._logVerbose(`ignoring auth error for previous auth attempt`);
        return;
      }
      this.tryToReauthenticate(e);
    }
    async tryToReauthenticate(e) {
      if (
        (this._logVerbose(`attempting to reauthenticate: ${e.error}`),
        this.authState.state === `noAuth` ||
          (this.authState.state ===
            `waitingForServerConfirmationOfFreshToken` &&
            this.tokenConfirmationAttempts >= Zf))
      ) {
        (this.logger.error(
          `Failed to authenticate: "${e.error}", check your server auth config`,
        ),
          this.syncState.hasAuth() && this.syncState.clearAuth(),
          this.authState.state !== `noAuth` &&
            this.setAndReportAuthFailed(this.authState.config.onAuthChange));
        return;
      }
      if (
        (this.authState.state === `waitingForServerConfirmationOfFreshToken` &&
          (this.tokenConfirmationAttempts++,
          this._logVerbose(
            `retrying reauthentication, ${Zf - this.tokenConfirmationAttempts} attempts remaining`,
          )),
        this.notifyRefreshChange(!0),
        await this.stopSocket(),
        this.authState.state === `noAuth`)
      )
        return;
      let t = await this.fetchTokenAndGuardAgainstRace(
        this.authState.config.fetchToken,
        { forceRefreshToken: !0 },
      );
      t.isFromOutdatedConfig ||
        (t.value && this.syncState.isNewAuth(t.value)
          ? (this.authenticate(t.value),
            this.setAuthState({
              state: `waitingForServerConfirmationOfFreshToken`,
              config: this.authState.config,
              token: t.value,
              hadAuth:
                this.authState.state === `notRefetching` ||
                this.authState.state === `waitingForScheduledRefetch`,
            }))
          : (this._logVerbose(
              `reauthentication failed, could not fetch a new token`,
            ),
            this.syncState.hasAuth() && this.syncState.clearAuth(),
            this.setAndReportAuthFailed(this.authState.config.onAuthChange)),
        this.tryRestartSocket());
    }
    async refetchToken() {
      if (this.authState.state === `noAuth`) return;
      this._logVerbose(`refetching auth token`);
      let e = await this.fetchTokenAndGuardAgainstRace(
        this.authState.config.fetchToken,
        { forceRefreshToken: !0 },
      );
      e.isFromOutdatedConfig ||
        (e.value
          ? this.syncState.isNewAuth(e.value)
            ? (this.setAuthState({
                state: `waitingForServerConfirmationOfFreshToken`,
                hadAuth: this.syncState.hasAuth(),
                token: e.value,
                config: this.authState.config,
              }),
              this.authenticate(e.value))
            : this.setAuthState({
                state: `notRefetching`,
                config: this.authState.config,
              })
          : (this._logVerbose(`refetching token failed`),
            this.syncState.hasAuth() && this.clearAuth(),
            this.setAndReportAuthFailed(this.authState.config.onAuthChange)),
        this._logVerbose(
          `restarting WS after auth token fetch (if currently stopped)`,
        ),
        this.tryRestartSocket());
    }
    scheduleTokenRefetch(e, t) {
      if (this.authState.state === `noAuth`) return;
      let n = this.decodeToken(e);
      if (!n) {
        this.logger.error(
          `Auth token is not a valid JWT, cannot refetch the token`,
        );
        return;
      }
      let { iat: r, exp: i } = n;
      if (!r || !i) {
        this.logger.error(
          `Auth token does not have required fields, cannot refetch the token`,
        );
        return;
      }
      let a = i - r;
      if (a <= 2) {
        this.logger.error(
          `Auth token does not live long enough, cannot refetch the token`,
        );
        return;
      }
      let o;
      t === void 0
        ? (o = a)
        : ((o = i - (Date.now() - t) / 1e3), o <= 0 && (o = 0));
      let s = Math.min(Xf, (o - this.refreshTokenLeewaySeconds) * 1e3);
      s <= 0 &&
        (this.logger.warn(
          `Refetching auth token immediately, configured leeway ${this.refreshTokenLeewaySeconds}s is larger than the token's lifetime ${o}s`,
        ),
        (s = 0));
      let c = setTimeout(() => {
        (this._logVerbose(`running scheduled token refetch`),
          this.refetchToken());
      }, s);
      (this.setAuthState({
        state: `waitingForScheduledRefetch`,
        refetchTokenTimeoutId: c,
        config: this.authState.config,
      }),
        this._logVerbose(
          `scheduled preemptive auth token refetching in ${s}ms`,
        ));
    }
    async fetchTokenAndGuardAgainstRace(e, t) {
      let n = ++this.configVersion;
      this._logVerbose(`fetching token with config version ${n}`);
      let r = await e(t);
      return this.configVersion === n
        ? { isFromOutdatedConfig: !1, value: r }
        : (this._logVerbose(
            `stale config version, expected ${n}, got ${this.configVersion}`,
          ),
          { isFromOutdatedConfig: !0 });
    }
    stop() {
      (this.resetAuthState(),
        this.configVersion++,
        this._logVerbose(`config version bumped to ${this.configVersion}`));
    }
    setAndReportAuthFailed(e) {
      (e(!1), this.resetAuthState());
    }
    resetAuthState() {
      (this.notifyRefreshChange(!1), this.setAuthState({ state: `noAuth` }));
    }
    setAuthState(e) {
      let t =
        e.state === `waitingForServerConfirmationOfFreshToken`
          ? {
              hadAuth: e.hadAuth,
              state: e.state,
              token: `...${e.token.slice(-7)}`,
            }
          : { state: e.state };
      switch (
        (this._logVerbose(`setting auth state to ${JSON.stringify(t)}`),
        e.state)
      ) {
        case `waitingForScheduledRefetch`:
        case `notRefetching`:
        case `noAuth`:
          this.tokenConfirmationAttempts = 0;
      }
      (this.authState.state === `waitingForScheduledRefetch` &&
        clearTimeout(this.authState.refetchTokenTimeoutId),
        (this.authState = e));
    }
    decodeToken(e) {
      try {
        return Kf(e);
      } catch (e) {
        return (
          this._logVerbose(
            `Error decoding token: ${e instanceof Error ? e.message : `Unknown error`}`,
          ),
          null
        );
      }
    }
    _logVerbose(e) {
      this.logger.logVerbose(`${e} [v${this.configVersion}]`);
    }
  },
  $f = [
    `convexClientConstructed`,
    `convexWebSocketOpen`,
    `convexFirstMessageReceived`,
  ];
function ep(e, t) {
  let n = { sessionId: t };
  typeof performance > `u` ||
    !performance.mark ||
    performance.mark(e, { detail: n });
}
function tp(e) {
  let t = e.name.slice(6);
  return (
    (t = t.charAt(0).toLowerCase() + t.slice(1)),
    { name: t, startTime: e.startTime }
  );
}
function np(e) {
  if (typeof performance > `u` || !performance.getEntriesByName) return [];
  let t = [];
  for (let n of $f) {
    let r = performance
      .getEntriesByName(n)
      .filter((e) => e.entryType === `mark`)
      .filter((t) => t.detail.sessionId === e);
    t.push(...r);
  }
  return t.map(tp);
}
var rp = Object.defineProperty,
  ip = (e, t, n) =>
    t in e
      ? rp(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  ap = (e, t, n) => ip(e, typeof t == `symbol` ? t : t + ``, n),
  op = class {
    constructor(e, t, n) {
      if (
        (ap(this, `address`),
        ap(this, `state`),
        ap(this, `requestManager`),
        ap(this, `webSocketManager`),
        ap(this, `authenticationManager`),
        ap(this, `remoteQuerySet`),
        ap(this, `optimisticQueryResults`),
        ap(this, `_transitionHandlerCounter`, 0),
        ap(this, `_nextRequestId`),
        ap(this, `_onTransitionFns`, new Map()),
        ap(this, `_sessionId`),
        ap(this, `firstMessageReceived`, !1),
        ap(this, `debug`),
        ap(this, `logger`),
        ap(this, `maxObservedTimestamp`),
        ap(this, `connectionStateSubscribers`, new Map()),
        ap(this, `nextConnectionStateSubscriberId`, 0),
        ap(this, `_lastPublishedConnectionState`),
        ap(this, `markConnectionStateDirty`, () => {
          Promise.resolve().then(() => {
            let e = this.connectionState();
            if (
              JSON.stringify(e) !==
              JSON.stringify(this._lastPublishedConnectionState)
            ) {
              this._lastPublishedConnectionState = e;
              for (let t of this.connectionStateSubscribers.values()) t(e);
            }
          });
        }),
        ap(this, `mark`, (e) => {
          this.debug && ep(e, this.sessionId);
        }),
        typeof e == `object`)
      )
        throw Error(
          `Passing a ClientConfig object is no longer supported. Pass the URL of the Convex deployment as a string directly.`,
        );
      (n?.skipConvexDeploymentUrlCheck !== !0 && Ai(e), (n = { ...n }));
      let r = n.authRefreshTokenLeewaySeconds ?? 10,
        i = n.webSocketConstructor;
      if (!i && typeof WebSocket > `u`)
        throw Error(
          `No WebSocket global variable defined! To use Convex in an environment without WebSocket try the HTTP client: https://docs.convex.dev/api/classes/browser.ConvexHttpClient`,
        );
      ((i ||= WebSocket),
        (this.debug = n.reportDebugInfoToConvex ?? !1),
        (this.address = e),
        (this.logger =
          n.logger === !1
            ? Fd({ verbose: n.verbose ?? !1 })
            : n.logger !== !0 && n.logger
              ? n.logger
              : Pd({ verbose: n.verbose ?? !1 })));
      let a = e.search(`://`);
      if (a === -1) throw Error(`Provided address was not an absolute URL.`);
      let o = e.substring(a + 3),
        s = e.substring(0, a),
        c;
      if (s === `http`) c = `ws`;
      else if (s === `https`) c = `wss`;
      else throw Error(`Unknown parent protocol ${s}`);
      let l = `${c}://${o}/api/${Dd}/sync`;
      ((this.state = new Gd()),
        (this.remoteQuerySet = new Cf(
          (e) => this.state.queryPath(e),
          this.logger,
        )),
        (this.requestManager = new Yd(
          this.logger,
          this.markConnectionStateDirty,
        )));
      let u = () => {
        (this.webSocketManager.pause(), this.state.pause());
      };
      ((this.authenticationManager = new Qf(
        this.state,
        {
          authenticate: (e) => {
            let t = this.state.setAuth(e);
            return (this.webSocketManager.sendMessage(t), t.baseVersion);
          },
          stopSocket: () => this.webSocketManager.stop(),
          tryRestartSocket: () => this.webSocketManager.tryRestart(),
          pauseSocket: u,
          resumeSocket: () => this.webSocketManager.resume(),
          clearAuth: () => {
            this.clearAuth();
          },
        },
        {
          logger: this.logger,
          refreshTokenLeewaySeconds: r,
          initialAuthTokenReuse: n.initialAuthTokenReuse ?? !1,
        },
      )),
        (this.optimisticQueryResults = new uf()),
        this.addOnTransitionHandler((e) => {
          t(e.queries.map((e) => e.token));
        }),
        (this._nextRequestId = 0),
        (this._sessionId = Vf()));
      let { unsavedChangesWarning: d } = n;
      if (typeof window > `u` || window.addEventListener === void 0) {
        if (d === !0)
          throw Error(
            `unsavedChangesWarning requested, but window.addEventListener not found! Remove {unsavedChangesWarning: true} from Convex client options.`,
          );
      } else
        d !== !1 &&
          window.addEventListener(`beforeunload`, (e) => {
            if (this.requestManager.hasIncompleteRequests()) {
              e.preventDefault();
              let t = `Are you sure you want to leave? Your changes may not be saved.`;
              return (((e || window.event).returnValue = t), t);
            }
          });
      ((this.webSocketManager = new Bf(
        l,
        {
          onOpen: (e) => {
            (this.mark(`convexWebSocketOpen`),
              this.webSocketManager.sendMessage({
                ...e,
                type: `Connect`,
                sessionId: this._sessionId,
                maxObservedTimestamp: this.maxObservedTimestamp,
              }),
              (this.remoteQuerySet = new Cf(
                (e) => this.state.queryPath(e),
                this.logger,
              )));
            let [t, n] = this.state.restart();
            (n && this.webSocketManager.sendMessage(n),
              this.webSocketManager.sendMessage(t));
            for (let e of this.requestManager.restart())
              this.webSocketManager.sendMessage(e);
          },
          onResume: () => {
            let [e, t] = this.state.resume();
            (t && this.webSocketManager.sendMessage(t),
              e && this.webSocketManager.sendMessage(e));
            for (let e of this.requestManager.resume())
              this.webSocketManager.sendMessage(e);
          },
          onMessage: (e) => {
            switch (
              (this.firstMessageReceived ||
                ((this.firstMessageReceived = !0),
                this.mark(`convexFirstMessageReceived`),
                this.reportMarks()),
              e.type)
            ) {
              case `Transition`: {
                (this.observedTimestamp(e.endVersion.ts),
                  this.authenticationManager.onTransition(e),
                  this.remoteQuerySet.transition(e),
                  this.state.transition(e));
                let t = this.requestManager.removeCompleted(
                  this.remoteQuerySet.timestamp(),
                );
                this.notifyOnQueryResultChanges(t);
                break;
              }
              case `MutationResponse`: {
                e.success && this.observedTimestamp(e.ts);
                let t = this.requestManager.onResponse(e);
                t !== null &&
                  this.notifyOnQueryResultChanges(
                    new Map([[t.requestId, t.result]]),
                  );
                break;
              }
              case `ActionResponse`:
                this.requestManager.onResponse(e);
                break;
              case `AuthError`:
                this.authenticationManager.onAuthError(e);
                break;
              case `FatalError`: {
                let t = Id(this.logger, e.error);
                throw (this.webSocketManager.terminate(), t);
              }
            }
            return {
              hasSyncedPastLastReconnect: this.hasSyncedPastLastReconnect(),
            };
          },
          onServerDisconnectError: n.onServerDisconnectError,
        },
        i,
        this.logger,
        this.markConnectionStateDirty,
        this.debug,
      )),
        this.mark(`convexClientConstructed`),
        n.expectAuth && u());
    }
    hasSyncedPastLastReconnect() {
      return (
        this.requestManager.hasSyncedPastLastReconnect() &&
        this.state.hasSyncedPastLastReconnect()
      );
    }
    observedTimestamp(e) {
      (this.maxObservedTimestamp === void 0 ||
        this.maxObservedTimestamp.lessThanOrEqual(e)) &&
        (this.maxObservedTimestamp = e);
    }
    getMaxObservedTimestamp() {
      return this.maxObservedTimestamp;
    }
    notifyOnQueryResultChanges(e) {
      let t = this.remoteQuerySet.remoteQueryResults(),
        n = new Map();
      for (let [e, r] of t) {
        let t = this.state.queryToken(e);
        if (t !== null) {
          let i = {
            result: r,
            udfPath: this.state.queryPath(e),
            args: this.state.queryArgs(e),
          };
          n.set(t, i);
        }
      }
      let r = this.optimisticQueryResults.ingestQueryResultsFromServer(
        n,
        new Set(e.keys()),
      );
      this.handleTransition({
        queries: r.map((e) => ({
          token: e,
          modification: {
            kind: `Updated`,
            result: this.optimisticQueryResults.rawQueryResult(e),
          },
        })),
        reflectedMutations: Array.from(e).map(([e, t]) => ({
          requestId: e,
          result: t,
        })),
        timestamp: this.remoteQuerySet.timestamp(),
      });
    }
    handleTransition(e) {
      for (let t of this._onTransitionFns.values()) t(e);
    }
    addOnTransitionHandler(e) {
      let t = this._transitionHandlerCounter++;
      return (
        this._onTransitionFns.set(t, e),
        () => this._onTransitionFns.delete(t)
      );
    }
    getCurrentAuthClaims() {
      let e = this.state.getAuth(),
        t = {};
      if (e && e.tokenType === `User`)
        try {
          t = e ? Kf(e.value) : {};
        } catch {
          t = {};
        }
      else return;
      return { token: e.value, decoded: t };
    }
    setAuth(e, t, n) {
      this.authenticationManager.setConfig(e, t, n);
    }
    hasAuth() {
      return this.state.hasAuth();
    }
    setAdminAuth(e, t) {
      let n = this.state.setAdminAuth(e, t);
      this.webSocketManager.sendMessage(n);
    }
    clearAuth() {
      let e = this.state.clearAuth();
      this.webSocketManager.sendMessage(e);
    }
    subscribe(e, t, n) {
      let r = ki(t),
        {
          modification: i,
          queryToken: a,
          unsubscribe: o,
        } = this.state.subscribe(e, r, n?.journal, n?.componentPath);
      return (
        i !== null && this.webSocketManager.sendMessage(i),
        {
          queryToken: a,
          unsubscribe: () => {
            let e = o();
            e && this.webSocketManager.sendMessage(e);
          },
        }
      );
    }
    localQueryResult(e, t) {
      let n = Bd(e, ki(t));
      return this.optimisticQueryResults.queryResult(n);
    }
    localQueryResultByToken(e) {
      return this.optimisticQueryResults.queryResult(e);
    }
    hasLocalQueryResultByToken(e) {
      return this.optimisticQueryResults.hasQueryResult(e);
    }
    localQueryLogs(e, t) {
      let n = Bd(e, ki(t));
      return this.optimisticQueryResults.queryLogs(n);
    }
    queryJournal(e, t) {
      let n = Bd(e, ki(t));
      return this.state.queryJournal(n);
    }
    connectionState() {
      let e = this.webSocketManager.connectionState();
      return {
        hasInflightRequests: this.requestManager.hasInflightRequests(),
        isWebSocketConnected: e.isConnected,
        hasEverConnected: e.hasEverConnected,
        connectionCount: e.connectionCount,
        connectionRetries: e.connectionRetries,
        timeOfOldestInflightRequest:
          this.requestManager.timeOfOldestInflightRequest(),
        inflightMutations: this.requestManager.inflightMutations(),
        inflightActions: this.requestManager.inflightActions(),
      };
    }
    subscribeToConnectionState(e) {
      let t = this.nextConnectionStateSubscriberId++;
      return (
        this.connectionStateSubscribers.set(t, e),
        () => {
          this.connectionStateSubscribers.delete(t);
        }
      );
    }
    async mutation(e, t, n) {
      let r = await this.mutationInternal(e, t, n);
      if (!r.success)
        throw r.errorData === void 0
          ? Error(Ld(`mutation`, e, r))
          : Rd(r, new ca(Ld(`mutation`, e, r)));
      return r.value;
    }
    async mutationInternal(e, t, n, r) {
      let { mutationPromise: i } = this.enqueueMutation(e, t, n, r);
      return i;
    }
    enqueueMutation(e, t, n, r) {
      let i = ki(t);
      this.tryReportLongDisconnect();
      let a = this.nextRequestId;
      if ((this._nextRequestId++, n !== void 0)) {
        let e = n.optimisticUpdate;
        if (e !== void 0) {
          let t = this.optimisticQueryResults
            .applyOptimisticUpdate((t) => {
              e(t, i) instanceof Promise &&
                this.logger.warn(
                  `Optimistic update handler returned a Promise. Optimistic updates should be synchronous.`,
                );
            }, a)
            .map((e) => {
              let t = this.localQueryResultByToken(e);
              return {
                token: e,
                modification: {
                  kind: `Updated`,
                  result:
                    t === void 0
                      ? void 0
                      : { success: !0, value: t, logLines: [] },
                },
              };
            });
          this.handleTransition({
            queries: t,
            reflectedMutations: [],
            timestamp: this.remoteQuerySet.timestamp(),
          });
        }
      }
      let o = {
          type: `Mutation`,
          requestId: a,
          udfPath: e,
          componentPath: r,
          args: [ta(i)],
        },
        s = this.webSocketManager.sendMessage(o);
      return {
        requestId: a,
        mutationPromise: this.requestManager.request(o, s),
      };
    }
    async action(e, t) {
      let n = await this.actionInternal(e, t);
      if (!n.success)
        throw n.errorData === void 0
          ? Error(Ld(`action`, e, n))
          : Rd(n, new ca(Ld(`action`, e, n)));
      return n.value;
    }
    async actionInternal(e, t, n) {
      let r = ki(t),
        i = this.nextRequestId;
      (this._nextRequestId++, this.tryReportLongDisconnect());
      let a = {
          type: `Action`,
          requestId: i,
          udfPath: e,
          componentPath: n,
          args: [ta(r)],
        },
        o = this.webSocketManager.sendMessage(a);
      return this.requestManager.request(a, o);
    }
    async close() {
      return (
        this.authenticationManager.stop(),
        this.webSocketManager.terminate()
      );
    }
    get url() {
      return this.address;
    }
    get nextRequestId() {
      return this._nextRequestId;
    }
    get sessionId() {
      return this._sessionId;
    }
    reportMarks() {
      if (this.debug) {
        let e = np(this.sessionId);
        this.webSocketManager.sendMessage({
          type: `Event`,
          eventType: `ClientConnect`,
          event: e,
        });
      }
    }
    tryReportLongDisconnect() {
      if (!this.debug) return;
      let e = this.connectionState().timeOfOldestInflightRequest;
      if (e === null || Date.now() - e.getTime() <= 6e4) return;
      let t = `${this.address}/api/debug_event`;
      fetch(t, {
        method: `POST`,
        headers: {
          "Content-Type": `application/json`,
          "Convex-Client": `npm-${Dd}`,
        },
        body: JSON.stringify({ event: `LongWebsocketDisconnect` }),
      })
        .then((e) => {
          e.ok ||
            this.logger.warn(`Analytics request failed with response:`, e.body);
        })
        .catch((e) => {
          this.logger.warn(`Analytics response failed with error:`, e);
        });
    }
  };
function sp(e) {
  if (
    typeof e != `object` ||
    !e ||
    !Array.isArray(e.page) ||
    typeof e.isDone != `boolean` ||
    typeof e.continueCursor != `string`
  )
    throw Error(`Not a valid paginated query result: ${e?.toString()}`);
  return e;
}
var cp = Object.defineProperty,
  lp = (e, t, n) =>
    t in e
      ? cp(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  up = (e, t, n) => lp(e, typeof t == `symbol` ? t : t + ``, n),
  dp = class {
    constructor(e, t) {
      ((this.client = e),
        (this.onTransition = t),
        up(this, `paginatedQuerySet`, new Map()),
        up(this, `lastTransitionTs`),
        (this.lastTransitionTs = mf.fromNumber(0)),
        this.client.addOnTransitionHandler((e) => this.onBaseTransition(e)));
    }
    subscribe(e, t, n) {
      let r = zd(e),
        i = Vd(r, t, n),
        a = () => this.removePaginatedQuerySubscriber(i),
        o = this.paginatedQuerySet.get(i);
      return o
        ? ((o.numSubscribers += 1), { paginatedQueryToken: i, unsubscribe: a })
        : (this.paginatedQuerySet.set(i, {
            token: i,
            canonicalizedUdfPath: r,
            args: t,
            numSubscribers: 1,
            options: { initialNumItems: n.initialNumItems },
            nextPageKey: 0,
            pageKeys: [],
            pageKeyToQuery: new Map(),
            ongoingSplits: new Map(),
            skip: !1,
            id: n.id,
          }),
          this.addPageToPaginatedQuery(i, null, n.initialNumItems),
          { paginatedQueryToken: i, unsubscribe: a });
    }
    localQueryResult(e, t, n) {
      let r = Vd(zd(e), t, n);
      return this.localQueryResultByToken(r);
    }
    localQueryResultByToken(e) {
      let t = this.paginatedQuerySet.get(e);
      if (!t) return;
      let n = this.activePageQueryTokens(t);
      if (n.length === 0)
        return {
          results: [],
          status: `LoadingFirstPage`,
          loadMore: (t) => this.loadMoreOfPaginatedQuery(e, t),
        };
      let r = [],
        i = !1,
        a = !1;
      for (let e of n) {
        let t = this.client.localQueryResultByToken(e);
        if (t === void 0) {
          ((i = !0), (a = !1));
          continue;
        }
        let n = sp(t);
        ((r = r.concat(n.page)), (a = !!n.isDone));
      }
      let o;
      return (
        (o = i
          ? r.length === 0
            ? `LoadingFirstPage`
            : `LoadingMore`
          : a
            ? `Exhausted`
            : `CanLoadMore`),
        {
          results: r,
          status: o,
          loadMore: (t) => this.loadMoreOfPaginatedQuery(e, t),
        }
      );
    }
    onBaseTransition(e) {
      let t = e.queries.map((e) => e.token),
        n = this.queriesContainingTokens(t),
        r = [];
      n.length > 0 &&
        (this.processPaginatedQuerySplits(n, (e) =>
          this.client.localQueryResultByToken(e),
        ),
        (r = n.map((e) => ({
          token: e,
          modification: {
            kind: `Updated`,
            result: this.localQueryResultByToken(e),
          },
        }))));
      let i = { ...e, paginatedQueries: r };
      this.onTransition(i);
    }
    loadMoreOfPaginatedQuery(e, t) {
      this.mustGetPaginatedQuery(e);
      let n = this.queryTokenForLastPageOfPaginatedQuery(e),
        r = this.client.localQueryResultByToken(n);
      if (!r) return !1;
      let i = sp(r);
      if (i.isDone) return !1;
      this.addPageToPaginatedQuery(e, i.continueCursor, t);
      let a = {
        timestamp: this.lastTransitionTs,
        reflectedMutations: [],
        queries: [],
        paginatedQueries: [
          {
            token: e,
            modification: {
              kind: `Updated`,
              result: this.localQueryResultByToken(e),
            },
          },
        ],
      };
      return (this.onTransition(a), !0);
    }
    queriesContainingTokens(e) {
      if (e.length === 0) return [];
      let t = [],
        n = new Set(e);
      for (let [e, r] of this.paginatedQuerySet)
        for (let i of this.allQueryTokens(r))
          if (n.has(i)) {
            t.push(e);
            break;
          }
      return t;
    }
    processPaginatedQuerySplits(e, t) {
      for (let n of e) {
        let e = this.mustGetPaginatedQuery(n),
          { ongoingSplits: r, pageKeyToQuery: i, pageKeys: a } = e;
        for (let [n, [a, o]] of r)
          t(i.get(a).queryToken) !== void 0 &&
            t(i.get(o).queryToken) !== void 0 &&
            this.completePaginatedQuerySplit(e, n, a, o);
        for (let n of a) {
          if (r.has(n)) continue;
          let a = i.get(n);
          if (!a) throw Error(`No page query for active pageKey ${n}`);
          let o = t(a.queryToken);
          if (!o) continue;
          let s = sp(o);
          s.splitCursor &&
            (s.pageStatus === `SplitRecommended` ||
              s.pageStatus === `SplitRequired` ||
              s.page.length > e.options.initialNumItems * 2) &&
            this.splitPaginatedQueryPage(
              e,
              n,
              a.cursor,
              s.splitCursor,
              s.continueCursor,
            );
        }
      }
    }
    splitPaginatedQueryPage(e, t, n, r, i) {
      let a = e.nextPageKey++,
        o = e.nextPageKey++,
        s = { numItems: e.options.initialNumItems, id: e.id },
        c = this.client.subscribe(e.canonicalizedUdfPath, {
          ...e.args,
          paginationOpts: { ...s, cursor: n, endCursor: r },
        });
      e.pageKeyToQuery.set(a, { ...c, cursor: n });
      let l = this.client.subscribe(e.canonicalizedUdfPath, {
        ...e.args,
        paginationOpts: { ...s, cursor: r, endCursor: i },
      });
      (e.pageKeyToQuery.set(o, { ...l, cursor: r }),
        e.ongoingSplits.set(t, [a, o]));
    }
    addPageToPaginatedQuery(e, t, n) {
      let r = this.mustGetPaginatedQuery(e),
        i = r.nextPageKey++,
        a = { cursor: t, numItems: n, id: r.id },
        o = { ...r.args, paginationOpts: a },
        s = this.client.subscribe(r.canonicalizedUdfPath, o);
      return (
        r.pageKeys.push(i),
        r.pageKeyToQuery.set(i, { ...s, cursor: t }),
        s
      );
    }
    removePaginatedQuerySubscriber(e) {
      let t = this.paginatedQuerySet.get(e);
      if (t && (--t.numSubscribers, !(t.numSubscribers > 0))) {
        for (let e of t.pageKeyToQuery.values()) e.unsubscribe();
        this.paginatedQuerySet.delete(e);
      }
    }
    completePaginatedQuerySplit(e, t, n, r) {
      let i = e.pageKeyToQuery.get(t);
      e.pageKeyToQuery.delete(t);
      let a = e.pageKeys.indexOf(t);
      (e.pageKeys.splice(a, 1, n, r),
        e.ongoingSplits.delete(t),
        i.unsubscribe());
    }
    activePageQueryTokens(e) {
      return e.pageKeys.map((t) => e.pageKeyToQuery.get(t).queryToken);
    }
    allQueryTokens(e) {
      return Array.from(e.pageKeyToQuery.values()).map((e) => e.queryToken);
    }
    queryTokenForLastPageOfPaginatedQuery(e) {
      let t = this.mustGetPaginatedQuery(e),
        n = t.pageKeys[t.pageKeys.length - 1];
      if (n === void 0) throw Error(`No pages for paginated query ${e}`);
      return t.pageKeyToQuery.get(n).queryToken;
    }
    mustGetPaginatedQuery(e) {
      let t = this.paginatedQuerySet.get(e);
      if (!t) throw Error(`paginated query no longer exists for token ` + e);
      return t;
    }
  },
  fp = Object.defineProperty,
  pp = (e, t, n) =>
    t in e
      ? fp(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  mp = (e, t, n) => pp(e, typeof t == `symbol` ? t : t + ``, n),
  hp = 5e3;
if (x.default === void 0) throw Error(`Required dependency 'react' not found`);
function gp(e, t, n) {
  function r(r) {
    return (xp(r), t.mutation(e, r, { optimisticUpdate: n }));
  }
  return (
    (r.withOptimisticUpdate = function (r) {
      if (n !== void 0)
        throw Error(
          `Already specified optimistic update for mutation ${tf(e)}`,
        );
      return gp(e, t, r);
    }),
    r
  );
}
var _p = class {
    constructor(e, t) {
      if (
        (mp(this, `address`),
        mp(this, `cachedSync`),
        mp(this, `cachedPaginatedQueryClient`),
        mp(this, `listeners`),
        mp(this, `options`),
        mp(this, `closed`, !1),
        mp(this, `_logger`),
        mp(this, `adminAuth`),
        mp(this, `fakeUserIdentity`),
        e === void 0)
      )
        throw Error(`No address provided to ConvexReactClient.
If trying to deploy to production, make sure to follow all the instructions found at https://docs.convex.dev/production/hosting/
If running locally, make sure to run \`convex dev\` and ensure the .env.local file is populated.`);
      if (typeof e != `string`)
        throw Error(
          `ConvexReactClient requires a URL like 'https://happy-otter-123.convex.cloud', received something of type ${typeof e} instead.`,
        );
      if (!e.includes(`://`))
        throw Error(`Provided address was not an absolute URL.`);
      ((this.address = e),
        (this.listeners = new Map()),
        (this._logger =
          t?.logger === !1
            ? Fd({ verbose: t?.verbose ?? !1 })
            : t?.logger !== !0 && t?.logger
              ? t.logger
              : Pd({ verbose: t?.verbose ?? !1 })),
        (this.options = { ...t, logger: this._logger }));
    }
    get url() {
      return this.address;
    }
    get sync() {
      if (this.closed)
        throw Error(`ConvexReactClient has already been closed.`);
      return this.cachedSync
        ? this.cachedSync
        : ((this.cachedSync =
            this.options.baseClient ??
            new op(this.address, () => {}, this.options)),
          this.adminAuth &&
            this.cachedSync.setAdminAuth(this.adminAuth, this.fakeUserIdentity),
          (this.cachedPaginatedQueryClient = new dp(this.cachedSync, (e) =>
            this.handleTransition(e),
          )),
          this.cachedSync);
    }
    get paginatedQueryClient() {
      if ((this.sync, this.cachedPaginatedQueryClient))
        return this.cachedPaginatedQueryClient;
      throw Error(`Should already be instantiated`);
    }
    setAuth(e, t, n) {
      if (typeof e == `string`)
        throw Error(
          `Passing a string to ConvexReactClient.setAuth is no longer supported, please upgrade to passing in an async function to handle reauthentication.`,
        );
      this.sync.setAuth(e, t ?? (() => {}), n);
    }
    clearAuth() {
      this.sync.clearAuth();
    }
    setAdminAuth(e, t) {
      if (((this.adminAuth = e), (this.fakeUserIdentity = t), this.closed))
        throw Error(`ConvexReactClient has already been closed.`);
      this.cachedSync && this.sync.setAdminAuth(e, t);
    }
    watchQuery(e, ...t) {
      let [n, r] = t,
        i = tf(e);
      return {
        onUpdate: (e) => {
          let { queryToken: t, unsubscribe: a } = this.sync.subscribe(i, n, r),
            o = this.listeners.get(t);
          return (
            o === void 0 ? this.listeners.set(t, new Set([e])) : o.add(e),
            () => {
              if (this.closed) return;
              let n = this.listeners.get(t);
              (n.delete(e), n.size === 0 && this.listeners.delete(t), a());
            }
          );
        },
        localQueryResult: () => {
          if (this.cachedSync) return this.cachedSync.localQueryResult(i, n);
        },
        localQueryLogs: () => {
          if (this.cachedSync) return this.cachedSync.localQueryLogs(i, n);
        },
        journal: () => {
          if (this.cachedSync) return this.cachedSync.queryJournal(i, n);
        },
      };
    }
    prewarmQuery(e) {
      let t = e.extendSubscriptionFor ?? hp,
        n = this.watchQuery(e.query, e.args || {}).onUpdate(() => {});
      setTimeout(n, t);
    }
    watchPaginatedQuery(e, t, n) {
      let r = tf(e);
      return {
        onUpdate: (e) => {
          let { paginatedQueryToken: i, unsubscribe: a } =
              this.paginatedQueryClient.subscribe(r, t || {}, n),
            o = this.listeners.get(i);
          return (
            o === void 0 ? this.listeners.set(i, new Set([e])) : o.add(e),
            () => {
              if (this.closed) return;
              let t = this.listeners.get(i);
              (t.delete(e), t.size === 0 && this.listeners.delete(i), a());
            }
          );
        },
        localQueryResult: () =>
          this.paginatedQueryClient.localQueryResult(r, t, n),
      };
    }
    mutation(e, ...t) {
      let [n, r] = t,
        i = tf(e);
      return this.sync.mutation(i, n, r);
    }
    action(e, ...t) {
      let n = tf(e);
      return this.sync.action(n, ...t);
    }
    query(e, ...t) {
      let n = this.watchQuery(e, ...t),
        r = n.localQueryResult();
      return r === void 0
        ? new Promise((e, t) => {
            let r = n.onUpdate(() => {
              r();
              try {
                e(n.localQueryResult());
              } catch (e) {
                t(e);
              }
            });
          })
        : Promise.resolve(r);
    }
    connectionState() {
      return this.sync.connectionState();
    }
    subscribeToConnectionState(e) {
      return this.sync.subscribeToConnectionState(e);
    }
    get logger() {
      return this._logger;
    }
    async close() {
      if (
        ((this.closed = !0),
        (this.listeners = new Map()),
        (this.cachedPaginatedQueryClient &&= void 0),
        this.cachedSync)
      ) {
        let e = this.cachedSync;
        ((this.cachedSync = void 0), await e.close());
      }
    }
    handleTransition(e) {
      let t = e.queries.map((e) => e.token),
        n = e.paginatedQueries.map((e) => e.token);
      this.transition([...t, ...n]);
    }
    transition(e) {
      for (let t of e) {
        let e = this.listeners.get(t);
        if (e) for (let t of e) t();
      }
    }
  },
  vp = x.createContext(void 0),
  yp = ({ client: e, children: t }) =>
    x.createElement(vp.Provider, { value: e }, t);
function bp(e) {
  let t = typeof e == `string` ? nf(e) : e,
    n = (0, x.useContext)(vp);
  if (n === void 0)
    throw Error(
      "Could not find Convex client! `useMutation` must be used in the React component tree under `ConvexProvider`. Did you forget it? See https://docs.convex.dev/quick-start#set-up-convex-in-your-react-app",
    );
  return (0, x.useMemo)(() => gp(t, n), [n, tf(t)]);
}
function xp(e) {
  if (
    typeof e == `object` &&
    e &&
    `bubbles` in e &&
    `persist` in e &&
    `isDefaultPrevented` in e
  )
    throw Error(
      "Convex function called with SyntheticEvent object. Did you use a Convex function as an event handler directly? Event handlers like onClick receive an event object as their first argument. These SyntheticEvent objects are not valid Convex values. Try wrapping the function like `const handler = () => myMutation();` and using `handler` in the event handler.",
    );
}
var Sp = (0, x.createContext)(void 0);
function Cp() {
  let e = (0, x.useContext)(Sp);
  if (e === void 0)
    throw Error(
      "Could not find `ConvexProviderWithAuth` (or `ConvexProviderWithClerk` or `ConvexProviderWithAuth0`) as an ancestor component. This component may be missing, or you might have two instances of the `convex/react` module loaded in your project.",
    );
  return e;
}
function wp({ children: e, client: t, useAuth: n }) {
  let { isLoading: r, isAuthenticated: i, fetchAccessToken: a } = n(),
    [o, s] = (0, x.useState)(null),
    [c, l] = (0, x.useState)(!1);
  (r && o !== null && (s(null), l(!1)), !r && !i && o !== !1 && (s(!1), l(!1)));
  let u = i && (o ?? !1);
  return x.createElement(
    Sp.Provider,
    {
      value: {
        isLoading: o === null,
        isAuthenticated: u,
        isRefreshing: c && u,
      },
    },
    x.createElement(Tp, {
      authProviderAuthenticated: i,
      fetchAccessToken: a,
      authProviderLoading: r,
      client: t,
      setIsConvexAuthenticated: s,
      setIsRefreshing: l,
    }),
    x.createElement(yp, { client: t }, e),
    x.createElement(Ep, {
      authProviderAuthenticated: i,
      fetchAccessToken: a,
      authProviderLoading: r,
      client: t,
      setIsConvexAuthenticated: s,
      setIsRefreshing: l,
    }),
  );
}
function Tp({
  authProviderAuthenticated: e,
  fetchAccessToken: t,
  authProviderLoading: n,
  client: r,
  setIsConvexAuthenticated: i,
  setIsRefreshing: a,
}) {
  return (
    (0, x.useEffect)(() => {
      let n = !0;
      if (e)
        return (
          r.setAuth(
            t,
            (e) => {
              n && i(() => e);
            },
            (e) => {
              n && a(e);
            },
          ),
          () => {
            ((n = !1), i((e) => !e && null), a(!1));
          }
        );
    }, [e, t, n, r, i, a]),
    null
  );
}
function Ep({
  authProviderAuthenticated: e,
  fetchAccessToken: t,
  authProviderLoading: n,
  client: r,
  setIsConvexAuthenticated: i,
  setIsRefreshing: a,
}) {
  return (
    (0, x.useEffect)(() => {
      if (e)
        return () => {
          (r.clearAuth(), i(() => null), a(!1));
        };
    }, [e, t, n, r, i, a]),
    null
  );
}
var Dp = 36e5;
function Op(e, t) {
  try {
    return Un(e).exp * 1e3 - Date.now() < t;
  } catch {
    return !0;
  }
}
function kp() {
  let { isAuthenticated: e, user: t, isLoading: n, signinSilent: r } = gi(),
    i = t?.id_token,
    a = t?.profile?.iss,
    o = t?.profile?.sub,
    s = (0, x.useRef)(i);
  s.current = i;
  let c = (0, x.useRef)(r);
  c.current = r;
  let l = (0, x.useRef)(null),
    u = (0, x.useCallback)(
      async ({ forceRefreshToken: e }) => {
        let t = s.current;
        if (!e) return t ?? null;
        if (t != null && !Op(t, Dp)) return t;
        if (l.current) return l.current;
        let n = zn(async () => {
          let e = s.current;
          if (e != null && !Op(e, Dp)) return e;
          try {
            return (await c.current())?.id_token ?? null;
          } catch {
            return null;
          }
        }).finally(() => {
          l.current = null;
        });
        return ((l.current = n), n);
      },
      [a, o],
    );
  return (0, x.useMemo)(
    () => ({ isLoading: !e && n, isAuthenticated: e, fetchAccessToken: u }),
    [n, e, u],
  );
}
function Ap({ children: e, client: t }) {
  return (0, J.jsx)(wp, { client: t, useAuth: kp, children: e });
}
var jp = new _p(`https://combative-mule-469.convex.cloud`);
function Mp({ children: e }) {
  return (0, J.jsx)(Ap, { client: jp, children: e });
}
var Np = class {
    constructor() {
      ((this.listeners = new Set()),
        (this.subscribe = this.subscribe.bind(this)));
    }
    subscribe(e) {
      return (
        this.listeners.add(e),
        this.onSubscribe(),
        () => {
          (this.listeners.delete(e), this.onUnsubscribe());
        }
      );
    }
    hasListeners() {
      return this.listeners.size > 0;
    }
    onSubscribe() {}
    onUnsubscribe() {}
  },
  Pp = new (class extends Np {
    #e;
    #t;
    #n;
    constructor() {
      (super(),
        (this.#n = (e) => {
          if (typeof window < `u` && window.addEventListener) {
            let t = () => e();
            return (
              window.addEventListener(`visibilitychange`, t, !1),
              () => {
                window.removeEventListener(`visibilitychange`, t);
              }
            );
          }
        }));
    }
    onSubscribe() {
      this.#t || this.setEventListener(this.#n);
    }
    onUnsubscribe() {
      this.hasListeners() || (this.#t?.(), (this.#t = void 0));
    }
    setEventListener(e) {
      ((this.#n = e),
        this.#t?.(),
        (this.#t = e((e) => {
          typeof e == `boolean` ? this.setFocused(e) : this.onFocus();
        })));
    }
    setFocused(e) {
      this.#e !== e && ((this.#e = e), this.onFocus());
    }
    onFocus() {
      let e = this.isFocused();
      this.listeners.forEach((t) => {
        t(e);
      });
    }
    isFocused() {
      return typeof this.#e == `boolean`
        ? this.#e
        : globalThis.document?.visibilityState !== `hidden`;
    }
  })(),
  Fp = {
    setTimeout: (e, t) => setTimeout(e, t),
    clearTimeout: (e) => clearTimeout(e),
    setInterval: (e, t) => setInterval(e, t),
    clearInterval: (e) => clearInterval(e),
  },
  Ip = new (class {
    #e = Fp;
    setTimeoutProvider(e) {
      this.#e = e;
    }
    setTimeout(e, t) {
      return this.#e.setTimeout(e, t);
    }
    clearTimeout(e) {
      this.#e.clearTimeout(e);
    }
    setInterval(e, t) {
      return this.#e.setInterval(e, t);
    }
    clearInterval(e) {
      this.#e.clearInterval(e);
    }
  })();
function Lp(e) {
  setTimeout(e, 0);
}
var Rp = typeof window > `u` || `Deno` in globalThis;
function zp() {}
function Bp(e, t) {
  return typeof e == `function` ? e(t) : e;
}
function Vp(e) {
  return typeof e == `number` && e >= 0 && e !== 1 / 0;
}
function Hp(e, t) {
  return Math.max(e + (t || 0) - Date.now(), 0);
}
function Up(e, t) {
  return typeof e == `function` ? e(t) : e;
}
function Wp(e, t) {
  return typeof e == `function` ? e(t) : e;
}
function Gp(e, t) {
  let {
    type: n = `all`,
    exact: r,
    fetchStatus: i,
    predicate: a,
    queryKey: o,
    stale: s,
  } = e;
  if (o) {
    if (r) {
      if (t.queryHash !== qp(o, t.options)) return !1;
    } else if (!Yp(t.queryKey, o)) return !1;
  }
  if (n !== `all`) {
    let e = t.isActive();
    if ((n === `active` && !e) || (n === `inactive` && e)) return !1;
  }
  return !(
    (typeof s == `boolean` && t.isStale() !== s) ||
    (i && i !== t.state.fetchStatus) ||
    (a && !a(t))
  );
}
function Kp(e, t) {
  let { exact: n, status: r, predicate: i, mutationKey: a } = e;
  if (a) {
    if (!t.options.mutationKey) return !1;
    if (n) {
      if (Jp(t.options.mutationKey) !== Jp(a)) return !1;
    } else if (!Yp(t.options.mutationKey, a)) return !1;
  }
  return !((r && t.state.status !== r) || (i && !i(t)));
}
function qp(e, t) {
  return (t?.queryKeyHashFn || Jp)(e);
}
function Jp(e) {
  return JSON.stringify(e, (e, t) =>
    $p(t)
      ? Object.keys(t)
          .sort()
          .reduce((e, n) => ((e[n] = t[n]), e), {})
      : t,
  );
}
function Yp(e, t) {
  if (e === t) return !0;
  if (typeof e != typeof t) return !1;
  if (e && t && typeof e == `object` && typeof t == `object`) {
    if (Array.isArray(e) && Array.isArray(t)) {
      for (let n = 0; n < t.length; n++) if (!Yp(e[n], t[n])) return !1;
      return !0;
    }
    let n = Object.keys(t);
    for (let r of n) if (!Yp(e[r], t[r])) return !1;
    return !0;
  }
  return !1;
}
var Xp = Object.prototype.hasOwnProperty;
function Zp(e, t, n = 0) {
  if (e === t) return e;
  if (n > 500) return t;
  let r = Qp(e) && Qp(t);
  if (!r && !($p(e) && $p(t))) return t;
  let i = (r ? e : Object.keys(e)).length,
    a = r ? t : Object.keys(t),
    o = a.length,
    s = r ? Array(o) : {},
    c = 0;
  for (let l = 0; l < o; l++) {
    let o = r ? l : a[l],
      u = e[o],
      d = t[o];
    if (u === d) {
      ((s[o] = u), (r ? l < i : Xp.call(e, o)) && c++);
      continue;
    }
    if (
      u === null ||
      d === null ||
      typeof u != `object` ||
      typeof d != `object`
    ) {
      s[o] = d;
      continue;
    }
    let f = Zp(u, d, n + 1);
    ((s[o] = f), f === u && c++);
  }
  return i === o && c === i ? e : s;
}
function Qp(e) {
  return Array.isArray(e) && e.length === Object.keys(e).length;
}
function $p(e) {
  if (!em(e)) return !1;
  let t = e.constructor;
  if (t === void 0) return !0;
  let n = t.prototype;
  return !(
    !em(n) ||
    !n.hasOwnProperty(`isPrototypeOf`) ||
    Object.getPrototypeOf(e) !== Object.prototype
  );
}
function em(e) {
  return Object.prototype.toString.call(e) === `[object Object]`;
}
function tm(e) {
  return new Promise((t) => {
    Ip.setTimeout(t, e);
  });
}
function nm(e, t, n) {
  return typeof n.structuralSharing == `function`
    ? n.structuralSharing(e, t)
    : n.structuralSharing === !1
      ? t
      : Zp(e, t);
}
function rm(e, t, n = 0) {
  let r = [...e, t];
  return n && r.length > n ? r.slice(1) : r;
}
function im(e, t, n = 0) {
  let r = [t, ...e];
  return n && r.length > n ? r.slice(0, -1) : r;
}
var am = Symbol();
function om(e, t) {
  return !e.queryFn && t?.initialPromise
    ? () => t.initialPromise
    : !e.queryFn || e.queryFn === am
      ? () => Promise.reject(Error(`Missing queryFn: '${e.queryHash}'`))
      : e.queryFn;
}
function sm(e, t, n) {
  let r = !1,
    i;
  return (
    Object.defineProperty(e, "signal", {
      enumerable: !0,
      get: () => (
        (i ??= t()),
        r
          ? i
          : ((r = !0),
            i.aborted ? n() : i.addEventListener(`abort`, n, { once: !0 }),
            i)
      ),
    }),
    e
  );
}
var cm = (() => {
  let e = () => Rp;
  return {
    isServer() {
      return e();
    },
    setIsServer(t) {
      e = t;
    },
  };
})();
function lm() {
  let e,
    t,
    n = new Promise((n, r) => {
      ((e = n), (t = r));
    });
  ((n.status = `pending`), n.catch(() => {}));
  function r(e) {
    (Object.assign(n, e), delete n.resolve, delete n.reject);
  }
  return (
    (n.resolve = (t) => {
      (r({ status: `fulfilled`, value: t }), e(t));
    }),
    (n.reject = (e) => {
      (r({ status: `rejected`, reason: e }), t(e));
    }),
    n
  );
}
var um = Lp;
function dm() {
  let e = [],
    t = 0,
    n = (e) => {
      e();
    },
    r = (e) => {
      e();
    },
    i = um,
    a = (r) => {
      t
        ? e.push(r)
        : i(() => {
            n(r);
          });
    },
    o = () => {
      let t = e;
      ((e = []),
        t.length &&
          i(() => {
            r(() => {
              t.forEach((e) => {
                n(e);
              });
            });
          }));
    };
  return {
    batch: (e) => {
      let n;
      t++;
      try {
        n = e();
      } finally {
        (t--, t || o());
      }
      return n;
    },
    batchCalls:
      (e) =>
      (...t) => {
        a(() => {
          e(...t);
        });
      },
    schedule: a,
    setNotifyFunction: (e) => {
      n = e;
    },
    setBatchNotifyFunction: (e) => {
      r = e;
    },
    setScheduler: (e) => {
      i = e;
    },
  };
}
var fm = dm(),
  pm = new (class extends Np {
    #e = !0;
    #t;
    #n;
    constructor() {
      (super(),
        (this.#n = (e) => {
          if (typeof window < `u` && window.addEventListener) {
            let t = () => e(!0),
              n = () => e(!1);
            return (
              window.addEventListener(`online`, t, !1),
              window.addEventListener(`offline`, n, !1),
              () => {
                (window.removeEventListener(`online`, t),
                  window.removeEventListener(`offline`, n));
              }
            );
          }
        }));
    }
    onSubscribe() {
      this.#t || this.setEventListener(this.#n);
    }
    onUnsubscribe() {
      this.hasListeners() || (this.#t?.(), (this.#t = void 0));
    }
    setEventListener(e) {
      ((this.#n = e), this.#t?.(), (this.#t = e(this.setOnline.bind(this))));
    }
    setOnline(e) {
      this.#e !== e &&
        ((this.#e = e),
        this.listeners.forEach((t) => {
          t(e);
        }));
    }
    isOnline() {
      return this.#e;
    }
  })();
function mm(e) {
  return Math.min(1e3 * 2 ** e, 3e4);
}
function hm(e) {
  return (e ?? `online`) !== `online` || pm.isOnline();
}
var gm = class extends Error {
  constructor(e) {
    (super(`CancelledError`),
      (this.revert = e?.revert),
      (this.silent = e?.silent));
  }
};
function _m(e) {
  let t = !1,
    n = 0,
    r,
    i = lm(),
    a = () => i.status !== `pending`,
    o = (t) => {
      if (!a()) {
        let n = new gm(t);
        (f(n), e.onCancel?.(n));
      }
    },
    s = () => {
      t = !0;
    },
    c = () => {
      t = !1;
    },
    l = () =>
      Pp.isFocused() &&
      (e.networkMode === `always` || pm.isOnline()) &&
      e.canRun(),
    u = () => hm(e.networkMode) && e.canRun(),
    d = (e) => {
      a() || (r?.(), i.resolve(e));
    },
    f = (e) => {
      a() || (r?.(), i.reject(e));
    },
    p = () =>
      new Promise((t) => {
        ((r = (e) => {
          (a() || l()) && t(e);
        }),
          e.onPause?.());
      }).then(() => {
        ((r = void 0), a() || e.onContinue?.());
      }),
    m = () => {
      if (a()) return;
      let r,
        i = n === 0 ? e.initialPromise : void 0;
      try {
        r = i ?? e.fn();
      } catch (e) {
        r = Promise.reject(e);
      }
      Promise.resolve(r)
        .then(d)
        .catch((r) => {
          if (a()) return;
          let i = e.retry ?? (cm.isServer() ? 0 : 3),
            o = e.retryDelay ?? mm,
            s = typeof o == `function` ? o(n, r) : o,
            c =
              i === !0 ||
              (typeof i == `number` && n < i) ||
              (typeof i == `function` && i(n, r));
          if (t || !c) {
            f(r);
            return;
          }
          (n++,
            e.onFail?.(n, r),
            tm(s)
              .then(() => (l() ? void 0 : p()))
              .then(() => {
                t ? f(r) : m();
              }));
        });
    };
  return {
    promise: i,
    status: () => i.status,
    cancel: o,
    continue: () => (r?.(), i),
    cancelRetry: s,
    continueRetry: c,
    canStart: u,
    start: () => (u() ? m() : p().then(m), i),
  };
}
var vm = class {
  #e;
  destroy() {
    this.clearGcTimeout();
  }
  scheduleGc() {
    (this.clearGcTimeout(),
      Vp(this.gcTime) &&
        (this.#e = Ip.setTimeout(() => {
          this.optionalRemove();
        }, this.gcTime)));
  }
  updateGcTime(e) {
    this.gcTime = Math.max(
      this.gcTime || 0,
      e ?? (cm.isServer() ? 1 / 0 : 3e5),
    );
  }
  clearGcTimeout() {
    this.#e !== void 0 && (Ip.clearTimeout(this.#e), (this.#e = void 0));
  }
};
function ym(e) {
  return {
    onFetch: (t, n) => {
      let r = t.options,
        i = t.fetchOptions?.meta?.fetchMore?.direction,
        a = t.state.data?.pages || [],
        o = t.state.data?.pageParams || [],
        s = { pages: [], pageParams: [] },
        c = 0,
        l = async () => {
          let n = !1,
            l = (e) => {
              sm(
                e,
                () => t.signal,
                () => (n = !0),
              );
            },
            u = om(t.options, t.fetchOptions),
            d = async (e, r, i) => {
              if (n) return Promise.reject(t.signal.reason);
              if (r == null && e.pages.length) return Promise.resolve(e);
              let a = (() => {
                  let e = {
                    client: t.client,
                    queryKey: t.queryKey,
                    pageParam: r,
                    direction: i ? `backward` : `forward`,
                    meta: t.options.meta,
                  };
                  return (l(e), e);
                })(),
                o = await u(a),
                { maxPages: s } = t.options,
                c = i ? im : rm;
              return {
                pages: c(e.pages, o, s),
                pageParams: c(e.pageParams, r, s),
              };
            };
          if (i && a.length) {
            let e = i === `backward`,
              t = e ? xm : bm,
              n = { pages: a, pageParams: o };
            s = await d(n, t(r, n), e);
          } else {
            let t = e ?? a.length;
            do {
              let e = c === 0 ? (o[0] ?? r.initialPageParam) : bm(r, s);
              if (c > 0 && e == null) break;
              ((s = await d(s, e)), c++);
            } while (c < t);
          }
          return s;
        };
      t.fetchFn = t.options.persister
        ? () =>
            t.options.persister?.(
              l,
              {
                client: t.client,
                queryKey: t.queryKey,
                meta: t.options.meta,
                signal: t.signal,
              },
              n,
            )
        : l;
    },
  };
}
function bm(e, { pages: t, pageParams: n }) {
  let r = t.length - 1;
  return t.length > 0 ? e.getNextPageParam(t[r], t, n[r], n) : void 0;
}
function xm(e, { pages: t, pageParams: n }) {
  return t.length > 0 ? e.getPreviousPageParam?.(t[0], t, n[0], n) : void 0;
}
var Sm = class extends vm {
  #e;
  #t;
  #n;
  #r;
  #i;
  #a;
  #o;
  #s;
  constructor(e) {
    (super(),
      (this.#s = !1),
      (this.#o = e.defaultOptions),
      this.setOptions(e.options),
      (this.observers = []),
      (this.#i = e.client),
      (this.#r = this.#i.getQueryCache()),
      (this.queryKey = e.queryKey),
      (this.queryHash = e.queryHash),
      (this.#t = Tm(this.options)),
      (this.state = e.state ?? this.#t),
      this.scheduleGc());
  }
  get meta() {
    return this.options.meta;
  }
  get queryType() {
    return this.#e;
  }
  get promise() {
    return this.#a?.promise;
  }
  setOptions(e) {
    if (
      ((this.options = { ...this.#o, ...e }),
      e?._type && (this.#e = e._type),
      this.updateGcTime(this.options.gcTime),
      this.state && this.state.data === void 0)
    ) {
      let e = Tm(this.options);
      e.data !== void 0 &&
        (this.setState(wm(e.data, e.dataUpdatedAt)), (this.#t = e));
    }
  }
  optionalRemove() {
    !this.observers.length &&
      this.state.fetchStatus === `idle` &&
      this.#r.remove(this);
  }
  setData(e, t) {
    let n = nm(this.state.data, e, this.options);
    return (
      this.#l({
        data: n,
        type: `success`,
        dataUpdatedAt: t?.updatedAt,
        manual: t?.manual,
      }),
      n
    );
  }
  setState(e) {
    this.#l({ type: `setState`, state: e });
  }
  cancel(e) {
    let t = this.#a?.promise;
    return (this.#a?.cancel(e), t ? t.then(zp).catch(zp) : Promise.resolve());
  }
  destroy() {
    (super.destroy(), this.cancel({ silent: !0 }));
  }
  get resetState() {
    return this.#t;
  }
  reset() {
    (this.destroy(), this.setState(this.resetState));
  }
  isActive() {
    return this.observers.some((e) => Wp(e.options.enabled, this) !== !1);
  }
  isDisabled() {
    return this.getObserversCount() > 0
      ? !this.isActive()
      : this.options.queryFn === am || !this.isFetched();
  }
  isFetched() {
    return this.state.dataUpdateCount + this.state.errorUpdateCount > 0;
  }
  isStatic() {
    return (
      this.getObserversCount() > 0 &&
      this.observers.some((e) => Up(e.options.staleTime, this) === `static`)
    );
  }
  isStale() {
    return this.getObserversCount() > 0
      ? this.observers.some((e) => e.getCurrentResult().isStale)
      : this.state.data === void 0 || this.state.isInvalidated;
  }
  isStaleByTime(e = 0) {
    return this.state.data === void 0
      ? !0
      : e === `static`
        ? !1
        : this.state.isInvalidated
          ? !0
          : !Hp(this.state.dataUpdatedAt, e);
  }
  onFocus() {
    (this.observers
      .find((e) => e.shouldFetchOnWindowFocus())
      ?.refetch({ cancelRefetch: !1 }),
      this.#a?.continue());
  }
  onOnline() {
    (this.observers
      .find((e) => e.shouldFetchOnReconnect())
      ?.refetch({ cancelRefetch: !1 }),
      this.#a?.continue());
  }
  addObserver(e) {
    this.observers.includes(e) ||
      (this.observers.push(e),
      this.clearGcTimeout(),
      this.#r.notify({ type: `observerAdded`, query: this, observer: e }));
  }
  removeObserver(e) {
    this.observers.includes(e) &&
      ((this.observers = this.observers.filter((t) => t !== e)),
      this.observers.length ||
        (this.#a &&
          (this.#s || this.#c()
            ? this.#a.cancel({ revert: !0 })
            : this.#a.cancelRetry()),
        this.scheduleGc()),
      this.#r.notify({ type: `observerRemoved`, query: this, observer: e }));
  }
  getObserversCount() {
    return this.observers.length;
  }
  #c() {
    return (
      this.state.fetchStatus === `paused` && this.state.status === `pending`
    );
  }
  invalidate() {
    this.state.isInvalidated || this.#l({ type: `invalidate` });
  }
  async fetch(e, t) {
    if (this.state.fetchStatus !== `idle` && this.#a?.status() !== `rejected`) {
      if (this.state.data !== void 0 && t?.cancelRefetch)
        this.cancel({ silent: !0 });
      else if (this.#a) return (this.#a.continueRetry(), this.#a.promise);
    }
    if ((e && this.setOptions(e), !this.options.queryFn)) {
      let e = this.observers.find((e) => e.options.queryFn);
      e && this.setOptions(e.options);
    }
    let n = new AbortController(),
      r = (e) => {
        Object.defineProperty(e, "signal", {
          enumerable: !0,
          get: () => ((this.#s = !0), n.signal),
        });
      },
      i = () => {
        let e = om(this.options, t),
          n = (() => {
            let e = {
              client: this.#i,
              queryKey: this.queryKey,
              meta: this.meta,
            };
            return (r(e), e);
          })();
        return (
          (this.#s = !1),
          this.options.persister ? this.options.persister(e, n, this) : e(n)
        );
      },
      a = (() => {
        let e = {
          fetchOptions: t,
          options: this.options,
          queryKey: this.queryKey,
          client: this.#i,
          state: this.state,
          fetchFn: i,
        };
        return (r(e), e);
      })();
    ((this.#e === `infinite`
      ? ym(this.options.pages)
      : this.options.behavior
    )?.onFetch(a, this),
      (this.#n = this.state),
      (this.state.fetchStatus === `idle` ||
        this.state.fetchMeta !== a.fetchOptions?.meta) &&
        this.#l({ type: `fetch`, meta: a.fetchOptions?.meta }),
      (this.#a = _m({
        initialPromise: t?.initialPromise,
        fn: a.fetchFn,
        onCancel: (e) => {
          (e instanceof gm &&
            e.revert &&
            this.setState({ ...this.#n, fetchStatus: `idle` }),
            n.abort());
        },
        onFail: (e, t) => {
          this.#l({ type: `failed`, failureCount: e, error: t });
        },
        onPause: () => {
          this.#l({ type: `pause` });
        },
        onContinue: () => {
          this.#l({ type: `continue` });
        },
        retry: a.options.retry,
        retryDelay: a.options.retryDelay,
        networkMode: a.options.networkMode,
        canRun: () => !0,
      })));
    try {
      let e = await this.#a.start();
      if (e === void 0) throw Error(`${this.queryHash} data is undefined`);
      return (
        this.setData(e),
        this.#r.config.onSuccess?.(e, this),
        this.#r.config.onSettled?.(e, this.state.error, this),
        e
      );
    } catch (e) {
      if (e instanceof gm) {
        if (e.silent) return this.#a.promise;
        if (e.revert) {
          if (this.state.data === void 0) throw e;
          return this.state.data;
        }
      }
      throw (
        this.#l({ type: `error`, error: e }),
        this.#r.config.onError?.(e, this),
        this.#r.config.onSettled?.(this.state.data, e, this),
        e
      );
    } finally {
      this.scheduleGc();
    }
  }
  #l(e) {
    let t = (t) => {
      switch (e.type) {
        case `failed`:
          return {
            ...t,
            fetchFailureCount: e.failureCount,
            fetchFailureReason: e.error,
          };
        case `pause`:
          return { ...t, fetchStatus: `paused` };
        case `continue`:
          return { ...t, fetchStatus: `fetching` };
        case `fetch`:
          return {
            ...t,
            ...Cm(t.data, this.options),
            fetchMeta: e.meta ?? null,
          };
        case `success`:
          let n = {
            ...t,
            ...wm(e.data, e.dataUpdatedAt),
            dataUpdateCount: t.dataUpdateCount + 1,
            ...(!e.manual && {
              fetchStatus: `idle`,
              fetchFailureCount: 0,
              fetchFailureReason: null,
            }),
          };
          return ((this.#n = e.manual ? n : void 0), n);
        case `error`:
          let r = e.error;
          return {
            ...t,
            error: r,
            errorUpdateCount: t.errorUpdateCount + 1,
            errorUpdatedAt: Date.now(),
            fetchFailureCount: t.fetchFailureCount + 1,
            fetchFailureReason: r,
            fetchStatus: `idle`,
            status: `error`,
            isInvalidated: !0,
          };
        case `invalidate`:
          return { ...t, isInvalidated: !0 };
        case `setState`:
          return { ...t, ...e.state };
      }
    };
    ((this.state = t(this.state)),
      fm.batch(() => {
        (this.observers.forEach((e) => {
          e.onQueryUpdate();
        }),
          this.#r.notify({ query: this, type: `updated`, action: e }));
      }));
  }
};
function Cm(e, t) {
  return {
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchStatus: hm(t.networkMode) ? `fetching` : `paused`,
    ...(e === void 0 && { error: null, status: `pending` }),
  };
}
function wm(e, t) {
  return {
    data: e,
    dataUpdatedAt: t ?? Date.now(),
    error: null,
    isInvalidated: !1,
    status: `success`,
  };
}
function Tm(e) {
  let t = typeof e.initialData == `function` ? e.initialData() : e.initialData,
    n = t !== void 0,
    r = n
      ? typeof e.initialDataUpdatedAt == `function`
        ? e.initialDataUpdatedAt()
        : e.initialDataUpdatedAt
      : 0;
  return {
    data: t,
    dataUpdateCount: 0,
    dataUpdatedAt: n ? (r ?? Date.now()) : 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: !1,
    status: n ? `success` : `pending`,
    fetchStatus: `idle`,
  };
}
var Em = class extends vm {
  #e;
  #t;
  #n;
  #r;
  constructor(e) {
    (super(),
      (this.#e = e.client),
      (this.mutationId = e.mutationId),
      (this.#n = e.mutationCache),
      (this.#t = []),
      (this.state = e.state || Dm()),
      this.setOptions(e.options),
      this.scheduleGc());
  }
  setOptions(e) {
    ((this.options = e), this.updateGcTime(this.options.gcTime));
  }
  get meta() {
    return this.options.meta;
  }
  addObserver(e) {
    this.#t.includes(e) ||
      (this.#t.push(e),
      this.clearGcTimeout(),
      this.#n.notify({ type: `observerAdded`, mutation: this, observer: e }));
  }
  removeObserver(e) {
    ((this.#t = this.#t.filter((t) => t !== e)),
      this.scheduleGc(),
      this.#n.notify({ type: `observerRemoved`, mutation: this, observer: e }));
  }
  optionalRemove() {
    this.#t.length ||
      (this.state.status === `pending`
        ? this.scheduleGc()
        : this.#n.remove(this));
  }
  continue() {
    return this.#r?.continue() ?? this.execute(this.state.variables);
  }
  async execute(e) {
    let t = () => {
        this.#i({ type: `continue` });
      },
      n = {
        client: this.#e,
        meta: this.options.meta,
        mutationKey: this.options.mutationKey,
      };
    this.#r = _m({
      fn: () =>
        this.options.mutationFn
          ? this.options.mutationFn(e, n)
          : Promise.reject(Error(`No mutationFn found`)),
      onFail: (e, t) => {
        this.#i({ type: `failed`, failureCount: e, error: t });
      },
      onPause: () => {
        this.#i({ type: `pause` });
      },
      onContinue: t,
      retry: this.options.retry ?? 0,
      retryDelay: this.options.retryDelay,
      networkMode: this.options.networkMode,
      canRun: () => this.#n.canRun(this),
    });
    let r = this.state.status === `pending`,
      i = !this.#r.canStart();
    try {
      if (r) t();
      else {
        (this.#i({ type: `pending`, variables: e, isPaused: i }),
          this.#n.config.onMutate &&
            (await this.#n.config.onMutate(e, this, n)));
        let t = await this.options.onMutate?.(e, n);
        t !== this.state.context &&
          this.#i({ type: `pending`, context: t, variables: e, isPaused: i });
      }
      let a = await this.#r.start();
      return (
        await this.#n.config.onSuccess?.(a, e, this.state.context, this, n),
        await this.options.onSuccess?.(a, e, this.state.context, n),
        await this.#n.config.onSettled?.(
          a,
          null,
          this.state.variables,
          this.state.context,
          this,
          n,
        ),
        await this.options.onSettled?.(a, null, e, this.state.context, n),
        this.#i({ type: `success`, data: a }),
        a
      );
    } catch (t) {
      try {
        await this.#n.config.onError?.(t, e, this.state.context, this, n);
      } catch (e) {
        Promise.reject(e);
      }
      try {
        await this.options.onError?.(t, e, this.state.context, n);
      } catch (e) {
        Promise.reject(e);
      }
      try {
        await this.#n.config.onSettled?.(
          void 0,
          t,
          this.state.variables,
          this.state.context,
          this,
          n,
        );
      } catch (e) {
        Promise.reject(e);
      }
      try {
        await this.options.onSettled?.(void 0, t, e, this.state.context, n);
      } catch (e) {
        Promise.reject(e);
      }
      throw (this.#i({ type: `error`, error: t }), t);
    } finally {
      this.#n.runNext(this);
    }
  }
  #i(e) {
    let t = (t) => {
      switch (e.type) {
        case `failed`:
          return { ...t, failureCount: e.failureCount, failureReason: e.error };
        case `pause`:
          return { ...t, isPaused: !0 };
        case `continue`:
          return { ...t, isPaused: !1 };
        case `pending`:
          return {
            ...t,
            context: e.context,
            data: void 0,
            failureCount: 0,
            failureReason: null,
            error: null,
            isPaused: e.isPaused,
            status: `pending`,
            variables: e.variables,
            submittedAt: Date.now(),
          };
        case `success`:
          return {
            ...t,
            data: e.data,
            failureCount: 0,
            failureReason: null,
            error: null,
            status: `success`,
            isPaused: !1,
          };
        case `error`:
          return {
            ...t,
            data: void 0,
            error: e.error,
            failureCount: t.failureCount + 1,
            failureReason: e.error,
            isPaused: !1,
            status: `error`,
          };
      }
    };
    ((this.state = t(this.state)),
      fm.batch(() => {
        (this.#t.forEach((t) => {
          t.onMutationUpdate(e);
        }),
          this.#n.notify({ mutation: this, type: `updated`, action: e }));
      }));
  }
};
function Dm() {
  return {
    context: void 0,
    data: void 0,
    error: null,
    failureCount: 0,
    failureReason: null,
    isPaused: !1,
    status: `idle`,
    variables: void 0,
    submittedAt: 0,
  };
}
var Om = class extends Np {
  constructor(e = {}) {
    (super(),
      (this.config = e),
      (this.#e = new Set()),
      (this.#t = new Map()),
      (this.#n = 0));
  }
  #e;
  #t;
  #n;
  build(e, t, n) {
    let r = new Em({
      client: e,
      mutationCache: this,
      mutationId: ++this.#n,
      options: e.defaultMutationOptions(t),
      state: n,
    });
    return (this.add(r), r);
  }
  add(e) {
    this.#e.add(e);
    let t = km(e);
    if (typeof t == `string`) {
      let n = this.#t.get(t);
      n ? n.push(e) : this.#t.set(t, [e]);
    }
    this.notify({ type: `added`, mutation: e });
  }
  remove(e) {
    if (this.#e.delete(e)) {
      let t = km(e);
      if (typeof t == `string`) {
        let n = this.#t.get(t);
        if (n)
          if (n.length > 1) {
            let t = n.indexOf(e);
            t !== -1 && n.splice(t, 1);
          } else n[0] === e && this.#t.delete(t);
      }
    }
    this.notify({ type: `removed`, mutation: e });
  }
  canRun(e) {
    let t = km(e);
    if (typeof t == `string`) {
      let n = this.#t.get(t)?.find((e) => e.state.status === `pending`);
      return !n || n === e;
    }
    return !0;
  }
  runNext(e) {
    let t = km(e);
    return typeof t == `string`
      ? (this.#t
          .get(t)
          ?.find((t) => t !== e && t.state.isPaused)
          ?.continue() ?? Promise.resolve())
      : Promise.resolve();
  }
  clear() {
    fm.batch(() => {
      (this.#e.forEach((e) => {
        this.notify({ type: `removed`, mutation: e });
      }),
        this.#e.clear(),
        this.#t.clear());
    });
  }
  getAll() {
    return Array.from(this.#e);
  }
  find(e) {
    let t = { exact: !0, ...e };
    return this.getAll().find((e) => Kp(t, e));
  }
  findAll(e = {}) {
    return this.getAll().filter((t) => Kp(e, t));
  }
  notify(e) {
    fm.batch(() => {
      this.listeners.forEach((t) => {
        t(e);
      });
    });
  }
  resumePausedMutations() {
    let e = this.getAll().filter((e) => e.state.isPaused);
    return fm.batch(() => Promise.all(e.map((e) => e.continue().catch(zp))));
  }
};
function km(e) {
  return e.options.scope?.id;
}
var Am = class extends Np {
    constructor(e = {}) {
      (super(), (this.config = e), (this.#e = new Map()));
    }
    #e;
    build(e, t, n) {
      let r = t.queryKey,
        i = t.queryHash ?? qp(r, t),
        a = this.get(i);
      return (
        a ||
          ((a = new Sm({
            client: e,
            queryKey: r,
            queryHash: i,
            options: e.defaultQueryOptions(t),
            state: n,
            defaultOptions: e.getQueryDefaults(r),
          })),
          this.add(a)),
        a
      );
    }
    add(e) {
      this.#e.has(e.queryHash) ||
        (this.#e.set(e.queryHash, e), this.notify({ type: `added`, query: e }));
    }
    remove(e) {
      let t = this.#e.get(e.queryHash);
      t &&
        (e.destroy(),
        t === e && this.#e.delete(e.queryHash),
        this.notify({ type: `removed`, query: e }));
    }
    clear() {
      fm.batch(() => {
        this.getAll().forEach((e) => {
          this.remove(e);
        });
      });
    }
    get(e) {
      return this.#e.get(e);
    }
    getAll() {
      return [...this.#e.values()];
    }
    find(e) {
      let t = { exact: !0, ...e };
      return this.getAll().find((e) => Gp(t, e));
    }
    findAll(e = {}) {
      let t = this.getAll();
      return Object.keys(e).length > 0 ? t.filter((t) => Gp(e, t)) : t;
    }
    notify(e) {
      fm.batch(() => {
        this.listeners.forEach((t) => {
          t(e);
        });
      });
    }
    onFocus() {
      fm.batch(() => {
        this.getAll().forEach((e) => {
          e.onFocus();
        });
      });
    }
    onOnline() {
      fm.batch(() => {
        this.getAll().forEach((e) => {
          e.onOnline();
        });
      });
    }
  },
  jm = class {
    #e;
    #t;
    #n;
    #r;
    #i;
    #a;
    #o;
    #s;
    constructor(e = {}) {
      ((this.#e = e.queryCache || new Am()),
        (this.#t = e.mutationCache || new Om()),
        (this.#n = e.defaultOptions || {}),
        (this.#r = new Map()),
        (this.#i = new Map()),
        (this.#a = 0));
    }
    mount() {
      (this.#a++,
        this.#a === 1 &&
          ((this.#o = Pp.subscribe(async (e) => {
            e && (await this.resumePausedMutations(), this.#e.onFocus());
          })),
          (this.#s = pm.subscribe(async (e) => {
            e && (await this.resumePausedMutations(), this.#e.onOnline());
          }))));
    }
    unmount() {
      (this.#a--,
        this.#a === 0 &&
          (this.#o?.(), (this.#o = void 0), this.#s?.(), (this.#s = void 0)));
    }
    isFetching(e) {
      return this.#e.findAll({ ...e, fetchStatus: `fetching` }).length;
    }
    isMutating(e) {
      return this.#t.findAll({ ...e, status: `pending` }).length;
    }
    getQueryData(e) {
      let t = this.defaultQueryOptions({ queryKey: e });
      return this.#e.get(t.queryHash)?.state.data;
    }
    ensureQueryData(e) {
      let t = this.defaultQueryOptions(e),
        n = this.#e.build(this, t),
        r = n.state.data;
      return r === void 0
        ? this.fetchQuery(e)
        : (e.revalidateIfStale &&
            n.isStaleByTime(Up(t.staleTime, n)) &&
            this.prefetchQuery(t),
          Promise.resolve(r));
    }
    getQueriesData(e) {
      return this.#e.findAll(e).map(({ queryKey: e, state: t }) => [e, t.data]);
    }
    setQueryData(e, t, n) {
      let r = this.defaultQueryOptions({ queryKey: e }),
        i = this.#e.get(r.queryHash)?.state.data,
        a = Bp(t, i);
      if (a !== void 0)
        return this.#e.build(this, r).setData(a, { ...n, manual: !0 });
    }
    setQueriesData(e, t, n) {
      return fm.batch(() =>
        this.#e
          .findAll(e)
          .map(({ queryKey: e }) => [e, this.setQueryData(e, t, n)]),
      );
    }
    getQueryState(e) {
      let t = this.defaultQueryOptions({ queryKey: e });
      return this.#e.get(t.queryHash)?.state;
    }
    removeQueries(e) {
      let t = this.#e;
      fm.batch(() => {
        t.findAll(e).forEach((e) => {
          t.remove(e);
        });
      });
    }
    resetQueries(e, t) {
      let n = this.#e;
      return fm.batch(
        () => (
          n.findAll(e).forEach((e) => {
            e.reset();
          }),
          this.refetchQueries({ type: `active`, ...e }, t)
        ),
      );
    }
    cancelQueries(e, t = {}) {
      let n = { revert: !0, ...t },
        r = fm.batch(() => this.#e.findAll(e).map((e) => e.cancel(n)));
      return Promise.all(r).then(zp).catch(zp);
    }
    invalidateQueries(e, t = {}) {
      return fm.batch(
        () => (
          this.#e.findAll(e).forEach((e) => {
            e.invalidate();
          }),
          e?.refetchType === `none`
            ? Promise.resolve()
            : this.refetchQueries(
                { ...e, type: e?.refetchType ?? e?.type ?? `active` },
                t,
              )
        ),
      );
    }
    refetchQueries(e, t = {}) {
      let n = { ...t, cancelRefetch: t.cancelRefetch ?? !0 },
        r = fm.batch(() =>
          this.#e
            .findAll(e)
            .filter((e) => !e.isDisabled() && !e.isStatic())
            .map((e) => {
              let t = e.fetch(void 0, n);
              return (
                n.throwOnError || (t = t.catch(zp)),
                e.state.fetchStatus === `paused` ? Promise.resolve() : t
              );
            }),
        );
      return Promise.all(r).then(zp);
    }
    fetchQuery(e) {
      let t = this.defaultQueryOptions(e);
      t.retry === void 0 && (t.retry = !1);
      let n = this.#e.build(this, t);
      return n.isStaleByTime(Up(t.staleTime, n))
        ? n.fetch(t)
        : Promise.resolve(n.state.data);
    }
    prefetchQuery(e) {
      return this.fetchQuery(e).then(zp).catch(zp);
    }
    fetchInfiniteQuery(e) {
      return ((e._type = `infinite`), this.fetchQuery(e));
    }
    prefetchInfiniteQuery(e) {
      return this.fetchInfiniteQuery(e).then(zp).catch(zp);
    }
    ensureInfiniteQueryData(e) {
      return ((e._type = `infinite`), this.ensureQueryData(e));
    }
    resumePausedMutations() {
      return pm.isOnline()
        ? this.#t.resumePausedMutations()
        : Promise.resolve();
    }
    getQueryCache() {
      return this.#e;
    }
    getMutationCache() {
      return this.#t;
    }
    getDefaultOptions() {
      return this.#n;
    }
    setDefaultOptions(e) {
      this.#n = e;
    }
    setQueryDefaults(e, t) {
      this.#r.set(Jp(e), { queryKey: e, defaultOptions: t });
    }
    getQueryDefaults(e) {
      let t = [...this.#r.values()],
        n = {};
      return (
        t.forEach((t) => {
          Yp(e, t.queryKey) && Object.assign(n, t.defaultOptions);
        }),
        n
      );
    }
    setMutationDefaults(e, t) {
      this.#i.set(Jp(e), { mutationKey: e, defaultOptions: t });
    }
    getMutationDefaults(e) {
      let t = [...this.#i.values()],
        n = {};
      return (
        t.forEach((t) => {
          Yp(e, t.mutationKey) && Object.assign(n, t.defaultOptions);
        }),
        n
      );
    }
    defaultQueryOptions(e) {
      if (e._defaulted) return e;
      let t = {
        ...this.#n.queries,
        ...this.getQueryDefaults(e.queryKey),
        ...e,
        _defaulted: !0,
      };
      return (
        (t.queryHash ||= qp(t.queryKey, t)),
        t.refetchOnReconnect === void 0 &&
          (t.refetchOnReconnect = t.networkMode !== `always`),
        t.throwOnError === void 0 && (t.throwOnError = !!t.suspense),
        !t.networkMode && t.persister && (t.networkMode = `offlineFirst`),
        t.queryFn === am && (t.enabled = !1),
        t
      );
    }
    defaultMutationOptions(e) {
      return e?._defaulted
        ? e
        : {
            ...this.#n.mutations,
            ...(e?.mutationKey && this.getMutationDefaults(e.mutationKey)),
            ...e,
            _defaulted: !0,
          };
    }
    clear() {
      (this.#e.clear(), this.#t.clear());
    }
  },
  Mm = x.createContext(void 0),
  Nm = ({ client: e, children: t }) => (
    x.useEffect(
      () => (
        e.mount(),
        () => {
          e.unmount();
        }
      ),
      [e],
    ),
    (0, J.jsx)(Mm.Provider, { value: e, children: t })
  ),
  Pm = new jm();
function Fm({ children: e }) {
  return (0, J.jsx)(Nm, { client: Pm, children: e });
}
var Im = (e, t, n, r, i, a, o, s) => {
    let c = document.documentElement,
      l = [`light`, `dark`];
    function u(t) {
      ((Array.isArray(e) ? e : [e]).forEach((e) => {
        let n = e === `class`,
          r = n && a ? i.map((e) => a[e] || e) : i;
        n
          ? (c.classList.remove(...r), c.classList.add(a && a[t] ? a[t] : t))
          : c.setAttribute(e, t);
      }),
        d(t));
    }
    function d(e) {
      s && l.includes(e) && (c.style.colorScheme = e);
    }
    function f() {
      return window.matchMedia(`(prefers-color-scheme: dark)`).matches
        ? `dark`
        : `light`;
    }
    if (r) u(r);
    else
      try {
        let e = localStorage.getItem(t) || n;
        u(o && e === `system` ? f() : e);
      } catch {}
  },
  Lm = [`light`, `dark`],
  Rm = `(prefers-color-scheme: dark)`,
  zm = typeof window > `u`,
  Bm = x.createContext(void 0),
  Vm = { setTheme: (e) => {}, themes: [] },
  Hm = () => x.useContext(Bm) ?? Vm,
  Um = (e) =>
    x.useContext(Bm)
      ? x.createElement(x.Fragment, null, e.children)
      : x.createElement(Gm, { ...e }),
  Wm = [`light`, `dark`],
  Gm = ({
    forcedTheme: e,
    disableTransitionOnChange: t = !1,
    enableSystem: n = !0,
    enableColorScheme: r = !0,
    storageKey: i = `theme`,
    themes: a = Wm,
    defaultTheme: o = n ? `system` : `light`,
    attribute: s = `data-theme`,
    value: c,
    children: l,
    nonce: u,
    scriptProps: d,
  }) => {
    let [f, p] = x.useState(() => qm(i, o)),
      [m, h] = x.useState(() => (f === `system` ? Ym() : f)),
      g = c ? Object.values(c) : a,
      _ = x.useCallback(
        (e) => {
          let i = e;
          if (!i) return;
          e === `system` && n && (i = Ym());
          let a = c ? c[i] : i,
            l = t ? Jm(u) : null,
            d = document.documentElement,
            f = (e) => {
              e === `class`
                ? (d.classList.remove(...g), a && d.classList.add(a))
                : e.startsWith(`data-`) &&
                  (a ? d.setAttribute(e, a) : d.removeAttribute(e));
            };
          if ((Array.isArray(s) ? s.forEach(f) : f(s), r)) {
            let e = Lm.includes(o) ? o : null,
              t = Lm.includes(i) ? i : e;
            d.style.colorScheme = t;
          }
          l?.();
        },
        [u],
      ),
      v = x.useCallback(
        (e) => {
          let t = typeof e == `function` ? e(f) : e;
          p(t);
          try {
            localStorage.setItem(i, t);
          } catch {}
        },
        [f],
      ),
      y = x.useCallback(
        (t) => {
          let r = Ym(t);
          (h(r), f === `system` && n && !e && _(`system`));
        },
        [f, e],
      );
    (x.useEffect(() => {
      let e = window.matchMedia(Rm);
      return (e.addListener(y), y(e), () => e.removeListener(y));
    }, [y]),
      x.useEffect(() => {
        let e = (e) => {
          e.key === i && (e.newValue ? p(e.newValue) : v(o));
        };
        return (
          window.addEventListener(`storage`, e),
          () => window.removeEventListener(`storage`, e)
        );
      }, [v]),
      x.useEffect(() => {
        _(e ?? f);
      }, [e, f]));
    let b = x.useMemo(
      () => ({
        theme: f,
        setTheme: v,
        forcedTheme: e,
        resolvedTheme: f === `system` ? m : f,
        themes: n ? [...a, `system`] : a,
        systemTheme: n ? m : void 0,
      }),
      [f, v, e, m, n, a],
    );
    return x.createElement(
      Bm.Provider,
      { value: b },
      x.createElement(Km, {
        forcedTheme: e,
        storageKey: i,
        attribute: s,
        enableSystem: n,
        enableColorScheme: r,
        defaultTheme: o,
        value: c,
        themes: a,
        nonce: u,
        scriptProps: d,
      }),
      l,
    );
  },
  Km = x.memo(
    ({
      forcedTheme: e,
      storageKey: t,
      attribute: n,
      enableSystem: r,
      enableColorScheme: i,
      defaultTheme: a,
      value: o,
      themes: s,
      nonce: c,
      scriptProps: l,
    }) => {
      let u = JSON.stringify([n, t, a, e, s, o, r, i]).slice(1, -1);
      return x.createElement(`script`, {
        ...l,
        suppressHydrationWarning: !0,
        nonce: typeof window > `u` ? c : ``,
        dangerouslySetInnerHTML: { __html: `(${Im.toString()})(${u})` },
      });
    },
  ),
  qm = (e, t) => {
    if (zm) return;
    let n;
    try {
      n = localStorage.getItem(e) || void 0;
    } catch {}
    return n || t;
  },
  Jm = (e) => {
    let t = document.createElement(`style`);
    return (
      e && t.setAttribute(`nonce`, e),
      t.appendChild(
        document.createTextNode(
          `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`,
        ),
      ),
      document.head.appendChild(t),
      () => {
        (window.getComputedStyle(document.body),
          setTimeout(() => {
            document.head.removeChild(t);
          }, 1));
      }
    );
  },
  Ym = (e) => ((e ||= window.matchMedia(Rm)), e.matches ? `dark` : `light`);
function Xm({ children: e, ...t }) {
  return (0, J.jsx)(Um, {
    attribute: `class`,
    defaultTheme: `system`,
    enableSystem: !0,
    ...t,
    children: e,
  });
}
var Zm = (...e) =>
    e
      .filter((e, t, n) => !!e && e.trim() !== `` && n.indexOf(e) === t)
      .join(` `)
      .trim(),
  Qm = (e) => e.replace(/([a-z0-9])([A-Z])/g, `$1-$2`).toLowerCase(),
  $m = (e) =>
    e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) =>
      n ? n.toUpperCase() : t.toLowerCase(),
    ),
  eh = (e) => {
    let t = $m(e);
    return t.charAt(0).toUpperCase() + t.slice(1);
  },
  th = {
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
  nh = (e) => {
    for (let t in e)
      if (t.startsWith(`aria-`) || t === `role` || t === `title`) return !0;
    return !1;
  },
  rh = (0, x.createContext)({}),
  ih = () => (0, x.useContext)(rh),
  ah = (0, x.forwardRef)(
    (
      {
        color: e,
        size: t,
        strokeWidth: n,
        absoluteStrokeWidth: r,
        className: i = ``,
        children: a,
        iconNode: o,
        ...s
      },
      c,
    ) => {
      let {
          size: l = 24,
          strokeWidth: u = 2,
          absoluteStrokeWidth: d = !1,
          color: f = `currentColor`,
          className: p = ``,
        } = ih() ?? {},
        m = (r ?? d) ? (Number(n ?? u) * 24) / Number(t ?? l) : (n ?? u);
      return (0, x.createElement)(
        `svg`,
        {
          ref: c,
          ...th,
          width: t ?? l ?? th.width,
          height: t ?? l ?? th.height,
          stroke: e ?? f,
          strokeWidth: m,
          className: Zm(`lucide`, p, i),
          ...(!a && !nh(s) && { "aria-hidden": `true` }),
          ...s,
        },
        [
          ...o.map(([e, t]) => (0, x.createElement)(e, t)),
          ...(Array.isArray(a) ? a : [a]),
        ],
      );
    },
  ),
  oh = (e, t) => {
    let n = (0, x.forwardRef)(({ className: n, ...r }, i) =>
      (0, x.createElement)(ah, {
        ref: i,
        iconNode: t,
        className: Zm(`lucide-${Qm(eh(e))}`, `lucide-${e}`, n),
        ...r,
      }),
    );
    return ((n.displayName = eh(e)), n);
  },
  sh = oh(`circle-check`, [
    [`circle`, { cx: `12`, cy: `12`, r: `10`, key: `1mglay` }],
    [`path`, { d: `m9 12 2 2 4-4`, key: `dzmm74` }],
  ]),
  ch = oh(`info`, [
    [`circle`, { cx: `12`, cy: `12`, r: `10`, key: `1mglay` }],
    [`path`, { d: `M12 16v-4`, key: `1dtifu` }],
    [`path`, { d: `M12 8h.01`, key: `e9boi3` }],
  ]),
  lh = oh(`loader-circle`, [
    [`path`, { d: `M21 12a9 9 0 1 1-6.219-8.56`, key: `13zald` }],
  ]),
  uh = oh(`octagon-x`, [
    [`path`, { d: `m15 9-6 6`, key: `1uzhvr` }],
    [
      `path`,
      {
        d: `M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z`,
        key: `2d38gg`,
      },
    ],
    [`path`, { d: `m9 9 6 6`, key: `z0biqf` }],
  ]),
  dh = oh(`triangle-alert`, [
    [
      `path`,
      {
        d: `m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3`,
        key: `wmoenq`,
      },
    ],
    [`path`, { d: `M12 9v4`, key: `juzpu7` }],
    [`path`, { d: `M12 17h.01`, key: `p32p05` }],
  ]),
  fh = c(m(), 1);
function ph(e) {
  if (!e || typeof document > `u`) return;
  let t = document.head || document.getElementsByTagName(`head`)[0],
    n = document.createElement(`style`);
  ((n.type = `text/css`),
    t.appendChild(n),
    n.styleSheet
      ? (n.styleSheet.cssText = e)
      : n.appendChild(document.createTextNode(e)));
}
var mh = (e) => {
    switch (e) {
      case `success`:
        return _h;
      case `info`:
        return yh;
      case `warning`:
        return vh;
      case `error`:
        return bh;
      default:
        return null;
    }
  },
  hh = Array(12).fill(0),
  gh = ({ visible: e, className: t }) =>
    x.createElement(
      `div`,
      {
        className: [`sonner-loading-wrapper`, t].filter(Boolean).join(` `),
        "data-visible": e,
      },
      x.createElement(
        `div`,
        { className: `sonner-spinner` },
        hh.map((e, t) =>
          x.createElement(`div`, {
            className: `sonner-loading-bar`,
            key: `spinner-bar-${t}`,
          }),
        ),
      ),
    ),
  _h = x.createElement(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      viewBox: `0 0 20 20`,
      fill: `currentColor`,
      height: `20`,
      width: `20`,
      "aria-hidden": `true`,
    },
    x.createElement(`path`, {
      fillRule: `evenodd`,
      d: `M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z`,
      clipRule: `evenodd`,
    }),
  ),
  vh = x.createElement(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      viewBox: `0 0 24 24`,
      fill: `currentColor`,
      height: `20`,
      width: `20`,
      "aria-hidden": `true`,
    },
    x.createElement(`path`, {
      fillRule: `evenodd`,
      d: `M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z`,
      clipRule: `evenodd`,
    }),
  ),
  yh = x.createElement(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      viewBox: `0 0 20 20`,
      fill: `currentColor`,
      height: `20`,
      width: `20`,
      "aria-hidden": `true`,
    },
    x.createElement(`path`, {
      fillRule: `evenodd`,
      d: `M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z`,
      clipRule: `evenodd`,
    }),
  ),
  bh = x.createElement(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      viewBox: `0 0 20 20`,
      fill: `currentColor`,
      height: `20`,
      width: `20`,
      "aria-hidden": `true`,
    },
    x.createElement(`path`, {
      fillRule: `evenodd`,
      d: `M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z`,
      clipRule: `evenodd`,
    }),
  ),
  xh = x.createElement(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      width: `12`,
      height: `12`,
      viewBox: `0 0 24 24`,
      fill: `none`,
      stroke: `currentColor`,
      strokeWidth: `1.5`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
      "aria-hidden": `true`,
    },
    x.createElement(`line`, { x1: `18`, y1: `6`, x2: `6`, y2: `18` }),
    x.createElement(`line`, { x1: `6`, y1: `6`, x2: `18`, y2: `18` }),
  ),
  Sh = () => {
    let [e, t] = x.useState(document.hidden);
    return (
      x.useEffect(() => {
        let e = () => {
          t(document.hidden);
        };
        return (
          document.addEventListener(`visibilitychange`, e),
          () => document.removeEventListener(`visibilitychange`, e)
        );
      }, []),
      e
    );
  },
  Ch = 1,
  wh = 100,
  Th = (e) => (typeof e?.id == `number` || e?.id?.length > 0 ? e.id : Ch++),
  Eh = new (class {
    constructor() {
      ((this.subscribe = (e) => (
        this.subscribers.push(e),
        this.getActiveToasts().forEach((t) => e(t)),
        () => {
          let t = this.subscribers.indexOf(e);
          this.subscribers.splice(t, 1);
        }
      )),
        (this.publish = (e) => {
          this.subscribers.forEach((t) => t(e));
        }),
        (this.addToast = (e) => {
          (this.publish(e),
            (this.toasts = [...this.toasts, e]),
            this.trimHistory());
        }),
        (this.trimHistory = () => {
          let e = this.toasts.length - wh;
          e <= 0 ||
            (this.toasts = this.toasts.filter((t) =>
              e > 0 && this.dismissedToasts.has(t.id)
                ? (this.dismissedToasts.delete(t.id), e--, !1)
                : !0,
            ));
        }),
        (this.create = (e) => {
          let { message: t, ...n } = e,
            r = Th(e),
            i = this.pendingDismissals.get(r);
          i !== void 0 &&
            (cancelAnimationFrame(i),
            this.pendingDismissals.delete(r),
            this.dismissedToasts.delete(r));
          let a = this.dismissedToasts.has(r),
            o = e.dismissible === void 0 || e.dismissible;
          return (
            a &&
              (this.dismissedToasts.delete(r),
              (this.toasts = this.toasts.filter((e) => e.id !== r))),
            !a && this.toasts.find((e) => e.id === r)
              ? (this.toasts = this.toasts.map((n) =>
                  n.id === r
                    ? (this.publish({ ...n, ...e, id: r, title: t }),
                      { ...n, ...e, id: r, dismissible: o, title: t })
                    : n,
                ))
              : this.addToast({ title: t, ...n, dismissible: o, id: r }),
            r
          );
        }),
        (this.dismiss = (e) => {
          if (e == null)
            return (
              this.getActiveToasts().forEach((e) => {
                (this.dismissedToasts.add(e.id),
                  this.subscribers.forEach((t) =>
                    t({ id: e.id, dismiss: !0 }),
                  ));
              }),
              e
            );
          this.dismissedToasts.add(e);
          let t = this.pendingDismissals.get(e);
          return (
            t !== void 0 && cancelAnimationFrame(t),
            this.pendingDismissals.set(
              e,
              requestAnimationFrame(() => {
                (this.pendingDismissals.delete(e),
                  this.subscribers.forEach((t) => t({ id: e, dismiss: !0 })));
              }),
            ),
            e
          );
        }),
        (this.message = (e, t) =>
          this.create({ ...t, message: e, type: void 0 })),
        (this.error = (e, t) =>
          this.create({ ...t, message: e, type: `error` })),
        (this.success = (e, t) =>
          this.create({ ...t, type: `success`, message: e })),
        (this.info = (e, t) => this.create({ ...t, type: `info`, message: e })),
        (this.warning = (e, t) =>
          this.create({ ...t, type: `warning`, message: e })),
        (this.loading = (e, t) =>
          this.create({ ...t, type: `loading`, message: e })),
        (this.promise = (e, t) => {
          if (!t) return;
          let n;
          t.loading !== void 0 &&
            (n = this.create({
              ...t,
              promise: e,
              type: `loading`,
              message: t.loading,
              description:
                typeof t.description == `function` ? void 0 : t.description,
            }));
          let r = Promise.resolve(e instanceof Function ? e() : e),
            i = n !== void 0,
            a,
            o = r
              .then(async (e) => {
                if (((a = [`resolve`, e]), x.isValidElement(e)))
                  ((i = !1),
                    this.create({ id: n, type: `default`, message: e }));
                else if (Oh(e) && !e.ok) {
                  i = !1;
                  let r =
                      typeof t.error == `function`
                        ? await t.error(`HTTP error! status: ${e.status}`)
                        : t.error,
                    a =
                      typeof t.description == `function`
                        ? await t.description(`HTTP error! status: ${e.status}`)
                        : t.description,
                    o =
                      typeof r == `object` && !x.isValidElement(r)
                        ? r
                        : { message: r };
                  this.create({ id: n, type: `error`, description: a, ...o });
                } else if (e instanceof Error) {
                  i = !1;
                  let r =
                      typeof t.error == `function` ? await t.error(e) : t.error,
                    a =
                      typeof t.description == `function`
                        ? await t.description(e)
                        : t.description,
                    o =
                      typeof r == `object` && !x.isValidElement(r)
                        ? r
                        : { message: r };
                  this.create({ id: n, type: `error`, description: a, ...o });
                } else if (t.success !== void 0) {
                  i = !1;
                  let r =
                      typeof t.success == `function`
                        ? await t.success(e)
                        : t.success,
                    a =
                      typeof t.description == `function`
                        ? await t.description(e)
                        : t.description,
                    o =
                      typeof r == `object` && !x.isValidElement(r)
                        ? r
                        : { message: r };
                  this.create({ id: n, type: `success`, description: a, ...o });
                }
              })
              .catch(async (e) => {
                if (((a = [`reject`, e]), t.error !== void 0)) {
                  i = !1;
                  let r =
                      typeof t.error == `function` ? await t.error(e) : t.error,
                    a =
                      typeof t.description == `function`
                        ? await t.description(e)
                        : t.description,
                    o =
                      typeof r == `object` && !x.isValidElement(r)
                        ? r
                        : { message: r };
                  this.create({ id: n, type: `error`, description: a, ...o });
                }
              })
              .finally(() => {
                (i && (this.dismiss(n), (n = void 0)),
                  t.finally == null || t.finally.call(t));
              }),
            s = () =>
              new Promise((e, t) =>
                o.then(() => (a[0] === `reject` ? t(a[1]) : e(a[1]))).catch(t),
              );
          return typeof n != `string` && typeof n != `number`
            ? { unwrap: s }
            : Object.assign(n, { unwrap: s });
        }),
        (this.custom = (e, t) => {
          let n = Th(t);
          return (this.create({ ...t, jsx: e(n), id: n, type: void 0 }), n);
        }),
        (this.getActiveToasts = () =>
          this.toasts.filter((e) => !this.dismissedToasts.has(e.id))),
        (this.subscribers = []),
        (this.toasts = []),
        (this.dismissedToasts = new Set()),
        (this.pendingDismissals = new Map()));
    }
  })(),
  Dh = (e, t) => Eh.message(e, t),
  Oh = (e) =>
    e &&
    typeof e == `object` &&
    `ok` in e &&
    typeof e.ok == `boolean` &&
    `status` in e &&
    typeof e.status == `number`;
(Object.assign(
  Dh,
  {
    success: Eh.success,
    info: Eh.info,
    warning: Eh.warning,
    error: Eh.error,
    custom: Eh.custom,
    message: Eh.message,
    promise: Eh.promise,
    dismiss: Eh.dismiss,
    loading: Eh.loading,
  },
  { getHistory: () => Eh.toasts, getToasts: () => Eh.getActiveToasts() },
),
  ph(
    `[data-sonner-toaster][dir=ltr],html[dir=ltr]{--toast-icon-margin-start:-3px;--toast-icon-margin-end:4px;--toast-svg-margin-start:-1px;--toast-svg-margin-end:0px;--toast-button-margin-start:auto;--toast-button-margin-end:0;--toast-close-button-start:0;--toast-close-button-end:unset;--toast-close-button-transform:translate(-35%, -35%)}[data-sonner-toaster][dir=rtl],html[dir=rtl]{--toast-icon-margin-start:4px;--toast-icon-margin-end:-3px;--toast-svg-margin-start:0px;--toast-svg-margin-end:-1px;--toast-button-margin-start:0;--toast-button-margin-end:auto;--toast-close-button-start:unset;--toast-close-button-end:0;--toast-close-button-transform:translate(35%, -35%)}[data-sonner-toaster]{position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1:hsl(0, 0%, 99%);--gray2:hsl(0, 0%, 97.3%);--gray3:hsl(0, 0%, 95.1%);--gray4:hsl(0, 0%, 93%);--gray5:hsl(0, 0%, 90.9%);--gray6:hsl(0, 0%, 88.7%);--gray7:hsl(0, 0%, 85.8%);--gray8:hsl(0, 0%, 78%);--gray9:hsl(0, 0%, 56.1%);--gray10:hsl(0, 0%, 52.3%);--gray11:hsl(0, 0%, 43.5%);--gray12:hsl(0, 0%, 9%);--border-radius:8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:0;z-index:999999999;transition:transform .4s ease}@media (hover:none) and (pointer:coarse){[data-sonner-toaster][data-lifted=true]{transform:none}}[data-sonner-toaster][data-x-position=right]{right:var(--offset-right)}[data-sonner-toaster][data-x-position=left]{left:var(--offset-left)}[data-sonner-toaster][data-x-position=center]{left:50%;transform:translateX(-50%)}[data-sonner-toaster][data-y-position=top]{top:var(--offset-top)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--offset-bottom)}[data-sonner-toast]{--y:translateY(100%);--lift-amount:calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:0;overflow-wrap:anywhere}[data-sonner-toast][data-styled=true]{padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px rgba(0,0,0,.1);width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}[data-sonner-toast]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-y-position=top]{top:0;--y:translateY(-100%);--lift:1;--lift-amount:calc(1 * var(--gap))}[data-sonner-toast][data-y-position=bottom]{bottom:0;--y:translateY(100%);--lift:-1;--lift-amount:calc(var(--lift) * var(--gap))}[data-sonner-toast][data-styled=true] [data-description]{font-weight:400;line-height:1.4;color:#3f3f3f}[data-rich-colors=true][data-sonner-toast][data-styled=true] [data-description]{color:inherit}[data-sonner-toaster][data-sonner-theme=dark] [data-description]{color:#e8e8e8}[data-sonner-toast][data-styled=true] [data-title]{font-weight:500;line-height:1.5;color:inherit}[data-sonner-toast][data-styled=true] [data-icon]{display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}[data-sonner-toast][data-promise=true] [data-icon]>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}[data-sonner-toast][data-styled=true] [data-icon]>*{flex-shrink:0}[data-sonner-toast][data-styled=true] [data-icon] svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}[data-sonner-toast][data-styled=true] [data-content]{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;font-weight:500;cursor:pointer;outline:0;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}[data-sonner-toast][data-styled=true] [data-button]:focus-visible{box-shadow:0 0 0 2px rgba(0,0,0,.4)}[data-sonner-toast][data-styled=true] [data-button]:first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}[data-sonner-toast][data-styled=true] [data-cancel]{color:var(--normal-text);background:rgba(0,0,0,.08)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-styled=true] [data-cancel]{background:rgba(255,255,255,.3)}[data-sonner-toast][data-styled=true] [data-close-button]{position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--normal-text);background:var(--normal-bg);border:1px solid var(--normal-border);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast][data-styled=true] [data-close-button]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-styled=true] [data-disabled=true]{cursor:not-allowed}[data-sonner-toast][data-styled=true]:hover [data-close-button]:hover{background:var(--gray2);border-color:var(--gray5)}[data-sonner-toast][data-swiping=true]::before{content:'';position:absolute;left:-100%;right:-100%;height:100%;z-index:-1}[data-sonner-toast][data-y-position=top][data-swiping=true]::before{bottom:50%;transform:scaleY(3) translateY(50%)}[data-sonner-toast][data-y-position=bottom][data-swiping=true]::before{top:50%;transform:scaleY(3) translateY(-50%)}[data-sonner-toast][data-swiping=false][data-removed=true]::before{content:'';position:absolute;inset:0;transform:scaleY(2)}[data-sonner-toast][data-expanded=true]::after{content:'';position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}[data-sonner-toast][data-mounted=true]{--y:translateY(0);opacity:1}[data-sonner-toast][data-expanded=false][data-front=false]{--scale:var(--toasts-before) * 0.05 + 1;--y:translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}[data-sonner-toast]>*{transition:opacity .4s}[data-sonner-toast][data-x-position=right]{right:0}[data-sonner-toast][data-x-position=left]{left:0}[data-sonner-toast][data-expanded=false][data-front=false][data-styled=true]>*{opacity:0}[data-sonner-toast][data-visible=false]{opacity:0;pointer-events:none}[data-sonner-toast][data-mounted=true][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}[data-sonner-toast][data-removed=true][data-front=true][data-swipe-out=false]{--y:translateY(calc(var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=false]{--y:translateY(40%);opacity:0;transition:transform .5s,opacity .2s}[data-sonner-toast][data-removed=true][data-front=false]::before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y,0)) translateX(var(--swipe-amount-x,0));transition:none}[data-sonner-toast][data-swiped=true]{-webkit-user-select:none;user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width:600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-sonner-theme=light]{--normal-bg:#fff;--normal-border:var(--gray4);--normal-text:var(--gray12);--success-bg:hsl(143, 85%, 96%);--success-border:hsl(145, 92%, 87%);--success-text:hsl(140, 100%, 27%);--info-bg:hsl(208, 100%, 97%);--info-border:hsl(221, 91%, 93%);--info-text:hsl(210, 92%, 45%);--warning-bg:hsl(49, 100%, 97%);--warning-border:hsl(49, 91%, 84%);--warning-text:hsl(31, 92%, 45%);--error-bg:hsl(359, 100%, 97%);--error-border:hsl(359, 100%, 94%);--error-text:hsl(360, 100%, 45%)}[data-sonner-toaster][data-sonner-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg:#000;--normal-border:hsl(0, 0%, 20%);--normal-text:var(--gray1)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg:#fff;--normal-border:var(--gray3);--normal-text:var(--gray12)}[data-sonner-toaster][data-sonner-theme=dark]{--normal-bg:#000;--normal-bg-hover:hsl(0, 0%, 12%);--normal-border:hsl(0, 0%, 20%);--normal-border-hover:hsl(0, 0%, 25%);--normal-text:var(--gray1);--success-bg:hsl(150, 100%, 6%);--success-border:hsl(147, 100%, 12%);--success-text:hsl(150, 86%, 65%);--info-bg:hsl(215, 100%, 6%);--info-border:hsl(223, 43%, 17%);--info-text:hsl(216, 87%, 65%);--warning-bg:hsl(64, 100%, 6%);--warning-border:hsl(60, 100%, 9%);--warning-text:hsl(46, 87%, 65%);--error-bg:hsl(358, 76%, 10%);--error-border:hsl(357, 89%, 16%);--error-text:hsl(358, 100%, 81%)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size:16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:first-child{animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}100%{opacity:.15}}@media (prefers-reduced-motion){.sonner-loading-bar,[data-sonner-toast],[data-sonner-toast]>*{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}`,
  ));
function kh(e) {
  return e.label !== void 0;
}
var Ah = 3,
  jh = `24px`,
  Mh = `16px`,
  Nh = 4e3,
  Ph = 356,
  Fh = 14,
  Ih = 45,
  Lh = 200;
function Rh(...e) {
  return e.filter(Boolean).join(` `);
}
function zh(e) {
  let [t, n] = e.split(`-`),
    r = [];
  return (t && r.push(t), n && r.push(n), r);
}
var Bh = (e) => {
  let {
      invert: t,
      toast: n,
      unstyled: r,
      interacting: i,
      setHeights: a,
      visibleToasts: o,
      heights: s,
      index: c,
      toasts: l,
      expanded: u,
      removeToast: d,
      defaultRichColors: f,
      closeButton: p,
      style: m,
      cancelButtonStyle: h,
      actionButtonStyle: g,
      className: _ = ``,
      descriptionClassName: v = ``,
      duration: y,
      position: b,
      gap: S,
      expandByDefault: C,
      classNames: w,
      icons: T,
      closeButtonAriaLabel: ee = `Close toast`,
    } = e,
    [te, E] = x.useState(null),
    [ne, re] = x.useState(null),
    [ie, ae] = x.useState(!1),
    [oe, se] = x.useState(!1),
    [ce, D] = x.useState(!1),
    [O, le] = x.useState(!1),
    [ue, de] = x.useState(!1),
    [k, A] = x.useState(0),
    [j, fe] = x.useState(0),
    M = x.useRef(n.duration || y || Nh),
    pe = x.useRef(null),
    me = x.useRef(null),
    he = c === 0,
    ge = c + 1 <= o,
    _e = n.type,
    ve = _e ?? `default`,
    ye = n.dismissible !== !1,
    be = n.className || ``,
    xe = n.descriptionClassName || ``,
    Se = x.useMemo(
      () => s.findIndex((e) => e.toastId === n.id) || 0,
      [s, n.id],
    ),
    Ce = x.useMemo(() => n.closeButton ?? p, [n.closeButton, p]),
    we = x.useMemo(() => n.duration || y || Nh, [n.duration, y]),
    Te = x.useRef(0),
    Ee = x.useRef(0),
    De = x.useRef(0),
    Oe = x.useRef(null),
    [ke, Ae] = b.split(`-`),
    je = x.useMemo(
      () => s.reduce((e, t, n) => (n >= Se ? e : e + t.height), 0),
      [s, Se],
    ),
    Me = Sh(),
    Ne = x.useMemo(() => e.swipeDirections ?? zh(b), [e.swipeDirections, b]),
    Pe = n.invert || t,
    Fe = _e === `loading`;
  ((Ee.current = x.useMemo(() => Se * S + je, [Se, je])),
    x.useEffect(() => {
      M.current = we;
    }, [we]),
    x.useEffect(() => {
      ae(!0);
    }, []),
    x.useEffect(() => {
      let e = me.current;
      if (e) {
        let t = e.getBoundingClientRect().height;
        return (
          fe(t),
          a((e) => [{ toastId: n.id, height: t, position: n.position }, ...e]),
          () => a((e) => e.filter((e) => e.toastId !== n.id))
        );
      }
    }, [a, n.id]),
    x.useLayoutEffect(() => {
      if (!ie) return;
      let e = me.current,
        t = e.style.height;
      e.style.height = `auto`;
      let r = e.getBoundingClientRect().height;
      ((e.style.height = t),
        fe(r),
        a((e) =>
          e.find((e) => e.toastId === n.id)
            ? e.map((e) => (e.toastId === n.id ? { ...e, height: r } : e))
            : [{ toastId: n.id, height: r, position: n.position }, ...e],
        ));
    }, [ie, n.title, n.description, a, n.id, n.jsx, n.action, n.cancel]));
  let Ie = x.useCallback(() => {
    (se(!0),
      A(Ee.current),
      a((e) => e.filter((e) => e.toastId !== n.id)),
      setTimeout(() => {
        d(n);
      }, Lh));
  }, [n, d, a, Ee]);
  (x.useEffect(() => {
    if (
      (n.promise && _e === `loading`) ||
      n.duration === 1 / 0 ||
      n.type === `loading`
    )
      return;
    let e;
    return (
      u || i || Me
        ? (() => {
            if (De.current < Te.current) {
              let e = new Date().getTime() - Te.current;
              M.current -= e;
            }
            De.current = new Date().getTime();
          })()
        : M.current !== 1 / 0 &&
          ((Te.current = new Date().getTime()),
          (e = setTimeout(() => {
            (n.onAutoClose == null || n.onAutoClose.call(n, n), Ie());
          }, M.current))),
      () => clearTimeout(e)
    );
  }, [u, i, n, _e, Me, Ie]),
    x.useEffect(() => {
      n.delete && (Ie(), n.onDismiss == null || n.onDismiss.call(n, n));
    }, [Ie, n.delete]));
  function Le() {
    return T?.loading
      ? x.createElement(
          `div`,
          {
            className: Rh(w?.loader, n?.classNames?.loader, `sonner-loader`),
            "data-visible": _e === `loading`,
          },
          T.loading,
        )
      : x.createElement(gh, {
          className: Rh(w?.loader, n?.classNames?.loader),
          visible: _e === `loading`,
        });
  }
  let Re = n.icon || T?.[_e] || mh(_e);
  return x.createElement(
    `li`,
    {
      tabIndex: 0,
      ref: me,
      className: Rh(
        _,
        be,
        w?.toast,
        n?.classNames?.toast,
        w?.[ve],
        n?.classNames?.[ve],
      ),
      "data-sonner-toast": ``,
      "data-rich-colors": n.richColors ?? f,
      "data-styled": !(n.jsx || n.unstyled || r),
      "data-mounted": ie,
      "data-promise": !!n.promise,
      "data-swiped": ue,
      "data-removed": oe,
      "data-visible": ge,
      "data-y-position": ke,
      "data-x-position": Ae,
      "data-index": c,
      "data-front": he,
      "data-swiping": ce,
      "data-dismissible": ye,
      "data-type": _e,
      "data-invert": Pe,
      "data-swipe-out": O,
      "data-swipe-direction": ne,
      "data-expanded": !!(u || (C && ie)),
      "data-testid": n.testId,
      style: {
        "--index": c,
        "--toasts-before": c,
        "--z-index": l.length - c,
        "--offset": `${oe ? k : Ee.current}px`,
        "--initial-height": C ? `auto` : `${j}px`,
        ...m,
        ...n.style,
      },
      onDragEnd: () => {
        (D(!1), E(null), (Oe.current = null));
      },
      onPointerDown: (e) => {
        e.button !== 2 &&
          (Fe ||
            !ye ||
            ((pe.current = new Date()),
            A(Ee.current),
            e.target.setPointerCapture(e.pointerId),
            e.target.tagName !== `BUTTON` &&
              (D(!0), (Oe.current = { x: e.clientX, y: e.clientY }))));
      },
      onPointerUp: () => {
        if (O || !ye) return;
        Oe.current = null;
        let e = Number(
            me.current?.style
              .getPropertyValue(`--swipe-amount-x`)
              .replace(`px`, ``) || 0,
          ),
          t = Number(
            me.current?.style
              .getPropertyValue(`--swipe-amount-y`)
              .replace(`px`, ``) || 0,
          ),
          r = new Date().getTime() - pe.current?.getTime(),
          i = te === `x` ? e : t,
          a = Math.abs(i) / r;
        if (
          (te === `x`
            ? Ne.includes(e > 0 ? `right` : `left`)
            : Ne.includes(t > 0 ? `bottom` : `top`)) &&
          (Math.abs(i) >= Ih || a > 0.11)
        ) {
          (A(Ee.current),
            n.onDismiss == null || n.onDismiss.call(n, n),
            re(te === `x` ? (e > 0 ? `right` : `left`) : t > 0 ? `down` : `up`),
            Ie(),
            le(!0));
          return;
        }
        var o, s;
        ((o = me.current) == null ||
          o.style.setProperty(`--swipe-amount-x`, `0px`),
          (s = me.current) == null ||
            s.style.setProperty(`--swipe-amount-y`, `0px`),
          de(!1),
          D(!1),
          E(null));
      },
      onPointerMove: (e) => {
        var t, n;
        if (!Oe.current || !ye || window.getSelection()?.toString().length > 0)
          return;
        let r = e.clientY - Oe.current.y,
          i = e.clientX - Oe.current.x;
        !te &&
          (Math.abs(i) > 1 || Math.abs(r) > 1) &&
          E(Math.abs(i) > Math.abs(r) ? `x` : `y`);
        let a = { x: 0, y: 0 },
          o = (e) => 1 / (1.5 + Math.abs(e) / 20);
        if (te === `y`) {
          if (Ne.includes(`top`) || Ne.includes(`bottom`))
            if (
              (Ne.includes(`top`) && r < 0) ||
              (Ne.includes(`bottom`) && r > 0)
            )
              a.y = r;
            else {
              let e = r * o(r);
              a.y = Math.abs(e) < Math.abs(r) ? e : r;
            }
        } else if (te === `x` && (Ne.includes(`left`) || Ne.includes(`right`)))
          if ((Ne.includes(`left`) && i < 0) || (Ne.includes(`right`) && i > 0))
            a.x = i;
          else {
            let e = i * o(i);
            a.x = Math.abs(e) < Math.abs(i) ? e : i;
          }
        ((Math.abs(a.x) > 0 || Math.abs(a.y) > 0) && de(!0),
          (t = me.current) == null ||
            t.style.setProperty(`--swipe-amount-x`, `${a.x}px`),
          (n = me.current) == null ||
            n.style.setProperty(`--swipe-amount-y`, `${a.y}px`));
      },
    },
    Ce && !n.jsx && _e !== `loading`
      ? x.createElement(
          `button`,
          {
            "aria-label": ee,
            "data-disabled": Fe,
            "data-close-button": !0,
            onClick:
              Fe || !ye
                ? () => {}
                : () => {
                    (Ie(), n.onDismiss == null || n.onDismiss.call(n, n));
                  },
            className: Rh(w?.closeButton, n?.classNames?.closeButton),
          },
          T?.close ?? xh,
        )
      : null,
    (_e || n.icon || n.promise) &&
      n.icon !== null &&
      (T?.[_e] !== null || n.icon)
      ? x.createElement(
          `div`,
          { "data-icon": ``, className: Rh(w?.icon, n?.classNames?.icon) },
          _e === `loading` ? n.icon || Le() : n.promise ? Le() : null,
          _e === `loading` ? null : Re,
        )
      : null,
    x.createElement(
      `div`,
      { "data-content": ``, className: Rh(w?.content, n?.classNames?.content) },
      x.createElement(
        `div`,
        { "data-title": ``, className: Rh(w?.title, n?.classNames?.title) },
        n.jsx ? n.jsx : typeof n.title == `function` ? n.title() : n.title,
      ),
      n.description
        ? x.createElement(
            `div`,
            {
              "data-description": ``,
              className: Rh(v, xe, w?.description, n?.classNames?.description),
            },
            typeof n.description == `function`
              ? n.description()
              : n.description,
          )
        : null,
    ),
    x.isValidElement(n.cancel)
      ? n.cancel
      : n.cancel && kh(n.cancel)
        ? x.createElement(
            `button`,
            {
              "data-button": !0,
              "data-cancel": !0,
              style: n.cancelButtonStyle || h,
              onClick: (e) => {
                kh(n.cancel) &&
                  ye &&
                  (n.cancel.onClick == null ||
                    n.cancel.onClick.call(n.cancel, e),
                  Ie());
              },
              className: Rh(w?.cancelButton, n?.classNames?.cancelButton),
            },
            n.cancel.label,
          )
        : null,
    x.isValidElement(n.action)
      ? n.action
      : n.action && kh(n.action)
        ? x.createElement(
            `button`,
            {
              "data-button": !0,
              "data-action": !0,
              style: n.actionButtonStyle || g,
              onClick: (e) => {
                kh(n.action) &&
                  (n.action.onClick == null ||
                    n.action.onClick.call(n.action, e),
                  !e.defaultPrevented && Ie());
              },
              className: Rh(w?.actionButton, n?.classNames?.actionButton),
            },
            n.action.label,
          )
        : null,
  );
};
function Vh() {
  if (typeof window > `u` || typeof document > `u`) return `ltr`;
  let e = document.documentElement.getAttribute(`dir`);
  return e === `auto` || !e
    ? window.getComputedStyle(document.documentElement).direction
    : e;
}
function Hh(e, t) {
  let n = {};
  return (
    [e, t].forEach((e, t) => {
      let r = t === 1,
        i = r ? `--mobile-offset` : `--offset`,
        a = r ? Mh : jh;
      function o(e) {
        [`top`, `right`, `bottom`, `left`].forEach((t) => {
          n[`${i}-${t}`] = typeof e == `number` ? `${e}px` : e;
        });
      }
      typeof e == `number` || typeof e == `string`
        ? o(e)
        : typeof e == `object`
          ? [`top`, `right`, `bottom`, `left`].forEach((t) => {
              e[t] === void 0
                ? (n[`${i}-${t}`] = a)
                : (n[`${i}-${t}`] =
                    typeof e[t] == `number` ? `${e[t]}px` : e[t]);
            })
          : o(a);
    }),
    n
  );
}
var Uh = x.forwardRef(function (e, t) {
    let {
        id: n,
        invert: r,
        position: i = `bottom-right`,
        hotkey: a = [`altKey`, `KeyT`],
        expand: o,
        closeButton: s,
        className: c,
        offset: l,
        mobileOffset: u,
        theme: d = `light`,
        richColors: f,
        duration: p,
        style: m,
        visibleToasts: h = Ah,
        toastOptions: g,
        dir: _ = Vh(),
        gap: v = Fh,
        icons: y,
        customAriaLabel: b,
        containerAriaLabel: S = `Notifications`,
      } = e,
      [C, w] = x.useState([]),
      T = x.useMemo(
        () =>
          n
            ? C.filter((e) => e.toasterId === n)
            : C.filter((e) => !e.toasterId),
        [C, n],
      ),
      ee = x.useMemo(
        () =>
          Array.from(
            new Set(
              [i].concat(T.filter((e) => e.position).map((e) => e.position)),
            ),
          ),
        [T, i],
      ),
      [te, E] = x.useState([]),
      [ne, re] = x.useState(!1),
      [ie, ae] = x.useState(!1),
      [oe, se] = x.useState(
        d === `system`
          ? typeof window < `u` &&
            window.matchMedia &&
            window.matchMedia(`(prefers-color-scheme: dark)`).matches
            ? `dark`
            : `light`
          : d,
      ),
      ce = x.useRef(null),
      D = a.join(`+`).replace(/Key/g, ``).replace(/Digit/g, ``),
      O = x.useRef(null),
      le = x.useRef(!1),
      ue = x.useCallback((e) => {
        w(
          (t) => (
            t.find((t) => t.id === e.id)?.delete || Eh.dismiss(e.id),
            t.filter(({ id: t }) => t !== e.id)
          ),
        );
      }, []);
    return (
      x.useEffect(
        () =>
          Eh.subscribe((e) => {
            if (e.dismiss) {
              requestAnimationFrame(() => {
                w((t) =>
                  t.map((t) => (t.id === e.id ? { ...t, delete: !0 } : t)),
                );
              });
              return;
            }
            setTimeout(() => {
              fh.flushSync(() => {
                w((t) => {
                  let n = t.findIndex((t) => t.id === e.id);
                  return n === -1
                    ? [e, ...t]
                    : [...t.slice(0, n), { ...t[n], ...e }, ...t.slice(n + 1)];
                });
              });
            });
          }),
        [],
      ),
      x.useEffect(() => {
        if (d !== `system`) {
          se(d);
          return;
        }
        if (
          (d === `system` &&
            (window.matchMedia &&
            window.matchMedia(`(prefers-color-scheme: dark)`).matches
              ? se(`dark`)
              : se(`light`)),
          typeof window > `u`)
        )
          return;
        let e = window.matchMedia(`(prefers-color-scheme: dark)`);
        try {
          e.addEventListener(`change`, ({ matches: e }) => {
            se(e ? `dark` : `light`);
          });
        } catch {
          e.addListener(({ matches: e }) => {
            try {
              se(e ? `dark` : `light`);
            } catch (e) {
              console.error(e);
            }
          });
        }
      }, [d]),
      x.useEffect(() => {
        C.length <= 1 && re(!1);
      }, [C]),
      x.useEffect(() => {
        let e = (e) => {
          if (a.length > 0 && a.every((t) => e[t] || e.code === t)) {
            var t;
            (re(!0), (t = ce.current) == null || t.focus());
          }
          e.code === `Escape` &&
            (document.activeElement === ce.current ||
              ce.current?.contains(document.activeElement)) &&
            re(!1);
        };
        return (
          document.addEventListener(`keydown`, e),
          () => document.removeEventListener(`keydown`, e)
        );
      }, [a]),
      x.useEffect(() => {
        if (ce.current)
          return () => {
            O.current &&
              (O.current.focus({ preventScroll: !0 }),
              (O.current = null),
              (le.current = !1));
          };
      }, [ce.current]),
      x.createElement(
        `section`,
        {
          ref: t,
          "aria-label": b ?? `${S} ${D}`,
          tabIndex: -1,
          "aria-live": `polite`,
          "aria-relevant": `additions text`,
          "aria-atomic": `false`,
          suppressHydrationWarning: !0,
          "data-react-aria-top-layer": !0,
        },
        ee.map((t, n) => {
          let [i, a] = t.split(`-`);
          return T.length
            ? x.createElement(
                `ol`,
                {
                  key: t,
                  dir: _ === `auto` ? Vh() : _,
                  tabIndex: -1,
                  ref: ce,
                  className: c,
                  "data-sonner-toaster": !0,
                  "data-sonner-theme": oe,
                  "data-y-position": i,
                  "data-x-position": a,
                  style: {
                    "--front-toast-height": `${te[0]?.height || 0}px`,
                    "--width": `${Ph}px`,
                    "--gap": `${v}px`,
                    ...m,
                    ...Hh(l, u),
                  },
                  onBlur: (e) => {
                    le.current &&
                      !e.currentTarget.contains(e.relatedTarget) &&
                      ((le.current = !1),
                      (O.current &&=
                        (O.current.focus({ preventScroll: !0 }), null)));
                  },
                  onFocus: (e) => {
                    (e.target instanceof HTMLElement &&
                      e.target.dataset.dismissible === `false`) ||
                      le.current ||
                      ((le.current = !0), (O.current = e.relatedTarget));
                  },
                  onMouseEnter: () => re(!0),
                  onMouseMove: () => re(!0),
                  onMouseLeave: () => {
                    ie || re(!1);
                  },
                  onDragEnd: () => re(!1),
                  onPointerDown: (e) => {
                    (e.target instanceof HTMLElement &&
                      e.target.dataset.dismissible === `false`) ||
                      ae(!0);
                  },
                  onPointerUp: () => ae(!1),
                },
                T.filter(
                  (e) => (!e.position && n === 0) || e.position === t,
                ).map((n, i) =>
                  x.createElement(Bh, {
                    key: n.id,
                    icons: y,
                    index: i,
                    toast: n,
                    defaultRichColors: f,
                    duration: g?.duration ?? p,
                    className: g?.className,
                    descriptionClassName: g?.descriptionClassName,
                    invert: r,
                    visibleToasts: h,
                    closeButton: g?.closeButton ?? s,
                    interacting: ie,
                    position: t,
                    style: g?.style,
                    unstyled: g?.unstyled,
                    classNames: g?.classNames,
                    cancelButtonStyle: g?.cancelButtonStyle,
                    actionButtonStyle: g?.actionButtonStyle,
                    closeButtonAriaLabel: g?.closeButtonAriaLabel,
                    removeToast: ue,
                    toasts: T.filter((e) => e.position == n.position),
                    heights: te.filter((e) => e.position == n.position),
                    setHeights: E,
                    expandByDefault: o,
                    gap: v,
                    expanded: ne,
                    swipeDirections: e.swipeDirections,
                  }),
                ),
              )
            : null;
        }),
      )
    );
  }),
  Wh = ({ ...e }) => {
    let { theme: t = `system` } = Hm();
    return (0, J.jsx)(Uh, {
      theme: t,
      className: `toaster group`,
      icons: {
        success: (0, J.jsx)(sh, { className: `size-4` }),
        info: (0, J.jsx)(ch, { className: `size-4` }),
        warning: (0, J.jsx)(dh, { className: `size-4` }),
        error: (0, J.jsx)(uh, { className: `size-4` }),
        loading: (0, J.jsx)(lh, { className: `size-4 animate-spin` }),
      },
      style: {
        "--normal-bg": `var(--popover)`,
        "--normal-text": `var(--popover-foreground)`,
        "--normal-border": `var(--border)`,
        "--border-radius": `var(--radius)`,
      },
      ...e,
    });
  },
  Gh = Object.defineProperty,
  Kh = (e, t) => Gh(e, `name`, { value: t, configurable: !0 });
function qh(e, t) {
  if (typeof e == `function`) return e(t);
  e != null && (e.current = t);
}
Kh(qh, `setRef`);
function Jh(...e) {
  return (t) => {
    let n = !1,
      r = e.map((e) => {
        let r = qh(e, t);
        return (!n && typeof r == `function` && (n = !0), r);
      });
    if (n)
      return () => {
        for (let t = 0; t < r.length; t++) {
          let n = r[t];
          typeof n == `function` ? n() : qh(e[t], null);
        }
      };
  };
}
Kh(Jh, `composeRefs`);
function Yh(...e) {
  return x.useCallback(Jh(...e), e);
}
Kh(Yh, `useComposedRefs`);
var Xh = Object.defineProperty,
  Zh = (e, t) => Xh(e, `name`, { value: t, configurable: !0 });
function Qh(e) {
  let t = x.forwardRef((t, n) => {
    let { children: r, ...i } = t,
      a = null,
      o = !1,
      s = [];
    (sg(r) && typeof dg == `function` && (r = dg(r._payload)),
      x.Children.forEach(r, (e) => {
        if (ag(e)) {
          o = !0;
          let t = e,
            n = `child` in t.props ? t.props.child : t.props.children;
          (sg(n) && typeof dg == `function` && (n = dg(n._payload)),
            (a = ng(t, n)),
            s.push(a?.props?.children));
        } else s.push(e);
      }),
      a
        ? (a = x.cloneElement(a, void 0, s))
        : !o && x.Children.count(r) === 1 && x.isValidElement(r) && (a = r));
    let c = a ? ig(a) : void 0,
      l = Yh(n, c);
    if (!a) {
      if (r || r === 0) throw Error(o ? ug(e) : lg(e));
      return r;
    }
    let u = rg(i, a.props ?? {});
    return (a.type !== x.Fragment && (u.ref = n ? l : c), x.cloneElement(a, u));
  });
  return ((t.displayName = `${e}.Slot`), t);
}
Zh(Qh, `createSlot`);
var $h = Qh(`Slot`),
  eg = Symbol.for(`radix.slottable`);
function tg(e) {
  let t = Zh(
    (e) => (`child` in e ? e.children(e.child) : e.children),
    `Slottable`,
  );
  return ((t.displayName = `${e}.Slottable`), (t.__radixId = eg), t);
}
Zh(tg, `createSlottable`);
var ng = Zh((e, t) => {
  if (`child` in e.props) {
    let t = e.props.child;
    return x.isValidElement(t)
      ? x.cloneElement(t, void 0, e.props.children(t.props.children))
      : null;
  }
  return x.isValidElement(t) ? t : null;
}, `getSlottableElementFromSlottable`);
function rg(e, t) {
  let n = { ...t };
  for (let r in t) {
    let i = e[r],
      a = t[r];
    /^on[A-Z]/.test(r)
      ? i && a
        ? (n[r] = (...e) => {
            let t = a(...e);
            return (i(...e), t);
          })
        : i && (n[r] = i)
      : r === `style`
        ? (n[r] = { ...i, ...a })
        : r === `className` && (n[r] = [i, a].filter(Boolean).join(` `));
  }
  return { ...e, ...n };
}
Zh(rg, `mergeProps`);
function ig(e) {
  let t = Object.getOwnPropertyDescriptor(e.props, `ref`)?.get,
    n = t && `isReactWarning` in t && t.isReactWarning;
  return n
    ? e.ref
    : ((t = Object.getOwnPropertyDescriptor(e, `ref`)?.get),
      (n = t && `isReactWarning` in t && t.isReactWarning),
      n ? e.props.ref : e.props.ref || e.ref);
}
Zh(ig, `getElementRef`);
function ag(e) {
  return (
    x.isValidElement(e) &&
    typeof e.type == `function` &&
    `__radixId` in e.type &&
    e.type.__radixId === eg
  );
}
Zh(ag, `isSlottable`);
var og = Symbol.for(`react.lazy`);
function sg(e) {
  return (
    typeof e == `object` &&
    !!e &&
    `$$typeof` in e &&
    e.$$typeof === og &&
    `_payload` in e &&
    cg(e._payload)
  );
}
Zh(sg, `isLazyComponent`);
function cg(e) {
  return typeof e == `object` && !!e && `then` in e;
}
Zh(cg, `isPromiseLike`);
var lg = Zh(
    (e) =>
      `${e} failed to slot onto its children. Expected a single React element child or \`Slottable\`.`,
    `createSlotError`,
  ),
  ug = Zh(
    (e) =>
      `${e} failed to slot onto its \`Slottable\`. Expected \`Slottable\` to receive a single React element child.`,
    `createSlottableError`,
  ),
  dg = x.use,
  fg = Object.defineProperty,
  pg = (e, t) => fg(e, `name`, { value: t, configurable: !0 });
function mg(e, t) {
  let n = x.createContext(t);
  n.displayName = e + `Context`;
  let r = pg((e) => {
    let { children: t, ...r } = e,
      i = x.useMemo(() => r, Object.values(r));
    return (0, J.jsx)(n.Provider, { value: i, children: t });
  }, `Provider`);
  r.displayName = e + `Provider`;
  function i(r, i = {}) {
    let { optional: a = !1 } = i,
      o = x.useContext(n);
    if (o) return o;
    if (t !== void 0) return t;
    if (!a) throw Error(`\`${r}\` must be used within \`${e}\``);
  }
  return (pg(i, `useContext`), [r, i]);
}
pg(mg, `createContext`);
function hg(e, t = []) {
  let n = [];
  function r(t, r) {
    let i = x.createContext(r);
    i.displayName = t + `Context`;
    let a = n.length;
    n = [...n, r];
    let o = pg((t) => {
      let { scope: n, children: r, ...o } = t,
        s = n?.[e]?.[a] || i,
        c = x.useMemo(() => o, Object.values(o));
      return (0, J.jsx)(s.Provider, { value: c, children: r });
    }, `Provider`);
    o.displayName = t + `Provider`;
    function s(n, o, s = {}) {
      let { optional: c = !1 } = s,
        l = o?.[e]?.[a] || i,
        u = x.useContext(l);
      if (u) return u;
      if (r !== void 0) return r;
      if (!c) throw Error(`\`${n}\` must be used within \`${t}\``);
    }
    return (pg(s, `useContext`), [o, s]);
  }
  pg(r, `createContext`);
  let i = pg(() => {
    let t = n.map((e) => x.createContext(e));
    return pg(function (n) {
      let r = n?.[e] || t;
      return x.useMemo(() => ({ [`__scope${e}`]: { ...n, [e]: r } }), [n, r]);
    }, `useScope`);
  }, `createScope`);
  return ((i.scopeName = e), [r, gg(i, ...t)]);
}
pg(hg, `createContextScope`);
function gg(...e) {
  let t = e[0];
  if (e.length === 1) return t;
  let n = pg(() => {
    let n = e.map((e) => ({ useScope: e(), scopeName: e.scopeName }));
    return pg(function (e) {
      let r = n.reduce((t, { useScope: n, scopeName: r }) => {
        let i = n(e)[`__scope${r}`];
        return { ...t, ...i };
      }, {});
      return x.useMemo(() => ({ [`__scope${t.scopeName}`]: r }), [r]);
    }, `useComposedScopes`);
  }, `createScope`);
  return ((n.scopeName = t.scopeName), n);
}
pg(gg, `composeContextScopes`);
var _g = Object.defineProperty,
  vg = (e, t) => _g(e, `name`, { value: t, configurable: !0 }),
  yg = `Popper`,
  [bg, xg] = hg(yg),
  [Sg, Cg] = bg(yg),
  [wg, Tg] = bg(`PopperContent`);
function Eg(e) {
  return e !== null;
}
vg(Eg, `isNotNull`);
function Dg(e) {
  let [t, n = `center`] = e.split(`-`);
  return [t, n];
}
vg(Dg, `getSideAndAlignFromPlacement`);
var Og = Object.defineProperty,
  kg = (e, t) => Og(e, `name`, { value: t, configurable: !0 }),
  [Ag, jg] = hg(`Tooltip`, [xg]);
xg();
var Mg = `TooltipProvider`,
  Ng = 700,
  [Pg, Fg] = Ag(Mg),
  Ig = kg((e) => {
    let {
        __scopeTooltip: t,
        delayDuration: n = Ng,
        skipDelayDuration: r = 300,
        disableHoverableContent: i = !1,
        children: a,
      } = e,
      o = x.useRef(!0),
      s = x.useRef(!1),
      c = x.useRef(0);
    return (
      x.useEffect(() => {
        let e = c.current;
        return () => window.clearTimeout(e);
      }, []),
      (0, J.jsx)(Pg, {
        scope: t,
        isOpenDelayedRef: o,
        delayDuration: n,
        onOpen: x.useCallback(() => {
          r <= 0 || (window.clearTimeout(c.current), (o.current = !1));
        }, [r]),
        onClose: x.useCallback(() => {
          r <= 0 ||
            (window.clearTimeout(c.current),
            (c.current = window.setTimeout(() => (o.current = !0), r)));
        }, [r]),
        isPointerInTransitRef: s,
        onPointerInTransitChange: x.useCallback((e) => {
          s.current = e;
        }, []),
        disableHoverableContent: i,
        children: a,
      })
    );
  }, `TooltipProvider`),
  [Lg, Rg] = Ag(`Tooltip`),
  [zg, Bg] = Ag(`TooltipPortal`, { forceMount: void 0 });
function Vg(e, t) {
  let n = Math.abs(t.top - e.y),
    r = Math.abs(t.bottom - e.y),
    i = Math.abs(t.right - e.x),
    a = Math.abs(t.left - e.x);
  switch (Math.min(n, r, i, a)) {
    case a:
      return `left`;
    case i:
      return `right`;
    case n:
      return `top`;
    case r:
      return `bottom`;
    default:
      throw Error(`unreachable`);
  }
}
kg(Vg, `getExitSideFromRect`);
function Hg(e, t, n = 5) {
  let r = [];
  switch (t) {
    case `top`:
      r.push({ x: e.x - n, y: e.y + n }, { x: e.x + n, y: e.y + n });
      break;
    case `bottom`:
      r.push({ x: e.x - n, y: e.y - n }, { x: e.x + n, y: e.y - n });
      break;
    case `left`:
      r.push({ x: e.x + n, y: e.y - n }, { x: e.x + n, y: e.y + n });
      break;
    case `right`:
      r.push({ x: e.x - n, y: e.y - n }, { x: e.x - n, y: e.y + n });
  }
  return r;
}
kg(Hg, `getPaddedExitPoints`);
function Ug(e) {
  let { top: t, right: n, bottom: r, left: i } = e;
  return [
    { x: i, y: t },
    { x: n, y: t },
    { x: n, y: r },
    { x: i, y: r },
  ];
}
kg(Ug, `getPointsFromRect`);
function Wg(e, t) {
  let { x: n, y: r } = e,
    i = !1;
  for (let e = 0, a = t.length - 1; e < t.length; a = e++) {
    let o = t[e],
      s = t[a],
      c = o.x,
      l = o.y,
      u = s.x,
      d = s.y;
    l > r != d > r && n < ((u - c) * (r - l)) / (d - l) + c && (i = !i);
  }
  return i;
}
kg(Wg, `isPointInPolygon`);
function Gg(e) {
  let t = e.slice();
  return (
    t.sort((e, t) =>
      e.x < t.x ? -1 : e.x > t.x ? 1 : e.y < t.y ? -1 : +(e.y > t.y),
    ),
    Kg(t)
  );
}
kg(Gg, `getHull`);
function Kg(e) {
  if (e.length <= 1) return e.slice();
  let t = [];
  for (let n = 0; n < e.length; n++) {
    let r = e[n];
    for (; t.length >= 2;) {
      let e = t[t.length - 1],
        n = t[t.length - 2];
      if ((e.x - n.x) * (r.y - n.y) >= (e.y - n.y) * (r.x - n.x)) t.pop();
      else break;
    }
    t.push(r);
  }
  t.pop();
  let n = [];
  for (let t = e.length - 1; t >= 0; t--) {
    let r = e[t];
    for (; n.length >= 2;) {
      let e = n[n.length - 1],
        t = n[n.length - 2];
      if ((e.x - t.x) * (r.y - t.y) >= (e.y - t.y) * (r.x - t.x)) n.pop();
      else break;
    }
    n.push(r);
  }
  return (
    n.pop(),
    t.length === 1 && n.length === 1 && t[0].x === n[0].x && t[0].y === n[0].y
      ? t
      : t.concat(n)
  );
}
kg(Kg, `getHullPresorted`);
var qg = Ig;
function Jg(e) {
  var t,
    n,
    r = ``;
  if (typeof e == `string` || typeof e == `number`) r += e;
  else if (typeof e == `object`)
    if (Array.isArray(e)) {
      var i = e.length;
      for (t = 0; t < i; t++)
        e[t] && (n = Jg(e[t])) && (r && (r += ` `), (r += n));
    } else for (n in e) e[n] && (r && (r += ` `), (r += n));
  return r;
}
function Yg() {
  for (var e, t, n = 0, r = ``, i = arguments.length; n < i; n++)
    (e = arguments[n]) && (t = Jg(e)) && (r && (r += ` `), (r += t));
  return r;
}
var Xg = (e, t) => {
    let n = Array(e.length + t.length);
    for (let t = 0; t < e.length; t++) n[t] = e[t];
    for (let r = 0; r < t.length; r++) n[e.length + r] = t[r];
    return n;
  },
  Zg = (e, t) => ({ classGroupId: e, validator: t }),
  Qg = (e = new Map(), t = null, n) => ({
    nextPart: e,
    validators: t,
    classGroupId: n,
  }),
  $g = `-`,
  e_ = [],
  t_ = `arbitrary..`,
  n_ = (e) => {
    let t = a_(e),
      { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
    return {
      getClassGroupId: (e) => {
        if (e.startsWith(`[`) && e.endsWith(`]`)) return i_(e);
        let n = e.split($g);
        return r_(n, +(n[0] === `` && n.length > 1), t);
      },
      getConflictingClassGroupIds: (e, t) => {
        if (t) {
          let t = r[e],
            i = n[e];
          return t ? (i ? Xg(i, t) : t) : i || e_;
        }
        return n[e] || e_;
      },
    };
  },
  r_ = (e, t, n) => {
    if (e.length - t === 0) return n.classGroupId;
    let r = e[t],
      i = n.nextPart.get(r);
    if (i) {
      let n = r_(e, t + 1, i);
      if (n) return n;
    }
    let a = n.validators;
    if (a === null) return;
    let o = t === 0 ? e.join($g) : e.slice(t).join($g),
      s = a.length;
    for (let e = 0; e < s; e++) {
      let t = a[e];
      if (t.validator(o)) return t.classGroupId;
    }
  },
  i_ = (e) =>
    e.slice(1, -1).indexOf(`:`) === -1
      ? void 0
      : (() => {
          let t = e.slice(1, -1),
            n = t.indexOf(`:`),
            r = t.slice(0, n);
          return r ? t_ + r : void 0;
        })(),
  a_ = (e) => {
    let { theme: t, classGroups: n } = e;
    return o_(n, t);
  },
  o_ = (e, t) => {
    let n = Qg();
    for (let r in e) {
      let i = e[r];
      s_(i, n, r, t);
    }
    return n;
  },
  s_ = (e, t, n, r) => {
    let i = e.length;
    for (let a = 0; a < i; a++) {
      let i = e[a];
      c_(i, t, n, r);
    }
  },
  c_ = (e, t, n, r) => {
    if (typeof e == `string`) {
      l_(e, t, n);
      return;
    }
    if (typeof e == `function`) {
      u_(e, t, n, r);
      return;
    }
    d_(e, t, n, r);
  },
  l_ = (e, t, n) => {
    let r = e === `` ? t : f_(t, e);
    r.classGroupId = n;
  },
  u_ = (e, t, n, r) => {
    if (p_(e)) {
      s_(e(r), t, n, r);
      return;
    }
    (t.validators === null && (t.validators = []), t.validators.push(Zg(n, e)));
  },
  d_ = (e, t, n, r) => {
    let i = Object.entries(e),
      a = i.length;
    for (let e = 0; e < a; e++) {
      let [a, o] = i[e];
      s_(o, f_(t, a), n, r);
    }
  },
  f_ = (e, t) => {
    let n = e,
      r = t.split($g),
      i = r.length;
    for (let e = 0; e < i; e++) {
      let t = r[e],
        i = n.nextPart.get(t);
      (i || ((i = Qg()), n.nextPart.set(t, i)), (n = i));
    }
    return n;
  },
  p_ = (e) => `isThemeGetter` in e && e.isThemeGetter === !0,
  m_ = (e) => {
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
  h_ = `!`,
  g_ = `:`,
  __ = [],
  v_ = (e, t, n, r, i) => ({
    modifiers: e,
    hasImportantModifier: t,
    baseClassName: n,
    maybePostfixModifierPosition: r,
    isExternal: i,
  }),
  y_ = (e) => {
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
            if (o === g_) {
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
        s.endsWith(h_)
          ? ((c = s.slice(0, -1)), (l = !0))
          : s.startsWith(h_) && ((c = s.slice(1)), (l = !0));
        let u = a && a > i ? a - i : void 0;
        return v_(t, l, c, u);
      };
    if (t) {
      let e = t + g_,
        n = r;
      r = (t) =>
        t.startsWith(e) ? n(t.slice(e.length)) : v_(__, !1, t, void 0, !0);
    }
    if (n) {
      let e = r;
      r = (t) => n({ className: t, parseClassName: e });
    }
    return r;
  },
  b_ = (e) => {
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
  x_ = (e) => ({
    cache: m_(e.cacheSize),
    parseClassName: y_(e),
    sortModifiers: b_(e),
    postfixLookupClassGroupIds: S_(e),
    ...n_(e),
  }),
  S_ = (e) => {
    let t = Object.create(null),
      n = e.postfixLookupClassGroups;
    if (n) for (let e = 0; e < n.length; e++) t[n[e]] = !0;
    return t;
  },
  C_ = /\s+/,
  w_ = (e, t) => {
    let {
        parseClassName: n,
        getClassGroupId: r,
        getConflictingClassGroupIds: i,
        sortModifiers: a,
        postfixLookupClassGroupIds: o,
      } = t,
      s = [],
      c = e.trim().split(C_),
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
        v = f ? _ + h_ : _,
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
  T_ = (...e) => {
    let t = 0,
      n,
      r,
      i = ``;
    for (; t < e.length;)
      (n = e[t++]) && (r = E_(n)) && (i && (i += ` `), (i += r));
    return i;
  },
  E_ = (e) => {
    if (typeof e == `string`) return e;
    let t,
      n = ``;
    for (let r = 0; r < e.length; r++)
      e[r] && (t = E_(e[r])) && (n && (n += ` `), (n += t));
    return n;
  },
  D_ = (e, ...t) => {
    let n,
      r,
      i,
      a,
      o = (o) => (
        (n = x_(t.reduce((e, t) => t(e), e()))),
        (r = n.cache.get),
        (i = n.cache.set),
        (a = s),
        s(o)
      ),
      s = (e) => {
        let t = r(e);
        if (t) return t;
        let a = w_(e, n);
        return (i(e, a), a);
      };
    return ((a = o), (...e) => a(T_(...e)));
  },
  O_ = [],
  k_ = (e) => {
    let t = (t) => t[e] || O_;
    return ((t.isThemeGetter = !0), t);
  },
  A_ = /^\[(?:(\w[\w-]*):)?(.+)\]$/i,
  j_ = /^\((?:(\w[\w-]*):)?(.+)\)$/i,
  M_ = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,
  N_ = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
  P_ =
    /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
  F_ = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,
  I_ = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
  L_ =
    /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
  R_ = (e) => M_.test(e),
  Z = (e) => !!e && !Number.isNaN(Number(e)),
  z_ = (e) => !!e && Number.isInteger(Number(e)),
  B_ = (e) => e.endsWith(`%`) && Z(e.slice(0, -1)),
  V_ = (e) => N_.test(e),
  H_ = () => !0,
  U_ = (e) => P_.test(e) && !F_.test(e),
  W_ = () => !1,
  G_ = (e) => I_.test(e),
  K_ = (e) => L_.test(e),
  q_ = (e) => !Q(e) && !$(e),
  J_ = (e) =>
    e.startsWith(`@container`) &&
    ((e[10] === `/` && e[11] !== void 0) ||
      (e[11] === `s` && e[16] !== void 0 && e.startsWith(`-size/`, 10)) ||
      (e[11] === `n` && e[18] !== void 0 && e.startsWith(`-normal/`, 10))),
  Y_ = (e) => uv(e, mv, W_),
  Q = (e) => A_.test(e),
  X_ = (e) => uv(e, hv, U_),
  Z_ = (e) => uv(e, gv, Z),
  Q_ = (e) => uv(e, vv, H_),
  $_ = (e) => uv(e, _v, W_),
  ev = (e) => uv(e, fv, W_),
  tv = (e) => uv(e, pv, K_),
  nv = (e) => uv(e, yv, G_),
  $ = (e) => j_.test(e),
  rv = (e) => dv(e, hv),
  iv = (e) => dv(e, _v),
  av = (e) => dv(e, fv),
  ov = (e) => dv(e, mv),
  sv = (e) => dv(e, pv),
  cv = (e) => dv(e, yv, !0),
  lv = (e) => dv(e, vv, !0),
  uv = (e, t, n) => {
    let r = A_.exec(e);
    return r ? (r[1] ? t(r[1]) : n(r[2])) : !1;
  },
  dv = (e, t, n = !1) => {
    let r = j_.exec(e);
    return r ? (r[1] ? t(r[1]) : n) : !1;
  },
  fv = (e) => e === `position` || e === `percentage`,
  pv = (e) => e === `image` || e === `url`,
  mv = (e) => e === `length` || e === `size` || e === `bg-size`,
  hv = (e) => e === `length`,
  gv = (e) => e === `number`,
  _v = (e) => e === `family-name`,
  vv = (e) => e === `number` || e === `weight`,
  yv = (e) => e === `shadow`,
  bv = D_(() => {
    let e = k_(`color`),
      t = k_(`font`),
      n = k_(`text`),
      r = k_(`font-weight`),
      i = k_(`tracking`),
      a = k_(`leading`),
      o = k_(`breakpoint`),
      s = k_(`container`),
      c = k_(`spacing`),
      l = k_(`radius`),
      u = k_(`shadow`),
      d = k_(`inset-shadow`),
      f = k_(`text-shadow`),
      p = k_(`drop-shadow`),
      m = k_(`blur`),
      h = k_(`perspective`),
      g = k_(`aspect`),
      _ = k_(`ease`),
      v = k_(`animate`),
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
      x = () => [...b(), $, Q],
      S = () => [`auto`, `hidden`, `clip`, `visible`, `scroll`],
      C = () => [`auto`, `contain`, `none`],
      w = () => [$, Q, c],
      T = () => [R_, `full`, `auto`, ...w()],
      ee = () => [z_, `none`, `subgrid`, $, Q],
      te = () => [`auto`, { span: [`full`, z_, $, Q] }, z_, $, Q],
      E = () => [z_, `auto`, $, Q],
      ne = () => [`auto`, `min`, `max`, `fr`, $, Q],
      re = () => [
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
      ie = () => [
        `start`,
        `end`,
        `center`,
        `stretch`,
        `center-safe`,
        `end-safe`,
      ],
      ae = () => [`auto`, ...w()],
      oe = () => [
        R_,
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
      se = () => [
        R_,
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
      ce = () => [
        R_,
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
      D = () => [e, $, Q],
      O = () => [...b(), av, ev, { position: [$, Q] }],
      le = () => [`no-repeat`, { repeat: [``, `x`, `y`, `space`, `round`] }],
      ue = () => [`auto`, `cover`, `contain`, ov, Y_, { size: [$, Q] }],
      de = () => [B_, rv, X_],
      k = () => [``, `none`, `full`, l, $, Q],
      A = () => [``, Z, rv, X_],
      j = () => [`solid`, `dashed`, `dotted`, `double`],
      fe = () => [
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
      M = () => [Z, B_, av, ev],
      pe = () => [``, `none`, m, $, Q],
      me = () => [`none`, Z, $, Q],
      he = () => [`none`, Z, $, Q],
      ge = () => [Z, $, Q],
      _e = () => [R_, `full`, ...w()];
    return {
      cacheSize: 500,
      theme: {
        animate: [`spin`, `ping`, `pulse`, `bounce`],
        aspect: [`video`],
        blur: [V_],
        breakpoint: [V_],
        color: [H_],
        container: [V_],
        "drop-shadow": [V_],
        ease: [`in`, `out`, `in-out`],
        font: [q_],
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
        "inset-shadow": [V_],
        leading: [`none`, `tight`, `snug`, `normal`, `relaxed`, `loose`],
        perspective: [
          `dramatic`,
          `near`,
          `normal`,
          `midrange`,
          `distant`,
          `none`,
        ],
        radius: [V_],
        shadow: [V_],
        spacing: [`px`, Z],
        text: [V_],
        "text-shadow": [V_],
        tracking: [`tighter`, `tight`, `normal`, `wide`, `wider`, `widest`],
      },
      classGroups: {
        aspect: [{ aspect: [`auto`, `square`, R_, Q, $, g] }],
        container: [`container`],
        "container-type": [{ "@container": [``, `normal`, `size`, $, Q] }],
        "container-named": [J_],
        columns: [{ columns: [Z, Q, $, s] }],
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
        z: [{ z: [z_, `auto`, $, Q] }],
        basis: [{ basis: [R_, `full`, `auto`, s, ...w()] }],
        "flex-direction": [
          { flex: [`row`, `row-reverse`, `col`, `col-reverse`] },
        ],
        "flex-wrap": [{ flex: [`nowrap`, `wrap`, `wrap-reverse`] }],
        flex: [{ flex: [Z, R_, `auto`, `initial`, `none`, Q] }],
        grow: [{ grow: [``, Z, $, Q] }],
        shrink: [{ shrink: [``, Z, $, Q] }],
        order: [{ order: [z_, `first`, `last`, `none`, $, Q] }],
        "grid-cols": [{ "grid-cols": ee() }],
        "col-start-end": [{ col: te() }],
        "col-start": [{ "col-start": E() }],
        "col-end": [{ "col-end": E() }],
        "grid-rows": [{ "grid-rows": ee() }],
        "row-start-end": [{ row: te() }],
        "row-start": [{ "row-start": E() }],
        "row-end": [{ "row-end": E() }],
        "grid-flow": [
          { "grid-flow": [`row`, `col`, `dense`, `row-dense`, `col-dense`] },
        ],
        "auto-cols": [{ "auto-cols": ne() }],
        "auto-rows": [{ "auto-rows": ne() }],
        gap: [{ gap: w() }],
        "gap-x": [{ "gap-x": w() }],
        "gap-y": [{ "gap-y": w() }],
        "justify-content": [{ justify: [...re(), `normal`] }],
        "justify-items": [{ "justify-items": [...ie(), `normal`] }],
        "justify-self": [{ "justify-self": [`auto`, ...ie()] }],
        "align-content": [{ content: [`normal`, ...re()] }],
        "align-items": [{ items: [...ie(), { baseline: [``, `last`] }] }],
        "align-self": [{ self: [`auto`, ...ie(), { baseline: [``, `last`] }] }],
        "place-content": [{ "place-content": re() }],
        "place-items": [{ "place-items": [...ie(), `baseline`] }],
        "place-self": [{ "place-self": [`auto`, ...ie()] }],
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
        m: [{ m: ae() }],
        mx: [{ mx: ae() }],
        my: [{ my: ae() }],
        ms: [{ ms: ae() }],
        me: [{ me: ae() }],
        mbs: [{ mbs: ae() }],
        mbe: [{ mbe: ae() }],
        mt: [{ mt: ae() }],
        mr: [{ mr: ae() }],
        mb: [{ mb: ae() }],
        ml: [{ ml: ae() }],
        "space-x": [{ "space-x": w() }],
        "space-x-reverse": [`space-x-reverse`],
        "space-y": [{ "space-y": w() }],
        "space-y-reverse": [`space-y-reverse`],
        size: [{ size: oe() }],
        "inline-size": [{ inline: [`auto`, ...se()] }],
        "min-inline-size": [{ "min-inline": [`auto`, ...se()] }],
        "max-inline-size": [{ "max-inline": [`none`, ...se()] }],
        "block-size": [{ block: [`auto`, ...ce()] }],
        "min-block-size": [{ "min-block": [`auto`, ...ce()] }],
        "max-block-size": [{ "max-block": [`none`, ...ce()] }],
        w: [{ w: [s, `screen`, ...oe()] }],
        "min-w": [{ "min-w": [s, `screen`, `none`, ...oe()] }],
        "max-w": [
          { "max-w": [s, `screen`, `none`, `prose`, { screen: [o] }, ...oe()] },
        ],
        h: [{ h: [`screen`, `lh`, ...oe()] }],
        "min-h": [{ "min-h": [`screen`, `lh`, `none`, ...oe()] }],
        "max-h": [{ "max-h": [`screen`, `lh`, ...oe()] }],
        "font-size": [{ text: [`base`, n, rv, X_] }],
        "font-smoothing": [`antialiased`, `subpixel-antialiased`],
        "font-style": [`italic`, `not-italic`],
        "font-weight": [{ font: [r, lv, Q_] }],
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
              B_,
              Q,
            ],
          },
        ],
        "font-family": [{ font: [iv, $_, t] }],
        "font-features": [{ "font-features": [Q] }],
        "fvn-normal": [`normal-nums`],
        "fvn-ordinal": [`ordinal`],
        "fvn-slashed-zero": [`slashed-zero`],
        "fvn-figure": [`lining-nums`, `oldstyle-nums`],
        "fvn-spacing": [`proportional-nums`, `tabular-nums`],
        "fvn-fraction": [`diagonal-fractions`, `stacked-fractions`],
        tracking: [{ tracking: [i, $, Q] }],
        "line-clamp": [{ "line-clamp": [Z, `none`, $, Z_] }],
        leading: [{ leading: [a, ...w()] }],
        "list-image": [{ "list-image": [`none`, $, Q] }],
        "list-style-position": [{ list: [`inside`, `outside`] }],
        "list-style-type": [{ list: [`disc`, `decimal`, `none`, $, Q] }],
        "text-alignment": [
          { text: [`left`, `center`, `right`, `justify`, `start`, `end`] },
        ],
        "placeholder-color": [{ placeholder: D() }],
        "text-color": [{ text: D() }],
        "text-decoration": [
          `underline`,
          `overline`,
          `line-through`,
          `no-underline`,
        ],
        "text-decoration-style": [{ decoration: [...j(), `wavy`] }],
        "text-decoration-thickness": [
          { decoration: [Z, `from-font`, `auto`, $, X_] },
        ],
        "text-decoration-color": [{ decoration: D() }],
        "underline-offset": [{ "underline-offset": [Z, `auto`, $, Q] }],
        "text-transform": [
          `uppercase`,
          `lowercase`,
          `capitalize`,
          `normal-case`,
        ],
        "text-overflow": [`truncate`, `text-ellipsis`, `text-clip`],
        "text-wrap": [{ text: [`wrap`, `nowrap`, `balance`, `pretty`] }],
        indent: [{ indent: w() }],
        "tab-size": [{ tab: [z_, $, Q] }],
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
              $,
              Q,
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
        content: [{ content: [`none`, $, Q] }],
        "bg-attachment": [{ bg: [`fixed`, `local`, `scroll`] }],
        "bg-clip": [{ "bg-clip": [`border`, `padding`, `content`, `text`] }],
        "bg-origin": [{ "bg-origin": [`border`, `padding`, `content`] }],
        "bg-position": [{ bg: O() }],
        "bg-repeat": [{ bg: le() }],
        "bg-size": [{ bg: ue() }],
        "bg-image": [
          {
            bg: [
              `none`,
              {
                linear: [
                  { to: [`t`, `tr`, `r`, `br`, `b`, `bl`, `l`, `tl`] },
                  z_,
                  $,
                  Q,
                ],
                radial: [``, $, Q],
                conic: [z_, $, Q],
              },
              sv,
              tv,
            ],
          },
        ],
        "bg-color": [{ bg: D() }],
        "gradient-from-pos": [{ from: de() }],
        "gradient-via-pos": [{ via: de() }],
        "gradient-to-pos": [{ to: de() }],
        "gradient-from": [{ from: D() }],
        "gradient-via": [{ via: D() }],
        "gradient-to": [{ to: D() }],
        rounded: [{ rounded: k() }],
        "rounded-s": [{ "rounded-s": k() }],
        "rounded-e": [{ "rounded-e": k() }],
        "rounded-t": [{ "rounded-t": k() }],
        "rounded-r": [{ "rounded-r": k() }],
        "rounded-b": [{ "rounded-b": k() }],
        "rounded-l": [{ "rounded-l": k() }],
        "rounded-ss": [{ "rounded-ss": k() }],
        "rounded-se": [{ "rounded-se": k() }],
        "rounded-ee": [{ "rounded-ee": k() }],
        "rounded-es": [{ "rounded-es": k() }],
        "rounded-tl": [{ "rounded-tl": k() }],
        "rounded-tr": [{ "rounded-tr": k() }],
        "rounded-br": [{ "rounded-br": k() }],
        "rounded-bl": [{ "rounded-bl": k() }],
        "border-w": [{ border: A() }],
        "border-w-x": [{ "border-x": A() }],
        "border-w-y": [{ "border-y": A() }],
        "border-w-s": [{ "border-s": A() }],
        "border-w-e": [{ "border-e": A() }],
        "border-w-bs": [{ "border-bs": A() }],
        "border-w-be": [{ "border-be": A() }],
        "border-w-t": [{ "border-t": A() }],
        "border-w-r": [{ "border-r": A() }],
        "border-w-b": [{ "border-b": A() }],
        "border-w-l": [{ "border-l": A() }],
        "divide-x": [{ "divide-x": A() }],
        "divide-x-reverse": [`divide-x-reverse`],
        "divide-y": [{ "divide-y": A() }],
        "divide-y-reverse": [`divide-y-reverse`],
        "border-style": [{ border: [...j(), `hidden`, `none`] }],
        "divide-style": [{ divide: [...j(), `hidden`, `none`] }],
        "border-color": [{ border: D() }],
        "border-color-x": [{ "border-x": D() }],
        "border-color-y": [{ "border-y": D() }],
        "border-color-s": [{ "border-s": D() }],
        "border-color-e": [{ "border-e": D() }],
        "border-color-bs": [{ "border-bs": D() }],
        "border-color-be": [{ "border-be": D() }],
        "border-color-t": [{ "border-t": D() }],
        "border-color-r": [{ "border-r": D() }],
        "border-color-b": [{ "border-b": D() }],
        "border-color-l": [{ "border-l": D() }],
        "divide-color": [{ divide: D() }],
        "outline-style": [{ outline: [...j(), `none`, `hidden`] }],
        "outline-offset": [{ "outline-offset": [Z, $, Q] }],
        "outline-w": [{ outline: [``, Z, rv, X_] }],
        "outline-color": [{ outline: D() }],
        shadow: [{ shadow: [``, `none`, u, cv, nv] }],
        "shadow-color": [{ shadow: D() }],
        "inset-shadow": [{ "inset-shadow": [`none`, d, cv, nv] }],
        "inset-shadow-color": [{ "inset-shadow": D() }],
        "ring-w": [{ ring: A() }],
        "ring-w-inset": [`ring-inset`],
        "ring-color": [{ ring: D() }],
        "ring-offset-w": [{ "ring-offset": [Z, X_] }],
        "ring-offset-color": [{ "ring-offset": D() }],
        "inset-ring-w": [{ "inset-ring": A() }],
        "inset-ring-color": [{ "inset-ring": D() }],
        "text-shadow": [{ "text-shadow": [`none`, f, cv, nv] }],
        "text-shadow-color": [{ "text-shadow": D() }],
        opacity: [{ opacity: [Z, $, Q] }],
        "mix-blend": [
          { "mix-blend": [...fe(), `plus-darker`, `plus-lighter`] },
        ],
        "bg-blend": [{ "bg-blend": fe() }],
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
        "mask-image-linear-pos": [{ "mask-linear": [Z] }],
        "mask-image-linear-from-pos": [{ "mask-linear-from": M() }],
        "mask-image-linear-to-pos": [{ "mask-linear-to": M() }],
        "mask-image-linear-from-color": [{ "mask-linear-from": D() }],
        "mask-image-linear-to-color": [{ "mask-linear-to": D() }],
        "mask-image-t-from-pos": [{ "mask-t-from": M() }],
        "mask-image-t-to-pos": [{ "mask-t-to": M() }],
        "mask-image-t-from-color": [{ "mask-t-from": D() }],
        "mask-image-t-to-color": [{ "mask-t-to": D() }],
        "mask-image-r-from-pos": [{ "mask-r-from": M() }],
        "mask-image-r-to-pos": [{ "mask-r-to": M() }],
        "mask-image-r-from-color": [{ "mask-r-from": D() }],
        "mask-image-r-to-color": [{ "mask-r-to": D() }],
        "mask-image-b-from-pos": [{ "mask-b-from": M() }],
        "mask-image-b-to-pos": [{ "mask-b-to": M() }],
        "mask-image-b-from-color": [{ "mask-b-from": D() }],
        "mask-image-b-to-color": [{ "mask-b-to": D() }],
        "mask-image-l-from-pos": [{ "mask-l-from": M() }],
        "mask-image-l-to-pos": [{ "mask-l-to": M() }],
        "mask-image-l-from-color": [{ "mask-l-from": D() }],
        "mask-image-l-to-color": [{ "mask-l-to": D() }],
        "mask-image-x-from-pos": [{ "mask-x-from": M() }],
        "mask-image-x-to-pos": [{ "mask-x-to": M() }],
        "mask-image-x-from-color": [{ "mask-x-from": D() }],
        "mask-image-x-to-color": [{ "mask-x-to": D() }],
        "mask-image-y-from-pos": [{ "mask-y-from": M() }],
        "mask-image-y-to-pos": [{ "mask-y-to": M() }],
        "mask-image-y-from-color": [{ "mask-y-from": D() }],
        "mask-image-y-to-color": [{ "mask-y-to": D() }],
        "mask-image-radial": [{ "mask-radial": [$, Q] }],
        "mask-image-radial-from-pos": [{ "mask-radial-from": M() }],
        "mask-image-radial-to-pos": [{ "mask-radial-to": M() }],
        "mask-image-radial-from-color": [{ "mask-radial-from": D() }],
        "mask-image-radial-to-color": [{ "mask-radial-to": D() }],
        "mask-image-radial-shape": [{ "mask-radial": [`circle`, `ellipse`] }],
        "mask-image-radial-size": [
          {
            "mask-radial": [
              { closest: [`side`, `corner`], farthest: [`side`, `corner`] },
            ],
          },
        ],
        "mask-image-radial-pos": [{ "mask-radial-at": b() }],
        "mask-image-conic-pos": [{ "mask-conic": [Z] }],
        "mask-image-conic-from-pos": [{ "mask-conic-from": M() }],
        "mask-image-conic-to-pos": [{ "mask-conic-to": M() }],
        "mask-image-conic-from-color": [{ "mask-conic-from": D() }],
        "mask-image-conic-to-color": [{ "mask-conic-to": D() }],
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
        "mask-position": [{ mask: O() }],
        "mask-repeat": [{ mask: le() }],
        "mask-size": [{ mask: ue() }],
        "mask-type": [{ "mask-type": [`alpha`, `luminance`] }],
        "mask-image": [{ mask: [`none`, $, Q] }],
        filter: [{ filter: [``, `none`, $, Q] }],
        blur: [{ blur: pe() }],
        brightness: [{ brightness: [Z, $, Q] }],
        contrast: [{ contrast: [Z, $, Q] }],
        "drop-shadow": [{ "drop-shadow": [``, `none`, p, cv, nv] }],
        "drop-shadow-color": [{ "drop-shadow": D() }],
        grayscale: [{ grayscale: [``, Z, $, Q] }],
        "hue-rotate": [{ "hue-rotate": [Z, $, Q] }],
        invert: [{ invert: [``, Z, $, Q] }],
        saturate: [{ saturate: [Z, $, Q] }],
        sepia: [{ sepia: [``, Z, $, Q] }],
        "backdrop-filter": [{ "backdrop-filter": [``, `none`, $, Q] }],
        "backdrop-blur": [{ "backdrop-blur": pe() }],
        "backdrop-brightness": [{ "backdrop-brightness": [Z, $, Q] }],
        "backdrop-contrast": [{ "backdrop-contrast": [Z, $, Q] }],
        "backdrop-grayscale": [{ "backdrop-grayscale": [``, Z, $, Q] }],
        "backdrop-hue-rotate": [{ "backdrop-hue-rotate": [Z, $, Q] }],
        "backdrop-invert": [{ "backdrop-invert": [``, Z, $, Q] }],
        "backdrop-opacity": [{ "backdrop-opacity": [Z, $, Q] }],
        "backdrop-saturate": [{ "backdrop-saturate": [Z, $, Q] }],
        "backdrop-sepia": [{ "backdrop-sepia": [``, Z, $, Q] }],
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
              $,
              Q,
            ],
          },
        ],
        "transition-behavior": [{ transition: [`normal`, `discrete`] }],
        duration: [{ duration: [Z, `initial`, $, Q] }],
        ease: [{ ease: [`linear`, `initial`, _, $, Q] }],
        delay: [{ delay: [Z, $, Q] }],
        animate: [{ animate: [`none`, v, $, Q] }],
        backface: [{ backface: [`hidden`, `visible`] }],
        perspective: [{ perspective: [h, $, Q] }],
        "perspective-origin": [{ "perspective-origin": x() }],
        rotate: [{ rotate: me() }],
        "rotate-x": [{ "rotate-x": me() }],
        "rotate-y": [{ "rotate-y": me() }],
        "rotate-z": [{ "rotate-z": me() }],
        scale: [{ scale: he() }],
        "scale-x": [{ "scale-x": he() }],
        "scale-y": [{ "scale-y": he() }],
        "scale-z": [{ "scale-z": he() }],
        "scale-3d": [`scale-3d`],
        skew: [{ skew: ge() }],
        "skew-x": [{ "skew-x": ge() }],
        "skew-y": [{ "skew-y": ge() }],
        transform: [{ transform: [$, Q, ``, `none`, `gpu`, `cpu`] }],
        "transform-origin": [{ origin: x() }],
        "transform-style": [{ transform: [`3d`, `flat`] }],
        translate: [{ translate: _e() }],
        "translate-x": [{ "translate-x": _e() }],
        "translate-y": [{ "translate-y": _e() }],
        "translate-z": [{ "translate-z": _e() }],
        "translate-none": [`translate-none`],
        zoom: [{ zoom: [z_, $, Q] }],
        accent: [{ accent: D() }],
        appearance: [{ appearance: [`none`, `auto`] }],
        "caret-color": [{ caret: D() }],
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
              $,
              Q,
            ],
          },
        ],
        "field-sizing": [{ "field-sizing": [`fixed`, `content`] }],
        "pointer-events": [{ "pointer-events": [`auto`, `none`] }],
        resize: [{ resize: [`none`, ``, `y`, `x`] }],
        "scroll-behavior": [{ scroll: [`auto`, `smooth`] }],
        "scrollbar-thumb-color": [{ "scrollbar-thumb": D() }],
        "scrollbar-track-color": [{ "scrollbar-track": D() }],
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
          { "will-change": [`auto`, `scroll`, `contents`, `transform`, $, Q] },
        ],
        fill: [{ fill: [`none`, ...D()] }],
        "stroke-w": [{ stroke: [Z, rv, X_, Z_] }],
        stroke: [{ stroke: [`none`, ...D()] }],
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
function xv(...e) {
  return bv(Yg(e));
}
function Sv({ delayDuration: e = 0, ...t }) {
  return (0, J.jsx)(qg, {
    "data-slot": `tooltip-provider`,
    delayDuration: e,
    ...t,
  });
}
function Cv({ children: e }) {
  return (0, J.jsx)(Ed, {
    children: (0, J.jsx)(Mp, {
      children: (0, J.jsx)(Fm, {
        children: (0, J.jsx)(Sv, {
          children: (0, J.jsxs)(Xm, { children: [(0, J.jsx)(Wh, {}), e] }),
        }),
      }),
    }),
  });
}
function wv(e, t) {
  return new Proxy(
    {},
    {
      get(n, r) {
        if (typeof r == `string`) return wv(e, [...t, r]);
        if (r === Zd) {
          if (t.length < 1) {
            let n = [e, ...t].join(`.`);
            throw Error(
              `API path is expected to be of the form \`${e}.childComponent.functionName\`. Found: \`${n}\``,
            );
          }
          return `_reference/childComponent/` + t.join(`/`);
        }
      },
    },
  );
}
var Tv = () => wv(`components`, []),
  Ev = af;
Tv();
function Dv({ className: e, ...t }) {
  return (0, J.jsx)(lh, {
    role: `status`,
    "aria-label": `Loading`,
    className: xv(`size-4 animate-spin`, e),
    ...t,
  });
}
var Ov = (e) => (typeof e == `boolean` ? `${e}` : e === 0 ? `0` : e),
  kv = Yg,
  Av = ((e, t) => (n) => {
    if (t?.variants == null) return kv(e, n?.class, n?.className);
    let { variants: r, defaultVariants: i } = t,
      a = Object.keys(r).map((e) => {
        let t = n?.[e],
          a = i?.[e];
        if (t === null) return null;
        let o = Ov(t) || Ov(a);
        return r[e][o];
      }),
      o =
        n &&
        Object.entries(n).reduce((e, t) => {
          let [n, r] = t;
          return (r === void 0 || (e[n] = r), e);
        }, {});
    return kv(
      e,
      a,
      t?.compoundVariants?.reduce((e, t) => {
        let { class: n, className: r, ...a } = t;
        return Object.entries(a).every((e) => {
          let [t, n] = e;
          return Array.isArray(n)
            ? n.includes({ ...i, ...o }[t])
            : { ...i, ...o }[t] === n;
        })
          ? [...e, n, r]
          : e;
      }, []),
      n?.class,
      n?.className,
    );
  })(
    `inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4`,
    {
      variants: {
        variant: {
          default: `bg-primary text-primary-foreground hover:bg-primary/90`,
          destructive: `bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40`,
          outline: `border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50`,
          secondary: `bg-secondary text-secondary-foreground hover:bg-secondary/80`,
          ghost: `hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50`,
          link: `text-primary underline-offset-4 hover:underline`,
        },
        size: {
          default: `h-9 px-4 py-2 has-[>svg]:px-3`,
          xs: `h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3`,
          sm: `h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5`,
          lg: `h-10 rounded-md px-6 has-[>svg]:px-4`,
          icon: `size-9`,
          "icon-xs": `size-6 rounded-md [&_svg:not([class*='size-'])]:size-3`,
          "icon-sm": `size-8`,
          "icon-lg": `size-10`,
        },
      },
      defaultVariants: { variant: `default`, size: `default` },
    },
  );
function jv({
  className: e,
  variant: t = `default`,
  size: n = `default`,
  asChild: r = !1,
  ...i
}) {
  let a = r ? $h : `button`;
  return (0, J.jsx)(a, {
    "data-slot": `button`,
    "data-variant": t,
    "data-size": n,
    className: xv(Av({ variant: t, size: n, className: e })),
    ...i,
  });
}
var Mv = {
  en: {
    loading: `Loading...`,
    errorTitle: `Something went wrong`,
    missingState: `We couldn't find this sign-in request in this browser. Please reopen the original link in your browser (for example, Safari or Chrome), not inside another app, and sign in again.`,
    returnHome: `Return home`,
    tryAgain: `Try again`,
  },
  es: {
    loading: `Cargando...`,
    errorTitle: `Algo salió mal`,
    missingState: `No pudimos encontrar esta solicitud de inicio de sesión en este navegador. Vuelve a abrir el enlace original en tu navegador (por ejemplo, Safari o Chrome), no dentro de otra aplicación, e inicia sesión de nuevo.`,
    returnHome: `Volver al inicio`,
    tryAgain: `Intentar de nuevo`,
  },
  fr: {
    loading: `Chargement...`,
    errorTitle: `Une erreur est survenue`,
    missingState: `Nous n'avons pas trouvé cette demande de connexion dans ce navigateur. Veuillez rouvrir le lien d'origine dans votre navigateur (par exemple, Safari ou Chrome), et non dans une autre application, puis vous connecter à nouveau.`,
    returnHome: `Retour à l'accueil`,
    tryAgain: `Réessayer`,
  },
  de: {
    loading: `Wird geladen...`,
    errorTitle: `Etwas ist schiefgelaufen`,
    missingState: `Die Anmeldung konnte diesem Browser nicht zugeordnet werden. Bitte öffnen Sie den ursprünglichen Link erneut in Ihrem Browser (zum Beispiel Safari oder Chrome), nicht innerhalb einer anderen App, und melden Sie sich noch einmal an.`,
    returnHome: `Zur Startseite`,
    tryAgain: `Erneut versuchen`,
  },
  pt: {
    loading: `Carregando...`,
    errorTitle: `Algo deu errado`,
    missingState: `Não foi possível encontrar esta solicitação de login neste navegador. Abra o link original novamente no seu navegador (por exemplo, Safari ou Chrome), não dentro de outro aplicativo, e faça login novamente.`,
    returnHome: `Voltar ao início`,
    tryAgain: `Tentar novamente`,
  },
  zh: {
    loading: `加载中...`,
    errorTitle: `出错了`,
    missingState: `在此浏览器中找不到此登录请求。请在浏览器（例如 Safari 或 Chrome）中重新打开原始链接，而不是在其他应用内打开，然后重新登录。`,
    returnHome: `返回首页`,
    tryAgain: `重试`,
  },
  ja: {
    loading: `読み込み中...`,
    errorTitle: `問題が発生しました`,
    missingState: `このブラウザでは、このサインイン要求が見つかりませんでした。ほかのアプリ内ではなく、Safari や Chrome などのブラウザで元のリンクをもう一度開き、再度サインインしてください。`,
    returnHome: `ホームに戻る`,
    tryAgain: `再試行`,
  },
  ru: {
    loading: `Загрузка...`,
    errorTitle: `Что-то пошло не так`,
    missingState: `Не удалось найти этот запрос на вход в этом браузере. Откройте исходную ссылку заново в браузере (например, Safari или Chrome), а не внутри другого приложения, и войдите ещё раз.`,
    returnHome: `На главную`,
    tryAgain: `Повторить`,
  },
  it: {
    loading: `Caricamento...`,
    errorTitle: `Si è verificato un errore`,
    missingState: `Non abbiamo trovato questa richiesta di accesso in questo browser. Riapri il link originale nel browser (ad esempio Safari o Chrome), non all'interno di un'altra app, ed effettua nuovamente l'accesso.`,
    returnHome: `Torna alla home`,
    tryAgain: `Riprova`,
  },
};
function Nv(e) {
  if (typeof e != `object` || !e || !(`returnTo` in e)) return `/`;
  let { returnTo: t } = e;
  return typeof t != `string` ||
    !t.startsWith(`/`) ||
    t.startsWith(`//`) ||
    t.startsWith(`/\\`) ||
    t.startsWith(`/auth/callback`)
    ? `/`
    : t;
}
function Pv({
  messages: {
    loading: e = Mv.en.loading,
    errorTitle: t = Mv.en.errorTitle,
    missingState: n = Mv.en.missingState,
    returnHome: r = Mv.en.returnHome,
    tryAgain: i = Mv.en.tryAgain,
  } = {},
}) {
  let a = pt(),
    { user: o } = Td(),
    { isAuthenticated: s } = Cp(),
    c = bp(Ev.users.updateCurrentUser),
    l = (0, x.useCallback)(async () => {
      await c();
    }, [c]),
    u = (0, x.useCallback)(() => a(`/`, { replace: !0 }), [a]),
    d = Nv(o?.state),
    {
      status: f,
      error: p,
      retry: m,
    } = rd({
      isBackendAuthenticated: s,
      onSync: l,
      onSuccess: (0, x.useCallback)(() => a(d, { replace: !0 }), [a, d]),
      onNoAuthParams: u,
    });
  return f === `error` && p
    ? (0, J.jsxs)(`div`, {
        className: `flex flex-col items-center justify-center h-svh gap-6 px-4`,
        children: [
          (0, J.jsxs)(`div`, {
            className: `flex flex-col items-center gap-2 text-center`,
            children: [
              (0, J.jsx)(`p`, {
                className: `text-destructive font-medium`,
                children: t,
              }),
              (0, J.jsx)(`p`, {
                className: `text-sm text-muted-foreground max-w-md`,
                children: p === `No matching state found in storage` ? n : p,
              }),
            ],
          }),
          (0, J.jsxs)(`div`, {
            className: `flex gap-3`,
            children: [
              (0, J.jsx)(jv, { variant: `secondary`, onClick: u, children: r }),
              (0, J.jsx)(jv, { onClick: m, children: i }),
            ],
          }),
        ],
      })
    : (0, J.jsxs)(`div`, {
        className: `flex flex-col items-center justify-center h-svh gap-4`,
        children: [
          (0, J.jsx)(Dv, { className: `size-8`, "aria-label": e }),
          (0, J.jsx)(`p`, {
            className: `text-sm text-muted-foreground`,
            children: e,
          }),
        ],
      });
}
function Fv() {
  return (0, J.jsx)(`div`, {
    className: `min-h-screen flex items-center justify-center bg-background`,
    children: (0, J.jsxs)(`div`, {
      className: `text-center space-y-6`,
      children: [
        (0, J.jsx)(`h1`, {
          className: `text-4xl text-balance font-bold tracking-tight`,
          children: `Welcome to Your Blank App`,
        }),
        (0, J.jsx)(`p`, {
          className: `text-xl text-muted-foreground max-w-2xl mx-auto`,
          children: `Start chatting to build your app`,
        }),
      ],
    }),
  });
}
function Iv() {
  let e = ut();
  return (
    (0, x.useEffect)(() => {
      console.error(
        `404 Error: User attempted to access non-existent route:`,
        e.pathname,
      );
    }, [e.pathname]),
    (0, J.jsx)(`div`, {
      className: `min-h-screen flex items-center justify-center bg-background`,
      children: (0, J.jsxs)(`div`, {
        className: `text-center space-y-6`,
        children: [
          (0, J.jsxs)(`div`, {
            className: `space-y-2`,
            children: [
              (0, J.jsx)(`h1`, {
                className: `text-6xl font-bold text-muted-foreground`,
                children: `404`,
              }),
              (0, J.jsx)(`h2`, {
                className: `text-2xl font-semibold`,
                children: `Page Not Found`,
              }),
            ],
          }),
          (0, J.jsx)(`p`, {
            className: `text-lg text-muted-foreground max-w-md mx-auto`,
            children: `This page does not exist.`,
          }),
          (0, J.jsx)(`div`, {
            className: `pt-4`,
            children: (0, J.jsx)(jv, {
              asChild: !0,
              children: (0, J.jsx)(wn, { to: `/`, children: `Return to Home` }),
            }),
          }),
        ],
      }),
    })
  );
}
function Lv() {
  return (0, J.jsx)(Cv, {
    children: (0, J.jsx)(Cn, {
      children: (0, J.jsxs)(Rt, {
        children: [
          (0, J.jsx)(It, { path: `/`, element: (0, J.jsx)(Fv, {}) }),
          (0, J.jsx)(It, {
            path: `/auth/callback`,
            element: (0, J.jsx)(Pv, {}),
          }),
          (0, J.jsx)(It, { path: `*`, element: (0, J.jsx)(Iv, {}) }),
        ],
      }),
    }),
  });
}
(0, Fn.createRoot)(document.getElementById(`root`)).render((0, J.jsx)(Lv, {}));
