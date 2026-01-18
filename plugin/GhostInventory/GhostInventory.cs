using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using CounterStrikeSharp.API;
using CounterStrikeSharp.API.Core;
using CounterStrikeSharp.API.Core.Attributes.Registration;
using CounterStrikeSharp.API.Modules.Commands;
using CounterStrikeSharp.API.Modules.Menu;
using CounterStrikeSharp.API.Modules.Utils;
using Microsoft.Extensions.Logging;
using MySqlConnector;

// Use the old-school CS menu style (press 1-9)

namespace GhostInventory;

public class GhostInventory : BasePlugin
{
    public override string ModuleName => "Ghost Inventory";
    public override string ModuleVersion => "1.0.0";
    public override string ModuleAuthor => "Ghost Gaming";
    public override string ModuleDescription => "In-game skin selection from player inventory";

    private GhostInventoryConfig? _config;
    private string? _connectionString;

    // Category definitions
    private static readonly Dictionary<string, string[]> WeaponCategories = new()
    {
        ["Knives"] = new[] { "Karambit", "M9 Bayonet", "Bayonet", "Butterfly Knife", "Flip Knife", "Gut Knife",
                            "Huntsman Knife", "Falchion Knife", "Bowie Knife", "Shadow Daggers", "Navaja Knife",
                            "Stiletto Knife", "Talon Knife", "Ursus Knife", "Classic Knife", "Paracord Knife",
                            "Survival Knife", "Nomad Knife", "Skeleton Knife", "Kukri Knife" },
        ["Gloves"] = new[] { "Sport Gloves", "Driver Gloves", "Moto Gloves", "Hand Wraps",
                            "Specialist Gloves", "Bloodhound Gloves", "Hydra Gloves", "Broken Fang Gloves" },
        ["Pistols"] = new[] { "Desert Eagle", "USP-S", "Glock-18", "P250", "P2000", "Five-SeveN", "Tec-9",
                              "CZ75-Auto", "Dual Berettas", "R8 Revolver" },
        ["SMGs"] = new[] { "MAC-10", "MP9", "MP7", "UMP-45", "P90", "PP-Bizon", "MP5-SD" },
        ["Rifles"] = new[] { "AK-47", "M4A4", "M4A1-S", "FAMAS", "Galil AR", "AUG", "SG 553" },
        ["Snipers"] = new[] { "AWP", "SSG 08", "SCAR-20", "G3SG1" },
        ["Shotguns"] = new[] { "Nova", "XM1014", "MAG-7", "Sawed-Off" },
        ["MGs"] = new[] { "M249", "Negev" }
    };

    // Weapon def index mapping
    private static readonly Dictionary<string, int> WeaponDefIndex = new()
    {
        // Pistols
        ["Desert Eagle"] = 1, ["Dual Berettas"] = 2, ["Five-SeveN"] = 3, ["Glock-18"] = 4,
        ["P2000"] = 32, ["USP-S"] = 61, ["CZ75-Auto"] = 63, ["R8 Revolver"] = 64,
        ["P250"] = 36, ["Tec-9"] = 30,
        // SMGs
        ["MAC-10"] = 17, ["MP5-SD"] = 23, ["MP7"] = 33, ["MP9"] = 34,
        ["P90"] = 19, ["PP-Bizon"] = 26, ["UMP-45"] = 24,
        // Rifles
        ["AK-47"] = 7, ["AUG"] = 8, ["FAMAS"] = 10, ["Galil AR"] = 13,
        ["M4A4"] = 16, ["M4A1-S"] = 60, ["SG 553"] = 39,
        // Snipers
        ["AWP"] = 9, ["G3SG1"] = 11, ["SCAR-20"] = 38, ["SSG 08"] = 40,
        // Heavies
        ["M249"] = 14, ["MAG-7"] = 27, ["Negev"] = 28, ["Nova"] = 35,
        ["Sawed-Off"] = 29, ["XM1014"] = 25,
        // Knives
        ["Bayonet"] = 500, ["Bowie Knife"] = 514, ["Butterfly Knife"] = 515,
        ["Classic Knife"] = 503, ["Falchion Knife"] = 512, ["Flip Knife"] = 505,
        ["Gut Knife"] = 506, ["Huntsman Knife"] = 509, ["Karambit"] = 507,
        ["M9 Bayonet"] = 508, ["Navaja Knife"] = 520, ["Nomad Knife"] = 521,
        ["Paracord Knife"] = 517, ["Shadow Daggers"] = 516, ["Skeleton Knife"] = 525,
        ["Stiletto Knife"] = 522, ["Survival Knife"] = 518, ["Talon Knife"] = 523,
        ["Ursus Knife"] = 519, ["Kukri Knife"] = 526
    };

