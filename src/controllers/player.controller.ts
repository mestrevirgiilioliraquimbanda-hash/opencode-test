import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { RankingService } from '../services/ranking.service.js';
import { OperatorService } from '../services/operator.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('player')
export class PlayerController {
  
  /**
   * Obtém o perfil completo do jogador aurex-data-player
   * GET /api/player/profile
   */
  @Get('profile')
  async getPlayerProfile() {
    try {
      // Buscar o jogador específico
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
        throw new HttpException(
          {
            success: false,
            message: 'Jogador não encontrado'
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Buscar transações recentes
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

      // Buscar estatísticas de arenas
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
      }, {} as Record<string, number>);

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

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar perfil do jogador',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtém o status de Ranking e Progresso do jogador
   * GET /api/player/ranking
   */
  @Get('ranking')
  async getPlayerRanking() {
    try {
      // Buscar o jogador
      const player = await prisma.operator.findUnique({
        where: { email: 'aurex-data-player@aurex.arena' }
      });

      if (!player) {
        throw new HttpException(
          {
            success: false,
            message: 'Jogador não encontrado'
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Analisar ranking completo
      const ranking = await RankingService.analyzePlayerRanking(player.id);

      // Verificar status INSTITUCIONAL
      const institucionalStatus = await RankingService.checkInstitucionalStatus(player.id);

      // Verificação de promoção
      const promotionCheck = await RankingService.canPromoteToInstitucional(player.id);

      // Posição no ranking global
      const globalRanking = await RankingService.getGlobalRanking(50);
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

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar ranking do jogador',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtém o progresso detalhado para cada arena
   * GET /api/player/arena-progress
   */
  @Get('arena-progress')
  async getArenaProgress() {
    try {
      const player = await prisma.operator.findUnique({
        where: { email: 'aurex-data-player@aurex.arena' }
      });

      if (!player) {
        throw new HttpException(
          {
            success: false,
            message: 'Jogador não encontrado'
          },
          HttpStatus.NOT_FOUND
        );
      }

      const ranking = await RankingService.analyzePlayerRanking(player.id);
      const arenaProgress: Array<{
        arenaId: string;
        currentVolume: number;
        thresholds: any;
        currentRank: string;
        nextRankProgress?: any;
      }> = [];

      // Calcular progresso para cada arena
      Object.entries(ranking.arenaVolumes).forEach(([arenaId, volume]) => {
        const thresholds = RankingService.getArenaThresholds(arenaId);
        if (thresholds) {
          let currentRank = 'INICIANTE';
          let nextRankProgress = null;

          if (volume >= thresholds.INSTITUCIONAL) {
            currentRank = 'INSTITUCIONAL';
          } else if (volume >= thresholds.BIG_PLAYER) {
            currentRank = 'BIG_PLAYER';
            nextRankProgress = {
              rank: 'INSTITUCIONAL',
              currentVolume: volume,
              requiredVolume: thresholds.INSTITUCIONAL,
              progressPercentage: (volume / thresholds.INSTITUCIONAL) * 100
            };
          } else if (volume >= thresholds.AVANCADO) {
            currentRank = 'AVANCADO';
            nextRankProgress = {
              rank: 'BIG_PLAYER',
              currentVolume: volume,
              requiredVolume: thresholds.BIG_PLAYER,
              progressPercentage: (volume / thresholds.BIG_PLAYER) * 100
            };
          } else {
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

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar progresso por arena',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtém histórico completo de transações do jogador
   * GET /api/player/transactions
   */
  @Get('transactions')
  async getPlayerTransactions() {
    try {
      const player = await prisma.operator.findUnique({
        where: { email: 'aurex-data-player@aurex.arena' }
      });

      if (!player) {
        throw new HttpException(
          {
            success: false,
            message: 'Jogador não encontrado'
          },
          HttpStatus.NOT_FOUND
        );
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

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar transações do jogador',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
