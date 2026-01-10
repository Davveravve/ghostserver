// CS2 Skin Price Database - Realistic market prices in Souls
// Based on Steam Market / BUFF163 prices (1 Soul ~= $1 USD)
// Prices are for the base wear, multipliers applied for other wears

import type { Wear } from '@/types'

// Price entry: [FT base price, price tier]
// Tier affects wear multipliers: 'budget' | 'mid' | 'high' | 'premium' | 'elite'
type PriceTier = 'budget' | 'mid' | 'high' | 'premium' | 'elite'

interface SkinPrice {
  price: number  // Base price (FT equivalent)
  tier: PriceTier
}

// Wear multipliers by tier (FT = 1.0 baseline)
const wearMultipliersByTier: Record<PriceTier, Record<Wear, number>> = {
  budget: { FN: 1.3, MW: 1.1, FT: 1.0, WW: 0.85, BS: 0.7 },
  mid: { FN: 1.5, MW: 1.2, FT: 1.0, WW: 0.8, BS: 0.6 },
  high: { FN: 1.8, MW: 1.3, FT: 1.0, WW: 0.7, BS: 0.5 },
  premium: { FN: 2.5, MW: 1.5, FT: 1.0, WW: 0.6, BS: 0.4 },
  elite: { FN: 3.0, MW: 1.8, FT: 1.0, WW: 0.5, BS: 0.3 },
}

