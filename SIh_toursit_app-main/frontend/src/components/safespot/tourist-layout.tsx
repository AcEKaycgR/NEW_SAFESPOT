"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  User,
  Bell,
  ShieldCheck,
  Settings,
  Users,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/map", icon: Map, label: "Map" },
  { href: "/dashboard/assistant", icon: Sparkles, label: "Assistant" },
  { href: "/dashboard/itinerary", icon: CalendarDays, label: "Itinerary" },
  { href: "/dashboard/groups", icon: Users, label: "Groups" },
  { href: "/dashboard/profile", icon: User, label: "ID" },
  { href: "/dashboard/notifications", icon: Bell, label: "Alerts" },
];

export default function TouristLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-2 text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold font-headline">SafeSpot</span>
        </Link>
        
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/notifications"><Bell className="h-5 w-5" /></Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard/settings"><Settings className="h-5 w-5" /></Link>
            </Button>
            <Link href="/" passHref>
                <Button variant="outline">Log Out</Button>
            </Link>
        </div>
      </header>
      <main className="flex-1 bg-background p-4 md:p-6 pb-20">{children}</main>
      <nav className="fixed bottom-0 z-10 block w-full border-t bg-card">
        <div className="mx-auto grid h-16 max-w-lg grid-cols-7 items-center px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                href={item.href}
                key={item.label}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.href === "/dashboard/notifications" && (
                    <Badge className="absolute -top-1 -right-2 h-4 w-4 justify-center rounded-full p-0">
                      3
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
