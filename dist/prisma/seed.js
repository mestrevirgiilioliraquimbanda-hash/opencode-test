"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🎮 Iniciando seed do Aurex Arena...');
    const cores = [
        {
            name: 'Aurex 13',
            coreType: client_1.CoreType.AUREX_13,
            energyCapacity: 10000,
            description: 'Arena principal de alta capacidade'
        },
        {
            name: 'Aurex X',
            coreType: client_1.CoreType.AUREX_X,
            energyCapacity: 7500,
            description: 'Arena avançada para jogadores experientes'
        },
        {
            name: 'Aurex Diamond',
            coreType: client_1.CoreType.DIAMOND,
            energyCapacity: 5000,
            description: 'Arena exclusiva para jogadores premium'
        },
        {
            name: 'Aurex Gold',
            coreType: client_1.CoreType.GOLD,
            energyCapacity: 3000,
            description: 'Arena intermediária com boa rentabilidade'
        },
        {
            name: 'Aurex 008',
            coreType: client_1.CoreType.CORE_008,
            energyCapacity: 1500,
            description: 'Arena inicial para novos jogadores'
        }
    ];
    console.log('🏟️  Criando núcleos operacionais...');
    for (const core of cores) {
        await prisma.operationalCore.upsert({
            where: { name: core.name },
            update: {
                coreType: core.coreType,
                energyCapacity: core.energyCapacity,
                isActive: true
            },
            create: {
                name: core.name,
                coreType: core.coreType,
                energyCapacity: core.energyCapacity,
                isActive: true
            },
        });
        console.log(`   ✅ ${core.name} (${core.coreType}) - Capacidade: ${core.energyCapacity}`);
    }
    console.log('👤 Criando operador de teste...');
    const testOperator = await prisma.operator.upsert({
        where: { email: 'aurex-data-player@aurex.arena' },
        update: {
            name: 'aurex-data-player',
            tokenBalance: 10000,
            rank: client_1.PlayerRank.INICIANTE
        },
        create: {
            email: 'aurex-data-player@aurex.arena',
            name: 'aurex-data-player',
            tokenBalance: 10000,
            rank: client_1.PlayerRank.INICIANTE,
            reputationScore: 0.0
        },
    });
    console.log(`   ✅ Operador: ${testOperator.name} (${testOperator.tokenBalance} tokens)`);
    console.log('📈 Criando transações de exemplo...');
    const createdCores = await prisma.operationalCore.findMany();
    for (let i = 0; i < 10; i++) {
        const randomCore = createdCores[Math.floor(Math.random() * createdCores.length)];
        const transactionAmount = Math.floor(Math.random() * 200) + 50;
        const arenaPrice = Math.random() * 100 + 50;
        await prisma.arenaTransaction.create({
            data: {
                playerId: testOperator.id,
                arenaId: randomCore.coreType,
                transactionAmount: i % 2 === 0 ? -transactionAmount : transactionAmount,
                arenaPrice: arenaPrice
            }
        });
    }
    console.log('   ✅ 10 transações de exemplo criadas');
    console.log('\n📊 Sistema Aurex Arena configurado:');
    console.log(`   🏟️  Arenas disponíveis: ${createdCores.length}`);
    console.log(`   👤 Operadores: 1 (teste)`);
    console.log(`   📈 Transações: 10 (exemplo)`);
    console.log('\n🎯 Hierarquia de Ranks:');
    const ranks = Object.values(client_1.PlayerRank);
    ranks.forEach((rank, index) => {
        const prefix = rank === client_1.PlayerRank.INSTITUCIONAL ? '👑' : '🎖️';
        console.log(`   ${index + 1}. ${prefix} ${rank}`);
    });
    console.log('\n⚡ Capacidade das Arenas:');
    createdCores.forEach(core => {
        const icon = core.coreType === client_1.CoreType.AUREX_13 ? '🔥' :
            core.coreType === client_1.CoreType.AUREX_X ? '⚡' :
                core.coreType === client_1.CoreType.DIAMOND ? '💎' :
                    core.coreType === client_1.CoreType.GOLD ? '🏆' : '🚀';
        console.log(`   ${icon} ${core.name}: ${core.energyCapacity} energia`);
    });
    console.log('\n✅ Seed concluído com sucesso!');
    console.log('🚀 O Aurex Arena está pronto para uso!');
}
main()
    .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map