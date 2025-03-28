// import React from 'react';
// import { Routes, Route, useLocation } from 'react-router-dom';
// import Sidebar from './components/Sidebar';
// import Navbar from './components/Navbar';
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
//             <Route path="/" element={<Login />} />
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/users" element={<UserManagement />} />
//             <Route path="/organization" element={<OrganizationSettings />} />
//             <Route path="/permissions" element={<Permissions />} />
//             <Route path="/department" element={<Departments />} />
//             <Route path="/designation" element={<Designation />} />
//             <Route path="/resources" element={<ResourceManagement />} />
//             <Route path="/customization" element={<Customization />} />
//             <Route path="/integrations" element={<Integrations />} />
//             <Route path="/data-admin" element={<DataAdministration />} />
//             <Route path="/reports" element={<Reports />} />
//           </Routes>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default App;
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ProtectedRoute from './Utils/ProtectedRoute'; // Import ProtectedRoute

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
import AddLocation from './pages/AddLocation';

function App() {
  const location = useLocation();
  const hideLayout = location.pathname === '/';

  return (
    <div className="container-fluid">
      <div className="row">
        {!hideLayout && <Sidebar />}
        <main className={hideLayout ? 'w-100' : 'col-md-9 ms-sm-auto col-lg-10 px-md-4'}>
          {!hideLayout && <Navbar />}
          <Routes>
            {/* Public Route */}
            <Route path="/" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/organization" element={<OrganizationSettings />} />
              <Route path="/permissions" element={<Permissions />} />
              <Route path="/department" element={<Departments />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/location/add-location" element={<AddLocation />} />

              <Route path="/designation" element={<Designation />} />
              <Route path="/resources" element={<ResourceManagement />} />
              <Route path="/customization" element={<Customization />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/data-admin" element={<DataAdministration />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
