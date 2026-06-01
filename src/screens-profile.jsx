import React from 'react';
import { useT, Ico, ICONS, Btn, Chip, AVATARS, Avatar, Stars, StatCard, ImgPlaceholder, useSession, formatElapsed, SessionPill, RoleSwitch, QK_PLANS, BillingToggle, PricingCard, PricingCards } from './components.jsx';


// screens-profile.jsx — Netflix-style profile picker, PIN entry, kid code

/* =============================================================
   ProfilePickerScreen — "Who's learning today?"
   ============================================================= */
function ProfilePickerScreen({ lang, kids, account, onPickParent, onPickKid, onAddKid, onKidCode, onSignOut }) {
  const t = useT(lang);

  return (
    <div className="qk-screen" data-screen-label="00c Who's here" style={{ padding:"40px clamp(20px, 5vw, 56px) 56px", minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ maxWidth: 1080, margin:"0 auto", width:"100%", flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
        <div style={{ textAlign:"center", marginBottom: 40 }}>
          <span className="qk-eyebrow">QuizKids · {account?.name || "Ana Martinez"}</span>
          <h1 className="qk-h1" style={{ marginTop: 12, fontSize:"clamp(28px, 4vw, 44px)" }}>{t("whoTitle")}</h1>
          <p className="qk-sub" style={{ margin:"10px auto 0" }}>{t("whoSub")}</p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:24, maxWidth: 840, margin:"0 auto", width:"100%" }} className="qk-profiles-grid">
          {/* parent */}
          <ProfileTile
            label={t("parentProfile")}
            sub={account?.name || "Ana"}
            tone="ink"
            badge={{ icon: ICONS.spark, color:"var(--honey)" }}
            onClick={onPickParent}
          >
            <div style={{
              width:"100%", aspectRatio:"1", borderRadius:24,
              background:"linear-gradient(135deg, var(--ink) 0%, #2a3d2e 100%)",
              color:"#fff",
              display:"grid", placeItems:"center",
              fontFamily:"var(--font-display)", fontWeight:600, fontSize:"clamp(36px, 5vw, 56px)",
              boxShadow:"var(--shadow-lg)",
              position:"relative", overflow:"hidden",
            }}>
              <div aria-hidden style={{ position:"absolute", inset:0, opacity:.16,
                backgroundImage:"radial-gradient(rgba(255,255,255,.7) 1.5px, transparent 1.5px)", backgroundSize:"18px 18px" }} />
              <span style={{ position:"relative" }}>{(account?.name || "A").trim().charAt(0).toUpperCase()}</span>
            </div>
          </ProfileTile>

          {/* kids */}
          {kids.map(k => (
            <ProfileTile
              key={k.id}
              label={k.name}
              sub={(lang==="es"?"Grado ":"Grade ")+k.grade}
              tone="kid"
              onClick={() => onPickKid(k.id)}
            >
              <div style={{
                width:"100%", aspectRatio:"1", borderRadius:24,
                background:"var(--surface)", border:"3px solid " + (k.color || "var(--primary)"),
                display:"grid", placeItems:"center",
                boxShadow:"var(--shadow-lg)",
                overflow:"hidden",
              }}>
                <div style={{ transform:"scale(1.05)" }}>
                  <Avatar id={k.avatar} size={120} />
                </div>
              </div>
            </ProfileTile>
          ))}

          {/* add profile */}
          <ProfileTile
            label={t("addProfile")}
            tone="dashed"
            onClick={onAddKid}
          >
            <div style={{
              width:"100%", aspectRatio:"1", borderRadius:24,
              background:"transparent",
              border:"3px dashed var(--line)",
              display:"grid", placeItems:"center",
              color:"var(--ink-3)",
            }}>
              <Ico d={<path d="M12 5v14M5 12h14" />} size={48} stroke={2} />
            </div>
          </ProfileTile>
        </div>

        {/* footer actions */}
        <div style={{ marginTop: 40, display:"flex", justifyContent:"center", gap:14, flexWrap:"wrap" }}>
          <button onClick={onKidCode} className="qk-btn qk-btn-ghost" style={{ fontSize:14, padding:"10px 16px" }}>
            <Ico d={<g><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a4 4 0 018 0v2"/></g>} size={16} />
            <span>{t("useKidCode")}</span>
          </button>
          <button onClick={onSignOut} style={{
            appearance:"none", border:0, background:"transparent",
            color:"var(--ink-3)", fontSize:14, padding:"10px 16px", cursor:"pointer",
          }}>
            {t("signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileTile({ label, sub, badge, onClick, children, tone }) {
  return (
    <button onClick={onClick} className="qk-profile-tile" style={{
      appearance:"none", border:0, background:"transparent",
      padding:0, cursor:"pointer",
      display:"flex", flexDirection:"column", alignItems:"center", gap:10,
      transition:"transform .2s cubic-bezier(.2,.7,.2,1)",
      position:"relative",
    }}>
      <div style={{ width:"100%", position:"relative" }}>
        {children}
        {badge && (
          <div style={{
            position:"absolute", right:-6, top:-6,
            width:34, height:34, borderRadius:"50%",
            background: badge.color, color:"#fff",
            display:"grid", placeItems:"center",
            border:"3px solid var(--bg)",
            boxShadow:"var(--shadow-sm)",
          }}>{React.cloneElement(badge.icon, { size: 14 })}</div>
        )}
      </div>
      <div style={{ textAlign:"center" }}>
        <div style={{
          fontFamily:"var(--font-display)", fontWeight:600, fontSize:18,
          color:"var(--ink)",
        }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:2 }}>{sub}</div>}
      </div>
      <style>{`
        .qk-profile-tile:hover { transform: translateY(-4px); }
        .qk-profile-tile:hover > div:first-child > div:first-child {
          filter: brightness(1.04);
        }
      `}</style>
    </button>
  );
}


/* =============================================================
   ParentPinScreen
   ============================================================= */
function ParentPinScreen({ lang, expectedPin = "1234", onBack, onSuccess, kid }) {
  const t = useT(lang);
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState(false);
  const [shake, setShake] = React.useState(false);

  const tryConfirm = (full) => {
    if (full === expectedPin) {
      setError(false);
      setTimeout(onSuccess, 200);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => { setPin(""); setShake(false); }, 500);
    }
  };

  const press = (digit) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setError(false);
    setPin(next);
    if (next.length === 4) tryConfirm(next);
  };
  const back = () => setPin(p => p.slice(0, -1));

  return (
    <div className="qk-screen" data-screen-label="00d Parent PIN" style={{ padding:"40px clamp(20px, 5vw, 56px) 56px", minHeight:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth: 380 }}>
        <button onClick={onBack} className="qk-btn qk-btn-ghost" style={{ padding:"6px 12px", fontSize:13 }}>
          {ICONS.back} <span>{t("switchProfile")}</span>
        </button>

        <div style={{ textAlign:"center", marginTop: 24, marginBottom: 32 }}>
          <div style={{
            width:88, height:88, margin:"0 auto",
            borderRadius:24,
            background:"linear-gradient(135deg, var(--ink) 0%, #2a3d2e 100%)",
            color:"#fff",
            display:"grid", placeItems:"center",
            fontFamily:"var(--font-display)", fontWeight:600, fontSize:36,
            boxShadow:"var(--shadow-lg)",
          }}>🔒</div>
          <h2 className="qk-h1" style={{ marginTop:16, fontSize:"clamp(22px, 2.8vw, 28px)" }}>{t("pinTitle")}</h2>
          <p className="qk-sub" style={{ margin:"6px auto 0", fontSize:14 }}>{t("pinSub")}</p>
        </div>

        {/* dots */}
        <div className={"qk-pin-dots" + (shake ? " shake" : "")} style={{
          display:"flex", justifyContent:"center", gap:14, marginBottom: 8,
        }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width:18, height:18, borderRadius:"50%",
              background: i < pin.length ? (error ? "var(--coral)" : "var(--primary)") : "var(--surface-2)",
              border:"1.5px solid " + (error ? "var(--coral)" : "var(--line)"),
              transition: "background .15s ease, border-color .15s ease",
            }} />
          ))}
        </div>
        <div style={{ height:18, textAlign:"center", fontSize:13, fontWeight:700, color:"var(--coral)" }}>
          {error ? t("pinWrong") : ""}
        </div>

        {/* keypad */}
        <div style={{
          marginTop: 18,
          display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10,
          maxWidth: 320, margin:"18px auto 0",
        }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => press(String(n))} style={{
              appearance:"none", border:"1.5px solid var(--line)",
              background:"var(--surface)",
              fontFamily:"var(--font-display)", fontWeight:600, fontSize:24,
              height:64, borderRadius:16, cursor:"pointer",
              transition:"transform .08s ease, background .12s ease",
            }}
            onMouseDown={(e) => e.currentTarget.style.background="var(--surface-2)"}
            onMouseUp={(e) => e.currentTarget.style.background="var(--surface)"}
            onMouseLeave={(e) => e.currentTarget.style.background="var(--surface)"}
            >{n}</button>
          ))}
          <button onClick={() => onBack()} style={{
            appearance:"none", border:0, background:"transparent",
            color:"var(--ink-3)", fontSize:13, cursor:"pointer",
          }}>{t("forgotPin")}</button>
          <button onClick={() => press("0")} style={{
            appearance:"none", border:"1.5px solid var(--line)",
            background:"var(--surface)",
            fontFamily:"var(--font-display)", fontWeight:600, fontSize:24,
            height:64, borderRadius:16, cursor:"pointer",
          }}>0</button>
          <button onClick={back} style={{
            appearance:"none", border:0, background:"transparent",
            color:"var(--ink-2)",
            display:"grid", placeItems:"center", cursor:"pointer",
          }} aria-label="Backspace">
            <Ico d={<g><path d="M22 5H8L2 12l6 7h14a2 2 0 002-2V7a2 2 0 00-2-2z"/><path d="M18 9l-6 6M12 9l6 6"/></g>} size={22} />
          </button>
        </div>

        <style>{`
          @keyframes qk-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
          .qk-pin-dots.shake { animation: qk-shake .36s ease }
        `}</style>
      </div>
    </div>
  );
}


