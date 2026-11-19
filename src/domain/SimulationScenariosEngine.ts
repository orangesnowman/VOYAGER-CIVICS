// VOYAGER USA — Real-World Scenarios, CEFR Mock Exams & Capstone Simulations Engine
// Version 1.0 | Phase 5 Comprehensive Learning Edition | November 2026

import { saveLessonEvaluationRecord, LessonEvaluationRecord, scoreToLetterGrade } from './LessonGradingSystem';
import { vocabularyTracker } from './VocabularyTracker';
import { auth, db } from '../services/firebaseAuth';
import { doc, setDoc } from 'firebase/firestore';
import { withTimeout, isFirestoreQuotaExceeded, handleFirestoreWriteError } from '../services/userProfileService';

export type ScenarioCategory = 'TRAVEL' | 'PROFESSIONAL' | 'EVERYDAY_LIFE' | 'SOCIAL_COMMUNICATION';

export interface ScenarioMilestone {
  id: string;
  title: string;
  description: string;
  expectedKeywords: string[];
}

export interface RealWorldScenario {
  id: string;
  category: ScenarioCategory;
  title: string;
  subtitle: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  voyagerRole: string; // The persona Voyager adopts
  studentRole: string;
  setting: string;
  objective: string;
  estimatedMinutes: number;
  tags: string[];
  vocabularyList: string[];
  milestones: ScenarioMilestone[];
  rolePrompt: string; // System instruction for Gemini Live
}

export interface CefrMockExam {
  id: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  title: string;
  subtitle: string;
  targetSkills: string[];
  passingScore: number; // e.g. 70
  sections: {
    name: string;
    description: string;
    taskPrompt: string;
    criteria: string;
  }[];
  disclaimer: string;
}

export interface CapstoneCheckpoint {
  id: string;
  stageNumber: number;
  title: string;
  situation: string;
  voyagerRole: string;
  objective: string;
  successCondition: string;
}

export interface CapstoneSimulation {
  id: string;
  title: string;
  subtitle: string;
  cefrLevel: 'A2' | 'B1' | 'B2' | 'C1';
  summary: string;
  checkpoints: CapstoneCheckpoint[];
  finalMilestone: string;
}

export interface ActiveSimulationSession {
  scenarioId: string;
  type: 'SCENARIO' | 'EXAM' | 'CAPSTONE';
  title: string;
  cefrLevel: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  currentCheckpointIndex: number;
  totalCheckpoints: number;
  startedAt: string;
  durationSeconds: number;
  userTurns: number;
}

const STORAGE_ACTIVE_SIM = 'voyager_active_simulation_session';
const STORAGE_SCENARIO_RESULTS = 'voyager_scenario_evaluation_records';
const STORAGE_EXAM_RESULTS = 'voyager_mock_exam_records';

