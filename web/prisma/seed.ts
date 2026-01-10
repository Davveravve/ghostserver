import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// Generera en slumpmässig API-nyckel för servrar
function generateApiKey(): string {
  return randomBytes(32).toString('hex')
}

// Generera slumpmässigt floatvärde för ett visst wear
function generateFloat(wear: string): number {
  const ranges: Record<string, [number, number]> = {
    'FN': [0.00, 0.07],
    'MW': [0.07, 0.15],
    'FT': [0.15, 0.38],
    'WW': [0.38, 0.45],
    'BS': [0.45, 1.00],
  }
  const [min, max] = ranges[wear] || [0.15, 0.38]
  return min + Math.random() * (max - min)
}

async function main() {
  console.log('Börjar seeda databasen...')

  // Rensa befintlig data
  await prisma.soulTransaction.deleteMany()
  await prisma.caseOpen.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.player.deleteMany()
  await prisma.server.deleteMany()

  console.log('Raderade befintlig data')

  // Skapa servrar
  const servers = await Promise.all([
    prisma.server.create({
      data: {
        name: 'Ghost Surf #1',
        ip: '45.91.92.100',
        port: 27015,
        apiKey: generateApiKey(),
        isOnline: true,
        currentPlayers: 18,
        maxPlayers: 32,
        currentMap: 'surf_mesa',
        lastHeartbeat: new Date(),
      },
    }),
    prisma.server.create({
      data: {
        name: 'Ghost Retake #1',
        ip: '45.91.92.101',
        port: 27015,
        apiKey: generateApiKey(),
        isOnline: true,
        currentPlayers: 9,
        maxPlayers: 10,
        currentMap: 'de_mirage',
        lastHeartbeat: new Date(),
      },
    }),
    prisma.server.create({
      data: {
        name: 'Ghost Competitive',
        ip: '45.91.92.102',
        port: 27015,
        apiKey: generateApiKey(),
        isOnline: true,
        currentPlayers: 10,
        maxPlayers: 10,
        currentMap: 'de_inferno',
        lastHeartbeat: new Date(),
      },
    }),
    prisma.server.create({
      data: {
        name: 'Ghost DM #1',
        ip: '45.91.92.103',
        port: 27015,
        apiKey: generateApiKey(),
        isOnline: false,
        currentPlayers: 0,
        maxPlayers: 24,
        currentMap: 'de_dust2',
        lastHeartbeat: new Date(Date.now() - 1000 * 60 * 30), // 30 min sedan
      },
    }),
  ])

  console.log(`Skapade ${servers.length} servrar`)

  // Skapa spelare
  const players = await Promise.all([
    prisma.player.create({
      data: {
        steamId: '76561198012345678',
        username: 'xNightmare',
        avatarUrl: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
        souls: 15420,
        totalSoulsEarned: 89500,
        playtimeMinutes: 12450,
        totalKills: 8934,
        casesOpened: 156,
        isPremium: true,
        premiumTier: 'gold',
        premiumExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    }),
    prisma.player.create({
      data: {
        steamId: '76561198087654321',
        username: 'SurfGod420',
        avatarUrl: 'https://avatars.steamstatic.com/81c5f502d0c2f93c6ead7c5f00096bc7177fe3e4_full.jpg',
        souls: 8750,
        totalSoulsEarned: 45200,
        playtimeMinutes: 8900,
        totalKills: 3421,
        casesOpened: 89,
        isPremium: true,
        premiumTier: 'silver',
        premiumExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    }),
    prisma.player.create({
      data: {
        steamId: '76561198011223344',
        username: 'HeadshotKing',
        avatarUrl: 'https://avatars.steamstatic.com/b5d1b6a3e9e8b5c4a7d6f8e9a0b1c2d3e4f5g6h7_full.jpg',
        souls: 4230,
        totalSoulsEarned: 28900,
        playtimeMinutes: 5600,
        totalKills: 12500,
        casesOpened: 45,
        isPremium: false,
        premiumTier: 'none',
      },
    }),
    prisma.player.create({
      data: {
        steamId: '76561198055667788',
        username: 'CasualGamer',
        avatarUrl: 'https://avatars.steamstatic.com/c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4_full.jpg',
        souls: 1250,
        totalSoulsEarned: 5600,
        playtimeMinutes: 1200,
        totalKills: 890,
        casesOpened: 12,
        isPremium: false,
        premiumTier: 'none',
      },
    }),
    prisma.player.create({
      data: {
        steamId: '76561198099887766',
        username: 'ProAwper',
        avatarUrl: 'https://avatars.steamstatic.com/d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5_full.jpg',
        souls: 22100,
        totalSoulsEarned: 112000,
        playtimeMinutes: 18500,
        totalKills: 25000,
        casesOpened: 312,
        isPremium: true,
        premiumTier: 'gold',
        premiumExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
      },
    }),
  ])

  console.log(`Skapade ${players.length} spelare`)

  // Skapa inventory items för spelare
  const inventoryItems = [
    // xNightmare's inventory
    {
      playerId: players[0].id,
      itemId: 1001,
      name: 'AK-47 | Asiimov',
      weapon: 'AK-47',
      skinName: 'Asiimov',
      wear: 'FT',
      imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQe3-0VtYDilIoWLJlI6YVHR_lC_w-_njJW0vMnMyiMwsnV04n3D30vgnAOXMA',
      itemType: 'skin',
      equippedT: true,
      equippedCt: false,
      obtainedFrom: 'Spectrum Case',
    },
    {
      playerId: players[0].id,
      itemId: 2001,
      name: 'Karambit | Doppler Phase 2',
      weapon: 'Karambit',
      skinName: 'Doppler',
      wear: 'FN',
      dopplerPhase: 'Phase 2',
      imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf2PLacDBA5ciJl5O0g978sq-IkDoDuJMmiLqSoNSt2lGz_Rc9azuhcYScJg85NVvT_gDqxum50JO4vpzKm3U2viQ8pSGKmoaJhQ',
      itemType: 'knife',
      equippedT: true,
      equippedCt: true,
      obtainedFrom: 'Gamma Case',
    },
    // SurfGod420's inventory
    {
      playerId: players[1].id,
      itemId: 1002,
      name: 'AWP | Dragon Lore',
      weapon: 'AWP',
      skinName: 'Dragon Lore',
      wear: 'MW',
      imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJK9cyzhr-KmsjwPKvBmm5u5cB1g_zMu4qg2VDh-RVlYz3zJoWcIw9oYFvV_FHrwOi515K96Z2cm3Vi6yQgsHvbyhGxhBxIcKUx0qOMWsaI',
      itemType: 'skin',
      equippedCt: true,
      equippedT: false,
      obtainedFrom: 'Cobblestone Souvenir',
    },
    {
      playerId: players[1].id,
      itemId: 3001,
      name: 'Sport Gloves | Pandoras Box',
      weapon: 'Gloves',
      skinName: 'Pandoras Box',
      wear: 'FT',
      imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopL-zJAt21uH3Yi5FvISJmYGZnPLmDL3Qh2xu5cB1g_zMu4qg2VDl_kZpYjuncdfHcFA4aV3RrFi_w-7q0cXs7M7Im3t9-n51CtZrBbY',
      itemType: 'gloves',
      equippedCt: true,
      equippedT: true,
      obtainedFrom: 'Glove Case',
    },
    // HeadshotKing's inventory
    {
      playerId: players[2].id,
      itemId: 1003,
      name: 'M4A4 | Howl',
      weapon: 'M4A4',
      skinName: 'Howl',
      wear: 'MW',
      imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITCmX5dpZcl0LmT99-n2Ffk_kZoZWmhJoKdcwNoYFzV_1K4wO_u15S-7ZzKnHBhsnIj4CvdnRW10QMeaadbFJ9G',
      itemType: 'skin',
      equippedCt: true,
      equippedT: false,
      obtainedFrom: 'Huntsman Case',
    },
    // ProAwper's inventory
    {
      playerId: players[4].id,
      itemId: 2002,
      name: 'Butterfly Knife | Fade',
      weapon: 'Butterfly Knife',
      skinName: 'Fade',
      wear: 'FN',
      imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0Ob3dTxBvYyJhImKmvLLP7LWnn8fsMEl2LjAo4in0Ffg8kI5ZWr1d4-VdFQ4aFzR-gK-lOjnjMK5vpzOzXRhuyRw7SvfzxG1iRlIOOI_0vOaVxzAUAPdHc8n',
      itemType: 'knife',
      equippedT: true,
      equippedCt: true,
      obtainedFrom: 'Operation Breakout Case',
    },
    {
      playerId: players[4].id,
      itemId: 1004,
      name: 'AWP | Medusa',
      weapon: 'AWP',
      skinName: 'Medusa',
      wear: 'FN',
      imageUrl: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7cqWdQ689piOXI8oXwjVCxqEQ5azz1JtTBJAM7NFyD-Aa2xObs1JO4vpnBn3t9-n51P4CiJUg',
      itemType: 'skin',
      equippedCt: true,
      equippedT: false,
      obtainedFrom: 'Gods and Monsters Collection',
    },
  ]

  for (const item of inventoryItems) {
    await prisma.inventoryItem.create({
      data: {
        ...item,
        floatValue: generateFloat(item.wear),
      },
    })
  }

  console.log(`Skapade ${inventoryItems.length} inventory items`)

  // Skapa case opens (historik)
  const caseOpens = [
    {
      playerId: players[0].id,
      caseName: 'Gamma Case',
      caseId: 1,
      itemId: 2001,
      itemName: 'Karambit | Doppler',
      itemWeapon: 'Karambit',
      itemWear: 'FN',
      floatValue: 0.015,
      soulsCost: 500,
    },
    {
      playerId: players[1].id,
      caseName: 'Glove Case',
      caseId: 2,
      itemId: 3001,
      itemName: 'Sport Gloves | Pandoras Box',
      itemWeapon: 'Gloves',
      itemWear: 'FT',
      floatValue: 0.25,
      soulsCost: 750,
    },
    {
      playerId: players[4].id,
      caseName: 'Operation Breakout Case',
      caseId: 3,
      itemId: 2002,
      itemName: 'Butterfly Knife | Fade',
      itemWeapon: 'Butterfly Knife',
      itemWear: 'FN',
      floatValue: 0.008,
      soulsCost: 500,
    },
  ]

  for (const caseOpen of caseOpens) {
    await prisma.caseOpen.create({ data: caseOpen })
  }

  console.log(`Skapade ${caseOpens.length} case opens`)

  // Skapa soul transactions
  const transactions = [
    // xNightmare
    { playerId: players[0].id, amount: 5000, type: 'bonus', description: 'Välkomstbonus', balanceAfter: 5000 },
    { playerId: players[0].id, amount: 10000, type: 'playtime', description: 'Speltidetbelöning', balanceAfter: 15000 },
    { playerId: players[0].id, amount: -500, type: 'case_open', description: 'Öppnade Gamma Case', balanceAfter: 14500 },
    { playerId: players[0].id, amount: 920, type: 'kill', description: 'Kills på Surf #1', balanceAfter: 15420 },
    // SurfGod420
    { playerId: players[1].id, amount: 5000, type: 'bonus', description: 'Välkomstbonus', balanceAfter: 5000 },
    { playerId: players[1].id, amount: 4500, type: 'playtime', description: 'Speltidetbelöning', balanceAfter: 9500 },
    { playerId: players[1].id, amount: -750, type: 'case_open', description: 'Öppnade Glove Case', balanceAfter: 8750 },
    // ProAwper
    { playerId: players[4].id, amount: 10000, type: 'bonus', description: 'Välkomstbonus', balanceAfter: 10000 },
    { playerId: players[4].id, amount: 15000, type: 'playtime', description: 'Speltidetbelöning', balanceAfter: 25000 },
    { playerId: players[4].id, amount: -500, type: 'case_open', description: 'Öppnade Operation Breakout Case', balanceAfter: 24500 },
    { playerId: players[4].id, amount: -2400, type: 'case_open', description: 'Diverse case opens', balanceAfter: 22100 },
  ]

  for (const tx of transactions) {
    await prisma.soulTransaction.create({ data: tx })
  }

  console.log(`Skapade ${transactions.length} soul transactions`)

  console.log('Seeding klar!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
