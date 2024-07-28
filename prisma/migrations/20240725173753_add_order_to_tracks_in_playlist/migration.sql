/*
  Warnings:

  - Added the required column `order` to the `TracksInPlaylist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TracksInPlaylist" ADD COLUMN "order" INTEGER;

-- UpdateData (you may need to adjust this based on your requirements)
UPDATE "TracksInPlaylist" SET "order" = 0;

-- AlterColumn
ALTER TABLE "TracksInPlaylist" ALTER COLUMN "order" SET NOT NULL;