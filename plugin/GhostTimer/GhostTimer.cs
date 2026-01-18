using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Attributes.Registration;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.Utils;
using CounterStrikeSharp.API.Modules.Timers;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Collections.Concurrent;

namespace GhostTimer;

public class GhostTimer : BasePlugin
{
    public override string ModuleName => "Ghost Timer";
    public override string ModuleVersion => "2.2.0";
    public override string ModuleAuthor => "GhostServers.site";
    public override string ModuleDescription => "Surf/bhop timer with speedometer and PB tracking";

    // API config - should be moved to config file in future
    private const string API_URL = "https://www.ghostservers.site/api";
    private const string API_KEY = "3NULQW7WPpW3ZquX2WzFVyvWx2y09DQEg+JBA4+JVv4=";

    private HttpClient? _httpClient;

    // Thread-safe player timer data (CRITICAL FIX: was Dictionary)
    private readonly ConcurrentDictionary<ulong, PlayerTimerData> _playerTimers = new();

    // Zone entities - separate main start from stage starts
    private readonly HashSet<uint> _mainStartZones = new();
    private readonly HashSet<uint> _stageZones = new();
    private readonly HashSet<uint> _endZones = new();
    private readonly object _zoneLock = new(); // Lock for zone access

    // Map info
    private string _currentMap = "";
    private Vector? _mapSpawnPos = null;
    private QAngle? _mapSpawnAngle = null;

    // Server record for current map
    private double _serverRecord = 0;
    private string _serverRecordHolder = "";

    // Vote system
    private DateTime _lastVoteTime = DateTime.MinValue;
    private readonly HashSet<ulong> _voteYes = new();
    private readonly HashSet<ulong> _voteNo = new();
    private bool _voteActive = false;
    private DateTime _voteStartTime = DateTime.MinValue;
    private const int VOTE_COOLDOWN_SECONDS = 60;
    private const int VOTE_DURATION_SECONDS = 30;

    // Map voting system
    private bool _mapVoteActive = false;
    private DateTime _mapVoteStartTime = DateTime.MinValue;
    private readonly Dictionary<int, int> _mapVotes = new();
    private readonly Dictionary<ulong, int> _playerMapVotes = new();
    private List<string> _mapCandidates = new();
    private const int MAP_VOTE_DURATION = 30;

    // Available surf maps (Tier 1-2)
    private readonly List<(string workshopId, string name)> _surfMaps = new()
    {
        // Tier 1 - Beginner
        ("3070321829", "surf_beginner"),
        ("3082548297", "surf_rookie"),
        ("3088413071", "surf_ace"),
        ("3292018151", "surf_how2surf"),
        ("3073875025", "surf_utopia_njv"),
        ("3076153623", "surf_kitsune"),
        ("3270900689", "surf_kitsune2"),
        ("3165517928", "surf_astra"),
        ("3129698096", "surf_nyx"),
        ("3133346713", "surf_boreas"),
        ("3296258256", "surf_whiteout"),
        ("3080544577", "surf_deathstar"),
        ("3143583805", "surf_volvic"),
        ("3130141240", "surf_atrium"),
        ("3131555986", "surf_tranquil"),
        ("3120455026", "surf_frostedge"),
        ("3280013431", "surf_lux"),
        ("3143608161", "surf_skipalot"),
        ("3226467978", "surf_palm"),
        ("3155961809", "surf_juturna"),
        // Tier 2
        ("3076980482", "surf_mesa_revo"),
        ("3319154265", "surf_prisma"),
        ("3124210799", "surf_ing"),
        ("3233388051", "surf_4fun"),
        ("3248211716", "surf_me"),
        ("3271149992", "surf_lullaby"),
        ("3259650654", "surf_race"),
        ("3282137145", "surf_mom"),
        ("3124212820", "surf_lockdown"),
        ("3212207205", "surf_slob"),
        ("3298148307", "surf_aser"),
        ("3284773599", "surf_akai"),
    };

