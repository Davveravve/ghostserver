-- Ghost Gaming Database Schema
-- MySQL/MariaDB

CREATE DATABASE IF NOT EXISTS ghost_gaming;
USE ghost_gaming;

-- ============================================
-- PLAYERS
-- ============================================
CREATE TABLE players (
    steam_id VARCHAR(32) PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    avatar_url VARCHAR(255),
    souls INT DEFAULT 0,
    total_souls_earned INT DEFAULT 0,
    playtime_minutes INT DEFAULT 0,
    playtime_unclaimed_seconds INT DEFAULT 0,  -- Tracks seconds until next soul
    is_premium BOOLEAN DEFAULT FALSE,
    premium_tier ENUM('none', 'bronze', 'silver', 'gold') DEFAULT 'none',
    premium_expires_at TIMESTAMP NULL,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_souls (souls DESC),
    INDEX idx_playtime (playtime_minutes DESC)
);

-- ============================================
-- ITEMS
-- ============================================
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description VARCHAR(255),
    type ENUM('skin', 'knife', 'gloves', 'sticker', 'agent', 'charm') NOT NULL,
    rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'ultra') NOT NULL,
    weapon VARCHAR(32) NULL,          -- AK-47, M4A4, AWP, etc. (NULL for non-weapon items)
    image_url VARCHAR(255),
    is_tradeable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_rarity (rarity),
    INDEX idx_type (type)
);

-- ============================================
-- CASES
-- ============================================
CREATE TABLE cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description VARCHAR(255),
    cost INT NOT NULL,                -- Cost in souls
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_premium_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_active (is_active)
);

-- ============================================
-- CASE ITEMS (Many-to-Many)
-- ============================================
CREATE TABLE case_items (
    case_id INT NOT NULL,
    item_id INT NOT NULL,
    drop_weight DECIMAL(6,3) NOT NULL,  -- Weight for probability calculation

    PRIMARY KEY (case_id, item_id),
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- ============================================
-- PLAYER INVENTORY
-- ============================================
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    steam_id VARCHAR(32) NOT NULL,
    item_id INT NOT NULL,
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    obtained_from_case INT NULL,
    obtained_on_server VARCHAR(32) NULL,  -- 'surf', 'retake', 'comp', 'web'
    is_equipped BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (steam_id) REFERENCES players(steam_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (obtained_from_case) REFERENCES cases(id) ON DELETE SET NULL,

    INDEX idx_player (steam_id),
    INDEX idx_obtained (obtained_at DESC)
);

-- ============================================
-- TRANSACTIONS LOG
-- ============================================
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    steam_id VARCHAR(32) NOT NULL,
    type ENUM('case_open', 'premium_purchase', 'souls_earned', 'souls_spent', 'gift_sent', 'gift_received') NOT NULL,
    amount INT NOT NULL,              -- Positive or negative
    balance_after INT NOT NULL,       -- Souls balance after transaction
    details JSON,                     -- Extra info (case_id, item_id, etc.)
    server VARCHAR(32) NULL,          -- Which server this happened on
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (steam_id) REFERENCES players(steam_id) ON DELETE CASCADE,
    INDEX idx_player_transactions (steam_id, created_at DESC),
    INDEX idx_type (type)
);

-- ============================================
-- CASE OPENING HISTORY
-- ============================================
CREATE TABLE case_opens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    steam_id VARCHAR(32) NOT NULL,
    case_id INT NOT NULL,
    item_id INT NOT NULL,
    item_rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary', 'ultra') NOT NULL,
    server VARCHAR(32) NOT NULL,
    announced BOOLEAN DEFAULT FALSE,  -- Was this announced cross-server?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (steam_id) REFERENCES players(steam_id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,

    INDEX idx_player_opens (steam_id, created_at DESC),
    INDEX idx_recent (created_at DESC),
    INDEX idx_rarity_recent (item_rarity, created_at DESC)
);

-- ============================================
-- SERVERS (for tracking & management)
-- ============================================
CREATE TABLE servers (
    id VARCHAR(32) PRIMARY KEY,       -- 'surf', 'retake', 'comp'
    name VARCHAR(64) NOT NULL,
    ip VARCHAR(45),
    port INT,
    current_players INT DEFAULT 0,
    max_players INT DEFAULT 32,
    current_map VARCHAR(64),
    is_online BOOLEAN DEFAULT FALSE,
    last_heartbeat TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ANNOUNCEMENTS QUEUE (for Redis backup)
-- ============================================
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('rare_drop', 'system', 'event') NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    broadcast_to JSON,                -- Array of server IDs, or null for all
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_unprocessed (is_processed, created_at)
);

-- ============================================
-- LEADERBOARD CACHE (updated periodically)
-- ============================================
CREATE TABLE leaderboard_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('souls', 'playtime', 'rare_items', 'cases_opened') NOT NULL,
    steam_id VARCHAR(32) NOT NULL,
    rank_position INT NOT NULL,
    value INT NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_type_player (type, steam_id),
    INDEX idx_type_rank (type, rank_position)
);

