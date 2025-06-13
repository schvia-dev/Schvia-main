import express, { Router, Request, Response } from 'express';
import { pool } from '../../db';
import { sendMail } from '../../mailer';
import dotenv from 'dotenv';
dotenv.config();
import { QueryResult } from 'pg';

// Define a type for PostgreSQL errors
interface PostgresError {
  code: string;
  message: string;
}
const router: Router = express.Router();
const crypto = require('crypto');

////////////////////////////////////////////////////////////////////////////////
// Health check
////////////////////////////////////////////////////////////////////////////////
router.get('/', (_req, res) => {
  res.send({ message: 'Hello from React + Express + TypeScript + PostgreSQL!' });
});

////////////////////////////////////////////////////////////////////////////////
// Admin Login
////////////////////////////////////////////////////////////////////////////////
router.post('/adminlogin', async (req: Request, res: Response) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body; // Changed from name to username
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and Password are required.' });
  }

  try {
    const sql = `
      SELECT
        a.id,
        a.name,
        a.email,
        a.contact_number,
        a.role,
        a.college_id,
        a.department_id,
        c.name AS college_name,
        c.college_code AS college_code,
        d.name AS department_name,
        d.dept_code AS department_code
      FROM admins a
      LEFT JOIN colleges c ON a.college_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE LOWER(a.name) = LOWER($1)
        AND a.password = $2
    `;
    const result = await pool.query(sql, [username, password]); // Use username
    console.log('Query result:', result.rows);

    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const a = result.rows[0];
    await pool.query(`UPDATE admins SET updated_at = NOW() WHERE id = $1`, [a.id]);

    return res.json({
      admin: {
        id: a.id,
        name: a.name,
        email: a.email,
        contact_number: a.contact_number,
        role: a.role,
        college_id: a.college_id,
        college_name: a.college_name || null,
        college_code: a.college_code || null,
        department_id: a.department_id,
        department_name: a.department_name || null,
        department_code: a.department_code || null
      },
      message: 'Login successful.',
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});


////////////////////////////////////////////////////////////////////////////////
// Admin Forgot Password
////////////////////////////////////////////////////////////////////////////////
router.post(
  ['/adminForgotPassword', '/adminforgotpassword'],
  async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    try {
      // Find the admin
      const { rows } = await pool.query(
        'SELECT * FROM admins WHERE name = $1',
        [name]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Admin not found.' });
      }
      const admin = rows[0];

      // Generate a new password
      const rawPassword = crypto.randomBytes(4).toString('hex');

      // Store it & update updated_at
      await pool.query(
        `UPDATE admins
           SET password = $1,
               updated_at = NOW()
         WHERE id = $2`,
        [rawPassword, admin.id]
      );

      // Email it
      const message = `Hello ${admin.name},\n\nYour new password is: ${rawPassword}\n\nPlease change it after logging in.\n\nRegards,\nSchVia Team`;
      const subject = 'SchVia Admin Password Reset';
      const receiver =
        process.env.DUMMY_EMAIL_TO_TEST && process.env.DUMMY_EMAIL_TO_TEST !== 'null'
          ? process.env.DUMMY_EMAIL_TO_TEST
          : admin.email;
      await sendMail(receiver, subject, message);

      return res.json({
        success: true,
        message: `Password has been sent to ${admin.email}`,
      });
    } catch (err) {
      console.error('Admin password reset error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  }
);

////////////////////////////////////////////////////////////////////////////////
// Fetch Admin Profile
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchAdminProfile', async (req: Request, res: Response) => {
  const id = Number(req.query.id);
  if (!id) {
    return res.status(400).json({ message: 'Missing admin id.' });
  }

  try {
    const sql = `
      SELECT
        a.id,
        a.name,
        a.email,
        a.contact_number,
        a.role,
        a.college_id,
        a.department_id,
        c.name AS college_name,
        c.college_code AS college_code,
        d.name AS department_name,
        d.dept_code AS department_code
      FROM admins a
      LEFT JOIN colleges c ON a.college_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE a.id = $1
    `;
    const result = await pool.query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    return res.json({ admin: result.rows[0] });
  } catch (error) {
    console.error('FetchAdminProfile Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// Update Admin Profile
////////////////////////////////////////////////////////////////////////////////
router.post('/updateAdminProfile', async (req: Request, res: Response) => {
  const { id, name, email, contact_number } = req.body;
  if (!id || !name || !email) {
    return res.status(400).json({ message: 'id, name, and email are required.' });
  }

  try {
    const updates = ['name = $1', 'email = $2'];
    const params: any[] = [name, email];

    if (contact_number) {
      updates.push(`contact_number = $${params.length + 1}`);
      params.push(contact_number);
    }
    params.push(id);

    const result = await pool.query(
      `
      UPDATE admins
         SET ${updates.join(', ')},
             updated_at = NOW()
       WHERE id = $${params.length}
      RETURNING id, name, email, contact_number;
      `,
      params
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    return res.json({
      admin: result.rows[0],
      message: 'Profile updated successfully.',
    });
  } catch (error: any) {
    console.error('UpdateAdminProfile Error:', error);
    if (error.code === '23505' && error.constraint === 'admins_email_key') {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// Change Admin Password
////////////////////////////////////////////////////////////////////////////////
router.post('/changeAdminPassword', async (req: Request, res: Response) => {
  const { id, currentPassword, newPassword } = req.body;
  if (!id || !currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: 'id, currentPassword, and newPassword are required.' });
  }

  try {
    // Verify current password
    const fetch = await pool.query(
      'SELECT password FROM admins WHERE id = $1',
      [id]
    );
    if (fetch.rowCount === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    if (fetch.rows[0].password !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // Update to new password
    await pool.query(
      `
      UPDATE admins
         SET password = $1,
             updated_at = NOW()
       WHERE id = $2
      `,
      [newPassword, id]
    );

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('ChangeAdminPassword Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// Dashboard Statistics
////////////////////////////////////////////////////////////////////////////////
router.post('/dashboardstats', async (req: Request, res: Response) => {
  const { role, college_id, department_id } = req.body;
  if (!role || !college_id) {
    return res.status(400).json({ message: 'Role and college_id are required.' });
  }

  try {
    if (role === 'college') {
      const [students, faculties, departments, batches, attendance] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) AS cnt
             FROM students s
             JOIN batches b ON s.batch_id = b.id
             JOIN departments d ON b.department_id = d.id
            WHERE d.college_id = $1`,
          [college_id]
        ),
        pool.query(
          `SELECT COUNT(*) AS cnt
             FROM faculties f
             JOIN departments d ON f.department_id = d.id
            WHERE d.college_id = $1`,
          [college_id]
        ),
        pool.query(
          `SELECT COUNT(*) AS cnt
             FROM departments
            WHERE college_id = $1`,
          [college_id]
        ),
        pool.query(
          `SELECT COUNT(*) AS cnt
             FROM batches b
             JOIN departments d ON b.department_id = d.id
            WHERE d.college_id = $1`,
          [college_id]
        ),
        pool.query(
          `SELECT d.dept_code AS name,
                  COUNT(ar.*) FILTER (WHERE ar.status = 'Present') AS present,
                  COUNT(ar.*) FILTER (WHERE ar.status = 'Absent') AS absent,
                  COUNT(ar.*) FILTER (WHERE ar.status = 'Leave') AS leave
             FROM departments d
             LEFT JOIN batches b ON b.department_id = d.id
             LEFT JOIN students s ON s.batch_id = b.id
             LEFT JOIN attendance_records ar ON ar.student_id = s.id
            WHERE d.college_id = $1
            GROUP BY d.dept_code`,
          [college_id]
        )
      ]);

      return res.json({
        stats: {
          students: parseInt(students.rows[0].cnt, 10),
          faculties: parseInt(faculties.rows[0].cnt, 10),
          departments: parseInt(departments.rows[0].cnt, 10),
          batches: parseInt(batches.rows[0].cnt, 10),
        },
        attendanceData: attendance.rows,
      });

    } else if (role === 'department' || role === 'class') {
      if (!department_id) {
        return res.status(400).json({ message: 'department_id is required for department/class admins.' });
      }
      const [students, faculties, batches, attendance] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) AS cnt
             FROM students s
             JOIN batches b ON s.batch_id = b.id
            WHERE b.department_id = $1`,
          [department_id]
        ),
        pool.query(
          `SELECT COUNT(*) AS cnt
             FROM faculties
            WHERE department_id = $1`,
          [department_id]
        ),
        pool.query(
          `SELECT COUNT(*) AS cnt
             FROM batches
            WHERE department_id = $1`,
          [department_id]
        ),
        pool.query(
          `SELECT b.batch_code AS name,
                  COUNT(ar.*) FILTER (WHERE ar.status = 'Present') AS present,
                  COUNT(ar.*) FILTER (WHERE ar.status = 'Absent') AS absent,
                  COUNT(ar.*) FILTER (WHERE ar.status = 'Leave') AS leave
             FROM batches b
             LEFT JOIN students s ON s.batch_id = b.id
             LEFT JOIN attendance_records ar ON ar.student_id = s.id
            WHERE b.department_id = $1
            GROUP BY b.batch_code`,
          [department_id]
        )
      ]);

      return res.json({
        stats: {
          students: parseInt(students.rows[0].cnt, 10),
          faculties: parseInt(faculties.rows[0].cnt, 10),
          batches: parseInt(batches.rows[0].cnt, 10),
        },
        attendanceData: attendance.rows,
      });

    } else {
      return res.status(400).json({ message: 'Invalid role provided.' });
    }
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// College Details (fetch & update)
////////////////////////////////////////////////////////////////////////////////
router.post('/FetchCollegeDetails', async (req: Request, res: Response) => {
  const { college_id } = req.body;
  if (!college_id) {
    return res.status(400).json({ message: 'college_id is required.' });
  }

  try {
    const { rowCount, rows } = await pool.query(
      `SELECT id, college_code, name, address, established,
              email AS contact_email, phone AS contact_phone,
              website, logo
         FROM colleges
        WHERE id = $1`,
      [college_id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: 'College not found.' });
    }
    return res.json({ college: rows[0], success: true });
  } catch (error) {
    console.error('Fetch College Error:', error, {});
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/updateCollegeDetails', async (req: Request, res: Response) => {
  const { id, name, address, established, contact_email, contact_phone, website, logo, role } = req.body;
  if (role !== 'college') {
    return res.status(403).json({ message: 'Unauthorized. Only college admins can edit.' });
  }
  if (!id || !name) {
    return res.status(400).json({ message: 'id and name are required.' });
  }

  try {
    const updates = ['name = $1'];
    const params: any[] = [name];
    if (address) { updates.push(`address = $${params.length + 1}`); params.push(address); }
    if (established) { updates.push(`established = $${params.length + 1}`); params.push(established); }
    if (contact_email) { updates.push(`email = $${params.length + 1}`); params.push(contact_email); }
    if (contact_phone) { updates.push(`phone = $${params.length + 1}`); params.push(contact_phone); }
    if (website) { updates.push(`website = $${params.length + 1}`); params.push(website); }
    if (logo) { updates.push(`logo = $${params.length + 1}`); params.push(logo); }
    params.push(id);

    console.log('Update Query:', `UPDATE colleges SET ${updates.join(', ')} WHERE id = $${params.length}`, params); // Debug query

    const result = await pool.query(
      `UPDATE colleges
          SET ${updates.join(', ')}
        WHERE id = $${params.length}
        RETURNING id, college_code, name, address, established,
                  email AS contact_email, phone AS contact_phone, website, logo`,
      params
    );

    if (result.rowCount === 0) {
      console.log(`No college found with id: ${id}`);
      return res.status(404).json({ message: `College with id ${id} not found.` });
    }

    return res.json({ college: result.rows[0], success: true, message: 'College updated successfully.' });
  } catch (error) {
    console.error('Update College Error:', error, {});
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// Departments CRUD
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchdepartments', async (req: Request, res: Response) => {
  const collegeId = Number(req.query.college_id);
  if (!collegeId) {
    return res.status(400).json({ message: 'Missing or invalid college_id.' });
  }
  const search = (req.query.search || '').toString().trim();

  try {
    let sql = `
      SELECT
        d.id,
        d.dept_code,
        d.name,
        COUNT(DISTINCT b.id) AS batches_count,
        COUNT(DISTINCT s.id) AS students_count,
        COUNT(DISTINCT f.id) AS faculties_count
      FROM departments d
      LEFT JOIN batches b ON b.department_id = d.id
      LEFT JOIN students s ON s.batch_id = b.id
      LEFT JOIN faculties f ON f.department_id = d.id
      WHERE d.college_id = $1
    `;
    const params: any[] = [collegeId];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (d.name ILIKE $${params.length} OR d.dept_code ILIKE $${params.length})`;
    }
    sql += ` GROUP BY d.id ORDER BY d.id`;

    const { rows } = await pool.query(sql, params);
    return res.json({ departments: rows });
  } catch (error) {
    console.error('Fetch Departments Error:', error);
    return res.status(500).json({ message: 'Failed to fetch departments.' });
  }
});

router.post('/adddepartment', async (req: Request, res: Response) => {
  const { college_id, dept_code, name } = req.body;
  if (!college_id || !dept_code || !name) {
    return res.status(400).json({ message: 'college_id, dept_code, and name are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO departments (college_id, dept_code, name)
       VALUES ($1, $2, $3)
       RETURNING id, college_id, dept_code, name;`,
      [college_id, dept_code, name]
    );
    return res.json({ department: result.rows[0] });
  } catch (err: any) {
    console.error('Add Department Error:', err);
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Invalid college_id.' });
    }
    if (err.code === '23505') {
      return res.status(409).json({ message: 'That dept_code already exists in this college.' });
    }
    return res.status(500).json({ message: 'Failed to add department.' });
  }
});

router.put('/editdepartment/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { dept_code, name } = req.body;
  if (!dept_code || !name) {
    return res.status(400).json({ message: 'dept_code and name are required.' });
  }

  try {
    const result = await pool.query(
      `UPDATE departments
       SET dept_code = $1,
           name = $2
       WHERE id = $3
       RETURNING id, dept_code, name;`,
      [dept_code, name, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Department not found.' });
    }
    return res.json({ department: result.rows[0] });
  } catch (err: any) {
    console.error('Edit Department Error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'That dept_code already exists in this college.' });
    }
    return res.status(500).json({ message: 'Failed to update department.' });
  }
});

router.delete('/deletedepartment/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    // Check for dependent admins
    const adminCheck = await pool.query(
      `SELECT 1 FROM admins WHERE department_id = $1 LIMIT 1`,
      [id]
    );
    if (adminCheck.rowCount !== null && adminCheck.rowCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete department because it is associated with one or more admins.' 
      });
    }

    const result = await pool.query(`DELETE FROM departments WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Department not found.' });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Delete Department Error:', err);
    if (err.code === '23503') {
      return res.status(400).json({ 
        message: 'Cannot delete department because it is associated with one or more admins.' 
      });
    }
    return res.status(500).json({ message: 'Failed to delete department.' });
  }
});



  ////////////////////////////////////////////////////////////////////////////////
  // Batches CRUD
  ////////////////////////////////////////////////////////////////////////////////
router.get('/fetchbatches', async (req: Request, res: Response) => {
  const collegeId = Number(req.query.college_id);
  if (!collegeId) {
    return res.status(400).json({ message: 'Missing or invalid college_id.' });
  }
  const search = (req.query.search || '').toString().trim();
  const deptId = req.query.dept ? Number(req.query.dept) : null;
  const batchYear = req.query.batch ? Number(req.query.batch) : null;

  try {
    let sql = `
      SELECT
        b.id,
        b.batch_code,
        b.name,
        b.batch_year,
        b.current_year,
        b.room_number,
        b.department_id,
        d.name AS department_name,
        f.name AS faculty_incharge_name,
        COUNT(s.id) AS students_count
      FROM batches b
      JOIN departments d ON d.id = b.department_id
      LEFT JOIN faculties f ON f.id = b.faculty_incharge
      LEFT JOIN students s ON s.batch_id = b.id
      WHERE d.college_id = $1
    `;
    const params: any[] = [collegeId];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (b.batch_code ILIKE $${params.length} OR b.room_number ILIKE $${params.length} OR b.name ILIKE $${params.length})`;
    }
    if (deptId) {
      params.push(deptId);
      sql += ` AND b.department_id = $${params.length}`;
    }
    if (batchYear) {
      params.push(batchYear);
      sql += ` AND b.batch_year = $${params.length}`;
    }

    sql += `
      GROUP BY b.id, b.name, d.name, f.name
      ORDER BY b.id;
    `;

    const { rows } = await pool.query(sql, params);
    return res.json({ batches: rows });
  } catch (err) {
    console.error('Fetch Batches Error:', err);
    return res.status(500).json({ message: 'Failed to fetch batches.' });
  }
});

// /fetchbatchyears (unchanged)
router.get(['/fetchbatchyears', '/fetchBatchYears'], async (req: Request, res: Response) => {
  const collegeId = Number(req.query.college_id);
  if (!collegeId) {
    return res.status(400).json({ message: 'Missing college_id.' });
  }
  try {
    const { rows } = await pool.query(
      `
        SELECT DISTINCT b.batch_year
          FROM batches b
          JOIN departments d ON d.id = b.department_id
        WHERE d.college_id = $1
        ORDER BY b.batch_year
      `,
      [collegeId]
    );
    return res.json({ batchYears: rows.map(r => r.batch_year) });
  } catch (err) {
    console.error('Fetch Batch Years Error:', err);
    return res.status(500).json({ message: 'Failed to fetch batch years.' });
  }
});

// /addbatch (updated)
router.post('/addbatch', async (req: Request, res: Response) => {
  const { batch_code, name, batch_year, current_year, department_id, room_number, faculty_incharge } = req.body;
  if (!batch_code || !name || !batch_year || !current_year || !department_id) {
    return res.status(400).json({ message: 'batch_code, name, batch_year, current_year, and department_id are required.' });
  }
  try {
    const result: QueryResult<any> = await pool.query(
      `INSERT INTO batches (batch_code, name, batch_year, current_year, department_id, room_number, faculty_incharge)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, batch_code, name, batch_year, current_year, department_id, room_number, faculty_incharge,
                 (SELECT name FROM departments WHERE id = $5) AS department_name,
                 (SELECT COUNT(*) FROM students WHERE batch_id = currval('batches_id_seq')) AS students_count,
                 (SELECT name FROM faculties WHERE id = $7) AS faculty_incharge_name;`,
      [batch_code, name, batch_year, current_year, department_id, room_number || 'N/A', faculty_incharge || null]
    );
    return res.json({ batch: result.rows[0] });
  } catch (err: any) {
    console.error('Add Batch Error:', err);
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Invalid department_id or faculty_incharge.' });
    }
    if (err.code === '23505') {
      return res.status(409).json({ message: 'A batch with this code, year, and department already exists.' });
    }
    return res.status(500).json({ message: 'Failed to add batch.' });
  }
});

// /editbatch/:id (unchanged)
router.put('/editbatch/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { batch_code, name, batch_year, current_year, department_id, room_number, faculty_incharge } = req.body;
  if (!batch_code || !name || !batch_year || !current_year || !department_id) {
    return res.status(400).json({ message: 'batch_code, name, batch_year, current_year, and department_id are required.' });
  }
  try {
    const result: QueryResult<any> = await pool.query(
      `UPDATE batches
       SET batch_code = $1,
           name = $2,
           batch_year = $3,
           current_year = $4,
           department_id = $5,
           room_number = $6,
           faculty_incharge = $7
       WHERE id = $8
       RETURNING id, batch_code, name, batch_year, current_year, department_id, room_number, faculty_incharge,
                 (SELECT name FROM departments WHERE id = $5) AS department_name,
                 (SELECT COUNT(*) FROM students WHERE batch_id = $8) AS students_count;`,
      [batch_code, name, batch_year, current_year, department_id, room_number || 'N/A', faculty_incharge || null, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Batch not found.' });
    }
    return res.json({ batch: result.rows[0] });
  } catch (err: any) {
    console.error('Edit Batch Error:', err);
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Invalid department_id or faculty_incharge.' });
    }
    if (err.code === '23505') {
      return res.status(409).json({ message: 'A batch with this code, year, and department already exists.' });
    }
    if (err.code === '42703') {
      return res.status(500).json({ message: 'Database error: Invalid column reference.' });
    }
    return res.status(500).json({ message: 'Failed to update batch.' });
  }
});

// /deletebatch/:id (unchanged)
router.delete('/deletebatch/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const result = await pool.query(`DELETE FROM batches WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Batch not found.' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete Batch Error:', err);
    return res.status(500).json({ message: 'Failed to delete batch.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// Students CRUD & Forgot Password
////////////////////////////////////////////////////////////////////////////////

router.get('/fetchstudents', async (req: Request, res: Response) => {
  const collegeId = Number(req.query.college_id);
  if (!collegeId) {
    return res.status(400).json({ message: 'Missing college_id.' });
  }
  const search = (req.query.search || '').toString().trim();
  const dept = req.query.dept ? Number(req.query.dept) : null;
  const batch = req.query.batch ? Number(req.query.batch) : null;

  try {
    let sql = `
      SELECT
        s.id,
        s.name,
        s.email,
        s.phone,
        s.current_year,
        s.batch_id,
        b.batch_code AS batch_name,
        b.department_id,
        d.name AS department_name
      FROM students s
      JOIN batches b ON b.id = s.batch_id
      JOIN departments d ON d.id = b.department_id
      WHERE d.college_id = $1
    `;
    const params: any[] = [collegeId];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (s.name ILIKE $${params.length} OR s.id ILIKE $${params.length})`;
    }
    if (dept) {
      params.push(dept);
      sql += ` AND b.department_id = $${params.length}`;
    }
    if (batch) {
      params.push(batch);
      sql += ` AND s.batch_id = $${params.length}`;
    }

    sql += ' ORDER BY s.id;';

    const { rows } = await pool.query(sql, params);
    return res.json({ students: rows });
  } catch (err) {
    console.error('Fetch Students Error:', err);
    return res.status(500).json({ message: 'Failed to fetch students.' });
  }
});

router.post('/addstudent', async (req: Request, res: Response) => {
  const { id, name, email, batch_id, current_year, phone, address, pan_number, aadhar_number, father_phone, mother_phone, password } = req.body;
  if (!id || !name || !email || !batch_id || !current_year || !password) {
    return res.status(400).json({ message: 'id, name, email, batch_id, current_year, and password are required.' });
  }

  try {
    // Insert the student without subqueries
    const result = await pool.query(
      `INSERT INTO students (id, name, email, batch_id, current_year, phone, address, pan_number, aadhar_number, father_phone, mother_phone, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING 
         id, 
         name, 
         email,
         batch_id,
         current_year,
         phone, 
         address, 
         pan_number, 
         aadhar_number, 
         father_phone, 
         mother_phone`,
      [id, name, email, batch_id, current_year, phone || 'N/A', address || 'N/A', pan_number || 'N/A', aadhar_number || 'N/A', father_phone || 'N/A', mother_phone || 'N/A', password]
    );

    // Fetch batch_name and department_name separately
    const student = result.rows[0];
    const batchResult = await pool.query(
      `SELECT 
         b.batch_code AS batch_name,
         d.name AS department_name
       FROM batches b
       JOIN departments d ON d.id = b.department_id
       WHERE b.id = $1`,
      [student.batch_id]
    );

    // Combine the results
    if (batchResult.rows.length > 0) {
      student.batch_name = batchResult.rows[0].batch_name;
      student.department_name = batchResult.rows[0].department_name;
    } else {
      student.batch_name = null;
      student.department_name = null;
    }

    return res.json({ student });
  } catch (err: any) {
    console.error('Add Student Error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'That ID or email already exists.' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Invalid batch_id.' });
    }
    return res.status(500).json({ message: 'Failed to add student.' });
  }
});

router.put('/editstudent/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const { name, email, batch_id, current_year, phone, address, pan_number, aadhar_number, father_phone, mother_phone } = req.body;
  if (!name || !email || !batch_id || !current_year) {
    return res.status(400).json({ message: 'name, email, batch_id, and current_year are required.' });
  }

  const updates = [
    'name = $1',
    'email = $2',
    'batch_id = $3',
    'current_year = $4',
  ];
  const params: any[] = [name, email, batch_id, current_year];

  if (phone) { updates.push(`phone = $${params.length + 1}`); params.push(phone); }
  if (address) { updates.push(`address = $${params.length + 1}`); params.push(address); }
  if (pan_number) { updates.push(`pan_number = $${params.length + 1}`); params.push(pan_number); }
  if (aadhar_number) { updates.push(`aadhar_number = $${params.length + 1}`); params.push(aadhar_number); }
  if (father_phone) { updates.push(`father_phone = $${params.length + 1}`); params.push(father_phone); }
  if (mother_phone) { updates.push(`mother_phone = $${params.length + 1}`); params.push(mother_phone); }
  params.push(id);

  try {
    // Update the student without subqueries
    const result = await pool.query(
      `UPDATE students
       SET ${updates.join(', ')},
           updated_at = NOW()
       WHERE id = $${params.length}
       RETURNING 
         id, 
         name, 
         email,
         batch_id,
         current_year,
         phone, 
         address, 
         pan_number, 
         aadhar_number, 
         father_phone, 
         mother_phone`,
      params
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Fetch batch_name and department_name separately
    const student = result.rows[0];
    const batchResult = await pool.query(
      `SELECT 
         b.batch_code AS batch_name,
         d.name AS department_name
       FROM batches b
       JOIN departments d ON d.id = b.department_id
       WHERE b.id = $1`,
      [student.batch_id]
    );

    // Combine the results
    if (batchResult.rows.length > 0) {
      student.batch_name = batchResult.rows[0].batch_name;
      student.department_name = batchResult.rows[0].department_name;
    } else {
      student.batch_name = null;
      student.department_name = null;
    }

    return res.json({ student });
  } catch (err: any) {
    console.error('Edit Student Error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'That email is already in use.' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Invalid batch_id.' });
    }
    return res.status(500).json({ message: 'Failed to update student.' });
  }
});

router.delete('/deletestudent/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const result = await pool.query(`DELETE FROM students WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete Student Error:', err);
    return res.status(500).json({ message: 'Failed to delete student.' });
  }
});

router.post(['/studentForgotPassword', '/studentforgotpassword'], async (req: Request, res: Response) => {
  const { rollNo } = req.body;
  if (!rollNo) {
    return res.status(400).json({ success: false, message: 'rollNo is required.' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM students WHERE id = $1', [rollNo]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    const student = rows[0];

    const rawPassword = crypto.randomBytes(4).toString('hex');
    await pool.query(
      `UPDATE students
         SET password = $1,
             updated_at = NOW()
       WHERE id = $2`,
      [rawPassword, rollNo]
    );

    const message = `Hello ${student.name},\n\nYour new password is: ${rawPassword}\n\nPlease change it after login.\n\nRegards,\nSchVia Team`;
    const subject = 'SchVia Password Reset';
    const receiver =
      process.env.DUMMY_EMAIL_TO_TEST && process.env.DUMMY_EMAIL_TO_TEST !== 'null'
        ? process.env.DUMMY_EMAIL_TO_TEST
        : student.email;
    await sendMail(receiver, subject, message);

    return res.json({
      success: true,
      message: `Password has been sent to ${student.email}`,
    });
  } catch (err) {
    console.error('Student password reset error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// New route to fetch a single student's details
router.get('/student/:id', async (req: Request, res: Response) => {
  const studentId = req.params.id;
  const collegeId = Number(req.query.college_id);
  if (!collegeId) {
    return res.status(400).json({ message: 'Missing college_id.' });
  }
  if (!studentId) {
    return res.status(400).json({ message: 'Missing student ID.' });
  }

  try {
    const result = await pool.query(
      `SELECT 
         s.id, 
         s.name, 
         s.email,
         s.batch_id,
         s.current_year,
         s.phone, 
         s.address, 
         s.pan_number, 
         s.aadhar_number, 
         s.father_phone, 
         s.mother_phone,
         b.batch_code AS batch_name,
         b.department_id,
         d.name AS department_name
       FROM students s
       JOIN batches b ON b.id = s.batch_id
       JOIN departments d ON d.id = b.department_id
       WHERE s.id = $1 AND d.college_id = $2`,
      [studentId, collegeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const student = result.rows[0];
    return res.json({ student });
  } catch (err) {
    console.error('Fetch Student Profile Error:', err);
    return res.status(500).json({ message: 'Failed to fetch student details.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// Faculties CRUD & Forgot Password
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchfaculties', async (req: Request, res: Response) => {
  const collegeId = Number(req.query.college_id);
  const role = req.query.role as 'college' | 'department' | 'class';
  const departmentId = req.query.department_id ? Number(req.query.department_id) : null;
  const search = (req.query.search || '').toString().trim();
  const dept = req.query.dept ? Number(req.query.dept) : null;

  if (!collegeId || !role) {
    return res.status(400).json({ message: 'Missing college_id or role.' });
  }
  if (role === 'department' && !departmentId) {
    return res.status(400).json({ message: 'Department ID is required for department admins.' });
  }

  try {
    let sql = `
      SELECT
        f.id,
        f.name,
        f.email,
        f.phone,
        f.dob,
        f.qualification,
        f.department_id,
        d.name AS department_name,
        COUNT(bss.id) AS subjects_count
      FROM faculties f
      JOIN departments d ON f.department_id = d.id
      LEFT JOIN batch_semester_subjects bss ON bss.faculty_id = f.id
      WHERE d.college_id = $1
    `;
    const params: any[] = [collegeId];

    if (role === 'department' && departmentId) {
      sql += ` AND f.department_id = $${params.length + 1}`;
      params.push(departmentId);
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (f.name ILIKE $${params.length} OR f.email ILIKE $${params.length})`;
    }
    if (dept && role !== 'department') { // Department filter only for non-department admins
      params.push(dept);
      sql += ` AND f.department_id = $${params.length}`;
    }

    sql += ` GROUP BY f.id, d.name ORDER BY f.id;`;

    const { rows } = await pool.query(sql, params);
    return res.json({ faculties: rows });
  } catch (err) {
    console.error('Fetch Faculties Error:', err);
    return res.status(500).json({ message: 'Failed to fetch faculties.' });
  }
});

router.post('/addfaculty', async (req: Request, res: Response) => {
  const { id, name, email, department_id, phone, dob, qualification, password, role, admin_department_id } = req.body;
  if (!id || !name || !email || !department_id || !password || !role) {
    return res.status(400).json({ message: 'id, name, email, department_id, password, and role are required.' });
  }
  if (role === 'department' && !admin_department_id) {
    return res.status(400).json({ message: 'admin_department_id is required for department admins.' });
  }
  if (role === 'department' && department_id !== admin_department_id) {
    return res.status(403).json({ message: 'Department admins can only add faculties to their own department.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO faculties
         (id, name, email, department_id, phone, dob, qualification, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, department_id, phone, dob, qualification;`,
      [id, name, email, department_id, phone || 'N/A', dob || null, qualification || 'N/A', password]
    );
    const faculty = result.rows[0];
    faculty.department_name = (
      await pool.query(`SELECT name FROM departments WHERE id = $1`, [department_id])
    ).rows[0].name;
    faculty.subjects_count = 0;
    return res.json({ faculty });
  } catch (err: any) {
    console.error('Add Faculty Error:', err);
    if (err.code === '23505') {
      if (err.constraint === 'faculties_pkey') {
        return res.status(409).json({ message: 'That faculty ID already exists.' });
      }
      if (err.constraint === 'faculties_email_key') {
        return res.status(409).json({ message: 'That email is already in use.' });
      }
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Invalid department_id.' });
    }
    return res.status(500).json({ message: 'Failed to add faculty.' });
  }
});

router.put('/editfaculty/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const { name, email, department_id, phone, dob, qualification, role, admin_department_id } = req.body;
  if (!name || !email || !department_id || !role) {
    return res.status(400).json({ message: 'name, email, department_id, and role are required.' });
  }
  if (role === 'department' && !admin_department_id) {
    return res.status(400).json({ message: 'admin_department_id is required for department admins.' });
  }
  if (role === 'department' && department_id !== admin_department_id) {
    return res.status(403).json({ message: 'Department admins can only edit faculties in their own department.' });
  }

  const updates = [
    'name = $1',
    'email = $2',
    'department_id = $3',
  ];
  const params: any[] = [name, email, department_id];

  if (phone) { updates.push(`phone = $${params.length + 1}`); params.push(phone); }
  if (dob) { updates.push(`dob = $${params.length + 1}`); params.push(dob); }
  if (qualification) { updates.push(`qualification = $${params.length + 1}`); params.push(qualification); }
  params.push(id);

  try {
    const result = await pool.query(
      `UPDATE faculties
          SET ${updates.join(', ')},
              updated_at = NOW()
        WHERE id = $${params.length}
        RETURNING id, name, email, department_id, phone, dob, qualification;`,
      params
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Faculty not found.' });
    }
    return res.json({ faculty: result.rows[0] });
  } catch (err: any) {
    console.error('Edit Faculty Error:', err);
    if (err.code === '23505' && err.constraint === 'faculties_email_key') {
      return res.status(409).json({ message: 'That email is already in use.' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Invalid department_id.' });
    }
    return res.status(500).json({ message: 'Failed to update faculty.' });
  }
});

router.delete('/deletefaculty/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const { role, admin_department_id } = req.query;
  if (!role) {
    return res.status(400).json({ message: 'role is required.' });
  }
  if (role === 'department' && !admin_department_id) {
    return res.status(400).json({ message: 'admin_department_id is required for department admins.' });
  }

  try {
    if (role === 'department') {
      const faculty = await pool.query(
        `SELECT department_id FROM faculties WHERE id = $1`,
        [id]
      );
      if (faculty.rowCount === 0) {
        return res.status(404).json({ message: 'Faculty not found.' });
      }
      if (Number(admin_department_id) !== faculty.rows[0].department_id) {
        return res.status(403).json({ message: 'Department admins can only delete faculties from their own department.' });
      }
    }
    const result = await pool.query(`DELETE FROM faculties WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Faculty not found.' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete Faculty Error:', err);
    return res.status(500).json({ message: 'Failed to delete faculty.' });
  }
});

router.post(['/facultyForgotPassword', '/facultyforgotpassword'], async (req: Request, res: Response) => {
  const { id, role, admin_department_id } = req.body;
  if (!id || !role) {
    return res.status(400).json({ success: false, message: 'id and role are required.' });
  }
  if (role === 'department' && !admin_department_id) {
    return res.status(400).json({ success: false, message: 'admin_department_id is required for department admins.' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM faculties WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Faculty not found.' });
    }
    const faculty = rows[0];
    if (role === 'department' && Number(admin_department_id) !== faculty.department_id) {
      return res.status(403).json({ success: false, message: 'Department admins can only reset passwords for faculties in their own department.' });
    }

    const rawPassword = crypto.randomBytes(4).toString('hex');
    await pool.query(
      `UPDATE faculties
         SET password = $1,
             updated_at = NOW()
       WHERE id = $2`,
      [rawPassword, id]
    );

    const message = `Hello ${faculty.name},\n\nYour new password is: ${rawPassword}\n\nPlease change it after login.\n\nRegards,\nSchVia Team`;
    const subject = 'SchVia Faculty Password Reset';
    const receiver =
      process.env.DUMMY_EMAIL_TO_TEST && process.env.DUMMY_EMAIL_TO_TEST !== 'null'
        ? process.env.DUMMY_EMAIL_TO_TEST
        : faculty.email;
    await sendMail(receiver, subject, message);

    return res.json({
      success: true,
      message: `Password has been sent to ${faculty.email}`,
    });
  } catch (err) {
    console.error('Faculty password reset error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.get('/fetchfaculty/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  const collegeId = Number(req.query.college_id);
  const role = req.query.role as 'college' | 'department' | 'class';
  const adminDepartmentId = req.query.admin_department_id ? Number(req.query.admin_department_id) : null;

  if (!id || !collegeId || !role) {
    return res.status(400).json({ message: 'id, college_id, and role are required.' });
  }
  if (role === 'department' && !adminDepartmentId) {
    return res.status(400).json({ message: 'admin_department_id is required for department admins.' });
  }

  try {
    const sql = `
      SELECT
        f.id,
        f.name,
        f.email,
        f.phone,
        f.dob,
        f.qualification,
        f.department_id,
        d.name AS department_name,
        COUNT(bss.id) AS subjects_count
      FROM faculties f
      JOIN departments d ON f.department_id = d.id
      LEFT JOIN batch_semester_subjects bss ON bss.faculty_id = f.id
      WHERE f.id = $1 AND d.college_id = $2
      ${role === 'department' ? 'AND f.department_id = $3' : ''}
      GROUP BY f.id, d.name;
    `;
    const params: any[] = [id, collegeId];
    if (role === 'department') {
      params.push(adminDepartmentId);
    }

    const { rows } = await pool.query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Faculty not found or access denied.' });
    }
    return res.json({ faculty: rows[0] });
  } catch (err) {
    console.error('Fetch Faculty Error:', err);
    return res.status(500).json({ message: 'Failed to fetch faculty.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// Subjects CRUD
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchsubjects', async (req: Request, res: Response) => {
  const collegeId = Number(req.query.college_id);
  const departmentId = req.query.department_id ? Number(req.query.department_id) : null;
  if (!collegeId) {
    return res.status(400).json({ message: 'Missing college_id.' });
  }
  const search = (req.query.search || '').toString().trim();
  const dept = req.query.dept ? Number(req.query.dept) : null;

  try {
    let sql = `
      SELECT
        sub.id,
        sub.subject_code,
        sub.name,
        sub.credits,
        sub.department_id,
        d.name AS department_name,
        COUNT(bss.id) AS faculty_count
      FROM subjects sub
      JOIN departments d ON sub.department_id = d.id
      LEFT JOIN batch_semester_subjects bss ON bss.subject_id = sub.id
      WHERE d.college_id = $1
    `;
    const params: any[] = [collegeId];

    if (departmentId) {
      params.push(departmentId);
      sql += ` AND sub.department_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (sub.name ILIKE $${params.length} OR sub.subject_code ILIKE $${params.length})`;
    }
    if (dept) {
      params.push(dept);
      sql += ` AND sub.department_id = $${params.length}`;
    }

    sql += `
      GROUP BY sub.id, d.name
      ORDER BY sub.id;
    `;

    const { rows } = await pool.query(sql, params);
    return res.json({ subjects: rows });
  } catch (err) {
    console.error('Fetch Subjects Error:', err);
    return res.status(500).json({ message: 'Failed to fetch subjects.' });
  }
});

router.post('/addsubject', async (req, res) => {
  const { college_id, subject_code, name, department_id, credits } = req.body;
  if (!college_id || !subject_code || !name || !department_id || !credits) {
    return res.status(400).json({ message: 'college_id, subject_code, name, department_id, and credits are required.' });
  }
  try {
    // Verify department belongs to the college
    const deptCheck = await pool.query(
      `SELECT 1 FROM departments WHERE id = $1 AND college_id = $2`,
      [department_id, college_id]
    );
    if (deptCheck.rowCount === 0) {
      return res.status(400).json({ message: 'Invalid department_id.' });
    }

    const result = await pool.query(
      `INSERT INTO subjects (subject_code, name, department_id, credits)
       VALUES ($1, $2, $3, $4)
       RETURNING id, subject_code, name, department_id, credits;`,
      [subject_code, name, department_id, credits]
    );
    const subject = result.rows[0];

    // Fetch department name
    const deptResult = await pool.query(
      `SELECT name FROM departments WHERE id = $1`,
      [department_id]
    );
    const department_name = deptResult.rows[0]?.name || 'Unknown';

    return res.json({
      subject: {
        ...subject,
        department_name,
        faculty_count: 0
      }
    });
  } catch (err: any) {
    console.error('Add Subject Error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'That subject already exists.' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Invalid department_id.' });
    }
    return res.status(500).json({ message: 'Failed to add subject.' });
  }
});

router.put('/editsubject/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { college_id, subject_code, name, department_id, credits } = req.body;
  if (!college_id || !subject_code || !name || !department_id || !credits) {
    return res.status(400).json({ message: 'college_id, subject_code, name, department_id, and credits are required.' });
  }
  try {
    // Verify department belongs to the college
    const deptCheck = await pool.query(
      `SELECT 1 FROM departments WHERE id = $1 AND college_id = $2`,
      [department_id, college_id]
    );
    if (deptCheck.rowCount === 0) {
      return res.status(400).json({ message: 'Invalid department_id.' });
    }

    const result = await pool.query(
      `UPDATE subjects
       SET subject_code = $1,
           name = $2,
           department_id = $3,
           credits = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, subject_code, name, department_id, credits;`,
      [subject_code, name, department_id, credits, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Subject not found.' });
    }
    const subject = result.rows[0];

    // Fetch department name
    const deptResult = await pool.query(
      `SELECT name FROM departments WHERE id = $1`,
      [department_id]
    );
    const department_name = deptResult.rows[0]?.name || 'Unknown';

    // Fetch faculty count
    const facultyResult = await pool.query(
      `SELECT COUNT(bss.id) AS faculty_count
       FROM batch_semester_subjects bss
       WHERE bss.subject_id = $1`,
      [id]
    );
    const faculty_count = Number(facultyResult.rows[0]?.faculty_count) || 0;

    return res.json({
      subject: {
        ...subject,
        department_name,
        faculty_count
      }
    });
  } catch (err: any) {
    console.error('Edit Subject Error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ message: 'That subject already exists.' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Invalid department_id.' });
    }
    return res.status(500).json({ message: 'Failed to update subject.' });
  }
});

router.delete('/deletesubject/:id', async (req, res) => {
  const id = Number(req.params.id);
  const collegeId = Number(req.query.college_id);
  const departmentId = req.query.department_id ? Number(req.query.department_id) : null;
  if (!collegeId) {
    return res.status(400).json({ message: 'Missing college_id.' });
  }
  try {
    let sql = `DELETE FROM subjects WHERE id = $1 AND department_id IN (SELECT id FROM departments WHERE college_id = $2)`;
    const params: any[] = [id, collegeId];

    if (departmentId) {
      params.push(departmentId);
      sql += ` AND department_id = $${params.length}`;
    }

    const result = await pool.query(sql, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Subject not found or unauthorized.' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete Subject Error:', err);
    return res.status(500).json({ message: 'Failed to delete subject.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// Attendance Filters & Fetch
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchattendancefilters', async (req: Request, res: Response) => {
  const collegeId = Number(req.query.college_id);
  if (!collegeId) {
    return res.status(400).json({ message: 'Missing college_id.' });
  }

  try {
    const depsQ = await pool.query(
      `SELECT id, name
         FROM departments
        WHERE college_id = $1
        ORDER BY name;`,
      [collegeId]
    );
    const batchesQ = await pool.query(
      `SELECT b.id, b.batch_code AS name
         FROM batches b
         JOIN departments d ON d.id = b.department_id
        WHERE d.college_id = $1
        ORDER BY b.batch_year DESC, b.batch_code;`,
      [collegeId]
    );
    const subsQ = await pool.query(
      `SELECT sub.id, sub.name
         FROM subjects sub
         JOIN departments d ON d.id = sub.department_id
        WHERE d.college_id = $1
        ORDER BY sub.name;`,
      [collegeId]
    );

    return res.json({
      departments: depsQ.rows,
      batches: batchesQ.rows,
      subjects: subsQ.rows,
    });
  } catch (err) {
    console.error('fetchAttendanceFilters error:', err);
    return res.status(500).json({ message: 'Failed to fetch attendance filters.' });
  }
});

router.get('/fetchattendance', async (req: Request, res: Response) => {
  const collegeId = Number(req.query.college_id);
  const deptId = req.query.department_id ? Number(req.query.department_id) : null;
  const batchId = req.query.batch_id ? Number(req.query.batch_id) : null;
  const subjectId = req.query.subject_id ? Number(req.query.subject_id) : null;
  const search = (req.query.search || '').toString().trim();

  if (!collegeId) {
    return res.status(400).json({ message: 'Missing college_id.' });
  }

  try {
    const params: any[] = [collegeId];
    let sql = `
      SELECT
        s.id AS session_id,
        TO_CHAR(s.session_date, 'YYYY-MM-DD') AS date,
        p.time_slot AS period_time,
        p.name AS period_name,
        d.name AS department,
        b.batch_code AS batch_name,
        te.semester_no AS semester_no,
        sub.name AS subject,
        f.name AS faculty,
        COUNT(sr.student_id) AS total_students,
        COUNT(*) FILTER (WHERE sr.status = 'Present') AS present,
        COUNT(*) FILTER (WHERE sr.status = 'Absent') AS absent,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE sr.status = 'Present')
          / NULLIF(COUNT(sr.student_id), 0)
        ,2) AS percentage
      FROM attendance_sessions s
      JOIN timetable_entries te ON te.id = s.timetable_id
      JOIN periods p ON p.id = te.period_id
      JOIN batches b ON b.id = te.batch_id
      JOIN departments d ON d.id = b.department_id
      JOIN subjects sub ON sub.id = te.subject_id
      JOIN faculties f ON f.id = te.faculty_id
      JOIN attendance_records sr ON sr.session_id = s.id
      WHERE d.college_id = $1
    `;

    if (deptId) {
      params.push(deptId);
      sql += ` AND d.id = $${params.length}`;
    }
    if (batchId) {
      params.push(batchId);
      sql += ` AND b.id = $${params.length}`;
    }
    if (subjectId) {
      params.push(subjectId);
      sql += ` AND sub.id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (
        LOWER(f.name) ILIKE LOWER($${params.length})
        OR LOWER(sub.name) ILIKE LOWER($${params.length})
        OR TO_CHAR(s.session_date,'YYYY-MM-DD') ILIKE $${params.length}
      )`;
    }

    sql += `
      GROUP BY
        s.id,
        s.session_date,
        p.time_slot,
        p.name,
        d.name,
        b.batch_code,
        te.semester_no,
        sub.name,
        f.name
      ORDER BY s.session_date DESC;
    `;

    const { rows } = await pool.query(sql, params);
    return res.json({ records: rows });
  } catch (err) {
    console.error('Fetch Attendance Error:', err);
    return res.status(500).json({ message: 'Failed to fetch attendance.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// Department-Admin Management
////////////////////////////////////////////////////////////////////////////////
router.get('/fetchDepartmentAdmins', async (req, res) => {
  const collegeId = Number(req.query.college_id);
  if (!collegeId) {
    return res.status(400).json({ message: 'Missing college_id.' });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        a.id,
        a.name,
        a.email,
        a.contact_number,
        a.department_id,
        a.role,
        d.name AS department_name,
        a.created_at
      FROM admins a
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE a.role IN ('department', 'class')
        AND a.college_id = $1
      ORDER BY a.id
      `,
      [collegeId]
    );

    return res.json({ admins: rows });
  } catch (err) {
    console.error('fetchDepartmentAdmins Error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/addDepartmentAdmin', async (req, res) => {
  const { name, email, password, college_id, department_id } = req.body;

  if (!name || !email || !password || !college_id || !department_id) {
    return res.status(400).json({
      message: 'name, email, password, college_id, and department_id are required.',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO admins
         (name, email, password, role, college_id, department_id, created_at)
       VALUES
         ($1, $2, $3, 'department', $4, $5, NOW())
       RETURNING id, name, email, contact_number, department_id, role,
         (SELECT name FROM departments WHERE id = $5) AS department_name,
         created_at`,
      [name, email, password, college_id, department_id]
    );
    return res.status(201).json({ admin: result.rows[0] });
  } catch (err) {
    const pgErr = err as PostgresError;
    console.error('addDepartmentAdmin Error:', pgErr);
    if (pgErr.code === '23505') {
      return res.status(409).json({ message: 'Email already exists.' });
    }
    if (pgErr.code === '23503') {
      return res.status(400).json({ message: 'Invalid college_id or department_id.' });
    }
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/editDepartmentAdmin/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, password, department_id, contact_number } = req.body;

  if (!name || !email || !department_id) {
    return res.status(400).json({ message: 'name, email, and department_id are required.' });
  }

  const updates = ['name = $1', 'email = $2', 'department_id = $3'];
  const params = [name, email, department_id];
  let paramIndex = 4;

  if (password) {
    updates.push(`password = $${paramIndex++}`);
    params.push(password);
  }
  if (contact_number) {
    updates.push(`contact_number = $${paramIndex++}`);
    params.push(contact_number);
  }
  params.push(id);

  try {
    const result = await pool.query(
      `UPDATE admins
         SET ${updates.join(', ')},
             updated_at = NOW()
       WHERE id = $${paramIndex}
         AND role IN ('department', 'class')
       RETURNING id, name, email, contact_number, department_id, role,
         (SELECT name FROM departments WHERE id = $3) AS department_name,
         created_at`,
      params
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    return res.json({ admin: result.rows[0] });
  } catch (err) {
    const pgErr = err as PostgresError;
    console.error('editDepartmentAdmin Error:', pgErr);
    if (pgErr.code === '23505') {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    if (pgErr.code === '23503') {
      return res.status(400).json({ message: 'Invalid department_id.' });
    }
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/deleteDepartmentAdmin/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await pool.query(
      `DELETE FROM admins
       WHERE id = $1
         AND role IN ('department', 'class')
       RETURNING id`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteDepartmentAdmin Error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

////////////////////////////////////////////////////////////////////////////////
// Timetable
////////////////////////////////////////////////////////////////////////////////



// Fetch department options for a college
router.get('/timetable/departments/:collegeId', async (req: Request, res: Response) => {
  const { collegeId } = req.params;
  try {
    const result: QueryResult = await pool.query(
      `SELECT id, name FROM departments WHERE college_id = $1 ORDER BY name`,
      [collegeId]
    );
    res.json({ departments: result.rows.map(row => ({ value: row.id, label: row.name })) });
  } catch (err) {
    const pgErr = err as PostgresError;
    res.status(500).json({ message: `Error fetching departments: ${pgErr.message}` });
  }
});

// Fetch section (batch) options for a college and optional department
router.get('/timetable/sections/:collegeId', async (req: Request, res: Response) => {
  const { collegeId } = req.params;
  const { departmentId } = req.query;
  try {
    let query = `
      SELECT b.id, b.batch_code, b.name, b.batch_year
      FROM batches b
      JOIN departments d ON b.department_id = d.id
      WHERE d.college_id = $1
    `;
    const params: any[] = [collegeId];
    if (departmentId) {
      query += ` AND b.department_id = $2`;
      params.push(departmentId);
    }
    query += ` ORDER BY b.batch_year DESC, b.batch_code`;
    const result: QueryResult = await pool.query(query, params);
    res.json({
      sections: result.rows.map(row => ({
        value: row.id,
        label: `${row.batch_code} (${row.batch_year})`
      }))
    });
  } catch (err) {
    const pgErr = err as PostgresError;
    res.status(500).json({ message: `Error fetching sections: ${pgErr.message}` });
  }
});

// Fetch subject options for a department and semester
router.get('/timetable/subjects/:collegeId/:departmentId/:semesterNo', async (req: Request, res: Response) => {
  const { collegeId, departmentId, semesterNo } = req.params;
  try {
    const result: QueryResult = await pool.query(
      `
      SELECT s.id, s.name
      FROM subjects s
      JOIN departments d ON s.department_id = d.id
      WHERE d.college_id = $1 AND s.department_id = $2
      ORDER BY s.name
      `,
      [collegeId, departmentId]
    );
    res.json({ subjects: result.rows.map(row => ({ value: row.id, label: row.name })) });
  } catch (err) {
    const pgErr = err as PostgresError;
    res.status(500).json({ message: `Error fetching subjects: ${pgErr.message}` });
  }
});

// Fetch faculty options for a department
router.get('/timetable/faculties/:collegeId/:departmentId', async (req: Request, res: Response) => {
  const { collegeId, departmentId } = req.params;
  try {
    const result: QueryResult = await pool.query(
      `
      SELECT f.id, f.name
      FROM faculties f
      JOIN departments d ON f.department_id = d.id
      WHERE d.college_id = $1 AND f.department_id = $2
      ORDER BY f.name
      `,
      [collegeId, departmentId]
    );
    res.json({ faculties: result.rows.map(row => ({ value: row.id, label: row.name })) });
  } catch (err) {
    const pgErr = err as PostgresError;
    res.status(500).json({ message: `Error fetching faculties: ${pgErr.message}` });
  }
});

// Fetch periods for a batch
router.get('/timetable/periods/:batchId', async (req: Request, res: Response) => {
  const { batchId } = req.params;
  try {
    const result: QueryResult = await pool.query(
      `
      SELECT id, batch_id, name, time_slot::text AS time
      FROM periods
      WHERE batch_id = $1
      ORDER BY time_slot
      `,
      [batchId]
    );
    res.json({ periods: result.rows });
  } catch (err) {
    const pgErr = err as PostgresError;
    res.status(500).json({ message: `Error fetching periods: ${pgErr.message}` });
  }
});

// Fetch timetable entries for a batch and semester
router.get('/timetable/entries/:batchId/:semesterNo', async (req: Request, res: Response) => {
  const { batchId, semesterNo } = req.params;
  try {
    const result: QueryResult = await pool.query(
      `
      SELECT
        te.id,
        te.batch_id,
        te.weekday,
        te.period_id,
        te.subject_id,
        te.semester_no,
        te.faculty_id,
        s.name AS subject,
        f.name AS faculty
      FROM timetable_entries te
      JOIN subjects s ON te.subject_id = s.id
      JOIN faculties f ON te.faculty_id = f.id
      WHERE te.batch_id = $1 AND te.semester_no = $2
      `,
      [batchId, semesterNo]
    );
    res.json({ entries: result.rows });
  } catch (err) {
    const pgErr = err as PostgresError;
    res.status(500).json({ message: `Error fetching timetable entries: ${pgErr.message}` });
  }
});

// Create timetable (periods) for a batch and semester
router.post('/timetable/create', async (req: Request, res: Response) => {
  const { batch_id, semester_no, times } = req.body;
  console.log('Request to /timetable/create:', { batch_id, semester_no, times });
  if (!batch_id || !semester_no || !Array.isArray(times) || times.length === 0) {
    return res.status(400).json({ message: 'Invalid request parameters' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete existing periods for the batch and semester
    await client.query(
      `DELETE FROM periods WHERE batch_id = $1 AND semester_no = $2`,
      [batch_id, semester_no]
    );

    // Get department_id for the batch
    const deptResult: QueryResult = await client.query(
      `SELECT department_id FROM batches WHERE id = $1`,
      [batch_id]
    );
    if (deptResult.rows.length === 0) {
      throw new Error('Batch not found');
    }
    const department_id = deptResult.rows[0].department_id;

    // Validate time formats and overlaps
    const timeRanges = times.map((time: string, i: number) => {
      const timeMatch = /^(\d\d):(\d\d)-(\d\d):(\d\d)$/.exec(time);
      if (!timeMatch) {
        throw new Error(`Invalid time format for period ${i + 1}: ${time}. Expected HH:MM-HH:MM`);
      }
      const [, startHour, startMin, endHour, endMin] = timeMatch;
      const start = `${startHour}:${startMin}:00`;
      const end = `${endHour}:${endMin}:00`;
      const startMinutes = parseInt(startHour) * 60 + parseInt(startMin);
      const endMinutes = parseInt(endHour) * 60 + parseInt(endMin);
      if (startMinutes >= endMinutes) {
        throw new Error(`Invalid time range for period ${i + 1}: start (${start}) must be before end (${end})`);
      }
      return { start: startMinutes, end: endMinutes, index: i + 1 };
    });

    // Check for overlaps
    for (let i = 0; i < timeRanges.length; i++) {
      for (let j = i + 1; j < timeRanges.length; j++) {
        const range1 = timeRanges[i];
        const range2 = timeRanges[j];
        if (range1.start < range2.end && range2.start < range1.end) {
          throw new Error(
            `Time overlap detected between Period ${range1.index} (${times[i]}) and Period ${range2.index} (${times[j]})`
          );
        }
      }
    }

    // Insert new periods
    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      const [, startHour, startMin, endHour, endMin] = /^(\d\d):(\d\d)-(\d\d):(\d\d)$/.exec(time)!;
      const start = `${startHour}:${startMin}:00`;
      const end = `${endHour}:${endMin}:00`;
      const startTs = `1970-01-01 ${start}`;
      const endTs = `1970-01-01 ${end}`;
      const timeRange = `[${startTs},${endTs})`;
      const name = `Period ${i + 1}`;
      await client.query(
        `
        INSERT INTO periods (department_id, batch_id, semester_no, time_slot, name)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [department_id, batch_id, semester_no, timeRange, name]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Timetable created successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    const pgErr = err as PostgresError;
    console.error('Error in /timetable/create:', pgErr);
    res.status(500).json({ message: `Error creating timetable: ${pgErr.message}` });
  } finally {
    client.release();
  }
});

// Save timetable entry (create or update)
router.post('/timetable/entry', async (req: Request, res: Response) => {
  const { id, section_id, weekday, period_id, subject_id, faculty_id, semester_no } = req.body;
  if (!section_id || !weekday || !period_id || !subject_id || !faculty_id || !semester_no) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (id) {
      // Update existing entry
      await client.query(
        `
        UPDATE timetable_entries
        SET subject_id = $1, faculty_id = $2
        WHERE id = $3
        `,
        [subject_id, faculty_id, id]
      );
    } else {
      // Create new entry
      await client.query(
        `
        INSERT INTO timetable_entries (batch_id, semester_no, weekday, period_id, subject_id, faculty_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [section_id, semester_no, weekday, period_id, subject_id, faculty_id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: id ? 'Entry updated' : 'Entry created' });
  } catch (err) {
    await client.query('ROLLBACK');
    const pgErr = err as PostgresError;
    res.status(500).json({ message: `Error saving timetable entry: ${pgErr.message}` });
  } finally {
    client.release();
  }
});

// Delete timetable entry
router.delete('/timetable/entry/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result: QueryResult = await pool.query(
      `DELETE FROM timetable_entries WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    const pgErr = err as PostgresError;
    res.status(500).json({ message: `Error deleting timetable entry: ${pgErr.message}` });
  }
});
export default router;