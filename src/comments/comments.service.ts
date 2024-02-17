import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Comment } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

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
        userName: comment.user?.name || 'Anonymous',
      }));
    } catch (error: any) { // Typing error as any for simplicity; consider a more specific type or custom error handling
      console.error(`Failed to retrieve comments for track ${trackId}:`, error);
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
      throw error; // Ensure to handle or rethrow the error appropriately
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