    // LOW SEVERITY FIX: Compile regex once instead of per-check
    private static readonly Regex StageRegex = new(@"stage[_]?[1-9]", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Circuit breaker for API
    private int _apiFailureCount = 0;
    private DateTime _apiCircuitOpenTime = DateTime.MinValue;
    private const int API_FAILURE_THRESHOLD = 5;
    private static readonly TimeSpan API_CIRCUIT_RESET_TIME = TimeSpan.FromMinutes(2);

    public override void Load(bool hotReload)
    {
        Logger.LogInformation("[GhostTimer] Loading Ghost Timer v2.1...");

        // Initialize HttpClient with timeout (HIGH SEVERITY FIX: was not configured properly)
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(10)
        };
        _httpClient.DefaultRequestHeaders.Add("x-api-key", API_KEY);

        // Register events
        RegisterEventHandler<EventPlayerConnectFull>(OnPlayerConnect);
        RegisterEventHandler<EventPlayerDisconnect>(OnPlayerDisconnect);
        RegisterEventHandler<EventPlayerSpawn>(OnPlayerSpawn);
        RegisterEventHandler<EventRoundStart>(OnRoundStart);

        // Register trigger events
        RegisterListener<Listeners.OnEntitySpawned>(OnEntitySpawned);
        RegisterListener<Listeners.OnTick>(OnTick);

        // HUD update timer - 10 times per second for smooth speedometer (uses efficient caching)
        AddTimer(0.1f, () =>
        {
            try { UpdateHud(); }
            catch (Exception ex) { Logger.LogError($"[GhostTimer] HUD update error: {ex.Message}"); }
        }, TimerFlags.REPEAT);

        // Vote check timer - every second
        AddTimer(1f, () =>
        {
            try { CheckVoteStatus(); }
            catch (Exception ex) { Logger.LogError($"[GhostTimer] Vote check error: {ex.Message}"); }
        }, TimerFlags.REPEAT);

        Logger.LogInformation("[GhostTimer] Plugin loaded!");
    }

    public override void Unload(bool hotReload)
    {
        // HIGH SEVERITY FIX: Dispose HttpClient to prevent socket exhaustion
        _httpClient?.Dispose();
        _httpClient = null;

        Logger.LogInformation("[GhostTimer] Plugin unloaded.");
    }

    #region Circuit Breaker

    private bool IsApiCircuitOpen()
    {
        if (_apiFailureCount < API_FAILURE_THRESHOLD) return false;

        if (DateTime.UtcNow - _apiCircuitOpenTime > API_CIRCUIT_RESET_TIME)
        {
            _apiFailureCount = 0;
            Logger.LogInformation("[GhostTimer] API circuit breaker reset");
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
            Logger.LogWarning($"[GhostTimer] API circuit breaker OPEN ({_apiFailureCount} failures)");
        }
    }

    private void RecordApiSuccess()
    {
        _apiFailureCount = 0;
    }

    #endregion

    #region Events

    private HookResult OnPlayerConnect(EventPlayerConnectFull @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        var steamId = player.SteamID;
        var playerName = player.PlayerName;
        _playerTimers[steamId] = new PlayerTimerData { PlayerName = playerName };

        // Load player data async (PB only - no souls, GhostSouls handles that)
        Task.Run(async () =>
        {
            try
            {
                await LoadPlayerPBAsync(steamId, playerName);
            }
            catch (Exception ex)
            {
                Logger.LogError($"[GhostTimer] Failed to load player PB for {steamId}: {ex.Message}");
            }
        });

        return HookResult.Continue;
    }

    private async Task LoadPlayerPBAsync(ulong steamId, string playerName)
    {
        if (_httpClient == null || IsApiCircuitOpen()) return;
        if (string.IsNullOrEmpty(_currentMap)) return;

        try
        {
            // Load PB for current map only (no souls - GhostSouls handles that)
            using var pbResponse = await _httpClient.GetAsync($"{API_URL}/times?map={_currentMap}&steamId={steamId}");
            if (pbResponse.IsSuccessStatusCode)
            {
                var json = await pbResponse.Content.ReadAsStringAsync();
                var data = JsonSerializer.Deserialize<TimesResponse>(json);
                if (data?.times?.Length > 0 && _playerTimers.TryGetValue(steamId, out var timerData))
                {
                    timerData.BestTime = data.times[0].time;
                }
            }

            RecordApiSuccess();
            Logger.LogInformation($"[GhostTimer] Loaded PB for {playerName}");
        }
        catch (Exception ex)
        {
            RecordApiFailure();
            Logger.LogWarning($"[GhostTimer] Failed to load player PB: {ex.Message}");
        }
    }

    private HookResult OnPlayerDisconnect(EventPlayerDisconnect @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        _playerTimers.TryRemove(player.SteamID, out _);

        return HookResult.Continue;
    }

    private HookResult OnPlayerSpawn(EventPlayerSpawn @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        // Save spawn position for !r (only first time)
        if (_mapSpawnPos == null && player.PlayerPawn?.Value != null)
        {
            var pawn = player.PlayerPawn.Value;
            var origin = pawn.AbsOrigin;
            var angles = pawn.EyeAngles;

            // CRITICAL FIX: Null check for AbsOrigin and EyeAngles
            if (origin != null && angles != null)
            {
                _mapSpawnPos = new Vector(origin.X, origin.Y, origin.Z);
                _mapSpawnAngle = new QAngle(angles.X, angles.Y, angles.Z);
            }
        }

        return HookResult.Continue;
    }

