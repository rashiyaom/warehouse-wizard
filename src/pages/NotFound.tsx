import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="text-center animate-fade-in">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 mb-6">
            <AlertTriangle className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Page Not Found</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <Link to="/">
          <Button className="btn-primary gap-2 px-8 py-3 text-base">
            <Home className="w-5 h-5" />
            Return to Dashboard
          </Button>
        </Link>
        
        <p className="text-sm text-muted-foreground mt-6">
          Error path: <code className="px-2 py-1 bg-muted rounded text-xs">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
