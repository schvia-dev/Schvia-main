-- STEP 1: DROP ALL TRIGGERS (manually for each table)
DROP TRIGGER IF EXISTS trigger_update_updated_at_admins ON admins;
DROP TRIGGER IF EXISTS trigger_update_updated_at_faculties ON faculties;
DROP TRIGGER IF EXISTS trigger_update_updated_at_students ON students;
DROP TRIGGER IF EXISTS trigger_update_updated_at_attendance_records ON attendance_records;
DROP TRIGGER IF EXISTS trigger_update_updated_at_student_semester_results ON student_semester_results;
DROP TRIGGER IF EXISTS trigger_update_updated_at_posts ON posts;
DROP TRIGGER IF EXISTS trigger_update_updated_at_assignments ON assignments;
DROP TRIGGER IF EXISTS trigger_update_updated_at_assignment_submissions ON assignment_submissions;
DROP TRIGGER IF EXISTS trigger_update_updated_at_resources ON resources;

-- STEP 2: DROP TRIGGER FUNCTION
DROP FUNCTION IF EXISTS update_updated_at CASCADE;

-- STEP 3: DROP TABLES (in dependency-safe reverse order)
DROP TABLE IF EXISTS post_tags CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS timetable_entries CASCADE;
DROP TABLE IF EXISTS periods CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS student_semester_results CASCADE;
DROP TABLE IF EXISTS batch_semester_subjects CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS faculties CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS colleges CASCADE;

-- STEP 4: DROP ENUM TYPES
DROP TYPE IF EXISTS weekday CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS admin_role CASCADE;
DROP TYPE IF EXISTS year_level CASCADE;

-- STEP 5: DROP EXTENSION (OPTIONAL – only if you're sure it's not used elsewhere)
DROP EXTENSION IF EXISTS btree_gist;


-- Example manual index removal (if needed)
DROP INDEX IF EXISTS idx_admins_role;
DROP INDEX IF EXISTS idx_admins_college;
-- ... and so on for all created indexes ...
