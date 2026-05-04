import { PrismaClient } from '@prisma/client';
import { RankingService } from './src/services/ranking.service.js';

const prisma = new PrismaClient();

async function testRankingService() {
  try {
    console.log('🏆 Analisando ranking do jogador aurex-data-player...\n');

    // Buscar o jogador primeiro
    const player = await prisma.operator.findUnique({
      where: { email: 'aurex-data-player@aurex.arena' }
    });

    if (!player) {
      console.log('❌ Jogador não encontrado. Execute o test-player.mts primeiro.');
      return;
    }

    console.log(`👤 Jogador: ${player.name}`);
    console.log(`📧 Email: ${player.email}`);
    console.log(`🎖️  Rank atual: ${player.rank}`);
    console.log(`💰 Saldo atual: ${player.tokenBalance} tokens\n`);

    // Analisar ranking completo
    const ranking = await RankingService.analyzePlayerRanking(player.id);

    // Volume total negociado
    console.log('📊 Volume Total Negociado:');
    console.log(`💎 Total em todas as arenas: ${ranking.totalVolume.toLocaleString()} tokens`);

    // Detalhes por arena
    console.log('\n🏟️  Volume por Arena:');
    console.log('┌─────────────┬──────────────┬─────────────┬───────────┐');
    console.log('│    Arena    │   Volume     │    Rank     │  Status   │');
    console.log('├─────────────┼──────────────┼─────────────┼───────────┤');

    const sortedArenas = Object.entries(ranking.arenaVolumes)
      .sort(([,a], [,b]) => b - a);

    sortedArenas.forEach(([arenaId, volume]) => {
      const thresholds = RankingService.getArenaThresholds(arenaId);
      let arenaRank = 'INICIANTE';
      let status = '🟡';
      
      if (thresholds) {
        if (volume >= thresholds.INSTITUCIONAL) {
          arenaRank = 'INSTITUCIONAL';
          status = '👑';
        } else if (volume >= thresholds.BIG_PLAYER) {
          arenaRank = 'BIG_PLAYER';
          status = '🔵';
        } else if (volume >= thresholds.AVANCADO) {
          arenaRank = 'AVANCADO';
          status = '🟢';
        }
      }

      const volumeStr = volume.toLocaleString().padStart(12);
      const rankStr = arenaRank.padEnd(11);
      
      console.log(`│ ${arenaId.padEnd(11)} │ ${volumeStr} │ ${rankStr} │ ${status} ${arenaRank} │`);
    });

    console.log('└─────────────┴──────────────┴─────────────┴───────────┘');

    // Arena mais operada
    const mostActiveArena = sortedArenas[0];
    if (mostActiveArena) {
      console.log(`\n🔥 Arena mais operada: ${mostActiveArena[0]} (${mostActiveArena[1].toLocaleString()} tokens)`);
    }

    // Status INSTITUCIONAL
    console.log('\n👑 Status INSTITUCIONAL:');
    const institucionalStatus = await RankingService.checkInstitucionalStatus(player.id);
    
    if (institucionalStatus.isInstitucional) {
      console.log('🎉 PARABÉNS! Você é um PLAYER INSTITUCIONAL!');
      console.log(`✅ Arenas qualificadas: ${institucionalStatus.institutionalArenas.join(', ')}`);
    } else {
      console.log('⚠️  Ainda não é INSTITUCIONAL');
      console.log(`📈 Progresso: ${institucionalStatus.totalInstitutionalArenas}/${institucionalStatus.requiredArenas} arenas premium`);
      
      if (institucionalStatus.institutionalArenas.length > 0) {
        console.log(`✅ Arenas qualificadas: ${institucionalStatus.institutionalArenas.join(', ')}`);
      }
    }

    // Verificação de promoção
    console.log('\n🎯 Análise de Promoção:');
    const promotionCheck = await RankingService.canPromoteToInstitucional(player.id);
    console.log(promotionCheck.currentStatus);

    if (!promotionCheck.canPromote && promotionCheck.missingArenas.length > 0) {
      console.log('\n📋 Arenas necessárias para INSTITUCIONAL:');
      promotionCheck.missingArenas.forEach(arena => {
        const thresholds = RankingService.getArenaThresholds(arena);
        if (thresholds) {
          const currentVolume = ranking.arenaVolumes[arena] || 0;
          const needed = thresholds.INSTITUCIONAL - currentVolume;
          console.log(`   🏟️  ${arena}: precisa de mais ${needed.toLocaleString()} tokens`);
        }
      });
    }

    // Próximo rank (geral)
    if (ranking.nextRankProgress) {
      const progress = ranking.nextRankProgress;
      console.log('\n📈 Progresso para próximo rank:');
      console.log(`   🎖️  ${progress.rank}: ${progress.currentVolume.toLocaleString()} / ${progress.requiredVolume.toLocaleString()} tokens`);
      console.log(`   📊 Progresso: ${progress.progressPercentage.toFixed(1)}%`);
      
      // Barra de progresso
      const barLength = 20;
      const filledLength = Math.floor((progress.progressPercentage / 100) * barLength);
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      console.log(`   ${bar} ${progress.progressPercentage.toFixed(1)}%`);
    }

    // Ranks alcançados
    console.log('\n🏆 Ranks Alcançados:');
    ranking.achievedRanks.forEach((rank, index) => {
      const icon = rank === 'INSTITUCIONAL' ? '👑' :
                  rank === 'BIG_PLAYER' ? '🔵' :
                  rank === 'AVANCADO' ? '🟢' : '🟡';
      console.log(`   ${index + 1}. ${icon} ${rank}`);
    });

    // Comparação com ranking global
    console.log('\n🌍 Posição no Ranking Global:');
    const globalRanking = await RankingService.getGlobalRanking(10);
    const playerPosition = globalRanking.findIndex(p => p.playerId === player.id);
    
    if (playerPosition !== -1) {
      console.log(`🏅 Posição: #${playerPosition + 1} entre os Top ${globalRanking.length}`);
      console.log(`📊 Seu volume: ${ranking.totalVolume.toLocaleString()} tokens`);
      if (playerPosition > 0) {
        const playerAbove = globalRanking[playerPosition - 1];
        const difference = playerAbove.totalVolume - ranking.totalVolume;
        console.log(`📈 Próximo jogador: ${playerAbove.playerName || 'Anônimo'} (+${difference.toLocaleString()} tokens)`);
      }
    } else {
      console.log('📊 Ainda não está no ranking global (precisa de mais transações)');
    }

  } catch (error) {
    console.error('❌ Erro ao analisar ranking:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

testRankingService();
