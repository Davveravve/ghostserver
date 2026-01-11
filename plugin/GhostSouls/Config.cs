using CounterStrikeSharp.API.Core;
using System.Text.Json.Serialization;

namespace GhostSouls;

public class GhostConfig : BasePluginConfig
{
    [JsonPropertyName("ApiUrl")]
    public string ApiUrl { get; set; } = "https://ghostservers.site";

    [JsonPropertyName("ApiKey")]
    public string ApiKey { get; set; } = "your-api-key-here";

    [JsonPropertyName("WebsiteUrl")]
    public string WebsiteUrl { get; set; } = "https://ghostservers.site";

    [JsonPropertyName("ServerName")]
    public string ServerName { get; set; } = "Ghost Gaming Server";

    [JsonPropertyName("Souls")]
    public SoulsConfig Souls { get; set; } = new();

    [JsonPropertyName("Sponsors")]
    public SponsorConfig Sponsors { get; set; } = new();

    [JsonPropertyName("Servers")]
    public ServersConfig Servers { get; set; } = new();

    [JsonPropertyName("Roles")]
    public RolesConfig Roles { get; set; } = new();

    [JsonPropertyName("Ranking")]
    public RankingConfig Ranking { get; set; } = new();
}

public class SoulsConfig
{
    [JsonPropertyName("KillReward")]
    public int KillReward { get; set; } = 1; // 1 kill = 1 soul

    [JsonPropertyName("HeadshotBonus")]
    public int HeadshotBonus { get; set; } = 1; // +1 for headshot

    [JsonPropertyName("KnifeKillBonus")]
    public int KnifeKillBonus { get; set; } = 3; // +3 for knife

    [JsonPropertyName("ClutchBonus")]
    public int ClutchBonus { get; set; } = 5; // 1vX clutch win

    [JsonPropertyName("DefuseBonus")]
    public int DefuseBonus { get; set; } = 2;

    [JsonPropertyName("PlantBonus")]
    public int PlantBonus { get; set; } = 1;

    [JsonPropertyName("MVPBonus")]
    public int MVPBonus { get; set; } = 2;

    [JsonPropertyName("RoundWinBonus")]
    public int RoundWinBonus { get; set; } = 1;

    [JsonPropertyName("MinKillIntervalSeconds")]
    public int MinKillIntervalSeconds { get; set; } = 3;

    [JsonPropertyName("SoulsPerMinute")]
    public int SoulsPerMinute { get; set; } = 0; // 0 = disabled, set to e.g. 3 for surf servers
}

public class SponsorConfig
{
    [JsonPropertyName("Enabled")]
    public bool Enabled { get; set; } = true;

    [JsonPropertyName("IntervalSeconds")]
    public float IntervalSeconds { get; set; } = 120f;

    [JsonPropertyName("Ads")]
    public List<AdConfig> Ads { get; set; } = new()
    {
        new AdConfig
        {
            Type = "chat",
            Message = "Visit ghostservers.site to open cases and win skins!",
            Sponsor = "Ghost Servers"
        }
    };
}

public class AdConfig
{
    [JsonPropertyName("Type")]
    public string Type { get; set; } = "chat"; // chat, center, html

    [JsonPropertyName("Message")]
    public string Message { get; set; } = "";

    [JsonPropertyName("Sponsor")]
    public string Sponsor { get; set; } = "";

    [JsonPropertyName("Url")]
    public string Url { get; set; } = "";

    [JsonPropertyName("ImageUrl")]
    public string ImageUrl { get; set; } = "";
}

public class ServersConfig
{
    [JsonPropertyName("Servers")]
    public List<ServerInfo> Servers { get; set; } = new()
    {
        new ServerInfo { Name = "Surf", Address = "surf.ghostservers.site:27015" },
        new ServerInfo { Name = "Bhop", Address = "bhop.ghostservers.site:27015" },
        new ServerInfo { Name = "Retake", Address = "retake.ghostservers.site:27015" }
    };
}

