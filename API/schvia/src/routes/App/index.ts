import express from 'express';
import { Router } from 'express';
import { pool } from '../../db';
import { sendMail } from '../../mailer';
import dotenv from 'dotenv';
dotenv.config();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const router = express.Router();

console.log("================ ENTERED IN TO APP ROUTES============");
router.get('/', (req, res) => {
  res.send('{"message":"Hello from React Native + Express + TypeScript + PostgreSQL!"}');
});

router.get('/studentdetails/:id', async (req, res) => {
  const studentId = req.params.id;

  const query = `
            WITH student_info AS (
      SELECT 
        s.id AS student_id,
        s.name AS student_name,
        s.gmail AS student_gmail,
        s.semester_no,
        sec.id AS section_id,
        sec.section_code AS student_section_code,
        sec.name AS student_section_name,
        sec.batch_year AS student_batch_year,
        d.dept_code AS student_department_code,
        d.name AS student_department_name,
        c.college_code AS student_college_code,
        c.name AS student_college_name
      FROM students s
      JOIN sections sec ON s.section_id = sec.id
      JOIN departments d ON sec.department_id = d.id
      JOIN colleges c ON d.college_id = c.id
      WHERE s.id = $1
    ),
    attendance_data AS (
      SELECT
        ar.student_id,
        COUNT(*) FILTER (WHERE ar.status = 'Present') AS present_count,
        COUNT(*) FILTER (WHERE ar.status = 'Absent') AS absent_count,
        COUNT(*) AS total_count
      FROM attendance_records ar
      JOIN attendance_sessions ses ON ar.session_id = ses.id
      WHERE ar.student_id = $1
      GROUP BY ar.student_id
    ),
    attendance_today AS (
      SELECT
        ar.student_id,
        ROUND(
          100.0 * COUNT(*) FILTER (WHERE ar.status = 'Present') / NULLIF(COUNT(*), 0),
          2
        ) AS student_attendence_percentage_today
      FROM attendance_records ar
      JOIN attendance_sessions ses ON ar.session_id = ses.id
      WHERE ar.student_id = $1 AND ses.session_date = CURRENT_DATE
      GROUP BY ar.student_id
    )
    SELECT 
      si.student_id,
      si.student_name,
      si.student_gmail,
      si.student_college_code,
      si.student_college_name,
      si.student_department_code,
      si.student_department_name,
      si.student_section_code,
      si.semester_no,
      si.student_batch_year,
      si.student_section_name,
      CONCAT(
          CASE 
              WHEN si.semester_no IN (1, 2) THEN 'I'
              WHEN si.semester_no IN (3, 4) THEN 'II'
              WHEN si.semester_no IN (5, 6) THEN 'III'
              WHEN si.semester_no IN (7, 8) THEN 'IV'
              ELSE 'N/A'
          END,
          ' - ',
          CASE 
              WHEN MOD(si.semester_no, 2) = 1 THEN 'I'
              WHEN MOD(si.semester_no, 2) = 0 THEN 'II'
              ELSE 'N/A'
          END
      ) AS semester_abbreviation,
      COALESCE(ad.total_count, 0) AS total_classes,
      COALESCE(ad.present_count, 0) AS present_classes,
      COALESCE(ad.absent_count, 0) AS absent_classes,
      CASE 
        WHEN COALESCE(ad.total_count, 0) = 0 THEN 0
        ELSE ROUND(100.0 * COALESCE(ad.present_count, 0) / ad.total_count, 2)
      END AS student_attendence_percentage,
      CASE 
        WHEN COALESCE(ad.total_count, 0) = 0 THEN 0
        ELSE ROUND(100.0 * COALESCE(ad.absent_count, 0) / ad.total_count, 2)
      END AS student_attendence_absent_percentage,
      COALESCE(at.student_attendence_percentage_today, 0) AS student_attendence_percentage_today
    FROM student_info si
    LEFT JOIN attendance_data ad ON si.student_id = ad.student_id
    LEFT JOIN attendance_today at ON si.student_id = at.student_id;
  `;

  try {
    const result = await pool.query(query, [studentId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching student details:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/studentlogin', async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
  try {
    console.log('Attempting to login...');
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    res.json({ success: true, message: 'Login successful', user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/studentRegister', async (req, res) => {
  const { rollNo } = req.body;
  console.log(rollNo);
  try {
    // 1. Fetch student by roll number
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [rollNo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const student  = result.rows[0];

    // 2. Generate random 8-digit alphanumeric password
    const rawPassword = crypto.randomBytes(4).toString('hex'); // 8-character hex string
    const hashedPassword = await bcrypt.hash(rawPassword, 10); // Securely hash password

    // 3. Update password in DB
    await pool.query('UPDATE students SET password = $1 WHERE id = $2', [rawPassword, rollNo]);

    // 4. Send email using nodemailer
    const message = `Hello ${student.name},\n\nYour registration is successful. Your password is: ${rawPassword}\n\nPlease change it after your first login.\n\nRegards,\nSchVia Team`;

    const subject = 'SchVia Registration Password';

    const Receiver_email =
    process.env.DUMMY_EMAIL_TO_TEST && process.env.DUMMY_EMAIL_TO_TEST !== 'null'
    ? process.env.DUMMY_EMAIL_TO_TEST
    : student.gmail;

    console.log('Receiver_email:', Receiver_email);
    await sendMail(Receiver_email, subject, message);
    // await sendMail(student.gmail, subject, message);

    // 5. Respond to frontend
    res.status(200).json({
      success: true,
      message: `Password has been sent to ${student.gmail}`
    });    

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/studentForgotPassword', async (req, res) => {
  const { rollNo } = req.body;
  console.log(rollNo);
  try {
    // 1. Fetch student by roll number
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [rollNo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const student  = result.rows[0];

    // 2. Generate random 8-digit alphanumeric password
    const rawPassword = crypto.randomBytes(4).toString('hex'); // 8-character hex string
    const hashedPassword = await bcrypt.hash(rawPassword, 10); // Securely hash password

    // 3. Update password in DB
    await pool.query('UPDATE students SET password = $1 WHERE id = $2', [rawPassword, rollNo]);

    // 4. Send email using nodemailer
    const message = `Hello ${student.name},\n\nYour password is: ${rawPassword}\n\nPlease change it after your first login.\n\nRegards,\nSchVia Team`;

    // const subject = 'SchVia Registration Password';
    const subject = 'SchVia Password Reset';

    const Receiver_email =
    process.env.DUMMY_EMAIL_TO_TEST && process.env.DUMMY_EMAIL_TO_TEST !== 'null'
    ? process.env.DUMMY_EMAIL_TO_TEST
    : student.gmail;

    console.log('Receiver_email:', Receiver_email);
    await sendMail(Receiver_email, subject, message);
    // await sendMail(student.gmail, subject, message);

    // 5. Respond to frontend
    res.status(200).json({
      success: true,
      message: `Password has been sent to ${student.gmail}`
    });    

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/studentResetPassword', async (req, res) => {
  
  const { student_id, current_password, new_password } = req.body;

  try {
    // 1. Fetch student by roll number
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const student  = result.rows[0];

    // 2. Generate hashed password
    const hashedPassword = await bcrypt.hash(new_password, 10); // Securely hash password

    // 3. Update password in DB
    await pool.query('UPDATE students SET password = $1 WHERE id = $2', [new_password, student_id]);

    // 4. Send email using nodemailer
    const message = `Hello ${student.name},\n\nYour password has been reset.\n\nRegards,\nSchVia Team`;

    
    const subject = 'SchVia Password Reset';

    const Receiver_email =
    process.env.DUMMY_EMAIL_TO_TEST && process.env.DUMMY_EMAIL_TO_TEST !== 'null'
    ? process.env.DUMMY_EMAIL_TO_TEST
    : student.gmail;

    console.log('Receiver_email:', Receiver_email);
    await sendMail(Receiver_email, subject, message);

    // 5. Respond to frontend
    res.status(200).json({
      success: true,
      message: `Password has been reset! Please Login again.`
    });    

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
})


router.get('/subjects/:studentId', async (req, res) => {
  const studentId = req.params.studentId;

  const query = `
    SELECT DISTINCT
      s.id AS subject_id,
      s.subject_code AS code,
      s.name AS name,
      f.faculty_name AS faculty
    FROM subjects s
    JOIN faculty_subjects fs ON s.id = fs.subject_id
    JOIN faculties f ON fs.faculty_id = f.id
    JOIN sections sec ON fs.section_id = sec.id
    JOIN students st ON st.section_id = sec.id
    WHERE st.id = $1 AND s.semester_no = st.semester_no
    ORDER BY s.name;
  `;

  try {
    const result = await pool.query(query, [studentId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No subjects found for this student' });
    }
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching subjects:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
