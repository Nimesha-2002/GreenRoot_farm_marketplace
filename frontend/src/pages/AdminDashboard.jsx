import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAllOrders, getPendingProducts, updateProductStatus,hideProductBatch, unhideProductBatch } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [viewingBatches, setViewingBatches] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const token = localStorage.getItem('token');
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchProducts();
    fetchAllOrders();
    fetchPendingProducts();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { authorization: token }
      });
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const res = await getAllOrders(token);
      setAllOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchPendingProducts = async () => {
    try {
      const res = await getPendingProducts(token);
      setPendingProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleApprove = async (id) => {
    try {
      await updateProductStatus(id, 'approved', token);
      fetchPendingProducts();
      fetchProducts();
    } catch (err) {
      console.log(err);
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Reject this product? The farmer will need to resubmit it.')) {
      try {
        await updateProductStatus(id, 'rejected', token);
        fetchPendingProducts();
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:5000/api/auth/users/${id}`, {
          headers: { authorization: token }
        });
        fetchUsers();
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`, {
          headers: { authorization: token }
        });
        fetchProducts();
      } catch (err) {
        console.log(err);
      }
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

  const styles = {
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' },
    navbar: { background: '#2d5a27', color: 'white', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    navTitle: { fontSize: '20px', fontWeight: 'bold' },
    navRight: { display: 'flex', alignItems: 'center', gap: '15px' },
    logoutBtn: { background: '#e53935', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
    body: { display: 'flex', flex: 1 },
    sidebar: { width: '200px', background: '#1b5e20', color: 'white', padding: '20px' },
    sidebarTitle: { fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #ffffff30', paddingBottom: '10px', marginBottom: '15px' },
    sidebarItem: (active) => ({ padding: '10px', borderRadius: '8px', marginBottom: '5px', cursor: 'pointer', fontSize: '13px', background: active ? '#4caf50' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }),
    badgeCount: { background: '#e53935', color: 'white', borderRadius: '10px', fontSize: '11px', padding: '2px 7px', fontWeight: 'bold' },
    main: { flex: 1, padding: '25px', background: '#f5f5f5' },
    pageTitle: { fontSize: '22px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '20px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' },
    statCard: { background: 'white', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    statNum: { fontSize: '28px', fontWeight: 'bold', color: '#2d5a27' },
    statLabel: { fontSize: '12px', color: '#888', marginTop: '5px' },
    table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    th: { background: '#2d5a27', color: 'white', padding: '12px', textAlign: 'left', fontSize: '13px' },
    td: { padding: '12px', borderBottom: '1px solid #eee', fontSize: '13px' },
    btnRed: { background: '#e53935', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
    btnGreenSmall: { background: '#2d5a27', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
    btnPurple: { background: '#1b5e20', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
    badge: (role) => ({
      padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
      background: role === 'farmer' ? '#e8f5e9' : role === 'admin' ? '#fce4ec' : '#e3f2fd',
      color: role === 'farmer' ? '#2d5a27' : role === 'admin' ? '#c62828' : '#1976d2'
    }),
    emptyMsg: { textAlign: 'center', color: '#999', padding: '40px', fontSize: '14px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalBox: { background: 'white', borderRadius: '12px', padding: '25px', width: '550px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    closeBtn: { background: '#eee', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px' },
  };

  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'users', label: '👥 Manage Users' },
    { id: 'products', label: '📦 Manage Products' },
    { id: 'pending', label: '🔔 Pending Approvals', count: pendingProducts.length },
    { id: 'orders', label: '📋 All Orders' },
  ];

  const farmers = users.filter(u => u.role === 'farmer');
  const consumers = users.filter(u => u.role === 'consumer');

  const barData = [
    { name: 'Users', value: users.length },
    { name: 'Farmers', value: farmers.length },
    { name: 'Consumers', value: consumers.length },
    { name: 'Products', value: products.length },
    { name: 'Orders', value: allOrders.length },
  ];

  const pieData = [
    { name: 'Farmers', value: farmers.length || 1 },
    { name: 'Consumers', value: consumers.length || 1 },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length || 1 },
  ];

  const PIE_COLORS = ['#2d5a27', '#4caf50', '#81c784'];

  const lowStockProducts = products.filter(
    product => product.quantity <= 10
  );


  const filteredProducts = products.filter(p => {
  const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (p.subCategory && p.subCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
                       p.farmerName.toLowerCase().includes(searchQuery.toLowerCase());
  const matchCategory = filterCategory === 'All' || p.category === filterCategory;
  return matchSearch && matchCategory;
});
  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navTitle}>🌱 GreenRoot</div>
        <div style={styles.navRight}>
          <span style={{ fontSize: '14px' }}>⚙️ Admin</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={styles.body}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitle}>⚙️ Admin Menu</div>
          {menuItems.map(item => (
            <div key={item.id} style={styles.sidebarItem(activePage === item.id)} onClick={() => setActivePage(item.id)}>
              <span>{item.label}</span>
              {item.count > 0 && <span style={styles.badgeCount}>{item.count}</span>}
            </div>
          ))}
        </div>

        <div style={styles.main}>

          {/* Dashboard */}
          {activePage === 'dashboard' && (
            <div>
              <div style={styles.pageTitle}>⚙️ Admin Dashboard</div>

              {/* Stats Row 1 */}
              <div style={{ ...styles.statsGrid, gridTemplateColumns: 'repeat(4, 1fr)' }}>
  <div style={styles.statCard}>
    <div style={styles.statNum}>{users.length}</div>
    <div style={styles.statLabel}>Total Users</div>
  </div>
  <div style={styles.statCard}>
    <div style={styles.statNum}>{farmers.length}</div>
    <div style={styles.statLabel}>Total Farmers</div>
  </div>
  <div style={styles.statCard}>
    <div style={styles.statNum}>{consumers.length}</div>
    <div style={styles.statLabel}>Total Consumers</div>
  </div>
  <div
    style={{ ...styles.statCard, cursor: 'pointer' }}
    onClick={() => setActivePage('pending')}
  >
    <div style={{ ...styles.statNum, color: '#1976d2' }}>
      {pendingProducts.length}
    </div>
    <div style={styles.statLabel}>🔔 Pending Approvals</div>
  </div>
</div>

              {/* Stats Row 2 */}
<div style={{ ...styles.statsGrid, marginTop: '0' }}>
  <div style={styles.statCard}>
    <div style={styles.statNum}>{products.length}</div>
    <div style={styles.statLabel}>Total Products</div>
  </div>
  <div style={styles.statCard}>
    <div style={styles.statNum}>{allOrders.length}</div>
    <div style={styles.statLabel}>Total Orders</div>
  </div>
  <div style={styles.statCard}>
    <div style={styles.statNum}>Rs. {allOrders.reduce((a, o) => a + o.totalAmount, 0)}</div>
    <div style={styles.statLabel}>Total Revenue</div>
  </div>

  <div style={styles.statCard}>
    <div style={{ ...styles.statNum, color: '#e65100' }}>
      {lowStockProducts.length}
    </div>
    <div style={styles.statLabel}>Low Stock Products</div>
  </div>
</div>


              {pendingProducts.length > 0 && (
                <div
                  style={{
                    background: '#e3f2fd',
                    borderLeft: '5px solid #1976d2',
                    padding: '15px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActivePage('pending')}
                >
                  <h3 style={{ color: '#1976d2', marginBottom: '5px' }}>
                    🔔 {pendingProducts.length} Product(s) Awaiting Approval
                  </h3>
                  <p style={{ fontSize: '13px', color: '#555' }}>Click to review and approve new products from farmers.</p>
                </div>
              )}

              {lowStockProducts.length > 0 && (
                <div
                  style={{
                    background: '#fff3e0',
                    borderLeft: '5px solid #ff9800',
                    padding: '15px',
                    borderRadius: '10px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  <h3 style={{ color: '#e65100', marginBottom: '10px' }}>
                    ⚠️ Low Stock Products
                  </h3>

                  {lowStockProducts.map(product => (
                    <div key={product._id} style={{ marginBottom: '5px' }}>
                      <strong>{product.name}{product.subCategory ? ` (${product.subCategory})` : ''}</strong> by {product.farmerName}
                      {' '} - Only {product.quantity} kg remaining
                    </div>
                  ))}
                </div>
              )}

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>

                {/* Bar Chart */}
                <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ color: '#2d5a27', marginBottom: '15px', fontSize: '16px' }}>📊 System Overview</h3>
                  <ResponsiveContainer width="100%" height={270}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2d5a27" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ color: '#2d5a27', marginBottom: '15px', fontSize: '16px' }}>🥧 User Distribution</h3>
                  <ResponsiveContainer width="100%" height={270}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={PIE_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>
          )}

          {/* Manage Users */}
          {activePage === 'users' && (
            <div>
              <div style={styles.pageTitle}>👥 Manage Users</div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['User Id','Name', 'Email', 'Role', 'Joined', 'Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                <td style={{ ...styles.td, fontFamily: 'monospace', color: '#2d5a27', fontWeight: 'bold' }}>
                  #{u._id.toString().slice(-6).toUpperCase()}
                </td>
                <td style={styles.td}>{u.name}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}><span style={styles.badge(u.role)}>{u.role}</span></td>
                <td style={styles.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={styles.td}>
                  {u.role !== 'admin' && (
                    <button style={styles.btnRed} onClick={() => handleDeleteUser(u._id)}>Delete</button>
                  )}
                </td>
              </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Manage Products */}
          {activePage === 'products' && (
            <div>
              <div style={styles.pageTitle}>📦 Manage Products</div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Search by product, sub-category, or farmer..."
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
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Product Id','Image','Product','Sub-Category', 'Farmer', 'Category', 'Price', 'Qty', 'Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p._id}>
                      <td style={{ ...styles.td, fontFamily: 'monospace', color: '#2d5a27', fontWeight: 'bold' }}>#{p._id.toString().slice(-6).toUpperCase()}
                    </td>
                    <td style={styles.td}>
                        {p.image ? (
                          <img
                            src={`http://localhost:5000${p.image}`}
                            alt={p.name}
                            style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '30px' }}>
                            {p.category === 'Fruits' ? '🍎' : p.category === 'Grains' ? '🌾' : '🥦'}
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>{p.name}</td>
                      <td style={styles.td}>{p.subCategory || '-'}</td>
                      <td style={styles.td}>{p.farmerName}</td>
                      <td style={styles.td}>{p.category}</td>
                      <td style={styles.td}>{getPriceDisplay(p)}</td>
                      <td style={styles.td}>{p.quantity} kg</td>
                      <td style={styles.td}>
                        <button style={styles.btnPurple} onClick={() => setViewingBatches(p)}>📊 Stock History</button>{' '}
                        <button style={styles.btnRed} onClick={() => handleDeleteProduct(p._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
const updated = await axios.get('http://localhost:5000/api/products');
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
              const updated = await axios.get('http://localhost:5000/api/products');
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

          {/* Pending Approvals */}
          {activePage === 'pending' && (
            <div>
              <div style={styles.pageTitle}>🔔 Pending Approvals</div>
              {pendingProducts.length === 0 ? (
                <div style={styles.emptyMsg}>No products awaiting approval. 🎉</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Image','Product','Sub Category', 'Farmer', 'Category', 'Price', 'Qty', 'Description', 'Actions'].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProducts.map(p => (
                      <tr key={p._id}>
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
                        <td style={{ ...styles.td, fontWeight: 'bold' }}>{p.name}</td>
                        <td style={styles.td}>{p.subCategory ||'-'}</td>
                        <td style={styles.td}>{p.farmerName}</td>
                        <td style={styles.td}>{p.category}</td>
                        <td style={styles.td}>Rs. {p.price}/kg</td>
                        <td style={styles.td}>{p.quantity} kg</td>
                        <td style={{ ...styles.td, maxWidth: '200px' }}>{p.description || '-'}</td>
                        <td style={styles.td}>
                          <button style={styles.btnGreenSmall} onClick={() => handleApprove(p._id)}>✅ Approve</button>{' '}
                          <button style={styles.btnRed} onClick={() => handleReject(p._id)}>❌ Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* All Orders */}
          {activePage === 'orders' && (
            <div>
              <div style={styles.pageTitle}>📋 All Orders</div>
              {allOrders.length === 0 ? (
                <div style={styles.emptyMsg}>No orders yet!</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Order ID', 'Product','Sub Category', 'Consumer', 'Farmer', 'Qty', 'Total','Payment', 'Status', 'Date'].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.map(o => (
                      <tr key={o._id}>
                        <td style={{ ...styles.td, fontFamily: 'monospace', color: '#2d5a27', fontWeight: 'bold' }}>#{o._id.toString().slice(-6).toUpperCase()}</td>
                        <td style={styles.td}>{o.productName}</td>
                        <td style={styles.td}>{o.subCategory ||'-'}</td>
                        <td style={styles.td}>{o.consumerName}</td>
                        <td style={styles.td}>{o.farmerName}</td>
                        <td style={styles.td}>{o.quantity} kg</td>
                        <td style={styles.td}>Rs. {o.totalAmount}</td>
                        <td style={styles.td}>
                          {o.paymentMethod === 'card' ? '💳 Card' :
                          o.paymentMethod === 'bank' ? '🏦 Bank' :
                          o.paymentMethod === 'cod' ? '💵 COD' : '💳 Card'}
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
                        <td style={styles.td}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold',
                            background: o.status === 'delivered' ? '#e8f5e9' : o.status === 'cancelled' ? '#ffebee' : '#fff3e0',
                            color: o.status === 'delivered' ? '#2d5a27' : o.status === 'cancelled' ? '#c62828' : '#e65100'
                          }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={styles.td}>{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </div>

      {/* View Bank Slip Receipt Modal */}
      {viewingReceipt && (
        <div style={styles.modalOverlay} onClick={() => setViewingReceipt(null)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ color: '#2d5a27', margin: 0 }}>📄 Bank Slip Receipt</h3>
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

export default AdminDashboard;