// Skin prices by "weapon|name" key
// Format: { price: base FT price, tier: affects wear scaling }
export const skinPrices: Record<string, SkinPrice> = {
  // ==========================================
  // KNIVES - Base prices (non-Doppler)
  // ==========================================

  // Karambit
  'Karambit|Doppler': { price: 500, tier: 'elite' },
  'Karambit|Fade': { price: 1800, tier: 'elite' },
  'Karambit|Marble Fade': { price: 1500, tier: 'elite' },
  'Karambit|Tiger Tooth': { price: 1100, tier: 'premium' },
  'Karambit|Gamma Doppler': { price: 1200, tier: 'elite' },
  'Karambit|Lore': { price: 900, tier: 'premium' },
  'Karambit|Autotronic': { price: 700, tier: 'premium' },
  'Karambit|Slaughter': { price: 650, tier: 'premium' },
  'Karambit|Crimson Web': { price: 800, tier: 'elite' },
  'Karambit|Case Hardened': { price: 600, tier: 'elite' },
  'Karambit|Vanilla': { price: 750, tier: 'mid' },
  'Karambit|Damascus Steel': { price: 500, tier: 'high' },
  'Karambit|Ultraviolet': { price: 450, tier: 'high' },
  'Karambit|Night': { price: 400, tier: 'high' },
  'Karambit|Blue Steel': { price: 420, tier: 'high' },
  'Karambit|Rust Coat': { price: 380, tier: 'mid' },
  'Karambit|Stained': { price: 350, tier: 'mid' },
  'Karambit|Scorched': { price: 320, tier: 'mid' },
  'Karambit|Urban Masked': { price: 310, tier: 'mid' },
  'Karambit|Safari Mesh': { price: 300, tier: 'budget' },
  'Karambit|Boreal Forest': { price: 300, tier: 'budget' },
  'Karambit|Forest DDPAT': { price: 300, tier: 'budget' },

  // Butterfly Knife
  'Butterfly Knife|Doppler': { price: 900, tier: 'elite' },
  'Butterfly Knife|Fade': { price: 2200, tier: 'elite' },
  'Butterfly Knife|Marble Fade': { price: 1800, tier: 'elite' },
  'Butterfly Knife|Tiger Tooth': { price: 1400, tier: 'premium' },
  'Butterfly Knife|Gamma Doppler': { price: 1500, tier: 'elite' },
  'Butterfly Knife|Lore': { price: 1100, tier: 'premium' },
  'Butterfly Knife|Slaughter': { price: 900, tier: 'premium' },
  'Butterfly Knife|Crimson Web': { price: 1000, tier: 'elite' },
  'Butterfly Knife|Case Hardened': { price: 800, tier: 'elite' },
  'Butterfly Knife|Vanilla': { price: 1100, tier: 'mid' },
  'Butterfly Knife|Autotronic': { price: 850, tier: 'premium' },
  'Butterfly Knife|Damascus Steel': { price: 700, tier: 'high' },
  'Butterfly Knife|Ultraviolet': { price: 650, tier: 'high' },
  'Butterfly Knife|Night': { price: 600, tier: 'high' },
  'Butterfly Knife|Blue Steel': { price: 620, tier: 'high' },
  'Butterfly Knife|Rust Coat': { price: 550, tier: 'mid' },
  'Butterfly Knife|Stained': { price: 520, tier: 'mid' },
  'Butterfly Knife|Scorched': { price: 480, tier: 'mid' },
  'Butterfly Knife|Urban Masked': { price: 470, tier: 'mid' },
  'Butterfly Knife|Safari Mesh': { price: 450, tier: 'budget' },
  'Butterfly Knife|Boreal Forest': { price: 450, tier: 'budget' },
  'Butterfly Knife|Forest DDPAT': { price: 450, tier: 'budget' },

  // M9 Bayonet
  'M9 Bayonet|Doppler': { price: 420, tier: 'elite' },
  'M9 Bayonet|Fade': { price: 1100, tier: 'elite' },
  'M9 Bayonet|Marble Fade': { price: 900, tier: 'elite' },
  'M9 Bayonet|Tiger Tooth': { price: 700, tier: 'premium' },
  'M9 Bayonet|Gamma Doppler': { price: 750, tier: 'elite' },
  'M9 Bayonet|Lore': { price: 600, tier: 'premium' },
  'M9 Bayonet|Slaughter': { price: 500, tier: 'premium' },
  'M9 Bayonet|Crimson Web': { price: 550, tier: 'elite' },
  'M9 Bayonet|Case Hardened': { price: 450, tier: 'elite' },
  'M9 Bayonet|Vanilla': { price: 450, tier: 'mid' },
  'M9 Bayonet|Autotronic': { price: 420, tier: 'premium' },
  'M9 Bayonet|Damascus Steel': { price: 350, tier: 'high' },
  'M9 Bayonet|Ultraviolet': { price: 320, tier: 'high' },
  'M9 Bayonet|Night': { price: 300, tier: 'high' },
  'M9 Bayonet|Blue Steel': { price: 310, tier: 'high' },
  'M9 Bayonet|Rust Coat': { price: 280, tier: 'mid' },
  'M9 Bayonet|Stained': { price: 260, tier: 'mid' },
  'M9 Bayonet|Scorched': { price: 230, tier: 'mid' },
  'M9 Bayonet|Urban Masked': { price: 220, tier: 'mid' },
  'M9 Bayonet|Safari Mesh': { price: 200, tier: 'budget' },
  'M9 Bayonet|Boreal Forest': { price: 200, tier: 'budget' },
  'M9 Bayonet|Forest DDPAT': { price: 200, tier: 'budget' },

  // Bayonet
  'Bayonet|Doppler': { price: 280, tier: 'elite' },
  'Bayonet|Fade': { price: 650, tier: 'elite' },
  'Bayonet|Marble Fade': { price: 550, tier: 'elite' },
  'Bayonet|Tiger Tooth': { price: 420, tier: 'premium' },
  'Bayonet|Gamma Doppler': { price: 450, tier: 'elite' },
  'Bayonet|Lore': { price: 380, tier: 'premium' },
  'Bayonet|Slaughter': { price: 320, tier: 'premium' },
  'Bayonet|Crimson Web': { price: 350, tier: 'elite' },
  'Bayonet|Case Hardened': { price: 300, tier: 'elite' },
  'Bayonet|Vanilla': { price: 280, tier: 'mid' },
  'Bayonet|Autotronic': { price: 270, tier: 'premium' },
  'Bayonet|Damascus Steel': { price: 220, tier: 'high' },
  'Bayonet|Ultraviolet': { price: 200, tier: 'high' },
  'Bayonet|Night': { price: 180, tier: 'high' },
  'Bayonet|Blue Steel': { price: 190, tier: 'high' },
  'Bayonet|Rust Coat': { price: 170, tier: 'mid' },
  'Bayonet|Stained': { price: 160, tier: 'mid' },
  'Bayonet|Scorched': { price: 140, tier: 'mid' },
  'Bayonet|Urban Masked': { price: 135, tier: 'mid' },
  'Bayonet|Safari Mesh': { price: 120, tier: 'budget' },
  'Bayonet|Boreal Forest': { price: 120, tier: 'budget' },
  'Bayonet|Forest DDPAT': { price: 120, tier: 'budget' },

  // Flip Knife
  'Flip Knife|Doppler': { price: 220, tier: 'elite' },
  'Flip Knife|Fade': { price: 450, tier: 'elite' },
  'Flip Knife|Marble Fade': { price: 400, tier: 'elite' },
  'Flip Knife|Tiger Tooth': { price: 320, tier: 'premium' },
  'Flip Knife|Gamma Doppler': { price: 350, tier: 'elite' },
  'Flip Knife|Lore': { price: 280, tier: 'premium' },
  'Flip Knife|Slaughter': { price: 250, tier: 'premium' },
  'Flip Knife|Crimson Web': { price: 270, tier: 'elite' },
  'Flip Knife|Case Hardened': { price: 220, tier: 'elite' },
  'Flip Knife|Vanilla': { price: 200, tier: 'mid' },
  'Flip Knife|Autotronic': { price: 200, tier: 'premium' },
  'Flip Knife|Damascus Steel': { price: 160, tier: 'high' },
  'Flip Knife|Ultraviolet': { price: 150, tier: 'high' },
  'Flip Knife|Night': { price: 140, tier: 'high' },
  'Flip Knife|Blue Steel': { price: 145, tier: 'high' },
  'Flip Knife|Rust Coat': { price: 130, tier: 'mid' },
  'Flip Knife|Stained': { price: 125, tier: 'mid' },
  'Flip Knife|Scorched': { price: 110, tier: 'mid' },
  'Flip Knife|Urban Masked': { price: 105, tier: 'mid' },
  'Flip Knife|Safari Mesh': { price: 95, tier: 'budget' },
  'Flip Knife|Boreal Forest': { price: 95, tier: 'budget' },
  'Flip Knife|Forest DDPAT': { price: 95, tier: 'budget' },

  // Gut Knife
  'Gut Knife|Doppler': { price: 95, tier: 'elite' },
  'Gut Knife|Fade': { price: 200, tier: 'premium' },
  'Gut Knife|Marble Fade': { price: 180, tier: 'premium' },
  'Gut Knife|Tiger Tooth': { price: 150, tier: 'high' },
  'Gut Knife|Gamma Doppler': { price: 160, tier: 'premium' },
  'Gut Knife|Lore': { price: 140, tier: 'high' },
  'Gut Knife|Slaughter': { price: 120, tier: 'high' },
  'Gut Knife|Crimson Web': { price: 130, tier: 'premium' },
  'Gut Knife|Case Hardened': { price: 110, tier: 'premium' },
  'Gut Knife|Vanilla': { price: 100, tier: 'mid' },
  'Gut Knife|Autotronic': { price: 100, tier: 'high' },
  'Gut Knife|Damascus Steel': { price: 85, tier: 'mid' },
  'Gut Knife|Ultraviolet': { price: 80, tier: 'mid' },
  'Gut Knife|Night': { price: 75, tier: 'mid' },
  'Gut Knife|Blue Steel': { price: 78, tier: 'mid' },
  'Gut Knife|Rust Coat': { price: 70, tier: 'budget' },
  'Gut Knife|Stained': { price: 68, tier: 'budget' },
  'Gut Knife|Scorched': { price: 60, tier: 'budget' },
  'Gut Knife|Urban Masked': { price: 58, tier: 'budget' },
  'Gut Knife|Safari Mesh': { price: 55, tier: 'budget' },
  'Gut Knife|Boreal Forest': { price: 55, tier: 'budget' },
  'Gut Knife|Forest DDPAT': { price: 55, tier: 'budget' },

  // Huntsman Knife
  'Huntsman Knife|Doppler': { price: 180, tier: 'elite' },
  'Huntsman Knife|Fade': { price: 350, tier: 'elite' },
  'Huntsman Knife|Marble Fade': { price: 320, tier: 'elite' },
  'Huntsman Knife|Tiger Tooth': { price: 250, tier: 'premium' },
  'Huntsman Knife|Gamma Doppler': { price: 280, tier: 'elite' },
  'Huntsman Knife|Slaughter': { price: 200, tier: 'premium' },
  'Huntsman Knife|Crimson Web': { price: 220, tier: 'elite' },
  'Huntsman Knife|Case Hardened': { price: 180, tier: 'elite' },
  'Huntsman Knife|Vanilla': { price: 160, tier: 'mid' },
  'Huntsman Knife|Damascus Steel': { price: 130, tier: 'high' },
  'Huntsman Knife|Ultraviolet': { price: 120, tier: 'high' },
  'Huntsman Knife|Night': { price: 110, tier: 'high' },
  'Huntsman Knife|Blue Steel': { price: 115, tier: 'high' },
  'Huntsman Knife|Rust Coat': { price: 100, tier: 'mid' },
  'Huntsman Knife|Stained': { price: 95, tier: 'mid' },
  'Huntsman Knife|Scorched': { price: 85, tier: 'mid' },
  'Huntsman Knife|Urban Masked': { price: 80, tier: 'mid' },
  'Huntsman Knife|Safari Mesh': { price: 75, tier: 'budget' },
  'Huntsman Knife|Boreal Forest': { price: 75, tier: 'budget' },
  'Huntsman Knife|Forest DDPAT': { price: 75, tier: 'budget' },

  // Falchion Knife
  'Falchion Knife|Doppler': { price: 150, tier: 'elite' },
  'Falchion Knife|Fade': { price: 280, tier: 'elite' },
  'Falchion Knife|Marble Fade': { price: 250, tier: 'elite' },
  'Falchion Knife|Tiger Tooth': { price: 200, tier: 'premium' },
  'Falchion Knife|Slaughter': { price: 160, tier: 'premium' },
  'Falchion Knife|Crimson Web': { price: 180, tier: 'elite' },
  'Falchion Knife|Case Hardened': { price: 140, tier: 'elite' },
  'Falchion Knife|Vanilla': { price: 130, tier: 'mid' },
  'Falchion Knife|Damascus Steel': { price: 110, tier: 'high' },
  'Falchion Knife|Ultraviolet': { price: 100, tier: 'high' },
  'Falchion Knife|Night': { price: 90, tier: 'high' },
  'Falchion Knife|Blue Steel': { price: 95, tier: 'high' },
  'Falchion Knife|Rust Coat': { price: 85, tier: 'mid' },
  'Falchion Knife|Stained': { price: 80, tier: 'mid' },
  'Falchion Knife|Scorched': { price: 70, tier: 'mid' },
  'Falchion Knife|Urban Masked': { price: 68, tier: 'mid' },
  'Falchion Knife|Safari Mesh': { price: 65, tier: 'budget' },
  'Falchion Knife|Boreal Forest': { price: 65, tier: 'budget' },
  'Falchion Knife|Forest DDPAT': { price: 65, tier: 'budget' },

  // Bowie Knife
  'Bowie Knife|Doppler': { price: 170, tier: 'elite' },
  'Bowie Knife|Fade': { price: 320, tier: 'elite' },
  'Bowie Knife|Marble Fade': { price: 280, tier: 'elite' },
  'Bowie Knife|Tiger Tooth': { price: 220, tier: 'premium' },
  'Bowie Knife|Slaughter': { price: 180, tier: 'premium' },
  'Bowie Knife|Crimson Web': { price: 200, tier: 'elite' },
  'Bowie Knife|Case Hardened': { price: 160, tier: 'elite' },
  'Bowie Knife|Vanilla': { price: 140, tier: 'mid' },
  'Bowie Knife|Damascus Steel': { price: 120, tier: 'high' },
  'Bowie Knife|Ultraviolet': { price: 110, tier: 'high' },
  'Bowie Knife|Night': { price: 100, tier: 'high' },
  'Bowie Knife|Blue Steel': { price: 105, tier: 'high' },
  'Bowie Knife|Rust Coat': { price: 95, tier: 'mid' },
  'Bowie Knife|Stained': { price: 90, tier: 'mid' },
  'Bowie Knife|Scorched': { price: 80, tier: 'mid' },
  'Bowie Knife|Urban Masked': { price: 78, tier: 'mid' },
  'Bowie Knife|Safari Mesh': { price: 72, tier: 'budget' },
  'Bowie Knife|Boreal Forest': { price: 72, tier: 'budget' },
  'Bowie Knife|Forest DDPAT': { price: 72, tier: 'budget' },

  // Shadow Daggers
  'Shadow Daggers|Doppler': { price: 95, tier: 'elite' },
  'Shadow Daggers|Fade': { price: 200, tier: 'premium' },
  'Shadow Daggers|Marble Fade': { price: 180, tier: 'premium' },
  'Shadow Daggers|Tiger Tooth': { price: 140, tier: 'high' },
  'Shadow Daggers|Slaughter': { price: 120, tier: 'high' },
  'Shadow Daggers|Crimson Web': { price: 130, tier: 'premium' },
  'Shadow Daggers|Case Hardened': { price: 100, tier: 'premium' },
  'Shadow Daggers|Vanilla': { price: 90, tier: 'mid' },
  'Shadow Daggers|Damascus Steel': { price: 75, tier: 'mid' },
  'Shadow Daggers|Ultraviolet': { price: 70, tier: 'mid' },
  'Shadow Daggers|Night': { price: 65, tier: 'mid' },
  'Shadow Daggers|Blue Steel': { price: 68, tier: 'mid' },
  'Shadow Daggers|Rust Coat': { price: 60, tier: 'budget' },
  'Shadow Daggers|Stained': { price: 58, tier: 'budget' },
  'Shadow Daggers|Scorched': { price: 52, tier: 'budget' },
  'Shadow Daggers|Urban Masked': { price: 50, tier: 'budget' },
  'Shadow Daggers|Safari Mesh': { price: 48, tier: 'budget' },
  'Shadow Daggers|Boreal Forest': { price: 48, tier: 'budget' },
  'Shadow Daggers|Forest DDPAT': { price: 48, tier: 'budget' },

  // Navaja Knife
  'Navaja Knife|Doppler': { price: 85, tier: 'elite' },
  'Navaja Knife|Fade': { price: 180, tier: 'premium' },
  'Navaja Knife|Marble Fade': { price: 160, tier: 'premium' },
  'Navaja Knife|Tiger Tooth': { price: 130, tier: 'high' },
  'Navaja Knife|Slaughter': { price: 110, tier: 'high' },
  'Navaja Knife|Crimson Web': { price: 120, tier: 'premium' },
  'Navaja Knife|Case Hardened': { price: 95, tier: 'premium' },
  'Navaja Knife|Vanilla': { price: 85, tier: 'mid' },
  'Navaja Knife|Damascus Steel': { price: 70, tier: 'mid' },
  'Navaja Knife|Ultraviolet': { price: 65, tier: 'mid' },
  'Navaja Knife|Night': { price: 60, tier: 'mid' },
  'Navaja Knife|Blue Steel': { price: 62, tier: 'mid' },
  'Navaja Knife|Rust Coat': { price: 55, tier: 'budget' },
  'Navaja Knife|Stained': { price: 52, tier: 'budget' },
  'Navaja Knife|Scorched': { price: 48, tier: 'budget' },
  'Navaja Knife|Urban Masked': { price: 46, tier: 'budget' },
  'Navaja Knife|Safari Mesh': { price: 44, tier: 'budget' },
  'Navaja Knife|Boreal Forest': { price: 44, tier: 'budget' },
  'Navaja Knife|Forest DDPAT': { price: 44, tier: 'budget' },

  // Stiletto Knife
  'Stiletto Knife|Doppler': { price: 180, tier: 'elite' },
  'Stiletto Knife|Fade': { price: 350, tier: 'elite' },
  'Stiletto Knife|Marble Fade': { price: 300, tier: 'elite' },
  'Stiletto Knife|Tiger Tooth': { price: 240, tier: 'premium' },
  'Stiletto Knife|Slaughter': { price: 190, tier: 'premium' },
  'Stiletto Knife|Crimson Web': { price: 210, tier: 'elite' },
  'Stiletto Knife|Case Hardened': { price: 170, tier: 'elite' },
  'Stiletto Knife|Vanilla': { price: 150, tier: 'mid' },
  'Stiletto Knife|Damascus Steel': { price: 125, tier: 'high' },
  'Stiletto Knife|Ultraviolet': { price: 115, tier: 'high' },
  'Stiletto Knife|Night': { price: 105, tier: 'high' },
  'Stiletto Knife|Blue Steel': { price: 110, tier: 'high' },
  'Stiletto Knife|Rust Coat': { price: 95, tier: 'mid' },
  'Stiletto Knife|Stained': { price: 90, tier: 'mid' },
  'Stiletto Knife|Scorched': { price: 82, tier: 'mid' },
  'Stiletto Knife|Urban Masked': { price: 80, tier: 'mid' },
  'Stiletto Knife|Safari Mesh': { price: 75, tier: 'budget' },
  'Stiletto Knife|Boreal Forest': { price: 75, tier: 'budget' },
  'Stiletto Knife|Forest DDPAT': { price: 75, tier: 'budget' },

  // Talon Knife
  'Talon Knife|Doppler': { price: 280, tier: 'elite' },
  'Talon Knife|Fade': { price: 550, tier: 'elite' },
  'Talon Knife|Marble Fade': { price: 480, tier: 'elite' },
  'Talon Knife|Tiger Tooth': { price: 380, tier: 'premium' },
  'Talon Knife|Slaughter': { price: 300, tier: 'premium' },
  'Talon Knife|Crimson Web': { price: 340, tier: 'elite' },
  'Talon Knife|Case Hardened': { price: 270, tier: 'elite' },
  'Talon Knife|Vanilla': { price: 250, tier: 'mid' },
  'Talon Knife|Damascus Steel': { price: 200, tier: 'high' },
  'Talon Knife|Ultraviolet': { price: 185, tier: 'high' },
  'Talon Knife|Night': { price: 170, tier: 'high' },
  'Talon Knife|Blue Steel': { price: 175, tier: 'high' },
  'Talon Knife|Rust Coat': { price: 155, tier: 'mid' },
  'Talon Knife|Stained': { price: 145, tier: 'mid' },
  'Talon Knife|Scorched': { price: 130, tier: 'mid' },
  'Talon Knife|Urban Masked': { price: 125, tier: 'mid' },
  'Talon Knife|Safari Mesh': { price: 120, tier: 'budget' },
  'Talon Knife|Boreal Forest': { price: 120, tier: 'budget' },
  'Talon Knife|Forest DDPAT': { price: 120, tier: 'budget' },

  // Ursus Knife
  'Ursus Knife|Doppler': { price: 200, tier: 'elite' },
  'Ursus Knife|Fade': { price: 380, tier: 'elite' },
  'Ursus Knife|Marble Fade': { price: 330, tier: 'elite' },
  'Ursus Knife|Tiger Tooth': { price: 260, tier: 'premium' },
  'Ursus Knife|Slaughter': { price: 210, tier: 'premium' },
  'Ursus Knife|Crimson Web': { price: 230, tier: 'elite' },
  'Ursus Knife|Case Hardened': { price: 190, tier: 'elite' },
  'Ursus Knife|Vanilla': { price: 170, tier: 'mid' },
  'Ursus Knife|Damascus Steel': { price: 140, tier: 'high' },
  'Ursus Knife|Ultraviolet': { price: 130, tier: 'high' },
  'Ursus Knife|Night': { price: 120, tier: 'high' },
  'Ursus Knife|Blue Steel': { price: 125, tier: 'high' },
  'Ursus Knife|Rust Coat': { price: 110, tier: 'mid' },
  'Ursus Knife|Stained': { price: 100, tier: 'mid' },
  'Ursus Knife|Scorched': { price: 90, tier: 'mid' },
  'Ursus Knife|Urban Masked': { price: 88, tier: 'mid' },
  'Ursus Knife|Safari Mesh': { price: 82, tier: 'budget' },
  'Ursus Knife|Boreal Forest': { price: 82, tier: 'budget' },
  'Ursus Knife|Forest DDPAT': { price: 82, tier: 'budget' },

  // Classic Knife
  'Classic Knife|Fade': { price: 420, tier: 'elite' },
  'Classic Knife|Slaughter': { price: 250, tier: 'premium' },
  'Classic Knife|Crimson Web': { price: 280, tier: 'elite' },
  'Classic Knife|Case Hardened': { price: 220, tier: 'elite' },
  'Classic Knife|Vanilla': { price: 200, tier: 'mid' },
  'Classic Knife|Blue Steel': { price: 150, tier: 'high' },
  'Classic Knife|Night': { price: 140, tier: 'high' },
  'Classic Knife|Stained': { price: 120, tier: 'mid' },
  'Classic Knife|Scorched': { price: 100, tier: 'mid' },
  'Classic Knife|Urban Masked': { price: 98, tier: 'mid' },
  'Classic Knife|Safari Mesh': { price: 92, tier: 'budget' },
  'Classic Knife|Boreal Forest': { price: 92, tier: 'budget' },
  'Classic Knife|Forest DDPAT': { price: 92, tier: 'budget' },

  // Paracord Knife
  'Paracord Knife|Fade': { price: 400, tier: 'elite' },
  'Paracord Knife|Slaughter': { price: 230, tier: 'premium' },
  'Paracord Knife|Crimson Web': { price: 260, tier: 'elite' },
  'Paracord Knife|Case Hardened': { price: 200, tier: 'elite' },
  'Paracord Knife|Vanilla': { price: 180, tier: 'mid' },
  'Paracord Knife|Blue Steel': { price: 135, tier: 'high' },
  'Paracord Knife|Night': { price: 125, tier: 'high' },
  'Paracord Knife|Stained': { price: 110, tier: 'mid' },
  'Paracord Knife|Scorched': { price: 95, tier: 'mid' },
  'Paracord Knife|Safari Mesh': { price: 88, tier: 'budget' },
  'Paracord Knife|Boreal Forest': { price: 88, tier: 'budget' },
  'Paracord Knife|Forest DDPAT': { price: 88, tier: 'budget' },

  // Survival Knife
  'Survival Knife|Fade': { price: 380, tier: 'elite' },
  'Survival Knife|Slaughter': { price: 220, tier: 'premium' },
  'Survival Knife|Crimson Web': { price: 250, tier: 'elite' },
  'Survival Knife|Case Hardened': { price: 190, tier: 'elite' },
  'Survival Knife|Vanilla': { price: 170, tier: 'mid' },
  'Survival Knife|Blue Steel': { price: 130, tier: 'high' },
  'Survival Knife|Night': { price: 120, tier: 'high' },
  'Survival Knife|Stained': { price: 105, tier: 'mid' },
  'Survival Knife|Scorched': { price: 92, tier: 'mid' },
  'Survival Knife|Safari Mesh': { price: 85, tier: 'budget' },
  'Survival Knife|Boreal Forest': { price: 85, tier: 'budget' },
  'Survival Knife|Forest DDPAT': { price: 85, tier: 'budget' },

  // Nomad Knife
  'Nomad Knife|Fade': { price: 450, tier: 'elite' },
  'Nomad Knife|Slaughter': { price: 270, tier: 'premium' },
  'Nomad Knife|Crimson Web': { price: 300, tier: 'elite' },
  'Nomad Knife|Case Hardened': { price: 240, tier: 'elite' },
  'Nomad Knife|Vanilla': { price: 220, tier: 'mid' },
  'Nomad Knife|Blue Steel': { price: 170, tier: 'high' },
  'Nomad Knife|Night': { price: 155, tier: 'high' },
  'Nomad Knife|Stained': { price: 140, tier: 'mid' },
  'Nomad Knife|Scorched': { price: 120, tier: 'mid' },
  'Nomad Knife|Safari Mesh': { price: 110, tier: 'budget' },
  'Nomad Knife|Boreal Forest': { price: 110, tier: 'budget' },
  'Nomad Knife|Forest DDPAT': { price: 110, tier: 'budget' },

  // Skeleton Knife
  'Skeleton Knife|Doppler': { price: 280, tier: 'elite' },
  'Skeleton Knife|Fade': { price: 500, tier: 'elite' },
  'Skeleton Knife|Marble Fade': { price: 450, tier: 'elite' },
  'Skeleton Knife|Tiger Tooth': { price: 350, tier: 'premium' },
  'Skeleton Knife|Slaughter': { price: 300, tier: 'premium' },
  'Skeleton Knife|Crimson Web': { price: 340, tier: 'elite' },
  'Skeleton Knife|Case Hardened': { price: 270, tier: 'elite' },
  'Skeleton Knife|Vanilla': { price: 250, tier: 'mid' },
  'Skeleton Knife|Blue Steel': { price: 190, tier: 'high' },
  'Skeleton Knife|Night': { price: 175, tier: 'high' },
  'Skeleton Knife|Stained': { price: 155, tier: 'mid' },
  'Skeleton Knife|Scorched': { price: 135, tier: 'mid' },
  'Skeleton Knife|Safari Mesh': { price: 125, tier: 'budget' },
  'Skeleton Knife|Boreal Forest': { price: 125, tier: 'budget' },
  'Skeleton Knife|Forest DDPAT': { price: 125, tier: 'budget' },

  // Kukri Knife
  'Kukri Knife|Doppler': { price: 350, tier: 'elite' },
  'Kukri Knife|Fade': { price: 600, tier: 'elite' },
  'Kukri Knife|Slaughter': { price: 350, tier: 'premium' },
  'Kukri Knife|Crimson Web': { price: 400, tier: 'elite' },
  'Kukri Knife|Case Hardened': { price: 320, tier: 'elite' },
  'Kukri Knife|Vanilla': { price: 300, tier: 'mid' },
  'Kukri Knife|Blue Steel': { price: 230, tier: 'high' },
  'Kukri Knife|Night': { price: 210, tier: 'high' },
  'Kukri Knife|Stained': { price: 190, tier: 'mid' },
  'Kukri Knife|Scorched': { price: 165, tier: 'mid' },
  'Kukri Knife|Safari Mesh': { price: 150, tier: 'budget' },
  'Kukri Knife|Boreal Forest': { price: 150, tier: 'budget' },
  'Kukri Knife|Forest DDPAT': { price: 150, tier: 'budget' },

  // ==========================================
  // GLOVES
  // ==========================================

  // Sport Gloves
  'Sport Gloves|Pandora\'s Box': { price: 8000, tier: 'elite' },
  'Sport Gloves|Vice': { price: 2500, tier: 'elite' },
  'Sport Gloves|Hedge Maze': { price: 1200, tier: 'premium' },
  'Sport Gloves|Superconductor': { price: 1000, tier: 'premium' },
  'Sport Gloves|Amphibious': { price: 450, tier: 'high' },
  'Sport Gloves|Omega': { price: 400, tier: 'high' },
  'Sport Gloves|Bronze Morph': { price: 350, tier: 'high' },
  'Sport Gloves|Arid': { price: 300, tier: 'mid' },
  'Sport Gloves|Scarlet Shamagh': { price: 280, tier: 'mid' },
  'Sport Gloves|Nocts': { price: 250, tier: 'mid' },
  'Sport Gloves|Slingshot': { price: 220, tier: 'mid' },

  // Driver Gloves
  'Driver Gloves|King Snake': { price: 2000, tier: 'elite' },
  'Driver Gloves|Imperial Plaid': { price: 800, tier: 'premium' },
  'Driver Gloves|Overtake': { price: 600, tier: 'high' },
  'Driver Gloves|Crimson Weave': { price: 500, tier: 'high' },
  'Driver Gloves|Diamondback': { price: 400, tier: 'high' },
  'Driver Gloves|Lunar Weave': { price: 350, tier: 'mid' },
  'Driver Gloves|Convoy': { price: 300, tier: 'mid' },
  'Driver Gloves|Racing Green': { price: 250, tier: 'mid' },
  'Driver Gloves|Snow Leopard': { price: 220, tier: 'mid' },
  'Driver Gloves|Rezan the Red': { price: 200, tier: 'mid' },
  'Driver Gloves|Black Tie': { price: 180, tier: 'budget' },
  'Driver Gloves|Queen Jaguar': { price: 170, tier: 'budget' },

  // Specialist Gloves
  'Specialist Gloves|Crimson Kimono': { price: 3000, tier: 'elite' },
  'Specialist Gloves|Fade': { price: 2500, tier: 'elite' },
  'Specialist Gloves|Emerald Web': { price: 1500, tier: 'elite' },
  'Specialist Gloves|Mogul': { price: 600, tier: 'premium' },
  'Specialist Gloves|Foundation': { price: 500, tier: 'high' },
  'Specialist Gloves|Forest DDPAT': { price: 350, tier: 'high' },
  'Specialist Gloves|Buckshot': { price: 300, tier: 'mid' },
  'Specialist Gloves|Crimson Web': { price: 450, tier: 'high' },
  'Specialist Gloves|Field Agent': { price: 280, tier: 'mid' },
  'Specialist Gloves|Lt. Commander': { price: 250, tier: 'mid' },
  'Specialist Gloves|Marble Fade': { price: 400, tier: 'high' },
  'Specialist Gloves|Tiger Strike': { price: 350, tier: 'mid' },

  // Moto Gloves
  'Moto Gloves|Spearmint': { price: 4000, tier: 'elite' },
  'Moto Gloves|Cool Mint': { price: 1500, tier: 'elite' },
  'Moto Gloves|POW!': { price: 700, tier: 'premium' },
  'Moto Gloves|Boom!': { price: 600, tier: 'premium' },
  'Moto Gloves|Transport': { price: 400, tier: 'high' },
  'Moto Gloves|Polygon': { price: 350, tier: 'high' },
  'Moto Gloves|Turtle': { price: 300, tier: 'mid' },
  'Moto Gloves|Smoke Out': { price: 280, tier: 'mid' },
  'Moto Gloves|Blood Pressure': { price: 250, tier: 'mid' },
  'Moto Gloves|Eclipse': { price: 220, tier: 'mid' },
  'Moto Gloves|Finish Line': { price: 200, tier: 'budget' },
  'Moto Gloves|3rd Commando Company': { price: 180, tier: 'budget' },

  // Hand Wraps
  'Hand Wraps|Cobalt Skulls': { price: 1800, tier: 'elite' },
  'Hand Wraps|Slaughter': { price: 1200, tier: 'elite' },
  'Hand Wraps|Overprint': { price: 500, tier: 'premium' },
  'Hand Wraps|Duct Tape': { price: 350, tier: 'high' },
  'Hand Wraps|Arboreal': { price: 300, tier: 'high' },
  'Hand Wraps|Badlands': { price: 280, tier: 'mid' },
  'Hand Wraps|Leather': { price: 250, tier: 'mid' },
  'Hand Wraps|Spruce DDPAT': { price: 220, tier: 'mid' },
  'Hand Wraps|Desert Shamagh': { price: 200, tier: 'mid' },
  'Hand Wraps|Giraffe': { price: 180, tier: 'budget' },
  'Hand Wraps|CAUTION!': { price: 170, tier: 'budget' },
  'Hand Wraps|Constrictor': { price: 160, tier: 'budget' },

  // Hydra Gloves
  'Hydra Gloves|Emerald': { price: 1000, tier: 'elite' },
  'Hydra Gloves|Case Hardened': { price: 700, tier: 'premium' },
  'Hydra Gloves|Rattler': { price: 350, tier: 'high' },
  'Hydra Gloves|Mangrove': { price: 300, tier: 'mid' },

  // Broken Fang Gloves
  'Broken Fang Gloves|Jade': { price: 500, tier: 'high' },
  'Broken Fang Gloves|Needle Point': { price: 400, tier: 'high' },
  'Broken Fang Gloves|Yellow-banded': { price: 350, tier: 'mid' },
  'Broken Fang Gloves|Unhinged': { price: 300, tier: 'mid' },

  // ==========================================
  // AK-47
  // ==========================================
  'AK-47|Wild Lotus': { price: 8000, tier: 'elite' },
  'AK-47|Gold Arabesque': { price: 4000, tier: 'elite' },
  'AK-47|Fire Serpent': { price: 1200, tier: 'elite' },
  'AK-47|Hydroponic': { price: 800, tier: 'elite' },
  'AK-47|Vulcan': { price: 350, tier: 'premium' },
  'AK-47|Fuel Injector': { price: 250, tier: 'premium' },
  'AK-47|The Empress': { price: 180, tier: 'premium' },
  'AK-47|Neon Rider': { price: 150, tier: 'high' },
  'AK-47|Bloodsport': { price: 130, tier: 'high' },
  'AK-47|Neon Revolution': { price: 100, tier: 'high' },
  'AK-47|Asiimov': { price: 90, tier: 'high' },
  'AK-47|Phantom Disruptor': { price: 60, tier: 'high' },
  'AK-47|Aquamarine Revenge': { price: 50, tier: 'mid' },
  'AK-47|Point Disarray': { price: 40, tier: 'mid' },
  'AK-47|Case Hardened': { price: 80, tier: 'elite' },
  'AK-47|Redline': { price: 15, tier: 'mid' },
  'AK-47|Frontside Misty': { price: 20, tier: 'mid' },
  'AK-47|Jaguar': { price: 35, tier: 'mid' },
  'AK-47|Wasteland Rebel': { price: 45, tier: 'high' },
  'AK-47|Legion of Anubis': { price: 25, tier: 'mid' },
  'AK-47|Rat Rod': { price: 8, tier: 'budget' },
  'AK-47|Elite Build': { price: 5, tier: 'budget' },
  'AK-47|Blue Laminate': { price: 4, tier: 'budget' },
  'AK-47|Slate': { price: 10, tier: 'budget' },
  'AK-47|Ice Coaled': { price: 12, tier: 'mid' },
  'AK-47|Nightwish': { price: 35, tier: 'mid' },
  'AK-47|Head Shot': { price: 18, tier: 'mid' },
  'AK-47|Inheritance': { price: 45, tier: 'high' },

  // ==========================================
  // AWP
  // ==========================================
  'AWP|Dragon Lore': { price: 5000, tier: 'elite' },
  'AWP|Gungnir': { price: 4500, tier: 'elite' },
  'AWP|The Prince': { price: 800, tier: 'elite' },
  'AWP|Medusa': { price: 1500, tier: 'elite' },
  'AWP|Fade': { price: 1200, tier: 'elite' },
  'AWP|Lightning Strike': { price: 350, tier: 'elite' },
  'AWP|Asiimov': { price: 100, tier: 'premium' },
  'AWP|Hyper Beast': { price: 60, tier: 'high' },
  'AWP|Fever Dream': { price: 25, tier: 'high' },
  'AWP|Neo-Noir': { price: 40, tier: 'high' },
  'AWP|Containment Breach': { price: 70, tier: 'high' },
  'AWP|Wildfire': { price: 55, tier: 'high' },
  'AWP|The Collector': { price: 50, tier: 'high' },
  'AWP|Chromatic Aberration': { price: 45, tier: 'high' },
  'AWP|Atheris': { price: 15, tier: 'mid' },
  'AWP|Graphite': { price: 120, tier: 'premium' },
  'AWP|BOOM': { price: 50, tier: 'high' },
  'AWP|Electric Hive': { price: 25, tier: 'mid' },
  'AWP|Redline': { price: 18, tier: 'mid' },
  'AWP|Corticera': { price: 12, tier: 'mid' },
  'AWP|Man-o\'-war': { price: 15, tier: 'mid' },
  'AWP|Phobos': { price: 5, tier: 'budget' },
  'AWP|Mortis': { price: 8, tier: 'budget' },
  'AWP|Worm God': { price: 3, tier: 'budget' },
  'AWP|Safari Mesh': { price: 2, tier: 'budget' },
  'AWP|Snake Camo': { price: 2, tier: 'budget' },
  'AWP|Silk Tiger': { price: 20, tier: 'mid' },
  'AWP|Duality': { price: 30, tier: 'mid' },
  'AWP|Desert Hydra': { price: 200, tier: 'premium' },

  // ==========================================
  // M4A4
  // ==========================================
  'M4A4|Howl': { price: 4500, tier: 'elite' },
  'M4A4|Poseidon': { price: 800, tier: 'elite' },
  'M4A4|Asiimov': { price: 150, tier: 'premium' },
  'M4A4|The Emperor': { price: 80, tier: 'premium' },
  'M4A4|Neo-Noir': { price: 50, tier: 'high' },
  'M4A4|Buzz Kill': { price: 40, tier: 'high' },
  'M4A4|Desolate Space': { price: 30, tier: 'high' },
  'M4A4|Royal Paladin': { price: 25, tier: 'high' },
  'M4A4|The Coalition': { price: 18, tier: 'mid' },
  'M4A4|Bullet Rain': { price: 20, tier: 'mid' },
  'M4A4|Hellfire': { price: 15, tier: 'mid' },
  'M4A4|Tooth Fairy': { price: 35, tier: 'high' },
  'M4A4|In Living Color': { price: 40, tier: 'high' },
  'M4A4|Spider Lily': { price: 45, tier: 'high' },
  'M4A4|Temukau': { price: 25, tier: 'mid' },
  'M4A4|X-Ray': { price: 8, tier: 'budget' },
  'M4A4|Evil Daimyo': { price: 5, tier: 'budget' },
  'M4A4|Dragon King': { price: 10, tier: 'mid' },
  'M4A4|Zirka': { price: 6, tier: 'budget' },
  'M4A4|Faded Zebra': { price: 2, tier: 'budget' },
  'M4A4|Urban DDPAT': { price: 2, tier: 'budget' },
  'M4A4|Jungle Tiger': { price: 2, tier: 'budget' },
  'M4A4|Cyber Security': { price: 12, tier: 'mid' },
  'M4A4|Global Offensive': { price: 28, tier: 'mid' },

  // ==========================================
  // M4A1-S
  // ==========================================
  'M4A1-S|Welcome to the Jungle': { price: 600, tier: 'elite' },
  'M4A1-S|Knight': { price: 450, tier: 'elite' },
  'M4A1-S|Hot Rod': { price: 250, tier: 'premium' },
  'M4A1-S|Master Piece': { price: 200, tier: 'premium' },
  'M4A1-S|Golden Coil': { price: 80, tier: 'high' },
  'M4A1-S|Chantico\'s Fire': { price: 60, tier: 'high' },
  'M4A1-S|Hyper Beast': { price: 55, tier: 'high' },
  'M4A1-S|Mecha Industries': { price: 35, tier: 'high' },
  'M4A1-S|Printstream': { price: 90, tier: 'premium' },
  'M4A1-S|Nightmare': { price: 20, tier: 'mid' },
  'M4A1-S|Decimator': { price: 15, tier: 'mid' },
  'M4A1-S|Cyrex': { price: 12, tier: 'mid' },
  'M4A1-S|Atomic Alloy': { price: 10, tier: 'mid' },
  'M4A1-S|Guardian': { price: 8, tier: 'mid' },
  'M4A1-S|Leaded Glass': { price: 25, tier: 'mid' },
  'M4A1-S|Blue Phosphor': { price: 30, tier: 'mid' },
  'M4A1-S|Player Two': { price: 45, tier: 'high' },
  'M4A1-S|Imminent Danger': { price: 6, tier: 'budget' },
  'M4A1-S|Bright Water': { price: 5, tier: 'budget' },
  'M4A1-S|Nitro': { price: 4, tier: 'budget' },
  'M4A1-S|Boreal Forest': { price: 2, tier: 'budget' },
  'M4A1-S|Flashback': { price: 3, tier: 'budget' },
  'M4A1-S|Emphorosaur-S': { price: 18, tier: 'mid' },
  'M4A1-S|Night Terror': { price: 22, tier: 'mid' },

  // ==========================================
  // Desert Eagle
  // ==========================================
  'Desert Eagle|Blaze': { price: 400, tier: 'elite' },
  'Desert Eagle|Emerald Jörmungandr': { price: 150, tier: 'premium' },
  'Desert Eagle|Code Red': { price: 80, tier: 'premium' },
  'Desert Eagle|Mecha Industries': { price: 35, tier: 'high' },
  'Desert Eagle|Printstream': { price: 50, tier: 'high' },
  'Desert Eagle|Kumicho Dragon': { price: 40, tier: 'high' },
  'Desert Eagle|Sunset Storm': { price: 45, tier: 'premium' },
  'Desert Eagle|Golden Koi': { price: 60, tier: 'premium' },
  'Desert Eagle|Hypnotic': { price: 18, tier: 'mid' },
  'Desert Eagle|Conspiracy': { price: 8, tier: 'mid' },
  'Desert Eagle|Crimson Web': { price: 25, tier: 'premium' },
  'Desert Eagle|Heirloom': { price: 15, tier: 'mid' },
  'Desert Eagle|Trigger Discipline': { price: 12, tier: 'mid' },
  'Desert Eagle|Ocean Drive': { price: 10, tier: 'mid' },
  'Desert Eagle|Light Rail': { price: 6, tier: 'budget' },
  'Desert Eagle|Blue Ply': { price: 3, tier: 'budget' },
  'Desert Eagle|Urban Rubble': { price: 2, tier: 'budget' },
  'Desert Eagle|Mudder': { price: 2, tier: 'budget' },

  // ==========================================
  // USP-S
  // ==========================================
  'USP-S|Kill Confirmed': { price: 120, tier: 'premium' },
  'USP-S|Neo-Noir': { price: 30, tier: 'high' },
  'USP-S|Cortex': { price: 18, tier: 'high' },
  'USP-S|Caiman': { price: 8, tier: 'mid' },
  'USP-S|Orion': { price: 20, tier: 'premium' },
  'USP-S|Printstream': { price: 65, tier: 'premium' },
  'USP-S|Monster Mashup': { price: 25, tier: 'high' },
  'USP-S|The Traitor': { price: 35, tier: 'high' },
  'USP-S|Cyrex': { price: 10, tier: 'mid' },
  'USP-S|Guardian': { price: 6, tier: 'mid' },
  'USP-S|Overgrowth': { price: 12, tier: 'mid' },
  'USP-S|Road Rash': { price: 8, tier: 'mid' },
  'USP-S|Blueprint': { price: 5, tier: 'budget' },
  'USP-S|Stainless': { price: 3, tier: 'budget' },
  'USP-S|Forest Leaves': { price: 2, tier: 'budget' },
  'USP-S|Dark Water': { price: 4, tier: 'budget' },
  'USP-S|Ticket to Hell': { price: 15, tier: 'mid' },
  'USP-S|Whiteout': { price: 60, tier: 'premium' },

  // ==========================================
  // Glock-18
  // ==========================================
  'Glock-18|Fade': { price: 800, tier: 'elite' },
  'Glock-18|Gamma Doppler': { price: 350, tier: 'elite' },
  'Glock-18|Twilight Galaxy': { price: 100, tier: 'premium' },
  'Glock-18|Bullet Queen': { price: 35, tier: 'high' },
  'Glock-18|Wasteland Rebel': { price: 25, tier: 'high' },
  'Glock-18|Water Elemental': { price: 12, tier: 'mid' },
  'Glock-18|Vogue': { price: 8, tier: 'mid' },
  'Glock-18|Steel Disruption': { price: 5, tier: 'budget' },
  'Glock-18|Royal Legion': { price: 4, tier: 'budget' },
  'Glock-18|Dragon Tattoo': { price: 15, tier: 'high' },
  'Glock-18|Brass': { price: 3, tier: 'budget' },
  'Glock-18|Grinder': { price: 2, tier: 'budget' },
  'Glock-18|Weasel': { price: 4, tier: 'budget' },
  'Glock-18|Snack Attack': { price: 20, tier: 'mid' },
  'Glock-18|Neo-Noir': { price: 10, tier: 'mid' },
  'Glock-18|Off World': { price: 6, tier: 'mid' },
  'Glock-18|Blue Fissure': { price: 2, tier: 'budget' },

  // ==========================================
  // P2000
  // ==========================================
  'P2000|Ocean Foam': { price: 200, tier: 'elite' },
  'P2000|Fire Elemental': { price: 50, tier: 'premium' },
  'P2000|Corticera': { price: 8, tier: 'mid' },
  'P2000|Handgun': { price: 5, tier: 'mid' },
  'P2000|Amber Fade': { price: 15, tier: 'mid' },
  'P2000|Imperial Dragon': { price: 10, tier: 'mid' },
  'P2000|Obsidian': { price: 6, tier: 'mid' },
  'P2000|Red FragCam': { price: 2, tier: 'budget' },
  'P2000|Pulse': { price: 2, tier: 'budget' },
  'P2000|Scorpion': { price: 3, tier: 'budget' },
  'P2000|Grassland': { price: 2, tier: 'budget' },
  'P2000|Gnarled': { price: 8, tier: 'mid' },

  // ==========================================
  // P250
  // ==========================================
  'P250|See Ya Later': { price: 25, tier: 'high' },
  'P250|Mehndi': { price: 12, tier: 'mid' },
  'P250|Muertos': { price: 8, tier: 'mid' },
  'P250|Asiimov': { price: 10, tier: 'mid' },
  'P250|Cartel': { price: 4, tier: 'budget' },
  'P250|Supernova': { price: 5, tier: 'mid' },
  'P250|Vino Primo': { price: 3, tier: 'budget' },
  'P250|Franklin': { price: 15, tier: 'high' },
  'P250|Wingshot': { price: 6, tier: 'mid' },
  'P250|Hive': { price: 2, tier: 'budget' },
  'P250|Sand Dune': { price: 1, tier: 'budget' },
  'P250|Undertow': { price: 20, tier: 'premium' },

  // ==========================================
  // Five-SeveN
  // ==========================================
  'Five-SeveN|Hyper Beast': { price: 30, tier: 'high' },
  'Five-SeveN|Angry Mob': { price: 18, tier: 'high' },
  'Five-SeveN|Case Hardened': { price: 25, tier: 'premium' },
  'Five-SeveN|Monkey Business': { price: 10, tier: 'mid' },
  'Five-SeveN|Neon Kimono': { price: 15, tier: 'premium' },
  'Five-SeveN|Fowl Play': { price: 8, tier: 'mid' },
  'Five-SeveN|Retrobution': { price: 6, tier: 'mid' },
  'Five-SeveN|Copper Galaxy': { price: 4, tier: 'budget' },
  'Five-SeveN|Urban Hazard': { price: 3, tier: 'budget' },
  'Five-SeveN|Kami': { price: 2, tier: 'budget' },
  'Five-SeveN|Forest Night': { price: 2, tier: 'budget' },
  'Five-SeveN|Crimson Blossom': { price: 12, tier: 'mid' },

  // ==========================================
  // CZ75-Auto
  // ==========================================
  'CZ75-Auto|Victoria': { price: 12, tier: 'high' },
  'CZ75-Auto|Xiangliu': { price: 8, tier: 'mid' },
  'CZ75-Auto|Tacticat': { price: 6, tier: 'mid' },
  'CZ75-Auto|Emerald': { price: 25, tier: 'premium' },
  'CZ75-Auto|Yellow Jacket': { price: 4, tier: 'mid' },
  'CZ75-Auto|Crimson Web': { price: 5, tier: 'mid' },
  'CZ75-Auto|Polymer': { price: 2, tier: 'budget' },
  'CZ75-Auto|Army Sheen': { price: 2, tier: 'budget' },
  'CZ75-Auto|Tigris': { price: 2, tier: 'budget' },

  // ==========================================
  // Tec-9
  // ==========================================
  'Tec-9|Fuel Injector': { price: 20, tier: 'high' },
  'Tec-9|Nuclear Threat': { price: 50, tier: 'premium' },
  'Tec-9|Re-Entry': { price: 8, tier: 'mid' },
  'Tec-9|Avalanche': { price: 6, tier: 'mid' },
  'Tec-9|Isaac': { price: 4, tier: 'budget' },
  'Tec-9|Red Quartz': { price: 3, tier: 'budget' },
  'Tec-9|Army Mesh': { price: 2, tier: 'budget' },
  'Tec-9|Sandstorm': { price: 2, tier: 'budget' },
  'Tec-9|Hades': { price: 5, tier: 'mid' },
  'Tec-9|Decimator': { price: 10, tier: 'mid' },

  // ==========================================
  // Dual Berettas
  // ==========================================
  'Dual Berettas|Cobra Strike': { price: 15, tier: 'high' },
  'Dual Berettas|Twin Turbo': { price: 8, tier: 'mid' },
  'Dual Berettas|Melondrama': { price: 5, tier: 'mid' },
  'Dual Berettas|Urban Shock': { price: 4, tier: 'budget' },
  'Dual Berettas|Shred': { price: 3, tier: 'budget' },
  'Dual Berettas|Hemoglobin': { price: 6, tier: 'mid' },
  'Dual Berettas|Stained': { price: 2, tier: 'budget' },
  'Dual Berettas|Moon in Libra': { price: 10, tier: 'mid' },
  'Dual Berettas|Royal Consorts': { price: 12, tier: 'mid' },

  // ==========================================
  // R8 Revolver
  // ==========================================
  'R8 Revolver|Fade': { price: 45, tier: 'premium' },
  'R8 Revolver|Amber Fade': { price: 15, tier: 'mid' },
  'R8 Revolver|Llama Cannon': { price: 10, tier: 'mid' },
  'R8 Revolver|Crimson Web': { price: 8, tier: 'mid' },
  'R8 Revolver|Reboot': { price: 5, tier: 'budget' },
  'R8 Revolver|Bone Mask': { price: 3, tier: 'budget' },
  'R8 Revolver|Canal Spray': { price: 2, tier: 'budget' },
  'R8 Revolver|Grip': { price: 2, tier: 'budget' },
  'R8 Revolver|Junk Yard': { price: 4, tier: 'budget' },
  'R8 Revolver|Memento': { price: 8, tier: 'mid' },
  'R8 Revolver|Crazy 8': { price: 6, tier: 'mid' },

  // ==========================================
  // SSG 08
  // ==========================================
  'SSG 08|Blood in the Water': { price: 80, tier: 'premium' },
  'SSG 08|Dragonfire': { price: 25, tier: 'high' },
  'SSG 08|Big Iron': { price: 15, tier: 'mid' },
  'SSG 08|Death Strike': { price: 5, tier: 'mid' },
  'SSG 08|Detour': { price: 10, tier: 'mid' },
  'SSG 08|Acid Fade': { price: 4, tier: 'budget' },
  'SSG 08|Slashed': { price: 3, tier: 'budget' },
  'SSG 08|Abyss': { price: 2, tier: 'budget' },
  'SSG 08|Blue Spruce': { price: 2, tier: 'budget' },
  'SSG 08|Ghost Crusader': { price: 8, tier: 'mid' },
  'SSG 08|Sea Calico': { price: 6, tier: 'mid' },
  'SSG 08|Turbo Peek': { price: 12, tier: 'mid' },

  // ==========================================
  // SCAR-20
  // ==========================================
  'SCAR-20|Emerald': { price: 40, tier: 'premium' },
  'SCAR-20|Bloodsport': { price: 15, tier: 'high' },
  'SCAR-20|Cyrex': { price: 8, tier: 'mid' },
  'SCAR-20|Cardiac': { price: 5, tier: 'mid' },
  'SCAR-20|Blueprint': { price: 3, tier: 'budget' },
  'SCAR-20|Carbon Fiber': { price: 2, tier: 'budget' },
  'SCAR-20|Army Sheen': { price: 2, tier: 'budget' },
  'SCAR-20|Jungle Slipstream': { price: 4, tier: 'budget' },
  'SCAR-20|Enforcer': { price: 6, tier: 'mid' },

  // ==========================================
  // G3SG1
  // ==========================================
  'G3SG1|The Executioner': { price: 15, tier: 'high' },
  'G3SG1|Flux': { price: 8, tier: 'mid' },
  'G3SG1|Stinger': { price: 5, tier: 'mid' },
  'G3SG1|Scavenger': { price: 4, tier: 'budget' },
  'G3SG1|Chronos': { price: 3, tier: 'budget' },
  'G3SG1|Safari Mesh': { price: 2, tier: 'budget' },
  'G3SG1|Jungle Dashed': { price: 2, tier: 'budget' },
  'G3SG1|High Seas': { price: 6, tier: 'mid' },

  // ==========================================
  // Galil AR
  // ==========================================
  'Galil AR|Chatterbox': { price: 20, tier: 'high' },
  'Galil AR|Chromatic Aberration': { price: 8, tier: 'mid' },
  'Galil AR|Eco': { price: 5, tier: 'mid' },
  'Galil AR|Stone Cold': { price: 4, tier: 'budget' },
  'Galil AR|Cerberus': { price: 10, tier: 'high' },
  'Galil AR|Rocket Pop': { price: 3, tier: 'budget' },
  'Galil AR|Sage Spray': { price: 2, tier: 'budget' },
  'Galil AR|Urban Rubble': { price: 2, tier: 'budget' },
  'Galil AR|Signal': { price: 6, tier: 'mid' },
  'Galil AR|Phoenix Blacklight': { price: 12, tier: 'mid' },

  // ==========================================
  // FAMAS
  // ==========================================
  'FAMAS|Commemoration': { price: 60, tier: 'premium' },
  'FAMAS|Mecha Industries': { price: 15, tier: 'high' },
  'FAMAS|Eye of Athena': { price: 8, tier: 'mid' },
  'FAMAS|Djinn': { price: 5, tier: 'mid' },
  'FAMAS|Neural Net': { price: 4, tier: 'budget' },
  'FAMAS|Roll Cage': { price: 3, tier: 'budget' },
  'FAMAS|Afterimage': { price: 10, tier: 'mid' },
  'FAMAS|Pulse': { price: 2, tier: 'budget' },
  'FAMAS|Cyanospatter': { price: 2, tier: 'budget' },
  'FAMAS|Colony': { price: 2, tier: 'budget' },
  'FAMAS|ZX Spectron': { price: 6, tier: 'mid' },
  'FAMAS|Prime Conspiracy': { price: 5, tier: 'mid' },

  // ==========================================
  // AUG
  // ==========================================
  'AUG|Akihabara Accept': { price: 150, tier: 'elite' },
  'AUG|Chameleon': { price: 30, tier: 'premium' },
  'AUG|Hot Rod': { price: 50, tier: 'premium' },
  'AUG|Syd Mead': { price: 15, tier: 'high' },
  'AUG|Stymphalian': { price: 8, tier: 'mid' },
  'AUG|Fleet Flock': { price: 5, tier: 'mid' },
  'AUG|Torque': { price: 4, tier: 'budget' },
  'AUG|Wings': { price: 3, tier: 'budget' },
  'AUG|Storm': { price: 2, tier: 'budget' },
  'AUG|Amber Slipstream': { price: 2, tier: 'budget' },
  'AUG|Momentum': { price: 6, tier: 'mid' },
  'AUG|Flame Jörmungandr': { price: 10, tier: 'mid' },

  // ==========================================
  // SG 553
  // ==========================================
  'SG 553|Integrale': { price: 25, tier: 'high' },
  'SG 553|Cyrex': { price: 10, tier: 'mid' },
  'SG 553|Pulse': { price: 4, tier: 'budget' },
  'SG 553|Tiger Moth': { price: 6, tier: 'mid' },
  'SG 553|Atlas': { price: 3, tier: 'budget' },
  'SG 553|Wave Spray': { price: 2, tier: 'budget' },
  'SG 553|Traveler': { price: 2, tier: 'budget' },
  'SG 553|Darkwing': { price: 5, tier: 'mid' },
  'SG 553|Phantom': { price: 8, tier: 'mid' },

  // ==========================================
  // SMGs
  // ==========================================
  // MAC-10
  'MAC-10|Neon Rider': { price: 30, tier: 'high' },
  'MAC-10|Case Hardened': { price: 25, tier: 'premium' },
  'MAC-10|Gold Brick': { price: 8, tier: 'mid' },
  'MAC-10|Stalker': { price: 5, tier: 'mid' },
  'MAC-10|Heat': { price: 3, tier: 'budget' },
  'MAC-10|Carnivore': { price: 2, tier: 'budget' },
  'MAC-10|Silver': { price: 2, tier: 'budget' },
  'MAC-10|Curse': { price: 4, tier: 'budget' },
  'MAC-10|Oceanic': { price: 6, tier: 'mid' },
  'MAC-10|Toybox': { price: 10, tier: 'mid' },

  // MP9
  'MP9|Hydra': { price: 15, tier: 'high' },
  'MP9|Wild Lily': { price: 10, tier: 'mid' },
  'MP9|Hypnotic': { price: 8, tier: 'mid' },
  'MP9|Airlock': { price: 5, tier: 'mid' },
  'MP9|Setting Sun': { price: 3, tier: 'budget' },
  'MP9|Ruby Poison Dart': { price: 4, tier: 'budget' },
  'MP9|Storm': { price: 2, tier: 'budget' },
  'MP9|Sand Dashed': { price: 2, tier: 'budget' },
  'MP9|Music Box': { price: 6, tier: 'mid' },
  'MP9|Starlight Protector': { price: 12, tier: 'mid' },

  // MP7
  'MP7|Bloodsport': { price: 20, tier: 'high' },
  'MP7|Neon Ply': { price: 8, tier: 'mid' },
  'MP7|Nemesis': { price: 5, tier: 'mid' },
  'MP7|Powercore': { price: 4, tier: 'budget' },
  'MP7|Akoben': { price: 3, tier: 'budget' },
  'MP7|Armor Core': { price: 3, tier: 'budget' },
  'MP7|Army Recon': { price: 2, tier: 'budget' },
  'MP7|Mischief': { price: 6, tier: 'mid' },
  'MP7|Guerrilla': { price: 10, tier: 'mid' },

  // UMP-45
  'UMP-45|Primal Saber': { price: 15, tier: 'high' },
  'UMP-45|Blaze': { price: 30, tier: 'premium' },
  'UMP-45|Momentum': { price: 5, tier: 'mid' },
  'UMP-45|Plastique': { price: 3, tier: 'budget' },
  'UMP-45|Corporal': { price: 2, tier: 'budget' },
  'UMP-45|Labyrinth': { price: 2, tier: 'budget' },
  'UMP-45|Carbon Fiber': { price: 2, tier: 'budget' },
  'UMP-45|Gold Bismuth': { price: 8, tier: 'mid' },
  'UMP-45|Wild Child': { price: 6, tier: 'mid' },

  // P90
  'P90|Death by Kitty': { price: 45, tier: 'premium' },
  'P90|Asiimov': { price: 25, tier: 'high' },
  'P90|Shapewood': { price: 10, tier: 'mid' },
  'P90|Cold Blooded': { price: 8, tier: 'mid' },
  'P90|Trigon': { price: 5, tier: 'mid' },
  'P90|Virus': { price: 4, tier: 'budget' },
  'P90|Elite Build': { price: 3, tier: 'budget' },
  'P90|Storm': { price: 2, tier: 'budget' },
  'P90|Sand Spray': { price: 2, tier: 'budget' },
  'P90|Astral Jörmungandr': { price: 12, tier: 'mid' },
  'P90|Nostalgia': { price: 6, tier: 'mid' },

  // PP-Bizon
  'PP-Bizon|High Roller': { price: 12, tier: 'high' },
  'PP-Bizon|Judgement of Anubis': { price: 6, tier: 'mid' },
  'PP-Bizon|Blue Streak': { price: 4, tier: 'budget' },
  'PP-Bizon|Antique': { price: 3, tier: 'budget' },
  'PP-Bizon|Night Riot': { price: 5, tier: 'mid' },
  'PP-Bizon|Carbon Fiber': { price: 2, tier: 'budget' },
  'PP-Bizon|Sand Dashed': { price: 2, tier: 'budget' },
  'PP-Bizon|Embargo': { price: 8, tier: 'mid' },

  // MP5-SD
  'MP5-SD|Lab Rats': { price: 10, tier: 'mid' },
  'MP5-SD|Phosphor': { price: 6, tier: 'mid' },
  'MP5-SD|Acid Wash': { price: 3, tier: 'budget' },
  'MP5-SD|Dirt Drop': { price: 2, tier: 'budget' },
  'MP5-SD|Co-Processor': { price: 4, tier: 'budget' },
  'MP5-SD|Liquidation': { price: 5, tier: 'mid' },
  'MP5-SD|Kitbash': { price: 8, tier: 'mid' },

  // ==========================================
  // Shotguns
  // ==========================================
  // Nova
  'Nova|Antique': { price: 10, tier: 'high' },
  'Nova|Hyper Beast': { price: 8, tier: 'mid' },
  'Nova|Bloomstick': { price: 5, tier: 'mid' },
  'Nova|Predator': { price: 2, tier: 'budget' },
  'Nova|Rising Skull': { price: 3, tier: 'budget' },
  'Nova|Wild Six': { price: 4, tier: 'budget' },
  'Nova|Forest Leaves': { price: 2, tier: 'budget' },
  'Nova|Red Quartz': { price: 6, tier: 'mid' },

  // XM1014
  'XM1014|Ziggy': { price: 8, tier: 'mid' },
  'XM1014|Seasons': { price: 10, tier: 'mid' },
  'XM1014|Tranquility': { price: 6, tier: 'mid' },
  'XM1014|Blue Spruce': { price: 3, tier: 'budget' },
  'XM1014|Teclu Burner': { price: 5, tier: 'mid' },
  'XM1014|Urban Perforated': { price: 2, tier: 'budget' },
  'XM1014|Blue Steel': { price: 2, tier: 'budget' },
  'XM1014|Incinegator': { price: 8, tier: 'mid' },

  // MAG-7
  'MAG-7|Heat': { price: 6, tier: 'mid' },
  'MAG-7|SWAG-7': { price: 10, tier: 'mid' },
  'MAG-7|Bulldozer': { price: 4, tier: 'budget' },
  'MAG-7|Firestarter': { price: 3, tier: 'budget' },
  'MAG-7|Memento': { price: 5, tier: 'mid' },
  'MAG-7|Metallic DDPAT': { price: 2, tier: 'budget' },
  'MAG-7|Storm': { price: 2, tier: 'budget' },
  'MAG-7|Petroglyph': { price: 8, tier: 'mid' },

  // Sawed-Off
  'Sawed-Off|The Kraken': { price: 8, tier: 'mid' },
  'Sawed-Off|Devourer': { price: 5, tier: 'mid' },
  'Sawed-Off|Apocalypto': { price: 4, tier: 'budget' },
  'Sawed-Off|Morris': { price: 3, tier: 'budget' },
  'Sawed-Off|Yorick': { price: 2, tier: 'budget' },
  'Sawed-Off|Snake Camo': { price: 2, tier: 'budget' },
  'Sawed-Off|Limelight': { price: 6, tier: 'mid' },

  // ==========================================
  // Machine Guns
  // ==========================================
  // M249
  'M249|Emerald Poison Dart': { price: 8, tier: 'mid' },
  'M249|Nebula Crusader': { price: 5, tier: 'mid' },
  'M249|Impact Drill': { price: 4, tier: 'budget' },
  'M249|Spectre': { price: 3, tier: 'budget' },
  'M249|Contrast Spray': { price: 2, tier: 'budget' },
  'M249|Blizzard Marbleized': { price: 2, tier: 'budget' },
  'M249|Downtown': { price: 6, tier: 'mid' },

  // Negev
  'Negev|Mjölnir': { price: 15, tier: 'high' },
  'Negev|Power Loader': { price: 8, tier: 'mid' },
  'Negev|Dazzle': { price: 4, tier: 'budget' },
  'Negev|Army Sheen': { price: 2, tier: 'budget' },
  'Negev|Nuclear Waste': { price: 2, tier: 'budget' },
  'Negev|Man-o\'-war': { price: 3, tier: 'budget' },
  'Negev|Phoenix Stencil': { price: 5, tier: 'mid' },
  'Negev|Prototype': { price: 6, tier: 'mid' },
}

