import {
  Controller,
  Get,
  Query,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  BadRequestException,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { Comment } from '@prisma/client';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  async getTrackComments(@Query('trackId') trackId: number) {
    if (!trackId || trackId <= 0) {
      throw new BadRequestException('A valid Track ID is required');
    }
    try {
      return await this.commentsService.getTrackComments(trackId);
    } catch (error: any) {
      throw new HttpException(
        'Failed to retrieve comments',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async addComment(
    @Body('trackId') trackId: number,
    @Body('userId') userId: number,
    @Body('content') content: string,
  ): Promise<Comment> {
    console.log(
      `Received request with trackId: ${trackId}, userId: ${userId}, content: ${content}`,
    );
    if (!trackId || trackId <= 0 || !userId || userId <= 0) {
      throw new BadRequestException('Valid Track ID and User ID are required');
    }
    if (!content || content.trim() === '') {
      throw new BadRequestException('Comment content cannot be empty');
    }
    try {
      return await this.commentsService.addComment(trackId, userId, content);
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      throw new HttpException(
        'Failed to add comment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async editComment(
    @Param('id', ParseIntPipe) commentId: number,
    @Body('content') content: string,
  ) {
    return this.commentsService.editComment(commentId, content);
  }

  @Delete(':id')
  async deleteComment(
    @Param('id', ParseIntPipe) commentId: number,
  ): Promise<void> {
    await this.commentsService.deleteComment(commentId);
  }
}
