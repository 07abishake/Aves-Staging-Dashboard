import React, { useEffect, useState } from 'react';
import { Table, Spinner } from 'react-bootstrap';
import axios from 'axios';

const OrganizationView = () => {
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [expandedDepts, setExpandedDepts] = useState({});
    const token = localStorage.getItem("access_token");

    useEffect(() => {
        if (!token) {
            window.location.href = "/login";
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                
                const [deptRes, desgRes] = await Promise.all([
                    axios.get("https://api.avessecurity.com/api/Department/getAll", {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get("https://api.avessecurity.com/api/Designation/getDataDesignation", {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                
                setDepartments(deptRes.data);
                setDesignations(desgRes.data.Designation || []);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const toggleExpand = (deptId) => {
        setExpandedDepts(prev => ({
            ...prev,
            [deptId]: !prev[deptId]
        }));
    };

    const getDesignationsForDept = (deptId) => {
        return designations.filter(desg => 
            desg.department && desg.department._id === deptId
        );
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <div className="org-table-view">
            <h4 className="mb-4">Organization Structure</h4>
            
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th style={{ width: '30%' }}>Department</th>
                        <th>Lead</th>
                        <th>Parent Department</th>
                        <th>Designations</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {departments.map(dept => (
                        <React.Fragment key={dept._id}>
                            <tr>
                                <td>
                                    <strong>{dept.name}</strong>
                                    {dept.children && dept.children.length > 0 && (
                                        <button 
                                            className="btn btn-sm btn-link ms-2"
                                            onClick={() => toggleExpand(dept._id)}
                                        >
                                            {expandedDepts[dept._id] ? '▲' : '▼'}
                                        </button>
                                    )}
                                </td>
                                <td>{dept.leadName ? dept.leadName.username : '-'}</td>
                                <td>{dept.parentDepartment ? dept.parentDepartment.name : '-'}</td>
                                <td>
                                    {getDesignationsForDept(dept._id).length} designations
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-outline-primary me-2">
                                        View
                                    </button>
                                </td>
                            </tr>
                            
                            {/* Expanded view for child departments */}
                            {expandedDepts[dept._id] && dept.children && dept.children.map(childDept => (
                                <tr key={childDept._id} className="bg-light">
                                    <td className="ps-5">
                                        <i className="bi bi-arrow-return-right me-2"></i>
                                        {childDept.name}
                                    </td>
                                    <td>{childDept.leadName ? childDept.leadName.username : '-'}</td>
                                    <td>{dept.name}</td>
                                    <td>
                                        {getDesignationsForDept(childDept._id).length} designations
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-primary me-2">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            
                            {/* Expanded view for designations */}
                            {expandedDepts[dept._id] && (
                                <tr>
                                    <td colSpan="5" className="p-0">
                                        <Table striped bordered size="sm" className="mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Designation</th>
                                                    <th>Members</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getDesignationsForDept(dept._id).map(desg => (
                                                    <tr key={desg._id}>
                                                        <td>{desg.Name}</td>
                                                        <td>
                                                            {desg.AssignUsers ? desg.AssignUsers.length : 0} members
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-sm btn-outline-primary">
                                                                View Members
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default OrganizationView;