    // Knife weapon names for wp_player_knife table
    private static readonly Dictionary<string, string> KnifeWeaponNames = new()
    {
        ["Karambit"] = "weapon_knife_karambit",
        ["M9 Bayonet"] = "weapon_knife_m9_bayonet",
        ["Bayonet"] = "weapon_knife_bayonet",
        ["Butterfly Knife"] = "weapon_knife_butterfly",
        ["Flip Knife"] = "weapon_knife_flip",
        ["Gut Knife"] = "weapon_knife_gut",
        ["Huntsman Knife"] = "weapon_knife_tactical",
        ["Falchion Knife"] = "weapon_knife_falchion",
        ["Bowie Knife"] = "weapon_knife_survival_bowie",
        ["Shadow Daggers"] = "weapon_knife_push",
        ["Navaja Knife"] = "weapon_knife_gypsy_jackknife",
        ["Stiletto Knife"] = "weapon_knife_stiletto",
        ["Talon Knife"] = "weapon_knife_widowmaker",
        ["Ursus Knife"] = "weapon_knife_ursus",
        ["Classic Knife"] = "weapon_knife_css",
        ["Paracord Knife"] = "weapon_knife_cord",
        ["Survival Knife"] = "weapon_knife_canis",
        ["Nomad Knife"] = "weapon_knife_outdoor",
        ["Skeleton Knife"] = "weapon_knife_skeleton",
        ["Kukri Knife"] = "weapon_knife_kukri"
    };

    // Glove def index mapping
    private static readonly Dictionary<string, int> GloveDefIndex = new()
    {
        ["Bloodhound Gloves"] = 5027,
        ["Sport Gloves"] = 5030,
        ["Driver Gloves"] = 5031,
        ["Hand Wraps"] = 5032,
        ["Moto Gloves"] = 5033,
        ["Specialist Gloves"] = 5034,
        ["Hydra Gloves"] = 5035,
        ["Broken Fang Gloves"] = 5036
    };

    public override void Load(bool hotReload)
    {
        LoadConfig();

        if (_config == null)
        {
            Logger.LogError("Failed to load config!");
            return;
        }

        _connectionString = $"Server={_config.DatabaseHost};Port={_config.DatabasePort};Database={_config.DatabaseName};User={_config.DatabaseUser};Password={_config.DatabasePassword};";

        Logger.LogInformation($"[GhostInventory] Loaded! Commands: !inv, !inventory, !myskins");
    }

    private void LoadConfig()
    {
        var configPath = Path.Combine(ModuleDirectory, "GhostInventory.json");

        if (!File.Exists(configPath))
        {
            _config = new GhostInventoryConfig();
            File.WriteAllText(configPath, JsonSerializer.Serialize(_config, new JsonSerializerOptions { WriteIndented = true }));
            Logger.LogInformation($"[GhostInventory] Created default config at {configPath}");
        }
        else
        {
            var json = File.ReadAllText(configPath);
            _config = JsonSerializer.Deserialize<GhostInventoryConfig>(json);
        }
    }

    [ConsoleCommand("css_inv", "Open inventory skin selection")]
    [ConsoleCommand("css_inventory", "Open inventory skin selection")]
    [ConsoleCommand("css_myskins", "Open inventory skin selection")]
    public void OnInventoryCommand(CCSPlayerController? player, CommandInfo info)
    {
        if (player == null || !player.IsValid) return;

        ShowCategoryMenu(player);
    }

    private void ShowCategoryMenu(CCSPlayerController player)
    {
        var menu = new CenterHtmlMenu("Ghost Inventory", this);

        foreach (var category in WeaponCategories.Keys)
        {
            menu.AddMenuOption(category, (p, option) => OnCategorySelected(p, category));
        }

        MenuManager.OpenCenterHtmlMenu(this, player, menu);
    }

