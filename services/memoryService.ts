
export interface MemoryContextItem {
  memory: string;
  relevance: number;
}

export const memoryService = {
  /**
   * Simulates a vector DB retrieval.
   * Returns the most recent memories formatted for the prompt.
   */
  getMemories: (): MemoryContextItem[] => {
    try {
      const raw = localStorage.getItem('fz_long_term_memory');
      const items: string[] = raw ? JSON.parse(raw) : [];
      
      // In a real app, this would use vector similarity.
      // Here we just return the last 15 items with mock relevance.
      return items.slice(-15).map(text => ({
        memory: text,
        relevance: 0.85 + (Math.random() * 0.1) // Mock relevance between 0.85 and 0.95
      }));
    } catch (e) {
      console.error("Error reading memory", e);
      return [];
    }
  },

  /**
   * Saves new memory items to local storage.
   */
  saveMemories: (newMemories: string[]) => {
    try {
      if (!newMemories || newMemories.length === 0) return;

      const raw = localStorage.getItem('fz_long_term_memory');
      const currentItems: string[] = raw ? JSON.parse(raw) : [];

      // Filter duplicates
      const uniqueNew = newMemories.filter(m => !currentItems.includes(m));
      if (uniqueNew.length === 0) return;

      const updated = [...currentItems, ...uniqueNew];
      
      // Keep storage within reasonable limits for a demo (e.g., 50 items)
      if (updated.length > 50) {
        updated.splice(0, updated.length - 50);
      }

      localStorage.setItem('fz_long_term_memory', JSON.stringify(updated));
      console.log("[MemoryService] Saved new memories:", uniqueNew);
    } catch (e) {
      console.error("Error saving memory", e);
    }
  }
};
