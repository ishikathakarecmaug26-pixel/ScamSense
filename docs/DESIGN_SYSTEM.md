
# ScamSense — Design System

## 1. Visual Direction

A minimal, modern cybersecurity awareness platform with a dark interface, expressive accent colours and readable typography.

## 2. Colour Palette

| Name | HEX | Usage |
|---|---|---|
| Black | #000000 | Primary background |
| White | #FFFFFF | Primary text |
| Pearl White | #F2F4FE | Light surfaces and cards |
| Electric Lime | #E7FE55 | Primary actions and highlights |
| Lavender Pink | #F8D4FE | Secondary accents |

## 3. Typography

- Geist Sans: Headings, body text, forms and navigation.
- Geist Mono: URLs, technical evidence, code and scan information.

## 4. Font Weights

- 400: Regular body text
- 500: Labels and navigation
- 600: Subheadings
- 700: Main headings

## 5. Tailwind Classes

- `bg-brand-lime` / `text-brand-lime`
- `bg-brand-lavender` / `text-brand-lavender`
- `bg-brand-pearl` / `text-brand-pearl`
- `font-sans`
- `font-mono`

## 6. Risk Indicators

- High risk: #FF6B6B
- Medium risk: #FFC857
- Uncertain: #A78BFA
- No strong signals: Neutral colour

Do not represent an unflagged message as guaranteed safe.

## 7. UI Principles

- Consistent spacing and typography.
- Responsive layouts for mobile, tablet and desktop.
- Reusable buttons, inputs and form components.
- Clear loading, error and success states.
- Strong contrast between background, text and surfaces.
- Consistent styling across all feature modules.

## 8. Shared Development Rules

- Reuse existing global colour and font tokens.
- Do not introduce additional fonts without approval.
- Do not redefine global colours inside feature components.
- Use shared components wherever possible.
- Keep technical information in Geist Mono.
