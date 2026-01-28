import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Attendance = Tables<"attendance">;
export type AttendanceInsert = TablesInsert<"attendance">;

export function useAttendanceByDate(classValue: string, date: string) {
  return useQuery({
    queryKey: ["attendance", classValue, date],
    queryFn: async () => {
      if (!classValue || !date) return [];

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("class", classValue)
        .eq("date", date);

      if (error) throw error;
      return data as Attendance[];
    },
    enabled: !!classValue && !!date,
  });
}

export function useSaveAttendance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      records,
      classValue,
      date,
    }: {
      records: { studentId: string; status: string }[];
      classValue: string;
      date: string;
    }) => {
      // First, delete existing attendance for this class and date
      const { error: deleteError } = await supabase
        .from("attendance")
        .delete()
        .eq("class", classValue)
        .eq("date", date);

      if (deleteError) throw deleteError;

      // Insert new attendance records
      const attendanceRecords = records.map((record) => ({
        student_id: record.studentId,
        status: record.status,
        class: classValue,
        date: date,
      }));

      const { data, error } = await supabase
        .from("attendance")
        .insert(attendanceRecords)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["recentActivity"] });
      toast({
        title: "Attendance Saved",
        description: "Attendance has been recorded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAttendanceStats(classValue?: string, month?: string) {
  return useQuery({
    queryKey: ["attendanceStats", classValue, month],
    queryFn: async () => {
      let query = supabase.from("attendance").select("status, date");

      if (classValue && classValue !== "all") {
        query = query.eq("class", classValue);
      }

      if (month) {
        const startDate = `${month}-01`;
        const endDate = `${month}-31`;
        query = query.gte("date", startDate).lte("date", endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        present: 0,
        absent: 0,
        leave: 0,
        total: data.length,
      };

      data.forEach((record) => {
        if (record.status === "present") stats.present++;
        else if (record.status === "absent") stats.absent++;
        else if (record.status === "leave") stats.leave++;
      });

      return stats;
    },
  });
}
