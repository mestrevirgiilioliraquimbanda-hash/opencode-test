import { PrismaClient, CoreType } from '@prisma/client';

const prisma = new PrismaClient();

interface MarketSimulation {
  arenaId: string;
  basePrice: number;
  currentPrice: number;
  volatility: number;
}

async function simulateMarket() {
  try {
    console.log('🎮 Iniciando simulação de mercado Aurex Arena...');
    
    // Get or create the test user
    let user = await prisma.operator.findUnique({
      where: { email: 'aurex-data-player@aurex.arena' }
    });

    if (!user) {
      console.log('👤 Criando usuário de teste...');
      user = await prisma.operator.create({
        data: {
          email: 'aurex-data-player@aurex.arena',
          name: 'aurex-data-player',
          tokenBalance: 10000, // Mais tokens para simulação
          rank: 'INICIANTE'
        }
      });
      console.log(`✅ Usuário criado: ${user.name} (${user.tokenBalance} tokens)`);
    }

    // Get all arenas from database
    const arenas = await prisma.operationalCore.findMany({
      where: { isActive: true }
    });

    if (arenas.length === 0) {
      throw new Error('Nenhuma arena encontrada no banco de dados');
    }

    console.log(`🏟️  Encontradas ${arenas.length} arenas para simulação`);

    // Initialize market data for each arena
    const marketData: Map<string, MarketSimulation> = new Map();
    arenas.forEach(arena => {
      const basePrice = Math.random() * 100 + 50; // Preço base entre 50-150
      marketData.set(arena.id, {
        arenaId: arena.id,
        basePrice,
        currentPrice: basePrice,
        volatility: Math.random() * 0.3 + 0.1 // Volatilidade entre 10%-40%
      });
    });

    console.log('📈 Iniciando 50 transações de mercado...\n');

    // Simulate 50 transactions
    for (let i = 1; i <= 50; i++) {
      // Select random arena
      const randomArena = arenas[Math.floor(Math.random() * arenas.length)];
      const market = marketData.get(randomArena.id)!;

      // Generate random transaction type and amount
      const transactionTypes = ['COMPRA', 'VENDA'];
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const transactionAmount = Math.floor(Math.random() * 500) + 50; // 50-550 tokens

      // Calculate price oscillation
      const priceChange = (Math.random() - 0.5) * 2 * market.volatility;
      market.currentPrice = Math.max(10, market.currentPrice * (1 + priceChange));

      // Create transaction record
      const transaction = await prisma.arenaTransaction.create({
        data: {
          playerId: user.id,
          arenaId: randomArena.coreType, // Use coreType as arena identifier
          transactionAmount: transactionType === 'COMPRA' ? -transactionAmount : transactionAmount,
          arenaPrice: market.currentPrice
        }
      });

      // Update user token balance
      const newBalance = user.tokenBalance + transaction.transactionAmount;
      await prisma.operator.update({
        where: { id: user.id },
        data: { tokenBalance: newBalance }
      });
      user.tokenBalance = newBalance;

      // Display transaction info
      const arrow = transactionType === 'COMPRA' ? '🔴' : '🟢';
      const message = `${i.toString().padStart(2)}. ${arrow} ${transactionType} - Arena: ${randomArena.coreType} | Tokens: ${Math.abs(transactionAmount)} | Preço: ${market.currentPrice.toFixed(2)} | Saldo: ${user.tokenBalance}`;
      console.log(message);

      // Small delay to make simulation more realistic
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ Simulação concluída!');
    console.log('📊 Resumo final:');
    console.log(`   Transações realizadas: 50`);
    console.log(`   Saldo final do usuário: ${user.tokenBalance} tokens`);
    
    // Show market statistics
    console.log('\n📈 Estatísticas das Arenas:');
    for (const [arenaId, market] of marketData) {
      const arena = arenas.find(a => a.id === arenaId);
      const priceVariation = ((market.currentPrice - market.basePrice) / market.basePrice * 100);
      const variationSign = priceVariation > 0 ? '+' : '';
      console.log(`   ${arena?.coreType}: ${market.basePrice.toFixed(2)} → ${market.currentPrice.toFixed(2)} (${variationSign}${priceVariation.toFixed(1)}%)`);
    }

  } catch (error) {
    console.error('❌ Erro na simulação:', error instanceof Error ? error.message : error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateMarket();
