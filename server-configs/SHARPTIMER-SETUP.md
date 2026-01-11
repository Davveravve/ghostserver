# SharpTimer Installation - Surf/Bhop Timer

## Om SharpTimer
SharpTimer är den mest populära timer-pluginen för CS2 surf/bhop.
- GitHub: https://github.com/DEAFPS/SharpTimer
- Funktioner: Timer, checkpoints, teleport, leaderboards, !r, !cp, !tp

---

## Installation

### 1. Ladda ner SharpTimer

```bash
# Logga in som cs2
su - cs2

# Gå till plugins-mappen
cd ~/cs2-server/game/csgo/addons/counterstrikesharp/plugins

# Ladda ner senaste releasen
wget https://github.com/DEAFPS/SharpTimer/releases/latest/download/SharpTimer.zip
unzip SharpTimer.zip
rm SharpTimer.zip

# Kontrollera att det finns
ls -la SharpTimer/
```

### 2. Konfigurera databas

SharpTimer lagrar times i MySQL/MariaDB.

```bash
# Logga in på MySQL
mysql -u root -p

# I MySQL:
USE ghost_gaming;

# SharpTimer skapar sina egna tabeller automatiskt
# Men vi kan förbereda konfigurationen
```

### 3. Konfigurera SharpTimer

```bash
# Starta servern en gång för att generera config
# Stoppa sedan och redigera

nano ~/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/SharpTimer/config.json
```

**config.json:**
```json
{
  "PluginEnabled": true,
  "DatabaseType": "MySQL",
  "MySqlHost": "localhost",
  "MySqlPort": 3306,
  "MySqlUser": "ghost",
  "MySqlPassword": "GhostServer2024",
  "MySqlDatabase": "ghost_gaming",

  "SurfEnabled": true,
  "BhopEnabled": true,

  "RespawnEnabled": true,
  "CheckpointsEnabled": true,

  "GlobalRanksEnabled": true,
  "VelocityEnabled": true,
  "KeysOverlayEnabled": true,

  "SREnabled": true,
  "SRMessage": "You beat the server record! New SR: {time}",

  "WREnabled": true,
  "WRMessage": "NEW WORLD RECORD by {player}! Time: {time}",

  "ChatPrefix": "[Ghost]",

  "StartZoneTrigger": "trigger_start",
  "EndZoneTrigger": "trigger_end"
}
```

---

## Kommandon

### Spelare
| Kommando | Beskrivning |
|----------|-------------|
| `!r` | Respawn/reset |
| `!cp` | Save checkpoint |
| `!tp` | Teleport to checkpoint |
| `!top` | Top 10 times |
| `!wr` | World record |
| `!pb` | Personal best |
| `!rank` | Your rank |
| `!stage` | Go to stage (if map has stages) |
| `!bonus` | Go to bonus |
| `!hide` | Hide other players |
| `!spec` | Spectate |

### Admin
| Kommando | Beskrivning |
|----------|-------------|
| `!settier <1-6>` | Set map tier |
| `!setstart` | Set start zone |
| `!setend` | Set end zone |
| `!deleterecord <player>` | Delete a record |

---

## Map Zoner

De flesta surf/bhop maps har redan zones. Om inte:

### Automatisk zondetektering
SharpTimer försöker hitta triggers automatiskt:
- `trigger_teleport_start`
- `trigger_teleport_end`
- `trigger_start`
- `trigger_end`

### Manuellt sätta zoner
Om kartan saknar triggers:
```
!setstart  - Sätt startzon (stå i position)
!setend    - Sätt slutzon
```

---

## Integrera med Ghost Gaming

### API för leaderboards

Skapa ett API på hemsidan som hämtar SharpTimer-data:

**Tabeller som SharpTimer skapar:**
- `PlayerRecords` - Alla tider
- `PlayerStats` - Spelarstatistik

### Hämta leaderboard
```sql
SELECT
    SteamID,
    PlayerName,
    TimerTicks,
    FormattedTime
FROM PlayerRecords
WHERE MapName = 'surf_utopia'
ORDER BY TimerTicks ASC
LIMIT 10;
```

---

## Starta server med map

```bash
# Surf
./game/bin/linuxsteamrt64/cs2 -dedicated -port 27015 \
  +sv_setsteamaccount YOUR_GSLT \
  +host_workshop_map 3070321829 \
  +exec server.cfg

# Bhop
./game/bin/linuxsteamrt64/cs2 -dedicated -port 27016 \
  +sv_setsteamaccount YOUR_GSLT \
  +host_workshop_map 3104517802 \
  +exec server.cfg
```

---

## Felsökning

### Timer startar inte
- Kolla att kartan har rätt triggers
- Kör `!setstart` och `!setend` manuellt

### Databas-fel
- Kolla MySQL credentials i config
- Kolla att ghost-användaren har access

### Plugin laddar inte
- Kolla loggar: `cat ~/cs2-server/game/csgo/addons/counterstrikesharp/logs/*.txt`
- Kontrollera att CounterStrikeSharp är uppdaterat

---

## Bonus: Styles

SharpTimer stöder olika styles:
- Normal
- Sideways
- W-Only
- Backwards
- etc.

Aktivera i config:
```json
{
  "StylesEnabled": true,
  "AvailableStyles": ["Normal", "Sideways", "W-Only"]
}
```
