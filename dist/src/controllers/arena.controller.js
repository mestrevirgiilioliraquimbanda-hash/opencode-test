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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArenaController = void 0;
const common_1 = require("@nestjs/common");
const chart_service_js_1 = require("../services/chart.service.js");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let ArenaController = class ArenaController {
    async getAllArenas() {
        try {
            const arenas = await prisma.operationalCore.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    coreType: true,
                    energyCapacity: true,
                    createdAt: true
                },
                orderBy: { name: 'asc' }
            });
            return {
                success: true,
                data: arenas,
                count: arenas.length
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Erro ao buscar arenas',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getArenaChart(arenaId, timeframe, limit) {
        try {
            const timeFrameMinutes = timeframe ? parseInt(timeframe) : 1;
            const candleLimit = limit ? parseInt(limit) : 100;
            if (isNaN(timeFrameMinutes) || timeFrameMinutes < 1 || timeFrameMinutes > 60) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Timeframe inválido. Deve estar entre 1 e 60 minutos.'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            if (isNaN(candleLimit) || candleLimit < 1 || candleLimit > 1000) {
                throw new common_1.HttpException({
                    success: false,
                    message: 'Limit inválido. Deve estar entre 1 e 1000 velas.'
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            const chartData = await chart_service_js_1.ChartService.getOHLCData(arenaId, timeFrameMinutes, candleLimit);
            if (chartData.candles.length === 0) {
                return {
                    success: true,
                    data: {
                        arenaId: chartData.arenaId,
                        timeframe: chartData.timeframe,
                        candles: [],
                        totalVolume: 0,
                        priceRange: { min: 0, max: 0 },
                        message: 'Nenhuma transação encontrada para esta arena.'
                    }
                };
            }
            return {
                success: true,
                data: chartData
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException({
                success: false,
                message: 'Erro ao buscar dados do gráfico',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getArenaStats(arenaId) {
        try {
            const stats = await chart_service_js_1.ChartService.getArenaStats(arenaId);
            return {
                success: true,
                data: {
                    arenaId,
                    ...stats
                }
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Erro ao buscar estatísticas da arena',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTradingViewData(arenaId, timeframe, limit) {
        try {
            const timeFrameMinutes = timeframe ? parseInt(timeframe) : 1;
            const candleLimit = limit ? parseInt(limit) : 100;
            const chartData = await chart_service_js_1.ChartService.getOHLCData(arenaId, timeFrameMinutes, candleLimit);
            const tradingViewFormat = chart_service_js_1.ChartService.formatForTradingView(chartData);
            return {
                success: true,
                data: JSON.parse(tradingViewFormat)
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Erro ao formatar dados para TradingView',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAvailableArenas() {
        try {
            const availableArenas = await chart_service_js_1.ChartService.getAvailableArenas();
            return {
                success: true,
                data: availableArenas,
                count: availableArenas.length
            };
        }
        catch (error) {
            throw new common_1.HttpException({
                success: false,
                message: 'Erro ao buscar arenas disponíveis',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ArenaController = ArenaController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ArenaController.prototype, "getAllArenas", null);
__decorate([
    (0, common_1.Get)(':arenaId/chart'),
    __param(0, (0, common_1.Param)('arenaId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ArenaController.prototype, "getArenaChart", null);
__decorate([
    (0, common_1.Get)(':arenaId/stats'),
    __param(0, (0, common_1.Param)('arenaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ArenaController.prototype, "getArenaStats", null);
__decorate([
    (0, common_1.Get)(':arenaId/tradingview'),
    __param(0, (0, common_1.Param)('arenaId')),
    __param(1, (0, common_1.Query)('timeframe')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ArenaController.prototype, "getTradingViewData", null);
__decorate([
    (0, common_1.Get)('available'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ArenaController.prototype, "getAvailableArenas", null);
exports.ArenaController = ArenaController = __decorate([
    (0, common_1.Controller)('api/arenas')
], ArenaController);
//# sourceMappingURL=arena.controller.js.map