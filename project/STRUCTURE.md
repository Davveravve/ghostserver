# Projektstruktur - Ghost Gaming

```
ghost/
├── project/                    # Projektdokumentation
│   ├── TODO.md                 # Aktiva uppgifter
│   ├── FINISHED.md             # Avklarade uppgifter
│   ├── STYLING.md              # Design tokens & guidelines
│   ├── STRUCTURE.md            # Denna fil
│   ├── BUGS.md                 # Kända buggar
│   ├── IDEAS.md                # Framtida features
│   └── CONTEXT.md              # Projektöversikt
│
├── plugin/                     # CS2 Server Plugin
│   └── GhostSouls/             # CounterStrikeSharp plugin
│       ├── GhostSouls.cs       # Main plugin entry
│       ├── Database.cs         # DB connection & queries
│       ├── SoulsManager.cs     # Playtime tracking, souls logic
│       ├── CaseManager.cs      # Case opening logic
│       ├── InventoryManager.cs # Player inventory
│       ├── RedisAnnouncer.cs   # Cross-server announcements
│       └── Config.json         # Plugin configuration
│
├── web/                        # Next.js Hemsida
│   ├── app/                    # App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   ├── cases/
│   │   │   └── page.tsx        # All cases
│   │   ├── open/
│   │   │   └── [caseId]/
│   │   │       └── page.tsx    # Case opening
│   │   ├── inventory/
│   │   │   └── page.tsx        # Player inventory
│   │   ├── leaderboard/
│   │   │   └── page.tsx        # Rankings
│   │   └── premium/
│   │       └── page.tsx        # Premium purchase
│   │
│   ├── components/             # React komponenter
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── cases/
│   │   │   ├── CaseCard.tsx
│   │   │   ├── CaseOpening.tsx
│   │   │   └── ItemReveal.tsx
│   │   ├── inventory/
│   │   │   ├── InventoryGrid.tsx
│   │   │   └── ItemCard.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   └── LiveFeed.tsx
│   │
│   ├── lib/                    # Utilities
│   │   ├── db.ts               # Database client
│   │   ├── auth.ts             # Steam auth
│   │   └── utils.ts            # Helper functions
│   │
│   ├── hooks/                  # Custom React hooks
│   │   └── useWebSocket.ts
│   │
│   ├── types/                  # TypeScript types
│   │   └── index.ts
│   │
│   ├── public/                 # Static assets
│   │   └── images/
│   │
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
│
├── database/
│   └── schema.sql              # Full database schema
│
└── deploy/                     # Deployment scripts
    ├── setup-server.sh         # VPS initial setup
    └── deploy-plugin.sh        # Plugin deployment
```

## Viktiga filer

| Fil | Syfte |
|-----|-------|
| `web/app/layout.tsx` | Global layout, fonts, metadata |
| `web/components/cases/CaseOpening.tsx` | Huvudanimation för case opening |
| `database/schema.sql` | All databas-struktur |
| `plugin/GhostSouls/GhostSouls.cs` | Plugin entry point |
