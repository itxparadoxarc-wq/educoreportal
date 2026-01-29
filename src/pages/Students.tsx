import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Phone,
  Trash2,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStudents, useDeleteStudent, Student } from "@/hooks/useStudents";
import { StudentFormDialog } from "@/components/students/StudentFormDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useClasses } from "@/hooks/useClasses";

const statusColors: Record<string, string> = {
  active: "status-badge bg-success/20 text-success",
  inactive: "status-badge bg-muted text-muted-foreground",
  alumni: "status-badge bg-primary/20 text-primary",
  left: "status-badge bg-destructive/20 text-destructive",
};

export default function Students() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const { isMasterAdmin } = useAuth();
  const { data: classes } = useClasses();
  const { data: students, isLoading, error } = useStudents({
    class: classFilter,
    status: statusFilter,
    search: searchQuery,
  });
  const deleteStudent = useDeleteStudent();

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleViewProfile = (student: Student) => {
    navigate(`/students/${student.id}`);
  };

  const handleDelete = async () => {
    if (deletingStudent) {
      await deleteStudent.mutateAsync(deletingStudent.id);
      setDeletingStudent(null);
    }
  };

  const handleExport = () => {
    if (!students) return;
    const csv = [
      ["Student ID", "Name", "Class", "Section", "Guardian", "Phone", "Status"],
      ...students.map((s) => [
        s.student_id,
        `${s.first_name} ${s.last_name}`,
        s.class,
        s.section || "",
        s.guardian_name,
        s.guardian_phone,
        s.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">
            Manage student records, profiles, and documents
          </p>
        </div>
        <Button className="gap-2" onClick={() => {
          setEditingStudent(null);
          setIsFormOpen(true);
        }}>
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Omni-Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Student ID, Name, or Phone Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="left">Left</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{students?.length || 0}</span> students
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading students...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center">
          <p className="text-destructive">Error loading students: {error.message}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && students?.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || classFilter !== "all" || statusFilter !== "all"
              ? "No students match your search criteria."
              : "Get started by adding your first student."}
          </p>
          <Button onClick={() => setIsFormOpen(true)}>Add Student</Button>
        </div>
      )}

      {/* Students Table */}
      {!isLoading && !error && students && students.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Guardian</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr 
                    key={student.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewProfile(student)}
                  >
                    <td>
                      <span className="font-mono text-sm text-primary">
                        {student.student_id}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {student.photo_url ? (
                          <img 
                            src={student.photo_url} 
                            alt={`${student.first_name} ${student.last_name}`}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {student.first_name[0]}
                              {student.last_name[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">
                            {student.first_name} {student.last_name}
                          </span>
                          {student.gender && (
                            <p className="text-xs text-muted-foreground capitalize">
                              {student.gender}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {student.class}
                      {student.section && `-${student.section}`}
                    </td>
                    <td>
                      <div className="space-y-1">
                        <p className="text-sm">{student.guardian_name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {student.guardian_phone}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={statusColors[student.status] || statusColors.active}>
                        {student.status}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleViewProfile(student)}>
                            <Eye className="h-4 w-4" />
                            View Profile & Report
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleEdit(student)}>
                            <Edit className="h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2"
                            onClick={() => window.open(`tel:${student.guardian_phone}`)}
                          >
                            <Phone className="h-4 w-4" />
                            Call Guardian
                          </DropdownMenuItem>
                          {isMasterAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 text-destructive"
                                onClick={() => setDeletingStudent(student)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Form Dialog */}
      <StudentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        student={editingStudent}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingStudent} onOpenChange={() => setDeletingStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingStudent?.first_name}{" "}
              {deletingStudent?.last_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
