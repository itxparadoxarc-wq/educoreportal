import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Fee = Tables<"fees"> & {
  students?: {
    id: string;
    student_id: string;
    first_name: string;
    last_name: string;
    class: string;
    section: string | null;
  } | null;
};

export type FeeInsert = TablesInsert<"fees">;
export type FeeUpdate = TablesUpdate<"fees">;
export type FeeStructure = Tables<"fee_structures">;

export function useFees(filters?: { status?: string; feeType?: string; search?: string }) {
  return useQuery({
    queryKey: ["fees", filters],
    queryFn: async () => {
      let query = supabase
        .from("fees")
        .select(`
          *,
          students (
            id,
            student_id,
            first_name,
            last_name,
            class,
            section
          )
        `)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.feeType && filters.feeType !== "all") {
        query = query.eq("description", filters.feeType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by search if provided
      let result = data as Fee[];
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(
          (fee) =>
            fee.students?.student_id.toLowerCase().includes(search) ||
            fee.students?.first_name.toLowerCase().includes(search) ||
            fee.students?.last_name.toLowerCase().includes(search) ||
            fee.receipt_number?.toLowerCase().includes(search)
        );
      }

      return result;
    },
  });
}

export function useFeeStructures() {
  return useQuery({
    queryKey: ["feeStructures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as FeeStructure[];
    },
  });
}

export function useCreateFee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (fee: FeeInsert) => {
      const { data, error } = await supabase
        .from("fees")
        .insert(fee)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["defaulters"] });
      toast({
        title: "Fee Created",
        description: "Fee invoice has been created successfully.",
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

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      amount,
      paymentMethod,
    }: {
      id: string;
      amount: number;
      paymentMethod: string;
    }) => {
      // First get the current fee record
      const { data: fee, error: fetchError } = await supabase
        .from("fees")
        .select("amount, paid_amount")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const newPaidAmount = (Number(fee.paid_amount) || 0) + amount;
      const newStatus = newPaidAmount >= Number(fee.amount) ? "paid" : "pending";

      const { data, error } = await supabase
        .from("fees")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          payment_method: paymentMethod,
          paid_date: newStatus === "paid" ? new Date().toISOString().split("T")[0] : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["defaulters"] });
      queryClient.invalidateQueries({ queryKey: ["recentActivity"] });
      toast({
        title: "Payment Recorded",
        description: "Payment has been recorded successfully.",
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

export function useBulkCreateFees() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      classValue,
      feeStructureId,
      description,
      amount,
      dueDate,
      monthYear,
    }: {
      classValue: string;
      feeStructureId: string;
      description: string;
      amount: number;
      dueDate: string;
      monthYear: string;
    }) => {
      // Get all active students in the class
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id")
        .eq("class", classValue)
        .eq("status", "active");

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        throw new Error("No active students found in this class");
      }

      // Create fee records for each student
      const feeRecords = students.map((student) => ({
        student_id: student.id,
        fee_structure_id: feeStructureId,
        description,
        amount,
        due_date: dueDate,
        month_year: monthYear,
        status: "pending",
      }));

      const { data, error } = await supabase.from("fees").insert(feeRecords).select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast({
        title: "Fees Generated",
        description: `${data.length} fee invoices have been created.`,
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

export function useDeleteFee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast({
        title: "Fee Deleted",
        description: "The fee record has been removed.",
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
