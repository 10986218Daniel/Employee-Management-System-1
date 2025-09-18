-- Add approval fields to attendance and grant HR/Admin update rights

-- Add columns if they don't exist
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Allow HR and Admin to update attendance for approval workflow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'attendance' AND policyname = 'HR and Admin can update all attendance'
  ) THEN
    CREATE POLICY "HR and Admin can update all attendance" ON public.attendance FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('hr', 'admin')
      )
    );
  END IF;
END $$;

-- Ensure attendance table is part of realtime publication already (idempotent)
ALTER TABLE public.attendance REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;

