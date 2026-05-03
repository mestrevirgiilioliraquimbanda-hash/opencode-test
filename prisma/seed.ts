import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cores = [
    { name: 'Aurex 13', energyCapacity: 10000 },
    { name: 'Aurex X', energyCapacity: 7500 },
    { name: 'Aurex Diamond', energyCapacity: 5000 },
    { name: 'Aurex Gold', energyCapacity: 3000 },
    { name: 'Aurex 008', energyCapacity: 1500 },
  ];

  for (const core of cores) {
    await prisma.operationalCore.upsert({
      where: { name: core.name },
      update: {},
      create: {
        name: core.name,
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
