import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
}

export function useClasses(activeOnly: boolean = true) {
  return useQuery({
    queryKey: ["classes", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("classes")
        .select("*")
        .order("sort_order", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ClassItem[];
    },
  });
}
