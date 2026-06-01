import React from 'react';
import { useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider, TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton } from './tweaks-panel.jsx';
export { useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider, TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton };

// components.jsx — shared atoms for QuizKids

/* ----------------------------- i18n ----------------------------- */
const QK_STRINGS = {
  en: {
    appName: "QuizKids",
    tagline: "Learn together",
    parent: "Parent",
    kid: "Kid",
    parentLong: "Mom & Dad",
    kidLong: "Student",
    switchToKid: "Hand off to kid",
    switchToParent: "Back to parent",
    back: "Back",
    next: "Next",
    skip: "Skip",
    save: "Save",
    cancel: "Cancel",
    continue: "Continue",
    start: "Let's go!",

    // session timer
    startSession: "Start session",
    endSession: "End session",
    pauseSession: "Pause",
    resumeSession: "Resume",
    sessionRunning: "Studying",
    sessionPaused: "Paused",
    sessionSaved: "Session saved",
    sessionAddedMin: "min added",

    // kid home
    kidHomeHi: "Hi",
    kidHomeReady: "Ready to learn something?",
    kidHomePick: "Pick what to study",
    kidHomeRecent: "Pick up where you left off",
    kidHomeNothing: "Ask a grown-up to pick a topic for you.",
    today: "Today",
    todayStudied: "studied today",

    // welcome
    welcomeTitle: "A cozy place to study.",
    welcomeSub: "Make a profile for your child, pick what they're learning, and we'll cook up quizzes and study guides — bilingual, K-12.",
    addKid: "Add a kid",
    seeDemo: "See a demo",

    // landing — sections
    navHow: "How it works",
    navWhat: "What you get",
    navSubjects: "Subjects",
    navParents: "For parents",
    navSignIn: "Sign in",

    heroBadge: "Bilingual · K-12 · Made with care",
    heroStat1: "K-12",
    heroStat1Lbl: "all grades",
    heroStat2: "2",
    heroStat2Lbl: "languages",
    heroStat3: "3-in-1",
    heroStat3Lbl: "quiz · guide · PDF",

    howTitle: "How it works",
    howSub: "Three small steps, and you're studying together.",
    how1Title: "Make their profile",
    how1Body: "Add their name, grade, and pick an avatar. They draw a signature so they know it's their space.",
    how2Title: "Pick what to study",
    how2Body: "Choose a subject and a topic from our library — or type your own. We'll handle the questions.",
    how3Title: "Learn, quiz, repeat",
    how3Body: "Flashcards with hints, friendly study guides, and printable worksheets — all from the same topic.",

    whatTitle: "Three ways to learn the same idea",
    whatSub: "Pick the format that fits the moment.",
    whatQuiz: "Flashcard quiz",
    whatQuizSub: "Tap-to-flip cards with instant feedback, gentle hints, and a sticker at the end.",
    whatGuide: "Study guide",
    whatGuideSub: "A calm, illustrated explainer with key ideas highlighted and a 'did you know?' fact.",
    whatPdf: "Printable PDF",
    whatPdfSub: "A clean worksheet to print and bring to class, complete with name + date lines.",

    subjectsTitle: "Built for every grade",
    subjectsSub: "From counting bees in Kindergarten to balancing equations in 12th. Same warm vibe, harder questions.",
    subjectK2: "K-2 · Big shapes, big feelings, sight words.",
    subject35: "3-5 · The solar system, fractions, ecosystems.",
    subject68: "6-8 · Cells, pre-algebra, ancient civilizations.",
    subject912: "9-12 · Chemistry, geometry, world history.",

    parentsTitle: "Made with parents in mind",
    parents1: "Bilingual EN ↔ ES",
    parents1Sub: "Toggle anytime. Great for dual-language households and bilingual classrooms.",
    parents2: "No ads, no chat",
    parents2Sub: "Just study material. Kids can't browse to anywhere else.",
    parents3: "You stay in control",
    parents3Sub: "You set the topic, difficulty, and what they can generate. Their signature unlocks their space.",
    parents4: "Light gamification",
    parents4Sub: "Stars and streaks to reward effort — not engagement traps.",

    ctaTitle: "Ready to make studying feel a little cozier?",
    ctaSub: "It takes about a minute to set up your first kid.",
    ctaPrimary: "Add a kid",
    ctaSecondary: "Browse the demo",

    footerTagline: "A cozy place to study.",
    footerProduct: "Product",
    footerCompany: "Company",
    footerHelp: "Help",
    footerLegal: "Legal",
    footerCopy: "© 2026 QuizKids · Made with care",

    // onboarding
    onbTitle: "Let's set up your child",
    onbStep: "Step",
    of: "of",
    onbName: "What's their name?",
    onbNamePh: "e.g. Mateo",
    onbGrade: "Current grade",
    onbAvatar: "Pick an avatar",
    onbSig: "Sign your name",
    onbSigSub: "Trace it with your finger — this is how you'll know it's really you next time.",
    clear: "Clear",
    chooseColor: "Favorite color",
    finishSetup: "Finish setup",

    // dashboard
    dashHi: "Hi",
    dashGreet: "Here's how the kids are doing.",
    streak: "day streak",
    starsEarned: "stars earned",
    minStudied: "min studied",
    thisWeek: "this week",
    recent: "Recent activity",
    createNew: "Create new study",
    open: "Open",

    // picker
    pickerTitle: "What are we studying?",
    pickerSub: "Pick a subject and topic. We'll build the rest.",
    subject: "Subject",
    grade: "Grade",
    topic: "Topic",
    customTopic: "Add your own topic",
    customTopicPh: "e.g. Volcanoes & earthquakes",

    // generate
    genTitle: "What should we make?",
    genSub: "All three use the same content — pick one or pick all.",
    genQuiz: "Interactive quiz",
    genQuizSub: "Swipe flashcards with instant feedback. 8 cards.",
    genGuide: "Study guide",
    genGuideSub: "Friendly explainers with examples and pictures.",
    genPdf: "Printable PDF",
    genPdfSub: "Worksheet to print and bring to class.",
    generate: "Generate",
    generating: "Generating…",

    // quiz
    card: "Card",
    correct: "Nice!",
    wrong: "Almost!",
    skipCard: "I'm not sure",
    checkAnswer: "Check",
    nextCard: "Next card",
    tapToFlip: "Tap card to flip",

    // study guide
    onThisPage: "On this page",
    print: "Print",
    listen: "Listen",
    keyIdea: "Key idea",
    tryIt: "Try it",
    didYouKnow: "Did you know?",

    // results
    resultsTitle: "You did it!",
    resultsSub: "Here's how that round went.",
    correctCt: "correct",
    accuracy: "accuracy",
    streakNow: "streak",
    review: "Review answers",
    again: "Try again",
    backHome: "Back to home",
    rewardEarned: "You earned a sticker!",

    // subjects
    sci: "Science", math: "Math", lang: "Language Arts", soc: "Social Studies", art: "Art",
    // grades
    gradeK: "Kindergarten",
    // misc
    minutes: "min", questions: "questions",

    // auth
    authSignInTitle: "Welcome back",
    authSignInSub: "Sign in to keep their streak going.",
    authSignUpTitle: "Make a free account",
    authSignUpSub: "Setting up takes about a minute. No card needed.",
    tabSignIn: "Sign in",
    tabSignUp: "Create account",
    fieldName: "Your name",
    fieldNamePh: "Ana Martinez",
    fieldEmail: "Email",
    fieldEmailPh: "you@home.com",
    fieldPassword: "Password",
    fieldPasswordPh: "At least 8 characters",
    rememberMe: "Keep me signed in",
    forgotPw: "Forgot?",
    signInBtn: "Sign in",
    signUpBtn: "Create account",
    orContinue: "or continue with",
    continueGoogle: "Continue with Google",
    continueApple: "Continue with Apple",
    noAccount: "New to QuizKids?",
    hasAccount: "Already have an account?",
    createOne: "Create an account",
    signInLink: "Sign in",
    agreeTerms: "I agree to the Terms and Privacy Policy.",
    pwStrengthWeak: "weak",
    pwStrengthOk: "okay",
    pwStrengthGood: "strong",

    // value props on auth left rail
    vp1: "Bilingual EN ↔ ES",
    vp2: "K-12, all subjects",
    vp3: "No ads, no chat",
    socialProof: "Loved by 4,200+ families",

    // parent onboarding
    pobStep: "Step",
    pobTitle1: "Hi, let's set you up",
    pobSub1: "Just a couple of questions so we can tailor things.",
    pobYouAre: "I'm a…",
    roleMom: "Mom",
    roleDad: "Dad",
    roleGuardian: "Guardian",
    roleTeacher: "Teacher",
    roleOther: "Other",
    pobPhoto: "Profile photo (optional)",
    pobPhotoUpload: "Upload",
    pobPhotoSkip: "Skip for now",

    pobTitle2: "Your family",
    pobSub2: "We'll use this to set up the right number of profiles.",
    pobKidsCount: "How many kids?",
    pobLangs: "Languages spoken at home",
    pobWhere: "Where do you study?",
    whereHome: "At home",
    whereOnGo: "On the go",
    whereClass: "In class",

    pobTitle3: "Goals & vibe",
    pobSub3: "Pick what feels right — you can change these anytime.",
    pobGoal: "Weekly study goal",
    pobReminders: "Daily reminder",
    pobReminderTime: "Around",
    pobReminderOff: "No reminders",

    pobFinishTitle: "All set!",
    pobFinishSub: "Now let's add your first kid.",
    pobAddFirst: "Add my first kid",
    pobLater: "I'll do it later",

    // profile picker
    whoTitle: "Who's learning today?",
    whoSub: "Pick a profile to keep going.",
    manageProfiles: "Manage profiles",
    addProfile: "Add profile",
    parentProfile: "Parent",
    useKidCode: "Use a kid code instead",
    forgotPin: "Forgot PIN?",

    // PIN entry
    pinTitle: "Enter parent PIN",
    pinSub: "So little hands don't change settings.",
    pinWrong: "That's not it — try again.",
    pinSetup: "Set up your PIN",
    pinSetupSub: "Pick a 4-digit PIN for parent-only screens.",
    pinConfirm: "Confirm PIN",
    pinSaved: "PIN saved!",

    // kid code
    kidCodeTitle: "Enter your kid code",
    kidCodeSub: "Your grown-up gave you a 6-letter code.",
    kidCodePh: "ABC123",
    kidCodeBtn: "Let me in!",
    kidCodeBad: "Hmm, that code didn't work.",

    signOut: "Sign out",
    switchProfile: "Switch profile",

    // settings
    settings: "Settings",
    settingsAccount: "Account",
    settingsKids: "Kid profiles",
    settingsSecurity: "Security",
    settingsPrefs: "Preferences",
    settingsDanger: "Danger zone",
    fieldFullName: "Full name",
    changeEmail: "Change email",
    changePassword: "Change password",
    changePin: "Change parent PIN",
    pinCurrent: "Current PIN",
    pinNew: "New PIN",
    addAnotherKid: "Add another kid",
    editKid: "Edit kid",
    deleteKid: "Remove this kid",
    deleteKidWarn: "This removes their progress and stickers. Are you sure?",
    saveChanges: "Save changes",
    saved: "Saved!",
    kidCode: "Kid code",
    regenerate: "New code",
    weeklyGoal: "Weekly study goal",
    notifications: "Daily reminders",
    appLanguage: "App language",
    soundEffects: "Sound effects",
    parentalControls: "Parental controls",
    requirePinFor: "Require PIN for",
    pinForSettings: "Settings",
    pinForCreate: "Creating studies",
    pinForExit: "Exiting kid mode",
    settingsHi: "Hi, ",

    // custom subject
    customSubject: "Custom subject",
    addCustomSubject: "Add custom subject",
    customSubjectPh: "e.g. Robotics, Coding, Spelling…",
    customSubjectColor: "Pick a color",
    customSubjectIcon: "Pick an icon",

    // picker (updated — remove grade)
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    cardCount: "How many cards?",
    forGrade: "For grade",

    // pricing
    pricingEyebrow: "Pricing",
    pricingTitle: "Simple, family-friendly pricing",
    pricingSub: "Try it free, forever. Upgrade when you outgrow the limits.",
    billingMonthly: "Monthly",
    billingYearly: "Yearly",
    saveBadge: "Save 20%",
    perMonth: "/month",
    perYear: "/year",
    billedYearly: "Billed yearly · $96",
    billedMonthly: "Billed monthly",

    planFree: "Free",
    planFreePitch: "Everything you need to get started.",
    planFreeFeat1: "Up to 3 subjects",
    planFreeFeat2: "1 active study per subject",
    planFreeFeat3: "Bilingual EN ↔ ES",
    planFreeFeat4: "Unlimited kid profiles",
    planFreeCta: "Start free",
    planFreeStay: "Stay on Free",

    planFamily: "Family",
    planFamilyPitch: "For families that learn together.",
    planFamilyFeat1: "Unlimited subjects",
    planFamilyFeat2: "Unlimited active studies",
    planFamilyFeat3: "Printable PDF packs",
    planFamilyFeat4: "Priority new-content",
    planFamilyCta: "Start 14-day trial",
    planFamilyUpgrade: "Upgrade to Family",
    planFamilyCurrent: "Your plan",
    popular: "Most popular",
    freeTrial: "14-day free trial · cancel anytime",

    // onboarding plan step
    pobPlanTitle: "Pick a plan",
    pobPlanSub: "You can switch any time in Settings.",
    pobPlanSelected: "Selected",

    // settings billing
    settingsBilling: "Plan & billing",
    yourPlan: "Your plan",
    currentPlan: "Current plan",
    renews: "Renews",
    nextBilling: "Next billing",
    paymentMethod: "Payment method",
    addCard: "Add card",
    cancelPlan: "Cancel plan",
    upgrade: "Upgrade",
    downgrade: "Downgrade",
    switchToYearly: "Switch to yearly · save 20%",
    switchToMonthly: "Switch to monthly",
  },
  es: {
    appName: "QuizKids",
    tagline: "Aprender juntos",
    parent: "Mamá / Papá",
    kid: "Peque",
    parentLong: "Mamá y Papá",
    kidLong: "Estudiante",
    switchToKid: "Pasar al peque",
    switchToParent: "Volver al adulto",
    back: "Atrás",
    next: "Siguiente",
    skip: "Saltar",
    save: "Guardar",
    cancel: "Cancelar",
    continue: "Continuar",
    start: "¡A jugar!",

    startSession: "Iniciar sesión",
    endSession: "Terminar",
    pauseSession: "Pausar",
    resumeSession: "Reanudar",
    sessionRunning: "Estudiando",
    sessionPaused: "En pausa",
    sessionSaved: "Sesión guardada",
    sessionAddedMin: "min agregados",

    kidHomeHi: "Hola",
    kidHomeReady: "¿Listo para aprender algo?",
    kidHomePick: "Elige qué estudiar",
    kidHomeRecent: "Continuar donde lo dejaste",
    kidHomeNothing: "Pídele a un adulto que elija un tema.",
    today: "Hoy",
    todayStudied: "estudiado hoy",

    welcomeTitle: "Un rinconcito para estudiar.",
    welcomeSub: "Crea un perfil para tu peque, elige lo que está aprendiendo y armamos quizzes y guías — bilingüe, de K a 12º.",
    addKid: "Agregar peque",
    seeDemo: "Ver demo",

    navHow: "Cómo funciona",
    navWhat: "Qué incluye",
    navSubjects: "Materias",
    navParents: "Para familias",
    navSignIn: "Entrar",

    heroBadge: "Bilingüe · K-12 · Con cariño",
    heroStat1: "K-12",
    heroStat1Lbl: "todos los grados",
    heroStat2: "2",
    heroStat2Lbl: "idiomas",
    heroStat3: "3 en 1",
    heroStat3Lbl: "quiz · guía · PDF",

    howTitle: "Cómo funciona",
    howSub: "Tres pasitos y a estudiar juntos.",
    how1Title: "Crea su perfil",
    how1Body: "Agrega nombre, grado y elige un avatar. Tu peque firma para que sepa que es su espacio.",
    how2Title: "Elige el tema",
    how2Body: "Elige una materia y un tema de nuestra biblioteca — o escribe el tuyo. Nosotros hacemos las preguntas.",
    how3Title: "Aprender, repasar, repetir",
    how3Body: "Tarjetas con pistas, guías de estudio suaves y hojas para imprimir — todo del mismo tema.",

    whatTitle: "Tres formas de aprender lo mismo",
    whatSub: "Elige el formato que mejor encaja con el momento.",
    whatQuiz: "Quiz de tarjetas",
    whatQuizSub: "Tarjetas para girar con retroalimentación al instante, pistas amables y una calcomanía al final.",
    whatGuide: "Guía de estudio",
    whatGuideSub: "Un explicador tranquilo, ilustrado, con ideas clave resaltadas y un dato curioso.",
    whatPdf: "PDF imprimible",
    whatPdfSub: "Una hoja limpia para imprimir y llevar a clase, con espacios de nombre y fecha.",

    subjectsTitle: "Hecho para cada grado",
    subjectsSub: "Desde contar abejas en Kínder hasta ecuaciones en 12º. Misma vibra cálida, preguntas más difíciles.",
    subjectK2: "K-2 · Figuras grandes, emociones grandes, palabras de uso.",
    subject35: "3-5 · El sistema solar, fracciones, ecosistemas.",
    subject68: "6-8 · Células, pre-álgebra, civilizaciones antiguas.",
    subject912: "9-12 · Química, geometría, historia universal.",

    parentsTitle: "Pensado para las familias",
    parents1: "Bilingüe EN ↔ ES",
    parents1Sub: "Cambia cuando quieras. Ideal para hogares y aulas bilingües.",
    parents2: "Sin anuncios ni chat",
    parents2Sub: "Solo material de estudio. Tu peque no puede ir a otro lado.",
    parents3: "Tú tienes el control",
    parents3Sub: "Tú eliges el tema, la dificultad y qué pueden generar. Su firma desbloquea su espacio.",
    parents4: "Gamificación suave",
    parents4Sub: "Estrellas y rachas para premiar el esfuerzo — no para enganchar.",

    ctaTitle: "¿Listos para que estudiar se sienta más cálido?",
    ctaSub: "Toma un minutito crear el primer perfil.",
    ctaPrimary: "Agregar peque",
    ctaSecondary: "Ver el demo",

    footerTagline: "Un rinconcito para estudiar.",
    footerProduct: "Producto",
    footerCompany: "Compañía",
    footerHelp: "Ayuda",
    footerLegal: "Legal",
    footerCopy: "© 2026 QuizKids · Hecho con cariño",

    onbTitle: "Vamos a crear el perfil",
    onbStep: "Paso",
    of: "de",
    onbName: "¿Cómo se llama?",
    onbNamePh: "ej. Mateo",
    onbGrade: "Grado actual",
    onbAvatar: "Elige un avatar",
    onbSig: "Firma con tu nombre",
    onbSigSub: "Tracé con el dedo — así sabremos que eres tú la próxima vez.",
    clear: "Borrar",
    chooseColor: "Color favorito",
    finishSetup: "Listo",

    dashHi: "Hola",
    dashGreet: "Mira cómo van tus peques.",
    streak: "días seguidos",
    starsEarned: "estrellas ganadas",
    minStudied: "min de estudio",
    thisWeek: "esta semana",
    recent: "Actividad reciente",
    createNew: "Nuevo estudio",
    open: "Abrir",

    pickerTitle: "¿Qué vamos a estudiar?",
    pickerSub: "Elige materia y tema. Nosotros hacemos el resto.",
    subject: "Materia",
    grade: "Grado",
    topic: "Tema",
    customTopic: "Agregar tu propio tema",
    customTopicPh: "ej. Volcanes y terremotos",

    genTitle: "¿Qué creamos?",
    genSub: "Los tres usan el mismo contenido — elige uno o todos.",
    genQuiz: "Quiz interactivo",
    genQuizSub: "Tarjetas con respuesta al instante. 8 tarjetas.",
    genGuide: "Guía de estudio",
    genGuideSub: "Explicaciones amigables con ejemplos y dibujos.",
    genPdf: "PDF para imprimir",
    genPdfSub: "Hoja para imprimir y llevar a clase.",
    generate: "Generar",
    generating: "Generando…",

    card: "Tarjeta",
    correct: "¡Bien!",
    wrong: "¡Casi!",
    skipCard: "No estoy seguro",
    checkAnswer: "Revisar",
    nextCard: "Siguiente",
    tapToFlip: "Toca para girar",

    onThisPage: "En esta página",
    print: "Imprimir",
    listen: "Escuchar",
    keyIdea: "Idea clave",
    tryIt: "Inténtalo",
    didYouKnow: "¿Sabías que…?",

    resultsTitle: "¡Lo lograste!",
    resultsSub: "Así te fue esta ronda.",
    correctCt: "correctas",
    accuracy: "precisión",
    streakNow: "racha",
    review: "Revisar respuestas",
    again: "Otra vez",
    backHome: "Volver al inicio",
    rewardEarned: "¡Ganaste una calcomanía!",

    sci: "Ciencia", math: "Matemáticas", lang: "Lenguaje", soc: "Sociales", art: "Arte",
    gradeK: "Kínder",
    minutes: "min", questions: "preguntas",

    authSignInTitle: "Bienvenido de nuevo",
    authSignInSub: "Inicia sesión para mantener la racha.",
    authSignUpTitle: "Crea una cuenta gratis",
    authSignUpSub: "Toma un minutito. Sin tarjeta de crédito.",
    tabSignIn: "Entrar",
    tabSignUp: "Crear cuenta",
    fieldName: "Tu nombre",
    fieldNamePh: "Ana Martínez",
    fieldEmail: "Email",
    fieldEmailPh: "tu@casa.com",
    fieldPassword: "Contraseña",
    fieldPasswordPh: "Al menos 8 caracteres",
    rememberMe: "Mantenerme en sesión",
    forgotPw: "¿Olvidaste?",
    signInBtn: "Entrar",
    signUpBtn: "Crear cuenta",
    orContinue: "o continuar con",
    continueGoogle: "Continuar con Google",
    continueApple: "Continuar con Apple",
    noAccount: "¿Nuevo en QuizKids?",
    hasAccount: "¿Ya tienes cuenta?",
    createOne: "Crear cuenta",
    signInLink: "Entrar",
    agreeTerms: "Acepto los Términos y la Política de Privacidad.",
    pwStrengthWeak: "débil",
    pwStrengthOk: "ok",
    pwStrengthGood: "fuerte",

    vp1: "Bilingüe EN ↔ ES",
    vp2: "K-12, todas las materias",
    vp3: "Sin anuncios ni chat",
    socialProof: "Querido por más de 4.200 familias",

    pobStep: "Paso",
    pobTitle1: "Hola, vamos a empezar",
    pobSub1: "Solo un par de preguntas para personalizarlo.",
    pobYouAre: "Soy…",
    roleMom: "Mamá",
    roleDad: "Papá",
    roleGuardian: "Tutor/a",
    roleTeacher: "Maestro/a",
    roleOther: "Otro",
    pobPhoto: "Foto de perfil (opcional)",
    pobPhotoUpload: "Subir",
    pobPhotoSkip: "Saltar",

    pobTitle2: "Tu familia",
    pobSub2: "Lo usamos para crear el número correcto de perfiles.",
    pobKidsCount: "¿Cuántos peques?",
    pobLangs: "Idiomas en casa",
    pobWhere: "¿Dónde estudian?",
    whereHome: "En casa",
    whereOnGo: "De camino",
    whereClass: "En clase",

    pobTitle3: "Metas y vibra",
    pobSub3: "Elige lo que se sienta bien — puedes cambiarlo cuando quieras.",
    pobGoal: "Meta semanal de estudio",
    pobReminders: "Recordatorio diario",
    pobReminderTime: "A las",
    pobReminderOff: "Sin recordatorios",

    pobFinishTitle: "¡Todo listo!",
    pobFinishSub: "Ahora vamos a agregar al primer peque.",
    pobAddFirst: "Agregar mi peque",
    pobLater: "Lo haré después",

    whoTitle: "¿Quién va a estudiar hoy?",
    whoSub: "Elige un perfil para continuar.",
    manageProfiles: "Administrar perfiles",
    addProfile: "Agregar perfil",
    parentProfile: "Adulto",
    useKidCode: "Usar código de peque",
    forgotPin: "¿Olvidaste el PIN?",

    pinTitle: "Ingresa el PIN de adulto",
    pinSub: "Para que las manitas no cambien las cosas.",
    pinWrong: "No es ese — intenta de nuevo.",
    pinSetup: "Crea tu PIN",
    pinSetupSub: "Elige 4 dígitos para las pantallas de adultos.",
    pinConfirm: "Confirma el PIN",
    pinSaved: "¡PIN guardado!",

    kidCodeTitle: "Ingresa tu código de peque",
    kidCodeSub: "Tu adulto te dio un código de 6 letras.",
    kidCodePh: "ABC123",
    kidCodeBtn: "¡Déjame entrar!",
    kidCodeBad: "Mmm, ese código no funcionó.",

    signOut: "Salir",
    switchProfile: "Cambiar perfil",

    settings: "Ajustes",
    settingsAccount: "Cuenta",
    settingsKids: "Perfiles de peques",
    settingsSecurity: "Seguridad",
    settingsPrefs: "Preferencias",
    settingsDanger: "Zona de peligro",
    fieldFullName: "Nombre completo",
    changeEmail: "Cambiar email",
    changePassword: "Cambiar contraseña",
    changePin: "Cambiar PIN de adulto",
    pinCurrent: "PIN actual",
    pinNew: "Nuevo PIN",
    addAnotherKid: "Agregar otro peque",
    editKid: "Editar peque",
    deleteKid: "Eliminar este peque",
    deleteKidWarn: "Esto borra su progreso y calcomanías. ¿Seguro?",
    saveChanges: "Guardar",
    saved: "¡Guardado!",
    kidCode: "Código de peque",
    regenerate: "Nuevo código",
    weeklyGoal: "Meta semanal",
    notifications: "Recordatorios",
    appLanguage: "Idioma de la app",
    soundEffects: "Efectos de sonido",
    parentalControls: "Controles parentales",
    requirePinFor: "Pedir PIN para",
    pinForSettings: "Ajustes",
    pinForCreate: "Crear estudios",
    pinForExit: "Salir del modo peque",
    settingsHi: "Hola, ",

    customSubject: "Materia personalizada",
    addCustomSubject: "Agregar materia",
    customSubjectPh: "ej. Robótica, Programación, Ortografía…",
    customSubjectColor: "Elige un color",
    customSubjectIcon: "Elige un ícono",

    difficulty: "Dificultad",
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    cardCount: "¿Cuántas tarjetas?",
    forGrade: "Para grado",

    pricingEyebrow: "Precios",
    pricingTitle: "Precios simples y familiares",
    pricingSub: "Pruébalo gratis para siempre. Mejora cuando crezcas.",
    billingMonthly: "Mensual",
    billingYearly: "Anual",
    saveBadge: "Ahorra 20%",
    perMonth: "/mes",
    perYear: "/año",
    billedYearly: "Cobro anual · $96",
    billedMonthly: "Cobro mensual",

    planFree: "Gratis",
    planFreePitch: "Todo lo necesario para empezar.",
    planFreeFeat1: "Hasta 3 materias",
    planFreeFeat2: "1 estudio activo por materia",
    planFreeFeat3: "Bilingüe EN ↔ ES",
    planFreeFeat4: "Perfiles de peque ilimitados",
    planFreeCta: "Empezar gratis",
    planFreeStay: "Quedarse en Gratis",

    planFamily: "Familia",
    planFamilyPitch: "Para familias que aprenden juntas.",
    planFamilyFeat1: "Materias ilimitadas",
    planFamilyFeat2: "Estudios activos ilimitados",
    planFamilyFeat3: "Paquetes PDF imprimibles",
    planFamilyFeat4: "Contenido nuevo prioritario",
    planFamilyCta: "Probar 14 días gratis",
    planFamilyUpgrade: "Mejorar a Familia",
    planFamilyCurrent: "Tu plan",
    popular: "Más popular",
    freeTrial: "14 días gratis · cancela cuando quieras",

    pobPlanTitle: "Elige un plan",
    pobPlanSub: "Puedes cambiarlo cuando quieras en Ajustes.",
    pobPlanSelected: "Seleccionado",

    settingsBilling: "Plan y facturación",
    yourPlan: "Tu plan",
    currentPlan: "Plan actual",
    renews: "Renueva",
    nextBilling: "Próximo cobro",
    paymentMethod: "Método de pago",
    addCard: "Agregar tarjeta",
    cancelPlan: "Cancelar plan",
    upgrade: "Mejorar",
    downgrade: "Bajar plan",
    switchToYearly: "Cambiar a anual · ahorra 20%",
    switchToMonthly: "Cambiar a mensual",
  }
};

