import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyProducts, addProduct, deleteProduct, getFarmerOrders, updateOrderStatus, updateProduct, changePassword, updateProfile,hideProductBatch,unhideProductBatch } from '../services/api';

function FarmerDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', subCategory:'', price: '', quantity: '', description: '' });
  const [form, setForm] = useState({ name: '', category: 'Vegetables', subCategory:'', price: '', quantity: '', description: '' });
  const [message, setMessage] = useState('');
  const [viewingBatches, setViewingBatches] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Password Change States
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });

  // Bank receipt viewer state
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const token = localStorage.getItem('token');
  const [userName, setUserName] = useState(localStorage.getItem('name') || 'Farmer');
  const [profileName, setProfileName] = useState(localStorage.getItem('name') || '');
  const [profileEmail, setProfileEmail] = useState(localStorage.getItem('email') || '');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await getMyProducts(token);
      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await getFarmerOrders(token);
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddProduct = async () => {
  try {
    const name = localStorage.getItem('name');
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('category', form.category);
    formData.append('subCategory', form.subCategory || '');
    formData.append('price', form.price);
    formData.append('quantity', form.quantity);
    formData.append('description', form.description);
    formData.append('farmerName', name);
    if (form.image) formData.append('image', form.image);

    await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { authorization: token },
      body: formData
    });

    setMessage('Product added successfully!');
    setForm({ name: '', category: 'Vegetables', subCategory: '', price: '', quantity: '', description: '', image: null });
    fetchProducts();
    setTimeout(() => { setMessage(''); setActivePage('my-products'); }, 1500);
  } catch (err) {
    setMessage('Failed to add product.');
  }
};

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id, token);
        fetchProducts();
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product._id);
    setEditForm({
      name: product.name,
      category: product.category,
      subCategory: product.subCategory || '',
      price: product.price,
      quantity: product.quantity,
      description: product.description,
      image:product.image ||''
    });
  };

  const handleUpdate = async () => {
  try {
    const formData = new FormData();
    formData.append('name', editForm.name);
    formData.append('category', editForm.category);
    formData.append('subCategory', editForm.subCategory || '');
    formData.append('description', editForm.description);
    if (editForm.image && typeof editForm.image !== 'string') {
      formData.append('image', editForm.image);
    }

    await fetch(`http://localhost:5000/api/products/${editingProduct}`, {
      method: 'PUT',
      headers: { authorization: token },
      body: formData
    });

    setEditingProduct(null);
    fetchProducts();
  } catch (err) {
    console.log(err);
  }
};

  const handleHideBatch = async (productId, batchId) => {
    const reason = window.prompt('Please enter the reason for hiding this batch:');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('A reason is required to hide a batch.');
      return;
    }
    try {
      const res = await hideProductBatch(productId, batchId, reason, token);
      fetchProducts();
      setViewingBatches(res.data.product);
      alert('Batch hidden successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to hide batch.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ text: '', type: '' });

    if (!pwdCurrent || !pwdNew || !pwdConfirm) {
      setPwdMsg({ text: 'Please fill in all fields.', type: 'error' });
      return;
    }

    if (pwdNew !== pwdConfirm) {
      setPwdMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (pwdNew.length < 6) {
      setPwdMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    try {
      await changePassword({ currentPassword: pwdCurrent, newPassword: pwdNew }, token);
      setPwdMsg({ text: 'Password changed successfully! 🎉', type: 'success' });
      setPwdCurrent('');
      setPwdNew('');
      setPwdConfirm('');
    } catch (err) {
      setPwdMsg({
        text: err.response?.data?.message || 'Failed to change password. Please check your current password.',
        type: 'error'
      });
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });

    if (!profileName || !profileName.trim()) {
      setProfileMsg({ text: 'Name is required.', type: 'error' });
      return;
    }

    try {
      const res = await updateProfile({ name: profileName }, token);
      setProfileMsg({ text: 'Profile updated successfully! 🎉', type: 'success' });
      localStorage.setItem('name', res.data.name);
      setUserName(res.data.name);
      window.dispatchEvent(new Event('auth-change'));
    } catch (err) {
      setProfileMsg({
        text: err.response?.data?.message || 'Failed to update profile.',
        type: 'error'
      });
    }
  };

  const styles = {
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' },
    navbar: { background: '#2d5a27', color: 'white', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    navTitle: { fontSize: '20px', fontWeight: 'bold' },
    navRight: { display: 'flex', alignItems: 'center', gap: '15px' },
    logoutBtn: { background: '#e53935', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
    body: { display: 'flex', flex: 1 },
    sidebar: { width: '200px', background: '#1b5e20', color: 'white', padding: '20px' },
    sidebarTitle: { fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #ffffff30', paddingBottom: '10px', marginBottom: '15px' },
    sidebarItem: (active) => ({ padding: '10px', borderRadius: '8px', marginBottom: '5px', cursor: 'pointer', fontSize: '13px', background: active ? '#4caf50' : 'transparent' }),
    main: { flex: 1, padding: '25px', background: '#f5f5f5' },
    pageTitle: { fontSize: '22px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '20px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' },
    statCard: { background: 'white', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    statNum: { fontSize: '28px', fontWeight: 'bold', color: '#2d5a27' },
    statLabel: { fontSize: '12px', color: '#888', marginTop: '5px' },
    table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    th: { background: '#2d5a27', color: 'white', padding: '12px', textAlign: 'left', fontSize: '13px' },
    td: { padding: '12px', borderBottom: '1px solid #eee', fontSize: '13px' },
    formCard: { background: 'white', borderRadius: '10px', padding: '25px', maxWidth: '600px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' },
    input: { width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px', boxSizing: 'border-box' },
    textarea: { width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px', height: '80px', boxSizing: 'border-box' },
    btnGreen: { background: '#2d5a27', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
    btnOutline: { background: 'white', color: '#2d5a27', border: '2px solid #2d5a27', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
    btnRed: { background: '#e53935', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
    btnBlue: { background: '#1976d2', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
    btnPurple: { background: '#4b8d4f', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
    successMsg: { background: '#e8f5e9', color: '#2d5a27', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px' },
    emptyMsg: { textAlign: 'center', color: '#999', padding: '40px', fontSize: '14px' },
    formCard: { background: 'white', borderRadius: '10px', padding: '30px', maxWidth: '500px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' },
input: { width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px', boxSizing: 'border-box' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalBox: { background: 'white', borderRadius: '12px', padding: '25px', width: '550px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    closeBtn: { background: '#eee', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px' },
  };

  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'add-product', label: '➕ Add Product' },
    { id: 'my-products', label: '📦 My Products' },
    { id: 'orders', label: '📋 Orders' },
    { id: 'profile-settings', label: '👤 Profile Settings' },
  ];

const getPriceDisplay = (product) => {
  if (!product.batches || product.batches.length === 0) {
    return `Rs. ${product.price}/kg`;
  }
  const activeBatches = product.batches.filter(b => b.quantity > 0 && !b.isHidden);
  if (activeBatches.length === 0) {
    return `Rs. ${product.price}/kg`;
  }
  const prices = activeBatches.map(b => b.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (minPrice === maxPrice) {
    return `Rs. ${minPrice}/kg`;
  }
  return `Rs. ${minPrice} - ${maxPrice}/kg`;
};


const getStatusBadge = (status) => {
  const config = {
    pending: { bg: '#fff3e0', color: '#e65100', label: '⏳ Pending Approval' },
    approved: { bg: '#e8f5e9', color: '#2d5a27', label: '✅ Approved' },
    rejected: { bg: '#ffebee', color: '#c62828', label: '❌ Rejected' },
  };
  const c = config[status] || config.approved; // fallback for legacy products without status
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
      background: c.bg, color: c.color
    }}>
      {c.label}
    </span>
  );
};
  // Format delivery address whether it's an object or a legacy string
  const formatAddress = (addr) => {
    if (!addr) return '-';
    if (typeof addr === 'object') {
      return `${addr.addressLine1 || ''}, ${addr.city || ''}, ${addr.district || ''}`;
    }
    return addr;
  };

  const filteredMyProducts = products.filter(p => {
  const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (p.subCategory && p.subCategory.toLowerCase().includes(searchQuery.toLowerCase()));
  const matchCategory = filterCategory === 'All' || p.category === filterCategory;
  return matchSearch && matchCategory;
});

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navTitle}>🌱 GreenRoot</div>
        <div style={styles.navRight}>
          <span style={{ fontSize: '14px' }}>👤 {userName}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={styles.body}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitle}>🧑‍🌾 Farmer Menu</div>
          {menuItems.map(item => (
            <div key={item.id} style={styles.sidebarItem(activePage === item.id)} onClick={() => setActivePage(item.id)}>
              {item.label}
            </div>
          ))}
        </div>

        <div style={styles.main}>
          {/* Dashboard */}
          {activePage === 'dashboard' && (
            <div>
              <div style={styles.pageTitle}>Welcome, {userName}! 👋</div>
              <div style={{ ...styles.statsGrid, gridTemplateColumns: 'repeat(4, 1fr)' }}>
  <div style={styles.statCard}>
    <div style={styles.statNum}>{products.length}</div>
    <div style={styles.statLabel}>Total Products</div>
  </div>
  <div style={styles.statCard}>
    <div style={styles.statNum}>{orders.length}</div>
    <div style={styles.statLabel}>Active Orders</div>
  </div>
  <div style={styles.statCard}>
    <div style={styles.statNum}>Rs. {orders.reduce((a, o) => a + o.totalAmount, 0)}</div>
    <div style={styles.statLabel}>Total Sales</div>
  </div>
  <div
    style={{ ...styles.statCard, cursor: 'pointer' }}
    onClick={() => setActivePage('my-products')}
  >
    <div style={{ ...styles.statNum, color: '#1976d2' }}>
      {products.filter(p => p.status === 'pending').length}
    </div>
    <div style={styles.statLabel}>🔔 Pending Approval</div>
  </div>
</div>

              {/* Low Stock Alert */}
              {products.filter(p => p.quantity <= 10).length > 0 && (
                <div style={{ background: '#fff3e0', border: '1px solid #ff9800', borderRadius: '10px', padding: '15px', marginBottom: '20px' }}>
                  <h3 style={{ color: '#e65100', marginBottom: '10px', fontSize: '16px' }}>⚠️ Low Stock Alert!</h3>
                  {products.filter(p => p.quantity <= 10).map(p => (
                    <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'white', borderRadius: '8px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
          {p.name}{p.subCategory ? ` (${p.subCategory})` : ''}
        </span>
                      <span style={{ fontSize: '13px', color: '#e53935', fontWeight: 'bold' }}>Only {p.quantity} kg left!</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '15px' }}>My Products</div>
              {products.length === 0 ? (
                <div style={styles.emptyMsg}>No products yet. Click "➕ Add Product" to add your first product!</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>{['Product Id','Product','Sub-Category', 'Category', 'Price', 'Qty'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={i}>
                        <td style={{ ...styles.td, fontFamily: 'monospace', color: '#2d5a27', fontWeight: 'bold' }}>
          #{p._id.toString().slice(-6).toUpperCase()}
        </td>
                        <td style={styles.td}>{p.name}</td>
                        <td style={styles.td}>{p.subCategory || '-'}</td>
                        <td style={styles.td}>{p.category}</td>
                        <td style={styles.td}>{getPriceDisplay(p)}</td>
                        <td style={styles.td}>{p.quantity} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Add Product */}
          {activePage === 'add-product' && (
            <div>
              <div style={styles.pageTitle}>➕ Add New Product</div>
              {message && <div style={styles.successMsg}>{message}</div>}
              <div style={styles.formCard}>
                <div style={styles.formRow}>
                  <div>
                    <label style={styles.label}>Product Name</label>
                    <input name="name" value={form.name} onChange={handleChange} style={styles.input} placeholder="e.g. Tomatoes" />
                  </div>
                  <div>
                    <label style={styles.label}>Category</label>
                    <select name="category" value={form.category} onChange={handleChange} style={styles.input}>
                      <option>Vegetables</option>
                      <option>Fruits</option>
                      <option>Grains</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Sub-category</label>
                    <input name="subCategory" value={form.subCategory} onChange={handleChange} style={styles.input} placeholder="e.g. Red Apple, Green Beans" />
                  </div>
                  <div>
                    <label style={styles.label}>Price (Rs. per kg)</label>
                    <input name="price" value={form.price} onChange={handleChange} style={styles.input} placeholder="e.g. 150" />
                  </div>
                  <div>
                    <label style={styles.label}>Quantity (kg)</label>
                    <input name="quantity" value={form.quantity} onChange={handleChange} style={styles.input} placeholder="e.g. 50" />
                  </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label style={styles.label}>Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} style={styles.textarea} placeholder="Enter product description..."></textarea>
                </div>

                <div style={{ marginTop: '15px' }}>
  <label style={styles.label}>Product Image</label>
  <input
    type="file"
    accept="image/*"
    onChange={e => setForm({ ...form, image: e.target.files[0] })}
    style={{ ...styles.input, padding: '8px' }}
  />
  {form.image && (
    <div style={{ marginTop: '10px' }}>
      <img
        src={URL.createObjectURL(form.image)}
        alt="preview"
        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
      />
    </div>
  )}
</div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button style={styles.btnGreen} onClick={handleAddProduct}>✅ Add Product</button>
                  <button style={styles.btnOutline} onClick={() => setActivePage('dashboard')}>❌ Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* My Products */}
          {activePage === 'my-products' && (
            <div>
              <div style={styles.pageTitle}>📦 My Products</div>


              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
  <input
    value={searchQuery}
    onChange={e => setSearchQuery(e.target.value)}
    placeholder="🔍 Search by product name or sub-category..."
    style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px' }}
  />
  <select
    value={filterCategory}
    onChange={e => setFilterCategory(e.target.value)}
    style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px' }}
  >
    <option>All</option>
    <option>Vegetables</option>
    <option>Fruits</option>
    <option>Grains</option>
  </select>
</div>

{products.some(p => p.status === 'pending') && (
  <div style={{ background: '#fff3e0', border: '1px solid #ff9800', borderRadius: '10px', padding: '12px', marginBottom: '15px', fontSize: '13px', color: '#e65100' }}>
    ⏳ Some of your products are awaiting admin approval and won't appear to customers until approved.
  </div>
)}
              {/* Edit Form */}
              {editingProduct && (
                <div style={{ background: 'white', borderRadius: '10px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ color: '#2d5a27', marginBottom: '15px' }}>✏️ Edit Product</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={styles.label}>Product Name</label>
                      <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={styles.input} />
                    </div>
                    <div>
                      <label style={styles.label}>Category</label>
                      <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={styles.input}>
                        <option>Vegetables</option>
                        <option>Fruits</option>
                        <option>Grains</option>
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>Sub-category</label>
                      <input value={editForm.subCategory} onChange={e => setEditForm({ ...editForm, subCategory: e.target.value })} style={styles.input} placeholder="e.g. Red Apple, Green Beans" />
                    </div>
                    <div>
                      <label style={styles.label}>Price (Rs. per kg)</label>
                      <input value={editForm.price} disabled style={{ ...styles.input, background: '#f5f5f5', color: '#999' }} />
                      <p style={{ fontSize: '11px', color: '#999', marginTop: '3px' }}>To restock, use "Add Product" with the same name</p>
                    </div>
                    <div>
                      <label style={styles.label}>Quantity (kg)</label>
                      <input value={editForm.quantity} disabled style={{ ...styles.input, background: '#f5f5f5', color: '#999' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <label style={styles.label}>Description</label>
                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={styles.textarea}></textarea>
                  </div>

                  <div style={{ marginTop: '15px' }}>
  <label style={styles.label}>Product Image</label>
  {editForm.image && typeof editForm.image === 'string' && (
    <div style={{ marginBottom: '10px' }}>
      <img
        src={`http://localhost:5000${editForm.image}`}
        alt="current"
        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
      />
      <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>Current image - upload new one to replace</p>
    </div>
  )}
  <input
    type="file"
    accept="image/*"
    onChange={e => setEditForm({ ...editForm, image: e.target.files[0] })}
    style={{ ...styles.input, padding: '8px' }}
  />
  {editForm.image && typeof editForm.image !== 'string' && (
    <div style={{ marginTop: '10px' }}>
      <img
        src={URL.createObjectURL(editForm.image)}
        alt="preview"
        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
      />
    </div>
  )}
</div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button style={styles.btnGreen} onClick={handleUpdate}>✅ Update Product</button>
                    <button style={styles.btnOutline} onClick={() => setEditingProduct(null)}>❌ Cancel</button>
                  </div>
                </div>
              )}

              {products.length === 0 ? (
                <div style={styles.emptyMsg}>No products yet. Click "➕ Add Product" to add your first product!</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>{['Product Id','Image','Product', 'Category', 'Sub-Category', 'Price', 'Qty','Status', 'Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredMyProducts.map((p) => (
                      <tr key={p._id}>
                        <td style={{ ...styles.td, fontFamily: 'monospace', color: '#2d5a27', fontWeight: 'bold' }}>
  #{p._id.toString().slice(-6).toUpperCase()}
</td>
<td style={styles.td}>
  {p.image ? (
    <img
      src={`http://localhost:5000${p.image}`}
      alt={p.name}
      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
    />
  ) : (
    <span style={{ fontSize: '30px' }}>
      {p.category === 'Fruits' ? '🍎' : p.category === 'Grains' ? '🌾' : '🥦'}
    </span>
  )}
</td>
<td style={styles.td}>{p.name}</td>
                        <td style={styles.td}>{p.category}</td>
                        <td style={styles.td}>{p.subCategory || '-'}</td>
                        <td style={styles.td}>{getPriceDisplay(p)}</td>
                        <td style={styles.td}>{p.quantity} kg</td>
                        <td style={styles.td}>{getStatusBadge(p.status)}</td>
                        <td style={styles.td}>
                        <button style={styles.btnPurple} onClick={() => setViewingBatches(p)}>📊 Stock History</button>{' '}
                        <button style={styles.btnBlue} onClick={() => handleEdit(p)}>Edit</button>{' '}
                        <button style={styles.btnRed} onClick={() => handleDelete(p._id)}>Delete</button>
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Stock History Modal */}
              {viewingBatches && (
                <div style={styles.modalOverlay} onClick={() => setViewingBatches(null)}>
                  <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
                    <div style={styles.modalHeader}>
                      <h3 style={{ color: '#2d5a27' }}>📊 Stock History — {viewingBatches.name}</h3>
                      <button style={styles.closeBtn} onClick={() => setViewingBatches(null)}>✕</button>
                    </div>

                    {(!viewingBatches.batches || viewingBatches.batches.length === 0) ? (
                      <div style={styles.emptyMsg}>No batch history available for this product.</div>
                    ) : (
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            {['Batch #', 'Added Date', 'Price/kg', 'Remaining', 'Status', 'Action'].map(h => (
  <th key={h} style={styles.th}>{h}</th>
))}
                          </tr>
                        </thead>
                        <tbody>
                          {viewingBatches.batches.map((b, idx) => (
  <tr key={idx} style={{ opacity: b.hidden ? 0.5 : 1 }}>
    <td style={styles.td}>{idx + 1}</td>
    <td style={styles.td}>{new Date(b.addedDate).toLocaleDateString()}</td>
    <td style={styles.td}>Rs. {b.price}</td>
    <td style={styles.td}>{b.quantity} kg</td>
    <td style={styles.td}>
      <span style={{
        padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
        background: b.hidden ? '#f5f5f5' : b.quantity > 0 ? '#e8f5e9' : '#ffebee',
        color: b.hidden ? '#999' : b.quantity > 0 ? '#2d5a27' : '#c62828'
      }}>
        {b.hidden ? '🚫 Hidden' : b.quantity > 0 ? 'Active' : 'Sold Out'}
      </span>
    </td>
    <td style={styles.td}>
      {b.hidden ? (
        <div>
    <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic', marginBottom: '5px' }}>
      Reason: {b.hideReason || '-'}
    </div>
    <button
      style={{ background: '#2d5a27', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' }}
      onClick={async () => {
        if (!window.confirm('Unhide this batch?')) return;
        try {
          await unhideProductBatch(viewingBatches._id, b._id, token);
          const updated = await getMyProducts(token); // Admin: axios.get
          const updatedProduct = updated.data.find(p => p._id === viewingBatches._id);
          if (updatedProduct) setViewingBatches(updatedProduct);
          fetchProducts();
        } catch (err) {
          alert('Failed to unhide batch');
        }
      }}
    >
      ↩️ Unhide
    </button>
  </div>
      ) : (
        <button
          style={{ background: '#e53935', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' }}
          onClick={async () => {
            const reason = window.prompt('Enter reason for hiding this batch:');
            if (reason === null) return;
            if (!reason.trim()) { alert('Please enter a reason!'); return; }
            try {
              await hideProductBatch(viewingBatches._id, b._id, { hideReason: reason }, token);
              const updated = await getMyProducts(token);
              const updatedProduct = updated.data.find(p => p._id === viewingBatches._id);
              if (updatedProduct) setViewingBatches(updatedProduct);
              fetchProducts();
            } catch (err) {
              alert('Failed to hide batch');
            }
          }}
        >
          🚫 Hide
        </button>
      )}
    </td>
  </tr>
))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Orders */}
          {activePage === 'orders' && (
            <div>
              <div style={styles.pageTitle}>📋 Orders</div>
              {orders.length === 0 ? (
                <div style={styles.emptyMsg}>No orders yet!</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Order ID','Product', 'Sub Category', 'Consumer', 'Qty', 'Total', 'Address', 'Status', 'Update'].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o._id}>
                        <td style={{ ...styles.td, fontFamily: 'monospace', color: '#2d5a27', fontWeight: 'bold' }}>#{o._id.toString().slice(-6).toUpperCase()}</td>
                        <td style={styles.td}>{o.productName}</td>
                        <td style={styles.td}>{o.subCategory || '-'}</td>
                        <td style={styles.td}>{o.consumerName}</td>
                        <td style={styles.td}>{o.quantity} kg</td>
                        <td style={styles.td}>
                          Rs. {o.totalAmount - (o.deliveryFee || 0)}
                          {o.paymentMethod === 'bank' && o.bankReceipt && (
                            <div style={{ marginTop: '5px' }}>
                              <button 
                                onClick={() => setViewingReceipt(o.bankReceipt)}
                                style={{ background: '#1976d2', color: 'white', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                              >
                                📄 View Slip
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={styles.td}>{formatAddress(o.deliveryAddress)}</td>
                        <td style={styles.td}>
                          <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
                            background: o.status === 'delivered' ? '#e8f5e9' : o.status === 'cancelled' ? '#ffebee' : '#fff3e0',
                            color: o.status === 'delivered' ? '#2d5a27' : o.status === 'cancelled' ? '#c62828' : '#e65100' }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <select defaultValue={o.status}
                            onChange={async (e) => {
                              await updateOrderStatus(o._id, e.target.value, token);
                              fetchOrders();
                            }}
                            style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '5px', fontSize: '12px' }}>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Profile Settings */}
          {activePage === 'profile-settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={styles.pageTitle}>👤 Profile Settings</div>
              
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Profile Details Form */}
                <div style={{ ...styles.formCard, flex: 1, minWidth: '300px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '15px' }}>Update Profile Details</h3>
                  {profileMsg.text && (
                    <div style={{
                      background: profileMsg.type === 'success' ? '#e8f5e9' : '#ffebee',
                      color: profileMsg.type === 'success' ? '#2d5a27' : '#c62828',
                      padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: 'bold'
                    }}>
                      {profileMsg.text}
                    </div>
                  )}
                  <form onSubmit={handleUpdateProfile}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={styles.label}>Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        style={styles.input}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={styles.label}>Email (Cannot be changed)</label>
                      <input
                        type="email"
                        value={profileEmail}
                        disabled
                        style={{ ...styles.input, background: '#f5f5f5', color: '#777', cursor: 'not-allowed' }}
                      />
                    </div>
                    <button type="submit" style={styles.btnGreen}>
                      Save Changes
                    </button>
                  </form>
                </div>

                {/* Change Password Form */}
                <div style={{ ...styles.formCard, flex: 1, minWidth: '300px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '15px' }}>Change Password</h3>
                  {pwdMsg.text && (
                    <div style={{
                      background: pwdMsg.type === 'success' ? '#e8f5e9' : '#ffebee',
                      color: pwdMsg.type === 'success' ? '#2d5a27' : '#c62828',
                      padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: 'bold'
                    }}>
                      {pwdMsg.text}
                    </div>
                  )}
                  <form onSubmit={handleChangePassword}>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={styles.label}>Current Password</label>
                      <input
                        type="password"
                        value={pwdCurrent}
                        onChange={e => setPwdCurrent(e.target.value)}
                        style={styles.input}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <label style={styles.label}>New Password</label>
                      <input
                        type="password"
                        value={pwdNew}
                        onChange={e => setPwdNew(e.target.value)}
                        style={styles.input}
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={styles.label}>Confirm New Password</label>
                      <input
                        type="password"
                        value={pwdConfirm}
                        onChange={e => setPwdConfirm(e.target.value)}
                        style={styles.input}
                        placeholder="Confirm new password"
                      />
                    </div>
                    <button type="submit" style={styles.btnGreen}>
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* View Bank Slip Receipt Modal */}
      {viewingReceipt && (
        <div style={styles.modalOverlay} onClick={() => setViewingReceipt(null)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ color: '#2d5a27' }}>📄 Bank Slip Receipt</h3>
              <button style={styles.closeBtn} onClick={() => setViewingReceipt(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <img 
                src={`http://localhost:5000${viewingReceipt}`} 
                alt="Bank slip" 
                style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }} 
              />
            </div>
            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              <button style={styles.btnGreen} onClick={() => setViewingReceipt(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmerDashboard;