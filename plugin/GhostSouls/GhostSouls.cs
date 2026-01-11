using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Attributes.Registration;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.Utils;
using CounterStrikeSharp.API.Modules.Timers;
using CounterStrikeSharp.API.Modules.Memory;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace GhostSouls;

public class GhostSouls : BasePlugin, IPluginConfig<GhostConfig>
{
    public override string ModuleName => "Ghost Souls";
    public override string ModuleVersion => "2.0.0";
    public override string ModuleAuthor => "GhostServers.site";
    public override string ModuleDescription => "Souls economy, roles, skins & premium system for Ghost Servers";

    public required GhostConfig Config { get; set; }

    private readonly HttpClient _httpClient = new(new HttpClientHandler
    {
        AllowAutoRedirect = false // Prevent header stripping on redirects
    });
    private readonly Dictionary<ulong, PlayerData> _playerCache = new();
    private readonly Dictionary<ulong, DateTime> _lastKillTime = new();

    // Damage tracking per round
    private readonly Dictionary<ulong, Dictionary<ulong, int>> _roundDamage = new(); // attacker -> victim -> damage
    private readonly Dictionary<ulong, int> _roundKills = new(); // player -> kills this round

    // Clutch tracking
    private bool _isClutchSituation = false;
    private ulong _clutchPlayer = 0;
    private int _clutchVsCount = 0;
    private CsTeam _clutchTeam = CsTeam.None;

    // Sponsor/Ad rotation
    private int _currentAdIndex = 0;
    private DateTime _lastAdTime = DateTime.MinValue;

    public override void Load(bool hotReload)
    {
        Logger.LogInformation("[GhostSouls] Loading Ghost Souls plugin v2.0...");

        // Register event handlers
        RegisterEventHandler<EventPlayerConnectFull>(OnPlayerConnect);
        RegisterEventHandler<EventPlayerDisconnect>(OnPlayerDisconnect);
        RegisterEventHandler<EventPlayerDeath>(OnPlayerDeath);
        RegisterEventHandler<EventPlayerSpawn>(OnPlayerSpawn);
        RegisterEventHandler<EventRoundStart>(OnRoundStart);
        RegisterEventHandler<EventRoundEnd>(OnRoundEnd);
        RegisterEventHandler<EventPlayerHurt>(OnPlayerHurt);

        // Chat listener for role tags
        AddCommandListener("say", OnPlayerChat);
        AddCommandListener("say_team", OnPlayerChatTeam);

        // Start ad rotation timer
        if (Config.Sponsors.Enabled && Config.Sponsors.Ads.Count > 0)
        {
            AddTimer(Config.Sponsors.IntervalSeconds, ShowNextAd, TimerFlags.REPEAT);
        }

        // Periodic sync timer (every 5 minutes)
        AddTimer(300f, SyncAllPlayers, TimerFlags.REPEAT);

        // Souls per minute timer (for surf/bhop servers)
        if (Config.Souls.SoulsPerMinute > 0)
        {
            AddTimer(60f, GiveSoulsPerMinute, TimerFlags.REPEAT);
        }

        // HUD update timer (every 1 second)
        AddTimer(1.0f, UpdateSoulsHud, TimerFlags.REPEAT);

        // Skin refresh timer (every 10 seconds) - syncs equipped skins from website for instant updates
        AddTimer(10f, RefreshAllPlayerSkins, TimerFlags.REPEAT);

        Logger.LogInformation("[GhostSouls] Plugin loaded successfully!");
    }

    public void OnConfigParsed(GhostConfig config)
    {
        Config = config;

        // Clear and reconfigure headers
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Add("X-API-Key", config.ApiKey);

        Logger.LogInformation($"[GhostSouls] API configured: {config.ApiUrl}");
        Logger.LogInformation($"[GhostSouls] API Key (first 10 chars): {(config.ApiKey.Length > 10 ? config.ApiKey.Substring(0, 10) : config.ApiKey)}...");
    }

    #region Player Events

