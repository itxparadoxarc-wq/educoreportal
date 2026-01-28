import { useRecentActivity, RecentActivityItem } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, UserPlus, CreditCard, Calendar, GraduationCap, Info, Clock } from "lucide-react";

const getActivityIcon = (type: RecentActivityItem["type"]) => {
  switch (type) {
    case "student_added":
      return <UserPlus className="h-4 w-4" />;
    case "fee_paid":
      return <CreditCard className="h-4 w-4" />;
    case "attendance":
      return <Calendar className="h-4 w-4" />;
    case "exam_added":
      return <GraduationCap className="h-4 w-4" />;
  }
};

const getActivityColor = (type: RecentActivityItem["type"]) => {
  switch (type) {
    case "student_added":
      return "bg-primary/20 text-primary";
    case "fee_paid":
      return "bg-success/20 text-success";
    case "attendance":
      return "bg-warning/20 text-warning";
    case "exam_added":
      return "bg-info/20 text-info";
  }
};

export function RecentActivity() {
  const { data: activities, isLoading, error } = useRecentActivity();
  const { isMasterAdmin } = useAuth();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </div>

      {!isMasterAdmin ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Info className="h-4 w-4" />
          <span className="text-sm">Activity logs are only visible to Master Admin</span>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Unable to load activity data
        </div>
      ) : activities?.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No recent activity
        </div>
      ) : (
        <div className="space-y-4">
          {activities?.slice(0, 6).map((activity) => (
            <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.description}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.user || "System"}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="h-3 w-3" />
                {formatTime(activity.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
