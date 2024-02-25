import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarkerDto } from './dto/create-marker.dto';
import { UpdateMarkerDto } from './dto/update-marker.dto';
import { Marker } from '@prisma/client';

@Injectable()
export class MarkersService {
  constructor(private prisma: PrismaService) {}

  async getAllMarkers(trackId: number): Promise<Marker[]> {
    return this.prisma.marker.findMany({
      where: { trackId },
    });
  }

  async createMarker(createMarkerDto: CreateMarkerDto): Promise<Marker> {
    return this.prisma.marker.create({
      data: {
        time: createMarkerDto.time,
        trackId: createMarkerDto.trackId,
        commentId: createMarkerDto.commentId,
      },
    });
  }

  async getMarkerById(id: string): Promise<Marker | null> {
    return this.prisma.marker.findUnique({
      where: { id: Number(id) },
    });
  }

  async updateMarker(
    id: string,
    updateMarkerDto: UpdateMarkerDto,
  ): Promise<Marker> {
    return this.prisma.marker.update({
      where: { id: Number(id) },
      data: {
        time: updateMarkerDto.start,
        trackId: updateMarkerDto.trackId,
        commentId: updateMarkerDto.commentId,
      },
    });
  }

  async deleteMarker(id: string): Promise<void> {
    await this.prisma.marker.delete({
      where: { id: Number(id) },
    });
  }
}
