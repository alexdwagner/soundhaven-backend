export class CreateMarkerDto {
  time: number; // Time in the track (e.g., in seconds)
  trackId: number; // ID of the track the marker belongs to
  commentId?: number; // Optional ID of the comment associated with the marker
}
