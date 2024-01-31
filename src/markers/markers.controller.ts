import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { MarkersService } from './markers.service';
import { CreateMarkerDto } from './dto/create-marker.dto';
import { UpdateMarkerDto } from './dto/update-marker.dto';

@Controller('markers')
export class MarkersController {
  constructor(private readonly markersService: MarkersService) {}

  @Post()
  async createMarker(@Body() createMarkerDto: CreateMarkerDto) {
    try {
      return await this.markersService.createMarker(createMarkerDto);
    } catch (error) {
      console.error('Error creating marker:', error);
      throw new HttpException(
        'Failed to create marker',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getMarkerById(@Param('id') id: string) {
    return this.markersService.getMarkerById(id);
  }

  @Get()
  async getAllMarkers(@Query('trackId') trackId: string) {
    try {
      if (!trackId) {
        throw new HttpException('Track ID is required', HttpStatus.BAD_REQUEST);
      }
      return await this.markersService.getAllMarkers(Number(trackId));
    } catch (error) {
      console.error('Error fetching markers:', error);
      throw new HttpException(
        'Failed to fetch markers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteMarker(@Param('id') id: string) {
    try {
      console.log('Deleting marker with ID:', id);
      return await this.markersService.deleteMarker(id);
    } catch (error) {
      console.error('Error deleting marker:', error);
      throw new HttpException(
        'Failed to delete marker',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async updateMarker(
    @Param('id') id: string,
    @Body() updateMarkerDto: UpdateMarkerDto,
  ) {
    try {
      console.log(`Received update for marker ${id}:`, updateMarkerDto);
      return await this.markersService.updateMarker(id, updateMarkerDto);
    } catch (error) {
      console.error('Error updating marker:', error);
      throw new HttpException(
        'Failed to update marker',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
