import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Comment } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AddCommentDto } from './dto/add-comment.dto';
import { AddCommentWithMarkerDto } from './dto/add-comment-with-marker.dto';

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

      return comments.map((comment) => ({
        ...comment,
        userName: comment.user?.name || 'Anonymous',
      }));
    } catch (error: any) {
      // Typing error as any for simplicity; consider a more specific type or custom error handling
      console.error(`Failed to retrieve comments for track ${trackId}:`, error);
      throw new HttpException(
        'Failed to retrieve comments',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async addComment(dto: AddCommentDto): Promise<Comment> {
    const { trackId, userId, content, start, end } = dto; // Destructure 'start' and 'end' from the DTO

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
      const commentData: any = {
        trackId,
        userId,
        content,
      };

      // Conditionally add marker data if 'start' is provided
      if (typeof start !== 'undefined') {
        commentData.marker = {
          create: {
            start,
            ...(typeof end !== 'undefined' && { end }), // Include 'end' only if it's provided
            trackId,
          },
        };
      }

      const comment = await this.prisma.comment.create({
        data: commentData,
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

  async addCommentWithMarker(dto: AddCommentWithMarkerDto): Promise<Comment> {
    const { trackId, userId, content, start, end } = dto;

    return await this.prisma.$transaction(async (prisma) => {
      const comment = await prisma.comment.create({
        data: {
          trackId,
          userId,
          content,
        },
      });
  
      await prisma.marker.create({
        data: {
          start,
          end, // end is optional; it will be included if provided
          trackId,
          commentId: comment.id,
        },
      });
  
      return comment;
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
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { marker: true },
    });

    if (comment && comment.marker) {
      await this.prisma.marker.delete({
        where: { id: comment.marker.id },
      });
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
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
