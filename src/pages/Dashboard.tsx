import { Users, CreditCard, TrendingUp, AlertTriangle, UserCheck, UserX } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DefaultersList } from "@/components/dashboard/DefaultersList";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, Master Admin. Here's your institution overview.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString("en-PK", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value="1,247"
          change="+12 this month"
          changeType="positive"
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Active Students"
          value="1,198"
          change="96% of total"
          changeType="neutral"
          icon={UserCheck}
          variant="success"
        />
        <StatCard
          title="Fee Collection (This Month)"
          value="₨2.4M"
          change="+18% vs last month"
          changeType="positive"
          icon={CreditCard}
          variant="success"
        />
        <StatCard
          title="Pending Dues"
          value="₨485K"
          change="52 students"
          changeType="negative"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="New Enrollments"
          value="28"
          change="This academic year"
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatCard
          title="Alumni/Left"
          value="49"
          change="4% attrition rate"
          changeType="neutral"
          icon={UserX}
        />
        <StatCard
          title="Staff Active"
          value="4"
          change="0 pending invites"
          changeType="neutral"
          icon={Users}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <DefaultersList />
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionButton
            label="Add New Student"
            description="Enroll a student"
            href="/students/new"
          />
          <QuickActionButton
            label="Record Payment"
            description="Accept fee payment"
            href="/fees/payment"
          />
          <QuickActionButton
            label="Mark Attendance"
            description="Today's attendance"
            href="/attendance"
          />
          <QuickActionButton
            label="Generate Bulk Fees"
            description="Monthly fee generation"
            href="/fees/bulk"
          />
        </div>
      </div>
    </div>
  );
}

function QuickActionButton({
  label,
  description,
  href,
}: {
  label: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50 transition-all duration-200 group"
    >
      <p className="font-medium group-hover:text-primary transition-colors">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </a>
  );
}