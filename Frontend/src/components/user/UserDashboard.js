import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import '../../css/Admincss/AdminDashboard.css';
import { IoSpeedometer } from 'react-icons/io5';
import { FaUsersGear } from "react-icons/fa6";
import { FaChartBar } from "react-icons/fa";
import { RiAdminFill } from "react-icons/ri";
import { GiProgression } from "react-icons/gi";

function UserDashboard() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); 
    const [selectedMenu, setSelectedMenu] = useState('');
    const [isHovered, setIsHovered] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const handleMenuClick = (menu) => {
        setSelectedMenu(menu);
        if (!isSidebarCollapsed) setIsSidebarCollapsed(true); 
    };

    const handleMouseEnter = () => {
        setIsSidebarCollapsed(false);  
    };

    const handleMouseLeave = () => {
        setIsSidebarCollapsed(true);  
    };

    const handleMouseOver = () => {
        setIsHovered(true);  
    };

    const handleMouseOut = () => {
        setIsHovered(false); 
       
        setTimeout(() => {
            if (!isHovered) {
                setIsSidebarCollapsed(true);  
            }
        }, 200);
    };

    return (
        <div className="admin-dashboard">
            <div
                className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onMouseOver={handleMouseOver}
                onMouseOut={handleMouseOut}
            >
                <div onClick={toggleSidebar} style={{ cursor: 'pointer', fontSize: '24px', padding: '10px' }}>
                    <RiAdminFill className="icon" />
                    {!isSidebarCollapsed && 'USER'}
                </div>
                <ul>
                   
                    <li>
                        <Link to="userdashboardcontent" className={selectedMenu === 'userdashboardcontent' ? 'selected' : ''} onClick={() => handleMenuClick('userdashboardcontent')} >
                            <IoSpeedometer className="icon" /> {!isSidebarCollapsed && 'Dashboard'}
                        </Link>
                    </li>
                    <li>
                    <Link to="UserTrainingSummary" className={selectedMenu === 'UserTrainingSummary' ? 'selected' : ''} onClick={() => handleMenuClick('UserTrainingSummary')} >
                            <FaChartBar className="icon" /> {!isSidebarCollapsed && 'Training Summary'}
                        </Link>
                    </li>                   
                    
                    <li>
                        
                    <Link to="userrequisition" className={selectedMenu === 'userrequisition' ? 'selected' : ''} onClick={() => handleMenuClick('userrequisition')} >
                            <FaUsersGear className="icon" /> {!isSidebarCollapsed && 'Training Requisition'}
                        </Link>
                    </li>
                    
                </ul>
            </div>

           
            <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Outlet context={{ isSidebarCollapsed }} />
            </div>
        </div>
    );
}

export default UserDashboard;
