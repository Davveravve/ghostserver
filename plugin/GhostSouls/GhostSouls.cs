using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Attributes.Registration;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.Utils;
using CounterStrikeSharp.API.Modules.Timers;
using CounterStrikeSharp.API.Modules.Memory;
using System.Text.Json;
using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace GhostSouls;

public class GhostSouls : BasePlugin, IPluginConfig<GhostConfig>
{
    public override string ModuleName => "Ghost Souls";
    public override string ModuleVersion => "2.1.0";
    public override string ModuleAuthor => "GhostServers.site";
    public override string ModuleDescription => "Souls economy, roles, skins & premium system for Ghost Servers";

    public required GhostConfig Config { get; set; }

    private HttpClient? _httpClient;

    // Thread-safe collections (CRITICAL FIX: was Dictionary, caused race conditions)
    private readonly ConcurrentDictionary<ulong, PlayerData> _playerCache = new();
    private readonly ConcurrentDictionary<ulong, DateTime> _lastKillTime = new();

    // Damage tracking per round (reset each round, no concurrency needed)
    private readonly Dictionary<ulong, Dictionary<ulong, int>> _roundDamage = new();
    private readonly Dictionary<ulong, int> _roundKills = new();
    private readonly object _roundDataLock = new(); // Lock for round data

    // Clutch tracking
    private bool _isClutchSituation = false;
    private ulong _clutchPlayer = 0;
    private int _clutchVsCount = 0;
    private CsTeam _clutchTeam = CsTeam.None;

    // Announcement rotation (fetched from API)
    private int _currentAnnouncementIndex = 0;
    private List<AnnouncementData> _announcements = new();
    private float _announcementInterval = 120f;
    private bool _announcementsEnabled = true;
    private DateTime _lastAnnouncementFetch = DateTime.MinValue;
    private DateTime _lastAnnouncementTime = DateTime.MinValue;

    // Circuit breaker for API calls
    private int _apiFailureCount = 0;
    private DateTime _apiCircuitOpenTime = DateTime.MinValue;
    private const int API_FAILURE_THRESHOLD = 5;
    private static readonly TimeSpan API_CIRCUIT_RESET_TIME = TimeSpan.FromMinutes(2);

    public override void Load(bool hotReload)
    {
        Logger.LogInformation("[GhostSouls] Loading Ghost Souls plugin v2.1...");

        // Initialize HttpClient with proper settings
        _httpClient = new HttpClient(new HttpClientHandler
        {
            AllowAutoRedirect = false
        })
        {
            Timeout = TimeSpan.FromSeconds(10)
        };

        // Set API key header (OnConfigParsed runs before Load, so we must set it here)
        _httpClient.DefaultRequestHeaders.Add("X-API-Key", Config.ApiKey);
        Logger.LogInformation($"[GhostSouls] API Key configured: {Config.ApiKey.Substring(0, Math.Min(10, Config.ApiKey.Length))}...");

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

        // Fetch announcements from API and start rotation (with error handling)
        Task.Run(async () =>
        {
            try { await FetchAnnouncements(); }
            catch (Exception ex) { Logger.LogWarning($"[GhostSouls] Initial announcement fetch failed: {ex.Message}"); }
        });

        // Start announcement rotation timer (checks every 10 seconds, shows based on interval)
        AddTimer(10f, () =>
        {
            try { CheckAndShowAnnouncement(); }
            catch (Exception ex) { Logger.LogError($"[GhostSouls] Announcement timer error: {ex.Message}"); }
        }, TimerFlags.REPEAT);

        // Refresh announcements from API every 5 minutes
        AddTimer(300f, () =>
        {
            Task.Run(async () =>
            {
                try { await FetchAnnouncements(); }
                catch (Exception ex) { Logger.LogWarning($"[GhostSouls] Announcement refresh failed: {ex.Message}"); }
            });
        }, TimerFlags.REPEAT);

        // Periodic sync timer (every 5 minutes)
        AddTimer(300f, () =>
        {
            try { SyncAllPlayers(); }
            catch (Exception ex) { Logger.LogError($"[GhostSouls] Sync timer error: {ex.Message}"); }
        }, TimerFlags.REPEAT);

        // Souls per minute timer (for surf/bhop servers)
        if (Config.Souls.SoulsPerMinute > 0)
        {
            AddTimer(60f, () =>
            {
                try { GiveSoulsPerMinute(); }
                catch (Exception ex) { Logger.LogError($"[GhostSouls] Souls per minute error: {ex.Message}"); }
            }, TimerFlags.REPEAT);
        }

        // Skin refresh timer (every 30 seconds) - reduced frequency for performance
        AddTimer(30f, () =>
        {
            try { RefreshAllPlayerSkins(); }
            catch (Exception ex) { Logger.LogError($"[GhostSouls] Skin refresh error: {ex.Message}"); }
        }, TimerFlags.REPEAT);

        Logger.LogInformation("[GhostSouls] Plugin loaded successfully!");
    }