// Doppler phase price multipliers (applies to knife base price)
export const dopplerMultipliers: Record<string, number> = {
  'Phase 1': 1.0,
  'Phase 2': 1.15,
  'Phase 3': 0.95,
  'Phase 4': 1.10,
  'Ruby': 8.0,
  'Sapphire': 10.0,
  'Black Pearl': 6.0,
  'Emerald': 12.0, // Gamma Doppler
}

// Get price for a specific skin
export function getSkinPrice(
  weapon: string,
  skinName: string,
  wear: Wear,
  dopplerPhase?: string | null
): number {
  // Normalize Doppler skin names: "Doppler Ruby" -> "Doppler", "Doppler Phase 1" -> "Doppler"
  let normalizedSkinName = skinName
  if (skinName.startsWith('Doppler') && skinName !== 'Doppler') {
    normalizedSkinName = 'Doppler'
  }
  if (skinName.startsWith('Gamma Doppler') && skinName !== 'Gamma Doppler') {
    normalizedSkinName = 'Gamma Doppler'
  }

  const key = `${weapon}|${normalizedSkinName}`
  const skinData = skinPrices[key]

  if (!skinData) {
    // Fallback for unknown skins - estimate based on type
    return getDefaultPrice(weapon, wear)
  }

  let price = skinData.price
  const multipliers = wearMultipliersByTier[skinData.tier]
  price = Math.round(price * multipliers[wear])

  // Apply Doppler multiplier if applicable
  if (dopplerPhase && dopplerMultipliers[dopplerPhase]) {
    price = Math.round(price * dopplerMultipliers[dopplerPhase])
  }

  return price
}

