/*
  Warnings:

  - Added the required column `duration` to the `Marker` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Marker" ADD COLUMN "duration" FLOAT NOT NULL DEFAULT 0.05;