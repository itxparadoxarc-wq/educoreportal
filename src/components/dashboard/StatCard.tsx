import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "bg-card border-border",
  primary: "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30",
  success: "bg-gradient-to-br from-success/20 to-success/5 border-success/30",
  warning: "bg-gradient-to-br from-warning/20 to-warning/5 border-warning/30",
  destructive: "bg-gradient-to-br from-destructive/20 to-destructive/5 border-destructive/30",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/20 text-primary",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  destructive: "bg-destructive/20 text-destructive",
};

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {change && (
            <p
              className={cn("text-sm font-medium", {
                "text-success": changeType === "positive",
                "text-destructive": changeType === "negative",
                "text-muted-foreground": changeType === "neutral",
              })}
            >
              {change}
            </p>
          )}
        </div>
        <div
          className={cn(
            "h-12 w-12 rounded-lg flex items-center justify-center",
            iconVariantStyles[variant]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}