import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const method = await prisma.method.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "Default", gwpSet: "GWP100" },
  });

  await prisma.dataset.deleteMany({ where: { methodId: 1 } });

  await prisma.dataset.createMany({
    data: [
      { name: "Strommix DE", source: "UBA", year: 2022, geo: "DE", unit: "kWh", valueCO2e: 0.401, methodId: method.id },
      { name: "Diesel", source: "ecoinvent", year: 2020, geo: "EU", unit: "l", valueCO2e: 2.68, methodId: method.id },
      { name: "LKW-Transport", source: "ecoinvent", year: 2020, geo: "EU", unit: "tkm", valueCO2e: 0.12, methodId: method.id },
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
