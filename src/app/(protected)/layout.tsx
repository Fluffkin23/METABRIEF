import { SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
type Props = {
    children: React.ReactNode;
}

const SidebarLayour = ({ children }: Props) => {
    return (
        <div>
            <SidebarProvider>
                <AppSidebar />
                <main className="w-full m-2">
                    <div className="flex items-center gap-2 border-sidebar-border bg-sidebar border shadow rounded-md p-2 px-4">
                        
                        {/*<Searchbar></Searchbar> */}
                    </div>
                   <div className="h-4"></div>
                   {/*main content*/}
                   <div className="border-siderbar-border bg-siderbar border shadow rounded-md overflow-y-scroll h-[calc(100vh-6rem)] p-4">
                    {children}
                   </div>
                </main>
            </SidebarProvider>
            
        </div>
    )
}

export default SidebarLayour;