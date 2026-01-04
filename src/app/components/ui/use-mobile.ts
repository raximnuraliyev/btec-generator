import * as React from "react";

/**
 * Responsive Breakpoints (System-Level Specification)
 * - Desktop XL: ≥ 1440px
 * - Desktop / Laptop: 1024px – 1439px
 * - Tablet: 768px – 1023px
 * - Mobile: ≤ 767px
 */
export const BREAKPOINTS = {
  mobile: 767,
  tablet: 1023,
  desktop: 1439,
  desktopXL: 1440,
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'desktopXL';

/**
 * Get current breakpoint based on viewport width
 */
export function getBreakpoint(width: number): Breakpoint {
  if (width <= BREAKPOINTS.mobile) return 'mobile';
  if (width <= BREAKPOINTS.tablet) return 'tablet';
  if (width <= BREAKPOINTS.desktop) return 'desktop';
  return 'desktopXL';
}

/**
 * Hook to get current breakpoint
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return getBreakpoint(window.innerWidth);
  });

  React.useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getBreakpoint(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

/**
 * Hook to check if viewport is mobile (≤ 767px)
 */
export function useIsMobile() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'mobile';
}

/**
 * Hook to check if viewport is tablet (768px – 1023px)
 */
export function useIsTablet() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'tablet';
}

/**
 * Hook to check if viewport is desktop or larger (≥ 1024px)
 */
export function useIsDesktop() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'desktop' || breakpoint === 'desktopXL';
}

/**
 * Hook to check if viewport is desktop XL (≥ 1440px)
 */
export function useIsDesktopXL() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'desktopXL';
}

/**
 * Hook to check if viewport is tablet or mobile (≤ 1023px)
 */
export function useIsMobileOrTablet() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'mobile' || breakpoint === 'tablet';
}
