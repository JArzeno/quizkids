import React from 'react';
import { useT, Ico, ICONS, Btn, Chip, AVATARS, Avatar, Stars, StatCard, ImgPlaceholder, useSession, formatElapsed, SessionPill, RoleSwitch, QK_PLANS, BillingToggle, PricingCard, PricingCards } from './components.jsx';


// screens-parent.jsx — Welcome, Onboarding, Dashboard, Picker, Generate

/* =============================================================
   1. Welcome (landing)
   ============================================================= */
function WelcomeScreen({ lang, onAddKid, onSeeDemo, onSignIn, kids }) {
  const t = useT(lang);
  const [pricingCycle, setPricingCycle] = React.useState("monthly");

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.parentElement.scrollTop = el.offsetTop - 24;
  };

  return (
    <div className="qk-screen" data-screen-label="01 Welcome" style={{ padding: 0 }}>
      {/* in-page subnav */}
      <div style={{
        position:"sticky", top:0, zIndex:4,
        background:"rgba(244,239,227,.78)",
        backdropFilter:"blur(12px)",
        WebkitBackdropFilter:"blur(12px)",
        borderBottom:"1px solid rgba(31,51,38,.06)",
      }}>
        <div style={{ maxWidth:1180, margin:"0 auto", padding:"10px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <nav style={{ display:"flex", gap:18, fontSize:14, fontWeight:600, color:"var(--ink-2)", flexWrap:"wrap" }}>
            <button onClick={() => scrollTo("how")} style={{ appearance:"none", border:0, background:"transparent", color:"inherit", padding:0, cursor:"pointer", fontWeight:"inherit" }}>{t("navHow")}</button>
            <button onClick={() => scrollTo("what")} style={{ appearance:"none", border:0, background:"transparent", color:"inherit", padding:0, cursor:"pointer", fontWeight:"inherit" }}>{t("navWhat")}</button>
            <button onClick={() => scrollTo("subjects")} style={{ appearance:"none", border:0, background:"transparent", color:"inherit", padding:0, cursor:"pointer", fontWeight:"inherit" }}>{t("navSubjects")}</button>
            <button onClick={() => scrollTo("parents")} style={{ appearance:"none", border:0, background:"transparent", color:"inherit", padding:0, cursor:"pointer", fontWeight:"inherit" }}>{t("navParents")}</button>
            <button onClick={() => scrollTo("pricing")} style={{ appearance:"none", border:0, background:"transparent", color:"inherit", padding:0, cursor:"pointer", fontWeight:"inherit" }}>{t("pricingEyebrow")}</button>
          </nav>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={onSignIn} className="qk-btn qk-btn-ghost" style={{ padding:"8px 14px", fontSize:14 }}>{t("navSignIn")}</button>
            <Btn kind="primary" onClick={onAddKid} icon={ICONS.plus} style={{ padding:"8px 14px", fontSize:14 }}>{t("addKid")}</Btn>
          </div>
        </div>
      </div>

      {/* HERO ============================================================ */}
      <section style={{ padding:"56px clamp(20px, 5vw, 56px) 72px" }}>
        <div style={{ maxWidth: 1180, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.05fr 1fr", gap:48, alignItems:"center" }} className="qk-hero-grid">
            <div>
              <span className="qk-eyebrow">
                <Ico d={<path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z"/>} size={14} stroke={2} /> {t("heroBadge")}
              </span>
              <h1 className="qk-h1" style={{ marginTop:14 }}>
                {lang === "es" ? (
                  <>Un rinconcito <span className="qk-underline">amigable</span> para estudiar.</>
                ) : (
                  <>A cozy place for kids to <span className="qk-underline">love learning</span>.</>
                )}
              </h1>
              <p className="qk-sub">{t("welcomeSub")}</p>
              <div style={{ display:"flex", gap:12, marginTop:24, flexWrap:"wrap" }}>
                <Btn kind="primary" icon={ICONS.plus} onClick={onAddKid}>{t("addKid")}</Btn>
                <Btn kind="ghost" onClick={() => onSeeDemo()}>{t("seeDemo")}</Btn>
              </div>

              {/* mini stats */}
              <div style={{ marginTop:32, display:"flex", gap:28, flexWrap:"wrap" }}>
                {[
                  [t("heroStat1"), t("heroStat1Lbl")],
                  [t("heroStat2"), t("heroStat2Lbl")],
                  [t("heroStat3"), t("heroStat3Lbl")],
                ].map(([v,l],i) => (
                  <div key={i} style={{ borderLeft: i>0 ? "1px solid var(--line)" : "none", paddingLeft: i>0 ? 28 : 0 }}>
                    <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:24, lineHeight:1 }}>{v}</div>
                    <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:4 }}>{l}</div>
                  </div>
                ))}
              </div>

              {kids.length > 0 && (
                <div style={{ marginTop:32 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>
                    {lang === "es" ? "Continuar como" : "Continue as"}
                  </div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {kids.map(k => (
                      <button key={k.id} onClick={() => onSeeDemo(k.id)} className="qk-chip" style={{ padding:"6px 12px 6px 6px", gap:10 }}>
                        <Avatar id={k.avatar} size={28} />
                        <span>{k.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* hero composition */}
            <div style={{ position:"relative", aspectRatio:"5/4" }}>
              <div className="qk-blob" style={{ position:"absolute", inset:"4% 6% 6% 8%" }} />
              <div className="qk-card" style={{
                position:"absolute", left:"14%", top:"10%", width:"70%",
                transform:"rotate(-3deg)", padding:18,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Avatar id="fox" size={42} />
                  <div>
                    <div style={{ fontFamily:"var(--font-display)", fontWeight:600 }}>Mateo · Grade 3</div>
                    <div style={{ fontSize:12, color:"var(--ink-3)" }}>Science · Solar System</div>
                  </div>
                </div>
                <div style={{ marginTop:14, padding:"14px 16px", background:"var(--primary-l)", borderRadius:14, fontFamily:"var(--font-display)", fontWeight:500 }}>
                  Which planet is closest to the Sun?
                </div>
                <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {["Mercury","Venus","Earth","Mars"].map((o,i) => (
                    <div key={o} style={{
                      padding:"10px 12px", borderRadius:12,
                      border:"1.5px solid " + (i===0 ? "var(--primary)" : "var(--line)"),
                      background: i===0 ? "var(--primary-l)" : "var(--surface)",
                      fontSize:14, fontWeight:600
                    }}>{o}</div>
                  ))}
                </div>
              </div>
              <div className="qk-sticker" style={{ position:"absolute", right:"4%", top:"4%", fontSize:14 }}>+ 5 ⭐</div>
              <div className="qk-card" style={{
                position:"absolute", left:"4%", bottom:"4%", width:"45%",
                transform:"rotate(4deg)", padding:14
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:12, background:"var(--coral-l)", color:"var(--coral)", display:"grid", placeItems:"center" }}>
                    {ICONS.flame}
                  </div>
                  <div>
                    <div style={{ fontFamily:"var(--font-display)", fontWeight:600 }}>7 day streak</div>
                    <div style={{ fontSize:12, color:"var(--ink-3)" }}>Keep it up, Mateo!</div>
                  </div>
                </div>
              </div>
              <div style={{
                position:"absolute", right:"2%", bottom:"14%",
                width:88, height:88, borderRadius:"50%",
                background:"var(--surface)", border:"6px solid var(--surface)",
                boxShadow:"var(--shadow)"
              }}>
                <Avatar id="sprout" size={76} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS ===================================================== */}
      <section id="how" style={{ padding:"56px clamp(20px, 5vw, 56px)", background:"var(--surface-2)", borderTop:"1px solid var(--line)", borderBottom:"1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin:"0 auto" }}>
          <div style={{ textAlign:"center", maxWidth:620, margin:"0 auto" }}>
            <span className="qk-eyebrow">01 · 02 · 03</span>
            <h2 className="qk-h1" style={{ fontSize:"clamp(26px, 3vw, 36px)", marginTop:10 }}>{t("howTitle")}</h2>
            <p className="qk-sub" style={{ margin:"10px auto 0" }}>{t("howSub")}</p>
          </div>

          <div style={{ marginTop:40, display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:18 }} className="qk-how-grid">
            {[
              { tone:"primary", icon: ICONS.pencil, title: t("how1Title"), body: t("how1Body"), n:"1" },
              { tone:"sky",     icon: ICONS.book,   title: t("how2Title"), body: t("how2Body"), n:"2" },
              { tone:"honey",   icon: ICONS.spark,  title: t("how3Title"), body: t("how3Body"), n:"3" },
            ].map((s, idx) => {
              const bg = `var(--${s.tone === "primary" ? "primary-l" : s.tone+"-l"})`;
              const fg = `var(--${s.tone === "primary" ? "primary" : s.tone})`;
              return (
                <div key={idx} className="qk-card" style={{ padding:24, position:"relative" }}>
                  <div style={{
                    position:"absolute", top:-16, left:24,
                    width:36, height:36, borderRadius:12,
                    background:"var(--ink)", color:"#fff",
                    display:"grid", placeItems:"center",
                    fontFamily:"var(--font-display)", fontWeight:700, fontSize:18,
                    transform:"rotate(-4deg)",
                    boxShadow:"var(--shadow-sm)",
                  }}>{s.n}</div>
                  <div style={{ width:56, height:56, borderRadius:18, background: bg, color: fg, display:"grid", placeItems:"center", marginTop:8 }}>
                    {React.cloneElement(s.icon, { size: 26 })}
                  </div>
                  <h3 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:22, margin:"16px 0 6px" }}>{s.title}</h3>
                  <p style={{ margin:0, fontSize:15, color:"var(--ink-2)", lineHeight:1.55, textWrap:"pretty" }}>{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET ===================================================== */}
      <section id="what" style={{ padding:"72px clamp(20px, 5vw, 56px)" }}>
        <div style={{ maxWidth: 1180, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"end" }} className="qk-hero-grid">
            <div>
              <span className="qk-eyebrow">3-in-1</span>
              <h2 className="qk-h1" style={{ fontSize:"clamp(26px, 3vw, 36px)", marginTop:10 }}>{t("whatTitle")}</h2>
              <p className="qk-sub">{t("whatSub")}</p>
            </div>
          </div>

          <div style={{ marginTop:32, display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:18 }} className="qk-how-grid">
            {[
              { tone:"primary", icon: ICONS.cards,   title: t("whatQuiz"),  body: t("whatQuizSub") },
              { tone:"sky",     icon: ICONS.book,    title: t("whatGuide"), body: t("whatGuideSub") },
              { tone:"coral",   icon: ICONS.printer, title: t("whatPdf"),   body: t("whatPdfSub") },
            ].map((s, idx) => {
              const bg = `var(--${s.tone === "primary" ? "primary-l" : s.tone+"-l"})`;
              const fg = `var(--${s.tone === "primary" ? "primary" : s.tone})`;
              return (
                <div key={idx} className="qk-card" style={{ padding:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                  <div style={{
                    height:160, background: bg, color: fg,
                    display:"grid", placeItems:"center",
                    position:"relative",
                  }}>
                    <div style={{ position:"absolute", inset:0, opacity:.2,
                      backgroundImage:"radial-gradient(currentColor 1px, transparent 1px)", backgroundSize:"14px 14px" }} />
                    <div style={{ position:"relative", transform:"scale(2.4)" }}>{s.icon}</div>
                  </div>
                  <div style={{ padding:"20px 22px 22px" }}>
                    <h3 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:22, margin:"0 0 6px" }}>{s.title}</h3>
                    <p style={{ margin:0, fontSize:15, color:"var(--ink-2)", lineHeight:1.55, textWrap:"pretty" }}>{s.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SUBJECTS ========================================================= */}
      <section id="subjects" style={{ padding:"72px clamp(20px, 5vw, 56px)", background:"var(--surface-2)", borderTop:"1px solid var(--line)", borderBottom:"1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin:"0 auto" }}>
          <div style={{ textAlign:"center", maxWidth:660, margin:"0 auto" }}>
            <span className="qk-eyebrow">K-12</span>
            <h2 className="qk-h1" style={{ fontSize:"clamp(26px, 3vw, 36px)", marginTop:10 }}>{t("subjectsTitle")}</h2>
            <p className="qk-sub" style={{ margin:"10px auto 0" }}>{t("subjectsSub")}</p>
          </div>

          {/* grade band */}
          <div style={{ marginTop:36, display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14 }} className="qk-grade-grid">
            {[
              { range: "K-2",  tone:"honey",   body: t("subjectK2"),  avatar:"bee" },
              { range: "3-5",  tone:"primary", body: t("subject35"),  avatar:"sprout" },
              { range: "6-8",  tone:"sky",     body: t("subject68"),  avatar:"owl" },
              { range: "9-12", tone:"berry",   body: t("subject912"), avatar:"fox" },
            ].map((g, idx) => {
              const bg = `var(--${g.tone === "primary" ? "primary-l" : g.tone+"-l"})`;
              const fg = `var(--${g.tone === "primary" ? "primary-d" : g.tone})`;
              return (
                <div key={idx} className="qk-card" style={{ padding:18, display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{
                      padding:"4px 10px", borderRadius:999, background: bg, color: fg,
                      fontFamily:"var(--font-display)", fontWeight:700, fontSize:13,
                    }}>{g.range}</span>
                    <Avatar id={g.avatar} size={40} />
                  </div>
                  <p style={{ margin:0, fontSize:14, color:"var(--ink-2)", lineHeight:1.5 }}>{g.body}</p>
                </div>
              );
            })}
          </div>

          {/* subject pills */}
          <div style={{ marginTop:32, display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" }}>
            {[
              { id:"sci",  icon:"🔬", live:true  },
              { id:"math", icon:"➗", live:false },
              { id:"lang", icon:"📖", live:false },
              { id:"soc",  icon:"🌎", live:false },
              { id:"art",  icon:"🎨", live:false },
            ].map(s => (
              <div key={s.id} style={{
                display:"inline-flex", alignItems:"center", gap:8,
                padding:"10px 14px", borderRadius:999,
                background:"var(--surface)", border:"1.5px solid var(--line)",
                fontFamily:"var(--font-display)", fontWeight:600, fontSize:15,
              }}>
                <span style={{ fontSize:18 }}>{s.icon}</span>
                <span>{t(s.id)}</span>
                {s.live ? (
                  <span style={{ padding:"2px 8px", borderRadius:999, background:"var(--primary)", color:"#fff", fontSize:11, fontWeight:700, letterSpacing:".04em" }}>
                    {lang==="es"?"LISTO":"LIVE"}
                  </span>
                ) : (
                  <span style={{ padding:"2px 8px", borderRadius:999, background:"var(--surface-2)", color:"var(--ink-3)", fontSize:11, fontWeight:700, letterSpacing:".04em" }}>
                    {lang==="es"?"PRONTO":"SOON"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR PARENTS ====================================================== */}
      <section id="parents" style={{ padding:"72px clamp(20px, 5vw, 56px)" }}>
        <div style={{ maxWidth: 1180, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center" }} className="qk-hero-grid">
            <div style={{ position:"relative", aspectRatio:"5/4" }}>
              <div className="qk-blob" style={{ position:"absolute", inset:"6% 8% 8% 4%", background:"radial-gradient(120% 120% at 30% 20%, var(--honey-l), var(--bg-2))" }} />
              {/* dashboard card preview */}
              <div className="qk-card" style={{ position:"absolute", inset:"8% 6%", padding:20, transform:"rotate(-2deg)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span className="qk-eyebrow">{lang==="es"?"Esta semana":"This week"}</span>
                  <span style={{ fontSize:12, color:"var(--ink-3)" }}>2 kids</span>
                </div>
                <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    { name:"Mateo",  avatar:"fox",    streak:7, pct:62 },
                    { name:"Lucía",  avatar:"sprout", streak:3, pct:35 },
                  ].map((k,i) => (
                    <div key={i} style={{ padding:12, background:"var(--surface-2)", borderRadius:14, display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar id={k.avatar} size={36} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:15 }}>{k.name}</div>
                        <div className="qk-progress" style={{ marginTop:6, height:6 }}><span style={{ width: k.pct+"%" }} /></div>
                      </div>
                      <div style={{ display:"inline-flex", alignItems:"center", gap:4, color:"var(--coral)", fontWeight:700, fontSize:13 }}>
                        <span style={{ display:"inline-flex" }}>{React.cloneElement(ICONS.flame, { size: 14 })}</span>{k.streak}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="qk-sticker" style={{ position:"absolute", right:"-2%", top:"6%", background:"var(--primary)" }}>
                {lang==="es"?"Sin anuncios":"Ad-free"}
              </div>
            </div>

            <div>
              <span className="qk-eyebrow">{lang==="es"?"Para familias":"For parents"}</span>
              <h2 className="qk-h1" style={{ fontSize:"clamp(26px, 3vw, 36px)", marginTop:10 }}>{t("parentsTitle")}</h2>
              <div style={{ marginTop:24, display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                {[
                  { icon: ICONS.shuffle, title: t("parents1"), body: t("parents1Sub"), tone:"sky" },
                  { icon: ICONS.leaf,    title: t("parents2"), body: t("parents2Sub"), tone:"primary" },
                  { icon: ICONS.pencil,  title: t("parents3"), body: t("parents3Sub"), tone:"honey" },
                  { icon: ICONS.star,    title: t("parents4"), body: t("parents4Sub"), tone:"coral" },
                ].map((p, idx) => {
                  const bg = `var(--${p.tone === "primary" ? "primary-l" : p.tone+"-l"})`;
                  const fg = `var(--${p.tone === "primary" ? "primary" : p.tone})`;
                  return (
                    <div key={idx} style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ width:40, height:40, borderRadius:12, background: bg, color: fg, display:"grid", placeItems:"center" }}>
                        {React.cloneElement(p.icon, { size: 20 })}
                      </div>
                      <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:17 }}>{p.title}</div>
                      <p style={{ margin:0, fontSize:14, color:"var(--ink-2)", lineHeight:1.5 }}>{p.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING ========================================================== */}
      <section id="pricing" style={{ padding:"72px clamp(20px, 5vw, 56px)", background:"var(--surface-2)", borderTop:"1px solid var(--line)", borderBottom:"1px solid var(--line)" }}>
        <div style={{ maxWidth: 1180, margin:"0 auto" }}>
          <div style={{ textAlign:"center", maxWidth:620, margin:"0 auto" }}>
            <span className="qk-eyebrow">{t("pricingEyebrow")}</span>
            <h2 className="qk-h1" style={{ fontSize:"clamp(26px, 3vw, 36px)", marginTop:10 }}>{t("pricingTitle")}</h2>
            <p className="qk-sub" style={{ margin:"10px auto 0" }}>{t("pricingSub")}</p>
          </div>
          <div style={{ marginTop:36 }}>
            <PricingCards
              lang={lang}
              cycle={pricingCycle}
              setCycle={setPricingCycle}
              currentPlanId={null}
              onSelect={(planId) => onAddKid && onAddKid(planId)}
            />
          </div>
          <p style={{ marginTop:24, textAlign:"center", fontSize:13, color:"var(--ink-3)" }}>
            {lang === "es"
              ? "Sin compromisos. Cancela cuando quieras."
              : "No commitments. Cancel anytime."}
          </p>
        </div>
      </section>

      {/* CTA ============================================================== */}
      <section style={{ padding:"32px clamp(20px, 5vw, 56px) 72px" }}>
        <div style={{ maxWidth: 1180, margin:"0 auto" }}>
          <div className="qk-card" style={{
            padding:"clamp(28px, 5vw, 48px)",
            background:"linear-gradient(135deg, var(--primary) 0%, var(--primary-d) 100%)",
            color:"#fff",
            borderColor:"var(--primary-d)",
            position:"relative", overflow:"hidden",
          }}>
            <div aria-hidden style={{ position:"absolute", inset:0, opacity:.18,
              backgroundImage:"radial-gradient(rgba(255,255,255,.6) 1.5px, transparent 1.5px)",
              backgroundSize:"22px 22px" }} />
            {/* floating avatars */}
            <div style={{ position:"absolute", right:"-3%", top:"-10%", opacity:.9, transform:"rotate(8deg)" }}><Avatar id="bee" size={120} /></div>
            <div style={{ position:"absolute", right:"22%", bottom:"-18%", opacity:.85, transform:"rotate(-6deg)" }}><Avatar id="frog" size={90} /></div>

            <div style={{ position:"relative", maxWidth:600 }}>
              <span style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"4px 10px", borderRadius:999,
                background:"rgba(255,255,255,.18)", color:"#fff",
                fontSize:13, fontWeight:700, letterSpacing:".04em",
              }}>★ {lang==="es"?"Empieza gratis":"Start free"}</span>
              <h2 className="qk-h1" style={{ fontSize:"clamp(26px, 3vw, 38px)", marginTop:14, color:"#fff" }}>{t("ctaTitle")}</h2>
              <p style={{ margin:"12px 0 0", fontSize:17, lineHeight:1.5, color:"rgba(255,255,255,.88)", maxWidth:520 }}>{t("ctaSub")}</p>
              <div style={{ marginTop:24, display:"flex", gap:12, flexWrap:"wrap" }}>
                <button onClick={onAddKid} className="qk-btn" style={{
                  background:"#fff", color:"var(--primary-d)",
                  boxShadow:"0 3px 0 rgba(0,0,0,.18), var(--shadow-sm)",
                }}>
                  {ICONS.plus}<span>{t("ctaPrimary")}</span>
                </button>
                <button onClick={() => onSeeDemo()} className="qk-btn" style={{
                  background:"rgba(255,255,255,.14)", color:"#fff",
                  border:"1px solid rgba(255,255,255,.3)",
                }}>
                  <span>{t("ctaSecondary")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER =========================================================== */}
      <footer style={{ padding:"40px clamp(20px, 5vw, 56px) 56px", borderTop:"1px solid var(--line)", background:"var(--surface-2)" }}>
        <div style={{ maxWidth: 1180, margin:"0 auto" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr 1fr 1fr 1fr", gap:32 }} className="qk-footer-grid">
            <div>
              <div className="qk-brand" style={{ marginBottom:10 }}>
                <span className="qk-brand-mark">
                  <Ico d={<path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z"/>} size={18} stroke={2}/>
                </span>
                QuizKids
              </div>
              <p style={{ margin:0, fontSize:14, color:"var(--ink-2)", maxWidth:280, lineHeight:1.5 }}>{t("footerTagline")}</p>
              <div style={{ marginTop:18, display:"flex", gap:8 }}>
                {["EN","ES"].map(L => (
                  <span key={L} style={{ padding:"4px 10px", borderRadius:999, background:"var(--surface)", border:"1px solid var(--line)", fontSize:12, fontWeight:700, color:"var(--ink-3)" }}>{L}</span>
                ))}
              </div>
            </div>
            {[
              { h: t("footerProduct"), links: [t("navHow"), t("navWhat"), t("navSubjects"), "Tweaks"] },
              { h: t("footerCompany"), links: [lang==="es"?"Nosotros":"About", lang==="es"?"Blog":"Blog", lang==="es"?"Equipo":"Team", lang==="es"?"Carreras":"Careers"] },
              { h: t("footerHelp"),    links: [lang==="es"?"Ayuda":"Help center", lang==="es"?"Contacto":"Contact", lang==="es"?"Estado":"Status"] },
              { h: t("footerLegal"),   links: [lang==="es"?"Privacidad":"Privacy", lang==="es"?"Términos":"Terms", "COPPA"] },
            ].map((col, idx) => (
              <div key={idx}>
                <div style={{ fontSize:12, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", color:"var(--ink-3)", marginBottom:12 }}>{col.h}</div>
                <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:8 }}>
                  {col.links.map((l,i) => (
                    <li key={i} style={{ fontSize:14, color:"var(--ink-2)" }}>{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ marginTop:32, paddingTop:18, borderTop:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:14, flexWrap:"wrap" }}>
            <div style={{ fontSize:13, color:"var(--ink-3)" }}>{t("footerCopy")}</div>
            <div style={{ fontSize:12, color:"var(--ink-3)", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--primary)" }} />
              {lang==="es"?"Todos los sistemas operativos":"All systems normal"}
            </div>
          </div>
        </div>
      </footer>

      {/* responsive */}
      <style>{`
        @media (max-width: 880px) {
          .qk-hero-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .qk-how-grid { grid-template-columns: 1fr !important; }
          .qk-grade-grid { grid-template-columns: 1fr 1fr !important; }
          .qk-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* =============================================================
   2. Onboarding — name, grade, avatar, signature
   ============================================================= */
function Signature({ value, onChange }) {
  const ref = React.useRef(null);
  const drawing = React.useRef(false);
  const last = React.useRef(null);

  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr; c.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#1F3326"; ctx.lineWidth = 2.4;
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
    }
  }, []);

  const pos = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; last.current = pos(e); };
  const move = (e) => {
    if (!drawing.current) return; e.preventDefault();
    const ctx = ref.current.getContext("2d");
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange && onChange(ref.current.toDataURL("image/png"));
  };

  const clear = () => {
    const c = ref.current; const ctx = c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);
    onChange && onChange("");
  };

  return (
    <div>
      <div style={{
        background:"var(--surface)",
        border:"1.5px dashed var(--line)",
        borderRadius:18,
        height:160, position:"relative",
        backgroundImage:"linear-gradient(transparent calc(100% - 30px), var(--line) 0)",
        backgroundSize:"100% 100%"
      }}>
        <canvas
          ref={ref}
          style={{ width:"100%", height:"100%", touchAction:"none", cursor:"crosshair" }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        />
        <div style={{ position:"absolute", left:18, bottom:8, fontSize:11, color:"var(--ink-3)", fontFamily:"ui-monospace, monospace", letterSpacing:".06em" }}>x ________________________</div>
      </div>
      <div style={{ marginTop:10, display:"flex", justifyContent:"flex-end" }}>
        <button className="qk-btn qk-btn-ghost" style={{ fontSize:13, padding:"8px 12px" }} onClick={clear}>
          {ICONS.trash} <span>Clear</span>
        </button>
      </div>
    </div>
  );
}

function OnboardingScreen({ lang, onDone, onBack, draft, setDraft }) {
  const t = useT(lang);
  const [step, setStep] = React.useState(0);
  const STEPS = 4;
  const canNext = [
    () => (draft.name || "").trim().length > 0,
    () => !!draft.grade,
    () => !!draft.avatar,
    () => true,
  ][step]();

  return (
    <div className="qk-screen" data-screen-label="02 Onboarding">
      <div style={{ maxWidth: 720, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <button className="qk-btn qk-btn-ghost" onClick={onBack}>{ICONS.back} <span>{t("back")}</span></button>
          <div style={{ fontSize:13, color:"var(--ink-3)", whiteSpace:"nowrap" }}>{t("onbStep")} {step+1} {t("of")} {STEPS}</div>
        </div>

        <div className="qk-progress" style={{ marginBottom:24 }}><span style={{ width: `${((step+1)/STEPS)*100}%` }} /></div>

        <div className="qk-card" style={{ padding:32 }}>
          {step === 0 && (
            <div>
              <h2 className="qk-h2">{t("onbName")}</h2>
              <p className="qk-sub" style={{ marginTop:6, marginBottom:20 }}>{lang==="es" ? "Lo usaremos para saludar a tu peque." : "We'll use this to greet your child."}</p>
              <input
                className="qk-input"
                placeholder={t("onbNamePh")}
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                autoFocus
                style={{ fontFamily:"var(--font-display)", fontSize:22 }}
              />
              <div style={{ marginTop:24 }}>
                <div className="qk-label" style={{ marginBottom:10 }}>{t("chooseColor")}</div>
                <div style={{ display:"flex", gap:10 }}>
                  {[
                    ["#3F7A4F","leaf"],["#E29A2B","honey"],["#E26D5A","coral"],
                    ["#6BA8C9","sky"],["#B14F8C","berry"],["#7A5AE0","violet"]
                  ].map(([c,n]) => (
                    <button key={n} onClick={() => setDraft({ ...draft, color: c })} aria-label={n} style={{
                      width:40, height:40, borderRadius:"50%", border:"3px solid " + (draft.color === c ? "var(--ink)" : "transparent"),
                      background:c, cursor:"pointer", padding:0,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="qk-h2">{t("onbGrade")}</h2>
              <p className="qk-sub" style={{ marginTop:6, marginBottom:20 }}>{lang==="es" ? "Esto nos ayuda a ajustar las preguntas." : "This helps us tune the questions."}</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                {["K","1","2","3","4","5","6","7","8","9","10","11","12"].map(g => (
                  <button
                    key={g}
                    onClick={() => setDraft({ ...draft, grade: g })}
                    className={"qk-chip" + (draft.grade === g ? " on" : "")}
                    style={{ minWidth:54, justifyContent:"center", fontFamily:"var(--font-display)", fontSize:16 }}
                  >
                    {g === "K" ? (lang==="es" ? "Kínder" : "K") : g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="qk-h2">{t("onbAvatar")}</h2>
              <p className="qk-sub" style={{ marginTop:6, marginBottom:20 }}>{lang==="es" ? "Elige un amiguito que les represente." : "Pick a little friend to represent them."}</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14 }}>
                {AVATARS.map(a => {
                  const on = draft.avatar === a.id;
                  return (
                    <button key={a.id} onClick={() => setDraft({ ...draft, avatar: a.id })} style={{
                      appearance:"none", padding:14, borderRadius:18,
                      background: on ? "var(--primary-l)" : "var(--surface-2)",
                      border:"2px solid " + (on ? "var(--primary)" : "transparent"),
                      cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                    }} className="qk-wiggle">
                      <Avatar id={a.id} size={64} />
                      <span style={{ fontSize:12, fontWeight:700, color:"var(--ink-2)" }}>{a.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="qk-h2">{t("onbSig")}</h2>
              <p className="qk-sub" style={{ marginTop:6, marginBottom:20 }}>{t("onbSigSub")}</p>
              <Signature value={draft.signature} onChange={(v) => setDraft({ ...draft, signature: v })} />

              <div style={{ marginTop:24, padding:16, background:"var(--surface-2)", borderRadius:18, display:"flex", alignItems:"center", gap:14 }}>
                <Avatar id={draft.avatar || "sprout"} size={56} />
                <div>
                  <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:20 }}>{draft.name || (lang==="es" ? "Tu peque" : "Your kid")}</div>
                  <div style={{ fontSize:13, color:"var(--ink-3)" }}>
                    {lang==="es" ? "Grado " : "Grade "}{draft.grade || "?"}
                    {draft.color && (
                      <span style={{ display:"inline-block", verticalAlign:"middle", marginLeft:8, width:12, height:12, borderRadius:"50%", background: draft.color }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:32, gap:12 }}>
            <button className="qk-btn qk-btn-ghost" onClick={() => step === 0 ? onBack() : setStep(s => s-1)}>
              {ICONS.back} <span>{t("back")}</span>
            </button>
            {step < STEPS-1 ? (
              <Btn kind="primary" disabled={!canNext} onClick={() => setStep(s => s+1)} iconRight={ICONS.next} style={{ opacity: canNext?1:.5 }}>{t("next")}</Btn>
            ) : (
              <Btn kind="primary" onClick={() => onDone(draft)} icon={ICONS.check}>{t("finishSetup")}</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   3. Dashboard
   ============================================================= */
function DashboardScreen({ lang, kids, onCreate, onOpenKid, onAddKid, gamification }) {
  const t = useT(lang);
  const totalStars = kids.reduce((a,k)=>a + (k.stars||0), 0);
  const totalMin = kids.reduce((a,k)=>a + (k.minutes||0), 0);
  const longest = Math.max(0, ...kids.map(k => k.streak||0));

  return (
    <div className="qk-screen" data-screen-label="03 Dashboard">
      <div style={{ maxWidth: 1100, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:16 }}>
          <div>
            <span className="qk-eyebrow">{t("parent")}</span>
            <h1 className="qk-h1" style={{ marginTop:10 }}>{t("dashHi")}, Ana 👋</h1>
            <p className="qk-sub">{t("dashGreet")}</p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn kind="ghost" icon={ICONS.plus} onClick={onAddKid}>{t("addKid")}</Btn>
            <Btn kind="primary" icon={ICONS.spark} onClick={() => onCreate()}>{t("createNew")}</Btn>
          </div>
        </div>

        {/* stats */}
        {gamification !== "minimal" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14, marginTop:24 }}>
            <StatCard tone="honey"   icon={ICONS.star}  value={totalStars} label={t("starsEarned")} />
            <StatCard tone="coral"   icon={ICONS.flame} value={longest}    label={t("streak")} />
            <StatCard tone="sky"     icon={ICONS.book}  value={totalMin + " " + t("minutes")} label={t("thisWeek") + " · " + t("minStudied")} />
          </div>
        )}

        {/* kids */}
        <div style={{ marginTop:28, display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
          {kids.map(k => (
            <div key={k.id} className="qk-card" style={{ padding:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ position:"relative" }}>
                  <Avatar id={k.avatar} size={64} ring={k.color || "var(--primary)"} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:20 }}>{k.name}</div>
                  <div style={{ fontSize:13, color:"var(--ink-3)" }}>
                    {lang==="es" ? "Grado " : "Grade "}{k.grade}
                    {k.lastSubject ? " · " + k.lastSubject : ""}
                  </div>
                </div>
                {gamification !== "minimal" && (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:4, color:"var(--coral)", fontWeight:700 }}>
                      <span style={{ display:"inline-flex" }}>{ICONS.flame}</span>{k.streak||0}
                    </div>
                    <div style={{ fontSize:11, color:"var(--ink-3)" }}>{t("streak")}</div>
                  </div>
                )}
              </div>

              <div style={{ marginTop:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--ink-3)", marginBottom:6 }}>
                  <span>{lang==="es" ? "Progreso semanal" : "Weekly progress"}</span>
                  <span>{k.weekly || 0}%</span>
                </div>
                <div className="qk-progress"><span style={{ width: (k.weekly||0) + "%" }} /></div>
              </div>

              {k.recent && k.recent.length > 0 && (
                <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:8 }}>
                  {k.recent.map((r,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:"var(--surface-2)", borderRadius:12 }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:"var(--primary-l)", color:"var(--primary-d)", display:"grid", placeItems:"center" }}>
                        {r.kind === "quiz" ? ICONS.cards : r.kind === "pdf" ? ICONS.pdf : ICONS.book}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div>
                        <div style={{ fontSize:11, color:"var(--ink-3)" }}>{r.when}</div>
                      </div>
                      {gamification !== "minimal" && r.kind === "quiz" && <Stars count={r.score} of={5} size={14} />}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop:16, display:"flex", gap:8 }}>
                <Btn kind="primary" onClick={() => onOpenKid(k.id)} icon={ICONS.spark}>{t("createNew")}</Btn>
                <button className="qk-btn qk-btn-ghost" onClick={() => onOpenKid(k.id, true)}>{t("open")}</button>
              </div>
            </div>
          ))}

          {/* add-kid placeholder card */}
          <button onClick={onAddKid} className="qk-card qk-dotgrid" style={{
            display:"grid", placeItems:"center",
            border:"2px dashed var(--line)",
            background:"transparent",
            cursor:"pointer",
            padding:20, minHeight:200,
            color:"var(--ink-3)",
            fontFamily:"var(--font-display)", fontSize:16, fontWeight:500,
          }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ width:48, height:48, margin:"0 auto 10px", borderRadius:"50%", background:"var(--surface)", display:"grid", placeItems:"center", color:"var(--primary)" }}>{ICONS.plus}</div>
              {t("addKid")}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   4. Subject / grade / topic picker
   ============================================================= */
const SUBJECTS = [
  { id: "sci",  tone:"primary", icon: "🔬" },
  { id: "math", tone:"sky",     icon: "➗" },
  { id: "lang", tone:"berry",   icon: "📖" },
  { id: "soc",  tone:"honey",   icon: "🌎" },
  { id: "art",  tone:"coral",   icon: "🎨" },
];

const TOPICS_BY_SUBJECT = {
  sci: {
    en: [
      "Solar System & Planets",
      "Plants & Photosynthesis",
      "States of Matter",
      "Animals & Habitats",
      "Weather & Seasons",
      "The Water Cycle",
      "Human Body Basics",
      "Forces & Motion",
    ],
    es: [
      "Sistema solar y planetas",
      "Plantas y fotosíntesis",
      "Estados de la materia",
      "Animales y hábitats",
      "Clima y estaciones",
      "Ciclo del agua",
      "El cuerpo humano",
      "Fuerzas y movimiento",
    ]
  }
};

function PickerScreen({ lang, kid, onBack, onContinue, picked, setPicked, customSubjects, difficulty, setDifficulty }) {
  const t = useT(lang);
  const cs = customSubjects || [];
  // sync grade with kid
  React.useEffect(() => {
    if (kid && picked.grade !== kid.grade) {
      setPicked(p => ({ ...p, grade: kid.grade }));
    }
  }, [kid?.grade]);

  // If custom subject is picked, treat as no preset topics (user must use custom topic field)
  const csSelected = cs.find(s => s.id === picked.subject);
  const topics = csSelected ? [] : (TOPICS_BY_SUBJECT[picked.subject]?.[lang] || TOPICS_BY_SUBJECT.sci[lang]);
  const [custom, setCustom] = React.useState("");

  return (
    <div className="qk-screen" data-screen-label="04 Picker">
      <div style={{ maxWidth: 980, margin:"0 auto" }}>
        <button className="qk-btn qk-btn-ghost" onClick={onBack}>{ICONS.back} <span>{t("back")}</span></button>

        <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:18, flexWrap:"wrap" }}>
          {kid && <Avatar id={kid.avatar} size={56} ring={kid.color}/>}
          <div style={{ flex:1, minWidth:200 }}>
            <h1 className="qk-h1" style={{ margin:0 }}>{t("pickerTitle")}</h1>
            <p className="qk-sub" style={{ margin:"6px 0 0" }}>{t("pickerSub")}</p>
          </div>
          {kid && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              padding:"6px 12px", borderRadius:999,
              background:"var(--primary-l)", color:"var(--primary-d)",
              fontFamily:"var(--font-display)", fontWeight:600, fontSize:13,
            }}>
              {t("forGrade")} {kid.grade === "K" ? (lang==="es"?"Kínder":"K") : kid.grade}
            </div>
          )}
        </div>

        {/* subject */}
        <section style={{ marginTop:28 }}>
          <div className="qk-label" style={{ marginBottom:12, fontSize:14 }}>{t("subject")}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(170px, 1fr))", gap:12 }}>
            {SUBJECTS.map(s => {
              const on = picked.subject === s.id;
              const tone = s.tone;
              const bg = `var(--${tone === "primary" ? "primary-l" : tone+"-l"})`;
              const fg = `var(--${tone === "primary" ? "primary" : tone})`;
              return (
                <button key={s.id} onClick={() => setPicked({ ...picked, subject: s.id, topic: null })}
                  className="qk-wiggle"
                  style={{
                    appearance:"none", textAlign:"left",
                    padding:"18px 16px", borderRadius:18,
                    background: on ? bg : "var(--surface)",
                    border: "2px solid " + (on ? fg : "var(--line)"),
                    cursor:"pointer",
                    display:"flex", alignItems:"center", gap:14,
                    boxShadow: on ? "var(--shadow)" : "var(--shadow-sm)",
                  }}>
                  <div style={{
                    width:44, height:44, borderRadius:14,
                    background: bg, color: fg,
                    display:"grid", placeItems:"center",
                    fontSize:24,
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:18 }}>{t(s.id)}</div>
                    <div style={{ fontSize:12, color:"var(--ink-3)" }}>
                      {s.id === "sci" ? (lang==="es" ? "8 temas" : "8 topics") : (lang==="es" ? "próximamente" : "coming soon")}
                    </div>
                  </div>
                </button>
              );
            })}
            {/* custom subjects */}
            {cs.map(s => {
              const on = picked.subject === s.id;
              return (
                <button key={s.id} onClick={() => setPicked({ ...picked, subject: s.id, topic: null })}
                  className="qk-wiggle"
                  style={{
                    appearance:"none", textAlign:"left",
                    padding:"18px 16px", borderRadius:18,
                    background: on ? s.color + "22" : "var(--surface)",
                    border: "2px solid " + (on ? s.color : "var(--line)"),
                    cursor:"pointer",
                    display:"flex", alignItems:"center", gap:14,
                    boxShadow: on ? "var(--shadow)" : "var(--shadow-sm)",
                  }}>
                  <div style={{
                    width:44, height:44, borderRadius:14,
                    background: s.color + "22", color: s.color,
                    display:"grid", placeItems:"center",
                    fontSize:24,
                  }}>{s.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:18 }}>{s.name}</div>
                    <div style={{ fontSize:11, color: s.color, fontWeight:700, letterSpacing:".04em" }}>{lang==="es"?"PERSONAL":"CUSTOM"}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* difficulty */}
        <section style={{ marginTop:28 }}>
          <div className="qk-label" style={{ marginBottom:12, fontSize:14 }}>{t("difficulty")}</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:10, maxWidth:520 }}>
            {[
              { id:"easy",   label: t("easy"),   sub: lang==="es"?"6 tarjetas":"6 cards",  emoji:"🌱" },
              { id:"medium", label: t("medium"), sub: lang==="es"?"8 tarjetas":"8 cards",  emoji:"🌳" },
              { id:"hard",   label: t("hard"),   sub: lang==="es"?"8 + giros":"8 + twists", emoji:"⛰️" },
            ].map(d => {
              const on = difficulty === d.id;
              return (
                <button key={d.id} onClick={() => setDifficulty && setDifficulty(d.id)} style={{
                  appearance:"none", padding:"14px 12px",
                  background: on ? "var(--primary-l)" : "var(--surface)",
                  border:"2px solid " + (on ? "var(--primary)" : "var(--line)"),
                  borderRadius:16, cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                  boxShadow: on ? "var(--shadow-sm)" : "none",
                }}>
                  <span style={{ fontSize:24 }}>{d.emoji}</span>
                  <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:16 }}>{d.label}</span>
                  <span style={{ fontSize:11, color:"var(--ink-3)" }}>{d.sub}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* topic */}
        <section style={{ marginTop:28 }}>
          <div className="qk-label" style={{ marginBottom:12, fontSize:14 }}>{t("topic")}</div>
          {csSelected ? (
            <div style={{
              padding:16, borderRadius:14,
              background:"var(--surface-2)", border:"1px dashed var(--line)",
              fontSize:14, color:"var(--ink-2)",
              display:"flex", alignItems:"center", gap:10,
            }}>
              <span style={{ fontSize:22 }}>{csSelected.icon}</span>
              <span>
                {lang==="es"
                  ? `Escribe un tema para ${csSelected.name} abajo.`
                  : `Type a topic for ${csSelected.name} below.`}
              </span>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:10 }}>
              {topics.map(topic => {
                const on = picked.topic === topic;
                return (
                  <button key={topic} onClick={() => setPicked({ ...picked, topic })} style={{
                    appearance:"none", padding:"14px 14px", textAlign:"left",
                    background: on ? "var(--primary-l)" : "var(--surface)",
                    border:"1.5px solid " + (on ? "var(--primary)" : "var(--line)"),
                    borderRadius:14, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:10,
                    fontWeight: 600, fontSize:15, color:"var(--ink)",
                    boxShadow: on ? "var(--shadow-sm)" : "none",
                  }}>
                    <span style={{ flex:1 }}>{topic}</span>
                    {on && <span style={{ color:"var(--primary)" }}>{ICONS.check}</span>}
                  </button>
                );
              })}
            </div>
          )}
          {/* custom */}
          <div style={{ marginTop:16, display:"flex", gap:10 }}>
            <input
              className="qk-input"
              placeholder={t("customTopicPh")}
              value={custom}
              onChange={e => setCustom(e.target.value)}
              style={{ flex:1 }}
            />
            <Btn kind="ghost" icon={ICONS.plus} onClick={() => { if(custom.trim()){ setPicked({ ...picked, topic: custom.trim() }); setCustom(""); } }}>
              {t("customTopic")}
            </Btn>
          </div>
        </section>

        <div style={{ marginTop:36, display:"flex", justifyContent:"flex-end" }}>
          <Btn kind="primary" iconRight={ICONS.next} onClick={onContinue} disabled={!picked.subject || !picked.topic}
            style={{ opacity: (picked.subject && picked.topic) ? 1 : .5 }}>
            {t("continue")}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   5. Generate screen
   ============================================================= */
function GenerateScreen({ lang, picked, kid, onBack, onPick, difficulty }) {
  const t = useT(lang);
  const [genState, setGenState] = React.useState(null); // null | 'quiz' | 'guide' | 'pdf'
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (!genState) return;
    setProgress(0);
    let p = 0;
    const i = setInterval(() => {
      p += Math.random() * 18 + 6;
      if (p >= 100) { p = 100; clearInterval(i); setTimeout(() => onPick(genState), 380); }
      setProgress(p);
    }, 220);
    return () => clearInterval(i);
  }, [genState]);

  const subjectLabel = t(picked.subject);
  const difficultyLabel = { easy: lang==="es"?"Fácil":"Easy", medium: lang==="es"?"Medio":"Medium", hard: lang==="es"?"Difícil":"Hard" }[difficulty];

  return (
    <div className="qk-screen" data-screen-label="05 Generate">
      <div style={{ maxWidth: 980, margin:"0 auto" }}>
        <button className="qk-btn qk-btn-ghost" onClick={onBack}>{ICONS.back} <span>{t("back")}</span></button>

        <div style={{ marginTop:18, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <span className="qk-eyebrow">{subjectLabel} · {lang==="es" ? "Grado " : "Grade "}{picked.grade}</span>
            <h1 className="qk-h1" style={{ marginTop:10 }}>{picked.topic}</h1>
            <p className="qk-sub">{t("genSub")}</p>
          </div>
          {kid && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px 8px 8px", borderRadius:999, background:"var(--surface)", border:"1px solid var(--line)" }}>
              <Avatar id={kid.avatar} size={36} />
              <div>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:600 }}>{kid.name}</div>
                <div style={{ fontSize:11, color:"var(--ink-3)" }}>{lang==="es"?"Dificultad":"Difficulty"}: {difficultyLabel}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop:28, display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:18 }}>
          {[
            { id:"quiz",  title: t("genQuiz"),  sub: t("genQuizSub"),  tone:"primary", icon: ICONS.cards },
            { id:"guide", title: t("genGuide"), sub: t("genGuideSub"), tone:"sky",     icon: ICONS.book  },
            { id:"pdf",   title: t("genPdf"),   sub: t("genPdfSub"),   tone:"coral",   icon: ICONS.pdf   },
          ].map(opt => {
            const bg = `var(--${opt.tone === "primary" ? "primary-l" : opt.tone+"-l"})`;
            const fg = `var(--${opt.tone === "primary" ? "primary" : opt.tone})`;
            const loading = genState === opt.id;
            return (
              <div key={opt.id} className="qk-card" style={{ padding:22, display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{
                  height:110, borderRadius:16, background: bg, color: fg,
                  display:"grid", placeItems:"center",
                  position:"relative", overflow:"hidden",
                }}>
                  <div style={{ position:"absolute", inset:0, opacity:.15,
                    backgroundImage:"radial-gradient(currentColor 1px, transparent 1px)", backgroundSize:"14px 14px" }} />
                  <div style={{ position:"relative", transform:"scale(2.5)" }}>{opt.icon}</div>
                </div>
                <div>
                  <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:20 }}>{opt.title}</div>
                  <p style={{ margin:"4px 0 0", fontSize:14, color:"var(--ink-2)" }}>{opt.sub}</p>
                </div>
                {loading ? (
                  <div style={{ marginTop:"auto" }}>
                    <div className="qk-progress"><span style={{ width: progress + "%" }} /></div>
                    <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:6 }}>{t("generating")}</div>
                  </div>
                ) : (
                  <Btn kind="primary" onClick={() => setGenState(opt.id)} icon={ICONS.spark}>{t("generate")}</Btn>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop:24, padding:18, background:"var(--surface-2)", borderRadius:18, border:"1px dashed var(--line)", display:"flex", gap:14, alignItems:"center" }}>
          <div style={{ width:40, height:40, borderRadius:12, background:"var(--honey-l)", color:"var(--honey)", display:"grid", placeItems:"center" }}>{ICONS.spark}</div>
          <div style={{ flex:1, fontSize:14, color:"var(--ink-2)" }}>
            <strong style={{ fontFamily:"var(--font-display)", fontWeight:600, color:"var(--ink)" }}>{lang==="es"?"Consejo:":"Tip:"}</strong>{" "}
            {lang==="es"
              ? "Genera la guía primero y luego el quiz para reforzar lo aprendido."
              : "Generate the guide first, then the quiz to reinforce what they learned."}
          </div>
        </div>
      </div>
    </div>
  );
}

/* expose */

export { WelcomeScreen, OnboardingScreen, DashboardScreen, PickerScreen, GenerateScreen, SUBJECTS, TOPICS_BY_SUBJECT };
