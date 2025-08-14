import React, { useState, useEffect } from 'react';
import { FaChartBar, FaBoxOpen, FaFileAlt, FaSignOutAlt } from 'react-icons/fa';
import Reports from './Reports'; // adjust the path as needed
function Dashboard({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [categorySummary, setCategorySummary] = useState({});

const [form, setForm] = useState({
  name: '',
  category: '',
  price: '',
  quantity: '',
});

  const token = localStorage.getItem('token');

  useEffect(() => {
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProducts(data);

  // Sum quantity by category
const quantityByCategory = {};
data.forEach((product) => {
  const qty = parseInt(product.quantity, 10);
  if (quantityByCategory[product.category]) {
    quantityByCategory[product.category] += qty;
  } else {
    quantityByCategory[product.category] = qty;
  }
});
setCategorySummary(quantityByCategory);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  fetchProducts();
}, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct
      ? `http://localhost:5000/api/products/${editingProduct.id}`
      : 'http://localhost:5000/api/products';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        return alert(data.message || 'Error saving product');
      }

      if (editingProduct) {
        setProducts(
          products.map((p) => (p.id === editingProduct.id ? data.product : p))
        );
        setEditingProduct(null);
      } else {
        setProducts([data.product, ...products]);
      }

      setForm({ name: '', category: '', price: '', quantity: '' });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Error submitting product:', err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      quantity:product.quantity,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const openModal = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setEditingProduct(null);
    setForm({ name: '', category: '', price: '', quantity: '' });
  };
const handleProductIn = async (id) => {
  const amount = parseInt(prompt('Enter quantity to add:'), 10);
  if (isNaN(amount) || amount <= 0) return;

  try {
    const response = await fetch(`http://localhost:5000/api/products/${id}/in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();
    if (response.ok) {
      setProducts(products.map(p => (p.id === id ? data.product : p)));
    } else {
      alert(data.message || 'Error adding quantity');
    }
  } catch (err) {
    console.error('Product In Error:', err);
  }
};

const handleProductOut = async (id) => {
  const amount = parseInt(prompt('Enter quantity to remove:'), 10);
  if (isNaN(amount) || amount <= 0) return;

  try {
    const response = await fetch(`http://localhost:5000/api/products/${id}/out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();
    if (response.ok) {
      setProducts(products.map(p => (p.id === id ? data.product : p)));
    } else {
      alert(data.message || 'Error reducing quantity');
    }
  } catch (err) {
    console.error('Product Out Error:', err);
  }
};
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6  print:hidden">
        <h2 className="text-xl font-bold mb-6">Admin Menu</h2>
        <nav>
          <ul className="space-y-4">
  <li
    onClick={() => setActiveView('dashboard')}
    className={`flex items-center gap-2 cursor-pointer ${activeView === 'dashboard' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
  >
    <FaChartBar /> <span>Dashboard</span>
  </li>
  <li
    onClick={() => setActiveView('products')}
    className={`flex items-center gap-2 cursor-pointer ${activeView === 'products' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
  >
    <FaBoxOpen /> <span>Products</span>
  </li>
  <li
    onClick={() => setActiveView('reports')}
    className={`flex items-center gap-2 cursor-pointer ${activeView === 'reports' ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
  >
   <FaFileAlt /> <span>Reports</span>
  </li>
  <li className="flex items-center gap-2 text-gray-700">
    <FaSignOutAlt /> <button onClick={onLogout}>Logout</button>

  </li>
</ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 p-8">
  <div className="max-w-4xl mx-auto">
    {activeView === 'dashboard' && (
      <>
        <h1 className="text-3xl font-bold mb-6">Welcome, {user.username}!</h1>
        {/* Dashboard Overview Cards */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 shadow rounded">
            <p className="text-gray-500">Total Products</p>
            <h2 className="text-2xl font-bold">{products.length}</h2>
          </div>
          <div className="bg-white p-6 shadow rounded">
  <p className="text-gray-500 mb-2">Total Quantity by Category</p>
<ul className="text-sm text-gray-700 space-y-1">
  {Object.entries(categorySummary).map(([category, totalQty]) => (
    <li key={category}>
      <strong>{category}</strong>: {totalQty}
    </li>
  ))}
</ul>
</div>

        </div>
      </>
    )}

    {activeView === 'products' && (
      <>
        <h1 className="text-3xl font-bold mb-6">Products</h1>

        {/* Product Form */}
        <div className="bg-white shadow rounded p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingProduct ? 'Edit Product' : 'Register Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Product Name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              required
            />
            <input
              type="text"
              name="category"
              placeholder="Category"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
              required
            />

            <input
  type="number"
  name="quantity"
  placeholder="Quantity"
  value={form.quantity}
  onChange={handleChange}
  className="w-full border border-gray-300 p-2 rounded"
  required
/>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {editingProduct ? 'Update' : 'Add Product'}
              </button>
              {editingProduct && (
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Product List */}
        <div className="bg-white shadow rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Product List</h2>
          {products.length === 0 ? (
            <p className="text-gray-500">No products added yet.</p>
          ) : (
            <ul className="space-y-2">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex justify-between items-center border-b py-2"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <span className="text-sm text-gray-500">
                    {product.category} - ${product.price}
</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(product)}
                      className="text-blue-500 hover:underline"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-yellow-500 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                    <button
  onClick={() => handleProductIn(product.id)}
  className="text-green-600 hover:underline"
>
  In
</button>
<button
  onClick={() => handleProductOut(product.id)}
  className="text-purple-600 hover:underline"
>
  Out
</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </>
    )}

    {/* {activeView === 'reports' && (
      <>
        <h1 className="text-3xl font-bold mb-6">Reports</h1>
        <div className="bg-white shadow rounded p-6">
          <p className="text-gray-500">Report feature coming soon...</p>
        </div>
      </>
    )} */}
    {activeView === 'reports' && <Reports token={token} />}
  </div>
</main>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          Product {editingProduct ? 'updated' : 'added'} successfully!
        </div>
      )}

      {/* View Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Product Details</h2>
            <p><strong>Name:</strong> {selectedProduct.name}</p>
            <p><strong>Category:</strong> {selectedProduct.category}</p>
            <p><strong>Price:</strong> ${selectedProduct.price}</p>
            <p><strong>Quantity:</strong> {selectedProduct.quantity}</p>
            <button
              onClick={closeModal}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;