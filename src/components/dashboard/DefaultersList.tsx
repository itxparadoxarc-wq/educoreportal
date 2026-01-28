import { AlertTriangle, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Defaulter {
  id: string;
  studentId: string;
  name: string;
  class: string;
  dueAmount: number;
  daysOverdue: number;
  guardianPhone: string;
}

const mockDefaulters: Defaulter[] = [
  {
    id: "1",
    studentId: "INST-2026-0015",
    name: "Muhammad Ali",
    class: "Class 10-A",
    dueAmount: 45000,
    daysOverdue: 95,
    guardianPhone: "+92 300 1234567",
  },
  {
    id: "2",
    studentId: "INST-2026-0028",
    name: "Fatima Hassan",
    class: "Class 9-B",
    dueAmount: 30000,
    daysOverdue: 78,
    guardianPhone: "+92 321 9876543",
  },
  {
    id: "3",
    studentId: "INST-2026-0033",
    name: "Usman Khan",
    class: "Class 8-A",
    dueAmount: 25000,
    daysOverdue: 65,
    guardianPhone: "+92 333 5556667",
  },
  {
    id: "4",
    studentId: "INST-2026-0041",
    name: "Ayesha Malik",
    class: "Class 7-C",
    dueAmount: 20000,
    daysOverdue: 62,
    guardianPhone: "+92 345 1112223",
  },
];

export function DefaultersList() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Fee Defaulters</h3>
          <p className="text-sm text-muted-foreground">
            Students with dues {">"} 60 days overdue
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Due Amount</th>
              <th>Overdue</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockDefaulters.map((defaulter) => (
              <tr key={defaulter.id}>
                <td>
                  <div>
                    <p className="font-medium">{defaulter.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {defaulter.studentId}
                    </p>
                  </div>
                </td>
                <td>{defaulter.class}</td>
                <td className="font-semibold text-destructive">
                  {formatCurrency(defaulter.dueAmount)}
                </td>
                <td>
                  <span className="status-badge status-overdue">
                    {defaulter.daysOverdue} days
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total Outstanding: <span className="font-bold text-destructive">{formatCurrency(120000)}</span>
        </p>
        <Button variant="outline" size="sm">
          Export List
        </Button>
      </div>
    </div>
  );
}