"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, Plus, Video } from "lucide-react";
import Link from "next/link";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import Image from "next/image";
import useProject from "~/hooks/use-project";

// Define an array of items for the sidebar menu, each containing a title, URL, and icon
const items = [
  {
    title: "Dashboard", // Title of the menu item
    url: "/dashboard",   // URL to navigate to when the item is clicked
    icon: LayoutDashboard, // Icon associated with the menu item
  },
  {
    title: "Q&A",        // Title of the menu item
    url: "/qa",          // URL to navigate to when the item is clicked
    icon: Bot,          // Icon associated with the menu item
  },
  {
    title: "Meetings",   // Title of the menu item
    url: "/meetings",    // URL to navigate to when the item is clicked
    icon: Video,         // Icon associated with the menu item
  },
];

// Main component for rendering the application sidebar
export function AppSidebar() {
  // Get the current pathname from the router to determine which sidebar item is active
  const pathname = usePathname();
  // Access the sidebar state to check if it is currently open or closed
  const { open } = useSidebar();
  // Get the list of projects, the currently selected project ID, and the function to set the project ID
  const { projects, projectId, setProjectId } = useProject();

  // Render the sidebar component
  return (
    <Sidebar>
      {/* Sidebar header containing the logo and title */}
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="logo" width={40} height={40} />
          {/* Display the title only if the sidebar is open */}
          {open && (
            <h1 className="text-primary/80 text-xl font-bold">Metabrief</h1>
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
              {/* Map through the items array to create menu items */}
              {items.map((item) => {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={cn(
                          { "!bg-primary !text-white": pathname === item.url }, // Highlight active item
                          "list",
                        )}
                      >
                        <item.icon /> {/* Render the icon for the menu item */}
                        <span>{item.title}</span> {/* Render the title for the menu item */}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
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
              {projects?.map((project) => {
                return (
                  <SidebarMenuItem key={project.name}>
                    <SidebarMenuButton asChild>
                      <div onClick={() => setProjectId(project.id)}>
                        {/* Display the first letter of the project name in a styled box */}
                        <div
                          className={cn(
                            "text-primary flex size-6 items-center justify-center rounded-sm border bg-white text-sm",
                            {
                              "bg-primary text-white": project.id === projectId, // Highlight selected project
                            },
                          )}
                        >
                          {project.name[0]} {/* Display the first letter of the project name */}
                        </div>
                        <span>{project.name}</span> {/* Render the project name */}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              <div className="h-2"></div>
              {/* Show the create project button only if the sidebar is open */}
              {open && (
                <SidebarMenuItem>
                  <Link href="/create">
                    <Button size="sm" variant="outline" className="w-fit">
                      <Plus /> {/* Icon for the create project button */}
                      Create Project {/* Text for the create project button */}
                    </Button>
                  </Link>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