export class SimulationScenariosEngine {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. REAL-WORLD SCENARIOS REPOSITORY
  // ─────────────────────────────────────────────────────────────────────────────
  public getScenarios(lang: 'EN' | 'ES' = 'EN'): RealWorldScenario[] {
    const isEn = lang === 'EN';
    return [
      // TRAVEL
      {
        id: 'scen-airport-checkin',
        category: 'TRAVEL',
        title: isEn ? 'Airport Check-In & Boarding' : 'Check-In y Abordaje en Aeropuerto',
        subtitle: isEn ? 'Confirm ticket, check baggage, and request seat preferences at the airline counter.' : 'Confirma tu boleto, documenta equipaje y solicita asiento en el mostrador.',
        cefrLevel: 'A2',
        voyagerRole: isEn ? 'Airline Gate Agent' : 'Agente de Aerolínea',
        studentRole: isEn ? 'International Traveler' : 'Pasajero Internacional',
        setting: isEn ? 'JFK International Airport Terminal 4' : 'Aeropuerto JFK Terminal 4',
        objective: isEn ? 'Successfully check in, confirm baggage weight, and obtain boarding pass.' : 'Hacer check-in, verificar peso de maletas y recibir pase de abordar.',
        estimatedMinutes: 12,
        tags: ['travel', 'airport', 'baggage', 'transit'],
        vocabularyList: ['Boarding pass', 'Checked luggage', 'Carry-on bag', 'Window seat', 'Aisle seat', 'Departure gate'],
        milestones: [
          { id: 'm1', title: isEn ? 'Present Booking' : 'Presentar Reserva', description: 'State destination and present passport confirmation', expectedKeywords: ['flying', 'passport', 'confirmation', 'destination'] },
          { id: 'm2', title: isEn ? 'Luggage Declaration' : 'Declarar Equipaje', description: 'Specify checked luggage and carry-on items', expectedKeywords: ['checked', 'carry-on', 'bag', 'scale'] },
          { id: 'm3', title: isEn ? 'Seat Selection' : 'Selección de Asiento', description: 'Request window or aisle preference', expectedKeywords: ['window', 'aisle', 'seat', 'gate'] }
        ],
        rolePrompt: `You are an attentive American airline customer service agent at JFK Airport counter. Greet the traveler warmly, ask for their ID/passport and final destination. Guide them through checking in baggage (reminding them of the 50lb limit), ask their seat preference (window or aisle), and hand them their simulated boarding pass with gate information.`
      },
      {
        id: 'scen-immigration-customs',
        category: 'TRAVEL',
        title: isEn ? 'CBP Immigration & Customs Declaration' : 'Oficial de Inmigración y Aduanas (CBP)',
        subtitle: isEn ? 'Answer CBP officer questions about your travel purpose, stay duration, and lodging.' : 'Responde a las preguntas oficiales del oficial de aduanas sobre motivo de viaje y estancia.',
        cefrLevel: 'B1',
        voyagerRole: isEn ? 'US Customs & Border Protection (CBP) Officer' : 'Oficial de Aduanas CBP',
        studentRole: isEn ? 'Visiting Traveler' : 'Viajero en Control Fronterizo',
        setting: isEn ? 'US Border Port of Entry, Passport Control' : 'Control de Pasaportes, Entrada a EE.UU.',
        objective: isEn ? 'Clearly explain purpose of travel, duration, accommodation, and customs items.' : 'Explicar con claridad motivo de viaje, estancia, hospedaje y artículos declarados.',
        estimatedMinutes: 15,
        tags: ['travel', 'immigration', 'customs', 'border'],
        vocabularyList: ['Purpose of visit', 'Length of stay', 'Hotel reservation', 'Return ticket', 'Declaring goods', 'Port of entry'],
        milestones: [
          { id: 'm1', title: isEn ? 'Travel Purpose' : 'Motivo de Viaje', description: 'State if travel is business, vacation, or study', expectedKeywords: ['vacation', 'business', 'visiting', 'tourism'] },
          { id: 'm2', title: isEn ? 'Lodging & Duration' : 'Alojamiento y Días', description: 'Provide hotel name and exact days of stay', expectedKeywords: ['hotel', 'staying', 'days', 'weeks', 'return'] },
          { id: 'm3', title: isEn ? 'Customs Declaration' : 'Declaración de Bienes', description: 'Confirm you carry no agricultural prohibited items or cash over $10,000', expectedKeywords: ['nothing', 'declare', 'cash', 'food'] }
        ],
        rolePrompt: `You are an official US Customs and Border Protection officer at airport passport control. Speak with professional, firm, yet polite American authority. Ask: 1) What is the purpose of your visit to the United States? 2) How long are you staying? 3) Where will you be staying? 4) Do you have anything to declare (food, plants, currency over $10,000)? Listen to their answers and ask natural follow-ups before stamping their entry.`
      },
      {
        id: 'scen-hotel-reservation',
        category: 'TRAVEL',
        title: isEn ? 'Hotel Check-In & Amenity Inquiries' : 'Recepción de Hotel y Servicios',
        subtitle: isEn ? 'Check in to your hotel room, ask about Wi-Fi, breakfast hours, and gym access.' : 'Haz check-in en el hotel, consulta por Wi-Fi, desayuno y acceso al gimnasio.',
        cefrLevel: 'A2',
        voyagerRole: isEn ? 'Hotel Front Desk Concierge' : 'Recepcionista del Hotel',
        studentRole: isEn ? 'Hotel Guest' : 'Huésped del Hotel',
        setting: isEn ? 'Midtown Manhattan Hotel Lobby' : 'Vestíbulo de Hotel en Manhattan',
        objective: isEn ? 'Provide name, clarify room reservation, and request hotel amenities smoothly.' : 'Dar tu nombre, confirmar la habitación y consultar los servicios incluidos.',
        estimatedMinutes: 12,
        tags: ['travel', 'hotel', 'hospitality', 'checkin'],
        vocabularyList: ['Reservation', 'Keycard', 'Complimentary breakfast', 'Check-out time', 'High floor', 'Wi-Fi password'],
        milestones: [
          { id: 'm1', title: isEn ? 'Provide Booking Name' : 'Dar Nombre de Reserva', description: 'State reservation name and room type', expectedKeywords: ['reservation', 'name', 'booked', 'night'] },
          { id: 'm2', title: isEn ? 'Inquire Breakfast & Wi-Fi' : 'Consultar Desayuno', description: 'Ask what time breakfast is served and network details', expectedKeywords: ['breakfast', 'wifi', 'password', 'morning'] },
          { id: 'm3', title: isEn ? 'Keycard & Elevator' : 'Llave y Piso', description: 'Confirm room floor and keycard usage', expectedKeywords: ['elevator', 'floor', 'keycard', 'thank you'] }
        ],
        rolePrompt: `You are the front desk concierge at a boutique American hotel in Manhattan. Welcome the guest warmly, look up their reservation, ask for a credit card for incidentals, issue their room key on a high floor, and answer any questions about breakfast hours and amenities.`
      },
      // PROFESSIONAL
      {
        id: 'scen-job-interview-star',
        category: 'PROFESSIONAL',
        title: isEn ? 'Executive Job Interview (STAR Method)' : 'Entrevista Laboral Ejecutiva (Método STAR)',
        subtitle: isEn ? 'Demonstrate professional problem-solving and quantified achievements in English.' : 'Demuestra resolución de problemas y logros cuantificados con el método STAR.',
        cefrLevel: 'B2',
        voyagerRole: isEn ? 'Senior Hiring Director' : 'Director de Contratación',
        studentRole: isEn ? 'Job Candidate' : 'Candidato Profesional',
        setting: isEn ? 'Corporate Headquarters Conference Room' : 'Sala de Conferencias Corporativa',
        objective: isEn ? 'Answer situational questions using Situation, Task, Action, and Result with metrics.' : 'Responder preguntas situacionales con Situación, Tarea, Acción y Resultado cuantificado.',
        estimatedMinutes: 18,
        tags: ['career', 'interview', 'star', 'business'],
        vocabularyList: ['Situation', 'Objective', 'Action taken', 'Quantifiable metric', 'Cross-functional team', 'Key takeaway'],
        milestones: [
          { id: 'm1', title: isEn ? 'Elevator Pitch' : 'Presentación Inicial', description: 'Summarize background and core expertise concisely', expectedKeywords: ['experience', 'role', 'background', 'responsible'] },
          { id: 'm2', title: isEn ? 'STAR Behavioral Challenge' : 'Respuesta STAR', description: 'Describe a workplace crisis, action taken, and quantifiable result', expectedKeywords: ['situation', 'task', 'decided', 'action', 'result', 'percent'] },
          { id: 'm3', title: isEn ? 'Candidate Questions' : 'Preguntas al Empleador', description: 'Ask insightful questions about company culture or next steps', expectedKeywords: ['team', 'culture', 'next steps', 'goals'] }
        ],
        rolePrompt: `You are the Senior Hiring Manager for an American enterprise. Conduct an authentic professional interview. Ask the candidate: 1) Can you walk me through your background and biggest professional strength? 2) Tell me about a time a project faced a serious obstacle. What specific action did you take, and what was the outcome? 3) Do you have any questions for me about the team? Provide realistic follow-ups based on their answers.`
      },
      {
        id: 'scen-business-standup',
        category: 'PROFESSIONAL',
        title: isEn ? 'Workplace Agile Standup Meeting' : 'Reunión de Estado Diario (Standup Ágil)',
        subtitle: isEn ? 'Report yesterday achievements, today commitments, and flag project blockers.' : 'Reporta qué hiciste ayer, tus metas de hoy y si tienes algún bloqueo.',
        cefrLevel: 'B1',
        voyagerRole: isEn ? 'Project Scrum Lead' : 'Líder de Proyecto Scrum',
        studentRole: isEn ? 'Team Member' : 'Miembro del Equipo',
        setting: isEn ? 'Morning Virtual Team Huddle' : 'Reunión de Equipo Matutina',
        objective: isEn ? 'Deliver a concise 3-part status update: yesterday, today, and any obstacles.' : 'Entregar actualización concisa de 3 partes: ayer, hoy y posibles bloqueos.',
        estimatedMinutes: 10,
        tags: ['career', 'scrum', 'standup', 'workplace'],
        vocabularyList: ['Yesterday I finished', 'Today I am tackling', 'No blockers', 'Dependency on', 'Sprint deliverable'],
        milestones: [
          { id: 'm1', title: isEn ? 'Yesterday Update' : 'Logros de Ayer', description: 'State completed tasks', expectedKeywords: ['yesterday', 'completed', 'finished', 'worked'] },
          { id: 'm2', title: isEn ? 'Today Commitment' : 'Metas de Hoy', description: 'State what you will focus on today', expectedKeywords: ['today', 'working', 'focus', 'deliver'] },
          { id: 'm3', title: isEn ? 'Blockers' : 'Bloqueos', description: 'Confirm if you have blockers or need support', expectedKeywords: ['blocker', 'help', 'ready', 'clear'] }
        ],
        rolePrompt: `You are an American Scrum Master facilitating the morning standup. Call on the student warmly: "Good morning! Let's get your quick 3-point update: what did you close out yesterday, what are you owning today, and do you have any blockers?" Respond professionally to their update.`
      },
      // EVERYDAY LIFE
      {
        id: 'scen-restaurant-dining',
        category: 'EVERYDAY_LIFE',
        title: isEn ? 'American Diner Dining & Ordering' : 'Restaurante Típico: Pedidos y Cuenta',
        subtitle: isEn ? 'Order dishes, request substitutions, ask for beverage refills, and split the bill.' : 'Pide platillos, solicita cambios de guarnición, rellena bebidas y pide la cuenta.',
        cefrLevel: 'A1',
        voyagerRole: isEn ? 'Friendly Diner Waiter' : 'Mesero del Restaurante',
        studentRole: isEn ? 'Diner Customer' : 'Cliente del Restaurante',
        setting: isEn ? 'Corner American Diner' : 'Diner Típico Americano',
        objective: isEn ? 'Order food comfortably, ask for modifications, and request the check.' : 'Pedir comida con naturalidad, solicitar modificaciones y pedir la cuenta.',
        estimatedMinutes: 10,
        tags: ['daily', 'food', 'dining', 'restaurant'],
        vocabularyList: ['Table for one/two', 'Daily specials', 'Side order', 'Refill', 'Can I get the check', 'Separate checks'],
        milestones: [
          { id: 'm1', title: isEn ? 'Beverage & Order' : 'Bebida y Plato', description: 'Order a drink and main course', expectedKeywords: ['like', 'order', 'water', 'coffee', 'burger', 'sandwich'] },
          { id: 'm2', title: isEn ? 'Ask Substitution / Refill' : 'Modificación o Relleno', description: 'Ask for dressing on the side or more water', expectedKeywords: ['side', 'refill', 'instead', 'please'] },
          { id: 'm3', title: isEn ? 'Request Check' : 'Pedir la Cuenta', description: 'Politely ask for the check and payment method', expectedKeywords: ['check', 'bill', 'card', 'cash'] }
        ],
        rolePrompt: `You are a cheerful, efficient server at a classic American diner. Welcome the customer to a booth, ask what they would like to drink, take their food order, offer a side substitution, ask if they need a refill, and bring the check when requested.`
      },
      {
        id: 'scen-medical-clinic',
        category: 'EVERYDAY_LIFE',
        title: isEn ? 'Doctor Appointment & Symptom Description' : 'Consulta Médica y Síntomas',
        subtitle: isEn ? 'Describe acute symptoms, pain levels, and clarify medication instructions.' : 'Describe síntomas, escala de dolor y comprende las indicaciones del médico.',
        cefrLevel: 'B1',
        voyagerRole: isEn ? 'Primary Care Physician' : 'Médico de Cabecera',
        studentRole: isEn ? 'Patient' : 'Paciente',
        setting: isEn ? 'Outpatient Medical Clinic Examination Room' : 'Consultorio Médico',
        objective: isEn ? 'Communicate physical symptoms accurately and confirm medication instructions.' : 'Comunicar síntomas con precisión y confirmar dosis de medicamentos.',
        estimatedMinutes: 15,
        tags: ['daily', 'medical', 'health', 'doctor'],
        vocabularyList: ['Symptoms', 'Pain scale 1 to 10', 'Prescription', 'Take twice daily', 'Side effects', 'Allergies'],
        milestones: [
          { id: 'm1', title: isEn ? 'Describe Symptoms' : 'Describir Síntomas', description: 'Explain what hurts, when it started, and frequency', expectedKeywords: ['pain', 'hurts', 'started', 'days', 'fever', 'headache'] },
          { id: 'm2', title: isEn ? 'Rate Pain & Allergies' : 'Escala de Dolor', description: 'Rate pain from 1 to 10 and confirm drug allergies', expectedKeywords: ['scale', 'about', 'allergic', 'no allergies'] },
          { id: 'm3', title: isEn ? 'Clarify Treatment' : 'Aclarar Tratamiento', description: 'Confirm dosage, with/without meals, and rest duration', expectedKeywords: ['pills', 'meals', 'days', 'how often'] }
        ],
        rolePrompt: `You are an empathetic, professional American doctor in an examination room. Greet the patient kindly: "What brings you in today?" Ask them to describe where it hurts, how long they have felt this way, rate their discomfort from 1 to 10, ask about allergies, and explain a simple treatment plan with dosage instructions.`
      },
      // SOCIAL COMMUNICATION
      {
        id: 'scen-social-smalltalk',
        category: 'SOCIAL_COMMUNICATION',
        title: isEn ? 'Social Mixer: Introductions & Small Talk' : 'Encuentro Social: Presentaciones y Charla',
        subtitle: isEn ? 'Introduce yourself, break the ice, discuss hobbies, and keep a conversation flowing.' : 'Preséntate, rompe el hielo, habla de pasatiempos y mantén la conversación activa.',
        cefrLevel: 'A2',
        voyagerRole: isEn ? 'Friendly Community Neighbor' : 'Vecino de la Comunidad',
        studentRole: isEn ? 'New Resident / Attendee' : 'Nuevo Residente',
        setting: isEn ? 'Neighborhood Community Garden Gathering' : 'Reunión de Vecinos en el Barrio',
        objective: isEn ? 'Introduce yourself, exchange common interests, and conclude with a warm sign-off.' : 'Presentarte, hablar de intereses comunes y despedirte cordialmente.',
        estimatedMinutes: 12,
        tags: ['social', 'smalltalk', 'introduction', 'networking'],
        vocabularyList: ['Nice to meet you', 'How long have you lived here', 'In my free time', 'Originally from', 'Keep in touch'],
        milestones: [
          { id: 'm1', title: isEn ? 'Self Introduction' : 'Presentación Personal', description: 'Share your name, where you are from, and occupation/interest', expectedKeywords: ['name', 'from', 'live', 'nice to meet'] },
          { id: 'm2', title: isEn ? 'Ask Mutual Questions' : 'Hacer Preguntas', description: 'Inquire about the other person weekend or neighborhood tips', expectedKeywords: ['how about you', 'do you', 'recommend', 'weekend'] },
          { id: 'm3', title: isEn ? 'Polite Sign-Off' : 'Despedida Amable', description: 'Exchange contacts or express pleasure in meeting', expectedKeywords: ['great talking', 'see you around', 'take care', 'keep in touch'] }
        ],
        rolePrompt: `You are an approachable American neighbor at a community get-together. Introduce yourself, ask the student where they moved from, comment on the local neighborhood or weather, ask about their favorite hobbies, and make them feel warmly welcomed.`
      }
    ];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. CEFR MOCK EXAMINATIONS REPOSITORY
  // ─────────────────────────────────────────────────────────────────────────────
  public getMockExams(lang: 'EN' | 'ES' = 'EN'): CefrMockExam[] {
    const isEn = lang === 'EN';
    const disclaimer = isEn
      ? 'Voyager USA Practice Assessment — Not an Accredited Official CEFR Certification.'
      : 'Evaluación de Práctica de Voyager USA — No constituye una certificación oficial acreditada.';

    return [
      {
        id: 'exam-cefr-a1',
        cefrLevel: 'A1',
        title: isEn ? 'CEFR A1 Spoken Foundations Exam' : 'Examen de Práctica CEFR A1: Fundamentos',
        subtitle: isEn ? 'Basic personal details, familiar everyday objects, and simple immediate needs.' : 'Datos personales básicos, objetos cotidianos y necesidades inmediatas simples.',
        targetSkills: ['Basic Pronunciation', 'Simple Vocabulary', 'Short Answers'],
        passingScore: 70,
        disclaimer,
        sections: [
          {
            name: isEn ? 'Section 1: Personal Details' : 'Sección 1: Datos Personales',
            description: isEn ? 'State name, origin, age, and where you currently live.' : 'Indica tu nombre, país de origen y dónde resides.',
            taskPrompt: isEn ? 'Please tell me your name, where you are from, and what city you live in.' : 'Por favor dime tu nombre, de dónde eres y en qué ciudad vives.',
            criteria: 'Clear pronunciation of basic vowels, accurate present tense of "to be".'
          },
          {
            name: isEn ? 'Section 2: Daily Routine' : 'Sección 2: Rutina Diaria',
            description: isEn ? 'Mention 2-3 activities you do every morning.' : 'Menciona 2-3 actividades que haces cada mañana.',
            taskPrompt: isEn ? 'What do you typically do in the morning after waking up?' : '¿Qué haces normalmente por la mañana al despertar?',
            criteria: 'Basic present simple verbs (wake up, drink, eat, go).'
          }
        ]
      },
      {
        id: 'exam-cefr-a2',
        cefrLevel: 'A2',
        title: isEn ? 'CEFR A2 Routine Exchanges Exam' : 'Examen de Práctica CEFR A2: Intercambio Cotidiano',
        subtitle: isEn ? 'Simple routine tasks, past events, shopping, and immediate environment.' : 'Tareas rutinarias, eventos pasados sencillos, compras y entorno inmediato.',
        targetSkills: ['Past Simple Usage', 'Transactional Speech', 'Connected Phrases'],
        passingScore: 70,
        disclaimer,
        sections: [
          {
            name: isEn ? 'Section 1: Past Experience' : 'Sección 1: Experiencia Pasada',
            description: isEn ? 'Describe what you did last weekend.' : 'Describe qué hiciste el fin de semana pasado.',
            taskPrompt: isEn ? 'Tell me about what you did last weekend. Where did you go and who were you with?' : 'Cuéntame sobre tu fin de semana pasado: ¿adónde fuiste y con quién?',
            criteria: 'Past simple irregular verbs (went, saw, ate) and time markers.'
          },
          {
            name: isEn ? 'Section 2: Everyday Request' : 'Sección 2: Petición Cotidiana',
            description: isEn ? 'Ask for directions to the nearest pharmacy.' : 'Pregunta direcciones para llegar a la farmacia más cercana.',
            taskPrompt: isEn ? 'Imagine you are lost in town. Ask me politely how to get to the nearest pharmacy.' : 'Imagina que estás perdido. Pregúntame amablemente cómo llegar a la farmacia.',
            criteria: 'Polite question forms (Could you tell me, where is).'
          }
        ]
      },
      {
        id: 'exam-cefr-b1',
        cefrLevel: 'B1',
        title: isEn ? 'CEFR B1 Independent Spoken Exam' : 'Examen de Práctica CEFR B1: Hablante Independiente',
        subtitle: isEn ? 'Main points of familiar matters, travel disruptions, and expressing opinions.' : 'Puntos principales de temas familiares, imprevistos de viaje y opiniones.',
        targetSkills: ['Conversational Continuity', 'Reasoning & Opinions', 'Intermediate Lexicon'],
        passingScore: 70,
        disclaimer,
        sections: [
          {
            name: isEn ? 'Section 1: Explaining a Goal' : 'Sección 1: Explicar una Meta',
            description: isEn ? 'Explain why you are studying English and your future plans.' : 'Explica por qué estudias inglés y tus planes futuros.',
            taskPrompt: isEn ? 'Why is mastering American English important for your personal or career goals? What are your plans for the next two years?' : '¿Por qué es importante dominar inglés americano para tus metas y cuáles son tus planes para los próximos 2 años?',
            criteria: 'Future forms (will, going to), connectors (because, so that, although).'
          },
          {
            name: isEn ? 'Section 2: Resolving a Practical Issue' : 'Sección 2: Resolver un Problema Práctico',
            description: isEn ? 'Explain an incorrect restaurant bill politely.' : 'Explica cortésmente un error en la cuenta de un restaurante.',
            taskPrompt: isEn ? 'You received a bill with two items you did not order. Explain the issue to the manager and request a corrected total.' : 'Recibiste una cuenta con dos platillos no ordenados. Explícaselo al gerente con educación.',
            criteria: 'Diplomatic phrasing, clear problem definition without aggression.'
          }
        ]
      },
      {
        id: 'exam-cefr-b2',
        cefrLevel: 'B2',
        title: isEn ? 'CEFR B2 Spoken Fluency & Professional Exam' : 'Examen de Práctica CEFR B2: Fluidez Profesional',
        subtitle: isEn ? 'Complex ideas, abstract topics, professional arguments, and STAR answers.' : 'Ideas complejas, temas abstractos, argumentación profesional y método STAR.',
        targetSkills: ['Speech Cadence', 'STAR Structure', 'Nuanced Lexicon', 'Grammatical Precision'],
        passingScore: 72,
        disclaimer,
        sections: [
          {
            name: isEn ? 'Section 1: Behavioral Problem Solving' : 'Sección 1: Resolución Conductual de Problemas',
            description: isEn ? 'Answer a professional challenge using STAR framework.' : 'Responde un desafío laboral usando la estructura STAR.',
            taskPrompt: isEn ? 'Describe a situation where you had to manage a difficult stakeholder or team member. What was the conflict, how did you intervene, and what measurable result was achieved?' : 'Describe una situación donde manejaste un conflicto laboral. ¿Cuál fue el reto, qué acción tomaste y qué resultado medible lograste?',
            criteria: 'Clear Situation, Task, Action, Result with quantifiable impact.'
          },
          {
            name: isEn ? 'Section 2: Social Debate & Counter-Arguments' : 'Sección 2: Debate y Contraargumentación',
            description: isEn ? 'Express and defend your viewpoint on remote work versus office culture.' : 'Defiende tu postura sobre trabajo remoto versus presencial.',
            taskPrompt: isEn ? 'Do you believe remote work enhances productivity or harms team collaboration? Provide balanced arguments supporting your position.' : '¿El trabajo remoto mejora la productividad o perjudica la colaboración? Brinda argumentos sólidos.',
            criteria: 'Discourse markers (on one hand, furthermore, nonetheless, fundamentally).'
          }
        ]
      },
      {
        id: 'exam-cefr-c1',
        cefrLevel: 'C1',
        title: isEn ? 'CEFR C1 Advanced Spoken Proficiency Exam' : 'Examen de Práctica CEFR C1: Dominio Avanzado',
        subtitle: isEn ? 'Flexible, spontaneous language across demanding professional and academic contexts.' : 'Uso flexible y espontáneo en contextos profesionales y académicos exigentes.',
        targetSkills: ['Spontaneous Cadence', 'Idiomatic Precision', 'Complex Subordination'],
        passingScore: 75,
        disclaimer,
        sections: [
          {
            name: isEn ? 'Section 1: Abstract Analysis' : 'Sección 1: Análisis Abstracto',
            description: isEn ? 'Analyze technological disruption in your industry.' : 'Analiza el impacto tecnológico en tu industria.',
            taskPrompt: isEn ? 'Examine how artificial intelligence is reshaping professional workflows in your field. Address both ethical risks and strategic efficiencies.' : 'Examina cómo la inteligencia artificial transforma tu campo profesional, abordando riesgos éticos y eficiencias estratégicas.',
            criteria: 'High-level academic/executive vocabulary, seamless subordination.'
          }
        ]
      }
    ];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. CAPSTONE SIMULATIONS REPOSITORY
  // ─────────────────────────────────────────────────────────────────────────────
  public getCapstones(lang: 'EN' | 'ES' = 'EN'): CapstoneSimulation[] {
    const isEn = lang === 'EN';
    return [
      {
        id: 'capstone-1-travel',
        title: isEn ? 'Capstone 1: Complete International Travel Experience' : 'Capstone 1: Experiencia Integral de Viaje a EE.UU.',
        subtitle: isEn ? 'End-to-end journey: Airport check-in → CBP border control → Cab ride → Hotel check-in → Resolving lost luggage.' : 'Recorrido completo: Check-in → Aduana CBP → Taxi → Hotel → Reclamar maleta perdida.',
        cefrLevel: 'B1',
        summary: isEn
          ? 'Test your real-world communication by navigating 5 connected travel scenarios in authentic American English without slipping into Spanish.'
          : 'Pon a prueba tu inglés resolviendo 5 situaciones de viaje consecutivas sin recurrir al español.',
        checkpoints: [
          {
            id: 'cp1-airport',
            stageNumber: 1,
            title: isEn ? 'JFK Check-In Counter' : 'Mostrador en JFK',
            situation: isEn ? 'Check in for your domestic connection and weigh your luggage.' : 'Haz check-in para tu conexión nacional y pesa tu maleta.',
            voyagerRole: isEn ? 'Delta Gate Attendant' : 'Agente de Aerolínea',
            objective: isEn ? 'Confirm your ticket and obtain boarding pass.' : 'Confirmar boleto y obtener pase.',
            successCondition: 'Pass boarding verification'
          },
          {
            id: 'cp1-cbp',
            stageNumber: 2,
            title: isEn ? 'CBP Passport Control' : 'Control de Pasaportes CBP',
            situation: isEn ? 'Answer border officer questions regarding visit purpose and hotel address.' : 'Responde al oficial sobre motivo de viaje y dirección de hotel.',
            voyagerRole: isEn ? 'Customs Officer Miller' : 'Oficial de Aduana Miller',
            objective: isEn ? 'Clarify vacation stay and verify no prohibited goods.' : 'Aclarar estancia y confirmar ausencia de artículos prohibidos.',
            successCondition: 'Pass immigration inspection'
          },
          {
            id: 'cp1-taxi',
            stageNumber: 3,
            title: isEn ? 'Airport Taxi Pickup' : 'Taxi del Aeropuerto',
            situation: isEn ? 'Request ride to Midtown hotel and ask about travel time with traffic.' : 'Solicita viaje a tu hotel y consulta tiempo estimado con tráfico.',
            voyagerRole: isEn ? 'NYC Cab Driver' : 'Conductor de Taxi de NY',
            objective: isEn ? 'Provide destination address and ask for fare estimate.' : 'Dar dirección y acordar tarifa.',
            successCondition: 'Arrive at destination'
          },
          {
            id: 'cp1-hotel',
            stageNumber: 4,
            title: isEn ? 'Hotel Check-In' : 'Recepción del Hotel',
            situation: isEn ? 'Present confirmation and ask for breakfast hours and high floor.' : 'Presenta confirmación y pide piso alto y horarios de desayuno.',
            voyagerRole: isEn ? 'Hotel Receptionist' : 'Recepcionista del Hotel',
            objective: isEn ? 'Obtain keycard and verify Wi-Fi credentials.' : 'Obtener tarjeta llave y datos de Wi-Fi.',
            successCondition: 'Receive room key'
          },
          {
            id: 'cp1-lostbag',
            stageNumber: 5,
            title: isEn ? 'Resolving Delayed Luggage' : 'Reclamo de Equipaje Demorado',
            situation: isEn ? 'One bag did not arrive on the carousel. File a claim politely with baggage service.' : 'Una maleta no llegó. Tramita el reclamo cortésmente con servicio al cliente.',
            voyagerRole: isEn ? 'Baggage Claim Agent' : 'Agente de Reclamo de Equipaje',
            objective: isEn ? 'Describe bag appearance, provide delivery address, and get claim number.' : 'Describir maleta, dar dirección de entrega y recibir número de reclamo.',
            successCondition: 'Receive claim filing'
          }
        ],
        finalMilestone: isEn ? 'Certified Voyager International Traveler' : 'Viajero Internacional Certificado'
      },
      {
        id: 'capstone-2-interview',
        title: isEn ? 'Capstone 2: Comprehensive Professional Hiring Simulation' : 'Capstone 2: Simulación Integral de Contratación Laboral',
        subtitle: isEn ? 'Full hiring pipeline: Professional greeting → STAR conflict resolution → Compensation negotiation.' : 'Proceso de selección completo: Saludo profesional → Conflicto STAR → Negociación.',
        cefrLevel: 'B2',
        summary: isEn
          ? 'Complete a high-stakes 3-stage American executive hiring assessment demonstrating technical fluency, composure, and diplomacy.'
          : 'Supera una evaluación ejecutiva de 3 etapas demostrando fluidez técnica, compostura y diplomacia.',
        checkpoints: [
          {
            id: 'cp2-intro',
            stageNumber: 1,
            title: isEn ? 'Executive Elevator Pitch' : 'Presentación Ejecutiva',
            situation: isEn ? 'Walk the committee through your background in under 2 minutes.' : 'Resume tu trayectoria profesional en menos de 2 minutos.',
            voyagerRole: isEn ? 'VP of Human Resources' : 'Vicepresidente de Recursos Humanos',
            objective: isEn ? 'Articulate your core value proposition and career trajectory.' : 'Explicar tu propuesta de valor y trayectoria.',
            successCondition: 'Pitch accepted'
          },
          {
            id: 'cp2-star',
            stageNumber: 2,
            title: isEn ? 'Behavioral STAR Deep-Dive' : 'Caso Práctico STAR',
            situation: isEn ? 'Detail a time you turned around a failing project with quantitative metrics.' : 'Detalla cómo salvaste un proyecto en crisis con métricas concretas.',
            voyagerRole: isEn ? 'Lead Engineering Director' : 'Director de Ingeniería',
            objective: isEn ? 'Provide Situation, Task, Action, and quantifiable Result.' : 'Estructurar Situación, Tarea, Acción y Resultado cuantificado.',
            successCondition: 'Demonstrate STAR competency'
          },
          {
            id: 'cp2-negotiation',
            stageNumber: 3,
            title: isEn ? 'Offer Terms & Alignment' : 'Términos de Oferta y Cierre',
            situation: isEn ? 'Discuss flexible work arrangement and ask two insightful questions about team culture.' : 'Negocia trabajo remoto y haz dos preguntas estratégicas sobre el equipo.',
            voyagerRole: isEn ? 'Hiring Executive' : 'Ejecutivo de Contratación',
            objective: isEn ? 'Advocate for your preferences assertively without being confrontational.' : 'Defender tus preferencias con asertividad y elegancia.',
            successCondition: 'Offer terms agreed'
          }
        ],
        finalMilestone: isEn ? 'Master Professional Communicator' : 'Comunicador Profesional Certificado'
      },
      {
        id: 'capstone-3-life',
        title: isEn ? 'Capstone 3: Navigating American Everyday Life' : 'Capstone 3: Vida Cotidiana en los Estados Unidos',
        subtitle: isEn ? 'Living in the US: Clinic appointment → Landlord maintenance dispute → Bank checking account.' : 'Vivir en EE.UU.: Cita médica → Reporte de avería al arrendador → Apertura de cuenta bancaria.',
        cefrLevel: 'B1',
        summary: isEn
          ? 'Demonstrate day-to-day self-sufficiency across essential US civic, residential, and healthcare institutions.'
          : 'Demuestra autosuficiencia en gestiones cotidianas ante instituciones cívicas, médicas y bancarias.',
        checkpoints: [
          {
            id: 'cp3-clinic',
            stageNumber: 1,
            title: isEn ? 'Clinic Appointment' : 'Consulta Médica',
            situation: isEn ? 'Describe persistent pain and understand prescription directions.' : 'Describe un dolor persistente y comprende las indicaciones médicas.',
            voyagerRole: isEn ? 'Family Physician' : 'Médico de Familia',
            objective: isEn ? 'Describe symptoms and verify dosage schedule.' : 'Describir síntomas y verificar dosis.',
            successCondition: 'Prescription understood'
          },
          {
            id: 'cp3-landlord',
            stageNumber: 2,
            title: isEn ? 'Apartment Maintenance Dispute' : 'Reclamo al Propietario',
            situation: isEn ? 'Call property manager to urgently resolve a broken water heater.' : 'Llama al administrador para resolver con urgencia una avería del calentador.',
            voyagerRole: isEn ? 'Property Manager' : 'Administrador del Edificio',
            objective: isEn ? 'Clearly explain the issue and schedule technician entry.' : 'Explicar la avería y coordinar visita del técnico.',
            successCondition: 'Technician scheduled'
          },
          {
            id: 'cp3-bank',
            stageNumber: 3,
            title: isEn ? 'Opening a US Bank Account' : 'Apertura de Cuenta Bancaria',
            situation: isEn ? 'Open checking account, understand monthly maintenance waivers, and order debit card.' : 'Abre cuenta de cheques, consulta exención de comisiones y solicita tarjeta.',
            voyagerRole: isEn ? 'Bank Personal Banker' : 'Ejecutivo de Cuentas Bancarias',
            objective: isEn ? 'Verify required documentation and direct deposit benefits.' : 'Confirmar documentos y depósitos directos.',
            successCondition: 'Account opened'
          }
        ],
        finalMilestone: isEn ? 'Independent US Resident Communicator' : 'Residente Independiente Certificado'
      }
    ];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. ACTIVE SESSION CONTROLS (START, PAUSE, RESUME, REPEAT, END)
  // ─────────────────────────────────────────────────────────────────────────────
  public startSession(
    scenarioId: string,
    type: 'SCENARIO' | 'EXAM' | 'CAPSTONE',
    title: string,
    cefrLevel: string,
    totalCheckpoints: number = 1
  ): ActiveSimulationSession {
    const session: ActiveSimulationSession = {
      scenarioId,
      type,
      title,
      cefrLevel,
      status: 'ACTIVE',
      currentCheckpointIndex: 0,
      totalCheckpoints,
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      userTurns: 0
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_SIM, JSON.stringify(session));
      window.dispatchEvent(new CustomEvent('voyager_simulation_state_changed', { detail: session }));
    }
    return session;
  }

  public getActiveSession(): ActiveSimulationSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_ACTIVE_SIM);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  public pauseSession(): void {
    const current = this.getActiveSession();
    if (!current) return;
    current.status = 'PAUSED';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_SIM, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('voyager_simulation_state_changed', { detail: current }));
    }
  }

  public resumeSession(): void {
    const current = this.getActiveSession();
    if (!current) return;
    current.status = 'ACTIVE';
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_SIM, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('voyager_simulation_state_changed', { detail: current }));
    }
  }

  public advanceCheckpoint(): void {
    const current = this.getActiveSession();
    if (!current) return;
    current.currentCheckpointIndex = Math.min(current.totalCheckpoints - 1, current.currentCheckpointIndex + 1);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ACTIVE_SIM, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('voyager_simulation_state_changed', { detail: current }));
    }
  }

  public endSession(
    numericalScore: number = 85,
    chatMessages: { sender: string; text: string }[] = [],
    durationSeconds: number = 600,
    lang: 'EN' | 'ES' = 'EN'
  ): LessonEvaluationRecord {
    const current = this.getActiveSession();
    const isEn = lang === 'EN';
    const studentId = auth.currentUser?.uid || 'STU-001';

    const letterInfo = scoreToLetterGrade(numericalScore);

    const record: LessonEvaluationRecord = {
      id: `sim_eval_${Date.now()}`,
      studentId,
      lessonId: current?.scenarioId || 'scenario_session',
      lessonTitle: current?.title || (isEn ? 'Real-World English Simulation' : 'Simulación de Inglés Real'),
      category: current?.type === 'EXAM' ? 'CEFR Mock Exam' : current?.type === 'CAPSTONE' ? 'Capstone Simulation' : 'Real-World Scenario',
      level: current?.cefrLevel || 'B1',
      attemptNumber: 1,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      durationSeconds: Math.max(120, durationSeconds),
      numericalScore,
      score: numericalScore,
      letterGrade: letterInfo.grade,
      grade: letterInfo.grade,
      passed: letterInfo.passed,
      resultLabel: isEn ? letterInfo.resultLabelEn : letterInfo.resultLabelEs,
      criteriaScores: {
        grammar: Math.min(100, Math.round(numericalScore + (Math.random() * 4 - 2))),
        pronunciation: Math.min(100, Math.round(numericalScore - 2)),
        fluency: Math.min(100, Math.round(numericalScore)),
        vocabulary: Math.min(100, Math.round(numericalScore + 3)),
        comprehension: Math.min(100, Math.round(numericalScore + 4)),
        objectiveCompletion: Math.min(100, Math.round(numericalScore + 2)),
        objective: Math.min(100, Math.round(numericalScore + 2))
      },
      explanation: isEn
        ? `Successfully demonstrated situational communication in "${current?.title || 'Scenario'}" with an overall evaluation score of ${numericalScore}% (${letterInfo.grade}).`
        : `Demostró exitosamente comunicación situacional en "${current?.title || 'Escenario'}" con una calificación de ${numericalScore}% (${letterInfo.grade}).`,
      strengths: [
        isEn ? 'Accurate context vocabulary in dialogue' : 'Uso de vocabulario contextual apropiado',
        isEn ? 'Polite, natural American conversational cadence' : 'Cadencia conversacional cortés y natural'
      ],
      areasToImprove: [
        isEn ? 'Continue practicing consonant liaisons in multi-sentence turns' : 'Continuar practicando enlaces consonánticos en frases complejas'
      ],
      recommendations: [
        isEn ? 'Practice related professional conversations to build long-term retention' : 'Practicar conversaciones afines para consolidar la retención a largo plazo'
      ]
    };

    // Save to LessonGradingSystem (which updates progress and notifies teachers)
    saveLessonEvaluationRecord(record);

    // Save to scenario attempts repository
    this.saveScenarioRecord(record);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_ACTIVE_SIM);
      window.dispatchEvent(new CustomEvent('voyager_simulation_state_changed', { detail: null }));
      window.dispatchEvent(new CustomEvent('voyager_scenario_completed', { detail: record }));
    }

    return record;
  }

  private saveScenarioRecord(record: LessonEvaluationRecord): void {
    if (typeof window === 'undefined') return;
    try {
      const existingRaw = localStorage.getItem(STORAGE_SCENARIO_RESULTS);
      const existing: LessonEvaluationRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [record, ...existing.filter(r => r.id !== record.id)];
      localStorage.setItem(STORAGE_SCENARIO_RESULTS, JSON.stringify(updated.slice(0, 50)));

      // Sync to Firestore
      const uid = auth.currentUser?.uid;
      if (uid && !isFirestoreQuotaExceeded()) {
        const docRef = doc(db, 'users', uid, 'scenarios', record.id);
        withTimeout(setDoc(docRef, record, { merge: true }), 3000).catch(err => {
          handleFirestoreWriteError(err, 'scenario attempt');
        });
      }
    } catch (e) {
      console.warn('Failed to save scenario record:', e);
    }
  }

  public getStoredScenarioRecords(): LessonEvaluationRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_SCENARIO_RESULTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }
}

export const simulationScenariosEngine = new SimulationScenariosEngine();
