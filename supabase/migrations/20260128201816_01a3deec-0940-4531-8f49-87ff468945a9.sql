-- Create classes table for custom class management
CREATE TABLE public.classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated staff can view classes"
ON public.classes FOR SELECT
USING (is_authenticated_staff_or_admin());

CREATE POLICY "Master admin can manage classes"
ON public.classes FOR ALL
USING (is_master_admin())
WITH CHECK (is_master_admin());

-- Create student_documents table for storing document references
CREATE TABLE public.student_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_documents
CREATE POLICY "Authenticated staff can view student documents"
ON public.student_documents FOR SELECT
USING (is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can create student documents"
ON public.student_documents FOR INSERT
WITH CHECK (is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can update student documents"
ON public.student_documents FOR UPDATE
USING (is_authenticated_staff_or_admin())
WITH CHECK (is_authenticated_staff_or_admin());

CREATE POLICY "Only master admin can delete student documents"
ON public.student_documents FOR DELETE
USING (is_master_admin());

-- Create storage bucket for student files
INSERT INTO storage.buckets (id, name, public) VALUES ('student-files', 'student-files', true);

-- Storage policies for student files bucket
CREATE POLICY "Authenticated users can view student files"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-files' AND is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated users can upload student files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'student-files' AND is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated users can update student files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'student-files' AND is_authenticated_staff_or_admin())
WITH CHECK (bucket_id = 'student-files' AND is_authenticated_staff_or_admin());

CREATE POLICY "Only master admin can delete student files"
ON storage.objects FOR DELETE
USING (bucket_id = 'student-files' AND is_master_admin());

-- Remove auto-generate trigger for student_id to allow manual entry
DROP TRIGGER IF EXISTS generate_student_id_trigger ON public.students;

-- Insert default classes
INSERT INTO public.classes (name, description, sort_order) VALUES
('Nursery', 'Pre-school level', 1),
('KG', 'Kindergarten', 2),
('Class 1', 'First Grade', 3),
('Class 2', 'Second Grade', 4),
('Class 3', 'Third Grade', 5),
('Class 4', 'Fourth Grade', 6),
('Class 5', 'Fifth Grade', 7),
('Class 6', 'Sixth Grade', 8),
('Class 7', 'Seventh Grade', 9),
('Class 8', 'Eighth Grade', 10),
('Class 9', 'Ninth Grade', 11),
('Class 10', 'Tenth Grade', 12),
('Class 11', 'Eleventh Grade', 13),
('Class 12', 'Twelfth Grade', 14);