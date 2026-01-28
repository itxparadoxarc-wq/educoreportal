import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateExam } from "@/hooks/useAcademics";

const examSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  class: z.string().min(1, "Class is required"),
  exam_date: z.string().min(1, "Exam date is required"),
  total_marks: z.number().min(1, "Total marks must be greater than 0"),
  academic_year: z.string().min(1, "Academic year is required"),
});

type ExamFormData = z.infer<typeof examSchema>;

interface CreateExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateExamDialog({ open, onOpenChange }: CreateExamDialogProps) {
  const createExam = useCreateExam();
  const [selectedClass, setSelectedClass] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      total_marks: 100,
      academic_year: "2025-2026",
    },
  });

  const onSubmit = async (data: ExamFormData) => {
    try {
      await createExam.mutateAsync({
        name: data.name,
        class: data.class,
        exam_date: data.exam_date,
        total_marks: data.total_marks,
        academic_year: data.academic_year,
      });
      onOpenChange(false);
      reset();
      setSelectedClass("");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>Define a new examination for grade entry.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Exam Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Mid-Term Examination 2026"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select
                value={selectedClass}
                onValueChange={(v) => {
                  setSelectedClass(v);
                  setValue("class", v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
                    <SelectItem key={c} value={c}>
                      Class {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.class && (
                <p className="text-sm text-destructive">{errors.class.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam_date">Exam Date *</Label>
              <Input id="exam_date" type="date" {...register("exam_date")} />
              {errors.exam_date && (
                <p className="text-sm text-destructive">{errors.exam_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_marks">Total Marks *</Label>
              <Input
                id="total_marks"
                type="number"
                {...register("total_marks", { valueAsNumber: true })}
              />
              {errors.total_marks && (
                <p className="text-sm text-destructive">{errors.total_marks.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic_year">Academic Year *</Label>
              <Input
                id="academic_year"
                {...register("academic_year")}
                placeholder="e.g., 2025-2026"
              />
              {errors.academic_year && (
                <p className="text-sm text-destructive">{errors.academic_year.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Exam"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
