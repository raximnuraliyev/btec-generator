"use client";

import * as React from "react";
import { cn } from "./utils";
import { useIsMobile } from "./use-mobile";

/**
 * Responsive Table Component
 * 
 * Table Rules (per specification):
 * Desktop:
 * - Full table visible
 * - Fixed headers allowed
 * - Sorting and filters visible
 * 
 * Tablet:
 * - Horizontal scroll allowed
 * - Sticky first column optional
 * 
 * Mobile (Mandatory Rules):
 * - Table MUST scroll horizontally OR
 * - Alternative mobile view: Card-based rows / Key-value layout
 * - Never shrink text below 14px
 * - Headers must remain understandable
 * - Tables must NOT wrap columns into unreadable layouts
 * - Tables must NOT cut off content
 */

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  /** Make this column sticky on scroll */
  sticky?: boolean;
  /** Hide on mobile - will show in card view instead */
  hideOnMobile?: boolean;
  /** Minimum width for this column */
  minWidth?: number;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  /** Unique key property for each row */
  keyField: keyof T;
  /** Show card view on mobile instead of scrollable table */
  cardViewOnMobile?: boolean;
  /** Custom card render function for mobile */
  renderCard?: (item: T, index: number) => React.ReactNode;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Table className */
  className?: string;
  /** Container className */
  containerClassName?: string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** On row click handler */
  onRowClick?: (item: T) => void;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyField,
  cardViewOnMobile = true,
  renderCard,
  emptyMessage = "No data available",
  loading = false,
  className,
  containerClassName,
  stickyHeader = false,
  onRowClick,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  // Get cell value from nested paths like "user.name"
  const getCellValue = (item: T, key: string) => {
    const keys = key.split('.');
    let value: any = item;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn("animate-pulse", containerClassName)}>
        <div className="h-10 bg-gray-200 rounded mb-2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded mb-1" />
        ))}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn(
        "text-center py-12 text-gray-500 border rounded-lg",
        containerClassName
      )}>
        {emptyMessage}
      </div>
    );
  }

  // Mobile card view
  if (isMobile && cardViewOnMobile) {
    return (
      <div className={cn("space-y-3", containerClassName)}>
        {data.map((item, index) => {
          if (renderCard) {
            return (
              <div key={String(item[keyField])} onClick={() => onRowClick?.(item)}>
                {renderCard(item, index)}
              </div>
            );
          }

          return (
            <div
              key={String(item[keyField])}
              className={cn(
                "border-2 border-black p-4 space-y-2",
                onRowClick && "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => {
                const value = column.render
                  ? column.render(item, index)
                  : getCellValue(item, column.key as string);
                
                return (
                  <div key={column.key as string} className="flex justify-between items-start gap-4">
                    <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                      {column.header}
                    </span>
                    <span className={cn("text-sm text-right", column.className)}>
                      {value ?? '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // Desktop/Tablet table view with horizontal scroll
  return (
    <div className={cn(
      "relative w-full overflow-x-auto border rounded-lg",
      containerClassName
    )}>
      <table className={cn(
        "w-full text-sm caption-bottom",
        // Ensure minimum text size of 14px on all devices
        "[&_td]:text-[14px] [&_th]:text-[14px]",
        className
      )}>
        <thead className={cn(
          stickyHeader && "sticky top-0 z-10 bg-white"
        )}>
          <tr className="border-b bg-gray-50">
            {columns.filter(c => !isMobile || !c.hideOnMobile).map((column, colIndex) => (
              <th
                key={column.key as string}
                className={cn(
                  "h-12 px-4 text-left align-middle font-semibold text-gray-700 whitespace-nowrap",
                  column.sticky && colIndex === 0 && "sticky left-0 z-20 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                  column.headerClassName
                )}
                style={{ minWidth: column.minWidth }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr
              key={String(item[keyField])}
              className={cn(
                "border-b transition-colors",
                onRowClick && "cursor-pointer hover:bg-gray-50",
                rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.filter(c => !isMobile || !c.hideOnMobile).map((column, colIndex) => {
                const value = column.render
                  ? column.render(item, rowIndex)
                  : getCellValue(item, column.key as string);

                return (
                  <td
                    key={column.key as string}
                    className={cn(
                      "p-4 align-middle",
                      column.sticky && colIndex === 0 && "sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                      column.className
                    )}
                    style={{ minWidth: column.minWidth }}
                  >
                    {value ?? '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Simple responsive table wrapper that adds horizontal scroll on mobile
 */
interface ScrollableTableWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollableTableWrapper({ children, className }: ScrollableTableWrapperProps) {
  return (
    <div className={cn(
      "relative w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0",
      className
    )}>
      <div className="min-w-full inline-block align-middle">
        {children}
      </div>
    </div>
  );
}
