export interface Checkpoint {
  id: string;
  timestamp: string; // ISO 8601
  description: string;
  date: string; // YYYY-MM-DD for grouping by day
}
