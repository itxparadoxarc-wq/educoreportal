import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Exam = Tables<"exams">;
export type ExamMark = Tables<"exam_marks"> & {
  students?: {
    id: string;
    student_id: string;
    first_name: string;
    last_name: string;
    class: string;
  } | null;
  exams?: {
    id: string;
    name: string;
    class: string;
    exam_date: string;
  } | null;
};

export type ExamInsert = TablesInsert<"exams">;
export type ExamMarkInsert = TablesInsert<"exam_marks">;

export function useExams(filters?: { class?: string; academicYear?: string }) {
  return useQuery({
    queryKey: ["exams", filters],
    queryFn: async () => {
      let query = supabase
        .from("exams")
        .select("*")
        .eq("is_active", true)
        .order("exam_date", { ascending: false });

      if (filters?.class && filters.class !== "all") {
        query = query.eq("class", filters.class);
      }

      if (filters?.academicYear && filters.academicYear !== "all") {
        query = query.eq("academic_year", filters.academicYear);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Exam[];
    },
  });
}

export function useExamMarks(examId?: string, search?: string) {
  return useQuery({
    queryKey: ["examMarks", examId, search],
    queryFn: async () => {
      let query = supabase
        .from("exam_marks")
        .select(`
          *,
          students (
            id,
            student_id,
            first_name,
            last_name,
            class
          ),
          exams (
            id,
            name,
            class,
            exam_date
          )
        `)
        .order("created_at", { ascending: false });

      if (examId && examId !== "all") {
        query = query.eq("exam_id", examId);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = data as ExamMark[];

      if (search) {
        const searchLower = search.toLowerCase();
        result = result.filter(
          (mark) =>
            mark.students?.student_id.toLowerCase().includes(searchLower) ||
            mark.students?.first_name.toLowerCase().includes(searchLower) ||
            mark.students?.last_name.toLowerCase().includes(searchLower)
        );
      }

      return result;
    },
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (exam: ExamInsert) => {
      const { data, error } = await supabase
        .from("exams")
        .insert(exam)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["recentActivity"] });
      toast({
        title: "Exam Created",
        description: "The exam has been created successfully.",
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

export function useSaveExamMarks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      examId,
      marks,
    }: {
      examId: string;
      marks: { studentId: string; subject: string; marksObtained: number; totalMarks: number; grade?: string }[];
    }) => {
      const examMarks = marks.map((mark) => ({
        exam_id: examId,
        student_id: mark.studentId,
        subject: mark.subject,
        marks_obtained: mark.marksObtained,
        total_marks: mark.totalMarks,
        grade: mark.grade || calculateGrade(mark.marksObtained, mark.totalMarks),
      }));

      const { data, error } = await supabase
        .from("exam_marks")
        .insert(examMarks)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examMarks"] });
      queryClient.invalidateQueries({ queryKey: ["recentActivity"] });
      toast({
        title: "Marks Saved",
        description: "Exam marks have been recorded successfully.",
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

export function useDeleteExam() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast({
        title: "Exam Deleted",
        description: "The exam has been removed.",
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

function calculateGrade(marks: number, total: number): string {
  const percentage = (marks / total) * 100;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}