    private void OnCategorySelected(CCSPlayerController player, string category)
    {
        var steamId = GetSteamId64(player);
        if (string.IsNullOrEmpty(steamId)) return;

        // Get player's inventory items for this category
        var weapons = WeaponCategories[category];
        var ownedWeapons = GetOwnedWeaponsInCategory(steamId, weapons, category);

        if (ownedWeapons.Count == 0)
        {
            player.PrintToChat($" \x02[Ghost]\x01 You don't own any {category.ToLower()} skins!");
            return;
        }

        var menu = new CenterHtmlMenu(category, this);

        foreach (var weapon in ownedWeapons)
        {
            menu.AddMenuOption($"{weapon.Key} ({weapon.Value})", (p, option) =>
                OnWeaponSelected(p, weapon.Key, category));
        }

        menu.AddMenuOption("← Back", (p, option) => ShowCategoryMenu(p));
        MenuManager.OpenCenterHtmlMenu(this, player, menu);
    }

    private void OnWeaponSelected(CCSPlayerController player, string weapon, string category)
    {
        var steamId = GetSteamId64(player);
        if (string.IsNullOrEmpty(steamId)) return;

        var skins = GetOwnedSkinsForWeapon(steamId, weapon);

        if (skins.Count == 0)
        {
            player.PrintToChat($" \x02[Ghost]\x01 You don't own any {weapon} skins!");
            return;
        }

        var menu = new CenterHtmlMenu(weapon, this);

        foreach (var skin in skins)
        {
            var wearText = GetWearText(skin.FloatValue);
            menu.AddMenuOption($"{skin.SkinName} ({wearText})", (p, option) =>
                OnSkinSelected(p, weapon, skin, category));
        }

        menu.AddMenuOption("← Back", (p, option) => OnCategorySelected(p, category));
        MenuManager.OpenCenterHtmlMenu(this, player, menu);
    }

    private void OnSkinSelected(CCSPlayerController player, string weapon, InventorySkin skin, string category)
    {
        var steamId = GetSteamId64(player);
        if (string.IsNullOrEmpty(steamId)) return;

        // Show team selection menu
        var menu = new CenterHtmlMenu($"Equip {skin.SkinName}", this);

        menu.AddMenuOption("Both Teams", (p, option) => EquipSkin(p, steamId, weapon, skin, "both", category));
        menu.AddMenuOption("CT Only", (p, option) => EquipSkin(p, steamId, weapon, skin, "ct", category));
        menu.AddMenuOption("T Only", (p, option) => EquipSkin(p, steamId, weapon, skin, "t", category));
        menu.AddMenuOption("← Back", (p, option) => OnWeaponSelected(p, weapon, category));

        MenuManager.OpenCenterHtmlMenu(this, player, menu);
    }

