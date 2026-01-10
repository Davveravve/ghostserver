'use client'

import { Fragment, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import type { InventoryItem, Wear } from '@/types'

interface ItemModalProps {
  inventoryItem: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onDelete?: (itemId: string) => Promise<boolean>
}

const wearColors: Record<Wear, { text: string; bg: string; border: string }> = {
  FN: { text: 'text-green-400', bg: 'bg-green-400', border: 'border-green-400' },
  MW: { text: 'text-lime-400', bg: 'bg-lime-400', border: 'border-lime-400' },
  FT: { text: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400' },
  WW: { text: 'text-orange-400', bg: 'bg-orange-400', border: 'border-orange-400' },
  BS: { text: 'text-red-400', bg: 'bg-red-400', border: 'border-red-400' },
}

const wearLabels: Record<Wear, string> = {
  FN: 'Factory New',
  MW: 'Minimal Wear',
  FT: 'Field-Tested',
  WW: 'Well-Worn',
  BS: 'Battle-Scarred',
}

// Weapons that can be equipped on both CT and T side
const BOTH_SIDES_WEAPONS = [
  'Desert Eagle', 'R8 Revolver', 'CZ75-Auto', 'Zeus x27',
  'Nova', 'XM1014', 'MAG-7', 'Sawed-Off', 'M249', 'Negev',
  'MP9', 'MAC-10', 'PP-Bizon', 'MP7', 'UMP-45', 'P90', 'MP5-SD'
]

export function ItemModal({ inventoryItem, isOpen, onClose, onDelete }: ItemModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!inventoryItem) return null

  const { item } = inventoryItem
  const colors = wearColors[item.wear]
  const isKnifeOrGloves = item.type === 'knife' || item.type === 'gloves'

  const handleDelete = async () => {
    if (!onDelete || !('rawId' in inventoryItem)) return

    setIsDeleting(true)
    const success = await onDelete((inventoryItem as any).rawId)
    setIsDeleting(false)

    if (success) {
      setShowDeleteConfirm(false)
      onClose()
    }
  }

  const handleClose = () => {
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className={cn(
                'bg-ghost-card border rounded-xl max-w-md w-full overflow-hidden',
                `${colors.border}/50`
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Wear bar */}
              <div className={cn('h-1', colors.bg)} />

              {/* Content */}
              <div className="p-6">
                {/* Item display */}
                <div className="text-center mb-6">
                  <div
                    className={cn(
                      'w-32 h-32 mx-auto rounded-xl mb-4 flex items-center justify-center overflow-hidden',
                      `${colors.bg}/20`
                    )}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-6xl text-gray-500">?</span>
                    )}
                  </div>

                  <div className="text-gray-400 text-sm mb-1">
                    {item.weapon || item.type}
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {item.name}
                  </h2>
                  {isKnifeOrGloves && (
                    <span className="text-yellow-400 text-sm">★ Special Item</span>
                  )}
                  <div
                    className={cn(
                      'mt-2 px-3 py-1 rounded-full inline-block text-sm font-medium',
                      `${colors.bg}/20`,
                      colors.text
                    )}
                  >
                    {wearLabels[item.wear]}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
                  <DetailRow label="Type" value={item.type} />
                  {item.weapon && <DetailRow label="Weapon" value={item.weapon} />}
                  <DetailRow label="Float Range" value={`${item.min_float.toFixed(2)} - ${item.max_float.toFixed(2)}`} />
                  <DetailRow
                    label="Obtained"
                    value={new Date(inventoryItem.obtained_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  />
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {showDeleteConfirm ? (
                    // Delete confirmation
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <p className="text-red-400 text-sm mb-3 text-center">
                        Are you sure you want to delete this item? This cannot be undone.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          className="bg-red-600 hover:bg-red-700 border-red-600"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {inventoryItem.is_equipped ? (
                        <Button variant="secondary" className="w-full">
                          Unequip
                        </Button>
                      ) : (
                        <>
                          {(isKnifeOrGloves || BOTH_SIDES_WEAPONS.includes(item.weapon)) ? (
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="secondary" className="flex items-center justify-center gap-2 border-blue-500/50 hover:bg-blue-500/20">
                                <span className="text-blue-400 font-bold">CT</span> Equip
                              </Button>
                              <Button variant="secondary" className="flex items-center justify-center gap-2 border-yellow-500/50 hover:bg-yellow-500/20">
                                <span className="text-yellow-400 font-bold">T</span> Equip
                              </Button>
                            </div>
                          ) : (
                            <Button variant="primary" className="w-full">
                              Equip
                            </Button>
                          )}
                        </>
                      )}
                      {onDelete && (
                        <Button
                          variant="secondary"
                          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
                          </svg>
                          Delete Item
                        </Button>
                      )}
                      <Button variant="ghost" className="w-full" onClick={handleClose}>
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium capitalize">{value}</span>
    </div>
  )
}
