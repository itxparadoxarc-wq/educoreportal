import { useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  FileText,
  Award,
  TrendingUp,
  Calculator,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExamRecord {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  examName: string;
  subjects: {
    name: string;
    marks: number;
    total: number;
  }[];
  totalMarks: number;
  totalPossible: number;
  percentage: number;
  grade: string;
}

const mockExams: ExamRecord[] = [
  {
    id: "1",
    studentId: "INST-2026-0001",
    studentName: "Ahmed Hassan",
    class: "10-A",
    examName: "Mid-Terms 2026",
    subjects: [
      { name: "Mathematics", marks: 85, total: 100 },
      { name: "English", marks: 78, total: 100 },
      { name: "Science", marks: 92, total: 100 },
      { name: "Urdu", marks: 88, total: 100 },
      { name: "Islamiat", marks: 95, total: 100 },
    ],
    totalMarks: 438,
    totalPossible: 500,
    percentage: 87.6,
    grade: "A",
  },
  {
    id: "2",
    studentId: "INST-2026-0002",
    studentName: "Sara Ahmed",
    class: "9-B",
    examName: "Mid-Terms 2026",
    subjects: [
      { name: "Mathematics", marks: 72, total: 100 },
      { name: "English", marks: 85, total: 100 },
      { name: "Science", marks: 78, total: 100 },
      { name: "Urdu", marks: 90, total: 100 },
      { name: "Islamiat", marks: 88, total: 100 },
    ],
    totalMarks: 413,
    totalPossible: 500,
    percentage: 82.6,
    grade: "A-",
  },
  {
    id: "3",
    studentId: "INST-2026-0003",
    studentName: "Ali Raza",
    class: "8-A",
    examName: "Mid-Terms 2026",
    subjects: [
      { name: "Mathematics", marks: 65, total: 100 },
      { name: "English", marks: 58, total: 100 },
      { name: "Science", marks: 70, total: 100 },
      { name: "Urdu", marks: 75, total: 100 },
      { name: "Islamiat", marks: 82, total: 100 },
    ],
    totalMarks: 350,
    totalPossible: 500,
    percentage: 70.0,
    grade: "B",
  },
];

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

  const filteredExams = mockExams.filter((exam) => {
    const matchesSearch =
      exam.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.studentName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesExam =
      examFilter === "all" || exam.examName === examFilter;

    const matchesClass =
      classFilter === "all" || exam.class.startsWith(classFilter);

    return matchesSearch && matchesExam && matchesClass;
  });

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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                New Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
                <DialogDescription>
                  Define a new examination for grade entry
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exam Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Mid-Terms 2026"
                    className="w-full bg-input border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Class 7</SelectItem>
                      <SelectItem value="8">Class 8</SelectItem>
                      <SelectItem value="9">Class 9</SelectItem>
                      <SelectItem value="10">Class 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exam Date</label>
                  <input
                    type="date"
                    className="w-full bg-input border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button className="w-full mt-4">Create Exam</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Enter Marks
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Average Score"
          value="78.5%"
          icon={Calculator}
          variant="primary"
        />
        <StatCard
          title="Top Performers"
          value="45"
          change="A+ and A grades"
          icon={Award}
          variant="success"
        />
        <StatCard
          title="Need Improvement"
          value="12"
          change="Below 50%"
          icon={TrendingUp}
          variant="warning"
        />
        <StatCard
          title="Exams Conducted"
          value="3"
          change="This academic year"
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                <SelectItem value="Mid-Terms 2026">Mid-Terms 2026</SelectItem>
                <SelectItem value="Finals 2025">Finals 2025</SelectItem>
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="7">Class 7</SelectItem>
                <SelectItem value="8">Class 8</SelectItem>
                <SelectItem value="9">Class 9</SelectItem>
                <SelectItem value="10">Class 10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Exam Records */}
      <div className="space-y-4">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Student Info */}
              <div className="flex items-center gap-4 lg:w-64">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <GraduationCap className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{exam.studentName}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {exam.studentId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Class {exam.class} • {exam.examName}
                  </p>
                </div>
              </div>

              {/* Subject Marks */}
              <div className="flex-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {exam.subjects.map((subject) => (
                  <div
                    key={subject.name}
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
                  <p className="text-2xl font-bold">{exam.percentage}%</p>
                  <p className="text-xs text-muted-foreground">
                    {exam.totalMarks}/{exam.totalPossible}
                  </p>
                </div>
                <div
                  className={`h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-bold ${getGradeColor(
                    exam.grade
                  )} bg-current/10`}
                >
                  <span className={getGradeColor(exam.grade)}>{exam.grade}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExams.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Records Found</h3>
          <p className="text-muted-foreground">
            No exam records match your search criteria
          </p>
        </div>
      )}
    </div>
  );
}