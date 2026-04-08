import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import '../../../css/Admincss/AdminDashboard.css';

// Modern icon imports that match Nippon Express purple and green theme
import {Modal} from "@mui/material";
import { BsBarChartFill } from 'react-icons/bs';          // Training Summary
import { FiUsers } from 'react-icons/fi';                 // Masters
import { HiOutlineDocumentReport } from 'react-icons/hi'; // Reports
import { FiChevronDown, FiChevronRight, FiMenu } from 'react-icons/fi'; // Arrows and menu
import { IoStatsChartOutline, IoTimeOutline, IoChatbubbleEllipsesOutline } from 'react-icons/io5'; // Submenu icons
import dashboard from '../../../images/dashboard.png';   
import training from '../../../images/training.png';   
import login from '../../../images/login.png';   
import marketing from '../../../images/marketing.png';   
import report from '../../../images/report.png';   
import feedback from '../../../images/feedback.png';   
import investigation from '../../../images/investigation.png';   
import { IoSpeedometer } from 'react-icons/io5';
import { FaUsersGear } from "react-icons/fa6";
import { FaChartBar, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";
import { GiProgression } from "react-icons/gi";
import { FaPersonCircleCheck } from "react-icons/fa6";


function AdminDashboard() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); 
    const [selectedMenu, setSelectedMenu] = useState('');
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [showReportsSubmenu, setShowReportsSubmenu] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
         const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    // Add a PDF path
