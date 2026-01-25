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

  // Create sample company (buyer)
  const companyPassword = await bcrypt.hash("company123", 12);
  const companyUser = await prisma.user.upsert({
    where: { email: "company@greenco.com" },
    update: {},
    create: {
      email: "company@greenco.com",
      passwordHash: companyPassword,
      name: "GreenCo Industries",
      organizationName: "GreenCo Sustainable Industries Pvt Ltd",
      role: "COMPANY",
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
      status: "APPROVED",
      estimatedCredits: 122,
      issuedCredits: 80,
      ownerId: ngoUser.id,
      approvedAt: new Date(),
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
      status: "APPROVED",
      estimatedCredits: 180,
      issuedCredits: 120,
      ownerId: panchayatUser.id,
      approvedAt: new Date(),
    },
    {
      blockchainId: 4,
      name: "Andaman Kelp Forest Recovery",
      description: "Kelp forest restoration around Andaman Islands",
      location: "Port Blair, Andaman",
      latitude: 11.6234,
      longitude: 92.7265,
      areaHectares: 18.0,
      ecosystemType: "KELP",
      status: "APPROVED",
      estimatedCredits: 144,
      issuedCredits: 100,
      ownerId: ngoUser.id,
      approvedAt: new Date(),
    },
  ];

  // Image Seeding Logic
  const { ipfsService } = require('../src/services/IPFSService');

  // Real images from Unsplash (using specific IDs to ensure stability)
  const ECOSYSTEM_IMAGES = {
    MANGROVE: [
      'https://images.unsplash.com/photo-1584553180555-63e54b6c31bf?auto=format&fit=crop&w=800&q=80', // Mangrove roots
      'https://images.unsplash.com/photo-1620029580143-6c9ba7371589?auto=format&fit=crop&w=800&q=80'  // Aerial mangrove
    ],
    SEAGRASS: [
      'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?auto=format&fit=crop&w=800&q=80', // Underwater
      'https://images.unsplash.com/photo-1544552866-d3ed42536fc7?auto=format&fit=crop&w=800&q=80'  // Coral/Seagrass
    ],
    SALT_MARSH: [
      'https://images.unsplash.com/photo-1621262703816-724d262bd893?auto=format&fit=crop&w=800&q=80', // Salt marsh
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'  // Mountains/Marsh
    ],
    KELP: [
      'https://images.unsplash.com/photo-1551090332-9b5ce421379c?auto=format&fit=crop&w=800&q=80', // Kelp forest layer
      'https://images.unsplash.com/photo-1559827260-dc66d52bef3e?auto=format&fit=crop&w=800&q=80'  // Underwater kelp
    ]
  };

  for (const projectData of projects) {
    const project = await prisma.project.upsert({
      where: { blockchainId: projectData.blockchainId },
      update: {},
      create: projectData as any,
    });

    // Upload real images for this project
    const imageUrls = ECOSYSTEM_IMAGES[projectData.ecosystemType as keyof typeof ECOSYSTEM_IMAGES] || ECOSYSTEM_IMAGES.MANGROVE;

    // Check if documents already exist to maintain idempotency
    const existingDocs = await prisma.document.count({ where: { projectId: project.id } });

    if (existingDocs === 0) {
      console.log(`📸 Uploading images for ${project.name}...`);

      for (let i = 0; i < imageUrls.length; i++) {
        try {
          // Use native fetch (Node 18+)
          const response = await fetch(imageUrls[i]);
          const buffer = await response.arrayBuffer();
          const fileBuffer = Buffer.from(buffer);

          // Upload to IPFS
          const filename = `${project.ecosystemType.toLowerCase()}_${i + 1}.jpg`;
          const cid = await ipfsService.uploadFile(fileBuffer, filename);

          // Create Document record
          await prisma.document.create({
            data: {
              filename: filename,
              originalName: `Aerial View ${i + 1} - ${project.ecosystemType}`,
              mimeType: 'image/jpeg',
              size: fileBuffer.length,
              ipfsHash: cid,
              documentType: i === 0 ? 'IMAGE' : 'DRONE_DATA', // Split types for demo
              projectId: project.id
            }
          });
          console.log(`   ✅ Uploaded ${filename} -> ${cid}`);
        } catch (error) {
          console.warn(`   ⚠️ Failed to upload image for ${project.name}:`, error);
        }
      }
    }
  }

  // Fetch created projects
  const project1 = await prisma.project.findFirst({
    where: { name: "Sundarbans Mangrove Restoration" },
  });
  const project2 = await prisma.project.findFirst({
    where: { name: "Chennai Coast Seagrass Conservation" },
  });
  const project3 = await prisma.project.findFirst({
    where: { name: "Gujarat Salt Marsh Restoration" },
  });
  const project4 = await prisma.project.findFirst({
    where: { name: "Andaman Kelp Forest Recovery" },
  });

  // Create mint transactions (tokens issued to project owners)
  if (project1) {
    await prisma.transaction.upsert({
      where: { id: "mint-1" },
      update: {},
      create: {
        id: "mint-1",
        type: "mint",
        amount: 150,
        status: "confirmed",
        userId: ngoUser.id,
        projectId: project1.id,
      },
    });
  }

  if (project2) {
    await prisma.transaction.upsert({
      where: { id: "mint-2" },
      update: {},
      create: {
        id: "mint-2",
        type: "mint",
        amount: 80,
        status: "confirmed",
        userId: ngoUser.id,
        projectId: project2.id,
      },
    });
  }

  if (project3) {
    await prisma.transaction.upsert({
      where: { id: "mint-3" },
      update: {},
      create: {
        id: "mint-3",
        type: "mint",
        amount: 120,
        status: "confirmed",
        userId: panchayatUser.id,
        projectId: project3.id,
      },
    });
  }

  if (project4) {
    await prisma.transaction.upsert({
      where: { id: "mint-4" },
      update: {},
      create: {
        id: "mint-4",
        type: "mint",
        amount: 100,
        status: "confirmed",
        userId: ngoUser.id,
        projectId: project4.id,
      },
    });
  }

  // Create marketplace sell listings (tokens available for purchase)
  if (project1) {
    await prisma.transaction.upsert({
      where: { id: "sell-1" },
      update: {},
      create: {
        id: "sell-1",
        type: "sell",
        amount: 50,
        pricePerToken: 45,
        status: "pending",
        userId: ngoUser.id,
        projectId: project1.id,
      },
    });
  }

  if (project2) {
    await prisma.transaction.upsert({
      where: { id: "sell-2" },
      update: {},
      create: {
        id: "sell-2",
        type: "sell",
        amount: 30,
        pricePerToken: 55,
        status: "pending",
        userId: ngoUser.id,
        projectId: project2.id,
      },
    });
  }

  if (project3) {
    await prisma.transaction.upsert({
      where: { id: "sell-3" },
      update: {},
      create: {
        id: "sell-3",
        type: "sell",
        amount: 75,
        pricePerToken: 40,
        status: "pending",
        userId: panchayatUser.id,
        projectId: project3.id,
      },
    });
  }

  if (project4) {
    await prisma.transaction.upsert({
      where: { id: "sell-4" },
      update: {},
      create: {
        id: "sell-4",
        type: "sell",
        amount: 60,
        pricePerToken: 50,
        status: "pending",
        userId: ngoUser.id,
        projectId: project4.id,
      },
    });
  }

  // Create sample notifications
  // First clean up existing notifications for these users to prevent duplicates
  await prisma.notification.deleteMany({
    where: {
      userId: { in: [ngoUser.id] }
    }
  });

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
    skipDuplicates: true,
  });

  console.log("✅ Database seeded successfully!");
  console.log("\n👤 Default users created:");
  console.log("📧 Admin: admin@nccr.gov.in / admin123");
  console.log("📧 NGO: ngo@example.org / ngo123");
  console.log("📧 Panchayat: panchayat@village.gov.in / panchayat123");
  console.log("📧 Company: company@greenco.com / company123");
  console.log("\n🛒 Marketplace listings created:");
  console.log("   • 50 tokens @ ₹45 (Sundarbans Mangrove)");
  console.log("   • 30 tokens @ ₹55 (Chennai Seagrass)");
  console.log("   • 75 tokens @ ₹40 (Gujarat Salt Marsh)");
  console.log("   • 60 tokens @ ₹50 (Andaman Kelp Forest)");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