    public override void Unload(bool hotReload)
    {
        // Dispose HttpClient properly (CRITICAL FIX: was never disposed)
        _httpClient?.Dispose();
        _httpClient = null;

        Logger.LogInformation("[GhostSouls] Plugin unloaded.");
    }

    public void OnConfigParsed(GhostConfig config)
    {
        Config = config;

        // Validate API key (LOW SEVERITY FIX: warn if default)
        if (config.ApiKey == "your-api-key-here" || string.IsNullOrEmpty(config.ApiKey))
        {
            Logger.LogWarning("[GhostSouls] WARNING: API key is not configured! API calls will fail.");
        }

        // Clear and reconfigure headers
        if (_httpClient != null)
        {
            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("X-API-Key", config.ApiKey);
        }

        Logger.LogInformation($"[GhostSouls] API configured: {config.ApiUrl}");
    }

    #region Circuit Breaker

    private bool IsApiCircuitOpen()
    {
        if (_apiFailureCount < API_FAILURE_THRESHOLD) return false;

        if (DateTime.UtcNow - _apiCircuitOpenTime > API_CIRCUIT_RESET_TIME)
        {
            _apiFailureCount = 0;
            Logger.LogInformation("[GhostSouls] API circuit breaker reset - retrying API calls");
            return false;
        }

        return true;
    }

    private void RecordApiFailure()
    {
        _apiFailureCount++;
        if (_apiFailureCount >= API_FAILURE_THRESHOLD)
        {
            _apiCircuitOpenTime = DateTime.UtcNow;
            Logger.LogWarning($"[GhostSouls] API circuit breaker OPEN - too many failures ({_apiFailureCount})");
        }
    }

    private void RecordApiSuccess()
    {
        _apiFailureCount = 0;
    }

    #endregion

    #region Player Events

    private HookResult OnPlayerConnect(EventPlayerConnectFull @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        var steamId = player.SteamID;
        var playerName = player.PlayerName;

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
                        if (player != null && player.IsValid)
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
                    await RegisterPlayer(steamId, playerName);
                    _playerCache[steamId] = new PlayerData { SteamId = steamId, Souls = 100 };

                    Server.NextFrame(() =>
                    {
                        if (player != null && player.IsValid)
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
        if (_playerCache.TryRemove(steamId, out var data))
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
        }

        _lastKillTime.TryRemove(steamId, out _);

        return HookResult.Continue;
    }

    private HookResult OnPlayerSpawn(EventPlayerSpawn @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        var steamId = player.SteamID;

        // Force weapon refresh after spawn to trigger WeaponPaints
        AddTimer(1.5f, () =>
        {
            try
            {
                if (player != null && player.IsValid && player.PawnIsAlive)
                {
                    ForceWeaponRefresh(player);
                }
            }
            catch (Exception ex)
            {
                Logger.LogError($"[GhostSouls] Weapon refresh error: {ex.Message}");
            }
        });

        return HookResult.Continue;
    }

    private HookResult OnPlayerDeath(EventPlayerDeath @event, GameEventInfo info)
    {
        var attacker = @event.Attacker;
        var victim = @event.Userid;

        // Validate BEFORE calling CheckClutchSituation (HIGH SEVERITY FIX)
        if (attacker == null || victim == null) return HookResult.Continue;

        // Check for clutch situation after this death
        try { CheckClutchSituation(); }
        catch (Exception ex) { Logger.LogError($"[GhostSouls] Clutch check error: {ex.Message}"); }

        if (!attacker.IsValid || attacker.IsBot) return HookResult.Continue;
        if (!victim.IsValid) return HookResult.Continue;

        // No souls for suicide/team kill
        if (attacker == victim) return HookResult.Continue;
        if (attacker.Team == victim.Team) return HookResult.Continue;

        var steamId = attacker.SteamID;

        // Track round kills (with lock for thread safety)
        lock (_roundDataLock)
        {
            if (!_roundKills.ContainsKey(steamId))
            {
                _roundKills[steamId] = 0;
            }
            _roundKills[steamId]++;
        }

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

        // MEDIUM SEVERITY FIX: Prevent overflow
        soulsEarned = Math.Min(soulsEarned, 10000);

        string multiplierText = multiplier > 1.0f ? $" {ChatColors.Gold}({multiplier:0.#}x)" : "";

        // Award souls
        if (_playerCache.TryGetValue(steamId, out var data))
        {
            data.Souls += soulsEarned;
            data.TotalEarned += soulsEarned;
            data.SessionEarned += soulsEarned;
            data.IsDirty = true;

            attacker.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}+{soulsEarned} {ChatColors.Default}soul{(soulsEarned > 1 ? "s" : "")}{bonusText}{multiplierText}");
        }

        return HookResult.Continue;
    }

