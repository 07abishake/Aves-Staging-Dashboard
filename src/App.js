
// import React from 'react';
// import { Routes, Route, useLocation } from 'react-router-dom';
// import Sidebar from './components/Sidebar';
// import Navbar from './components/Navbar';
// import ProtectedRoute from './Utils/ProtectedRoute'; // Import ProtectedRoute

// import Dashboard from './pages/Dashboard';
// import UserManagement from './pages/UserManagement';
// import OrganizationSettings from './pages/OrganizationSettings';
// import Permissions from './pages/Permissions';
// import ResourceManagement from './pages/ResourceManagement';
// import Customization from './pages/Customization';
// import Integrations from './pages/Integrations';
// import DataAdministration from './pages/DataAdministration';
// import Reports from './pages/Reports';
// import Departments from './pages/Departments';
// import Designation from './pages/Designation';
// import Login from './pages/Login';
// import Teams from './pages/Teams';
// import AddLocation from './pages/GeoLocation';
// import LocationForm from './pages/Location';
// import Patrol from './pages/Patrol';
// import SopManager from './pages/SopManager';
// import InventoryStatus from './pages/InventoryStatus';
// import { LocationInfo } from './pages/LocationInfo';
// import ItemDetails from './pages/ItemDetails'
// import OccurrenceManager from './pages/OccurrenceManager'
// import OrganizationView from './pages/OrganisastionChart';
// import ShiftAssignmentManager from './pages/ShiftAssignmentManager';
// import ShiftManager from './pages/ShiftManager';
// import UpgradeManager from './pages/UpgradeManager';
// import EventManagement from './pages/EventManagement';
// import TermManagement from './pages/TermManagement';
// import ProductManager from './pages/Product';
// import InventoryManager from './pages/InventoryManager';
// import CCTvRequest from './pages/CCTvRequest';
// // import SustainabilityManager from './pages/SustainabilityManager';
// import FirstAidReport from './pages/FirstAidReport';
// import EmergencyCodeManager from './pages/EmergencyCodeManager'
// import PassSetup from './pages/PassSetup';
// import PropertyPolices from './pages/PropertyPolices';
// import SustainabilityManagement from './pages/SustainabilityManagement';
// import OshaInvite from './pages/OshaInvite';
// import Training from './pages/Training';


// function App() {
//   const location = useLocation();
//   const hideLayout = location.pathname === '/';

//   return (
//     <div className="container-fluid">
//       <div className="row">
//         {!hideLayout && <Sidebar />}
//         <main className={hideLayout ? 'w-100' : 'col-md-9 ms-sm-auto col-lg-10 px-md-4'}>
//           {!hideLayout && <Navbar />}
//           <Routes>
//             {/* Public Route */}
//             <Route path="/" element={<Login />} />

//             {/* Protected Routes */}
//             <Route element={<ProtectedRoute />}>
//               <Route path="/dashboard" element={<Dashboard />} />
//               <Route path="/users" element={<UserManagement />} />
//               <Route path="/organization" element={<OrganizationSettings />} />
//               <Route path="/organisation-chart" element={<OrganizationView />} />
//               <Route path="/permissions" element={<Permissions />} />
//               <Route path="/department" element={<Departments />} />
//               <Route path="/teams" element={<Teams />} />
//               <Route path="/patrol" element={<Patrol />} />
//               <Route path="/location/add-location" element={<AddLocation />} />
//               <Route path="/sop" element={<SopManager />} />
//               <Route path='/loaction-info' element={<LocationInfo />} />
//               <Route path='/items-details' element={<ItemDetails />} />
//               <Route path="/designation" element={<Designation />} />
//               <Route path="/resources" element={<ResourceManagement />} />
//               <Route path="/customization" element={<Customization />} />
//               <Route path="/integrations" element={<Integrations />} />
//               <Route path="/data-admin" element={<DataAdministration />} />
//               <Route path="/reports" element={<Reports />} />
//               <Route path="/location" element={<LocationForm />} />
//               <Route path='/inventory-status' element={<InventoryStatus />} />
//               <Route path='/OccurrenceManager' element={<OccurrenceManager />} />
//               <Route path='/ShiftCreate' element={<ShiftManager />} />
//               <Route path="/assign" element={<ShiftAssignmentManager />} />
//               <Route path="/upgrade" element={<UpgradeManager />} />
//               <Route path='/event-management' element={<EventManagement />} />
//               <Route path='/terms-condition' element={<TermManagement />} />
//               <Route path='/department' element={<Departments />} />
//               <Route path='/inventory-manager' element={<InventoryManager />} />
//               <Route path='/product' element={<ProductManager />} />
//               <Route path='/cctv-request' element={<CCTvRequest />} />
//               {/* <Route path='/SustainabilityManager' element={<SustainabilityManager/>}/> */}
//               <Route path='/FirstAidReport' element={<FirstAidReport />} />
//               <Route path='/EmergencyCodeManager' element={<EmergencyCodeManager />} />
//               <Route path='/PassSetup' element={<PassSetup />} />
//               <Route path='/Property' element={<PropertyPolices />} />
//               <Route path='/SustainablityManager' element={<SustainabilityManagement />} />
//               <Route path='/osha-invite' element={<OshaInvite />} />
//               <Route path='/Training' element={<Training/>}/>



//             </Route>
//           </Routes>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default App;



