// Discord webhook integration for rare drops and announcements

interface DropEmbed {
  playerName: string
  steamId: string
  itemName: string
  weaponName: string
  wear: string
  floatValue: number
  rarity: string
  isKnife?: boolean
  isGloves?: boolean
  imageUrl?: string
}

const RARITY_COLORS: Record<string, number> = {
  common: 0x808080,      // Gray
  uncommon: 0x4a90d9,    // Light Blue
  rare: 0x4b69ff,        // Blue
  epic: 0x8847ff,        // Purple
  legendary: 0xd32ce6,   // Pink
  ultra: 0xffd700,       // Gold
}

const WEAR_NAMES: Record<string, string> = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
}

export async function sendRareDropToDiscord(drop: DropEmbed): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    console.log('[Discord] No webhook URL configured, skipping')
    return false
  }

  const isSpecial = drop.isKnife || drop.isGloves || drop.rarity === 'ultra' || drop.rarity === 'legendary'

  // Only send notifications for rare+ items
  if (!isSpecial && !['rare', 'epic', 'legendary', 'ultra'].includes(drop.rarity)) {
    return false
  }

  const itemType = drop.isKnife ? 'Knife' : drop.isGloves ? 'Gloves' : 'Skin'
  const title = isSpecial
    ? `${drop.isKnife ? '🔪' : drop.isGloves ? '🧤' : '⭐'} RARE DROP!`
    : '🎉 Nice Drop!'

  const embed = {
    title,
    description: `**${drop.playerName}** just unboxed a ${itemType.toLowerCase()}!`,
    color: RARITY_COLORS[drop.rarity] || 0x808080,
    fields: [
      {
        name: 'Item',
        value: `${drop.weaponName} | ${drop.itemName}`,
        inline: true,
      },
      {
        name: 'Condition',
        value: `${WEAR_NAMES[drop.wear] || drop.wear} (${drop.floatValue.toFixed(4)})`,
        inline: true,
      },
      {
        name: 'Rarity',
        value: drop.rarity.charAt(0).toUpperCase() + drop.rarity.slice(1),
        inline: true,
      },
    ],
    thumbnail: drop.imageUrl ? { url: drop.imageUrl } : undefined,
    footer: {
      text: 'Ghost Gaming | ghostservers.site',
    },
    timestamp: new Date().toISOString(),
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Ghost Drops',
        avatar_url: 'https://www.ghostservers.site/logo.png',
        embeds: [embed],
      }),
    })

    if (!response.ok) {
      console.error('[Discord] Webhook failed:', response.status, await response.text())
      return false
    }

    console.log('[Discord] Rare drop sent:', drop.itemName)
    return true
  } catch (error) {
    console.error('[Discord] Webhook error:', error)
    return false
  }
}

export async function sendAnnouncementToDiscord(
  title: string,
  message: string,
  color: number = 0xa855f7
): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    return false
  }

  const embed = {
    title,
    description: message,
    color,
    footer: {
      text: 'Ghost Gaming',
    },
    timestamp: new Date().toISOString(),
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Ghost Gaming',
        avatar_url: 'https://www.ghostservers.site/logo.png',
        embeds: [embed],
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[Discord] Announcement error:', error)
    return false
  }
}

export async function sendGiveawayWinnerToDiscord(
  giveawayTitle: string,
  winnerName: string,
  prize: string
): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!webhookUrl) {
    return false
  }

  const embed = {
    title: '🎁 Giveaway Winner!',
    description: `**${winnerName}** won the giveaway!`,
    color: 0xffd700,
    fields: [
      {
        name: 'Giveaway',
        value: giveawayTitle,
        inline: true,
      },
      {
        name: 'Prize',
        value: prize,
        inline: true,
      },
    ],
    footer: {
      text: 'Ghost Gaming | Join giveaways at ghostservers.site',
    },
    timestamp: new Date().toISOString(),
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Ghost Giveaways',
        avatar_url: 'https://www.ghostservers.site/logo.png',
        embeds: [embed],
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[Discord] Giveaway error:', error)
    return false
  }
}
