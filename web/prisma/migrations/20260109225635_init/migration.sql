-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "steamId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "souls" INTEGER NOT NULL DEFAULT 0,
    "totalSoulsEarned" INTEGER NOT NULL DEFAULT 0,
    "playtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalKills" INTEGER NOT NULL DEFAULT 0,
    "casesOpened" INTEGER NOT NULL DEFAULT 0,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "premiumTier" TEXT NOT NULL DEFAULT 'none',
    "premiumExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "itemId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "weapon" TEXT NOT NULL,
    "skinName" TEXT NOT NULL,
    "wear" TEXT NOT NULL,
    "floatValue" REAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "dopplerPhase" TEXT,
    "itemType" TEXT NOT NULL,
    "equippedCt" BOOLEAN NOT NULL DEFAULT false,
    "equippedT" BOOLEAN NOT NULL DEFAULT false,
    "obtainedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "obtainedFrom" TEXT,
    CONSTRAINT "InventoryItem_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaseOpen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "caseName" TEXT NOT NULL,
    "caseId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemWeapon" TEXT NOT NULL,
    "itemWear" TEXT NOT NULL,
    "floatValue" REAL NOT NULL,
    "soulsCost" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CaseOpen_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SoulTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "balanceAfter" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SoulTransaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ip" TEXT,
    "port" INTEGER,
    "apiKey" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "currentPlayers" INTEGER NOT NULL DEFAULT 0,
    "maxPlayers" INTEGER NOT NULL DEFAULT 32,
    "currentMap" TEXT,
    "lastHeartbeat" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_steamId_key" ON "Player"("steamId");

-- CreateIndex
CREATE INDEX "InventoryItem_playerId_idx" ON "InventoryItem"("playerId");

-- CreateIndex
CREATE INDEX "InventoryItem_itemType_idx" ON "InventoryItem"("itemType");

-- CreateIndex
CREATE INDEX "CaseOpen_playerId_idx" ON "CaseOpen"("playerId");

-- CreateIndex
CREATE INDEX "CaseOpen_createdAt_idx" ON "CaseOpen"("createdAt");

-- CreateIndex
CREATE INDEX "SoulTransaction_playerId_idx" ON "SoulTransaction"("playerId");

-- CreateIndex
CREATE INDEX "SoulTransaction_createdAt_idx" ON "SoulTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Server_apiKey_key" ON "Server"("apiKey");
