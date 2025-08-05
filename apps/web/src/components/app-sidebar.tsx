"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
  ChefHat,
  CreditCard,
  Coffee,
  ShoppingCart,
  BarChart3,
  UserCheck,
  LogOut,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

// This is sample data.
const data = {
  user: {
    name: "Super Admin",
    email: "admin@cafe.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Cafe Management",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Kitchen Operations",
      logo: ChefHat,
      plan: "Pro",
    },
    {
      name: "Customer Service",
      logo: Users,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard Overview",
      url: "#",
      icon: BarChart3,
      isActive: true,
      items: [
        {
          title: "Analytics",
          url: "#",
        },
        {
          title: "Reports",
          url: "#",
        },
        {
          title: "Statistics",
          url: "#",
        },
      ],
    },
    {
      title: "User Management",
      url: "#",
      icon: Users,
      items: [
        {
          title: "All Users",
          url: "#",
        },
        {
          title: "Roles & Permissions",
          url: "#",
        },
        {
          title: "Activity Logs",
          url: "#",
        },
      ],
    },
    {
      title: "Customer Management",
      url: "#",
      icon: UserCheck,
      items: [
        {
          title: "All Customers",
          url: "#",
        },
        {
          title: "Customer Analytics",
          url: "#",
        },
        {
          title: "Loyalty Programs",
          url: "#",
        },
      ],
    },
    {
      title: "Menu Management",
      url: "#",
      icon: Coffee,
      items: [
        {
          title: "Menu Items",
          url: "#",
        },
        {
          title: "Categories",
          url: "#",
        },
        {
          title: "Pricing",
          url: "#",
        },
      ],
    },
    {
      title: "Order Management",
      url: "#",
      icon: ShoppingCart,
      items: [
        {
          title: "All Orders",
          url: "#",
        },
        {
          title: "Order Analytics",
          url: "#",
        },
        {
          title: "Kitchen Queue",
          url: "#",
        },
      ],
    },
    {
      title: "Payment Management",
      url: "#",
      icon: CreditCard,
      items: [
        {
          title: "Transactions",
          url: "#",
        },
        {
          title: "Payment Methods",
          url: "#",
        },
        {
          title: "Financial Reports",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Reception Staff",
      url: "#",
      icon: Frame,
    },
    {
      name: "Kitchen Staff",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Cashier Staff",
      url: "#",
      icon: Map,
    },
    {
      name: "System Settings",
      url: "#",
      icon: Settings2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: user?.name || "Super Admin",
          email: user?.email || "admin@cafe.com",
          avatar: "/avatars/shadcn.jpg",
        }} onLogout={handleLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}