// src/components/admin/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext'; 
import { useAdminContext } from '@/context/AdminContext'; // Import useAdminContext
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import type { UserRegion } from '@/data/users';
import { LayoutDashboard, ListChecks, Users, Gamepad2, Settings, Shield, LogOut, Globe, WalletCards } from 'lucide-react'; // Added Globe

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth(); 
  const { adminSelectedRegion, setAdminSelectedRegion } = useAdminContext();

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/admin/tournaments', label: 'Tournaments', Icon: ListChecks },
    { href: '/admin/users', label: 'Users', Icon: Users },
    { href: '/admin/games', label: 'Games', Icon: Gamepad2 }, 
    { href: '/admin/payments', label: 'Payments', Icon: WalletCards },
    // { href: '/admin/settings', label: 'Settings', Icon: Settings }, 
  ];

  const handleLogout = async () => {
    await logout();
  };

  const handleRegionChange = (value: string) => {
    setAdminSelectedRegion(value as UserRegion);
  };

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border/60 shadow-2xl">
      <div className="h-full px-3 py-6 overflow-y-auto flex flex-col">
        <Link href="/admin/dashboard" className="flex items-center ps-2.5 mb-6">
          <Shield className="h-8 w-8 text-primary mr-3" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap text-sidebar-foreground">Arena Admin</span>
        </Link>

        <div className="px-2.5 mb-6 space-y-1">
          <Label htmlFor="admin-region-select" className="text-xs text-muted-foreground flex items-center">
            <Globe className="mr-1.5 h-3.5 w-3.5"/> Viewing Region
          </Label>
          <Select value={adminSelectedRegion} onValueChange={handleRegionChange}>
            <SelectTrigger id="admin-region-select" className="h-9 text-sm bg-card/50 border-sidebar-border focus:ring-sidebar-ring">
              <SelectValue placeholder="Select Region" />
            </SelectTrigger>
            <SelectContent className="bg-popover/95 backdrop-blur-md border-sidebar-border">
              <SelectItem value="USA">USA ($)</SelectItem>
              <SelectItem value="INDIA">INDIA (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <ul className="space-y-2 font-medium flex-grow">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center p-3 rounded-lg text-foreground group transition-all duration-300 ease-in-out',
                  pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard' && !navItems.find(nav => nav.href !== item.href && pathname.startsWith(nav.href) && nav.href.length > item.href.length ) || (pathname === '/admin' && item.href === '/admin/dashboard') )
                    ? 'bg-primary/20 text-primary font-semibold shadow-inner shadow-[0_0_15px_hsl(var(--primary)/0.4)] backdrop-blur-sm' 
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/15 hover:backdrop-blur-sm hover:shadow-[0_0_10px_hsl(var(--primary)/0.3)]'
                )}
              >
                <item.Icon className={cn("w-6 h-6 transition-colors duration-300", (pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard' && !navItems.find(nav => nav.href !== item.href && pathname.startsWith(nav.href) && nav.href.length > item.href.length ) ) ) ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                <span className="ms-3">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto space-y-2">
           <Button variant="outline" className="w-full transform hover:scale-105 transition-transform duration-300 ease-in-out" onClick={() => window.location.href = '/'}>
            <Gamepad2 className="mr-2 h-4 w-4" /> Go to Main Site
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-destructive hover:bg-destructive/15 hover:backdrop-blur-sm hover:text-destructive-foreground hover:shadow-[0_0_10px_hsl(var(--destructive)/0.3)] transform hover:scale-105 transition-transform duration-300 ease-in-out" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
