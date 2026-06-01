import React from 'react';
import { useT, Ico, ICONS, Btn, Chip, AVATARS, Avatar, Stars, StatCard, ImgPlaceholder, useSession, formatElapsed, SessionPill, RoleSwitch, QK_PLANS, BillingToggle, PricingCard, PricingCards } from './components.jsx';


// screens-kid.jsx — Quiz (flashcards), Study Guide, Results

/* ---------- content bank (Solar System & Planets) ---------- */
const QUIZ_BANK = {
  "Solar System & Planets": {
    en: [
      { q: "How many planets are in our solar system?", choices: ["6","7","8","9"], a: 2, hint: "Pluto is now a 'dwarf planet'." },
      { q: "Which planet is closest to the Sun?", choices: ["Mercury","Venus","Earth","Mars"], a: 0, hint: "It is also the smallest." },
      { q: "Which is the largest planet?", choices: ["Saturn","Jupiter","Neptune","Earth"], a: 1, hint: "It has a giant red spot." },
      { q: "What planet do we live on?", choices: ["Mars","Venus","Earth","Saturn"], a: 2, hint: "It looks blue from space." },
      { q: "Which planet has the most famous rings?", choices: ["Uranus","Saturn","Mars","Mercury"], a: 1, hint: "They are made of ice and rock." },
      { q: "What do we call Earth's natural satellite?", choices: ["Sun","Star","Moon","Comet"], a: 2, hint: "It glows at night." },
      { q: "Which planet is known as the 'Red Planet'?", choices: ["Mercury","Venus","Mars","Jupiter"], a: 2, hint: "Rust makes it red." },
      { q: "What is the Sun?", choices: ["A planet","A star","A moon","A comet"], a: 1, hint: "It makes its own light." },
    ],
    es: [
      { q: "¿Cuántos planetas hay en nuestro sistema solar?", choices: ["6","7","8","9"], a: 2, hint: "Plutón ahora es un 'planeta enano'." },
      { q: "¿Cuál planeta está más cerca del Sol?", choices: ["Mercurio","Venus","Tierra","Marte"], a: 0, hint: "También es el más pequeño." },
      { q: "¿Cuál es el planeta más grande?", choices: ["Saturno","Júpiter","Neptuno","Tierra"], a: 1, hint: "Tiene una gran mancha roja." },
      { q: "¿En qué planeta vivimos?", choices: ["Marte","Venus","Tierra","Saturno"], a: 2, hint: "Se ve azul desde el espacio." },
      { q: "¿Qué planeta tiene los anillos más famosos?", choices: ["Urano","Saturno","Marte","Mercurio"], a: 1, hint: "Hechos de hielo y roca." },
      { q: "¿Cómo se llama el satélite natural de la Tierra?", choices: ["Sol","Estrella","Luna","Cometa"], a: 2, hint: "Brilla en la noche." },
      { q: "¿Qué planeta es conocido como el 'Planeta Rojo'?", choices: ["Mercurio","Venus","Marte","Júpiter"], a: 2, hint: "El óxido lo hace rojo." },
      { q: "¿Qué es el Sol?", choices: ["Un planeta","Una estrella","Una luna","Un cometa"], a: 1, hint: "Produce su propia luz." },
    ]
  }
};

const GUIDE_BANK = {
  "Solar System & Planets": {
    en: {
      intro: "Our solar system is a giant family. The Sun sits in the middle, and 8 planets travel around it in big circles called orbits.",
      sections: [
        { title: "The Sun is a star",  body: "The Sun is a huge ball of glowing gas. It gives us light and warmth. Without it, plants couldn't grow!", tone: "honey", key: "The Sun is a star — not a planet." },
        { title: "The 8 planets",      body: "In order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. The first four are small and rocky. The last four are big balls of gas.", tone: "primary", key: "8 planets orbit the Sun." },
        { title: "Earth is our home",  body: "Earth is the third planet from the Sun. It is the only one we know that has plants, animals, and people.", tone: "sky", key: "Earth is the only planet with life that we know of." },
        { title: "Saturn's rings",     body: "Saturn has thousands of rings made of ice and rock. Other gas planets have rings too, but Saturn's are the easiest to see.", tone: "coral", key: "Saturn's rings are made of ice and rock." },
      ],
      fact: "If you could drive a car to the Moon at highway speed, it would take you about 5 months without stopping!",
    },
    es: {
      intro: "Nuestro sistema solar es una gran familia. El Sol está en el centro y 8 planetas viajan a su alrededor en grandes círculos llamados órbitas.",
      sections: [
        { title: "El Sol es una estrella", body: "El Sol es una enorme bola de gas brillante. Nos da luz y calor. ¡Sin él las plantas no podrían crecer!", tone: "honey", key: "El Sol es una estrella, no un planeta." },
        { title: "Los 8 planetas",         body: "Desde el Sol: Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano, Neptuno. Los primeros cuatro son pequeños y rocosos. Los otros cuatro son grandes bolas de gas.", tone: "primary", key: "8 planetas orbitan al Sol." },
        { title: "La Tierra es nuestro hogar", body: "La Tierra es el tercer planeta desde el Sol. Es el único que sabemos que tiene plantas, animales y personas.", tone: "sky", key: "La Tierra es el único planeta con vida conocida." },
        { title: "Los anillos de Saturno",  body: "Saturno tiene miles de anillos de hielo y roca. Otros planetas también tienen anillos, pero los de Saturno son los más fáciles de ver.", tone: "coral", key: "Los anillos de Saturno son de hielo y roca." },
      ],
      fact: "Si pudieras manejar un carro hasta la Luna a velocidad de carretera, tardarías unos 5 meses sin parar.",
    },
  }
};

