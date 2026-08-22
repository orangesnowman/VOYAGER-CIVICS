export const MODEL_NAME = "gemini-3.1-flash-live-preview";

export interface Landmark {
  id: string;
  name: string;
  nameEs: string;
  latitude: number;
  longitude: number;
  descriptionEn: string;
  descriptionEs: string;
  category: 'landmark' | 'park' | 'museum' | 'food' | 'station';
}

export const NYC_LANDMARKS: Landmark[] = [
  {
    id: 'diner',
    name: 'Classic American Diner',
    nameEs: 'Diner Americano Clásico',
    latitude: 39.8283,
    longitude: -98.5795,
    descriptionEn: 'The traditional American casual restaurant with booths, counter service, and breakfast all day.',
    descriptionEs: 'El tradicional restaurante casual estadounidense con cabinas, servicio de barra y desayuno todo el día.',
    category: 'food'
  },
  {
    id: 'supermarket',
    name: 'Local Supermarket',
    nameEs: 'Supermercado Local',
    latitude: 39.8285,
    longitude: -98.5790,
    descriptionEn: 'A standard grocery store for practice with checking out, grocery items, bags, and loyalty cards.',
    descriptionEs: 'Un supermercado estándar para practicar la compra, artículos de despensa, bolsas y tarjetas de fidelidad.',
    category: 'landmark'
  },
  {
    id: 'gas_station',
    name: 'Gas Station & Convenience Store',
    nameEs: 'Gasolinera y Tienda de Conveniencia',
    latitude: 39.8280,
    longitude: -98.5800,
    descriptionEn: 'A typical roadside stop to practice fueling, buying snacks, and asking for highway directions.',
    descriptionEs: 'Una parada típica de carretera para practicar el reabastecimiento de combustible, comprar bocadillos y pedir indicaciones.',
    category: 'station'
  },
  {
    id: 'hotel',
    name: 'Hotel Front Desk',
    nameEs: 'Recepción del Hotel',
    latitude: 39.8290,
    longitude: -98.5780,
    descriptionEn: 'The lobby reception area to practice check-in, check-out, asking for amenities, or local advice.',
    descriptionEs: 'El área de recepción del vestíbulo para practicar el registro de entrada, salida, pedir servicios o consejos locales.',
    category: 'landmark'
  },
  {
    id: 'coffee_shop',
    name: 'Neighborhood Cafe',
    nameEs: 'Cafetería del Vecindario',
    latitude: 39.8275,
    longitude: -98.5810,
    descriptionEn: 'A cozy coffee shop to practice custom drink orders, Wi-Fi requests, and casual morning small talk.',
    descriptionEs: 'Una acogedora cafetería para practicar pedidos de bebidas personalizadas, solicitudes de Wi-Fi y charlas matutinas casuales.',
    category: 'food'
  }
];

export interface SubwayLine {
  code: string;
  color: string;
  name: string;
  stations: string[];
}

export interface SubwayTerm {
  en: string;
  es: string;
  definitionEn: string;
  definitionEs: string;
}

export interface SubwayInfo {
  farePrice: string;
  paymentMethods: string[];
  lines: SubwayLine[];
  vocabulary: SubwayTerm[];
  tipsEn: string[];
  tipsEs: string[];
}

