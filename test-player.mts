import { PrismaClient } from '@prisma/client';
import { OperatorService } from './src/services/operator.service.js';

const prisma = new PrismaClient();

async function testPlayerCreation() {
  try {
    console.log('🎮 Verificando arenas disponíveis...');
    
    // Check if arenas exist before creating player
    const arenas = await prisma.operationalCore.findMany({
      where: { isActive: true }
    });

    if (arenas.length === 0) {
      throw new Error('Nenhuma arena encontrada. Execute o seed primeiro: npx prisma db seed');
    }

    console.log(`🏟️  Encontradas ${arenas.length} arenas disponíveis`);
    arenas.forEach(arena => {
      console.log(`   - ${arena.name} (${arena.coreType})`);
    });

    console.log('\n👤 Criando novo jogador no Aurex Arena...');
    
    // Create new player with name 'aurex-data-player'
    const newPlayer = await OperatorService.createOperator({
      email: 'aurex-data-player@aurex.arena',
      name: 'aurex-data-player'
    });

    console.log('✅ Jogador criado com sucesso!');
    console.log('📋 Dados do jogador:');
    console.log(`   Nome: ${newPlayer.name}`);
    console.log(`   Saldo de Tokens: ${newPlayer.tokenBalance} tokens`);
    console.log(`   Rank Inicial: ${newPlayer.rank}`);
    console.log(`   ID: ${newPlayer.id}`);
    console.log(`   Email: ${newPlayer.email}`);
    console.log(`   Data de Criação: ${newPlayer.createdAt.toLocaleString('pt-BR')}`);
    
    // Display rank hierarchy information
    const rankInfo = OperatorService.getRankHierarchy();
    console.log('\n🏆 Hierarquia de Ranks:');
    console.log(`   Ranks disponíveis: ${rankInfo.ranks.join(' → ')}`);
    console.log(`   Rank máximo: ${rankInfo.maxRank}`);
    console.log(`   Tokens iniciais: ${rankInfo.initialTokens}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar jogador:', error instanceof Error ? error.message : error);
  }
}

testPlayerCreation()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
