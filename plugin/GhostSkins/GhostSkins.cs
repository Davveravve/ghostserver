using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Attributes.Registration;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.Utils;
using CounterStrikeSharp.API.Modules.Memory.DynamicFunctions;
using CounterStrikeSharp.API.Modules.Entities;
using Microsoft.Extensions.Logging;
using MySqlConnector;
using System.Collections.Concurrent;

namespace GhostSkins;

public static class SkinFunctions
{
    private static MemoryFunctionVoid<nint, string, float>? _setOrAddFunc;
    private static bool _initialized = false;
    private static int _callCount = 0;

    public static void Initialize()
    {
        if (_initialized) return;
        try
        {
            _setOrAddFunc = new MemoryFunctionVoid<nint, string, float>(
                GameData.GetSignature("CAttributeList_SetOrAddAttributeValueByName"));
            _initialized = true;
        }
        catch (Exception ex)
        {
            _setOrAddFunc = null;
            _initialized = false;
            Console.WriteLine($"[Ghost] Signature init failed: {ex.Message}");
        }
    }

    public static bool IsReady => _initialized && _setOrAddFunc != null;

    public static bool SetAttribute(this CAttributeList list, string name, float value)
    {
        if (_setOrAddFunc == null) return false;
        try
        {
            _setOrAddFunc.Invoke(list.Handle, name, value);
            _callCount++;
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Ghost] SetAttribute FAILED: {name}={value} - {ex.Message}");
            return false;
        }
    }

    public static int CallCount => _callCount;
}

public class GhostSkins : BasePlugin, IPluginConfig<GhostSkinsConfig>
{
    public override string ModuleName => "Ghost Skins";
    public override string ModuleVersion => "10.1.0";
    public override string ModuleAuthor => "GhostServers.site";
    public override string ModuleDescription => "Weapon skins - ghostservers.site";

    public GhostSkinsConfig Config { get; set; } = new();
    private string _connStr = "";

    private readonly ConcurrentDictionary<ulong, PlayerSkinData> _cache = new();
    private readonly HashSet<uint> _processedWeapons = new();
    private ulong _itemId = 68000;

    private static readonly Dictionary<string, ushort> Knives = new()
    {
        { "weapon_knife_bayonet", 500 },
        { "weapon_knife_css", 503 },
        { "weapon_knife_flip", 505 },
        { "weapon_knife_gut", 506 },
        { "weapon_knife_karambit", 507 },
        { "weapon_knife_m9_bayonet", 508 },
        { "weapon_knife_tactical", 509 },
        { "weapon_knife_falchion", 512 },
        { "weapon_knife_survival_bowie", 514 },
        { "weapon_knife_butterfly", 515 },
        { "weapon_knife_push", 516 },
        { "weapon_knife_cord", 517 },
        { "weapon_knife_canis", 518 },
        { "weapon_knife_ursus", 519 },
        { "weapon_knife_gypsy_jackknife", 520 },
        { "weapon_knife_outdoor", 521 },
        { "weapon_knife_stiletto", 522 },
        { "weapon_knife_widowmaker", 523 },
        { "weapon_knife_skeleton", 525 },
        { "weapon_knife_kukri", 526 },
    };

    public void OnConfigParsed(GhostSkinsConfig config)
    {
        Config = config;
        _connStr = new MySqlConnectionStringBuilder
        {
            Server = Config.Database.Host,
            Port = (uint)Config.Database.Port,
            Database = Config.Database.Name,
            UserID = Config.Database.User,
            Password = Config.Database.Password,
            Pooling = true,
            MinimumPoolSize = 1,
            MaximumPoolSize = 10,
            ConnectionTimeout = 10
        }.ConnectionString;
    }

    public override void Load(bool hotReload)
    {
        Logger.LogInformation("[Ghost] Loading Ghost Skins v10.1.0...");

        SkinFunctions.Initialize();
        if (SkinFunctions.IsReady)
            Logger.LogInformation("[Ghost] GameData signature loaded!");
        else
            Logger.LogWarning("[Ghost] GameData failed - using fallback only!");

        // Hook player events
        RegisterEventHandler<EventPlayerConnectFull>(OnConnect);
        RegisterEventHandler<EventPlayerDisconnect>(OnDisconnect);
        RegisterEventHandler<EventPlayerSpawn>(OnPlayerSpawn);

        // Hook entity creation - this is how WeaponPaints works
        RegisterListener<Listeners.OnEntityCreated>(OnEntityCreated);

        if (hotReload)
        {
            foreach (var p in Utilities.GetPlayers().Where(x => x.IsValid && !x.IsBot))
                _ = LoadSkinsAsync(p.SteamID);
        }

        Logger.LogInformation("[Ghost] Plugin loaded!");
    }