const manualPath = process.env.PUBLIC_URL + "/videos/Learning_Development_Manual.pdf";

    // Get role permissions from sessionStorage
    const rolePermissions = JSON.parse(sessionStorage.getItem("rolePermissions")) || {};
    
    // Fixed video path - try multiple approaches
    const videoPath = '/videos/l&d.mp4'; // Direct path from public folder
    // Alternative paths to try:
    // const videoPath = process.env.PUBLIC_URL + '/videos/l&d.mp4';
    // const videoPath = require('../../../public/videos/l&d.mp4'); // if moved to src

    // Function to check if a menu should be displayed
    const hasAccess = (section) => {
        if (!rolePermissions[section]) return false;

        // Check if any permission inside the section has "1"
        return Object.values(rolePermissions[section]).some(subSection =>
            Object.values(subSection).some(permission => permission === 1)
        );
    };

    // Check access for specific report
    const hasReportAccess = (reportName) => {
        if (!rolePermissions["Reports"]) return false;
        const reportPermissions = rolePermissions["Reports"][reportName];
        return reportPermissions && (reportPermissions["View"] === 1 || reportPermissions["View/Create/Edit"] === 1);
    };

    // Check if at least one menu has access
    const shouldShowSidebar = ["Training Summary", "Masters", "Requitement", "Dashboard", "Reports"].some(hasAccess);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    
    const handleMenuClick = (menu) => {
        setSelectedMenu(menu);
    };

    const toggleSubmenu = (menuName) => {
        if (menuName === 'reports') {
            setShowReportsSubmenu(!showReportsSubmenu);
        } else {
            setOpenSubmenu((prevSubmenu) =>
                prevSubmenu === menuName ? null : menuName
            );
        }
    };

    // Function to handle video load error
    const handleVideoError = (e) => {
        console.error('Video failed to load:', e);
        console.log('Attempted video path:', videoPath);
    };

    if (!shouldShowSidebar) {
        return <div className="main-content"><Outlet /></div>; // No sidebar, only main content
    }

    return (
        <div className="admin-dashboard">
            <div className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}> 
                <ul className="nav-menu">
                    {hasAccess("Dashboard") && (
                        <li className="nav-item">
                            <Link
                                to="dashboard"
                                className={selectedMenu === 'dashboard' ? 'selected' : ''}
                                onClick={() => handleMenuClick('dashboard')}
                                title="Dashboard"
                            > 
                                <GiProgression className="icon" /> {!isSidebarCollapsed && 'Dashboard'}
                                {!isSidebarCollapsed && <span>Dashboard</span>}
                            </Link>
                        </li>
                    )}
    
                    {hasAccess("Training Summary") && (
                        <li className="nav-item">
                            <Link
                                to="dashboardcontent"
                                className={selectedMenu === 'dashboardcontent' ? 'selected' : ''}
                                onClick={() => handleMenuClick('dashboardcontent')}
                                title="Training Summary"
                            >
                                <IoSpeedometer className="icon" /> {!isSidebarCollapsed && 'Training Summary'}
                                {!isSidebarCollapsed && <span>Training Summary</span>}
                            </Link>
                        </li>
                    )}
    
                    {hasAccess("Masters") && (
                        <li className="nav-item">
                            <Link
                                to="setup"
                                className={selectedMenu === 'setup' ? 'selected' : ''}
                                onClick={() => handleMenuClick('setup')}
                                title="Masters"
                            >
                                <FaUsersGear className="icon" /> {!isSidebarCollapsed && 'Masters'}
                                {!isSidebarCollapsed && <span>Masters</span>}
                            </Link>
                        </li>
                    )}
    
                    {hasAccess("Reports") && (
                        <li className="nav-item reports-section">
                            <div
                                className={`submenu-header ${selectedMenu.startsWith('reports') ? 'selected' : ''}`}
                                onClick={() => {
                                    toggleSubmenu('reports');
                                }}
                                title="Reports"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaChartBar className="icon" />
                                    {!isSidebarCollapsed && <span>Reports</span>}
                                    {!isSidebarCollapsed && (
                                        <>
                                            {showReportsSubmenu ? (
                                                <FiChevronDown className="submenu-arrow" />
                                            ) : (
                                                <FiChevronRight className="submenu-arrow" />
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Show submenu items for Reports only when showReportsSubmenu is true */}
                            {showReportsSubmenu && (
                                <ul className={`submenu ${isSidebarCollapsed ? 'collapsed-submenu' : ''}`}>
                                    {hasReportAccess("Reports") && (
                                        <li className="submenu-item">
                                            <Link
                                                to="reports"
                                                className={`submenu-link ${selectedMenu === 'reports' ? 'selected' : ''}`}
                                                onClick={() => handleMenuClick('reports')}
                                                title="Training Reports"
                                            >
                                                <div className="icon-container">
                                                    <img 
                                                        src={report} 
                                                        alt="Training Reports" 
                                                        className="icon" 
                                                        style={{ 
                                                            width: '20px', 
                                                            height: '20px', 
                                                            objectFit: 'contain' 
                                                        }} 
                                                    />
                                                </div>
                                                {!isSidebarCollapsed && <span>Training Reports</span>}
                                            </Link>
                                        </li>
                                    )}

                                    {hasReportAccess("AuditLog") && (
                                        <li className="submenu-item">
                                            <Link
                                                to="auditLog"
                                                className={`submenu-link ${selectedMenu === 'auditLog' ? 'selected' : ''}`}
                                                onClick={() => handleMenuClick('auditLog')}
                                                title="Audit Log"
                                            >
                                                <div className="icon-container">
                                                    <img 
                                                        src={investigation} 
                                                        alt="Audit Log" 
                                                        className="icon" 
                                                        style={{ 
                                                            width: '20px', 
                                                            height: '20px', 
                                                            objectFit: 'contain' 
                                                        }} 
                                                    />
                                                </div>
                                                {!isSidebarCollapsed && <span>Audit Log</span>}
                                            </Link>
                                        </li>
                                    )}

                                    {hasReportAccess("FeedbackInfo") && (
                                        <li className="submenu-item">
                                            <Link
                                                to="feedbackInfo"
                                                className={`submenu-link ${selectedMenu === 'feedbackInfo' ? 'selected' : ''}`}
                                                onClick={() => handleMenuClick('feedbackInfo')}
                                                title="Feedback Info"
                                            >
                                                <div className="icon-container">
                                                    <img 
                                                        src={feedback} 
                                                        alt="Feedback Info" 
                                                        className="icon" 
                                                        style={{ 
                                                            width: '20px', 
                                                            height: '20px', 
                                                            objectFit: 'contain' 
                                                        }} 
                                                    />
                                                </div>
                                                {!isSidebarCollapsed && <span>Feedback Info</span>}
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </li>
                    )}
                </ul>
            </div>
            
            <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Outlet context={{ isSidebarCollapsed }} />
            </div>
            
            {/* Video Tutorial Button */}
            <div 
                className="video-tutorial-button"
                onClick={() => setIsVideoModalOpen(true)}
                title="User Manual/Video"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                {!isSidebarCollapsed && <span>Tutorial</span>}
            </div>
            
            {/* Video Modal - Fixed Modal component usage */}
           <Modal
    open={isVideoModalOpen}
    onClose={() => setIsVideoModalOpen(false)}
    aria-labelledby="video-modal-title"
>
    <div
        style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '800px',
            backgroundColor: 'white',
            border: '2px solid #000',
            borderRadius: '8px',
            boxShadow: 24,
            padding: '16px',
        }}
    >
        {/* Close Button */}
        <button
            onClick={() => setIsVideoModalOpen(false)}
            style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
            }}
        >
            &times;
        </button>

        {/* Menu */}
        {!showVideo && (
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#1A005D', fontWeight: 'bold', fontSize: '24px' }}>
                        User Manual & Tutorial
                    </h2>

                <div style={{ marginTop: '20px' }}>
                    <button
                        onClick={() => setShowVideo(true)}
                        style={menuBtnStyle}
                    >
                        🎥 Watch Tutorial
                    </button>

                    <a
                        href={manualPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...menuBtnStyle, textDecoration: 'none', display: 'block' }}
                    >
                        📄 Download Manual (PDF)
                    </a>
                </div>
            </div>
        )}

        {/* Video View */}
        {showVideo && (
            <div>
                <video controls width="100%" height="500">
                    <source src={videoPath} type="video/mp4" />
                    <source src={process.env.PUBLIC_URL + '/videos/l&d.mp4'} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <button onClick={() => setShowVideo(false)} style={menuBtnStyle}>
                        ⬅ Back
                    </button>
                </div>
            </div>
        )}
    </div>
</Modal>

        </div>
    );
}
const menuBtnStyle = {
    display: "block",
    margin: "10px auto",
    padding: "10px 15px",
    fontSize: "16px",
    backgroundColor: "#1A005D",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
};

export default AdminDashboard;