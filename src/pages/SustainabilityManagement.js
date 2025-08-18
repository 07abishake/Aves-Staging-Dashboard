import React, { useState, useEffect } from 'react';
import {
  Tabs, Tab, Spinner, Container, Button, Form,
  Table, Alert, Offcanvas, Badge
} from 'react-bootstrap';
import { PencilSquare, Trash, PlusLg, Eye, ChevronDown, ChevronRight, X } from 'react-bootstrap-icons';
import axios from 'axios';

const SustainabilityBuilder = () => {
  // State for data
  const [isLoading, setIsLoading] = useState(false);
  const [sustainabilityData, setSustainabilityData] = useState([]);
  const [activeTab, setActiveTab] = useState('country');
  
  // State for Offcanvas (form)
  const [offcanvasData, setOffcanvasData] = useState({ 
    show: false, 
    type: '', 
    parentId: '', 
    item: null 
  });
  
  // State for form values
  const [formValue, setFormValue] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [error, setError] = useState(null);
  
  // State for IDs
  const [ids, setIds] = useState({
    countryId: '',
    hotelId: '',
    moduleId: '',
    subModuleId: '',
    classId: ''
  });

  const token = localStorage.getItem('access_token');
  const BASE_API = "https://api.avessecurity.com/api/sustainabiity";

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // Fetch all sustainability data
  const fetchSustainabilityData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.get(`${BASE_API}/get`, config);
      setSustainabilityData(res.data.SustainAbility || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch sustainability data');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle open/close offcanvas
  const handleOpenOffcanvas = (type, parentId = '', item = null) => {
    setOffcanvasData({ show: true, type, parentId, item });
    
    // Set form value based on item being edited
    if (item) {
      const value = item[`Add${type.charAt(0).toUpperCase() + type.slice(1)}`] || 
                   item[`${type.charAt(0).toUpperCase() + type.slice(1)}Name`] || 
                   item.Country || '';
      setFormValue(value);
    } else {
      setFormValue('');
    }
  };

  const handleCloseOffcanvas = () => {
    setOffcanvasData({ show: false, type: '', parentId: '', item: null });
    setFormValue('');
  };

  const fieldMap = {
  country: 'Country',
  hotel: 'HotelName',
  module: 'AddModule',
  subModule: 'AddSubModule',
  class: 'Addclass',
  input: 'AddInput'
};
  // Handle create/update
  const handleSubmit = async () => {
    const { type, parentId, item } = offcanvasData;
    const body = {};
  const fieldName = fieldMap[type];
    body[fieldName] = formValue;

    try {
      let endpoint = '';
      let method = item ? 'PUT' : 'POST';

      // Determine the endpoint based on hierarchy level
      if (type === 'country') {
        endpoint = item ? `/update/${item._id}` : '/create';
      } else if (type === 'hotel') {
        if (!parentId) throw new Error("Country ID is required for hotel creation");
        endpoint = item 
          ? `/update/${parentId}/Hotel/${item._id}` 
          : `/create/${parentId}/Hotel`;
      } else if (type === 'module') {
        if (!ids.countryId || !parentId) throw new Error("Country and Hotel IDs are required");
        endpoint = item
          ? `/update/${ids.countryId}/Hotel/${parentId}/Module/${item._id}`
          : `/create/${ids.countryId}/Hotel/${parentId}/Module`;
      } else if (type === 'subModule') {
        if (!ids.countryId || !ids.hotelId || !parentId) throw new Error("Country, Hotel and Module IDs are required");
        endpoint = item
          ? `/update/${ids.countryId}/Hotel/${ids.hotelId}/Module/${parentId}/SubModule/${item._id}`
          : `/create/${ids.countryId}/Hotel/${ids.hotelId}/Module/${parentId}/SubModule`;
      } else if (type === 'class') {
        if (!ids.countryId || !ids.hotelId || !ids.moduleId || !parentId) throw new Error("All parent IDs are required");
        endpoint = item
          ? `/update/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${parentId}/Class/${item._id}`
          : `/create/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${parentId}/Class`;
      } else if (type === 'input') {
        if (!ids.countryId || !ids.hotelId || !ids.moduleId || !ids.subModuleId || !parentId) {
          throw new Error("All parent IDs are required");
        }
        endpoint = item
          ? `/update/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${ids.subModuleId}/Class/${parentId}/Input/${item._id}`
          : `/create/${ids.countryId}/Hotel/${ids.hotelId}/Module/${ids.moduleId}/SubModule/${ids.subModuleId}/Class/${parentId}/Input`;
      }

      const res = await axios({
        method,
        url: `${BASE_API}${endpoint}`,
        data: body,
        headers: config.headers
      });

      fetchSustainabilityData();
      handleCloseOffcanvas();
    } catch (err) {
      console.error('Error saving:', err);
      setError(err.message || `Failed to save ${type}`);
    }
  };

  // Handle delete
 const handleDelete = async (type, id) => {
  if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

  try {
    let endpoint = '';

    if (type === 'country') {
      endpoint = `/delete/${id}`;
    } else if (type === 'hotel') {
      const country = sustainabilityData.find(c =>
        c.Hotel?.some(h => h._id === id)
      );
      if (!country) throw new Error("Parent country not found");
      endpoint = `/delete/${country._id}/Hotel/${id}`;
    } else if (type === 'module') {
      const country = sustainabilityData.find(c =>
        c.Hotel?.some(h => h.Module?.some(m => m._id === id))
      );
      const hotel = country?.Hotel.find(h =>
        h.Module?.some(m => m._id === id)
      );
      if (!country || !hotel) throw new Error("Parent country/hotel not found");
      const module = hotel.Module.find(m => m._id === id);
      endpoint = `/delete/${country._id}/Hotel/${hotel._id}/Module/${module._id}`;
    } else if (type === 'subModule') {
      const country = sustainabilityData.find(c =>
        c.Hotel?.some(h =>
          h.Module?.some(m =>
            m.SubModule?.some(sm => sm._id === id)
          )
        )
      );
      const hotel = country?.Hotel.find(h =>
        h.Module?.some(m =>
          m.SubModule?.some(sm => sm._id === id)
        )
      );
      const module = hotel?.Module.find(m =>
        m.SubModule?.some(sm => sm._id === id)
      );
      const subModule = module?.SubModule.find(sm => sm._id === id);
      if (!country || !hotel || !module || !subModule) throw new Error("Parent hierarchy not found");
      endpoint = `/delete/${country._id}/Hotel/${hotel._id}/Module/${module._id}/SubModule/${subModule._id}`;
    } else if (type === 'class') {
      const country = sustainabilityData.find(c =>
        c.Hotel?.some(h =>
          h.Module?.some(m =>
            m.SubModule?.some(sm =>
              sm.Class?.some(cls => cls._id === id)
            )
          )
        )
      );
      const hotel = country?.Hotel.find(h =>
        h.Module?.some(m =>
          m.SubModule?.some(sm =>
            sm.Class?.some(cls => cls._id === id)
          )
        )
      );
      const module = hotel?.Module.find(m =>
        m.SubModule?.some(sm =>
          sm.Class?.some(cls => cls._id === id)
        )
      );
      const subModule = module?.SubModule.find(sm =>
        sm.Class?.some(cls => cls._id === id)
      );
      const cls = subModule?.Class.find(c => c._id === id);
      if (!country || !hotel || !module || !subModule || !cls) throw new Error("Parent hierarchy not found");
      endpoint = `/delete/${country._id}/Hotel/${hotel._id}/Module/${module._id}/SubModule/${subModule._id}/Class/${cls._id}`;
    } else if (type === 'input') {
      const country = sustainabilityData.find(c =>
        c.Hotel?.some(h =>
          h.Module?.some(m =>
            m.SubModule?.some(sm =>
              sm.Class?.some(cls =>
                cls.Input?.some(input => input._id === id)
              )
            )
          )
        )
      );
      const hotel = country?.Hotel.find(h =>
        h.Module?.some(m =>
          m.SubModule?.some(sm =>
            sm.Class?.some(cls =>
              cls.Input?.some(input => input._id === id)
            )
          )
        )
      );
      const module = hotel?.Module.find(m =>
        m.SubModule?.some(sm =>
          sm.Class?.some(cls =>
            cls.Input?.some(input => input._id === id)
          )
        )
      );
      const subModule = module?.SubModule.find(sm =>
        sm.Class?.some(cls =>
          cls.Input?.some(input => input._id === id)
        )
      );
      const cls = subModule?.Class.find(c =>
        c.Input?.some(input => input._id === id)
      );
      const input = cls?.Input.find(i => i._id === id);
      if (!country || !hotel || !module || !subModule || !cls || !input) throw new Error("Parent hierarchy not found");
      endpoint = `/delete/${country._id}/Hotel/${hotel._id}/Module/${module._id}/SubModule/${subModule._id}/Class/${cls._id}/Input/${id}`;
    }

    await axios.delete(`${BASE_API}${endpoint}`, config);
    fetchSustainabilityData();
  } catch (err) {
    console.error('Delete error:', err);
    setError(err.message || `Failed to delete ${type}`);
  }
};

  // Toggle expand/collapse
const toggleExpand = (type, id) => {
  setExpandedItems(prev => ({
    ...prev,
    [`${type}-${id}`]: !prev[`${type}-${id}`]
  }));
};


  const isExpanded = (type, id) => expandedItems[`${type}-${id}`];

  // Count items for statistics
  const countItems = (data, ...properties) => {
    return data?.reduce((acc, item) => {
      let current = item;
      for (const prop of properties) {
        current = current?.[prop];
        if (!current) break;
      }
      return acc + (Array.isArray(current) ? current.length : 0);
    }, 0) || 0;
  };

  // Statistics
  const stats = {
    countries: sustainabilityData.length,
    hotels: countItems(sustainabilityData, 'Hotel'),
    modules: countItems(sustainabilityData, 'Hotel', 'Module'),
    subModules: countItems(sustainabilityData, 'Hotel', 'Module', 'SubModule'),
    classes: countItems(sustainabilityData, 'Hotel', 'Module', 'SubModule', 'Class'),
    inputs: countItems(sustainabilityData, 'Hotel', 'Module', 'SubModule', 'Class', 'Input')
  };

  // Render item name with proper field
  const getItemName = (item, type) => {
    return item[`Add${type.charAt(0).toUpperCase() + type.slice(1)}`] || 
           item[`${type.charAt(0).toUpperCase() + type.slice(1)}Name`] || 
           item.Country || '';
  };

  useEffect(() => {
    fetchSustainabilityData();
  }, []);

  return (
    <Container className="mt-4">
      <div className="border rounded shadow-sm p-3 mb-4 bg-white">
        <h2 className="mb-3 text-primary">Sustainability Management</h2>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading sustainability data...</p>
          </div>
        ) : (
          <>
            <Tabs 
              activeKey={activeTab} 
              onSelect={(k) => setActiveTab(k)} 
              className="mb-3"
              fill
            >
              <Tab eventKey="country" title="Location">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4></h4>
                  <Button 
                    variant="primary" 
                    onClick={() => handleOpenOffcanvas('country')}
                    className="d-flex align-items-center"
                  >
               Location
                  </Button>
                </div>
                
                <Table striped responsive>
                  <thead>
                    <tr>
                      <th>Location Name</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sustainabilityData.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center">No Location found</td>
                      </tr>
                    ) : (
                      sustainabilityData.map((country) => (
                        <tr key={country._id}>
                          <td>
                            <div 
                              className="d-flex align-items-center cursor-pointer" 
                              onClick={() => toggleExpand('country', country._id)}
                            >
                              {getItemName(country, 'country')}
                            </div>
                          </td>
                          <td className="text-end">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleOpenOffcanvas('country', '', country)}
                              className="me-2"
                            >
                              <PencilSquare size={14} className="me-1" /> Edit
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete('country', country._id)}
                              className="me-2"
                            >
                              <Trash size={14} className="me-1" /> Delete
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={() => handleOpenOffcanvas('hotel', country._id)}
                            >
                            Property
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Tab>

              <Tab eventKey="hotel" title="Property">
                <h4 className="mb-3"></h4>
                <Table striped responsive>
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Property Name</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sustainabilityData.flatMap(country => 
                      country.Hotel?.map(hotel => (
                        <tr key={hotel._id}>
                          <td>{getItemName(country, 'country')}</td>
                          <td>
                            <div>
                              {getItemName(hotel, 'hotel')}
                            </div>
                          </td>
                          <td className="text-end">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleOpenOffcanvas('hotel', country._id, hotel)}
                              className="me-2"
                            >
                              <PencilSquare size={14} className="me-1" /> Edit
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete('hotel', hotel._id)}
                              className="me-2"
                            >
                              <Trash size={14} className="me-1" /> Delete
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              onClick={() => {
                                setIds(prev => ({ ...prev, countryId: country._id }));
                                handleOpenOffcanvas('module', hotel._id);
                              }}
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
                  <thead>
                    <tr>     
                      <th>Location</th>
                      <th>Property</th>
                      <th>Module Name</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sustainabilityData.flatMap(country => 
                      country.Hotel?.flatMap(hotel => 
                        hotel.Module?.map(module => (
                          <tr key={module._id}>
                            <td>{getItemName(country, 'country')}</td>
                            <td>{getItemName(hotel, 'hotel')}</td>
                            <td>
                              <div 
                                className="d-flex align-items-center cursor-pointer" 
                                onClick={() => toggleExpand('module', module._id)}
                              >
                                {getItemName(module, 'module')}
                        
                              </div>
                            </td>
                            <td className="text-end">
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                onClick={() => {
                                  setIds(prev => ({ ...prev, countryId: country._id, hotelId: hotel._id }));
                                  handleOpenOffcanvas('module', hotel._id, module);
                                }}
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
                                onClick={() => {
                                  setIds(prev => ({ 
                                    ...prev, 
                                    countryId: country._id, 
                                    hotelId: hotel._id 
                                  }));
                                  handleOpenOffcanvas('subModule', module._id);
                                }}
                              > 
                              SubModule
                              </Button>
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </Table>
              </Tab>

              <Tab eventKey="subModule" title="SubModules">
                <h4 className="mb-3"></h4>
                <Table striped responsive>
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Property</th>
                      <th>Module</th>
                      <th>SubModule Name</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sustainabilityData.flatMap(country => 
                      country.Hotel?.flatMap(hotel => 
                        hotel.Module?.flatMap(module => 
                          module.SubModule?.map(subModule => (
                            <tr key={subModule._id}>
                              <td>{getItemName(country, 'country')}</td>
                              <td>{getItemName(hotel, 'hotel')}</td>
                              <td>{getItemName(module, 'module')}</td>
                              <td>
                                <div 
                                  className="d-flex align-items-center cursor-pointer" 
                                  onClick={() => toggleExpand('subModule', subModule._id)}
                                >
                                  {getItemName(subModule, 'subModule')}
                                 
                                </div>
                              </td>
                              <td className="text-end">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  onClick={() => {
                                    setIds(prev => ({ 
                                      ...prev, 
                                      countryId: country._id, 
                                      hotelId: hotel._id,
                                      moduleId: module._id
                                    }));
                                    handleOpenOffcanvas('subModule', module._id, subModule);
                                  }}
                                  className="me-2"
                                >
                                  <PencilSquare size={14} className="me-1" /> Edit
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={() => handleDelete('subModule', subModule._id)}
                                  className="me-2"
                                >
                                  <Trash size={14} className="me-1" /> Delete
                                </Button>
                                <Button 
                                  variant="primary" 
                                  size="sm" 
                                  onClick={() => {
                                    setIds(prev => ({ 
                                      ...prev, 
                                      countryId: country._id, 
                                      hotelId: hotel._id,
                                      moduleId: module._id
                                    }));
                                    handleOpenOffcanvas('class', subModule._id);
                                  }}
                                >
                                 Class
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
{/*Class Tab*/}
              {/* <Tab eventKey="class" title="Classes">
                <h4 className="mb-3"></h4>
                <Table striped responsive>
                  <thead>
                    <tr>
                      <th>Country</th>
                      <th>Hotel</th>
                      <th>Module</th>
                      <th>SubModule</th>
                      <th>Class Name</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sustainabilityData.flatMap(country => 
                      country.Hotel?.flatMap(hotel => 
                        hotel.Module?.flatMap(module => 
                          module.SubModule?.flatMap(subModule => 
                            subModule.Class?.map(cls => (
                              <tr key={cls._id}>
                                <td>{getItemName(country, 'country')}</td>
                                <td>{getItemName(hotel, 'hotel')}</td>
                                <td>{getItemName(module, 'module')}</td>
                                <td>{getItemName(subModule, 'subModule')}</td>
                                <td>
                                  <div 
                                    className="d-flex align-items-center cursor-pointer" 
                                    onClick={() => toggleExpand('class', cls._id)}
                                  >
                                    {getItemName(cls, 'class')}
                                   
                                  </div>
                                </td>
                                <td className="text-end">
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm" 
                                    onClick={() => {
                                      setIds(prev => ({ 
                                        ...prev, 
                                        countryId: country._id, 
                                        hotelId: hotel._id,
                                        moduleId: module._id,
                                        subModuleId: subModule._id
                                      }));
                                      handleOpenOffcanvas('class', subModule._id, cls);
                                    }}
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
                                    onClick={() => {
                                      setIds(prev => ({ 
                                        ...prev, 
                                        countryId: country._id, 
                                        hotelId: hotel._id,
                                        moduleId: module._id,
                                        subModuleId: subModule._id
                                      }));
                                      handleOpenOffcanvas('input', cls._id);
                                    }}
                                  >
                                Input
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )
                        )
                      )
                    )}
                  </tbody>
                </Table>
              </Tab> */}
              <Tab eventKey="class" title="Classes">
  <h4 className="mb-3"></h4>
  <Table striped responsive>
    <thead>
      <tr>
        <th>Location</th>
        <th>Property</th>
        <th>Module</th>
        <th>SubModule</th>
        <th>Class Name</th>
        <th className="text-end">Actions</th>
      </tr>
    </thead>
    <tbody>
      {sustainabilityData.flatMap(country =>
        country.Hotel?.flatMap(hotel =>
          hotel.Module?.flatMap(module =>
            module.SubModule?.flatMap(subModule =>
              (subModule.Class || []).map(cls => (
                <tr key={cls._id}>
                  <td>{getItemName(country, 'country')}</td>
                  <td>{getItemName(hotel, 'hotel')}</td>
                  <td>{getItemName(module, 'module')}</td>
                  <td>{getItemName(subModule, 'subModule')}</td>
                  <td>{cls.Addclass}</td>
                  <td>
                    <div
                      className="d-flex align-items-center cursor-pointer"
                      onClick={() => toggleExpand('class', cls._id)}
                    >
                      {getItemName(cls, 'class')}
                    </div>
                  </td>
                  <td className="text-end">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => {
                        setIds(prev => ({
                          ...prev,
                          countryId: country._id,
                          hotelId: hotel._id,
                          moduleId: module._id,
                          subModuleId: subModule._id
                        }));
                        handleOpenOffcanvas('class', subModule._id, cls);
                      }}
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
                      onClick={() => {
                        setIds(prev => ({
                          ...prev,
                          countryId: country._id,
                          hotelId: hotel._id,
                          moduleId: module._id,
                          subModuleId: subModule._id
                        }));
                        handleOpenOffcanvas('input', cls._id);
                      }}
                    >
                      Input
                    </Button>
                  </td>
                </tr>
              ))
            )
          )
        )
      )}
    </tbody>
  </Table>
</Tab>


              <Tab eventKey="input" title="Inputs">
                <h4 className="mb-3"></h4>
                <Table striped responsive>
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Property</th>
                      <th>Module</th>
                      <th>SubModule</th>
                      <th>Class</th>
                      <th>Input Name</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sustainabilityData.flatMap(country => 
                      country.Hotel?.flatMap(hotel => 
                        hotel.Module?.flatMap(module => 
                          module.SubModule?.flatMap(subModule => 
                            subModule.Class?.flatMap(cls => 
                              cls.Input?.map(input => (
                                <tr key={input._id}>
                                  <td>{getItemName(country, 'country')}</td>
                                  <td>{getItemName(hotel, 'hotel')}</td>
                                  <td>{getItemName(module, 'module')}</td>
                                  <td>{getItemName(subModule, 'subModule')}</td>
                                  <td>{cls.Addclass}</td>
                                  <td>
                                    <div>
                                      {getItemName(input, 'input')}
                                    </div>
                                  </td>
                                  <td className="text-end">
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm" 
                                      onClick={() => {
                                        setIds(prev => ({ 
                                          ...prev, 
                                          countryId: country._id, 
                                          hotelId: hotel._id,
                                          moduleId: module._id,
                                          subModuleId: subModule._id,
                                          classId: cls._id
                                        }));
                                        handleOpenOffcanvas('input', cls._id, input);
                                      }}
                                      className="me-2"
                                    >
                                      <PencilSquare size={14} className="me-1" /> Edit
                                    </Button>
                                    <Button 
                                      variant="outline-danger" 
                                      size="sm" 
                                      onClick={() => handleDelete('input', input._id)}
                                    >
                                      <Trash size={14} className="me-1" /> Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )
                          )
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
                  {offcanvasData.item ? 'Edit' : 'Add'} {offcanvasData.type.charAt(0).toUpperCase() + offcanvasData.type.slice(1)}
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
                    <strong>{offcanvasData.type} Name</strong>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder={`Enter ${offcanvasData.type} name`}
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
};

export default SustainabilityBuilder;