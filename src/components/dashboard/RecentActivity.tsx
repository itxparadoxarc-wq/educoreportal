import { Clock, CreditCard, UserPlus, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "payment" | "enrollment" | "document" | "warning";
  title: string;
  description: string;
  time: string;
}

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "payment",
    title: "Fee Payment Received",
    description: "INST-2026-0042 - Ahmed Khan paid ₨15,000",
    time: "5 mins ago",
  },
  {
    id: "2",
    type: "enrollment",
    title: "New Student Enrolled",
    description: "Sara Ahmed - Class 8-A",
    time: "12 mins ago",
  },
  {
    id: "3",
    type: "warning",
    title: "Fee Overdue Alert",
    description: "12 students have dues > 60 days",
    time: "1 hour ago",
  },
  {
    id: "4",
    type: "document",
    title: "Document Uploaded",
    description: "INST-2026-0038 - Report card added",
    time: "2 hours ago",
  },
  {
    id: "5",
    type: "payment",
    title: "Bulk Fees Generated",
    description: "January tuition for Class 10 (45 students)",
    time: "3 hours ago",
  },
];

const activityIcons = {
  payment: CreditCard,
  enrollment: UserPlus,
  document: FileText,
  warning: AlertTriangle,
};

const activityColors = {
  payment: "bg-success/20 text-success",
  enrollment: "bg-primary/20 text-primary",
  document: "bg-info/20 text-info",
  warning: "bg-warning/20 text-warning",
};

export function RecentActivity() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>
      
      <div className="space-y-4">
        {mockActivities.map((activity) => {
          const Icon = activityIcons[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  activityColors[activity.type]
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="h-3 w-3" />
                {activity.time}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}