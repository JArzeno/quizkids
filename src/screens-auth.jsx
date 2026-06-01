import React from 'react';
import { useT, Ico, ICONS, Btn, Chip, AVATARS, Avatar, Stars, StatCard, ImgPlaceholder, useSession, formatElapsed, SessionPill, RoleSwitch, QK_PLANS, BillingToggle, PricingCard, PricingCards } from './components.jsx';


// screens-auth.jsx — Login, Signup, Parent Onboarding

/* =============================================================
   AuthScreen — login + signup with tabs
   ============================================================= */
function AuthScreen({ lang, initialTab = "signin", onAuth, onBack }) {
  const t = useT(lang);
  const [tab, setTab] = React.useState(initialTab);
  const [form, setForm] = React.useState({ name:"Ana Martinez", email:"ana@home.com", password:"", remember:true, terms:false });
  const [showPw, setShowPw] = React.useState(false);

  const pwScore = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const pwLabel = pwScore <= 1 ? t("pwStrengthWeak") : pwScore <= 3 ? t("pwStrengthOk") : t("pwStrengthGood");
  const pwColor = pwScore <= 1 ? "var(--coral)" : pwScore <= 3 ? "var(--honey)" : "var(--primary)";

  const canSubmit = tab === "signin"
    ? form.email.includes("@") && form.password.length > 0
    : form.name.trim().length > 0 && form.email.includes("@") && form.password.length >= 8 && form.terms;

  const submit = (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    onAuth({ ...form, tab });
  };

  return (
    <div className="qk-screen" data-screen-label={tab === "signin" ? "00 Sign in" : "00 Sign up"} style={{ padding: 0, minHeight:"100%" }}>
      <div style={{ minHeight:"100%", display:"grid", gridTemplateColumns:"1.05fr 1fr" }} className="qk-auth-grid">
        {/* LEFT — brand + value props */}
        <aside style={{
          padding:"56px clamp(28px, 5vw, 64px)",
          background: "linear-gradient(160deg, var(--primary-l) 0%, var(--honey-l) 100%)",
          position:"relative", overflow:"hidden",
          display:"flex", flexDirection:"column", justifyContent:"space-between",
          minHeight: "calc(100vh - 64px)",
        }}>
          <div aria-hidden style={{ position:"absolute", inset:0, opacity:.18,
            backgroundImage:"radial-gradient(var(--primary) 1.5px, transparent 1.5px)", backgroundSize:"24px 24px" }} />

          <div style={{ position:"relative" }}>
            <button onClick={onBack} className="qk-brand" style={{ appearance:"none", background:"transparent", border:0, padding:0, cursor:"pointer" }}>
              <span className="qk-brand-mark">
                <Ico d={<path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z"/>} size={18} stroke={2}/>
              </span>
              QuizKids
            </button>
          </div>

          {/* hero comp */}
          <div style={{ position:"relative", margin:"32px 0" }}>
            <h1 className="qk-h1" style={{ fontSize:"clamp(28px, 3.4vw, 40px)" }}>
              {lang === "es" ? (
                <>Un rinconcito <span className="qk-underline">amigable</span> para estudiar.</>
              ) : (
                <>A cozy place to <span className="qk-underline">love learning</span>.</>
              )}
            </h1>

            {/* floating avatars + sticker */}
            <div style={{ position:"relative", height: 200, marginTop: 28 }}>
              <div className="qk-card" style={{
                position:"absolute", left:0, top:14, width:"68%", padding:14,
                transform:"rotate(-3deg)",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Avatar id="fox" size={36} />
                  <div>
                    <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:14 }}>Mateo · Grade 3</div>
                    <div style={{ fontSize:11, color:"var(--ink-3)" }}>Solar System · 5 ⭐</div>
                  </div>
                </div>
                <div className="qk-progress" style={{ marginTop:10, height:6 }}>
                  <span style={{ width:"72%" }} />
                </div>
              </div>
              <div style={{ position:"absolute", right:"6%", top:0, transform:"rotate(6deg)" }}>
                <Avatar id="sprout" size={88} />
              </div>
              <div className="qk-sticker" style={{ position:"absolute", right:"-2%", top:"54%", fontSize:13 }}>
                7 day streak 🔥
              </div>
            </div>

            <ul style={{ listStyle:"none", padding:0, margin:"32px 0 0", display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { icon: ICONS.shuffle, label: t("vp1") },
                { icon: ICONS.book,    label: t("vp2") },
                { icon: ICONS.leaf,    label: t("vp3") },
              ].map((v,i) => (
                <li key={i} style={{ display:"flex", alignItems:"center", gap:12, fontSize:15, color:"var(--ink-2)" }}>
                  <span style={{ width:32, height:32, borderRadius:10, background:"var(--surface)", color:"var(--primary)", display:"grid", placeItems:"center", boxShadow:"var(--shadow-sm)" }}>
                    {React.cloneElement(v.icon, { size: 16 })}
                  </span>
                  <span style={{ fontWeight:600 }}>{v.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* social proof */}
          <div style={{ position:"relative", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ display:"flex" }}>
              {["bee","owl","frog","bear"].map((a,i) => (
                <div key={a} style={{ marginLeft: i ? -10 : 0, borderRadius:"50%", background:"var(--surface)", border:"2.5px solid var(--surface)" }}>
                  <Avatar id={a} size={32} />
                </div>
              ))}
            </div>
            <div style={{ fontSize:13, color:"var(--ink-2)" }}>
              <span style={{ display:"inline-flex", color:"var(--honey)" }}>{ICONS.star}</span>{" "}
              <strong>{t("socialProof")}</strong>
            </div>
          </div>
        </aside>

        {/* RIGHT — form */}
        <main style={{ padding:"40px clamp(24px, 5vw, 56px) 56px", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:"100%", maxWidth: 440 }}>
            {/* Tabs */}
            <div style={{
              display:"inline-flex", padding:4,
              background:"var(--surface-2)",
              border:"1px solid var(--line)",
              borderRadius:14,
            }}>
              {[
                { id:"signin", label: t("tabSignIn") },
                { id:"signup", label: t("tabSignUp") },
              ].map(opt => (
                <button key={opt.id} onClick={() => setTab(opt.id)} style={{
                  appearance:"none", border:0,
                  padding:"8px 16px",
                  borderRadius: 10,
                  background: tab === opt.id ? "var(--surface)" : "transparent",
                  boxShadow: tab === opt.id ? "var(--shadow-sm)" : "none",
                  color: tab === opt.id ? "var(--ink)" : "var(--ink-3)",
                  fontFamily:"var(--font-display)", fontWeight:600, fontSize:14,
                  cursor:"pointer",
                }}>{opt.label}</button>
              ))}
            </div>

            <h2 className="qk-h1" style={{ marginTop:18, fontSize:"clamp(24px, 2.8vw, 30px)" }}>
              {tab === "signin" ? t("authSignInTitle") : t("authSignUpTitle")}
            </h2>
            <p className="qk-sub" style={{ margin:"6px 0 0", fontSize:15 }}>
              {tab === "signin" ? t("authSignInSub") : t("authSignUpSub")}
            </p>

            <form onSubmit={submit} style={{ marginTop:24, display:"flex", flexDirection:"column", gap:14 }}>
              {tab === "signup" && (
                <div className="qk-field">
                  <label className="qk-label">{t("fieldName")}</label>
                  <input className="qk-input" placeholder={t("fieldNamePh")}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              )}
              <div className="qk-field">
                <label className="qk-label">{t("fieldEmail")}</label>
                <input className="qk-input" type="email" placeholder={t("fieldEmailPh")}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="qk-field">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                  <label className="qk-label">{t("fieldPassword")}</label>
                  {tab === "signin" && (
                    <button type="button" style={{
                      appearance:"none", border:0, background:"transparent",
                      color:"var(--primary)", fontSize:12, fontWeight:700, cursor:"pointer",
                    }}>{t("forgotPw")}</button>
                  )}
                </div>
                <div style={{ position:"relative" }}>
                  <input className="qk-input" type={showPw ? "text" : "password"} placeholder={t("fieldPasswordPh")}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    style={{ width:"100%", paddingRight:42 }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{
                    position:"absolute", right:6, top:"50%", transform:"translateY(-50%)",
                    appearance:"none", border:0, background:"transparent",
                    width:32, height:32, borderRadius:8, cursor:"pointer", color:"var(--ink-3)",
                    display:"grid", placeItems:"center",
                  }}>
                    {showPw
                      ? <Ico d={<g><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></g>} size={16} />
                      : <Ico d={<g><path d="M17 17a10 10 0 01-5 1c-7 0-11-6-11-6a18 18 0 014-5"/><path d="M9 5a10 10 0 013-1c7 0 11 6 11 6a18 18 0 01-3 4"/><path d="M1 1l22 22"/></g>} size={16} />
                    }
                  </button>
                </div>
                {tab === "signup" && form.password && (
                  <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, height:4, borderRadius:999, background:"var(--surface-2)", overflow:"hidden" }}>
                      <div style={{ height:"100%", width: `${(pwScore/4)*100}%`, background: pwColor, transition:"width .2s ease" }} />
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color: pwColor, textTransform:"uppercase", letterSpacing:".04em" }}>{pwLabel}</span>
                  </div>
                )}
              </div>

              {tab === "signin" ? (
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--ink-2)", cursor:"pointer" }}>
                  <input type="checkbox" checked={form.remember} onChange={e => setForm({ ...form, remember: e.target.checked })} />
                  {t("rememberMe")}
                </label>
              ) : (
                <label style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:"var(--ink-2)", cursor:"pointer", lineHeight:1.4 }}>
                  <input type="checkbox" checked={form.terms} onChange={e => setForm({ ...form, terms: e.target.checked })} style={{ marginTop:3 }} />
                  <span>{t("agreeTerms")}</span>
                </label>
              )}

              <Btn kind="primary" type="submit" disabled={!canSubmit} style={{ opacity: canSubmit ? 1 : .5, marginTop:6 }}>
                {tab === "signin" ? t("signInBtn") : t("signUpBtn")}
              </Btn>
            </form>

            {/* social */}
            <div style={{ marginTop:24, display:"flex", alignItems:"center", gap:14, color:"var(--ink-3)", fontSize:12 }}>
              <span style={{ flex:1, height:1, background:"var(--line)" }} />
              <span style={{ textTransform:"uppercase", letterSpacing:".06em", fontWeight:700 }}>{t("orContinue")}</span>
              <span style={{ flex:1, height:1, background:"var(--line)" }} />
            </div>
            <div style={{ marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <button type="button" className="qk-btn qk-btn-ghost" style={{ fontSize:14, padding:"10px 12px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                Google
              </button>
              <button type="button" className="qk-btn qk-btn-ghost" style={{ fontSize:14, padding:"10px 12px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12.5c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9s-2-.9-3.4-.9c-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.3 2.5 1.3-.1 1.8-.9 3.5-.9s2.1.9 3.4.8c1.4 0 2.3-1.2 3.2-2.4 1-1.4 1.4-2.7 1.4-2.8-.1 0-2.7-1-2.7-4.1zM14 5.4c.7-.9 1.2-2.1 1.1-3.4-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.2.1 2.3-.6 3-1.4z"/></svg>
                Apple
              </button>
            </div>

            {/* switch link */}
            <div style={{ marginTop:24, textAlign:"center", fontSize:14, color:"var(--ink-2)" }}>
              {tab === "signin" ? (
                <>{t("noAccount")} <button type="button" onClick={() => setTab("signup")} style={{ appearance:"none", border:0, background:"transparent", color:"var(--primary)", fontWeight:700, cursor:"pointer" }}>{t("createOne")}</button></>
              ) : (
                <>{t("hasAccount")} <button type="button" onClick={() => setTab("signin")} style={{ appearance:"none", border:0, background:"transparent", color:"var(--primary)", fontWeight:700, cursor:"pointer" }}>{t("signInLink")}</button></>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* responsive */}
      <style>{`
        @media (max-width: 880px) {
          .qk-auth-grid { grid-template-columns: 1fr !important; }
          .qk-auth-grid aside { min-height: 0 !important; padding-bottom: 40px !important; }
        }
      `}</style>
    </div>
  );
}


/* =============================================================
   ParentOnboardingScreen — 3 steps + finish
   ============================================================= */
function ParentOnboardingScreen({ lang, onDone, onBack, account, prefs, setPrefs }) {
  const t = useT(lang);
  const [step, setStep] = React.useState(0);
  const STEPS = 5;

  const canNext = [
    () => !!prefs.role,
    () => prefs.kidsCount > 0 && prefs.langs.length > 0,
    () => true,
    () => !!prefs.plan?.tier,
    () => true,
  ][step]();

  const ROLES = [
    { id:"mom",      label: t("roleMom"),      icon:"👩" },
    { id:"dad",      label: t("roleDad"),      icon:"👨" },
    { id:"guardian", label: t("roleGuardian"), icon:"🧑" },
    { id:"teacher",  label: t("roleTeacher"),  icon:"🧑‍🏫" },
    { id:"other",    label: t("roleOther"),    icon:"✨" },
  ];

  return (
    <div className="qk-screen" data-screen-label="00b Parent Onboarding" style={{ padding:"40px clamp(20px, 5vw, 56px) 64px" }}>
      <div style={{ maxWidth: 720, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:36, height:36, borderRadius:"50%",
              background:"var(--primary)", color:"#fff",
              display:"grid", placeItems:"center",
              fontFamily:"var(--font-display)", fontWeight:700,
            }}>{(account?.name || "A").trim().charAt(0).toUpperCase()}</div>
            <div style={{ fontSize:14, color:"var(--ink-2)" }}>
              <div style={{ fontWeight:700, color:"var(--ink)" }}>{account?.name || "Ana"}</div>
              <div style={{ fontSize:12, color:"var(--ink-3)" }}>{account?.email || "—"}</div>
            </div>
          </div>
          <div style={{ fontSize:13, color:"var(--ink-3)", whiteSpace:"nowrap" }}>{t("pobStep")} {step+1} {t("of")} {STEPS}</div>
        </div>

        <div className="qk-progress" style={{ marginBottom:28 }}>
          <span style={{ width: `${((step+1)/STEPS)*100}%` }} />
        </div>

        <div className="qk-card" style={{ padding:"clamp(24px, 4vw, 36px)" }}>
          {/* STEP 1 — about you */}
          {step === 0 && (
            <div>
              <h2 className="qk-h1" style={{ fontSize:"clamp(22px, 2.6vw, 30px)" }}>{t("pobTitle1")}</h2>
              <p className="qk-sub" style={{ marginTop:6, marginBottom:22 }}>{t("pobSub1")}</p>

              <div className="qk-label" style={{ marginBottom:10 }}>{t("pobYouAre")}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:10 }} className="qk-roles-grid">
                {ROLES.map(r => {
                  const on = prefs.role === r.id;
                  return (
                    <button key={r.id} onClick={() => setPrefs({ ...prefs, role: r.id })} className="qk-wiggle" style={{
                      appearance:"none", padding:"14px 8px",
                      background: on ? "var(--primary-l)" : "var(--surface-2)",
                      border:"2px solid " + (on ? "var(--primary)" : "transparent"),
                      borderRadius:14, cursor:"pointer",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                    }}>
                      <span style={{ fontSize:28 }}>{r.icon}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-2)" }}>{r.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop:28 }}>
                <div className="qk-label" style={{ marginBottom:10 }}>{t("pobPhoto")}</div>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{
                    width:72, height:72, borderRadius:"50%",
                    background:"var(--surface-2)",
                    border:"2px dashed var(--line)",
                    display:"grid", placeItems:"center",
                    color:"var(--ink-3)",
                    fontFamily:"var(--font-display)", fontWeight:700, fontSize:24,
                  }}>{(account?.name || "A").trim().charAt(0).toUpperCase()}</div>
                  <Btn kind="ghost" icon={ICONS.plus}>{t("pobPhotoUpload")}</Btn>
                  <button className="qk-btn qk-btn-ghost" style={{ background:"transparent", border:0, padding:"8px 4px", color:"var(--ink-3)", fontSize:13 }}>{t("pobPhotoSkip")}</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — family */}
          {step === 1 && (
            <div>
              <h2 className="qk-h1" style={{ fontSize:"clamp(22px, 2.6vw, 30px)" }}>{t("pobTitle2")}</h2>
              <p className="qk-sub" style={{ marginTop:6, marginBottom:22 }}>{t("pobSub2")}</p>

              <div className="qk-label" style={{ marginBottom:10 }}>{t("pobKidsCount")}</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {[1,2,3,"4+"].map(n => {
                  const v = n === "4+" ? 4 : n;
                  const on = prefs.kidsCount === v;
                  return (
                    <button key={n} onClick={() => setPrefs({ ...prefs, kidsCount: v })}
                      className={"qk-chip" + (on ? " on" : "")}
                      style={{ minWidth:54, justifyContent:"center", fontFamily:"var(--font-display)", fontSize:16 }}>
                      {n}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop:24 }}>
                <div className="qk-label" style={{ marginBottom:10 }}>{t("pobLangs")}</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {[
                    { id:"en", label:"English", flag:"🇺🇸" },
                    { id:"es", label:"Español", flag:"🇪🇸" },
                    { id:"pt", label:"Português", flag:"🇧🇷" },
                    { id:"fr", label:"Français", flag:"🇫🇷" },
                    { id:"other", label: lang==="es"?"Otro":"Other", flag:"🌐" },
                  ].map(l => {
                    const on = prefs.langs.includes(l.id);
                    return (
                      <button key={l.id} onClick={() => {
                        const next = on ? prefs.langs.filter(x => x !== l.id) : [...prefs.langs, l.id];
                        setPrefs({ ...prefs, langs: next });
                      }} className={"qk-chip" + (on ? " on" : "")}>
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop:24 }}>
                <div className="qk-label" style={{ marginBottom:10 }}>{t("pobWhere")}</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {[
                    { id:"home",  label: t("whereHome"),  icon:"🏠" },
                    { id:"on-go", label: t("whereOnGo"),  icon:"🚗" },
                    { id:"class", label: t("whereClass"), icon:"🏫" },
                  ].map(w => {
                    const on = prefs.where?.includes(w.id);
                    return (
                      <button key={w.id} onClick={() => {
                        const cur = prefs.where || [];
                        const next = on ? cur.filter(x => x !== w.id) : [...cur, w.id];
                        setPrefs({ ...prefs, where: next });
                      }} className={"qk-chip" + (on ? " on" : "")}>
                        <span>{w.icon}</span>
                        <span>{w.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — goals */}
          {step === 2 && (
            <div>
              <h2 className="qk-h1" style={{ fontSize:"clamp(22px, 2.6vw, 30px)" }}>{t("pobTitle3")}</h2>
              <p className="qk-sub" style={{ marginTop:6, marginBottom:22 }}>{t("pobSub3")}</p>

              <div>
                <div className="qk-label" style={{ marginBottom:10 }}>{t("pobGoal")} · {lang==="es" ? "por peque" : "per kid"}</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8 }}>
                  {[15, 30, 60, 90].map(m => {
                    const on = prefs.goalMin === m;
                    return (
                      <button key={m} onClick={() => setPrefs({ ...prefs, goalMin: m })} style={{
                        appearance:"none", padding:"14px 10px",
                        background: on ? "var(--primary-l)" : "var(--surface-2)",
                        border:"2px solid " + (on ? "var(--primary)" : "transparent"),
                        borderRadius:14, cursor:"pointer",
                      }}>
                        <div style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:22 }}>{m}</div>
                        <div style={{ fontSize:12, color:"var(--ink-3)" }}>{t("minutes")} / {lang==="es" ? "día" : "day"}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop:28 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div className="qk-label">{t("pobReminders")}</div>
                  <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--ink-3)", cursor:"pointer" }}>
                    <input type="checkbox" checked={prefs.reminders === false ? false : true}
                      onChange={e => setPrefs({ ...prefs, reminders: e.target.checked })} />
                    {t("pobReminderOff")}
                  </label>
                </div>
                <div style={{ opacity: prefs.reminders === false ? .4 : 1, pointerEvents: prefs.reminders === false ? "none" : "auto" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:13, color:"var(--ink-2)", whiteSpace:"nowrap" }}>{t("pobReminderTime")}</span>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {["3:30 pm","4:00 pm","5:00 pm","6:00 pm","7:30 pm"].map(h => {
                        const on = prefs.reminderAt === h;
                        return (
                          <button key={h} onClick={() => setPrefs({ ...prefs, reminderAt: h })}
                            className={"qk-chip" + (on ? " on" : "")}
                            style={{ padding:"6px 12px", fontSize:13 }}>
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — plan picker */}
          {step === 3 && (
            <div>
              <h2 className="qk-h1" style={{ fontSize:"clamp(22px, 2.6vw, 30px)" }}>{t("pobPlanTitle")}</h2>
              <p className="qk-sub" style={{ marginTop:6, marginBottom:22 }}>{t("pobPlanSub")}</p>

              <PricingCards
                lang={lang}
                cycle={prefs.plan?.cycle || "monthly"}
                setCycle={(c) => setPrefs({ ...prefs, plan: { ...(prefs.plan || { tier: "free" }), cycle: c } })}
                currentPlanId={null}
                onSelect={(tier) => setPrefs({ ...prefs, plan: { tier, cycle: prefs.plan?.cycle || "monthly" } })}
                compact={true}
              />

              {prefs.plan?.tier && (
                <div style={{ marginTop:18, padding:14, background:"var(--primary-l)", borderRadius:14, display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ width:32, height:32, borderRadius:10, background:"var(--primary)", color:"#fff", display:"grid", placeItems:"center" }}>
                    <Ico d={<path d="M5 12l5 5L20 7" />} size={16} stroke={2.4} />
                  </span>
                  <div style={{ flex:1, fontSize:14, color:"var(--ink-2)" }}>
                    <strong style={{ color:"var(--ink)" }}>{t("pobPlanSelected")}:</strong>{" "}
                    {t(prefs.plan.tier === "family" ? "planFamily" : "planFree")}
                    {prefs.plan.tier === "family" && (
                      <> · {prefs.plan.cycle === "yearly" ? "$8" + t("perMonth") : "$10" + t("perMonth")}</>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5 — finish */}
          {step === 4 && (
            <div style={{ textAlign:"center", padding:"12px 0" }}>
              <div style={{ display:"inline-flex", gap:-12 }}>
                {["sprout","fox","bee","owl"].map((a, i) => (
                  <div key={a} style={{ marginLeft: i ? -16 : 0, borderRadius:"50%", background:"var(--surface)", border:"4px solid var(--surface)", transform:`rotate(${[-6,2,-3,4][i]}deg)` }}>
                    <Avatar id={a} size={68} />
                  </div>
                ))}
              </div>
              <h2 className="qk-h1" style={{ fontSize:"clamp(24px, 3vw, 34px)", marginTop:18 }}>{t("pobFinishTitle")}</h2>
              <p className="qk-sub" style={{ margin:"6px auto 24px" }}>{t("pobFinishSub")}</p>

              <div style={{ display:"inline-flex", gap:10 }}>
                <Btn kind="ghost" onClick={() => onDone(prefs, false)}>{t("pobLater")}</Btn>
                <Btn kind="primary" icon={ICONS.plus} onClick={() => onDone(prefs, true)}>{t("pobAddFirst")}</Btn>
              </div>
            </div>
          )}

          {step < 4 && (
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:32, gap:12 }}>
              <button className="qk-btn qk-btn-ghost" onClick={() => step === 0 ? onBack() : setStep(s => s-1)}>
                {ICONS.back} <span>{t("back")}</span>
              </button>
              <Btn kind="primary" disabled={!canNext} onClick={() => setStep(s => s+1)} iconRight={ICONS.next} style={{ opacity: canNext ? 1 : .5 }}>
                {t("next")}
              </Btn>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 540px) {
          .qk-roles-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}


export { AuthScreen, ParentOnboardingScreen };
