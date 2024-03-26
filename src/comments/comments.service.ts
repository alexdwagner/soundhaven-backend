import { Injectable, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Comment, Marker } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MarkersService } from 'src/markers/markers.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateCommentWithMarkerDto } from './dto/create-comment-with-marker.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

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
          marker: {
            select: {
              id: true,
              time: true,
              commentId: true,
              trackId: true,
              createdAt: true,
              waveSurferRegionID: true, // Include the waveSurferRegionID field
            },
          },
        },
      });

      // Transform comments to include userName and handle marker data
      const transformedComments = comments.map((comment) => ({
        ...comment,
        userName: comment.user!.name, // Asserting user is non-null
        marker: comment.marker
          ? {
            ...comment.marker,
            waveSurferRegionID: comment.marker.waveSurferRegionID,
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
        },
      });

      return comment; // Return the created comment
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new HttpException(
        'Error adding comment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async addCommentWithMarker(
    userId: number,
    { trackId, content, time, waveSurferRegionID }: CreateCommentWithMarkerDto,
  ): Promise<{ comment: Comment; marker: Marker }> {
    console.log(
      `Entering addCommentWithMarker for user ${userId} and track ${trackId}`,
    );

    const missingFieldNames = [];
    if (!userId) missingFieldNames.push('userId');
    if (!trackId) missingFieldNames.push('trackId');
    if (!content.trim()) missingFieldNames.push('content');

    if (missingFieldNames.length > 0) {
      const errorMessage = `Missing required fields: ${missingFieldNames.join(
        ', ',
      )}`;
      console.error(errorMessage);
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }

    const trackExists = await this.prisma.track.findFirst({
      where: { id: trackId },
    });
    if (!trackExists) {
      throw new HttpException('Track does not exist', HttpStatus.BAD_REQUEST);
    }

    const userExists = await this.prisma.user.findFirst({
      where: { id: userId },
    });
    if (!userExists) {
      throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const createdComment = await prisma.comment.create({
          data: { trackId, userId, content },
        });

        const createdMarker = await prisma.marker.create({
          data: {
            time,
            trackId,
            commentId: createdComment.id,
            waveSurferRegionID,
          },
        });

        console.log('Created comment:', createdComment);
        console.log('Created marker:', createdMarker);

        return {
          comment: createdComment,
          marker: {
            ...createdMarker,
            waveSurferRegionID,
          },
        };
      });

      console.log(
        `Successfully added comment and marker for user ${userId} and track ${trackId}`,
      );
      return result;
    } catch (error) {
      console.error('Error adding comment with marker:', error);
      throw new HttpException(
        'An error occurred while adding the comment with marker',
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