    private void CheckClutchSituation()
    {
        if (_isClutchSituation) return;

        var alivePlayers = Utilities.GetPlayers()
            .Where(p => p != null && p.IsValid && !p.IsBot && p.PawnIsAlive)
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
        // Reset round tracking (with lock for thread safety)
        lock (_roundDataLock)
        {
            _roundDamage.Clear();
            _roundKills.Clear();
        }
        _isClutchSituation = false;
        _clutchPlayer = 0;
        _clutchVsCount = 0;

        // Refresh skins from website at round start
        try { RefreshAllPlayerSkins(); }
        catch (Exception ex) { Logger.LogError($"[GhostSouls] Round start skin refresh error: {ex.Message}"); }

        return HookResult.Continue;
    }

    private HookResult OnPlayerHurt(EventPlayerHurt @event, GameEventInfo info)
    {
        var attacker = @event.Attacker;
        var victim = @event.Userid;

        if (attacker == null || !attacker.IsValid || attacker.IsBot) return HookResult.Continue;
        if (victim == null || !victim.IsValid) return HookResult.Continue;
        if (attacker == victim) return HookResult.Continue;
        if (attacker.Team == victim.Team) return HookResult.Continue;

        var attackerId = attacker.SteamID;
        var victimId = victim.SteamID;
        var damage = @event.DmgHealth;

        // Track damage (with lock for thread safety)
        lock (_roundDataLock)
        {
            if (!_roundDamage.ContainsKey(attackerId))
            {
                _roundDamage[attackerId] = new Dictionary<ulong, int>();
            }

            if (!_roundDamage[attackerId].ContainsKey(victimId))
            {
                _roundDamage[attackerId][victimId] = 0;
            }

            _roundDamage[attackerId][victimId] += damage;
        }

        return HookResult.Continue;
    }

