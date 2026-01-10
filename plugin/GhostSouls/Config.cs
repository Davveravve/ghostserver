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
}

public class SoulsConfig
{
    [JsonPropertyName("KillReward")]
    public int KillReward { get; set; } = 5;

    [JsonPropertyName("HeadshotBonus")]
    public int HeadshotBonus { get; set; } = 2;

    [JsonPropertyName("KnifeKillBonus")]
    public int KnifeKillBonus { get; set; } = 10;

    [JsonPropertyName("AssistReward")]
    public int AssistReward { get; set; } = 2;

    [JsonPropertyName("MVPBonus")]
    public int MVPBonus { get; set; } = 5;

    [JsonPropertyName("RoundWinBonus")]
    public int RoundWinBonus { get; set; } = 3;

    [JsonPropertyName("MinKillIntervalSeconds")]
    public int MinKillIntervalSeconds { get; set; } = 5;
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
