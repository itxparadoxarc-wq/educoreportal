import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'master_admin' | 'staff';
  requireMasterAdmin?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireRole,
  requireMasterAdmin = false 
}: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Authenticated but no role assigned (pending approval)
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center p-8 bg-card border border-border rounded-xl">
          <h2 className="text-xl font-bold mb-2">Access Pending</h2>
          <p className="text-muted-foreground mb-4">
            Your account has been created but is awaiting role assignment by the Master Admin.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator to be granted access.
          </p>
        </div>
      </div>
    );
  }

  // Check if master admin is required
  if (requireMasterAdmin && role !== 'master_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center p-8 bg-card border border-border rounded-xl">
          <h2 className="text-xl font-bold mb-2 text-destructive">Access Denied</h2>
          <p className="text-muted-foreground">
            This section requires Master Admin privileges.
          </p>
        </div>
      </div>
    );
  }

  // Check for specific role requirement
  if (requireRole && role !== requireRole && role !== 'master_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center p-8 bg-card border border-border rounded-xl">
          <h2 className="text-xl font-bold mb-2 text-destructive">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this section.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
