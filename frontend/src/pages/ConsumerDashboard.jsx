import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, placeOrder, getMyOrders, updateOrderStatus, changePassword, updateProfile } from '../services/api';

function ConsumerDashboard({ cartItems, setCartItems }) {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orders, setOrders] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState({
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  district: '',
  postalCode: ''
});

  // Password Change States
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });

  // Profile Settings States
  const [profileName, setProfileName] = useState(localStorage.getItem('name') || '');
  const [profileEmail, setProfileEmail] = useState(localStorage.getItem('email') || '');
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [userName, setUserName] = useState(localStorage.getItem('name') || 'Consumer');

  // Order Search/Filter States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState('All');

const districtPostalMap = {
  "Colombo": "10000", "Gampaha": "11000", "Kalutara": "12000",
  "Kandy": "20000", "Matale": "21000", "Nuwara Eliya": "22000",
  "Galle": "80000", "Matara": "81000", "Hambantota": "82000",
  "Jaffna": "40000", "Kilinochchi": "44000", "Mannar": "41000",
  "Mullaitivu": "42000", "Vavuniya": "43000", "Trincomalee": "31000",
  "Batticaloa": "30000", "Ampara": "32000", "Kurunegala": "60000",
  "Puttalam": "61000", "Anuradhapura": "50000", "Polonnaruwa": "51000",
  "Badulla": "90000", "Monaragala": "91000", "Ratnapura": "70000",
  "Kegalle": "71000"
};

const districts = Object.keys(districtPostalMap);

const handleAddressChange = (e) => {
  setAddress({ ...address, [e.target.name]: e.target.value });
};

const handleDistrictChange = (e) => {
  const selectedDistrict = e.target.value;
  setAddress({
    ...address,
    district: selectedDistrict,
    postalCode: districtPostalMap[selectedDistrict] || ''
  });
};

const validateAddress = () => {
  if (!address.fullName.trim()) return 'Please enter your full name!';
  if (!/^0\d{9}$/.test(address.phone)) return 'Please enter a valid 10-digit phone number starting with 0!';
  if (!address.addressLine1.trim()) return 'Please enter Address Line 1!';
  if (!address.city.trim()) return 'Please enter your city!';
  if (!address.district) return 'Please select a district!';
  if (!/^\d{5}$/.test(address.postalCode)) return 'Postal code is invalid!';
  return '';
};
  const [orderMsg, setOrderMsg] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await getAllProducts();
      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await getMyOrders(token);
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

