#!/bin/bash
# ===========================================
# GHOST SURF SERVER - FULL INSTALLATION
# SSH to VPS as root, then paste this script
# ===========================================

set -e

echo "==========================================="
echo "  Ghost Gaming - Surf Server Full Install"
echo "==========================================="

CS2_DIR="/home/cs2/cs2-server"
PLUGINS_DIR="$CS2_DIR/game/csgo/addons/counterstrikesharp/plugins"
CONFIGS_DIR="$CS2_DIR/game/csgo/addons/counterstrikesharp/configs"
CFG_DIR="$CS2_DIR/game/csgo/cfg"

# ============================================
# PART 1: INSTALL PLUGINS
# ============================================

echo ""
echo "=== INSTALLING PLUGINS ==="
cd $PLUGINS_DIR

echo "[1/4] SharpTimer..."
if [ ! -d "SharpTimer" ]; then
    wget -q https://github.com/DEAFPS/SharpTimer/releases/latest/download/SharpTimer.zip
    unzip -o -q SharpTimer.zip && rm -f SharpTimer.zip
    echo "  -> Installed"
else
    echo "  -> Already exists"
fi

echo "[2/4] RockTheVote..."
if [ ! -d "RockTheVote" ]; then
    wget -q https://github.com/abnerfs/cs2-rockthevote/releases/latest/download/cs2-rockthevote.zip
    unzip -o -q cs2-rockthevote.zip && rm -f cs2-rockthevote.zip
    echo "  -> Installed"
else
    echo "  -> Already exists"
fi

echo "[3/4] WeaponPaints..."
if [ ! -d "WeaponPaints" ]; then
    wget -q https://github.com/Nereziel/cs2-WeaponPaints/releases/latest/download/WeaponPaints.zip
    unzip -o -q WeaponPaints.zip && rm -f WeaponPaints.zip
    cp -f WeaponPaints/gamedata/weaponpaints.json $CS2_DIR/game/csgo/addons/counterstrikesharp/gamedata/ 2>/dev/null || true
    echo "  -> Installed"
else
    echo "  -> Already exists"
fi

echo "[4/4] GhostSouls check..."
if [ -d "GhostSouls" ]; then
    echo "  -> Found"
else
    echo "  -> NOT FOUND (upload manually)"
fi

# ============================================
# PART 2: CREATE SERVER.CFG
# ============================================

echo ""
echo "=== CREATING SERVER.CFG ==="

cat > $CFG_DIR/server.cfg << 'SERVERCFG'
// Ghost Gaming - Surf Server Config
hostname "Ghost Surf | T1-T3 | ghostservers.site"
sv_setsteamaccount "E7DB3486189C73BEB6FC896A7DFA1D2F"
rcon_password "GhostRcon2024"

// ----- SURF MOVEMENT -----
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

// ----- GAMEPLAY -----
mp_roundtime 60
mp_roundtime_defuse 60
mp_freezetime 0
mp_warmuptime 0
mp_timelimit 25
mp_maxrounds 0
mp_warmup_pausetimer 0

// ----- NO FRIENDLY FIRE -----
mp_friendlyfire 0
mp_teammates_are_enemies 0
ff_damage_reduction_bullets 0
ff_damage_reduction_grenade 0
ff_damage_reduction_other 0

// ----- BUY ANYWHERE -----
mp_buytime 60000
mp_buy_anywhere 1
mp_buy_during_immunity 1

// ----- UNLIMITED MONEY -----
mp_startmoney 16000
mp_maxmoney 16000
mp_afterroundmoney 16000
cash_player_bomb_defused 0
cash_player_bomb_planted 0
cash_player_damage_hostage 0
cash_player_interact_with_hostage 0
cash_player_killed_enemy_default 0
cash_player_killed_enemy_factor 0
cash_player_killed_hostage 0
cash_player_killed_teammate 0
cash_player_rescued_hostage 0
cash_team_elimination_bomb_map 0
cash_team_elimination_hostage_map_ct 0
cash_team_elimination_hostage_map_t 0
cash_team_hostage_alive 0
cash_team_hostage_interaction 0
cash_team_loser_bonus 0
cash_team_loser_bonus_consecutive_rounds 0
cash_team_planted_bomb_but_defused 0
cash_team_rescued_hostage 0
cash_team_terrorist_win_bomb 0
cash_team_win_by_defusing_bomb 0
cash_team_win_by_hostage_rescue 0
cash_team_win_by_time_running_out_bomb 0
cash_team_win_by_time_running_out_hostage 0

