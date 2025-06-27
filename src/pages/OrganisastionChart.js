import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Spinner } from 'react-bootstrap';

const OrganizationView = () => {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = 'https://api.avessecurity.com/api';
  const token = localStorage.getItem('access_token');

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        const [deptRes, desigRes, roleRes] = await Promise.all([
          axios.get(`${BASE_URL}/Department/getAll`, config),
          axios.get(`${BASE_URL}/Designation/getDataDesignation`, config),
          axios.get(`${BASE_URL}/Roles/getRole`, config)
        ]);

        // Handle department data
        const deptData = Array.isArray(deptRes.data?.data) ? deptRes.data.data : 
                        Array.isArray(deptRes.data) ? deptRes.data : [];
        setDepartments(deptData);

        // Handle designation data
        const desigData = Array.isArray(desigRes.data?.Designation) ? desigRes.data.Designation : 
                         Array.isArray(desigRes.data) ? desigRes.data : [];
        setDesignations(desigData);

        // Handle role data
        const roleData = Array.isArray(roleRes.data?.data) ? roleRes.data.data : 
                        Array.isArray(roleRes.data) ? roleRes.data : [];
        setRoles(roleData);

      } catch (error) {
        console.error('Error loading organization data:', error);
        setError(error.message);
        if (error.response?.status === 401) {
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  // Function to get top-level departments (without parent)
  const getTopLevelDepartments = () => {
    return departments.filter(dept => !dept.parentDepartment || !dept.parentDepartment._id);
  };

  // Function to get child departments
  const getChildDepartments = (parentId) => {
    return departments.filter(dept => 
      dept.parentDepartment && dept.parentDepartment._id === parentId
    );
  };

  // Function to get designations by department
  const getDesignationsByDepartment = (deptId) => {
    if (!Array.isArray(designations)) return [];
    return designations.filter(desig => 
      desig.departmentId === deptId || 
      (desig.department && desig.department._id === deptId)
    );
  };

  // Function to get roles by designation
  const getRolesByDesignation = (desigId) => {
    if (!Array.isArray(roles)) return [];
    return roles.filter(role => 
      role.designationId === desigId || 
      (role.designation && role.designation._id === desigId)
    );
  };

  // Recursive component to render department hierarchy
  const DepartmentCard = ({ department, level = 0 }) => {
    const childDepartments = getChildDepartments(department._id);
    const deptDesignations = getDesignationsByDepartment(department._id);

    return (
      <div className={`mb-3 ${level > 0 ? 'ms-4' : ''}`}>
        <div className="card">
          <div className={`card-header ${level === 0 ? 'bg-primary text-white' : 'bg-light'}`}>
            <h5 className="card-title m-0">
              {department.name}
              {department.leadName && (
                <small className="d-block">Lead: {department.leadName.username}</small>
              )}
            </h5>
          </div>
          <div className="card-body">
            {deptDesignations.length > 0 ? (
              deptDesignations.map(desig => (
                <div key={desig._id} className="mb-2">
                  <div className="d-flex align-items-center">
                    <strong className="me-2">{desig.Name || desig.DesignationName}</strong>
                    {desig.AssignUsers && desig.AssignUsers.length > 0 && (
                      <span className="badge bg-secondary">
                        {desig.AssignUsers.length} user(s)
                      </span>
                    )}
                  </div>
                  <ul className="list-unstyled ms-3">
                    {getRolesByDesignation(desig._id).map(role => (
                      <li key={role._id}>• {role.RoleName}</li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-muted">No designations</p>
            )}
          </div>
        </div>

        {childDepartments.length > 0 && (
          <div className="mt-3">
            {childDepartments.map(childDept => (
              <DepartmentCard 
                key={childDept._id} 
                department={childDept} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        Error loading organization data: {error}
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">Organization Chart</h2>
      
      {getTopLevelDepartments().length > 0 ? (
        getTopLevelDepartments().map(dept => (
          <DepartmentCard key={dept._id} department={dept} />
        ))
      ) : (
        <div className="alert alert-info">No departments found</div>
      )}
    </div>
  );
};

export default OrganizationView;