import { PrismaClient, CoreType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cores = [
    { name: 'Aurex 13', type: CoreType.AUREX_13, energyCapacity: 10000 },
    { name: 'Aurex X', type: CoreType.AUREX_X, energyCapacity: 7500 },
    { name: 'Aurex Diamond', type: CoreType.DIAMOND, energyCapacity: 5000 },
    { name: 'Aurex Gold', type: CoreType.GOLD, energyCapacity: 3000 },
    { name: 'Aurex 008', type: CoreType["008"], energyCapacity: 1500 },
  ];

  for (const core of cores) {
    await prisma.operationalCore.upsert({
      where: { name: core.name },
      update: { type: core.type },
      create: {
        name: core.name,
        type: core.type,
        energyCapacity: core.energyCapacity,
      },
    });
  }

  console.log('Operational cores seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
