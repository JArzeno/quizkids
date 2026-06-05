import React from 'react';
import { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakSelect, TweakRadio } from './tweaks-panel.jsx';
import { useT, Ico, ICONS, useSession, SessionPill, RoleSwitch } from './components.jsx';
import { AuthScreen, ParentOnboardingScreen } from './screens-auth.jsx';
import { ProfilePickerScreen, ParentPinScreen, KidCodeScreen } from './screens-profile.jsx';
import { SettingsScreen } from './screens-settings.jsx';
import { WelcomeScreen, OnboardingScreen, DashboardScreen, PickerScreen, GenerateScreen } from './screens-parent.jsx';
import { QuizScreen, StudyGuideScreen, ResultsScreen, PdfPreviewScreen, KidHomeScreen } from './screens-kid.jsx';

// app.jsx — root, routing, language, tweaks

const QK_PALETTES = {
  forest:  { primary:"#3F7A4F", primaryL:"#E1EFDB", primaryD:"#2A5A38", honey:"#E29A2B", honeyL:"#FCE7BD", coral:"#E26D5A", coralL:"#FBD9D2", sky:"#6BA8C9", skyL:"#DCEBF3", bg:"#F4EFE3", bg2:"#EAE2CE", ink:"#1F3326" },
  meadow:  { primary:"#5A9F58", primaryL:"#E2F2DC", primaryD:"#36702F", honey:"#E8B23B", honeyL:"#FDECC4", coral:"#EC7B5C", coralL:"#FCD9CD", sky:"#7CB6CE", skyL:"#DFEDF4", bg:"#F4F2E5", bg2:"#E8E6D1", ink:"#1E3322" },
  ocean:   { primary:"#2F7C8A", primaryL:"#D9ECF0", primaryD:"#1D5360", honey:"#E8A53B", honeyL:"#FBE3BB", coral:"#E36E73", coralL:"#FAD4D5", sky:"#85B7DC", skyL:"#E0EDF7", bg:"#EEF2F2", bg2:"#DDE6E6", ink:"#1F2E33" },
  berry:   { primary:"#9F5099", primaryL:"#F1DEEE", primaryD:"#6B2E68", honey:"#E69A40", honeyL:"#FBE3BE", coral:"#E16980", coralL:"#FAD3DB", sky:"#7E8CC8", skyL:"#E2E5F2", bg:"#F4EFEE", bg2:"#E6DCDD", ink:"#2A1F2A" },
};

const QK_FONTS = {
  fredoka: { display:'"Fredoka", "Nunito", system-ui, sans-serif', body:'"Nunito", system-ui, sans-serif' },
  rounded: { display:'"Quicksand", system-ui, sans-serif', body:'"Quicksand", system-ui, sans-serif' },
  hand:    { display:'"Patrick Hand", "Fredoka", system-ui, sans-serif', body:'"Patrick Hand", "Nunito", system-ui, sans-serif' },
  serif:   { display:'"Bree Serif", "Fredoka", serif', body:'"Nunito", system-ui, sans-serif' },
};

function applyTheme(palKey, fontKey, isPublic) {
  // Color palette only applies inside the app. Public/marketing pages
  // (landing, auth, profile picker, PIN, kid code) always use the
  // default "forest" brand palette so the chosen theme never bleeds out.
  const p = QK_PALETTES[isPublic ? "forest" : palKey] || QK_PALETTES.forest;
  const f = QK_FONTS[fontKey] || QK_FONTS.fredoka;
  const r = document.documentElement;
  r.style.setProperty("--primary", p.primary);
  r.style.setProperty("--primary-l", p.primaryL);
  r.style.setProperty("--primary-d", p.primaryD);
  r.style.setProperty("--honey", p.honey);
  r.style.setProperty("--honey-l", p.honeyL);
  r.style.setProperty("--coral", p.coral);
  r.style.setProperty("--coral-l", p.coralL);
  r.style.setProperty("--sky", p.sky);
  r.style.setProperty("--sky-l", p.skyL);
  r.style.setProperty("--bg", p.bg);
  r.style.setProperty("--bg-2", p.bg2);
  r.style.setProperty("--ink", p.ink);
  r.style.setProperty("--font-display", f.display);
  r.style.setProperty("--font-body", f.body);
}

