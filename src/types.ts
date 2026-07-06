export interface HistoryEvent {
  id: string;
  title: string;
  period: string;
  year: number; // For actual sorting validation
  highlight: string;
  description: string;
  colorTheme: 'amber' | 'emerald' | 'rose' | 'indigo';
  iconName: 'Castle' | 'Ship' | 'Scroll' | 'Compass';
}

export interface DraggedItem {
  id: string;
  sourceType: 'deck' | 'timeline';
  sourceIndex?: number;
}