/* =============================================================
   KidCodeScreen
   ============================================================= */
function KidCodeScreen({ lang, kids, onBack, onSuccess }) {
  const t = useT(lang);
  const [code, setCode] = React.useState(["","","","","",""]);
  const [error, setError] = React.useState(false);
  const refs = React.useRef([]);

  // each kid has a generated code in our seed (for demo). In a real app, parent issues them.
  const codes = React.useMemo(() => {
    const map = {};
    kids.forEach(k => {
      map[k.id] = (k.name.toUpperCase().replace(/[^A-Z]/g,'') + "12345").slice(0, 6);
    });
    return map;
  }, [kids]);

  const fullCode = code.join("").toUpperCase();
  const matchKid = kids.find(k => codes[k.id] === fullCode);
  const isFull = code.every(c => c !== "");

  React.useEffect(() => {
    if (isFull) {
      if (matchKid) {
        setError(false);
        setTimeout(() => onSuccess(matchKid.id), 200);
      } else {
        setError(true);
      }
    } else {
      setError(false);
    }
  }, [fullCode]);

  const setAt = (i, v) => {
    v = v.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,1);
    setCode(prev => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (v && refs.current[i+1]) refs.current[i+1].focus();
  };

  const keyDown = (i, e) => {
    if (e.key === "Backspace" && !code[i] && refs.current[i-1]) {
      refs.current[i-1].focus();
    }
  };

  return (
    <div className="qk-screen" data-screen-label="00e Kid Code" style={{ padding:"40px clamp(20px, 5vw, 56px) 56px", minHeight:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth: 480 }}>
        <button onClick={onBack} className="qk-btn qk-btn-ghost" style={{ padding:"6px 12px", fontSize:13 }}>
          {ICONS.back} <span>{t("switchProfile")}</span>
        </button>

        <div style={{ textAlign:"center", marginTop: 24, marginBottom: 32 }}>
          <div style={{ display:"inline-flex", gap:-8 }}>
            {kids.slice(0,3).map((k, i) => (
              <div key={k.id} style={{ marginLeft: i ? -10 : 0, borderRadius:"50%", background:"var(--surface)", border:"3px solid var(--surface)", transform:`rotate(${[-4,2,-2][i]||0}deg)` }}>
                <Avatar id={k.avatar} size={72} />
              </div>
            ))}
          </div>
          <h2 className="qk-h1" style={{ marginTop:18, fontSize:"clamp(22px, 2.8vw, 30px)" }}>{t("kidCodeTitle")}</h2>
          <p className="qk-sub" style={{ margin:"6px auto 0", fontSize:14 }}>{t("kidCodeSub")}</p>
        </div>

        <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
          {code.map((c, i) => (
            <input
              key={i}
              ref={el => (refs.current[i] = el)}
              value={c}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => keyDown(i, e)}
              maxLength={1}
              style={{
                width:"clamp(40px, 12vw, 56px)", height:"clamp(48px, 14vw, 68px)",
                border:"2px solid " + (error ? "var(--coral)" : c ? "var(--primary)" : "var(--line)"),
                background: c ? "var(--primary-l)" : "var(--surface)",
                borderRadius:14, textAlign:"center",
                fontFamily:"var(--font-display)", fontWeight:700,
                fontSize:"clamp(22px, 4vw, 30px)",
                color:"var(--ink)",
                textTransform:"uppercase",
                outline:"none",
                transition:"all .15s ease",
              }}
            />
          ))}
        </div>

        <div style={{ height:24, textAlign:"center", marginTop:14, fontSize:14, fontWeight:700, color:"var(--coral)" }}>
          {error ? t("kidCodeBad") : ""}
        </div>

        {/* hint — show kids and their codes for the demo */}
        <details style={{ marginTop:18, fontSize:13, color:"var(--ink-3)" }}>
          <summary style={{ cursor:"pointer", textAlign:"center", fontWeight:600 }}>
            {lang==="es" ? "Ver códigos de prueba" : "See demo codes"}
          </summary>
          <div style={{ marginTop:12, padding:14, background:"var(--surface-2)", borderRadius:14, display:"flex", flexDirection:"column", gap:8 }}>
            {kids.map(k => (
              <div key={k.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Avatar id={k.avatar} size={28} />
                <span style={{ flex:1, fontWeight:700, color:"var(--ink)" }}>{k.name}</span>
                <code style={{ fontFamily:"ui-monospace, monospace", padding:"4px 10px", background:"var(--surface)", border:"1px solid var(--line)", borderRadius:8, fontWeight:700, letterSpacing:".08em" }}>
                  {codes[k.id]}
                </code>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}


export { ProfilePickerScreen, ParentPinScreen, KidCodeScreen };