// FIFO-aware price calculator - mirrors backend batch deduction logic
const calculateBatchPrice = (product, qty) => {
  if (!product.batches || product.batches.length === 0) {
    return product.price * qty;
  }
  let remaining = qty;
  let total = 0;
  for (const batch of product.batches) {
    if (remaining <= 0) break;
    if (batch.quantity <= 0) continue;
    if (batch.hidden) continue; // Skip hidden batches
    const take = Math.min(batch.quantity, remaining);
    total += take * batch.price;
    remaining -= take;
  }
  return total;
};

  const handleBuy = async () => {
    if (selectedProduct.quantity === 0) {
      setOrderMsg('Product is currently out of stock!');
      return;
    }
    if (quantity < 1) {
      setOrderMsg('Please enter a valid quantity!');
      return;
    }
    if (Number(quantity) > selectedProduct.quantity) {
      setOrderMsg('Not enough stock available!');
      return;
    }

    const errorMsg = validateAddress();
    if (errorMsg) {
      setOrderMsg(errorMsg);
      return;
    }

    setOrderMsg('');

    const productTotal = calculateBatchPrice(selectedProduct, Number(quantity));
    const DELIVERY_FEE = 450;

    navigate('/payment', {
      state: {
        productId: selectedProduct._id,
        productName: selectedProduct.name,
        price: selectedProduct.price,
        quantity: Number(quantity),
        deliveryAddress: address,
        consumerName: localStorage.getItem('name'),
        totalAmount: productTotal + DELIVERY_FEE,
        farmerId: selectedProduct.farmer,
        farmerName: selectedProduct.farmerName,
        token: token
      }
    });
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || p.category === category;
    return matchSearch && matchCategory;
  });

  const filteredOrders = orders.filter(o => {
    const orderIdShort = o._id.toString().slice(-6).toUpperCase();
    const matchesSearch = o.productName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          orderIdShort.includes(orderSearch.toUpperCase());
    const matchesStatus = orderFilterStatus === 'All' || o.status.toLowerCase() === orderFilterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

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
    searchBar: { display: 'flex', gap: '10px', marginBottom: '20px' },
    searchInput: { flex: 1, border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px' },
    searchSelect: { border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px' },
    productGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' },
    productCard: { background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer' },
    productImg: { background: '#c8e6c9', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px' },
    productInfo: { padding: '15px' },
    productName: { fontWeight: 'bold', fontSize: '15px', marginBottom: '5px' },
    productFarmer: { fontSize: '12px', color: '#999', marginBottom: '8px' },
    productPrice: { color: '#2d5a27', fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' },
    btnGreen: { background: '#2d5a27', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', width: '100%' },
    btnBack: { background: '#f5f5f5', color: '#333', border: '1px solid #ddd', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
    detailCard: { background: 'white', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    detailImg: { background: '#c8e6c9', height: '200px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', marginBottom: '20px' },
    emptyMsg: { textAlign: 'center', color: '#999', padding: '40px', fontSize: '14px' },
    formCard: { background: 'white', borderRadius: '10px', padding: '30px', maxWidth: '500px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
label: { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '5px' },
input: { width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px', boxSizing: 'border-box' },
    table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    th: { background: '#2d5a27', color: 'white', padding: '12px 15px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold' },
    td: { padding: '12px 15px', borderBottom: '1px solid #eee', fontSize: '13px', verticalAlign: 'middle' },
  };

  const getEmoji = (category) => {
    if (category === 'Fruits') return '🍎';
    if (category === 'Grains') return '🌾';
    return '🥦';
  };

  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'browse', label: '🛍️ Browse Products' },
    { id: 'orders', label: '📋 My Orders' },
    { id: 'profile-settings', label: '👤 Profile Settings' },
  ];

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navTitle}>🌱 GreenRoot</div>
        <div style={styles.navRight}>
  <span style={{ fontSize: '14px' }}>👤 {userName}</span>
  <span onClick={() => navigate('/cart')}
    style={{ cursor: 'pointer', fontSize: '14px', background: '#4caf50', padding: '6px 12px', borderRadius: '20px' }}>
    🛒 Cart {cartItems.length > 0 && `(${cartItems.length})`}
  </span>
  <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
</div>
      </nav>

      <div style={styles.body}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitle}>🛒 Consumer Menu</div>
          {menuItems.map(item => (
            <div key={item.id} style={styles.sidebarItem(activePage === item.id)}
              onClick={() => { setActivePage(item.id); setSelectedProduct(null); }}>
              {item.label}
            </div>
          ))}
        </div>

        <div style={styles.main}>
          {/* Dashboard */}
          {activePage === 'dashboard' && (
            <div>
              <div style={styles.pageTitle}>Welcome, {userName}! 👋</div>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statNum}>{products.length}</div>
                  <div style={styles.statLabel}>Available Products</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNum}>{orders.length}</div>
                  <div style={styles.statLabel}>My Orders</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statNum}>Rs. {orders.reduce((a, o) => a + o.totalAmount, 0)}</div>
                  <div style={styles.statLabel}>Total Spent</div>
                </div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '15px' }}>Available Products</div>
              <div style={styles.productGrid}>
                {products.map(p => (
  <div key={p._id} style={styles.productCard}>
    <div
  style={styles.productImg}
  onClick={() => {
    setSelectedProduct(p);
    setActivePage('detail');
  }}
>
  {p.image ? (
    <img
      src={`http://localhost:5000${p.image}`}
      alt={p.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
    />
  ) : (
    getEmoji(p.category)
  )}
</div>

    <div style={styles.productInfo}>
      <div style={styles.productName}>{p.name}</div>
      {p.subCategory && (
    <div style={{ fontSize: '20px', color: '#777', marginBottom: '5px' }}>
      🏷️ {p.subCategory}
    </div>
  )}
      <div style={styles.productFarmer}>🧑‍🌾 {p.farmerName}</div>
      
      <div style={{ fontSize: '12px', marginBottom: '8px', color: p.quantity <= 10 ? '#e53935' : '#777' }}>
  📦 {p.quantity > 0 ? `Available:  ${p.quantity} kg` : 'Out of Stock'}
  {p.quantity > 0 && p.quantity <= 10 && ' ⚠️ Low Stock'}
</div>
<div style={styles.productPrice}>Rs. {p.price} for 1kg</div>

      <button
        style={styles.btnGreen}
        onClick={() => {
          setSelectedProduct(p);
          setActivePage('detail');
        }}
      >
        View Details
      </button>

      {p.quantity > 0 && (
        <button
          style={{
            ...styles.btnGreen,
            background: '#ff9800',
            marginTop: '5px'
          }}
          onClick={() => {
            const existing = cartItems.find(i => i._id === p._id);

            if (existing) {
              setCartItems(
                cartItems.map(i =>
                  i._id === p._id
                    ? { ...i, cartQuantity: i.cartQuantity + 1 }
                    : i
                )
              );
            } else {
              setCartItems([
                ...cartItems,
                { ...p, cartQuantity: 1 }
              ]);
            }

            alert(`${p.name} added to cart! 🛒`);
          }}
        >
          🛒 Add to Cart
        </button>
      )}
    </div>
  </div>
))}
              </div>
            </div>
          )}

          {/* Browse Products */}
          {activePage === 'browse' && (
            <div>
              <div style={styles.pageTitle}>🛍️ Browse Products</div>
              <div style={styles.searchBar}>
                <input style={styles.searchInput} placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)} />
                <select style={styles.searchSelect} value={category} onChange={e => setCategory(e.target.value)}>
                  <option>All</option>
                  <option>Vegetables</option>
                  <option>Fruits</option>
                  <option>Grains</option>
                </select>
              </div>
              {filteredProducts.length === 0 ? (
                <div style={styles.emptyMsg}>No products found!</div>
              ) : (
                <div style={styles.productGrid}>
                  {filteredProducts.map(p => (
                    <div key={p._id} style={styles.productCard}>
                     <div style={{ width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                      {p.image ? (
                        <img
                          src={`http://localhost:5000${p.image}`}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px' }}>
                          {getEmoji(p.category)}
                        </div>
                      )}
                    </div>
                      <div style={styles.productInfo}>
                        <div style={styles.productName}>{p.name}</div>
                        {p.subCategory && <div style={{ fontSize: '20px', color: '#777', marginBottom: '5px' }}>🏷️ {p.subCategory}</div>}
                        <div style={styles.productFarmer}>🧑‍🌾 {p.farmerName}</div>

                        
                        
                        <div style={{ fontSize: '12px', marginBottom: '8px', color: p.quantity <= 10 ? '#e53935' : '#777' }}>
  📦 {p.quantity > 0 ? `Available:  ${p.quantity} kg` : 'Out of Stock'}
  {p.quantity > 0 && p.quantity <= 10 && ' ⚠️ Low Stock'}
</div>
<div style={styles.productPrice}>Rs. {p.price} for 1kg</div>
                        <button style={styles.btnGreen} onClick={() => { setSelectedProduct(p); setActivePage('detail'); }}>View Details</button>
                      
                      {p.quantity > 0 && (
                        <button style={{ ...styles.btnGreen, background: '#ff9800', marginTop: '5px' }}
                          onClick={() => {
                            const existing = cartItems.find(i => i._id === p._id);
                            if (existing) {
                              setCartItems(cartItems.map(i => i._id === p._id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i));
                            } else {
                              setCartItems([...cartItems, { ...p, cartQuantity: 1 }]);
                            }
                            alert(`${p.name} added to cart! 🛒`);
                          }}>
                          🛒 Add to Cart
                        </button>
                      )}
                      
                      
                      
                      
                      
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Product Detail */}
          {activePage === 'detail' && selectedProduct && (
            <div>
              <div style={styles.pageTitle}>Product Details</div>
              <div style={styles.detailCard}>
                <div style={styles.detailImg}>
  {selectedProduct.image ? (
    <img
      src={`http://localhost:5000${selectedProduct.image}`}
      alt={selectedProduct.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
    />
  ) : (
    getEmoji(selectedProduct.category)
  )}
</div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '10px' }}>{selectedProduct.name}</h2>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '10px' }}>Rs. {selectedProduct.price}/kg</p>
                <p style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>🧑‍🌾 Farmer: {selectedProduct.farmerName}</p>
                <p style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>📦 Available: {selectedProduct.quantity} kg</p>
                <p style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>🏷️ Category: {selectedProduct.category}</p>
                {selectedProduct.subCategory && <p style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>🔖 Sub-category: {selectedProduct.subCategory}</p>}
                <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>{selectedProduct.description}</p>
                <div style={{ marginBottom: '15px' }}>
                  {orderMsg && <p style={{ color: '#2d5a27', fontWeight: 'bold', marginBottom: '10px' }}>{orderMsg}</p>}
                  <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Quantity (kg):</label>
                  <input type="number" value={quantity} min="1" max={selectedProduct.quantity}
                    onChange={e => setQuantity(e.target.value)}
                    style={{ width: '80px', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', fontSize: '13px', marginBottom: '10px' }} />
                  <br />
                  <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '5px', marginTop: '10px' }}>🚚 Delivery Address</label>

<input
  name="fullName"
  value={address.fullName}
  onChange={handleAddressChange}
  placeholder="Full Name"
  style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
/>

<input
  name="phone"
  value={address.phone}
  onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
  placeholder="Phone Number (07XXXXXXXX)"
  inputMode="numeric"
  style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
/>

<input
  name="addressLine1"
  value={address.addressLine1}
  onChange={handleAddressChange}
  placeholder="House No, Street"
  style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
/>

<input
  name="addressLine2"
  value={address.addressLine2}
  onChange={handleAddressChange}
  placeholder="Apartment, Landmark (optional)"
  style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
/>

<input
  name="city"
  value={address.city}
  onChange={handleAddressChange}
  placeholder="City / Town"
  style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
/>

<select
  name="district"
  value={address.district}
  onChange={handleDistrictChange}
  style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}
>
  <option value="">Select District</option>
  {districts.map(d => <option key={d} value={d}>{d}</option>)}
</select>

<input
  value={address.postalCode}
  readOnly
  placeholder="Postal Code (auto-filled)"
  style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box', background: '#f5f5f5', color: '#777' }}
/>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      style={{ 
                        ...styles.btnGreen, 
                        background: selectedProduct.quantity === 0 ? '#ccc' : '#2d5a27', 
                        cursor: selectedProduct.quantity === 0 ? 'not-allowed' : 'pointer' 
                      }} 
                      onClick={handleBuy} 
                      disabled={selectedProduct.quantity === 0}
                    >
                      {selectedProduct.quantity === 0 ? '🚫 Out of Stock' : '🛒 Buy Now'}
                    </button>
                    <button style={styles.btnBack} onClick={() => { setActivePage('browse'); setSelectedProduct(null); }}>← Back</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* My Orders */}
          {activePage === 'orders' && (
            <div>
              <div style={styles.pageTitle}>📋 My Orders</div>
              
              {/* Order History Search/Filter */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="🔍 Search by product name or Order ID..."
                  style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px' }}
                />
                <select
                  value={orderFilterStatus}
                  onChange={e => setOrderFilterStatus(e.target.value)}
                  style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '13px' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {filteredOrders.length === 0 ? (
                <div style={styles.emptyMsg}>No matching orders found.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        {['#', 'Order ID', 'Product','Sub Category', 'Farmer', 'Qty', 'Total', 'Address', 'Status', 'Date', 'Action'].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((o, i) => (
                        <tr key={o._id} style={{ background: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                          <td style={styles.td}>{i + 1}</td>
                          <td style={{ ...styles.td, fontFamily: 'monospace', color: '#2d5a27', fontWeight: 'bold' }}>#{o._id.toString().slice(-6).toUpperCase()}</td>
                          <td style={{ ...styles.td, fontWeight: 'bold' }}>{o.productName}</td>
                          <td style={styles.td}>{o.subCategory || '-'}</td>
                          <td style={styles.td}>🧑‍🌾 {o.farmerName}</td>
                          <td style={styles.td}>{o.quantity} kg</td>
                          <td style={styles.td}> Rs. {o.totalAmount - (o.deliveryFee || 0)} {o.deliveryFee > 0 && (
                            <div style={{ fontSize: '11px', color: '#999' }}>
                            </div>
                        )}
                          </td>
                          <td style={styles.td}>{typeof o.deliveryAddress === 'object' && o.deliveryAddress !== null ? (
                             <div style={{ lineHeight: '1.4' }}>
                               <div>{o.deliveryAddress.addressLine1}</div>
                               {o.deliveryAddress.addressLine2 && <div>{o.deliveryAddress.addressLine2}</div>}
                               <div>{o.deliveryAddress.city}, {o.deliveryAddress.district} {o.deliveryAddress.postalCode}</div>
                             </div>
                             ) : (
                               o.deliveryAddress || '-'
                             )}
                           </td>
                          <td style={styles.td}>
                            <span style={{
                              padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                              background: o.status === 'delivered' ? '#e8f5e9' : o.status === 'cancelled' ? '#ffebee' : o.status === 'processing' ? '#e3f2fd' : '#fff3e0',
                              color: o.status === 'delivered' ? '#2d5a27' : o.status === 'cancelled' ? '#c62828' : o.status === 'processing' ? '#1976d2' : '#e65100'
                            }}>
                              {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                            </span>
                          </td>
                          <td style={styles.td}>{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td style={styles.td}>
                            {o.status === 'pending' && (
                              <button onClick={async () => {
                                if (window.confirm('Cancel this order?')) {
                                  await updateOrderStatus(o._id, 'cancelled', token);
                                  fetchOrders();
                                }
                              }}
                                style={{ background: '#e53935', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
    </div>
  );
}

export default ConsumerDashboard;