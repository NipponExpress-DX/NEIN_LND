import React from 'react';
import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';  
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
import MonthlyTrainingReport from '../Admin/Reports/MonthlyTrainingReport.js';

// Import EHS Kiosk Components
import PathSelection from '../pages/Kiosk/PathSelection';
import InductionTypeSelection from '../pages/Kiosk/InductionTypeSelection';
import KioskEntry from '../pages/Kiosk/Kioskentry';
import KioskWelcome from '../pages/Kiosk/KioskWelcome';
import PhotoCapture from '../pages/Kiosk/PhotoCapture';
import TrainingCategorySelection from '../pages/Kiosk/TrainingCategorySelection';
import KioskDetails  from '../pages/Kiosk/KioskDetails.js';
import EHSConsent    from '../pages/Kiosk/EHSConsent.js';
import InductionCompletion  from '../pages/Kiosk/InductionCompletion.js';
import VideoTraining from '../pages/Kiosk/VideoTraining';
import KioskQuiz     from '../pages/Kiosk/KioskQuiz';
import LanguageSelection from "../pages/Kiosk/LanguageSelection";
import VisitorLookup from "../pages/Kiosk/VisitorLookup";

import EHSLogin from "../pages/Kiosk/EHSLogin";
import EHSDashboard from "../pages/Kiosk/EHSDashboard";
import EHSAdminDashboard from "../pages/Kiosk/EHSAdminDashboard";
import EHSWarehouseAdmin   from "../pages/Kiosk/EHSWarehouseAdmin.js";
import KioskActivation from '../pages/Kiosk/KioskActivation';
import KioskGuard      from '../pages/Kiosk/KioskGuard';
// Add these imports near your other Kiosk imports
import EHSAdminLogin  from "../pages/Kiosk/EHSAdminLogin.js";
import EHSAdminUsers  from "../pages/Kiosk/EHSAdminUsers.js";
import EHSReports     from "../pages/Kiosk/EHSReports.js";
import '../../css/Admincss/EHSLayout.css';
import ProtectedRoute from './ProtectedRoute';
import AdminCalendar from '../Admin/Dashboard/AdminCalendar';
import EHSAdminChangePassword from '../pages/Kiosk/EHSAdminChangePassword.js';
import EHSWorkspace from '../pages/Kiosk/EHSWorkspace.js';
import EHSTrainingAdmin from '../pages/Kiosk/EHSTrainingAdmin.js';
import VisitorLookupLogin  from '../pages/Kiosk/VisitorLookupLogin.js';

