# Ghost Gaming Project

## Infrastructure

### Domain
- **Domain:** ghostservers.site
- **Registrar:** Namecheap

### Vercel (Website Hosting)
- **URL:** https://ghostservers.site
- **Project:** ghostserver
- **GitHub:** https://github.com/Davveravve/ghostserver

### Hetzner VPS (Database + CS2 Servers)
- **IP:** 46.224.197.229
- **Location:** Nuremberg, Germany
- **Plan:** CPX22 (2 vCPU, 4GB RAM)
- **OS:** Ubuntu 24.04

### Database (MySQL on VPS)
- **Host:** 46.224.197.229
- **Port:** 3306
- **Database:** ghost_gaming
- **User:** ghost
- **Password:** GhostServer2024
- **DATABASE_URL:** mysql://ghost:GhostServer2024@46.224.197.229:3306/ghost_gaming

### API Keys (in Vercel Environment Variables)
- **NEXTAUTH_URL:** https://ghostservers.site
- **NEXTAUTH_SECRET:** 9oPQqEUNivTzJ8TtFxH7fa8TpKw23rvsJ4Pm8fcL6IQ=
- **STEAM_API_KEY:** (user's Steam API key for ghostservers.site)
- **PLUGIN_API_KEY:** 3NULQW7WPpW3ZquX2WzFVyvWx2y09DQEg+JBA4+JVv4=

### CS2 Plugin Config
- **ApiUrl:** https://ghostservers.site
- **ApiKey:** 3NULQW7WPpW3ZquX2WzFVyvWx2y09DQEg+JBA4+JVv4=
- **WebsiteUrl:** https://ghostservers.site

---

## Rules

- **NO EMOJIS** - Do not use emojis anywhere in the codebase. Use SVG icons instead.
- Swedish comments are OK
- Use TypeScript for all code
- Follow existing code patterns and styling
- **BE AUTONOMOUS** - Do not ask unnecessary questions. Make decisions independently and complete tasks without prompting. You have a goal - achieve it.

## Project Structure

- `/web` - Next.js 14 frontend with App Router
- `/api` - Backend API (future)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion for animations
- Steam OpenID authentication

## Key Features

- CS2 community servers (Surf, Retake, Competitive)
- Souls economy system
- Case opening with CS2-style animation
- Shared inventory across all servers
- Premium membership tiers
