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
import { useSaveExamMarks, useExams } from "@/hooks/useAcademics";
import { useStudents } from "@/hooks/useStudents";

const marksSchema = z.object({
  exam_id: z.string().min(1, "Exam is required"),
  student_id: z.string().min(1, "Student is required"),
  subject: z.string().min(1, "Subject is required"),
  marks_obtained: z.number().min(0, "Marks must be 0 or greater"),
  total_marks: z.number().min(1, "Total marks must be greater than 0"),
});

type MarksFormData = z.infer<typeof marksSchema>;

interface EnterMarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUBJECTS = [
  "Mathematics",
  "English",
  "Science",
  "Urdu",
  "Islamiat",
  "Pakistan Studies",
  "Computer Science",
  "Physics",
  "Chemistry",
  "Biology",
];

export function EnterMarksDialog({ open, onOpenChange }: EnterMarksDialogProps) {
  const saveMarks = useSaveExamMarks();
  const { data: exams } = useExams();
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  const selectedExamData = exams?.find((e) => e.id === selectedExam);
  const { data: students } = useStudents({
    class: selectedExamData?.class,
    status: "active",
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MarksFormData>({
    resolver: zodResolver(marksSchema),
    defaultValues: {
      total_marks: 100,
    },
  });

  const onSubmit = async (data: MarksFormData) => {
    try {
      await saveMarks.mutateAsync({
        examId: data.exam_id,
        marks: [
          {
            studentId: data.student_id,
            subject: data.subject,
            marksObtained: data.marks_obtained,
            totalMarks: data.total_marks,
          },
        ],
      });
      onOpenChange(false);
      reset();
      setSelectedExam("");
      setSelectedStudent("");
      setSelectedSubject("");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enter Exam Marks</DialogTitle>
          <DialogDescription>Record marks for a student in an exam.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Exam *</Label>
            <Select
              value={selectedExam}
              onValueChange={(v) => {
                setSelectedExam(v);
                setValue("exam_id", v);
                setSelectedStudent("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose exam" />
              </SelectTrigger>
              <SelectContent>
                {exams?.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name} - Class {exam.class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.exam_id && (
              <p className="text-sm text-destructive">{errors.exam_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Select Student *</Label>
            <Select
              value={selectedStudent}
              onValueChange={(v) => {
                setSelectedStudent(v);
                setValue("student_id", v);
              }}
              disabled={!selectedExam}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedExam ? "Choose student" : "Select exam first"} />
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
            <Label>Subject *</Label>
            <Select
              value={selectedSubject}
              onValueChange={(v) => {
                setSelectedSubject(v);
                setValue("subject", v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="marks_obtained">Marks Obtained *</Label>
              <Input
                id="marks_obtained"
                type="number"
                {...register("marks_obtained", { valueAsNumber: true })}
                placeholder="85"
              />
              {errors.marks_obtained && (
                <p className="text-sm text-destructive">{errors.marks_obtained.message}</p>
              )}
            </div>
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
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Marks"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
