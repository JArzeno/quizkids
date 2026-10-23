import type { Locale } from '@/lib/site';

export interface LegalDoc { metaTitle: string; metaDescription: string; title: string; updated: string; intro: string; sections: { title: string; body: string[] }[] }

/** Plain-language policies describing how the app works today. Have them reviewed before launch. */
export const PRIVACY: Record<Locale, LegalDoc> = {
  en: {
    metaTitle: 'Privacy policy',
    metaDescription: 'How QuizKids collects, uses and protects information about parents and kids. No ads, no selling of personal information.',
    title: 'Privacy policy',
    updated: 'Last updated: October 22, 2026',
    intro: 'QuizKids is a study app for kids that parents set up and manage. This policy explains, in plain language, what information we collect, why, and the choices you have. We do not show ads and we never sell personal information.',
    sections: [
      { title: 'Information we collect', body: [
        'Parent account: your name, email address, password (handled by our authentication provider, we never see it in plain text), language, preferences and your parent PIN.',
        'Kid profiles, created by a parent: first name, grade, avatar, favorite color, signature drawing, subjects, study language and level.',
        'Study activity: the topics you add, the quizzes, guides and worksheets created from them, quiz answers and scores, goals, plans, tests you add and time spent studying.',
        'Imported class material: photos or PDFs you upload are sent to our AI provider to find the topics. We keep the topics and summary that come back, not the original files.',
        'Google Classroom (optional): if you connect it, we read courses, coursework, materials, announcements and topics with read-only access. Access tokens are kept in an encrypted cookie on your device, not in our database, and you can disconnect at any time.',
      ] },
      { title: 'How we use it', body: [
        'To run the app: create study materials at the right level, build goals and daily plans, show progress, and keep your account in sync across devices.',
        'To keep the service working and secure, and to answer your messages.',
        'We do not use information about kids for advertising, and we do not build marketing profiles.',
      ] },
      { title: 'Service providers', body: [
        'We use a small number of providers to run QuizKids: a database and authentication provider (Supabase), an AI provider that writes study content (OpenAI), our hosting provider and, only if you connect it, Google Classroom.',
        'When we ask the AI provider to create content we send the topic, grade, language and, for imports, the files you uploaded. We do not send your email address or the kid’s full profile.',
      ] },
      { title: "Children's privacy", body: [
        'QuizKids accounts are created and managed by a parent or guardian. Kids do not need an email address; they sign in with a kid code their parent shares with them.',
        'Kids cannot chat, message other users or post anything publicly.',
        'Parents can review and edit their kids’ information in Settings, remove a kid profile and its progress at any time, or ask us to delete everything.',
      ] },
      { title: 'Keeping and deleting data', body: [
        'We keep your information while your account is active. Removing a kid profile in Settings removes their progress. To delete your whole account and its data, email us and we will take care of it.',
      ] },
      { title: 'Security', body: [
        'Data is sent over encrypted connections, access to each family’s data is restricted at the database level, and Google tokens are encrypted. No system is perfect, so please use a strong password and keep your parent PIN to yourself.',
      ] },
      { title: 'Changes to this policy', body: [
        'If we change this policy we will update this page and the date at the top. For important changes we will let account holders know by email.',
      ] },
    ],
  },
  es: {
    metaTitle: 'Política de privacidad',
    metaDescription: 'Cómo QuizKids recopila, usa y protege la información de familias y peques. Sin anuncios y sin vender información personal.',
    title: 'Política de privacidad',
    updated: 'Última actualización: 22 de octubre de 2026',
    intro: 'QuizKids es una app de estudio para peques que los adultos configuran y administran. Esta política explica, en palabras sencillas, qué información recopilamos, para qué y qué opciones tienes. No mostramos anuncios y nunca vendemos información personal.',
    sections: [
      { title: 'Información que recopilamos', body: [
        'Cuenta del adulto: tu nombre, correo, contraseña (la maneja nuestro proveedor de autenticación, nunca la vemos en texto plano), idioma, preferencias y tu PIN.',
        'Perfiles de peques, creados por un adulto: nombre, grado, avatar, color favorito, dibujo de su firma, materias, idioma de estudio y nivel.',
        'Actividad de estudio: los temas que agregas, los quizzes, guías y hojas de trabajo creados a partir de ellos, respuestas y puntajes, metas, planes, exámenes que agregas y tiempo de estudio.',
        'Material de clase importado: las fotos o PDF que subes se envían a nuestro proveedor de IA para encontrar los temas. Guardamos los temas y el resumen que devuelve, no los archivos originales.',
        'Google Classroom (opcional): si lo conectas, leemos cursos, tareas, materiales, anuncios y temas con acceso de solo lectura. Los tokens de acceso se guardan cifrados en una cookie en tu equipo, no en nuestra base de datos, y puedes desconectarlo cuando quieras.',
      ] },
      { title: 'Cómo la usamos', body: [
        'Para que la app funcione: crear material de estudio al nivel correcto, armar metas y planes diarios, mostrar el progreso y mantener tu cuenta sincronizada entre equipos.',
        'Para mantener el servicio funcionando y seguro, y para responder tus mensajes.',
        'No usamos información de los peques para publicidad ni creamos perfiles de marketing.',
      ] },
      { title: 'Proveedores de servicio', body: [
        'Usamos pocos proveedores para operar QuizKids: un proveedor de base de datos y autenticación (Supabase), un proveedor de IA que escribe el contenido de estudio (OpenAI), nuestro proveedor de hosting y, solo si lo conectas, Google Classroom.',
        'Cuando le pedimos contenido al proveedor de IA enviamos el tema, el grado, el idioma y, en las importaciones, los archivos que subiste. No enviamos tu correo ni el perfil completo de tu peque.',
      ] },
      { title: 'Privacidad de los peques', body: [
        'Las cuentas de QuizKids las crea y administra un adulto responsable. Los peques no necesitan correo; entran con un código que les comparte el adulto.',
        'Los peques no pueden chatear, escribirle a otros usuarios ni publicar nada.',
        'Puedes revisar y editar la información de tus peques en Configuración, eliminar un perfil y su progreso cuando quieras, o pedirnos que borremos todo.',
      ] },
      { title: 'Conservación y eliminación', body: [
        'Guardamos tu información mientras tu cuenta esté activa. Al eliminar el perfil de un peque en Configuración se borra su progreso. Para eliminar tu cuenta completa y sus datos, escríbenos y nos encargamos.',
      ] },
      { title: 'Seguridad', body: [
        'Los datos viajan por conexiones cifradas, el acceso a los datos de cada familia está restringido en la base de datos y los tokens de Google están cifrados. Ningún sistema es perfecto, así que usa una contraseña fuerte y no compartas tu PIN.',
      ] },
      { title: 'Cambios a esta política', body: [
        'Si cambiamos esta política actualizaremos esta página y la fecha de arriba. Si el cambio es importante, avisaremos por correo a los titulares de cuenta.',
      ] },
    ],
  },
};

