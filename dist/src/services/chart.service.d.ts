export interface CandleData {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    arenaId: string;
}
export interface ChartResponse {
    arenaId: string;
    timeframe: string;
    candles: CandleData[];
    totalVolume: number;
    priceRange: {
        min: number;
        max: number;
    };
}
export declare class ChartService {
    static getOHLCData(arenaId: string, timeframe?: number, limit?: number): Promise<ChartResponse>;
    static getMultiArenaData(arenaIds: string[], timeframe?: number, limit?: number): Promise<ChartResponse[]>;
    static getArenaStats(arenaId: string): Promise<{
        totalTransactions: number;
        totalVolume: number;
        averagePrice: number;
        priceVolatility: number;
        firstTransaction: Date | null;
        lastTransaction: Date | null;
    }>;
    private static groupTransactionsByTimeframe;
    static formatForTradingView(chartData: ChartResponse): string;
    static getAvailableArenas(): Promise<string[]>;
}
