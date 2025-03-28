import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', users: 400, messages: 240 },
  { name: 'Feb', users: 300, messages: 139 },
  { name: 'Mar', users: 200, messages: 980 },
  { name: 'Apr', users: 278, messages: 390 },
  { name: 'May', users: 189, messages: 480 },
];

function Dashboard() {
  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>

      <div className="row">
        <div className="col-md-6">
          <div className="dashboard-stats">
            <h3>1,234</h3>
            <p className="text-muted">Total Users</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="dashboard-stats">
            <h3>56</h3>
            <p className="text-muted">Total Teams</p>
          </div>
        </div>
        {/* <div className="col-md-3">
          <div className="dashboard-stats">
            <h3>89%</h3>
            <p className="text-muted">System Uptime</p>
          </div>
        </div>
        <div className="col-md-3">
          <div className="dashboard-stats">
            <h3>12</h3>
            <p className="text-muted">Pending Tasks</p>
          </div>
        </div> */}
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
              <h5 className="card-title">Recent Activities</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">New user registered</li>
                <li className="list-group-item">Team created: Marketing</li>
                <li className="list-group-item">System update completed</li>
                <li className="list-group-item">New integration added</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;