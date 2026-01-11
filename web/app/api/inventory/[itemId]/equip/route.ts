import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { getPaintKit, getWeaponDefIndex, knifeDefIndex } from '@/lib/paint-kits'

// Knife name to CS2 weapon name mapping
const knifeNameToWeapon: Record<string, string> = {
  'Karambit': 'weapon_knife_karambit',
  'M9 Bayonet': 'weapon_knife_m9_bayonet',
  'Bayonet': 'weapon_knife_bayonet',
  'Butterfly Knife': 'weapon_knife_butterfly',
  'Flip Knife': 'weapon_knife_flip',
  'Gut Knife': 'weapon_knife_gut',
  'Huntsman Knife': 'weapon_knife_tactical',
  'Falchion Knife': 'weapon_knife_falchion',
  'Bowie Knife': 'weapon_knife_survival_bowie',
  'Shadow Daggers': 'weapon_knife_push',
  'Navaja Knife': 'weapon_knife_gypsy_jackknife',
  'Stiletto Knife': 'weapon_knife_stiletto',
  'Talon Knife': 'weapon_knife_widowmaker',
  'Ursus Knife': 'weapon_knife_ursus',
  'Classic Knife': 'weapon_knife_css',
  'Paracord Knife': 'weapon_knife_cord',
  'Survival Knife': 'weapon_knife_canis',
  'Nomad Knife': 'weapon_knife_outdoor',
  'Skeleton Knife': 'weapon_knife_skeleton',
  'Kukri Knife': 'weapon_knife_kukri',
}

// Sync to WeaponPaints database tables
async function syncToWeaponPaints(
  steamId: string,
  item: { weapon: string; skinName: string; floatValue: number; itemType: string },
  team: 'ct' | 't' | 'both'
) {
  try {
    const paintKit = getPaintKit(item.weapon, item.skinName)
    const isKnife = item.itemType === 'knife'

    // WeaponPaints uses: 2 = T, 3 = CT
    const teams: number[] = []
    if (team === 'ct' || team === 'both') teams.push(3)
    if (team === 't' || team === 'both') teams.push(2)

    if (isKnife) {
      // Get knife weapon name and def index
      const knifeWeaponName = knifeNameToWeapon[item.weapon] || 'weapon_knife'
      const knifeDefIdx = knifeDefIndex[item.weapon] || 500

      for (const weaponTeam of teams) {
        // Update wp_player_knife table
        await prisma.$executeRaw`
          INSERT INTO wp_player_knife (steamid, weapon_team, knife)
          VALUES (${steamId}, ${weaponTeam}, ${knifeWeaponName})
          ON DUPLICATE KEY UPDATE knife = ${knifeWeaponName}
        `

        // Also update wp_player_skins with the knife skin
        await prisma.$executeRaw`
          INSERT INTO wp_player_skins (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed)
          VALUES (${steamId}, ${weaponTeam}, ${knifeDefIdx}, ${paintKit}, ${item.floatValue}, 0)
          ON DUPLICATE KEY UPDATE
            weapon_paint_id = ${paintKit},
            weapon_wear = ${item.floatValue}
        `
      }
    } else {
      // Regular weapon skin
      const weaponDefIdx = getWeaponDefIndex(item.weapon)

      for (const weaponTeam of teams) {
        await prisma.$executeRaw`
          INSERT INTO wp_player_skins (steamid, weapon_team, weapon_defindex, weapon_paint_id, weapon_wear, weapon_seed)
          VALUES (${steamId}, ${weaponTeam}, ${weaponDefIdx}, ${paintKit}, ${item.floatValue}, 0)
          ON DUPLICATE KEY UPDATE
            weapon_paint_id = ${paintKit},
            weapon_wear = ${item.floatValue}
        `
      }
    }

    console.log(`[WeaponPaints] Synced ${item.weapon} | ${item.skinName} (PK=${paintKit}) for ${steamId}`)
  } catch (error) {
    console.error('[WeaponPaints] Sync error:', error)
    // Don't throw - this is a secondary operation
  }
}