// Default prices for unknown skins
function getDefaultPrice(weapon: string, wear: Wear): number {
  const wearMult = { FN: 1.5, MW: 1.2, FT: 1.0, WW: 0.7, BS: 0.5 }

  // Check if it's a knife
  const knives = [
    'Karambit', 'Butterfly Knife', 'M9 Bayonet', 'Bayonet', 'Flip Knife',
    'Gut Knife', 'Huntsman Knife', 'Falchion Knife', 'Bowie Knife',
    'Shadow Daggers', 'Navaja Knife', 'Stiletto Knife', 'Talon Knife',
    'Ursus Knife', 'Classic Knife', 'Paracord Knife', 'Survival Knife',
    'Nomad Knife', 'Skeleton Knife', 'Kukri Knife'
  ]

  if (knives.some(k => weapon.includes(k))) {
    return Math.round(150 * wearMult[wear])
  }

  // Check if it's gloves
  const gloves = [
    'Sport Gloves', 'Driver Gloves', 'Specialist Gloves', 'Moto Gloves',
    'Hand Wraps', 'Hydra Gloves', 'Broken Fang Gloves'
  ]

  if (gloves.some(g => weapon.includes(g))) {
    return Math.round(200 * wearMult[wear])
  }

  // Regular skin default
  return Math.round(5 * wearMult[wear])
}