    private HookResult OnRoundStart(EventRoundStart @event, GameEventInfo info)
    {
        _currentMap = Server.MapName;
        _mapSpawnPos = null;
        _mapSpawnAngle = null;

        ScanForZones();

        // Load server record for this map
        Task.Run(async () =>
        {
            try
            {
                await LoadServerRecordAsync();
            }
            catch (Exception ex)
            {
                Logger.LogError($"[GhostTimer] Failed to load server record: {ex.Message}");
            }
        });

        int mainCount, stageCount, endCount;
        lock (_zoneLock)
        {
            mainCount = _mainStartZones.Count;
            stageCount = _stageZones.Count;
            endCount = _endZones.Count;
        }

        Logger.LogInformation($"[GhostTimer] Map: {_currentMap}, MainStart: {mainCount}, Stages: {stageCount}, End: {endCount}");

        return HookResult.Continue;
    }

    private async Task LoadServerRecordAsync()
    {
        if (_httpClient == null || IsApiCircuitOpen()) return;

        try
        {
            using var response = await _httpClient.GetAsync($"{API_URL}/times?map={_currentMap}&limit=1");
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync();
                var data = JsonSerializer.Deserialize<TimesResponse>(json);
                if (data?.times?.Length > 0)
                {
                    _serverRecord = data.times[0].time;
                    _serverRecordHolder = data.times[0].playerName ?? "Unknown";
                    RecordApiSuccess();
                    Logger.LogInformation($"[GhostTimer] Server record: {FormatTime(_serverRecord)} by {_serverRecordHolder}");
                }
                else
                {
                    _serverRecord = 0;
                    _serverRecordHolder = "";
                }
            }
        }
        catch (Exception ex)
        {
            RecordApiFailure();
            Logger.LogWarning($"[GhostTimer] Failed to load server record: {ex.Message}");
        }
    }

    private void OnEntitySpawned(CEntityInstance entity)
    {
        if (entity.DesignerName.Contains("trigger"))
        {
            var name = entity.Entity?.Name ?? "";
            var zoneType = GetZoneType(name, entity.DesignerName);

            lock (_zoneLock)
            {
                switch (zoneType)
                {
                    case ZoneType.MainStart:
                        _mainStartZones.Add(entity.Index);
                        Logger.LogInformation($"[GhostTimer] Found MAIN start zone: {name} ({entity.Index})");
                        break;
                    case ZoneType.Stage:
                        _stageZones.Add(entity.Index);
                        Logger.LogInformation($"[GhostTimer] Found stage zone: {name} ({entity.Index})");
                        break;
                    case ZoneType.End:
                        _endZones.Add(entity.Index);
                        Logger.LogInformation($"[GhostTimer] Found end zone: {name} ({entity.Index})");
                        break;
                }
            }
        }
    }

    private void OnTick()
    {
        foreach (var player in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot && p.PawnIsAlive))
        {
            try
            {
                CheckPlayerZones(player);
            }
            catch (Exception ex)
            {
                Logger.LogError($"[GhostTimer] Zone check error: {ex.Message}");
            }
        }
    }

    #endregion

    #region Zone Detection

    private enum ZoneType { None, MainStart, Stage, End }

    private void ScanForZones()
    {
        lock (_zoneLock)
        {
            _mainStartZones.Clear();
            _stageZones.Clear();
            _endZones.Clear();

            var triggers = Utilities.FindAllEntitiesByDesignerName<CBaseTrigger>("trigger_multiple");
            foreach (var trigger in triggers)
            {
                if (trigger == null || !trigger.IsValid) continue;

                var name = trigger.Entity?.Name ?? "";
                var zoneType = GetZoneType(name, "trigger_multiple");

                switch (zoneType)
                {
                    case ZoneType.MainStart:
                        _mainStartZones.Add(trigger.Index);
                        break;
                    case ZoneType.Stage:
                        _stageZones.Add(trigger.Index);
                        break;
                    case ZoneType.End:
                        _endZones.Add(trigger.Index);
                        break;
                }
            }

            var teleports = Utilities.FindAllEntitiesByDesignerName<CBaseTrigger>("trigger_teleport");
            foreach (var trigger in teleports)
            {
                if (trigger == null || !trigger.IsValid) continue;

                var name = trigger.Entity?.Name ?? "";
                var zoneType = GetZoneType(name, "trigger_teleport");

                if (zoneType == ZoneType.MainStart)
                {
                    _mainStartZones.Add(trigger.Index);
                }
            }
        }
    }

    private ZoneType GetZoneType(string name, string designerName)
    {
        name = name.ToLower();

        // Check for stage zones FIRST (LOW SEVERITY FIX: Use compiled regex)
        if (name.Contains("stage") && !name.Contains("stage_0") && !name.Contains("stage0"))
        {
            if (StageRegex.IsMatch(name))
            {
                return ZoneType.Stage;
            }
        }

        // Check for end zone
        if (name.Contains("end") || name.Contains("finish") ||
            name.Contains("timer_end") || name.Contains("zone_end") ||
            name.Contains("mod_zone_end"))
        {
            return ZoneType.End;
        }

        // Check for main start zone
        if (name.Contains("stage_0") || name.Contains("stage0") ||
            name.Contains("timer_start") || name.Contains("zone_start") ||
            name.Contains("mod_zone_start") ||
            (name.Contains("start") && !name.Contains("stage")))
        {
            return ZoneType.MainStart;
        }

        if (designerName == "trigger_teleport" && name.Contains("start"))
        {
            return ZoneType.MainStart;
        }

        return ZoneType.None;
    }

    private void CheckPlayerZones(CCSPlayerController player)
    {
        if (player.PlayerPawn?.Value == null) return;

        var pawn = player.PlayerPawn.Value;
        var steamId = player.SteamID;

        if (!_playerTimers.TryGetValue(steamId, out var data)) return;

        var pos = pawn.AbsOrigin;
        if (pos == null) return;

        // Take snapshot of zones to avoid holding lock during iteration
        uint[] mainStarts, ends;
        lock (_zoneLock)
        {
            mainStarts = _mainStartZones.ToArray();
            ends = _endZones.ToArray();
        }

        // Check start zones - only matters if timer is NOT running
        if (!data.IsRunning)
        {
            foreach (var zoneIndex in mainStarts)
            {
                // MEDIUM SEVERITY FIX: Safe cast with bounds check
                if (zoneIndex > int.MaxValue) continue;

                var zone = Utilities.GetEntityFromIndex<CBaseTrigger>((int)zoneIndex);
                if (zone == null || !zone.IsValid) continue;

                if (IsPlayerInZone(pos, zone))
                {
                    if (!data.InStartZone)
                    {
                        data.InStartZone = true;
                        data.CurrentTime = 0;
                        data.StartTick = 0;
                    }
                    return;
                }
            }

            // Player left start zone - start timer
            if (data.InStartZone)
            {
                data.InStartZone = false;
                data.IsRunning = true;
                data.StartTick = Server.TickCount;
                // BRANDING FIX: Unified prefix
                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Timer started!");
            }
        }

        // Check end zones
        if (data.IsRunning)
        {
            foreach (var zoneIndex in ends)
            {
                if (zoneIndex > int.MaxValue) continue;

                var zone = Utilities.GetEntityFromIndex<CBaseTrigger>((int)zoneIndex);
                if (zone == null || !zone.IsValid) continue;

                if (IsPlayerInZone(pos, zone))
                {
                    // Timer finished!
                    var ticks = Server.TickCount - data.StartTick;
                    var time = ticks / 64.0f;

                    data.IsRunning = false;
                    data.LastTime = time;

                    var isPB = data.BestTime <= 0 || time < data.BestTime;
                    if (isPB)
                    {
                        data.BestTime = time;
                    }

                    var isSR = _serverRecord <= 0 || time < _serverRecord;
                    if (isSR)
                    {
                        _serverRecord = time;
                        _serverRecordHolder = player.PlayerName;
                    }

                    var timeStr = FormatTime(time);
                    // BRANDING FIX: Unified prefix
                    var pbStr = isPB ? $" {ChatColors.Gold}NEW PB!" : "";
                    var srStr = isSR ? $" {ChatColors.LightRed}NEW SERVER RECORD!" : "";

                    player.PrintToChat($" ");
                    player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Finished! {ChatColors.Default}Time: {ChatColors.Yellow}{timeStr}{pbStr}{srStr}");
                    if (data.BestTime > 0 && !isPB)
                    {
                        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}PB: {ChatColors.Green}{FormatTime(data.BestTime)}");
                    }
                    player.PrintToChat($" ");

                    foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot && p != player))
                    {
                        p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}{player.PlayerName} {ChatColors.Default}finished in {ChatColors.Yellow}{timeStr}{pbStr}{srStr}");
                    }

                    // Save time to database
                    Task.Run(async () =>
                    {
                        try
                        {
                            await SaveTimeAsync(steamId, player.PlayerName, time, isPB, isSR);
                        }
                        catch (Exception ex)
                        {
                            Logger.LogError($"[GhostTimer] Save time error: {ex.Message}");
                        }
                    });

                    return;
                }
            }
        }
    }

    private async Task SaveTimeAsync(ulong steamId, string playerName, double time, bool isPB, bool isSR)
    {
        if (_httpClient == null || IsApiCircuitOpen()) return;

        try
        {
            var payload = new
            {
                steamId = steamId.ToString(),
                playerName,
                map = _currentMap,
                time,
                gameMode = "surf"
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            using var response = await _httpClient.PostAsync($"{API_URL}/times", content);

            if (response.IsSuccessStatusCode)
            {
                RecordApiSuccess();
                Logger.LogInformation($"[GhostTimer] Saved time for {playerName}: {FormatTime(time)} (PB: {isPB}, SR: {isSR})");
            }
            else
            {
                RecordApiFailure();
                Logger.LogWarning($"[GhostTimer] Failed to save time: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            RecordApiFailure();
            Logger.LogWarning($"[GhostTimer] Failed to save time: {ex.Message}");
        }
    }

    private bool IsPlayerInZone(Vector playerPos, CBaseTrigger zone)
    {
        var zonePos = zone.AbsOrigin;
        if (zonePos == null) return false;

        var mins = zone.Collision.Mins;
        var maxs = zone.Collision.Maxs;

        var worldMins = new Vector(zonePos.X + mins.X, zonePos.Y + mins.Y, zonePos.Z + mins.Z);
        var worldMaxs = new Vector(zonePos.X + maxs.X, zonePos.Y + maxs.Y, zonePos.Z + maxs.Z);

        return playerPos.X >= worldMins.X && playerPos.X <= worldMaxs.X &&
               playerPos.Y >= worldMins.Y && playerPos.Y <= worldMaxs.Y &&
               playerPos.Z >= worldMins.Z && playerPos.Z <= worldMaxs.Z;
    }

    #endregion

    #region HUD

    private void UpdateHud()
    {
        foreach (var player in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot && p.PawnIsAlive))
        {
            if (!_playerTimers.TryGetValue(player.SteamID, out var data)) continue;
            if (data.HideHud) continue;

            var pawn = player.PlayerPawn?.Value;
            if (pawn == null) continue;

            var vel = pawn.AbsVelocity;
            if (vel == null)
            {
                UpdateHudForPlayer(player, data, 0);
                continue;
            }

            var rawSpeed = Math.Sqrt(vel.X * vel.X + vel.Y * vel.Y);
            // Round to nearest 10 for smoother display
            var speed = (int)(Math.Round(rawSpeed / 10) * 10);

            UpdateHudForPlayer(player, data, speed);
        }
    }

    private void UpdateHudForPlayer(CCSPlayerController player, PlayerTimerData data, int speed)
    {
        // Calculate current time if running
        string timeStr;
        if (data.IsRunning && data.StartTick > 0)
        {
            var ticks = Server.TickCount - data.StartTick;
            var time = ticks / 64.0f;
            data.CurrentTime = time;
            timeStr = FormatTimeSimple(time);
        }
        else if (data.LastTime > 0)
        {
            timeStr = FormatTimeSimple(data.LastTime);
        }
        else
        {
            timeStr = "0:00.0";
        }

        // Build HUD text with speed, time, and PB
        string hudText;
        if (data.BestTime > 0)
        {
            var pbStr = FormatTimeSimple(data.BestTime);
            hudText = $"{speed} u/s | {timeStr} | PB: {pbStr}";
        }
        else
        {
            hudText = $"{speed} u/s | {timeStr} | PB: --:--";
        }

        // Only update if text changed (avoid unnecessary redraws)
        if (data.LastHudContent == hudText) return;
        data.LastHudContent = hudText;

        // Use PrintToCenter for stable, non-flickering HUD
        player.PrintToCenter(hudText);
    }

    private string FormatTimeSimple(double seconds)
    {
        var mins = (int)(seconds / 60);
        var secs = seconds % 60;
        return $"{mins}:{secs:00.0}";
    }

    private string FormatTime(double seconds)
    {
        var mins = (int)(seconds / 60);
        var secs = seconds % 60;
        return $"{mins}:{secs:00.000}";
    }

    #endregion

    #region Commands

    [ConsoleCommand("css_r", "Respawn/restart your run")]
    [ConsoleCommand("css_restart", "Respawn/restart your run")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnRestartCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        if (_playerTimers.TryGetValue(player.SteamID, out var data))
        {
            data.Reset();
        }

        if (_mapSpawnPos != null && player.PlayerPawn?.Value != null)
        {
            player.PlayerPawn.Value.Teleport(_mapSpawnPos, _mapSpawnAngle ?? new QAngle(0, 0, 0), new Vector(0, 0, 0));
            // BRANDING FIX: Unified prefix
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Teleported to start!");
        }
        else
        {
            player.Respawn();
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Respawned!");
        }
    }

    [ConsoleCommand("css_cp", "Save checkpoint")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnCheckpointCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid || player.PlayerPawn?.Value == null) return;

        if (!_playerTimers.TryGetValue(player.SteamID, out var data)) return;

        var pawn = player.PlayerPawn.Value;

        // CRITICAL FIX: Null check for AbsOrigin and EyeAngles
        if (pawn.AbsOrigin == null || pawn.EyeAngles == null)
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}Failed to save checkpoint!");
            return;
        }

        data.CheckpointPos = new Vector(pawn.AbsOrigin.X, pawn.AbsOrigin.Y, pawn.AbsOrigin.Z);
        data.CheckpointAngle = new QAngle(pawn.EyeAngles.X, pawn.EyeAngles.Y, pawn.EyeAngles.Z);
        data.HasCheckpoint = true;

        // BRANDING FIX: Unified prefix
        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Checkpoint saved!");
    }

    [ConsoleCommand("css_tp", "Teleport to checkpoint")]
    [ConsoleCommand("css_tele", "Teleport to checkpoint")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnTeleportCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid || player.PlayerPawn?.Value == null) return;

        if (!_playerTimers.TryGetValue(player.SteamID, out var data)) return;

        if (!data.HasCheckpoint || data.CheckpointPos == null)
        {
            // BRANDING FIX: Unified prefix
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}No checkpoint saved! Use !cp first.");
            return;
        }

        data.IsRunning = false;
        data.CurrentTime = 0;

        player.PlayerPawn.Value.Teleport(data.CheckpointPos, data.CheckpointAngle ?? new QAngle(0, 0, 0), new Vector(0, 0, 0));
        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Teleported to checkpoint! {ChatColors.Grey}(Timer stopped)");
    }

    [ConsoleCommand("css_pb", "Show your personal best")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnPBCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        if (!_playerTimers.TryGetValue(player.SteamID, out var data) || data.BestTime <= 0)
        {
            // BRANDING FIX: Unified prefix
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}No PB on this map yet!");
            return;
        }

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Your PB on {ChatColors.Green}{_currentMap}{ChatColors.Default}: {ChatColors.Gold}{FormatTime(data.BestTime)}");
    }

    [ConsoleCommand("css_timer", "Toggle timer display")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnTimerCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        if (!_playerTimers.TryGetValue(player.SteamID, out var data)) return;

        data.HideHud = !data.HideHud;
        // BRANDING FIX: Unified prefix
        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Timer HUD {(data.HideHud ? ChatColors.Red + "disabled" : ChatColors.Green + "enabled")}");
    }

    [ConsoleCommand("css_hide", "Hide other players")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnHideCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        if (!_playerTimers.TryGetValue(player.SteamID, out var data)) return;

        data.HidePlayers = !data.HidePlayers;
        // BRANDING FIX: Unified prefix
        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Players {(data.HidePlayers ? ChatColors.Red + "hidden" : ChatColors.Green + "visible")}");
    }

    [ConsoleCommand("css_sr", "Show server record")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnSRCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        // BRANDING FIX: Unified prefix
        if (_serverRecord > 0)
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Server Record on {ChatColors.Green}{_currentMap}{ChatColors.Default}: {ChatColors.Gold}{FormatTime(_serverRecord)}");
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Held by: {ChatColors.Green}{_serverRecordHolder}");
        }
        else
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}No server record on this map yet. Be the first!");
        }
    }

    [ConsoleCommand("css_vote", "Start a map change vote")]
    [ConsoleCommand("css_rtv", "Rock the vote - vote for map change")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnVoteCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        // Check if vote is already active
        if (_voteActive)
        {
            // Add player's vote as YES if vote is active
            if (!_voteYes.Contains(player.SteamID) && !_voteNo.Contains(player.SteamID))
            {
                _voteYes.Add(player.SteamID);
                var totalPlayers = Utilities.GetPlayers().Count(p => p != null && p.IsValid && !p.IsBot);
                var yesCount = _voteYes.Count;
                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Vote registered! ({yesCount}/{totalPlayers})");

                foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot && p != player))
                {
                    p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}{player.PlayerName} {ChatColors.Default}voted YES ({yesCount}/{totalPlayers})");
                }
            }
            else
            {
                player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Yellow}You already voted!");
            }
            return;
        }

        // Check cooldown
        var timeSinceLastVote = (DateTime.Now - _lastVoteTime).TotalSeconds;
        if (timeSinceLastVote < VOTE_COOLDOWN_SECONDS)
        {
            var remaining = VOTE_COOLDOWN_SECONDS - (int)timeSinceLastVote;
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}Vote on cooldown! Wait {remaining}s.");
            return;
        }

        // Start the vote
        _voteActive = true;
        _voteStartTime = DateTime.Now;
        _voteYes.Clear();
        _voteNo.Clear();
        _voteYes.Add(player.SteamID); // Initiator votes YES

        foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
        {
            p.PrintToChat($" ");
            p.PrintToChat($" {ChatColors.Gold}>>> MAP VOTE STARTED <<<");
            p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}{player.PlayerName} {ChatColors.Default}wants to change the map!");
            p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Type {ChatColors.Yellow}!vote {ChatColors.Default}to vote YES");
            p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Type {ChatColors.Yellow}!no {ChatColors.Default}to vote NO");
            p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Grey}Vote ends in {VOTE_DURATION_SECONDS} seconds");
            p.PrintToChat($" ");
        }

        Logger.LogInformation($"[GhostTimer] Map vote started by {player.PlayerName}");
    }

    [ConsoleCommand("css_no", "Vote NO on current map vote")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnNoCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        if (!_voteActive)
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}No vote active. Use {ChatColors.Yellow}!vote {ChatColors.Default}to start one.");
            return;
        }

        if (_voteYes.Contains(player.SteamID) || _voteNo.Contains(player.SteamID))
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Yellow}You already voted!");
            return;
        }

        _voteNo.Add(player.SteamID);
        var totalPlayers = Utilities.GetPlayers().Count(p => p != null && p.IsValid && !p.IsBot);
        var noCount = _voteNo.Count;

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}Vote registered: NO");

        foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot && p != player))
        {
            p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}{player.PlayerName} {ChatColors.Default}voted NO");
        }
    }

    private void CheckVoteStatus()
    {
        // Check RTV vote
        if (_voteActive)
        {
            var elapsed = (DateTime.Now - _voteStartTime).TotalSeconds;

            // Show countdown at 10, 5, 3, 2, 1 seconds
            var remaining = VOTE_DURATION_SECONDS - (int)elapsed;
            if (remaining == 10 || remaining == 5 || (remaining <= 3 && remaining > 0))
            {
                foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
                {
                    p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Yellow}Vote ends in {remaining}s! YES: {_voteYes.Count} | NO: {_voteNo.Count}");
                }
            }

            if (elapsed >= VOTE_DURATION_SECONDS)
            {
                EndVote();
            }
        }

        // Check map vote
        if (_mapVoteActive)
        {
            var elapsed = (DateTime.Now - _mapVoteStartTime).TotalSeconds;

            var remaining = MAP_VOTE_DURATION - (int)elapsed;
            if (remaining == 15 || remaining == 10 || remaining == 5)
            {
                foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
                {
                    p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Yellow}Map vote ends in {remaining}s! Use !1, !2, !3, !4 to vote.");
                }
            }

            if (elapsed >= MAP_VOTE_DURATION)
            {
                EndMapVote();
            }
        }
    }

    private void EndVote()
    {
        _voteActive = false;
        _lastVoteTime = DateTime.Now;

        var totalPlayers = Utilities.GetPlayers().Count(p => p != null && p.IsValid && !p.IsBot);
        var yesVotes = _voteYes.Count;
        var noVotes = _voteNo.Count;
        var totalVotes = yesVotes + noVotes;

        // Need majority (more than half of active players who voted)
        var passed = totalVotes > 0 && yesVotes > noVotes && yesVotes >= Math.Ceiling(totalPlayers / 2.0);

        foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
        {
            p.PrintToChat($" ");
            if (passed)
            {
                p.PrintToChat($" {ChatColors.Gold}>>> VOTE PASSED! <<<");
                p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Map vote starting...");
                p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Results: YES {yesVotes} - NO {noVotes}");
            }
            else
            {
                p.PrintToChat($" {ChatColors.Red}>>> VOTE FAILED <<<");
                p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Not enough YES votes.");
                p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Results: YES {yesVotes} - NO {noVotes}");
            }
            p.PrintToChat($" ");
        }

        if (passed)
        {
            // Start map selection vote
            AddTimer(1.5f, () =>
            {
                StartMapVote();
            });
        }

        _voteYes.Clear();
        _voteNo.Clear();
    }

    private void StartMapVote()
    {
        if (_mapVoteActive) return;

        // Get random maps (excluding current map)
        var availableMaps = _surfMaps.Where(m => !_currentMap.Contains(m.workshopId)).ToList();
        var random = new Random();
        _mapCandidates = availableMaps.OrderBy(_ => random.Next()).Take(4).Select(m => m.workshopId).ToList();

        _mapVoteActive = true;
        _mapVoteStartTime = DateTime.Now;
        _mapVotes.Clear();
        _playerMapVotes.Clear();

        for (int i = 0; i < _mapCandidates.Count; i++)
        {
            _mapVotes[i] = 0;
        }

        foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
        {
            p.PrintToChat($" ");
            p.PrintToChat($" {ChatColors.Gold}>>> VOTE FOR NEXT MAP <<<");
            p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Type the number to vote:");

            for (int i = 0; i < _mapCandidates.Count; i++)
            {
                var mapName = _surfMaps.FirstOrDefault(m => m.workshopId == _mapCandidates[i]).name ?? _mapCandidates[i];
                p.PrintToChat($" {ChatColors.Yellow}!{i + 1} {ChatColors.Default}- {ChatColors.Green}{mapName}");
            }

            p.PrintToChat($" {ChatColors.Grey}Vote ends in {MAP_VOTE_DURATION} seconds");
            p.PrintToChat($" ");
        }

        Logger.LogInformation("[GhostTimer] Map vote started with candidates: " + string.Join(", ", _mapCandidates));
    }

    [ConsoleCommand("css_1", "Vote for map option 1")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnVote1Command(CCSPlayerController? player, CommandInfo command) => HandleMapVote(player, 0);

    [ConsoleCommand("css_2", "Vote for map option 2")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnVote2Command(CCSPlayerController? player, CommandInfo command) => HandleMapVote(player, 1);

    [ConsoleCommand("css_3", "Vote for map option 3")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnVote3Command(CCSPlayerController? player, CommandInfo command) => HandleMapVote(player, 2);

    [ConsoleCommand("css_4", "Vote for map option 4")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnVote4Command(CCSPlayerController? player, CommandInfo command) => HandleMapVote(player, 3);

    private void HandleMapVote(CCSPlayerController? player, int option)
    {
        if (player == null || !player.IsValid) return;

        if (!_mapVoteActive)
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}No map vote active.");
            return;
        }

        if (option >= _mapCandidates.Count)
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}Invalid option.");
            return;
        }

        var steamId = player.SteamID;

        // Check if already voted
        if (_playerMapVotes.TryGetValue(steamId, out var previousVote))
        {
            _mapVotes[previousVote]--;
        }

        _playerMapVotes[steamId] = option;
        _mapVotes[option]++;

        var mapName = _surfMaps.FirstOrDefault(m => m.workshopId == _mapCandidates[option]).name ?? _mapCandidates[option];
        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}Voted for {mapName}! ({_mapVotes[option]} votes)");
    }

    private void EndMapVote()
    {
        _mapVoteActive = false;

        if (_mapCandidates.Count == 0) return;

        // Find winner
        var winner = _mapVotes.OrderByDescending(kv => kv.Value).First();
        var winnerWorkshopId = _mapCandidates[winner.Key];
        var winnerName = _surfMaps.FirstOrDefault(m => m.workshopId == winnerWorkshopId).name ?? winnerWorkshopId;
        var votes = winner.Value;

        foreach (var p in Utilities.GetPlayers().Where(p => p != null && p.IsValid && !p.IsBot))
        {
            p.PrintToChat($" ");
            p.PrintToChat($" {ChatColors.Gold}>>> MAP VOTE RESULT <<<");
            p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}{winnerName} {ChatColors.Default}won with {ChatColors.Yellow}{votes} {ChatColors.Default}votes!");
            p.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Changing map in 5 seconds...");
            p.PrintToChat($" ");
        }

        Logger.LogInformation($"[GhostTimer] Map vote ended - winner: {winnerName} ({winnerWorkshopId}) with {votes} votes");

        // Change map after delay
        AddTimer(5f, () =>
        {
            Server.ExecuteCommand($"ds_workshop_changelevel {winnerWorkshopId}");
        });

        _mapCandidates.Clear();
        _mapVotes.Clear();
        _playerMapVotes.Clear();
    }

    [ConsoleCommand("css_maps", "Show available maps")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnMapsCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        player.PrintToChat($" ");
        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Available maps:");
        foreach (var map in _surfMaps)
        {
            var isCurrent = _currentMap.Contains(map.workshopId) ? $" {ChatColors.Yellow}(current)" : "";
            player.PrintToChat($" {ChatColors.Green}{map.name}{isCurrent}");
        }
        player.PrintToChat($" ");
    }

    [ConsoleCommand("css_help", "Show available commands")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnHelpCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        player.PrintToChat($" ");
        player.PrintToChat($" {ChatColors.Gold}=== Ghost Timer Commands ===");
        player.PrintToChat($" {ChatColors.Yellow}!r {ChatColors.Default}- Restart/respawn");
        player.PrintToChat($" {ChatColors.Yellow}!cp {ChatColors.Default}- Save checkpoint");
        player.PrintToChat($" {ChatColors.Yellow}!tp {ChatColors.Default}- Teleport to checkpoint");
        player.PrintToChat($" {ChatColors.Yellow}!pb {ChatColors.Default}- Show your personal best");
        player.PrintToChat($" {ChatColors.Yellow}!sr {ChatColors.Default}- Show server record");
        player.PrintToChat($" {ChatColors.Yellow}!timer {ChatColors.Default}- Toggle HUD display");
        player.PrintToChat($" {ChatColors.Yellow}!hide {ChatColors.Default}- Hide other players");
        player.PrintToChat($" {ChatColors.Yellow}!maps {ChatColors.Default}- Show available maps");
        player.PrintToChat($" {ChatColors.Yellow}!vote {ChatColors.Default}- Vote for map change");
        player.PrintToChat($" ");
    }

    #endregion
}

public class PlayerTimerData
{
    public string PlayerName { get; set; } = "";
    public bool IsRunning { get; set; } = false;
    public bool InStartZone { get; set; } = false;
    public int StartTick { get; set; } = 0;
    public double CurrentTime { get; set; } = 0;
    public double LastTime { get; set; } = 0;
    public double BestTime { get; set; } = 0;

    public bool HasCheckpoint { get; set; } = false;
    public Vector? CheckpointPos { get; set; }
    public QAngle? CheckpointAngle { get; set; }

    public bool HideHud { get; set; } = false;
    public bool HidePlayers { get; set; } = false;

    public string LastHudContent { get; set; } = "";

    public void Reset()
    {
        IsRunning = false;
        InStartZone = false;
        StartTick = 0;
        CurrentTime = 0;
    }
}

public class TimesResponse
{
    public TimeEntry[]? times { get; set; }
}

public class TimeEntry
{
    public string? steamId { get; set; }
    public string? playerName { get; set; }
    public string? map { get; set; }
    public double time { get; set; }
}
