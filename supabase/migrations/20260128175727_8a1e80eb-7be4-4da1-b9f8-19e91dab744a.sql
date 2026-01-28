-- =============================================
-- EDUCORE INTERNAL - COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. Create Role Enum
CREATE TYPE public.app_role AS ENUM ('master_admin', 'staff');

-- 2. Create user_roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create students table with auto-generated ID
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    phone TEXT,
    guardian_name TEXT NOT NULL,
    guardian_phone TEXT NOT NULL,
    guardian_relation TEXT,
    class TEXT NOT NULL,
    section TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'alumni', 'left')),
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    photo_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create fee_structures table
CREATE TABLE public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    fee_type TEXT NOT NULL CHECK (fee_type IN ('tuition', 'transport', 'lab', 'exam', 'admission', 'other')),
    amount DECIMAL(12, 2) NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'yearly')),
    class TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create fees table (invoices/payments)
CREATE TABLE public.fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    fee_structure_id UUID REFERENCES public.fee_structures(id),
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'waived')),
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    paid_date DATE,
    receipt_number TEXT UNIQUE,
    payment_method TEXT CHECK (payment_method IN ('cash', 'bank', 'online', 'cheque')),
    month_year TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create attendance table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave', 'late')),
    class TEXT NOT NULL,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (student_id, date)
);

-- 8. Create exams table
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    exam_date DATE NOT NULL,
    class TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    total_marks INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Create exam_marks table
CREATE TABLE public.exam_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    marks_obtained DECIMAL(5, 2) NOT NULL,
    total_marks INTEGER NOT NULL DEFAULT 100,
    grade TEXT,
    remarks TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (exam_id, student_id, subject)
);

-- 10. Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT
);

-- =============================================
-- SECURITY DEFINER FUNCTIONS (AVOID RLS RECURSION)
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Check if user is master admin
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'master_admin')
$$;

-- Check if user is staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'staff')
$$;

-- Check if user is authenticated (has any role)
CREATE OR REPLACE FUNCTION public.is_authenticated_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
    )
$$;

-- Get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- =============================================
-- AUTO-GENERATE STUDENT ID FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_year TEXT;
    next_sequence INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(student_id FROM 'INST-' || current_year || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO next_sequence
    FROM public.students
    WHERE student_id LIKE 'INST-' || current_year || '-%';
    
    NEW.student_id := 'INST-' || current_year || '-' || LPAD(next_sequence::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_student_id
    BEFORE INSERT ON public.students
    FOR EACH ROW
    WHEN (NEW.student_id IS NULL OR NEW.student_id = '')
    EXECUTE FUNCTION public.generate_student_id();

-- =============================================
-- AUTO-GENERATE RECEIPT NUMBER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_sequence INTEGER;
BEGIN
    IF NEW.status = 'paid' AND (OLD IS NULL OR OLD.status != 'paid') THEN
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(receipt_number FROM 'RCP-(\d+)') AS INTEGER)
        ), 0) + 1
        INTO next_sequence
        FROM public.fees
        WHERE receipt_number IS NOT NULL;
        
        NEW.receipt_number := 'RCP-' || LPAD(next_sequence::TEXT, 6, '0');
        NEW.paid_date := CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_generate_receipt_number
    BEFORE INSERT OR UPDATE ON public.fees
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_receipt_number();

