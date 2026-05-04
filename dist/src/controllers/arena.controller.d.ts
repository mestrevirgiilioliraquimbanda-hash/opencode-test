export declare class ArenaController {
    getAllArenas(): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            name: string;
            coreType: import(".prisma/client").$Enums.CoreType;
            energyCapacity: number;
        }[];
        count: number;
    }>;
    getArenaChart(arenaId: string, timeframe?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            arenaId: string;
            timeframe: string;
            candles: any[];
            totalVolume: number;
            priceRange: {
                min: number;
                max: number;
            };
            message: string;
        };
    } | {
        success: boolean;
        data: import("../services/chart.service.js").ChartResponse;
    }>;
    getArenaStats(arenaId: string): Promise<{
        success: boolean;
        data: {
            totalTransactions: number;
            totalVolume: number;
            averagePrice: number;
            priceVolatility: number;
            firstTransaction: Date | null;
            lastTransaction: Date | null;
            arenaId: string;
        };
    }>;
    getTradingViewData(arenaId: string, timeframe?: string, limit?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getAvailableArenas(): Promise<{
        success: boolean;
        data: string[];
        count: number;
    }>;
}
