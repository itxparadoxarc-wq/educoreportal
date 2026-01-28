import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Download, FileText, TrendingUp, Users, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardStats } from "@/hooks/useDashboardData";
import { useFees } from "@/hooks/useFees";
import { useStudents } from "@/hooks/useStudents";

const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899"];

export default function Reports() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: fees } = useFees({});
  const { data: students } = useStudents({});

  // Calculate student distribution by class
  const studentDistribution = students?.reduce((acc, student) => {
    const key = `Class ${student.class}`;
    const existing = acc.find((item) => item.name === key);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: key, value: 1, color: COLORS[acc.length % COLORS.length] });
    }
    return acc;
  }, [] as { name: string; value: number; color: string }[]) || [];

  // Calculate fee collection by month
  const feeCollectionData = fees?.reduce((acc, fee) => {
    const month = new Date(fee.due_date).toLocaleString("default", { month: "short" });
    const existing = acc.find((item) => item.month === month);
    if (existing) {
      if (fee.status === "paid") {
        existing.collected += Number(fee.paid_amount || 0);
      } else {
        existing.pending += Number(fee.amount) - Number(fee.paid_amount || 0);
      }
    } else {
      acc.push({
        month,
        collected: fee.status === "paid" ? Number(fee.paid_amount || 0) : 0,
        pending: fee.status !== "paid" ? Number(fee.amount) - Number(fee.paid_amount || 0) : 0,
      });
    }
    return acc;
  }, [] as { month: string; collected: number; pending: number }[]) || [];

  // Calculate collection rate
  const totalFees = fees?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
  const totalCollected = fees?.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0) || 0;
  const collectionRate = totalFees > 0 ? ((totalCollected / totalFees) * 100).toFixed(1) : "0";

  const handleExportStudents = () => {
    if (!students) return;
    const csv = [
      ["Student ID", "Name", "Class", "Section", "Guardian", "Phone", "Status"],
      ...students.map((s) => [
        s.student_id,
        `${s.first_name} ${s.last_name}`,
        s.class,
        s.section || "",
        s.guardian_name,
        s.guardian_phone,
        s.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleExportFees = () => {
    if (!fees) return;
    const csv = [
      ["Receipt #", "Student", "Description", "Amount", "Paid", "Due Date", "Status"],
      ...fees.map((f) => [
        f.receipt_number || "-",
        `${f.students?.first_name} ${f.students?.last_name}`,
        f.description,
        f.amount,
        f.paid_amount || 0,
        f.due_date,
        f.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fees-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your institution's performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExportStudents}>
            <Download className="h-4 w-4" />
            Export Students
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExportFees}>
            <Download className="h-4 w-4" />
            Export Fees
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Students</span>
          </div>
          <p className="text-3xl font-bold">{stats?.totalStudents || 0}</p>
          <p className="text-sm text-success mt-1">+{stats?.newEnrollmentsThisYear || 0} this year</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Collection Rate</span>
          </div>
          <p className="text-3xl font-bold">{collectionRate}%</p>
          <p className="text-sm text-muted-foreground mt-1">
            PKR {totalCollected.toLocaleString()} collected
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Active Students</span>
          </div>
          <p className="text-3xl font-bold">{stats?.activeStudents || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Currently enrolled</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Pending Dues</span>
          </div>
          <p className="text-3xl font-bold">
            PKR {((stats?.totalFeesPending || 0) / 1000).toFixed(0)}K
          </p>
          <p className="text-sm text-destructive mt-1">
            {stats?.pendingStudentCount || 0} students
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fee Collection Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Fee Collection by Month</h3>
          {feeCollectionData.length > 0 ? (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feeCollectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) =>
                        value >= 1000000
                          ? `${(value / 1000000).toFixed(1)}M`
                          : `${(value / 1000).toFixed(0)}K`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => `PKR ${value.toLocaleString()}`}
                    />
                    <Bar dataKey="collected" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Collected" />
                    <Bar dataKey="pending" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-success" />
                  <span className="text-sm text-muted-foreground">Collected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-warning" />
                  <span className="text-sm text-muted-foreground">Pending</span>
                </div>
              </div>
            </>
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              No fee data available
            </div>
          )}
        </div>

        {/* Student Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Student Distribution by Class</h3>
          {studentDistribution.length > 0 ? (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studentDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {studentDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center flex-wrap gap-4 mt-4">
                {studentDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              No student data available
            </div>
          )}
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Generate Custom Reports</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={handleExportStudents}>
            <FileText className="h-6 w-6" />
            <span>Student Data (CSV)</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={handleExportFees}>
            <CreditCard className="h-6 w-6" />
            <span>Fee Collection Report</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" disabled>
            <TrendingUp className="h-6 w-6" />
            <span>Academic Analysis</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" disabled>
            <Users className="h-6 w-6" />
            <span>Attendance Summary</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
