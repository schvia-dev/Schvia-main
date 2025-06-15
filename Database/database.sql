-- Enable required extension for GIST indexes
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ENUM types
CREATE TYPE weekday AS ENUM ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Leave');
CREATE TYPE admin_role AS ENUM ('college', 'department', 'class');
CREATE TYPE year_level AS ENUM ('1st', '2nd', '3rd', '4th');

-- Colleges
CREATE TABLE colleges (
  id SERIAL PRIMARY KEY,
  college_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  established TEXT DEFAULT 'N/A',
  website TEXT DEFAULT 'N/A',
  email TEXT DEFAULT 'N/A',
  phone TEXT DEFAULT 'N/A',
  address TEXT DEFAULT 'N/A',
  logo TEXT DEFAULT 'N/A'
);

-- Departments
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  dept_code TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(college_id, dept_code)
);

-- Faculties
CREATE TABLE faculties (
  id TEXT PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT NULL,
  dob DATE,
  qualification TEXT DEFAULT 'N/A',
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  department_id INTEGER REFERENCES departments(id) ON DELETE RESTRICT,
  role admin_role NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  contact_number TEXT DEFAULT 'N/A',
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (role = 'college' AND department_id IS NULL) OR
    (role IN ('department', 'class') AND department_id IS NOT NULL)
  )
);

-- Batches
CREATE TABLE batches (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  batch_year INTEGER NOT NULL CHECK (batch_year >= 2000 AND batch_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 4),
  current_year year_level NOT NULL,
  current_semester SMALLINT NOT NULL CHECK (current_semester BETWEEN 1 AND 8),
  batch_code TEXT NOT NULL,
  room_number TEXT DEFAULT 'N/A',
  faculty_incharge TEXT REFERENCES faculties(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  UNIQUE(department_id, batch_year, batch_code)
);

-- Students
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone TEXT DEFAULT 'N/A',
  address TEXT DEFAULT 'N/A',
  pan_number TEXT DEFAULT 'N/A',
  aadhar_number TEXT DEFAULT 'N/A',
  father_phone TEXT DEFAULT 'N/A',
  mother_phone TEXT DEFAULT 'N/A',
  current_year year_level NOT NULL,
  current_semester SMALLINT NOT NULL CHECK (current_semester BETWEEN 1 AND 8),
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  name TEXT NOT NULL,
  credits SMALLINT NOT NULL CHECK (credits >= 0),
  UNIQUE(department_id, subject_code)
);

-- Batch-Semester-Subjects
CREATE TABLE batch_semester_subjects (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  semester_no SMALLINT NOT NULL CHECK (semester_no BETWEEN 1 AND 8),
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id TEXT NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  UNIQUE(batch_id, semester_no, subject_id)
);

-- Periods
CREATE TABLE periods (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  semester_no SMALLINT NOT NULL CHECK (semester_no BETWEEN 1 AND 8),
  time_slot tsrange NOT NULL,
  name TEXT,
  EXCLUDE USING gist (batch_id WITH =, semester_no WITH =, time_slot WITH &&),
  UNIQUE(department_id, batch_id, semester_no, name)
);

-- Timetable Entries
CREATE TABLE timetable_entries (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  semester_no SMALLINT NOT NULL CHECK (semester_no BETWEEN 1 AND 8),
  weekday weekday NOT NULL,
  period_id INTEGER NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  faculty_id TEXT NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  UNIQUE(batch_id, semester_no, weekday, period_id)
);

-- Attendance Sessions
CREATE TABLE attendance_sessions (
  id SERIAL PRIMARY KEY,
  timetable_id INTEGER NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  UNIQUE(timetable_id, session_date)
);

