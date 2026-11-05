CREATE TABLE IF NOT EXISTS attendance_marks (
 institution_key text NOT NULL, visitor_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(institution_key,visitor_id)
);
CREATE TABLE IF NOT EXISTS attendance_limits (
 bucket text PRIMARY KEY, window_start timestamptz NOT NULL, requests integer NOT NULL
);
