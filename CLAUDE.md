# Ghost Gaming Project

## SSH Access (VIKTIGT FÖR CLAUDE)

### Lösenordsfri SSH-åtkomst
SSH-nyckel är konfigurerad på Davids dator. Claude kan köra kommandon direkt på VPS:en:

```bash
# Kör kommando på VPS:en
ssh ghost "kommando här"

# Exempel:
ssh ghost "pm2 status"
ssh ghost "systemctl status nginx"
ssh ghost "tail -50 /var/log/auth.log"
```

### SSH Config (~/.ssh/config)
```
Host ghost
    HostName 46.224.197.229
    User root
    IdentityFile ~/.ssh/id_ed25519
```

### Direkt VPS-åtkomst
Claude har FULL åtkomst till VPS:en via `ssh ghost "kommando"`. Använd detta för:
- Deploya uppdateringar
- Starta om tjänster
- Läsa loggar
- Hantera CS2-servern
- Köra databas-queries

### Säkerhet (2026-01-15)
- SSH lösenordsinloggning: **AVSTÄNGT**
- Endast SSH-nyckel fungerar
- fail2ban: Blockerar efter 3 misslyckade försök i 24h
- UFW brandvägg: Endast port 22, 80, 443, 27015-27016 öppna
- Automatiska säkerhetsuppdateringar: **PÅ**

---

## Infrastructure

### Domain
- **Domain:** ghostservers.site
- **Registrar:** Namecheap

### VPS (Website + Database + CS2 Servers)
- **URL:** https://www.ghostservers.site
- **GitHub:** https://github.com/Davveravve/ghostserver
- **Hosting:** Hemsidan körs på VPS (INTE Vercel)
- **Web Path:** /var/www/ghost eller /home/cs2/ghost/web
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx

### Hetzner VPS
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

