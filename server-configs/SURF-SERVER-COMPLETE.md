# Ghost Gaming - Complete Surf Server Setup

Komplett guide for att satta upp surf-servern med alla plugins.

---

## Plugin Stack

| Plugin | Funktion |
|--------|----------|
| **SharpTimer** | Surf timer, checkpoints, leaderboards |
| **cs2-rockthevote** | Map voting system |
| **WeaponPaints** | Skinchanger |
| **GhostSouls** | Souls economy, ranks, chat tags |

---

## 1. SharpTimer Installation

```bash
# Logga in som cs2
su - cs2
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins

# Ladda ner SharpTimer
wget https://github.com/DEAFPS/SharpTimer/releases/latest/download/SharpTimer.zip
unzip SharpTimer.zip && rm SharpTimer.zip
```

---

## 2. RockTheVote Installation (Map Voting)

```bash
# Ladda ner cs2-rockthevote
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins
wget https://github.com/abnerfs/cs2-rockthevote/releases/latest/download/cs2-rockthevote.zip
unzip cs2-rockthevote.zip && rm cs2-rockthevote.zip
```

---

## 3. WeaponPaints Installation

```bash
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins
wget https://github.com/Nereziel/cs2-WeaponPaints/releases/latest/download/WeaponPaints.zip
unzip WeaponPaints.zip && rm WeaponPaints.zip

# Kopiera gamedata
cp /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/WeaponPaints/gamedata/weaponpaints.json /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/gamedata/
```

---

## 4. GhostSouls Plugin

Ladda upp GhostSouls.dll till:
```
/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/GhostSouls/
```

---

## 5. Plugin Configs

Starta servern en gang for att generera configs, stoppa sedan och konfigurera:

### SharpTimer Config
`/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/SharpTimer/config.json`

Se separat fil: `sharptimer-config.json`

### RockTheVote Config
`/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/RockTheVote/RockTheVote.json`

Se separat fil: `rockthevote-config.json`

### WeaponPaints Config
`/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/WeaponPaints/WeaponPaints.json`

Se separat fil: `weaponpaints-config.json`

---

## 6. Map Pool Setup

Skapa maplist for RockTheVote:
`/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/RockTheVote/maplist.txt`

Se separat fil: `surf-maplist.txt`

---

## 7. Server.cfg

Kopiera `surf-server.cfg` till:
```
/home/cs2/cs2-server/game/csgo/cfg/server.cfg
```

---

## 8. Core.json Fix (Viktigt!)

For WeaponPaints, andra `FollowCS2ServerGuidelines` till `false`:

```bash
nano /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/core.json
```

```json
{
  "FollowCS2ServerGuidelines": false
}
```

---

## 9. Starta Servern

```bash
# Skapa start-script
cat > /home/cs2/start-surf.sh << 'EOF'
#!/bin/bash
cd /home/cs2/cs2-server
export LD_LIBRARY_PATH=/home/cs2/cs2-server/game/bin/linuxsteamrt64/:$LD_LIBRARY_PATH
./game/bin/linuxsteamrt64/cs2 -dedicated -port 27015 \
  +sv_setsteamaccount E7DB3486189C73BEB6FC896A7DFA1D2F \
  +exec server.cfg \
  +host_workshop_map 3070321829
EOF

chmod +x /home/cs2/start-surf.sh

# Starta i screen
screen -S surf
./start-surf.sh
# Ctrl+A, D for att lamna
```

---

## 10. Verifiera Installation

```bash
# I server-konsolen
meta list          # Ska visa CounterStrikeSharp
css_plugins list   # Ska visa alla plugins:
                   # - SharpTimer
                   # - RockTheVote
                   # - WeaponPaints
                   # - GhostSouls
```

---

## Kommandon for Spelare

### Timer
| Kommando | Beskrivning |
|----------|-------------|
| `!r` | Respawn/restart |
| `!cp` | Spara checkpoint |
| `!tp` | Teleporta till checkpoint |
| `!top` | Top 10 tider |
| `!wr` | World record |
| `!pb` | Personal best |
| `!rank` | Din rank |
| `!hide` | Gom andra spelare |

### Map Voting
| Kommando | Beskrivning |
|----------|-------------|
| `!rtv` | Rock the vote |
| `!nominate` | Nominera map |
| `!timeleft` | Tid kvar pa map |
| `!nextmap` | Nasta map |

### Skins
| Kommando | Beskrivning |
|----------|-------------|
| `!ws` | Oppna skin-meny |
| `!knife` | Valj kniv |
| `!gloves` | Valj handskar |

### Ghost
| Kommando | Beskrivning |
|----------|-------------|
| `!souls` | Visa souls |
| `!rank` | Visa ELO rank |
| `!help` | Hjalp |

---

## Troubleshooting

### Plugin laddar inte
```bash
cat /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/logs/*.txt
```

### Databas-problem
```bash
# Testa anslutning
mysql -u ghost -pGhostServer2024 -h localhost ghost_gaming -e "SHOW TABLES;"
```

### Map downloads
Spelare behover Steam Workshop items. Maps laddas ner automatiskt.

---

## Firewall

Port 27015 ska redan vara oppen:
```bash
sudo ufw status
# Om inte:
sudo ufw allow 27015/udp
sudo ufw allow 27015/tcp
```
