-- CreateTable
CREATE TABLE "operators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "rank" TEXT NOT NULL DEFAULT 'INICIANTE',
    "tokenBalance" INTEGER NOT NULL DEFAULT 1000,
    "reputationScore" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "clanId" TEXT,
    CONSTRAINT "operators_clanId_fkey" FOREIGN KEY ("clanId") REFERENCES "clans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "clans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reputationScore" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "clans_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "operators" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "operational_cores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "coreType" TEXT NOT NULL,
    "energyCapacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "social_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operatorId" TEXT NOT NULL,
    "operationalCoreId" TEXT NOT NULL,
    "energyConsumed" INTEGER NOT NULL,
    "reputationDelta" REAL NOT NULL DEFAULT 0,
    "tokenDelta" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "social_transactions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_transactions_operationalCoreId_fkey" FOREIGN KEY ("operationalCoreId") REFERENCES "operational_cores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "arena_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "arenaId" TEXT NOT NULL,
    "transactionAmount" INTEGER NOT NULL,
    "arenaPrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "arena_transactions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "operators" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "operators_email_key" ON "operators"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clans_name_key" ON "clans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "operational_cores_name_key" ON "operational_cores"("name");
