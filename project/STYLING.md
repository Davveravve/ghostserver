# Styling Guide - Ghost Gaming

## Tema
Mörkt, gaming-estetik med ghost/spöke-tema. Clean och modern.

## Färger

### Backgrounds
```css
--bg-primary: #0a0a0f;      /* Huvudbakgrund */
--bg-secondary: #12121a;    /* Cards, panels */
--bg-tertiary: #1a1a24;     /* Hover states, elevated */
--bg-overlay: rgba(0,0,0,0.8); /* Modals, overlays */
```

### Accent
```css
--accent-primary: #8b5cf6;   /* Lila - huvudaccent */
--accent-secondary: #06b6d4; /* Cyan - sekundär */
--accent-glow: rgba(139, 92, 246, 0.4); /* Glow effect */
```

### Text
```css
--text-primary: #ffffff;
--text-secondary: #a1a1aa;
--text-muted: #71717a;
```

### Status
```css
--success: #22c55e;
--warning: #eab308;
--error: #ef4444;
```

### Rarity Colors
```css
--rarity-common: #9ca3af;     /* Grå */
--rarity-uncommon: #3b82f6;   /* Blå */
--rarity-rare: #8b5cf6;       /* Lila */
--rarity-epic: #ec4899;       /* Rosa */
--rarity-legendary: #f59e0b;  /* Guld */
--rarity-ultra: #ef4444;      /* Röd */
```

## Tailwind Config
```js
// tailwind.config.js colors extension
colors: {
  ghost: {
    bg: '#0a0a0f',
    card: '#12121a',
    elevated: '#1a1a24',
  },
  accent: {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
  },
  rarity: {
    common: '#9ca3af',
    uncommon: '#3b82f6',
    rare: '#8b5cf6',
    epic: '#ec4899',
    legendary: '#f59e0b',
    ultra: '#ef4444',
  }
}
```

## Typsnitt
- **Headings:** Rajdhani (Google Fonts) - bold, gaming feel
- **Body:** Inter (Google Fonts) - clean, readable

```css
font-family: 'Inter', sans-serif;
font-family: 'Rajdhani', sans-serif; /* headings */
```

## Spacing & Sizing
- **Border radius:**
  - Cards: 8px (rounded-lg)
  - Buttons: 6px (rounded-md)
  - Pills/tags: 9999px (rounded-full)
- **Card padding:** 24px (p-6)
- **Section spacing:** 64px (py-16)

## Effects

### Shadows
```css
--shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
--shadow-glow: 0 0 20px rgba(139, 92, 246, 0.3);
```

### Borders
```css
--border-subtle: 1px solid rgba(255, 255, 255, 0.1);
--border-accent: 1px solid rgba(139, 92, 246, 0.5);
```

### Transitions
```css
transition: all 200ms ease;
```

### Hover States
- Cards: slight scale (1.02) + glow
- Buttons: brightness increase + glow
- Links: color shift to accent

## Komponenter

### Button Primary
```jsx
className="bg-accent-primary hover:bg-accent-primary/90 text-white px-6 py-3 rounded-md font-semibold transition-all hover:shadow-glow"
```

### Button Secondary
```jsx
className="bg-ghost-card border border-white/10 hover:border-accent-primary/50 text-white px-6 py-3 rounded-md font-semibold transition-all"
```

### Card
```jsx
className="bg-ghost-card border border-white/10 rounded-lg p-6 hover:border-accent-primary/30 transition-all"
```

### Input
```jsx
className="bg-ghost-bg border border-white/10 rounded-md px-4 py-2 text-white placeholder:text-gray-500 focus:border-accent-primary focus:outline-none"
```

## Rarity Glow Effects
```css
.rarity-common { box-shadow: 0 0 10px rgba(156, 163, 175, 0.3); }
.rarity-uncommon { box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
.rarity-rare { box-shadow: 0 0 20px rgba(139, 92, 246, 0.5); }
.rarity-epic { box-shadow: 0 0 25px rgba(236, 72, 153, 0.5); }
.rarity-legendary { box-shadow: 0 0 30px rgba(245, 158, 11, 0.6); }
.rarity-ultra { box-shadow: 0 0 40px rgba(239, 68, 68, 0.7); animation: pulse-glow 2s infinite; }
```

## Animation Guidelines
- Case opening: 5-8 sekunder total
- Slowdown curve: cubic-bezier(0.25, 0.1, 0.25, 1)
- Item reveal: scale up + glow burst
- Confetti: endast legendary+
