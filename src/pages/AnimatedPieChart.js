import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import tinycolor from 'tinycolor2';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import CountUp from 'react-countup';
 
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
 
const AnimatedPieChart = ({ moduleDistribution }) => {
  const [hoveredModule, setHoveredModule] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
 
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
 
  if (!moduleDistribution || !Array.isArray(moduleDistribution)) {
    return (
      <motion.div
        className="text-center py-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <i className="bi bi-pie-chart text-muted" style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>
        <p className="text-muted mt-3">No module data available</p>
      </motion.div>
    );
  }
 
  const filteredData = moduleDistribution.filter(
    module => module && module.name && !module.name.toLowerCase().includes("notification")
  );
 
  const totalActivities = filteredData.reduce((sum, item) => sum + (item?.value || 0), 0);
 
  return (
    <motion.div
      className="card border-0 shadow-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isMounted ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
      style={{
        background: 'linear-gradient(to bottom right, #f8f9fa 0%, #ffffff 50%)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}
    >
      <div className="card-body p-2">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <motion.div
            initial={{ x: -20 }}
            animate={isMounted ? { x: 0 } : {}}
            transition={{ delay: 0.2 }}
          >
            <h5 className="card-title mb-1 fw-bold">Module Analytics</h5>
            <p className="text-muted small mb-0">Real-time activity distribution</p>
          </motion.div>
 
          <motion.div
            className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill"
            initial={{ scale: 0 }}
            animate={isMounted ? { scale: 1 } : {}}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <i className="bi bi-lightning-charge-fill me-2"></i>
            <CountUp end={totalActivities} duration={1.5} separator="," /> Activities
          </motion.div>
        </div>
 
        <div className="row align-items-center">
          <div className="col-md-6 position-relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isMounted ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.4 }}
            >
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={filteredData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={1}
                    cornerRadius={8}
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                    animationBegin={400}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    onMouseEnter={(_, index) => setHoveredModule(index)}
                    onMouseLeave={() => setHoveredModule(null)}
                  >
                    {filteredData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="#ffffff"
                        strokeWidth={3}
                        style={{
                          filter: hoveredModule === index ?
                            `drop-shadow(0px 0px 8px ${tinycolor(COLORS[index % COLORS.length]).lighten(10).toString()})` : 'none',
                          opacity: hoveredModule === null || hoveredModule === index ? 1 : 0.8,
                          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={{ zIndex: 1050 }}
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.98)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                      padding: '12px 16px',
                      fontSize: '14px',
                      maxWidth: '200px',
                      overflowWrap: 'break-word',
                      whiteSpace: 'normal'
                    }}
                    formatter={(value, name, props) => [
                      <div key="tooltip" className="d-flex align-items-center">
                        <div
                          className="color-indicator me-2"
                          style={{
                            width: '12px', height: '12px', borderRadius: '2px', backgroundColor: props.color
                          }}
                        />
                        <div>
                          <div className="fw-bold">{name}</div>
                          <div className="text-muted small">
                            {value} activities ({((props.payload.percent || 0) * 100).toFixed(1)}%)
                        </div>
                        </div>
                      </div>
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
 
              <motion.div
                className="position-absolute top-50 start-50 translate-middle text-center"
                style={{
                  pointerEvents: 'none',
                  width: '120px',
                  height: '120px',
                  background: 'rgba(253, 251, 251, 0.92)',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  padding: '10px',
                  zIndex: 1,
                  textAlign: 'center'
                }}
                initial={{ scale: 0 }}
                animate={isMounted ? { scale: 1 } : {}}
                transition={{ delay: 0.6 }}
              >
                {hoveredModule !== null && filteredData[hoveredModule] ? (
                  <>
                    <div className="fs-5 fw-bold text-dark">
                      <CountUp end={filteredData[hoveredModule]?.value || 0} duration={1} separator="," />
                    </div>
                    <div className="small text-muted">Activities</div>
                  </>
                ) : (
                  <>
                    <div className="fs-4 fw-bold text-dark">
                      <CountUp end={totalActivities} duration={2} separator="," />
                    </div>
                    <div className="small text-muted">Total Activities</div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
 
          <div className="col-md-6">
            <motion.div
              className="module-legend ps-3 pe-2"
              style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}
              initial={{ opacity: 0, x: 20 }}
              animate={isMounted ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 }}
            >
              {filteredData
                .sort((a, b) => (b?.value || 0) - (a?.value || 0))
                .map((module, index) => {
                  const percentage = ((module?.value || 0) / totalActivities) * 100;
                  return (
                    <motion.div
                      key={index}
                      className="d-flex align-items-center mb-3 p-3 rounded-3"
                      style={{
                        cursor: 'pointer',
                        background: hoveredModule === index ?
                          `rgba(${tinycolor(COLORS[index % COLORS.length]).toRgb().r},
                          ${tinycolor(COLORS[index % COLORS.length]).toRgb().g},
                          ${tinycolor(COLORS[index % COLORS.length]).toRgb().b}, 0.08)` :
                          'rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={() => setHoveredModule(index)}
                      onMouseLeave={() => setHoveredModule(null)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={isMounted ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.1 * index }}
                    >
                      <div
                        className="color-indicator me-3 flex-shrink-0"
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '6px',
                          backgroundColor: COLORS[index % COLORS.length],
                          boxShadow: `0 2px 8px ${tinycolor(COLORS[index % COLORS.length]).setAlpha(0.3).toString()}`,
                        }}
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-semibold">
                            {module?.name || 'Unknown'}
                          </span>
                          <span className="badge rounded-pill">
                            {module?.value || 0}
                          </span>
                        </div>
                        <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                          <motion.div
                            className="progress-bar"
                            initial={{ width: 0 }}
                            animate={isMounted ? { width: `${percentage}%` } : {}}
                            transition={{ delay: 0.2 + (index * 0.05), duration: 1 }}
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
 
export default AnimatedPieChart;