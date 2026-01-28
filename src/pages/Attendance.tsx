import { useState } from "react";
import { Calendar, Check, X, Minus, Save, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface StudentAttendance {
  id: string;
  studentId: string;
  name: string;
  rollNo: number;
  status: "present" | "absent" | "leave" | null;
}

const mockStudents: StudentAttendance[] = [
  { id: "1", studentId: "INST-2026-0001", name: "Ahmed Hassan", rollNo: 1, status: null },
  { id: "2", studentId: "INST-2026-0002", name: "Sara Ahmed", rollNo: 2, status: null },
  { id: "3", studentId: "INST-2026-0003", name: "Ali Raza", rollNo: 3, status: null },
  { id: "4", studentId: "INST-2026-0004", name: "Fatima Khan", rollNo: 4, status: null },
  { id: "5", studentId: "INST-2026-0005", name: "Usman Ali", rollNo: 5, status: null },
  { id: "6", studentId: "INST-2026-0006", name: "Ayesha Malik", rollNo: 6, status: null },
  { id: "7", studentId: "INST-2026-0007", name: "Hassan Raza", rollNo: 7, status: null },
  { id: "8", studentId: "INST-2026-0008", name: "Mariam Bibi", rollNo: 8, status: null },
];

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState<StudentAttendance[]>(mockStudents);
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = (id: string, status: "present" | "absent" | "leave") => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "present" })));
  };

  const handleSave = () => {
    setIsLoading(true);
    // Simulate save
    setTimeout(() => {
      setIsLoading(false);
      alert("Attendance saved successfully!");
    }, 1000);
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, leave: 0, unmarked: 0 };
    students.forEach((s) => {
      if (s.status === "present") counts.present++;
      else if (s.status === "absent") counts.absent++;
      else if (s.status === "leave") counts.leave++;
      else counts.unmarked++;
    });
    return counts;
  };

  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Daily Attendance</h1>
          <p className="text-muted-foreground">
            Mark attendance for students quickly and efficiently
          </p>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7-A">Class 7-A</SelectItem>
                <SelectItem value="7-B">Class 7-B</SelectItem>
                <SelectItem value="8-A">Class 8-A</SelectItem>
                <SelectItem value="8-B">Class 8-B</SelectItem>
                <SelectItem value="9-A">Class 9-A</SelectItem>
                <SelectItem value="9-B">Class 9-B</SelectItem>
                <SelectItem value="10-A">Class 10-A</SelectItem>
                <SelectItem value="10-B">Class 10-B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-input border border-border rounded-lg px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Actions</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={markAllPresent}
              >
                <Check className="h-4 w-4" />
                All Present
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-success/20 flex items-center justify-center">
            <Check className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-success">{counts.present}</p>
            <p className="text-sm text-muted-foreground">Present</p>
          </div>
        </div>

        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-destructive/20 flex items-center justify-center">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">{counts.absent}</p>
            <p className="text-sm text-muted-foreground">Absent</p>
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-warning/20 flex items-center justify-center">
            <Minus className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{counts.leave}</p>
            <p className="text-sm text-muted-foreground">On Leave</p>
          </div>
        </div>

        <div className="bg-muted border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">{counts.unmarked}</p>
            <p className="text-sm text-muted-foreground">Unmarked</p>
          </div>
        </div>
      </div>

      {/* Attendance Grid */}
      {selectedClass ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Class {selectedClass}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedDate} • {students.length} students
              </p>
            </div>
            <Button onClick={handleSave} disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save Attendance"}
            </Button>
          </div>

          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={cn(
                    "border rounded-lg p-4 transition-all",
                    student.status === "present" && "border-success bg-success/5",
                    student.status === "absent" && "border-destructive bg-destructive/5",
                    student.status === "leave" && "border-warning bg-warning/5",
                    !student.status && "border-border"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="font-bold text-primary">
                        {student.rollNo}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {student.studentId}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(student.id, "present")}
                      className={cn(
                        "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                        student.status === "present"
                          ? "bg-success text-success-foreground"
                          : "bg-success/20 text-success hover:bg-success/30"
                      )}
                    >
                      <Check className="h-4 w-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => updateStatus(student.id, "absent")}
                      className={cn(
                        "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                        student.status === "absent"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                      )}
                    >
                      <X className="h-4 w-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => updateStatus(student.id, "leave")}
                      className={cn(
                        "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                        student.status === "leave"
                          ? "bg-warning text-warning-foreground"
                          : "bg-warning/20 text-warning hover:bg-warning/30"
                      )}
                    >
                      <Minus className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Class</h3>
          <p className="text-muted-foreground">
            Choose a class from the dropdown above to start marking attendance
          </p>
        </div>
      )}
    </div>
  );
}