import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Printer,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  CreditCard,
  ClipboardCheck,
  FileText,
  Award,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudent } from "@/hooks/useStudents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: student, isLoading: studentLoading } = useStudent(id || null);

  // Fetch academic records
  const { data: examMarks } = useQuery({
    queryKey: ["studentExamMarks", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("exam_marks")
        .select(`
          *,
          exams (id, name, class, exam_date, academic_year, total_marks)
        `)
        .eq("student_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch fee records
  const { data: feeRecords } = useQuery({
    queryKey: ["studentFees", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", id)
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch attendance records
  const { data: attendanceRecords } = useQuery({
    queryKey: ["studentAttendance", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const calculateGrade = (marks: number, total: number): string => {
    const percentage = (marks / total) * 100;
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  const generatePDF = async (section?: "academic" | "fees" | "attendance") => {
    if (!student) return;
    setIsGeneratingPDF(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPos = 20;

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(0, 123, 255);
      pdf.text("EduCore Student Report", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Student Info
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${student.first_name} ${student.last_name}`, pageWidth / 2, yPos, { align: "center" });
      yPos += 8;
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Student ID: ${student.student_id} | Class: ${student.class}${student.section ? `-${student.section}` : ""}`, pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Line separator
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      if (!section || section === "academic") {
        // Academic Section
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Academic Records", 20, yPos);
        yPos += 10;

        if (examMarks && examMarks.length > 0) {
          // Group by exam
          const examGroups: Record<string, any[]> = {};
          examMarks.forEach((mark) => {
            const examId = mark.exam_id;
            if (!examGroups[examId]) {
              examGroups[examId] = [];
            }
            examGroups[examId].push(mark);
          });

          Object.entries(examGroups).forEach(([examId, marks]) => {
            const examName = marks[0]?.exams?.name || "Unknown Exam";
            const examDate = marks[0]?.exams?.exam_date;
            
            pdf.setFontSize(11);
            pdf.setTextColor(50, 50, 50);
            pdf.text(`${examName} ${examDate ? `(${format(new Date(examDate), "MMM yyyy")})` : ""}`, 20, yPos);
            yPos += 6;

            marks.forEach((mark) => {
              const percentage = ((mark.marks_obtained / mark.total_marks) * 100).toFixed(1);
              const grade = calculateGrade(mark.marks_obtained, mark.total_marks);
              pdf.setFontSize(10);
              pdf.text(`  ${mark.subject}: ${mark.marks_obtained}/${mark.total_marks} (${percentage}%) - Grade: ${grade}`, 25, yPos);
              yPos += 5;
            });
            yPos += 5;

            if (yPos > pageHeight - 30) {
              pdf.addPage();
              yPos = 20;
            }
          });
        } else {
          pdf.setFontSize(10);
          pdf.text("  No academic records found.", 25, yPos);
          yPos += 10;
        }
        yPos += 5;
      }

      if (!section || section === "fees") {
        // Fee Section
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Fee Records", 20, yPos);
        yPos += 10;

        if (feeRecords && feeRecords.length > 0) {
          const totalFees = feeRecords.reduce((sum, f) => sum + Number(f.amount), 0);
          const totalPaid = feeRecords.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0);
          const balance = totalFees - totalPaid;

          pdf.setFontSize(11);
          pdf.text(`Total Fees: Rs. ${totalFees.toLocaleString()} | Paid: Rs. ${totalPaid.toLocaleString()} | Balance: Rs. ${balance.toLocaleString()}`, 20, yPos);
          yPos += 8;

          feeRecords.forEach((fee) => {
            pdf.setFontSize(10);
            const statusText = fee.status === "paid" ? "PAID" : fee.status === "partial" ? "PARTIAL" : "PENDING";
            pdf.text(`  ${fee.description}: Rs. ${Number(fee.amount).toLocaleString()} - ${statusText}`, 25, yPos);
            yPos += 5;

            if (yPos > pageHeight - 30) {
              pdf.addPage();
              yPos = 20;
            }
          });
        } else {
          pdf.setFontSize(10);
          pdf.text("  No fee records found.", 25, yPos);
          yPos += 10;
        }
        yPos += 5;
      }

      if (!section || section === "attendance") {
        // Attendance Section
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 20;
        }
        
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Attendance Summary", 20, yPos);
        yPos += 10;

        if (attendanceRecords && attendanceRecords.length > 0) {
          const present = attendanceRecords.filter((a) => a.status === "present").length;
          const absent = attendanceRecords.filter((a) => a.status === "absent").length;
          const late = attendanceRecords.filter((a) => a.status === "late").length;
          const total = attendanceRecords.length;
          const percentage = ((present / total) * 100).toFixed(1);

          pdf.setFontSize(11);
          pdf.text(`Total Days: ${total} | Present: ${present} | Absent: ${absent} | Late: ${late} | Attendance: ${percentage}%`, 20, yPos);
          yPos += 10;
        } else {
          pdf.setFontSize(10);
          pdf.text("  No attendance records found.", 25, yPos);
          yPos += 10;
        }
      }

      // Footer
      yPos = pageHeight - 15;
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated on ${format(new Date(), "PPpp")} | EduCore Student Information System`, pageWidth / 2, yPos, { align: "center" });

      // Save PDF
      const fileName = section 
        ? `${student.student_id}_${section}_report.pdf`
        : `${student.student_id}_complete_report.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (studentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Student not found</h2>
        <Button onClick={() => navigate("/students")} className="mt-4">
          Back to Students
        </Button>
      </div>
    );
  }

  // Calculate summaries
  const totalFees = feeRecords?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
  const totalPaid = feeRecords?.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0) || 0;
  const feeBalance = totalFees - totalPaid;
  const presentDays = attendanceRecords?.filter((a) => a.status === "present").length || 0;
  const totalDays = attendanceRecords?.length || 0;
  const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/students")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-muted-foreground font-mono">{student.student_id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => generatePDF()}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Full Report
          </Button>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={`${student.first_name} ${student.last_name}`}
                className="h-32 w-32 rounded-xl object-cover"
              />
            ) : (
              <div className="h-32 w-32 rounded-xl bg-primary/20 flex items-center justify-center">
                <User className="h-16 w-16 text-primary" />
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="font-medium">{student.class}{student.section ? `-${student.section}` : ""}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Badge className={student.status === "active" ? "bg-success text-success-foreground" : "bg-muted"}>
                  {student.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admission Date</p>
                <p className="font-medium">{format(new Date(student.admission_date), "PP")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Guardian</p>
                <p className="font-medium">{student.guardian_name}</p>
                <p className="text-sm text-muted-foreground">{student.guardian_phone}</p>
              </div>
            </div>

            {student.address && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{student.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Exams Taken</p>
              <p className="text-2xl font-bold">{new Set(examMarks?.map((m) => m.exam_id)).size || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${feeBalance > 0 ? "bg-destructive/20" : "bg-success/20"}`}>
              <CreditCard className={`h-6 w-6 ${feeBalance > 0 ? "text-destructive" : "text-success"}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fee Balance</p>
              <p className={`text-2xl font-bold ${feeBalance > 0 ? "text-destructive" : "text-success"}`}>
                Rs. {feeBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
              <ClipboardCheck className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Attendance</p>
              <p className="text-2xl font-bold">{attendancePercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="academic" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Attendance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Academic Records</h3>
              <Button variant="outline" size="sm" onClick={() => generatePDF("academic")} disabled={isGeneratingPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download Academic Report
              </Button>
            </div>

            {examMarks && examMarks.length > 0 ? (
              <div className="space-y-4">
                {/* Group marks by exam */}
                {Object.entries(
                  examMarks.reduce((acc, mark) => {
                    const examId = mark.exam_id;
                    if (!acc[examId]) acc[examId] = [];
                    acc[examId].push(mark);
                    return acc;
                  }, {} as Record<string, typeof examMarks>)
                ).map(([examId, marks]) => {
                  const examData = marks[0]?.exams;
                  const totalObtained = marks.reduce((sum, m) => sum + Number(m.marks_obtained), 0);
                  const totalPossible = marks.reduce((sum, m) => sum + Number(m.total_marks), 0);
                  const percentage = ((totalObtained / totalPossible) * 100).toFixed(1);
                  const grade = calculateGrade(totalObtained, totalPossible);

                  return (
                    <div key={examId} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{examData?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {examData?.exam_date && format(new Date(examData.exam_date), "PP")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{percentage}%</p>
                          <Badge className={grade.startsWith("A") ? "bg-success" : grade.startsWith("B") ? "bg-primary" : "bg-warning"}>
                            Grade: {grade}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {marks.map((mark) => (
                          <div key={mark.id} className="bg-secondary/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground truncate">{mark.subject}</p>
                            <p className="font-bold">
                              {mark.marks_obtained}/{mark.total_marks}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No academic records found
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fees" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Fee Records</h3>
              <Button variant="outline" size="sm" onClick={() => generatePDF("fees")} disabled={isGeneratingPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download Fee Report
              </Button>
            </div>

            {/* Fee Summary */}
            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-lg font-bold">Rs. {totalFees.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-lg font-bold text-success">Rs. {totalPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className={`text-lg font-bold ${feeBalance > 0 ? "text-destructive" : "text-success"}`}>
                  Rs. {feeBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {feeRecords && feeRecords.length > 0 ? (
              <div className="space-y-2">
                {feeRecords.map((fee) => (
                  <div key={fee.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">{fee.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {format(new Date(fee.due_date), "PP")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Rs. {Number(fee.amount).toLocaleString()}</p>
                      <Badge className={
                        fee.status === "paid" ? "bg-success" :
                        fee.status === "partial" ? "bg-warning" : "bg-destructive"
                      }>
                        {fee.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No fee records found
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Attendance Records</h3>
              <Button variant="outline" size="sm" onClick={() => generatePDF("attendance")} disabled={isGeneratingPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download Attendance Report
              </Button>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-secondary/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Days</p>
                <p className="text-lg font-bold">{totalDays}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-lg font-bold text-success">{presentDays}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-lg font-bold text-destructive">
                  {attendanceRecords?.filter((a) => a.status === "absent").length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Percentage</p>
                <p className="text-lg font-bold">{attendancePercentage}%</p>
              </div>
            </div>

            {attendanceRecords && attendanceRecords.length > 0 ? (
              <div className="grid grid-cols-7 gap-2">
                {attendanceRecords.slice(0, 28).map((record) => (
                  <div
                    key={record.id}
                    className={`p-2 rounded text-center text-xs ${
                      record.status === "present" ? "bg-success/20 text-success" :
                      record.status === "absent" ? "bg-destructive/20 text-destructive" :
                      "bg-warning/20 text-warning"
                    }`}
                    title={`${format(new Date(record.date), "PP")} - ${record.status}`}
                  >
                    {format(new Date(record.date), "dd")}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
