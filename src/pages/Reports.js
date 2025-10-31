import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { Modal, Button, Spinner } from "react-bootstrap";
import debounce from "lodash/debounce";
import { jwtDecode } from "jwt-decode";

function Reports() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [endDate, setEndDate] = useState('');
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);  
  const [LocationId, setLocationId] = useState(null);
  const [Status, setStatus] = useState(null);
  const [Department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [detailHtml, setDetailHtml] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [reportPreviews, setReportPreviews] = useState([]);
  const [showPreviewList, setShowPreviewList] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Dropdown options state
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'Good', label: 'Good' },
    { value: 'Faulty', label: 'Faulty' },
    { value: 'Pending', label: 'Pending' }
  ];

  const token = localStorage.getItem("access_token");
  console.log(token)
  
  useEffect(() => {
    // Decode token to get company domain
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Set company name from domain in token
        if (decodedToken.domain) {
          setCompanyName(decodedToken.domain);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        setCompanyName('Security System');
      }
    } else {
      // window.location.href = "/login";
    }
    
    // Fetch initial data
    fetchModules();
    fetchDepartments();
    fetchLocations();
    fetchAllUsers();

    // Add message listener for iframe communication
    const handleMessage = (event) => {
      console.log('Message received from iframe:', event.data);
      
      if (event.data && event.data.type === 'RECORD_CLICK') {
        const { recordId, module } = event.data;
        console.log('Record clicked - ID:', recordId, 'Module:', module);
        fetchRecordDetails(recordId, module);
      }
      
      // Handle preview row clicks from the new table
      if (event.data && event.data.type === 'PREVIEW_ROW_CLICK') {
        const { recordId, module } = event.data;
        console.log('Preview row clicked - ID:', recordId, 'Module:', module);
        handlePreviewRowClick(recordId, module);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [token]);

  const fetchModules = async () => {
    try {
      const response = await axios.get(`https://codeaves.avessecurity.com/api/collection/getModule`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (Array.isArray(response.data.dropdown)) {
        const formattedModules = response.data.dropdown.map(item => ({
          value: item.value,
          label: item.label
        }));
        setModules(formattedModules);
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        'https://codeaves.avessecurity.com/api/Department/getAll',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

     const departmentOptions = [];
      response.data.forEach(parent => {
        departmentOptions.push({ 
          value: parent.name,
          label: parent.name,
          id: parent._id
        });

        if (parent.children && parent.children.length > 0) {
          parent.children.forEach(child => {
            departmentOptions.push({
              value: child.name,
              label: child.name,
              id: child._id
            });
          });
        }
      });

      setDepartments(departmentOptions);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await axios.get(
        'https://codeaves.avessecurity.com/api/Location/getLocations',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data && response.data.Location) {
        const locationOptions = [];
        
        // Process each location in the response
        response.data.Location.forEach(location => {
          if (!location.PrimaryLocation) return;
          
          // Add primary location
          locationOptions.push({
            value: location._id,
            label: location.PrimaryLocation
          });

          // Process sublocations
          if (location.SubLocation && location.SubLocation.length > 0) {
            location.SubLocation.forEach(subLoc => {
              // State level (PrimarySubLocation)
              const state = subLoc.PrimarySubLocation;
              if (state) {
                locationOptions.push({
                  value: `${location._id}-${subLoc._id}`,
                  label: `${location.PrimaryLocation}, ${state}`
                });
              }

              // Process cities (SecondaryLocation)
              if (subLoc.SecondaryLocation && subLoc.SecondaryLocation.length > 0) {
                subLoc.SecondaryLocation.forEach(city => {
                  const cityName = city.SecondaryLocation;
                  if (cityName) {
                    locationOptions.push({
                      value: `${location._id}-${subLoc._id}-${city._id}`,
                      label: `${location.PrimaryLocation}, ${state}, ${cityName}`
                    });
                  }

                  // Process areas (SecondarySubLocation)
                  if (city.SecondarySubLocation && city.SecondarySubLocation.length > 0) {
                    city.SecondarySubLocation.forEach(area => {
                      const areaName = area.SecondarySubLocation;
                      if (areaName) {
                        locationOptions.push({
                          value: `${location._id}-${subLoc._id}-${city._id}-${area._id}`,
                          label: `${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}`
                        });
                      }

                      // Process buildings (ThirdLocation)
                      if (area.ThirdLocation && area.ThirdLocation.length > 0) {
                        area.ThirdLocation.forEach(building => {
                          const buildingName = building.ThirdLocation;
                          if (buildingName) {
                            locationOptions.push({
                              value: `${location._id}-${subLoc._id}-${city._id}-${area._id}-${building._id}`,
                              label: `${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}, ${buildingName}`
                            });
                          }

                          // Process floors (ThirdSubLocation)
                          const floorName = building.ThirdSubLocation;
                          if (floorName) {
                            locationOptions.push({
                              value: `${location._id}-${subLoc._id}-${city._id}-${area._id}-${building._id}-floor`,
                              label: `${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}, ${buildingName}, ${floorName}`
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
        
        setLocations(locationOptions);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchLocationSuggestions = debounce(async (query) => {
    if (!query) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }
    
    try {
      const response = await axios.get(
        'https://codeaves.avessecurity.com/api/Location/getLocations',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data && response.data.Location) {
        const suggestions = new Set();
        
        // Process each location in the response
        response.data.Location.forEach(location => {
          if (!location.PrimaryLocation) return;
          
          // Add primary location if it matches
          if (location.PrimaryLocation.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(location.PrimaryLocation);
          }

          // Process sublocations
          if (location.SubLocation && location.SubLocation.length > 0) {
            location.SubLocation.forEach(subLoc => {
              // State level (PrimarySubLocation)
              const state = subLoc.PrimarySubLocation;
              if (state && state.toLowerCase().includes(query.toLowerCase())) {
                suggestions.add(`${location.PrimaryLocation}, ${state}`);
              }

              // Process cities (SecondaryLocation)
              if (subLoc.SecondaryLocation && subLoc.SecondaryLocation.length > 0) {
                subLoc.SecondaryLocation.forEach(city => {
                  const cityName = city.SecondaryLocation;
                  if (cityName && cityName.toLowerCase().includes(query.toLowerCase())) {
                    suggestions.add(`${location.PrimaryLocation}, ${state}, ${cityName}`);
                  }

                  // Process areas (SecondarySubLocation)
                  if (city.SecondarySubLocation && city.SecondarySubLocation.length > 0) {
                    city.SecondarySubLocation.forEach(area => {
                      const areaName = area.SecondarySubLocation;
                      if (areaName && areaName.toLowerCase().includes(query.toLowerCase())) {
                        suggestions.add(`${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}`);
                      }

                      // Process buildings (ThirdLocation)
                      if (area.ThirdLocation && area.ThirdLocation.length > 0) {
                        area.ThirdLocation.forEach(building => {
                          const buildingName = building.ThirdLocation;
                          if (buildingName && buildingName.toLowerCase().includes(query.toLowerCase())) {
                            suggestions.add(`${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}, ${buildingName}`);
                          }

                          // Process floors (ThirdSubLocation)
                          const floorName = building.ThirdSubLocation;
                          if (floorName && floorName.toLowerCase().includes(query.toLowerCase())) {
                            suggestions.add(`${location.PrimaryLocation}, ${state}, ${cityName}, ${areaName}, ${buildingName}, ${floorName}`);
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
        
        // Convert Set to array and sort
        const sortedSuggestions = Array.from(suggestions).sort();
        setLocationSuggestions(sortedSuggestions);
        setShowLocationSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
    }
  }, 300);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(
        "https://codeaves.avessecurity.com/api/Designation/getDropdown",
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('All users API response:', response.data);
      console.log('Response keys:', Object.keys(response.data));
      
      let userData = null;
      if (response.data && response.data.Report) {
        userData = response.data.Report;
        console.log('Using response.data.Report, sample user:', userData[0]);
      } else if (response.data && Array.isArray(response.data)) {
        userData = response.data;
        console.log('Using response.data as array, sample user:', userData[0]);
      } else if (response.data && response.data.users) {
        userData = response.data.users;
        console.log('Using response.data.users, sample user:', userData[0]);
      }
      
      if (userData && userData.length > 0) {
        const userOptions = userData.map(user => ({
          value: user.username || user.name, // Use username as value for filtering
          label: user.username || user.name,
          id: user._id || user.id // Keep ID for reference
        }));
        setUsers(userOptions);
        console.log('User options set:', userOptions);
      } else {
        console.log('No user data found in response structure');
        setUsers([]); // Clear users if no data found
      }
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  const fetchUsers = debounce(async (query) => {
    if (!query) {
      // If no query, load all users
      fetchAllUsers();
      return;
    }
    try {
      console.log('Fetching users with query:', query);
      const response = await axios.get(
        `https://codeaves.avessecurity.com/api/Designation/getDropdown/${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('User search response:', response.data);
      
      let userData = null;
      if (response.data && response.data.Report) {
        userData = response.data.Report;
      } else if (response.data && Array.isArray(response.data)) {
        userData = response.data;
      } else if (response.data && response.data.users) {
        userData = response.data.users;
      }
      
      if (userData && userData.length > 0) {
        const userOptions = userData.map((user) => ({
          value: user.username || user.name,
          label: user.username || user.name,
          id: user._id || user.id
        }));
        setUsers(userOptions);
        console.log('Filtered user options:', userOptions);
      } else {
        console.log('No user data found in search response');
        setUsers([]); // Clear users if no search results
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback to all users if search fails
      fetchAllUsers();
    }
  }, 500);

  const validateDates = () => {
    if (!startDate || !endDate) {
      setError("Both start and end dates are required");
      return false;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be before start date");
      return false;
    }
    setError('');
    return true;
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompanyLogo(file);
      
      // Create a preview URL for the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreview = async () => {         
    if (!validateDates()) return;
    if (!selectedModule) {
      setError("Please select a module");
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('username', username?.value || '');
    formData.append('userId', userId?.value || '');
    formData.append('LocationId', LocationId?.value || '');
    formData.append('Status', Status?.value || '');
    formData.append('Department', Department?.value || '');
    formData.append('companyName', companyName);
    formData.append('Location', LocationId?.label || '');
    formData.append('module', selectedModule.value); // Add module to filters
    
    if (companyLogo) {
      formData.append('companyLogo', companyLogo);
    }

    try {
      const response = await axios.post(
        `https://codeaves.avessecurity.com/api/ReportGenrate/data/${selectedModule.value}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          }
        }
      );

      setPreviewHtml(response.data);
      setShowPreview(true);
      
    } catch (error) {
      console.error("Error previewing report:", error);
      setError(error.response?.data?.message || "Failed to preview report");
    } finally {
      setLoading(false);
    }
  };

  // New function to get report previews
  const handleGetPreviews = async () => {
    if (!validateDates()) return;
    if (!selectedModule) {
      setError("Please select a module");
      return;
    }

    setPreviewLoading(true);
    setError('');

    try {
      const requestData = {
        startDate: startDate,
        endDate: endDate,
        selectedModule: selectedModule.value,
        // Include all filter parameters
        username: username?.value || null, // Username for text-based search
        userId: username?.id || null, // User ID for ObjectId-based search
        Location: LocationId?.label || null,
        LocationId: LocationId?.value || null,
        Department: Department?.label || null,
        DepartmentId: Department?.value || null,
        Status: Status?.value || null
      };
      
      console.log('Sending preview request with filters:', requestData);
      
      const response = await axios.post(
        `https://codeaves.avessecurity.com/api/ReportGenrate/preview`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      if (response.data.success) {
        setReportPreviews(response.data.data);
        setShowPreviewList(true);
      } else {
        setError("Failed to fetch previews");
      }
    } catch (error) {
      console.error("Error fetching previews:", error);
      setError(error.response?.data?.message || "Failed to fetch previews");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Function to handle preview item click and get detailed view
  const handlePreviewClick = async (preview) => {
    setDetailLoading(true);
    setSelectedPreview(preview);
    
    try {
      const response = await axios.get(
        `https://codeaves.avessecurity.com/api/ReportGenrate/preview/${preview.id}?module=${preview.module}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (response.data.success) {
        setSelectedPreview({
          ...preview,
          details: response.data.data
        });
        setShowDetailModal(true);
      } else {
        setError("Failed to fetch preview details");
      }
    } catch (error) {
      console.error("Error fetching preview details:", error);
      setError(error.response?.data?.message || "Failed to fetch preview details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Function to close preview list
  const handleClosePreviewList = () => {
    setShowPreviewList(false);
    setReportPreviews([]);
  };

  // Function to clear all filters
  const handleClearFilters = () => {
    setUsername(null);
    setLocationId(null);
    setDepartment(null);
    setStatus(null);
    console.log('All filters cleared');
  };

  // Function to get applied filters summary
  const getAppliedFilters = () => {
    const filters = [];
    if (username) filters.push(`User: ${username.label}`);
    if (LocationId) filters.push(`Location: ${LocationId.label}`);
    if (Department) filters.push(`Department: ${Department.label}`);
    if (Status) filters.push(`Status: ${Status.label}`);
    return filters;
  };

  // Function to handle row click from preview table
  const handlePreviewRowClick = async (recordId, module) => {
    setDetailLoading(true);
    setError('');
    
    try {
      const response = await axios.get(
        `https://codeaves.avessecurity.com/api/ReportGenrate/preview/${recordId}?module=${module}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (response.data.success) {
        // Create a preview object similar to the card-based approach
        const previewData = {
          id: recordId,
          reportNo: response.data.data.ReportNo || 'N/A',
          module: module,
          details: response.data.data
        };
        setSelectedPreview(previewData);
        setShowDetailModal(true);
      } else {
        setError("Failed to fetch record details");
      }
    } catch (error) {
      console.error("Error fetching record details:", error);
      setError(error.response?.data?.message || "Failed to fetch record details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Function to fetch individual record details from backend
  const fetchRecordDetails = async (recordId, module) => {
    try {
      setLoading(true);
      console.log('Fetching record details for:', recordId, module);
      
      const response = await axios.get(
        `https://codeaves.avessecurity.com/api/ReportGenrate/preview-single/${module}/${recordId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      console.log('Record details HTML received');
      setDetailHtml(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching record details:', error);
      setError('Failed to load record details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!validateDates()) return;
    if (!selectedModule) {
      setError("Please select a module");
      return;
    }

    setLoading(true);
    setError('');

    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    formData.append('username', username?.value || '');
    formData.append('LocationId', LocationId?.value || '');
    formData.append('Status', Status?.value || '');
    formData.append('Department', Department?.value || '');
    formData.append('companyName', companyName);
    
    if (companyLogo) {
      formData.append('companyLogo', companyLogo);
    }

    try {
      const response = await axios.post(
        `https://codeaves.avessecurity.com/api/ReportGenrate/Pdf/${selectedModule.value}`,
        formData,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          }
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${selectedModule.label}_Report_${new Date().toISOString().slice(0,10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(error.response?.data?.message || "Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle location input change
  const handleLocationInputChange = (inputValue, { action }) => {
    if (action === "input-change") {
      setLocationInput(inputValue);
      fetchLocationSuggestions(inputValue);
    }
  };

  // Function to handle location selection from suggestions
  const handleLocationSelect = (selectedOption) => {
    setLocationId(selectedOption);
    setShowLocationSuggestions(false);
  };

  // Function to render module-specific fields
  const renderModuleSpecificFields = (detailsData) => {
    const details = detailsData.data || detailsData;
    const metadata = detailsData.fieldMetadata || {};
    
    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
    const formatDateTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleString() : 'N/A';
    const safe = (value) => value || 'N/A';
    
    console.log('Details received:', details);
    console.log('Field metadata:', metadata);
    
    // Debug: Check for problematic object fields
    Object.keys(details).forEach(key => {
      const value = details[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        console.log(`Object field '${key}':`, value);
      }
    });
    
    // Create dynamic fields using backend metadata - completely backend driven
    const excludeFields = new Set([
      '_id', '__v', 'module', 
      ...(metadata.excludeFields || []),
      ...(metadata.imageFields || [])
    ]);
    
    const allFields = Object.keys(details)
      .filter(key => {
        const value = details[key];
        return (
          !excludeFields.has(key) &&
          !key.startsWith('_') &&
          value !== null && 
          value !== undefined &&
          value !== '' &&
          // Exclude complex nested objects that would be hard to display
          !(typeof value === 'object' && value !== null && 
            !Array.isArray(value) && 
            Object.keys(value).length > 3 &&
            !value.name && !value.Name && !value.title && !value.Title)
        );
      })
      .sort((a, b) => {
        // Sort priority fields first
        const priorityFields = metadata.priorityFields || [];
        const aPriority = priorityFields.indexOf(a);
        const bPriority = priorityFields.indexOf(b);
        
        if (aPriority !== -1 && bPriority !== -1) {
          return aPriority - bPriority;
        }
        if (aPriority !== -1) return -1;
        if (bPriority !== -1) return 1;
        return a.localeCompare(b);
      })
      .map(key => ({
        label: key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase()),
        key: key,
        uniqueKey: `field-${key}`,
        isDate: (metadata.dateFields || []).includes(key),
        isTime: (metadata.timeFields || []).includes(key),
        isDateTime: key === 'createdAt' || key === 'updatedAt',
        isBadge: (metadata.statusFields || []).includes(key) || key === 'module',
        isImage: (metadata.imageFields || []).includes(key)
      }));

    const renderField = (field) => {
      let value = details[field.key];
      
      // Handle null, undefined, or empty values
      if (value === null || value === undefined || value === '') {
        value = 'N/A';
      }
      // Special handling for image fields - show as thumbnails
      else if ((metadata.imageFields || []).includes(field.key)) {
        const renderImages = (imageValue) => {
          // Handle array of images
          if (Array.isArray(imageValue)) {
            if (imageValue.length === 0) {
              return <span className="text-muted">No images</span>;
            }
            return (
              <div className="d-flex flex-wrap gap-2">
                {imageValue.map((img, index) => {
                  const imageUrl = img.startsWith('http') ? img : `https://codeaves.avessecurity.com/uploads/${img.replace(/^uploads\//, '')}`;
                  return (
                    <div key={index} className="position-relative">
                      <img 
                        src={imageUrl} 
                        alt={`${field.label} ${index + 1}`}
                        className="img-thumbnail" 
                        style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => window.open(imageUrl, '_blank')}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'inline';
                        }}
                      />
                      <span style={{ display: 'none', color: '#666', fontSize: '0.8em' }}>📷 Image {index + 1}</span>
                    </div>
                  );
                })}
                <small className="text-muted align-self-end">{imageValue.length} image(s) - Click to view</small>
              </div>
            );
          }
          // Handle single image URL
          else if (typeof imageValue === 'string' && imageValue !== 'N/A' && imageValue.trim() !== '') {
            const imageUrl = imageValue.startsWith('http') ? imageValue : `https://codeaves.avessecurity.com/uploads/${imageValue.replace(/^uploads\//, '')}`;
            return (
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <img 
                    src={imageUrl} 
                    alt={field.label}
                    className="img-thumbnail" 
                    style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => window.open(imageUrl, '_blank')}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'inline';
                    }}
                  />
                  <div>
                    <div>
                      <small className="text-primary" style={{ cursor: 'pointer' }} onClick={() => window.open(imageUrl, '_blank')}>
                        🖼️ Click to view full size
                      </small>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>
                      {imageValue.length > 50 ? imageValue.substring(0, 50) + '...' : imageValue}
                    </div>
                  </div>
                </div>
                <span style={{ display: 'none', color: '#666', fontSize: '0.9em' }}>📷 {imageValue}</span>
              </div>
            );
          }
          // No valid image
          else {
            return <span className="text-muted">No image</span>;
          }
        };
        
        return (
          <tr key={field.uniqueKey}>
            <td className="fw-bold">{field.label}:</td>
            <td>{renderImages(value)}</td>
          </tr>
        );
      }
      // Handle complex objects and arrays
      else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          // Handle arrays - join them or show count
          if (value.length === 0) {
            value = 'N/A';
          } else if (value.every(item => typeof item === 'string' || typeof item === 'number')) {
            value = value.join(', ');
          } else {
            value = `${value.length} item(s)`;
          }
        } else {
          // Handle objects - convert to readable string
          try {
            if (value.name || value.Name) {
              value = value.name || value.Name;
            } else if (value.title || value.Title) {
              value = value.title || value.Title;
            } else if (value.Addmodule) {
              // Handle specific Addmodule object pattern
              value = value.Addmodule;
            } else if (value.classes) {
              // Handle classes object
              if (Array.isArray(value.classes)) {
                value = value.classes.join(', ');
              } else {
                value = value.classes.toString();
              }
            } else if (Object.keys(value).length === 1) {
              // If object has only one key, use its value
              const singleKey = Object.keys(value)[0];
              const singleValue = value[singleKey];
              // Ensure the single value is also renderable
              if (typeof singleValue === 'object' && singleValue !== null) {
                value = JSON.stringify(singleValue);
              } else {
                value = singleValue;
              }
            } else {
              // For complex objects, show a summary
              const keys = Object.keys(value);
              if (keys.length <= 3) {
                value = keys.map(k => `${k}: ${value[k]}`).join(', ');
              } else {
                value = `Object with ${keys.length} properties`;
              }
            }
          } catch (e) {
            value = '[Complex Object]';
          }
        }
      }
      // Handle dates
      else if (field.isDate && value) {
        value = formatDate(value);
      } else if (field.isDateTime && value) {
        value = formatDateTime(value);
      } else if (field.isTime && value) {
        // Handle time fields - convert to string
        value = value.toString();
      } else {
        // Convert everything else to string to be safe
        value = safe(value.toString());
      }

      // Final safety check - ensure value is renderable
      if (typeof value === 'object' && value !== null && !React.isValidElement(value)) {
        console.warn(`Warning: Converting object value for field '${field.key}' to string:`, value);
        value = '[Object - Could not display]';
      }
      
      // Apply badge styling for status fields
      if (field.isBadge && value !== 'N/A' && typeof value === 'string') {
        const badgeClass = 
          (value === 'Good' ? 'bg-success' :
           value === 'Faulty' ? 'bg-danger' :
           value === 'Fixed' ? 'bg-success' :
           value === 'Pending' ? 'bg-warning' : 
           field.key === 'module' ? 'bg-info' : 'bg-secondary');
        value = <span className={`badge ${badgeClass}`}>{value}</span>;
      }

      return (
        <tr key={field.uniqueKey}>
          <td className="fw-bold">{field.label}:</td>
          <td>{value}</td>
        </tr>
      );
    };

    // Split fields into two columns for better layout
    const midpoint = Math.ceil(allFields.length / 2);
    const leftFields = allFields.slice(0, midpoint);
    const rightFields = allFields.slice(midpoint);

    // Add module badge at the end if not already present
    if (details.module && !rightFields.some(f => f.key === 'module')) {
      rightFields.push({
        label: 'Module',
        key: 'module',
        uniqueKey: 'field-module',
        isBadge: true
      });
    }

    return (
      <>
        <div className="alert alert-info mb-3">
          <i className="bi bi-database me-2"></i>
          <strong>Dynamic Fields:</strong> Showing all available fields from {details.module || 'Unknown'} module
        </div>
        
        <div className="row">
          <div className="col-md-6">
            <h5 className="text-primary border-bottom pb-2">
              Record Details (Part 1)
            </h5>
            <table className="table table-sm table-borderless">
              <tbody>
                {leftFields.map(renderField)}
              </tbody>
            </table>
          </div>
          <div className="col-md-6">
            <h5 className="text-primary border-bottom pb-2">
              Record Details (Part 2)
            </h5>
            <table className="table table-sm table-borderless">
              <tbody>
                {rightFields.map(renderField)}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="container-fluid py-4">
      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 1050 
        }}>
          <div className="text-center bg-white p-4 rounded shadow">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 mb-0">Processing report...</p>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">
            <i className="bi bi-file-earmark-bar-graph me-2"></i>
            Report Generator
          </h5>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}

          <div className="row g-3">
            {/* Company Name from Token */}
            <div className="col-md-6">
              <label className="form-label fw-bold">Company Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={companyName} 
                readOnly
                disabled
              />
              <small className="text-muted">Company name is the WaterMark of pdf</small>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Company Logo</label>
              <input 
                type="file" 
                className="form-control" 
                accept="image/*" 
                onChange={handleLogoChange}
              />
              {logoPreview && (
                <div className="mt-2">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    style={{ maxWidth: '100px', maxHeight: '100px' }} 
                    className="img-thumbnail"
                  />
                </div>
              )}
            </div>
            
            <div className="col-md-12">
              <label className="form-label fw-bold">Module</label>
              <Select
                options={modules}
                value={selectedModule}
                onChange={setSelectedModule}
                placeholder="Select report module..."
                isSearchable
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Start Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                max={endDate || undefined}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">End Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                required
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Checked By</label>
              <Select
                options={users}
                value={username}
                onChange={setUsername}
                onInputChange={(inputValue) => {
                  setUserInput(inputValue);
                  fetchUsers(inputValue);
                }}
                placeholder="Search user..."
                isClearable
                isSearchable
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Location</label>
              <Select
                options={locations}
                value={LocationId}
                onChange={handleLocationSelect}
                onInputChange={handleLocationInputChange}
                placeholder="Search location..."
                isClearable
                isSearchable
              />
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="mt-1 p-2 border rounded bg-white" style={{ position: 'absolute', zIndex: 10, width: '100%' }}>
                  {locationSuggestions.map((suggestion, index) => (
                    <div 
                      key={index} 
                      className="p-1 cursor-pointer hover-bg-light"
                      onClick={() => handleLocationSelect({ value: suggestion, label: suggestion })}
                      style={{ cursor: 'pointer' }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Status</label>
              <Select
                options={statusOptions}
                value={Status}
                onChange={setStatus}
                placeholder="Select status..."
                isClearable
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-bold">Department</label>
              <Select
                options={departments}
                value={Department}
                onChange={setDepartment}
                placeholder="Select department..."
                isClearable
                isSearchable
              />
            </div>

            {/* Applied Filters Summary */}
            {getAppliedFilters().length > 0 && (
              <div className="col-md-12">
                <div className="alert alert-info d-flex justify-content-between align-items-center">
                  <div>
                    <strong><i className="bi bi-funnel me-2"></i>Applied Filters:</strong> 
                    <span className="ms-2">{getAppliedFilters().join(' • ')}</span>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleClearFilters}
                    title="Clear all filters"
                  >
                    <i className="bi bi-x-circle me-1"></i> Clear Filters
                  </button>
                </div>
              </div>
            )}

            <div className="col-md-12 mt-4 d-flex justify-content-between align-items-center">
              <div className="d-flex gap-2">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={handleClearFilters}
                  disabled={getAppliedFilters().length === 0}
                  title="Clear all filters"
                >
                  <i className="bi bi-funnel-fill me-1"></i> Clear Filters
                </button>
              </div>
              
              <div className="d-flex gap-2">
                <button 
                  type="button" 
                  className="btn btn-info px-4" 
                  onClick={handleGetPreviews}
                  disabled={!selectedModule || previewLoading}
                >
                  {previewLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-list-ul me-1"></i> Get Previews
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary px-4" 
                  onClick={handlePreview}
                  disabled={!selectedModule || loading}
                >
                  <i className="bi bi-eye me-1"></i> Preview Report
                </button>
                <button 
                  type="button" 
                  className="btn btn-success px-4" 
                  onClick={handleGeneratePdf}
                  disabled={!selectedModule || loading}
                >
                  <i className="bi bi-file-earmark-pdf me-1"></i> Generate PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal with Iframe */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl" centered scrollable>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <i className="bi bi-file-earmark-text me-2"></i>
            {selectedModule?.label} Report Preview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto", padding: 0 }}>
          <iframe 
            srcDoc={previewHtml}
            style={{ 
              width: '100%', 
              height: '60vh', 
              border: 'none',
              borderRadius: '8px'
            }}
            title="Report Preview"
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => console.log('Preview iframe loaded successfully')}
          />
        </Modal.Body>
        <Modal.Footer>
          <div className="text-muted small">
            <i className="bi bi-info-circle me-1"></i>
            Click on any row to view detailed information
          </div>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            <i className="bi bi-x-circle me-1"></i> Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Preview List Modal */}
      <Modal show={showPreviewList} onHide={handleClosePreviewList} size="xl" centered scrollable>
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <div>
              <i className="bi bi-list-ul me-2"></i>
              {selectedModule?.label || 'Report'} Previews ({reportPreviews.length} found)
              {getAppliedFilters().length > 0 && (
                <div className="small mt-1">
                  <i className="bi bi-funnel me-1"></i>
                  Filtered by: {getAppliedFilters().join(' • ')}
                </div>
              )}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {reportPreviews.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-inbox display-4 text-muted"></i>
              <p className="mt-3 text-muted">No reports found for the selected date range and module.</p>
            </div>
          ) : (
            <div className="row">
              {reportPreviews.map((preview, index) => (
                <div key={preview.id} className="col-md-6 col-lg-4 mb-3">
                  <div 
                    className="card h-100 shadow-sm" 
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => handlePreviewClick(preview)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
                  >
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                      <small className="text-muted">#{index + 1}</small>
                      <span className={`badge ${
                        preview.status === 'Good' ? 'bg-success' :
                        preview.status === 'Faulty' ? 'bg-danger' : 'bg-secondary'
                      }`}>
                        {preview.status}
                      </span>
                    </div>
                    <div className="card-body">
                      <h6 className="card-title text-truncate" title={preview.reportNo}>
                        <i className="bi bi-file-earmark-text me-1"></i>
                        {preview.reportNo}
                      </h6>
                      <p className="card-text small mb-2">
                        <i className="bi bi-geo-alt me-1"></i>
                        <span className="text-truncate" title={preview.location}>{preview.location}</span>
                      </p>
                      <p className="card-text small mb-2">
                        <i className="bi bi-person me-1"></i>
                        {preview.reportedBy}
                      </p>
                      <p className="card-text small mb-0 text-muted">
                        <i className="bi bi-calendar me-1"></i>
                        {preview.reportedDate}
                      </p>
                      {preview.hasImages && (
                        <div className="mt-2">
                          <span className="badge bg-warning text-dark">
                            <i className="bi bi-images me-1"></i>
                            Has Images
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="card-footer bg-transparent">
                      <small className="text-primary">
                        <i className="bi bi-arrow-right-circle me-1"></i>
                        Click to view details
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="me-auto text-muted small">
            <i className="bi bi-info-circle me-1"></i>
            Click any preview card to view detailed information
          </div>
          <Button variant="secondary" onClick={handleClosePreviewList}>
            <i className="bi bi-x-circle me-1"></i> Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail View Modal - Updated for new preview details */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="xl" centered scrollable>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="bi bi-info-circle me-2"></i>
            Record Details - {selectedPreview?.reportNo || 'N/A'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {detailLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading detailed information...</p>
            </div>
          ) : selectedPreview?.details ? (
            <div className="container-fluid">
              {renderModuleSpecificFields(selectedPreview.details)}
              
              {/* Images Section */}
              {(() => {
                const data = selectedPreview.details.data || selectedPreview.details;
                return (data.FaultImage?.length > 0 || data.AcknowledgedImage?.length > 0 || 
                        data.Images?.length > 0 || data.Imageold?.length > 0);
              })() && (
                <div className="row mt-4">
                  <div className="col-12">
                    <h5 className="text-primary border-bottom pb-2">Images</h5>
                    <div className="row">
                      {(() => {
                        const data = selectedPreview.details.data || selectedPreview.details;
                        return (
                          <>
                            {data.FaultImage?.length > 0 && (
                              <div className="col-md-6 mb-3">
                                <h6 className="text-danger">Fault Images</h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {data.FaultImage.map((img, index) => (
                                    <img 
                                      key={index} 
                                      src={img} 
                                      alt={`Fault ${index + 1}`} 
                                      className="img-thumbnail" 
                                      style={{ width: '100px', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                                      onClick={() => window.open(img, '_blank')}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {data.AcknowledgedImage?.length > 0 && (
                              <div className="col-md-6 mb-3">
                                <h6 className="text-success">Acknowledged Images</h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {data.AcknowledgedImage.map((img, index) => (
                                    <img 
                                      key={index} 
                                      src={img} 
                                      alt={`Acknowledged ${index + 1}`} 
                                      className="img-thumbnail" 
                                      style={{ width: '100px', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                                      onClick={() => window.open(img, '_blank')}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {data.Images?.length > 0 && (
                              <div className="col-md-6 mb-3">
                                <h6 className="text-info">General Images</h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {data.Images.map((img, index) => (
                                    <img 
                                      key={index} 
                                      src={img} 
                                      alt={`Image ${index + 1}`} 
                                      className="img-thumbnail" 
                                      style={{ width: '100px', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                                      onClick={() => window.open(img, '_blank')}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            {data.Imageold?.length > 0 && (
                              <div className="col-md-6 mb-3">
                                <h6 className="text-warning">Archive Images</h6>
                                <div className="d-flex flex-wrap gap-2">
                                  {data.Imageold.map((img, index) => (
                                    <img 
                                      key={index} 
                                      src={img} 
                                      alt={`Archive ${index + 1}`} 
                                      className="img-thumbnail" 
                                      style={{ width: '100px', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                                      onClick={() => window.open(img, '_blank')}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : detailHtml ? (
            <iframe 
              srcDoc={detailHtml}
              style={{ 
                width: '100%', 
                height: '60vh', 
                border: 'none',
                borderRadius: '8px'
              }}
              title="Record Details"
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => console.log('Detail iframe loaded successfully')}
            />
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-exclamation-triangle display-4 text-warning"></i>
              <p className="mt-3">No details available</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            <i className="bi bi-x-circle me-1"></i> Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Reports;