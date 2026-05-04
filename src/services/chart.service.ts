import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export class ChartService {
  /**
   * Gera velas OHLC (Open, High, Low, Close) para uma arena específica
   * @param arenaId ID da arena (ex: 'CORE_008', 'AUREX_13')
   * @param timeframe Intervalo de tempo em minutos (padrão: 1)
   * @param limit Número máximo de velas (padrão: 100)
   * @returns Dados formatados para gráfico estilo TradingView
   */
  static async getOHLCData(
    arenaId: string,
    timeframe: number = 1,
    limit: number = 100
  ): Promise<ChartResponse> {
    
    // Buscar todas as transações da arena ordenadas por data
    const transactions = await prisma.arenaTransaction.findMany({
      where: { arenaId },
      orderBy: { createdAt: 'asc' },
      take: limit * 10 // Buscar mais dados para garantir velas completas
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

    // Agrupar transações por intervalos de tempo
    const candles = this.groupTransactionsByTimeframe(transactions, timeframe);
    
    // Calcular estatísticas gerais
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

  /**
   * Obtém dados de múltiplas arenas para comparação
   */
  static async getMultiArenaData(
    arenaIds: string[],
    timeframe: number = 1,
    limit: number = 100
  ): Promise<ChartResponse[]> {
    const promises = arenaIds.map(arenaId => 
      this.getOHLCData(arenaId, timeframe, limit)
    );
    
    return Promise.all(promises);
  }

  /**
   * Obtém estatísticas detalhadas de uma arena
   */
  static async getArenaStats(arenaId: string): Promise<{
    totalTransactions: number;
    totalVolume: number;
    averagePrice: number;
    priceVolatility: number;
    firstTransaction: Date | null;
    lastTransaction: Date | null;
  }> {
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
    
    // Calcular volatilidade (desvio padrão)
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

  /**
   * Agrupa transações em velas por intervalo de tempo
   */
  private static groupTransactionsByTimeframe(
    transactions: any[],
    timeframeMinutes: number
  ): CandleData[] {
    if (transactions.length === 0) return [];

    const candlesMap = new Map<string, any[]>();
    
    // Agrupar transações por intervalo
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      const timestamp = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        Math.floor(date.getMinutes() / timeframeMinutes) * timeframeMinutes,
        0,
        0
      );
      
      const key = timestamp.toISOString();
      if (!candlesMap.has(key)) {
        candlesMap.set(key, []);
      }
      candlesMap.get(key)!.push(transaction);
    });

    // Converter grupos em velas OHLC
    const candles: CandleData[] = [];
    
    for (const [timestamp, groupTransactions] of candlesMap) {
      const prices = groupTransactions.map(t => t.arenaPrice);
      const volumes = groupTransactions.map(t => Math.abs(t.transactionAmount));
      
      const candle: CandleData = {
        timestamp: new Date(timestamp),
        open: prices[0], // Primeira transação
        high: Math.max(...prices), // Maior preço
        low: Math.min(...prices), // Menor preço
        close: prices[prices.length - 1], // Última transação
        volume: volumes.reduce((sum, v) => sum + v, 0), // Soma dos volumes
        arenaId: groupTransactions[0].arenaId
      };
      
      candles.push(candle);
    }

    // Ordenar por timestamp
    return candles.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Formata dados para exportação JSON (compatível com TradingView)
   */
  static formatForTradingView(chartData: ChartResponse): string {
    const formatted = chartData.candles.map(candle => ({
      t: Math.floor(candle.timestamp.getTime() / 1000), // Timestamp em segundos
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

  /**
   * Obtém lista de arenas disponíveis para análise
   */
  static async getAvailableArenas(): Promise<string[]> {
    const transactions = await prisma.arenaTransaction.findMany({
      select: { arenaId: true },
      distinct: ['arenaId']
    });

    return transactions.map(t => t.arenaId);
  }
}
