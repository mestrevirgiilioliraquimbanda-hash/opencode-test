"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_js_1 = require("./app.module.js");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule);
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:8080'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
        credentials: true,
        optionsSuccessStatus: 204
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true
        }
    }));
    app.use((req, res, next) => {
        res.header('X-Powered-By', 'Aurex Arena API');
        next();
    });
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Aurex Arena API rodando em: http://localhost:${port}`);
    console.log(`📊 Endpoints disponíveis:`);
    console.log(`   🏟️  Arenas: http://localhost:${port}/api/arenas`);
    console.log(`   👤 Player: http://localhost:${port}/api/player`);
    console.log(`   📈 Charts: http://localhost:${port}/api/arenas/:arenaId/chart`);
    console.log(`   🏆 Ranking: http://localhost:${port}/api/player/ranking`);
}
bootstrap().catch(error => {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map