# Instrucciones de Desarrollo — USA Voyager (AGENTS.md)

Estas instrucciones rigen todas las modificaciones futuras a la aplicación USA Voyager. Cualquier desarrollador o agente de IA que modifique este código debe adherirse estrictamente a estos principios.

---

## 🧱 Arquitectura y División de la Interfaz

La aplicación está dividida permanentemente en dos áreas de alto contraste con una relación de aspecto fija de **1.587 : 1** (división `2fr : 3fr`):

1. **Lado Izquierdo: El "Pasaporte" (Passport)**
   - Representa la identidad visual principal e inmutable de USA Voyager.
   - **Contiene**: Mascota astronauta Voyager, marca y título principal (*YO SOY USA VOYAGER™*), indicador de conexión en vivo, orbe de voz reactivo, botón de Conectar/Desconectar y control de fin de sesión.
   - **Regla Fundamental**: El Pasaporte **NO** debe ser rediseñado, modificado, movido ni alterado a menos que el usuario lo solicite de manera explícita y específica.

2. **Lado Derecho: La "Portada" (Cover / Página Dinámica)**
   - Es el área dinámica de interacción, estudio y herramientas de aprendizaje.
   - **Contiene**: Lista de mensajes y chat, selector de modos de conversación, tarjeta de perfil de estudiante (en cuadrícula de 4 columnas en versión de escritorio), ruta de aprendizaje (*My Journey*), panel de profesores, diagnóstico de audio, calendario y herramientas interactivas.
   - Todas las funciones nuevas, vistas y pestañas se integran exclusivamente aquí.

---

## 🧭 Principios Clave de Desarrollo

- **Integrar sin rediseñar**: La estructura base está definida. Se pueden añadir o ajustar componentes dentro de la Portada, pero sin alterar el diseño de dos columnas, sin tocar el Pasaporte ni modificar la proporción del libro.
- **Soporte multilingüe obligatorio**: Todos los textos mostrados al usuario deben estar traducidos en inglés (`selectedLang === 'EN'`) y español (`selectedLang === 'ES'`) en `/src/components/Translations.ts`.
- **Persona y Voz VOYAGER**: USA Voyager es estrictamente el ÚNICO tutor y persona de voz en la aplicación. Configurado con la voz masculina de Gemini Live `'Puck'` y síntesis de voz TTS masculina en el navegador. No se permiten voces secundarias ni otros personajes.
- **Gráficos y Leyendas Circulares**: Todas las estadísticas, círculos de progreso y listas de métricas deben usar alineación compacta hacia la izquierda con espaciado ajustado entre etiquetas y porcentajes, evitando márgenes dispersos o `justify-between`.
- **Tipografía y Legibilidad**: Utilizar la fuente *Raleway* con peso regular por defecto, reservando negritas e itálicas exclusivamente para énfasis intencional. No sobrecargar con badges o píldoras innecesarias.