    private HookResult OnPlayerConnect(EventPlayerConnectFull @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        var steamId = player.SteamID;

        // Fetch player data from API
        Task.Run(async () =>
        {
            try
            {
                var data = await FetchPlayerData(steamId);
                if (data != null)
                {
                    _playerCache[steamId] = data;

                    Server.NextFrame(() =>
                    {
                        if (player.IsValid)
                        {
                            var role = GetPlayerRole(steamId);
                            var settings = GetRoleSettings(role);
                            var tagColor = GetChatColor(settings.TagColor);
                            var roleDisplay = !string.IsNullOrEmpty(settings.Tag) ? $" {tagColor}{settings.Tag}" : "";

                            player.PrintToChat($" ");
                            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Welcome back,{roleDisplay} {ChatColors.Green}{player.PlayerName}{ChatColors.Default}!");
                            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Souls: {ChatColors.Green}{data.Souls:N0} {ChatColors.Default}| Multiplier: {ChatColors.Gold}{settings.SoulsMultiplier:0.#}x");
                            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Type {ChatColors.Yellow}!help {ChatColors.Default}for commands");
                            player.PrintToChat($" ");
                        }
                    });
                }
                else
                {
                    // New player - register them
                    await RegisterPlayer(steamId, player.PlayerName);
                    _playerCache[steamId] = new PlayerData { SteamId = steamId, Souls = 100 };

                    Server.NextFrame(() =>
                    {
                        if (player.IsValid)
                        {
                            player.PrintToChat($" ");
                            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Welcome to Ghost Gaming, {player.PlayerName}!");
                            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}You received {ChatColors.Green}100 {ChatColors.Default}starter souls as a welcome gift!");
                            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Type {ChatColors.Yellow}!help {ChatColors.Default}to see all commands");
                            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Gold}Open cases & win skins: {ChatColors.Green}{Config.WebsiteUrl}/cases");
                            player.PrintToChat($" ");
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                Logger.LogError($"[GhostSouls] Failed to fetch player data: {ex.Message}");
            }
        });

        return HookResult.Continue;
    }

    private HookResult OnPlayerDisconnect(EventPlayerDisconnect @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        var steamId = player.SteamID;

        // Sync and remove from cache
        if (_playerCache.TryGetValue(steamId, out var data))
        {
            Task.Run(async () =>
            {
                try
                {
                    await SyncPlayerData(data);
                }
                catch (Exception ex)
                {
                    Logger.LogError($"[GhostSouls] Failed to sync player on disconnect: {ex.Message}");
                }
            });

            _playerCache.Remove(steamId);
        }

        _lastKillTime.Remove(steamId);

        return HookResult.Continue;
    }

    private HookResult OnPlayerSpawn(EventPlayerSpawn @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        var steamId = player.SteamID;

        // Force weapon refresh after spawn to trigger WeaponPaints
        // Give WeaponPaints time to initialize (1.5s delay)
        AddTimer(1.5f, () =>
        {
            if (player.IsValid && player.PawnIsAlive)
            {
                Logger.LogInformation($"[GhostSouls] Triggering WeaponPaints refresh for {steamId}");
                ForceWeaponRefresh(player);
            }
        });

        return HookResult.Continue;
    }

    private HookResult OnPlayerDeath(EventPlayerDeath @event, GameEventInfo info)
    {
        var attacker = @event.Attacker;
        var victim = @event.Userid;

        // Check for clutch situation after this death
        CheckClutchSituation();

        if (attacker == null || !attacker.IsValid || attacker.IsBot) return HookResult.Continue;
        if (victim == null || !victim.IsValid) return HookResult.Continue;

        // No souls for suicide/team kill
        if (attacker == victim) return HookResult.Continue;
        if (attacker.Team == victim.Team) return HookResult.Continue;

        var steamId = attacker.SteamID;

        // Track round kills
        if (!_roundKills.ContainsKey(steamId))
        {
            _roundKills[steamId] = 0;
        }
        _roundKills[steamId]++;

        // Anti-farm: Check kill interval
        if (_lastKillTime.TryGetValue(steamId, out var lastKill))
        {
            if ((DateTime.Now - lastKill).TotalSeconds < Config.Souls.MinKillIntervalSeconds)
            {
                return HookResult.Continue;
            }
        }
        _lastKillTime[steamId] = DateTime.Now;

        // Calculate souls reward
        int baseSouls = Config.Souls.KillReward;
        string bonusText = "";

        // Headshot bonus
        if (@event.Headshot)
        {
            baseSouls += Config.Souls.HeadshotBonus;
            bonusText = " (HS)";
        }

        // Knife kill bonus
        if (@event.Weapon == "knife" || @event.Weapon.Contains("bayonet"))
        {
            baseSouls += Config.Souls.KnifeKillBonus;
            bonusText = " (Knife!)";
        }

        // Apply role multiplier
        float multiplier = GetSoulsMultiplier(steamId);
        int soulsEarned = (int)Math.Ceiling(baseSouls * multiplier);
        string multiplierText = multiplier > 1.0f ? $" {ChatColors.Gold}({multiplier:0.#}x)" : "";

        // Award souls
        if (_playerCache.TryGetValue(steamId, out var data))
        {
            data.Souls += soulsEarned;
            data.TotalEarned += soulsEarned;
            data.SessionEarned += soulsEarned; // Track for delta sync
            data.IsDirty = true;

            attacker.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}+{soulsEarned} {ChatColors.Default}soul{(soulsEarned > 1 ? "s" : "")}{bonusText}{multiplierText}");
        }

        return HookResult.Continue;
    }

    private void CheckClutchSituation()
    {
        if (_isClutchSituation) return; // Already in clutch

        var alivePlayers = Utilities.GetPlayers()
            .Where(p => p.IsValid && !p.IsBot && p.PawnIsAlive)
            .ToList();

        var aliveCT = alivePlayers.Where(p => p.Team == CsTeam.CounterTerrorist).ToList();
        var aliveT = alivePlayers.Where(p => p.Team == CsTeam.Terrorist).ToList();

        // Check for 1vX situation
        if (aliveCT.Count == 1 && aliveT.Count >= 2)
        {
            _isClutchSituation = true;
            _clutchPlayer = aliveCT[0].SteamID;
            _clutchVsCount = aliveT.Count;
            _clutchTeam = CsTeam.CounterTerrorist;

            aliveCT[0].PrintToChat($" {ChatColors.Gold}[Ghost] {ChatColors.Red}1v{_clutchVsCount}! {ChatColors.Default}You got this!");
        }
        else if (aliveT.Count == 1 && aliveCT.Count >= 2)
        {
            _isClutchSituation = true;
            _clutchPlayer = aliveT[0].SteamID;
            _clutchVsCount = aliveCT.Count;
            _clutchTeam = CsTeam.Terrorist;

            aliveT[0].PrintToChat($" {ChatColors.Gold}[Ghost] {ChatColors.Red}1v{_clutchVsCount}! {ChatColors.Default}You got this!");
        }
    }

    private HookResult OnRoundStart(EventRoundStart @event, GameEventInfo info)
    {
        // Reset round tracking
        _roundDamage.Clear();
        _roundKills.Clear();
        _isClutchSituation = false;
        _clutchPlayer = 0;
        _clutchVsCount = 0;

        // Refresh skins from website at round start
        RefreshAllPlayerSkins();

        return HookResult.Continue;
    }

    private HookResult OnPlayerHurt(EventPlayerHurt @event, GameEventInfo info)
    {
        var attacker = @event.Attacker;
        var victim = @event.Userid;

        if (attacker == null || !attacker.IsValid || attacker.IsBot) return HookResult.Continue;
        if (victim == null || !victim.IsValid) return HookResult.Continue;
        if (attacker == victim) return HookResult.Continue; // Self damage
        if (attacker.Team == victim.Team) return HookResult.Continue; // Team damage

        var attackerId = attacker.SteamID;
        var victimId = victim.SteamID;
        var damage = @event.DmgHealth;

        // Track damage
        if (!_roundDamage.ContainsKey(attackerId))
        {
            _roundDamage[attackerId] = new Dictionary<ulong, int>();
        }

        if (!_roundDamage[attackerId].ContainsKey(victimId))
        {
            _roundDamage[attackerId][victimId] = 0;
        }

        _roundDamage[attackerId][victimId] += damage;

        return HookResult.Continue;
    }

    private HookResult OnRoundEnd(EventRoundEnd @event, GameEventInfo info)
    {
        // Show damage dealt to each player
        foreach (var player in Utilities.GetPlayers().Where(p => p.IsValid && !p.IsBot))
        {
            var steamId = player.SteamID;
            if (_roundDamage.TryGetValue(steamId, out var damages) && damages.Count > 0)
            {
                var totalDamage = damages.Values.Sum();
                var kills = _roundKills.TryGetValue(steamId, out var k) ? k : 0;

                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Damage dealt: {ChatColors.Green}{totalDamage} {ChatColors.Default}| Kills: {ChatColors.Green}{kills}");
            }
        }

        // Announce clutch if successful
        if (_isClutchSituation && _clutchPlayer != 0)
        {
            var winner = @event.Winner;
            if ((winner == 2 && _clutchTeam == CsTeam.Terrorist) || (winner == 3 && _clutchTeam == CsTeam.CounterTerrorist))
            {
                // Clutch was successful!
                var clutchPlayer = Utilities.GetPlayers().FirstOrDefault(p => p.IsValid && p.SteamID == _clutchPlayer);
                if (clutchPlayer != null)
                {
                    var clutchBonus = Config.Souls.ClutchBonus * _clutchVsCount;

                    // Award bonus souls
                    if (_playerCache.TryGetValue(_clutchPlayer, out var data))
                    {
                        float multiplier = GetSoulsMultiplier(_clutchPlayer);
                        int soulsEarned = (int)Math.Ceiling(clutchBonus * multiplier);
                        data.Souls += soulsEarned;
                        data.TotalEarned += soulsEarned;
                        data.SessionEarned += soulsEarned; // Track for delta sync
                        data.IsDirty = true;
                    }

                    // Announce to all
                    foreach (var p in Utilities.GetPlayers().Where(p => p.IsValid && !p.IsBot))
                    {
                        p.PrintToChat($" ");
                        p.PrintToChat($" {ChatColors.Gold}>>> CLUTCH! {ChatColors.Green}{clutchPlayer.PlayerName} {ChatColors.Default}won a {ChatColors.Red}1v{_clutchVsCount}! {ChatColors.Gold}<<<");
                        p.PrintToChat($" ");
                    }
                }
            }
        }

        return HookResult.Continue;
    }

    #endregion

    #region Chat System with Roles

    private HookResult OnPlayerChat(CCSPlayerController? player, CommandInfo info)
    {
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        var message = info.GetArg(1);
        if (string.IsNullOrEmpty(message)) return HookResult.Continue;

        // Don't process commands
        if (message.StartsWith("!") || message.StartsWith("/")) return HookResult.Continue;

        // Get role and format message
        var role = GetPlayerRole(player.SteamID);
        var settings = GetRoleSettings(role);

        var formattedMessage = FormatChatMessage(player, message, settings, false);

        // Broadcast to all players
        foreach (var p in Utilities.GetPlayers().Where(p => p.IsValid && !p.IsBot))
        {
            p.PrintToChat(formattedMessage);
        }

        return HookResult.Handled; // Block original message
    }

    private HookResult OnPlayerChatTeam(CCSPlayerController? player, CommandInfo info)
    {
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        var message = info.GetArg(1);
        if (string.IsNullOrEmpty(message)) return HookResult.Continue;

        // Don't process commands
        if (message.StartsWith("!") || message.StartsWith("/")) return HookResult.Continue;

        // Get role and format message
        var role = GetPlayerRole(player.SteamID);
        var settings = GetRoleSettings(role);

        var formattedMessage = FormatChatMessage(player, message, settings, true);

        // Send to team only
        foreach (var p in Utilities.GetPlayers().Where(p => p.IsValid && !p.IsBot && p.Team == player.Team))
        {
            p.PrintToChat(formattedMessage);
        }

        return HookResult.Handled; // Block original message
    }

    private string GetPlayerRole(ulong steamId)
    {
        var steamIdStr = steamId.ToString();

        // Check staff roles first (from config)
        if (Config.Roles.Owners.Contains(steamIdStr)) return "owner";
        if (Config.Roles.Admins.Contains(steamIdStr)) return "admin";
        if (Config.Roles.Mods.Contains(steamIdStr)) return "mod";

        // Check premium tier from player cache
        if (_playerCache.TryGetValue(steamId, out var data))
        {
            if (data.PremiumTier == "ascended") return "ascended";
        }

        return "default";
    }

    private RoleSettings GetRoleSettings(string role)
    {
        if (Config.Roles.RoleSettings.TryGetValue(role, out var settings))
        {
            return settings;
        }
        return Config.Roles.RoleSettings["default"];
    }

    private string FormatChatMessage(CCSPlayerController player, string message, RoleSettings settings, bool isTeam)
    {
        var tagColor = GetChatColor(settings.TagColor);
        var chatColor = GetChatColor(settings.ChatColor);
        var teamPrefix = isTeam ? "(TEAM) " : "";
        var deadPrefix = !player.PawnIsAlive ? "*DEAD* " : "";
        var tag = !string.IsNullOrEmpty(settings.Tag) ? $"{tagColor}{settings.Tag} " : "";

        return $" {deadPrefix}{teamPrefix}{tag}{ChatColors.Green}{player.PlayerName}{ChatColors.Default}: {chatColor}{message}";
    }

    private char GetChatColor(string colorName)
    {
        return colorName.ToLower() switch
        {
            "red" => ChatColors.Red,
            "darkred" => ChatColors.DarkRed,
            "orange" => ChatColors.Orange,
            "yellow" => ChatColors.Yellow,
            "gold" => ChatColors.Gold,
            "green" => ChatColors.Green,
            "lightgreen" => ChatColors.Lime,
            "lime" => ChatColors.Lime,
            "blue" => ChatColors.Blue,
            "lightblue" => ChatColors.BlueGrey,
            "purple" => ChatColors.Purple,
            "magenta" => ChatColors.Magenta,
            "grey" => ChatColors.Grey,
            "white" => ChatColors.White,
            "black" => ChatColors.Grey, // CS2 har ingen svart, använder mörkgrå
            _ => ChatColors.Default
        };
    }

    private float GetSoulsMultiplier(ulong steamId)
    {
        var role = GetPlayerRole(steamId);
        var settings = GetRoleSettings(role);
        return settings.SoulsMultiplier;
    }

    #endregion

    #region Ranking System

    private RankInfo GetRankFromElo(int elo)
    {
        var ranks = Config.Ranking.Ranks.OrderByDescending(r => r.MinElo).ToList();
        foreach (var rank in ranks)
        {
            if (elo >= rank.MinElo)
            {
                return rank;
            }
        }
        return ranks.Last();
    }

    private RankInfo? GetNextRank(int elo)
    {
        var ranks = Config.Ranking.Ranks.OrderBy(r => r.MinElo).ToList();
        foreach (var rank in ranks)
        {
            if (rank.MinElo > elo)
            {
                return rank;
            }
        }
        return null; // Already at max rank
    }

    private string GetRankDisplay(int elo)
    {
        var rank = GetRankFromElo(elo);
        var color = GetChatColor(rank.Color);
        return $"{color}[{rank.Name}]";
    }

    #endregion

    #region Skin System

    private void ApplyPlayerSkins(CCSPlayerController player, ulong steamId)
    {
        if (!player.IsValid || player.PlayerPawn?.Value == null) return;

        if (!_playerCache.TryGetValue(steamId, out var data)) return;

        var pawn = player.PlayerPawn.Value;
        if (pawn.WeaponServices?.MyWeapons == null) return;

        // Get player's current team
        var playerTeam = player.Team;
        var teamStr = playerTeam == CsTeam.CounterTerrorist ? "ct" : playerTeam == CsTeam.Terrorist ? "t" : "none";

        Logger.LogInformation($"[GhostSouls] ApplyPlayerSkins for {steamId} - Team: {teamStr}, Skins: {data.EquippedSkins.Count}");

        foreach (var weaponHandle in pawn.WeaponServices.MyWeapons)
        {
            var weapon = weaponHandle.Value;
            if (weapon == null || !weapon.IsValid) continue;

            var weaponName = weapon.DesignerName;
            var weaponDefIndex = weapon.AttributeManager.Item.ItemDefinitionIndex;
            var isKnife = weaponName.Contains("knife") || weaponName.Contains("bayonet");

            Logger.LogInformation($"[GhostSouls] Checking weapon: {weaponName} (DefIndex={weaponDefIndex}, IsKnife={isKnife})");

            EquippedSkin? equippedSkin = null;

            if (isKnife)
            {
                // For knives, find equipped knife skin that matches player's team
                equippedSkin = data.EquippedSkins.FirstOrDefault(s =>
                    s.IsKnife && IsTeamMatch(s.Team, playerTeam));
            }
            else
            {
                // For other weapons, match by weapon def index or name AND team
                equippedSkin = data.EquippedSkins.FirstOrDefault(s =>
                    !s.IsKnife && !s.IsGloves &&
                    IsTeamMatch(s.Team, playerTeam) &&
                    (s.WeaponDefIndex == weaponDefIndex || IsMatchingWeapon(weaponName, s.WeaponName)));
            }

            if (equippedSkin != null)
            {
                Logger.LogInformation($"[GhostSouls] Found matching skin: {equippedSkin.WeaponName} PK={equippedSkin.PaintKit} Team={equippedSkin.Team}");
                ApplySkin(weapon, equippedSkin);
            }
            else
            {
                Logger.LogInformation($"[GhostSouls] No matching skin for {weaponName}");
                // Force default skin (remove Steam inventory skin)
                ForceDefaultSkin(weapon);
            }
        }
    }

    private bool IsTeamMatch(string skinTeam, CsTeam playerTeam)
    {
        if (skinTeam == "both") return true;
        if (skinTeam == "ct" && playerTeam == CsTeam.CounterTerrorist) return true;
        if (skinTeam == "t" && playerTeam == CsTeam.Terrorist) return true;
        return false;
    }

    private void ApplySkin(CBasePlayerWeapon weapon, EquippedSkin skin)
    {
        try
        {
            // For knives, we need to change the weapon definition index FIRST
            if (skin.IsKnife && skin.WeaponDefIndex > 0)
            {
                weapon.AttributeManager.Item.ItemDefinitionIndex = (ushort)skin.WeaponDefIndex;
            }

            // Set item IDs to enable fallback skins
            weapon.AttributeManager.Item.ItemID = 16384;
            weapon.AttributeManager.Item.ItemIDLow = 16384;
            weapon.AttributeManager.Item.ItemIDHigh = 0;
            weapon.AttributeManager.Item.AccountID = 0;

            // Set the skin properties
            weapon.FallbackPaintKit = skin.PaintKit;
            weapon.FallbackSeed = skin.Seed;
            weapon.FallbackWear = skin.Wear;
            weapon.FallbackStatTrak = -1;

            // Force network update - CS2 requires updating the entire attribute manager
            Utilities.SetStateChanged(weapon, "CBaseEntity", "m_AttributeManager");
            Utilities.SetStateChanged(weapon, "CBasePlayerWeapon", "m_nFallbackPaintKit");
            Utilities.SetStateChanged(weapon, "CBasePlayerWeapon", "m_nFallbackSeed");
            Utilities.SetStateChanged(weapon, "CBasePlayerWeapon", "m_flFallbackWear");

            if (skin.IsKnife)
            {
                Utilities.SetStateChanged(weapon, "CBaseEntity", "m_iItemDefinitionIndex");
            }

            Logger.LogInformation($"[GhostSouls] Applied skin: {skin.WeaponName} PaintKit={skin.PaintKit} IsKnife={skin.IsKnife} DefIndex={skin.WeaponDefIndex}");
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostSouls] Failed to apply skin: {ex.Message}");
        }
    }

    private void ForceDefaultSkin(CBasePlayerWeapon weapon)
    {
        try
        {
            // Reset to default vanilla skin
            weapon.AttributeManager.Item.ItemID = 16384;
            weapon.AttributeManager.Item.ItemIDLow = 16384;
            weapon.AttributeManager.Item.ItemIDHigh = 0;
            weapon.FallbackPaintKit = 0; // Default/Vanilla
            weapon.FallbackSeed = 0;
            weapon.FallbackWear = 0.0f;

            Utilities.SetStateChanged(weapon, "CBaseEntity", "m_nFallbackPaintKit");
            Utilities.SetStateChanged(weapon, "CBaseEntity", "m_nFallbackSeed");
            Utilities.SetStateChanged(weapon, "CBaseEntity", "m_flFallbackWear");
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostSouls] Failed to reset skin: {ex.Message}");
        }
    }