function useT(lang) {
  return React.useMemo(() => (k) => (QK_STRINGS[lang] && QK_STRINGS[lang][k]) || QK_STRINGS.en[k] || k, [lang]);
}

/* ----------------------------- icons (line) ----------------------------- */
const Ico = ({ d, size=20, stroke=1.8, fill="none", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>{d}</svg>
);
const ICONS = {
  back:  <Ico d={<path d="M15 18l-6-6 6-6" />} />,
  next:  <Ico d={<path d="M9 18l6-6-6-6" />} />,
  plus:  <Ico d={<path d="M12 5v14M5 12h14" />} />,
  check: <Ico d={<path d="M5 12l5 5L20 7" />} />,
  x:     <Ico d={<path d="M6 6l12 12M18 6L6 18" />} />,
  star:  <Ico d={<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />} fill="currentColor" stroke="none" />,
  spark: <Ico d={<g><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></g>} />,
  flame: <Ico d={<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-6 0 2-2 3-2 3s-1-3-1-6c-3 2-6 5-6 9 0 4 3 7 5 7z"/>} />,
  book:  <Ico d={<path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2V5zM4 17h14"/>} />,
  cards: <Ico d={<g><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 6V4a1 1 0 011-1h12a1 1 0 011 1v14"/></g>} />,
  pdf:   <Ico d={<g><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/></g>} />,
  pencil:<Ico d={<g><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4z"/></g>} />,
  speaker:<Ico d={<g><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/></g>} />,
  printer:<Ico d={<g><path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 14H4a2 2 0 01-2-2V11a2 2 0 012-2h16a2 2 0 012 2v1a2 2 0 01-2 2h-2"/></g>} />,
  trash: <Ico d={<g><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></g>} />,
  shuffle:<Ico d={<g><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></g>} />,
  leaf:  <Ico d={<g><path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z"/><path d="M11 6v14"/></g>} />,
};

/* ----------------------------- buttons + chips ----------------------------- */
function Btn({ kind="primary", icon, iconRight, children, ...rest }) {
  const cls = "qk-btn " + (kind === "primary" ? "qk-btn-primary" : kind === "ghost" ? "qk-btn-ghost" : "qk-btn-soft");
  return (
    <button className={cls} {...rest}>
      {icon}
      <span>{children}</span>
      {iconRight}
    </button>
  );
}

function Chip({ on, onClick, children }) {
  return (
    <button className={"qk-chip" + (on ? " on" : "")} onClick={onClick}>{children}</button>
  );
}

/* ----------------------------- avatars ----------------------------- */
// Simple round face avatars — colored bg, two-dot eyes, smile arc, small accessory.
const AVATARS = [
  { id: "sprout",   bg: "#A7D7A8", accent: "#3F7A4F", acc: "leaf",     name: "Sprout"   },
  { id: "acorn",    bg: "#E6C089", accent: "#7C4A20", acc: "cap",      name: "Acorn"    },
  { id: "bee",      bg: "#F4D24A", accent: "#3E2B0E", acc: "stripes",  name: "Bee"      },
  { id: "fox",      bg: "#E89066", accent: "#7E2E13", acc: "fox",      name: "Fox"      },
  { id: "bear",     bg: "#C99775", accent: "#4A2C1B", acc: "bear",     name: "Bear"     },
  { id: "owl",      bg: "#9FB8C7", accent: "#2E4654", acc: "owl",      name: "Owl"      },
  { id: "frog",     bg: "#9BCB66", accent: "#3D6B2E", acc: "frog",     name: "Frog"     },
  { id: "mush",     bg: "#E07A8A", accent: "#FFFFFF", acc: "dots",     name: "Mushroom" },
];

function Avatar({ id="sprout", size=72, ring }) {
  const a = AVATARS.find(x => x.id === id) || AVATARS[0];
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display:"block", overflow:"visible" }}>
      {ring && <circle cx="50" cy="50" r="49" fill="none" stroke={ring} strokeWidth="3" />}
      <circle cx="50" cy="50" r="44" fill={a.bg} />
      {/* accessory layer */}
      {a.acc === "leaf" && <path d="M50 5 q-6 8 -2 16 q6 -4 4 -16 z" fill={a.accent} />}
      {a.acc === "cap"  && <path d="M22 38 q28 -22 56 0 q-2 6 -28 6 q-26 0 -28 -6 z" fill={a.accent} />}
      {a.acc === "stripes" && (
        <g fill={a.accent} opacity=".85">
          <rect x="20" y="56" width="60" height="6" rx="3" />
          <rect x="22" y="68" width="56" height="6" rx="3" />
        </g>
      )}
      {a.acc === "fox" && (
        <g fill={a.accent}>
          <path d="M22 22 l8 18 -16 -4 z" />
          <path d="M78 22 l-8 18 16 -4 z" />
          <path d="M30 64 q20 14 40 0 q-6 14 -20 14 q-14 0 -20 -14 z" fill="#FFFFFF" opacity=".5" />
        </g>
      )}
      {a.acc === "bear" && (
        <g fill={a.accent}>
          <circle cx="24" cy="24" r="9" />
          <circle cx="76" cy="24" r="9" />
        </g>
      )}
      {a.acc === "owl" && (
        <g>
          <circle cx="36" cy="48" r="14" fill="#FFFDF7" />
          <circle cx="64" cy="48" r="14" fill="#FFFDF7" />
          <circle cx="36" cy="48" r="6" fill={a.accent} />
          <circle cx="64" cy="48" r="6" fill={a.accent} />
          <path d="M44 60 l6 6 6 -6 z" fill="#E29A2B" />
        </g>
      )}
      {a.acc === "frog" && (
        <g>
          <circle cx="32" cy="30" r="10" fill={a.bg} />
          <circle cx="68" cy="30" r="10" fill={a.bg} />
          <circle cx="32" cy="30" r="5" fill="#FFFDF7" />
          <circle cx="68" cy="30" r="5" fill="#FFFDF7" />
          <circle cx="32" cy="30" r="2.5" fill={a.accent} />
          <circle cx="68" cy="30" r="2.5" fill={a.accent} />
        </g>
      )}
      {a.acc === "dots" && (
        <g fill={a.accent}>
          <circle cx="34" cy="36" r="5" />
          <circle cx="66" cy="38" r="6" />
          <circle cx="44" cy="22" r="3.5" />
        </g>
      )}
      {/* eyes (except owl/frog which have their own) */}
      {!["owl","frog"].includes(a.acc) && (
        <g fill="#1F3326">
          <circle cx="38" cy="52" r="3.6" />
          <circle cx="62" cy="52" r="3.6" />
        </g>
      )}
      {/* smile */}
      <path d="M40 66 q10 8 20 0" fill="none" stroke="#1F3326" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ----------------------------- stars / streaks ----------------------------- */
function Stars({ count=3, of=5, size=18 }) {
  return (
    <span style={{ display:"inline-flex", gap:2, color:"var(--honey)" }}>
      {Array.from({length:of}).map((_,i) => (
        <span key={i} style={{ color: i < count ? "var(--honey)" : "rgba(31,51,38,.15)", display:"inline-flex" }}>
          <Ico d={<path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />} fill="currentColor" stroke="none" size={size} />
        </span>
      ))}
    </span>
  );
}

function StatCard({ icon, value, label, tone="primary" }) {
  const toneColor = {
    primary: "var(--primary)",
    honey:   "var(--honey)",
    coral:   "var(--coral)",
    sky:     "var(--sky)",
    berry:   "var(--berry)",
  }[tone];
  const toneBg = {
    primary: "var(--primary-l)",
    honey:   "var(--honey-l)",
    coral:   "var(--coral-l)",
    sky:     "var(--sky-l)",
    berry:   "var(--berry-l)",
  }[tone];
  return (
    <div className="qk-card" style={{ padding:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:44, height:44, borderRadius:14, background: toneBg, color: toneColor, display:"grid", placeItems:"center" }}>{icon}</div>
        <div>
          <div style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:24, lineHeight:1 }}>{value}</div>
          <div style={{ fontSize:13, color:"var(--ink-3)", marginTop:4 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- placeholder image ----------------------------- */
function ImgPlaceholder({ label, h=160, tone="primary" }) {
  const stripeColor = {
    primary: "rgba(63,122,79,.18)",
    honey:   "rgba(226,154,43,.22)",
    coral:   "rgba(226,109,90,.22)",
    sky:     "rgba(107,168,201,.22)",
  }[tone] || "rgba(63,122,79,.18)";
  return (
    <div style={{
      height: h,
      borderRadius: 18,
      border: "1.5px dashed var(--line)",
      background: `repeating-linear-gradient(135deg, ${stripeColor} 0 10px, transparent 10px 24px), var(--surface-2)`,
      display:"grid", placeItems:"center",
      color:"var(--ink-3)",
      fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize:12, letterSpacing:".04em",
    }}>
      {label}
    </div>
  );
}

/* ----------------------------- session timer hook ----------------------------- */
// useSession returns { running, paused, elapsedMs, start, pause, resume, end }
// State machine: idle → running → paused/running → ended (emits onEnd with minutes)
function useSession(onEnd) {
  const [state, setState] = React.useState({ running:false, paused:false, startedAt:null, accumulated:0 });
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    if (!state.running || state.paused) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [state.running, state.paused]);

  const elapsedMs = state.accumulated + (state.running && !state.paused && state.startedAt ? now - state.startedAt : 0);

  const start = () => setState({ running:true, paused:false, startedAt: Date.now(), accumulated:0 });
  const pause = () => setState(s => s.running && !s.paused ? { ...s, paused:true, accumulated: s.accumulated + (Date.now() - s.startedAt), startedAt:null } : s);
  const resume = () => setState(s => s.paused ? { ...s, paused:false, startedAt: Date.now() } : s);
  const end = () => {
    const total = elapsedMs;
    const minutes = Math.max(0, Math.round(total / 60000));
    setState({ running:false, paused:false, startedAt:null, accumulated:0 });
    onEnd && onEnd(minutes);
    return minutes;
  };

  return { running: state.running, paused: state.paused, elapsedMs, start, pause, resume, end };
}

function formatElapsed(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = (m % 60).toString().padStart(2,"0");
    return `${h}:${mm}:${s.toString().padStart(2,"0")}`;
  }
  return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

/* ----------------------------- session pill (chrome) ----------------------------- */
function SessionPill({ lang, session, onStart, onTogglePause, onEnd, compact=false }) {
  const t = useT(lang);
  if (!session.running) {
    return (
      <button onClick={onStart} className="qk-btn qk-btn-primary" style={{ padding:"7px 14px 7px 12px", fontSize:13, gap:6, whiteSpace:"nowrap" }}>
        <span style={{ display:"inline-flex" }}>{React.cloneElement(ICONS.flame, { size: 14 })}</span>
        <span>{t("startSession")}</span>
      </button>
    );
  }
  return (
    <div style={{
      display:"inline-flex", alignItems:"stretch",
      borderRadius: 999, overflow:"hidden",
      border:"1px solid var(--line)",
      background: session.paused ? "var(--surface-2)" : "var(--surface)",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{
        display:"inline-flex", alignItems:"center", gap:8,
        padding:"6px 12px",
        background: session.paused ? "var(--honey-l)" : "var(--primary-l)",
        color: session.paused ? "#7C5410" : "var(--primary-d)",
      }}>
        <span style={{
          width:8, height:8, borderRadius:"50%",
          background: session.paused ? "var(--honey)" : "var(--primary)",
          animation: session.paused ? "none" : "qk-pulse 1.4s ease-in-out infinite",
        }} />
        <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:13, letterSpacing:".01em" }}>
          {session.paused ? t("sessionPaused") : t("sessionRunning")}
        </span>
        <span style={{ fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight:700, fontSize:13, fontVariantNumeric:"tabular-nums" }}>
          {formatElapsed(session.elapsedMs)}
        </span>
      </div>
      {!compact && (
        <button onClick={onTogglePause} title={session.paused ? t("resumeSession") : t("pauseSession")} style={{
          appearance:"none", border:0, padding:"0 12px",
          background: "transparent", color:"var(--ink-2)", cursor:"pointer",
          borderLeft:"1px solid var(--line)",
        }}>
          {session.paused
            ? <Ico d={<path d="M5 3l14 9-14 9V3z" />} fill="currentColor" stroke="none" size={14} />
            : <Ico d={<g><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></g>} fill="currentColor" stroke="none" size={14} />
          }
        </button>
      )}
      <button onClick={onEnd} title={t("endSession")} style={{
        appearance:"none", border:0, padding:"0 12px",
        background:"transparent", color:"var(--coral)", cursor:"pointer",
        borderLeft:"1px solid var(--line)",
      }}>
        <Ico d={<rect x="6" y="6" width="12" height="12" />} fill="currentColor" stroke="none" size={12} />
      </button>
    </div>
  );
}

/* ----------------------------- role switcher (chrome) ----------------------------- */
function RoleSwitch({ lang, mode, kid, onSwitch }) {
  const t = useT(lang);
  return (
    <div style={{
      display:"inline-flex", padding:3,
      background:"var(--surface)",
      border:"1px solid var(--line)",
      borderRadius:999,
      gap:2,
      fontSize:13, fontWeight:700,
    }}>
      <button
        onClick={() => onSwitch("parent")}
        title={t("switchToParent")}
        style={{
          appearance:"none", border:0,
          background: mode === "parent" ? "var(--ink)" : "transparent",
          color: mode === "parent" ? "var(--surface)" : "var(--ink-2)",
          padding:"5px 12px 5px 10px",
          borderRadius:999, cursor:"pointer",
          display:"inline-flex", alignItems:"center", gap:6,
        }}>
        <Ico d={<g><circle cx="12" cy="8" r="4"/><path d="M4 22c0-4 4-6 8-6s8 2 8 6"/></g>} size={13} />
        <span>{t("parent")}</span>
      </button>
      <button
        onClick={() => onSwitch("kid")}
        title={t("switchToKid")}
        style={{
          appearance:"none", border:0,
          background: mode === "kid" ? "var(--ink)" : "transparent",
          color: mode === "kid" ? "var(--surface)" : "var(--ink-2)",
          padding:"3px 10px 3px 4px",
          borderRadius:999, cursor:"pointer",
          display:"inline-flex", alignItems:"center", gap:6,
        }}>
        {kid ? <Avatar id={kid.avatar} size={22} /> : <span style={{ width:22, height:22, borderRadius:"50%", background:"var(--honey-l)" }} />}
        <span>{t("kid")}</span>
      </button>
    </div>
  );
}

/* ----------------------------- pricing ----------------------------- */
// Plan data — keep in one place so cards / picker / settings agree.
const QK_PLANS = {
  free: {
    id: "free",
    nameKey: "planFree",
    pitchKey: "planFreePitch",
    price: { monthly: 0, yearly: 0 },
    features: ["planFreeFeat1","planFreeFeat2","planFreeFeat3","planFreeFeat4"],
    tone: "neutral",
  },
  family: {
    id: "family",
    nameKey: "planFamily",
    pitchKey: "planFamilyPitch",
    price: { monthly: 10, yearly: 96 },
    features: ["planFamilyFeat1","planFamilyFeat2","planFamilyFeat3","planFamilyFeat4"],
    tone: "primary",
    badge: "popular",
  },
};

function BillingToggle({ lang, value, onChange }) {
  const t = useT(lang);
  return (
    <div style={{
      display:"inline-flex", padding:4,
      background:"var(--surface)",
      border:"1px solid var(--line)",
      borderRadius:14,
      gap:2,
      position:"relative",
    }}>
      {["monthly","yearly"].map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          appearance:"none", border:0,
          padding:"8px 16px",
          borderRadius:10,
          background: value === opt ? "var(--ink)" : "transparent",
          color: value === opt ? "var(--surface)" : "var(--ink-2)",
          fontFamily:"var(--font-display)", fontWeight:600, fontSize:13,
          cursor:"pointer",
          display:"inline-flex", alignItems:"center", gap:6,
        }}>
          {opt === "monthly" ? t("billingMonthly") : t("billingYearly")}
          {opt === "yearly" && (
            <span style={{
              padding:"2px 7px", borderRadius:999,
              background: value === "yearly" ? "var(--honey)" : "var(--honey-l)",
              color: value === "yearly" ? "#fff" : "#7C5410",
              fontSize:10, fontWeight:700, letterSpacing:".04em",
            }}>{t("saveBadge")}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function PricingCard({ lang, plan, cycle, selected, current, onSelect, compact=false }) {
  const t = useT(lang);
  const isFamily = plan.id === "family";
  const price = plan.price[cycle];
  const isPopular = plan.badge === "popular";

  return (
    <div style={{
      position:"relative",
      borderRadius:24,
      padding: compact ? 20 : "28px 26px",
      background: isFamily
        ? "linear-gradient(160deg, var(--primary-l) 0%, var(--surface) 80%)"
        : "var(--surface)",
      border: "2px solid " + (selected ? "var(--primary)" : isFamily ? "var(--primary)" : "var(--line)"),
      boxShadow: isFamily ? "var(--shadow-lg)" : "var(--shadow-sm)",
      display:"flex", flexDirection:"column", gap:18,
      transform: selected ? "translateY(-2px)" : "none",
      transition:"transform .15s ease",
    }}>
      {isPopular && (
        <div className="qk-sticker" style={{
          position:"absolute", top:-14, right:18,
          background:"var(--honey)", fontSize:12,
          padding:"4px 12px",
          boxShadow:"var(--shadow-sm)",
        }}>★ {t("popular")}</div>
      )}
      {current && (
        <div style={{
          position:"absolute", top:-12, left:18,
          padding:"4px 12px", borderRadius:999,
          background:"var(--ink)", color:"var(--surface)",
          fontFamily:"var(--font-display)", fontWeight:600, fontSize:11,
          letterSpacing:".04em",
          boxShadow:"var(--shadow-sm)",
        }}>{t("planFamilyCurrent").toUpperCase()}</div>
      )}

      <div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:40, height:40, borderRadius:12,
            background: isFamily ? "var(--primary)" : "var(--surface-2)",
            color: isFamily ? "#fff" : "var(--ink-3)",
            display:"grid", placeItems:"center",
          }}>
            {isFamily ? (
              <Ico d={<g><path d="M11 20A7 7 0 014 13V6h7a7 7 0 010 14z"/></g>} size={18} stroke={2} />
            ) : (
              <Ico d={<g><circle cx="12" cy="12" r="9"/></g>} size={18} />
            )}
          </div>
          <h3 style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize: compact ? 20 : 24, margin:0 }}>
            {t(plan.nameKey)}
          </h3>
        </div>
        <p style={{ margin:"10px 0 0", color:"var(--ink-2)", fontSize:14, lineHeight:1.5 }}>{t(plan.pitchKey)}</p>
      </div>

      <div>
        {price === 0 ? (
          <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
            <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize: compact ? 36 : 48, lineHeight:1, letterSpacing:"-.02em" }}>$0</span>
            <span style={{ color:"var(--ink-3)", fontSize:14 }}>{lang==="es"?"para siempre":"forever"}</span>
          </div>
        ) : (
          <div>
            <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
              <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize: compact ? 36 : 48, lineHeight:1, letterSpacing:"-.02em" }}>
                ${cycle === "yearly" ? 8 : price}
              </span>
              <span style={{ color:"var(--ink-3)", fontSize:14 }}>{t("perMonth")}</span>
            </div>
            <div style={{ marginTop:4, fontSize:12, color:"var(--ink-3)" }}>
              {cycle === "yearly" ? t("billedYearly") : t("billedMonthly")}
            </div>
          </div>
        )}
      </div>

      <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10 }}>
        {plan.features.map(f => (
          <li key={f} style={{ display:"flex", alignItems:"flex-start", gap:10, fontSize:14, lineHeight:1.4, color:"var(--ink)" }}>
            <span style={{
              flexShrink:0, width:22, height:22, borderRadius:8,
              background: isFamily ? "var(--primary)" : "var(--primary-l)",
              color: isFamily ? "#fff" : "var(--primary)",
              display:"grid", placeItems:"center", marginTop:1,
            }}>
              <Ico d={<path d="M5 12l5 5L20 7" />} size={13} stroke={2.4} />
            </span>
            <span>{t(f)}</span>
          </li>
        ))}
      </ul>

      <div style={{ marginTop:"auto" }}>
        {current ? (
          <button disabled style={{
            width:"100%",
            appearance:"none", border:"1.5px solid var(--line)",
            background:"var(--surface-2)", color:"var(--ink-3)",
            padding:"12px 16px", borderRadius:14,
            fontFamily:"var(--font-display)", fontWeight:600, fontSize:15,
            cursor:"default",
          }}>{t("currentPlan")}</button>
        ) : (
          <button onClick={() => onSelect && onSelect(plan.id)} style={{
            width:"100%",
            appearance:"none", border:0,
            background: isFamily ? "var(--primary)" : "var(--surface)",
            color: isFamily ? "#fff" : "var(--ink)",
            border: isFamily ? "0" : "1.5px solid var(--line)",
            padding:"12px 16px", borderRadius:14,
            fontFamily:"var(--font-display)", fontWeight:600, fontSize:15,
            cursor:"pointer",
            boxShadow: isFamily ? "0 3px 0 var(--primary-d)" : "none",
          }}>
            {isFamily ? t("planFamilyCta") : t("planFreeCta")}
          </button>
        )}
        {isFamily && !current && (
          <div style={{ marginTop:8, fontSize:11, color:"var(--ink-3)", textAlign:"center" }}>
            {t("freeTrial")}
          </div>
        )}
      </div>
    </div>
  );
}

function PricingCards({ lang, cycle, setCycle, currentPlanId, onSelect, compact=false }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
        <BillingToggle lang={lang} value={cycle} onChange={setCycle} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, maxWidth: 760, margin:"0 auto" }} className="qk-pricing-grid">
        <PricingCard lang={lang} plan={QK_PLANS.free}   cycle={cycle} current={currentPlanId === "free"}   onSelect={onSelect} compact={compact} />
        <PricingCard lang={lang} plan={QK_PLANS.family} cycle={cycle} current={currentPlanId === "family"} onSelect={onSelect} compact={compact} />
      </div>
      <style>{`
        @media (max-width: 720px) {
          .qk-pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ----------------------------- expose globals ----------------------------- */

export { QK_PLANS, BillingToggle, PricingCard, PricingCards, QK_STRINGS, useT, Ico, ICONS, Btn, Chip, AVATARS, Avatar, Stars, StatCard, ImgPlaceholder, useSession, formatElapsed, SessionPill, RoleSwitch };