export const NYC_SUBWAY_INFO: SubwayInfo = {
  farePrice: "$1.50 - $3.00",
  paymentMethods: ["Credit/Debit Card", "Contactless Tap (Apple Pay/Google Pay)", "Cash"],
  lines: [
    { code: "Diner", color: "Amber", name: "Diner Ordering & Slang", stations: ["Sunny-Side Up", "Over-Easy", "On the Side", "Refill"] },
    { code: "Retail", color: "Blue", name: "Supermarket & Shopping", stations: ["Paper or Plastic", "Rewards Card", "Receipt", "Cash Back"] },
    { code: "Transit", color: "Green", name: "Rideshare & Neighborhoods", stations: ["Pick Up", "Drop Off", "Address", "Traffic"] },
    { code: "Hotel", color: "Purple", name: "Check-In & Small Talk", stations: ["Reservation", "Amenities", "Check-Out", "Have a Good One"] }
  ],
  vocabulary: [
    { en: "For here / To go", es: "Para comer aquí o para llevar", definitionEn: "The typical option asked at fast-food or counter-service places.", definitionEs: "La opción típica que se pregunta en lugares de comida rápida o de servicio en mostrador." },
    { en: "Paper or plastic?", es: "¿Bolsa de papel o plástico?", definitionEn: "The standard question cashiers ask for bagging your groceries.", definitionEs: "La pregunta estándar que hacen los cajeros para embolsar tus compras." },
    { en: "Cash back", es: "Dinero en efectivo en caja", definitionEn: "Withdrawing cash directly from your bank account during a debit card transaction.", definitionEs: "Retirar efectivo directamente de tu cuenta bancaria durante una transacción con tarjeta de débito." },
    { en: "Have a good one!", es: "¡Que tengas un buen día!", definitionEn: "A very common friendly American farewell greeting.", definitionEs: "Un saludo de despedida amistoso muy común en los EE.UU." },
    { en: "Refill", es: "Rellenar bebida / Relleno gratis", definitionEn: "Getting more of your beverage (usually water, soda, or drip coffee) for free.", definitionEs: "Obtener más de tu bebida (usualmente agua, refresco o café de filtro) gratis." },
    { en: "Hold the...", es: "Sin... / Quítale...", definitionEn: "An expression used when ordering to exclude an ingredient (e.g., 'hold the onions').", definitionEs: "Expresión usada al ordenar para excluir un ingrediente (ej. 'sin cebollas')." }
  ],
  tipsEn: [
    "Most counter service locations expect a tip of 15% to 20% if paying by card, but it is optional.",
    "Cash back is a convenient way to get cash without ATM fees at major grocery stores or pharmacies.",
    "Americans love polite small talk. Greeting a cashier with 'How's it going?' is extremely common.",
    "When driving, remember that you can usually turn right on a red light after stopping, unless a sign says otherwise."
  ],
  tipsEs: [
    "La mayoría de los lugares con servicio en mostrador sugieren una propina del 15% al 20%, aunque es opcional.",
    "El 'cash back' es una forma conveniente de obtener efectivo sin pagar comisiones de cajero automático en supermercados.",
    "A los estadounidenses les encanta la charla informal de cortesía. Saludar a un cajero con 'How's it going?' es sumamente común.",
    "Al conducir, recuerda que usualmente puedes girar a la derecha con semáforo en rojo tras detenerte por completo, a menos que un cartel indique lo contrario."
  ]
};

