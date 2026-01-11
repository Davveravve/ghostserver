namespace GhostSouls;

/// <summary>
/// Cached player data
/// </summary>
public class PlayerData
{
    public ulong SteamId { get; set; }
    public int Souls { get; set; }
    public int TotalEarned { get; set; }
    public int SessionEarned { get; set; } = 0; // Souls earned this session (for delta sync)
    public List<EquippedSkin> EquippedSkins { get; set; } = new();
    public bool IsDirty { get; set; } = false;
    public string Role { get; set; } = "default";
    public string PremiumTier { get; set; } = "none";

    // Ranking
    public int Elo { get; set; } = 1000;
    public int Wins { get; set; } = 0;
    public int Losses { get; set; } = 0;
    public int RoundKills { get; set; } = 0; // Kills this round (for clutch detection)
    public int RoundDeaths { get; set; } = 0;
}

/// <summary>
/// Equipped skin from Ghost inventory
/// </summary>
public class EquippedSkin
{
    public string WeaponName { get; set; } = "";
    public int WeaponDefIndex { get; set; }
    public int PaintKit { get; set; }
    public int Seed { get; set; }
    public float Wear { get; set; }
    public string? DopplerPhase { get; set; }
    public bool IsKnife { get; set; }
    public bool IsGloves { get; set; }
    public string Team { get; set; } = "both"; // ct, t, both
}

/// <summary>
/// API response for player data
/// </summary>
public class ApiPlayerResponse
{
    public string SteamId { get; set; } = "";
    public string Username { get; set; } = "";
    public int Souls { get; set; }
    public int TotalSoulsEarned { get; set; }
    public int PlaytimeMinutes { get; set; }
    public string PremiumTier { get; set; } = "none";
    public int Elo { get; set; } = 1000;
    public int Wins { get; set; } = 0;
    public int Losses { get; set; } = 0;
    public List<EquippedSkin>? EquippedSkins { get; set; }
}

/// <summary>
/// Rare drop announcement from web
/// </summary>
public class RareDropAnnouncement
{
    public string PlayerName { get; set; } = "";
    public string SteamId { get; set; } = "";
    public string WeaponName { get; set; } = "";
    public string SkinName { get; set; } = "";
    public string? DopplerPhase { get; set; }
}
