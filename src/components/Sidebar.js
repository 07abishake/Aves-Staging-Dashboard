// import React from 'react';
// import { NavLink } from 'react-router-dom';

// function Sidebar() {
//   return (
//     <nav className="col-md-3 col-lg-2 d-md-block bg-white sidebar collapse">
//       <div className="position-sticky pt-3">
//         <ul className="nav flex-column">
//           <li className="nav-item">
//             <NavLink to="/" className="nav-link" end>
//               <i className="bi bi-house-door me-2"></i>
//               Dashboard
//             </NavLink>
//           </li>
//           <li className="nav-item">
//             <NavLink to="/users" className="nav-link">
//               <i className="bi bi-people me-2"></i>
//               User & Profiles
//             </NavLink>
//           </li>
//           <li className="nav-item">
//             <NavLink to="/organization" className="nav-link">
//               <i className="bi bi-building me-2"></i>
//               Organization
//             </NavLink>
//           </li>
//           <li className="nav-item">
//             <NavLink to="/permissions" className="nav-link">
//               <i className="bi bi-shield-lock me-2"></i>
//               Permissions
//             </NavLink>
//           </li>
//           <li className="nav-item">
//             <NavLink to="/resources" className="nav-link">
//               <i className="bi bi-folder me-2"></i>
//               Resource
//             </NavLink>
//           </li>
//           <li className="nav-item">
//             <NavLink to="/customization" className="nav-link">
//               <i className="bi bi-palette me-2"></i>
//               Customization
//             </NavLink>
//           </li>
//           <li className="nav-item">
//             <NavLink to="/integrations" className="nav-link">
//               <i className="bi bi-plug me-2"></i>
//               Integrations
//             </NavLink>
//           </li>
//           <li className="nav-item">
//             <NavLink to="/data-admin" className="nav-link">
//               <i className="bi bi-database me-2"></i>
//               Data Administration
//             </NavLink>
//           </li>
//           <li className="nav-item">
//             <NavLink to="/reports" className="nav-link">
//               <i className="bi bi-graph-up me-2"></i>
//               Reports & Analytics
//             </NavLink>
//           </li>
//         </ul>
//       </div>
//     </nav>
//   );
// }

// export default Sidebar;
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../components/Images/Logo.png'

function Sidebar() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [inventoryMenuOpen, setInventoryMenuOpen] = useState(false);
  const [LocationMenuOpen, setLocationMenuOpen] = useState(false);

  return (
    <nav className="col-md-3 col-lg-2 d-md-block bg-white sidebar collapse">
      <div className="position-sticky pt-3">
        <div>
       <img src={logo} alt="Logo" className="logo" style={{ width: '200px', height: '100px' }} />
        </div>
        <ul className="nav flex-column">
          <li className="nav-item">
            <NavLink to="/dashboard" className="nav-link" end>
              <i className="bi bi-house-door me-2"></i>
              Dashboard
            </NavLink>
          </li>

          {/* User & Profiles Menu */}
          <li className="nav-item">
            <div className="nav-link" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <i className="bi bi-people me-2"></i>
              User & Profiles
              <i className={`bi ms-auto ${userMenuOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
            </div>
            {userMenuOpen && (
              <ul className="nav flex-column ms-3">
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


 <li className="nav-item">
            <div className="nav-link" onClick={() => setInventoryMenuOpen(!inventoryMenuOpen)}>
              <i className="bi bi-people me-2"></i>
              Inventory
              <i className={`bi ms-auto ${inventoryMenuOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
            </div>
            {inventoryMenuOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <NavLink to="/items-details" className="nav-link">Add Product</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/loaction-info" className="nav-link">LocationInfo</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/inventory-status" className="nav-link">Inventory Status</NavLink>
                </li>
              </ul>
            )}
          </li>
          {/* Organization Menu */}
          <li className="nav-item">
            <div className="nav-link" onClick={() => setOrgMenuOpen(!orgMenuOpen)}>
              <i className="bi bi-building me-2"></i>
              Organization
              <i className={`bi ms-auto ${orgMenuOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
            </div>
            {orgMenuOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <NavLink to="/organization" className="nav-link">Company Info</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/organisation-chart" className="nav-link">OrganisastionChart</NavLink>
                </li>
              </ul>
            )}
          </li>
          {/* Location Menu */}
          
<li className="nav-item">
            <div className="nav-link" onClick={() => setLocationMenuOpen(!LocationMenuOpen)}>
              <i className="bi bi-building me-2"></i>
              Location
              <i className={`bi ms-auto ${LocationMenuOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
            </div>
            {LocationMenuOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <NavLink to="/location/add-location" className="nav-link">Geo Location</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/location" className="nav-link">Location</NavLink>
                </li>
              </ul>
            )}
          </li>
          <li className="nav-item">
            <NavLink to="/permissions" className="nav-link">
              <i className="bi bi-shield-lock me-2"></i>
              Permissions
            </NavLink>
          </li>
          {/* <li className="nav-item">
            <NavLink to="/resources" className="nav-link">
              <i className="bi bi-folder me-2"></i>
              Resource
            </NavLink>
          </li> */}
          {/* <li className="nav-item">
            <NavLink to="/customization" className="nav-link">
              <i className="bi bi-palette me-2"></i>
              Customization
            </NavLink>
          </li> */}
          {/* <li className="nav-item">
            <NavLink to="/integrations" className="nav-link">
              <i className="bi bi-plug me-2"></i>
              Integrations
            </NavLink>
          </li> */}
          <li className="nav-item">
            <NavLink to="/reports" className="nav-link">
              <i className="bi bi-graph-up me-2"></i>
              Reports & Analytics
            </NavLink>
          </li>
             <li className="nav-item">
            <NavLink to="/OccurrenceManager" className="nav-link">
              <i className="bi bi-exclamation-triangle me-2 text-orange"></i>
              Occurance
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
              Sop
            </NavLink>
          </li>
        
          {/* <li className="nav-item">
            <div className="nav-link" onClick={() => setLocationMenuOpen(!locationMenuOpen)}>
              <i class="bi bi-geo-alt me-2"></i>
              Location
              <i className={`bi ms-auto ${locationMenuOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
            </div>
            {locationMenuOpen && (
              <ul className="nav flex-column ms-3">
                <li className="nav-item">
                  <NavLink to="/location/add-location" className="nav-link">Add Location</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/organization/configuration" className="nav-link">View Location</NavLink>
                </li>
              </ul>
            )}
          </li> */}
        </ul>
      </div>
    </nav>
  );
}

export default Sidebar;