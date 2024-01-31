export class CreateCommentDto {
  content: string;
  trackId: number;
  userId?: number; // Optional, as the userId field is optional in the Comment model
  replyToId?: number; // Optional field for replying to a specific comment
}
