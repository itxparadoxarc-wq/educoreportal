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
  Loader2,
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
import { useFees, Fee } from "@/hooks/useFees";
import { AddFeeDialog } from "@/components/fees/AddFeeDialog";
import { BulkFeeDialog } from "@/components/fees/BulkFeeDialog";
import { PaymentDialog } from "@/components/fees/PaymentDialog";

const feeStatusColors: Record<string, string> = {
  paid: "status-badge status-paid",
  pending: "status-badge status-pending",
  overdue: "status-badge status-overdue",
};

export default function Fees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feeTypeFilter, setFeeTypeFilter] = useState("all");
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false);
  const [isBulkFeeOpen, setIsBulkFeeOpen] = useState(false);
  const [paymentFee, setPaymentFee] = useState<Fee | null>(null);

  const { data: fees, isLoading, error } = useFees({
    status: statusFilter,
    feeType: feeTypeFilter,
    search: searchQuery,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate stats
  const totalCollected = fees
    ?.filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + Number(f.paid_amount || 0), 0) || 0;

  const totalPending = fees
    ?.filter((f) => f.status !== "paid")
    .reduce((sum, f) => sum + (Number(f.amount) - Number(f.paid_amount || 0)), 0) || 0;

  const totalOverdue = fees
    ?.filter((f) => f.status === "overdue")
    .reduce((sum, f) => sum + (Number(f.amount) - Number(f.paid_amount || 0)), 0) || 0;

  const totalReceipts = fees?.filter((f) => f.receipt_number).length || 0;

  const handleExport = () => {
    if (!fees) return;
    const csv = [
      ["Receipt #", "Student", "Class", "Description", "Amount", "Paid", "Due Date", "Status"],
      ...fees.map((f) => [
        f.receipt_number || "-",
        `${f.students?.first_name} ${f.students?.last_name}`,
        f.students?.class,
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
    a.download = `fees-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

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
          <Button variant="outline" className="gap-2" onClick={() => setIsBulkFeeOpen(true)}>
            <FileText className="h-4 w-4" />
            Bulk Generate
          </Button>
          <Button className="gap-2" onClick={() => setIsAddFeeOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Fee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Collected (Total)"
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
          value={formatCurrency(totalOverdue)}
          icon={DollarSign}
          variant="destructive"
        />
        <StatCard
          title="Receipts Generated"
          value={totalReceipts.toString()}
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

            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading fee records...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
          <p className="text-destructive">Error loading fees: {error.message}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && fees?.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Fee Records</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== "all"
              ? "No fee records match your search criteria."
              : "Create your first fee invoice to get started."}
          </p>
          <Button onClick={() => setIsAddFeeOpen(true)}>Add Fee Invoice</Button>
        </div>
      )}

      {/* Fee Records Table */}
      {!isLoading && !error && fees && fees.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id}>
                    <td>
                      <span className="font-mono text-sm">
                        {fee.receipt_number ? (
                          <span className="text-primary">{fee.receipt_number}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">
                          {fee.students?.first_name} {fee.students?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {fee.students?.student_id}
                        </p>
                      </div>
                    </td>
                    <td>
                      {fee.students?.class}
                      {fee.students?.section && `-${fee.students.section}`}
                    </td>
                    <td>{fee.description}</td>
                    <td>
                      <div>
                        <p className="font-semibold">{formatCurrency(Number(fee.amount))}</p>
                        {Number(fee.paid_amount) > 0 && Number(fee.paid_amount) < Number(fee.amount) && (
                          <p className="text-xs text-muted-foreground">
                            Paid: {formatCurrency(Number(fee.paid_amount))}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="text-sm">{fee.due_date}</td>
                    <td>
                      <span className={feeStatusColors[fee.status] || feeStatusColors.pending}>
                        {fee.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {fee.status !== "paid" ? (
                          <Button
                            size="sm"
                            className="gap-1 h-8"
                            onClick={() => setPaymentFee(fee)}
                          >
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
              Showing {fees.length} records
            </p>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddFeeDialog open={isAddFeeOpen} onOpenChange={setIsAddFeeOpen} />
      <BulkFeeDialog open={isBulkFeeOpen} onOpenChange={setIsBulkFeeOpen} />
      <PaymentDialog
        open={!!paymentFee}
        onOpenChange={() => setPaymentFee(null)}
        fee={paymentFee}
      />
    </div>
  );
}
