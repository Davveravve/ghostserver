#!/bin/bash
# Ghost Gaming - Surf Server Installation Script
# Run as root, then switch to cs2 user for server operations

set -e

echo "=========================================="
echo "  Ghost Gaming - Surf Server Installer"
echo "=========================================="

# Check if running as cs2
if [ "$(whoami)" != "cs2" ]; then
    echo "ERROR: Run this script as cs2 user!"
    echo "Usage: su - cs2 && bash install-surf-server.sh"
    exit 1
fi

CS2_DIR="/home/cs2/cs2-server"
PLUGINS_DIR="$CS2_DIR/game/csgo/addons/counterstrikesharp/plugins"
CONFIGS_DIR="$CS2_DIR/game/csgo/addons/counterstrikesharp/configs"
CFG_DIR="$CS2_DIR/game/csgo/cfg"

echo ""
echo "[1/6] Installing SharpTimer..."
cd $PLUGINS_DIR
if [ ! -d "SharpTimer" ]; then
    wget -q https://github.com/DEAFPS/SharpTimer/releases/latest/download/SharpTimer.zip
    unzip -q SharpTimer.zip && rm SharpTimer.zip
    echo "  -> SharpTimer installed"
else
    echo "  -> SharpTimer already exists, skipping"
fi

echo ""
echo "[2/6] Installing RockTheVote..."
if [ ! -d "RockTheVote" ] && [ ! -d "cs2-rockthevote" ]; then
    wget -q https://github.com/abnerfs/cs2-rockthevote/releases/latest/download/cs2-rockthevote.zip
    unzip -q cs2-rockthevote.zip && rm cs2-rockthevote.zip
    echo "  -> RockTheVote installed"
else
    echo "  -> RockTheVote already exists, skipping"
fi

echo ""
echo "[3/6] Installing WeaponPaints..."
if [ ! -d "WeaponPaints" ]; then
    wget -q https://github.com/Nereziel/cs2-WeaponPaints/releases/latest/download/WeaponPaints.zip
    unzip -q WeaponPaints.zip && rm WeaponPaints.zip

    # Copy gamedata
    if [ -f "WeaponPaints/gamedata/weaponpaints.json" ]; then
        cp WeaponPaints/gamedata/weaponpaints.json $CS2_DIR/game/csgo/addons/counterstrikesharp/gamedata/
    fi
    echo "  -> WeaponPaints installed"
else
    echo "  -> WeaponPaints already exists, skipping"
fi

echo ""
echo "[4/6] Checking GhostSouls..."
if [ -d "GhostSouls" ]; then
    echo "  -> GhostSouls found"
else
    echo "  -> WARNING: GhostSouls not found! Upload manually."
fi

echo ""
echo "[5/6] Fixing core.json..."
CORE_JSON="$CONFIGS_DIR/core.json"
if [ -f "$CORE_JSON" ]; then
    # Update FollowCS2ServerGuidelines to false
    sed -i 's/"FollowCS2ServerGuidelines":\s*true/"FollowCS2ServerGuidelines": false/g' "$CORE_JSON"
    echo "  -> core.json updated"
else
    echo '{"FollowCS2ServerGuidelines": false}' > "$CORE_JSON"
    echo "  -> core.json created"
fi

echo ""
echo "[6/6] Creating start script..."
cat > /home/cs2/start-surf.sh << 'STARTEOF'
#!/bin/bash
# Ghost Surf Server Start Script

cd /home/cs2/cs2-server
export LD_LIBRARY_PATH=/home/cs2/cs2-server/game/bin/linuxsteamrt64/:$LD_LIBRARY_PATH

./game/bin/linuxsteamrt64/cs2 -dedicated -port 27015 \
    +sv_setsteamaccount E7DB3486189C73BEB6FC896A7DFA1D2F \
    +exec server.cfg \
    +host_workshop_map 3070321829
STARTEOF

chmod +x /home/cs2/start-surf.sh
echo "  -> start-surf.sh created"

echo ""
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Copy config files to VPS:"
echo "   - server.cfg -> $CFG_DIR/server.cfg"
echo "   - maplist.txt -> $CONFIGS_DIR/plugins/RockTheVote/maplist.txt"
echo ""
echo "2. Start server and generate plugin configs:"
echo "   screen -S surf"
echo "   ./start-surf.sh"
echo "   (wait 30 sec, then Ctrl+C to stop)"
echo ""
echo "3. Configure plugins:"
echo "   - Edit $CONFIGS_DIR/plugins/SharpTimer/config.json"
echo "   - Edit $CONFIGS_DIR/plugins/RockTheVote/RockTheVote.json"
echo "   - Edit $CONFIGS_DIR/plugins/WeaponPaints/WeaponPaints.json"
echo ""
echo "4. Restart server:"
echo "   screen -S surf"
echo "   ./start-surf.sh"
echo "   (Ctrl+A, D to detach)"
echo ""
echo "5. Verify plugins:"
echo "   In server console: css_plugins list"
echo ""
echo "Connect: connect 46.224.197.229:27015"
echo "=========================================="
