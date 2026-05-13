export interface Category {
  id: string;
  hebrewName: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { id: 'food', hebrewName: 'מזון', emoji: '🍔' },
  { id: 'transport', hebrewName: 'תחבורה', emoji: '🚗' },
  { id: 'entertainment', hebrewName: 'בידור', emoji: '🎬' },
  { id: 'health', hebrewName: 'בריאות', emoji: '💊' },
  { id: 'shopping', hebrewName: 'קניות', emoji: '🛍️' },
  { id: 'other', hebrewName: 'אחר', emoji: '📦' },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(c => c.id === id);
}
