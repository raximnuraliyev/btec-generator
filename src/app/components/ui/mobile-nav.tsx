"use client";

import * as React from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "./utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { Button } from "./button";

/**
 * Mobile Navigation Component
 * 
 * Navigation Behavior (per specification):
 * - Mobile: Hamburger menu ONLY, full-screen slide-in menu
 * - Menu items stacked vertically
 * - Logout and profile always accessible
 * - Admin links grouped under "Admin"
 * - Navigation must be reachable within one tap
 * - No hover-only interactions on mobile
 */

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'primary' | 'destructive' | 'admin';
  group?: string;
  badge?: string | number;
  disabled?: boolean;
}

interface MobileNavProps {
  items: NavItem[];
  userInfo?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  onLogout?: () => void;
  className?: string;
  triggerClassName?: string;
}

export function MobileNav({
  items,
  userInfo,
  onLogout,
  className,
  triggerClassName,
}: MobileNavProps) {
  const [open, setOpen] = React.useState(false);

  // Group items by their group property
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, NavItem[]> = { default: [] };
    
    items.forEach(item => {
      const group = item.group || 'default';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    
    return groups;
  }, [items]);

  const handleItemClick = (item: NavItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setOpen(false);
  };

  const getVariantClasses = (variant?: NavItem['variant']) => {
    switch (variant) {
      case 'primary':
        return 'bg-black text-white hover:bg-gray-800';
      case 'destructive':
        return 'text-red-600 hover:bg-red-50';
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'hover:bg-gray-100';
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("md:hidden h-11 w-11 min-h-[44px] min-w-[44px]", triggerClassName)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className={cn(
          "w-full sm:w-[320px] p-0 flex flex-col",
          className
        )}
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-xl font-bold tracking-tight">Menu</SheetTitle>
        </SheetHeader>

        {/* User Info Section */}
        {userInfo && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              {userInfo.avatar ? (
                <img 
                  src={userInfo.avatar} 
                  alt={userInfo.name || 'User'} 
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                  {(userInfo.name || userInfo.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {userInfo.name && (
                  <p className="font-medium truncate">{userInfo.name}</p>
                )}
                {userInfo.email && (
                  <p className="text-sm text-gray-500 truncate">{userInfo.email}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {Object.entries(groupedItems).map(([group, groupItems]) => (
            <div key={group}>
              {group !== 'default' && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group}
                </div>
              )}
              {groupItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-[48px]",
                    "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black",
                    getVariantClasses(item.variant),
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {item.icon && (
                    <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                  )}
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-black text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout Button - Always accessible */}
        {onLogout && (
          <div className="p-4 border-t mt-auto">
            <Button
              onClick={() => {
                onLogout();
                setOpen(false);
              }}
              variant="outline"
              className="w-full min-h-[44px] border-2 border-black hover:bg-black hover:text-white"
            >
              Log Out
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Responsive Nav Wrapper
 * Shows desktop nav on larger screens, hamburger on mobile
 */
interface ResponsiveNavProps {
  mobileContent: React.ReactNode;
  desktopContent: React.ReactNode;
  breakpoint?: 'sm' | 'md' | 'lg';
}

const breakpointClasses = {
  sm: { mobile: 'sm:hidden', desktop: 'hidden sm:flex' },
  md: { mobile: 'md:hidden', desktop: 'hidden md:flex' },
  lg: { mobile: 'lg:hidden', desktop: 'hidden lg:flex' },
};

export function ResponsiveNav({
  mobileContent,
  desktopContent,
  breakpoint = 'md',
}: ResponsiveNavProps) {
  const classes = breakpointClasses[breakpoint];
  
  return (
    <>
      <div className={classes.mobile}>{mobileContent}</div>
      <div className={cn(classes.desktop, "items-center")}>{desktopContent}</div>
    </>
  );
}
