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
import { Loader2 } from "lucide-react";

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
  const { data: exams, isLoading: examsLoading } = useExams();
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  const selectedExamData = exams?.find((e) => e.id === selectedExam);
  
  // Filter students by the exam's class
  const { data: students, isLoading: studentsLoading } = useStudents(
    selectedExamData
      ? { class: selectedExamData.class, status: "active" }
      : undefined
  );

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

  const handleClose = () => {
    onOpenChange(false);
    reset();
    setSelectedExam("");
    setSelectedStudent("");
    setSelectedSubject("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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
                setValue("student_id", "");
              }}
              disabled={examsLoading}
            >
              <SelectTrigger>
                {examsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading exams...</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Choose exam" />
                )}
              </SelectTrigger>
              <SelectContent>
                {exams && exams.length > 0 ? (
                  exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name} - Class {exam.class}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    No exams found. Create an exam first.
                  </div>
                )}
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
              disabled={!selectedExam || studentsLoading}
            >
              <SelectTrigger>
                {studentsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading students...</span>
                  </div>
                ) : (
                  <SelectValue placeholder={selectedExam ? "Choose student" : "Select exam first"} />
                )}
              </SelectTrigger>
              <SelectContent>
                {students && students.length > 0 ? (
                  students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.student_id})
                    </SelectItem>
                  ))
                ) : selectedExam ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No students found in class {selectedExamData?.class}
                  </div>
                ) : null}
              </SelectContent>
            </Select>
            {errors.student_id && (
              <p className="text-sm text-destructive">{errors.student_id.message}</p>
            )}
            {selectedExam && students && students.length === 0 && (
              <p className="text-sm text-warning">
                No active students found in class {selectedExamData?.class}. Please add students to this class first.
              </p>
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
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedExam || !selectedStudent}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Marks"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
