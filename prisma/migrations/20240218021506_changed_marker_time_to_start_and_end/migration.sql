/*
  Warnings:

  - You are about to drop the column `time` on the `Marker` table. All the data in the column will be lost.
  - Added the required column `start` to the `Marker` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Marker" DROP COLUMN "time",
ADD COLUMN     "end" DOUBLE PRECISION,
ADD COLUMN     "start" DOUBLE PRECISION NOT NULL;
