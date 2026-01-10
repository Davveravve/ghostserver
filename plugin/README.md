# Ghost Souls - CS2 Plugin

CounterStrikeSharp plugin for Ghost Gaming servers.

## Features

### Souls Economy
- Earn souls for kills (+5)
- Headshot bonus (+2)
- Knife kill bonus (+10)
- Anti-farm protection (minimum kill interval)
- Automatic sync with web database

### Skin System
- **Forces default/vanilla skins** - blocks Steam inventory
- Only shows skins equipped from Ghost inventory
- Supports knives, gloves, and all weapons
- Real-time skin application on spawn

### Commands
| Command | Description |
|---------|-------------|
| `!souls` | Check your souls balance |
| `!inventory` | Link to your inventory |
| `!cases` | Link to open cases |
| `!refresh` | Sync inventory from website |
| `!top` | Link to leaderboard |
| `!server` | Browse & join other Ghost servers |
| `!server <num>` | Connect to server by number |
| `!help` | Show all commands |
| `!ghost` | Show all commands |

### Server Browser
- In-game server list with `!server`
- Quick connect with `!server <number>`
- Configurable server list in config

### Sponsor/Ad System
- Configurable ad rotation
- Multiple ad types: chat, center text
- Per-sponsor tracking (ready for future analytics)
- Customizable interval

## Installation

1. Install [CounterStrikeSharp](https://github.com/roflmuffin/CounterStrikeSharp)
2. Copy `GhostSouls` folder to `csgo/addons/counterstrikesharp/plugins/`
3. Configure `config/GhostSouls.json`
4. Set `PLUGIN_API_KEY` environment variable on your web server
5. Restart server

## Configuration

Edit `config/GhostSouls.json`:

```json
{
  "ApiUrl": "https://your-site.com",
  "ApiKey": "your-secure-api-key",
  "WebsiteUrl": "https://your-site.com",
  "ServerName": "Ghost Gaming | Retake #1",
  "Souls": {
    "KillReward": 5,
    "HeadshotBonus": 2,
    "KnifeKillBonus": 10,
    "MinKillIntervalSeconds": 5
  },
  "Sponsors": {
    "Enabled": true,
    "IntervalSeconds": 120,
    "Ads": [...]
  }
}
```

## Building

```bash
cd plugin/GhostSouls
dotnet build
```

Output will be in `bin/Debug/net8.0/`

## API Endpoints

The plugin communicates with these web API endpoints:

- `GET /api/plugin/player/{steamId}` - Get player data & equipped skins
- `POST /api/plugin/player/register` - Register new player
- `POST /api/plugin/player/sync` - Sync souls & playtime
- `POST /api/plugin/announce` - Broadcast rare drops

All endpoints require `X-API-Key` header.

## Adding Servers

Add servers to the config for the `!server` command:

```json
{
  "Servers": {
    "Servers": [
      {
        "Name": "Surf",
        "Address": "surf.ghost-gaming.com:27015",
        "Description": "Surf maps with timer"
      },
      {
        "Name": "Retake",
        "Address": "retake.ghost-gaming.com:27015",
        "Description": "5v5 Retake"
      }
    ]
  }
}
```

## Adding Sponsors

Add sponsors to the config:

```json
{
  "Type": "chat",
  "Message": "Visit sponsor-site.com for bonuses!",
  "Sponsor": "Sponsor Name",
  "Url": "https://sponsor-site.com"
}
```

Supported types:
- `chat` - Chat message with [Sponsor] prefix
- `center` - Center screen text
- `html` - Reserved for future HTML panels
