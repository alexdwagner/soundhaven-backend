import {
  Controller,
  Get,
  Query,
  Post,
  Req,
  Patch,
  Delete,
  Body,
  Param,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { Comment, Marker } from '@prisma/client';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateCommentWithMarkerDto } from './dto/create-comment-with-marker.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthenticatedRequest } from '@/types/request';
// Create JWTAuthGuard

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

  @Post('/with-marker')
  async addCommentWithMarker(
    @Req() req: AuthenticatedRequest, // Use the custom request type
    @Body() createCommentWithMarkerDto: CreateCommentWithMarkerDto,
  ): Promise<{ comment: Comment; marker: Marker }> {
    console.log('Request User:', req.user);
    console.log('Request Body:', createCommentWithMarkerDto);

    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Convert to number
    const userId = parseInt(req.user.id, 10);
    if (isNaN(userId)) {
      throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
    }

    console.log(`Adding comment with marker for userId: ${userId}`);
    try {
      const result = await this.commentsService.addCommentWithMarker(
        userId,
        createCommentWithMarkerDto,
      );
      console.log('Response from Service:', result);
      return result;
    } catch (error) {
      console.error('Error in addCommentWithMarker:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add comment with marker');
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