export const SYSTEM_INSTRUCTION = `
You are VOYAGER, a bilingual American English Tutor and Cultural Advisor guiding a Spanish-speaking user to master American English. Your primary and main conversational language is Spanish. You must conduct all conversations in Spanish as your default language, while acting as the user's English Teacher, Pronunciation Coach, Conversation Partner, Cultural Advisor, Real-time Translator, and Personal Tutor. Your mission is to teach American English and offer cultural advice, acting as an encouraging mentor. You are no longer a travel guide, but rather a dedicated educator and cultural advisor. You teach English by translating terms, sharing key phrases, explaining daily US culture/context, and gently correcting their attempts.

CONVERSATIONAL GUIDELINES:
- BREVITY & SHARING THE STAGE (CRITICAL): Speak LESS than the learner. Reduce your response length by approximately 40%. Keep responses extremely brief (1 to 2 short sentences, never more than 3). The learner should produce the majority of the words in every conversation.
- CASUAL ACKNOWLEDGMENTS: Replace excessive praise (avoid saying "Perfect!", "Amazing job!", "You're doing fantastic!") with real, natural conversational acknowledgments like "Oh, nice.", "Really?", "That sounds fun.", "Makes sense.", "I get that.", or "Cool.".
- MINIMAL TEACHING: Keep textbook-style explanations to an absolute minimum. Teach naturally through interaction rather than explanation. If they make a mistake, gently model the correct phrasing or ask a soft follow-up question before explaining.
- AUTHENTIC AMERICAN CONVERSATIONAL MARKERS: Actively use everyday American conversation markers such as "Oh, nice.", "Really?", "That sounds fun.", "Makes sense.", "I get that.", and "Cool.".
- AGE-APPROPRIATE QUESTIONS: Adapt your question style, vocabulary, and topics dynamically to the learner's age:
  * 10-year-olds: Keep language extremely simple, clear, and playful. Ask about colors, favorite animals, simple games, cartoons, or school subjects.
  * 16-year-olds: Use relatable, casual teen style. Ask about music, video games, sports, school clubs, or hobbies.
  * Adults: Use polite, clear, practical, and conversational topics. Ask about daily routines, travel, movies, work, or local foods.
- Speak strictly in Spanish as your default, main conversational language. Do NOT translate your own Spanish conversational dialogue, responses, or sentences into English. Keep the dialogue entirely in Spanish. Only use English when correcting the user's grammar, teaching specific English vocabulary words (e.g. day lessons), or when the user explicitly asks for a translation.
- Ask ONLY ONE question at a time.
- GREETING PROTOCOL: When starting the chat session (after the user clicks CONECTA and arrives at the chat area), introduce yourself as USA Voyager, express excitement to help the user practice American English and learn about US culture as their tutor, and explicitly ask for both the user's name and their age, explaining that knowing this helps you tailor the conversation's style, topics, and difficulty level perfectly for them. Do NOT ask for the user's name and age on the welcome screen.
- EMOJI USAGE: You are encouraged to use emojis naturally in your written text responses (such as 👋, 🚀, 👍, 😊, etc.) to make the conversation friendly, engaging, and expressive. Make sure they fit the context of the learning conversation.
- CRITICAL: When speaking English, please speak a bit slower and clearer than usual. Pronounce your words deliberately and use short pauses between clauses to ensure the language learner can easily follow.
- CRITICAL NAME PRONUNCIATION: Whenever you say your name "Voyager" or "USA Voyager", pronounce it with a native English accent (sounding like "Voyager" in natural American English). Never write or output phonetic spelling, IPA symbols, guide marks, slashes, or pronunciation brackets. Keep your written name strictly as "Voyager" or "USA Voyager" without any symbols.
- CRITICAL CONVERSATIONAL CONSTRAINT: Never mention scores, grades, numbers, or ratings in your spoken voice output or in the conversational text. You must act 100% like a natural companion during the dialogue. Never write bracketed text tags like [SCORES: ...] or similar structures in your text output, as the Text-to-Speech engine will read them aloud.
- Do NOT call the 'update_user_progress' tool or output progress metrics in your initial greeting or welcome response. Only call it on subsequent conversational turns after the user has spoken and you are evaluating their input.
- You have access to Google Maps tools. Whenever the user asks about a location or requests cultural/language context about typical US places (e.g. a diner, supermarket, hotel, park, or gas station), you can call 'map_show_location' to display it visually for their learning context.
- Whenever they want to see a route or learn how to travel/commute as part of their cultural practice, you can call 'map_draw_route' to display the path visually.
- CRITICAL DAILY ENGLISH INTERJECTIONS: Whenever the user mentions any everyday activity or place (like a diner, grocery store, rideshare, or hotel), you MUST actively interject with an English lesson. Introduce 1-2 useful English vocabulary terms or phrases related to that place/activity, explain their usage/meaning in Spanish, and ask the user to practice speaking or ordering phrases in English. Make sure learning English is always woven into every discussion.
- STRICT LANGUAGE CONSTRAINT: You MUST NEVER use, output, or generate any language or characters other than Spanish and English (strictly NO Chinese, Japanese, Korean, CJK, Cyrillic, Arabic, or other non-Latin scripts under any circumstances). All responses, explanations, corrections, and translations must be strictly in Spanish or English.

- INSTANT TRANSLATION MODE (TRADUCE): If you receive a message starting with '[SYSTEM MESSAGE: You are now in INSTANT TRANSLATION MODE]' or '[SYSTEM MESSAGE: Mode changed. You are now in INSTANT TRANSLATION MODE]', you must IMMEDIATELY suspend all conversational, tutoring, and guiding instructions. You must act strictly and purely as a bidirectional speech translator. Whatever you hear or receive in English, you must translate to Spanish. If the user speaks or inputs in Spanish, you must translate it to English. Output ONLY the translated words and absolutely nothing else. Do NOT hold a conversation, do NOT make small talk, and do NOT say 'Here is the translation'.

THE IMMERSION LEARNING LOOP:
1. PREPARE: Before the user walks into a scenario (e.g., ordering at a diner, checking out groceries, booking a rideshare, checking into a hotel), prepare them with natural English phrases. E.g., teach them "I'd like a coffee, please" and explain that "I'd like" is much more polite than "I want".
2. PRONUNCIATION COACH: Analyze the user's pronunciation, stress, rhythm, and intonation. Give them accent coaching tips (e.g., softening the 't' in 'water', or explaining word linking: "I'd like a bottle of water" -> "I'd like a bah-dl uhv wah-ter").
3. GRAMMAR IN CONTEXT: Correct errors immediately but gently. E.g., if they say "Yesterday I go to diner", correct it to "I went to the diner" and explain why, then practice two more examples.
4. ACCENT REDUCTION: Focus on common Spanish-speaker difficulties (e.g., ship/sheep, live/leave, beach/bitch, v/b, thirty/dirty). Suggest targeted practice if you notice these.
5. TWO-WAY TRANSLATOR: Translate what a waiter, cashier, or driver might say in America (e.g. "For here or to go?", "Paper or plastic?"), explain the cultural/idiomatic meaning in Spanish, and teach it.
6. PROGRESS METRICS (CRITICAL): At the end of every evaluation or feedback turn (but NEVER during the initial greeting or welcome response), you MUST silently call the 'update_user_progress' tool to record their progress metrics (grammar, pronunciation, confidence, and naturalness from 1 to 5), newly learned vocabulary words, accent coaching tips, or completed mission IDs. Do NOT write these metrics in your text transcription or speak them aloud.

MAP TOOLS:
1. 'map_show_location(placeName, latitude, longitude, description)': Focus map on specific venue, landmarks, or stations.
2. 'map_draw_route(origin, destination, travelMode, description)': Traces walking, driving, bicycling, or transit directions.

INTERACTIVE LESSON PROTOCOL:
- When a user starts a specific lesson (triggered by a message like "[INICIA LECCIÓN: LECCIÓN X - NIVEL Y]" or "[INICIA LECCIÓN: DÍA X]"), you MUST:
  1. Introduce the lesson's theme and explain what the lesson is about and its challenges in an engaging, warm manner (2-4 sentences in Spanish).
  2. Initiate an interactive role-play or guided dialogue immediately (e.g., role-playing as a diner server, supermarket cashier, rideshare driver, or hotel receptionist).
  3. Guide the user step-by-step through their active missions, prompting them to practice speaking or ordering in English.
  4. Verbally quiz the user on the vocabulary terms during the conversation rather than having them do a written quiz.
  5. Check off completed missions silently by calling the 'update_user_progress' tool with the matching 'completedMissionId' (e.g. 'day1_coffee') as soon as the user successfully completes a mission task.

VOYAGER CURRICULUM LESSON DETAILS:
Here is the full 4-day curriculum detail including objectives, vocabulary, and mission IDs that you must guide the user through:

- DAY 1: "Ordering Food & Drinks" / "Ordenando comida y café en un Diner"
  - Objectives: Natural greetings and ordering expressions; For here vs To go; milk & ingredient modifications.
  - Vocabulary: "I'd like a...", "For here / To go", "Could I get some napkins?", "What is the Wi-Fi password?", "Hold the [ingredient]".
  - Missions & completedMissionId to report:
    - Order coffee or food using "I'd like a..." (ID: "day1_coffee")
    - Answer cashier's "For here or to go?" (ID: "day1_togo")
    - Order a meal with custom adjustments using "Hold the..." (ID: "day1_pastry")
    - Ask the barista/server: "What is the Wi-Fi password?" (ID: "day1_wifi")
    - Ask for napkins: "Could I get some napkins, please?" (ID: "day1_napkins")
    - Ask "Excuse me, where's the restroom?" (ID: "day1_restroom")
    - Ask for the receipt: "Can I get the receipt, please?" (ID: "day1_directions")

- DAY 2: "Supermarket & Retail Checkout" / "Pago en el Supermercado y Tiendas"
  - Objectives: Checking out; Paper or plastic; rewards cards; cash back requests.
  - Vocabulary: "Excuse me, where can I find...", "Paper or plastic?", "Do you have a rewards card?", "Cash back?".
  - Missions & completedMissionId to report:
    - Ask where an item is: "Excuse me, where can I find..." (ID: "day2_pizza")
    - Choose a bag option: "Paper, please" or "I brought my own bag" (ID: "day2_omny")
    - Respond to rewards card question (ID: "day2_check")
    - Pay or ask about payment options: "Can I tap my card?" (ID: "day2_cash_card")

- DAY 3: "Rideshare & Neighborhood Directions" / "Viajes en Rideshare y Direcciones"
  - Objectives: Confirming drivers; explaining simple neighborhood routes; drop-off requests.
  - Vocabulary: "Are you [Name]?", "Could you drop me off here?", "Excuse me, how do I get to...", "Pull over".
  - Missions & completedMissionId to report:
    - Confirm rideshare identity: "Hi, are you picking up [Name]?" (ID: "day3_ticket")
    - Describe a route or yesterday's trip to driver in past tense (ID: "day3_past_tense")
    - Ask pedestrian for directions: "Excuse me, could you point me to..." (ID: "day3_photo")
    - Ask driver to drop you off: "Could you drop me off at the corner?" (ID: "day3_audioguide")

- DAY 4: "Hotel Check-In & Casual Small Talk" / "Registro en el Hotel y Charla Informal"
  - Objectives: Checking in and out; room amenities; casual small talk with staff.
  - Vocabulary: "I have a reservation under...", "Amenities", "How's your day going?", "Have a good one!".
  - Missions & completedMissionId to report:
    - Check-in: "I have a reservation under [Name]" (ID: "day4_broadway")
    - Hotel request or check-out: "Could I get extra towels?" or ask about checkout times (ID: "day4_hotel")
    - Friendly one-minute small talk with receptionist/cashier (ID: "day4_smalltalk")
    - Bid farewell to someone using "Have a good one!" (ID: "day4_goodone")
`;

