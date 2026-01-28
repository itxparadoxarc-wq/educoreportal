import { useState } from "react";
import {
  Search,
  Plus,
  Download,
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  Printer,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FeeRecord {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  class: string;
  feeType: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: "paid" | "pending" | "overdue";
}

const mockFeeRecords: FeeRecord[] = [
  {
    id: "1",
    receiptNo: "RCP-2026-0125",
    studentId: "INST-2026-0001",
    studentName: "Ahmed Hassan",
    class: "10-A",
    feeType: "Tuition Fee",
    amount: 15000,
    dueDate: "2026-01-10",
    paidDate: "2026-01-08",
    status: "paid",
  },
  {
    id: "2",
    receiptNo: "-",
    studentId: "INST-2026-0002",
    studentName: "Sara Ahmed",
    class: "9-B",
    feeType: "Tuition Fee",
    amount: 15000,
    dueDate: "2026-01-10",
    paidDate: null,
    status: "pending",
  },
  {
    id: "3",
    receiptNo: "-",
    studentId: "INST-2026-0003",
    studentName: "Ali Raza",
    class: "8-A",
    feeType: "Tuition Fee",
    amount: 15000,
    dueDate: "2025-11-10",
    paidDate: null,
    status: "overdue",
  },
  {
    id: "4",
    receiptNo: "RCP-2026-0124",
    studentId: "INST-2026-0004",
    studentName: "Fatima Khan",
    class: "10-B",
    feeType: "Lab Fee",
    amount: 5000,
    dueDate: "2026-01-15",
    paidDate: "2026-01-12",
    status: "paid",
  },
  {
    id: "5",
    receiptNo: "-",
    studentId: "INST-2026-0005",
    studentName: "Usman Ali",
    class: "7-C",
    feeType: "Transport Fee",
    amount: 8000,
    dueDate: "2026-01-05",
    paidDate: null,
    status: "overdue",
  },
];

const feeStatusColors = {
  paid: "status-badge status-paid",
  pending: "status-badge status-pending",
  overdue: "status-badge status-overdue",
};

export default function Fees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feeTypeFilter, setFeeTypeFilter] = useState("all");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredRecords = mockFeeRecords.filter((record) => {
    const matchesSearch =
      record.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.receiptNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;

    const matchesFeeType =
      feeTypeFilter === "all" || record.feeType === feeTypeFilter;

    return matchesSearch && matchesStatus && matchesFeeType;
  });

  const totalCollected = mockFeeRecords
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPending = mockFeeRecords
    .filter((r) => r.status !== "paid")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fees & Finance</h1>
          <p className="text-muted-foreground">
            Manage fee collection, invoicing, and payment records
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                Bulk Generate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Bulk Fees</DialogTitle>
                <DialogDescription>
                  Create fee invoices for all students in a class
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Class</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Class 7</SelectItem>
                      <SelectItem value="8">Class 8</SelectItem>
                      <SelectItem value="9">Class 9</SelectItem>
                      <SelectItem value="10">Class 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fee Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose fee type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tuition">Tuition Fee</SelectItem>
                      <SelectItem value="transport">Transport Fee</SelectItem>
                      <SelectItem value="lab">Lab Fee</SelectItem>
                      <SelectItem value="exam">Exam Fee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jan-2026">January 2026</SelectItem>
                      <SelectItem value="feb-2026">February 2026</SelectItem>
                      <SelectItem value="mar-2026">March 2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full mt-4">Generate Invoices</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Fee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Collected (This Month)"
          value={formatCurrency(totalCollected)}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Pending Dues"
          value={formatCurrency(totalPending)}
          icon={CreditCard}
          variant="warning"
        />
        <StatCard
          title="Overdue Amount"
          value={formatCurrency(23000)}
          icon={DollarSign}
          variant="destructive"
        />
        <StatCard
          title="Receipts Generated"
          value="125"
          icon={FileText}
          variant="primary"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Student ID, Name, or Receipt No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            <Select value={feeTypeFilter} onValueChange={setFeeTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Fee Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Tuition Fee">Tuition Fee</SelectItem>
                <SelectItem value="Transport Fee">Transport Fee</SelectItem>
                <SelectItem value="Lab Fee">Lab Fee</SelectItem>
                <SelectItem value="Exam Fee">Exam Fee</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Fee Records Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Student</th>
                <th>Class</th>
                <th>Fee Type</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>
                    <span className="font-mono text-sm">
                      {record.receiptNo === "-" ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <span className="text-primary">{record.receiptNo}</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p className="font-medium">{record.studentName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {record.studentId}
                      </p>
                    </div>
                  </td>
                  <td>{record.class}</td>
                  <td>{record.feeType}</td>
                  <td className="font-semibold">{formatCurrency(record.amount)}</td>
                  <td className="text-sm">{record.dueDate}</td>
                  <td>
                    <span className={feeStatusColors[record.status]}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {record.status !== "paid" ? (
                        <Button size="sm" className="gap-1 h-8">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Accept
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-1 h-8">
                          <Printer className="h-3.5 w-3.5" />
                          Print
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredRecords.length} records
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}