/* ---------- kid app top bar (signature bar) ---------- */
function KidBar({ lang, kid, onExit, stars, streak, gamification }) {
  const t = useT(lang);
  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"14px 22px 0",
      maxWidth:1100, margin:"0 auto", width:"100%"
    }}>
      <button onClick={onExit} className="qk-btn qk-btn-ghost" style={{ padding:"8px 12px" }}>
        {ICONS.back} <span>{t("back")}</span>
      </button>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        {gamification !== "minimal" && (
          <>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:999, background:"var(--honey-l)", color:"#7C5410", fontWeight:700 }}>
              <span style={{ display:"inline-flex", color:"var(--honey)" }}>{ICONS.star}</span> {stars}
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:999, background:"var(--coral-l)", color:"#7C2A19", fontWeight:700 }}>
              <span style={{ display:"inline-flex", color:"var(--coral)" }}>{ICONS.flame}</span> {streak}
            </div>
          </>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"4px 12px 4px 4px", borderRadius:999, background:"var(--surface)", border:"1px solid var(--line)" }}>
          <Avatar id={kid.avatar} size={32} />
          <span style={{ fontFamily:"var(--font-display)", fontWeight:600 }}>{kid.name}</span>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   Quiz — flashcard swipe
   ============================================================= */
function QuizScreen({ lang, kid, picked, onExit, onFinish, difficulty, gamification }) {
  const t = useT(lang);
  const bank = QUIZ_BANK[picked.topic]?.[lang] || QUIZ_BANK["Solar System & Planets"][lang];
  const limit = difficulty === "easy" ? 6 : difficulty === "hard" ? 8 : 8;
  const cards = bank.slice(0, limit);

  const [i, setI] = React.useState(0);
  const [picks, setPicks] = React.useState({}); // {idx: choiceIdx}
  const [flipped, setFlipped] = React.useState(false);
  const [revealed, setRevealed] = React.useState({}); // {idx: true}
  const [feedback, setFeedback] = React.useState(null); // 'correct'|'wrong'|null
  const [streak, setStreak] = React.useState(0);
  const [stars, setStars] = React.useState(0);

  const cur = cards[i];
  const userPick = picks[i];

  const check = () => {
    if (userPick == null) return;
    const correct = userPick === cur.a;
    setRevealed({ ...revealed, [i]: true });
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setStreak(s => s + 1);
      setStars(s => s + 1);
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    setFlipped(false);
    setFeedback(null);
    if (i + 1 >= cards.length) {
      const total = cards.length;
      const correct = cards.reduce((acc, c, idx) => acc + (picks[idx] === c.a ? 1 : 0), 0);
      onFinish({ total, correct, picks, cards, stars });
    } else {
      setI(i + 1);
    }
  };

  return (
    <div className="qk-screen" data-screen-label="06 Quiz" style={{ padding:0, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <KidBar lang={lang} kid={kid} onExit={onExit} stars={stars} streak={streak} gamification={gamification} />

      <div style={{ maxWidth: 720, margin:"24px auto 0", padding:"0 22px", width:"100%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, gap:12 }}>
          <div style={{ fontSize:13, color:"var(--ink-3)", fontWeight:700, whiteSpace:"nowrap" }}>{t("card")} {i+1} / {cards.length}</div>
          <div style={{ fontSize:13, color:"var(--ink-3)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{picked.topic}</div>
        </div>
        <div className="qk-progress"><span style={{ width: `${((i)/cards.length)*100}%` }} /></div>
      </div>

      <div style={{ flex:1, display:"grid", placeItems:"center", padding:"24px 22px" }}>
        <div style={{ width:"100%", maxWidth: 560, perspective: 1200 }}>
          {/* Flashcard */}
          <div
            onClick={() => setFlipped(f => !f)}
            style={{
              position:"relative",
              transformStyle:"preserve-3d",
              transition:"transform .55s cubic-bezier(.2,.7,.2,1)",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0)",
              cursor:"pointer",
              aspectRatio:"4 / 5",
              maxHeight: 520,
            }}
          >
            {/* front */}
            <div className="qk-card" style={{
              position:"absolute", inset:0, backfaceVisibility:"hidden",
              padding:24, display:"flex", flexDirection:"column", justifyContent:"space-between",
              background:"var(--surface)",
              borderColor: feedback === "correct" ? "var(--primary)" : feedback === "wrong" ? "var(--coral)" : "var(--line)",
              boxShadow: feedback ? `0 0 0 6px ${feedback === "correct" ? "var(--primary-l)" : "var(--coral-l)"}, var(--shadow)` : "var(--shadow)",
              transition:"box-shadow .25s ease, opacity .2s ease",
              opacity: flipped ? 0 : 1,
              pointerEvents: flipped ? "none" : "auto",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span className="qk-eyebrow">{lang==="es"?"Pregunta":"Question"} {i+1}</span>
                <span style={{ fontSize:11, color:"var(--ink-3)", fontFamily:"ui-monospace, monospace" }}>{t("tapToFlip")} ↻</span>
              </div>
              <div style={{ fontFamily:"var(--font-display)", fontWeight:500, fontSize:"clamp(22px, 3.4vw, 30px)", lineHeight:1.2, textWrap:"pretty" }}>
                {cur.q}
              </div>
              <div style={{ display:"grid", gap:10 }} onClick={(e) => e.stopPropagation()}>
                {cur.choices.map((c, ci) => {
                  const isPicked = userPick === ci;
                  const isAnswer = revealed[i] && ci === cur.a;
                  const isWrongPick = revealed[i] && isPicked && ci !== cur.a;
                  return (
                    <button key={ci}
                      onClick={() => !revealed[i] && setPicks({ ...picks, [i]: ci })}
                      style={{
                        appearance:"none", textAlign:"left",
                        padding:"12px 14px",
                        background: isAnswer ? "var(--primary-l)" : isWrongPick ? "var(--coral-l)" : isPicked ? "var(--surface-2)" : "var(--surface)",
                        border:"2px solid " + (isAnswer ? "var(--primary)" : isWrongPick ? "var(--coral)" : isPicked ? "var(--ink-3)" : "var(--line)"),
                        borderRadius:14, cursor: revealed[i] ? "default" : "pointer",
                        fontWeight:600, fontSize:15, color:"var(--ink)",
                        display:"flex", alignItems:"center", gap:10,
                      }}>
                      <span style={{
                        width:24, height:24, borderRadius:8,
                        background: isAnswer ? "var(--primary)" : isWrongPick ? "var(--coral)" : "var(--surface-2)",
                        color: (isAnswer || isWrongPick) ? "#fff" : "var(--ink-3)",
                        display:"grid", placeItems:"center",
                        fontFamily:"var(--font-display)", fontWeight:700, fontSize:13,
                      }}>{String.fromCharCode(65+ci)}</span>
                      <span style={{ flex:1 }}>{c}</span>
                      {isAnswer && <span style={{ color:"var(--primary)" }}>{ICONS.check}</span>}
                      {isWrongPick && <span style={{ color:"var(--coral)" }}>{ICONS.x}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* back — hint */}
            <div className="qk-card" style={{
              position:"absolute", inset:0, backfaceVisibility:"hidden", transform:"rotateY(180deg)",
              padding:24, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", gap:14,
              background:"var(--primary-l)", borderColor:"var(--primary)",
              textAlign:"center",
              transition:"opacity .2s ease",
              opacity: flipped ? 1 : 0,
              pointerEvents: flipped ? "auto" : "none",
            }}>
              <div style={{ fontFamily:"var(--font-display)", fontWeight:600, color:"var(--primary-d)", letterSpacing:".06em", textTransform:"uppercase", fontSize:13 }}>
                {lang==="es" ? "Pista" : "Hint"}
              </div>
              <div style={{ fontFamily:"var(--font-display)", fontWeight:500, fontSize:24, lineHeight:1.25, color:"var(--ink)" }}>
                {cur.hint}
              </div>
              <div style={{ fontSize:11, color:"var(--ink-3)", fontFamily:"ui-monospace, monospace" }}>{t("tapToFlip")} ↺</div>
            </div>
          </div>

          {/* Feedback line */}
          {feedback && (
            <div style={{
              marginTop:14, padding:"12px 16px", borderRadius:14,
              background: feedback === "correct" ? "var(--primary-l)" : "var(--coral-l)",
              color: feedback === "correct" ? "var(--primary-d)" : "#7C2A19",
              fontFamily:"var(--font-display)", fontWeight:600, fontSize:16,
              display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
            }}>
              <span>{feedback === "correct" ? "✨ " + t("correct") : "💭 " + t("wrong")}</span>
              {feedback === "correct" && gamification !== "minimal" && <span>+1 ⭐</span>}
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop:18, display:"flex", justifyContent:"space-between", gap:10 }}>
            <button className="qk-btn qk-btn-ghost" onClick={() => { setRevealed({...revealed, [i]: true}); setFeedback("wrong"); setStreak(0); }}
              style={{ visibility: revealed[i] ? "hidden" : "visible" }}>
              {t("skipCard")}
            </button>
            {!revealed[i] ? (
              <Btn kind="primary" disabled={userPick == null} onClick={check} icon={ICONS.check}
                style={{ opacity: userPick == null ? .5 : 1 }}>{t("checkAnswer")}</Btn>
            ) : (
              <Btn kind="primary" iconRight={ICONS.next} onClick={next}>{i + 1 >= cards.length ? (lang==="es"?"Ver resultados":"See results") : t("nextCard")}</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   Study Guide
   ============================================================= */
function StudyGuideScreen({ lang, kid, picked, onExit, onPrint, gamification }) {
  const t = useT(lang);
  const guide = GUIDE_BANK[picked.topic]?.[lang] || GUIDE_BANK["Solar System & Planets"][lang];
  const [active, setActive] = React.useState(0);

  return (
    <div className="qk-screen" data-screen-label="07 Study Guide" style={{ padding:0, minHeight:"100%" }}>
      <KidBar lang={lang} kid={kid} onExit={onExit} stars={0} streak={0} gamification={gamification} />

      <div style={{ maxWidth: 1100, margin:"24px auto 0", padding:"0 22px 64px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:14 }}>
          <div>
            <span className="qk-eyebrow">{t("sci")} · {lang==="es"?"Grado ":"Grade "}{picked.grade}</span>
            <h1 className="qk-h1" style={{ marginTop:10 }}>{picked.topic}</h1>
            <p className="qk-sub">{guide.intro}</p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn kind="ghost" icon={ICONS.speaker}>{t("listen")}</Btn>
            <Btn kind="ghost" icon={ICONS.printer} onClick={onPrint}>{t("print")}</Btn>
          </div>
        </div>

        <div style={{ marginTop:24, display:"grid", gridTemplateColumns:"260px 1fr", gap:24 }}>
          {/* TOC */}
          <aside style={{ position:"sticky", top:0, alignSelf:"flex-start" }}>
            <div className="qk-label" style={{ marginBottom:10 }}>{t("onThisPage")}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {guide.sections.map((s, idx) => (
                <button key={idx} onClick={() => setActive(idx)} style={{
                  appearance:"none", textAlign:"left",
                  padding:"10px 12px", borderRadius:12,
                  background: active === idx ? "var(--primary-l)" : "transparent",
                  border:"1.5px solid " + (active === idx ? "var(--primary)" : "transparent"),
                  cursor:"pointer", fontWeight:600, fontSize:14, color:"var(--ink-2)",
                  display:"flex", alignItems:"center", gap:10,
                }}>
                  <span style={{
                    width:24, height:24, borderRadius:8,
                    background: active === idx ? "var(--primary)" : "var(--surface-2)",
                    color: active === idx ? "#fff" : "var(--ink-3)",
                    display:"grid", placeItems:"center",
                    fontFamily:"var(--font-display)", fontSize:12, fontWeight:700,
                  }}>{idx+1}</span>
                  {s.title}
                </button>
              ))}
            </div>

            <div style={{ marginTop:18, padding:14, background:"var(--honey-l)", borderRadius:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#7C5410", textTransform:"uppercase", letterSpacing:".06em" }}>{t("didYouKnow")}</div>
              <div style={{ marginTop:6, fontSize:14, color:"var(--ink)", textWrap:"pretty" }}>{guide.fact}</div>
            </div>
          </aside>

          {/* content */}
          <article style={{ display:"flex", flexDirection:"column", gap:18 }}>
            {guide.sections.map((s, idx) => {
              const toneBg = `var(--${s.tone === "primary" ? "primary-l" : s.tone+"-l"})`;
              const toneFg = `var(--${s.tone === "primary" ? "primary" : s.tone})`;
              return (
                <section key={idx} className="qk-card" style={{ padding:24, scrollMarginTop:20 }}
                  onMouseEnter={() => setActive(idx)}>
                  <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                    <div style={{
                      width:44, height:44, flexShrink:0, borderRadius:14,
                      background: toneBg, color: toneFg,
                      display:"grid", placeItems:"center",
                      fontFamily:"var(--font-display)", fontWeight:700, fontSize:18,
                    }}>{idx+1}</div>
                    <div style={{ flex:1 }}>
                      <h2 className="qk-h2">{s.title}</h2>
                      <p style={{ marginTop:10, fontSize:17, lineHeight:1.55, color:"var(--ink)", textWrap:"pretty" }}>
                        {s.body}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop:18, display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:14 }}>
                    <ImgPlaceholder label={`[ ${lang==="es"?"ilustración":"illustration"}: ${s.title.toLowerCase()} ]`} h={150} tone={s.tone} />
                    <div style={{
                      padding:16, borderRadius:14,
                      background: toneBg,
                      borderLeft: `4px solid ${toneFg}`,
                    }}>
                      <div style={{ fontSize:11, fontWeight:700, color: toneFg, textTransform:"uppercase", letterSpacing:".06em" }}>{t("keyIdea")}</div>
                      <div style={{ marginTop:6, fontFamily:"var(--font-display)", fontWeight:500, fontSize:18, lineHeight:1.3, color:"var(--ink)" }}>{s.key}</div>
                    </div>
                  </div>
                </section>
              );
            })}

            {/* Try it */}
            <section className="qk-card" style={{ padding:24, background:"var(--primary-l)", borderColor:"var(--primary)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:56, height:56, borderRadius:18, background:"var(--primary)", color:"#fff", display:"grid", placeItems:"center" }}>{ICONS.spark}</div>
                <div style={{ flex:1 }}>
                  <h2 className="qk-h2">{t("tryIt")}</h2>
                  <p style={{ margin:"4px 0 0", fontSize:15, color:"var(--ink-2)" }}>
                    {lang==="es" ? "Pon a prueba lo que aprendiste con un quiz de 8 tarjetas." : "Test what you just learned with an 8-card quiz."}
                  </p>
                </div>
                <Btn kind="primary" icon={ICONS.cards} onClick={() => onExit("quiz")}>{t("genQuiz")}</Btn>
              </div>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   Results
   ============================================================= */
function ResultsScreen({ lang, kid, picked, result, onAgain, onHome, gamification }) {
  const t = useT(lang);
  const { total, correct, cards, picks, stars } = result;
  const pct = Math.round((correct / total) * 100);
  const goldStars = pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;

  return (
    <div className="qk-screen" data-screen-label="08 Results" style={{ padding:0, minHeight:"100%" }}>
      <KidBar lang={lang} kid={kid} onExit={onHome} stars={stars} streak={correct} gamification={gamification} />
      <div style={{ maxWidth: 820, margin:"24px auto 0", padding:"0 22px 64px" }}>
        <div className="qk-card" style={{ padding:32, position:"relative", overflow:"hidden" }}>
          {/* confetti dots */}
          <div aria-hidden style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:.5 }}>
            {[...Array(18)].map((_,i) => (
              <span key={i} style={{
                position:"absolute",
                left: `${(i*53)%100}%`,
                top: `${(i*37)%80}%`,
                width: 8 + (i%3)*3, height: 8 + (i%3)*3,
                borderRadius: i%2 ? "50%" : "4px",
                background: ["var(--primary)","var(--honey)","var(--coral)","var(--sky)","var(--berry)"][i%5],
                transform: `rotate(${i*23}deg)`, opacity:.6
              }} />
            ))}
          </div>

          <div style={{ position:"relative", textAlign:"center" }}>
            <div style={{ display:"inline-block", position:"relative" }}>
              <Avatar id={kid.avatar} size={120} ring={kid.color || "var(--primary)"} />
              <div className="qk-sticker" style={{ position:"absolute", right:-18, top:-10, fontSize:14 }}>+{stars} ⭐</div>
            </div>
            <h1 className="qk-h1" style={{ marginTop:14 }}>{t("resultsTitle")}</h1>
            <p className="qk-sub" style={{ margin:"6px auto 0", textAlign:"center" }}>{t("resultsSub")}</p>

            {gamification !== "minimal" && (
              <div style={{ marginTop:18, display:"inline-flex", gap:6 }}>
                {Array.from({length:5}).map((_,i) => (
                  <span key={i} style={{
                    color: i < goldStars ? "var(--honey)" : "rgba(31,51,38,.12)",
                    display:"inline-flex",
                    transform: `translateY(${i < goldStars ? "0px" : "4px"})`,
                    transition:`transform .3s ease ${i*60}ms`,
                  }}>
                    <Ico d={<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />} fill="currentColor" stroke="none" size={36} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop:24, display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:14, position:"relative" }}>
            <StatCard tone="primary" icon={ICONS.check} value={`${correct}/${total}`} label={t("correctCt")} />
            <StatCard tone="honey"   icon={ICONS.star}  value={pct + "%"} label={t("accuracy")} />
            <StatCard tone="coral"   icon={ICONS.flame} value={correct}    label={t("streakNow")} />
          </div>

          {gamification !== "minimal" && pct >= 60 && (
            <div style={{ marginTop:18, padding:16, background:"var(--honey-l)", borderRadius:18, display:"flex", gap:14, alignItems:"center", position:"relative" }}>
              <div style={{ width:48, height:48, borderRadius:14, background:"var(--honey)", color:"#fff", display:"grid", placeItems:"center" }}>{ICONS.star}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:18 }}>{t("rewardEarned")}</div>
                <div style={{ fontSize:13, color:"var(--ink-2)" }}>
                  {lang==="es" ? "“Explorador del cosmos” — desbloqueada al estudiar el Sistema Solar." : "“Cosmos explorer” — unlocked for studying the Solar System."}
                </div>
              </div>
            </div>
          )}

          {/* review */}
          <div style={{ marginTop:24 }}>
            <div className="qk-label" style={{ marginBottom:10 }}>{t("review")}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {cards.map((c, idx) => {
                const right = picks[idx] === c.a;
                return (
                  <div key={idx} style={{
                    display:"flex", gap:12, alignItems:"flex-start",
                    padding:"10px 12px",
                    background:"var(--surface-2)", borderRadius:12,
                  }}>
                    <div style={{
                      width:28, height:28, borderRadius:8, flexShrink:0,
                      background: right ? "var(--primary)" : "var(--coral)", color:"#fff",
                      display:"grid", placeItems:"center",
                    }}>{right ? ICONS.check : ICONS.x}</div>
                    <div style={{ flex:1, fontSize:14 }}>
                      <div style={{ fontWeight:700 }}>{c.q}</div>
                      <div style={{ marginTop:2, color:"var(--ink-3)", fontSize:13 }}>
                        {lang==="es"?"Respuesta:":"Answer:"} <strong style={{ color:"var(--ink-2)" }}>{c.choices[c.a]}</strong>
                        {!right && picks[idx] != null && (
                          <> · {lang==="es"?"Elegiste":"You chose"}: <span style={{ color:"var(--coral)" }}>{c.choices[picks[idx]]}</span></>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop:24, display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", position:"relative" }}>
            <Btn kind="ghost" icon={ICONS.shuffle} onClick={onAgain}>{t("again")}</Btn>
            <Btn kind="primary" onClick={onHome}>{t("backHome")}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   PDF preview (lightweight)
   ============================================================= */
function PdfPreviewScreen({ lang, kid, picked, onBack }) {
  const t = useT(lang);
  const bank = QUIZ_BANK[picked.topic]?.[lang] || QUIZ_BANK["Solar System & Planets"][lang];
  return (
    <div className="qk-screen" data-screen-label="07b PDF Preview">
      <div style={{ maxWidth: 900, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <button className="qk-btn qk-btn-ghost" onClick={onBack}>{ICONS.back} <span>{t("back")}</span></button>
          <Btn kind="primary" icon={ICONS.printer} onClick={() => window.print()}>{t("print")}</Btn>
        </div>

        {/* paper */}
        <div style={{
          background:"#fff", color:"#1F3326",
          borderRadius:8,
          boxShadow:"var(--shadow-lg)",
          padding:"56px 60px",
          maxWidth:780,
          margin:"0 auto",
          fontFamily:"\"Patrick Hand\", \"Quicksand\", sans-serif",
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", borderBottom:"2px dashed #1F3326", paddingBottom:12, gap:18 }}>
            <div style={{ minWidth:0, flex:"1 1 auto" }}>
              <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:26, lineHeight:1.1 }}>{picked.topic}</div>
              <div style={{ fontSize:14, marginTop:6 }}>{t("sci")} · {lang==="es"?"Grado ":"Grade "}{picked.grade}</div>
            </div>
            <div style={{ textAlign:"right", fontSize:13, flex:"0 0 auto" }}>
              <div>{lang==="es"?"Nombre:":"Name:"} <span style={{ display:"inline-block", borderBottom:"1.5px solid #1F3326", minWidth:120, marginLeft:4 }}>{kid?.name || ""}</span></div>
              <div style={{ marginTop:6 }}>{lang==="es"?"Fecha:":"Date:"} <span style={{ display:"inline-block", borderBottom:"1.5px solid #1F3326", minWidth:120, marginLeft:4 }} /></div>
            </div>
          </div>

          <ol style={{ marginTop:20, padding:0, listStyle:"none", display:"flex", flexDirection:"column", gap:14 }}>
            {bank.slice(0,6).map((c, idx) => (
              <li key={idx}>
                <div style={{ fontWeight:700, fontSize:17 }}>{idx+1}. {c.q}</div>
                <div style={{ marginTop:6, display:"grid", gridTemplateColumns:"1fr 1fr", columnGap:18, rowGap:6, fontSize:15 }}>
                  {c.choices.map((ch, ci) => (
                    <div key={ci} style={{ display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}>
                      <span style={{ width:18, height:18, border:"1.5px solid #1F3326", borderRadius:4, display:"inline-block", flexShrink:0 }} />
                      <span>{String.fromCharCode(65+ci)}. {ch}</span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <div style={{ marginTop:24, padding:14, border:"1.5px dashed #1F3326", borderRadius:8, fontSize:14 }}>
            ⭐ {lang==="es" ? "Bonus: dibuja tu planeta favorito y escribe 2 cosas que aprendiste." : "Bonus: draw your favorite planet and write 2 things you learned."}
          </div>

          <div style={{ marginTop:24, fontSize:11, color:"#5b6e60", textAlign:"center", fontFamily:"ui-monospace, monospace" }}>
            QuizKids · Generated for {kid?.name || "—"} · {new Date().toLocaleDateString(lang === "es" ? "es" : "en")}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   Kid Home — kid's landing inside their session
   ============================================================= */
function KidHomeScreen({ lang, kid, kids, onPickKid, onOpen, onSwitchParent, session, onStart, onTogglePause, onEnd }) {
  const t = useT(lang);
  const recent = kid?.recent || [];

  return (
    <div className="qk-screen" data-screen-label="03b Kid Home" style={{ padding:"32px clamp(20px, 5vw, 56px) 64px" }}>
      <div style={{ maxWidth: 980, margin:"0 auto" }}>
        {/* who's here? — kid picker if multiple */}
        {kids.length > 1 && (
          <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
            {kids.map(k => (
              <button key={k.id} onClick={() => onPickKid(k.id)}
                className="qk-chip" style={{
                  padding: kid?.id === k.id ? "5px 14px 5px 5px" : "5px 12px 5px 5px",
                  gap:8,
                  background: kid?.id === k.id ? "var(--ink)" : "var(--surface)",
                  color: kid?.id === k.id ? "var(--surface)" : "var(--ink-2)",
                  border:"1.5px solid " + (kid?.id === k.id ? "var(--ink)" : "var(--line)"),
                }}>
                <Avatar id={k.avatar} size={28} />
                <span>{k.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* greeting card */}
        <div className="qk-card" style={{
          padding:"28px clamp(20px, 4vw, 36px)",
          display:"grid", gridTemplateColumns:"auto 1fr auto", gap:24, alignItems:"center",
          background:"linear-gradient(135deg, var(--primary-l) 0%, var(--honey-l) 100%)",
          borderColor:"var(--primary)",
          position:"relative", overflow:"hidden",
        }} className="qk-home-grid">
          <div aria-hidden style={{ position:"absolute", inset:0, opacity:.16,
            backgroundImage:"radial-gradient(var(--primary) 1.5px, transparent 1.5px)", backgroundSize:"22px 22px" }} />
          <div style={{ position:"relative" }}>
            <Avatar id={kid.avatar} size={104} ring={kid.color || "var(--primary)"} />
            {session.running && (
              <span style={{
                position:"absolute", right:-4, top:-4,
                padding:"3px 8px", borderRadius:999,
                background: session.paused ? "var(--honey)" : "var(--primary)",
                color:"#fff", fontSize:10, fontWeight:700, letterSpacing:".04em",
                boxShadow:"var(--shadow-sm)",
              }}>{session.paused ? "PAUSE" : "LIVE"}</span>
            )}
          </div>
          <div style={{ minWidth:0, position:"relative" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:14, fontWeight:600, color:"var(--primary-d)", letterSpacing:".04em", textTransform:"uppercase" }}>
              {t("kidHomeHi")}, {kid.name}! 👋
            </div>
            <h1 className="qk-h1" style={{ marginTop:6, fontSize:"clamp(26px, 3vw, 38px)" }}>{t("kidHomeReady")}</h1>
            <div style={{ marginTop:14, display:"flex", gap:18, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em" }}>{t("today")}</div>
                <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:22, lineHeight:1.1, fontVariantNumeric:"tabular-nums" }}>
                  {formatElapsed(session.elapsedMs)}
                </div>
                <div style={{ fontSize:11, color:"var(--ink-3)" }}>{t("todayStudied")}</div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em" }}>{t("streak")}</div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, fontFamily:"var(--font-display)", fontWeight:600, fontSize:22, lineHeight:1.1, color:"var(--coral)" }}>
                  <span style={{ display:"inline-flex" }}>{React.cloneElement(ICONS.flame, { size: 20 })}</span>
                  <span>{kid.streak || 0}</span>
                </div>
                <div style={{ fontSize:11, color:"var(--ink-3)" }}>{lang==="es"?"días seguidos":"days"}</div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:".06em" }}>{t("starsEarned")}</div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:6, fontFamily:"var(--font-display)", fontWeight:600, fontSize:22, lineHeight:1.1, color:"#7C5410" }}>
                  <span style={{ display:"inline-flex", color:"var(--honey)" }}>{React.cloneElement(ICONS.star, { size: 20 })}</span>
                  <span>{kid.stars || 0}</span>
                </div>
                <div style={{ fontSize:11, color:"var(--ink-3)" }}>{lang==="es"?"estrellas":"stars"}</div>
              </div>
            </div>
          </div>
          <div style={{ position:"relative", display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
            <SessionPill lang={lang} session={session} onStart={onStart} onTogglePause={onTogglePause} onEnd={onEnd} />
            <button onClick={onSwitchParent} style={{
              appearance:"none", border:0, background:"transparent",
              fontSize:12, color:"var(--ink-3)", textDecoration:"underline", cursor:"pointer",
            }}>{t("switchToParent")}</button>
          </div>
        </div>

        {/* recent / pick up */}
        <section style={{ marginTop:36 }}>
          <h2 className="qk-h2">{recent.length ? t("kidHomeRecent") : t("kidHomePick")}</h2>
          <div style={{ marginTop:16, display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:14 }}>
            {recent.length > 0 ? recent.map((r, idx) => {
              const tone = r.kind === "quiz" ? "primary" : r.kind === "guide" ? "sky" : "coral";
              const bg = `var(--${tone === "primary" ? "primary-l" : tone+"-l"})`;
              const fg = `var(--${tone === "primary" ? "primary" : tone})`;
              return (
                <button key={idx} onClick={() => onOpen(r)} className="qk-card qk-wiggle" style={{
                  appearance:"none", textAlign:"left", padding:0, overflow:"hidden",
                  display:"flex", flexDirection:"column", cursor:"pointer",
                  border:"1px solid var(--line)",
                }}>
                  <div style={{ height:96, background: bg, color: fg, display:"grid", placeItems:"center", position:"relative" }}>
                    <div style={{ position:"absolute", inset:0, opacity:.18, backgroundImage:"radial-gradient(currentColor 1px, transparent 1px)", backgroundSize:"12px 12px" }} />
                    <div style={{ position:"relative", transform:"scale(2)" }}>
                      {r.kind === "quiz" ? ICONS.cards : r.kind === "guide" ? ICONS.book : ICONS.pdf}
                    </div>
                  </div>
                  <div style={{ padding:16 }}>
                    <div style={{ fontSize:12, color:"var(--ink-3)", fontWeight:700, textTransform:"uppercase", letterSpacing:".04em" }}>
                      {r.kind === "quiz" ? t("genQuiz") : r.kind === "guide" ? t("genGuide") : t("genPdf")}
                    </div>
                    <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:18, marginTop:4 }}>{r.title}</div>
                    <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:6 }}>{r.when}</div>
                  </div>
                </button>
              );
            }) : (
              <div className="qk-card" style={{ padding:24, textAlign:"center", color:"var(--ink-3)", gridColumn:"1 / -1" }}>
                <div style={{ fontFamily:"var(--font-display)", fontSize:18 }}>{t("kidHomeNothing")}</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export { KidBar, QuizScreen, StudyGuideScreen, ResultsScreen, PdfPreviewScreen, KidHomeScreen };
