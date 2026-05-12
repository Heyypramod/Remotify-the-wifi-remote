---
colors:
  primary: "#FF9B54"
  on-primary: "#FFFFFF"
  primary-container: "rgba(255, 155, 84, 0.15)"
  background: "#F7F3EE"
  surface: "#FFFDF9"
  surface-variant: "#FFF6EC"
  on-surface: "#241F1A"
  on-surface-variant: "#7A6858"
  secondary: "#7A6858"
  tertiary: "#6C5D2F"
  error: "#BA1A1A"
  outline: "rgba(36, 31, 26, 0.05)"
  inactive: "#B8AA9D"

typography:
  sans:
    family: "Inter"
    weights: [400, 500, 600, 700]
  display:
    family: "Outfit"
    weights: [400, 500, 600, 700]

radii:
  none: "0px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "40px"
  full: "9999px"

elevation:
  glass: "backdrop-blur-xl border-m3-outline/10 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
  floating: "shadow-[0_16px_40px_rgba(36,31,26,0.1)]"

motion:
  standard: "duration-300 ease-in-out"
  expressive: "duration-500 cubic-bezier(0.4, 0, 0.2, 1)"
  ambient: "ambient-shift 20s infinite, ambient-pulse 15s infinite"
---

# Design System: Ambient Remote

An expressive, tactile, and living design system built for high-end remote control applications. It merges the grounded logic of Material 3 with an "Atmospheric Glass" aesthetic that feels responsive and premium.

## Visual Identity

The interface is defined by **Soft Tactility** and **Atmospheric Depth**. Rather than rigid grids and harsh shadows, it uses large radii (32px+) and translucent layers to create a sense of physical objects floating in a warm, lit environment.

### Color & Atmosphere
- **Warm Neutrals:** The foundation is a beige/sand palette (`#F7F3EE`) that feels more organic and "homey" than standard tech greys.
- **Vibrant Primary:** A soft but energetic orange (`#FF9B54`) is used sparingly for primary actions and active states.
- **Living Backgrounds:** The background isn't static. It uses subtle ambient shifts (scales and translations) and pulses to mimic natural light changes, ensuring the app feels "alive."

### Typography
- **Functional:** `Inter` provides high legibility for states, labels, and small data points.
- **Expressive:** `Outfit` is used for display headers and prominent titles, lending a geometric, tech-forward character to the interface.

## Component Design

### The "Glass" Shell
Components often utilize `.glass-nav` or similar styles:
- **Materials:** `surface/80` with a heavy `backdrop-blur-xl`.
- **Borders:** Thin, barely-visible hairline borders (`outline/10`) to define edges without adding visual weight.

### Precision Control (TouchSurface)
The touchpad is the centerpiece of the interaction model.
- **Zero-Gravity Feedback:** Touch actions trigger a soft primary-colored glow that follows the pointer.
- **Ripple Intent:** Successful gestures (taps/swipes) trigger subtle ripple animations that provide visual confirmation of the interpreted command.

### Buttons & Interaction
- **Micro-interactions:** Buttons use `whileTap={{ scale: 0.95 }}` and smooth color transitions to feel responsive.
- **Soft Shadows:** Transitions use inner shadows for pressed states and broad, soft drop-shadows for floating elements.

## Design Intent

The goal is **Restrained Premium**. Every animation should be purposeful; every color should feel warm. The interface should disappear into the background when not in use but feel immensely satisfying and trustworthy when touched.