### Environment Variables (VPS .env.local)
- **NEXTAUTH_URL:** https://www.ghostservers.site (VIKTIGT: inte localhost!)
- **NEXTAUTH_SECRET:** 9oPQqEUNivTzJ8TtFxH7fa8TpKw23rvsJ4Pm8fcL6IQ=
- **STEAM_API_KEY:** (user's Steam API key)
- **PLUGIN_API_KEY:** 3NULQW7WPpW3ZquX2WzFVyvWx2y09DQEg+JBA4+JVv4=
- **OWNER_STEAM_ID:** (your Steam ID for admin access)
- **DATABASE_URL:** mysql://ghost:GhostServer2024@localhost:3306/ghost_gaming

**VIKTIGT:** .env.local på VPS måste ha NEXTAUTH_URL=https://www.ghostservers.site
Om Steam login redirectar till localhost:3000 är denna variabel fel!

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

### Ladda upp egna plugins (FÖREDRAGEN METOD)
Använd base64 via PowerShell + SSH istället för SCP/SFTP:

**Steg 1 - Windows PowerShell (kopierar till clipboard):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\david\Desktop\ghost\plugin\PLUGINNAME\bin\Release\net8.0\PLUGINNAME.dll")) | clip
```

**Steg 2 - SSH till VPS:**
```bash
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/PLUGINNAME/
cat > temp.b64 << 'EOF'
# Klistra in texten (Ctrl+Shift+V), tryck Enter, skriv EOF
EOF
base64 -d temp.b64 > PLUGINNAME.dll
rm temp.b64
chown cs2:cs2 PLUGINNAME.dll
```

**Steg 3 - Starta om servern och verifiera:**
```bash
pkill -f cs2
su - cs2
screen -S surf
./start-surf.sh
# I konsolen: css_plugins list
```

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
├── plugin/                 # CS2 Plugins (C#)
│   ├── GhostSouls/        # Economy, ranks, chat tags
│   ├── GhostTimer/        # Surf timer, speedometer, PB/SR
│   └── GhostSkins/        # Skinchanger från databas
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

## Skinchanger (WeaponPaints)

### Hur det fungerar
1. Spelare equippar skins på hemsidan (ghostservers.site/inventory)
2. Hemsidan skriver till `wp_player_skins` och `wp_player_knife` tabeller
3. WeaponPaints plugin läser från dessa tabeller och applicerar skins i spelet

### WeaponPaints Plugin (Nereziel/cs2-WeaponPaints)
- **Path:** `/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/WeaponPaints/`
- **Config:** `/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/WeaponPaints/WeaponPaints.json`
- **Gamedata:** `/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/gamedata/weaponpaints.json`
- **Kommandon:** !ws, !knife, !gloves, !wp (refresh)
- **Dependencies:** MenuManagerCore, PlayerSettings, AnyBaseLib

### VIKTIGT: core.json
För att skins ska fungera MÅSTE denna inställning vara false:
```json
"FollowCS2ServerGuidelines": false
```

### Databas-tabeller (wp_player_*)
```sql
wp_player_skins (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed)
wp_player_knife (steamid, weapon_team, knife)
wp_player_gloves (steamid, weapon_team, weapon_defindex)
```

**weapon_team värden:** `2` = T, `3` = CT

### Varning
Valve tillåter inte officiellt skin-plugins. Risk för GSLT-ban finns.

---

### DISCORD
- **Server:** discord.gg/aSDrPk6Y8q
- **Webhook:** Sätt DISCORD_WEBHOOK_URL i .env.local

---

## ATT GÖRA (2026-01-18)
- [ ] **Testa skins i spelet** - Anslut och testa !ws, !knife, !wp kommandon
- [ ] Verifiera att skins appliceras korrekt efter spawn

### KLART (2026-01-18)
- [x] **WeaponPaints ominstallerad** - Build 399 med alla filer
- [x] **WeaponPaints konfigurerad** - Komplett config med SkinEnabled: true
- [x] **GhostSouls fixad** - Använder nu localhost API (http://127.0.0.1:3000)
- [x] **GhostSouls config fixad** - MinKillIntervalSeconds var float, ändrat till int
- [x] **Test-skins tillagda** i databasen:
  - AK-47 Asiimov, M4A4 Howl, AWP Asiimov
  - Karambit Fade, Deagle Blaze, Glock Fade
  - USP-S Kill Confirmed (CT)
- [x] **CounterStrikeSharp uppdaterad** till v356
- [x] **Gamedata signatur verifierad** - Fungerar enligt cs2-signatures tracker
- [x] **core.json konfigurerad** - `FollowCS2ServerGuidelines: false`

### Nuvarande Plugin-status (2026-01-18)
| Plugin | Status | Notering |
|--------|--------|----------|
| GhostTimer | OK | Fungerar, visar PB/SR |
| GhostSouls | OK | Använder localhost API |
| WeaponPaints | OK | Build 399, laddar korrekt |
| MenuManagerCore | OK | Dependency för WeaponPaints |
| PlayerSettings | OK | Dependency för MenuManager |

### Test-skins i databasen (steamid: 76561198295991343)
| Vapen | Paint ID | Skin |
|-------|----------|------|
| Karambit | 38 | Fade |
| AK-47 | 801 | Asiimov |
| M4A4 | 309 | Howl |
| AWP | 344 | Asiimov |
| Deagle | 37 | Blaze |
| Glock | 586 | Fade |
| USP-S | 504 | Kill Confirmed |

### WeaponPaints Config
```
Path: /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/WeaponPaints/WeaponPaints.json
DatabaseHost: 127.0.0.1
DatabaseUser: ghost
DatabaseName: ghost_gaming
SkinEnabled: true
KnifeEnabled: true
GloveEnabled: true
```

### KLART (2026-01-15)
- [x] **VPS reinstallerad** - Servern var hackad med rootkit, helt ominstallerad
- [x] **Säkerhetshärdning** - SSH-nyckel, fail2ban, UFW, auto-updates
- [x] **MySQL installerad** - ghost_gaming databas skapad
- [x] **Node.js 20 + PM2** - Webbplats körs på PM2
- [x] **Nginx + SSL** - Let's Encrypt certifikat för ghostservers.site
- [x] **Webbplats uppladdad** - https://www.ghostservers.site
- [x] **CS2-server installeras** - SteamCMD + CS2 dedicated server

### KLART (2026-01-12)
- [x] GhostTimer flimmer - Fixat (rundar speed till närmaste 10, cachar HUD)
- [x] GhostTimer stage reset - Fixat (timer resettas BARA vid !r, inte vid zones)
- [x] GhostTimer laddade inte - Fixat (tog bort !help konflikt med GhostSouls, fixade HttpClient init)
- [x] GhostSkins skapad - Ny plugin som läser skins från databasen (ersätter WeaponPaints)
- [x] Alla plugins byggda och redo för upload

---

## UPLOAD INSTRUKTIONER (2026-01-13)

GhostTimer är redan uppladdad. Följande plugins behöver laddas upp:

### 1. GhostSouls.dll
**PowerShell (kopiera till clipboard):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\david\Desktop\ghost\plugin\GhostSouls\bin\Release\net8.0\GhostSouls.dll")) | Set-Clipboard
```

**VPS:**
```bash
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/GhostSouls/
cat > temp.b64 << 'EOF'
# KLISTRA IN HÄR (Ctrl+Shift+V), tryck Enter, skriv EOF
EOF
base64 -d temp.b64 > GhostSouls.dll && rm temp.b64
```

### 2. GhostSkins.dll (NY PLUGIN)
**PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\david\Desktop\ghost\plugin\GhostSkins\bin\Release\net8.0\GhostSkins.dll")) | Set-Clipboard
```

**VPS:**
```bash
mkdir -p /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/GhostSkins/
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/GhostSkins/
cat > temp.b64 << 'EOF'
# KLISTRA IN HÄR
EOF
base64 -d temp.b64 > GhostSkins.dll && rm temp.b64
```

### 3. MySqlConnector.dll (krävs för GhostSkins)
**PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\david\Desktop\ghost\plugin\GhostSkins\bin\Release\net8.0\MySqlConnector.dll")) | Set-Clipboard
```

**VPS:**
```bash
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/GhostSkins/
cat > temp.b64 << 'EOF'
# KLISTRA IN HÄR
EOF
base64 -d temp.b64 > MySqlConnector.dll && rm temp.b64
```

### 4. Fixa permissions och starta om
```bash
chown -R cs2:cs2 /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/
su - cs2
screen -S surf
./start-surf.sh
```

### 5. Verifiera i konsolen
```
css_plugins list
```
Ska visa: GhostTimer, GhostSouls, GhostSkins

---

## Surf Server Setup (2026-01-11)

### Installerade Plugins (2026-01-18)
| Plugin | Status | Notering |
|--------|--------|----------|
| GhostTimer | OK | v2.1 - speedometer, PB, SR, souls display |
| GhostSouls | LADDAR | v2.1 - API-fel (401), behöver rätt API-nyckel |
| WeaponPaints | PROBLEM | Laddar men skins appliceras inte |
| MenuManagerCore | OK | Dependency för WeaponPaints |
| PlayerSettings | OK | Dependency för MenuManager |

### Workshop Maps Symlink (VIKTIGT!)
Maps laddas ner till fel plats. Skapa symlink:
```bash
mkdir -p /home/cs2/cs2-server/steamapps/workshop/content
ln -s /home/cs2/.local/share/Steam/steamapps/workshop/content/730 /home/cs2/cs2-server/steamapps/workshop/content/730
```

### Steamcmd Path
```bash
/home/cs2/.local/share/Steam/steamcmd/steamcmd.sh
```

### Nedladdade Surf Maps
```
3070321829 - surf_beginner
3073875025 - surf_utopia_njv
3076153623 - surf_kitsune
3082548297 - surf_rookie
3076980482 - surf_mesa_revo
3088413071 - surf_ace
3098972556 - surf_benevolent
```

### Start Script
```bash
# /home/cs2/start-surf.sh
#!/bin/bash
cd /home/cs2/cs2-server
export LD_LIBRARY_PATH=/home/cs2/cs2-server/game/bin/linuxsteamrt64/:$LD_LIBRARY_PATH
./game/bin/linuxsteamrt64/cs2 -dedicated -port 27015 +sv_setsteamaccount E7DB3486189C73BEB6FC896A7DFA1D2F +exec server.cfg +host_workshop_map 3070321829
```

### Server Config
- **Path:** /home/cs2/cs2-server/game/csgo/cfg/server.cfg
- **Timelimit:** 25 minuter per map
- **Hostname:** Ghost Surf | T1-T3 | ghostservers.site

---

## Troubleshooting

### Server startar inte
```bash
export LD_LIBRARY_PATH=/home/cs2/cs2-server/game/bin/linuxsteamrt64:$LD_LIBRARY_PATH
```

### Plugin laddas inte
1. Kolla loggar: `cat /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/logs/*.txt`
2. Kolla ägare: `chown -R cs2:cs2 /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/`
3. Verifiera: `css_plugins list` i serverkonsolen

### VIKTIGT: Alltid använd absoluta sökvägar
- CS2 körs som `cs2`-användaren, inte root
- Plugins ligger i `/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/`
- Använd ALDRIG `~/` som root - det pekar på `/root/`, inte `/home/cs2/`
