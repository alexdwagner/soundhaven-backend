/*
  Warnings:

  - Added the required column `waveSurferRegionID` to the `Marker` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
DELETE FROM "Marker";
DELETE FROM "Comment";
ALTER TABLE "Marker" ADD COLUMN     "waveSurferRegionID" TEXT NOT NULL;
