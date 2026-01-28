import { useState, useEffect, useRef } from "react";
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
import { useClasses } from "@/hooks/useClasses";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Camera, Loader2, X, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const studentSchema = z.object({
  student_id: z.string().min(1, "Student ID is required").max(50),
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

interface DocumentFile {
  id?: string;
  name: string;
  type: string;
  file?: File;
  path?: string;
}

export function StudentFormDialog({ open, onOpenChange, student }: StudentFormDialogProps) {
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const { data: classes } = useClasses();
  const { toast } = useToast();
  const isEditing = !!student;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

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
        student_id: student.student_id,
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
      // Load existing photo
      if (student.photo_url) {
        setPhotoPreview(student.photo_url);
      }
      // Load existing documents
      loadDocuments(student.id);
    } else {
      reset({
        status: "active",
        student_id: generateStudentId(),
        first_name: "",
        last_name: "",
        class: "",
        guardian_name: "",
        guardian_phone: "",
      });
      setPhotoPreview(null);
      setDocuments([]);
    }
  }, [student, reset, open]);

  const generateStudentId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `STU-${year}-${random}`;
  };

  const loadDocuments = async (studentId: string) => {
    const { data, error } = await supabase
      .from("student_documents")
      .select("*")
      .eq("student_id", studentId);
    
    if (!error && data) {
      setDocuments(data.map(doc => ({
        id: doc.id,
        name: doc.file_name,
        type: doc.document_type,
        path: doc.file_path,
      })));
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "Photo must be less than 5MB", variant: "destructive" });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newDocs: DocumentFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: "Error", description: `${file.name} is too large (max 10MB)`, variant: "destructive" });
          continue;
        }
        newDocs.push({ name: file.name, type: "Document", file });
      }
      setDocuments([...documents, ...newDocs]);
    }
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const uploadPhoto = async (studentId: string): Promise<string | null> => {
    if (!photoFile) return student?.photo_url || null;

    const ext = photoFile.name.split(".").pop();
    const path = `photos/${studentId}.${ext}`;

    const { error } = await supabase.storage
      .from("student-files")
      .upload(path, photoFile, { upsert: true });

    if (error) {
      console.error("Photo upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from("student-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadDocuments = async (studentId: string) => {
    for (const doc of documents) {
      if (doc.file) {
        const ext = doc.file.name.split(".").pop();
        const path = `documents/${studentId}/${Date.now()}-${doc.name}`;

        const { error: uploadError } = await supabase.storage
          .from("student-files")
          .upload(path, doc.file);

        if (uploadError) {
          console.error("Document upload error:", uploadError);
          continue;
        }

        await supabase.from("student_documents").insert({
          student_id: studentId,
          document_type: doc.type,
          file_name: doc.name,
          file_path: path,
          file_size: doc.file.size,
        });
      }
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    try {
      let resultId = student?.id;

      if (isEditing && student) {
        // Upload photo first
        const photoUrl = await uploadPhoto(student.id);
        
        await updateStudent.mutateAsync({ 
          id: student.id, 
          data: { ...data, photo_url: photoUrl } 
        });
        
        // Upload new documents
        await uploadDocuments(student.id);
      } else {
        // Create student first - ensure required fields are present
        const result = await createStudent.mutateAsync({
          student_id: data.student_id,
          first_name: data.first_name,
          last_name: data.last_name,
          class: data.class,
          guardian_name: data.guardian_name,
          guardian_phone: data.guardian_phone,
          section: data.section,
          guardian_relation: data.guardian_relation,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          phone: data.phone,
          address: data.address,
          notes: data.notes,
          status: data.status,
        });
        
        resultId = result.id;
        
        // Upload photo
        if (photoFile && resultId) {
          const photoUrl = await uploadPhoto(resultId);
          if (photoUrl) {
            await supabase.from("students").update({ photo_url: photoUrl }).eq("id", resultId);
          }
        }
        
        // Upload documents
        if (resultId) {
          await uploadDocuments(resultId);
        }
      }
      
      onOpenChange(false);
      reset();
      setPhotoFile(null);
      setPhotoPreview(null);
      setDocuments([]);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const classValue = watch("class");
  const genderValue = watch("gender");
  const statusValue = watch("status");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the student's information below."
              : "Fill in the details to enroll a new student."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo Upload */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div 
                className="relative h-32 w-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden bg-secondary/30"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Student" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="h-8 w-8 mb-2" />
                    <span className="text-xs">Add Photo</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {/* Student ID */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID *</Label>
                <Input
                  id="student_id"
                  {...register("student_id")}
                  placeholder="e.g., STU-2025-0001"
                />
                {errors.student_id && (
                  <p className="text-sm text-destructive">{errors.student_id.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Unique identifier for this student. Can be edited.
                </p>
              </div>
            </div>
          </div>

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
                    {classes?.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
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

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Documents
            </h3>
            <div className="space-y-3">
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => docInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload documents (Results, Certificates, etc.)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Images up to 10MB each
                </p>
              </div>
              <input
                ref={docInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleDocumentSelect}
                className="hidden"
              />

              {documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeDocument(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Student"
              ) : (
                "Add Student"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