-- ============================================
-- SEED DATA: Default Servers
-- ============================================
INSERT INTO servers (id, name, max_players) VALUES
('surf', 'Ghost Surf', 32),
('retake', 'Ghost Retake', 16),
('comp', 'Ghost Competitive', 10);

-- ============================================
-- SEED DATA: Sample Items
-- ============================================
INSERT INTO items (name, type, rarity, weapon, image_url) VALUES
-- Common
('Desert Storm', 'skin', 'common', 'AK-47', '/images/items/ak47_desert_storm.png'),
('Urban DDPAT', 'skin', 'common', 'M4A4', '/images/items/m4a4_urban_ddpat.png'),
('Safari Mesh', 'skin', 'common', 'AWP', '/images/items/awp_safari_mesh.png'),
('Groundwater', 'skin', 'common', 'Glock-18', '/images/items/glock_groundwater.png'),
('Forest Leaves', 'skin', 'common', 'USP-S', '/images/items/usp_forest_leaves.png'),

-- Uncommon
('Blue Laminate', 'skin', 'uncommon', 'AK-47', '/images/items/ak47_blue_laminate.png'),
('Bullet Rain', 'skin', 'uncommon', 'M4A4', '/images/items/m4a4_bullet_rain.png'),
('Electric Hive', 'skin', 'uncommon', 'AWP', '/images/items/awp_electric_hive.png'),
('Water Elemental', 'skin', 'uncommon', 'Glock-18', '/images/items/glock_water_elemental.png'),
('Cortex', 'skin', 'uncommon', 'USP-S', '/images/items/usp_cortex.png'),

-- Rare
('Phantom Disruptor', 'skin', 'rare', 'AK-47', '/images/items/ak47_phantom.png'),
('Neo-Noir', 'skin', 'rare', 'M4A4', '/images/items/m4a4_neonoir.png'),
('Hyper Beast', 'skin', 'rare', 'AWP', '/images/items/awp_hyperbeast.png'),
('Wasteland Rebel', 'skin', 'rare', 'Glock-18', '/images/items/glock_wasteland.png'),
('Kill Confirmed', 'skin', 'rare', 'USP-S', '/images/items/usp_killconfirmed.png'),

-- Epic
('Neon Rider', 'skin', 'epic', 'AK-47', '/images/items/ak47_neonrider.png'),
('Howl', 'skin', 'epic', 'M4A4', '/images/items/m4a4_howl.png'),
('Asiimov', 'skin', 'epic', 'AWP', '/images/items/awp_asiimov.png'),
('Fade', 'gloves', 'epic', NULL, '/images/items/gloves_fade.png'),

-- Legendary
('Fire Serpent', 'skin', 'legendary', 'AK-47', '/images/items/ak47_fireserpent.png'),
('Dragon Lore', 'skin', 'legendary', 'AWP', '/images/items/awp_dragonlore.png'),
('Crimson Web', 'knife', 'legendary', NULL, '/images/items/knife_crimsonweb.png'),
('Karambit Fade', 'knife', 'legendary', NULL, '/images/items/karambit_fade.png'),

-- Ultra
('Ghost Reaper', 'knife', 'ultra', NULL, '/images/items/knife_ghostreaper.png'),
('Spectral Dragon', 'skin', 'ultra', 'AK-47', '/images/items/ak47_spectral.png');

-- ============================================
-- SEED DATA: Sample Cases
-- ============================================
INSERT INTO cases (name, description, cost, image_url) VALUES
('Ghost Case', 'Standard case with a mix of all rarities', 100, '/images/cases/ghost_case.png'),
('Weapon Case', 'Focused on weapon skins', 150, '/images/cases/weapon_case.png'),
('Premium Case', 'Better odds for rare items', 300, '/images/cases/premium_case.png'),
('Knife Case', 'Higher chance of knives', 500, '/images/cases/knife_case.png');

-- ============================================
-- SEED DATA: Case Items (Ghost Case)
-- ============================================
INSERT INTO case_items (case_id, item_id, drop_weight) VALUES
-- Ghost Case (id=1)
(1, 1, 12.0), (1, 2, 12.0), (1, 3, 12.0), (1, 4, 12.0), (1, 5, 12.0),  -- Common: 60%
(1, 6, 5.0), (1, 7, 5.0), (1, 8, 5.0), (1, 9, 5.0), (1, 10, 5.0),      -- Uncommon: 25%
(1, 11, 2.0), (1, 12, 2.0), (1, 13, 2.0), (1, 14, 2.0), (1, 15, 2.0),  -- Rare: 10%
(1, 16, 1.0), (1, 17, 1.0), (1, 18, 1.0), (1, 19, 1.0),                -- Epic: 4%
(1, 20, 0.225), (1, 21, 0.225), (1, 22, 0.225), (1, 23, 0.225),        -- Legendary: 0.9%
(1, 24, 0.05), (1, 25, 0.05);                                          -- Ultra: 0.1%