// Routes that are public / pre-login — palette stays on the brand default here.
const QK_PUBLIC_ROUTES = ["welcome","auth","parent-onboarding","profile-pick","parent-pin","kid-code"];


/* ----------------------------- App ----------------------------- */
function App() {
  const [tweaks, setTweak] = useTweaks(window.TWEAK_DEFAULTS);

  // map tweak palette[0] → palette key
  const palKey = React.useMemo(() => {
    const p = tweaks.palette?.[0];
    if (!p) return "forest";
    const keys = Object.keys(QK_PALETTES);
    const found = keys.find(k => QK_PALETTES[k].primary.toLowerCase() === String(p).toLowerCase());
    return found || "forest";
  }, [tweaks.palette]);

  const [lang, setLang] = React.useState("en");
  const [mode, setMode] = React.useState("parent"); // parent | kid
  const [route, setRoute] = React.useState({ name: "welcome" });

  // Apply palette only on app screens; public pages stay on brand default.
  React.useEffect(() => {
    applyTheme(palKey, tweaks.font, QK_PUBLIC_ROUTES.includes(route.name));
  }, [palKey, tweaks.font, route.name]);
  const [kids, setKids] = React.useState([]);
  const [draft, setDraft] = React.useState({ name:"", grade:"", avatar:"", color:"#3F7A4F", signature:"" });
  const [picked, setPicked] = React.useState({ subject:"sci", grade:"3", topic:"Solar System & Planets" });
  const [activeKidId, setActiveKidId] = React.useState(null);
  const [quizResult, setQuizResult] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  // account + parent prefs
  const [account, setAccount] = React.useState(null);
  const [parentPrefs, setParentPrefs] = React.useState({
    role: "mom", kidsCount: 2, langs: ["en","es"], where: ["home"],
    goalMin: 30, reminders: true, reminderAt: "5:00 pm",
    sound: true, pinFor: { settings:true, create:false, exitKid:false },
  });
  const [parentPin, setParentPin] = React.useState("1234");
  const [customSubjects, setCustomSubjects] = React.useState([]);
  const [plan, setPlan] = React.useState({ tier:"family", cycle:"monthly", since: Date.now() });

  const t = useT(lang);
  const activeKid = kids.find(k => k.id === activeKidId) || kids[0];

  // session timer — auto-rolls minutes into active kid when ended
  const session = useSession((minutes) => {
    if (minutes > 0 && activeKid) {
      setKids(ks => ks.map(k => k.id === activeKid.id ? { ...k, minutes: (k.minutes || 0) + minutes } : k));
      setToast({ kind:"session", minutes });
      setTimeout(() => setToast(null), 4000);
    }
  });

  /* ---------- role switching ---------- */
  const parentScreens = ["welcome","onboarding","dashboard","picker","generate"];
  const kidScreens    = ["kid-home","quiz","guide","results","pdf"];

  const switchMode = (next) => {
    if (next === mode) return;
    if (next === "kid") {
      // ensure we have a kid
      const target = activeKid || kids[0];
      if (!target) { goAddKid(); return; }
      setActiveKidId(target.id);
      setMode("kid");
      setRoute({ name: "kid-home" });
    } else {
      // back to parent — if session running, pause it
      if (session.running && !session.paused) session.pause();
      setMode("parent");
      setRoute({ name: kids.length ? "dashboard" : "welcome" });
    }
  };

  /* ---------- nav ---------- */
  const goWelcome = () => { setMode("parent"); setRoute({ name:"welcome" }); };
  const goAuth = (tab="signup") => { setMode("parent"); setRoute({ name:"auth", tab }); };
  const goAddKid = () => { setMode("parent"); setDraft({ name:"", grade:"", avatar:"", color:"#3F7A4F", signature:"" }); setRoute({ name:"onboarding" }); };
  const goDashboard = () => { setMode("parent"); setRoute({ name:"dashboard" }); };
  const startCreateFor = (kidId) => { setActiveKidId(kidId || kids[0]?.id); setRoute({ name:"picker" }); };

  // Auth flow handlers
  const handleAuth = ({ tab, name, email }) => {
    setAccount({ name: name || "", email: email || "" });
    if (tab === "signup") {
      setRoute({ name:"parent-onboarding" });
    } else {
      // returning user → Netflix-style profile picker
      setRoute({ name:"profile-pick" });
    }
  };
  const finishParentOnboarding = (prefs, addKid) => {
    setParentPrefs(prefs);
    if (prefs.plan) setPlan({ ...prefs.plan, since: Date.now() });
    if (addKid) {
      setDraft({ name:"", grade:"", avatar:"", color:"#3F7A4F", signature:"" });
      setRoute({ name:"onboarding" });
    } else {
      setRoute({ name:"profile-pick" });
    }
  };

  // Profile picker handlers
  const pickParentProfile = () => setRoute({ name:"parent-pin" });
  const pickKidProfile = (id) => {
    setActiveKidId(id);
    setMode("kid");
    setRoute({ name:"kid-home" });
  };
  const signOut = () => { setAccount(null); setRoute({ name:"welcome" }); };

  const finishOnboard = (d) => {
    const id = (d.name.trim().toLowerCase() || "kid") + "-" + Math.random().toString(36).slice(2,5);
    const nk = { id, name: d.name.trim() || "New kid", grade: d.grade || "K", avatar: d.avatar || "sprout", color: d.color, streak:0, stars:0, minutes:0, weekly:0, recent:[], signature: d.signature };
    setKids(ks => [...ks, nk]);
    setActiveKidId(id);
    setRoute({ name:"dashboard" });
  };

  const goPick = (kind) => {
    // entering content from generate — flip into kid mode
    setMode("kid");
    if (kind === "quiz")  setRoute({ name:"quiz" });
    if (kind === "guide") setRoute({ name:"guide" });
    if (kind === "pdf")   setRoute({ name:"pdf" });
  };

  // kid-home → open a recent item
  const kidOpenRecent = (r) => {
    if (r.title) setPicked(p => ({ ...p, topic: r.title }));
    if (r.kind === "quiz")  setRoute({ name:"quiz" });
    if (r.kind === "guide") setRoute({ name:"guide" });
    if (r.kind === "pdf")   setRoute({ name:"pdf" });
  };

  // session controls
  const onStartSession = () => session.start();
  const onTogglePause = () => session.paused ? session.resume() : session.pause();
  const onEndSession = () => session.end();

  return (
    <div className="qk-app">
      {/* chrome */}
      <div className="qk-chrome">
        <button onClick={goWelcome} className="qk-brand" style={{ appearance:"none", background:"transparent", border:0, padding:0 }}>
          <span className="qk-brand-mark">
            <Ico d={<path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z"/>} size={18} stroke={2}/>
          </span>
          QuizKids
        </button>
        <div className="qk-chrome-right">
          {/* session pill (visible in kid mode) */}
          {mode === "kid" && activeKid && !["profile-pick","parent-pin","kid-code"].includes(route.name) && (
            <SessionPill
              lang={lang}
              session={session}
              onStart={onStartSession}
              onTogglePause={onTogglePause}
              onEnd={onEndSession}
            />
          )}
          {/* role switcher */}
          {kids.length > 0 && !["welcome","onboarding","auth","parent-onboarding","profile-pick","parent-pin","kid-code"].includes(route.name) && (
            <RoleSwitch lang={lang} mode={mode} kid={activeKid} onSwitch={switchMode} />
          )}
          {/* settings gear (parent only) */}
          {mode === "parent" && account && !["welcome","onboarding","auth","parent-onboarding","profile-pick","parent-pin","kid-code","settings"].includes(route.name) && (
            <button onClick={() => setRoute({ name:"settings" })}
              className="qk-iconbtn" title="Settings"
              style={{ width:36, height:36 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33 1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </button>
          )}
          <div className="qk-lang" role="tablist" aria-label="language">
            <button className={lang==="en"?"on":""} onClick={() => setLang("en")}>EN</button>
            <button className={lang==="es"?"on":""} onClick={() => setLang("es")}>ES</button>
          </div>
        </div>
      </div>

      {/* stage */}
      <div className="qk-stage">
        {route.name === "welcome" && (
          <WelcomeScreen lang={lang} kids={kids}
            onAddKid={() => goAuth("signup")}
            onSignIn={() => goAuth("signin")}
            onSeeDemo={(kidId) => { setActiveKidId(kidId || kids[0]?.id); setRoute({ name:"dashboard" }); }}
          />
        )}
        {route.name === "auth" && (
          <AuthScreen
            lang={lang}
            initialTab={route.tab === "signin" ? "signin" : "signup"}
            onAuth={handleAuth}
            onBack={goWelcome}
          />
        )}
        {route.name === "parent-onboarding" && (
          <ParentOnboardingScreen
            lang={lang}
            account={account}
            prefs={parentPrefs}
            setPrefs={setParentPrefs}
            onDone={finishParentOnboarding}
            onBack={() => setRoute({ name:"auth", tab:"signup" })}
          />
        )}
        {route.name === "profile-pick" && (
          <ProfilePickerScreen
            lang={lang}
            kids={kids}
            account={account}
            onPickParent={pickParentProfile}
            onPickKid={pickKidProfile}
            onAddKid={goAddKid}
            onKidCode={() => setRoute({ name:"kid-code" })}
            onSignOut={signOut}
          />
        )}
        {route.name === "parent-pin" && (
          <ParentPinScreen
            lang={lang}
            expectedPin="1234"
            onBack={() => setRoute({ name:"profile-pick" })}
            onSuccess={goDashboard}
          />
        )}
        {route.name === "kid-code" && (
          <KidCodeScreen
            lang={lang}
            kids={kids}
            onBack={() => setRoute({ name:"profile-pick" })}
            onSuccess={(id) => pickKidProfile(id)}
          />
        )}
        {route.name === "settings" && (
          <SettingsScreen
            lang={lang}
            setLang={setLang}
            account={account}
            setAccount={setAccount}
            kids={kids}
            setKids={setKids}
            prefs={parentPrefs}
            setPrefs={setParentPrefs}
            parentPin={parentPin}
            setParentPin={setParentPin}
            customSubjects={customSubjects}
            setCustomSubjects={setCustomSubjects}
            tweaks={tweaks}
            setTweak={setTweak}
            plan={plan}
            setPlan={setPlan}
            onBack={goDashboard}
            onAddKid={goAddKid}
            onSignOut={signOut}
          />
        )}
        {route.name === "onboarding" && (
          <OnboardingScreen lang={lang} draft={draft} setDraft={setDraft}
            onDone={finishOnboard}
            onBack={() => setRoute({ name: kids.length ? "dashboard" : "welcome" })}
          />
        )}
        {route.name === "dashboard" && (
          <DashboardScreen lang={lang} kids={kids}
            onCreate={() => startCreateFor(activeKidId || kids[0]?.id)}
            onOpenKid={(id, openKidHome) => {
              if (openKidHome) {
                setActiveKidId(id);
                setMode("kid");
                setRoute({ name: "kid-home" });
              } else {
                startCreateFor(id);
              }
            }}
            onAddKid={goAddKid}
            gamification={tweaks.gamification}
          />
        )}
        {route.name === "picker" && (
          <PickerScreen lang={lang} kid={activeKid} picked={picked} setPicked={setPicked}
            customSubjects={customSubjects}
            difficulty={tweaks.difficulty}
            setDifficulty={(v) => setTweak("difficulty", v)}
            onBack={goDashboard}
            onContinue={() => setRoute({ name:"generate" })}
          />
        )}
        {route.name === "generate" && (
          <GenerateScreen lang={lang} kid={activeKid} picked={picked} difficulty={tweaks.difficulty}
            onBack={() => setRoute({ name:"picker" })}
            onPick={goPick}
          />
        )}
        {route.name === "quiz" && (
          <QuizScreen lang={lang} kid={activeKid} picked={picked} difficulty={tweaks.difficulty} gamification={tweaks.gamification}
            onExit={() => setRoute({ name:"kid-home" })}
            onFinish={(res) => { setQuizResult(res); setRoute({ name:"results" }); }}
          />
        )}
        {route.name === "guide" && (
          <StudyGuideScreen lang={lang} kid={activeKid} picked={picked} gamification={tweaks.gamification}
            onExit={(target) => target === "quiz" ? setRoute({ name:"quiz" }) : setRoute({ name:"kid-home" })}
            onPrint={() => setRoute({ name:"pdf" })}
          />
        )}
        {route.name === "pdf" && (
          <PdfPreviewScreen lang={lang} kid={activeKid} picked={picked}
            onBack={() => mode === "kid" ? setRoute({ name:"kid-home" }) : setRoute({ name:"generate" })}
          />
        )}
        {route.name === "kid-home" && activeKid && (
          <KidHomeScreen
            lang={lang} kid={activeKid} kids={kids}
            session={session}
            onStart={onStartSession}
            onTogglePause={onTogglePause}
            onEnd={onEndSession}
            onPickKid={(id) => setActiveKidId(id)}
            onOpen={kidOpenRecent}
            onSwitchParent={() => switchMode("parent")}
          />
        )}
        {route.name === "results" && quizResult && (
          <ResultsScreen lang={lang} kid={activeKid} picked={picked} result={quizResult}
            gamification={tweaks.gamification}
            onAgain={() => setRoute({ name:"quiz" })}
            onHome={() => setRoute({ name: "kid-home" })}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", left:"50%", bottom:24, transform:"translateX(-50%)",
          zIndex:2147483645,
          padding:"14px 18px",
          background:"var(--ink)", color:"var(--surface)",
          borderRadius:14, boxShadow:"var(--shadow-lg)",
          display:"flex", alignItems:"center", gap:12,
          fontFamily:"var(--font-display)", fontWeight:600, fontSize:15,
          animation:"qk-toast-in .3s cubic-bezier(.2,.7,.2,1)",
        }}>
          <span style={{ display:"inline-flex", color:"var(--honey)" }}>{ICONS.check}</span>
          <span>
            {t("sessionSaved")} · <span style={{ color:"var(--honey)" }}>+{toast.minutes} {t("sessionAddedMin")}</span>
          </span>
        </div>
      )}

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label={lang==="es"?"Tema":"Theme"} />
        <TweakColor label={lang==="es"?"Paleta":"Palette"} value={tweaks.palette}
          options={[
            [QK_PALETTES.forest.primary, QK_PALETTES.forest.honey, QK_PALETTES.forest.coral, QK_PALETTES.forest.sky],
            [QK_PALETTES.meadow.primary, QK_PALETTES.meadow.honey, QK_PALETTES.meadow.coral, QK_PALETTES.meadow.sky],
            [QK_PALETTES.ocean.primary,  QK_PALETTES.ocean.honey,  QK_PALETTES.ocean.coral,  QK_PALETTES.ocean.sky],
            [QK_PALETTES.berry.primary,  QK_PALETTES.berry.honey,  QK_PALETTES.berry.coral,  QK_PALETTES.berry.sky],
          ]}
          onChange={(v) => setTweak("palette", v)} />
        <TweakSelect label={lang==="es"?"Tipografía":"Font"} value={tweaks.font}
          options={[
            { value:"fredoka", label:"Fredoka — playful rounded" },
            { value:"rounded", label:"Quicksand — gentle modern" },
            { value:"hand",    label:"Patrick Hand — handwriting" },
            { value:"serif",   label:"Bree Serif — bookish" },
          ]}
          onChange={(v) => setTweak("font", v)} />

        <TweakSection label={lang==="es"?"Aprendizaje":"Learning"} />
        <TweakRadio label={lang==="es"?"Dificultad":"Difficulty"} value={tweaks.difficulty}
          options={[
            { value:"easy",   label: lang==="es"?"Fácil":"Easy" },
            { value:"medium", label: lang==="es"?"Medio":"Medium" },
            { value:"hard",   label: lang==="es"?"Difícil":"Hard" },
          ]}
          onChange={(v) => setTweak("difficulty", v)} />
        <TweakRadio label={lang==="es"?"Juego":"Game"} value={tweaks.gamification}
          options={[
            { value:"minimal", label: lang==="es"?"Mínimo":"Min" },
            { value:"light",   label: lang==="es"?"Suave":"Light" },
            { value:"medium",  label: lang==="es"?"Medio":"Med" },
          ]}
          onChange={(v) => setTweak("gamification", v)} />
      </TweaksPanel>
    </div>
  );
}


export default App;
