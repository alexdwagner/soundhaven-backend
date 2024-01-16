import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Comment } from '@prisma/client'; 

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async addComment(trackId: number, userId: number, content: string): Promise<Comment> {
    // Ensure userId is provided
    if (!userId) {
      throw new Error('User ID is required to add a comment.');
    }

    return this.prisma.comment.create({
      data: {
        trackId,
        userId, // userId is now a required field
        content,
      },
    });
  }

  async editComment(commentId: number, content: string): Promise<Comment> {
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });
  }

  async deleteComment(commentId: number): Promise<Comment> {
    return this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
