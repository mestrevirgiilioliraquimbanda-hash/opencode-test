import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir requisições do frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',    // React/Vue/Angular development
      'http://localhost:5173',    // Vite development
      'http://localhost:8080',    // Outras portas comuns
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8080'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204
  });

  // Prefixo global para todas as rotas
  app.setGlobalPrefix('api');

  // Validação global de DTOs (com fallback caso class-validator não esteja disponível)
  try {
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    }));
  } catch (error) {
    console.log('⚠️  ValidationPipe não disponível (class-validator não instalado)');
  }

  // Configurações de segurança (básicas para desenvolvimento)
  app.use((req, res, next) => {
    res.header('X-Powered-By', 'Aurex Arena API');
    next();
  });

  const port = process.env.PORT || 3005;
  await app.listen(port);

  console.log(`🚀 Aurex Arena API rodando em: http://localhost:${port}`);
  console.log(`📊 Endpoints disponíveis:`);
  console.log(`   🏟️  Arenas: http://localhost:${port}/api/arenas`);
  console.log(`   👤 Player: http://localhost:${port}/api/player`);
  console.log(`   📈 Charts: http://localhost:${port}/api/arenas/:arenaId/chart`);
  console.log(`   🏆 Ranking: http://localhost:${port}/api/player/ranking`);
  console.log(`   📊 Stats: http://localhost:${port}/api/arenas/:arenaId/stats`);
  console.log(`   📈 TradingView: http://localhost:${port}/api/arenas/:arenaId/tradingview`);
  console.log(`   🎯 Progress: http://localhost:${port}/api/player/arena-progress`);
  console.log(`   📜 Transactions: http://localhost:${port}/api/player/transactions`);
}

bootstrap().catch(error => {
  console.error('❌ Erro ao iniciar servidor:', error);
  // Não faz process.exit(1) imediatamente, permite debug
  setTimeout(() => {
    console.log('🔄 Tentando reiniciar em 5 segundos...');
    process.exit(1);
  }, 5000);
});

// Mantém o processo vivo
process.on('SIGINT', () => {
  console.log('\n🛑 Servidor encerrado pelo usuário');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Servidor encerrado (SIGTERM)');
  process.exit(0);
});