-- Attendance Records
CREATE TABLE attendance_records (
  session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status attendance_status NOT NULL,
  PRIMARY KEY (session_id, student_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Semester Subject Results
CREATE TABLE student_semester_results (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  batch_semester_subject_id INTEGER NOT NULL REFERENCES batch_semester_subjects(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  marks INTEGER CHECK (marks BETWEEN 0 AND 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, batch_semester_subject_id)
);

-- Posts
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  creator_id TEXT NOT NULL,
  creator_type TEXT NOT NULL CHECK (creator_type IN ('admin', 'faculty')),
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[],
  links TEXT[],
  visibility_type TEXT NOT NULL CHECK (visibility_type IN ('batch', 'department', 'college')),
  visibility_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Tags
CREATE TABLE post_tags (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tagged_id TEXT NOT NULL,
  tagged_type TEXT NOT NULL CHECK (tagged_type IN ('student', 'faculty')),
  UNIQUE(post_id, tagged_id, tagged_type)
);

-- Assignments
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  batch_semester_subject_id INTEGER NOT NULL REFERENCES batch_semester_subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  links TEXT[],
  files TEXT[],
  issued_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deadline TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (deadline > issued_date)
);

-- Assignment Submissions
CREATE TABLE assignment_submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  screenshots TEXT[],
  files TEXT[],
  links TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assignment_id, student_id)
);

-- Resources
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  batch_semester_subject_id INTEGER NOT NULL REFERENCES batch_semester_subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  links TEXT[],
  files TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to validate timetable_entries
CREATE OR REPLACE FUNCTION validate_timetable_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate period_id
  IF NOT EXISTS (
    SELECT 1 FROM periods p
    WHERE p.id = NEW.period_id
    AND p.batch_id = NEW.batch_id
    AND p.semester_no = NEW.semester_no
  ) THEN
    RAISE EXCEPTION 'Invalid period_id: period does not match batch_id and semester_no';
  END IF;

  -- Validate subject_id and faculty_id
  IF NOT EXISTS (
    SELECT 1
    FROM batch_semester_subjects bss
    WHERE bss.batch_id = NEW.batch_id
    AND bss.semester_no = NEW.semester_no
    AND bss.subject_id = NEW.subject_id
    AND bss.faculty_id = NEW.faculty_id
  ) THEN
    RAISE EXCEPTION 'Invalid subject_id or faculty_id: not assigned to this batch and semester';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for updated_at
CREATE TRIGGER trigger_update_updated_at_admins
BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_faculties
BEFORE UPDATE ON faculties
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_students
BEFORE UPDATE ON students
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_attendance_records
BEFORE UPDATE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_student_semester_results
BEFORE UPDATE ON student_semester_results
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_posts
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_assignments
BEFORE UPDATE ON assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_assignment_submissions
BEFORE UPDATE ON assignment_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_updated_at_resources
BEFORE UPDATE ON resources
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Apply trigger for timetable_entries validation
CREATE TRIGGER trigger_validate_timetable_entry
BEFORE INSERT OR UPDATE ON timetable_entries
FOR EACH ROW EXECUTE FUNCTION validate_timetable_entry();

-- Indexes
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_college ON admins(college_id);
CREATE INDEX idx_admins_department ON admins(department_id);
CREATE INDEX idx_batches_department ON batches(department_id);
CREATE INDEX idx_batches_faculty ON batches(faculty_incharge);
CREATE INDEX idx_students_batch ON students(batch_id);
CREATE INDEX idx_subjects_department ON subjects(department_id);
CREATE INDEX idx_batch_semester_subjects_batch ON batch_semester_subjects(batch_id);
CREATE INDEX idx_batch_semester_subjects_faculty ON batch_semester_subjects(faculty_id);
CREATE INDEX idx_periods_batch_semester ON periods(batch_id, semester_no);
CREATE INDEX idx_timetable_batch ON timetable_entries(batch_id);
CREATE INDEX idx_timetable_faculty ON timetable_entries(faculty_id);
CREATE INDEX idx_timetable_batch_semester ON timetable_entries(batch_id, semester_no);
CREATE INDEX idx_attendance_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_results_student ON student_semester_results(student_id);
CREATE INDEX idx_posts_creator ON posts(creator_id, creator_type);
CREATE INDEX idx_posts_visibility ON posts(visibility_type, visibility_id);
CREATE INDEX idx_assignments_subject ON assignments(batch_semester_subject_id);
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_resources_subject ON resources(batch_semester_subject_id);

-- Additional index for timetable_entries validation
CREATE INDEX idx_batch_semester_subjects_validation ON batch_semester_subjects(batch_id, semester_no, subject_id, faculty_id);