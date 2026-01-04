"use client";

import * as React from "react";
import { cn } from "./utils";

/**
 * Responsive Container Component
 * 
 * Container Rules (per specification):
 * - Desktop XL: centered container, max-width 1320px
 * - Desktop/Laptop: centered container, max-width 1200px  
 * - Tablet: full width with padding
 * - Mobile: full width, edge-to-edge content with minimum 16px padding
 */
interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Remove horizontal padding */
  noPadding?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-full',
};

export function ResponsiveContainer({
  className,
  maxWidth = '2xl',
  noPadding = false,
  children,
  ...props
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        maxWidthClasses[maxWidth],
        // Responsive padding: generous on desktop, reduced on tablet, minimum 16px on mobile
        !noPadding && "px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Responsive Grid Component
 * 
 * Grid Rules (per specification):
 * - Desktop: 2-4 columns allowed
 * - Tablet: 2 columns max
 * - Mobile: Single column, cards stacked vertically
 */
interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns on large screens */
  cols?: 1 | 2 | 3 | 4;
  /** Gap between grid items */
  gap?: 'sm' | 'md' | 'lg';
}

const gapClasses = {
  sm: 'gap-3 sm:gap-4',
  md: 'gap-4 sm:gap-6',
  lg: 'gap-6 sm:gap-8',
};

const colClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export function ResponsiveGrid({
  className,
  cols = 3,
  gap = 'md',
  children,
  ...props
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        "grid",
        colClasses[cols],
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Responsive Stack Component
 * 
 * For form layouts and content that should stack vertically on mobile
 */
interface ResponsiveStackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Direction on larger screens */
  direction?: 'row' | 'col';
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
  /** Alignment */
  align?: 'start' | 'center' | 'end' | 'stretch';
}

const stackGapClasses = {
  sm: 'gap-2 sm:gap-3',
  md: 'gap-3 sm:gap-4',
  lg: 'gap-4 sm:gap-6',
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

export function ResponsiveStack({
  className,
  direction = 'row',
  gap = 'md',
  align = 'stretch',
  children,
  ...props
}: ResponsiveStackProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        direction === 'row' && "sm:flex-row",
        stackGapClasses[gap],
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { ResponsiveContainer as Container, ResponsiveGrid as Grid, ResponsiveStack as Stack };
