import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  if (process.env.ALLOW_PROD_SEED !== 'true' || process.env.SEED_CONFIRM !== 'production') {
    console.error(
      '❌ Seed bloqueado. Para executar, defina:\n' +
      '   ALLOW_PROD_SEED=true\n' +
      '   SEED_CONFIRM=production'
    )
    process.exit(1)
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD

  if (!adminPassword || !superAdminPassword) {
    console.error('❌ ADMIN_PASSWORD e SUPERADMIN_PASSWORD são obrigatórios para o seed de produção.')
    process.exit(1)
  }

  console.log("🌱 Iniciando seed...")

  const company = await prisma.company.upsert({
    where: { id: "relatec-company-id" },
    update: {},
    create: {
      id: "relatec-company-id",
      name: "Relatec",
      email: "contato@relatec.com.br",
      plan: "enterprise",
      active: true,
    },
  })
  console.log("✅ Empresa:", company.name)

  const admin = await prisma.user.upsert({
    where: { email: "admin@relatec.com.br" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@relatec.com.br",
      password: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      companyId: company.id,
    },
  })
  console.log("✅ Admin:", admin.email)

  const superAdmin = await prisma.user.upsert({
    where: { email: "super@relatec.com.br" },
    update: {},
    create: {
      name: "Super Admin",
      email: "super@relatec.com.br",
      password: await bcrypt.hash(superAdminPassword, 10),
      role: "SUPERADMIN",
      companyId: company.id,
    },
  })
  console.log("✅ Super Admin:", superAdmin.email)
  console.log("🎉 Seed concluído!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
