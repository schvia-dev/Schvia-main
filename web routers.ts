import express from 'express';
import { Router, Request, Response } from 'express';
import { pool } from '../../db';
import { sendMail } from '../../mailer';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcrypt');

////////////////////////////////////////////////////////////////////////////////
// Helper: ensure an entity is active
////////////////////////////////////////////////////////////////////////////////
function activeClause(alias: string) {
  return `${alias}.is_active = TRUE`;
}

////////////////////////////////////////////////////////////////////////////////
// 1) HEALTHCHECK
////////////////////////////////////////////////////////////////////////////////
router.get('/', (req, res) => {
  res.send('{"message":"Hello from React + Express + TS + PostgreSQL!"}');
});

////////////////////////////////////////////////////////////////////////////////
// 2) ADMIN LOGIN (only active admins)
////////////////////////////////////////////////////////////////////////////////
router.post('/adminlogin', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and Password are required.' });

  try {
    const result = await pool.query(
      `
      SELECT 
        a.id, a.username, a.role,
        COALESCE(a.college_id, d.college_id)   AS college_id,
        a.department_id,
        COALESCE(c.name, c2.name)              AS college_name,
        COALESCE(c.college_code, c2.college_code) AS college_code,
        d.name                                 AS department_name,
        d.dept_code                            AS department_code
      FROM admins a
      LEFT JOIN colleges c 
        ON a.college_id = c.id AND ${activeClause('c')}
      LEFT JOIN departments d 
        ON a.department_id = d.id AND ${activeClause('d')}
      LEFT JOIN colleges c2 
        ON d.college_id = c2.id AND ${activeClause('c2')}
      WHERE a.username = $1
        AND a.password = $2
        AND ${activeClause('a')}
      ;
      `,
      [username, password]
    );

    if (result.rowCount === 0)
      return res.status(401).json({ message: 'Invalid username or password.' });

    const admin = result.rows[0];
    return res.json({
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        college_id: admin.college_id,
        college_name: admin.college_name,
        college_code: admin.college_code,
        department_id: admin.department_id,
        department_name: admin.department_name,
        department_code: admin.department_code,
      },
      message: 'Login successful.',
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 3) FETCH COLLEGE DETAILS (only active college)
////////////////////////////////////////////////////////////////////////////////
router.post('/FetchCollegeDetails', async (req, res) => {
  const { college_id } = req.body;
  if (!college_id) return res.status(400).json({ message: 'college_id is required.' });

  try {
    const result = await pool.query(
      `
      SELECT id, college_code, name, location, established,
             email AS contact_email, phone AS contact_phone, website
      FROM colleges
      WHERE id = $1
        AND ${activeClause('colleges')}
      `,
      [college_id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: 'College not found or inactive.' });

    return res.json({ college: result.rows[0] });
  } catch (error) {
    console.error('Error fetching college details:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 4) UPDATE COLLEGE (only active college, only college admins)
////////////////////////////////////////////////////////////////////////////////
router.post('/updateCollegeDetails', async (req, res) => {
  const { id, name, location, established, contact_email, contact_phone, website, role } = req.body;
  if (role !== 'college')
    return res.status(403).json({ message: 'Unauthorized. Only college admins can edit.' });

  try {
    const result = await pool.query(
      `
      UPDATE colleges
      SET name       = $1,
          location   = $2,
          established= $3,
          email      = $4,
          phone      = $5,
          website    = $6
      WHERE id = $7
        AND ${activeClause('colleges')}
      RETURNING *;
      `,
      [name, location, established, contact_email, contact_phone, website, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: 'College not found or inactive.' });

    return res.json({ success: true, college: result.rows[0] });
  } catch (error) {
    console.error('Error updating college details:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 5) FETCH DEPARTMENTS (only active college & departments)
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchdepartments', async (req, res) => {
  const search = (req.query.search || '').toString().trim();
  const collegeId = Number(req.query.college_id);
  if (isNaN(collegeId))
    return res.status(400).json({ message: 'Missing or invalid college_id' });

  try {
    let sql = `
      SELECT 
        d.id, d.dept_code, d.name,
        COUNT(DISTINCT s.id)  AS sections_count,
        COUNT(DISTINCT st.id) AS students_count,
        COUNT(DISTINCT f.id)  AS faculties_count
      FROM departments d
      JOIN colleges c 
        ON d.college_id = c.id
       AND ${activeClause('c')} 
      LEFT JOIN sections s 
        ON s.department_id = d.id 
       AND ${activeClause('s')}
      LEFT JOIN students st 
        ON st.section_id = s.id 
       AND ${activeClause('st')}
      LEFT JOIN faculties f 
        ON f.department_id = d.id 
       AND ${activeClause('f')}
      WHERE d.college_id = $1
        AND ${activeClause('d')}
    `;
    const params: any[] = [collegeId];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (d.name ILIKE $2 OR d.dept_code ILIKE $2)`;
    }
    sql += ` GROUP BY d.id ORDER BY d.id;`;

    const result = await pool.query(sql, params);
    return res.json({ departments: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch departments.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 6) DEACTIVATE DEPARTMENT (soft-delete)
////////////////////////////////////////////////////////////////////////////////
router.delete('/deletedepartment/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await pool.query(
      `
      UPDATE departments
      SET is_active = FALSE
      WHERE id = $1
        AND ${activeClause('departments')}
      RETURNING *;
      `,
      [id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: 'Department not found or already inactive.' });

    return res.json({ success: true, department: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to deactivate department.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 7) FETCH SECTIONS (active college, department, section)
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchsections', async (req, res) => {
  const { search = '', dept, batch, college_id } = req.query;
  const collegeId = Number(college_id);
  if (isNaN(collegeId))
    return res.status(400).json({ message: 'Missing or invalid college_id' });

  let sql = `
    SELECT
      s.id,
      s.section_code,
      s.name,
      s.department_id,
      d.name        AS department_name,
      s.batch_year,
      COUNT(st.id)  AS students_count
    FROM sections s
    JOIN departments d 
      ON s.department_id = d.id
     AND ${activeClause('d')}
    JOIN colleges c 
      ON d.college_id = c.id
     AND ${activeClause('c')}
    LEFT JOIN students st 
      ON st.section_id = s.id
     AND ${activeClause('st')}
    WHERE d.college_id = $1
      AND ${activeClause('s')}
  `;

  const params: any[] = [collegeId];
  const filters: string[] = [];

  if (search) {
    params.push(`%${search}%`);
    filters.push(`(s.name ILIKE $${params.length} OR s.section_code ILIKE $${params.length})`);
  }
  if (dept) {
    params.push(Number(dept));
    filters.push(`s.department_id = $${params.length}`);
  }
  if (batch) {
    params.push(Number(batch));
    filters.push(`s.batch_year = $${params.length}`);
  }

  if (filters.length) {
    sql += ' AND ' + filters.join(' AND ');
  }
  sql += ' GROUP BY s.id, d.name ORDER BY s.id;';

  try {
    const result = await pool.query(sql, params);
    return res.json({ sections: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch sections.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 8) FETCH STUDENTS (only active college, department, section, student)
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchstudents', async (req, res) => {
  const { college_id, search = '', dept, sem } = req.query;
  const collegeId = Number(college_id);
  if (isNaN(collegeId)) {
    return res.status(400).json({ message: 'Missing or invalid college_id' });
  }

  let sql = `
    SELECT
      st.id,
      st.name,
      st.gmail,
      st.section_id,
      sec.name          AS section_name,
      sec.department_id,
      d.name            AS department_name,
      st.semester_no
    FROM students st
    JOIN sections sec
      ON st.section_id = sec.id
     AND ${activeClause('sec')}
    JOIN departments d
      ON sec.department_id = d.id
     AND ${activeClause('d')}
    JOIN colleges c
      ON d.college_id = c.id
     AND ${activeClause('c')}
    WHERE ${activeClause('st')}
      AND d.college_id = $1
  `;

  const params: any[] = [collegeId];
  const filters: string[] = [];

  if (search) {
    params.push(`%${search}%`);
    filters.push(`(st.name ILIKE $${params.length} OR st.id::TEXT ILIKE $${params.length})`);
  }
  if (dept) {
    params.push(Number(dept));
    filters.push(`sec.department_id = $${params.length}`);
  }
  if (sem) {
    params.push(Number(sem));
    filters.push(`st.semester_no = $${params.length}`);
  }

  if (filters.length) {
    sql += ' AND ' + filters.join(' AND ');
  }
  sql += ' ORDER BY st.id;';

  try {
    const { rows } = await pool.query(sql, params);
    return res.json({ students: rows });
  } catch (err) {
    console.error('Fetch students error:', err);
    return res.status(500).json({ message: 'Failed to fetch students.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 9) ADD STUDENT (defaults to is_active = TRUE)
////////////////////////////////////////////////////////////////////////////////
router.post('/addstudent', async (req, res) => {
  const { id, name, gmail, section_id, semester_no } = req.body;
  if (!id || !name || !gmail || !section_id || !semester_no) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const result = await pool.query(
      `
      INSERT INTO students
        (id, name, gmail, section_id, semester_no)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING *;
      `,
      [id, name, gmail, section_id, semester_no]
    );
    return res.json({ student: result.rows[0] });
  } catch (err) {
    console.error('Add student error:', err);
    return res.status(500).json({ message: 'Failed to add student.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 10) EDIT STUDENT (only active student)
////////////////////////////////////////////////////////////////////////////////
router.put('/editstudent/:id', async (req, res) => {
  const sid = req.params.id;
  const { name, gmail, section_id, semester_no } = req.body;
  if (!name || !gmail || !section_id || !semester_no) {
    return res
      .status(400)
      .json({ message: 'name, gmail, section_id and semester_no are all required.' });
  }
  try {
    const result = await pool.query(
      `
      UPDATE students
      SET name        = $1,
          gmail       = $2,
          section_id  = $3,
          semester_no = $4
      WHERE id = $5
        AND ${activeClause('students')}
      RETURNING id, name, gmail, section_id, semester_no;
      `,
      [name, gmail, section_id, semester_no, sid]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Student not found or inactive.' });
    }
    return res.json({ student: result.rows[0] });
  } catch (err: any) {
    console.error('Edit student error:', err);
    return res.status(500).json({ message: 'Failed to update student.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 11) DEACTIVATE STUDENT (soft-delete)
////////////////////////////////////////////////////////////////////////////////
router.delete('/deletestudent/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query(
      `
      UPDATE students
      SET is_active = FALSE
      WHERE id = $1
        AND ${activeClause('students')}
      RETURNING *;
      `,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Student not found or already inactive.' });
    }
    return res.json({ success: true, student: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to deactivate student.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 12) FETCH FACULTIES (only active college, department, faculty)
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchfaculties', async (req, res) => {
  const { college_id, search = '', dept } = req.query;
  const cid = Number(college_id);
  if (isNaN(cid)) return res.status(400).json({ message: 'Missing college_id' });

  let sql = `
    SELECT
      f.id,
      f.faculty_name,
      f.faculty_mail,
      f.department_id,
      d.name    AS department_name,
      f.joining_year,
      f.designation,
      COUNT(fs.subject_id) AS subjects_count
    FROM faculties f
    JOIN departments d
      ON f.department_id = d.id
     AND ${activeClause('d')}
    JOIN colleges c
      ON d.college_id = c.id
     AND ${activeClause('c')}
    LEFT JOIN faculty_subjects fs
      ON fs.faculty_id = f.id
    WHERE ${activeClause('f')}
      AND d.college_id = $1
  `;
  const params: any[] = [cid];

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (f.faculty_name ILIKE $${params.length} OR f.faculty_mail ILIKE $${params.length})`;
  }
  if (dept) {
    params.push(Number(dept));
    sql += ` AND f.department_id = $${params.length}`;
  }

  sql += ` GROUP BY f.id, d.name ORDER BY f.id;`;

  try {
    const { rows } = await pool.query(sql, params);
    return res.json({ faculties: rows });
  } catch (err) {
    console.error('Fetch faculties error:', err);
    return res.status(500).json({ message: 'Failed to fetch faculties.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 13) ADD FACULTY
////////////////////////////////////////////////////////////////////////////////
router.post('/addfaculty', async (req, res) => {
  const { id, faculty_name, faculty_mail, department_id, joining_year, designation } = req.body;
  if (!id || !faculty_name || !faculty_mail || !department_id || !joining_year) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const result = await pool.query(
      `
      INSERT INTO faculties
        (id, faculty_name, faculty_mail, department_id, joining_year, designation)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [id, faculty_name, faculty_mail, department_id, joining_year, designation]
    );
    return res.json({ faculty: result.rows[0] });
  } catch (err: any) {
    console.error('Add faculty error:', err);
    return res.status(500).json({ message: 'Failed to add faculty.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 14) EDIT FACULTY (only active)
////////////////////////////////////////////////////////////////////////////////
router.put('/editfaculty/:id', async (req, res) => {
  const id = req.params.id;
  const { faculty_name, faculty_mail, department_id, joining_year, designation } = req.body;
  try {
    const result = await pool.query(
      `
      UPDATE faculties
      SET faculty_name   = $1,
          faculty_mail   = $2,
          department_id  = $3,
          joining_year   = $4,
          designation    = $5
      WHERE id = $6
        AND ${activeClause('faculties')}
      RETURNING *;
      `,
      [faculty_name, faculty_mail, department_id, joining_year, designation, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Faculty not found or inactive.' });
    }
    return res.json({ faculty: result.rows[0] });
  } catch (err) {
    console.error('Edit faculty error:', err);
    return res.status(500).json({ message: 'Failed to update faculty.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 15) DEACTIVATE FACULTY
////////////////////////////////////////////////////////////////////////////////
router.delete('/deletefaculty/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query(
      `
      UPDATE faculties
      SET is_active = FALSE
      WHERE id = $1
        AND ${activeClause('faculties')}
      RETURNING *;
      `,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Faculty not found or already inactive.' });
    }
    return res.json({ success: true, faculty: result.rows[0] });
  } catch (err) {
    console.error('Deactivate faculty error:', err);
    return res.status(500).json({ message: 'Failed to deactivate faculty.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 16) FETCH SUBJECTS (only active dept, subject)
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchsubjects', async (req, res) => {
  const { college_id, search = '', dept, sem } = req.query;
  const cid = Number(college_id);
  if (isNaN(cid)) return res.status(400).json({ message: 'college_id is required.' });

  let sql = `
    SELECT
      sub.id,
      sub.subject_code,
      sub.name,
      sub.department_id,
      d.name    AS department_name,
      sub.semester_no,
      COUNT(fs.faculty_id) AS faculty_count
    FROM subjects sub
    JOIN departments d
      ON sub.department_id = d.id
     AND ${activeClause('d')}
    JOIN colleges c
      ON d.college_id = c.id
     AND ${activeClause('c')}
    LEFT JOIN faculty_subjects fs
      ON fs.subject_id = sub.id
    WHERE sub.is_active = TRUE
      AND d.college_id = $1
  `;
  const params: any[] = [cid];

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND (sub.name ILIKE $${params.length} OR sub.subject_code ILIKE $${params.length})`;
  }
  if (dept) {
    params.push(Number(dept));
    sql += ` AND sub.department_id = $${params.length}`;
  }
  if (sem) {
    params.push(Number(sem));
    sql += ` AND sub.semester_no = $${params.length}`;
  }

  sql += ` GROUP BY sub.id, d.name ORDER BY sub.id;`;

  try {
    const { rows } = await pool.query(sql, params);
    return res.json({ subjects: rows });
  } catch (err) {
    console.error('Fetch subjects error:', err);
    return res.status(500).json({ message: 'Failed to fetch subjects.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 17) ADD SUBJECT
////////////////////////////////////////////////////////////////////////////////
router.post('/addsubject', async (req, res) => {
  const { subject_code, name, department_id, semester_no } = req.body;
  try {
    const result = await pool.query(
      `
      INSERT INTO subjects
        (subject_code, name, department_id, semester_no)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [subject_code, name, department_id, semester_no]
    );
    return res.json({ subject: result.rows[0] });
  } catch (err) {
    console.error('Add subject error:', err);
    return res.status(500).json({ message: 'Failed to add subject.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 18) EDIT SUBJECT (only active)
////////////////////////////////////////////////////////////////////////////////
router.put('/editsubject/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { subject_code, name, department_id, semester_no } = req.body;
  try {
    const result = await pool.query(
      `
      UPDATE subjects
      SET subject_code   = $1,
          name           = $2,
          department_id  = $3,
          semester_no    = $4
      WHERE id = $5
        AND is_active = TRUE
      RETURNING *;
      `,
      [subject_code, name, department_id, semester_no, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Subject not found or inactive.' });
    }
    return res.json({ subject: result.rows[0] });
  } catch (err) {
    console.error('Edit subject error:', err);
    return res.status(500).json({ message: 'Failed to update subject.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 19) DEACTIVATE SUBJECT
////////////////////////////////////////////////////////////////////////////////
router.delete('/deletesubject/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await pool.query(
      `
      UPDATE subjects
      SET is_active = FALSE
      WHERE id = $1
        AND is_active = TRUE
      RETURNING *;
      `,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Subject not found or already inactive.' });
    }
    return res.json({ success: true, subject: result.rows[0] });
  } catch (err) {
    console.error('Deactivate subject error:', err);
    return res.status(500).json({ message: 'Failed to deactivate subject.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 20) FETCH ATTENDANCE FILTERS
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchattendancefilters', async (req, res) => {
  const collegeId = Number(req.query.college_id);
  if (!collegeId) {
    return res.status(400).json({ message: 'Missing or invalid college_id' });
  }

  try {
    const depsQ = await pool.query(
      `
      SELECT id, name
      FROM departments
      WHERE college_id = $1
        AND ${activeClause('departments')}
      ORDER BY name;
      `,
      [collegeId]
    );

    const secsQ = await pool.query(
      `
      SELECT s.id, s.name
      FROM sections s
      JOIN departments d
        ON s.department_id = d.id
       AND ${activeClause('d')}
      WHERE d.college_id = $1
        AND ${activeClause('s')}
      ORDER BY s.batch_year DESC, s.name;
      `,
      [collegeId]
    );

    const subsQ = await pool.query(
      `
      SELECT sub.id, sub.name
      FROM subjects sub
      JOIN departments d
        ON sub.department_id = d.id
       AND ${activeClause('d')}
      WHERE d.college_id = $1
        AND sub.is_active = TRUE
      ORDER BY sub.name;
      `,
      [collegeId]
    );

    return res.json({
      departments: depsQ.rows,
      sections:    secsQ.rows,
      subjects:    subsQ.rows
    });
  } catch (err) {
    console.error('fetchAttendanceFilters error:', err);
    return res.status(500).json({ message: 'Failed to fetch attendance filters.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 21) FETCH ATTENDANCE RECORDS
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchattendance', async (req, res) => {
  const collegeId  = Number(req.query.college_id);
  const deptId     = req.query.department_id ? Number(req.query.department_id) : null;
  const sectionId  = req.query.section_id    ? Number(req.query.section_id)    : null;
  const subjectId  = req.query.subject_id    ? Number(req.query.subject_id)    : null;
  const search     = (req.query.search || '').toString().trim();

  if (!collegeId) {
    return res.status(400).json({ message: 'Missing or invalid college_id' });
  }

  try {
    const params: any[] = [collegeId];
    let sql = `
      SELECT
        TO_CHAR(s.session_date, 'YYYY-MM-DD') AS date,
        p.time_slot                       AS period_time,
        p.name                            AS period_name,
        d.name                            AS department,
        sec.batch_year                    AS batch_year,
        te.semester_no                    AS semester_no,
        sub.name                          AS subject,
        f.faculty_name                    AS faculty,
        COUNT(sr.student_id)              AS total_students,
        COUNT(*) FILTER (WHERE sr.status = 'Present') AS present,
        COUNT(*) FILTER (WHERE sr.status = 'Absent')  AS absent,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE sr.status = 'Present')
          / NULLIF(COUNT(sr.student_id), 0),
          2
        ) AS percentage
      FROM attendance_sessions s
      JOIN timetable_entries te
        ON te.id = s.timetable_id
      JOIN periods p
        ON p.id = te.period_id
      JOIN sections sec
        ON sec.id = te.section_id
       AND ${activeClause('sec')}
      JOIN departments d
        ON d.id = sec.department_id
       AND ${activeClause('d')}
      JOIN colleges c
        ON d.college_id = c.id
       AND ${activeClause('c')}
      JOIN subjects sub
        ON sub.id = te.subject_id
       AND sub.is_active = TRUE
      JOIN faculties f
        ON f.id = te.faculty_id
       AND ${activeClause('f')}
      JOIN attendance_records sr
        ON sr.session_id = s.id
      WHERE c.id = $1
    `;

    if (deptId) {
      params.push(deptId);
      sql += ` AND d.id = $${params.length}`;
    }
    if (sectionId) {
      params.push(sectionId);
      sql += ` AND sec.id = $${params.length}`;
    }
    if (subjectId) {
      params.push(subjectId);
      sql += ` AND sub.id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (
        LOWER(f.faculty_name) ILIKE LOWER($${params.length})
        OR LOWER(sub.name)        ILIKE LOWER($${params.length})
        OR CAST(s.session_date AS TEXT) ILIKE $${params.length}
      )`;
    }

    sql += `
      GROUP BY
        s.session_date,
        p.time_slot,
        p.name,
        d.name,
        sec.batch_year,
        te.semester_no,
        sub.name,
        f.faculty_name
      ORDER BY s.session_date DESC;
    `;

    const result = await pool.query(sql, params);
    return res.json({ records: result.rows });
  } catch (err) {
    console.error('fetchAttendance error:', err);
    return res.status(500).json({ message: 'Failed to fetch attendance.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// 22) DASHBOARD STATS (active counts only)
////////////////////////////////////////////////////////////////////////////////
router.post('/dashboardstats', async (req, res) => {
  const { role, college_id, department_id } = req.body;
  if (!role) {
    return res.status(400).json({ message: 'Role is required.' });
  }

  try {
    if (role === 'college') {
      const [students, faculties, departments, sections, attendance] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) FROM students st
           JOIN sections sec ON st.section_id = sec.id AND ${activeClause('sec')}
           JOIN departments d ON sec.department_id = d.id AND ${activeClause('d')}
           WHERE d.college_id = $1 AND ${activeClause('st')}`,
          [college_id]
        ),
        pool.query(
          `SELECT COUNT(*) FROM faculties f
           JOIN departments d ON f.department_id = d.id AND ${activeClause('d')}
           WHERE d.college_id = $1 AND ${activeClause('f')}`,
          [college_id]
        ),
        pool.query(
          `SELECT COUNT(*) FROM departments d
           WHERE d.college_id = $1 AND ${activeClause('d')}`,
          [college_id]
        ),
        pool.query(
          `SELECT COUNT(*) FROM sections s
           JOIN departments d ON s.department_id = d.id AND ${activeClause('d')}
           WHERE d.college_id = $1 AND ${activeClause('s')}`,
          [college_id]
        ),
        pool.query(
          `SELECT d.dept_code AS name,
                  COUNT(ar.status) FILTER (WHERE ar.status = 'Present') AS present,
                  COUNT(ar.status) FILTER (WHERE ar.status = 'Absent')  AS absent
           FROM departments d
           JOIN colleges c ON d.college_id = c.id AND ${activeClause('c')}
           LEFT JOIN sections s  ON s.department_id = d.id  AND ${activeClause('s')}
           LEFT JOIN students st ON st.section_id = s.id   AND ${activeClause('st')}
           LEFT JOIN attendance_records ar ON ar.student_id = st.id
           WHERE d.college_id = $1
             AND ${activeClause('d')}
           GROUP BY d.dept_code;`,
          [college_id]
        ),
      ]);

      return res.json({
        stats: {
          students:    Number(students.rows[0].count),
          faculties:   Number(faculties.rows[0].count),
          departments: Number(departments.rows[0].count),
          sections:    Number(sections.rows[0].count),
        },
        attendanceData: attendance.rows,
      });
    }

    else if (role === 'department') {
      const [students, faculties, batches, sections, attendance] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) FROM students st
           JOIN sections sec ON st.section_id = sec.id AND ${activeClause('sec')}
           WHERE sec.department_id = $1 AND ${activeClause('st')}`,
          [department_id]
        ),
        pool.query(
          `SELECT COUNT(*) FROM faculties f
           WHERE f.department_id = $1 AND ${activeClause('f')}`,
          [department_id]
        ),
        pool.query(
          `SELECT COUNT(DISTINCT batch_year) FROM sections
           WHERE department_id = $1 AND ${activeClause('s')}`,
          [department_id]
        ),
        pool.query(
          `SELECT COUNT(*) FROM sections
           WHERE department_id = $1 AND ${activeClause('s')}`,
          [department_id]
        ),
        pool.query(
          `SELECT s.batch_year AS name,
                  COUNT(ar.status) FILTER (WHERE ar.status = 'Present') AS present,
                  COUNT(ar.status) FILTER (WHERE ar.status = 'Absent')  AS absent
           FROM sections s
           LEFT JOIN students st ON st.section_id = s.id AND ${activeClause('st')}
           LEFT JOIN attendance_records ar ON ar.student_id = st.id
           WHERE s.department_id = $1
             AND ${activeClause('s')}
           GROUP BY s.batch_year;`,
          [department_id]
        ),
      ]);

      return res.json({
        stats: {
          students: Number(students.rows[0].count),
          faculties: Number(faculties.rows[0].count),
          Batches:   Number(batches.rows[0].count),
          sections:  Number(sections.rows[0].count),
        },
        attendanceData: attendance.rows,
      });
    }

    else {
      return res.status(400).json({ message: 'Invalid role provided.' });
    }
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});


module.exports = router;
export default router;
