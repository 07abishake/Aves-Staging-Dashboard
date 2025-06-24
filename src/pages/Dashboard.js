import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import axios from 'axios';

const dummyChartData = [
  { name: 'Jan', users: 400, messages: 240 },
  { name: 'Feb', users: 300, messages: 139 },
  { name: 'Mar', users: 200, messages: 980 },
  { name: 'Apr', users: 278, messages: 390 },
  { name: 'May', users: 189, messages: 480 },
];

function Dashboard() {
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
    }
  }, [token]);

  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    onlineUsers: [],
    offlineUsers: [],
  });

  const [userStatistics, setUserStatistics] = useState({
    todayGatePass: 0,
    totalGatePass: 0,
    todayIncidentReport: 0,
    totalIncidentReport: 0,
    todayKeyForm: 0,
    totalKeyForm: 0,
    todaySecurityPass: 0,
    totalSecurityPass: 0
  });


  const [notificationData, setNotificationData] = useState([]);
  const [filter, setFilter] = useState('all');


  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleRowClick = (team) => {
    setSelectedTeam(team);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedTeam(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch User Status
        const statusRes = await fetch('https://api.avessecurity.com/api/users/Status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const statusData = await statusRes.json();

        setUserStats({
          totalUsers: statusData.totalUsers || 0,
          onlineUsers: statusData.onlineUsers || [],
          offlineUsers: statusData.offlineUsers || [],
        });
        console.log('User Status:', userStats);
        // Fetch Notification Analytics
        const notifRes = await fetch('https://api.avessecurity.com/api/users/Notification-Status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const notifData = await notifRes.json();

        // Map analytics and ensure notifications array exists
        setNotificationData(
          (notifData.analytics || []).map(team => ({
            ...team,
            notifications: team.notifications || [], // Make sure notifications array is present
          }))
        );
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, [token, userStats]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await axios.get(`https://api.avessecurity.com/api/users/Count`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = response.data;
        setUserStatistics(data);
        console.log('Counts:', data);

      } catch (error) {

        console.error('Error fetching counts:', error);

      }
    }
    fetchCounts();
  }, [token]);
  // Filter function based on dropdown
  const filteredData = notificationData.map(team => {
    if (filter === 'success') {
      return {
        ...team,
        notificationStats: {
          ...team.notificationStats,
          totalNotifications: team.notificationStats.totalSuccess,
          totalFailed: 0
        }
      };
    } else if (filter === 'failed') {
      return {
        ...team,
        notificationStats: {
          ...team.notificationStats,
          totalNotifications: team.notificationStats.totalFailed,
          totalSuccess: 0
        }
      };
    }
    return team;
  });

  const renderUserItem = (user, isOnline, index) => (
    <li key={index} className="list-group-item d-flex align-items-center">
      <span
        className="me-2"
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: isOnline ? 'green' : 'red',
          display: 'inline-block',
        }}
      ></span>
      {user.username || `User ${index + 1}`}
    </li>
  );

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Dashboard</h2>

      {/* User Stats Cards */}
      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="p-4 text-white rounded shadow" style={{ backgroundColor: '#93AEFF' }}>
            <h3>{userStats.totalUsers}</h3>
            <p className="mb-0">Total Users</p>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="p-4 text-white rounded shadow" style={{ backgroundColor: '#55E49F' }}>
            <h3>{userStats.onlineUsers.length}</h3>
            <p className="mb-0">Online Users</p>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="p-4 text-white rounded shadow" style={{ backgroundColor: '#FFA1A1' }}>
            <h3>{userStats.offlineUsers.length}</h3>
            <p className="mb-0">Offline Users</p>
          </div>
        </div>
      </div>

      {/* Chart and Online/Offline Users */}
      <div className="row mt-4">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">User Activity</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dummyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" />
                  <Line type="monotone" dataKey="messages" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Online Users</h5>
              <ul className="list-group list-group-flush">
                {userStats.onlineUsers.length > 0 ? (
                  userStats.onlineUsers.map((user, index) =>
                    renderUserItem(user, true, index)
                  )
                ) : (
                  <li className="list-group-item text-muted">No users online</li>
                )}
              </ul>

              <h5 className="card-title mt-4">Offline Users</h5>
              <ul className="list-group list-group-flush">
                {userStats.offlineUsers.length > 0 ? (
                  userStats.offlineUsers.map((user, index) =>
                    renderUserItem(user, false, index)
                  )
                ) : (
                  <li className="list-group-item text-muted">No users offline</li>
                )}
              </ul>
            </div>
          </div>
        </div> */}
        <div className="row col-md-6 mb-4">
          <div className="col-md-6 mb-3">
            <div className="p-4 text-white rounded shadow" style={{ backgroundColor: '#F18CA9' }}>
              <p className="mb-0">INCIDENTS</p>
              <h3>{`${userStatistics.todayIncidentReport}/${userStatistics.totalIncidentReport}`}</h3>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="p-4 text-white rounded shadow" style={{ backgroundColor: '#8ACBD2' }}>
              <p className="mb-0">KEYS</p>
              <h3>{`${userStatistics.todayKeyForm}/${userStatistics.totalKeyForm}`}</h3>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="p-4 text-white rounded shadow" style={{ backgroundColor: '#AB95D8' }}>
              <p className="mb-0">GATEPASS</p>
              <h3>{`${userStatistics.todayGatePass}/${userStatistics.totalGatePass}`}</h3>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="p-4 text-white rounded shadow" style={{ backgroundColor: '#C1CFA1' }}>
              <p className="mb-0">SECURITY PASS</p>
              <h3>{`${userStatistics.todaySecurityPass}/${userStatistics.totalSecurityPass}`}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Stats Section */}
      {/* Dropdown Filter */}
      <div className="mb-3">
        <label htmlFor="statusFilter" className="form-label">Filter by Status:</label>
        <select
          id="statusFilter"
          className="form-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="all">All</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* <div className="row mt-4">
        {filteredData.map((team, idx) => {
          const { totalNotifications, totalSuccess, totalFailed, uniqueRecipients } = team.notificationStats;

          // Calculate progress percentages for bars
          const successPercent = totalNotifications > 0 ? (totalSuccess / totalNotifications) * 100 : 0;
          const failedPercent = totalNotifications > 0 ? (totalFailed / totalNotifications) * 100 : 0;

          return (
            <motion.div
              className="col-md-6 mb-4"
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card shadow" style={{ cursor: 'pointer' }}>
                <div className="card-body">
                  <h5 className="card-title">{team.teamName} Team</h5>
                  <p><strong>Total Users:</strong> {team.totalUsers}</p>
                  <p><strong>Total Notifications Sent:</strong> {totalNotifications}</p>
                  <p><strong>Unique Recipients:</strong> {uniqueRecipients}</p>
                  <p><strong>Users:</strong></p>
                  <ul>
                    {team.users && team.users.length > 0 ? (
                      team.users.map((user) => (
                        <li key={user.id}>{user.name}</li>
                      ))
                    ) : (
                      <li>No users found</li>
                    )}
                  </ul>

               
                  {team.notifications && team.notifications.length > 0 ? (
                    team.notifications.map((notification, notifIdx) => (
                      <div key={notifIdx} className="mb-3 border-top pt-2">
                        <p><strong>Sender:</strong> {notification.sentBy?.name || 'N/A'} ({notification.sentBy?.email || 'No email'})</p>
                        <p><strong>Receivers:</strong></p>
                        <ul>
                          {notification.receivedBy && notification.receivedBy.length > 0 ? (
                            notification.receivedBy.map((receiver, rIdx) => (
                              <li key={rIdx}>
                                {receiver.name || 'N/A'} ({receiver.email || 'No email'})
                              </li>
                            ))
                          ) : (
                            <li>No receivers found</li>
                          )}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No notification details available.</p>
                  )}


                  <div className="mt-3">
                    <p className="mb-1">Success</p>
                    <div className="progress" style={{ height: '15px' }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${successPercent}%` }}
                        aria-valuenow={successPercent}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {successPercent.toFixed(1)}%
                      </div>
                    </div>

                    <p className="mb-1 mt-3">Failed</p>
                    <div className="progress" style={{ height: '15px' }}>
                      <div
                        className="progress-bar bg-danger"
                        role="progressbar"
                        style={{ width: `${failedPercent}%` }}
                        aria-valuenow={failedPercent}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {failedPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div> */}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Total Members</th>
            <th>Success</th>
            <th>Failed</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((team, idx) => {
            const { totalNotifications, totalSuccess, totalFailed } = team.notificationStats;

            const successPercent = totalNotifications > 0 ? (totalSuccess / totalNotifications) * 100 : 0;
            const failedPercent = totalNotifications > 0 ? (totalFailed / totalNotifications) * 100 : 0;

            return (
              <tr key={idx} onClick={() => handleRowClick(team)} style={{ cursor: 'pointer' }}>
                <td>{team.teamName} Team</td>
                <td>{team.totalUsers}</td>
                <td>
                  <div className="progress" style={{ height: '10px' }}>
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{ width: `${successPercent}%` }}
                    />
                  </div>
                  <small>{successPercent.toFixed(1)}%</small>
                </td>
                <td>
                  <div className="progress" style={{ height: '10px' }}>
                    <div
                      className="progress-bar bg-danger"
                      role="progressbar"
                      style={{ width: `${failedPercent}%` }}
                    />
                  </div>
                  <small>{failedPercent.toFixed(1)}%</small>
                </td>
              </tr>

            );
          })}
        </tbody>
      </table>

      <Tooltip id="tooltip" />
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedTeam?.teamName} Team Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTeam && (
            <>
              <p><strong>Total Users:</strong> {selectedTeam.totalUsers}</p>
              <p><strong>Total Notifications Sent:</strong> {selectedTeam.notificationStats.totalNotifications}</p>
              <p><strong>Unique Recipients:</strong> {selectedTeam.notificationStats.uniqueRecipients}</p>
              <p><strong>Users:</strong></p>
              <ul>
                {selectedTeam.users?.length > 0 ? (
                  selectedTeam.users.map((user) => (
                    <li key={user.id}>{user.name}</li>
                  ))
                ) : (
                  <li>No users found</li>
                )}
              </ul>

              {/* {selectedTeam.notifications?.length > 0 ? (
                selectedTeam.notifications.map((notification, notifIdx) => (
                  <div key={notifIdx} className="mb-3 border-top pt-2">
                    <p><strong>Sender:</strong> {notification.sentBy?.name || 'N/A'} ({notification.sentBy?.email || 'No email'})</p>
                    <p><strong>Receivers:</strong></p>
                    <ul>
                      {notification.receivedBy?.length > 0 ? (
                        notification.receivedBy.map((receiver, rIdx) => (
                          <li key={rIdx}>
                            {receiver.name || 'N/A'} ({receiver.email || 'No email'})
                          </li>
                        ))
                      ) : (
                        <li>No receivers found</li>
                      )}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-muted">No notification details available.</p>
              )} */}

              <div className="mt-3">
                <p className="mb-1">Success</p>
                <div className="progress" style={{ height: '15px' }}>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{
                      width: `${(selectedTeam.notificationStats.totalSuccess /
                        selectedTeam.notificationStats.totalNotifications) *
                        100
                        }%`
                    }}
                  >
                    {(
                      (selectedTeam.notificationStats.totalSuccess /
                        selectedTeam.notificationStats.totalNotifications) *
                      100
                    ).toFixed(1)}%
                  </div>
                </div>

                <p className="mb-1 mt-3">Failed</p>
                <div className="progress" style={{ height: '15px' }}>
                  <div
                    className="progress-bar bg-danger"
                    role="progressbar"
                    style={{
                      width: `${(selectedTeam.notificationStats.totalFailed /
                        selectedTeam.notificationStats.totalNotifications) *
                        100
                        }%`
                    }}
                  >
                    {(
                      (selectedTeam.notificationStats.totalFailed /
                        selectedTeam.notificationStats.totalNotifications) *
                      100
                    ).toFixed(1)}%
                  </div>
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

export default Dashboard;