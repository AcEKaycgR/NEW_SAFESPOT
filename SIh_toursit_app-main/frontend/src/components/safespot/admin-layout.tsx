"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  LayoutDashboard,
  MapPin,
  PanelLeft,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCircle,
  Map as MapIcon
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SOSNotificationHandler } from "@/components/safespot/sos-notifications";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/sos-dashboard", icon: ShieldAlert, label: "SOS Dashboard" },
  { href: "/admin/incidents", icon: ShieldAlert, label: "Incidents" },
  { href: "/admin/map", icon: MapIcon, label: "Map View" },
  { href: "/admin/geofences", icon: MapPin, label: "Geofences" },
  { href: "/admin/audit-log", icon: History, label: "Audit Log" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const getPageTitle = () => {
    const currentPath = pathname.split("/").pop()?.replace("-", " ") || "";
    if (pathname.includes('/admin/incidents/')) {
        const id = pathname.split('/').pop();
        return `Incident ${id?.toUpperCase()}`;
    }
    const activeItem = navItems.find(item => pathname.startsWith(item.href));
    return activeItem ? activeItem.label : "Dashboard";
  }

  return (
    <SidebarProvider>
      <SOSNotificationHandler />
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-12 items-center gap-2.5 px-2">
            <div className="rounded-lg bg-primary p-2 text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-lg font-bold">SafeSpot</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 p-2">
                <UserCircle className="h-6 w-6" />
                <div className="text-left">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">
                    admin@safespot.gov
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2 ml-2">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
               <Link href="/" passHref>
                  <DropdownMenuItem>Log out</DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-semibold capitalize">
            {getPageTitle()}
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
