import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import CountUp from 'react-countup';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
  const [moduleStats, setModuleStats] = useState(null);
  const [loadingModuleStats, setLoadingModuleStats] = useState(true);

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

        // Fetch Notification Analytics
        const notifRes = await fetch('https://api.avessecurity.com/api/users/Notification-Status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const notifData = await notifRes.json();

        setNotificationData(
          (notifData.analytics || []).map(team => ({
            ...team,
            notifications: team.notifications || [],
          }))
        );
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await axios.get(`https://api.avessecurity.com/api/users/Count`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setUserStatistics(response.data);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };
    fetchCounts();
  }, [token]);

  useEffect(() => {
    const fetchModuleStats = async () => {
      try {
        const response = await axios.get('https://api.avessecurity.com/api/collection/module-wise-user-monthly', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setModuleStats(response.data);
      } catch (error) {
        console.error('Error fetching module stats:', error);
      } finally {
        setLoadingModuleStats(false);
      }
    };

    if (token) {
      fetchModuleStats();
    }
  }, [token]);

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

  const processModuleStats = () => {
    if (!moduleStats || !moduleStats.data) return null;
    
    const activeModules = moduleStats.data.filter(module => module.stats.length > 0);
    
    const topModules = [...activeModules]
      .sort((a, b) => 
        b.stats.reduce((sum, stat) => sum + stat.count, 0) - 
        a.stats.reduce((sum, stat) => sum + stat.count, 0)
      )
      .slice(0, 5)
      .map(module => ({
        name: module.module,
        count: module.stats.reduce((sum, stat) => sum + stat.count, 0)
      }));

    const moduleDistribution = activeModules.map(module => ({
      name: module.module,
      value: module.stats.reduce((sum, stat) => sum + stat.count, 0)
    }));

    return { topModules, moduleDistribution };
  };

  const { topModules, moduleDistribution } = processModuleStats() || {};

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Dashboard</h2>

      {/* Enhanced User Stats Cards */}
      <div className="row">
        <div className="col-md-4 mb-3">
          <motion.div 
            className="p-4 text-white rounded shadow position-relative overflow-hidden"
            style={{ backgroundColor: '#93AEFF', minHeight: '120px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="position-absolute top-0 end-0 p-2">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="display-5 fw-bold mb-1">
              <CountUp 
                end={userStats.totalUsers} 
                duration={1.5}
                separator=","
              />
            </h3>
            <p className="mb-0 fs-5">Total Users</p>
            <motion.div 
              className="position-absolute bottom-0 start-0 h-2 bg-white"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />
          </motion.div>
        </div>

        <div className="col-md-4 mb-3">
          <motion.div 
            className="p-4 text-white rounded shadow position-relative overflow-hidden"
            style={{ backgroundColor: '#55E49F', minHeight: '120px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="position-absolute top-0 end-0 p-2">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v4l3 3"></path>
              </svg>
            </div>
            <h3 className="display-5 fw-bold mb-1">
              <CountUp 
                end={userStats.onlineUsers.length} 
                duration={1.5}
                separator=","
              />
              <small className="fs-6 ms-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={userStats.onlineUsers.length}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="d-inline-block"
                  >
                    ({((userStats.onlineUsers.length / userStats.totalUsers) * 100 || 0).toFixed(1)}%)
                  </motion.span>
                </AnimatePresence>
              </small>
            </h3>
            <p className="mb-0 fs-5">Online Users</p>
            <motion.div 
              className="position-absolute bottom-0 start-0 h-2 bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${(userStats.onlineUsers.length / userStats.totalUsers) * 100 || 0}%` }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />
          </motion.div>
        </div>

        <div className="col-md-4 mb-3">
          <motion.div 
            className="p-4 text-white rounded shadow position-relative overflow-hidden"
            style={{ backgroundColor: '#FFA1A1', minHeight: '120px' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="position-absolute top-0 end-0 p-2">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </div>
            <h3 className="display-5 fw-bold mb-1">
              <CountUp 
                end={userStats.offlineUsers.length} 
                duration={1.5}
                separator=","
              />
              <small className="fs-6 ms-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={userStats.offlineUsers.length}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="d-inline-block"
                  >
                    ({((userStats.offlineUsers.length / userStats.totalUsers) * 100 || 0).toFixed(1)}%)
                  </motion.span>
                </AnimatePresence>
              </small>
            </h3>
            <p className="mb-0 fs-5">Offline Users</p>
            <motion.div 
              className="position-absolute bottom-0 start-0 h-2 bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${(userStats.offlineUsers.length / userStats.totalUsers) * 100 || 0}%` }}
              transition={{ duration: 1.5, delay: 0.3 }}
            />
          </motion.div>
        </div>
      </div>

      {/* Enhanced Key Metrics Cards */}
      <div className="row">
        {[
          { 
            title: "INCIDENTS", 
            value: `${userStatistics.todayIncidentReport}/${userStatistics.totalIncidentReport}`,
            bgColor: '#F18CA9',
            icon: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z'
          },
          { 
            title: "KEYS", 
            value: `${userStatistics.todayKeyForm}/${userStatistics.totalKeyForm}`,
            bgColor: '#8ACBD2',
            icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
          },
          { 
            title: "GATEPASS", 
            value: `${userStatistics.todayGatePass}/${userStatistics.totalGatePass}`,
            bgColor: '#AB95D8',
            icon: 'M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4'
          },
          { 
            title: "SECURITY PASS", 
            value: `${userStatistics.todaySecurityPass}/${userStatistics.totalSecurityPass}`,
            bgColor: '#C1CFA1',
            icon: 'M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z'
          }
        ].map((metric, index) => (
          <div className="col-md-3 mb-3" key={index}>
            <motion.div
              className="p-4 text-white rounded shadow position-relative overflow-hidden"
              style={{ backgroundColor: metric.bgColor, minHeight: '120px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="position-absolute top-0 end-0 p-2 opacity-25">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d={metric.icon}></path>
                </svg>
              </div>
              <p className="mb-1 fw-bold">{metric.title}</p>
              <motion.h3 
                className="display-6 fw-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 * index }}
              >
                {metric.value}
              </motion.h3>
              <motion.div 
                className="position-absolute bottom-0 start-0 h-1 bg-white"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1, delay: 0.3 * index }}
              />
            </motion.div>
          </div>
        ))}
      </div>

      {/* Module Stats Charts */}
      <div className="row mt-4">
        <div className="col-md-6 mb-4">
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="card-body">
              <h5 className="card-title">Top Active Modules</h5>
              {loadingModuleStats ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : topModules ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topModules}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Activities" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted">No module data available</p>
              )}
            </div>
          </motion.div>
        </div>

        <div className="col-md-6 mb-4">
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="card-body">
              <h5 className="card-title">Module Stats</h5>
              {loadingModuleStats ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : moduleDistribution ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moduleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {moduleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted">No distribution data available</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Notification Stats Section */}
      <motion.div 
        className="mb-3 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
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
                <motion.tr 
                  key={idx} 
                  onClick={() => handleRowClick(team)} 
                  style={{ cursor: 'pointer' }}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                  transition={{ duration: 0.2 }}
                >
                  <td>{team.teamName} Team</td>
                  <td>{team.totalUsers}</td>
                  <td>
                    <div className="progress" style={{ height: '10px' }}>
                      <motion.div
                        className="progress-bar bg-success"
                        role="progressbar"
                        initial={{ width: 0 }}
                        animate={{ width: `${successPercent}%` }}
                        transition={{ duration: 1, delay: 0.1 * idx }}
                      />
                    </div>
                    <small>{successPercent.toFixed(1)}%</small>
                  </td>
                  <td>
                    <div className="progress" style={{ height: '10px' }}>
                      <motion.div
                        className="progress-bar bg-danger"
                        role="progressbar"
                        initial={{ width: 0 }}
                        animate={{ width: `${failedPercent}%` }}
                        transition={{ duration: 1, delay: 0.1 * idx }}
                      />
                    </div>
                    <small>{failedPercent.toFixed(1)}%</small>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
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
                      <motion.li 
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {user.name}
                      </motion.li>
                    ))
                  ) : (
                    <li>No users found</li>
                  )}
                </ul>

                <div className="mt-3">
                  <p className="mb-1">Success</p>
                  <div className="progress" style={{ height: '15px' }}>
                    <motion.div
                      className="progress-bar bg-success"
                      role="progressbar"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(selectedTeam.notificationStats.totalSuccess /
                          selectedTeam.notificationStats.totalNotifications) *
                          100
                          }%`
                      }}
                      transition={{ duration: 1 }}
                    >
                      {(
                        (selectedTeam.notificationStats.totalSuccess /
                          selectedTeam.notificationStats.totalNotifications) *
                        100
                      ).toFixed(1)}%
                    </motion.div>
                  </div>

                  <p className="mb-1 mt-3">Failed</p>
                  <div className="progress" style={{ height: '15px' }}>
                    <motion.div
                      className="progress-bar bg-danger"
                      role="progressbar"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(selectedTeam.notificationStats.totalFailed /
                          selectedTeam.notificationStats.totalNotifications) *
                          100
                          }%`
                      }}
                      transition={{ duration: 1, delay: 0.2 }}
                    >
                      {(
                        (selectedTeam.notificationStats.totalFailed /
                          selectedTeam.notificationStats.totalNotifications) *
                        100
                      ).toFixed(1)}%
                    </motion.div>
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
        </motion.div>
      </Modal>

      <Tooltip id="tooltip" />
    </div>
  );
}

export default Dashboard;