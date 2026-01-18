# Plugin Upload Guide

Alla plugins är byggda och redo. Följ dessa steg för att ladda upp till VPS.

## Steg 1: Öppna två terminaler

**Terminal 1:** PowerShell på Windows
**Terminal 2:** SSH till VPS: `ssh root@46.224.197.229`

---

## Steg 2: Stoppa servern (VPS)

```bash
pkill -f cs2
```

---

## Steg 3: Ladda upp GhostTimer

**PowerShell (kopiera till clipboard):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\david\Desktop\ghost\plugin\GhostTimer\bin\Release\net8.0\GhostTimer.dll")) | Set-Clipboard
```

**VPS:**
```bash
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/GhostTimer/
cat > temp.b64 << 'EOF'
```
*Klistra in (Ctrl+Shift+V), tryck Enter, skriv EOF, tryck Enter*
```bash
EOF
base64 -d temp.b64 > GhostTimer.dll && rm temp.b64
```

---

## Steg 4: Ladda upp GhostSouls

**PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\david\Desktop\ghost\plugin\GhostSouls\bin\Release\net8.0\GhostSouls.dll")) | Set-Clipboard
```

**VPS:**
```bash
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/GhostSouls/
cat > temp.b64 << 'EOF'
```
*Klistra in, Enter, EOF, Enter*
```bash
EOF
base64 -d temp.b64 > GhostSouls.dll && rm temp.b64
```

**Ladda upp GhostSouls config:**

**PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\david\Desktop\ghost\plugin\GhostSouls\config\GhostSouls.json")) | Set-Clipboard
```

**VPS:**
```bash
mkdir -p /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/GhostSouls/
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/GhostSouls/
cat > temp.b64 << 'EOF'
```
*Klistra in, Enter, EOF, Enter*
```bash
EOF
base64 -d temp.b64 > GhostSouls.json && rm temp.b64
```

---

## Steg 5: Ladda upp GhostSkins

**PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\david\Desktop\ghost\plugin\GhostSkins\bin\Release\net8.0\GhostSkins.dll")) | Set-Clipboard
```

**VPS:**
```bash
mkdir -p /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/GhostSkins/
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/GhostSkins/
cat > temp.b64 << 'EOF'
```
*Klistra in, Enter, EOF, Enter*
```bash
EOF
base64 -d temp.b64 > GhostSkins.dll && rm temp.b64
```

**Ladda upp MySqlConnector.dll (krävs för GhostSkins):**

**PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\david\Desktop\ghost\plugin\GhostSkins\bin\Release\net8.0\MySqlConnector.dll")) | Set-Clipboard
```

**VPS:**
```bash
cat > temp.b64 << 'EOF'
```
*Klistra in, Enter, EOF, Enter*
```bash
EOF
base64 -d temp.b64 > MySqlConnector.dll && rm temp.b64
```

**Ladda upp GhostSkins config:**

**PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\david\Desktop\ghost\plugin\GhostSkins\GhostSkins.json")) | Set-Clipboard
```

**VPS:**
```bash
mkdir -p /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/GhostSkins/
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/plugins/GhostSkins/
cat > temp.b64 << 'EOF'
```
*Klistra in, Enter, EOF, Enter*
```bash
EOF
base64 -d temp.b64 > GhostSkins.json && rm temp.b64
```

---

## Steg 6: Fixa permissions och starta servern

```bash
chown -R cs2:cs2 /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/
su - cs2
screen -S surf
./start-surf.sh
```

---

## Steg 7: Verifiera i serverkonsolen

```
css_plugins list
```

Ska visa:
- GhostTimer v2.2.0
- GhostSouls v2.1.0
- GhostSkins v2.0.0

---

## Ändringar i denna version

### GhostTimer v2.2.0
- HUD visar nu ENDAST speed och tid (borttaget: souls, PB, SR)
- Flimmer reducerat genom bättre caching
- Speed avrundas till närmaste 100
- Uppdateringsfrekvens sänkt till 4 Hz

### GhostSouls v2.1.0
- Config flyttad till configs/plugins/GhostSouls/
- Rätt API URL (www.ghostservers.site)
- SoulsPerMinute aktiverad för surf (3 souls/min)

### GhostSkins v2.0.0
- Läser skins direkt från databas (wp_player_skins, wp_player_knife)
- Ingen API-konflikt med GhostSouls
