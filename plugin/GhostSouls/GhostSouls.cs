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

    private readonly HttpClient _httpClient = new();
    private readonly Dictionary<ulong, PlayerData> _playerCache = new();
    private readonly Dictionary<ulong, DateTime> _lastKillTime = new();

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

        Logger.LogInformation("[GhostSouls] Plugin loaded successfully!");
    }

    public void OnConfigParsed(GhostConfig config)
    {
        Config = config;
        _httpClient.BaseAddress = new Uri(config.ApiUrl);
        _httpClient.DefaultRequestHeaders.Add("X-API-Key", config.ApiKey);
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

        // Apply Ghost inventory skins after a short delay (to ensure weapons exist)
        AddTimer(0.1f, () => ApplyPlayerSkins(player, steamId));

        return HookResult.Continue;
    }

    private HookResult OnPlayerDeath(EventPlayerDeath @event, GameEventInfo info)
    {
        var attacker = @event.Attacker;
        var victim = @event.Userid;

        if (attacker == null || !attacker.IsValid || attacker.IsBot) return HookResult.Continue;
        if (victim == null || !victim.IsValid) return HookResult.Continue;

        // No souls for suicide/team kill
        if (attacker == victim) return HookResult.Continue;
        if (attacker.Team == victim.Team) return HookResult.Continue;

        var steamId = attacker.SteamID;

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
            bonusText = " (Headshot!)";
        }

        // Knife kill bonus
        if (@event.Weapon == "knife" || @event.Weapon.Contains("bayonet"))
        {
            baseSouls += Config.Souls.KnifeKillBonus;
            bonusText = " (Knife kill!)";
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
            data.IsDirty = true;

            attacker.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Green}+{soulsEarned} {ChatColors.Default}souls{bonusText}{multiplierText}");
        }

        return HookResult.Continue;
    }

    private HookResult OnRoundStart(EventRoundStart @event, GameEventInfo info)
    {
        // Could show sponsor message at round start
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
            return data.PremiumTier switch
            {
                "gold" => "gold",
                "silver" => "silver",
                "bronze" => "bronze",
                _ => "default"
            };
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

    #region Skin System

    private void ApplyPlayerSkins(CCSPlayerController player, ulong steamId)
    {
        if (!player.IsValid || player.PlayerPawn?.Value == null) return;

        if (!_playerCache.TryGetValue(steamId, out var data)) return;

        var pawn = player.PlayerPawn.Value;
        if (pawn.WeaponServices?.MyWeapons == null) return;

        foreach (var weaponHandle in pawn.WeaponServices.MyWeapons)
        {
            var weapon = weaponHandle.Value;
            if (weapon == null || !weapon.IsValid) continue;

            var weaponName = weapon.DesignerName;

            // Find equipped skin for this weapon
            var equippedSkin = data.EquippedSkins.FirstOrDefault(s =>
                s.WeaponDefIndex == weapon.AttributeManager.Item.ItemDefinitionIndex ||
                IsMatchingWeapon(weaponName, s.WeaponName));

            if (equippedSkin != null)
            {
                ApplySkin(weapon, equippedSkin);
            }
            else
            {
                // Force default skin (remove Steam inventory skin)
                ForceDefaultSkin(weapon);
            }
        }
    }

    private void ApplySkin(CBasePlayerWeapon weapon, EquippedSkin skin)
    {
        try
        {
            weapon.AttributeManager.Item.ItemID = 16384;
            weapon.AttributeManager.Item.ItemIDLow = 16384;
            weapon.AttributeManager.Item.ItemIDHigh = 0;
            weapon.FallbackPaintKit = skin.PaintKit;
            weapon.FallbackSeed = skin.Seed;
            weapon.FallbackWear = skin.Wear;

            // Update on client
            Utilities.SetStateChanged(weapon, "CBaseEntity", "m_nFallbackPaintKit");
            Utilities.SetStateChanged(weapon, "CBaseEntity", "m_nFallbackSeed");
            Utilities.SetStateChanged(weapon, "CBaseEntity", "m_flFallbackWear");
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

    private bool IsMatchingWeapon(string designerName, string skinWeaponName)
    {
        // Map designer names to readable names
        var mapping = new Dictionary<string, string[]>
        {
            { "weapon_ak47", new[] { "AK-47" } },
            { "weapon_m4a1", new[] { "M4A4" } },
            { "weapon_m4a1_silencer", new[] { "M4A1-S" } },
            { "weapon_awp", new[] { "AWP" } },
            { "weapon_deagle", new[] { "Desert Eagle" } },
            { "weapon_usp_silencer", new[] { "USP-S" } },
            { "weapon_glock", new[] { "Glock-18" } },
            // Add more as needed
        };

        if (mapping.TryGetValue(designerName, out var names))
        {
            return names.Any(n => n.Equals(skinWeaponName, StringComparison.OrdinalIgnoreCase));
        }

        return false;
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

    #endregion

    #region Commands

    [ConsoleCommand("css_souls", "Check your souls balance")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnSoulsCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        var steamId = player.SteamID;
        if (_playerCache.TryGetValue(steamId, out var data))
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}You have {ChatColors.Green}{data.Souls:N0} {ChatColors.Default}souls.");
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Total earned: {ChatColors.Yellow}{data.TotalEarned:N0} {ChatColors.Default}souls.");
        }
        else
        {
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Red}Could not load your data. Try reconnecting.");
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

    [ConsoleCommand("css_discord", "Show Discord invite link")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void OnDiscordCommand(CCSPlayerController? player, CommandInfo command)
    {
        if (player == null || !player.IsValid) return;

        player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Default}Join our Discord: {ChatColors.Blue}discord.gg/ghostservers");
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
            player.PrintToChat($" {ChatColors.Purple}[Ghost] {ChatColors.Yellow}Get premium at {Config.WebsiteUrl}/premium for bonus souls!");
        }
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
        player.PrintToChat($" {ChatColors.Yellow}!souls {ChatColors.Default}- Check balance | {ChatColors.Yellow}!rank {ChatColors.Default}- Your rank");
        player.PrintToChat($" {ChatColors.Yellow}!inventory {ChatColors.Default}- View skins | {ChatColors.Yellow}!cases {ChatColors.Default}- Open cases");
        player.PrintToChat($" {ChatColors.Yellow}!top {ChatColors.Default}- Leaderboard | {ChatColors.Yellow}!refresh {ChatColors.Default}- Sync data");
        player.PrintToChat($" {ChatColors.Yellow}!server {ChatColors.Default}- Server list | {ChatColors.Yellow}!discord {ChatColors.Default}- Discord");
        player.PrintToChat($" ");
        player.PrintToChat($" {ChatColors.Default}Your multiplier: {ChatColors.Gold}{settings.SoulsMultiplier:0.#}x souls");
        player.PrintToChat($" {ChatColors.Gold}Get premium for up to 3x souls!");
        player.PrintToChat($" {ChatColors.Purple}===================================");
    }

    #endregion

    #region API Communication

    private async Task<PlayerData?> FetchPlayerData(ulong steamId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/api/plugin/player/{steamId}");

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
                EquippedSkins = apiResponse.EquippedSkins ?? new List<EquippedSkin>()
            };
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostSouls] API fetch error: {ex.Message}");
            throw;
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

            var response = await _httpClient.PostAsync("/api/plugin/player/register", content);
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
        if (!data.IsDirty) return;

        try
        {
            var content = new StringContent(
                JsonSerializer.Serialize(new
                {
                    steamId = data.SteamId.ToString(),
                    souls = data.Souls,
                    soulsEarned = data.TotalEarned
                }),
                System.Text.Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync("/api/plugin/player/sync", content);
            response.EnsureSuccessStatusCode();

            data.IsDirty = false;
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
