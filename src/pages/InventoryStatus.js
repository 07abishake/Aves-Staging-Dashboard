import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Offcanvas } from 'bootstrap';
import Select from 'react-select';
import debounce from 'lodash/debounce';

const InventoryStatus = () => {
  const [inventoryList, setInventoryList] = useState([]);
  const [formData, setFormData] = useState({
    ItemName: '',
    ItemId: '',
    QuantityAvailable: 0,
    QuantityIssued: 0,
    Instock: 0,
    ConditionStatus: 'Good'
  });
  const [itemOptions, setItemOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [createCanvas, setCreateCanvas] = useState(null);
  const [editCanvas, setEditCanvas] = useState(null);
  const [viewCanvas, setViewCanvas] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchInventoryStatus();
    fetchProducts();
    setCreateCanvas(new Offcanvas(document.getElementById('createCanvas')));
    setEditCanvas(new Offcanvas(document.getElementById('editCanvas')));
    setViewCanvas(new Offcanvas(document.getElementById('viewCanvas')));
  }, []);

     const token = localStorage.getItem("access_token");
    if (!token) {
        // window.location.href = "/login";
    }

  const fetchInventoryStatus = async () => {
    try {
      const res = await axios.get('https://api.avessecurity.com/api/inventory/status',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setInventoryList(res.data.Status || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch inventory status', err);
      setError('Failed to load inventory data');
      setInventoryList([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('https://api.avessecurity.com/api/inventory/products', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      setProducts(res.data);
      setItemOptions(res.data.map(item => ({
        value: item._id,
        label: item.ItemName,
        AddQuntity: item.AddQuntity,
        ...item
      })));
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const searchItems = debounce(async (query) => {
    if (!query) {
      setItemOptions([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await axios.get(`https://api.avessecurity.com/api/inventory/search/${query}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      setItemOptions(res.data.map(item => ({
        value: item._id,
        label: item.ItemName,
        AddQuntity: item.AddQuntity,
        ...item
      })));
      setError(null);
    } catch (err) {
      console.error('Search failed', err);
      setError('Failed to search items');
      setItemOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  const handleItemSelect = (selectedOption) => {
    if (selectedOption) {
      setFormData({
        ...formData,
        ItemName: selectedOption.label,
        ItemId: selectedOption.value,
        QuantityAvailable: selectedOption.AddQuntity || 0,
        QuantityIssued: 0,
        Instock: selectedOption.AddQuntity || 0,
        ConditionStatus: 'Good'
      });
      setError(null);
    } else {
      setFormData({
        ...formData,
        ItemName: '',
        ItemId: '',
        QuantityAvailable: 0,
        QuantityIssued: 0,
        Instock: 0,
        ConditionStatus: 'Good'
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = name.includes('Quantity') || name === 'Instock' 
      ? parseInt(value) || 0 
      : value;

    // Validate QuantityAvailable doesn't exceed the product's total quantity
    if (name === 'QuantityAvailable' && formData.ItemId) {
      const selectedItem = itemOptions.find(item => item.value === formData.ItemId);
      if (selectedItem && newValue > selectedItem.AddQuntity) {
        setError(`Available quantity cannot exceed ${selectedItem.AddQuntity}`);
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: newValue
    });
    setError(null);
  };

  const resetForm = () => {
    setFormData({
      ItemName: '',
      ItemId: '',
      QuantityAvailable: 0,
      QuantityIssued: 0,
      Instock: 0,
      ConditionStatus: 'Good'
    });
    setEditId(null);
    setError(null);
  };

  const handleCreate = () => {
    resetForm();
    createCanvas.show();
  };

  const handleEdit = (item) => {
    setFormData({
      ItemName: item.ItemName?.ItemName || item.ItemName || '',
      ItemId: item.ItemName?._id || item.ItemId || '',
      QuantityAvailable: item.QuantityAvailable,
      QuantityIssued: item.QuantityIssued,
      Instock: item.Instock,
      ConditionStatus: item.ConditionStatus
    });
    setEditId(item._id);
    editCanvas.show();
  };

  const handleView = (item) => {
    setViewItem(item);
    viewCanvas.show();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ItemName: formData.ItemId,
        QuantityAvailable: formData.QuantityAvailable,
        QuantityIssued: formData.QuantityIssued,
        Instock: formData.Instock,
        ConditionStatus: formData.ConditionStatus
      };

      if (editId) {
        await axios.put(`https://api.avessecurity.com/api/inventory/status/${editId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setSuccess('Inventory updated successfully!');
      } else {
        await axios.post('https://api.avessecurity.com/api/inventory/status', payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setSuccess('Inventory created successfully!');
      }

      // Refresh both inventories and products
      await Promise.all([fetchInventoryStatus(), fetchProducts()]);
      
      resetForm();
      editId ? editCanvas.hide() : createCanvas.hide();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save inventory', err);
      setError(err.response?.data?.message || 'Failed to save inventory data');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory record?')) {
      try {
        await axios.delete(`https://api.avessecurity.com/api/inventory/status/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchInventoryStatus();
        setSuccess('Inventory deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Failed to delete inventory', err);
        setError('Failed to delete inventory record');
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Inventory Status Management</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          <i className=" me-2"></i>Add New
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-striped">
          <thead className="table-white text-dark">
            <tr>
              <th>Item Name</th>
              <th>Available</th>
              <th>Issued</th>
              <th>In Stock</th>
              <th>Condition</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(inventoryList) && inventoryList.length > 0 ? (
              inventoryList.map((item) => (
                <tr key={item._id}>
                  <td>{item.ItemName?.ItemName || item.ItemName || 'N/A'}</td>
                  <td>{item.QuantityAvailable}</td>
                  <td>{item.QuantityIssued}</td>
                  <td>{item.Instock}</td>
                  <td>
                    <span className={`badge ${
                      item.ConditionStatus === 'Good' ? 'bg-success' :
                      item.ConditionStatus === 'Faulty' ? 'bg-warning' :
                      item.ConditionStatus === 'Damaged' ? 'bg-danger' : 'bg-secondary'
                    }`}>
                      {item.ConditionStatus}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleView(item)}
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-secondary me-2"
                      onClick={() => handleEdit(item)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(item._id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">No inventory items found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="createCanvas">
        <div className="offcanvas-header bg-white text-dark">
          <h5 className="offcanvas-title">Add Inventory Status</h5>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={() => createCanvas.hide()}
          ></button>
        </div>
        <div className="offcanvas-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Search Item</label>
              <Select
                options={itemOptions}
                onInputChange={searchItems}
                onChange={handleItemSelect}
                isLoading={isLoading}
                isClearable
                placeholder="Type to search items..."
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Quantity Available</label>
              <input
                type="number"
                className="form-control"
                name="QuantityAvailable"
                value={formData.QuantityAvailable}
                onChange={handleInputChange}
                min="0"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Quantity Issued</label>
              <input
                type="number"
                className="form-control"
                name="QuantityIssued"
                value={formData.QuantityIssued}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">In Stock</label>
              <input
                type="number"
                className="form-control"
                name="Instock"
                value={formData.Instock}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Condition Status</label>
              <select
                className="form-select"
                name="ConditionStatus"
                value={formData.ConditionStatus}
                onChange={handleInputChange}
              >
                <option value="Good">Good</option>
                <option value="Faulty">Faulty</option>
                <option value="Replace">Replace</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-primary">
                 Inventory Status
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Edit Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="editCanvas">
        <div className="offcanvas-header bg-white text-dark">
          <h5 className="offcanvas-title">Edit Inventory Status</h5>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={() => editCanvas.hide()}
          ></button>
        </div>
        <div className="offcanvas-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Item Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.ItemName}
                readOnly
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Quantity Available</label>
              <input
                type="number"
                className="form-control"
                name="QuantityAvailable"
                value={formData.QuantityAvailable}
                onChange={handleInputChange}
                min="0"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Quantity Issued</label>
              <input
                type="number"
                className="form-control"
                name="QuantityIssued"
                value={formData.QuantityIssued}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">In Stock</label>
              <input
                type="number"
                className="form-control"
                name="Instock"
                value={formData.Instock}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Condition Status</label>
              <select
                className="form-select"
                name="ConditionStatus"
                value={formData.ConditionStatus}
                onChange={handleInputChange}
              >
                <option value="Good">Good</option>
                <option value="Faulty">Faulty</option>
                <option value="Replace">Replace</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>

            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-secondary">
                Update Inventory Status
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* View Offcanvas */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="viewCanvas">
        <div className="offcanvas-header bg-white text-dark">
          <h5 className="offcanvas-title">Inventory Details</h5>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => viewCanvas.hide()}
          ></button>
        </div>
        <div className="offcanvas-body">
          {viewItem && (
            <div>
              <div className="mb-3">
                <h6>Item Name:</h6>
                <p>{viewItem.ItemName?.ItemName || viewItem.ItemName || 'N/A'}</p>
              </div>
              <div className="mb-3">
                <h6>Quantity Available:</h6>
                <p>{viewItem.QuantityAvailable}</p>
              </div>
              <div className="mb-3">
                <h6>Quantity Issued:</h6>
                <p>{viewItem.QuantityIssued}</p>
              </div>
              <div className="mb-3">
                <h6>In Stock:</h6>
                <p>{viewItem.Instock}</p>
              </div>
              <div className="mb-3">
                <h6>Condition Status:</h6>
                <p>
                  <span className={`badge ${
                    viewItem.ConditionStatus === 'Good' ? 'bg-success' :
                    viewItem.ConditionStatus === 'Faulty' ? 'bg-warning' :
                    viewItem.ConditionStatus === 'Damaged' ? 'bg-danger' : 'bg-secondary'
                  }`}>
                    {viewItem.ConditionStatus}
                  </span>
                </p>
              </div>
              <div className="mb-3">
                <h6>Last Updated:</h6>
                <p>{new Date(viewItem.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryStatus;