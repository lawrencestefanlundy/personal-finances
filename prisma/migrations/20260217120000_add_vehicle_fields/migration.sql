-- AlterTable: vehicle fields
ALTER TABLE "Asset" ADD COLUMN "registration" TEXT;
ALTER TABLE "Asset" ADD COLUMN "mileage" INTEGER;
ALTER TABLE "Asset" ADD COLUMN "vehicleData" TEXT;

-- AlterTable: property fields
ALTER TABLE "Asset" ADD COLUMN "purchasePrice" DOUBLE PRECISION;
ALTER TABLE "Asset" ADD COLUMN "purchaseDate" TEXT;
ALTER TABLE "Asset" ADD COLUMN "propertyAddress" TEXT;
ALTER TABLE "Asset" ADD COLUMN "propertyRegion" TEXT;
ALTER TABLE "Asset" ADD COLUMN "propertyData" TEXT;
