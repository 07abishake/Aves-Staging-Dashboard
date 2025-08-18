import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Form, Table, Offcanvas, Badge, Modal } from 'react-bootstrap';
import Select from "react-select";
import { debounce } from 'lodash';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import { sendPushNotification } from '../Utils/SendNotification';
import CreatableSelect from "react-select/creatable";

const localizer = momentLocalizer(moment);

const OshaInvite = () => {
    const [data, setData] = useState([]);
    const [form, setForm] = useState({});
    const [locations, setLocations] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showView, setShowView] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [showParticipantCanvas, setShowParticipantCanvas] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState(null);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [showEmailCanvas, setShowEmailCanvas] = useState(false);
    const [emailList, setEmailList] = useState([]);
    const [emailMeetingId, setEmailMeetingId] = useState(null);
    const [showFollowUp, setShowFollowUp] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [followUpType, setFollowUpType] = useState('Description');
    const [followUpForm, setFollowUpForm] = useState({
        Title: '',
        Status: '',
        Department: '',
        ActionBy: '',
        Deadline: '',
        Remarks: ''
    });
    const [showRemarksCanvas, setShowRemarksCanvas] = useState(false);
    const [currentRemarks, setCurrentRemarks] = useState({
        type: '',
        meetingId: '',
        itemId: '',
        remarks: '',
        closeItem: true
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [meetingToDelete, setMeetingToDelete] = useState(null);

    const token = localStorage.getItem("access_token");
    
    const statusOptions = [
        { value: 'Open', label: 'Open', color: 'danger' },
        { value: 'Closed', label: 'Closed', color: 'success' },
        { value: 'Pending', label: 'Pending', color: 'warning' }
    ];

    const fetchDepartments = async () => {
        try {
            const response = await axios.get(
                'https://api.avessecurity.com/api/Department/getAll',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const departmentOptions = [];
            response.data.forEach(parent => {
                departmentOptions.push({ value: parent._id, label: parent.name });

                if (parent.children && parent.children.length > 0) {
                    parent.children.forEach(child => {
                        departmentOptions.push({
                            value: child._id,
                            label: child.name
                        });
                    });
                }
            });

            setDepartments(departmentOptions);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchUsers = debounce(async (query) => {
        if (!query) return;
        try {
            const response = await axios.get(
                `https://api.avessecurity.com/api/Designation/getDropdown/${query}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            if (response.data && response.data.Report) {
                const userOptions = response.data.Report.map((user) => ({
                    value: user._id,
                    label: user.username,
                }));
                setUsers(userOptions);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }, 500);

    useEffect(() => {
        if (inputValue) {
            fetchUsers(inputValue);
        }
    }, [inputValue]);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await axios.get('https://api.avessecurity.com/api/oshaminutes/get', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setData(res.data?.OshaMinutes || []);
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    const deleteOSha = async () => {
        try {
            const res = await axios.delete(`https://api.avessecurity.com/api/oshaminutes/delete/${meetingToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShowDeleteModal(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting OSHA", error);
        }
    };

    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await axios.get("https://api.avessecurity.com/api/Location/getLocations", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLocations(res.data?.Location || []);
        } catch (error) {
            console.error("Error fetching locations:", error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchLocations();
    }, []);

    const handleInputChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCreate = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const payload = {
                ...form,
                Venue: selectedLocation
            };
            await axios.post('https://api.avessecurity.com/api/oshaminutes/create', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShowCreate(false);
            setForm({});
            setSelectedLocation(null);
            fetchData();
        } catch (error) {
            console.error("Error creating occurrence", error);
        }
    };

    const handleView = (item) => {
        setViewData(item);
        setShowView(true);
    };

    const handleUpdate = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const payload = {
                ...form,
                Venue: selectedLocation
            };
            await axios.put(`https://api.avessecurity.com/api/oshaminutes/update/${editId}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShowEdit(false);
            setForm({});
            setSelectedLocation(null);
            fetchData();
        } catch (error) {
            console.error("Error updating occurrence", error);
        }
    };

    const getLocationOptions = () => {
         if (!locations || locations.length === 0) return [];

  const options = [];

  locations.forEach(location => {
    if (!location.PrimaryLocation) return;

    // Add primary location
    options.push({
      id: location._id,
      value: location.PrimaryLocation,
      label: location.PrimaryLocation,
      level: 0
    });

    // Process SubLocations
    if (location.SubLocation?.length > 0) {
      location.SubLocation.forEach(subLoc => {
        if (!subLoc.PrimarySubLocation) return;

        // Add SubLocation (level 1)
        const subLocValue = `${location.PrimaryLocation} > ${subLoc.PrimarySubLocation}`;
        options.push({
          id: subLoc._id,
          value: subLocValue,
          label: `${subLoc.PrimarySubLocation} (${location.PrimaryLocation})`,
          level: 1
        });

        // Process Secondary Locations
        if (subLoc.SecondaryLocation?.length > 0) {
          subLoc.SecondaryLocation.forEach(secondary => {
            if (!secondary.SecondaryLocation) return;

            // Add Secondary Location (level 2)
            const secondaryValue = `${subLocValue} > ${secondary.SecondaryLocation}`;
            options.push({
              id: secondary._id,
              value: secondaryValue,
              label: `${secondary.SecondaryLocation} (${subLoc.PrimarySubLocation})`,
              level: 2
            });

            // Process Secondary SubLocations
            if (secondary.SecondarySubLocation?.length > 0) {
              secondary.SecondarySubLocation.forEach(secondarySub => {
                if (!secondarySub.SecondarySubLocation) return;
                
                // Add Secondary SubLocation (level 3)
                const secondarySubValue = `${secondaryValue} > ${secondarySub.SecondarySubLocation}`;
                options.push({
                  id: secondarySub._id,
                  value: secondarySubValue,
                  label: `${secondarySub.SecondarySubLocation} (${secondary.SecondaryLocation})`,
                  level: 3
                });

                // Process Third Locations
                if (secondarySub.ThirdLocation?.length > 0) {
                  secondarySub.ThirdLocation.forEach(third => {
                    if (!third.ThirdLocation) return;

                    // Add Third Location (level 4)
                    const thirdValue = `${secondarySubValue} > ${third.ThirdLocation}`;
                    options.push({
                      id: third._id,
                      value: thirdValue,
                      label: `${third.ThirdLocation} (${secondarySub.SecondarySubLocation})`,
                      level: 4
                    });

                    // Add Third SubLocation if exists (level 5)
                    if (third.ThirdSubLocation) {
                      const thirdSubValue = `${thirdValue} > ${third.ThirdSubLocation}`;
                      options.push({
                        id: third._id, // Might need a different ID if available
                        value: thirdSubValue,
                        label: `${third.ThirdSubLocation} (${third.ThirdLocation})`,
                        level: 5
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  return options;
    };

    const handleFollowUpSubmit = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const url = `https://api.avessecurity.com/api/oshaminutes/create/${viewData._id}/${followUpType}`;

            await axios.post(url, followUpForm, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setFollowUpForm({
                Title: '',
                Status: '',
                Department: '',
                ActionBy: '',
                Deadline: '',
                Remarks: ''
            });
            fetchData();
        } catch (error) {
            console.error("Error submitting follow-up", error);
        }
    };

    const handleUpdateRemarks = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const { type, meetingId, itemId, remarks, closeItem } = currentRemarks;
            
            const url = `https://api.avessecurity.com/api/oshaminutes/update/${meetingId}/${type}/${itemId}`;
            
            const updateData = { 
                Remarks: remarks,
                Status: closeItem ? 'Closed' : undefined
            };
            
            await axios.put(url, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowRemarksCanvas(false);
            fetchData();
        } catch (error) {
            console.error("Error updating remarks", error);
        }
    };

    const groupParticipantsByStatus = (participants) => {
        const grouped = {
            'Not Responded': [],
            'Submitted': []
        };

        participants?.forEach(participant => {
            if (participant.Submitted) {
                grouped['Submitted'].push(participant);
            } else {
                grouped['Not Responded'].push(participant);
            }
        });

        return grouped;
    };

    const getStatusBadge = (status) => {
        const option = statusOptions.find(opt => opt.value === status);
        if (!option) return null;
        return <Badge bg={option.color}>{option.label}</Badge>;
    };

const formatVenue = (venue) => {
    if (!venue) return 'No Venue';
    
    // If venue is a string (like in your API response)
    if (typeof venue === 'string') {
        return venue;
    }
    
    // If venue is an object (like your code expects)
    let parts = [];
    if (venue.PrimaryLocation) parts.push(venue.PrimaryLocation);
    if (venue.SubLocation) parts.push(venue.SubLocation);
    if (venue.SecondaryLocation) parts.push(venue.SecondaryLocation);
    if (venue.ThirdLocation) parts.push(venue.ThirdLocation);
    
    return parts.join(', ');
};

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">Meetings</h4>
                <Button variant="primary" onClick={() => setShowCreate(true)}>Create Invitation</Button>
            </div>
            
            <div className="mb-4 p-3 bg-white rounded shadow-sm">
                <Calendar
                    localizer={localizer}
                    events={data.map((item) => ({
                        id: item._id,
                        title: item.MeetingTitle || 'Meeting',
                        start: new Date(item.Date),
                        end: new Date(item.Date),
                        allDay: true
                    }))}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 500 }}
                    onSelectEvent={(event) => {
                        const selected = data.find(d => d._id === event.id);
                        if (selected) {
                            setViewData(selected);
                            setShowView(true);
                        }
                    }}
                />
            </div>

            <div className="p-3 bg-white rounded shadow-sm" style={{ boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)' }}>
                <Table hover responsive className="mb-0">
                    <thead className="table-light">
                        <tr>
                            <th>S.No</th>
                            <th>Meeting Title</th>
                            <th>Meeting Date & Time</th>
                            <th>Venue</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, i) => (
                            <tr key={item._id}>
                                <td>{i + 1}</td>
                                <td>{item.MeetingTitle}</td>
                                <td>{new Date(item?.Date).toLocaleDateString()} - {item.Time}</td>
                                <td>{formatVenue(item.Venue)}</td>
                                <td>
                                    <Button
                                        size="sm"
                                        variant="outline-success"
                                        className="me-1"
                                        onClick={() => {
                                            setSelectedMeetingId(item._id);
                                            setSelectedParticipants([]);
                                            setShowParticipantCanvas(true);
                                        }}
                                        title='Add Participant'
                                    >
                                        <i className="bi bi-person-plus"></i>
                                    </Button>

                                    <Button 
                                        size="sm" 
                                        variant="outline-primary" 
                                        title='View Meeting Details' 
                                        onClick={() => handleView(item)} 
                                        className="me-1"
                                    >
                                        <i className="bi bi-eye"></i>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        className="me-1"
                                        onClick={() => {
                                            setEmailMeetingId(item._id);
                                            setEmailList([]);
                                            setShowEmailCanvas(true);
                                        }}
                                        title='Invite via mail'
                                    >
                                        <i className="bi bi-envelope"></i>
                                    </Button>
                                    <Button 
                                        size="sm"
                                        variant="outline-danger"
                                        className="me-1"
                                        onClick={() => {
                                            setMeetingToDelete(item._id);
                                            setShowDeleteModal(true);
                                        }}
                                        title='Delete Meeting'
                                    >
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                    <Button 
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                            setViewData(item);
                                            setShowFollowUp(true);
                                            setShowView(false);
                                        }}
                                    >
                                        <i className="bi bi-bell-fill"></i> Follow Up
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this meeting? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={deleteOSha}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Follow Up Offcanvas */}
            <Offcanvas show={showFollowUp} onHide={() => setShowFollowUp(false)} placement="end" className="w-50">
                {viewData && (
                    <>
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title>Follow Up - {viewData.MeetingTitle}</Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <div className="mb-4">
                                <h5>Meeting Details</h5>
                                <p><strong>Meeting Title:</strong> {viewData.MeetingTitle}</p>
                                <p><strong>Date:</strong> {new Date(viewData.Date).toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {viewData.Time}</p>
                                <p><strong>Venue:</strong> {viewData.Venue}</p>
                            </div>

                            <div className="mb-4">
                                <h5>Participants</h5>
                                {Object.entries(groupParticipantsByStatus(viewData.Participants)).map(([status, participants]) => (
                                    participants.length > 0 && (
                                        <div key={status} className="mb-3">
                                            <h6>{status}</h6>
                                            <ul className="list-unstyled ps-3">
                                                {participants.map((p, i) => (
                                                    <li key={i} className="d-flex align-items-center justify-content-between">
                                                        <span>{p.Name || p.EmailId}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )
                                ))}
                            </div>

                            <div className="mb-4">
                                <h5>Add Follow Up</h5>
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Type</Form.Label>
                                        <Form.Select 
                                            value={followUpType}
                                            onChange={(e) => setFollowUpType(e.target.value)}
                                        >
                                            <option value="Description">Description</option>
                                            <option value="Discussion">Discussion</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Title</Form.Label>
                                        <Form.Control
                                            name="Title"
                                            value={followUpForm.Title}
                                            onChange={(e) => setFollowUpForm({...followUpForm, Title: e.target.value})}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Status</Form.Label>
                                        <Select
                                            options={statusOptions}
                                            value={statusOptions.find(opt => opt.value === followUpForm.Status)}
                                            onChange={(selected) => setFollowUpForm({...followUpForm, Status: selected?.value || ''})}
                                            placeholder="Select status"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Department</Form.Label>
                                        <Select
                                            options={departments}
                                            value={departments.find(d => d.value === followUpForm.Department)}
                                            onChange={(selected) => setFollowUpForm({...followUpForm, Department: selected?.value || ''})}
                                            placeholder="Select department"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Action By</Form.Label>
                                        <Select
                                            options={users}
                                            value={users.find(u => u.value === followUpForm.ActionBy)}
                                            onInputChange={(value) => {
                                                setInputValue(value);
                                                setMenuOpen(!!value);
                                            }}
                                            menuIsOpen={menuOpen}
                                            onChange={(selected) => setFollowUpForm({...followUpForm, ActionBy: selected?.value || ''})}
                                            placeholder="Select user"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Deadline</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="Deadline"
                                            value={followUpForm.Deadline}
                                            onChange={(e) => setFollowUpForm({...followUpForm, Deadline: e.target.value})}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Remarks</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="Remarks"
                                            value={followUpForm.Remarks}
                                            onChange={(e) => setFollowUpForm({...followUpForm, Remarks: e.target.value})}
                                        />
                                    </Form.Group>

                                    <Button 
                                        variant="primary" 
                                        onClick={handleFollowUpSubmit}
                                    >
                                        Add {followUpType}
                                    </Button>
                                </Form>
                            </div>

                            {viewData.Description?.length > 0 && (
                                <div className="mb-4">
                                    <h5>Descriptions</h5>
                                    {viewData.Description.map((desc, index) => (
                                        <div key={index} className="card mb-2">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h6>{desc.Title}</h6>
                                                        <p>Status: {getStatusBadge(desc.Status)}</p>
                                                        <p>Department: {departments.find(d => d.value === desc.Department)?.label || desc.Department}</p>
                                                        <p>Action By: {users.find(u => u.value === desc.ActionBy)?.label || desc.ActionBy}</p>
                                                        <p>Deadline: {desc.Deadline}</p>
                                                        <p>Remarks: {desc.Remarks}</p>
                                                    </div>
                                                    {desc.Status === 'Pending' && (
                                                        <Button 
                                                            variant="outline-secondary" 
                                                            size="sm"
                                                            onClick={() => {
                                                                setCurrentRemarks({
                                                                    type: 'Description',
                                                                    meetingId: viewData._id,
                                                                    itemId: desc._id,
                                                                    remarks: desc.Remarks || '',
                                                                    closeItem: true
                                                                });
                                                                setShowRemarksCanvas(true);
                                                            }}
                                                        >
                                                            <i className="bi bi-pencil"></i> Update Remarks
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewData.Discussion?.length > 0 && (
                                <div className="mb-4">
                                    <h5>Discussions</h5>
                                    {viewData.Discussion.map((disc, index) => (
                                        <div key={index} className="card mb-2">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h6>{disc.Title}</h6>
                                                        <p>Status: {getStatusBadge(disc.Status)}</p>
                                                        <p>Department: {departments.find(d => d.value === disc.Department)?.label || disc.Department}</p>
                                                        <p>Action By: {users.find(u => u.value === disc.ActionBy)?.label || disc.ActionBy}</p>
                                                        <p>Deadline: {disc.Deadline}</p>
                                                        <p>Remarks: {disc.Remarks}</p>
                                                    </div>
                                                    {disc.Status === 'Pending' && (
                                                        <Button 
                                                            variant="outline-secondary" 
                                                            size="sm"
                                                            onClick={() => {
                                                                setCurrentRemarks({
                                                                    type: 'Discussion',
                                                                    meetingId: viewData._id,
                                                                    itemId: disc._id,
                                                                    remarks: disc.Remarks || '',
                                                                    closeItem: true
                                                                });
                                                                setShowRemarksCanvas(true);
                                                            }}
                                                        >
                                                            <i className="bi bi-pencil"></i> Update Remarks
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Offcanvas.Body>
                    </>
                )}
            </Offcanvas>

            {/* Remarks Update Offcanvas */}
            <Offcanvas show={showRemarksCanvas} onHide={() => setShowRemarksCanvas(false)} placement="end">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Update Remarks</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Remarks</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={5}
                            value={currentRemarks.remarks}
                            onChange={(e) => setCurrentRemarks({
                                ...currentRemarks,
                                remarks: e.target.value
                            })}
                        />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                        <Form.Check 
                            type="checkbox"
                            label="Close this Meeting after updating remarks"
                            checked={currentRemarks.closeItem}
                            onChange={(e) => setCurrentRemarks({
                                ...currentRemarks,
                                closeItem: e.target.checked
                            })}
                        />
                    </Form.Group>
                    
                    <Button 
                        variant="primary" 
                        onClick={handleUpdateRemarks}
                    >
                        Update Remarks
                    </Button>
                </Offcanvas.Body>
            </Offcanvas>

            {/* View Offcanvas */}
            <Offcanvas show={showView && !showFollowUp} onHide={() => setShowView(false)} placement="end" className="w-50">
                {viewData && (
                    <>
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title>Meeting Details</Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <div className="mb-4">
                                <h5>Meeting Details</h5>
                                <p><strong>Meeting Title:</strong> {viewData.MeetingTitle}</p>
                                <p><strong>Date:</strong> {new Date(viewData.Date).toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {viewData.Time}</p>
                                <p><strong>Venue:</strong> {formatVenue(viewData.Venue)}</p>
                            </div>

                            <div className="mb-4">
                                <h5>Participants</h5>
                                {Object.entries(groupParticipantsByStatus(viewData.Participants)).map(([status, participants]) => (
                                    participants.length > 0 && (
                                        <div key={status} className="mb-3">
                                            <h6>{status}</h6>
                                            <ul className="list-unstyled ps-3">
                                                {participants.map((p, i) => (
                                                    <li key={i} className="d-flex align-items-center justify-content-between">
                                                        <span>{p.Name || p.EmailId}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )
                                ))}
                            </div>

                            {viewData.Description?.length > 0 && (
                                <div className="mb-4">
                                    <h5>Descriptions</h5>
                                    {viewData.Description.map((desc, index) => (
                                        <div key={index} className="card mb-2">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h6>{desc.Title}</h6>
                                                        <p>Status: {getStatusBadge(desc.Status)}</p>
                                                        <p>Department: {departments.find(d => d.value === desc.Department)?.label || desc.Department}</p>
                                                        <p>Action By: {users.find(u => u.value === desc.ActionBy)?.label || desc.ActionBy}</p>
                                                        <p>Deadline: {desc.Deadline}</p>
                                                        <p>Remarks: {desc.Remarks}</p>
                                                    </div>
                                                    {desc.Status === 'Pending' && (
                                                        <Button 
                                                            variant="outline-secondary" 
                                                            size="sm"
                                                            onClick={() => {
                                                                setCurrentRemarks({
                                                                    type: 'Description',
                                                                    meetingId: viewData._id,
                                                                    itemId: desc._id,
                                                                    remarks: desc.Remarks || '',
                                                                    closeItem: true
                                                                });
                                                                setShowRemarksCanvas(true);
                                                            }}
                                                        >
                                                            <i className="bi bi-pencil"></i> Update Remarks
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {viewData.Discussion?.length > 0 && (
                                <div className="mb-4">
                                    <h5>Discussions</h5>
                                    {viewData.Discussion.map((disc, index) => (
                                        <div key={index} className="card mb-2">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h6>{disc.Title}</h6>
                                                        <p>Status: {getStatusBadge(disc.Status)}</p>
                                                        <p>Department: {departments.find(d => d.value === disc.Department)?.label || disc.Department}</p>
                                                        <p>Action By: {users.find(u => u.value === disc.ActionBy)?.label || disc.ActionBy}</p>
                                                        <p>Deadline: {disc.Deadline}</p>
                                                        <p>Remarks: {disc.Remarks}</p>
                                                    </div>
                                                    {disc.Status === 'Pending' && (
                                                        <Button 
                                                            variant="outline-secondary" 
                                                            size="sm"
                                                            onClick={() => {
                                                                setCurrentRemarks({
                                                                    type: 'Discussion',
                                                                    meetingId: viewData._id,
                                                                    itemId: disc._id,
                                                                    remarks: disc.Remarks || '',
                                                                    closeItem: true
                                                                });
                                                                setShowRemarksCanvas(true);
                                                            }}
                                                        >
                                                            <i className="bi bi-pencil"></i> Update Remarks
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Offcanvas.Body>
                    </>
                )}
            </Offcanvas>

            {/* Create/Edit Meeting Offcanvas */}
            {[showCreate, showEdit].map((show, idx) => (
                <Offcanvas
                    key={idx}
                    show={show}
                    onHide={() => (idx === 0 ? setShowCreate(false) : setShowEdit(false))}
                    placement="end"
                    className="w-50"
                >
                    <Offcanvas.Header closeButton>
                        <Offcanvas.Title>{idx === 0 ? 'Create Invitation' : 'Edit Invitation'}</Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>
                        <Form>
                            {["MeetingTitle", "Date", "Time", "Venue", "Chaired"].map((field) => (
                                <Form.Group key={field} className="mb-3">
                                    <Form.Label>{field.replace(/([A-Z])/g, ' $1')}</Form.Label>

                                    {field === "Date" ? (
                                        <Form.Control
                                            type="date"
                                            name="Date"
                                            value={form["Date"] || ''}
                                            onChange={handleInputChange}
                                        />
                                    ) : field === "Chaired" ? (
                                        <Select
                                            name="Chaired"
                                            options={users}
                                            onInputChange={(value) => {
                                                setInputValue(value);
                                                setMenuOpen(!!value);
                                            }}
                                            menuIsOpen={menuOpen}
                                            value={users.find(opt => opt.value === form["Chaired"])}
                                            onChange={(selected) => {
                                                setForm(prev => ({
                                                    ...prev,
                                                    Chaired: selected?.value || ''
                                                }));
                                            }}
                                        />
                                    ) : field === "Venue" ? (
                                        <Select
                                            options={getLocationOptions()}
                                            value={getLocationOptions().find(opt => opt.value === selectedLocation)}
                                            onChange={(selected) => {
                                                setSelectedLocation(selected?.value || '');
                                            }}
                                            placeholder="Search or select location..."
                                            isSearchable
                                            isClearable
                                            className="border-primary"
                                            styles={{
                                                control: (provided) => ({
                                                    ...provided,
                                                    borderColor: '#0d6efd',
                                                    '&:hover': {
                                                        borderColor: '#0d6efd'
                                                    }
                                                })
                                            }}
                                        />
                                    ) : (
                                        <Form.Control
                                            type={field === "Time" ? "time" : "text"}
                                            name={field}
                                            value={form[field] || ''}
                                            onChange={handleInputChange}
                                        />
                                    )}
                                </Form.Group>
                            ))}
                            <Button variant="primary" onClick={idx === 0 ? handleCreate : handleUpdate}>
                                {idx === 0 ? 'Create' : 'Update'}
                            </Button>
                        </Form>
                    </Offcanvas.Body>
                </Offcanvas>
            ))}

            {/* Add Participants Offcanvas */}
            <Offcanvas
                show={showParticipantCanvas}
                onHide={() => setShowParticipantCanvas(false)}
                placement="end"
                className="w-50"
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Add Participants</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Form.Group>
                        <Form.Label>Select Participants</Form.Label>
                        <Select
                            isMulti
                            options={users.filter(u =>
                                !data
                                    .find(d => d._id === selectedMeetingId)
                                    ?.Participants?.some(p => p._id === u.value)
                            )}
                            onInputChange={(value) => {
                                setInputValue(value);
                                setMenuOpen(!!value);
                            }}
                            menuIsOpen={menuOpen}
                            onChange={(selected) => setSelectedParticipants(selected.map(p => p.value))}
                        />
                    </Form.Group>
                    <Button
                        className="mt-3"
                        onClick={async () => {
                            if (!selectedMeetingId || selectedParticipants.length === 0) return;

                            try {
                                const token = localStorage.getItem("access_token");

                                await axios.post(
                                    `https://api.avessecurity.com/api/oshaminutes/Osha/AddParticipant/${selectedMeetingId}`,
                                    { _id: selectedParticipants },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );

                                for (const userId of selectedParticipants) {
                                    await sendPushNotification({
                                        userId,
                                        title: "You've been added to a meeting",
                                        body: "Please check the Osha meeting section for details."
                                    });
                                }

                                setShowParticipantCanvas(false);
                                fetchData();
                            } catch (err) {
                                console.error("Failed to add participants or send notifications", err);
                            }
                        }}
                    >
                        Submit Participants
                    </Button>
                </Offcanvas.Body>
            </Offcanvas>

            {/* Email Invitation Offcanvas */}
            <Offcanvas
                show={showEmailCanvas}
                onHide={() => setShowEmailCanvas(false)}
                placement="end"
                className="w-50"
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Send Meeting Mail</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Form.Group>
                        <Form.Label>Enter Email IDs</Form.Label>
                        <CreatableSelect
                            isMulti
                            placeholder="Type and press enter..."
                            value={emailList.map(email => ({ label: email, value: email }))}
                            onChange={(selected) => setEmailList(selected.map((s) => s.value))}
                            options={[]}
                            onCreateOption={(inputValue) => {
                                if (/\S+@\S+\.\S+/.test(inputValue)) {
                                    setEmailList([...emailList, inputValue]);
                                } else {
                                    alert("Invalid email format");
                                }
                            }}
                            isValidNewOption={(inputValue) => /\S+@\S+\.\S+/.test(inputValue)}
                            formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                            allowCreateWhileLoading
                            isClearable={false}
                            isSearchable
                            components={{ DropdownIndicator: null }}
                        />
                    </Form.Group>
                    <Button
                        className="mt-3"
                        variant="primary"
                        onClick={async () => {
                            if (!emailMeetingId || emailList.length === 0) return;

                            try {
                                const token = localStorage.getItem("access_token");
                                await axios.put(
                                    `https://api.avessecurity.com/api/oshaminutes/SendMail/${emailMeetingId}`,
                                    { EmailId: emailList },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );
                                setShowEmailCanvas(false);
                                setEmailList([]);
                            } catch (err) {
                                console.error("Failed to send mail", err);
                            }
                        }}
                    >
                        Send Mail
                    </Button>
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );
};

export default OshaInvite;