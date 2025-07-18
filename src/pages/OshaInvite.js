import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Form, Table, Offcanvas } from 'react-bootstrap';
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
    const [inputValue, setInputValue] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [showParticipantCanvas, setShowParticipantCanvas] = useState(false);
    const [selectedMeetingId, setSelectedMeetingId] = useState(null);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [showEmailCanvas, setShowEmailCanvas] = useState(false);
    const [emailList, setEmailList] = useState([]);
    const [emailMeetingId, setEmailMeetingId] = useState(null);
    const [location, setLocation] = useState("");
    const handleSelectChange = (field, selected) => {
        setForm(prev => ({
            ...prev,
            [field]: selected?.value || '',
        }));
        // }
    };
    const token = localStorage.getItem("access_token");
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
        fetchUsers(inputValue);
    }, [inputValue]);

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
            await axios.post('https://api.avessecurity.com/api/oshaminutes/create', form, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShowCreate(false);
            setForm({});
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
            await axios.put(`https://api.avessecurity.com/api/DailyOccurance/update/${editId}`, form, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShowEdit(false);
            setForm({});
            fetchData();
        } catch (error) {
            console.error("Error updating occurrence", error);
        }
    };


    const getLocationOptions = () => {
        const options = [];
        locations.forEach(location => {
            if (!location.PrimaryLocation) return;
            options.push({ value: location._id, label: location.PrimaryLocation });
            location.SecondaryLocation?.forEach(secondary => {
                if (!secondary.SecondaryLocation) return;
                options.push({
                    value: secondary._id,
                    label: `Primary : ${location.PrimaryLocation} -> Secondary : ${secondary.SecondaryLocation}`
                });
                secondary.ThirdLocation?.forEach(third => {
                    if (!third.ThirdLocation) return;
                    options.push({
                        value: third._id,
                        label: `Primary : ${location.PrimaryLocation} -> Secondary : ${secondary.SecondaryLocation} -> Third : ${third.ThirdLocation}`
                    });
                });
            });
        });
        return options;
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">Meetings</h4>
                <Button variant="primary" onClick={() => setShowCreate(true)}>Create Invitation</Button>
            </div>
            <div className="mb-4 p-3 bg-white rounded shadow-sm">
                {/* <h5 className="fw-bold mb-3">Meeting Calendar</h5> */}
                <Calendar
                    localizer={localizer}
                    events={data.map((item) => ({
                        id: item._id,
                        title: item.MeetingTitle || 'Meeting',
                        start: new Date(item.Date),
                        end: new Date(item.Date), // Assuming meeting is same-day
                        allDay: true
                    }))}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 500 }}
                    onSelectEvent={(event) => {
                        const selected = data.find(d => d._id === event.id);
                        if (selected) handleView(selected); // Open edit drawer
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
                            {/* <th>Followup Required</th> */}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, i) => (
                            <tr key={item._id}>
                                <td>{i + 1}</td>
                                <td>{item.MeetingTitle}</td>
                                <td>{new Date(item?.Date).toLocaleDateString()} - {item.Time}</td>
                                <td>{item?.Venue}</td>
                                {/* <td>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        fontWeight: '500',
                                        color: '#000',
                                        backgroundColor: item.FollowupRequired === 'Yes' ? '#fff3cd' : '#d4edda',
                                        border: item.FollowupRequired === 'Yes' ? '1px solid #ffeeba' : '1px solid #c3e6cb'
                                    }}>
                                        {item.FollowupRequired === 'Yes' ? 'Yes' : 'No'}
                                    </span>
                                </td> */}
                                <td>
                                    <Button
                                        size="sm"
                                        variant="outline-success"
                                        className="me-1"
                                        onClick={() => {
                                            setSelectedMeetingId(item._id);
                                            setSelectedParticipants([]); // reset
                                            setShowParticipantCanvas(true);
                                        }}
                                        title='Add Participant'
                                    >
                                        <i className="bi bi-person-plus"></i>
                                    </Button>

                                    <Button size="sm" variant="outline-primary" title='View Meeting Details' onClick={() => handleView(item)} className="me-1">
                                        <i className="bi bi-eye"></i>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        className="me-1"
                                        onClick={() => {
                                            setEmailMeetingId(item._id);
                                            setEmailList([]); // reset list
                                            setShowEmailCanvas(true); // open canvas
                                        }}
                                        title='Invite via mail'
                                    >
                                        <i className="bi bi-envelope"></i>
                                    </Button>

                                    {/* <Button size="sm" variant="outline-danger" onClick={() => handleDelete(item._id)}>
                                        <i className="bi bi-trash"></i>
                                    </Button> */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* View Offcanvas */}
            <Offcanvas show={showView} onHide={() => setShowView(false)} placement="end" className="w-50">
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>Meeting Details</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {viewData && (
                        <>
                            <p><strong>Meeting Title:</strong> {viewData.MeetingTitle}</p>
                            <p><strong>Date:</strong> {new Date(viewData.Date).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> {viewData.Time}</p>
                            <p><strong>Venue:</strong> {viewData.Venue}</p>

                            <p><strong>Participants:</strong></p>

                            {viewData.Participants && viewData.Participants.length > 0 ? (
                                <>
                                    {['Yes', 'No', 'Maybe', ''].map((status) => {
                                        const group = viewData.Participants.filter(p => (p.Available || '') === status);
                                        if (group.length === 0) return null;

                                        return (
                                            <div key={status} className="mb-3">
                                                <h6 className="text-capitalize">
                                                    {status === '' ? 'Not Responded' : status}
                                                </h6>
                                                <ul className="list-unstyled ps-3">
                                                    {group.map((p) => (
                                                        <li key={p._id} className="d-flex align-items-center justify-content-between">
                                                            <span>{p.Name}</span>
                                                            <div className="form-check">
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={p.Submitted}
                                                                    readOnly
                                                                />
                                                                <label className="form-check-label ms-1">Submitted</label>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <p>No participants added.</p>
                            )}
                        </>
                    )}
                </Offcanvas.Body>

            </Offcanvas>

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
                                            onChange={selected => handleSelectChange("Chaired", selected)}
                                        />
                                    ) : field === "Venue" ? (
                                        <Select
                                            options={getLocationOptions()}
                                            value={getLocationOptions().find(opt => opt.value === form["Venue"] || opt.value === form["Venue"])}
                                            onChange={selected => handleSelectChange("Venue", selected)}
                                            placeholder="Select location"
                                            isClearable
                                            className="w-100"
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

                                // 1. Add participants
                                await axios.post(
                                    `https://api.avessecurity.com/api/oshaminutes/Osha/AddParticipant/${selectedMeetingId}`,
                                    { _id: selectedParticipants },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );

                                // 2. Send notifications one-by-one
                                for (const userId of selectedParticipants) {
                                    await sendPushNotification({
                                        userId,
                                        title: "You've been added to a meeting",
                                        body: "Please check the Osha meeting section for details."
                                    });
                                }

                                // 3. Close canvas and refresh data
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
                            options={[]} // No predefined options
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