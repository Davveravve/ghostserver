#!/bin/bash
# ===========================================
# GHOST SURF SERVER - QUICK INSTALL
# Copy-paste this entire script into SSH
# ===========================================

echo "======================================"
echo "  Ghost Surf Server - Quick Install"
echo "======================================"

# Byt till cs2 användaren
cd /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins

echo ""
echo "[1/5] Installing SharpTimer..."
if [ ! -d "SharpTimer" ]; then
    wget -q --show-progress https://github.com/DEAFPS/SharpTimer/releases/latest/download/SharpTimer.zip
    unzip -o -q SharpTimer.zip && rm -f SharpTimer.zip
    echo "OK"
else
    echo "Already installed"
fi

echo ""
echo "[2/5] Installing RockTheVote..."
if [ ! -d "RockTheVote" ]; then
    wget -q --show-progress https://github.com/abnerfs/cs2-rockthevote/releases/latest/download/cs2-rockthevote.zip
    unzip -o -q cs2-rockthevote.zip && rm -f cs2-rockthevote.zip
    echo "OK"
else
    echo "Already installed"
fi

echo ""
echo "[3/5] Installing WeaponPaints..."
if [ ! -d "WeaponPaints" ]; then
    wget -q --show-progress https://github.com/Nereziel/cs2-WeaponPaints/releases/latest/download/WeaponPaints.zip
    unzip -o -q WeaponPaints.zip && rm -f WeaponPaints.zip
    # Kopiera gamedata
    cp -f WeaponPaints/gamedata/weaponpaints.json /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/gamedata/ 2>/dev/null
    echo "OK"
else
    echo "Already installed"
fi

echo ""
echo "[4/5] Setting permissions..."
chown -R cs2:cs2 /home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins/
echo "OK"

echo ""
echo "[5/5] Fixing core.json..."
CORE="/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs/core.json"
if [ -f "$CORE" ]; then
    sed -i 's/"FollowCS2ServerGuidelines":\s*true/"FollowCS2ServerGuidelines": false/g' "$CORE"
else
    echo '{"FollowCS2ServerGuidelines": false}' > "$CORE"
fi
echo "OK"

echo ""
echo "======================================"
echo "  Plugins Installed!"
echo "======================================"
echo ""
echo "Installed plugins:"
ls -d */ 2>/dev/null | sed 's/\///'
echo ""
