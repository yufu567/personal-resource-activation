import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeft } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, children, ...props }, ref) => {
  const [openMobile, setOpenMobile] = React.useState(false);
  const isMobile = false; // Simplified for desktop-first

  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  const toggleSidebar = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, [setOpen]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContext>(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={cn("group/sidebar-wrapper flex min-h-svh w-full", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
});
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, children, ...props }, ref) => {
    const { state, isMobile } = useSidebar();

    if (isMobile) {
      return (
        <Sheet open={false} onOpenChange={() => {}}>
          <SheetContent className="w-[--sidebar-width] bg-sidebar p-0 [&>button]:hidden" side="left">
            <div className="flex h-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className="group/sidebar peer hidden md:block"
        data-state={state}
        data-collapsible={state === "collapsed" ? "" : "offcanvas"}
      >
        <div
          className={cn(
            "relative h-svh w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-linear",
            "group-data-[collapsible=offcanvas]/sidebar:w-0",
          )}
        />
        <div
          className={cn(
            "fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] duration-200 ease-linear md:flex",
            "left-0 group-data-[collapsible=offcanvas]/sidebar:left-[calc(var(--sidebar-width)*-1)]",
            "border-r border-sidebar-border bg-sidebar",
          )}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col gap-4 [&>[data-sidebar=sidebar-header]]:flex-shrink-0 [&>[data-sidebar=sidebar-content]]:flex-1 [&>[data-sidebar=sidebar-footer]]:flex-shrink-0"
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="sidebar-header"
      className={cn("flex flex-col gap-2 px-4 pt-4", className)}
      {...props}
    />
  ),
);
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="sidebar-content"
      className={cn("flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-3", className)}
      {...props}
    />
  ),
);
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="sidebar-footer"
      className={cn("flex flex-col gap-2 p-3", className)}
      {...props}
    />
  ),
);
SidebarFooter.displayName = "SidebarFooter";

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />
  ),
);
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />
  ),
);
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:bg-sidebar-accent focus-visible:text-sidebar-accent-foreground [&>svg]:size-5 [&>svg]:shrink-0 [&>svg]:text-sidebar-foreground/60",
  {
    variants: {
      isActive: {
        true: "bg-sidebar-accent text-sidebar-accent-foreground font-medium [&>svg]:text-sidebar-accent-foreground",
        false: "text-sidebar-foreground/80",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
  }
>(({ asChild = false, isActive = false, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-button"
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ isActive }), className)}
      {...props}
    />
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
};
