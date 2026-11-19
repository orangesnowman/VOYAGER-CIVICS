export interface MasterLesson {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  skillImproved: string;
  objective: string;
  whatItIs: string;
  instructions?: string;
  level: string; // CEFR Level (e.g., 'B1', 'B2', 'B2-C1')
  estimatedMinutes: number;
  tags: string[];
  imageUrl: string;
}

export function getMasterLessons(lang: 'EN' | 'ES'): MasterLesson[] {
  return [
    {
      id: 'cat-job-interview',
      title: lang === 'EN' ? 'Job Interview (STAR Method)' : 'Simulación de Entrevista de Trabajo: Método STAR',
      subtitle: lang === 'EN'
        ? 'Master behavioral interview questions using the STAR framework with concise, quantified metrics.'
        : 'Practica cómo responder preguntas de entrevistas de trabajo utilizando el método STAR (Situación, Tarea, Acción y Resultado) con métricas concretas en inglés.',
      category: lang === 'EN' ? 'Career & Business' : 'Negocios y Carrera',
      skillImproved: lang === 'EN' ? 'Professional Fluency (+18%)' : 'Fluidez Profesional (+18%)',
      objective: lang === 'EN'
        ? 'Structure answers clearly with Situation, Task, Action, and Result in US professional settings.'
        : 'Estructurar respuestas profesionales claras en inglés aplicando Situación, Tarea, Acción y Resultado en entornos laborales de EE.UU.',
      whatItIs: lang === 'EN' ? 'Professional Job Interview Simulation (STAR Method)' : 'Simulación Profesional de Entrevista de Trabajo (Método STAR)',
      instructions: lang === 'EN'
        ? 'Answer situational job interview questions using the STAR framework: describe the Situation, your Task, the specific Action you took, and the Result with quantifiable metrics in English.'
        : 'Responde a preguntas situacionales de entrevista laboral usando la estructura STAR: Describe la Situación, tu Tarea, la Acción específica que tomaste y el Resultado con métricas cuantificables en inglés.',
      level: 'B2',
      estimatedMinutes: 20,
      tags: ['career', 'business', 'interview', 'work'],
      imageUrl: '/assets/lessons/photo-job-interview.jpg'
    },
    {
      id: 'cat-salary-negotiation',
      title: lang === 'EN' ? 'Salary Negotiation' : 'Negociación Salarial',
      subtitle: lang === 'EN'
        ? 'Negotiate compensation, healthcare benefits, and remote options with assertive diplomacy.'
        : 'Negocia compensación, beneficios de salud y trabajo remoto con firmeza diplomática.',
      category: lang === 'EN' ? 'Career & Business' : 'Negocios y Carrera',
      skillImproved: lang === 'EN' ? 'Assertive Pitch (+16%)' : 'Discurso Asertivo (+16%)',
      objective: lang === 'EN'
        ? 'Apply professional phrasing to counter offer terms without aggressive posturing.'
        : 'Aplicar frases profesionales para negociar contraofertas sin posturas agresivas.',
      whatItIs: lang === 'EN' ? 'Executive Compensation Dialogue' : 'Diálogo Ejecutivo de Negociación',
      level: 'B2-C1',
      estimatedMinutes: 20,
      tags: ['career', 'business', 'negotiation'],
      imageUrl: '/assets/lessons/photo-job-interview.jpg'
    },
    {
      id: 'cat-civics-128',
      title: lang === 'EN' ? 'US Citizenship Interview' : 'Entrevista de Ciudadanía',
      subtitle: lang === 'EN'
        ? 'Practice official USCIS 128 civics questions and naturalization officer oral dialogue.'
        : 'Practica las 128 preguntas oficiales de cívica y el diálogo oral con el oficial de naturalización.',
      category: lang === 'EN' ? 'Civics & Rights' : 'Cívica y Derechos',
      skillImproved: lang === 'EN' ? 'Citizenship Test Readiness (+25%)' : 'Preparación de Ciudadanía (+25%)',
      objective: lang === 'EN'
        ? 'Answer officer questions about US history, constitution, and N-400 application accurately.'
        : 'Responder con precisión sobre historia, constitución y solicitud N-400 ante el oficial de USCIS.',
      whatItIs: lang === 'EN' ? 'Official Naturalization Oral Simulator' : 'Simulador Oral Oficial de Naturalización',
      level: 'B1-B2',
      estimatedMinutes: 20,
      tags: ['civics', 'citizenship', 'rights', 'government'],
      imageUrl: '/assets/lessons/photo-civics-flag.jpg'
    },
    {
      id: 'cat-us-constitution',
      title: lang === 'EN' ? 'US Constitution' : 'Constitución de EE.UU.',
      subtitle: lang === 'EN'
        ? 'Explain the separation of legislative, executive, and judicial branches and the Bill of Rights.'
        : 'Explica la división de los poderes legislativo, execute y judicial y la Carta de Derechos.',
      category: lang === 'EN' ? 'Civics & Rights' : 'Cívica y Derechos',
      skillImproved: lang === 'EN' ? 'Civic Literacy (+22%)' : 'Alfabetización Cívica (+22%)',
      objective: lang === 'EN'
        ? 'Demonstrate a solid grasp of fundamental constitutional checks and civil liberties in English.'
        : 'Demostrar dominio de los frenos y contrapesos constitucionales y libertades civiles.',
      whatItIs: lang === 'EN' ? 'Constitutional Civics Workshop' : 'Taller de Cívica Constitucional',
      level: 'B1-B2',
      estimatedMinutes: 20,
      tags: ['civics', 'citizenship', 'constitution'],
      imageUrl: '/assets/lessons/photo-civics-flag.jpg'
    },
    {
      id: 'cat-doctor-pharmacy',
      title: lang === 'EN' ? 'Doctor & Pharmacy' : 'Consulta Médica',
      subtitle: lang === 'EN'
        ? 'Describe acute symptoms, clarify medication dosages, and ask about side effects.'
        : 'Describe síntomas, aclara dosis de medicamentos y consulta posibles efectos secundarios.',
      category: lang === 'EN' ? 'Health & Living' : 'Salud y Bienestar',
      skillImproved: lang === 'EN' ? 'Medical Vocabulary (+20%)' : 'Vocabulario Médico (+20%)',
      objective: lang === 'EN'
        ? 'Communicate symptoms accurately and understand physician instructions without ambiguity.'
        : 'Comunicar síntomas con precisión y comprender indicaciones médicas sin ambigüedades.',
      whatItIs: lang === 'EN' ? 'US Healthcare Communication' : 'Comunicación en el Sistema de Salud de EE.UU.',
      level: 'B1',
      estimatedMinutes: 15,
      tags: ['health', 'medical', 'daily', 'pharmacy'],
      imageUrl: '/assets/lessons/photo-doctor-clinic.jpg'
    },
    {
      id: 'cat-airport-tsa',
      title: lang === 'EN' ? 'Airport & Customs' : 'Aeropuerto y Aduanas',
      subtitle: lang === 'EN'
        ? 'Navigate security checkpoints, baggage declarations, and gate changes with natural clarity.'
        : 'Navega controles de seguridad de TSA, aduanas y cambios de puerta con naturalidad.',
      category: lang === 'EN' ? 'Travel & Transit' : 'Viajes y Tránsito',
      skillImproved: lang === 'EN' ? 'Travel Confidence (+18%)' : 'Confianza en Viajes (+18%)',
      objective: lang === 'EN'
        ? 'Respond directly and calmly to border officers and airport security staff.'
        : 'Responder con calma y claridad a oficiales de aduanas y personal aeroportuario.',
      whatItIs: lang === 'EN' ? 'Airport Transit Simulation' : 'Simulación de Tránsito Aeroportuario',
      level: 'A2-B1',
      estimatedMinutes: 15,
      tags: ['travel', 'transit', 'airport', 'mobility'],
      imageUrl: '/assets/lessons/photo-airport-transit.jpg'
    },
    {
      id: 'cat-flight-rebooking',
      title: lang === 'EN' ? 'Flight Rebooking' : 'Reasignación de Vuelo',
      subtitle: lang === 'EN'
        ? 'Resolve missed connections, request hotel vouchers, and rebook flights courteously.'
        : 'Resuelve conexiones perdidas, solicita vouchers de hotel y reprograma vuelos con cortesía.',
      category: lang === 'EN' ? 'Travel & Transit' : 'Viajes y Tránsito',
      skillImproved: lang === 'EN' ? 'Polite Problem Solving (+16%)' : 'Resolución Cortés de Problemas (+16%)',
      objective: lang === 'EN'
        ? 'Advocate for passenger rights and resolve travel disruptions in fluent spoken English.'
        : 'Defender derechos de pasajero y solucionar imprevistos de viaje con fluidez oral.',
      whatItIs: lang === 'EN' ? 'Airline Customer Service Simulation' : 'Simulación de Atención al Cliente en Aerolíneas',
      level: 'B1',
      estimatedMinutes: 15,
      tags: ['travel', 'transit', 'airline'],
      imageUrl: '/assets/lessons/photo-airport-transit.jpg'
    },
    {
      id: 'cat-restaurant-dining',
      title: lang === 'EN' ? 'Dining & Ordering' : 'Restaurante y Pedidos',
      subtitle: lang === 'EN'
        ? 'Order meals, request dietary modifications, and handle check splitting smoothly.'
        : 'Pide comida, solicita modificaciones por alergias y resuelve la cuenta sin vacilar.',
      category: lang === 'EN' ? 'Daily Life' : 'Vida Diaria',
      skillImproved: lang === 'EN' ? 'Casual Speech (+15%)' : 'Habla Cotidiana (+15%)',
      objective: lang === 'EN'
        ? 'Interact comfortably with waitstaff in high-speed American hospitality environments.'
        : 'Interactuar con soltura con camareros en restaurantes y cafeterías de EE.UU.',
      whatItIs: lang === 'EN' ? 'Dining & Social Interaction' : 'Interacción Social en Restaurantes',
      level: 'A1-A2',
      estimatedMinutes: 12,
      tags: ['daily', 'dining', 'social'],
      imageUrl: '/assets/lessons/photo-restaurant-dining.jpg'
    },
    {
      id: 'cat-apartment-lease',
      title: lang === 'EN' ? 'Apartment Rental' : 'Alquiler de Vivienda',
      subtitle: lang === 'EN'
        ? 'Discuss lease clauses, security deposit terms, and submit urgent repair requests.'
        : 'Revisa cláusulas de alquiler, depósitos de garantía y reporta solicitudes de reparación.',
      category: lang === 'EN' ? 'Daily Life' : 'Vida Diaria',
      skillImproved: lang === 'EN' ? 'Housing Negotiation (+16%)' : 'Negociación de Vivienda (+16%)',
      objective: lang === 'EN'
        ? 'Clarify residential agreements and communicate household issues clearly with landlords.'
        : 'Aclarar contratos de vivienda y comunicar averías con precisión a propietarios.',
      whatItIs: lang === 'EN' ? 'Housing Communication Workshop' : 'Taller de Comunicación Inmobiliaria',
      level: 'B1-B2',
      estimatedMinutes: 18,
      tags: ['daily', 'housing', 'lease'],
      imageUrl: '/assets/lessons/photo-apartment-lease.jpg'
    },
    {
      id: 'cat-connectors-flow',
      title: lang === 'EN' ? 'Speech Cadence' : 'Ritmo al Hablar',
      subtitle: lang === 'EN'
        ? 'Link complex thoughts smoothly and eliminate hesitation pauses when speaking.'
        : 'Enlaza ideas complejas con fluidez y elimina muletillas y pausas al hablar.',
      category: lang === 'EN' ? 'Speech Flow' : 'Fluidez Verbal',
      skillImproved: lang === 'EN' ? 'Fluency (+14%)' : 'Fluidez (+14%)',
      objective: lang === 'EN'
        ? 'Master transition markers (furthermore, on that note, essentially) in active conversation.'
        : 'Dominar conectores de transición en conversaciones activas sin pausas prolongadas.',
      whatItIs: lang === 'EN' ? 'Spoken Cadence Masterclass' : 'Clase Práctica de Ritmo y Fluidez',
      level: 'B1-B2',
      estimatedMinutes: 15,
      tags: ['flow', 'fluency', 'connectors'],
      imageUrl: '/assets/lessons/photo-job-interview.jpg'
    },
    {
      id: 'cat-phonetics-th-v',
      title: lang === 'EN' ? 'American Accent' : 'Acento Americano',
      subtitle: lang === 'EN'
        ? 'Refine tongue placement and muscle memory for crystal-clear American pronunciation.'
        : 'Ajusta la colocación de la lengua y memoria muscular para una pronunciación limpia.',
      category: lang === 'EN' ? 'Pronunciation' : 'Pronunciación',
      skillImproved: lang === 'EN' ? 'Acoustic Clarity (+15%)' : 'Claridad Acústica (+15%)',
      objective: lang === 'EN'
        ? 'Distinguish voiced vs unvoiced /th/ and master the American alveolar tap in words like "water".'
        : 'Diferenciar /th/ sonoro y sordo y dominar la T suave americana en el habla continua.',
      whatItIs: lang === 'EN' ? 'Acoustic Phonetics Drill' : 'Entrenamiento Fonético de Precisión',
      level: 'A2-B2',
      estimatedMinutes: 12,
      tags: ['pronunciation', 'accent', 'phonemes'],
      imageUrl: '/assets/lessons/photo-doctor-clinic.jpg'
    },
    {
      id: 'cat-confidence-drills',
      title: lang === 'EN' ? 'Speaking Confidence' : 'Seguridad al Hablar',
      subtitle: lang === 'EN'
        ? 'Conquer hesitation anxiety and respond confidently in unplanned conversations.'
        : 'Supera el temor a equivocarte y responde con seguridad en situaciones imprevistas.',
      category: lang === 'EN' ? 'Confidence' : 'Confianza',
      skillImproved: lang === 'EN' ? 'Speaking Confidence (+20%)' : 'Seguridad al Hablar (+20%)',
      objective: lang === 'EN'
        ? 'Practice instant vocal projection and rapid idea formulation under light pressure.'
        : 'Practicar proyección vocal inmediata y formulación ágil de ideas sin vacilaciones.',
      whatItIs: lang === 'EN' ? 'Impromptu Confidence Workshop' : 'Taller de Confianza e Improvisación',
      level: 'A2-B2',
      estimatedMinutes: 15,
      tags: ['confidence', 'speaking', 'impromptu'],
      imageUrl: '/assets/lessons/photo-restaurant-dining.jpg'
    },
    {
      id: 'cat-tech-debate',
      title: lang === 'EN' ? 'AI & Tech Trends' : 'Tecnología e IA',
      subtitle: lang === 'EN'
        ? 'Articulate nuanced viewpoints on artificial intelligence, ethics, and startup strategy.'
        : 'Articula argumentos avanzados sobre inteligencia artificial, ética y startups.',
      category: lang === 'EN' ? 'Technology' : 'Tecnología',
      skillImproved: lang === 'EN' ? 'Advanced Debate (+14%)' : 'Debate Avanzado (+14%)',
      objective: lang === 'EN'
        ? 'Incorporate high-level technical idioms and structure arguments coherently in English.'
        : 'Incorporar modismos técnicos avanzados y estructurar argumentos con precisión.',
      whatItIs: lang === 'EN' ? 'Executive Tech Discussion' : 'Mesa de Debate Tecnológico',
      level: 'B2-C1',
      estimatedMinutes: 20,
      tags: ['technology', 'tech', 'debate', 'business'],
      imageUrl: '/assets/lessons/photo-job-interview.jpg'
    }
  ];
}
