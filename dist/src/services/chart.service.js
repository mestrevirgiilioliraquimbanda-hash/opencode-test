"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ChartService {
    static async getOHLCData(arenaId, timeframe = 1, limit = 100) {
        const transactions = await prisma.arenaTransaction.findMany({
            where: { arenaId },
            orderBy: { createdAt: 'asc' },
            take: limit * 10
        });
        if (transactions.length === 0) {
            return {
                arenaId,
                timeframe: `${timeframe}m`,
                candles: [],
                totalVolume: 0,
                priceRange: { min: 0, max: 0 }
            };
        }
        const candles = this.groupTransactionsByTimeframe(transactions, timeframe);
        const totalVolume = candles.reduce((sum, candle) => sum + candle.volume, 0);
        const allPrices = candles.flatMap(candle => [candle.open, candle.high, candle.low, candle.close]);
        const priceRange = {
            min: allPrices.length > 0 ? Math.min(...allPrices) : 0,
            max: allPrices.length > 0 ? Math.max(...allPrices) : 0
        };
        return {
            arenaId,
            timeframe: `${timeframe}m`,
            candles,
            totalVolume,
            priceRange
        };
    }
    static async getMultiArenaData(arenaIds, timeframe = 1, limit = 100) {
        const promises = arenaIds.map(arenaId => this.getOHLCData(arenaId, timeframe, limit));
        return Promise.all(promises);
    }
    static async getArenaStats(arenaId) {
        const transactions = await prisma.arenaTransaction.findMany({
            where: { arenaId },
            orderBy: { createdAt: 'asc' }
        });
        if (transactions.length === 0) {
            return {
                totalTransactions: 0,
                totalVolume: 0,
                averagePrice: 0,
                priceVolatility: 0,
                firstTransaction: null,
                lastTransaction: null
            };
        }
        const totalVolume = transactions.reduce((sum, t) => sum + Math.abs(t.transactionAmount), 0);
        const prices = transactions.map(t => t.arenaPrice);
        const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const variance = prices.reduce((sum, price) => sum + Math.pow(price - averagePrice, 2), 0) / prices.length;
        const priceVolatility = Math.sqrt(variance);
        return {
            totalTransactions: transactions.length,
            totalVolume,
            averagePrice,
            priceVolatility,
            firstTransaction: transactions[0]?.createdAt || null,
            lastTransaction: transactions[transactions.length - 1]?.createdAt || null
        };
    }
    static groupTransactionsByTimeframe(transactions, timeframeMinutes) {
        if (transactions.length === 0)
            return [];
        const candlesMap = new Map();
        transactions.forEach(transaction => {
            const date = new Date(transaction.createdAt);
            const timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), Math.floor(date.getMinutes() / timeframeMinutes) * timeframeMinutes, 0, 0);
            const key = timestamp.toISOString();
            if (!candlesMap.has(key)) {
                candlesMap.set(key, []);
            }
            candlesMap.get(key).push(transaction);
        });
        const candles = [];
        for (const [timestamp, groupTransactions] of candlesMap) {
            const prices = groupTransactions.map(t => t.arenaPrice);
            const volumes = groupTransactions.map(t => Math.abs(t.transactionAmount));
            const candle = {
                timestamp: new Date(timestamp),
                open: prices[0],
                high: Math.max(...prices),
                low: Math.min(...prices),
                close: prices[prices.length - 1],
                volume: volumes.reduce((sum, v) => sum + v, 0),
                arenaId: groupTransactions[0].arenaId
            };
            candles.push(candle);
        }
        return candles.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    static formatForTradingView(chartData) {
        const formatted = chartData.candles.map(candle => ({
            t: Math.floor(candle.timestamp.getTime() / 1000),
            o: candle.open,
            h: candle.high,
            l: candle.low,
            c: candle.close,
            v: candle.volume
        }));
        return JSON.stringify({
            symbol: chartData.arenaId,
            timeframe: chartData.timeframe,
            data: formatted,
            stats: {
                totalVolume: chartData.totalVolume,
                priceRange: chartData.priceRange
            }
        }, null, 2);
    }
    static async getAvailableArenas() {
        const transactions = await prisma.arenaTransaction.findMany({
            select: { arenaId: true },
            distinct: ['arenaId']
        });
        return transactions.map(t => t.arenaId);
    }
}
exports.ChartService = ChartService;
//# sourceMappingURL=chart.service.js.map