"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class RankingService {
    static async analyzePlayerRanking(playerId) {
        const transactions = await prisma.arenaTransaction.findMany({
            where: { playerId },
            include: {
                player: {
                    select: {
                        name: true,
                        rank: true
                    }
                }
            }
        });
        if (transactions.length === 0) {
            return {
                playerId,
                playerName: null,
                currentRank: client_1.PlayerRank.INICIANTE,
                totalVolume: 0,
                arenaVolumes: {},
                achievedRanks: [client_1.PlayerRank.INICIANTE],
                nextRankProgress: null
            };
        }
        const arenaVolumes = {};
        let totalVolume = 0;
        transactions.forEach(transaction => {
            const volume = Math.abs(transaction.transactionAmount);
            if (!arenaVolumes[transaction.arenaId]) {
                arenaVolumes[transaction.arenaId] = 0;
            }
            arenaVolumes[transaction.arenaId] += volume;
            totalVolume += volume;
        });
        const achievedRanks = this.calculateAchievedRanks(arenaVolumes);
        const currentRank = this.determineRankByVolume(totalVolume);
        const nextRankProgress = this.calculateNextRankProgress(currentRank, totalVolume);
        return {
            playerId,
            playerName: transactions[0]?.player.name || null,
            currentRank,
            totalVolume,
            arenaVolumes,
            achievedRanks,
            nextRankProgress
        };
    }
    static async checkInstitucionalStatus(playerId, arenaIds) {
        const ranking = await this.analyzePlayerRanking(playerId);
        const targetArenas = arenaIds || ['GOLD', 'DIAMOND'];
        const institutionalArenas = [];
        for (const arenaId of targetArenas) {
            const arenaVolume = ranking.arenaVolumes[arenaId] || 0;
            const threshold = this.RANK_THRESHOLDS[arenaId]?.INSTITUCIONAL || 0;
            if (arenaVolume >= threshold) {
                institutionalArenas.push(arenaId);
            }
        }
        const requiredArenas = 2;
        const isInstitucional = institutionalArenas.length >= requiredArenas;
        return {
            isInstitucional,
            institutionalArenas,
            totalInstitutionalArenas: institutionalArenas.length,
            requiredArenas
        };
    }
    static async getGlobalRanking(limit = 50) {
        const playersWithTransactions = await prisma.arenaTransaction.groupBy({
            by: ['playerId'],
            _count: {
                playerId: true
            },
            orderBy: {
                _count: {
                    playerId: 'desc'
                }
            },
            take: limit
        });
        const rankings = [];
        for (const playerData of playersWithTransactions) {
            const ranking = await this.analyzePlayerRanking(playerData.playerId);
            rankings.push(ranking);
        }
        return rankings.sort((a, b) => b.totalVolume - a.totalVolume);
    }
    static calculateAchievedRanks(arenaVolumes) {
        const achievedRanks = new Set([client_1.PlayerRank.INICIANTE]);
        Object.entries(arenaVolumes).forEach(([arenaId, volume]) => {
            const thresholds = this.RANK_THRESHOLDS[arenaId];
            if (!thresholds)
                return;
            if (volume >= thresholds.INSTITUCIONAL) {
                achievedRanks.add(client_1.PlayerRank.INSTITUCIONAL);
                achievedRanks.add(client_1.PlayerRank.BIG_PLAYER);
                achievedRanks.add(client_1.PlayerRank.AVANCADO);
            }
            else if (volume >= thresholds.BIG_PLAYER) {
                achievedRanks.add(client_1.PlayerRank.BIG_PLAYER);
                achievedRanks.add(client_1.PlayerRank.AVANCADO);
            }
            else if (volume >= thresholds.AVANCADO) {
                achievedRanks.add(client_1.PlayerRank.AVANCADO);
            }
        });
        return Array.from(achievedRanks);
    }
    static determineRankByVolume(totalVolume) {
        if (totalVolume >= 10000)
            return client_1.PlayerRank.INSTITUCIONAL;
        if (totalVolume >= 5000)
            return client_1.PlayerRank.BIG_PLAYER;
        if (totalVolume >= 2000)
            return client_1.PlayerRank.AVANCADO;
        return client_1.PlayerRank.INICIANTE;
    }
    static calculateNextRankProgress(currentRank, currentVolume) {
        const thresholds = {
            [client_1.PlayerRank.INICIANTE]: 2000,
            [client_1.PlayerRank.AVANCADO]: 5000,
            [client_1.PlayerRank.BIG_PLAYER]: 10000,
            [client_1.PlayerRank.INSTITUCIONAL]: null
        };
        const nextRankVolume = thresholds[currentRank];
        if (!nextRankVolume)
            return null;
        const nextRank = currentRank === client_1.PlayerRank.INICIANTE ? client_1.PlayerRank.AVANCADO :
            currentRank === client_1.PlayerRank.AVANCADO ? client_1.PlayerRank.BIG_PLAYER :
                client_1.PlayerRank.INSTITUCIONAL;
        return {
            rank: nextRank,
            currentVolume,
            requiredVolume: nextRankVolume,
            progressPercentage: Math.min((currentVolume / nextRankVolume) * 100, 100)
        };
    }
    static getArenaThresholds(arenaId) {
        return this.RANK_THRESHOLDS[arenaId] || null;
    }
    static async canPromoteToInstitucional(playerId) {
        const status = await this.checkInstitucionalStatus(playerId);
        const requiredArenas = ['GOLD', 'DIAMOND'];
        const missingArenas = requiredArenas.filter(arena => !status.institutionalArenas.includes(arena));
        const canPromote = missingArenas.length === 0;
        let currentStatus = '';
        if (status.isInstitucional) {
            currentStatus = '👑 PLAYER INSTITUCIONAL - Atingiu requisitos em todas as arenas premium!';
        }
        else if (status.institutionalArenas.length === 1) {
            currentStatus = `⚠️ Quase INSTITUCIONAL! Precisa apenas de ${missingArenas[0]}`;
        }
        else {
            currentStatus = `🎯 Ainda INICIANTE. Precisa de ${missingArenas.join(' e ')}`;
        }
        return {
            canPromote,
            missingArenas,
            currentStatus
        };
    }
}
exports.RankingService = RankingService;
RankingService.RANK_THRESHOLDS = {
    'AUREX_13': {
        INICIANTE: 0,
        AVANCADO: 1000,
        BIG_PLAYER: 5000,
        INSTITUCIONAL: 15000
    },
    'AUREX_X': {
        INICIANTE: 0,
        AVANCADO: 800,
        BIG_PLAYER: 4000,
        INSTITUCIONAL: 12000
    },
    'DIAMOND': {
        INICIANTE: 0,
        AVANCADO: 1500,
        BIG_PLAYER: 7500,
        INSTITUCIONAL: 25000
    },
    'GOLD': {
        INICIANTE: 0,
        AVANCADO: 1200,
        BIG_PLAYER: 6000,
        INSTITUCIONAL: 20000
    },
    'CORE_008': {
        INICIANTE: 0,
        AVANCADO: 500,
        BIG_PLAYER: 2500,
        INSTITUCIONAL: 8000
    }
};
//# sourceMappingURL=ranking.service.js.map