import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './Utils/ProtectedRoute';

// Import all your pages
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import OrganizationSettings from './pages/OrganizationSettings';
import Permissions from './pages/Permissions';
import ResourceManagement from './pages/ResourceManagement';
import Customization from './pages/Customization';
import Integrations from './pages/Integrations';
import DataAdministration from './pages/DataAdministration';
import Reports from './pages/Reports';
import Departments from './pages/Departments';
import Designation from './pages/Designation';
import Login from './pages/Login';
import Teams from './pages/Teams';
import AddLocation from './pages/GeoLocation';
import LocationForm from './pages/Location';
import Patrol from './pages/Patrol';
import SopManager from './pages/SopManager';
import InventoryStatus from './pages/InventoryStatus';
import { LocationInfo } from './pages/LocationInfo';
import ItemDetails from './pages/ItemDetails';
import OccurrenceManager from './pages/OccurrenceManager';
import OrganizationView from './pages/OrganisastionChart';
import ShiftAssignmentManager from './pages/ShiftAssignmentManager';
import ShiftManager from './pages/ShiftManager';
import UpgradeManager from './pages/UpgradeManager';
import EventManagement from './pages/EventManagement';
import TermManagement from './pages/TermManagement';
import ProductManager from './pages/Product';
import InventoryManager from './pages/InventoryManager';
import CCTvRequest from './pages/CCTvRequest';
import FirstAidReport from './pages/FirstAidReport';
import EmergencyCodeManager from './pages/EmergencyCodeManager';
import PassSetup from './pages/PassSetup';
import PropertyPolices from './pages/PropertyPolices';
import SustainabilityManagement from './pages/SustainabilityManagement';
import OshaInvite from './pages/OshaInvite';
import Training from './pages/Training';
import PageNotFound from './pages/PageNotFound';

function App() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Define all valid routes
  const validRoutes = [
    '/', '/dashboard', '/users', '/organization', '/organisation-chart', 
    '/permissions', '/department', '/teams', '/patrol', '/location/add-location', 
    '/sop', '/loaction-info', '/items-details', '/designation', '/resources', 
    '/customization', '/integrations', '/data-admin', '/reports', '/location',
    '/inventory-status', '/OccurrenceManager', '/ShiftCreate', '/assign',
    '/upgrade', '/event-management', '/terms-condition', '/inventory-manager',
    '/product', '/cctv-request', '/FirstAidReport', '/EmergencyCodeManager',
    '/PassSetup', '/Property', '/SustainablityManager', '/osha-invite', '/Training'
  ];
  
  // Check if current path is valid or should show 404 page
  const is404Page = !validRoutes.includes(location.pathname);
  
  // Check if current path should hide layout (login, 404, or offline)
  const shouldHideLayout = location.pathname === '/' || is404Page || !isOnline;

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="container-fluid">
      <div className="row">
        {!shouldHideLayout && <Sidebar />}
        <main className={shouldHideLayout ? 'w-100' : 'col-md-9 ms-sm-auto col-lg-10 px-md-4'}>
          {!shouldHideLayout && <Navbar />}
          <Routes>
            {/* Public Route */}
            <Route path="/" element={<Login />} />
            
            {/* Show 404 page when offline */}
            {!isOnline && <Route path="*" element={<PageNotFound />} />}
            
            {/* Protected Routes - only show when online */}
            {isOnline && (
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/organization" element={<OrganizationSettings />} />
                <Route path="/organisation-chart" element={<OrganizationView />} />
                <Route path="/permissions" element={<Permissions />} />
                <Route path="/department" element={<Departments />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/patrol" element={<Patrol />} />
                <Route path="/location/add-location" element={<AddLocation />} />
                <Route path="/sop" element={<SopManager />} />
                <Route path='/loaction-info' element={<LocationInfo />} />
                <Route path='/items-details' element={<ItemDetails />} />
                <Route path="/designation" element={<Designation />} />
                <Route path="/resources" element={<ResourceManagement />} />
                <Route path="/customization" element={<Customization />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/data-admin" element={<DataAdministration />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/location" element={<LocationForm />} />
                <Route path='/inventory-status' element={<InventoryStatus />} />
                <Route path='/OccurrenceManager' element={<OccurrenceManager />} />
                <Route path='/ShiftCreate' element={<ShiftManager />} />
                <Route path="/assign" element={<ShiftAssignmentManager />} />
                <Route path="/upgrade" element={<UpgradeManager />} />
                <Route path='/event-management' element={<EventManagement />} />
                <Route path='/terms-condition' element={<TermManagement />} />
                <Route path='/inventory-manager' element={<InventoryManager />} />
                <Route path='/product' element={<ProductManager />} />
                <Route path='/cctv-request' element={<CCTvRequest />} />
                <Route path='/FirstAidReport' element={<FirstAidReport />} />
                <Route path='/EmergencyCodeManager' element={<EmergencyCodeManager />} />
                <Route path='/PassSetup' element={<PassSetup />} />
                <Route path='/Property' element={<PropertyPolices />} />
                <Route path='/SustainablityManager' element={<SustainabilityManagement />} />
                <Route path='/osha-invite' element={<OshaInvite />} />
                <Route path='/Training' element={<Training/>}/>
                
                {/* Catch all unknown routes - show 404 page */}
                <Route path="*" element={<PageNotFound />} />
              </Route>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;