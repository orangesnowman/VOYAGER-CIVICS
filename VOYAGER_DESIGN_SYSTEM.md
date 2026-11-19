# USA VOYAGER — Official Design System & Visual Specification
Version 1.0 | October 2026

Authoritative reference for approved visual specifications, layout architecture, typography, components, and illustration styles across the USA Voyager application.

---

## 1. Architecture & Proportions

The Voyager interface is split into two high-contrast zones with a fixed ratio of **1.587 : 1** (a `2fr : 3fr` column split):

1. **Left Column: The Passport (El Pasaporte)**
   - Core visual identity of USA Voyager.
   - Contains: Voyager astronaut emblem, brand title (*YO SOY USA VOYAGER™*), live connection status, reactive voice orb, audio controls, and session terminations.
   - **Rule**: Strictly preserved. Never redesigned, altered, or moved unless explicitly requested by the user.

2. **Right Column: Dynamic Workspace (La Portada)**
   - Interactive study and management interface.
   - Contains: Message feed, mode selectors, student profile, *My Journey* roadmap, lesson catalog, teacher panels, audio diagnostics, and certifications.
   - All new educational tools, tabs, and views integrate exclusively into this area.

---

## 2. Color Palette & Materials

| Token | Hex Value | Purpose |
| :--- | :--- | :--- |
| **Parchment Base** | `#FEF9EE` | Authentic lithographic paper tone for SVG illustrations and certificates. |
| **Folder Card Body** | `#F8ECC0` | Active index tab and folder container background. |
| **Inactive Index Tab** | `#EADBB3` | Inactive tab background (hover: `#E0CF9E`). |
| **Voyager Deep Navy** | `#0B172E` | Key contrast blocks, lithographic ink outlines, and deep typography. |
| **Voyager Yellow** | `#FED000` | Primary interactive highlight, capsule buttons, and hover state background. |
| **Golden Amber** | `#F59E0B` | Ben-Day dot patterns, brass finials, warm letterpress accents. |
| **Heritage Crimson** | `#B22234` | American flag stripes and national identity accents. |
| **Unfilled Track** | `#FFFFFF` | Unfilled portion of lesson progress bars (thicker, fully rounded). |
| **Progress In-Progress** | `#FBBF24` / `bg-amber-400` | Active lesson progress fill. |
| **Progress Completed** | `#059669` / `bg-emerald-600` | 100% completed lesson progress fill. |
| **Alert / Counter Badge** | `#E53E3E` | Small circular notification badge for pending assignments on Asignadas tab. |

---

## 3. Lesson Catalog Illustration Standards (Lithographic Rule)

All lesson thumbnails within the Lesson Catalog (`RecommendedProLessonsCarousel`) must adhere strictly to the **Traditional Vintage Lithographic Illustration Style**:

1. **Medium & Aesthetic**:
   - Traditional vintage lithography / engraved educational-book illustrations.
   - Fine ink linework, parallel engraving crosshatching, subtle printed texture, and Ben-Day dot shading.
   - Palette strictly anchored to cream paper (`#FEF9EE`), deep navy ink (`#0B172E`), muted golden amber (`#F59E0B`), and heritage accents.
   - **Prohibited**: Modern flat vector cartoons, generic stock photography, heavy noir shadows, and dramatic dark lighting.
   - Visual tone must remain bright, clean, inviting, and educational.

2. **Category Specifics**:
   - **Civics & Rights** (`cat-american-flag.svg`):
     - Clear, recognizable waving American flag with brass finial flagpole, deep navy canton with crisp stars, and engraved crimson/cream stripes with fine fold hatching on warm cream parchment.
   - **Career & Business** (`cat-career-bright.svg`):
     - Bright, welcoming professional job interview / executive coaching scene. Sunlit gridded office window, warm wood desk, candidate and interviewer engaging constructively with resume and padfolio. Light tones with crisp ink linework.
   - **Health & Living** (`cat-doctor-pharmacy.svg`):
     - Must feature recognizable medical and pharmaceutical symbols: medical cross emblem, clinical stethoscope draped across counter, Rx diagnostic clipboard, prescription medicine bottle with safety cap.
     - **Rule**: Avoid human portraits. Focus on symbolic tools and clinical artifacts.
   - **Transit & Travel** (`cat-airport-tsa.svg`, `cat-flight-rebooking.svg`):
     - Commercial aircraft on tarmac, terminal guide lights, and travel paperwork rendered in letterpress lithograph style.

3. **Thumbnail Controls & Overlays**:
   - Audio speaker button located exclusively in the upper-left corner of the thumbnail.
   - Must use high-contrast styling (`bg-black/85 hover:bg-black text-white border border-white/20 shadow-md backdrop-blur-xs`) to remain visible against both dark navy and warm cream image areas.

---

## 4. Component Patterns

### A. Index-Card Filing Tabs
- Tabs mimic vintage physical file folder dividers with organic concave fillets (`inverted fillet` SVG flares) on internal borders.
- Small black icon centered above compact typography.
- **Asignadas Tab Badge**: Displays a small circular red badge (`bg-[#E53E3E] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1`) indicating pending teacher assignments (`newAssignmentsCount`). Hidden when 0. Other tabs do not display notification badges.

### B. Catalog Heading
- Uppercase heading `CATÁLOGO DE LECCIONES` / `LESSON CATALOG`.
- Container must maintain top padding (`pt-4 sm:pt-5`) and `overflow-visible` to prevent accent mark clipping on capital letters (e.g., "Á") on any viewport.

### C. Progress Bars
- Placed directly beneath the category label.
- Track background is pure white (`#FFFFFF`) with subtle inset definition against the cream card body.
- Bar ends are fully rounded (`rounded-full`).
- Height: 6px.

### D. Action Buttons (`Practicar` / `Repasar`)
- Default state: Transparent background (`bg-transparent`), thin black outline (`border border-black`), black text and icon.
- Hover state: Voyager yellow (`hover:bg-[#FED000]`), **strictly preserving the black outline** (`border border-black`), black text, identical geometry and dimensions.
- Smooth transition (`transition-colors duration-200`).

---

## 5. Typography

- **Font Family**: *Raleway* is the primary typeface for all UI and body copy.
- Regular weight is used by default; bold weight is reserved strictly for meaningful semantic emphasis and headings.
- Clean hierarchy:
  - Main Catalog Heading: 16–18px font-bold, uppercase.
  - Card Category: 14–15px font-bold, uppercase.
  - Card Level & Duration: 11–12px font-medium, neutral-600.
  - Card Title: 12px font-bold, text-neutral-900.
  - Card Description: 12px leading-relaxed line-clamp-2.