function AppRoutes() {
  const location    = useLocation();

const isKioskRoute = location.pathname.startsWith("/kiosk") || location.pathname.startsWith("/ehs");
  // The global body padding-top (80px, from Header.css) exists only to
  // clear the LND fixed <Header/>. Kiosk/EHS routes don't render that
  // header (see the !isKioskRoute check below), so strip the offset
  // while on those routes and restore it the moment we leave them.
  useEffect(() => {
    document.body.classList.toggle("ehs-no-header-offset", isKioskRoute);
    return () => document.body.classList.remove("ehs-no-header-offset");
  }, [isKioskRoute]);

  return (
    <>
      {!isKioskRoute && <Header />}  {/* ← suppress header on all kiosk screens */}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* ============================================
            EHS KIOSK ROUTES - Public
            ============================================ */}
       <Route path="/kiosk">
        <Route path="start" element={<KioskActivation />} />  {/* public */}

        {/* All other kiosk routes require an active device session */}
        <Route path="welcome"           element={<KioskGuard><KioskWelcome /></KioskGuard>} />
        <Route path="inductiontype"     element={<KioskGuard><InductionTypeSelection /></KioskGuard>} />
        <Route path="consent"           element={<KioskGuard><EHSConsent /></KioskGuard>} />
        <Route path="details"           element={<KioskGuard><KioskDetails /></KioskGuard>} />
        <Route path="photo"             element={<KioskGuard><PhotoCapture /></KioskGuard>} />
        <Route path="training-category" element={<KioskGuard><TrainingCategorySelection /></KioskGuard>} />
        <Route path="video"             element={<KioskGuard><VideoTraining /></KioskGuard>} />
        <Route path="quiz"              element={<KioskGuard><KioskQuiz /></KioskGuard>} />
       
        <Route path="completion"        element={<KioskGuard><InductionCompletion /></KioskGuard>} />
         <Route path="language"          element={<KioskGuard><LanguageSelection /></KioskGuard>} />
        <Route path="lookup"            element={<KioskGuard><VisitorLookup /></KioskGuard>} />
        {/* <Route path="/kiosk/lookup-login" element={<KioskGuard><VisitorLookupLogin /></KioskGuard>} /> */}
        <Route path="lookup-login" element={<KioskGuard><VisitorLookupLogin /></KioskGuard>} />
      </Route>

       {/* ============================================
          EHS SELF-SERVICE ROUTES - Public (direct link flow only)
          ============================================ */}
          <Route path="/ehs">
            <Route path="login"                 element={<EHSLogin />} />
            <Route path="dashboard/:visitor_id" element={<EHSDashboard />} />
              
            {/* Admin / HR auth + tools */}
            <Route path="admin/login"           element={<EHSAdminLogin />} />
            <Route path="admin"                 element={<EHSAdminDashboard />} />
            <Route path="admin/warehouses"      element={<EHSWarehouseAdmin />} />
            <Route path="admin/users"           element={<EHSAdminUsers />} />
            <Route path="admin/reports"         element={<EHSReports />} />
             <Route path="admin/training-content"   element={<EHSTrainingAdmin />} />
            <Route path="admin/change-password"         element={<EHSAdminChangePassword />} />
          </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/pathselection" element={<PathSelection />} />
          <Route path="/ehs/workspace" element={<EHSWorkspace />} />

          <Route path="/admindashboard" element={<AdminDashboard />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"            element={<Dashboard />} />
            <Route path="dashboardcontent"     element={<AdminDashboardContent />} />
            <Route path="calendar"             element={<AdminCalendar />} />
            <Route path="agenda"               element={<Agenda />} />
            <Route path="setup"                element={<SytemSetup />} />
            <Route path="reports"              element={<Reports />} />
            <Route path="auditLog"             element={<AuditLog />} />
            <Route path="monthlyTrainingReport" element={<MonthlyTrainingReport />} />
            <Route path="FeedbackInfo"         element={<FeedbackInfo />} />
            <Route path="lnd/traningtopicmaster"   element={<TrainingTopicMaster />} />
            <Route path="lnd/trainingstaffcategory" element={<TrainingStaffCategory />} />
            <Route path="lnd/trainingformsmaster"   element={<TrainingFormsMaster />} />
            <Route path="lnd/trainingquizmaster"    element={<TrainingQuizMaster />} />
            <Route path="lnd/trainertypemaster"     element={<TrainerTypeMaster />} />
            <Route path="lnd/trainerinfomaster"     element={<TrainerInfoMaster />} />
            <Route path="lnd/rolemaster"        element={<RoleMaster />} />
            <Route path="lnd/RoleManagement"    element={<RoleManagement />} />
            <Route path="lnd/roleaccess"        element={<RoleAccess />} />
          </Route>

          <Route path="/userdashboard" element={<UserDashboard />}>
            <Route index element={<Navigate to="userdashboardcontent" replace />} />
            <Route path="userdashboardcontent" element={<DashboardContent />} />
            <Route path="UserTrainingSummary"  element={<UserTrainingSummary />} />
            <Route path="userrequisition"      element={<UserRequisition />} />
          </Route>

          <Route path="/Masters/LND/TraningTopicMaster"   element={<TrainingTopicMaster />} />
          <Route path="/Masters/LND/TrainingStaffCategory" element={<TrainingStaffCategory />} />
          <Route path="/Masters/LND/TrainingQuizMaster"   element={<TrainingQuizMaster />} />
          <Route path="/Masters/LND/TrainerTypeMaster"    element={<TrainerTypeMaster />} />
          <Route path="/Masters/LND/TrainerInfoMaster"    element={<TrainerInfoMaster />} />
          <Route path="/Masters/LND/RoleMaster"           element={<RoleMaster />} />
          <Route path="/Masters/LND/RoleManagement"       element={<RoleManagement />} />
          <Route path="/Masters/LND/RoleAccess"           element={<RoleAccess />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default AppRoutes; 