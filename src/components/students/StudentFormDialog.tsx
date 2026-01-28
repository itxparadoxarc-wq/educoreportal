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
import { Textarea } from "@/components/ui/textarea";
import { useCreateStudent, useUpdateStudent, Student } from "@/hooks/useStudents";

const studentSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  class: z.string().min(1, "Class is required"),
  section: z.string().optional(),
  guardian_name: z.string().min(1, "Guardian name is required").max(100),
  guardian_phone: z.string().min(10, "Valid phone number is required").max(20),
  guardian_relation: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive", "alumni", "left"]).default("active"),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
}

export function StudentFormDialog({ open, onOpenChange, student }: StudentFormDialogProps) {
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const isEditing = !!student;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      status: "active",
    },
  });

  useEffect(() => {
    if (student) {
      reset({
        first_name: student.first_name,
        last_name: student.last_name,
        class: student.class,
        section: student.section || undefined,
        guardian_name: student.guardian_name,
        guardian_phone: student.guardian_phone,
        guardian_relation: student.guardian_relation || undefined,
        date_of_birth: student.date_of_birth || undefined,
        gender: student.gender || undefined,
        phone: student.phone || undefined,
        address: student.address || undefined,
        notes: student.notes || undefined,
        status: student.status as "active" | "inactive" | "alumni" | "left",
      });
    } else {
      reset({
        status: "active",
        first_name: "",
        last_name: "",
        class: "",
        guardian_name: "",
        guardian_phone: "",
      });
    }
  }, [student, reset]);

  const onSubmit = async (data: StudentFormData) => {
    try {
      if (isEditing && student) {
        await updateStudent.mutateAsync({ id: student.id, data });
      } else {
        // Generate a placeholder student_id - the trigger will replace it
        await createStudent.mutateAsync({
          first_name: data.first_name,
          last_name: data.last_name,
          class: data.class,
          section: data.section,
          guardian_name: data.guardian_name,
          guardian_phone: data.guardian_phone,
          guardian_relation: data.guardian_relation,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          phone: data.phone,
          address: data.address,
          notes: data.notes,
          status: data.status,
          student_id: "TEMP-" + Date.now(),
        });
      }
      onOpenChange(false);
      reset();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const classValue = watch("class");
  const genderValue = watch("gender");
  const statusValue = watch("status");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the student's information below."
              : "Fill in the details to enroll a new student."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  {...register("first_name")}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  {...register("last_name")}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={classValue} onValueChange={(v) => setValue("class", v)}>
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
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  {...register("section")}
                  placeholder="e.g., A"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={genderValue} onValueChange={(v) => setValue("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input id="phone" {...register("phone")} placeholder="+92 XXX XXXXXXX" />
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Guardian Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardian_name">Guardian Name *</Label>
                <Input
                  id="guardian_name"
                  {...register("guardian_name")}
                  placeholder="Enter guardian name"
                />
                {errors.guardian_name && (
                  <p className="text-sm text-destructive">{errors.guardian_name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_phone">Guardian Phone *</Label>
                <Input
                  id="guardian_phone"
                  {...register("guardian_phone")}
                  placeholder="+92 XXX XXXXXXX"
                />
                {errors.guardian_phone && (
                  <p className="text-sm text-destructive">{errors.guardian_phone.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardian_relation">Relation</Label>
              <Input
                id="guardian_relation"
                {...register("guardian_relation")}
                placeholder="e.g., Father, Mother, Uncle"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Additional Information
            </h3>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Enter full address"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusValue} onValueChange={(v) => setValue("status", v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update Student" : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
