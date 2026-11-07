import { LayoutDashboard, Package2, Package, BarChart3, Tag, FileText, Activity, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Overview", url: "/", icon: LayoutDashboard, color: "text-blue-500" },
  { title: "Warehouses", url: "/warehouses", icon: Package2, color: "text-green-500" },
  { title: "Products", url: "/products", icon: Package, color: "text-purple-500" },
  { title: "Movements", url: "/movements", icon: Activity, color: "text-orange-500" },
  { title: "Operations", url: "/operations", icon: Settings, color: "text-cyan-500" },
  { title: "Categories", url: "/categories", icon: Tag, color: "text-pink-500" },
  { title: "Analytics", url: "/reports", icon: BarChart3, color: "text-indigo-500" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30 bg-card/40 backdrop-blur-xl">
      <SidebarHeader className="p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Warehouse
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Analytics Hub</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.url || 
                  (item.url !== "/" && location.pathname.startsWith(item.url));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`
                          flex items-center gap-3 px-3 py-3 rounded-2xl font-medium transition-all duration-200
                          ${isActive 
                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-accent/50'
                          }
                        `}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? item.color : ''}`} />
                        {!collapsed && (
                          <span className="animate-fade-in">{item.title}</span>
                        )}
                        {isActive && !collapsed && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/30 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs font-semibold text-foreground">System Status</span>
            </div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
            <div className="mt-2 w-full bg-muted-foreground/20 rounded-full h-1">
              <div className="bg-success h-1 rounded-full w-full animate-pulse" />
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
