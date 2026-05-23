import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../generated/prisma/client";
import { auth } from "../lib/auth";

const connectionString =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is required for seeding");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD || "12345678";
const adminName = process.env.ADMIN_NAME || "Admin";

function buildHeaders() {
  const baseUrl = process.env.BETTER_AUTH_BASE_URL || "http://localhost";
  const host = new URL(baseUrl).host;
  return new Headers({
    host,
    origin: baseUrl,
  });
}

async function ensureAdminUser() {
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    if (
      existing.role !== UserRole.ADMIN ||
      !existing.emailVerified ||
      existing.name !== adminName
    ) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: UserRole.ADMIN,
          emailVerified: true,
          name: adminName,
        },
      });
    }
    return;
  }

  await auth.api.signUpEmail({
    body: {
      email: adminEmail,
      password: adminPassword,
      name: adminName,
    },
    headers: buildHeaders(),
  });

  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    throw new Error("Admin user was not created by signUpEmail");
  }

  await prisma.user.update({
    where: { id: adminUser.id },
    data: {
      role: UserRole.ADMIN,
      emailVerified: true,
      name: adminName,
    },
  });
}

async function main() {
  await ensureAdminUser();
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
