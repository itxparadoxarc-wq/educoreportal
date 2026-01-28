import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Database, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExportOption {
  id: string;
  label: string;
  description: string;
  table: string;
}

const exportOptions: ExportOption[] = [
  { id: "students", label: "Students", description: "All student records and profiles", table: "students" },
  { id: "fees", label: "Fees & Payments", description: "Fee invoices and payment history", table: "fees" },
  { id: "attendance", label: "Attendance", description: "Attendance records", table: "attendance" },
  { id: "exams", label: "Exams", description: "Exam definitions", table: "exams" },
  { id: "exam_marks", label: "Exam Marks", description: "Student exam results", table: "exam_marks" },
];

export default function DataExport() {
  const { toast } = useToast();
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  const toggleTable = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(t => t !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAll = () => {
    if (selectedTables.length === exportOptions.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(exportOptions.map(o => o.id));
    }
  };

  const exportData = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: "Select Tables",
        description: "Please select at least one table to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      for (const tableId of selectedTables) {
        const option = exportOptions.find(o => o.id === tableId);
        if (!option) continue;

        const { data, error } = await supabase
          .from(option.table as "students" | "fees" | "attendance" | "exams" | "exam_marks")
          .select("*");

        if (error) throw error;

        let content: string;
        let mimeType: string;
        let extension: string;

        if (exportFormat === "csv") {
          if (!data || data.length === 0) {
            content = "";
          } else {
            const headers = Object.keys(data[0]);
            const rows = data.map(row => 
              headers.map(h => {
                const val = (row as Record<string, unknown>)[h];
                const str = val === null ? "" : String(val);
                return str.includes(",") ? `"${str}"` : str;
              }).join(",")
            );
            content = [headers.join(","), ...rows].join("\n");
          }
          mimeType = "text/csv";
          extension = "csv";
        } else {
          content = JSON.stringify(data, null, 2);
          mimeType = "application/json";
          extension = "json";
        }

        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${option.table}-${new Date().toISOString().split("T")[0]}.${extension}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Export Complete",
        description: `${selectedTables.length} table(s) exported successfully`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Data Export</h1>
          <p className="text-muted-foreground">
            Export your data for backup or analysis
          </p>
        </div>
      </div>

      {/* Export Format */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Export Format</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setExportFormat("csv")}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              exportFormat === "csv" 
                ? "border-primary bg-primary/10" 
                : "border-border hover:border-primary/50"
            }`}
          >
            <FileSpreadsheet className={`h-8 w-8 ${exportFormat === "csv" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="text-left">
              <p className="font-medium">CSV</p>
              <p className="text-sm text-muted-foreground">Spreadsheet compatible</p>
            </div>
            {exportFormat === "csv" && <CheckCircle className="h-5 w-5 text-primary ml-2" />}
          </button>
          <button
            onClick={() => setExportFormat("json")}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
              exportFormat === "json" 
                ? "border-primary bg-primary/10" 
                : "border-border hover:border-primary/50"
            }`}
          >
            <FileText className={`h-8 w-8 ${exportFormat === "json" ? "text-primary" : "text-muted-foreground"}`} />
            <div className="text-left">
              <p className="font-medium">JSON</p>
              <p className="text-sm text-muted-foreground">Developer friendly</p>
            </div>
            {exportFormat === "json" && <CheckCircle className="h-5 w-5 text-primary ml-2" />}
          </button>
        </div>
      </div>

      {/* Table Selection */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Select Data to Export</h3>
          <Button variant="ghost" size="sm" onClick={selectAll}>
            {selectedTables.length === exportOptions.length ? "Deselect All" : "Select All"}
          </Button>
        </div>
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exportOptions.map((option) => (
            <label
              key={option.id}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                selectedTables.includes(option.id)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Checkbox
                checked={selectedTables.includes(option.id)}
                onCheckedChange={() => toggleTable(option.id)}
              />
              <div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={exportData}
          disabled={selectedTables.length === 0 || isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export {selectedTables.length > 0 ? `${selectedTables.length} Table(s)` : "Data"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
