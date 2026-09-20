import { useState, useCallback, useEffect } from 'react';

export type SortOrder = 'asc' | 'desc';

export interface SortState {
  sortBy: string | undefined;
  sortOrder: SortOrder | undefined;
}

export function useListQuery(defaultSortBy?: string, defaultSortOrder?: SortOrder) {
  const [sortState, setSortState] = useState<SortState>({
    sortBy: defaultSortBy,
    sortOrder: defaultSortOrder,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const requestSort = useCallback((key: string) => {
    setSortState((prev) => {
      if (prev.sortBy === key) {
        if (prev.sortOrder === 'asc') return { sortBy: key, sortOrder: 'desc' };
        if (prev.sortOrder === 'desc') return { sortBy: undefined, sortOrder: undefined }; // Reset
      }
      return { sortBy: key, sortOrder: 'asc' };
    });
  }, []);

  return { sortState, requestSort, search, setSearch, debouncedSearch };
}