    private HookResult OnRoundEnd(EventRoundEnd @event, GameEventInfo info)
    {
        // Show damage dealt to each player
        Dictionary<ulong, Dictionary<ulong, int>> damageSnapshot;
        Dictionary<ulong, int> killsSnapshot;

        lock (_roundDataLock)
        {
            damageSnapshot = new Dictionary<ulong, Dictionary<ulong, int>>(_roundDamage);
            killsSnapshot = new Dictionary<ulong, int>(_roundKills);
        }

        foreach (var player in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
        {
            var steamId = player.SteamID;
            if (damageSnapshot.TryGetValue(steamId, out var damages) && damages.Count > 0)
            {
                var totalDamage = damages.Values.Sum();
                var kills = killsSnapshot.TryGetValue(steamId, out var k) ? k : 0;

                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Damage dealt: {ChatColors.Green}{totalDamage} {ChatColors.Default}| Kills: {ChatColors.Green}{kills}");
            }
        }

        // Announce clutch if successful
        if (_isClutchSituation && _clutchPlayer != 0)
        {
            var winner = @event.Winner;
            if ((winner == 2 && _clutchTeam == CsTeam.Terrorist) || (winner == 3 && _clutchTeam == CsTeam.CounterTerrorist))
            {
                var clutchPlayer = Utilities.GetPlayers().FirstOrDefault(p => p != null && p.IsValid && p.SteamID == _clutchPlayer);
                if (clutchPlayer != null)
                {
                    // MEDIUM SEVERITY FIX: Bound clutch bonus to prevent overflow
                    var clutchBonus = Math.Min(Config.Souls.ClutchBonus * _clutchVsCount, 1000);

                    if (_playerCache.TryGetValue(_clutchPlayer, out var data))
                    {
                        float multiplier = GetSoulsMultiplier(_clutchPlayer);
                        int soulsEarned = (int)Math.Min(Math.Ceiling(clutchBonus * multiplier), 10000);
                        data.Souls += soulsEarned;
                        data.TotalEarned += soulsEarned;
                        data.SessionEarned += soulsEarned;
                        data.IsDirty = true;
                    }

                    foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
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

        if (message.StartsWith("!") || message.StartsWith("/")) return HookResult.Continue;

        var role = GetPlayerRole(player.SteamID);
        var settings = GetRoleSettings(role);

        var formattedMessage = FormatChatMessage(player, message, settings, false);

        foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
        {
            p.PrintToChat(formattedMessage);
        }

        return HookResult.Handled;
    }

    private HookResult OnPlayerChatTeam(CCSPlayerController? player, CommandInfo info)
    {
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        var message = info.GetArg(1);
        if (string.IsNullOrEmpty(message)) return HookResult.Continue;

        if (message.StartsWith("!") || message.StartsWith("/")) return HookResult.Continue;

        var role = GetPlayerRole(player.SteamID);
        var settings = GetRoleSettings(role);

        var formattedMessage = FormatChatMessage(player, message, settings, true);

        foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot && p.Team == player.Team))
        {
            p.PrintToChat(formattedMessage);
        }

        return HookResult.Handled;
    }

    private string GetPlayerRole(ulong steamId)
    {
        var steamIdStr = steamId.ToString();

        if (Config.Roles.Owners.Contains(steamIdStr)) return "owner";
        if (Config.Roles.Admins.Contains(steamIdStr)) return "admin";
        if (Config.Roles.Mods.Contains(steamIdStr)) return "mod";

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
            "black" => ChatColors.Grey,
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
        return null;
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

        var playerTeam = player.Team;
        var teamStr = playerTeam == CsTeam.CounterTerrorist ? "ct" : playerTeam == CsTeam.Terrorist ? "t" : "none";

        foreach (var weaponHandle in pawn.WeaponServices.MyWeapons)
        {
            var weapon = weaponHandle.Value;
            if (weapon == null || !weapon.IsValid) continue;

            var weaponName = weapon.DesignerName;
            var weaponDefIndex = weapon.AttributeManager.Item.ItemDefinitionIndex;
            var isKnife = weaponName.Contains("knife") || weaponName.Contains("bayonet");

            EquippedSkin? equippedSkin = null;

            if (isKnife)
            {
                equippedSkin = data.EquippedSkins.FirstOrDefault(s =>
                    s.IsKnife && IsTeamMatch(s.Team, playerTeam));
            }
            else
            {
                equippedSkin = data.EquippedSkins.FirstOrDefault(s =>
                    !s.IsKnife && !s.IsGloves &&
                    IsTeamMatch(s.Team, playerTeam) &&
                    (s.WeaponDefIndex == weaponDefIndex || IsMatchingWeapon(weaponName, s.WeaponName)));
            }

            if (equippedSkin != null)
            {
                ApplySkin(weapon, equippedSkin);
            }
            else
            {
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
            if (skin.IsKnife && skin.WeaponDefIndex > 0)
            {
                weapon.AttributeManager.Item.ItemDefinitionIndex = (ushort)skin.WeaponDefIndex;
            }

            weapon.AttributeManager.Item.ItemID = 16384;
            weapon.AttributeManager.Item.ItemIDLow = 16384;
            weapon.AttributeManager.Item.ItemIDHigh = 0;
            weapon.AttributeManager.Item.AccountID = 0;

            weapon.FallbackPaintKit = skin.PaintKit;
            weapon.FallbackSeed = skin.Seed;
            weapon.FallbackWear = skin.Wear;
            weapon.FallbackStatTrak = -1;

            Utilities.SetStateChanged(weapon, "CBaseEntity", "m_AttributeManager");
            Utilities.SetStateChanged(weapon, "CBasePlayerWeapon", "m_nFallbackPaintKit");
            Utilities.SetStateChanged(weapon, "CBasePlayerWeapon", "m_nFallbackSeed");
            Utilities.SetStateChanged(weapon, "CBasePlayerWeapon", "m_flFallbackWear");

            if (skin.IsKnife)
            {
                Utilities.SetStateChanged(weapon, "CBaseEntity", "m_iItemDefinitionIndex");
            }
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
            weapon.AttributeManager.Item.ItemID = 16384;
            weapon.AttributeManager.Item.ItemIDLow = 16384;
            weapon.AttributeManager.Item.ItemIDHigh = 0;
            weapon.FallbackPaintKit = 0;
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

    private void ForceWeaponRefresh(CCSPlayerController player)
    {
        if (!player.IsValid || player.PlayerPawn?.Value == null) return;

        var pawn = player.PlayerPawn.Value;
        if (pawn.WeaponServices?.MyWeapons == null) return;

        try
        {
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

            player.RemoveWeapons();
            player.GiveNamedItem("weapon_knife");

            foreach (var weaponName in weapons)
            {
                player.GiveNamedItem(weaponName);
            }

            if (!string.IsNullOrEmpty(activeWeapon))
            {
                AddTimer(0.1f, () =>
                {
                    if (player != null && player.IsValid)
                    {
                        player.ExecuteClientCommand($"use {activeWeapon}");
                    }
                });
            }
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostSouls] ForceWeaponRefresh error: {ex.Message}");
        }
    }

    private bool IsMatchingWeapon(string designerName, string skinWeaponName)
    {
        var mapping = new Dictionary<string, string[]>
        {
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
            { "weapon_mac10", new[] { "MAC-10" } },
            { "weapon_mp5sd", new[] { "MP5-SD" } },
            { "weapon_mp7", new[] { "MP7" } },
            { "weapon_mp9", new[] { "MP9" } },
            { "weapon_p90", new[] { "P90" } },
            { "weapon_bizon", new[] { "PP-Bizon" } },
            { "weapon_ump45", new[] { "UMP-45" } },
            { "weapon_ak47", new[] { "AK-47" } },
            { "weapon_aug", new[] { "AUG" } },
            { "weapon_famas", new[] { "FAMAS" } },
            { "weapon_galilar", new[] { "Galil AR" } },
            { "weapon_m4a1", new[] { "M4A4" } },
            { "weapon_m4a1_silencer", new[] { "M4A1-S" } },
            { "weapon_sg556", new[] { "SG 553" } },
            { "weapon_awp", new[] { "AWP" } },
            { "weapon_g3sg1", new[] { "G3SG1" } },
            { "weapon_scar20", new[] { "SCAR-20" } },
            { "weapon_ssg08", new[] { "SSG 08" } },
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

        return designerName.Contains(skinWeaponName.ToLower().Replace(" ", "").Replace("-", ""));
    }

    #endregion

    #region Announcement System

    private void CheckAndShowAnnouncement()
    {
        if (!_announcementsEnabled || _announcements.Count == 0) return;

        var elapsed = (DateTime.Now - _lastAnnouncementTime).TotalSeconds;
        if (elapsed < _announcementInterval) return;

        ShowNextAnnouncement();
    }

    private void ShowNextAnnouncement()
    {
        if (_announcements.Count == 0) return;

        var announcement = _announcements[_currentAnnouncementIndex];
        _currentAnnouncementIndex = (_currentAnnouncementIndex + 1) % _announcements.Count;
        _lastAnnouncementTime = DateTime.Now;

        var prefixColor = GetChatColor(announcement.PrefixColor);
        var messageColor = GetChatColor(announcement.Color);

        foreach (var player in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
        {
            switch (announcement.Type)
            {
                case "chat":
                    player.PrintToChat($" {prefixColor}{announcement.Prefix} {messageColor}{announcement.Message}");
                    break;
                case "center":
                    player.PrintToCenter(announcement.Message);
                    break;
                case "html":
                    var html = $"<font color='{GetHexColor(announcement.PrefixColor)}'>{announcement.Prefix}</font> <font color='{GetHexColor(announcement.Color)}'>{announcement.Message}</font>";
                    player.PrintToCenterHtml(html);
                    break;
            }
        }
    }

    private async Task FetchAnnouncements()
    {
        if (_httpClient == null || IsApiCircuitOpen()) return;

        HttpResponseMessage? response = null;
        try
        {
            var url = $"{Config.ApiUrl}/api/plugin/config";
            response = await _httpClient.GetAsync(url);

            // HIGH SEVERITY FIX: Handle redirect and dispose original response
            if ((int)response.StatusCode >= 300 && (int)response.StatusCode < 400)
            {
                var redirectUrl = response.Headers.Location?.ToString();
                response.Dispose(); // Dispose the redirect response

                if (!string.IsNullOrEmpty(redirectUrl))
                {
                    response = await _httpClient.GetAsync(redirectUrl);
                }
                else
                {
                    return;
                }
            }

            if (!response.IsSuccessStatusCode)
            {
                RecordApiFailure();
                return;
            }

            var json = await response.Content.ReadAsStringAsync();
            var config = JsonSerializer.Deserialize<PluginConfigResponse>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (config == null) return;

            _announcements = config.Announcements ?? new List<AnnouncementData>();

            if (config.Settings != null)
            {
                if (config.Settings.TryGetValue("announcements.enabled", out var enabled))
                {
                    _announcementsEnabled = enabled.ToLower() == "true";
                }
                if (config.Settings.TryGetValue("announcements.interval", out var interval))
                {
                    if (float.TryParse(interval, out var intervalFloat))
                    {
                        _announcementInterval = intervalFloat;
                    }
                }
            }

            RecordApiSuccess();
            _lastAnnouncementFetch = DateTime.Now;
        }
        catch (Exception ex)
        {
            RecordApiFailure();
            Logger.LogError($"[GhostSouls] FetchAnnouncements error: {ex.Message}");
        }
        finally
        {
            response?.Dispose();
        }
    }

    private string GetHexColor(string colorName)
    {
        return colorName.ToLower() switch
        {
            "red" => "#ff4444",
            "darkred" => "#aa0000",
            "orange" => "#ff9944",
            "yellow" => "#ffff44",
            "gold" => "#ffd700",
            "green" => "#44ff44",
            "lime" => "#00ff00",
            "blue" => "#4444ff",
            "lightblue" => "#44aaff",
            "purple" => "#a855f7",
            "magenta" => "#ff44ff",
            "grey" => "#888888",
            "white" => "#ffffff",
            _ => "#ffffff"
        };
    }

    private void GiveSoulsPerMinute()
    {
        var soulsPerMinute = Config.Souls.SoulsPerMinute;
        if (soulsPerMinute <= 0) return;

        foreach (var player in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
        {
            var steamId = player.SteamID;
            if (_playerCache.TryGetValue(steamId, out var data))
            {
                var role = GetPlayerRole(steamId);
                var settings = GetRoleSettings(role);
                var earned = (int)(soulsPerMinute * settings.SoulsMultiplier);

                data.Souls += earned;
                data.TotalEarned += earned;
                data.SessionEarned += earned;
                data.IsDirty = true;

                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}+{ChatColors.Green}{earned} {ChatColors.Default}souls for playing!");
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

        // Show cached data immediately
        if (_playerCache.TryGetValue(steamId, out var cachedData))
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}You have {ChatColors.Green}{cachedData.Souls:N0} {ChatColors.Default}souls.");
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Total earned: {ChatColors.Yellow}{cachedData.TotalEarned:N0} {ChatColors.Default}souls.");
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Open cases at {ChatColors.Green}{Config.WebsiteUrl}/cases");
        }
        else
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Yellow}Loading your data...");

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
                            if (player != null && player.IsValid)
                            {
                                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}You have {ChatColors.Green}{data.Souls:N0} {ChatColors.Default}souls.");
                                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Total earned: {ChatColors.Yellow}{data.TotalEarned:N0} {ChatColors.Default}souls.");
                            }
                        });
                    }
                    else
                    {
                        Server.NextFrame(() =>
                        {
                            if (player != null && player.IsValid)
                            {
                                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}You're a new player! Welcome!");
                                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Visit {ChatColors.Green}{Config.WebsiteUrl} {ChatColors.Default}to get started.");
                            }
                        });
                    }
                }
                catch
                {
                    Server.NextFrame(() =>
                    {
                        if (player != null && player.IsValid)
                        {
                            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}Could not connect to server. Try again later.");
                        }
                    });
                }
            });
        }
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
                        if (player != null && player.IsValid)
                        {
                            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Data refreshed! {ChatColors.Default}You have {ChatColors.Green}{data.Souls:N0} {ChatColors.Default}souls.");
                            ApplyPlayerSkins(player, steamId);
                        }
                    });
                }
            }
            catch (Exception ex)
            {
                Server.NextFrame(() =>
                {
                    if (player != null && player.IsValid)
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
        player.ExecuteClientCommandFromServer("css_wp");
        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Skins refreshed! Use !wp for menu.");
    }

    [ConsoleCommand("css_elo", "Show your ELO and rank")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnEloCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        var steamId = player.SteamID;

        if (_playerCache.TryGetValue(steamId, out var data))
        {
            ShowEloInfo(player, data);
        }
        else
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Yellow}Loading your rank data...");

            Task.Run(async () =>
            {
                try
                {
                    var freshData = await FetchPlayerData(steamId);
                    if (freshData != null)
                    {
                        _playerCache[steamId] = freshData;
                        Server.NextFrame(() =>
                        {
                            if (player != null && player.IsValid)
                            {
                                ShowEloInfo(player, freshData);
                            }
                        });
                    }
                    else
                    {
                        Server.NextFrame(() =>
                        {
                            if (player != null && player.IsValid)
                            {
                                // Show default rank for new players
                                var defaultRank = GetRankFromElo(1000);
                                var rankColor = GetChatColor(defaultRank.Color);
                                player.PrintToChat($" ");
                                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Your Rank: {rankColor}{defaultRank.Name}");
                                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}ELO: {ChatColors.Green}1000 {ChatColors.Default}(Starting ELO)");
                                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Play competitive to rank up!");
                                player.PrintToChat($" ");
                            }
                        });
                    }
                }
                catch
                {
                    Server.NextFrame(() =>
                    {
                        if (player != null && player.IsValid)
                        {
                            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}Could not connect to server. Try again later.");
                        }
                    });
                }
            });
        }
    }

    private void ShowEloInfo(CCSPlayerController player, PlayerData data)
    {
        var rankInfo = GetRankFromElo(data.Elo);
        var rankColor = GetChatColor(rankInfo.Color);
        var winrate = data.Wins + data.Losses > 0
            ? (data.Wins * 100 / (data.Wins + data.Losses))
            : 0;

        player.PrintToChat($" ");
        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Your Rank: {rankColor}{rankInfo.Name}");
        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}ELO: {ChatColors.Green}{data.Elo} {ChatColors.Default}| W/L: {ChatColors.Green}{data.Wins}{ChatColors.Default}/{ChatColors.Red}{data.Losses} {ChatColors.Default}({winrate}%)");

        var nextRank = GetNextRank(data.Elo);
        if (nextRank != null)
        {
            var eloNeeded = nextRank.MinElo - data.Elo;
            var nextColor = GetChatColor(nextRank.Color);
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Next: {nextColor}{nextRank.Name} {ChatColors.Grey}({eloNeeded} ELO needed)");
        }
        player.PrintToChat($" ");
    }

    [ConsoleCommand("css_stats", "Show your stats")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnStatsCommand(CCSPlayerController? player, CommandInfo command)
    {
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
        player.PrintToChat($" {ChatColors.Default}API Circuit: {(_apiFailureCount >= API_FAILURE_THRESHOLD ? ChatColors.Red + "OPEN" : ChatColors.Green + "CLOSED")} ({_apiFailureCount} failures)");
        player.PrintToChat($" {ChatColors.Default}Cache Size: {ChatColors.Yellow}{_playerCache.Count} players");

        if (_playerCache.TryGetValue(steamId, out var data))
        {
            player.PrintToChat($" {ChatColors.Default}Souls: {ChatColors.Green}{data.Souls:N0} {ChatColors.Grey}(Session: +{data.SessionEarned})");
            player.PrintToChat($" {ChatColors.Default}Total Earned: {ChatColors.Yellow}{data.TotalEarned:N0}");
            player.PrintToChat($" {ChatColors.Default}ELO: {ChatColors.Green}{data.Elo} {ChatColors.Grey}(W:{data.Wins}/L:{data.Losses})");
            player.PrintToChat($" {ChatColors.Default}Role: {ChatColors.Yellow}{data.Role} {ChatColors.Grey}| Premium: {data.PremiumTier}");
            player.PrintToChat($" {ChatColors.Default}Dirty: {(data.IsDirty ? ChatColors.Red : ChatColors.Green)}{data.IsDirty}");
            player.PrintToChat($" {ChatColors.Gold}Equipped Skins ({data.EquippedSkins.Count}):");

            if (data.EquippedSkins.Count == 0)
            {
                player.PrintToChat($" {ChatColors.Grey}  (none)");
            }
            else
            {
                foreach (var skin in data.EquippedSkins.Take(5))
                {
                    var knifeTag = skin.IsKnife ? " [KNIFE]" : "";
                    var glovesTag = skin.IsGloves ? " [GLOVES]" : "";
                    player.PrintToChat($" {ChatColors.Default}  - {ChatColors.Green}{skin.WeaponName}{knifeTag}{glovesTag}");
                }
                if (data.EquippedSkins.Count > 5)
                {
                    player.PrintToChat($" {ChatColors.Grey}  ... and {data.EquippedSkins.Count - 5} more");
                }
            }
        }
        else
        {
            player.PrintToChat($" {ChatColors.Red}No cached data found!");
        }

        player.PrintToChat($" {ChatColors.Purple}============================");
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

        if (command.ArgCount > 1)
        {
            var arg = command.GetArg(1);
            if (int.TryParse(arg, out int serverNum) && serverNum >= 1 && serverNum <= servers.Count)
            {
                var server = servers[serverNum - 1];
                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Connecting to {ChatColors.Green}{server.Name}{ChatColors.Default}...");
                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Yellow}connect {server.Address}");
                player.ExecuteClientCommand($"connect {server.Address}");
                return;
            }
            else
            {
                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}Invalid server number. Use !server to see the list.");
                return;
            }
        }

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
        if (_httpClient == null || IsApiCircuitOpen()) return null;

        HttpResponseMessage? response = null;
        try
        {
            var url = $"{Config.ApiUrl}/api/plugin/player/{steamId}";
            response = await _httpClient.GetAsync(url);

            // HIGH SEVERITY FIX: Handle redirect and dispose original response
            if ((int)response.StatusCode >= 300 && (int)response.StatusCode < 400)
            {
                var redirectUrl = response.Headers.Location?.ToString();
                response.Dispose();

                if (!string.IsNullOrEmpty(redirectUrl))
                {
                    response = await _httpClient.GetAsync(redirectUrl);
                }
                else
                {
                    return null;
                }
            }

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

            RecordApiSuccess();

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
            RecordApiFailure();
            Logger.LogError($"[GhostSouls] API fetch error: {ex.Message}");
            throw;
        }
        finally
        {
            response?.Dispose();
        }
    }

    private async Task RefreshPlayerData(ulong steamId)
    {
        var freshData = await FetchPlayerData(steamId);
        if (freshData == null) return;

        if (_playerCache.TryGetValue(steamId, out var cachedData))
        {
            var sessionEarned = cachedData.SessionEarned;
            freshData.Souls += sessionEarned;
            freshData.SessionEarned = sessionEarned;
            freshData.IsDirty = sessionEarned > 0;
        }

        _playerCache[steamId] = freshData;
    }

    private async Task RegisterPlayer(ulong steamId, string username)
    {
        if (_httpClient == null || IsApiCircuitOpen()) return;

        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(new { steamId = steamId.ToString(), username }),
                System.Text.Encoding.UTF8,
                "application/json"
            );

            using var response = await _httpClient.PostAsync($"{Config.ApiUrl}/api/plugin/player/register", content);
            response.EnsureSuccessStatusCode();
            RecordApiSuccess();
        }
        catch (Exception ex)
        {
            RecordApiFailure();
            Logger.LogError($"[GhostSouls] Player registration error: {ex.Message}");
            throw;
        }
    }

    private async Task SyncPlayerData(PlayerData data)
    {
        if (_httpClient == null || IsApiCircuitOpen()) return;
        if (!data.IsDirty || data.SessionEarned <= 0) return;

        try
        {
            var soulsToSync = data.SessionEarned;

            var content = new StringContent(
                JsonSerializer.Serialize(new
                {
                    steamId = data.SteamId.ToString(),
                    soulsToAdd = soulsToSync
                }),
                System.Text.Encoding.UTF8,
                "application/json"
            );

            using var response = await _httpClient.PostAsync($"{Config.ApiUrl}/api/plugin/player/sync", content);
            response.EnsureSuccessStatusCode();

            data.SessionEarned = 0;
            data.IsDirty = false;

            RecordApiSuccess();
            Logger.LogInformation($"[GhostSouls] Synced {soulsToSync} souls for {data.SteamId}");
        }
        catch (Exception ex)
        {
            RecordApiFailure();
            Logger.LogError($"[GhostSouls] Sync error: {ex.Message}");
            throw;
        }
    }

    private void SyncAllPlayers()
    {
        // MEDIUM SEVERITY FIX: Take snapshot before iterating to prevent collection modification issues
        var playersToSync = _playerCache.Values.Where(p => p.IsDirty).ToList();

        foreach (var data in playersToSync)
        {
            Task.Run(async () =>
            {
                try
                {
                    await SyncPlayerData(data);
                }
                catch (Exception ex)
                {
                    Logger.LogError($"[GhostSouls] Batch sync error for {data.SteamId}: {ex.Message}");
                }
            });
        }
    }

    private void RefreshAllPlayerSkins()
    {
        var players = Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot).ToList();

        foreach (var player in players)
        {
            var steamId = player.SteamID;
            var playerRef = player;

            Task.Run(async () =>
            {
                try
                {
                    var freshData = await FetchPlayerData(steamId);
                    if (freshData == null) return;

                    var oldSkins = _playerCache.TryGetValue(steamId, out var cached)
                        ? cached.EquippedSkins
                        : new List<EquippedSkin>();

                    // LOW SEVERITY FIX: Handle null EquippedSkins
                    var newSkins = freshData.EquippedSkins ?? new List<EquippedSkin>();
                    var skinsChanged = !AreSkinListsEqual(oldSkins ?? new List<EquippedSkin>(), newSkins);

                    if (skinsChanged)
                    {
                        if (cached != null)
                        {
                            cached.EquippedSkins = newSkins;
                        }
                        else
                        {
                            _playerCache[steamId] = freshData;
                        }

                        Server.NextFrame(() =>
                        {
                            if (playerRef != null && playerRef.IsValid && playerRef.PawnIsAlive)
                            {
                                playerRef.ExecuteClientCommandFromServer("css_wp");
                                playerRef.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Skins updated from website!");
                            }
                        });
                    }
                }
                catch (Exception ex)
                {
                    Logger.LogError($"[GhostSouls] Skin refresh error for {steamId}: {ex.Message}");
                }
            });
        }
    }

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
        await Task.CompletedTask;

        Server.NextFrame(() =>
        {
            foreach (var player in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
            {
                // BRANDING FIX: Unified prefix
                player.PrintToChat($" {ChatColors.Gold}[Ghost] {ChatColors.Purple}RARE DROP! {ChatColors.Green}{playerName} {ChatColors.Default}just unboxed {ChatColors.Yellow}{weaponName} | {itemName}!");
            }
        });
    }

    #endregion
}
