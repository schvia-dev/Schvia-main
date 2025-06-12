-- Insert a college
INSERT INTO colleges (college_code, name, established, website, email, phone, address, logo)
VALUES ('COLL001', 'Sample College', '2000', 'www.samplecollege.edu', 'info@samplecollege.edu', '123-456-7890', '123 College St, City', '/logos/coll001.png')
RETURNING id;

-- Insert a department (note the college_id from the previous insert, e.g., 1)
INSERT INTO departments (college_id, dept_code, name)
VALUES (1, 'CS', 'Computer Science')
RETURNING id;

-- Insert a college admin (no department_id)
INSERT INTO admins (college_id, role, name, email, contact_number, password)
VALUES (1, 'college', 'College_admin', 'collegeadmin@samplecollege.edu', '987-654-3210', 'admin123');

-- Insert a department admin (with department_id from the previous insert, e.g., 1)
INSERT INTO admins (college_id, department_id, role, name, email, contact_number, password)
VALUES (1, 1, 'department', 'Dept_admin', 'deptadmin@samplecollege.edu', '987-654-3211', 'dept123');