"use client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "~/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, Plus, Video } from "lucide-react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import Image from "next/image";

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Q&A",
        url: "/qa",
        icon: Bot,
    },
    {
        title: "Meetings",
        url: "/meetings",
        icon: Video,
    },

];

const projects = [
    {
        name: "Project 1",

    },
    {
        name: "Project 2",
    },
    {
        name: "Project 3",
    },

];

export function AppSidebar() {
    // Get the current pathname from the router to determine which sidebar item is active
    const pathname = usePathname();
    // Access the sidebar state to check if it is currently open or closed
    const { open } = useSidebar();
    
    // Render the sidebar component
    return (
        <Sidebar>
            {/* Sidebar header containing the logo and title */}
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="logo" width={40} height={40} />
                    {/* Display the title only if the sidebar is open */}
                    {open && (
                        <h1 className="text-xl font-bold text-primary/80">Metabrief</h1>
                    )}
                </div>
            </SidebarHeader>
            {/* Sidebar content containing groups of menu items */}
            <SidebarContent>
                {/* Group for application-related links */}
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map(item => {
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.url} className={cn({ "!bg-primary !text-white": pathname === item.url }, "list")}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {/* Group for user projects */}
                <SidebarGroup>
                    <SidebarGroupLabel>Your projects</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {/* Map through the projects array to create project items */}
                            {projects.map(project => {
                                return (
                                    <SidebarMenuItem key={project.name}>
                                        <SidebarMenuButton asChild>
                                            <div>
                                                {/* Display the first letter of the project name in a styled box */}
                                                <div className={cn("rounded-sm border size-6 flex items-center justify-center text-sm bg-white text-primary",
                                                    {
                                                        "bg-primary text-white": true
                                                        // "bg-primary text-white": project.id === project.id
                                                    }
                                                )}>
                                                    {project.name[0]}
                                                </div>
                                                <span>{project.name}</span>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                            <div className="h-2"></div>
                            {/* Show the create project button only if the sidebar is open */}
                            {open && (
                                <SidebarMenuItem>
                                    <Link href="/create">
                                        <Button size="sm" variant="outline" className="w-fit">
                                            <Plus />Create Project
                                        </Button>
                                    </Link>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )

}