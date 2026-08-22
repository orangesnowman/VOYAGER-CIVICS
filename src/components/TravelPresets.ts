import { TravelDestination } from './LiveAgentTypes';

export const TRAVEL_PRESETS: TravelDestination[] = [
  {
    name: "Diner Americano",
    nameEn: "Classic Diner",
    lat: 39.8283,
    lng: -98.5795,
    subwayLines: ['Diner Counter', 'Booth'],
    subwayDirections: "Busca un diner con letrero de neón clásico y pide mesa o barra.",
    subwayDirectionsEn: "Find a classic neon-lit diner and ask for a table or counter service.",
    taxiTime: "5 mins",
    taxiFare: "$8.50",
    walkTime: "10 mins",
    walkDist: "0.5 mi",
    bikeTime: "3 mins",
    vocab: ["Booth (Cabina)", "Counter (Barra)", "Daily specials (Especiales del día)", "Sunny-side up (Huevos fritos enteros)", "Refill (Rellenar bebida)"],
    phrases: [
      { en: "I'd like a table for two, please.", es: "Me gustaría una mesa para dos, por favor." },
      { en: "Could I get a coffee refill?", es: "¿Me podría rellenar el café?" },
      { en: "Can we have the check, please?", es: "¿Nos da la cuenta, por favor?" }
    ]
  },
  {
    name: "Supermercado",
    nameEn: "Local Supermarket",
    lat: 39.8285,
    lng: -98.5790,
    subwayLines: ['Produce Aisle', 'Checkout Lane'],
    subwayDirections: "Entra, toma un carrito de compras (cart) y dirígete a los pasillos.",
    subwayDirectionsEn: "Walk in, grab a shopping cart, and head to the aisles.",
    taxiTime: "8 mins",
    taxiFare: "$11.00",
    walkTime: "15 mins",
    walkDist: "0.8 mi",
    bikeTime: "5 mins",
    vocab: ["Shopping cart (Carrito)", "Aisle (Pasillo)", "Paper or plastic (Papel o plástico)", "Rewards card (Tarjeta de puntos)", "Receipt (Recibo/Ticket)"],
    phrases: [
      { en: "Excuse me, where can I find the milk?", es: "Disculpe, ¿dónde puedo encontrar la leche?" },
      { en: "I don't need a bag, thank you.", es: "No necesito bolsa, gracias." },
      { en: "Can I do twenty dollars cash back?", es: "¿Puedo retirar veintiún dólares en efectivo en caja?" }
    ]
  },
  {
    name: "Gasolinera",
    nameEn: "Gas Station & Store",
    lat: 39.8280,
    lng: -98.5800,
    subwayLines: ['Fuel Pump', 'Snack Aisle'],
    subwayDirections: "Estaciónate junto a la bomba (pump) número 4 y paga adentro.",
    subwayDirectionsEn: "Park next to fuel pump number 4 and pay inside.",
    taxiTime: "12 mins",
    taxiFare: "$16.00",
    walkTime: "30 mins",
    walkDist: "1.5 mi",
    bikeTime: "10 mins",
    vocab: ["Fuel pump (Bomba de gasolina)", "Regular / Premium (Tipos de gasolina)", "Windshield squeegee (Limpiaparabrisas)", "Restroom key (Llave del baño)", "Highway (Autopista)"],
    phrases: [
      { en: "Fifty dollars on pump number four, please.", es: "Cincuenta dólares en la bomba número cuatro, por favor." },
      { en: "Do you have a public restroom?", es: "¿Tiene baño público?" },
      { en: "Can I get a bottle of water and these chips?", es: "¿Me da una botella de agua y estas papas?" }
    ]
  },
  {
    name: "Recepción de Hotel",
    nameEn: "Hotel Front Desk",
    lat: 39.8290,
    lng: -98.5780,
    subwayLines: ['Lobby', 'Reception'],
    subwayDirections: "Camina hacia la recepción en el vestíbulo principal del hotel.",
    subwayDirectionsEn: "Head to the reception desk in the main hotel lobby.",
    taxiTime: "15 mins",
    taxiFare: "$22.00",
    walkTime: "40 mins",
    walkDist: "2.0 mi",
    bikeTime: "12 mins",
    vocab: ["Reservation (Reservación)", "Key card (Tarjeta llave)", "Check-out time (Hora de salida)", "Amenities (Servicios/Comodidades)", "Valet parking (Estacionamiento de servicio)"],
    phrases: [
      { en: "Hi, I have a reservation under Jane Doe.", es: "Hola, tengo una reservación a nombre de Jane Doe." },
      { en: "What time is checkout tomorrow?", es: "A qué hora es la salida mañana?" },
      { en: "Could we get some extra towels for our room?", es: "¿Podríamos tener algunas toallas extra para la habitación?" }
    ]
  }
];
