import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../Admin/Login/Login';
import Dashboard from '../Admin/Dashboard/Dashboard';
import NotFound from '../Admin/NotFound';
import AdminDashboard from '../Admin/Dashboard/AdminDashboard';
import AdminDashboardContent from '../Admin/Dashboard/AdminDashboardContent';
import Header from '../Admin/Header/Header';
import SytemSetup from '../Admin/Masters/SytemSetup';
import Agenda from '../Admin/Agenda/Agenda';
import DashboardContent from '../user/DashboardContent';
import UserRequisition from '../user/UserRequisition';
import UserTrainingSummary from '../user/UserTrainingSummary';
import 'bootstrap/dist/css/bootstrap.min.css';
import UserDashboard from '../user/UserDashboard';
import RoleAccess from '../Admin/Masters/masters/RoleAccess';
import RoleManagement from '../Admin/Masters/masters/RoleManagement';
import RoleMaster from '../Admin/Masters/masters/RoleMaster';
import TrainerInfoMaster from '../Admin/Masters/masters/TrainerInfoMaster';
import TrainerTypeMaster from '../Admin/Masters/masters/TrainerTypeMaster';
import TrainingFormsMaster from '../Admin/Masters/masters/TrainingFormsMatser';
import TrainingQuizMaster from '../Admin/Masters/masters/Quiz';
import TrainingStaffCategory from '../Admin/Masters/masters/TrainingStaffCategory';
import TrainingTopicMaster from '../Admin/Masters/masters/TraningTopicMaster';
import Reports from '../Admin/Reports/Reports';
import AuditLog from '../Admin/Reports/AuditLog';
import FeedbackInfo from '../Admin/Reports/FeedbackInfo';


import ProtectedRoute from './ProtectedRoute';
import AdminCalendar from '../Admin/Dashboard/AdminCalendar';

function AppRoutes() {
  return (
    <>
      <Header />
      <Routes>
        {/* Default route redirects to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Login route (public) */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes (require authentication) */}
        <Route element={<ProtectedRoute />}>
          {/* Admin Dashboard routes */}
          <Route path="/admindashboard" element={<AdminDashboard />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="dashboardcontent" element={<AdminDashboardContent />} />
            <Route path="calendar" element={<AdminCalendar />} />

            <Route path="agenda" element={<Agenda />} />
            <Route path="setup" element={<SytemSetup />} />
            <Route path="reports" element={<Reports />} />
            <Route path="auditLog" element={<AuditLog />} />
            <Route path="FeedbackInfo" element={<FeedbackInfo />} />
            <Route path="lnd/traningtopicmaster" element={<TrainingTopicMaster />} />
            <Route path="lnd/trainingstaffcategory" element={<TrainingStaffCategory />} />
            <Route path="lnd/trainingformsmaster" element={<TrainingFormsMaster />} />
            <Route path="lnd/trainingquizmaster" element={<TrainingQuizMaster />} />
            <Route path="lnd/trainertypemaster" element={<TrainerTypeMaster />} />
            <Route path="lnd/trainerinfomaster" element={<TrainerInfoMaster />} />
            <Route path="lnd/rolemaster" element={<RoleMaster />} />
            <Route path="lnd/RoleManagement" element={<RoleManagement />} />
            <Route path="lnd/roleaccess" element={<RoleAccess />} />
          </Route>

          {/* User Dashboard routes */}
          <Route path="/userdashboard" element={<UserDashboard />}>
            <Route index element={<Navigate to="userdashboardcontent" replace />} />
            <Route path="userdashboardcontent" element={<DashboardContent />} />
            <Route path="UserTrainingSummary" element={<UserTrainingSummary />} />
            <Route path="userrequisition" element={<UserRequisition />} />
          </Route>

          {/* Masters routes */}
          <Route path="/Masters/LND/TraningTopicMaster" element={<TrainingTopicMaster />} />
          <Route path="/Masters/LND/TrainingStaffCategory" element={<TrainingStaffCategory />} />
          <Route path="/Masters/LND/TrainingQuizMaster" element={<TrainingQuizMaster />} />
          <Route path="/Masters/LND/TrainerTypeMaster" element={<TrainerTypeMaster />} />
          <Route path="/Masters/LND/TrainerInfoMaster" element={<TrainerInfoMaster />} />
          <Route path="/Masters/LND/RoleMaster" element={<RoleMaster />} />
          <Route path="/Masters/LND/RoleManagement" element={<RoleManagement />} />
          <Route path="/Masters/LND/RoleAccess" element={<RoleAccess />} />
        </Route>

        {/* 404 Not Found route (public) */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default AppRoutes;