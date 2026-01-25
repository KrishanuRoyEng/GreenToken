-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('IMAGE', 'DRONE_DATA', 'REPORT', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'PRIVATE_ENTITY';
ALTER TYPE "UserRole" ADD VALUE 'COMPANY';

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "documentType" "DocumentType" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "dataHash" TEXT,
ADD COLUMN     "ipfsMetadataHash" TEXT,
ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "custodianWalletIndex" INTEGER,
ADD COLUMN     "usesCustodianWallet" BOOLEAN NOT NULL DEFAULT true;
