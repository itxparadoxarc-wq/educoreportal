import { Users, CreditCard, TrendingUp, AlertTriangle, UserCheck, UserX, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DefaultersList } from "@/components/dashboard/DefaultersList";
import { useDashboardStats } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();
  const { isMasterAdmin, role } = useAuth();

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₨${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₨${(amount / 1000).toFixed(0)}K`;
    }
    return `₨${amount.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {isMasterAdmin ? "Master Admin" : "Staff"}. Here's your institution overview.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString("en-PK", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center text-destructive">
          Failed to load dashboard data. Please try again.
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Students"
              value={stats?.totalStudents.toLocaleString() || "0"}
              change={`${stats?.newEnrollmentsThisYear || 0} new this year`}
              changeType="neutral"
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="Active Students"
              value={stats?.activeStudents.toLocaleString() || "0"}
              change={stats?.totalStudents ? `${Math.round((stats.activeStudents / stats.totalStudents) * 100)}% of total` : "0%"}
              changeType="neutral"
              icon={UserCheck}
              variant="success"
            />
            <StatCard
              title="Fee Collection"
              value={formatCurrency(stats?.totalFeesCollected || 0)}
              change="Total collected"
              changeType="positive"
              icon={CreditCard}
              variant="success"
            />
            <StatCard
              title="Pending Dues"
              value={formatCurrency(stats?.totalFeesPending || 0)}
              change={`${stats?.pendingStudentCount || 0} students`}
              changeType={stats?.totalFeesPending ? "negative" : "neutral"}
              icon={AlertTriangle}
              variant={stats?.totalFeesPending ? "warning" : "default"}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="New Enrollments"
              value={stats?.newEnrollmentsThisYear.toString() || "0"}
              change="This academic year"
              changeType="neutral"
              icon={TrendingUp}
            />
            <StatCard
              title="Alumni/Left"
              value={((stats?.alumniStudents || 0) + (stats?.leftStudents || 0)).toString()}
              change={stats?.totalStudents ? `${Math.round((((stats.alumniStudents || 0) + (stats.leftStudents || 0)) / stats.totalStudents) * 100)}% attrition` : "0%"}
              changeType="neutral"
              icon={UserX}
            />
            <StatCard
              title="Role"
              value={isMasterAdmin ? "Master Admin" : "Staff"}
              change="Current session"
              changeType="neutral"
              icon={Users}
            />
          </div>
        </>
      )}

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
            href="/students"
          />
          <QuickActionButton
            label="Record Payment"
            description="Accept fee payment"
            href="/fees"
          />
          <QuickActionButton
            label="Mark Attendance"
            description="Today's attendance"
            href="/attendance"
          />
          {isMasterAdmin && (
            <QuickActionButton
              label="Manage Staff"
              description="User roles & access"
              href="/staff"
            />
          )}
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
    <Link
      to={href}
      className="block p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50 transition-all duration-200 group"
    >
      <p className="font-medium group-hover:text-primary transition-colors">{label}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
