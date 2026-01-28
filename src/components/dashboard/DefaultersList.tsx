import { useDefaulters } from "@/hooks/useDashboardData";
import { Loader2, AlertTriangle, Users, Phone, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function DefaultersList() {
  const { data: defaulters, isLoading, error } = useDefaulters();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalOutstanding = defaulters?.reduce((sum, d) => sum + d.pendingAmount, 0) || 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Fee Defaulters</h3>
          <p className="text-sm text-muted-foreground">
            Students with overdue payments
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Unable to load defaulters data
        </div>
      ) : defaulters?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="h-12 w-12 text-success/50 mb-2" />
          <p className="text-sm text-muted-foreground">No overdue payments</p>
          <p className="text-xs text-success">All fees are up to date!</p>
        </div>
      ) : (
        <>
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
                {defaulters?.slice(0, 5).map((defaulter) => (
                  <tr key={defaulter.id}>
                    <td>
                      <div>
                        <p className="font-medium">{defaulter.studentName}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {defaulter.studentId}
                        </p>
                      </div>
                    </td>
                    <td>{defaulter.class}</td>
                    <td className="font-semibold text-destructive">
                      {formatCurrency(defaulter.pendingAmount)}
                    </td>
                    <td>
                      <Badge
                        variant={defaulter.daysOverdue > 60 ? "destructive" : "outline"}
                        className={defaulter.daysOverdue > 60 ? "" : "border-warning text-warning"}
                      >
                        {defaulter.daysOverdue} days
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link to={`/fees?student=${defaulter.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
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
              Total Outstanding: <span className="font-bold text-destructive">{formatCurrency(totalOutstanding)}</span>
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/fees">View All</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