// Remove from WeaponPaints database
async function removeFromWeaponPaints(
  steamId: string,
  item: { weapon: string; itemType: string }
) {
  try {
    const isKnife = item.itemType === 'knife'

    if (isKnife) {
      // Delete knife entries for both teams
      await prisma.$executeRaw`
        DELETE FROM wp_player_knife WHERE steamid = ${steamId}
      `
      // Also delete knife skins
      const knifeDefIdx = knifeDefIndex[item.weapon] || 500
      await prisma.$executeRaw`
        DELETE FROM wp_player_skins
        WHERE steamid = ${steamId} AND weapon_defindex = ${knifeDefIdx}
      `
    } else {
      // Delete regular weapon skin
      const weaponDefIdx = getWeaponDefIndex(item.weapon)
      await prisma.$executeRaw`
        DELETE FROM wp_player_skins
        WHERE steamid = ${steamId} AND weapon_defindex = ${weaponDefIdx}
      `
    }

    console.log(`[WeaponPaints] Removed ${item.weapon} for ${steamId}`)
  } catch (error) {
    console.error('[WeaponPaints] Remove error:', error)
  }
}

// Equip an inventory item for CT, T, or both teams
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const token = request.cookies.get('ghost-session')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify token
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'your-secret-key'
    )
    const { payload } = await jwtVerify(token, secret)
    const steamId = payload.steamId as string

    const { itemId } = await params
    const body = await request.json()
    const team = body.team as 'ct' | 't' | 'both'

    if (!team || !['ct', 't', 'both'].includes(team)) {
      return NextResponse.json({ error: 'Invalid team' }, { status: 400 })
    }

    // Find player
    const player = await prisma.player.findUnique({
      where: { steamId },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Find the inventory item and verify ownership
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        playerId: player.id,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Unequip other items of the same weapon type for the selected team(s)
    const unequipCt = team === 'ct' || team === 'both'
    const unequipT = team === 't' || team === 'both'

    // Check if this is a knife or gloves (they share slots within their type)
    const isKnife = item.itemType === 'knife'
    const isGloves = item.itemType === 'gloves'

    if (unequipCt) {
      if (isKnife) {
        // Unequip ALL knives for CT
        await prisma.inventoryItem.updateMany({
          where: {
            playerId: player.id,
            itemType: 'knife',
            equippedCt: true,
            id: { not: itemId },
          },
          data: { equippedCt: false },
        })
      } else if (isGloves) {
        // Unequip ALL gloves for CT
        await prisma.inventoryItem.updateMany({
          where: {
            playerId: player.id,
            itemType: 'gloves',
            equippedCt: true,
            id: { not: itemId },
          },
          data: { equippedCt: false },
        })
      } else {
        // Unequip same weapon type for CT
        await prisma.inventoryItem.updateMany({
          where: {
            playerId: player.id,
            weapon: item.weapon,
            equippedCt: true,
            id: { not: itemId },
          },
          data: { equippedCt: false },
        })
      }
    }

    if (unequipT) {
      if (isKnife) {
        // Unequip ALL knives for T
        await prisma.inventoryItem.updateMany({
          where: {
            playerId: player.id,
            itemType: 'knife',
            equippedT: true,
            id: { not: itemId },
          },
          data: { equippedT: false },
        })
      } else if (isGloves) {
        // Unequip ALL gloves for T
        await prisma.inventoryItem.updateMany({
          where: {
            playerId: player.id,
            itemType: 'gloves',
            equippedT: true,
            id: { not: itemId },
          },
          data: { equippedT: false },
        })
      } else {
        // Unequip same weapon type for T
        await prisma.inventoryItem.updateMany({
          where: {
            playerId: player.id,
            weapon: item.weapon,
            equippedT: true,
            id: { not: itemId },
          },
          data: { equippedT: false },
        })
      }
    }

    // Equip the item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        equippedCt: unequipCt ? true : item.equippedCt,
        equippedT: unequipT ? true : item.equippedT,
      },
    })

    // Sync to WeaponPaints tables (for CS2 skinchanger)
    await syncToWeaponPaints(steamId, item, team)

    return NextResponse.json({
      success: true,
      weapon: item.weapon,
      equippedCt: updatedItem.equippedCt,
      equippedT: updatedItem.equippedT,
    })
  } catch (error) {
    console.error('Failed to equip item:', error)
    return NextResponse.json(
      { error: 'Failed to equip item' },
      { status: 500 }
    )
  }
}

// Unequip an inventory item from both teams
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const token = request.cookies.get('ghost-session')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify token
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'your-secret-key'
    )
    const { payload } = await jwtVerify(token, secret)
    const steamId = payload.steamId as string

    const { itemId } = await params

    // Find player
    const player = await prisma.player.findUnique({
      where: { steamId },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Find the inventory item and verify ownership
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        playerId: player.id,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Unequip the item
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        equippedCt: false,
        equippedT: false,
      },
    })

    // Remove from WeaponPaints tables
    await removeFromWeaponPaints(steamId, item)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to unequip item:', error)
    return NextResponse.json(
      { error: 'Failed to unequip item' },
      { status: 500 }
    )
  }
}