    private void EquipSkin(CCSPlayerController player, string steamId, string weapon, InventorySkin skin, string team, string category)
    {
        try
        {
            var paintKit = skin.PaintKit;
            var isKnife = category == "Knives";
            var isGloves = category == "Gloves";

            // Teams: 2 = T, 3 = CT
            var teams = new List<int>();
            if (team == "ct" || team == "both") teams.Add(3);
            if (team == "t" || team == "both") teams.Add(2);

            using var connection = new MySqlConnection(_connectionString);
            connection.Open();

            if (isKnife)
            {
                var knifeWeaponName = KnifeWeaponNames.GetValueOrDefault(weapon, "weapon_knife");
                var knifeDefIdx = WeaponDefIndex.GetValueOrDefault(weapon, 500);

                foreach (var weaponTeam in teams)
                {
                    // Update wp_player_knife
                    using var knifeCmd = new MySqlCommand(@"
                        INSERT INTO wp_player_knife (steamid, weapon_team, knife)
                        VALUES (@steamid, @team, @knife)
                        ON DUPLICATE KEY UPDATE knife = @knife", connection);
                    knifeCmd.Parameters.AddWithValue("@steamid", steamId);
                    knifeCmd.Parameters.AddWithValue("@team", weaponTeam);
                    knifeCmd.Parameters.AddWithValue("@knife", knifeWeaponName);
                    knifeCmd.ExecuteNonQuery();

                    // Update wp_player_skins with knife paint
                    using var skinCmd = new MySqlCommand(@"
                        INSERT INTO wp_player_skins (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed)
                        VALUES (@steamid, @team, @defindex, @paintid, @wear, 0)
                        ON DUPLICATE KEY UPDATE weapon_paint_id = @paintid, weapon_wear = @wear", connection);
                    skinCmd.Parameters.AddWithValue("@steamid", steamId);
                    skinCmd.Parameters.AddWithValue("@team", weaponTeam);
                    skinCmd.Parameters.AddWithValue("@defindex", knifeDefIdx);
                    skinCmd.Parameters.AddWithValue("@paintid", paintKit);
                    skinCmd.Parameters.AddWithValue("@wear", skin.FloatValue);
                    skinCmd.ExecuteNonQuery();
                }

                player.PrintToChat($" \x04[Ghost]\x01 Equipped \x06{weapon} | {skin.SkinName}\x01 for {GetTeamText(team)}!");
                player.PrintToChat($" \x04[Ghost]\x01 Type \x06!wp\x01 to apply skin in-game.");
            }
            else if (isGloves)
            {
                var gloveDefIdx = GloveDefIndex.GetValueOrDefault(weapon, 5030);

                foreach (var weaponTeam in teams)
                {
                    // Update wp_player_gloves
                    using var gloveCmd = new MySqlCommand(@"
                        INSERT INTO wp_player_gloves (steamid, weapon_team, weapon_defindex)
                        VALUES (@steamid, @team, @defindex)
                        ON DUPLICATE KEY UPDATE weapon_defindex = @defindex", connection);
                    gloveCmd.Parameters.AddWithValue("@steamid", steamId);
                    gloveCmd.Parameters.AddWithValue("@team", weaponTeam);
                    gloveCmd.Parameters.AddWithValue("@defindex", gloveDefIdx);
                    gloveCmd.ExecuteNonQuery();

                    // Update wp_player_skins with glove paint
                    using var skinCmd = new MySqlCommand(@"
                        INSERT INTO wp_player_skins (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed)
                        VALUES (@steamid, @team, @defindex, @paintid, @wear, 0)
                        ON DUPLICATE KEY UPDATE weapon_paint_id = @paintid, weapon_wear = @wear", connection);
                    skinCmd.Parameters.AddWithValue("@steamid", steamId);
                    skinCmd.Parameters.AddWithValue("@team", weaponTeam);
                    skinCmd.Parameters.AddWithValue("@defindex", gloveDefIdx);
                    skinCmd.Parameters.AddWithValue("@paintid", paintKit);
                    skinCmd.Parameters.AddWithValue("@wear", skin.FloatValue);
                    skinCmd.ExecuteNonQuery();
                }

                player.PrintToChat($" \x04[Ghost]\x01 Equipped \x06{weapon} | {skin.SkinName}\x01 for {GetTeamText(team)}!");
                player.PrintToChat($" \x04[Ghost]\x01 Type \x06!wp\x01 to apply skin in-game.");
            }
            else
            {
                // Regular weapon skin
                var weaponDefIdx = WeaponDefIndex.GetValueOrDefault(weapon, 0);

                foreach (var weaponTeam in teams)
                {
                    using var cmd = new MySqlCommand(@"
                        INSERT INTO wp_player_skins (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed)
                        VALUES (@steamid, @team, @defindex, @paintid, @wear, 0)
                        ON DUPLICATE KEY UPDATE weapon_paint_id = @paintid, weapon_wear = @wear", connection);
                    cmd.Parameters.AddWithValue("@steamid", steamId);
                    cmd.Parameters.AddWithValue("@team", weaponTeam);
                    cmd.Parameters.AddWithValue("@defindex", weaponDefIdx);
                    cmd.Parameters.AddWithValue("@paintid", paintKit);
                    cmd.Parameters.AddWithValue("@wear", skin.FloatValue);
                    cmd.ExecuteNonQuery();
                }

                player.PrintToChat($" \x04[Ghost]\x01 Equipped \x06{weapon} | {skin.SkinName}\x01 for {GetTeamText(team)}!");
                player.PrintToChat($" \x04[Ghost]\x01 Type \x06!wp\x01 to apply skin in-game.");
            }

            // Also update the InventoryItem equipped status
            UpdateInventoryEquipStatus(steamId, weapon, skin.SkinName, team);
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostInventory] Failed to equip skin: {ex.Message}");
            player.PrintToChat($" \x02[Ghost]\x01 Failed to equip skin!");
        }
    }

    private void UpdateInventoryEquipStatus(string steamId, string weapon, string skinName, string team)
    {
        try
        {
            using var connection = new MySqlConnection(_connectionString);
            connection.Open();

            // First, unequip all other skins of the same weapon
            var equippedCt = team == "ct" || team == "both";
            var equippedT = team == "t" || team == "both";

            if (equippedCt)
            {
                using var unequipCtCmd = new MySqlCommand(@"
                    UPDATE InventoryItem i
                    INNER JOIN Player p ON i.playerId = p.id
                    SET i.equippedCt = 0
                    WHERE p.steamId = @steamid AND i.weapon = @weapon", connection);
                unequipCtCmd.Parameters.AddWithValue("@steamid", steamId);
                unequipCtCmd.Parameters.AddWithValue("@weapon", weapon);
                unequipCtCmd.ExecuteNonQuery();
            }

            if (equippedT)
            {
                using var unequipTCmd = new MySqlCommand(@"
                    UPDATE InventoryItem i
                    INNER JOIN Player p ON i.playerId = p.id
                    SET i.equippedT = 0
                    WHERE p.steamId = @steamid AND i.weapon = @weapon", connection);
                unequipTCmd.Parameters.AddWithValue("@steamid", steamId);
                unequipTCmd.Parameters.AddWithValue("@weapon", weapon);
                unequipTCmd.ExecuteNonQuery();
            }

            // Now equip the selected skin
            using var equipCmd = new MySqlCommand(@"
                UPDATE InventoryItem i
                INNER JOIN Player p ON i.playerId = p.id
                SET i.equippedCt = @equippedCt, i.equippedT = @equippedT
                WHERE p.steamId = @steamid AND i.weapon = @weapon AND i.skinName = @skinName", connection);
            equipCmd.Parameters.AddWithValue("@steamid", steamId);
            equipCmd.Parameters.AddWithValue("@weapon", weapon);
            equipCmd.Parameters.AddWithValue("@skinName", skinName);
            equipCmd.Parameters.AddWithValue("@equippedCt", equippedCt);
            equipCmd.Parameters.AddWithValue("@equippedT", equippedT);
            equipCmd.ExecuteNonQuery();
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostInventory] Failed to update inventory status: {ex.Message}");
        }
    }

    private Dictionary<string, int> GetOwnedWeaponsInCategory(string steamId, string[] weapons, string category)
    {
        var result = new Dictionary<string, int>();
        var itemType = category == "Knives" ? "knife" : category == "Gloves" ? "gloves" : "skin";

        try
        {
            using var connection = new MySqlConnection(_connectionString);
            connection.Open();

            // Get weapons with skin counts
            using var cmd = new MySqlCommand(@"
                SELECT i.weapon, COUNT(*) as count
                FROM InventoryItem i
                INNER JOIN Player p ON i.playerId = p.id
                WHERE p.steamId = @steamid AND i.itemType = @itemType
                GROUP BY i.weapon", connection);
            cmd.Parameters.AddWithValue("@steamid", steamId);
            cmd.Parameters.AddWithValue("@itemType", itemType);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                var weapon = reader.GetString("weapon");
                var count = reader.GetInt32("count");
                if (weapons.Contains(weapon))
                {
                    result[weapon] = count;
                }
            }
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostInventory] Failed to get owned weapons: {ex.Message}");
        }

        return result;
    }

    private List<InventorySkin> GetOwnedSkinsForWeapon(string steamId, string weapon)
    {
        var result = new List<InventorySkin>();

        try
        {
            using var connection = new MySqlConnection(_connectionString);
            connection.Open();

            using var cmd = new MySqlCommand(@"
                SELECT i.skinName, i.floatValue, i.dopplerPhase, i.equippedCt, i.equippedT
                FROM InventoryItem i
                INNER JOIN Player p ON i.playerId = p.id
                WHERE p.steamId = @steamid AND i.weapon = @weapon", connection);
            cmd.Parameters.AddWithValue("@steamid", steamId);
            cmd.Parameters.AddWithValue("@weapon", weapon);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                var skinName = reader.GetString("skinName");
                var floatValue = reader.GetFloat("floatValue");
                var dopplerPhase = reader.IsDBNull(reader.GetOrdinal("dopplerPhase")) ? null : reader.GetString("dopplerPhase");

                result.Add(new InventorySkin
                {
                    SkinName = skinName,
                    FloatValue = floatValue,
                    DopplerPhase = dopplerPhase,
                    PaintKit = GetPaintKit(weapon, skinName, dopplerPhase)
                });
            }
        }
        catch (Exception ex)
        {
            Logger.LogError($"[GhostInventory] Failed to get owned skins: {ex.Message}");
        }

        return result;
    }

    private int GetPaintKit(string weapon, string skinName, string? dopplerPhase)
    {
        // Handle Doppler phases
        if (skinName == "Doppler" && !string.IsNullOrEmpty(dopplerPhase))
        {
            return dopplerPhase switch
            {
                "Ruby" => 415,
                "Sapphire" => 416,
                "Black Pearl" => 417,
                "Phase 1" => 418,
                "Phase 2" => 419,
                "Phase 3" => 420,
                "Phase 4" => 421,
                _ => 418
            };
        }

        if (skinName == "Gamma Doppler" && !string.IsNullOrEmpty(dopplerPhase))
        {
            return dopplerPhase switch
            {
                "Emerald" => 568,
                "Phase 1" => 569,
                "Phase 2" => 570,
                "Phase 3" => 571,
                "Phase 4" => 572,
                _ => 569
            };
        }

        // Try knife-specific lookups for Lore/Autotronic/Black Laminate
        var knifeSpecificKey = $"{weapon} | {skinName}";
        if (PaintKits.TryGetValue(knifeSpecificKey, out var knifePaintKit))
        {
            return knifePaintKit;
        }

        // Try weapon | skin format
        var fullKey = $"{weapon} | {skinName}";
        if (PaintKits.TryGetValue(fullKey, out var paintKit))
        {
            return paintKit;
        }

        // Try just skin name (for knives/gloves with universal patterns)
        if (PaintKits.TryGetValue(skinName, out var genericPaintKit))
        {
            return genericPaintKit;
        }

        return 0;
    }

    // Paint kit mappings (subset - add more as needed)
    private static readonly Dictionary<string, int> PaintKits = new()
    {
        // Standard knife finishes
        ["Fade"] = 38,
        ["Doppler"] = 418,
        ["Doppler Phase 1"] = 418,
        ["Doppler Phase 2"] = 419,
        ["Doppler Phase 3"] = 420,
        ["Doppler Phase 4"] = 421,
        ["Doppler Ruby"] = 415,
        ["Doppler Sapphire"] = 416,
        ["Doppler Black Pearl"] = 417,
        ["Tiger Tooth"] = 409,
        ["Marble Fade"] = 413,
        ["Damascus Steel"] = 410,
        ["Slaughter"] = 59,
        ["Crimson Web"] = 12,
        ["Case Hardened"] = 44,
        ["Blue Steel"] = 42,
        ["Night"] = 40,
        ["Stained"] = 43,
        ["Forest DDPAT"] = 5,
        ["Boreal Forest"] = 77,
        ["Safari Mesh"] = 72,
        ["Ultraviolet"] = 98,
        ["Urban Masked"] = 143,
        ["Scorched"] = 175,
        ["Rust Coat"] = 323,
        ["Vanilla"] = 0,
        ["Default"] = 0,

        // Gamma Doppler
        ["Gamma Doppler"] = 569,
        ["Gamma Doppler Emerald"] = 568,
        ["Gamma Doppler Phase 1"] = 569,
        ["Gamma Doppler Phase 2"] = 570,
        ["Gamma Doppler Phase 3"] = 571,
        ["Gamma Doppler Phase 4"] = 572,
        ["Emerald"] = 568,

        // Lore (knife-specific)
        ["Bayonet | Lore"] = 558,
        ["Flip Knife | Lore"] = 559,
        ["Gut Knife | Lore"] = 560,
        ["Karambit | Lore"] = 561,
        ["M9 Bayonet | Lore"] = 562,
        ["Lore"] = 561,

        // Autotronic (knife-specific)
        ["Bayonet | Autotronic"] = 573,
        ["Flip Knife | Autotronic"] = 574,
        ["Gut Knife | Autotronic"] = 575,
        ["Karambit | Autotronic"] = 576,
        ["M9 Bayonet | Autotronic"] = 577,
        ["Autotronic"] = 576,

        // Black Laminate (knife-specific)
        ["Bayonet | Black Laminate"] = 563,
        ["Flip Knife | Black Laminate"] = 564,
        ["Gut Knife | Black Laminate"] = 565,
        ["Karambit | Black Laminate"] = 566,
        ["M9 Bayonet | Black Laminate"] = 567,
        ["Black Laminate"] = 566,

        // Glove paints
        ["Superconductor"] = 10037,
        ["Pandora's Box"] = 10036,
        ["Hedge Maze"] = 10040,
        ["King Snake"] = 10041,
        ["Spearmint"] = 10026,
        ["Cool Mint"] = 10028,
        ["Vice"] = 10042,
        ["Crimson Kimono"] = 10033,
        ["Emerald Web"] = 10034,
        ["Tiger Strike"] = 10063,
        ["Mogul"] = 10061,
        ["Cobalt Skulls"] = 10053,
        ["Overprint"] = 10054,
        ["Polygon"] = 10052,
        ["Lunar Weave"] = 10013,
        ["Crimson Weave"] = 10016,
        ["Convoy"] = 10015,
        ["Racing Green"] = 10044,
        ["Leather"] = 10009,
        ["Spruce DDPAT"] = 10010,
        ["Badlands"] = 10036,
        ["Foundation"] = 10057,
        ["Charred"] = 10000,
        ["Snakebite"] = 10001,
        ["Bronzed"] = 10002,
        ["Guerrilla"] = 10003,

        // Weapon skins - AK-47
        ["AK-47 | Asiimov"] = 801,
        ["AK-47 | Fire Serpent"] = 180,
        ["AK-47 | Vulcan"] = 302,
        ["AK-47 | Redline"] = 282,
        ["AK-47 | Neon Rider"] = 707,
        ["AK-47 | Bloodsport"] = 639,
        ["AK-47 | The Empress"] = 675,
        ["AK-47 | Case Hardened"] = 44,
        ["AK-47 | Fuel Injector"] = 524,
        ["AK-47 | Hydroponic"] = 456,
        ["AK-47 | Wasteland Rebel"] = 380,
        ["AK-47 | Jaguar"] = 316,
        ["AK-47 | Nightwish"] = 1056,
        ["AK-47 | Ice Coaled"] = 1022,

        // AWP skins
        ["AWP | Dragon Lore"] = 344,
        ["AWP | Medusa"] = 446,
        ["AWP | Gungnir"] = 906,
        ["AWP | Asiimov"] = 279,
        ["AWP | Hyper Beast"] = 475,
        ["AWP | Lightning Strike"] = 51,
        ["AWP | Graphite"] = 212,
        ["AWP | Redline"] = 259,
        ["AWP | Fade"] = 1046,
        ["AWP | Neo-Noir"] = 803,
        ["AWP | The Prince"] = 920,
        ["AWP | Wildfire"] = 1080,

        // M4A4 skins
        ["M4A4 | Howl"] = 309,
        ["M4A4 | Poseidon"] = 449,
        ["M4A4 | Asiimov"] = 255,
        ["M4A4 | Neo-Noir"] = 695,
        ["M4A4 | The Emperor"] = 844,
        ["M4A4 | Desolate Space"] = 512,
        ["M4A4 | Buzz Kill"] = 594,
        ["M4A4 | Bullet Rain"] = 155,
        ["M4A4 | Dragon King"] = 400,
        ["M4A4 | Cyber Security"] = 1054,

        // M4A1-S skins
        ["M4A1-S | Hot Rod"] = 445,
        ["M4A1-S | Knight"] = 326,
        ["M4A1-S | Master Piece"] = 321,
        ["M4A1-S | Golden Coil"] = 497,
        ["M4A1-S | Printstream"] = 984,
        ["M4A1-S | Hyper Beast"] = 430,
        ["M4A1-S | Cyrex"] = 360,
        ["M4A1-S | Mecha Industries"] = 587,
        ["M4A1-S | Player Two"] = 946,
        ["M4A1-S | Icarus Fell"] = 440,

        // Desert Eagle skins
        ["Desert Eagle | Blaze"] = 37,
        ["Desert Eagle | Golden Koi"] = 185,
        ["Desert Eagle | Crimson Web"] = 12,
        ["Desert Eagle | Hypnotic"] = 61,
        ["Desert Eagle | Kumicho Dragon"] = 527,
        ["Desert Eagle | Code Red"] = 711,
        ["Desert Eagle | Printstream"] = 962,
        ["Desert Eagle | Mecha Industries"] = 805,

        // USP-S skins
        ["USP-S | Kill Confirmed"] = 504,
        ["USP-S | Neo-Noir"] = 653,
        ["USP-S | Orion"] = 313,
        ["USP-S | Printstream"] = 1142,
        ["USP-S | Cortex"] = 705,
        ["USP-S | Caiman"] = 339,

        // Glock skins
        ["Glock-18 | Fade"] = 38,
        ["Glock-18 | Dragon Tattoo"] = 48,
        ["Glock-18 | Twilight Galaxy"] = 437,
        ["Glock-18 | Wasteland Rebel"] = 586,
        ["Glock-18 | Bullet Queen"] = 957,
        ["Glock-18 | Water Elemental"] = 353,

        // P250 skins
        ["P250 | Mehndi"] = 258,
        ["P250 | Asiimov"] = 255,
        ["P250 | Undertow"] = 271,
        ["P250 | Muertos"] = 404,
        ["P250 | See Ya Later"] = 1061,

        // Other pistols
        ["Five-SeveN | Hyper Beast"] = 513,
        ["Five-SeveN | Case Hardened"] = 44,
        ["Tec-9 | Fuel Injector"] = 578,
        ["Tec-9 | Nuclear Threat"] = 168,
        ["CZ75-Auto | Victoria"] = 270,
        ["CZ75-Auto | The Fuschia Is Now"] = 269,

        // SMGs
        ["MAC-10 | Neon Rider"] = 433,
        ["MAC-10 | Case Hardened"] = 44,
        ["MAC-10 | Fade"] = 38,
        ["MP9 | Hot Rod"] = 33,
        ["MP9 | Hypnotic"] = 61,
        ["MP7 | Bloodsport"] = 656,
        ["UMP-45 | Blaze"] = 37,
        ["UMP-45 | Primal Saber"] = 512,
        ["P90 | Asiimov"] = 359,
        ["P90 | Death by Kitty"] = 156,
        ["P90 | Emerald Dragon"] = 182,

        // Rifles
        ["FAMAS | Mecha Industries"] = 689,
        ["Galil AR | Chatterbox"] = 398,
        ["AUG | Akihabara Accept"] = 455,
        ["SG 553 | Cyrex"] = 487,

        // Snipers
        ["SSG 08 | Blood in the Water"] = 222,
        ["SSG 08 | Dragonfire"] = 624,
        ["SCAR-20 | Emerald"] = 196,
        ["G3SG1 | The Executioner"] = 511,

        // Shotguns
        ["Nova | Antique"] = 286,
        ["Nova | Hyper Beast"] = 537,
        ["MAG-7 | Bulldozer"] = 39,
        ["XM1014 | Tranquility"] = 393,
        ["Sawed-Off | The Kraken"] = 256,

        // MGs
        ["Negev | Mjolnir"] = 873,
        ["M249 | Emerald Poison Dart"] = 830,
    };

    private string GetSteamId64(CCSPlayerController player)
    {
        return player.SteamID.ToString();
    }

    private string GetWearText(float floatValue)
    {
        return floatValue switch
        {
            < 0.07f => "FN",
            < 0.15f => "MW",
            < 0.38f => "FT",
            < 0.45f => "WW",
            _ => "BS"
        };
    }

    private string GetTeamText(string team)
    {
        return team switch
        {
            "ct" => "CT",
            "t" => "T",
            _ => "Both Teams"
        };
    }

    private class InventorySkin
    {
        public string SkinName { get; set; } = "";
        public float FloatValue { get; set; }
        public string? DopplerPhase { get; set; }
        public int PaintKit { get; set; }
    }
}

public class GhostInventoryConfig
{
    public int ConfigVersion { get; set; } = 1;
    public string DatabaseHost { get; set; } = "127.0.0.1";
    public int DatabasePort { get; set; } = 3306;
    public string DatabaseUser { get; set; } = "ghost";
    public string DatabasePassword { get; set; } = "GhostServer2024";
    public string DatabaseName { get; set; } = "ghost_gaming";
}
