import { useState, useCallback } from 'react';

export type SortOrder = 'asc' | 'desc';

export interface SortState {
  sortBy: string | undefined;
  sortOrder: SortOrder | undefined;
}

export function useTableSort(defaultSortBy?: string, defaultSortOrder?: SortOrder) {
  const [sortState, setSortState] = useState<SortState>({
    sortBy: defaultSortBy,
    sortOrder: defaultSortOrder,
  });

  const requestSort = useCallback((key: string) => {
    setSortState((prev) => {
      if (prev.sortBy === key) {
        if (prev.sortOrder === 'asc') return { sortBy: key, sortOrder: 'desc' };
        if (prev.sortOrder === 'desc') return { sortBy: undefined, sortOrder: undefined }; // Reset
      }
      return { sortBy: key, sortOrder: 'asc' };
    });
  }, []);

  return { sortState, requestSort };
}
