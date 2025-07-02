import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../components/Images/Logo.png';

function Sidebar() {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [orgMenuOpen, setOrgMenuOpen] = useState(false);
    const [inventoryMenuOpen, setInventoryMenuOpen] = useState(false);
    const [locationMenuOpen, setLocationMenuOpen] = useState(false);
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    
   

    return (
        <nav className="col-md-3 col-lg-2 d-md-block bg-white sidebar collapse">
            <div className="position-sticky pt-3">
                <div className="text-center mb-4">
                    <img src={logo} alt="Logo" style={{ width: '180px', height: 'auto' }} />
                    <div className="mt-2">
                        <small className="text-muted"></small>
                    </div>
                </div>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <NavLink to="/dashboard" className="nav-link" end>
                            <i className="bi bi-house-door me-2"></i>
                            Dashboard
                        </NavLink>
                    </li>

                        <li className="nav-item">
                            <div 
                                className="nav-link d-flex justify-content-between align-items-center" 
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>
                                    <i className="bi bi-people me-2"></i>
                                    User & Profiles
                                </span>
                                <i className={`bi ${userMenuOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                            </div>
                            {userMenuOpen && (
                                <ul className="nav flex-column ms-4">
                                    <li className="nav-item">
                                        <NavLink to="/users" className="nav-link">Users</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/teams" className="nav-link">Teams</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/department" className="nav-link">Department</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/designation" className="nav-link">Designation</NavLink>
                                    </li>
                                </ul>
                            )}
                        </li>
                

                    {/* Inventory Menu */}
                        <li className="nav-item">
                            <div 
                                className="nav-link d-flex justify-content-between align-items-center" 
                                onClick={() => setInventoryMenuOpen(!inventoryMenuOpen)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>
                                    <i className="bi bi-box-seam me-2"></i>
                                    Inventory
                                </span>
                                <i className={`bi ${inventoryMenuOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                            </div>
                            {inventoryMenuOpen && (
                                <ul className="nav flex-column ms-4">
                                    <li className="nav-item">
                                        <NavLink to="/product" className="nav-link">Add Product</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/inventory-manager" className="nav-link">Inventory Status</NavLink>
                                    </li>
                                </ul>
                            )}
                        </li>

                    {/* Organization Menu */}
               
                        <li className="nav-item">
                            <div 
                                className="nav-link d-flex justify-content-between align-items-center" 
                                onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>
                                    <i className="bi bi-building me-2"></i>
                                    Organization
                                </span>
                                <i className={`bi ${orgMenuOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                            </div>
                            {orgMenuOpen && (
                                <ul className="nav flex-column ms-4">
                                    <li className="nav-item">
                                        <NavLink to="/organization" className="nav-link">Company Info</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/organisation-chart" className="nav-link">Organization Chart</NavLink>
                                    </li>
                                </ul>
                            )}
                        </li>

                    {/* Location Menu */}
                  
                        <li className="nav-item">
                            <div 
                                className="nav-link d-flex justify-content-between align-items-center" 
                                onClick={() => setLocationMenuOpen(!locationMenuOpen)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>
                                    <i className="bi bi-geo-alt me-2"></i>
                                    Location
                                </span>
                                <i className={`bi ${locationMenuOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                            </div>
                            {locationMenuOpen && (
                                <ul className="nav flex-column ms-4">
                                    <li className="nav-item">
                                        <NavLink to="/location/add-location" className="nav-link">Geo Location</NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/location" className="nav-link">Location</NavLink>
                                    </li>
                                </ul>
                            )}
                        </li>
                

                    {/* Admin Menu */}
                 
                        <li className="nav-item">
                            <div 
                                className="nav-link d-flex justify-content-between align-items-center" 
                                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>
                                    <i className="bi bi-gear me-2"></i>
                                    Admin
                                </span>
                                <i className={`bi ${adminMenuOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                            </div>
                            {adminMenuOpen && (
                                <ul className="nav flex-column ms-4">
                                 
                                        <>
                                            <li className="nav-item">
                                                <NavLink to="/ShiftCreate" className="nav-link">
                                                    <i className="bi bi-calendar-check me-2"></i> Shift Create
                                                </NavLink>
                                            </li>
                                            <li className="nav-item">
                                                <NavLink to="/assign" className="nav-link">
                                                    <i className="bi bi-calendar-check me-2"></i> Shift Assign
                                                </NavLink>
                                            </li>
                                        </>
                                    <li className="nav-item">
                                        <NavLink to="/cctv-request" className="nav-link">
                                            <i className="bi bi-camera-video me-2"></i> CCTV
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/pass-setup" className="nav-link">
                                            <i className="bi bi-person-badge me-2"></i> Pass Setup
                                        </NavLink>
                                    </li>
                                 
                                        <li className="nav-item">
                                            <NavLink to="/emergency-code" className="nav-link">
                                                <i className="bi bi-exclamation-triangle me-2"></i> Emergency Code
                                            </NavLink>
                                        </li>
                                 
                                    <li className="nav-item">
                                        <NavLink to="/event-management" className="nav-link">
                                            <i className="bi bi-calendar-event me-2"></i> Events
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/first-aid" className="nav-link">
                                            <i className="bi bi-clipboard2-pulse me-2"></i> First Aid
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/osha-invite" className="nav-link">
                                            <i className="bi bi-envelope-open me-2"></i> OSHA Invite
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/policy" className="nav-link">
                                            <i className="bi bi-file-earmark-text me-2"></i> Policy
                                        </NavLink>
                                    </li>
                                    <li className="nav-item">
                                        <NavLink to="/sustainability" className="nav-link">
                                            <i className="bi bi-tree me-2"></i> Sustainability
                                        </NavLink>
                                    </li>
                                        <li className="nav-item">
                                            <NavLink to="/training" className="nav-link">
                                                <i className="bi bi-mortarboard me-2"></i> Training
                                            </NavLink>
                                        </li>
                               
                                    <li className="nav-item">
                                        <NavLink to="/terms-condition" className="nav-link">
                                            <i className="bi bi-card-checklist me-2"></i> Terms & Conditions
                                        </NavLink>
                                    </li>
                                        <li className="nav-item">
                                            <NavLink to="/upgrade" className="nav-link">
                                                <i className="bi bi-arrow-up-circle me-2"></i> Upgrade List
                                            </NavLink>
                                        </li>
                                    
                                </ul>
                            )}
                        </li>
                    {/* Other Menu Items */}
                 
                        <li className="nav-item">
                            <NavLink to="/permissions" className="nav-link">
                                <i className="bi bi-shield-lock me-2"></i>
                                Permissions
                            </NavLink>
                        </li>
                    
                        <li className="nav-item">
                            <NavLink to="/reports" className="nav-link">
                                <i className="bi bi-graph-up me-2"></i>
                                Reports & Analytics
                            </NavLink>
                        </li>
                    

                    <li className="nav-item">
                        <NavLink to="/OccurrenceManager" className="nav-link">
                            <i className="bi bi-exclamation-triangle me-2 text-orange"></i>
                            Occurrence
                        </NavLink>
                    </li>

                 
                        <li className="nav-item">
                            <NavLink to="/patrol" className="nav-link">
                                <i className="bi bi-geo-alt me-2"></i>
                                Patrol
                            </NavLink>
                        </li>
                

                    <li className="nav-item">
                        <NavLink to="/sop" className="nav-link">
                            <i className="bi bi-folder me-2"></i>
                            SOP
                        </NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Sidebar;