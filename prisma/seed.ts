import { PrismaClient, CoreType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cores = [
    { name: 'Aurex 13', coreType: CoreType.AUREX_13, energyCapacity: 10000 },
    { name: 'Aurex X', coreType: CoreType.AUREX_X, energyCapacity: 7500 },
    { name: 'Aurex Diamond', coreType: CoreType.DIAMOND, energyCapacity: 5000 },
    { name: 'Aurex Gold', coreType: CoreType.GOLD, energyCapacity: 3000 },
    { name: 'Aurex 008', coreType: CoreType['008'], energyCapacity: 1500 },
  ];

  for (const core of cores) {
    await prisma.operationalCore.upsert({
      where: { name: core.name },
      update: { coreType: core.coreType },
      create: {
        name: core.name,
        coreType: core.coreType,
        energyCapacity: core.energyCapacity,
      },
    });
  }

  console.log('Operational cores seeded successfully with Aurex Arena hierarchy');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });