export interface HistoryState {
  pages: unknown[];
  timestamp: number;
  description: string;
}

export class HistoryManager {
  private history: HistoryState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(maxSize: number = 50) {
    this.maxHistorySize = maxSize;
  }

  addState(pages: unknown[], description: string = 'Action') {
    // Remove any future history if we're not at the end
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new state
    const newState: HistoryState = {
      pages: JSON.parse(JSON.stringify(pages)), // Deep clone
      timestamp: Date.now(),
      description
    };
    
    this.history.push(newState);
    this.currentIndex = this.history.length - 1;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): unknown[] | null {
    if (this.canUndo()) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex].pages));
    }
    return null;
  }

  redo(): unknown[] | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex].pages));
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getCurrentState(): HistoryState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  getHistoryInfo() {
    return {
      currentIndex: this.currentIndex,
      totalStates: this.history.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}
