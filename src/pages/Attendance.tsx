import { useState, useEffect } from "react";
import { Calendar, Check, X, Minus, Save, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useStudentsByClass, Student } from "@/hooks/useStudents";
import { useAttendanceByDate, useSaveAttendance } from "@/hooks/useAttendance";

interface StudentAttendanceState {
  id: string;
  studentId: string;
  dbId: string;
  name: string;
  rollNo: number;
  status: "present" | "absent" | "leave" | null;
}

const CLASS_OPTIONS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
];

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceState, setAttendanceState] = useState<StudentAttendanceState[]>([]);

  const { data: students, isLoading: studentsLoading } = useStudentsByClass(selectedClass);
  const { data: existingAttendance, isLoading: attendanceLoading } = useAttendanceByDate(
    selectedClass,
    selectedDate
  );
  const saveAttendance = useSaveAttendance();

  // Initialize attendance state when students or existing attendance changes
  useEffect(() => {
    if (students) {
      const newState = students.map((student, index) => {
        const existing = existingAttendance?.find((a) => a.student_id === student.id);
        return {
          id: student.student_id,
          studentId: student.student_id,
          dbId: student.id,
          name: `${student.first_name} ${student.last_name}`,
          rollNo: index + 1,
          status: existing?.status as "present" | "absent" | "leave" | null || null,
        };
      });
      setAttendanceState(newState);
    }
  }, [students, existingAttendance]);

  const updateStatus = (id: string, status: "present" | "absent" | "leave") => {
    setAttendanceState((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const markAllPresent = () => {
    setAttendanceState((prev) => prev.map((s) => ({ ...s, status: "present" })));
  };

  const handleSave = async () => {
    const records = attendanceState
      .filter((s) => s.status !== null)
      .map((s) => ({
        studentId: s.dbId,
        status: s.status as string,
      }));

    if (records.length === 0) {
      return;
    }

    await saveAttendance.mutateAsync({
      records,
      classValue: selectedClass,
      date: selectedDate,
    });
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, leave: 0, unmarked: 0 };
    attendanceState.forEach((s) => {
      if (s.status === "present") counts.present++;
      else if (s.status === "absent") counts.absent++;
      else if (s.status === "leave") counts.leave++;
      else counts.unmarked++;
    });
    return counts;
  };

  const counts = getStatusCounts();
  const isLoading = studentsLoading || attendanceLoading;

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
                {CLASS_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    Class {c}
                  </SelectItem>
                ))}
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
                disabled={!selectedClass || attendanceState.length === 0}
              >
                <Check className="h-4 w-4" />
                All Present
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {selectedClass && (
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
      )}

      {/* Loading State */}
      {isLoading && selectedClass && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading students...</p>
        </div>
      )}

      {/* Attendance Grid */}
      {selectedClass && !isLoading ? (
        attendanceState.length > 0 ? (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Class {selectedClass}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedDate} • {attendanceState.length} students
                </p>
              </div>
              <Button
                onClick={handleSave}
                disabled={saveAttendance.isPending}
                className="gap-2"
              >
                {saveAttendance.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saveAttendance.isPending ? "Saving..." : "Save Attendance"}
              </Button>
            </div>

            <div className="p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {attendanceState.map((student) => (
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
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="text-muted-foreground">
              No active students found in Class {selectedClass}. Add students first.
            </p>
          </div>
        )
      ) : !selectedClass ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select a Class</h3>
          <p className="text-muted-foreground">
            Choose a class from the dropdown above to start marking attendance
          </p>
        </div>
      ) : null}
    </div>
  );
}
