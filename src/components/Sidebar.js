import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Sidebar() {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [orgMenuOpen, setOrgMenuOpen] = useState(false);
    const [inventoryMenuOpen, setInventoryMenuOpen] = useState(false);
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);
    const [loadingLogo, setLoadingLogo] = useState(true);

    // Function to load organization logo - FIXED VERSION
    const loadOrganizationLogo = async () => {
        try {
            setLoadingLogo(true);
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                console.warn('No access token found');
                setLogoUrl(null);
                return;
            }

            let decoded;
            try {
                decoded = jwtDecode(token);
            } catch (decodeError) {
                console.error('Invalid token format:', decodeError);
                setLogoUrl(null);
                return;
            }

            const OrganizationId = decoded.OrganizationId;
            const hasLogo = decoded.hasLogo;

            console.log('Token info:', { OrganizationId, hasLogo });

            if (!hasLogo) {
                console.log('User has no logo flag');
                setLogoUrl(null);
                return;
            }

            // Try multiple approaches to handle CORS issues
            let response;
            let errorMessage = '';
            
            // APPROACH 1: Without custom header (most likely to work)
            try {
                console.log('Trying Approach 1: Without OrganizationId header...');
                response = await fetch(`https://codeaves.avessecurity.com/api/oraganisation/logo`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'image/*'
                    },
                    mode: 'cors',
                    cache: 'no-cache'
                });
                
                console.log('Approach 1 response status:', response.status);
                
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    console.log('Content-Type:', contentType);
                    
                    if (contentType && contentType.includes('image')) {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        setLogoUrl(url);
                        console.log('Logo loaded successfully via Approach 1');
                        return;
                    } else {
                        console.warn('Response is not an image');
                        errorMessage = 'Response is not an image';
                    }
                } else if (response.status === 404) {
                    console.log('Logo not found (404)');
                    errorMessage = 'Logo not found';
                } else {
                    console.log(`Approach 1 failed: ${response.status} ${response.statusText}`);
                    errorMessage = `Server error: ${response.status}`;
                }
            } catch (error) {
                console.log('Approach 1 error:', error.message);
                errorMessage = error.message;
            }

            // APPROACH 2: With query parameter (fallback)
            try {
                console.log('Trying Approach 2: With query parameter...');
                response = await fetch(
                    `https://codeaves.avessecurity.com/api/oraganisation/logo?organizationId=${OrganizationId}`, 
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'image/*'
                        }
                    }
                );
                
                console.log('Approach 2 response status:', response.status);
                
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('image')) {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        setLogoUrl(url);
                        console.log('Logo loaded successfully via Approach 2');
                        return;
                    }
                }
            } catch (error) {
                console.log('Approach 2 also failed:', error.message);
            }

            // APPROACH 3: Try alternative endpoint spelling
            try {
                console.log('Trying Approach 3: Alternative URL spelling...');
                response = await fetch(`https://codeaves.avessecurity.com/api/organization/logo`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'image/*'
                    }
                });
                
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('image')) {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        setLogoUrl(url);
                        console.log('Logo loaded successfully via Approach 3');
                        return;
                    }
                }
            } catch (error) {
                console.log('Approach 3 failed:', error.message);
            }

            // If all approaches fail, set to null
            console.log('All logo loading approaches failed');
            setLogoUrl(null);

        } catch (error) {
            console.error('Unexpected error loading organization logo:', error);
            setLogoUrl(null);
        } finally {
            setLoadingLogo(false);
        }
    };

    // Enhanced version with URL parameter approach
    const loadOrganizationLogoEnhanced = async () => {
        try {
            setLoadingLogo(true);
            const token = localStorage.getItem('access_token');
            
            if (!token) {
                console.warn('No access token found');
                setLogoUrl(null);
                return;
            }

            let decoded;
            try {
                decoded = jwtDecode(token);
            } catch (decodeError) {
                console.error('Invalid token format:', decodeError);
                setLogoUrl(null);
                return;
            }

            const OrganizationId = decoded.OrganizationId;
            const hasLogo = decoded.hasLogo;

            console.log('Token info:', { OrganizationId, hasLogo });

            if (!hasLogo) {
                console.log('User has no logo flag');
                setLogoUrl(null);
                return;
            }

            // Build URL with query parameter (avoids CORS header issue)
            const url = new URL('https://codeaves.avessecurity.com/api/oraganisation/logo');
            if (OrganizationId) {
                url.searchParams.append('organizationId', OrganizationId);
            }

            try {
                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'image/*'
                    }
                });

                console.log('Logo fetch response:', {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    url: url.toString()
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    console.log('Content-Type:', contentType);
                    
                    if (contentType && contentType.includes('image')) {
                        const blob = await response.blob();
                        const urlObject = URL.createObjectURL(blob);
                        setLogoUrl(urlObject);
                        console.log('Logo loaded successfully');
                    } else {
                        // Try to read as JSON to see error message
                        try {
                            const text = await response.text();
                            console.log('Non-image response:', text.substring(0, 100));
                        } catch (e) {
                            console.log('Could not read response as text');
                        }
                        console.warn('Response is not an image');
                        setLogoUrl(null);
                    }
                } else if (response.status === 404) {
                    console.log('Logo not found (404) - organization may not have logo');
                    setLogoUrl(null);
                } else {
                    console.log(`Failed to load logo: ${response.status} ${response.statusText}`);
                    setLogoUrl(null);
                }
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                setLogoUrl(null);
            }
        } catch (error) {
            console.error('Unexpected error:', error);
            setLogoUrl(null);
        } finally {
            setLoadingLogo(false);
        }
    };

    // Listen for logo updates
    useEffect(() => {
        // Try the enhanced version first
        loadOrganizationLogoEnhanced();

        // Set up storage event listener for logo updates
        const handleStorageChange = (e) => {
            if (e.key === 'hasLogo' || e.key === 'access_token') {
                console.log('Storage changed, reloading logo...');
                loadOrganizationLogoEnhanced();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Custom event for logo updates within same tab
        const handleLogoUpdate = () => {
            console.log('Logo update event received');
            loadOrganizationLogoEnhanced();
        };

        window.addEventListener('logoUpdated', handleLogoUpdate);

        // Cleanup
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('logoUpdated', handleLogoUpdate);
            
            // Revoke object URL to prevent memory leaks
            if (logoUrl) {
                URL.revokeObjectURL(logoUrl);
            }
        };
    }, []);

    // Handle logo error
    const handleLogoError = () => {
        console.error('Logo image failed to load');
        setLogoUrl(null);
        // Trigger a reload after a delay
        setTimeout(() => {
            loadOrganizationLogoEnhanced();
        }, 5000);
    };

    return (
        <nav className="col-md-3 col-lg-2 d-md-block bg-white sidebar collapse">
            <div className="position-sticky pt-3">
                {/* Organization Logo Section */}
                <div className="text-center mb-4">
                    {loadingLogo ? (
                        <div className="logo-loading-placeholder d-flex align-items-center justify-content-center">
                            <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <span className="text-muted small">Loading logo...</span>
                        </div>
                    ) : logoUrl ? (
                        <div className="logo-container">
                            <img 
                                src={logoUrl} 
                                alt="Organization Logo" 
                                style={{ 
                                    width: '180px', 
                                    height: 'auto',
                                    borderRadius: '12px',
                                    border: '1px solid #dee2e6'
                                }} 
                                onError={handleLogoError}
                                onLoad={() => console.log('Logo loaded successfully')}
                            />
                            <div className="mt-1">
                                <small className="text-muted">Organization Logo</small>
                            </div>
                        </div>
                    ) : (
                        <div className="logo-placeholder d-flex flex-column align-items-center">
                            <div 
                                style={{ 
                                    width: '180px', 
                                    height: '120px',
                                    borderRadius: '12px',
                                    backgroundColor: '#f8f9fa',
                                    border: '2px dashed #dee2e6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#6c757d',
                                    fontSize: '14px'
                                }}
                            >
                                No Logo
                            </div>
                            <div className="mt-2">
                                <small className="text-muted">Logo not available</small>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Menu */}
                <ul className="nav flex-column">
                    {/* Dashboard */}
                    <li className="nav-item">
                        <NavLink to="/dashboard" className="nav-link" end>
                            <i className="bi bi-house-door me-2"></i>
                            Dashboard
                        </NavLink>
                    </li>

                    {/* User & Profiles Menu */}
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
                                    <NavLink to="/designation" className="nav-link">Designation</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/department" className="nav-link">Department</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/teams" className="nav-link">Teams</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/location" className="nav-link">Location</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/location/add-location" className="nav-link">Geo Location</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/users" className="nav-link">Users</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/permissions" className="nav-link">Permissions</NavLink>
                                </li>
                            </ul>
                        )}
                    </li>

                    {/* User Allocation */}
                    <li className="nav-item">
                        <NavLink to="/user-allocation" className="nav-link">
                            <i className="bi-person-fill-gear me-2"></i>
                            User Allocation
                        </NavLink>
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
                                    <NavLink to="/organisation-chart" className="nav-link">Sub-Organization</NavLink>
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
                                <li className="nav-item">
                                    <NavLink to="/ShiftCreate" className="nav-link">
                                        <i className="bi bi-calendar-check me-2"></i> Create Shift
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/assign" className="nav-link">
                                        <i className="bi bi-calendar-check me-2"></i> Assign Shift
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/cctv-request" className="nav-link">
                                        <i className="bi bi-camera-video me-2"></i> CCTV
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/PassSetup" className="nav-link">
                                        <i className="bi bi-person-badge me-2"></i> Pass Setup
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/EmergencyCodeManager" className="nav-link">
                                        <i className="bi bi-exclamation-triangle me-2"></i> Emergency Code
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/event-management" className="nav-link">
                                        <i className="bi bi-calendar-event me-2"></i> Events
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/FirstAidReport" className="nav-link">
                                        <i className="bi bi-clipboard2-pulse me-2"></i> First Aid
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/osha-invite" className="nav-link">
                                        <i className="bi bi-envelope-open me-2"></i> OSH Invite
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/Property" className="nav-link">
                                        <i className="bi bi-file-earmark-text me-2"></i> Policy
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/SustainablityManager" className="nav-link">
                                        <i className="bi bi-tree me-2"></i> Sustainability
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/Training" className="nav-link">
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

                    {/* Reports & Analytics */}
                    <li className="nav-item">
                        <NavLink to="/reports" className="nav-link">
                            <i className="bi bi-graph-up me-2"></i>
                            Reports & Analytics
                        </NavLink>
                    </li>

                    {/* Occurrence */}
                    <li className="nav-item">
                        <NavLink to="/OccurrenceManager" className="nav-link">
                            <i className="bi bi-exclamation-triangle me-2 text-orange"></i>
                            Occurrence
                        </NavLink>
                    </li>

                    {/* Patrol */}
                    <li className="nav-item">
                        <NavLink to="/patrol" className="nav-link">
                            <i className="bi bi-geo-alt me-2"></i>
                            Patrol
                        </NavLink>
                    </li>

                    {/* SOP */}
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