    public override void Unload(bool hotReload)
    {
        _cache.Clear();
        _processedWeapons.Clear();
    }

    private HookResult OnConnect(EventPlayerConnectFull @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;
        _ = LoadSkinsAsync(player.SteamID);
        return HookResult.Continue;
    }

    private HookResult OnDisconnect(EventPlayerDisconnect @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || player.IsBot) return HookResult.Continue;
        _cache.TryRemove(player.SteamID, out _);
        return HookResult.Continue;
    }

    private HookResult OnPlayerSpawn(EventPlayerSpawn @event, GameEventInfo info)
    {
        var player = @event.Userid;
        if (player == null || !player.IsValid || player.IsBot) return HookResult.Continue;

        // Clear processed weapons for this spawn cycle
        _processedWeapons.Clear();

        // Apply skins on next frame to ensure weapons exist
        Server.NextFrame(() =>
        {
            if (player == null || !player.IsValid) return;
            RefreshPlayerWeapons(player);
        });

        return HookResult.Continue;
    }

    private void RefreshPlayerWeapons(CCSPlayerController player)
    {
        if (!_cache.TryGetValue(player.SteamID, out var data)) return;

        var pawn = player.PlayerPawn.Value;
        if (pawn == null || !pawn.IsValid) return;

        var weapons = pawn.WeaponServices?.MyWeapons;
        if (weapons == null) return;

        foreach (var weaponRef in weapons)
        {
            var weapon = weaponRef.Value;
            if (weapon == null || !weapon.IsValid) continue;

            ApplySkin(weapon, player, data);
        }
    }

    // Hook entity creation - when weapons spawn
    private void OnEntityCreated(CEntityInstance entity)
    {
        if (entity == null || !entity.IsValid) return;

        var designerName = entity.DesignerName;
        if (string.IsNullOrEmpty(designerName)) return;

        // Only process weapons
        if (!designerName.Contains("weapon")) return;

        // Use NextWorldUpdate for proper timing
        Server.NextWorldUpdate(() =>
        {
            try
            {
                if (entity == null || !entity.IsValid) return;

                // Create weapon from entity handle directly
                var weapon = new CBasePlayerWeapon(entity.Handle);
                if (weapon == null || !weapon.IsValid) return;

                // Get owner via OriginalOwnerXuidLow
                var xuidLow = weapon.OriginalOwnerXuidLow;
                CCSPlayerController? controller = null;

                if (xuidLow > 0)
                {
                    controller = Utilities.GetPlayerFromSteamId(xuidLow);
                }

                // Fallback to OwnerEntity
                if (controller == null)
                {
                    var owner = weapon.OwnerEntity.Value;
                    if (owner == null) return;

                    var pawn = owner as CCSPlayerPawn;
                    if (pawn == null || !pawn.IsValid) return;

                    controller = pawn.Controller.Value as CCSPlayerController;
                }

                if (controller == null || !controller.IsValid || controller.IsBot) return;

                // Check if we have skins for this player
                if (!_cache.TryGetValue(controller.SteamID, out var data)) return;

                // Apply the skin
                ApplySkin(weapon, controller, data);
            }
            catch (Exception ex)
            {
                Logger.LogWarning($"[Ghost] Entity error: {ex.Message}");
            }
        });
    }

    private void ApplySkin(CBasePlayerWeapon weapon, CCSPlayerController player, PlayerSkinData data)
    {
        var designerName = weapon.DesignerName;
        if (string.IsNullOrEmpty(designerName)) return;

        var isT = player.TeamNum == (int)CsTeam.Terrorist;
        var teamSkins = isT ? data.TSkins : data.CTSkins;
        var knifeStr = isT ? data.TKnife : data.CTKnife;

        // KNIFE
        if (designerName.Contains("knife") || designerName.Contains("bayonet"))
        {
            if (!string.IsNullOrEmpty(knifeStr) && Knives.TryGetValue(knifeStr, out var knifeIdx))
            {
                ChangeKnife(weapon, player, knifeIdx, teamSkins);
            }
            return;
        }

        // REGULAR WEAPON
        var defIndex = weapon.AttributeManager.Item.ItemDefinitionIndex;
        if (teamSkins.TryGetValue(defIndex, out var skin))
        {
            ApplyWeaponSkin(weapon, player, skin);
        }
    }

    private void ChangeKnife(CBasePlayerWeapon weapon, CCSPlayerController player, ushort knifeIdx, Dictionary<int, SkinInfo> skins)
    {
        var item = weapon.AttributeManager.Item;

        // Clear attributes first
        item.AttributeList.Attributes.RemoveAll();
        item.NetworkedDynamicAttributes.Attributes.RemoveAll();

        // Change the knife type
        item.ItemDefinitionIndex = knifeIdx;
        item.EntityQuality = 3;

        // Set unique item ID
        var id = _itemId++;
        item.ItemID = id;
        item.ItemIDLow = (uint)(id & 0xFFFFFFFF);
        item.ItemIDHigh = (uint)(id >> 32);
        item.AccountID = (uint)player.SteamID;

        // Apply skin if we have one for this knife
        if (skins.TryGetValue(knifeIdx, out var skin))
        {
            weapon.FallbackPaintKit = skin.PaintKit;
            weapon.FallbackSeed = skin.Seed;
            weapon.FallbackWear = skin.Wear;
            weapon.FallbackStatTrak = -1;

            if (SkinFunctions.IsReady)
            {
                var before = SkinFunctions.CallCount;
                // Apply to both attribute lists
                item.NetworkedDynamicAttributes.SetAttribute("set item texture prefab", skin.PaintKit);
                item.NetworkedDynamicAttributes.SetAttribute("set item texture seed", skin.Seed);
                item.NetworkedDynamicAttributes.SetAttribute("set item texture wear", skin.Wear);
                item.AttributeList.SetAttribute("set item texture prefab", skin.PaintKit);
                item.AttributeList.SetAttribute("set item texture seed", skin.Seed);
                item.AttributeList.SetAttribute("set item texture wear", skin.Wear);
                var after = SkinFunctions.CallCount;
                Logger.LogInformation($"[Ghost] Knife signature calls: {after - before}/6");
            }

            Logger.LogInformation($"[Ghost] Knife: {player.PlayerName} -> {knifeIdx} paint={skin.PaintKit} seed={skin.Seed}");
        }
        else
        {
            Logger.LogInformation($"[Ghost] Knife: {player.PlayerName} -> {knifeIdx} (no skin)");
        }

        // Change subclass to update model
        weapon.AcceptInput("ChangeSubclass", value: knifeIdx.ToString());
    }

    private void ApplyWeaponSkin(CBasePlayerWeapon weapon, CCSPlayerController player, SkinInfo skin)
    {
        var item = weapon.AttributeManager.Item;

        // Clear attributes
        item.NetworkedDynamicAttributes.Attributes.RemoveAll();
        item.AttributeList.Attributes.RemoveAll();

        // Set unique item ID
        var id = _itemId++;
        item.ItemID = id;
        item.ItemIDLow = (uint)(id & 0xFFFFFFFF);
        item.ItemIDHigh = (uint)(id >> 32);
        item.AccountID = (uint)player.SteamID;

        // Fallback values
        weapon.FallbackPaintKit = skin.PaintKit;
        weapon.FallbackSeed = skin.Seed;
        weapon.FallbackWear = skin.Wear;
        weapon.FallbackStatTrak = -1;

        // Apply via GameData signature to BOTH attribute lists
        if (SkinFunctions.IsReady)
        {
            var before = SkinFunctions.CallCount;

            // NetworkedDynamicAttributes (primary)
            item.NetworkedDynamicAttributes.SetAttribute("set item texture prefab", skin.PaintKit);
            item.NetworkedDynamicAttributes.SetAttribute("set item texture seed", skin.Seed);
            item.NetworkedDynamicAttributes.SetAttribute("set item texture wear", skin.Wear);

            // AttributeList (secondary - for patterns)
            item.AttributeList.SetAttribute("set item texture prefab", skin.PaintKit);
            item.AttributeList.SetAttribute("set item texture seed", skin.Seed);
            item.AttributeList.SetAttribute("set item texture wear", skin.Wear);

            var after = SkinFunctions.CallCount;
            Logger.LogInformation($"[Ghost] Signature calls: {after - before}/6 succeeded");
        }
        else
        {
            Logger.LogWarning($"[Ghost] SIGNATURE NOT READY - fallback only!");
        }

        Logger.LogInformation($"[Ghost] Skin: {player.PlayerName} -> {weapon.DesignerName} paint={skin.PaintKit} seed={skin.Seed}");
    }

    private async Task LoadSkinsAsync(ulong steamId)
    {
        try
        {
            var data = new PlayerSkinData();
            await using var conn = new MySqlConnection(_connStr);
            await conn.OpenAsync();

            // Load skins
            await using (var cmd = new MySqlCommand(
                "SELECT weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed, weapon_team FROM wp_player_skins WHERE steamid = @sid", conn))
            {
                cmd.Parameters.AddWithValue("@sid", steamId.ToString());
                await using var r = await cmd.ExecuteReaderAsync();
                while (await r.ReadAsync())
                {
                    var s = new SkinInfo
                    {
                        DefIndex = r.GetInt32("weapon_defindex"),
                        PaintKit = r.GetInt32("weapon_paint_id"),
                        Wear = r.GetFloat("weapon_wear"),
                        Seed = r.GetInt32("weapon_seed")
                    };
                    var team = r.GetInt32("weapon_team");
                    if (team == 2) data.TSkins[s.DefIndex] = s;
                    else if (team == 3) data.CTSkins[s.DefIndex] = s;
                }
            }

            // Load knife
            await using (var cmd = new MySqlCommand(
                "SELECT knife, weapon_team FROM wp_player_knife WHERE steamid = @sid", conn))
            {
                cmd.Parameters.AddWithValue("@sid", steamId.ToString());
                await using var r = await cmd.ExecuteReaderAsync();
                while (await r.ReadAsync())
                {
                    var knife = r.GetString("knife");
                    var team = r.GetInt32("weapon_team");
                    if (team == 2) data.TKnife = knife;
                    else if (team == 3) data.CTKnife = knife;
                }
            }

            _cache[steamId] = data;
            Logger.LogInformation($"[Ghost] Loaded {data.TSkins.Count + data.CTSkins.Count} skins for {steamId}");
        }
        catch (Exception ex)
        {
            Logger.LogError($"[Ghost] DB error for {steamId}: {ex.Message}");
        }
    }

    [ConsoleCommand("css_ws", "Refresh skins")]
    [ConsoleCommand("css_skins", "Refresh skins")]
    [CommandHelper(minArgs: 0, usage: "", whoCanExecute: CommandUsage.CLIENT_ONLY)]
    public void CmdRefresh(CCSPlayerController? player, CommandInfo cmd)
    {
        if (player == null || !player.IsValid) return;
        player.PrintToChat($" {ChatColors.Purple}[Ghost]{ChatColors.Default} Refreshing skins...");

        var sid = player.SteamID;
        Task.Run(async () =>
        {
            await LoadSkinsAsync(sid);
            Server.NextFrame(() =>
            {
                var p = Utilities.GetPlayerFromSteamId(sid);
                if (p != null && p.IsValid)
                    p.PrintToChat($" {ChatColors.Purple}[Ghost]{ChatColors.Green} Skins loaded! Respawn to apply.");
            });
        });
    }
}

public class GhostSkinsConfig : BasePluginConfig
{
    public DatabaseConfig Database { get; set; } = new();
}

public class DatabaseConfig
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 3306;
    public string Name { get; set; } = "ghost_gaming";
    public string User { get; set; } = "ghost";
    public string Password { get; set; } = "";
}

public class PlayerSkinData
{
    public Dictionary<int, SkinInfo> TSkins { get; } = new();
    public Dictionary<int, SkinInfo> CTSkins { get; } = new();
    public string? TKnife { get; set; }
    public string? CTKnife { get; set; }
}

public class SkinInfo
{
    public int DefIndex { get; set; }
    public int PaintKit { get; set; }
    public float Wear { get; set; }
    public int Seed { get; set; }
}
