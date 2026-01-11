# Ghost Gaming Project

## Infrastructure

### Domain
- **Domain:** ghostservers.site
- **Registrar:** Namecheap

### Vercel (Website Hosting)
- **URL:** https://www.ghostservers.site
- **Project:** ghostserver
- **GitHub:** https://github.com/Davveravve/ghostserver

### Hetzner VPS (Database + CS2 Servers)
- **IP:** 46.224.197.229
- **Location:** Nuremberg, Germany
- **Plan:** CPX22 (2 vCPU, 4GB RAM)
- **OS:** Ubuntu 24.04
- **CS2 Install Path:** /home/cs2/cs2-server/
- **User:** cs2

### Database (MySQL on VPS)
- **Host:** 46.224.197.229
- **Port:** 3306
- **Database:** ghost_gaming
- **User:** ghost
- **Password:** GhostServer2024
- **DATABASE_URL:** mysql://ghost:GhostServer2024@46.224.197.229:3306/ghost_gaming

### API Keys (in Vercel Environment Variables)
- **NEXTAUTH_URL:** https://www.ghostservers.site
- **NEXTAUTH_SECRET:** 9oPQqEUNivTzJ8TtFxH7fa8TpKw23rvsJ4Pm8fcL6IQ=
- **STEAM_API_KEY:** (user's Steam API key)
- **PLUGIN_API_KEY:** 3NULQW7WPpW3ZquX2WzFVyvWx2y09DQEg+JBA4+JVv4=
- **OWNER_STEAM_ID:** (your Steam ID for admin access)

---

## CS2 Server Setup (DONE)

### Installation Paths
- **CS2 Server:** /home/cs2/cs2-server/
- **Metamod:** /home/cs2/cs2-server/game/csgo/addons/metamod/
- **CounterStrikeSharp:** /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/
- **Plugins:** /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/
- **Config:** /home/cs2/cs2-server/game/csgo/cfg/server.cfg

### GSLT Token
- **Surf Server:** E7DB3486189C73BEB6FC896A7DFA1D2F
- Skapa fler på: https://steamcommunity.com/dev/managegameservers (App ID: 730)

### Firewall Ports (OPENED)
- 27015/udp - Surf
- 27015/tcp - Surf
- 27016/udp - Retake
- 27016/tcp - Retake

### Steamclient Fix (DONE)
```bash
ln -sf /home/cs2/.local/share/Steam/steamcmd/linux64/steamclient.so /home/cs2/.steam/sdk64/steamclient.so
```

### Start Server Command
```bash
export LD_LIBRARY_PATH=/home/cs2/cs2-server/game/bin/linuxsteamrt64:$LD_LIBRARY_PATH
cd /home/cs2/cs2-server
./game/bin/linuxsteamrt64/cs2 -dedicated -port 27015 +map de_dust2 +sv_setsteamaccount E7DB3486189C73BEB6FC896A7DFA1D2F
```

### Screen Commands
- Starta ny: `screen -S cs2`
- Lista: `screen -ls`
- Anslut: `screen -r cs2`
- Lämna (keep running): `Ctrl+A` sen `D`
- Döda alla: `killall screen`

---

## Server Config (/home/cs2/cs2-server/game/csgo/cfg/server.cfg)

```
hostname "Ghost Surf"
sv_setsteamaccount "E7DB3486189C73BEB6FC896A7DFA1D2F"
rcon_password "GhostRcon2024"
sv_airaccelerate 150
sv_accelerate 10
sv_friction 4
sv_maxvelocity 3500
sv_staminamax 0
sv_staminajumpcost 0
sv_staminalandcost 0
sv_staminarecoveryrate 0
sv_autobunnyhopping 1
sv_enablebunnyhopping 1
mp_roundtime 60
mp_roundtime_defuse 60
mp_freezetime 0
mp_warmuptime 0
sv_cheats 0
bot_quota 0
```

---

## Project Structure

```
ghost/
├── web/                    # Next.js 14 website
│   ├── app/               # App Router pages
│   │   ├── admin/         # Admin panel (owner only)
│   │   ├── api/           # API routes
│   │   ├── cases/         # Case opening
│   │   ├── inventory/     # Player inventory
│   │   └── leaderboard/   # Rankings
│   ├── components/        # React components
│   ├── lib/               # Utilities & data
│   └── prisma/            # Database schema
│
├── plugin/                 # CS2 Plugin (C#)
│   └── GhostSouls/        # CounterStrikeSharp plugin
│       ├── GhostSouls.cs  # Main plugin
│       ├── Config.cs      # Configuration
│       └── Models.cs      # Data models
│
└── CLAUDE.md              # This file
```

---

## Rules

- **NO EMOJIS** - Use SVG icons instead
- Swedish comments are OK
- Use TypeScript for all web code
- Use C# for CS2 plugin
- Follow existing code patterns
- **BE AUTONOMOUS** - Complete tasks without asking unnecessary questions

---

## Features

### Website (DONE)
- Case opening with CS2-style animation
- Steam authentication
- Admin panel (/admin) - owner only
- Leaderboard with ELO rankings
- Inventory system with favorites

### Souls Economy
- 1 kill = 1 soul (retake/competitive)
- Bonus: +1 headshot, +3 knife
- ASCENDED premium: 2x souls

### Ranking System (ELO)
| Rank | Min ELO | Color |
|------|---------|-------|
| Haunted | 0 | Grey |
| Spirit | 800 | Light Blue |
| Phantom | 1000 | Blue |
| Specter | 1200 | Purple |
| Wraith | 1400 | Magenta |
| Shade | 1600 | Orange |
| Ghost | 1800 | Gold |
| Ascended | 2000 | Red |

### Role System
| Role | Chat Color | Tag |
|------|------------|-----|
| Owner | Red | [OWNER] |
| Admin | Orange | [ADMIN] |
| Mod | Green | [MOD] |
| ASCENDED | Dark Grey | [ASCENDED] |

---

## CURRENT STATUS

### DONE
- [x] Website med case opening
- [x] Souls economy system
- [x] Steam authentication
- [x] Admin panel (/admin)
- [x] Leaderboard med ELO
- [x] GhostSouls plugin (grundfunktioner)
- [x] ELO ranking system i plugin
- [x] Damage display i plugin
- [x] Clutch announcements i plugin
- [x] Role system med chat tags
- [x] CS2 server installerad på VPS
- [x] Metamod + CounterStrikeSharp installerat
- [x] Firewall ports öppnade (27015, 27016)
- [x] Steamclient fix
- [x] server.cfg skapad
- [x] Giveaway system (random + leaderboard)
- [x] News/announcements system

---

## WeaponPaints Integration (Skinchanger)

### Hur det fungerar
1. Spelare equippar skins på hemsidan (ghostservers.site/inventory)
2. Hemsidan skriver till `wp_player_skins` och `wp_player_knife` tabeller
3. WeaponPaints plugin läser från dessa tabeller och applicerar skins i spelet

### WeaponPaints Plugin
- **Plugin:** https://github.com/Nereziel/cs2-WeaponPaints
- **Version:** build-399+
- **Path:** `/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/WeaponPaints/`

### Databas-tabeller (wp_player_*)
```sql
-- Weapon skins
wp_player_skins (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, ...)

-- Knife model
wp_player_knife (steamid, weapon_team, knife)

-- Gloves
wp_player_gloves (steamid, weapon_team, weapon_defindex)
```

**weapon_team värden:**
- `2` = Terrorists (T)
- `3` = Counter-Terrorists (CT)

### Konfiguration
**WeaponPaints.json:** `/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/WeaponPaints/WeaponPaints.json`
```json
{
  "DatabaseHost": "localhost",
  "DatabasePort": 3306,
  "DatabaseUser": "ghost",
  "DatabasePassword": "GhostServer2024",
  "DatabaseName": "ghost_gaming"
}
```

**core.json:** `FollowCS2ServerGuidelines` måste vara `false`

### Installation (om det behövs igen)
```bash
# 1. Ladda ner
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins
wget https://github.com/Nereziel/cs2-WeaponPaints/releases/download/build-399/WeaponPaints.zip
unzip WeaponPaints.zip
chown -R cs2:cs2 WeaponPaints

# 2. Kopiera gamedata
cp plugins/WeaponPaints/gamedata/weaponpaints.json ../gamedata/

# 3. Ändra core.json
nano ../configs/core.json
# Sätt FollowCS2ServerGuidelines till false

# 4. Starta server, konfigurera databas, starta om
```

### Varning
Valve tillåter inte officiellt skin-plugins. Risk för GSLT-ban finns.

---

### FORTSÄTT HÄRIFRÅN (2026-01-11)

**Stora uppdateringar gjorda - Admin panel, Times/Records, Discord integration!**

---

### SENASTE UPPDATERING (2026-01-11)

#### Nya Admin-sidor
- [x] `/admin/settings` - Hantera announcements med färgval
- [x] `/admin/maps` - Map pool för surf/bhop med suggested maps
- [x] Dynamiska plugin-inställningar via databas

#### Surf/Bhop Times
- [x] `/times` - Leaderboard för surf/bhop records
- [x] API för att spara/hämta times (`/api/times`)
- [x] SharpTimer setup guide

#### Discord Integration
- [x] Webhook för rare drops (kniv, handskar, legendary+)
- [x] `DISCORD_WEBHOOK_URL` i .env
- [x] Automatisk notifikation vid case opening

#### Server Configs
- [x] `server-configs/surf-server.cfg` - Komplett surf config
- [x] `server-configs/bhop-server.cfg` - Komplett bhop config
- [x] No friendly fire, buy anywhere, unlimited money

#### VPS Deployment
- [x] `server-configs/VPS-DEPLOYMENT.md` - Guide för att flytta hemsidan till VPS
- [x] PM2 + Nginx + SSL setup
- [x] Snabbare API (localhost databas)

#### Nya databas-modeller
```prisma
PluginSettings    - Dynamiska plugin-inställningar
Announcement      - Roterande meddelanden med färg
MapPool           - Surf/bhop maps
PlayerTime        - Surf/bhop leaderboards
```

---

### NYA ENVIRONMENT VARIABLES
```bash
# Discord (lägg till i .env.local)
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

---

### DISCORD
- **Server:** discord.gg/aSDrPk6Y8q
- **Webhook:** Sätt DISCORD_WEBHOOK_URL i Vercel/VPS

---

### ATT GÖRA NÄST
- [ ] Konfigurera WeaponPaints.json med databas-credentials
- [ ] Installera SharpTimer på VPS
- [ ] Migrera hemsidan till VPS (valfritt, se VPS-DEPLOYMENT.md)
- [ ] Testa Discord webhooks
- [ ] Lägg till fler maps via admin panel

---

### TIDIGARE UPPDATERINGAR
- [x] Equip/Unequip skins från hemsidan (CT/T/Both)
- [x] PaintKit-mapping för 200+ CS2 skins
- [x] Sync skickar nu delta (intjänade souls) istället för att överskriva
- [x] !souls hämtar nu senaste från sidan först
- [x] Giveaway system (random + leaderboard)
- [x] News system
- [x] WeaponPaints integration för skinchanger
- [x] Team-baserade skins (CT/T/Both)
- [x] Kniv-modeller synkas (Karambit, M9, etc)
- [x] HUD som visar souls (center screen)

---

## Troubleshooting

### Server startar inte
1. Kolla LD_LIBRARY_PATH: `export LD_LIBRARY_PATH=/home/cs2/cs2-server/game/bin/linuxsteamrt64:$LD_LIBRARY_PATH`
2. Kolla steamclient symlink: `ls -la /home/cs2/.steam/sdk64/`

### Kan inte ansluta
1. Kolla att servern körs: `screen -r cs2`
2. Kolla port: `netstat -tulnp | grep 27015`
3. Kolla firewall: `sudo ufw status`
4. Se till GSLT är med i startkommandot

### "Bad cert" error
- Lägg till GSLT i startkommandot: `+sv_setsteamaccount E7DB3486189C73BEB6FC896A7DFA1D2F`

---

## Problem vi stötte på och lösningar

### 1. Metamod "undefined symbol" error
**Problem:** `metamod.2.cs2.so: undefined symbol: UtlMemory_CalcNewAllocationCount`
**Orsak:** Gammal version av Metamod
**Lösning:** Ladda ner senaste från https://mms.alliedmods.net/mmsdrop/2.0/
```bash
curl -s https://mms.alliedmods.net/mmsdrop/2.0/ | grep -o 'mmsource-2.0.0-git[0-9]*-linux.tar.gz' | tail -1
# Ladda ner senaste (t.ex. git1376)
wget https://mms.alliedmods.net/mmsdrop/2.0/mmsource-2.0.0-git1376-linux.tar.gz
```

### 2. CounterStrikeSharp "File type not supported"
**Problem:** `Failed to load plugin (File type not supported)`
**Orsak:** Gammal version av CounterStrikeSharp
**Lösning:** Ladda ner senaste från GitHub
```bash
curl -s https://api.github.com/repos/roflmuffin/CounterStrikeSharp/releases/latest | grep browser_download_url
wget https://github.com/roflmuffin/CounterStrikeSharp/releases/download/v1.0.355/counterstrikesharp-with-runtime-linux-1.0.355.zip
```

### 3. Nästlade addons-mappar efter extraktion
**Problem:** tar/unzip skapar `addons/addons/metamod` eller `addons/counterstrikesharp`
**Lösning:** Flytta mappen till rätt plats
```bash
mv addons/metamod ~/cs2-server/game/csgo/addons/
mv addons/counterstrikesharp ~/cs2-server/game/csgo/addons/
rm -rf addons
```

### 4. VDF-fil format för CounterStrikeSharp
**Problem:** `<NOFILE>` i `meta list`
**Orsak:** Fel VDF-format eller sökväg
**Lösning:** Skapa rätt VDF i addons-mappen (INTE i metamod-mappen):
```bash
cat > ~/cs2-server/game/csgo/addons/counterstrikesharp.vdf << 'EOF'
"Plugin"
{
    "file"  "addons/counterstrikesharp/bin/linuxsteamrt64/counterstrikesharp"
}
EOF
```
**VIKTIGT:** Använd `"Plugin"` INTE `"Metamod Plugin"`, och relativ sökväg!

### 5. Plugin hamnade i /root istället för /home/cs2
**Problem:** Körde kommandon som root, så filer skapades i /root/cs2-server/
**Orsak:** CS2-servern körs under `cs2`-användaren, inte root
**Lösning:** Kopiera filer till rätt plats och ändra ägare
```bash
cp /root/.../GhostSouls.dll /home/cs2/.../GhostSouls.dll
chown -R cs2:cs2 /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/
```
**VIKTIGT:** Kör alltid plugin-kommandon som `cs2`-användaren: `su - cs2`

### 6. libtier0.so not found
**Problem:** CounterStrikeSharp kan inte ladda pga saknad library
**Lösning:** Använd start-scriptet som sätter LD_LIBRARY_PATH:
```bash
# ~/start-cs2.sh
#!/bin/bash
cd /home/cs2/cs2-server
export LD_LIBRARY_PATH=/home/cs2/cs2-server/game/bin/linuxsteamrt64/:$LD_LIBRARY_PATH
./game/bin/linuxsteamrt64/cs2 -dedicated -port 27015 +sv_setsteamaccount E7DB3486189C73BEB6FC896A7DFA1D2F +map de_dust2 +host_workshop_map 3070321829
```

### Generella tips för plugin-installation
1. **Alltid kör som cs2-användaren:** `su - cs2`
2. **Extrahera till game/csgo/**, INTE game/csgo/addons/ (arkiven har addons-mapp inuti)
3. **Kolla loggar:** `cat ~/cs2-server/game/csgo/addons/counterstrikesharp/logs/*.txt`
4. **Kolla att filer finns:** `ls -la ~/cs2-server/game/csgo/addons/counterstrikesharp/plugins/PluginName/`
5. **Kolla ägare:** Ska vara `cs2:cs2`, fixa med `chown -R cs2:cs2 ...`

### VIKTIGT: Användarkontext och sökvägar
- **root** har hemkatalog `/root/` - `~` expanderar till `/root/`
- **cs2** har hemkatalog `/home/cs2/` - `~` expanderar till `/home/cs2/`
- CS2-servern och alla plugins ligger i `/home/cs2/cs2-server/`
- **ANVÄND ALLTID ABSOLUTA SÖKVÄGAR** när du kopierar filer: `/home/cs2/cs2-server/...`
- Om du är root och vill jobba med serverfiler, använd `/home/cs2/...` INTE `~/...`
- För att kopiera plugin-filer som root:
  ```bash
  cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/GhostSouls
  # Arbeta här med filer
  chown cs2:cs2 GhostSouls.dll  # Glöm inte ändra ägare!
  ```

---

## Useful Files

- **vps-commands.txt** - Kommandon för VPS setup
- **server-config.txt** - Server.cfg innehåll
- **fix-steamclient.txt** - Steamclient fix kommando
