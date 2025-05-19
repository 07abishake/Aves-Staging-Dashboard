import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'Jan', users: 400, messages: 240 },
  { name: 'Feb', users: 300, messages: 139 },
  { name: 'Mar', users: 200, messages: 980 },
  { name: 'Apr', users: 278, messages: 390 },
  { name: 'May', users: 189, messages: 480 },
];

function Dashboard() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    window.location.href = "/login";
  }

  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    onlineUsers: [],
    offlineUsers: [],
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('http://localhost:6378/api/users/Status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();

        setUserStats({
          totalUsers: result.totalUsers || 0,
          onlineUsers: result.onlineUsers || [],
          offlineUsers: result.offlineUsers || [],
        });
      } catch (err) {
        console.error('Failed to fetch user status:', err);
      }
    };

    fetchStatus();
  }, [token]);

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
    <div>
      <h2 className="mb-4">Dashboard</h2>

      <div className="row">
        <div className="col-md-4">
          <div className="dashboard-stats">
            <h3>{userStats.totalUsers}</h3>
            <p className="text-muted">Total Users</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="dashboard-stats">
            <h3>{userStats.onlineUsers.length}</h3>
            <p className="text-muted">Online Users</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="dashboard-stats">
            <h3>{userStats.offlineUsers.length}</h3>
            <p className="text-muted">Offline Users</p>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">User Activity</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" />
                  <Line type="monotone" dataKey="messages" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-md-4">
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
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