export const TERMS: Record<Locale, LegalDoc> = {
  en: {
    metaTitle: 'Terms of service',
    metaDescription: 'The terms for using QuizKids: accounts, the free trial and subscription, AI-generated study content and acceptable use.',
    title: 'Terms of service',
    updated: 'Last updated: October 22, 2026',
    intro: 'These terms apply when you create a QuizKids account or use the app. By using QuizKids you agree to them. If you do not agree, please do not use the service.',
    sections: [
      { title: 'Accounts', body: [
        'You must be an adult (18 or older) to create an account. You are responsible for the kid profiles you create, for keeping your password and parent PIN safe, and for the activity on your account.',
        'Kids use QuizKids through a profile their parent or guardian created, under that adult’s supervision.',
      ] },
      { title: 'Free trial and subscription', body: [
        'New accounts start with a 14-day free trial. After the trial, the family plan costs $10 per month for the first kid plus $5 per month for each additional kid, or the yearly equivalent shown on the pricing page.',
        'You can cancel or change your billing cycle at any time from Settings. Cancelling stops future renewals; access continues until the end of the period you paid for.',
      ] },
      { title: 'Study content', body: [
        'Quizzes, study guides and worksheets are created by an AI model from the topics you add. We work hard to keep them accurate and age-appropriate, but they can contain mistakes. They support, and do not replace, your kid’s teachers and school materials.',
        'You keep any rights you have in the material you upload or import. You give us permission to process it only to provide the service to you.',
      ] },
      { title: 'Acceptable use', body: [
        'Use QuizKids for learning. Do not upload material you do not have the right to use, try to access other families’ data, disrupt the service, or use it to create harmful content.',
      ] },
      { title: 'Third-party services', body: [
        'Connecting Google Classroom is optional and is also subject to Google’s terms. You can disconnect it at any time.',
      ] },
      { title: 'Ending your account', body: [
        'You can stop using QuizKids and ask us to delete your account at any time. We may suspend accounts that break these terms or put other users at risk.',
      ] },
      { title: 'No warranties and limits on liability', body: [
        'QuizKids is provided “as is”. To the extent the law allows, we are not liable for indirect or consequential damages, and our total liability is limited to the amount you paid us in the 12 months before the claim.',
      ] },
      { title: 'Changes to these terms', body: [
        'If we update these terms we will change the date at the top of this page, and let account holders know by email about important changes. Continuing to use QuizKids means you accept the updated terms.',
      ] },
    ],
  },
  es: {
    metaTitle: 'Términos del servicio',
    metaDescription: 'Los términos para usar QuizKids: cuentas, la prueba gratis y la suscripción, el contenido de estudio creado con IA y el uso aceptable.',
    title: 'Términos del servicio',
    updated: 'Última actualización: 22 de octubre de 2026',
    intro: 'Estos términos aplican cuando creas una cuenta de QuizKids o usas la app. Al usar QuizKids los aceptas. Si no estás de acuerdo, por favor no uses el servicio.',
    sections: [
      { title: 'Cuentas', body: [
        'Debes ser mayor de edad (18 años o más) para crear una cuenta. Eres responsable de los perfiles de peques que creas, de proteger tu contraseña y tu PIN, y de la actividad de tu cuenta.',
        'Los peques usan QuizKids a través de un perfil creado por su madre, padre o tutor, bajo la supervisión de ese adulto.',
      ] },
      { title: 'Prueba gratis y suscripción', body: [
        'Las cuentas nuevas empiezan con 14 días gratis. Después, el plan familiar cuesta $10 al mes por el primer peque más $5 al mes por cada peque adicional, o el equivalente anual que aparece en la página de precios.',
        'Puedes cancelar o cambiar tu ciclo de pago cuando quieras desde Configuración. Al cancelar se detienen las renovaciones; el acceso sigue hasta el final del periodo pagado.',
      ] },
      { title: 'Contenido de estudio', body: [
        'Los quizzes, guías y hojas de trabajo los crea un modelo de IA a partir de los temas que agregas. Nos esforzamos para que sean correctos y adecuados para cada edad, pero pueden tener errores. Apoyan, y no reemplazan, a sus maestros y materiales escolares.',
        'Conservas los derechos que tengas sobre el material que subes o importas. Nos das permiso de procesarlo solo para darte el servicio.',
      ] },
      { title: 'Uso aceptable', body: [
        'Usa QuizKids para aprender. No subas material que no tengas derecho a usar, no intentes acceder a datos de otras familias, no interrumpas el servicio ni lo uses para crear contenido dañino.',
      ] },
      { title: 'Servicios de terceros', body: [
        'Conectar Google Classroom es opcional y también está sujeto a los términos de Google. Puedes desconectarlo cuando quieras.',
      ] },
      { title: 'Cierre de la cuenta', body: [
        'Puedes dejar de usar QuizKids y pedirnos que eliminemos tu cuenta cuando quieras. Podemos suspender cuentas que incumplan estos términos o pongan en riesgo a otros usuarios.',
      ] },
      { title: 'Sin garantías y límite de responsabilidad', body: [
        'QuizKids se ofrece “tal cual”. En la medida en que la ley lo permita, no somos responsables por daños indirectos, y nuestra responsabilidad total se limita a lo que nos pagaste en los 12 meses anteriores al reclamo.',
      ] },
      { title: 'Cambios a estos términos', body: [
        'Si actualizamos estos términos cambiaremos la fecha de arriba y avisaremos por correo a los titulares de cuenta sobre cambios importantes. Seguir usando QuizKids significa que aceptas los términos actualizados.',
      ] },
    ],
  },
};

export const LEGAL_UI: Record<Locale, { contact: string; toc: string }> = {
  en: { contact: 'Questions about this page? Email us at', toc: 'On this page' },
  es: { contact: '¿Preguntas sobre esta página? Escríbenos a', toc: 'En esta página' },
};
