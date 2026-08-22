# USA Voyager Development Instructions

These instructions govern all future modifications to the USA Voyager application. Any AI agent modifying this codebase must adhere strictly to these principles.

## 🧱 App Architecture & Layout Divisions

The application interface is strictly divided into two permanent, high-contrast areas:

1. **Left Side: The "Passport"**
   - This represents the core visual identity of USA Voyager.
   - Contains: The USA Voyager astronaut mascot, branding title, connections status, the primary Connect/Disconnect button, and the End Session button.
   - **Crucial Rule**: The Passport side **MUST NOT** be redesigned, modified, or touched unless explicitly and specifically requested by the user.

2. **Right Side: The "Cover"**
   - This is the dynamic learning area.
   - Contains: The primary chat messages list, selected conversation mode, user profiles, the "My Journey" learning roadmap, Teachers panel, and any new features.
   - All new features and visual tabs go here.

## 🧭 Key Principles for Development

- **Do Not Redesign, Integrate**: The structural "house" is already built. You are permitted to move furniture or add decor inside the rooms (the Cover area), but you are strictly forbidden from tearing down walls (changing the layout layout, moving the Passport, or altering the core visual identity).
- **Determine Intent Before Modifying**: Before modifying any existing UI, determine whether the request is a feature enhancement or a redesign. If a redesign is not explicitly requested, preserve the current design and integrate the feature.
- **Maintain Multi-Language Support**: Ensure all user-facing strings are fully internationalized. Maintain both English (`selectedLang === 'EN'`) and Spanish (`selectedLang === 'ES'`) strings in `/src/components/Translations.ts`.
- **VOYAGER Voice Persona**: USA Voyager is strictly the ONLY voice, tutor, and persona used in the application. No other voice styles or secondary teacher personas are permitted. Voice output is configured with male Gemini Live voice `'Puck'` and male browser TTS voices.

