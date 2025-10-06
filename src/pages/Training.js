import React, { useState, useEffect } from 'react';
import {
  Tabs, Tab, Spinner, Container, Button, Form, Row, Col,
  Badge, Table, Alert, Offcanvas
} from 'react-bootstrap';
import { PencilSquare, Trash, PlusLg, Calendar, Person, ChevronDown, ChevronRight, X } from 'react-bootstrap-icons';

function Training() {
  const [isLoading, setIsLoading] = useState(false);
  const [trainingList, setTrainingList] = useState([]);
  const [activeTab, setActiveTab] = useState('training');
  const [offcanvasData, setOffcanvasData] = useState({ show: false, type: '', parentId: '', item: null });
  const [formValue, setFormValue] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [error, setError] = useState(null);
  const token = localStorage.getItem('access_token');

  const apiUrl = 'https://codeaves.avessecurity.com/api/Training';

  const fetchTraining = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${apiUrl}/get/training`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      if (data.trainingall) setTrainingList(data.trainingall);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTraining(); }, []);

  const handleOpenOffcanvas = (type, parentId = '', item = null) => {
    setOffcanvasData({ show: true, type, parentId, item });
    setFormValue(item?.[`Add${type}`] || '');
  };

  const handleCloseOffcanvas = () => {
    setOffcanvasData({ show: false, type: '', parentId: '', item: null });
    setFormValue('');
  };

  const handleSubmit = async () => {
    const { type, parentId, item } = offcanvasData; // Changed from modalData to offcanvasData
    const body = {};
    body[`Add${type}`] = formValue;

    let endpoint = '';
    let method = 'POST';

    try {
      if (item) {
        method = 'PUT';
        // Set correct nested path for updates
        if (type === 'training') {
          endpoint = `/update/training/${item._id}`;
        } else if (type === 'module') {
          const training = trainingList.find(t => t.modules?.some(m => m._id === item._id));
          if (!training) throw new Error("Parent training not found");
          endpoint = `/update/training/${training._id}/module/${item._id}`;
        } else if (type === 'class') {
          const training = trainingList.find(t =>
            t.modules?.some(m => m.classes?.some(c => c._id === item._id))
          );
          const module = training?.modules.find(m => m.classes?.some(c => c._id === item._id));
          if (!training || !module) throw new Error("Parent training/module not found");
          endpoint = `/update/training/${training._id}/module/${module._id}/class/${item._id}`;
        } else if (type === 'course') {
          const training = trainingList.find(t =>
            t.modules?.some(m =>
              m.classes?.some(c =>
                c.courses?.some(course => course._id === item._id)
              )
            )
          );
          const module = training?.modules.find(m =>
            m.classes?.some(c =>
              c.courses?.some(course => course._id === item._id)
            )
          );
          const cls = module?.classes.find(c =>
            c.courses?.some(course => course._id === item._id)
          );
          if (!training || !module || !cls) throw new Error("Parent hierarchy not found");
          endpoint = `/update/training/${training._id}/module/${module._id}/class/${cls._id}/courses/${item._id}`;
        }
      } else {
        // CREATE logic
        if (type === 'training') {
          endpoint = '/create/training';
        } else if (type === 'module') {
          if (!parentId) throw new Error("Parent training ID is required for module creation");
          endpoint = `/create/training/${parentId}/module`;
        } else if (type === 'class') {
          // For class creation, we need to find the module first
          const training = trainingList.find(t => t.modules?.some(m => m._id === parentId));
          if (!training) throw new Error("Parent training not found");
          const module = training.modules.find(m => m._id === parentId);
          if (!module) throw new Error("Parent module not found");
          endpoint = `/create/training/${training._id}/module/${parentId}/class`;
        } else if (type === 'course') {
          // For course creation, we need to find the class and its parents
          let foundTraining = null;
          let foundModule = null;
          
          // Search through the hierarchy to find where this class exists
          for (const training of trainingList) {
            for (const module of training.modules || []) {
              for (const cls of module.classes || []) {
                if (cls._id === parentId) {
                  foundTraining = training;
                  foundModule = module;
                  break;
                }
              }
              if (foundTraining) break;
            }
            if (foundTraining) break;
          }
          
          if (!foundTraining || !foundModule) {
            throw new Error("Parent class not found in any training/module");
          }
          
          endpoint = `/create/training/${foundTraining._id}/module/${foundModule._id}/class/${parentId}/courses`;
        }
      }

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save');
      }

      fetchTraining();
      handleCloseOffcanvas(); // Changed from handleCloseModal to handleCloseOffcanvas
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      let endpoint = '';
      
      if (type === 'training') {
        endpoint = `/delete/training/${id}`;
      } else if (type === 'module') {
        const training = trainingList.find(t => t.modules?.some(m => m._id === id));
        if (!training) throw new Error("Parent training not found");
        endpoint = `/delete/training/${training._id}/module/${id}`;
      } else if (type === 'class') {
        const training = trainingList.find(t =>
          t.modules?.some(m => m.classes?.some(c => c._id === id))
        );
        const module = training?.modules.find(m => m.classes?.some(c => c._id === id));
        if (!training || !module) throw new Error("Parent training/module not found");
        endpoint = `/delete/training/${training._id}/module/${module._id}/class/${id}`;
      } else if (type === 'course') {
        const training = trainingList.find(t =>
          t.modules?.some(m =>
            m.classes?.some(c =>
              c.courses?.some(course => course._id === id)
            )
          )
        );
        const module = training?.modules.find(m =>
          m.classes?.some(c =>
            c.courses?.some(course => course._id === id)
          )
        );
        const cls = module?.classes.find(c =>
          c.courses?.some(course => course._id === id)
        );
        if (!training || !module || !cls) throw new Error("Parent hierarchy not found");
        endpoint = `/delete/training/${training._id}/module/${module._id}/class/${cls._id}/courses/${id}`;
      }

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Delete failed');
      }

      fetchTraining();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const toggleExpand = (type, id) => {
    setExpandedItems(prev => ({
      ...prev,
      [`${type}-${id}`]: !prev[`${type}-${id}`]
    }));
  };

  const isExpanded = (type, id) => expandedItems[`${type}-${id}`];

  return (
    <Container className="mt-4">
      <div className="border rounded shadow-sm p-3 mb-4 bg-white">
        <h2 className="mb-3 text-primary">Training Management</h2>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading training data...</p>
          </div>
        ) : (
          <>
            <Tabs 
              activeKey={activeTab} 
              onSelect={(k) => setActiveTab(k)} 
              className="mb-3"
              fill
            >
              <Tab eventKey="training" title="Trainings">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4></h4>
                  <Button 
                    variant="primary" 
                    onClick={() => handleOpenOffcanvas('training')}
                    className="d-flex align-items-center"
                  >
                    Add Training
                  </Button>
                </div>
                
                <Table striped responsive>
                  <thead className="">
                    <tr>
                      <th>Training Name</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center">No training programs found</td>
                      </tr>
                    ) : (
                      trainingList.map((training) => (
                        <tr key={training._id}>
                          <td>
                            <div 
                              className="d-flex align-items-center cursor-pointer" 
                              onClick={() => toggleExpand('training', training._id)}
                            >
                              {training.Addtraining}
                            </div>
                          </td>
                          <td className="text-end">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleOpenOffcanvas('training', '', training)}
                              className="me-2"
                            >
                              <PencilSquare size={14} className="me-1" /> Edit
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete('training', training._id)}
                              className="me-2"
                            >
                              <Trash size={14} className="me-1" /> Delete
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={() => handleOpenOffcanvas('module', training._id)}
                            >
                              Module
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Tab>

              <Tab eventKey="module" title="Modules">
                <h4 className="mb-3"></h4>
                <Table striped responsive>
                  <thead className="">
                    <tr>
                      <th>Training Program</th>
                      <th>Module Name</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingList.flatMap(training => 
                      training.modules?.map(module => (
                        <tr key={module._id}>
                          <td>{training.Addtraining}</td>
                          <td>
                            <div>
                              {module.Addmodule}
                            </div>
                          </td>
                          <td className="text-end">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleOpenOffcanvas('module', '', module)}
                              className="me-2"
                            >
                              <PencilSquare size={14} className="me-1" /> Edit
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete('module', module._id)}
                              className="me-2"
                            >
                              <Trash size={14} className="me-1" /> Delete
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={() => handleOpenOffcanvas('class', module._id)}
                            >
                              Class
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Tab>

              <Tab eventKey="class" title="Classes">
                <h4 className="mb-3"></h4>
                <Table striped responsive>
                  <thead className="">
                    <tr>     
                      <th>Training Program</th>
                      <th>Module</th>
                      <th>Class Name</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingList.flatMap(training => 
                      training.modules?.flatMap(module => 
                        module.classes?.map(cls => (
                          <tr key={cls._id}>
                            <td>{training.Addtraining}</td>
                            <td>{module.Addmodule}</td>
                            <td>
                              <div 
                                className="d-flex align-items-center cursor-pointer" 
                                onClick={() => toggleExpand('class', cls._id)}
                              >
                                {cls.Addclass}
                              </div>
                            </td>
                            <td className="text-end">
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                onClick={() => handleOpenOffcanvas('class', '', cls)}
                                className="me-2"
                              >
                                <PencilSquare size={14} className="me-1" /> Edit
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => handleDelete('class', cls._id)}
                                className="me-2"
                              >
                                <Trash size={14} className="me-1" /> Delete
                              </Button>
                              <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={() => handleOpenOffcanvas('course', cls._id)}
                              > 
                                Course
                              </Button>
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </Table>
              </Tab>

              <Tab eventKey="course" title="Courses">
                <h4 className="mb-3"></h4>
                <Table striped responsive>
                  <thead className="">
                    <tr>
                      <th>Training Program</th>
                      <th>Module</th>
                      <th>Class</th>
                      <th>Course Name</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingList.flatMap(training => 
                      training.modules?.flatMap(module => 
                        module.classes?.flatMap(cls => 
                          cls.courses?.map(course => (
                            <tr key={course._id}>
                              <td>{training.Addtraining}</td>
                              <td>{module.Addmodule}</td>
                              <td>{cls.Addclass}</td>
                              <td>
                                <div 
                                  className="d-flex align-items-center cursor-pointer" 
                                  onClick={() => toggleExpand('course', course._id)}
                                >
                                  {course.Addcourse}
                                </div>
                              </td>
                              <td className="text-end">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  onClick={() => handleOpenOffcanvas('course', '', course)}
                                  className="me-2"
                                >
                                  <PencilSquare size={14} className="me-1" /> Edit
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={() => handleDelete('course', course._id)}
                                >
                                  <Trash size={14} className="me-1" /> Delete
                                </Button>
                              </td>
                            </tr>
                          ))
                        )
                      )
                    )}
                  </tbody>
                </Table>
              </Tab>
            </Tabs>

            {/* Offcanvas for Add/Edit */}
            <Offcanvas 
              show={offcanvasData.show} 
              onHide={handleCloseOffcanvas} 
              placement="end"
              className="w-50"
            >
              <Offcanvas.Header className={offcanvasData.item }>
                <Offcanvas.Title>
                  {offcanvasData.item ? 'Edit' : 'Add'} 
                </Offcanvas.Title>
                <Button 
                  variant={offcanvasData.item ? 'outline-dark' : 'outline-light'} 
                  onClick={handleCloseOffcanvas}
                  className="ms-auto"
                >
                  <X size={20} />
                </Button>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <strong> Name</strong>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder='Enter name'
                    autoFocus
                  />
                </Form.Group>
              </Offcanvas.Body>
              <div className="p-3 border-top">
                <div className="d-flex justify-content-end gap-2">
                  <Button variant="secondary" onClick={handleCloseOffcanvas}>Cancel</Button>
                  <Button variant={offcanvasData.item ? 'warning' : 'primary'} onClick={handleSubmit}>
                    {offcanvasData.item ? 'Update' : 'Save'}
                  </Button>
                </div>
              </div>
            </Offcanvas>
          </>
        )}
      </div>
    </Container>
  );
}

export default Training;