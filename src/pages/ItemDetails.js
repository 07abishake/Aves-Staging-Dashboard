import { useState, useEffect } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

function ItemDetails() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    ItemName: '',
    Category: '',
    Type: '',
    AddQuntity: '',
    Description: '',
    BrandModel: '',
  });
  const [categoryInput, setCategoryInput] = useState('');
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [typeInput, setTypeInput] = useState('');
  const [typeSuggestions, setTypeSuggestions] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [showFormCanvas, setShowFormCanvas] = useState(false);
  const [showViewCanvas, setShowViewCanvas] = useState(false);
  const [image, setImage] = useState(null);

  const defaultForm = {
    ItemName: '',
    Category: '',
    Type: '',
    AddQuntity: '',
    Description: '',
    BrandModel: '',
  };

  useEffect(() => {
    fetchProducts();
  }, []);

     const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "/login";
    }

  const fetchProducts = async () => {
    try {
      const res = await axios.get("https://api.avessecurity.com/api/inventory/products",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryInput = async (e) => {
    const value = e.target.value;
    setCategoryInput(value);
    setFormData((prev) => ({ ...prev, Category: value }));

    try {
      const res = await axios.get(`https://api.avessecurity.com/api/inventory/categories?q=${value}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      const suggestions = res.data?.data || [];
      setCategorySuggestions(suggestions.map((item) => item.Category));
    } catch (err) {
      console.error("Failed to fetch category suggestions:", err);
      setCategorySuggestions([]);
    }
  };

  const handleTypeInput = async (e) => {
    const value = e.target.value;
    setTypeInput(value);
    setFormData((prev) => ({ ...prev, Type: value }));

    try {
      const res = await axios.get(`https://api.avessecurity.com/api/inventory/types?q=${value}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      const suggestions = res.data?.data || [];
      setTypeSuggestions(suggestions.map(item => item.Type || item));
    } catch (err) {
      console.error("Failed to fetch type suggestions:", err);
      setTypeSuggestions([]);
    }
  };

  const handleImage = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("ItemName", formData.ItemName);
      data.append("Category", formData.Category);
      data.append("Type", formData.Type);
      data.append("Description", formData.Description);
      data.append("BrandModel", formData.BrandModel);
      data.append("AddQuntity", formData.AddQuntity);
      if (image) {
        data.append("ProductImage", image);
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (editId) {
        await axios.put(`https://api.avessecurity.com/api/inventory/products/update/${editId}`, data, config, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        await axios.post(`https://api.avessecurity.com/api/inventory/products/create`, data, config, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      await fetchProducts();
      setFormData(defaultForm);
      setImage(null);
      setEditId(null);
      setIsEdit(false);
      setShowFormCanvas(false);
      setCategoryInput('');
      setTypeInput('');
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  const handleCreate = () => {
    setIsEdit(false);
    setEditId(null);
    setFormData(defaultForm);
    setCategoryInput('');
    setTypeInput('');
    setImage(null);
    setShowFormCanvas(true);
  };

  const handleEdit = (product) => {
    setIsEdit(true);
    setEditId(product._id);
    setFormData({
      ItemName: product.ItemName,
      Category: product.Category,
      Type: product.Type || '',
      Description: product.Description,
      BrandModel: product.BrandModel,
      AddQuntity: product.AddQuntity,
    });
    setCategoryInput(product.Category);
    setTypeInput(product.Type || '');
    setShowFormCanvas(true);
  };

  const handleView = (product) => {
    setViewProduct(product);
    setShowViewCanvas(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`https://api.avessecurity.com/api/inventory/products/delete/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        fetchProducts();
      } catch (err) {
        console.error("Delete error", err);
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Product Inventory</h2>
      <div className="text-end mb-3">
        <button className="btn btn-primary" onClick={handleCreate}>
          Add Product
        </button>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Category</th>
            <th>Type</th>
            <th>Brand/Model</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>{product.ItemName}</td>
              <td>{product.Category}</td>
              <td>{product.Type}</td>
              <td>{product.BrandModel}</td>
              <td>{product.Description}</td>
              <td>{product.AddQuntity}</td>
              <td>
                <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(product)}>
                  <i className="bi bi-pencil-square"></i>
                </button>
                <button className="btn btn-sm btn-secondary me-2" onClick={() => handleView(product)}>
                  <i className="bi bi-eye"></i>
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product._id)}>
                  <i className="bi bi-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Form Offcanvas */}
      <div className={`offcanvas offcanvas-end ${showFormCanvas ? "show" : ""}`} 
           style={{ visibility: showFormCanvas ? "visible" : "hidden", width: '400px' }}>
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">{isEdit ? "Edit Product" : "Add Product"}</h5>
          <button type="button" className="btn-close" onClick={() => setShowFormCanvas(false)}></button>
        </div>
        <div className="offcanvas-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Item Name</label>
              <input 
                type="text" 
                name="ItemName" 
                value={formData.ItemName} 
                onChange={handleChange} 
                className="form-control" 
                required 
              />
            </div>

            <div className="mb-3 position-relative">
              <label className="form-label">Category</label>
              <input
                type="text"
                name="Category"
                value={categoryInput}
                onChange={handleCategoryInput}
                className="form-control"
                autoComplete="off"
                required
              />
              {categorySuggestions.length > 0 && (
                <ul className="list-group position-absolute w-100" style={{ zIndex: 1000 }}>
                  {categorySuggestions.map((cat, index) => (
                    <li
                      key={index}
                      className="list-group-item list-group-item-action"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, Category: cat }));
                        setCategoryInput(cat);
                        setCategorySuggestions([]);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-3 position-relative">
              <label className="form-label">Type</label>
              <input
                type="text"
                name="Type"
                value={typeInput}
                onChange={handleTypeInput}
                className="form-control"
                autoComplete="off"
              />
              {typeSuggestions.length > 0 && (
                <ul className="list-group position-absolute w-100" style={{ zIndex: 1000 }}>
                  {typeSuggestions.map((type, index) => (
                    <li
                      key={index}
                      className="list-group-item list-group-item-action"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, Type: type }));
                        setTypeInput(type);
                        setTypeSuggestions([]);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {type}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea 
                name="Description" 
                value={formData.Description} 
                onChange={handleChange} 
                className="form-control" 
                rows="3"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Brand / Model</label>
              <input 
                type="text" 
                name="BrandModel" 
                value={formData.BrandModel} 
                onChange={handleChange} 
                className="form-control" 
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Quantity</label>
              <input 
                type="number" 
                name="AddQuntity" 
                value={formData.AddQuntity} 
                onChange={handleChange} 
                className="form-control" 
                min="0"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Image</label>
              <input 
                type="file" 
                onChange={handleImage} 
                className="form-control" 
                accept="image/*"
              />
            </div>

            <button className="btn btn-primary" type="submit">
              {isEdit ? "Update Product" : "Add Product"}
            </button>
          </form>
        </div>
      </div>

      {/* View Offcanvas */}
      <div className={`offcanvas offcanvas-end ${showViewCanvas ? "show" : ""}`} 
           style={{ visibility: showViewCanvas ? "visible" : "hidden", width: '400px' }}>
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Product Details</h5>
          <button type="button" className="btn-close" onClick={() => setShowViewCanvas(false)}></button>
        </div>
        <div className="offcanvas-body">
          {viewProduct && (
            <div>
              <div className="mb-3">
                <h6>Item Name:</h6>
                <p>{viewProduct.ItemName}</p>
              </div>
              <div className="mb-3">
                <h6>Category:</h6>
                <p>{viewProduct.Category}</p>
              </div>
              <div className="mb-3">
                <h6>Type:</h6>
                <p>{viewProduct.Type}</p>
              </div>
              <div className="mb-3">
                <h6>Description:</h6>
                <p>{viewProduct.Description}</p>
              </div>
              <div className="mb-3">
                <h6>Quantity:</h6>
                <p>{viewProduct.AddQuntity}</p>
              </div>
              <div className="mb-3">
                <h6>Brand / Model:</h6>
                <p>{viewProduct.BrandModel}</p>
              </div>
              <div className="mb-3">
                <h6>Image:</h6>
                {viewProduct.ProductImage ? (
                  <img 
                    src={`https://api.avessecurity.com/uploads/${viewProduct.ProductImage}`} 
                    className="img-thumbnail rounded border-primary"
                    style={{ 
                      width: '200px', 
                      height: '200px', 
                      objectFit: 'cover',
                      borderWidth: '2px'
                    }} 
                    alt="Product"
                  />
                ) : (
                  <p>No Image Available</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemDetails;