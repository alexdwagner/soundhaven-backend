-- DropForeignKey
ALTER TABLE "Marker" DROP CONSTRAINT "Marker_trackId_fkey";

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "trackId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Marker" ALTER COLUMN "trackId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Marker" ADD CONSTRAINT "Marker_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;
