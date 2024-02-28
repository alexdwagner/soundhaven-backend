import { Injectable, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Comment } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MarkersService } from 'src/markers/markers.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private markersService: MarkersService,
  ) {}

  async getTrackComments(
    trackId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<Comment[]> {
    try {
      const skip = (page - 1) * limit;
      const comments = await this.prisma.comment.findMany({
        where: { trackId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
          // Ensure marker is included if exists
          marker: true,
        },
      });

      // Transform comments to include userName and handle marker data
      const transformedComments = comments.map((comment) => ({
        ...comment,
        userName: comment.user!.name, // Asserting user is non-null
        marker: comment.marker
          ? {
              id: comment.marker.id,
              time: comment.marker.time,
              commentId: comment.marker.commentId,
              trackId: comment.marker.trackId,
              createdAt: comment.marker.createdAt,
            }
          : null,
      }));

      // console.log("Right before returning comments to frontend", transformedComments);
      return transformedComments;
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve comments',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addComment(
    trackId: number,
    userId: number,
    content: string,
    markerTime?: number,
  ): Promise<Comment> {
    if (!userId) {
      throw new Error('User ID is required to add a comment.');
    }

    if (!trackId) {
      throw new Error('Track ID is required to add a comment.');
    }

    if (!content || content.trim() === '') {
      throw new Error('Comment content cannot be empty.');
    }

    try {
      const comment = await this.prisma.comment.create({
        data: {
          trackId,
          userId,
          content,
          // Conditionally create a marker if markerTime is provided
          ...(markerTime !== undefined && {
            marker: {
              create: {
                time: markerTime,
                trackId, // Assuming the marker needs a reference to the track
              },
            },
          }),
        },
        include: {
          marker: true, // Include the marker data in the response
        },
      });

      return comment;
    } catch (error) {
      console.error('Error adding comment with marker:', error);
      throw new HttpException(
        'Error adding comment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addCommentWithMarker(
    trackId: number,
    userId: number,
    content: string,
    time: number,
  ): Promise<Comment> {
    // Construct an array to hold missing field names
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!trackId) missingFields.push('trackId');
    if (!content.trim()) missingFields.push('content');
  
    // Check if there are any missing fields
    if (missingFields.length > 0) {
      const missingFieldsMessage = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(missingFieldsMessage);
      throw new HttpException(missingFieldsMessage, HttpStatus.BAD_REQUEST);
    }
  
    // Verify the existence of related records
    const trackExists = await this.prisma.track.findUnique({ where: { id: trackId } });
    if (!trackExists) {
      throw new HttpException('Track does not exist', HttpStatus.BAD_REQUEST);
    }
  
    const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);
    }
  
    // Proceed with creating the comment and marker
    try {
      const comment = await this.prisma.comment.create({
        data: {
          trackId,
          userId,
          content,
        },
      });
  
      // Use the `createMarker` method from your markers service
      await this.markersService.createMarker({
        time,
        trackId,
        commentId: comment.id,
      });
  
      return comment; // Return the created comment
    } catch (error) {
      console.error('Error adding comment with marker:', error);
      throw new HttpException(
        'Error adding comment with marker',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async editComment(commentId: number, content: string): Promise<Comment> {
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });
  }

  // Ensure deleteComment also deletes any associated marker
  async deleteComment(commentId: number): Promise<void> {
    await this.prisma.comment.delete({
      where: { id: commentId },
      include: {
        marker: true,
      },
    });
  }

  // Add method for deleting all comments (and markers) for a track
  async deleteCommentsByTrack(trackId: number): Promise<void> {
    await this.prisma.comment.deleteMany({
      where: { trackId },
    });
    // Assuming cascading deletes are set up for markers in Prisma schema
  }
}
