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
import { useBulkCreateFees, useFeeStructures } from "@/hooks/useFees";

const bulkFeeSchema = z.object({
  classValue: z.string().min(1, "Class is required"),
  feeStructureId: z.string().min(1, "Fee type is required"),
  dueDate: z.string().min(1, "Due date is required"),
  monthYear: z.string().min(1, "Month/Year is required"),
});

type BulkFeeFormData = z.infer<typeof bulkFeeSchema>;

interface BulkFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkFeeDialog({ open, onOpenChange }: BulkFeeDialogProps) {
  const bulkCreateFees = useBulkCreateFees();
  const { data: feeStructures } = useFeeStructures();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BulkFeeFormData>({
    resolver: zodResolver(bulkFeeSchema),
  });

  const selectedStructure = feeStructures?.find((s) => s.id === selectedFeeStructure);

  const onSubmit = async (data: BulkFeeFormData) => {
    if (!selectedStructure) return;

    try {
      await bulkCreateFees.mutateAsync({
        classValue: data.classValue,
        feeStructureId: data.feeStructureId,
        description: selectedStructure.name,
        amount: Number(selectedStructure.amount),
        dueDate: data.dueDate,
        monthYear: data.monthYear,
      });
      onOpenChange(false);
      reset();
      setSelectedClass("");
      setSelectedFeeStructure("");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Bulk Fees</DialogTitle>
          <DialogDescription>
            Create fee invoices for all active students in a class.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Class *</Label>
            <Select
              value={selectedClass}
              onValueChange={(v) => {
                setSelectedClass(v);
                setValue("classValue", v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose class" />
              </SelectTrigger>
              <SelectContent>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
                  <SelectItem key={c} value={c}>
                    Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.classValue && (
              <p className="text-sm text-destructive">{errors.classValue.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fee Type *</Label>
            <Select
              value={selectedFeeStructure}
              onValueChange={(v) => {
                setSelectedFeeStructure(v);
                setValue("feeStructureId", v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose fee type" />
              </SelectTrigger>
              <SelectContent>
                {feeStructures?.map((structure) => (
                  <SelectItem key={structure.id} value={structure.id}>
                    {structure.name} - PKR {Number(structure.amount).toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.feeStructureId && (
              <p className="text-sm text-destructive">{errors.feeStructureId.message}</p>
            )}
          </div>

          {selectedStructure && (
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Amount per student:</p>
              <p className="text-xl font-bold">
                PKR {Number(selectedStructure.amount).toLocaleString()}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthYear">Month/Year *</Label>
              <Input
                id="monthYear"
                {...register("monthYear")}
                placeholder="e.g., January 2026"
              />
              {errors.monthYear && (
                <p className="text-sm text-destructive">{errors.monthYear.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Generating..." : "Generate Invoices"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
