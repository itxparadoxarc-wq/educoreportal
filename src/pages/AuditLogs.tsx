import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Search, Filter, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: unknown;
  new_data: unknown;
}

export default function AuditLogs() {
  const { isMasterAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.record_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTable = filterTable === "all" || log.table_name === filterTable;
    const matchesAction = filterAction === "all" || log.action === filterAction;

    return matchesSearch && matchesTable && matchesAction;
  });

  const uniqueTables = [...new Set(logs.map((l) => l.table_name))];

  const getActionColor = (action: string) => {
    switch (action) {
      case "INSERT":
        return "bg-success/20 text-success";
      case "UPDATE":
        return "bg-warning/20 text-warning";
      case "DELETE":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "User", "Action", "Table", "Record ID"].join(","),
      ...filteredLogs.map((log) =>
        [
          new Date(log.timestamp).toISOString(),
          log.user_email || "System",
          log.action,
          log.table_name,
          log.record_id || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isMasterAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all data changes across the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Master Admin Only</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, table, or record ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {uniqueTables.map((table) => (
              <SelectItem key={table} value={table}>
                {table}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/30">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Timestamp
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Action
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Table
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Record
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="border-t border-border hover:bg-secondary/20 cursor-pointer"
                      onClick={() =>
                        setExpandedLog(expandedLog === log.id ? null : log.id)
                      }
                    >
                      <td className="px-4 py-3 text-sm">
                        {new Date(log.timestamp).toLocaleString("en-PK", {
                          dateStyle: "short",
                          timeStyle: "medium",
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {log.user_email || "System"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {log.table_name}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {log.record_id?.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-primary">
                        {expandedLog === log.id ? "Hide" : "View"}
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr className="bg-secondary/10">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {log.old_data && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                  Previous Data:
                                </p>
                                <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-48">
                                  {JSON.stringify(log.old_data, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_data && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">
                                  New Data:
                                </p>
                                <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-48">
                                  {JSON.stringify(log.new_data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Showing {filteredLogs.length} of {logs.length} log entries
      </p>
    </div>
  );
}
