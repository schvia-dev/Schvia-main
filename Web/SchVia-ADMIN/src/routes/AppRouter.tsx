import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import DepartmentsPage from '../pages/departments/DepartmentsPage';
import StudentsPage from '../pages/students/StudentsPage';
import FacultiesPage from '../pages/faculties/FacultiesPage';
import SubjectsPage from '../pages/subjects/SubjectsPage';
import SectionsPage from '../pages/sections/SectionsPage';
import CollegePage from '../pages/college/CollegePage';
import TimetablePage from '../pages/timetable/TimetablePage';
import AttendancePage from '../pages/attendance/AttendancePage';
import AdminProfilePage from '../pages/admin/AdminProfilePage';
import AdminManagementPage from '../pages/admin/AdminManagementPage';
import ReportsPage from '../pages/reports/ReportsPage';
import DashboardLayout from '../layouts/DashboardLayout';
import NotFoundPage from '../pages/NotFoundPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="college" element={<CollegePage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="sections" element={<SectionsPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="faculties" element={<FacultiesPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="admin/profile" element={<AdminProfilePage />} />
          <Route path="admin/management" element={<AdminManagementPage />} />
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};