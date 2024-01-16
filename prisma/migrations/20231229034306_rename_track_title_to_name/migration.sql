/*
  Warnings:

  - You are about to drop the column `title` on the `Playlist` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Track` table. All the data in the column will be lost.
  - Added the required column `name` to the `Playlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Playlist" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Track" DROP COLUMN "title",
ADD COLUMN     "name" VARCHAR(255) NOT NULL;