    /// <summary>
    /// Forces a weapon refresh by stripping and re-giving weapons.
    /// This triggers WeaponPaints to apply skins from the database.
    /// </summary>
    private void ForceWeaponRefresh(CCSPlayerController player)
    {
        if (!player.IsValid || player.PlayerPawn?.Value == null) return;

        var pawn = player.PlayerPawn.Value;
        if (pawn.WeaponServices?.MyWeapons == null) return;

        try
        {
            // Collect current weapons
            var weapons = new List<string>();
            var activeWeapon = pawn.WeaponServices.ActiveWeapon?.Value?.DesignerName;

            foreach (var weaponHandle in pawn.WeaponServices.MyWeapons)
            {
                var weapon = weaponHandle.Value;
                if (weapon == null || !weapon.IsValid) continue;

                var weaponName = weapon.DesignerName;
                if (!string.IsNullOrEmpty(weaponName) && !weaponName.Contains("knife"))
                {
                    weapons.Add(weaponName);
                }
            }

            // Strip weapons
            player.RemoveWeapons();

            // Give knife back (WeaponPaints will apply knife skin)
            player.GiveNamedItem("weapon_knife");

            // Give other weapons back
            foreach (var weaponName in weapons)
            {
                player.GiveNamedItem(weaponName);
            }

            // Switch to active weapon if it was set
            if (!string.IsNullOrEmpty(activeWeapon))
            {
                AddTimer(0.1f, () =>
                {
                    if (player.IsValid)
                    {
                        player.ExecuteClientCommand($"use {activeWeapon}");
                    }
                });
            }

            Logger.LogInformation($"[GhostSouls] Forced weapon refresh for {player.SteamID}");
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostSouls] ForceWeaponRefresh error: {ex.Message}");
        }
    }

    private bool IsMatchingWeapon(string designerName, string skinWeaponName)
    {
        // Map designer names to readable names
        var mapping = new Dictionary<string, string[]>
        {
            // Pistols
            { "weapon_deagle", new[] { "Desert Eagle" } },
            { "weapon_elite", new[] { "Dual Berettas" } },
            { "weapon_fiveseven", new[] { "Five-SeveN" } },
            { "weapon_glock", new[] { "Glock-18" } },
            { "weapon_hkp2000", new[] { "P2000" } },
            { "weapon_usp_silencer", new[] { "USP-S" } },
            { "weapon_cz75a", new[] { "CZ75-Auto" } },
            { "weapon_revolver", new[] { "R8 Revolver" } },
            { "weapon_p250", new[] { "P250" } },
            { "weapon_tec9", new[] { "Tec-9" } },

            // SMGs
            { "weapon_mac10", new[] { "MAC-10" } },
            { "weapon_mp5sd", new[] { "MP5-SD" } },
            { "weapon_mp7", new[] { "MP7" } },
            { "weapon_mp9", new[] { "MP9" } },
            { "weapon_p90", new[] { "P90" } },
            { "weapon_bizon", new[] { "PP-Bizon" } },
            { "weapon_ump45", new[] { "UMP-45" } },

            // Rifles
            { "weapon_ak47", new[] { "AK-47" } },
            { "weapon_aug", new[] { "AUG" } },
            { "weapon_famas", new[] { "FAMAS" } },
            { "weapon_galilar", new[] { "Galil AR" } },
            { "weapon_m4a1", new[] { "M4A4" } },
            { "weapon_m4a1_silencer", new[] { "M4A1-S" } },
            { "weapon_sg556", new[] { "SG 553" } },

            // Snipers
            { "weapon_awp", new[] { "AWP" } },
            { "weapon_g3sg1", new[] { "G3SG1" } },
            { "weapon_scar20", new[] { "SCAR-20" } },
            { "weapon_ssg08", new[] { "SSG 08" } },

            // Heavies
            { "weapon_m249", new[] { "M249" } },
            { "weapon_mag7", new[] { "MAG-7" } },
            { "weapon_negev", new[] { "Negev" } },
            { "weapon_nova", new[] { "Nova" } },
            { "weapon_sawedoff", new[] { "Sawed-Off" } },
            { "weapon_xm1014", new[] { "XM1014" } },
        };

        if (mapping.TryGetValue(designerName, out var names))
        {
            return names.Any(n => n.Equals(skinWeaponName, StringComparison.OrdinalIgnoreCase));
        }

        // Also check if designer name contains the weapon name (for knives)
        return designerName.Contains(skinWeaponName.ToLower().Replace(" ", "").Replace("-", ""));
    }

    #endregion

    #region Sponsor/Ad System

    private void ShowNextAd()
    {
        if (!Config.Sponsors.Enabled || Config.Sponsors.Ads.Count == 0) return;

        var ad = Config.Sponsors.Ads[_currentAdIndex];
        _currentAdIndex = (_currentAdIndex + 1) % Config.Sponsors.Ads.Count;

        // Show to all players
        foreach (var player in Utilities.GetPlayers().Where(p => p.IsValid && !p.IsBot))
        {
            switch (ad.Type)
            {
                case "chat":
                    player.PrintToChat($" {ChatColors.Gold}[Sponsor] {ChatColors.Default}{ad.Message}");
                    break;
                case "center":
                    player.PrintToCenter(ad.Message);
                    break;
                case "html":
                    // For future HTML panel support
                    player.PrintToChat($" {ChatColors.Gold}[Sponsor] {ChatColors.Default}{ad.Message}");
                    break;
            }
        }

        _lastAdTime = DateTime.Now;
    }

    private void GiveSoulsPerMinute()
    {
        var soulsPerMinute = Config.Souls.SoulsPerMinute;
        if (soulsPerMinute <= 0) return;

        foreach (var player in Utilities.GetPlayers().Where(p => p.IsValid && !p.IsBot))
        {
            var steamId = player.SteamID;
            if (_playerCache.TryGetValue(steamId, out var data))
            {
                var role = GetPlayerRole(steamId);
                var settings = GetRoleSettings(role);
                var earned = (int)(soulsPerMinute * settings.SoulsMultiplier);

                data.Souls += earned;
                data.TotalEarned += earned;
                data.SessionEarned += earned; // Track for delta sync
                data.IsDirty = true;

                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}+{ChatColors.Green}{earned} {ChatColors.Default}souls for playing!");
            }
        }
    }

    private void UpdateSoulsHud()
    {
        foreach (var player in Utilities.GetPlayers().Where(p => p.IsValid && !p.IsBot && p.PawnIsAlive))
        {
            var steamId = player.SteamID;
            if (_playerCache.TryGetValue(steamId, out var data))
            {
                var soulsDisplay = data.Souls.ToString("N0");

                // Simple HTML HUD that works in CS2
                var html = $"<font color='#a855f7' class='fontSize-l'>{soulsDisplay}</font><br><font color='#888888' class='fontSize-m'>SOULS</font>";

                player.PrintToCenterHtml(html);
            }
        }
    }

    #endregion

    #region Commands

    [ConsoleCommand("css_souls", "Check your souls balance")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnSoulsCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        var steamId = player.SteamID;

        // Fetch fresh data from API first
        Task.Run(async () =>
        {
            try
            {
                await RefreshPlayerData(steamId);

                Server.NextFrame(() =>
                {
                    if (player.IsValid && _playerCache.TryGetValue(steamId, out var data))
                    {
                        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}You have {ChatColors.Green}{data.Souls:N0} {ChatColors.Default}souls.");
                        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Total earned: {ChatColors.Yellow}{data.TotalEarned:N0} {ChatColors.Default}souls.");
                    }
                });
            }
            catch
            {
                Server.NextFrame(() =>
                {
                    if (player.IsValid && _playerCache.TryGetValue(steamId, out var data))
                    {
                        // Fallback to cached data if API fails
                        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}You have {ChatColors.Green}{data.Souls:N0} {ChatColors.Default}souls (cached).");
                    }
                });
            }
        });
    }

    [ConsoleCommand("css_inventory", "Open inventory (shows website link)")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnInventoryCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}View your inventory at: {ChatColors.Green}{Config.WebsiteUrl}/inventory");
        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Open cases at: {ChatColors.Green}{Config.WebsiteUrl}/cases");
    }

    [ConsoleCommand("css_cases", "Shows link to open cases")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnCasesCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Open cases at: {ChatColors.Green}{Config.WebsiteUrl}/cases");

        if (_playerCache.TryGetValue(player.SteamID, out var data))
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Your balance: {ChatColors.Green}{data.Souls:N0} {ChatColors.Default}souls");
        }
    }

    [ConsoleCommand("css_top", "Show top players by souls")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnTopCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Leaderboard: {ChatColors.Green}{Config.WebsiteUrl}/leaderboard");
    }

    [ConsoleCommand("css_refresh", "Refresh your inventory from the website")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnRefreshCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        var steamId = player.SteamID;

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Refreshing your data...");

        Task.Run(async () =>
        {
            try
            {
                var data = await FetchPlayerData(steamId);
                if (data != null)
                {
                    _playerCache[steamId] = data;

                    Server.NextFrame(() =>
                    {
                        if (player.IsValid)
                        {
                            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Data refreshed! {ChatColors.Default}You have {ChatColors.Green}{data.Souls:N0} {ChatColors.Default}souls.");

                            // Re-apply skins
                            ApplyPlayerSkins(player, steamId);
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                Server.NextFrame(() =>
                {
                    if (player.IsValid)
                    {
                        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}Failed to refresh. Try again later.");
                    }
                });
                Logger.LogError($"[GhostSouls] Refresh failed: {ex.Message}");
            }
        });
    }

    [ConsoleCommand("css_skin", "Manually apply your equipped skins")]
    [ConsoleCommand("css_skins", "Refresh your weapon skins")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnSkinCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        if (!player.PawnIsAlive)
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}You must be alive to apply skins!");
            return;
        }

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Refreshing skins...");

        // Execute WeaponPaints refresh command
        player.ExecuteClientCommandFromServer("css_wp");

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Skins refreshed! Use !wp for menu.");
    }

    [ConsoleCommand("css_elo", "Show your ELO and rank")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnEloCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        if (_playerCache.TryGetValue(player.SteamID, out var data))
        {
            var rankInfo = GetRankFromElo(data.Elo);
            var rankColor = GetChatColor(rankInfo.Color);
            var winrate = data.Wins + data.Losses > 0
                ? (data.Wins * 100 / (data.Wins + data.Losses))
                : 0;

            player.PrintToChat($" ");
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Your Rank: {rankColor}{rankInfo.Name}");
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}ELO: {ChatColors.Green}{data.Elo} {ChatColors.Default}| W/L: {ChatColors.Green}{data.Wins}{ChatColors.Default}/{ChatColors.Red}{data.Losses} {ChatColors.Default}({winrate}%)");

            // Show progress to next rank
            var nextRank = GetNextRank(data.Elo);
            if (nextRank != null)
            {
                var eloNeeded = nextRank.MinElo - data.Elo;
                var nextColor = GetChatColor(nextRank.Color);
                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Next: {nextColor}{nextRank.Name} {ChatColors.Grey}({eloNeeded} ELO needed)");
            }
            player.PrintToChat($" ");
        }
        else
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}Could not load your data.");
        }
    }

    [ConsoleCommand("css_stats", "Show your stats")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnStatsCommand(CCSPlayerController? player, CommandInfo command)
    {
        // Alias for !elo
        OnEloCommand(player, command);
    }

    [ConsoleCommand("css_discord", "Show Discord invite link")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnDiscordCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Join our Discord: {ChatColors.Blue}discord.gg/aSDrPk6Y8q");
    }

    [ConsoleCommand("css_website", "Show website link")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnWebsiteCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Visit us at: {ChatColors.Green}{Config.WebsiteUrl}");
    }

    [ConsoleCommand("css_rank", "Show your current rank and role")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnRankCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        var role = GetPlayerRole(player.SteamID);
        var settings = GetRoleSettings(role);
        var tagColor = GetChatColor(settings.TagColor);

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Your rank: {tagColor}{settings.Tag}");
        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Souls multiplier: {ChatColors.Gold}{settings.SoulsMultiplier:0.#}x");

        if (role == "default")
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Grey}Become ASCENDED at {Config.WebsiteUrl}/premium for 2x souls!");
        }
    }

    [ConsoleCommand("css_debug", "Show debug info about your player data")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnDebugCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        var steamId = player.SteamID;

        player.PrintToChat($" ");
        player.PrintToChat($" {ChatColors.Purple}======== DEBUG INFO ========");
        player.PrintToChat($" {ChatColors.Default}SteamID: {ChatColors.Green}{steamId}");

        if (_playerCache.TryGetValue(steamId, out var data))
        {
            player.PrintToChat($" {ChatColors.Default}Souls: {ChatColors.Green}{data.Souls:N0} {ChatColors.Grey}(Session: +{data.SessionEarned})");
            player.PrintToChat($" {ChatColors.Default}Total Earned: {ChatColors.Yellow}{data.TotalEarned:N0}");
            player.PrintToChat($" {ChatColors.Default}ELO: {ChatColors.Green}{data.Elo} {ChatColors.Grey}(W:{data.Wins}/L:{data.Losses})");
            player.PrintToChat($" {ChatColors.Default}Role: {ChatColors.Yellow}{data.Role} {ChatColors.Grey}| Premium: {data.PremiumTier}");
            player.PrintToChat($" {ChatColors.Default}Dirty: {(data.IsDirty ? ChatColors.Red : ChatColors.Green)}{data.IsDirty}");
            player.PrintToChat($" ");
            player.PrintToChat($" {ChatColors.Gold}Equipped Skins ({data.EquippedSkins.Count}):");

            if (data.EquippedSkins.Count == 0)
            {
                player.PrintToChat($" {ChatColors.Grey}  (none)");
            }
            else
            {
                foreach (var skin in data.EquippedSkins)
                {
                    var knifeTag = skin.IsKnife ? " [KNIFE]" : "";
                    var glovesTag = skin.IsGloves ? " [GLOVES]" : "";
                    player.PrintToChat($" {ChatColors.Default}  - {ChatColors.Green}{skin.WeaponName}{knifeTag}{glovesTag}");
                    player.PrintToChat($"    {ChatColors.Grey}DefIdx={skin.WeaponDefIndex} PK={skin.PaintKit} Team={skin.Team}");
                }
            }
        }
        else
        {
            player.PrintToChat($" {ChatColors.Red}No cached data found!");
        }

        player.PrintToChat($" {ChatColors.Purple}============================");
        player.PrintToChat($" ");
    }

    [ConsoleCommand("css_ghost", "Show Ghost Gaming info")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnGhostCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        ShowHelpMenu(player);
    }

    [ConsoleCommand("css_help", "Show available commands")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnHelpCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        ShowHelpMenu(player);
    }

    [ConsoleCommand("css_commands", "Show available commands")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnCommandsCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        ShowHelpMenu(player);
    }

    [ConsoleCommand("css_server", "Show server list or connect to a server")]
    [CommandHelper(minArgs: 0, usage: "[number]", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnServerCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        var servers = Config.Servers.Servers;
        if (servers.Count == 0)
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}No servers configured.");
            return;
        }

        // Check if player provided a server number
        if (command.ArgCount > 1)
        {
            var arg = command.GetArg(1);
            if (int.TryParse(arg, out int serverNum) && serverNum >= 1 && serverNum <= servers.Count)
            {
                var server = servers[serverNum - 1];
                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Connecting to {ChatColors.Green}{server.Name}{ChatColors.Default}...");
                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Yellow}connect {server.Address}");

                // Send client command to connect
                player.ExecuteClientCommand($"connect {server.Address}");
                return;
            }
            else
            {
                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}Invalid server number. Use !server to see the list.");
                return;
            }
        }

        // Show server list
        player.PrintToChat($" ");
        player.PrintToChat($" {ChatColors.Purple}======== Ghost Servers ========");
        player.PrintToChat($" {ChatColors.Default}Type {ChatColors.Yellow}!server <number> {ChatColors.Default}to connect");
        player.PrintToChat($" ");

        for (int i = 0; i < servers.Count; i++)
        {
            var server = servers[i];
            var desc = !string.IsNullOrEmpty(server.Description) ? $" {ChatColors.Grey}- {server.Description}" : "";
            player.PrintToChat($" {ChatColors.Yellow}{i + 1}. {ChatColors.Green}{server.Name}{desc}");
        }

        player.PrintToChat($" ");
        player.PrintToChat($" {ChatColors.Purple}===============================");
    }

    [ConsoleCommand("css_servers", "Show server list")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnServersCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        // Just call the server command with no args
        OnServerCommand(player, command);
    }

    private void ShowHelpMenu(CCSPlayerController player)
    {
        var role = GetPlayerRole(player.SteamID);
        var settings = GetRoleSettings(role);

        player.PrintToChat($" ");
        player.PrintToChat($" {ChatColors.Purple}======== GhostServers.site ========");
        player.PrintToChat($" {ChatColors.Default}Website: {ChatColors.Green}{Config.WebsiteUrl}");
        player.PrintToChat($" ");
        player.PrintToChat($" {ChatColors.Yellow}!souls {ChatColors.Default}- Balance | {ChatColors.Yellow}!elo {ChatColors.Default}- Rank & stats");
        player.PrintToChat($" {ChatColors.Yellow}!inventory {ChatColors.Default}- Skins | {ChatColors.Yellow}!cases {ChatColors.Default}- Open cases");
        player.PrintToChat($" {ChatColors.Yellow}!top {ChatColors.Default}- Leaderboard | {ChatColors.Yellow}!server {ChatColors.Default}- Servers");
        player.PrintToChat($" {ChatColors.Yellow}!discord {ChatColors.Default}- Discord | {ChatColors.Yellow}!refresh {ChatColors.Default}- Sync");
        player.PrintToChat($" ");
        player.PrintToChat($" {ChatColors.Default}Your multiplier: {ChatColors.Gold}{settings.SoulsMultiplier:0.#}x souls");
        player.PrintToChat($" {ChatColors.Grey}Become ASCENDED for 2x souls!");
        player.PrintToChat($" {ChatColors.Purple}===================================");
    }

    #endregion

    #region API Communication

    private async Task<PlayerData?> FetchPlayerData(ulong steamId)
    {
        try
        {
            var url = $"{Config.ApiUrl}/api/plugin/player/{steamId}";
            Logger.LogInformation($"[GhostSouls] Fetching: {url}");
            Logger.LogInformation($"[GhostSouls] API Key present: {!string.IsNullOrEmpty(Config.ApiKey)}");

            var response = await _httpClient.GetAsync(url);

            // Handle redirect manually to preserve headers
            if ((int)response.StatusCode >= 300 && (int)response.StatusCode < 400)
            {
                var redirectUrl = response.Headers.Location?.ToString();
                if (!string.IsNullOrEmpty(redirectUrl))
                {
                    Logger.LogInformation($"[GhostSouls] Redirect to: {redirectUrl}");
                    response = await _httpClient.GetAsync(redirectUrl);
                }
            }

            Logger.LogInformation($"[GhostSouls] Response: {response.StatusCode}");

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiPlayerResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (apiResponse == null) return null;

            return new PlayerData
            {
                SteamId = steamId,
                Souls = apiResponse.Souls,
                TotalEarned = apiResponse.TotalSoulsEarned,
                PremiumTier = apiResponse.PremiumTier ?? "none",
                Elo = apiResponse.Elo,
                Wins = apiResponse.Wins,
                Losses = apiResponse.Losses,
                EquippedSkins = apiResponse.EquippedSkins ?? new List<EquippedSkin>()
            };
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostSouls] API fetch error: {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Refresh player data from API, keeping session earnings intact
    /// </summary>
    private async Task RefreshPlayerData(ulong steamId)
    {
        var freshData = await FetchPlayerData(steamId);
        if (freshData == null) return;

        if (_playerCache.TryGetValue(steamId, out var cachedData))
        {
            // Keep session earnings, update everything else
            var sessionEarned = cachedData.SessionEarned;

            Logger.LogInformation($"[GhostSouls] Refresh: API={freshData.Souls}, SessionEarned={sessionEarned}, Total={freshData.Souls + sessionEarned}");

            // Update cache with fresh data + session earnings
            freshData.Souls += sessionEarned; // Add session earnings to fresh total
            freshData.SessionEarned = sessionEarned;
            freshData.IsDirty = sessionEarned > 0;

            _playerCache[steamId] = freshData;
        }
        else
        {
            _playerCache[steamId] = freshData;
        }
    }

    private async Task RegisterPlayer(ulong steamId, string username)
    {
        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(new { steamId = steamId.ToString(), username }),
                System.Text.Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync($"{Config.ApiUrl}/api/plugin/player/register", content);
            response.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostSouls] Player registration error: {ex.Message}");
            throw;
        }
    }

    private async Task SyncPlayerData(PlayerData data)
    {
        if (!data.IsDirty || data.SessionEarned <= 0) return;

        try
        {
            var soulsToSync = data.SessionEarned;

            var content = new StringContent(
                JsonSerializer.Serialize(new
                {
                    steamId = data.SteamId.ToString(),
                    soulsToAdd = soulsToSync // Send delta, not absolute value
                }),
                System.Text.Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync($"{Config.ApiUrl}/api/plugin/player/sync", content);
            response.EnsureSuccessStatusCode();

            // Reset session earned after successful sync
            data.SessionEarned = 0;
            data.IsDirty = false;

            Logger.LogInformation($"[GhostSouls] Synced {soulsToSync} souls for {data.SteamId}");
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostSouls] Sync error: {ex.Message}");
            throw;
        }
    }

    private void SyncAllPlayers()
    {
        foreach (var kvp in _playerCache.Where(p => p.Value.IsDirty))
        {
            Task.Run(async () =>
            {
                try
                {
                    await SyncPlayerData(kvp.Value);
                }
                catch (Exception ex)
                {
                    Logger.LogError($"[GhostSouls] Batch sync error for {kvp.Key}: {ex.Message}");
                }
            });
        }
    }

    /// <summary>
    /// Refreshes equipped skins for all players from the website (called every 60 seconds)
    /// </summary>
    private void RefreshAllPlayerSkins()
    {
        var players = Utilities.GetPlayers().Where(p => p.IsValid && !p.IsBot).ToList();

        foreach (var player in players)
        {
            var steamId = player.SteamID;

            Task.Run(async () =>
            {
                try
                {
                    var freshData = await FetchPlayerData(steamId);
                    if (freshData == null) return;

                    // Check if skins changed
                    var oldSkins = _playerCache.TryGetValue(steamId, out var cached)
                        ? cached.EquippedSkins
                        : new List<EquippedSkin>();

                    var skinsChanged = !AreSkinListsEqual(oldSkins, freshData.EquippedSkins);

                    if (skinsChanged)
                    {
                        // Update cache with new skins (keep session earnings)
                        if (cached != null)
                        {
                            cached.EquippedSkins = freshData.EquippedSkins;
                        }
                        else
                        {
                            _playerCache[steamId] = freshData;
                        }

                        // Trigger WeaponPaints refresh on main thread
                        Server.NextFrame(() =>
                        {
                            if (player.IsValid && player.PawnIsAlive)
                            {
                                // Execute WeaponPaints refresh command to reload from database
                                player.ExecuteClientCommandFromServer("css_wp");
                                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Skins updated from website!");
                            }
                        });

                        Logger.LogInformation($"[GhostSouls] Skins updated for {steamId}");
                    }
                }
                catch (Exception ex)
                {
                    Logger.LogError($"[GhostSouls] Skin refresh error for {steamId}: {ex.Message}");
                }
            });
        }
    }

    /// <summary>
    /// Compares two skin lists to check if they're different
    /// </summary>
    private bool AreSkinListsEqual(List<EquippedSkin> a, List<EquippedSkin> b)
    {
        if (a.Count != b.Count) return false;

        foreach (var skinA in a)
        {
            var match = b.FirstOrDefault(skinB =>
                skinB.WeaponDefIndex == skinA.WeaponDefIndex &&
                skinB.PaintKit == skinA.PaintKit &&
                skinB.Team == skinA.Team);

            if (match == null) return false;
        }

        return true;
    }

    public async Task AnnounceRareDrop(string playerName, string itemName, string weaponName)
    {
        // Called from web API when someone gets a rare drop
        Server.NextFrame(() =>
        {
            foreach (var player in Utilities.GetPlayers().Where(p => p.IsValid && !p.IsBot))
            {
                player.PrintToChat($" {ChatColors.Gold}[RARE DROP] {ChatColors.Green}{playerName} {ChatColors.Default}just unboxed {ChatColors.Yellow}{weaponName} | {itemName}!");
            }

            // Optional: Play sound
            // Server.ExecuteCommand("play ui/achievement_earned.wav");
        });
    }

    #endregion
}
