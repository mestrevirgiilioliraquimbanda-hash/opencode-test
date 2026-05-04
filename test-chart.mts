import { ChartService } from './src/services/chart.service.js';

async function testChartService() {
  try {
    console.log('📊 Testando ChartService para arena AUREX_13...\n');

    // Buscar dados OHLC para AUREX_13
    console.log('🔍 Buscando dados OHLC...');
    const chartData = await ChartService.getOHLCData('AUREX_13', 1, 50);

    if (chartData.candles.length === 0) {
      console.log('⚠️  Nenhuma vela encontrada para AUREX_13');
      console.log('💡 Execute o simulador de mercado primeiro: node --loader ts-node/esm simulate-market.mts');
      return;
    }

    console.log(`✅ Encontradas ${chartData.candles.length} velas para ${chartData.arenaId}`);
    console.log(`📈 Timeframe: ${chartData.timeframe}`);
    console.log(`💰 Volume total: ${chartData.totalVolume} tokens`);
    console.log(`📊 Range de preços: ${chartData.priceRange.min.toFixed(2)} - ${chartData.priceRange.max.toFixed(2)}\n`);

    // Exibir detalhes das velas
    console.log('🕯️  Velas OHLC (Open, High, Low, Close):');
    console.log('┌─────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐');
    console.log('│   Data/Hora  │   Open   │   High   │   Low    │  Close   │  Volume  │');
    console.log('├─────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤');

    chartData.candles.forEach((candle, index) => {
      const date = candle.timestamp.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const open = candle.open.toFixed(2).padStart(8);
      const high = candle.high.toFixed(2).padStart(8);
      const low = candle.low.toFixed(2).padStart(8);
      const close = candle.close.toFixed(2).padStart(8);
      const volume = candle.volume.toString().padStart(8);
      
      console.log(`│ ${date} │ ${open} │ ${high} │ ${low} │ ${close} │ ${volume} │`);
      
      // Mostrar apenas as primeiras 10 velas para não poluir
      if (index === 9 && chartData.candles.length > 10) {
        console.log(`│ ... (${chartData.candles.length - 10} velas restantes) ...`);
        return;
      }
    });

    console.log('└─────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘\n');

    // Estatísticas detalhadas
    console.log('📊 Estatísticas detalhadas da arena:');
    const stats = await ChartService.getArenaStats('AUREX_13');
    console.log(`   Total de transações: ${stats.totalTransactions}`);
    console.log(`   Volume médio por transação: ${(stats.totalVolume / stats.totalTransactions).toFixed(2)} tokens`);
    console.log(`   Preço médio: ${stats.averagePrice.toFixed(2)}`);
    console.log(`   Volatilidade: ${stats.priceVolatility.toFixed(2)}`);
    console.log(`   Primeira transação: ${stats.firstTransaction?.toLocaleString('pt-BR') || 'N/A'}`);
    console.log(`   Última transação: ${stats.lastTransaction?.toLocaleString('pt-BR') || 'N/A'}`);

    // Formato TradingView
    console.log('\n🔄 Dados formatados para TradingView (primeira vela):');
    const tradingViewFormat = ChartService.formatForTradingView(chartData);
    const parsedData = JSON.parse(tradingViewFormat);
    if (parsedData.data.length > 0) {
      console.log('   Estrutura:', JSON.stringify(parsedData.data[0], null, 2));
    }

    // Listar arenas disponíveis
    console.log('\n🏟️  Arenas disponíveis para análise:');
    const availableArenas = await ChartService.getAvailableArenas();
    availableArenas.forEach(arena => {
      console.log(`   - ${arena}`);
    });

  } catch (error) {
    console.error('❌ Erro ao testar ChartService:', error instanceof Error ? error.message : error);
  }
}

testChartService();
