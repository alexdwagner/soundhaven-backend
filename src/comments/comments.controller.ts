import { Controller, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  async addComment(
    @Body('trackId') trackId: number,
    @Body('userId') userId: number, // Optional, depending on your app's logic
    @Body('text') text: string,
  ) {
    return this.commentsService.addComment(trackId, userId, text);
  }

  @Patch(':id')
  async editComment(
    @Param('id') commentId: number,
    @Body('text') text: string,
  ) {
    return this.commentsService.editComment(commentId, text);
  }

  @Delete(':id')
  async deleteComment(@Param('id') commentId: number) {
    return this.commentsService.deleteComment(commentId);
  }
}
