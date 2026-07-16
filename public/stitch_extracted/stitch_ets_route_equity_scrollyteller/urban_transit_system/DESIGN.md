---
name: Urban Transit System
colors:
  surface: '#fbf8ff'
  surface-dim: '#dbd9e2'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2fc'
  surface-container: '#efecf6'
  surface-container-high: '#eae7f0'
  surface-container-highest: '#e4e1eb'
  on-surface: '#1b1b22'
  on-surface-variant: '#464653'
  inverse-surface: '#303037'
  inverse-on-surface: '#f2eff9'
  outline: '#767684'
  outline-variant: '#c6c5d5'
  surface-tint: '#4b53bc'
  primary: '#00003c'
  on-primary: '#ffffff'
  primary-container: '#000080'
  on-primary-container: '#777eea'
  inverse-primary: '#bfc2ff'
  secondary: '#0058bb'
  on-secondary: '#ffffff'
  secondary-container: '#1471e6'
  on-secondary-container: '#fefcff'
  tertiary: '#130900'
  on-tertiary: '#ffffff'
  tertiary-container: '#321d00'
  on-tertiary-container: '#bd7b00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bfc2ff'
  on-primary-fixed: '#00006e'
  on-primary-fixed-variant: '#3239a3'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc7ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004493'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#ffb957'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#643f00'
  background: '#fbf8ff'
  on-background: '#1b1b22'
  surface-variant: '#e4e1eb'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is built on the principles of clarity, accessibility, and modern civic professionalism. It targets commuters, urban planners, and transit authorities, evoking a sense of efficiency and optimism. 

The aesthetic is **Corporate Modern with a Minimalist Flat Vector lean**. It utilizes high-contrast geometric shapes and a vibrant color palette to make complex transit data feel approachable and human-centric. By pairing a stark, authoritative deep navy with energetic, warm accents, the interface balances institutional trust with modern digital friendliness. 

Visuals should prioritize "Flat Design 2.0" principles: no heavy gradients or skeuomorphism, relying instead on purposeful color blocking and clean lines to guide the eye.

## Colors

The color strategy is anchored by **Primary Deep Navy (#000080)**, reserved exclusively for primary typography and structural icons to ensure maximum legibility and authority against white backgrounds. 

A vibrant supporting palette is used for data visualization, status indicators, and wayfinding:
- **Electric Blue & Sky Blue:** Used for primary actions and transit-related backgrounds.
- **Vibrant Orange & Soft Peach:** Used for highlighting routes, warnings, or secondary interaction states.
- **Teal Accent:** Applied to positive confirmations and environmental metrics.
- **Pure White:** The mandatory background color for all main content containers to maintain a crisp, high-contrast aesthetic.

## Typography

This design system utilizes **Hanken Grotesk** as the primary typeface for its sharp, contemporary geometry and high legibility in professional contexts. It scales effectively from large data dashboards to compact mobile schedules.

For technical data, route numbers, and monospaced values, **JetBrains Mono** is used to provide a clear distinction between descriptive text and system data.

**Key Rules:**
- All text defaults to **Deep Navy (#000080)**.
- Use `display-lg` sparingly for hero statements or major transit metrics.
- Maintain generous line heights to aid readability for users on the move.

## Layout & Spacing

The system follows a **Fixed Grid** model for desktop to maintain the integrity of complex data visualizations, switching to a **Fluid Grid** for mobile devices. 

- **Desktop (1280px+):** 12-column grid with 24px gutters. Content is centered with wide 40px margins to emphasize the minimalist "white space" feel.
- **Tablet (768px - 1279px):** 8-column grid with 20px gutters. 
- **Mobile (Under 768px):** 4-column grid with 16px gutters and margins.

Spacing is based on an 8px base unit. Component padding should consistently favor "roomy" layouts to prevent the high-contrast colors from feeling overwhelming.

## Elevation & Depth

This design system rejects traditional shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

Hierarchy is established through:
- **Surface Tiering:** The primary background is always `Pure White`. Secondary content areas (like sidebars or cards) use very light tints of `Sky Blue` or `Soft Peach` to create separation without using drop shadows.
- **Structural Borders:** Elements are defined by thin (1px) solid borders in `Deep Navy` (at 10% opacity) or through direct color-block abutment.
- **Flat Overlays:** Modals and tooltips use a simple 1px solid border in `Deep Navy` with no blur, maintaining the "flat vector" aesthetic.

## Shapes

The shape language is **Rounded**, echoing the friendly yet structured nature of the reference illustration.

- **Standard Elements:** Buttons, input fields, and cards use a `0.5rem` radius.
- **Large Containers:** Hero sections or large modal overlays use a `1rem` radius.
- **System Icons:** Icons should be enclosed in circular or "squircle" containers when used as primary navigation triggers.

Avoid sharp corners to keep the interface feeling accessible and modern.

## Components

### Buttons
- **Primary:** Solid `Electric Blue` with `Pure White` text. `0.5rem` rounded corners.
- **Secondary:** Solid `Deep Navy` with `Pure White` text for high-importance utilitarian actions.
- **Tertiary:** Transparent background with `Electric Blue` border and text.

### Cards
- Cards must use a `Pure White` background.
- Use a `1px` stroke in `Deep Navy` at 8% opacity for definition.
- Interior padding should be a minimum of `24px` to maintain a minimalist feel.

### Input Fields
- Flat styling with a `1px` bottom border in `Deep Navy` (30% opacity).
- Active state transitions the border to `Electric Blue` at `2px` thickness.

### Chips & Tags
- Use the vibrant 8-color palette for background tints (e.g., `Sky Blue` chip with `Electric Blue` text).
- These are used for route numbers, status updates (On Time, Delayed), and categories.

### Lists
- Clean, unbordered rows separated by `8px` of vertical space. 
- High-contrast icons in `Deep Navy` facilitate quick scanning.