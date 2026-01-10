# Ghost Gaming - Projektkontext

## Vad är detta?
CS2 community-servernätverk med custom souls/inventory-system och tillhörande hemsida.

## Servrar
- **Surf** - Surf maps
- **Retake** - Retake gameplay
- **Competitive** - 5v5 matchmaking

## Kärnfeatures
- Souls-ekonomi (1 soul per 20 min speltid)
- Case opening system med CS2-style animation
- Delad inventory över alla servrar
- Cross-server rare item announcements via Redis
- Premium-medlemskap (x5 souls, reserved slots)

## Tech Stack
- **Plugin:** CounterStrikeSharp (C#)
- **Web:** Next.js + Tailwind
- **DB:** MySQL/MariaDB
- **Real-time:** Redis pub/sub + WebSockets

## Nuvarande status
**Fas:** Hemsida MVP klar
**Senast uppdaterad:** 2025-01-09

### Klart
- Projektstruktur skapad
- Projektfiler initierade
- Next.js + TypeScript + Tailwind setup
- Fullständigt databasschema med seed data
- Landing page med stats, server status, live feed
- Navbar och Footer komponenter
- /cases sida med alla cases
- /open/[caseId] med CS2-style case opening animation
- Rarity system med glow effects
- Framer Motion animation för roulette

### Pågående
- Se TODO.md

### Nästa steg
- Inventory sida
- Steam auth
- API endpoints
- Plugin utveckling
