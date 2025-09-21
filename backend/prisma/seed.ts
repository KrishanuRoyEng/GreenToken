import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@nccr.gov.in" },
    update: {},
    create: {
      email: "admin@nccr.gov.in",
      passwordHash: adminPassword,
      name: "NCCR Admin",
      organizationName: "National Centre for Coastal Research",
      role: "ADMIN",
      isVerified: true,
    },
  });

  // Create sample NGO user
  const ngoPassword = await bcrypt.hash("ngo123", 12);
  const ngoUser = await prisma.user.upsert({
    where: { email: "ngo@example.org" },
    update: {},
    create: {
      email: "ngo@example.org",
      passwordHash: ngoPassword,
      name: "Marine Conservation Foundation",
      organizationName: "Marine Conservation Foundation",
      role: "NGO",
      isVerified: true,
    },
  });

  // Create sample panchayat user
  const panchayatPassword = await bcrypt.hash("panchayat123", 12);
  const panchayatUser = await prisma.user.upsert({
    where: { email: "panchayat@village.gov.in" },
    update: {},
    create: {
      email: "panchayat@village.gov.in",
      passwordHash: panchayatPassword,
      name: "Coastal Village Panchayat",
      organizationName: "Kanyakumari Coastal Panchayat",
      role: "PANCHAYAT",
      isVerified: true,
    },
  });

  // Create sample projects
  const projects = [
    {
      blockchainId: 1,
      name: "Sundarbans Mangrove Restoration",
      description:
        "Large-scale mangrove restoration in Sundarbans delta region",
      location: "Sundarbans, West Bengal",
      latitude: 22.4041,
      longitude: 88.9775,
      areaHectares: 25.5,
      ecosystemType: "MANGROVE",
      status: "APPROVED",
      estimatedCredits: 255,
      issuedCredits: 150,
      ownerId: ngoUser.id,
      approvedAt: new Date(),
    },
    {
      blockchainId: 2,
      name: "Chennai Coast Seagrass Conservation",
      description: "Seagrass bed restoration along Chennai coastline",
      location: "Chennai, Tamil Nadu",
      latitude: 13.0827,
      longitude: 80.2707,
      areaHectares: 15.2,
      ecosystemType: "SEAGRASS",
      status: "PENDING",
      estimatedCredits: 122,
      issuedCredits: 0,
      ownerId: ngoUser.id,
    },
    {
      blockchainId: 3,
      name: "Gujarat Salt Marsh Restoration",
      description: "Salt marsh ecosystem restoration in Gujarat coastal areas",
      location: "Kutch, Gujarat",
      latitude: 23.0225,
      longitude: 72.5714,
      areaHectares: 30.0,
      ecosystemType: "SALT_MARSH",
      status: "ACTIVE",
      estimatedCredits: 180,
      issuedCredits: 90,
      ownerId: panchayatUser.id,
      approvedAt: new Date(),
    },
  ];

  for (const projectData of projects) {
    await prisma.project.upsert({
      where: { blockchainId: projectData.blockchainId },
      update: {},
      create: projectData as any,
    });
  }

  // Create sample transactions
  const project1 = await prisma.project.findFirst({
    where: { name: "Sundarbans Mangrove Restoration" },
  });

  if (project1) {
    await prisma.transaction.create({
      data: {
        type: "mint",
        amount: 150,
        status: "confirmed",
        userId: ngoUser.id,
        projectId: project1.id,
      },
    });

    await prisma.transaction.create({
      data: {
        type: "sell",
        amount: 50,
        pricePerToken: 45,
        status: "pending",
        userId: ngoUser.id,
        projectId: project1.id,
      },
    });
  }

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      {
        title: "Welcome to Blue Carbon MRV",
        message:
          "Your account has been created successfully. Start by creating your first project!",
        type: "success",
        userId: ngoUser.id,
      },
      {
        title: "Project Approved",
        message:
          "Your Sundarbans Mangrove Restoration project has been approved!",
        type: "success",
        userId: ngoUser.id,
      },
      {
        title: "Credits Issued",
        message:
          "150 carbon credits have been issued for your approved project.",
        type: "info",
        userId: ngoUser.id,
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
  console.log("\n👤 Default users created:");
  console.log("📧 Admin: admin@nccr.gov.in / admin123");
  console.log("📧 NGO: ngo@example.org / ngo123");
  console.log("📧 Panchayat: panchayat@village.gov.in / panchayat123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
