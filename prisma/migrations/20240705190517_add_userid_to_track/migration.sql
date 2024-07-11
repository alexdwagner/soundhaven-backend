/*
  Warnings:

  - Added the required column `userId` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Track" ADD COLUMN "userId" INTEGER DEFAULT 1 NOT NULL;

-- CreateTable
CREATE TABLE "TrackAccess" (
    "userId" INTEGER NOT NULL,
    "trackId" INTEGER NOT NULL,
    "permission" TEXT NOT NULL,

    CONSTRAINT "TrackAccess_pkey" PRIMARY KEY ("userId","trackId")
);

-- CreateTable
CREATE TABLE "PlaylistAccess" (
    "userId" INTEGER NOT NULL,
    "playlistId" INTEGER NOT NULL,
    "permission" TEXT NOT NULL,

    CONSTRAINT "PlaylistAccess_pkey" PRIMARY KEY ("userId","playlistId")
);

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackAccess" ADD CONSTRAINT "TrackAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackAccess" ADD CONSTRAINT "TrackAccess_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistAccess" ADD CONSTRAINT "PlaylistAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistAccess" ADD CONSTRAINT "PlaylistAccess_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
