import { useState, useEffect } from "react";
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
import { useCreateFee, useFeeStructures } from "@/hooks/useFees";
import { useStudents, Student } from "@/hooks/useStudents";

const feeSchema = z.object({
  student_id: z.string().min(1, "Student is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  due_date: z.string().min(1, "Due date is required"),
  month_year: z.string().optional(),
});

type FeeFormData = z.infer<typeof feeSchema>;

interface AddFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFeeDialog({ open, onOpenChange }: AddFeeDialogProps) {
  const createFee = useCreateFee();
  const { data: students } = useStudents({ status: "active" });
  const { data: feeStructures } = useFeeStructures();
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedFeeType, setSelectedFeeType] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
  });

  useEffect(() => {
    if (selectedFeeType && feeStructures) {
      const structure = feeStructures.find((s) => s.id === selectedFeeType);
      if (structure) {
        setValue("description", structure.name);
        setValue("amount", Number(structure.amount));
      }
    }
  }, [selectedFeeType, feeStructures, setValue]);

  const onSubmit = async (data: FeeFormData) => {
    try {
      await createFee.mutateAsync({
        student_id: data.student_id,
        description: data.description,
        amount: data.amount,
        due_date: data.due_date,
        month_year: data.month_year,
        status: "pending",
      });
      onOpenChange(false);
      reset();
      setSelectedStudent("");
      setSelectedFeeType("");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Fee Invoice</DialogTitle>
          <DialogDescription>Create a new fee invoice for a student.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Student *</Label>
            <Select
              value={selectedStudent}
              onValueChange={(v) => {
                setSelectedStudent(v);
                setValue("student_id", v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Search student..." />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.student_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.student_id && (
              <p className="text-sm text-destructive">{errors.student_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fee Type</Label>
            <Select value={selectedFeeType} onValueChange={setSelectedFeeType}>
              <SelectTrigger>
                <SelectValue placeholder="Select fee type (optional)" />
              </SelectTrigger>
              <SelectContent>
                {feeStructures?.map((structure) => (
                  <SelectItem key={structure.id} value={structure.id}>
                    {structure.name} - PKR {Number(structure.amount).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              {...register("description")}
              placeholder="e.g., Tuition Fee - January 2026"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PKR) *</Label>
              <Input
                id="amount"
                type="number"
                {...register("amount", { valueAsNumber: true })}
                placeholder="15000"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input id="due_date" type="date" {...register("due_date")} />
              {errors.due_date && (
                <p className="text-sm text-destructive">{errors.due_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="month_year">Month/Year</Label>
            <Input
              id="month_year"
              {...register("month_year")}
              placeholder="e.g., January 2026"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
