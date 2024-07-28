import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Playlist } from '@prisma/client';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { DeletePlaylistDto } from './dto/delete-playlist.dto';
import { UpdatePlaylistOrderDto } from './dto/update-playlist-order.dto';
import { UpdatePlaylistMetadataDto } from './dto/update-playlist-metadata.dto';

@Injectable()
export class PlaylistService {
  private readonly logger = new Logger(PlaylistService.name);

  constructor(private prisma: PrismaService) {}

  async getAllPlaylists(): Promise<Playlist[]> {
    return this.prisma.playlist.findMany();
  }

  async createPlaylist(
    createPlaylistDto: CreatePlaylistDto,
  ): Promise<Playlist> {
    console.log('Creating playlist with data:', createPlaylistDto);
    try {
      const createdPlaylist = await this.prisma.playlist.create({
        data: createPlaylistDto,
      });

      await this.addPlaylistAccess(
        createdPlaylist.userId,
        createdPlaylist.id,
        'edit',
      );

      console.log('Created playlist:', createdPlaylist);
      return createdPlaylist;
    } catch (error) {
      console.error('Error creating playlist in database:', error);
      throw error;
    }
  }

  async getPlaylistById(id: number): Promise<Playlist | null> {
    console.log(`Fetching playlist with ID: ${id}`);
    try {
      const playlist = await this.prisma.playlist.findUnique({
        where: { id },
        include: {
          TracksInPlaylist: {
            include: {
              track: {
                include: {
                  artist: true,
                  album: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!playlist) {
        console.log(`Playlist with ID ${id} not found`);
        return null;
      }

      console.log(`Playlist found: ${JSON.stringify(playlist, null, 2)}`);
      console.log(
        `Number of tracks in playlist: ${playlist.TracksInPlaylist.length}`,
      );

      return playlist;
    } catch (error) {
      console.error(`Error fetching playlist with ID ${id}:`, error);
      throw error;
    }
  }

  // async updatePlaylist(updatePlaylistDto: UpdatePlaylistDto) {
  //   const { id, tracks, ...rest } = updatePlaylistDto;

  //   if (tracks) {
  //     // Add or remove tracks logic
  //     await this.prisma.tracksInPlaylist.deleteMany({
  //       where: { playlistId: id },
  //     });

  //     await this.prisma.tracksInPlaylist.createMany({
  //       data: tracks.map(trackId => ({ trackId, playlistId: id })),
  //     });
  //   }

  //   return this.prisma.playlist.update({
  //     where: { id },
  //     data: rest,
  //   });
  // }

  async deletePlaylist(id: number) {
    try {
      // First, delete all TracksInPlaylist entries for this playlist
      await this.prisma.tracksInPlaylist.deleteMany({
        where: { playlistId: id },
      });

      // Next, delete all PlaylistAccess entries for this playlist
      await this.prisma.playlistAccess.deleteMany({
        where: { playlistId: id },
      });

      // Then, delete the playlist
      return await this.prisma.playlist.delete({
        where: { id },
      });
    } catch (error) {
      console.error(`Error deleting playlist with ID ${id}:`, error);
      throw new Error(`Failed to delete playlist: ${error.message}`);
    }
  }

  async addTrackToPlaylist(
    playlistId: number,
    trackId: number,
    userId: number,
    force: boolean = false,
  ) {
    console.log(
      `Adding track ${trackId} to playlist ${playlistId} by user ${userId}`,
    );
    try {
      // Check if the user has access to the playlist
      const hasAccess = await this.checkUserPermission(userId, playlistId);
      if (!hasAccess) {
        throw new Error(
          'User does not have permission to modify this playlist',
        );
      }

      // Check if the track is already in the playlist
      const existingTrack = await this.prisma.tracksInPlaylist.findFirst({
        where: {
          trackId: trackId,
          playlistId: playlistId,
        },
      });

      if (existingTrack && !force) {
        console.log(`Track ${trackId} is already in playlist ${playlistId}`);
        return {
          status: 'DUPLICATE',
          message: 'Track already exists in playlist',
          playlistId: playlistId,
          trackId: trackId,
        };
      }

      // Get the current highest order in the playlist
      const highestOrder = await this.prisma.tracksInPlaylist.findFirst({
        where: { playlistId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const nextOrder = (highestOrder?.order ?? -1) + 1;

      // If force is true or the track doesn't exist, add it
      const result = await this.prisma.tracksInPlaylist.create({
        data: {
          playlistId,
          trackId,
          order: nextOrder,
        },
      });
      console.log(
        `Successfully added track ${trackId} to playlist ${playlistId}`,
      );
      console.log(`Result: ${JSON.stringify(result, null, 2)}`);

      // Fetch the updated playlist
      const updatedPlaylist = await this.getPlaylistById(playlistId);
      console.log(
        `Updated playlist: ${JSON.stringify(updatedPlaylist, null, 2)}`,
      );
      return updatedPlaylist;
    } catch (error) {
      console.error(
        `Failed to add track ${trackId} to playlist ${playlistId}:`,
        error,
      );
      throw error;
    }
  }

  async removeTrackFromPlaylist(playlistId: number, trackId: number) {
    return this.prisma.tracksInPlaylist.delete({
      where: {
        trackId_playlistId: {
          playlistId,
          trackId,
        },
      },
    });
  }

  async checkUserPermission(
    userId: number,
    playlistId: number,
  ): Promise<boolean> {
    console.log(
      'PlaylistService: Checking permissions for user',
      userId,
      'on playlist',
      playlistId,
    );

    try {
      const access = await this.prisma.playlistAccess.findUnique({
        where: {
          userId_playlistId: {
            userId,
            playlistId,
          },
        },
      });
      console.log('PlaylistService: Access check result:', access);
      return !!access;
    } catch (error) {
      console.error('PlaylistService: Error checking permissions:', error);
      return false;
    }
  }

  async addPlaylistAccess(
    userId: number,
    playlistId: number,
    permission: string,
  ): Promise<void> {
    console.log(
      `PlaylistService: Adding access for user ${userId} to playlist ${playlistId} with permission ${permission}`,
    );
    try {
      await this.prisma.playlistAccess.create({
        data: {
          userId,
          playlistId,
          permission,
        },
      });
      console.log(
        `PlaylistService: Successfully added access for user ${userId} to playlist ${playlistId}`,
      );
    } catch (error) {
      console.error(
        `PlaylistService: Failed to add access for user ${userId} to playlist ${playlistId}:`,
        error,
      );
      throw error;
    }
  }

  async removePlaylistAccess(
    userId: number,
    playlistId: number,
  ): Promise<void> {
    await this.prisma.playlistAccess.delete({
      where: {
        userId_playlistId: {
          userId,
          playlistId,
        },
      },
    });
  }

  async ensureUserHasAccess(userId: number, playlistId: number): Promise<void> {
    console.log(
      `Service: Ensuring user ${userId} has access to playlist ${playlistId}`,
    );
    const hasAccess = await this.checkUserPermission(userId, playlistId);
    if (!hasAccess) {
      console.log(
        `Service: Adding access for user ${userId} to playlist ${playlistId}`,
      );
      await this.addPlaylistAccess(userId, playlistId, 'read');
    }
  }

  async updatePlaylistMetadata(
    id: number,
    updatePlaylistMetadataDto: UpdatePlaylistMetadataDto,
  ): Promise<Playlist | null> {
    console.log(`Updating metadata for playlist ${id}`);
    console.log('Update data:', JSON.stringify(updatePlaylistMetadataDto));
    try {
      const updatedPlaylist = await this.prisma.playlist.update({
        where: { id },
        data: updatePlaylistMetadataDto,
      });

      const playlistWithTracks = await this.getPlaylistById(id);
      if (!playlistWithTracks) {
        throw new Error(`Playlist with ID ${id} not found after update`);
      }

      console.log(
        `Updated playlist metadata: ${JSON.stringify(
          playlistWithTracks,
          null,
          2,
        )}`,
      );
      return playlistWithTracks;
    } catch (error) {
      console.error(`Failed to update playlist metadata ${id}:`, error.stack);
      throw error;
    }
  }

  async updatePlaylistOrder(
    id: number,
    updatePlaylistOrderDto: UpdatePlaylistOrderDto,
  ): Promise<Playlist | null> {
    this.logger.log(`Updating track order for playlist ${id}`);
    try {
      // Remove existing track associations
      await this.prisma.tracksInPlaylist.deleteMany({
        where: { playlistId: id },
      });

      // Add new track associations with order
      await this.prisma.tracksInPlaylist.createMany({
        data: updatePlaylistOrderDto.trackIds.map((trackId, index) => ({
          playlistId: id,
          trackId,
          order: index,
        })),
      });

      const playlistWithTracks = await this.getPlaylistById(id);
      if (!playlistWithTracks) {
        throw new Error(`Playlist with ID ${id} not found after reordering`);
      }

      this.logger.log(
        `Updated playlist order: ${JSON.stringify(
          playlistWithTracks,
          null,
          2,
        )}`,
      );
      return playlistWithTracks;
    } catch (error) {
      this.logger.error(`Failed to update playlist order ${id}:`, error.stack);
      throw error;
    }
  }

  async reorderPlaylists(
    userId: number,
    playlistIds: number[],
  ): Promise<Playlist[]> {
    console.log(`Reordering playlists for user ${userId}`);
    console.log('Playlist IDs to reorder:', playlistIds);

    try {
      // Update the order of playlists
      await this.prisma.$transaction(
        playlistIds.map((id, index) =>
          this.prisma.playlist.update({
            where: { id },
            data: { order: index },
          }),
        ),
      );

      // Fetch and return the updated playlists
      const updatedPlaylists = await this.prisma.playlist.findMany({
        where: { userId },
        orderBy: { order: 'asc' },
      });

      console.log(
        `Reordered playlists: ${JSON.stringify(updatedPlaylists, null, 2)}`,
      );
      return updatedPlaylists;
    } catch (error) {
      console.error(
        `Failed to reorder playlists for user ${userId}:`,
        error.stack,
      );
      throw error;
    }
  }

  async updatePlaylistTrackOrder(
    playlistId: number,
    trackIds: number[],
  ): Promise<Playlist> {
    try {
      await this.prisma.$transaction(
        trackIds.map((trackId, index) =>
          this.prisma.tracksInPlaylist.updateMany({
            where: { playlistId, trackId },
            data: { order: index },
          }),
        ),
      );

      const updatedPlaylist = await this.getPlaylistById(playlistId);
      if (!updatedPlaylist) {
        throw new Error(
          `Playlist with ID ${playlistId} not found after updating track order`,
        );
      }
      return updatedPlaylist;
    } catch (error) {
      this.logger.error(
        `Failed to update track order for playlist ${playlistId}:`,
        error.stack,
      );
      throw error;
    }
  }
}
