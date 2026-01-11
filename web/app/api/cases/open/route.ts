import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { getCaseById, getCaseItems } from '@/lib/items-data'
import { getRarityFromType } from '@/lib/item-utils'
import { sendRareDropToDiscord } from '@/lib/discord'

export async function POST(request: NextRequest) {
  const token = request.cookies.get('ghost-session')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'your-secret-key'
    )
    const { payload } = await jwtVerify(token, secret)
    const steamId = payload.steamId as string

    const { caseId } = await request.json()

    // Hämta case data SERVER-SIDE
    const caseData = getCaseById(caseId)
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const player = await prisma.player.findUnique({
      where: { steamId },
    })

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    if (player.souls < caseData.cost) {
      return NextResponse.json({ error: 'Not enough souls' }, { status: 400 })
    }

    // VÄLJ VINNARE SERVER-SIDE (kan inte fuskas!)
    const items = getCaseItems(caseId)
    console.log('Items count for case', caseId, ':', items.length)

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in case' }, { status: 500 })
    }

    const winnerIndex = Math.floor(Math.random() * items.length)
    const wonItem = items[winnerIndex]
    const floatValue = wonItem.min_float + Math.random() * (wonItem.max_float - wonItem.min_float)

    // Kör allt i en transaktion
    const result = await prisma.$transaction(async (tx) => {
      // 1. Dra av souls och öka casesOpened
      const updatedPlayer = await tx.player.update({
        where: { id: player.id },
        data: {
          souls: { decrement: caseData.cost },
          casesOpened: { increment: 1 },
        },
      })

      // 2. Skapa inventory item med rarity baserat på item type
      const rarity = getRarityFromType(wonItem.type)
      const inventoryItem = await tx.inventoryItem.create({
        data: {
          playerId: player.id,
          itemId: wonItem.id,
          name: wonItem.name,
          weapon: wonItem.weapon,
          skinName: wonItem.name, // skin name is stored in name field
          wear: wonItem.wear,
          floatValue: floatValue,
          imageUrl: wonItem.image_url,
          dopplerPhase: wonItem.doppler_phase || null,
          itemType: wonItem.type,
          rarity: rarity,
          obtainedFrom: caseData.name,
        },
      })

      // 3. Logga case open
      await tx.caseOpen.create({
        data: {
          playerId: player.id,
          caseName: caseData.name,
          caseId,
          itemId: wonItem.id,
          itemName: wonItem.name,
          itemWeapon: wonItem.weapon,
          itemWear: wonItem.wear,
          floatValue: floatValue,
          soulsCost: caseData.cost,
        },
      })

      // 4. Logga soul transaction
      await tx.soulTransaction.create({
        data: {
          playerId: player.id,
          amount: -caseData.cost,
          type: 'case_open',
          description: `Opened ${caseData.name}`,
          balanceAfter: updatedPlayer.souls,
        },
      })

      return { updatedPlayer, inventoryItem, rarity }
    })

    // Send rare drop notification to Discord (async, don't wait)
    const isKnife = wonItem.weapon?.includes('Knife') || wonItem.weapon?.includes('Karambit') || wonItem.weapon?.includes('Bayonet')
    const isGloves = wonItem.weapon?.includes('Gloves')

    if (result.rarity === 'legendary' || result.rarity === 'ultra' || isKnife || isGloves) {
      sendRareDropToDiscord({
        playerName: player.username,
        steamId: player.steamId,
        itemName: wonItem.name,
        weaponName: wonItem.weapon,
        wear: wonItem.wear,
        floatValue: floatValue,
        rarity: result.rarity,
        isKnife,
        isGloves,
        imageUrl: wonItem.image_url,
      }).catch(err => console.error('Discord webhook failed:', err))
    }

    return NextResponse.json({
      success: true,
      newBalance: result.updatedPlayer.souls,
      inventoryItem: result.inventoryItem,
      wonItem: {
        ...wonItem,
        floatValue: floatValue,
      },
      winnerIndex: winnerIndex,
    })
  } catch (error) {
    console.error('Failed to open case:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to open case', details: errorMessage },
      { status: 500 }
    )
  }
}
