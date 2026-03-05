export interface Subscription {
  id: string;
  name: string;
  endDate: string;
  reminderDays: number;
  cancelUrl?: string;
  color: string;
}

export const COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#EC4899', // pink
];
