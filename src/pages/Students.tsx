import { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Student {
  id: string;
  studentId: string;
  name: string;
  class: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  status: "active" | "inactive" | "alumni";
  feeStatus: "paid" | "pending" | "overdue";
  admissionDate: string;
}

const mockStudents: Student[] = [
  {
    id: "1",
    studentId: "INST-2026-0001",
    name: "Ahmed Hassan",
    class: "10",
    section: "A",
    guardianName: "Muhammad Hassan",
    guardianPhone: "+92 300 1234567",
    status: "active",
    feeStatus: "paid",
    admissionDate: "2024-04-15",
  },
  {
    id: "2",
    studentId: "INST-2026-0002",
    name: "Sara Ahmed",
    class: "9",
    section: "B",
    guardianName: "Tahir Ahmed",
    guardianPhone: "+92 321 9876543",
    status: "active",
    feeStatus: "pending",
    admissionDate: "2024-04-18",
  },
  {
    id: "3",
    studentId: "INST-2026-0003",
    name: "Ali Raza",
    class: "8",
    section: "A",
    guardianName: "Raza Khan",
    guardianPhone: "+92 333 5556667",
    status: "active",
    feeStatus: "overdue",
    admissionDate: "2024-05-01",
  },
  {
    id: "4",
    studentId: "INST-2026-0004",
    name: "Fatima Khan",
    class: "10",
    section: "B",
    guardianName: "Imran Khan",
    guardianPhone: "+92 345 1112223",
    status: "active",
    feeStatus: "paid",
    admissionDate: "2024-05-10",
  },
  {
    id: "5",
    studentId: "INST-2026-0005",
    name: "Usman Ali",
    class: "7",
    section: "C",
    guardianName: "Ali Ahmed",
    guardianPhone: "+92 312 4445556",
    status: "inactive",
    feeStatus: "pending",
    admissionDate: "2024-03-20",
  },
];

const statusColors = {
  active: "status-badge bg-success/20 text-success",
  inactive: "status-badge bg-muted text-muted-foreground",
  alumni: "status-badge bg-primary/20 text-primary",
};

const feeStatusColors = {
  paid: "status-badge status-paid",
  pending: "status-badge status-pending",
  overdue: "status-badge status-overdue",
};

export default function Students() {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.guardianPhone.includes(searchQuery);

    const matchesClass =
      classFilter === "all" || student.class === classFilter;

    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

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
        <Button className="gap-2">
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredStudents.length}</span> of{" "}
          <span className="font-medium text-foreground">{mockStudents.length}</span> students
        </p>
      </div>

      {/* Students Table */}
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
                <th>Fee Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="cursor-pointer">
                  <td>
                    <span className="font-mono text-sm text-primary">
                      {student.studentId}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </td>
                  <td>
                    {student.class}-{student.section}
                  </td>
                  <td>
                    <div className="space-y-1">
                      <p className="text-sm">{student.guardianName}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {student.guardianPhone}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={statusColors[student.status]}>
                      {student.status}
                    </span>
                  </td>
                  <td>
                    <span className={feeStatusColors[student.feeStatus]}>
                      {student.feeStatus}
                    </span>
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2">
                          <Eye className="h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit className="h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Phone className="h-4 w-4" />
                          Call Guardian
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Mail className="h-4 w-4" />
                          Send Notice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page 1 of 1</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}