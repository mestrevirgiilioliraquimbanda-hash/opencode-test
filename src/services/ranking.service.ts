import { PrismaClient, PlayerRank, CoreType } from '@prisma/client';

const prisma = new PrismaClient();

export interface PlayerRankingData {
  playerId: string;
  playerName: string | null;
  currentRank: PlayerRank;
  totalVolume: number;
  arenaVolumes: Record<string, number>;
  achievedRanks: PlayerRank[];
  nextRankProgress: {
    rank: PlayerRank;
    currentVolume: number;
    requiredVolume: number;
    progressPercentage: number;
  } | null;
}

export interface RankingThresholds {
  [key: string]: {
    INICIANTE: number;
    AVANCADO: number;
    BIG_PLAYER: number;
    INSTITUCIONAL: number;
  };
}

export class RankingService {
  // Volume thresholds para cada rank por arena
  private static readonly RANK_THRESHOLDS: RankingThresholds = {
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

  /**
   * Analisa o ranking de um jogador com base no volume negociado
   */
  static async analyzePlayerRanking(playerId: string): Promise<PlayerRankingData> {
    // Buscar todas as transações do jogador
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
        currentRank: PlayerRank.INICIANTE,
        totalVolume: 0,
        arenaVolumes: {},
        achievedRanks: [PlayerRank.INICIANTE],
        nextRankProgress: null
      };
    }

    // Calcular volume total por arena
    const arenaVolumes: Record<string, number> = {};
    let totalVolume = 0;

    transactions.forEach(transaction => {
      const volume = Math.abs(transaction.transactionAmount);
      if (!arenaVolumes[transaction.arenaId]) {
        arenaVolumes[transaction.arenaId] = 0;
      }
      arenaVolumes[transaction.arenaId] += volume;
      totalVolume += volume;
    });

    // Determinar ranks alcançados por arena
    const achievedRanks = this.calculateAchievedRanks(arenaVolumes);
    
    // Determinar o rank atual baseado no volume geral
    const currentRank = this.determineRankByVolume(totalVolume);
    
    // Calcular progresso para o próximo rank
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

  /**
   * Verifica se o jogador atingiu rank INSTITUCIONAL em arenas específicas
   */
  static async checkInstitucionalStatus(playerId: string, arenaIds?: string[]): Promise<{
    isInstitucional: boolean;
    institutionalArenas: string[];
    totalInstitutionalArenas: number;
    requiredArenas: number;
  }> {
    const ranking = await this.analyzePlayerRanking(playerId);
    
    // Se não especificou arenas, verifica Gold e Diamond (requisito principal)
    const targetArenas = arenaIds || ['GOLD', 'DIAMOND'];
    
    const institutionalArenas: string[] = [];
    
    for (const arenaId of targetArenas) {
      const arenaVolume = ranking.arenaVolumes[arenaId] || 0;
      const threshold = this.RANK_THRESHOLDS[arenaId]?.INSTITUCIONAL || 0;
      
      if (arenaVolume >= threshold) {
        institutionalArenas.push(arenaId);
      }
    }

    // Para ser INSTITUCIONAL completo, precisa atingir em pelo menos 2 arenas premium
    const requiredArenas = 2;
    const isInstitucional = institutionalArenas.length >= requiredArenas;

    return {
      isInstitucional,
      institutionalArenas,
      totalInstitutionalArenas: institutionalArenas.length,
      requiredArenas
    };
  }

  /**
   * Obtém ranking geral de todos os jogadores
   */
  static async getGlobalRanking(limit: number = 50): Promise<PlayerRankingData[]> {
    // Buscar todos os jogadores com transações
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

    const rankings: PlayerRankingData[] = [];

    for (const playerData of playersWithTransactions) {
      const ranking = await this.analyzePlayerRanking(playerData.playerId);
      rankings.push(ranking);
    }

    // Ordenar por volume total
    return rankings.sort((a, b) => b.totalVolume - a.totalVolume);
  }

