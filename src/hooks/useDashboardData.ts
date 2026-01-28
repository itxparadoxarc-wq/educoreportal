import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  alumniStudents: number;
  leftStudents: number;
  totalFeesPending: number;
  totalFeesCollected: number;
  pendingStudentCount: number;
  newEnrollmentsThisYear: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch student counts by status
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("status, admission_date");

      if (studentsError) throw studentsError;

      const currentYear = new Date().getFullYear();
      const totalStudents = students?.length || 0;
      const activeStudents = students?.filter((s) => s.status === "active").length || 0;
      const inactiveStudents = students?.filter((s) => s.status === "inactive").length || 0;
      const alumniStudents = students?.filter((s) => s.status === "alumni").length || 0;
      const leftStudents = students?.filter((s) => s.status === "left").length || 0;
      const newEnrollmentsThisYear = students?.filter((s) => {
        const admissionYear = new Date(s.admission_date).getFullYear();
        return admissionYear === currentYear;
      }).length || 0;

      // Fetch fee stats
      const { data: fees, error: feesError } = await supabase
        .from("fees")
        .select("amount, paid_amount, status, student_id");

      if (feesError) throw feesError;

      const pendingFees = fees?.filter((f) => f.status === "pending" || f.status === "overdue") || [];
      const totalFeesPending = pendingFees.reduce((sum, f) => sum + (Number(f.amount) - Number(f.paid_amount || 0)), 0);
      const totalFeesCollected = fees?.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0) || 0;
      const pendingStudentIds = new Set(pendingFees.map((f) => f.student_id));
      const pendingStudentCount = pendingStudentIds.size;

      return {
        totalStudents,
        activeStudents,
        inactiveStudents,
        alumniStudents,
        leftStudents,
        totalFeesPending,
        totalFeesCollected,
        pendingStudentCount,
        newEnrollmentsThisYear,
      };
    },
    staleTime: 30000, // 30 seconds
  });
}

export interface RecentActivityItem {
  id: string;
  type: "student_added" | "fee_paid" | "attendance" | "exam_added";
  description: string;
  timestamp: string;
  user: string | null;
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["recentActivity"],
    queryFn: async (): Promise<RecentActivityItem[]> => {
      // Get recent audit logs
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(10);

      if (error) {
        // If user doesn't have access to audit logs (staff), return empty
        console.log("Cannot access audit logs - user may not be master admin");
        return [];
      }

      return (data || []).map((log) => {
        let type: RecentActivityItem["type"] = "student_added";
        let description = "";

        if (log.table_name === "students") {
          type = "student_added";
          description = log.action === "INSERT" 
            ? "New student enrolled" 
            : log.action === "UPDATE" 
            ? "Student record updated" 
            : "Student record deleted";
        } else if (log.table_name === "fees") {
          type = "fee_paid";
          description = log.action === "INSERT" 
            ? "Fee invoice created" 
            : log.action === "UPDATE" 
            ? "Fee payment recorded" 
            : "Fee record deleted";
        } else if (log.table_name === "attendance") {
          type = "attendance";
          description = "Attendance recorded";
        } else if (log.table_name === "exams" || log.table_name === "exam_marks") {
          type = "exam_added";
          description = log.table_name === "exams" ? "Exam created" : "Exam marks entered";
        }

        return {
          id: log.id,
          type,
          description,
          timestamp: log.timestamp,
          user: log.user_email,
        };
      });
    },
    staleTime: 30000,
  });
}

export interface Defaulter {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  pendingAmount: number;
  daysOverdue: number;
}

export function useDefaulters() {
  return useQuery({
    queryKey: ["defaulters"],
    queryFn: async (): Promise<Defaulter[]> => {
      const today = new Date();
      
      // Get overdue fees with student info
      const { data: fees, error } = await supabase
        .from("fees")
        .select(`
          id,
          amount,
          paid_amount,
          due_date,
          student_id,
          students (
            id,
            student_id,
            first_name,
            last_name,
            class
          )
        `)
        .in("status", ["pending", "overdue"])
        .lt("due_date", today.toISOString().split("T")[0]);

      if (error) throw error;

      // Group by student
      const studentMap = new Map<string, Defaulter>();

      (fees || []).forEach((fee) => {
        if (!fee.students) return;
        
        const studentData = fee.students as unknown as {
          id: string;
          student_id: string;
          first_name: string;
          last_name: string;
          class: string;
        };
        
        const pendingAmount = Number(fee.amount) - Number(fee.paid_amount || 0);
        const dueDate = new Date(fee.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (studentMap.has(studentData.id)) {
          const existing = studentMap.get(studentData.id)!;
          existing.pendingAmount += pendingAmount;
          existing.daysOverdue = Math.max(existing.daysOverdue, daysOverdue);
        } else {
          studentMap.set(studentData.id, {
            id: studentData.id,
            studentId: studentData.student_id,
            studentName: `${studentData.first_name} ${studentData.last_name}`,
            class: studentData.class,
            pendingAmount,
            daysOverdue,
          });
        }
      });

      // Sort by days overdue (most overdue first)
      return Array.from(studentMap.values())
        .sort((a, b) => b.daysOverdue - a.daysOverdue)
        .slice(0, 10);
    },
    staleTime: 60000, // 1 minute
  });
}
