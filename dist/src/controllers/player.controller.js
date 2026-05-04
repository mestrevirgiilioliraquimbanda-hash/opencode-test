"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerController = void 0;
const common_1 = require("@nestjs/common");
const ranking_service_js_1 = require("../services/ranking.service.js");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let PlayerController = class PlayerController {
    async getPlayerProfile() {
        try {
            const player = await prisma.operator.findUnique({
                where: { email: 'aurex-data-player@aurex.arena' },
                include: {
                    clan: {
                        select: {
                            id: true,
                            name: true,
                            reputationScore: true
                        }
                    },
                    ownedClans: {
                        select: {
                            id: true,
                            name: true,
                            reputationScore: true,
                            createdAt: true
                        }
                    }
                }
            });
            if (!player) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Jogador não encontrado'
                }, common_1.HttpStatus.NOT_FOUND);
            }
            const recentTransactions = await prisma.arenaTransaction.findMany({
                where: { playerId: player.id },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    arenaId: true,
                    transactionAmount: true,
                    arenaPrice: true,
                    createdAt: true
                }
            });
            const arenaStats = await prisma.arenaTransaction.groupBy({
                by: ['arenaId'],
                where: { playerId: player.id },
                _sum: {
                    transactionAmount: true
                },
                _count: {
                    arenaId: true
                }
            });
            const arenaVolumes = arenaStats.reduce((acc, stat) => {
                acc[stat.arenaId] = Math.abs(stat._sum.transactionAmount || 0);
                return acc;
            }, {});
            return {
                success: true,
                data: {
                    profile: {
                        id: player.id,
                        email: player.email,
                        name: player.name,
                        rank: player.rank,
                        tokenBalance: player.tokenBalance,
                        reputationScore: player.reputationScore,
                        createdAt: player.createdAt,
                        updatedAt: player.updatedAt
                    },
                    clan: player.clan,
                    ownedClans: player.ownedClans,
                    recentTransactions,
                    arenaVolumes,
                    totalTransactions: recentTransactions.length,
                    totalVolume: Object.values(arenaVolumes).reduce((sum, volume) => sum + volume, 0)
                }
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Erro ao buscar perfil do jogador',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPlayerRanking() {
        try {
            const player = await prisma.operator.findUnique({
                where: { email: 'aurex-data-player@aurex.arena' }
            });
            if (!player) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Jogador não encontrado'
                }, common_1.HttpStatus.NOT_FOUND);
            }
            const ranking = await ranking_service_js_1.RankingService.analyzePlayerRanking(player.id);
            const institucionalStatus = await ranking_service_js_1.RankingService.checkInstitucionalStatus(player.id);
            const promotionCheck = await ranking_service_js_1.RankingService.canPromoteToInstitucional(player.id);
            const globalRanking = await ranking_service_js_1.RankingService.getGlobalRanking(50);
            const playerPosition = globalRanking.findIndex(p => p.playerId === player.id);
            const currentPosition = playerPosition !== -1 ? playerPosition + 1 : null;
            return {
                success: true,
                data: {
                    playerId: player.id,
                    playerName: player.name,
                    currentRank: player.rank,
                    ranking,
                    institucionalStatus,
                    promotionCheck,
                    globalPosition: currentPosition,
                    isInTopRanking: currentPosition !== null && currentPosition <= 10
                }
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Erro ao buscar ranking do jogador',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getArenaProgress() {
        try {
            const player = await prisma.operator.findUnique({
                where: { email: 'aurex-data-player@aurex.arena' }
            });
            if (!player) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Jogador não encontrado'
                }, common_1.HttpStatus.NOT_FOUND);
            }
            const ranking = await ranking_service_js_1.RankingService.analyzePlayerRanking(player.id);
            const arenaProgress = [];
            Object.entries(ranking.arenaVolumes).forEach(([arenaId, volume]) => {
                const thresholds = ranking_service_js_1.RankingService.getArenaThresholds(arenaId);
                if (thresholds) {
                    let currentRank = 'INICIANTE';
                    let nextRankProgress = null;
                    if (volume >= thresholds.INSTITUCIONAL) {
                        currentRank = 'INSTITUCIONAL';
                    }
                    else if (volume >= thresholds.BIG_PLAYER) {
                        currentRank = 'BIG_PLAYER';
                        nextRankProgress = {
                            rank: 'INSTITUCIONAL',
                            currentVolume: volume,
                            requiredVolume: thresholds.INSTITUCIONAL,
                            progressPercentage: (volume / thresholds.INSTITUCIONAL) * 100
                        };
                    }
                    else if (volume >= thresholds.AVANCADO) {
                        currentRank = 'AVANCADO';
                        nextRankProgress = {
                            rank: 'BIG_PLAYER',
                            currentVolume: volume,
                            requiredVolume: thresholds.BIG_PLAYER,
                            progressPercentage: (volume / thresholds.BIG_PLAYER) * 100
                        };
                    }
                    else {
                        nextRankProgress = {
                            rank: 'AVANCADO',
                            currentVolume: volume,
                            requiredVolume: thresholds.AVANCADO,
                            progressPercentage: (volume / thresholds.AVANCADO) * 100
                        };
                    }
                    arenaProgress.push({
                        arenaId,
                        currentVolume: volume,
                        thresholds,
                        currentRank,
                        nextRankProgress
                    });
                }
            });
            return {
                success: true,
                data: {
                    playerId: player.id,
                    playerName: player.name,
                    arenaProgress: arenaProgress.sort((a, b) => b.currentVolume - a.currentVolume)
                }
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Erro ao buscar progresso por arena',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPlayerTransactions() {
        try {
            const player = await prisma.operator.findUnique({
                where: { email: 'aurex-data-player@aurex.arena' }
            });
            if (!player) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Jogador não encontrado'
                }, common_1.HttpStatus.NOT_FOUND);
            }
            const transactions = await prisma.arenaTransaction.findMany({
                where: { playerId: player.id },
                orderBy: { createdAt: 'desc' },
                take: 100,
                select: {
                    id: true,
                    arenaId: true,
                    transactionAmount: true,
                    arenaPrice: true,
                    createdAt: true
                }
            });
            return {
                success: true,
                data: {
                    playerId: player.id,
                    playerName: player.name,
                    transactions,
                    count: transactions.length,
                    totalVolume: transactions.reduce((sum, t) => sum + Math.abs(t.transactionAmount), 0)
                }
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Erro ao buscar transações do jogador',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.PlayerController = PlayerController;
__decorate([
    (0, common_1.Get)('profile'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "getPlayerProfile", null);
__decorate([
    (0, common_1.Get)('ranking'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "getPlayerRanking", null);
__decorate([
    (0, common_1.Get)('arena-progress'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "getArenaProgress", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlayerController.prototype, "getPlayerTransactions", null);
exports.PlayerController = PlayerController = __decorate([
    (0, common_1.Controller)('api/player')
], PlayerController);
//# sourceMappingURL=player.controller.js.map