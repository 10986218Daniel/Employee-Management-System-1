-- Add missing request types to the enum
ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'equipment';
ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'travel';
ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'other';
ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'salary';

-- Update the request_status enum to include 'in_review' if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'in_review' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'request_status')) THEN
    ALTER TYPE request_status ADD VALUE 'in_review';
  END IF;
END $$;
