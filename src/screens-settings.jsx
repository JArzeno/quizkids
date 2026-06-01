import React from 'react';
import { useT, Ico, ICONS, Btn, Chip, AVATARS, Avatar, Stars, StatCard, ImgPlaceholder, useSession, formatElapsed, SessionPill, RoleSwitch, QK_PLANS, BillingToggle, PricingCard, PricingCards } from './components.jsx';


// screens-settings.jsx — Settings hub + inline kid editor

/* =============================================================
   SettingsScreen
   ============================================================= */
function SettingsScreen({ lang, setLang, account, setAccount, kids, setKids, prefs, setPrefs, parentPin, setParentPin, onBack, onAddKid, onSignOut, customSubjects, setCustomSubjects, tweaks, setTweak, plan, setPlan }) {
  const t = useT(lang);
  const [editingKidId, setEditingKidId] = React.useState(null);
  const [toast, setToast] = React.useState("");
  const [showAddSubject, setShowAddSubject] = React.useState(false);

  const fireToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.parentElement?.parentElement?.parentElement?.scrollTop &&
      (el.parentElement.parentElement.parentElement.parentElement.scrollTop = el.offsetTop - 80);
    // fallback — use the closest stage scroll
    const stage = el?.closest(".qk-stage");
    if (stage) stage.scrollTop = el.offsetTop - 80;
  };

  const updateKid = (id, patch) => {
    setKids(ks => ks.map(k => k.id === id ? { ...k, ...patch } : k));
  };
  const removeKid = (id) => {
    if (!window.confirm(t("deleteKidWarn"))) return;
    setKids(ks => ks.filter(k => k.id !== id));
    if (editingKidId === id) setEditingKidId(null);
    fireToast(t("saved"));
  };
  const regenCode = (id) => {
    const code = Math.random().toString(36).toUpperCase().replace(/[^A-Z]/g,'').slice(0,4) + Math.floor(10 + Math.random()*89);
    updateKid(id, { code });
    fireToast(t("saved"));
  };

  const sections = [
    { id:"sec-account",  label: t("settingsAccount"),  icon: <Ico d={<g><circle cx="12" cy="8" r="4"/><path d="M4 22c0-4 4-6 8-6s8 2 8 6"/></g>} size={16}/> },
    { id:"sec-billing",  label: t("settingsBilling"),  icon: <Ico d={<g><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4"/></g>} size={16}/> },
    { id:"sec-kids",     label: t("settingsKids"),     icon: <Ico d={<g><circle cx="12" cy="8" r="4"/><circle cx="20" cy="10" r="3"/><circle cx="4" cy="10" r="3"/><path d="M2 22c0-3 4-5 10-5s10 2 10 5"/></g>} size={16}/> },
    { id:"sec-subjects", label: lang==="es"?"Materias":"Subjects", icon: <Ico d={<g><path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2V5z"/></g>} size={16}/> },
    { id:"sec-security", label: t("settingsSecurity"), icon: <Ico d={<g><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></g>} size={16}/> },
    { id:"sec-prefs",    label: t("settingsPrefs"),    icon: <Ico d={<g><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.2 4.2l4.2 4.2M15.6 15.6l4.2 4.2M1 12h6M17 12h6M4.2 19.8l4.2-4.2M15.6 8.4l4.2-4.2"/></g>} size={16}/> },
    { id:"sec-danger",   label: t("settingsDanger"),   icon: <Ico d={<g><path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></g>} size={16}/> },
  ];

  return (
    <div className="qk-screen" data-screen-label="09 Settings" style={{ padding:"28px clamp(20px, 5vw, 56px) 64px" }}>
      <div style={{ maxWidth: 1080, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
          <div>
            <button onClick={onBack} className="qk-btn qk-btn-ghost" style={{ padding:"6px 12px", fontSize:13, marginBottom:14 }}>
              {ICONS.back} <span>{t("back")}</span>
            </button>
            <h1 className="qk-h1">{t("settings")}</h1>
            <p className="qk-sub">{t("settingsHi")}{account?.name?.split(" ")[0] || "Ana"}.</p>
          </div>
        </div>

        <div style={{ marginTop:24, display:"grid", gridTemplateColumns:"220px 1fr", gap:28 }} className="qk-settings-grid">
          {/* sidebar */}
          <aside style={{ position:"sticky", top:0, alignSelf:"flex-start" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {sections.map(s => (
                <button key={s.id} onClick={() => scrollToSection(s.id)} style={{
                  appearance:"none", border:0,
                  background:"transparent",
                  textAlign:"left",
                  padding:"10px 12px", borderRadius:12,
                  fontSize:14, fontWeight:600,
                  color: s.id === "sec-danger" ? "var(--coral)" : "var(--ink-2)",
                  display:"flex", alignItems:"center", gap:10,
                  cursor:"pointer",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <span style={{
                    width:28, height:28, borderRadius:8,
                    background: s.id === "sec-danger" ? "var(--coral-l)" : "var(--primary-l)",
                    color: s.id === "sec-danger" ? "var(--coral)" : "var(--primary)",
                    display:"grid", placeItems:"center",
                  }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </aside>

          {/* content */}
          <div style={{ display:"flex", flexDirection:"column", gap:20, minWidth:0 }}>

            {/* ACCOUNT */}
            <Section id="sec-account" title={t("settingsAccount")}>
              <Row label={t("fieldFullName")}>
                <input className="qk-input" value={account?.name || ""}
                  onChange={e => setAccount({ ...account, name: e.target.value })} />
              </Row>
              <Row label={t("fieldEmail")}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input className="qk-input" value={account?.email || ""}
                    onChange={e => setAccount({ ...account, email: e.target.value })}
                    style={{ flex:1 }} />
                  <button className="qk-btn qk-btn-ghost" style={{ fontSize:13, padding:"8px 12px" }}>{t("changeEmail")}</button>
                </div>
              </Row>
              <Row label={t("fieldPassword")}>
                <button className="qk-btn qk-btn-ghost" style={{ alignSelf:"flex-start", fontSize:13, padding:"8px 14px" }}>{t("changePassword")}</button>
              </Row>
              <div style={{ marginTop:6, display:"flex", justifyContent:"flex-end" }}>
                <Btn kind="primary" icon={ICONS.check} onClick={() => fireToast(t("saved"))}>{t("saveChanges")}</Btn>
              </div>
            </Section>

            {/* BILLING */}
            <Section id="sec-billing" title={t("settingsBilling")}>
              <PlanPanel
                lang={lang}
                plan={plan}
                setPlan={setPlan}
                onChanged={() => fireToast(t("saved"))}
              />
            </Section>

            {/* KIDS */}
            <Section id="sec-kids" title={t("settingsKids")} action={
              <Btn kind="ghost" icon={ICONS.plus} onClick={onAddKid}>{t("addAnotherKid")}</Btn>
            }>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {kids.map(k => (
                  <div key={k.id} className="qk-card" style={{
                    padding:0, overflow:"hidden",
                    border:"1px solid var(--line)",
                    boxShadow:"none",
                  }}>
                    {/* summary row */}
                    <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
                      <Avatar id={k.avatar} size={48} ring={k.color || "var(--primary)"} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:17 }}>{k.name}</div>
                        <div style={{ fontSize:13, color:"var(--ink-3)" }}>
                          {lang==="es"?"Grado ":"Grade "}{k.grade}
                          {" · "}
                          <span style={{ fontFamily:"ui-monospace, monospace" }}>{kidCodeOf(k)}</span>
                        </div>
                      </div>
                      <button className="qk-btn qk-btn-ghost" style={{ fontSize:13, padding:"8px 12px" }}
                        onClick={() => setEditingKidId(editingKidId === k.id ? null : k.id)}>
                        {editingKidId === k.id ? (lang==="es"?"Cerrar":"Close") : t("editKid")}
                      </button>
                    </div>
                    {editingKidId === k.id && (
                      <KidEditor
                        lang={lang}
                        kid={k}
                        onChange={(patch) => updateKid(k.id, patch)}
                        onRegenCode={() => regenCode(k.id)}
                        onDelete={() => removeKid(k.id)}
                        onSave={() => { setEditingKidId(null); fireToast(t("saved")); }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* SUBJECTS */}
            <Section id="sec-subjects" title={lang==="es"?"Materias":"Subjects"} action={
              <Btn kind="ghost" icon={ICONS.plus} onClick={() => setShowAddSubject(true)}>{t("addCustomSubject")}</Btn>
            }>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:10 }}>
                {[
                  { id:"sci",  icon:"🔬", live:true },
                  { id:"math", icon:"➗", live:false },
                  { id:"lang", icon:"📖", live:false },
                  { id:"soc",  icon:"🌎", live:false },
                  { id:"art",  icon:"🎨", live:false },
                ].map(s => (
                  <div key={s.id} className="qk-card" style={{ padding:14, boxShadow:"none", display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:38, height:38, borderRadius:12, background:"var(--surface-2)", display:"grid", placeItems:"center", fontSize:20 }}>{s.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:15 }}>{t(s.id)}</div>
                      <div style={{ fontSize:11, color: s.live ? "var(--primary)" : "var(--ink-3)", fontWeight:700 }}>{s.live ? (lang==="es"?"LISTO":"LIVE") : (lang==="es"?"PRONTO":"SOON")}</div>
                    </div>
                  </div>
                ))}
                {(customSubjects || []).map((s, i) => (
                  <div key={s.id} className="qk-card" style={{ padding:14, boxShadow:"none", display:"flex", alignItems:"center", gap:10, background: s.color + "22", border:"1px solid " + s.color }}>
                    <div style={{ width:38, height:38, borderRadius:12, background:"var(--surface)", color: s.color, display:"grid", placeItems:"center", fontSize:20 }}>{s.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:15 }}>{s.name}</div>
                      <div style={{ fontSize:11, color: s.color, fontWeight:700 }}>{(lang==="es"?"PERSONAL":"CUSTOM")}</div>
                    </div>
                    <button onClick={() => setCustomSubjects(customSubjects.filter(x => x.id !== s.id))} style={{
                      appearance:"none", border:0, background:"transparent", color:"var(--ink-3)", cursor:"pointer",
                      display:"grid", placeItems:"center",
                    }}>{React.cloneElement(ICONS.trash, { size: 14 })}</button>
                  </div>
                ))}
              </div>
              {showAddSubject && (
                <AddSubjectPanel
                  lang={lang}
                  onCancel={() => setShowAddSubject(false)}
                  onAdd={(s) => {
                    setCustomSubjects([...(customSubjects || []), { ...s, id: "cus-" + Math.random().toString(36).slice(2,7) }]);
                    setShowAddSubject(false);
                    fireToast(t("saved"));
                  }}
                />
              )}
            </Section>

            {/* SECURITY */}
            <Section id="sec-security" title={t("settingsSecurity")}>
              <Row label={t("changePin")}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <PinInput value={parentPin} onChange={setParentPin} />
                  <Btn kind="ghost" onClick={() => fireToast(t("saved"))}>{t("pinSaved")}</Btn>
                </div>
                <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:6 }}>{lang==="es" ? "PIN actual: " : "Current PIN: "}<code style={{ fontFamily:"ui-monospace, monospace" }}>{parentPin}</code></div>
              </Row>
              <Row label={t("requirePinFor")}>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { id:"settings", label: t("pinForSettings") },
                    { id:"create",   label: t("pinForCreate") },
                    { id:"exitKid",  label: t("pinForExit") },
                  ].map(opt => (
                    <label key={opt.id} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"6px 0", fontSize:14 }}>
                      <Toggle on={!!prefs.pinFor?.[opt.id]} onChange={(v) => setPrefs({ ...prefs, pinFor: { ...(prefs.pinFor || {}), [opt.id]: v } })} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </Row>
            </Section>

            {/* PREFERENCES */}
            <Section id="sec-prefs" title={t("settingsPrefs")}>
              <Row label={t("appLanguage")}>
                <div style={{ display:"flex", gap:8 }}>
                  {[
                    { id:"en", label:"English", flag:"🇺🇸" },
                    { id:"es", label:"Español", flag:"🇪🇸" },
                  ].map(l => (
                    <button key={l.id} onClick={() => setLang(l.id)}
                      className={"qk-chip" + (lang === l.id ? " on" : "")}>
                      <span>{l.flag}</span><span>{l.label}</span>
                    </button>
                  ))}
                </div>
              </Row>
              <Row label={t("notifications")}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <Toggle on={prefs.reminders !== false} onChange={(v) => setPrefs({ ...prefs, reminders: v })} />
                  <span style={{ fontSize:14, color:"var(--ink-2)" }}>{prefs.reminderAt || "5:00 pm"}</span>
                </div>
              </Row>
              <Row label={t("soundEffects")}>
                <Toggle on={prefs.sound !== false} onChange={(v) => setPrefs({ ...prefs, sound: v })} />
              </Row>
              <Row label={lang==="es"?"Tema":"Theme"}>
                <div style={{ display:"flex", gap:8 }}>
                  {[
                    ["#3F7A4F","forest"],["#5A9F58","meadow"],["#2F7C8A","ocean"],["#9F5099","berry"]
                  ].map(([c,n]) => {
                    const on = (tweaks?.palette?.[0] || "").toLowerCase() === c.toLowerCase();
                    return (
                      <button key={n} aria-label={n}
                        onClick={() => {
                          const map = { forest:["#3F7A4F","#E29A2B","#E26D5A","#6BA8C9"],
                                        meadow:["#5A9F58","#E8B23B","#EC7B5C","#7CB6CE"],
                                        ocean: ["#2F7C8A","#E8A53B","#E36E73","#85B7DC"],
                                        berry: ["#9F5099","#E69A40","#E16980","#7E8CC8"] };
                          setTweak && setTweak("palette", map[n]);
                        }}
                        style={{
                          width:36, height:36, borderRadius:"50%",
                          background: c,
                          border:"3px solid " + (on ? "var(--ink)" : "transparent"),
                          cursor:"pointer", padding:0,
                        }} />
                    );
                  })}
                </div>
              </Row>
            </Section>

            {/* DANGER */}
            <Section id="sec-danger" title={t("settingsDanger")} tone="coral">
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <button onClick={onSignOut} className="qk-btn qk-btn-ghost" style={{ borderColor:"var(--coral)", color:"var(--coral)" }}>
                  {t("signOut")}
                </button>
                <button className="qk-btn" style={{ background:"var(--coral)", color:"#fff" }}>
                  {lang==="es"?"Eliminar cuenta":"Delete account"}
                </button>
              </div>
            </Section>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", left:"50%", bottom:24, transform:"translateX(-50%)",
          padding:"12px 16px", background:"var(--ink)", color:"#fff",
          borderRadius:12, boxShadow:"var(--shadow-lg)",
          fontFamily:"var(--font-display)", fontWeight:600, fontSize:14,
          display:"inline-flex", alignItems:"center", gap:8,
          animation:"qk-toast-in .3s cubic-bezier(.2,.7,.2,1)",
          zIndex:2147483645,
        }}>
          <span style={{ color:"var(--honey)", display:"inline-flex" }}>{ICONS.check}</span>
          {toast}
        </div>
      )}

      <style>{`
        @media (max-width: 800px) {
          .qk-settings-grid { grid-template-columns: 1fr !important; }
          .qk-settings-grid aside { position: static !important; }
        }
      `}</style>
    </div>
  );
}

/* ----------------------------- helpers ----------------------------- */
function kidCodeOf(k) {
  if (k.code) return k.code;
  return (k.name.toUpperCase().replace(/[^A-Z]/g,'') + "12345").slice(0, 6);
}

function Section({ id, title, action, tone, children }) {
  return (
    <section id={id} className="qk-card" style={{
      padding:"22px 24px",
      borderColor: tone === "coral" ? "var(--coral)" : "var(--line)",
      scrollMarginTop: 24,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:18 }}>
        <h2 className="qk-h2" style={{ color: tone === "coral" ? "var(--coral)" : "var(--ink)" }}>{title}</h2>
        {action}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        {children}
      </div>
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <div className="qk-label">{label}</div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        appearance:"none", border:0,
        width:44, height:26, borderRadius:999,
        background: on ? "var(--primary)" : "var(--line)",
        position:"relative", cursor:"pointer",
        transition:"background .15s ease",
        padding:0,
      }}>
      <span style={{
        position:"absolute", top:3, left: on ? 21 : 3,
        width:20, height:20, borderRadius:"50%",
        background:"#fff",
        boxShadow:"0 1px 3px rgba(0,0,0,.2)",
        transition:"left .15s ease",
      }} />
    </button>
  );
}

function PinInput({ value, onChange }) {
  const ref = React.useRef();
  return (
    <div style={{ display:"flex", gap:6 }} onClick={() => ref.current?.focus()}>
      <input ref={ref} type="text" inputMode="numeric" maxLength={4}
        value={value || ""}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g,'').slice(0,4))}
        style={{ position:"absolute", left:-9999, width:1, height:1, opacity:0 }}
      />
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          width:42, height:48, borderRadius:10,
          border:"1.5px solid var(--line)",
          background:"var(--surface)",
          display:"grid", placeItems:"center",
          fontFamily:"var(--font-display)", fontWeight:700, fontSize:22,
          cursor:"text",
        }}>
          {value && value[i] ? "•" : ""}
        </div>
      ))}
    </div>
  );
}


