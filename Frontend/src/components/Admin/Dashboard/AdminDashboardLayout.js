import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminDashboard from './AdminDashboard'; 

function AdminDashboardLayout() {
    return (
        <div>
            <AdminDashboard /> 
            <div className="main-content">
                <Outlet /> 
            </div>
            
        </div>
    );
}

export default AdminDashboardLayout;
