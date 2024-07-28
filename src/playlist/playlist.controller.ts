// src/playlist/playlist.controller.ts

import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  Query,
  Request,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistOrderDto } from './dto/update-playlist-order.dto';
import { UpdatePlaylistMetadataDto } from './dto/update-playlist-metadata.dto';
import { ReorderPlaylistsDto } from './dto/reorder-playlists.dto';
import { UpdateTrackOrderDto } from './dto/update-track-order.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Playlist } from '@prisma/client';

@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  async getAllPlaylists(): Promise<Playlist[]> {
    return this.playlistService.getAllPlaylists();
  }

  @Post()
  async createPlaylist(
    @Request() req: any,
    @Body() createPlaylistDto: CreatePlaylistDto,
  ): Promise<Playlist> {
    console.log('Received request to create playlist');
    console.log('User:', req.user);
    console.log('CreatePlaylistDto:', createPlaylistDto);

    try {
      const createdPlaylist =
        await this.playlistService.createPlaylist(createPlaylistDto);
      console.log('Created playlist:', createdPlaylist);
      return createdPlaylist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw new HttpException(
        'Failed to create playlist',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  async getPlaylistById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Playlist | null> {
    const userId = (req as any).user.id;
    console.log(`User ${userId} requesting playlist ${id}`);

    await this.playlistService.ensureUserHasAccess(userId, parseInt(id, 10));
    console.log(`Access ensured for user ${userId} to playlist ${id}`);

    const playlist = await this.playlistService.getPlaylistById(
      parseInt(id, 10),
    );
    console.log(
      `Playlist ${id} fetched for user ${userId}: ${JSON.stringify(
        playlist,
        null,
        2,
      )}`,
    );

    return playlist;
  }

  // @UseGuards(PermissionsGuard)
  // @Patch()
  // async updatePlaylist(@Body() updatePlaylistDto: UpdatePlaylistDto): Promise<Playlist> {
  //   return this.playlistService.updatePlaylist(updatePlaylistDto);
  // }

  @UseGuards(PermissionsGuard)
  @Delete(':id')
  async deletePlaylist(@Param('id') id: string) {
    return this.playlistService.deletePlaylist(Number(id));
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post(':playlistId/tracks/:trackId')
  async addTrackToPlaylist(
    @Param('playlistId') playlistId: string,
    @Param('trackId') trackId: string,
    @Query('force') force: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    const forceAdd = force === 'true';

    console.log(
      `Controller: User ${userId} attempting to add track ${trackId} to playlist ${playlistId}`,
    );

    try {
      const result = await this.playlistService.addTrackToPlaylist(
        Number(playlistId),
        Number(trackId),
        userId,
        forceAdd,
      );
      console.log('Controller: Track added successfully:', result);
      return result;
    } catch (error) {
      console.error('Controller: Error adding track to playlist:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to add track to playlist',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(PermissionsGuard)
  @Delete(':playlistId/tracks/:trackId')
  async removeTrackFromPlaylist(
    @Param('playlistId') playlistId: string,
    @Param('trackId') trackId: string,
  ) {
    return this.playlistService.removeTrackFromPlaylist(
      Number(playlistId),
      Number(trackId),
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id/metadata')
  async updatePlaylistMetadata(
    @Param('id') id: string,
    @Body() updatePlaylistMetadataDto: UpdatePlaylistMetadataDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    console.log(`User ${userId} updating metadata for playlist ${id}`);
    console.log('Update data:', updatePlaylistMetadataDto);

    try {
      const playlistId = Number(id);
      const updatedPlaylist = await this.playlistService.updatePlaylistMetadata(
        playlistId,
        updatePlaylistMetadataDto,
      );

      if (!updatedPlaylist) {
        throw new HttpException('Playlist not found', HttpStatus.NOT_FOUND);
      }

      console.log('Updated playlist:', JSON.stringify(updatedPlaylist));

      return updatedPlaylist;
    } catch (error) {
      console.error('Error updating playlist metadata:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to update playlist metadata: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id/order')
  async updatePlaylistOrder(
    @Param('id') id: string,
    @Body() updatePlaylistOrderDto: UpdatePlaylistOrderDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    console.log(`User ${userId} updating track order for playlist ${id}`);

    try {
      const playlistId = Number(id);
      const updatedPlaylist = await this.playlistService.updatePlaylistOrder(
        playlistId,
        updatePlaylistOrderDto,
      );

      if (!updatedPlaylist) {
        throw new HttpException('Playlist not found', HttpStatus.NOT_FOUND);
      }

      return updatedPlaylist;
    } catch (error) {
      console.error('Error updating playlist order:', error);
      throw new HttpException(
        'Failed to update playlist order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reorder')
  async reorderPlaylists(
    @Body() reorderPlaylistsDto: ReorderPlaylistsDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    console.log(`User ${userId} reordering playlists`);
    console.log('Received playlist IDs:', reorderPlaylistsDto.playlistIds);

    try {
      const updatedPlaylists = await this.playlistService.reorderPlaylists(
        userId,
        reorderPlaylistsDto.playlistIds,
      );
      return updatedPlaylists;
    } catch (error) {
      console.error('Error reordering playlists:', error);
      throw new HttpException(
        'Failed to reorder playlists',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id/track-order')
  async updatePlaylistTrackOrder(
    @Param('id') id: string,
    @Body() updateTrackOrderDto: UpdateTrackOrderDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    console.log(`User ${userId} updating track order for playlist ${id}`);

    try {
      const playlistId = Number(id);
      const updatedPlaylist =
        await this.playlistService.updatePlaylistTrackOrder(
          playlistId,
          updateTrackOrderDto.trackIds,
        );

      if (!updatedPlaylist) {
        throw new HttpException('Playlist not found', HttpStatus.NOT_FOUND);
      }

      return updatedPlaylist;
    } catch (error) {
      console.error('Error updating playlist track order:', error);
      throw new HttpException(
        'Failed to update playlist track order',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
