function dE(...e) {
  return uE(zw(e));
}
function fE({ delayDuration: e = 0, ...t }) {
  return (0, q.jsx)(Lw, {
    "data-slot": `tooltip-provider`,
    delayDuration: e,
    ...t,
  });
}
function pE({ children: e }) {
  return (0, q.jsx)(jd, {
    children: (0, q.jsx)(Xp, {
      children: (0, q.jsx)($m, {
        children: (0, q.jsx)(fE, {
          children: (0, q.jsxs)(mh, { children: [(0, q.jsx)(wg, {}), e] }),
        }),
      }),
    }),
  });
}
function mE(e, t) {
  return new Proxy(
    {},
    {
      get(n, r) {
        if (typeof r == `string`) return mE(e, [...t, r]);
        if (r === rf) {
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
var hE = () => mE(`components`, []),
  gE = df;
hE();
function _E({ className: e, ...t }) {
  return (0, q.jsx)(Ih, {
    role: `status`,
    "aria-label": `Loading`,
    className: dE(`size-4 animate-spin`, e),
    ...t,
  });
}
var vE = (e) => (typeof e == `boolean` ? `${e}` : e === 0 ? `0` : e),
  yE = zw,
  bE = (e, t) => (n) => {
    if (t?.variants == null) return yE(e, n?.class, n?.className);
    let { variants: r, defaultVariants: i } = t,
      a = Object.keys(r).map((e) => {
        let t = n?.[e],
          a = i?.[e];
        if (t === null) return null;
        let o = vE(t) || vE(a);
        return r[e][o];
      }),
      o =
        n &&
        Object.entries(n).reduce((e, t) => {
          let [n, r] = t;
          return (r === void 0 || (e[n] = r), e);
        }, {});
    return yE(
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
  },
  xE = bE(
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
function SE({
  className: e,
  variant: t = `default`,
  size: n = `default`,
  asChild: r = !1,
  ...i
}) {
  let a = r ? Ng : `button`;
  return (0, q.jsx)(a, {
    "data-slot": `button`,
    "data-variant": t,
    "data-size": n,
    className: dE(xE({ variant: t, size: n, className: e })),
    ...i,
  });
}
var CE = {
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
function wE(e) {
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
function TE({
  messages: {
    loading: e = CE.en.loading,
    errorTitle: t = CE.en.errorTitle,
    missingState: n = CE.en.missingState,
    returnHome: r = CE.en.returnHome,
    tryAgain: i = CE.en.tryAgain,
  } = {},
}) {
  let a = ft(),
    { user: o } = Ad(),
    { isAuthenticated: s } = Rp(),
    c = kp(gE.users.updateCurrentUser),
    l = (0, w.useCallback)(async () => {
      await c();
    }, [c]),
    u = (0, w.useCallback)(() => a(`/`, { replace: !0 }), [a]),
    d = wE(o?.state),
    {
      status: f,
      error: p,
      retry: m,
    } = cd({
      isBackendAuthenticated: s,
      onSync: l,
      onSuccess: (0, w.useCallback)(() => a(d, { replace: !0 }), [a, d]),
      onNoAuthParams: u,
    });
  return f === `error` && p
    ? (0, q.jsxs)(`div`, {
        className: `flex flex-col items-center justify-center h-svh gap-6 px-4`,
        children: [
          (0, q.jsxs)(`div`, {
            className: `flex flex-col items-center gap-2 text-center`,
            children: [
              (0, q.jsx)(`p`, {
                className: `text-destructive font-medium`,
                children: t,
              }),
              (0, q.jsx)(`p`, {
                className: `text-sm text-muted-foreground max-w-md`,
                children: p === `No matching state found in storage` ? n : p,
              }),
            ],
          }),
          (0, q.jsxs)(`div`, {
            className: `flex gap-3`,
            children: [
              (0, q.jsx)(SE, { variant: `secondary`, onClick: u, children: r }),
              (0, q.jsx)(SE, { onClick: m, children: i }),
            ],
          }),
        ],
      })
    : (0, q.jsxs)(`div`, {
        className: `flex flex-col items-center justify-center h-svh gap-4`,
        children: [
          (0, q.jsx)(_E, { className: `size-8`, "aria-label": e }),
          (0, q.jsx)(`p`, {
            className: `text-sm text-muted-foreground`,
            children: e,
          }),
        ],
      });
}
var EE = (0, w.forwardRef)(
  (
    {
      onClick: e,
      disabled: t,
      showIcon: n = !0,
      signInText: r = `Sign In`,
      signOutText: i = `Sign Out`,
      loadingText: a,
      className: o,
      variant: s,
      size: c,
      asChild: l = !1,
      ...u
    },
    d,
  ) => {
    let {
      isAuthenticated: f,
      signin: p,
      signout: m,
      isLoading: h,
      error: g,
    } = Ad();
    (0, w.useEffect)(() => {
      g &&
        (cg.error(`Login error`, { description: g.message }),
        console.error(`Login error`, g));
    }, [g]);
    let _ = (0, w.useCallback)(
        async (t) => {
          e?.(t);
          try {
            f ? await m() : await p();
          } catch (e) {
            console.error(`Authentication error:`, e);
          }
        },
        [f, m, p, e],
      ),
      v = t || h,
      y = h ? a || (f ? `Signing Out...` : `Signing In...`) : f ? i : r,
      b = h
        ? (0, q.jsx)(Ih, { className: `size-4 animate-spin` })
        : f
          ? (0, q.jsx)(Lh, { className: `size-4` })
          : (0, q.jsx)(Rh, { className: `size-4` });
    return (0, q.jsxs)(SE, {
      ref: d,
      onClick: _,
      disabled: v,
      variant: s,
      size: c,
      className: o,
      asChild: l,
      "aria-label": f ? `Sign out of your account` : `Sign in to your account`,
      "aria-describedby": g ? `auth-error` : void 0,
      ...u,
      children: [n && b, y],
    });
  },
);
EE.displayName = `SignInButton`;
function DE() {
  return (0, q.jsx)(`header`, {
    className: `sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md`,
    children: (0, q.jsxs)(`div`, {
      className: `mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6`,
      children: [
        (0, q.jsxs)(wn, {
          to: `/`,
          className: `flex items-center gap-2.5 cursor-pointer`,
          children: [
            (0, q.jsxs)(`span`, {
              className: `relative flex size-7 items-center justify-center rounded-md bg-foreground text-background`,
              children: [
                (0, q.jsx)(`span`, {
                  className: `absolute inset-1.5 rounded-sm border-2 border-current`,
                }),
                (0, q.jsx)(`span`, {
                  className: `size-1.5 rounded-full bg-accent`,
                }),
              ],
            }),
            (0, q.jsx)(`span`, {
              className: `text-lg font-semibold tracking-tight`,
              children: `HyperFrames`,
            }),
            (0, q.jsx)(`span`, {
              className: `hidden rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline`,
              children: `Studio`,
            }),
          ],
        }),
        (0, q.jsx)(Hp, {
          children: (0, q.jsx)(EE, { variant: `ghost`, size: `sm` }),
        }),
      ],
    }),
  });
}
