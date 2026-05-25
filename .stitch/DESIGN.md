# Design System: Amora Clinical Clean-Tech
**Project ID:** 15120793825541029640

## 1. Visual Theme & Atmosphere
- **Atmosphere**: Clean, minimal, high-end professional aesthetic with generous whitespace and clear visual hierarchy.
- **Theme Modes**: Supports a native Light Mode (pure white/soft gray surfaces) and Dark Mode (deep carbon, dark gray surfaces with vibrant glowing branding elements).

## 2. Color Palette & Roles
- **Background Light**: Off-White/Soft Gray (#F9FAFB) for main canvas background.
- **Background Dark**: Near Black / Dark Charcoal (#0A0A0B) for night mode canvas background.
- **Sidebar Background Light**: Pure White (#FFFFFF) for side navigation.
- **Sidebar Background Dark**: Charcoal Black (#18181B) for night mode side navigation.
- **Primary Accent**: Royal Purple (#7C3AED / Tailwind purple-700) and Soft Lavender (#A78BFA / Tailwind purple-400) for active navigation elements, main action buttons, and focal elements.
- **Secondary Accent**: Vibrant Orange (#EA580C / Tailwind orange-600) for announcement banners and highlights.
- **Text Light**: Charcoal Gray (#111827) for primary body and headings, and Muted Gray (#6B7280) for secondary metadata and labels.
- **Text Dark**: Pure White (#FFFFFF) for primary headings, and Slate Gray (#A1A1AA) for secondary metadata.
- **Borders**: Light Gray (#E5E7EB) in light theme, Slate Charcoal (#27272A) in dark theme.

## 3. Typography Rules
- **Display Font**: Geist, sans-serif (used for headers and page titles).
- **Body Font**: Inter, sans-serif (used for text paragraphs, labels, and lists).
- **Weights**: Light (300) for prompt areas, Regular (400) for main text, Medium (500) for UI controls, Semibold (600) for primary headings.

## 4. Component Stylings
* **Buttons**:
  - Main Actions: Rounded pill or rounded full, filled with purple or custom borders.
  - Tab Selectors: Fully rounded capsule pills containing active and inactive states.
* **Cards/Containers**:
  - Prompt Area Box: Soft rounded corners (rounded-[24px]), white/charcoal fill, subtle border (#E5E7EB / #27272A), glowing purple focus ring on active input.
  - Sidebar Cards: Subtle borders, high-contrast hover highlights.
* **Inputs/Forms**:
  - Textarea: Borderless, spacious, large font size, light placeholder text.

## 5. Layout Principles
- **Sidebar Grid**: Left-anchored static navigation bar of width w-64.
- **Canvas Area**: Centered main container max-w-3xl with horizontal padding px-8 and top margin padding for floating appearance.
- **Theme Switcher**: Foot-anchored simple button in sidebar toggling theme dynamically.

## 6. Design System Notes for Stitch Generation
When generating pages for the Amora ecosystem:
- Keep the sidebar navigation exactly matching the structure:
  - Header: Logo, title "Pedro Miguel's Works...", subtitle "personal-pedro-miguel-DM...".
  - Section "Construir": Active link "Builder".
  - Section "Aprender": Links "Eventos", "Aulas", "Comunidade".
  - Footer: Theme Toggle button, "Free Plan" badge, user profile card for Pedro Miguel.
- Maintain the same color tokens (purple accents, slate borders, clean canvas backgrounds).
- Generate a clean card layout for content, ensuring it looks spacious and matches the layout structure of index.html.
