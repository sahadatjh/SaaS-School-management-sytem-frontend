import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { SortState } from '../../hooks/use-table-sort';
import { cn } from '../../lib/utils';

interface SortableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  columnKey: string;
  title: string;
  sortState: SortState;
  onRequestSort: (key: string) => void;
}

export function SortableHeader({ columnKey, title, sortState, onRequestSort, className, ...props }: SortableHeaderProps) {
  const isActive = sortState.sortBy === columnKey;
  
  return (
    <th 
      scope="col" 
      className={cn("px-5 py-3 group cursor-pointer hover:bg-slate-100 transition-colors select-none", className)}
      onClick={() => onRequestSort(columnKey)}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        <span>{title}</span>
        <span className="text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0">
          {!isActive && <ArrowUpDown className="size-3" />}
          {isActive && sortState.sortOrder === 'asc' && <ArrowUp className="size-3 text-slate-800" />}
          {isActive && sortState.sortOrder === 'desc' && <ArrowDown className="size-3 text-slate-800" />}
        </span>
      </div>
    </th>
  );
}
