import { useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  FileText,
  Award,
  TrendingUp,
  Calculator,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExams, useExamMarks } from "@/hooks/useAcademics";
import { CreateExamDialog } from "@/components/academics/CreateExamDialog";
import { EnterMarksDialog } from "@/components/academics/EnterMarksDialog";
import { useClasses } from "@/hooks/useClasses";

const getGradeColor = (grade: string) => {
  if (grade.startsWith("A")) return "text-success";
  if (grade.startsWith("B")) return "text-primary";
  if (grade.startsWith("C")) return "text-warning";
  return "text-destructive";
};

export default function Academics() {
  const [searchQuery, setSearchQuery] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isEnterMarksOpen, setIsEnterMarksOpen] = useState(false);

  const { data: classes } = useClasses();
  const { data: exams, isLoading: examsLoading } = useExams({
    class: classFilter,
  });

  const { data: examMarks, isLoading: marksLoading } = useExamMarks(
    examFilter,
    searchQuery
  );

  const isLoading = examsLoading || marksLoading;

  // Group marks by student and exam
  const groupedMarks = examMarks?.reduce((acc, mark) => {
    const key = `${mark.student_id}-${mark.exam_id}`;
    if (!acc[key]) {
      acc[key] = {
        studentId: mark.students?.student_id || "",
        studentName: `${mark.students?.first_name || ""} ${mark.students?.last_name || ""}`,
        class: mark.students?.class || "",
        examName: mark.exams?.name || "",
        subjects: [],
        totalMarks: 0,
        totalPossible: 0,
      };
    }
    acc[key].subjects.push({
      name: mark.subject,
      marks: Number(mark.marks_obtained),
      total: Number(mark.total_marks),
      grade: mark.grade || "",
    });
    acc[key].totalMarks += Number(mark.marks_obtained);
    acc[key].totalPossible += Number(mark.total_marks);
    return acc;
  }, {} as Record<string, any>) || {};

  const examRecords = Object.values(groupedMarks).map((record: any) => ({
    ...record,
    percentage: record.totalPossible > 0
      ? ((record.totalMarks / record.totalPossible) * 100).toFixed(1)
      : "0",
    grade: calculateOverallGrade(record.totalMarks, record.totalPossible),
  }));

  // Calculate stats
  const avgPercentage = examRecords.length > 0
    ? (examRecords.reduce((sum, r) => sum + parseFloat(r.percentage), 0) / examRecords.length).toFixed(1)
    : "0";

  const topPerformers = examRecords.filter((r) => r.grade.startsWith("A")).length;
  const needImprovement = examRecords.filter((r) => parseFloat(r.percentage) < 50).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Academics</h1>
          <p className="text-muted-foreground">
            Manage exams, grades, and academic records
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setIsCreateExamOpen(true)}>
            <FileText className="h-4 w-4" />
            New Exam
          </Button>
          <Button className="gap-2" onClick={() => setIsEnterMarksOpen(true)}>
            <Plus className="h-4 w-4" />
            Enter Marks
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Average Score"
          value={`${avgPercentage}%`}
          icon={Calculator}
          variant="primary"
        />
        <StatCard
          title="Top Performers"
          value={topPerformers.toString()}
          change="A+ and A grades"
          icon={Award}
          variant="success"
        />
        <StatCard
          title="Need Improvement"
          value={needImprovement.toString()}
          change="Below 50%"
          icon={TrendingUp}
          variant="warning"
        />
        <StatCard
          title="Exams Created"
          value={(exams?.length || 0).toString()}
          change="Active exams"
          icon={FileText}
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Student ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <Select value={examFilter} onValueChange={setExamFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams?.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name} - Class {exam.class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes?.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading academic records...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && examRecords.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Exam Records</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || examFilter !== "all" || classFilter !== "all"
              ? "No exam records match your search criteria."
              : "Create an exam and start entering marks."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setIsCreateExamOpen(true)}>
              Create Exam
            </Button>
            <Button onClick={() => setIsEnterMarksOpen(true)}>
              Enter Marks
            </Button>
          </div>
        </div>
      )}

      {/* Exam Records */}
      {!isLoading && examRecords.length > 0 && (
        <div className="space-y-4">
          {examRecords.map((record, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* Student Info */}
                <div className="flex items-center gap-4 lg:w-64">
                  <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <GraduationCap className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{record.studentName}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {record.studentId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Class {record.class} • {record.examName}
                    </p>
                  </div>
                </div>

                {/* Subject Marks */}
                <div className="flex-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {record.subjects.map((subject: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-secondary/30 rounded-lg p-3"
                    >
                      <p className="text-xs text-muted-foreground truncate">
                        {subject.name}
                      </p>
                      <p className="text-lg font-bold">
                        {subject.marks}
                        <span className="text-sm text-muted-foreground font-normal">
                          /{subject.total}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Total & Grade */}
                <div className="flex items-center gap-6 lg:w-48">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{record.percentage}%</p>
                    <p className="text-xs text-muted-foreground">
                      {record.totalMarks}/{record.totalPossible}
                    </p>
                  </div>
                  <div
                    className={`h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-bold ${getGradeColor(
                      record.grade
                    )} bg-current/10`}
                  >
                    <span className={getGradeColor(record.grade)}>{record.grade}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateExamDialog open={isCreateExamOpen} onOpenChange={setIsCreateExamOpen} />
      <EnterMarksDialog open={isEnterMarksOpen} onOpenChange={setIsEnterMarksOpen} />
    </div>
  );
}

function calculateOverallGrade(marks: number, total: number): string {
  if (total === 0) return "-";
  const percentage = (marks / total) * 100;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}