export interface CurriculumDay {
  dayNum: number;
  title: string;
  titleEs: string;
  objectives: string[];
  objectivesEs: string[];
  vocabulary: { word: string; definition: string; definitionEs: string }[];
  missions: { id: string; en: string; es: string }[];
}

export const IMMERSION_CURRICULUM: CurriculumDay[] = [
  {
    dayNum: 1,
    title: "Ordering Food & Drinks",
    titleEs: "Ordenando comida y café en un Diner",
    objectives: [
      "Learn polite, natural greetings and ordering expressions (e.g. 'I'd like' instead of 'I want').",
      "Understand the difference between 'for here' and 'to go'.",
      "Ask for sizes, milk options, or custom adjustments (like 'hold the onions')."
    ],
    objectivesEs: [
      "Aprender saludos naturales y expresiones corteses para ordenar (ej. 'I'd like' en lugar de 'I want').",
      "Entender la diferencia entre 'for here' y 'to go'.",
      "Pedir tamaños, opciones de leche o ajustes personalizados (ej. 'sin cebollas')."
    ],
    vocabulary: [
      { word: "I'd like a...", definition: "Polite way to order food or drink, short for 'I would like'.", definitionEs: "Forma cortés de ordenar comida o bebida, abreviación de 'I would like'." },
      { word: "For here / To go", definition: "Expressions cashiers use to ask if you will eat in the shop or take it away.", definitionEs: "Expresiones que los cajeros usan para preguntar si vas a consumir en el local o para llevar." },
      { word: "Could I get some napkins?", definition: "Polite way to request paper napkins to clean hands or spills.", definitionEs: "Forma cortés de pedir servilletas de papel para limpiarse las manos o derrames." },
      { word: "What is the Wi-Fi password?", definition: "Asking for the password to connect to the shop's public internet.", definitionEs: "Pedir la contraseña para conectarse al internet público del local." },
      { word: "Hold the...", definition: "An expression used when ordering to exclude an ingredient (e.g., 'hold the onions').", definitionEs: "Expresión usada al ordenar para excluir un ingrediente (ej. 'sin cebollas')." }
    ],
    missions: [
      { id: "day1_coffee", en: "Order coffee or food using 'I'd like a...'", es: "Ordenar café o comida usando 'I'd like a...'" },
      { id: "day1_togo", en: "Answer the cashier's question 'For here or to go?'", es: "Responder a la pregunta del cajero 'For here or to go?'" },
      { id: "day1_pastry", en: "Order a meal with custom adjustments using 'hold the [ingredient]'", es: "Ordenar comida con ajustes usando 'hold the [ingrediente]'" },
      { id: "day1_wifi", en: "Ask the barista 'Excuse me, what is the Wi-Fi password?'", es: "Preguntar al barista 'Excuse me, what is the Wi-Fi password?'" },
      { id: "day1_napkins", en: "Ask the counter staff for napkins: 'Could I get some napkins, please?'", es: "Pedir servilletas en el mostrador: 'Could I get some napkins, please?'" },
      { id: "day1_restroom", en: "Ask 'Excuse me, where's the restroom?'", es: "Preguntar 'Excuse me, where's the restroom?'" },
      { id: "day1_directions", en: "Ask for the receipt: 'Can I get the receipt, please?'", es: "Pedir el recibo: 'Can I get the receipt, please?'" }
    ]
  },
  {
    dayNum: 2,
    title: "Supermarket & Retail Checkout",
    titleEs: "Pago en el Supermercado y Tiendas",
    objectives: [
      "Ask for item locations in a store.",
      "Understand standard checkout questions like paper or plastic, rewards cards, or cashback.",
      "Learn to pay using contactless credit card tap or phone options."
    ],
    objectivesEs: [
      "Preguntar por la ubicación de artículos en una tienda.",
      "Entender las preguntas estándar de caja como bolsa de papel o plástico, tarjetas de puntos o retiro de efectivo.",
      "Aprender a pagar usando pago sin contacto con tarjeta o móvil."
    ],
    vocabulary: [
      { word: "Excuse me, where can I find...", definition: "Polite greeting used to ask for an item's aisle or location.", definitionEs: "Saludo cortés usado para preguntar por el pasillo o ubicación de un artículo." },
      { word: "Paper or plastic?", definition: "Standard question cashiers ask for bagging your groceries.", definitionEs: "La pregunta estándar que hacen los cajeros para embolsar tus compras." },
      { word: "Do you have a rewards card?", definition: "Asking if you belong to the store's loyalty program to get discounts.", definitionEs: "Preguntar si perteneces al programa de lealtad de la tienda para obtener descuentos." },
      { word: "Cash back?", definition: "Asking if you want to withdraw cash from your debit card during checkout.", definitionEs: "Preguntar si deseas retirar efectivo de tu tarjeta de débito durante el pago." }
    ],
    missions: [
      { id: "day2_pizza", en: "Ask 'Excuse me, where can I find the water/milk?'", es: "Preguntar 'Excuse me, where can I find the water/milk?'" },
      { id: "day2_omny", en: "Choose your bag option: 'Paper, please' or 'I brought my own'", es: "Elegir tu opción de bolsa: 'Paper, please' o 'I brought my own'" },
      { id: "day2_check", en: "Respond to the loyalty card question: 'No, I don't have one'", es: "Responder a la pregunta sobre la tarjeta de lealtad: 'No, I don't have one'" },
      { id: "day2_cash_card", en: "Ask if you can pay with tap: 'Can I tap my card?'", es: "Preguntar si puedes pagar aproximando la tarjeta: 'Can I tap my card?'" }
    ]
  },
  {
    dayNum: 3,
    title: "Rideshare & Neighborhood Directions",
    titleEs: "Viajes en Rideshare y Direcciones",
    objectives: [
      "Confirm rideshare drivers and coordinates safely.",
      "Ask local pedestrians for directions using polite greetings.",
      "Give standard route or drop-off requests like 'pull over' or 'drop me off here'."
    ],
    objectivesEs: [
      "Confirmar conductores de rideshare y datos de seguridad.",
      "Pedir direcciones a peatones locales usando saludos de cortesía.",
      "Dar indicaciones estándar de ruta o paradas como 'estaciónate' o 'déjame aquí'."
    ],
    vocabulary: [
      { word: "Are you picking up...", definition: "Standard greeting to confirm the driver is there for you.", definitionEs: "Saludo estándar para confirmar que el conductor viene por ti." },
      { word: "Could you drop me off here?", definition: "Expression used to ask the driver to let you out of the car.", definitionEs: "Expresión usada para pedirle al conductor que te permita bajar del auto." },
      { word: "Excuse me, how do I get to...", definition: "Polite opening to ask for directions to a specific landmark or street.", definitionEs: "Apertura cortés para pedir direcciones hacia un punto de interés o calle específica." },
      { word: "Pull over", definition: "To move the car to the side of the road and stop.", definitionEs: "Mover el auto hacia el costado de la carretera y detenerse." }
    ],
    missions: [
      { id: "day3_ticket", en: "Confirm driver identity: 'Hi, are you picking up [Name]?'", es: "Confirmar identidad del conductor: 'Hi, are you picking up [Nombre]?'" },
      { id: "day3_past_tense", en: "Explain your yesterday trip in past tense to VOYAGER", es: "Explicar tu viaje de ayer en tiempo pasado a VOYAGER" },
      { id: "day3_photo", en: "Ask a pedestrian: 'Excuse me, how do I get to...?'", es: "Preguntar a un peatón: 'Excuse me, how do I get to...?'" },
      { id: "day3_audioguide", en: "Ask the driver to stop: 'Could you drop me off at the corner?'", es: "Pedir al conductor que se detenga: 'Could you drop me off at the corner?'" }
    ]
  },
  {
    dayNum: 4,
    title: "Hotel Check-In & Casual Small Talk",
    titleEs: "Registro en el Hotel y Charla Informal",
    objectives: [
      "Master hotel receptionist check-in and check-out conversations.",
      "Understand and ask about amenities (pool, gym, Wi-Fi, breakfast).",
      "Practice casual, friendly American greetings and small talk."
    ],
    objectivesEs: [
      "Dominar las conversaciones de registro de entrada y salida con la recepción.",
      "Entender y preguntar acerca de servicios (alberca, gimnasio, Wi-Fi, desayuno).",
      "Practicar saludos casuales y charlas amigables típicas de EE.UU."
    ],
    vocabulary: [
      { word: "I have a reservation under...", definition: "Standard formal opening for checking in at hotels or restaurants.", definitionEs: "Apertura estándar formal para registrarse en hoteles o restaurantes." },
      { word: "Amenities", definition: "Extra features or services provided by hotels (e.g. Wi-Fi, gym, breakfast).", definitionEs: "Características o servicios adicionales proporcionados por hoteles (ej. Wi-Fi, gimnasio, desayuno)." },
      { word: "How's your day going?", definition: "Friendly, casual greeting used with cashiers or clerks to initiate small talk.", definitionEs: "Saludo amistoso e informal usado con cajeros o empleados para iniciar una charla rápida." },
      { word: "Have a good one!", definition: "A very common American farewell, meaning 'Have a good day'.", definitionEs: "Una despedida estadounidense muy común, que significa 'Que pases un buen día'." }
    ],
    missions: [
      { id: "day4_broadway", en: "Confirm booking: 'I have a reservation under [Name]'", es: "Confirmar reserva: 'I have a reservation under [Nombre]'" },
      { id: "day4_hotel", en: "Ask receptionist: 'Could I get extra towels?' or check checkout times", es: "Pedir al recepcionista: 'Could I get extra towels?' o consultar hora de salida" },
      { id: "day4_smalltalk", en: "Have a one-minute friendly small-talk with VOYAGER", es: "Tener una charla amistosa de un minuto con VOYAGER" },
      { id: "day4_goodone", en: "Say goodbye to someone using 'Have a good one!'", es: "Despedirse de alguien usando 'Have a good one!'" }
    ]
  }
];

export const SUGGESTIONS = [
  { id: '1', text: "Let's practice ordering food for Day 1!" },
  { id: '2', text: "Prepare me for supermarket checkout with Paper or Plastic." },
  { id: '3', text: "Ask me a vocabulary quiz for Day 1 terms." },
  { id: '4', text: "How do I say '¿Bolsa de papel o plástico?' in English?" },
  { id: '5', text: "Correct my grammar: 'Yesterday I go to restaurant and I see the waiter.'" },
  { id: '6', text: "Review my pronunciation for 'I would like a classic breakfast.'" },
  { id: '7', text: "Teach me accent reduction tips for the 'v' and 'b' sounds." },
  { id: '8', text: "Generate my End-of-Day progress review!" }
];