/* =============================================================
   KidEditor — inline editor used in Settings → Kids section
   ============================================================= */
function KidEditor({ lang, kid, onChange, onRegenCode, onSave, onDelete }) {
  const t = useT(lang);
  return (
    <div style={{
      padding:"18px 18px 20px", background:"var(--surface-2)",
      borderTop:"1px solid var(--line)",
      display:"flex", flexDirection:"column", gap:16,
    }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="qk-kid-edit-grid">
        <Row label={t("onbName")}>
          <input className="qk-input" value={kid.name}
            onChange={(e) => onChange({ name: e.target.value })} />
        </Row>
        <Row label={t("onbGrade")}>
          <select className="qk-input"
            value={kid.grade}
            onChange={(e) => onChange({ grade: e.target.value })}>
            {["K","1","2","3","4","5","6","7","8","9","10","11","12"].map(g => (
              <option key={g} value={g}>{g === "K" ? (lang==="es"?"Kínder":"Kindergarten") : `${lang==="es"?"Grado ":"Grade "}${g}`}</option>
            ))}
          </select>
        </Row>
      </div>

      <Row label={t("onbAvatar")}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(8, 1fr)", gap:8 }}>
          {AVATARS.map(a => {
            const on = kid.avatar === a.id;
            return (
              <button key={a.id} onClick={() => onChange({ avatar: a.id })} style={{
                appearance:"none", padding:6, borderRadius:12,
                background: on ? "var(--primary-l)" : "var(--surface)",
                border:"2px solid " + (on ? "var(--primary)" : "transparent"),
                cursor:"pointer",
              }}>
                <Avatar id={a.id} size={40} />
              </button>
            );
          })}
        </div>
      </Row>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="qk-kid-edit-grid">
        <Row label={t("chooseColor")}>
          <div style={{ display:"flex", gap:8 }}>
            {["#3F7A4F","#E29A2B","#E26D5A","#6BA8C9","#B14F8C","#7A5AE0"].map(c => (
              <button key={c} onClick={() => onChange({ color: c })}
                aria-label={c}
                style={{
                  width:32, height:32, borderRadius:"50%",
                  background: c,
                  border:"3px solid " + (kid.color === c ? "var(--ink)" : "transparent"),
                  cursor:"pointer", padding:0,
                }} />
            ))}
          </div>
        </Row>
        <Row label={t("kidCode")}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <code style={{
              fontFamily:"ui-monospace, monospace",
              padding:"10px 14px", background:"var(--surface)",
              border:"1.5px solid var(--line)", borderRadius:12,
              fontWeight:700, letterSpacing:".08em", fontSize:16, flex:1, textAlign:"center",
            }}>{kidCodeOf(kid)}</code>
            <button onClick={onRegenCode} className="qk-btn qk-btn-ghost" style={{ fontSize:12, padding:"8px 10px", gap:4 }}>
              {React.cloneElement(ICONS.shuffle, { size: 14 })}
              <span>{t("regenerate")}</span>
            </button>
          </div>
        </Row>
      </div>

      <Row label={t("weeklyGoal")}>
        <div style={{ display:"flex", gap:6 }}>
          {[15, 30, 60, 90].map(m => {
            const on = (kid.goalMin || 30) === m;
            return (
              <button key={m} onClick={() => onChange({ goalMin: m })}
                className={"qk-chip" + (on ? " on" : "")}
                style={{ minWidth:60, justifyContent:"center" }}>
                {m} {t("minutes")}
              </button>
            );
          })}
        </div>
      </Row>

      <div style={{ display:"flex", justifyContent:"space-between", gap:10, paddingTop:8, borderTop:"1px dashed var(--line)" }}>
        <button onClick={onDelete} className="qk-btn qk-btn-ghost" style={{ color:"var(--coral)", borderColor:"var(--coral-l)", fontSize:13 }}>
          {React.cloneElement(ICONS.trash, { size: 14 })}
          <span>{t("deleteKid")}</span>
        </button>
        <Btn kind="primary" icon={ICONS.check} onClick={onSave}>{t("saveChanges")}</Btn>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .qk-kid-edit-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}


/* =============================================================
   AddSubjectPanel — inline form for adding custom subject
   ============================================================= */
function AddSubjectPanel({ lang, onCancel, onAdd }) {
  const t = useT(lang);
  const ICONS_GRID = ["🤖","💻","🔤","🎵","🌱","🧪","🎭","🧮","✏️","🌍","⚽","🍳","🦖","🎨"];
  const COLORS = ["#3F7A4F","#E29A2B","#E26D5A","#6BA8C9","#B14F8C","#7A5AE0","#2F7C8A","#5A9F58"];
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("🤖");
  const [color, setColor] = React.useState(COLORS[0]);

  return (
    <div className="qk-card" style={{
      marginTop:14, padding:18, background:"var(--surface-2)", boxShadow:"none",
      border:"1.5px dashed var(--primary)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:17 }}>{t("addCustomSubject")}</div>
        <button onClick={onCancel} className="qk-btn qk-btn-ghost" style={{ padding:"4px 8px", fontSize:13 }}>{t("cancel")}</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:14, alignItems:"center" }}>
        <div style={{
          width:64, height:64, borderRadius:18,
          background:"var(--surface)", color: color,
          display:"grid", placeItems:"center",
          fontSize:32,
          border:"2px solid " + color,
        }}>{icon}</div>
        <input className="qk-input" placeholder={t("customSubjectPh")}
          value={name} onChange={e => setName(e.target.value)} autoFocus />
      </div>

      <div style={{ marginTop:14 }}>
        <div className="qk-label" style={{ marginBottom:8 }}>{t("customSubjectIcon")}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {ICONS_GRID.map(i => (
            <button key={i} onClick={() => setIcon(i)} style={{
              appearance:"none", border:"2px solid " + (i === icon ? color : "transparent"),
              background:"var(--surface)",
              width:40, height:40, borderRadius:10,
              fontSize:20, cursor:"pointer",
            }}>{i}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop:14 }}>
        <div className="qk-label" style={{ marginBottom:8 }}>{t("customSubjectColor")}</div>
        <div style={{ display:"flex", gap:8 }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              aria-label={c}
              style={{
                width:34, height:34, borderRadius:"50%",
                background: c,
                border:"3px solid " + (color === c ? "var(--ink)" : "transparent"),
                cursor:"pointer", padding:0,
              }} />
          ))}
        </div>
      </div>

      <div style={{ marginTop:18, display:"flex", justifyContent:"flex-end", gap:10 }}>
        <Btn kind="primary" icon={ICONS.plus}
          disabled={!name.trim()}
          style={{ opacity: name.trim() ? 1 : .5 }}
          onClick={() => onAdd({ name: name.trim(), icon, color })}>
          {t("addCustomSubject")}
        </Btn>
      </div>
    </div>
  );
}


/* =============================================================
   PlanPanel — billing section content
   ============================================================= */
function PlanPanel({ lang, plan, setPlan, onChanged }) {
  const t = useT(lang);
  const tier = plan?.tier || "free";
  const cycle = plan?.cycle || "monthly";
  const data = QK_PLANS[tier];
  const isFamily = tier === "family";

  const select = (newTier) => {
    setPlan({ tier: newTier, cycle: plan?.cycle || "monthly", since: Date.now() });
    onChanged && onChanged();
  };
  const switchCycle = () => {
    setPlan({ ...plan, cycle: cycle === "monthly" ? "yearly" : "monthly" });
    onChanged && onChanged();
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* current plan banner */}
      <div className="qk-card" style={{
        padding:"20px 22px",
        background: isFamily
          ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-d) 100%)"
          : "var(--surface-2)",
        color: isFamily ? "#fff" : "var(--ink)",
        border: isFamily ? "0" : "1px solid var(--line)",
        boxShadow: "none",
        display:"flex", alignItems:"center", gap:18, flexWrap:"wrap",
        position:"relative", overflow:"hidden",
      }}>
        {isFamily && (
          <div aria-hidden style={{ position:"absolute", inset:0, opacity:.16,
            backgroundImage:"radial-gradient(rgba(255,255,255,.6) 1.5px, transparent 1.5px)", backgroundSize:"22px 22px" }} />
        )}
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <div style={{
            fontSize:11, fontWeight:700,
            letterSpacing:".08em", textTransform:"uppercase",
            color: isFamily ? "rgba(255,255,255,.8)" : "var(--ink-3)",
          }}>{t("yourPlan")}</div>
          <div style={{ marginTop:4, display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:28, lineHeight:1 }}>
              {t(data.nameKey)}
            </span>
            {isFamily && (
              <span style={{ fontSize:14, opacity:.85 }}>
                · ${cycle === "yearly" ? 8 : 10}{t("perMonth")}
                {cycle === "yearly" && <> · {t("billedYearly")}</>}
              </span>
            )}
          </div>
          {isFamily && (
            <div style={{ marginTop:8, fontSize:13, color:"rgba(255,255,255,.85)" }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#7cd99b" }} />
                Active · {t("nextBilling")}: Jun 25, 2026
              </span>
            </div>
          )}
          {!isFamily && (
            <p style={{ margin:"8px 0 0", fontSize:13, color:"var(--ink-2)" }}>
              {t(data.pitchKey)}
            </p>
          )}
        </div>
        <div style={{ position:"relative", display:"flex", gap:8, flexWrap:"wrap" }}>
          {isFamily ? (
            <>
              <button onClick={switchCycle} className="qk-btn" style={{
                background:"rgba(255,255,255,.18)", color:"#fff",
                border:"1px solid rgba(255,255,255,.3)", fontSize:13, padding:"10px 14px",
              }}>
                {cycle === "monthly" ? t("switchToYearly") : t("switchToMonthly")}
              </button>
              <button onClick={() => { if(window.confirm(lang==="es"?"¿Cancelar tu plan?":"Cancel your plan?")) select("free"); }} className="qk-btn" style={{
                background:"transparent", color:"#fff",
                border:"1px solid rgba(255,255,255,.3)", fontSize:13, padding:"10px 14px",
              }}>
                {t("cancelPlan")}
              </button>
            </>
          ) : (
            <button onClick={() => select("family")} className="qk-btn qk-btn-primary" style={{ fontSize:14 }}>
              <span style={{ display:"inline-flex" }}>{React.cloneElement(ICONS.spark, { size: 14 })}</span>
              <span>{t("planFamilyUpgrade")}</span>
            </button>
          )}
        </div>
      </div>

      {/* if free, show the inline plan comparison */}
      {!isFamily && (
        <PricingCards
          lang={lang}
          cycle={cycle}
          setCycle={(c) => setPlan({ ...plan, cycle: c, tier: plan?.tier || "free" })}
          currentPlanId={tier}
          onSelect={(id) => id !== tier && select(id)}
          compact={true}
        />
      )}

      {/* if family, payment method row */}
      {isFamily && (
        <div className="qk-card" style={{ padding:16, boxShadow:"none", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{
            width:44, height:30, borderRadius:6,
            background:"linear-gradient(135deg, #1a1f71 0%, #2d4ba0 100%)",
            color:"#fff", display:"grid", placeItems:"center",
            fontFamily:"var(--font-display)", fontWeight:700, fontSize:11,
            letterSpacing:".05em",
          }}>VISA</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:14 }}>•••• •••• •••• 4242</div>
            <div style={{ fontSize:12, color:"var(--ink-3)" }}>{lang==="es"?"Expira":"Expires"} 08/27</div>
          </div>
          <button className="qk-btn qk-btn-ghost" style={{ fontSize:13, padding:"8px 12px" }}>
            {lang==="es"?"Cambiar":"Update"}
          </button>
        </div>
      )}
    </div>
  );
}


export { PlanPanel, SettingsScreen, KidEditor, AddSubjectPanel, Toggle, kidCodeOf };
