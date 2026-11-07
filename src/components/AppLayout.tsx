import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Minimal Apple-style header with glass effect */}
          <header className="h-16 flex items-center border-b border-border/30 bg-card/60 backdrop-blur-xl px-6 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="p-2 rounded-lg hover:bg-accent/50 transition-colors" />
              <div className="h-6 w-px bg-border/50" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground">Live Data</span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Last sync: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </header>
          
          {/* Main content with subtle animation */}
          <main className="flex-1 overflow-auto p-6 bg-background/50 animate-fade-in">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