// ----- DISABLE ANNOYING STUFF -----
sv_cheats 0
bot_quota 0
sv_alltalk 1
sv_full_alltalk 1
sv_deadtalk 1
sv_competitive_official_5v5 0
mp_limitteams 0
mp_autoteambalance 0
mp_solid_teammates 0
mp_weapons_allow_map_placed 1
sv_ignoregrenaderadio 1

// ----- RESPAWN -----
mp_respawn_on_death_ct 1
mp_respawn_on_death_t 1
mp_respawnwavetime_ct 0
mp_respawnwavetime_t 0

// ----- DISABLE OBJECTIVES -----
mp_ignore_round_win_conditions 1
mp_playercashawards 0
mp_teamcashawards 0

// ----- PERFORMANCE -----
sv_minrate 786432
sv_maxrate 0
sv_minupdaterate 128
sv_maxupdaterate 128
sv_mincmdrate 128
sv_maxcmdrate 128
SERVERCFG

echo "  -> server.cfg created"

# ============================================
# PART 3: FIX CORE.JSON
# ============================================

echo ""
echo "=== FIXING CORE.JSON ==="

CORE="$CONFIGS_DIR/core.json"
if [ -f "$CORE" ]; then
    sed -i 's/"FollowCS2ServerGuidelines":\s*true/"FollowCS2ServerGuidelines": false/g' "$CORE"
    echo "  -> Updated"
else
    echo '{"FollowCS2ServerGuidelines": false}' > "$CORE"
    echo "  -> Created"
fi

# ============================================
# PART 4: CREATE START SCRIPT
# ============================================

echo ""
echo "=== CREATING START SCRIPT ==="

cat > /home/cs2/start-surf.sh << 'STARTSCRIPT'
#!/bin/bash
cd /home/cs2/cs2-server
export LD_LIBRARY_PATH=/home/cs2/cs2-server/game/bin/linuxsteamrt64/:$LD_LIBRARY_PATH
./game/bin/linuxsteamrt64/cs2 -dedicated -port 27015 \
    +sv_setsteamaccount E7DB3486189C73BEB6FC896A7DFA1D2F \
    +exec server.cfg \
    +host_workshop_map 3070321829
STARTSCRIPT

chmod +x /home/cs2/start-surf.sh
echo "  -> start-surf.sh created"

# ============================================
# PART 5: FIX PERMISSIONS
# ============================================

echo ""
echo "=== FIXING PERMISSIONS ==="
chown -R cs2:cs2 /home/cs2/cs2-server/
chown cs2:cs2 /home/cs2/start-surf.sh
echo "  -> Permissions fixed"

# ============================================
# PART 6: CREATE MAPLIST FOR RTV
# ============================================

echo ""
echo "=== CREATING MAPLIST ==="

mkdir -p $CONFIGS_DIR/plugins/RockTheVote

cat > $CONFIGS_DIR/plugins/RockTheVote/maplist.txt << 'MAPLIST'
workshop/3070321829/surf_utopia
workshop/3074960786/surf_beginner
workshop/3082580014/surf_kitsune
workshop/3100631518/surf_rookie
workshop/3075284675/surf_mesa
workshop/3085162412/surf_summit
workshop/3089545071/surf_ace
workshop/3076958322/surf_forbidden_ways
workshop/3081493339/surf_calycate
workshop/3104517802/surf_rebel_resistance
MAPLIST

echo "  -> maplist.txt created (10 maps)"

# ============================================
# DONE!
# ============================================

echo ""
echo "==========================================="
echo "  INSTALLATION COMPLETE!"
echo "==========================================="
echo ""
echo "Installed plugins:"
ls -d $PLUGINS_DIR/*/ 2>/dev/null | xargs -n1 basename
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Start server to generate plugin configs:"
echo "   su - cs2"
echo "   screen -S surf"
echo "   ./start-surf.sh"
echo "   (wait 30 sec for configs to generate)"
echo "   Ctrl+C to stop"
echo ""
echo "2. Configure plugins (optional, defaults work):"
echo "   nano $CONFIGS_DIR/plugins/SharpTimer/SharpTimer.json"
echo "   nano $CONFIGS_DIR/plugins/WeaponPaints/WeaponPaints.json"
echo ""
echo "3. Start server for real:"
echo "   screen -S surf"
echo "   ./start-surf.sh"
echo "   Ctrl+A, D to detach"
echo ""
echo "Connect: connect 46.224.197.229:27015"
echo "==========================================="