  /**
   * Calcula os ranks alcançados com base no volume por arena
   */
  private static calculateAchievedRanks(arenaVolumes: Record<string, number>): PlayerRank[] {
    const achievedRanks = new Set<PlayerRank>([PlayerRank.INICIANTE]);

    Object.entries(arenaVolumes).forEach(([arenaId, volume]) => {
      const thresholds = this.RANK_THRESHOLDS[arenaId];
      if (!thresholds) return;

      if (volume >= thresholds.INSTITUCIONAL) {
        achievedRanks.add(PlayerRank.INSTITUCIONAL);
        achievedRanks.add(PlayerRank.BIG_PLAYER);
        achievedRanks.add(PlayerRank.AVANCADO);
      } else if (volume >= thresholds.BIG_PLAYER) {
        achievedRanks.add(PlayerRank.BIG_PLAYER);
        achievedRanks.add(PlayerRank.AVANCADO);
      } else if (volume >= thresholds.AVANCADO) {
        achievedRanks.add(PlayerRank.AVANCADO);
      }
    });

    return Array.from(achievedRanks);
  }

  /**
   * Determina o rank baseado no volume total
   */
  private static determineRankByVolume(totalVolume: number): PlayerRank {
    if (totalVolume >= 10000) return PlayerRank.INSTITUCIONAL;
    if (totalVolume >= 5000) return PlayerRank.BIG_PLAYER;
    if (totalVolume >= 2000) return PlayerRank.AVANCADO;
    return PlayerRank.INICIANTE;
  }

  /**
   * Calcula progresso para o próximo rank
   */
  private static calculateNextRankProgress(
    currentRank: PlayerRank, 
    currentVolume: number
  ): PlayerRankingData['nextRankProgress'] {
    const thresholds = {
      [PlayerRank.INICIANTE]: 2000,
      [PlayerRank.AVANCADO]: 5000,
      [PlayerRank.BIG_PLAYER]: 10000,
      [PlayerRank.INSTITUCIONAL]: null
    };

    const nextRankVolume = thresholds[currentRank];
    if (!nextRankVolume) return null;

    const nextRank = currentRank === PlayerRank.INICIANTE ? PlayerRank.AVANCADO :
                   currentRank === PlayerRank.AVANCADO ? PlayerRank.BIG_PLAYER :
                   PlayerRank.INSTITUCIONAL;

    return {
      rank: nextRank,
      currentVolume,
      requiredVolume: nextRankVolume,
      progressPercentage: Math.min((currentVolume / nextRankVolume) * 100, 100)
    };
  }

  /**
   * Obtém os thresholds para uma arena específica
   */
  static getArenaThresholds(arenaId: string): RankingThresholds[string] | null {
    return this.RANK_THRESHOLDS[arenaId] || null;
  }

  /**
   * Verifica se um jogador pode ser promovido para INSTITUCIONAL
   */
  static async canPromoteToInstitucional(playerId: string): Promise<{
    canPromote: boolean;
    missingArenas: string[];
    currentStatus: string;
  }> {
    const status = await this.checkInstitucionalStatus(playerId);
    
    const requiredArenas = ['GOLD', 'DIAMOND'];
    const missingArenas = requiredArenas.filter(
      arena => !status.institutionalArenas.includes(arena)
    );

    const canPromote = missingArenas.length === 0;
    
    let currentStatus = '';
    if (status.isInstitucional) {
      currentStatus = '👑 PLAYER INSTITUCIONAL - Atingiu requisitos em todas as arenas premium!';
    } else if (status.institutionalArenas.length === 1) {
      currentStatus = `⚠️ Quase INSTITUCIONAL! Precisa apenas de ${missingArenas[0]}`;
    } else {
      currentStatus = `🎯 Ainda INICIANTE. Precisa de ${missingArenas.join(' e ')}`;
    }

    return {
      canPromote,
      missingArenas,
      currentStatus
    };
  }
}
