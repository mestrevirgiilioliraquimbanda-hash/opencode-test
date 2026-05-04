import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ChartService } from '../services/chart.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('arenas')
export class ArenaController {
  
  /**
   * Lista todas as arenas disponíveis no sistema
   * GET /api/arenas
   */
  @Get()
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
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar arenas',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtém dados OHLC (Candles) de uma arena específica
   * GET /api/arenas/:arenaId/chart
   * Query params: timeframe (minutos), limit (número de velas)
   */
  @Get(':arenaId/chart')
  async getArenaChart(
    @Param('arenaId') arenaId: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: string
  ) {
    try {
      // Validação dos parâmetros
      const timeFrameMinutes = timeframe ? parseInt(timeframe) : 1;
      const candleLimit = limit ? parseInt(limit) : 100;

      if (isNaN(timeFrameMinutes) || timeFrameMinutes < 1 || timeFrameMinutes > 60) {
        throw new HttpException(
          {
            success: false,
            message: 'Timeframe inválido. Deve estar entre 1 e 60 minutos.'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      if (isNaN(candleLimit) || candleLimit < 1 || candleLimit > 1000) {
        throw new HttpException(
          {
            success: false,
            message: 'Limit inválido. Deve estar entre 1 e 1000 velas.'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Buscar dados do ChartService
      const chartData = await ChartService.getOHLCData(arenaId, timeFrameMinutes, candleLimit);

      // Verificar se encontrou dados
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

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar dados do gráfico',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtém estatísticas detalhadas de uma arena
   * GET /api/arenas/:arenaId/stats
   */
  @Get(':arenaId/stats')
  async getArenaStats(@Param('arenaId') arenaId: string) {
    try {
      const stats = await ChartService.getArenaStats(arenaId);

      return {
        success: true,
        data: {
          arenaId,
          ...stats
        }
      };

    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar estatísticas da arena',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtém dados formatados para TradingView
   * GET /api/arenas/:arenaId/tradingview
   */
  @Get(':arenaId/tradingview')
  async getTradingViewData(
    @Param('arenaId') arenaId: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const timeFrameMinutes = timeframe ? parseInt(timeframe) : 1;
      const candleLimit = limit ? parseInt(limit) : 100;

      const chartData = await ChartService.getOHLCData(arenaId, timeFrameMinutes, candleLimit);
      const tradingViewFormat = ChartService.formatForTradingView(chartData);

      return {
        success: true,
        data: JSON.parse(tradingViewFormat)
      };

    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao formatar dados para TradingView',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtém lista de arenas com transações disponíveis para análise
   * GET /api/arenas/available
   */
  @Get('available')
  async getAvailableArenas() {
    try {
      const availableArenas = await ChartService.getAvailableArenas();

      return {
        success: true,
        data: availableArenas,
        count: availableArenas.length
      };

    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao buscar arenas disponíveis',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