public class ServerInfo
{
    [JsonPropertyName("Name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("Address")]
    public string Address { get; set; } = "";

    [JsonPropertyName("Description")]
    public string Description { get; set; } = "";
}

public class RolesConfig
{
    [JsonPropertyName("Owners")]
    public List<string> Owners { get; set; } = new() { "76561198012345678" }; // SteamID64s

    [JsonPropertyName("Admins")]
    public List<string> Admins { get; set; } = new();

    [JsonPropertyName("Mods")]
    public List<string> Mods { get; set; } = new();

    [JsonPropertyName("RoleSettings")]
    public Dictionary<string, RoleSettings> RoleSettings { get; set; } = new()
    {
        { "owner", new RoleSettings { Tag = "[OWNER]", ChatColor = "Red", TagColor = "DarkRed", SoulsMultiplier = 5.0f } },
        { "admin", new RoleSettings { Tag = "[ADMIN]", ChatColor = "Orange", TagColor = "Orange", SoulsMultiplier = 3.0f } },
        { "mod", new RoleSettings { Tag = "[MOD]", ChatColor = "LightGreen", TagColor = "Green", SoulsMultiplier = 2.0f } },
        { "ascended", new RoleSettings { Tag = "[ASCENDED]", ChatColor = "Grey", TagColor = "Black", SoulsMultiplier = 2.0f } },
        { "default", new RoleSettings { Tag = "", ChatColor = "Default", TagColor = "Default", SoulsMultiplier = 1.0f } }
    };
}

public class RoleSettings
{
    [JsonPropertyName("Tag")]
    public string Tag { get; set; } = "";

    [JsonPropertyName("ChatColor")]
    public string ChatColor { get; set; } = "Default";

    [JsonPropertyName("TagColor")]
    public string TagColor { get; set; } = "Default";

    [JsonPropertyName("SoulsMultiplier")]
    public float SoulsMultiplier { get; set; } = 1.0f;
}

public class RankingConfig
{
    [JsonPropertyName("Enabled")]
    public bool Enabled { get; set; } = true;

    [JsonPropertyName("StartingElo")]
    public int StartingElo { get; set; } = 1000;

    [JsonPropertyName("WinElo")]
    public int WinElo { get; set; } = 25;

    [JsonPropertyName("LossElo")]
    public int LossElo { get; set; } = 20;

    [JsonPropertyName("KillElo")]
    public int KillElo { get; set; } = 2;

    [JsonPropertyName("DeathElo")]
    public int DeathElo { get; set; } = 1;

    [JsonPropertyName("Ranks")]
    public List<RankInfo> Ranks { get; set; } = new()
    {
        new RankInfo { Name = "Haunted", MinElo = 0, Color = "Grey", Icon = "I" },
        new RankInfo { Name = "Spirit", MinElo = 800, Color = "LightBlue", Icon = "II" },
        new RankInfo { Name = "Phantom", MinElo = 1000, Color = "Blue", Icon = "III" },
        new RankInfo { Name = "Specter", MinElo = 1200, Color = "Purple", Icon = "IV" },
        new RankInfo { Name = "Wraith", MinElo = 1400, Color = "Magenta", Icon = "V" },
        new RankInfo { Name = "Shade", MinElo = 1600, Color = "Orange", Icon = "VI" },
        new RankInfo { Name = "Ghost", MinElo = 1800, Color = "Gold", Icon = "VII" },
        new RankInfo { Name = "Ascended", MinElo = 2000, Color = "Red", Icon = "VIII" }
    };
}

public class RankInfo
{
    [JsonPropertyName("Name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("MinElo")]
    public int MinElo { get; set; }

    [JsonPropertyName("Color")]
    public string Color { get; set; } = "Default";

    [JsonPropertyName("Icon")]
    public string Icon { get; set; } = "";
}
