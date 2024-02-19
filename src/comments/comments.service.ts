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
  ) { }

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
          marker: true,
        },
      });

      return comments.map(comment => ({
        ...comment,
        userName: comment.user?.name,
      }));
    } catch (error) {
      throw new HttpException('Failed to retrieve comments', HttpStatus.INTERNAL_SERVER_ERROR);
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
                start: markerTime,
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
      throw new HttpException('Error adding comment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addCommentWithMarker(
    trackId: number,
    userId: number,
    content: string,
    start: number,
  ): Promise<Comment> {
    if (!userId || !trackId || !content.trim()) {
      throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
    }

    return await this.prisma.$transaction(async (prisma) => {
      const comment = await prisma.comment.create({
        data: {
          trackId,
          userId,
          content,
        },
      });

      await this.markersService.createMarker({
        start,
        trackId,
        commentId: comment.id, // Assuming the marker needs a reference to the comment
      });

      // Optionally refetch the comment to include the marker in the response
      // if needed or simply return the created comment as is.
      return comment;
    }).catch(error => {
      console.error('Error adding comment with marker:', error);
      throw new HttpException('Error adding comment with marker', HttpStatus.INTERNAL_SERVER_ERROR);
    });
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