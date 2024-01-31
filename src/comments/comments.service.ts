import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Comment } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async getTrackComments(
    trackId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<Comment[]> {
    const skip = (page - 1) * limit;

    const comments = await this.prisma.comment.findMany({
      where: {
        trackId: trackId,
      },
      skip: skip,
      take: limit,
      orderBy: {
        createdAt: 'desc', // Optional: order by creation date, adjust as needed
      },
      include: {
        user: {
          select: {
            name: true, // Include user's name
          },
        },
      },
    });

    const commentsWithUserName = comments.map((comment) => ({
      ...comment,
      userName: comment.user?.name || 'Anonymous', // Alias 'name' as 'userName'
    }));

    console.log('Comments with userName:', commentsWithUserName); // Log to verify the structure
    return commentsWithUserName;
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
      return await this.prisma.comment.create({
        data: {
          trackId,
          userId,
          content,
        },
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error; // Rethrow the error to be caught in your controller
    }
  }

  async editComment(commentId: number, content: string): Promise<Comment> {
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });
  }

  async deleteComment(commentId: number): Promise<void> {
    await this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