-- =============================================
-- AUDIT LOGGING TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.audit_log_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email_val TEXT;
BEGIN
    -- Get user email from auth.users if available
    SELECT email INTO user_email_val
    FROM auth.users
    WHERE id = auth.uid();

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, new_data)
        VALUES (auth.uid(), user_email_val, 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, old_data, new_data)
        VALUES (auth.uid(), user_email_val, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (user_id, user_email, action, table_name, record_id, old_data)
        VALUES (auth.uid(), user_email_val, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Attach audit triggers to all main tables
CREATE TRIGGER audit_students AFTER INSERT OR UPDATE OR DELETE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_func();

CREATE TRIGGER audit_fees AFTER INSERT OR UPDATE OR DELETE ON public.fees
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_func();

CREATE TRIGGER audit_attendance AFTER INSERT OR UPDATE OR DELETE ON public.attendance
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_func();

CREATE TRIGGER audit_exams AFTER INSERT OR UPDATE OR DELETE ON public.exams
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_func();

CREATE TRIGGER audit_exam_marks AFTER INSERT OR UPDATE OR DELETE ON public.exam_marks
    FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_func();

-- =============================================
-- UPDATE TIMESTAMP TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fees_updated_at
    BEFORE UPDATE ON public.fees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- USER_ROLES policies
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (user_id = auth.uid() OR public.is_master_admin());

CREATE POLICY "Only master admin can manage roles"
    ON public.user_roles FOR ALL
    USING (public.is_master_admin())
    WITH CHECK (public.is_master_admin());

-- PROFILES policies
CREATE POLICY "Users can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.is_authenticated_staff_or_admin());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Master admin can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_master_admin())
    WITH CHECK (public.is_master_admin());

-- STUDENTS policies
CREATE POLICY "Authenticated staff can view students"
    ON public.students FOR SELECT
    TO authenticated
    USING (public.is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can create students"
    ON public.students FOR INSERT
    TO authenticated
    WITH CHECK (public.is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can update students"
    ON public.students FOR UPDATE
    TO authenticated
    USING (public.is_authenticated_staff_or_admin())
    WITH CHECK (public.is_authenticated_staff_or_admin());

CREATE POLICY "Only master admin can delete students"
    ON public.students FOR DELETE
    TO authenticated
    USING (public.is_master_admin());

-- FEE_STRUCTURES policies
CREATE POLICY "Authenticated staff can view fee structures"
    ON public.fee_structures FOR SELECT
    TO authenticated
    USING (public.is_authenticated_staff_or_admin());

CREATE POLICY "Only master admin can manage fee structures"
    ON public.fee_structures FOR ALL
    TO authenticated
    USING (public.is_master_admin())
    WITH CHECK (public.is_master_admin());

-- FEES policies
CREATE POLICY "Authenticated staff can view fees"
    ON public.fees FOR SELECT
    TO authenticated
    USING (public.is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can create fees"
    ON public.fees FOR INSERT
    TO authenticated
    WITH CHECK (public.is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can update fees"
    ON public.fees FOR UPDATE
    TO authenticated
    USING (public.is_authenticated_staff_or_admin())
    WITH CHECK (public.is_authenticated_staff_or_admin());

CREATE POLICY "Only master admin can delete fees"
    ON public.fees FOR DELETE
    TO authenticated
    USING (public.is_master_admin());

-- ATTENDANCE policies
CREATE POLICY "Authenticated staff can view attendance"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (public.is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can create attendance"
    ON public.attendance FOR INSERT
    TO authenticated
    WITH CHECK (public.is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can update attendance"
    ON public.attendance FOR UPDATE
    TO authenticated
    USING (public.is_authenticated_staff_or_admin())
    WITH CHECK (public.is_authenticated_staff_or_admin());

CREATE POLICY "Only master admin can delete attendance"
    ON public.attendance FOR DELETE
    TO authenticated
    USING (public.is_master_admin());

-- EXAMS policies
CREATE POLICY "Authenticated staff can view exams"
    ON public.exams FOR SELECT
    TO authenticated
    USING (public.is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can create exams"
    ON public.exams FOR INSERT
    TO authenticated
    WITH CHECK (public.is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can update exams"
    ON public.exams FOR UPDATE
    TO authenticated
    USING (public.is_authenticated_staff_or_admin())
    WITH CHECK (public.is_authenticated_staff_or_admin());

CREATE POLICY "Only master admin can delete exams"
    ON public.exams FOR DELETE
    TO authenticated
    USING (public.is_master_admin());

-- EXAM_MARKS policies
CREATE POLICY "Authenticated staff can view exam marks"
    ON public.exam_marks FOR SELECT
    TO authenticated
    USING (public.is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can create exam marks"
    ON public.exam_marks FOR INSERT
    TO authenticated
    WITH CHECK (public.is_authenticated_staff_or_admin());

CREATE POLICY "Authenticated staff can update exam marks"
    ON public.exam_marks FOR UPDATE
    TO authenticated
    USING (public.is_authenticated_staff_or_admin())
    WITH CHECK (public.is_authenticated_staff_or_admin());

CREATE POLICY "Only master admin can delete exam marks"
    ON public.exam_marks FOR DELETE
    TO authenticated
    USING (public.is_master_admin());

-- AUDIT_LOGS policies (read-only for master admin)
CREATE POLICY "Only master admin can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_master_admin());

-- No INSERT/UPDATE/DELETE policies - only triggers can write to audit_logs

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_students_student_id ON public.students(student_id);
CREATE INDEX idx_students_class ON public.students(class);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_students_guardian_phone ON public.students(guardian_phone);
CREATE INDEX idx_students_name ON public.students(first_name, last_name);

CREATE INDEX idx_fees_student_id ON public.fees(student_id);
CREATE INDEX idx_fees_status ON public.fees(status);
CREATE INDEX idx_fees_due_date ON public.fees(due_date);
CREATE INDEX idx_fees_month_year ON public.fees(month_year);

CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_class ON public.attendance(class);

CREATE INDEX idx_exams_class ON public.exams(class);
CREATE INDEX idx_exam_marks_exam_id ON public.exam_marks(exam_id);
CREATE INDEX idx_exam_marks_student_id ON public.exam_marks(student_id);

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);