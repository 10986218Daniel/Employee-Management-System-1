import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, Users, Calendar, BarChart, MessageSquare, Settings, FileText, 
  Award, Clock, MapPin, Briefcase, Shield, Database, UserCheck,
  Building2, TrendingUp, Activity, Bell, FileSpreadsheet, Target
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

interface DashboardSidebarProps {
  userRole: 'admin' | 'hr' | 'employee';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardSidebar({ userRole, open, onOpenChange }: DashboardSidebarProps) {
  const location = useLocation();

  const getMenuItems = (role: string) => {
    const baseItems = [
      { title: 'Dashboard', url: `/dashboard/${role}`, icon: Home },
      { title: 'My Profile', url: `/dashboard/${role}/profile`, icon: Users },
      { title: 'Messages', url: `/dashboard/${role}/messages`, icon: MessageSquare },
      { title: 'Notifications', url: `/dashboard/${role}/notifications`, icon: Bell },
    ];

    const employeeItems = [
      ...baseItems,
      { title: 'Attendance', url: `/dashboard/${role}/attendance`, icon: Clock },
      { title: 'My Requests', url: `/dashboard/${role}/requests`, icon: FileText },
      { title: 'Announcements', url: `/dashboard/${role}/announcements`, icon: FileSpreadsheet },
      { title: 'Settings', url: `/dashboard/${role}/settings`, icon: Settings },
    ];

    const hrItems = [
      ...baseItems,
      { title: 'Employees', url: `/dashboard/${role}/employees`, icon: Users },
      { title: 'Attendance', url: `/dashboard/${role}/attendance`, icon: Clock },
      { title: 'Requests', url: `/dashboard/${role}/requests`, icon: FileText },
      { title: 'Announcements', url: `/dashboard/${role}/announcements`, icon: FileSpreadsheet },
      { title: 'Settings', url: `/dashboard/${role}/settings`, icon: Settings },
    ];

    const adminItems = [
      ...baseItems,
      { title: 'Advanced Settings', url: `/dashboard/${role}/settings`, icon: Settings },
    ];

    switch (role) {
      case 'admin': return adminItems;
      case 'hr': return hrItems;
      default: return employeeItems;
    }
  };

  const menuItems = getMenuItems(userRole);
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="w-64">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          {true && (
            <div>
              <h2 className="font-semibold text-sm">Binned Ventures</h2>
              <p className="text-xs text-muted-foreground">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Portal
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `flex items-center gap-3 ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}