export class CreateMarkerDto {
  start: number; // Time in the track (e.g., in seconds)
  end: number;
  trackId: number; // ID of the track the marker belongs to
  commentId?: number; // Optional ID of the comment associated with the marker
}
