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
import { Download, FileText, TrendingUp, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const feeCollectionData = [
  { month: "Sep", collected: 2100000, pending: 450000 },
  { month: "Oct", collected: 2300000, pending: 380000 },
  { month: "Nov", collected: 2150000, pending: 520000 },
  { month: "Dec", collected: 1900000, pending: 680000 },
  { month: "Jan", collected: 2400000, pending: 485000 },
];

const studentDistribution = [
  { name: "Class 7", value: 280, color: "#0ea5e9" },
  { name: "Class 8", value: 310, color: "#22c55e" },
  { name: "Class 9", value: 345, color: "#f59e0b" },
  { name: "Class 10", value: 312, color: "#8b5cf6" },
];

const attendanceData = [
  { week: "W1", attendance: 94 },
  { week: "W2", attendance: 92 },
  { week: "W3", attendance: 96 },
  { week: "W4", attendance: 89 },
];

const gradeDistribution = [
  { grade: "A+", count: 45 },
  { grade: "A", count: 125 },
  { grade: "B+", count: 210 },
  { grade: "B", count: 280 },
  { grade: "C", count: 185 },
  { grade: "D", count: 95 },
  { grade: "F", count: 25 },
];

export default function Reports() {
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
          <Select defaultValue="jan-2026">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jan-2026">January 2026</SelectItem>
              <SelectItem value="dec-2025">December 2025</SelectItem>
              <SelectItem value="nov-2025">November 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
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
          <p className="text-3xl font-bold">1,247</p>
          <p className="text-sm text-success mt-1">+12 this month</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Collection Rate</span>
          </div>
          <p className="text-3xl font-bold">83.2%</p>
          <p className="text-sm text-success mt-1">+5.4% vs last month</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Avg. Attendance</span>
          </div>
          <p className="text-3xl font-bold">92.8%</p>
          <p className="text-sm text-muted-foreground mt-1">This month</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-info/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-info" />
            </div>
            <span className="text-sm text-muted-foreground">Avg. Grade</span>
          </div>
          <p className="text-3xl font-bold">B+</p>
          <p className="text-sm text-success mt-1">78.5% average</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fee Collection Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Fee Collection Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeCollectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) =>
                    `₨${(value / 1000).toFixed(0)}K`
                  }
                />
                <Bar dataKey="collected" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
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
        </div>

        {/* Student Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Student Distribution by Class</h3>
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
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance Trend */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Attendance Rate</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  domain={[80, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `${value}%`}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Grade Distribution (Mid-Terms)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  type="category"
                  dataKey="grade"
                  stroke="hsl(var(--muted-foreground))"
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Generate Custom Reports</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
            <FileText className="h-6 w-6" />
            <span>Student Data (CSV)</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
            <CreditCard className="h-6 w-6" />
            <span>Fee Collection Report</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
            <TrendingUp className="h-6 w-6" />
            <span>Academic Analysis</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
            <Users className="h-6 w-6" />
            <span>Attendance Summary</span>
          </Button>
        </div>
      </div>
    </div>
  );
}