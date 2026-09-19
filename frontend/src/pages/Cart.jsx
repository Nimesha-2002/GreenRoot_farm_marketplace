import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Cart({ cartItems, setCartItems }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // FIFO-aware price calculator - mirrors backend batch deduction logic
  const calculateBatchPrice = (product, qty) => {
    if (!product.batches || product.batches.length === 0) {
      return product.price * qty; // fallback for old products without batches
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

  const handleQuantityChange = (id, newQty) => {
    const cartItem = cartItems.find(i => i._id === id);
    if (!cartItem) return;
    if (newQty < 1) return;

    if (newQty > cartItem.quantity) {
      alert(`Only ${cartItem.quantity}kg available`);
      return;
    }

    setCartItems(
      cartItems.map(i =>
        i._id === id ? { ...i, cartQuantity: newQty } : i
      )
    );
  };

  const handleRemove = (id) => {
    setCartItems(cartItems.filter(item => item._id !== id));
  };

  const totalAmount = cartItems.reduce(
    (total, item) => total + calculateBatchPrice(item, item.cartQuantity),
    0
  );


  const DELIVERY_FEE = 450;
const grandTotal = totalAmount + DELIVERY_FEE;


  // ----- Delivery Address State -----
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const districtPostalMap = {
    "Colombo": "10000",
    "Gampaha": "11000",
    "Kalutara": "12000",
    "Kandy": "20000",
    "Matale": "21000",
    "Nuwara Eliya": "22000",
    "Galle": "80000",
    "Matara": "81000",
    "Hambantota": "82000",
    "Jaffna": "40000",
    "Kilinochchi": "44000",
    "Mannar": "41000",
    "Mullaitivu": "42000",
    "Vavuniya": "43000",
    "Trincomalee": "31000",
    "Batticaloa": "30000",
    "Ampara": "32000",
    "Kurunegala": "60000",
    "Puttalam": "61000",
    "Anuradhapura": "50000",
    "Polonnaruwa": "51000",
    "Badulla": "90000",
    "Monaragala": "91000",
    "Ratnapura": "70000",
    "Kegalle": "71000"
  };

  const districts = Object.keys(districtPostalMap);

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleDistrictChange = (e) => {
    const selectedDistrict = e.target.value;
    setDistrict(selectedDistrict);
    if (districtPostalMap[selectedDistrict]) {
      setPostalCode(districtPostalMap[selectedDistrict]);
    } else {
      setPostalCode('');
    }
  };

  const validateAddress = () => {
    if (!fullName.trim()) return 'Please enter your full name!';
    if (!/^0\d{9}$/.test(phone)) return 'Please enter a valid 10-digit phone number starting with 0!';
    if (!addressLine1.trim()) return 'Please enter Address Line 1!';
    if (!city.trim()) return 'Please enter your city!';
    if (!district) return 'Please select a district!';
    if (!/^\d{5}$/.test(postalCode)) return 'Postal code is invalid!';
    return '';
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    if (!token) {
      alert('Please login as a consumer to checkout!');
      navigate('/login');
      return;
    }

    const errorMsg = validateAddress();
    if (errorMsg) {
      alert(errorMsg);
      return;
    }

    navigate('/payment', {
      state: {
        cartItems,
        totalAmount: grandTotal,
        consumerName: localStorage.getItem('name'),
        token,
        isCart: true,
        deliveryAddress: {
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          district,
          postalCode
        }
      }
    });
  };

  const getEmoji = (category) => {
    if (category === 'Fruits') return '🍎';
    if (category === 'Grains') return '🌾';
    return '🥦';
  };

  const styles = {
    container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', background: '#f5f5f5' },
    navbar: { background: '#2d5a27', color: 'white', padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    navTitle: { fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' },
    navRight: { display: 'flex', alignItems: 'center', gap: '15px', fontSize: '14px' },
    stepper: { display: 'flex', justifyContent: 'center', gap: '20px', padding: '15px 0', fontWeight: 'bold', fontSize: '14px', background: 'white', borderBottom: '1px solid #eee' },
    main: { flex: 1, padding: '30px', maxWidth: '1300px', margin: '0 auto', width: '100%' },
    pageTitle: { fontSize: '24px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '20px' },
    emptyMsg: { textAlign: 'center', color: '#999', padding: '60px', fontSize: '16px', background: 'white', borderRadius: '10px' },
    cartItem: { background: 'white', borderRadius: '10px', padding: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    itemEmoji: { fontSize: '40px', width: '60px', textAlign: 'center' },
    itemInfo: { flex: 1 },
    itemName: { fontWeight: 'bold', fontSize: '16px', color: '#333', marginBottom: '4px' },
    itemFarmer: { fontSize: '12px', color: '#999', marginBottom: '4px' },
    itemPrice: { fontSize: '14px', color: '#2d5a27', fontWeight: 'bold' },
    qtyControl: { display: 'flex', alignItems: 'center', gap: '10px' },
    qtyBtn: { background: '#2d5a27', color: 'white', border: 'none', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' },
    qtyNum: { fontSize: '16px', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' },
    itemTotal: { fontSize: '16px', fontWeight: 'bold', color: '#2d5a27', minWidth: '80px', textAlign: 'right' },
    removeBtn: { background: '#ffebee', color: '#e53935', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },
    summary: { background: 'white', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', height: 'fit-content' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#777', marginBottom: '10px' },
    totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', color: '#2d5a27', paddingTop: '15px', borderTop: '2px solid #eee', marginTop: '10px' },
    checkoutBtn: { width: '100%', background: '#2d5a27', color: 'white', border: 'none', padding: '15px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' },
    continueBtn: { width: '100%', background: 'white', color: '#2d5a27', border: '2px solid #2d5a27', padding: '12px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', marginTop: '10px' },
    label: { display: 'block', fontWeight: 'bold', fontSize: '13px', color: '#555', marginBottom: '5px', marginTop: '10px' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box' },
    readonlyInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', boxSizing: 'border-box', background: '#f5f5f5', color: '#777' },
    infoBox: { background: '#e8f5e9', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', color: '#2d5a27' },
    secureBox: { background: '#e8f5e9', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#2d5a27', marginTop: '15px', textAlign: 'center' },
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navTitle} onClick={() => navigate('/')}>🌱 GreenRoot</div>
        <div style={styles.navRight}>
          <span style={{ cursor: 'pointer' }} onClick={() => {
            const role = localStorage.getItem('role');
            if (role === 'consumer') navigate('/consumer');
            else navigate('/products');
          }}>← Back to Shopping</span>
        </div>
      </nav>

      {/* Checkout Stepper */}
      <div style={styles.stepper}>
        <span style={{ color: '#2d5a27' }}>🛒 Cart</span>
        <span style={{ color: '#999' }}>→</span>
        <span style={{ color: '#999' }}>💳 Payment</span>
        <span style={{ color: '#999' }}>→</span>
        <span style={{ color: '#999' }}>✅ Complete</span>
      </div>

      <div style={styles.main}>
        <div style={styles.pageTitle}>🛒 My Cart ({cartItems.length} items)</div>

        {cartItems.length === 0 ? (
          <div style={styles.emptyMsg}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>🛒</div>
            <p>Your cart is empty!</p>
            <button onClick={() => navigate('/consumer')}
              style={{ ...styles.checkoutBtn, width: 'auto', padding: '10px 30px', marginTop: '15px' }}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px 280px', gap: '20px' }}>
            {/* Cart Items */}
            <div>
              {cartItems.map(item => (
                <div key={item._id} style={styles.cartItem}>
                  <div style={styles.itemEmoji}>
  {item.image ? (
    <img
      src={`http://localhost:5000${item.image}`}
      alt={item.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
    />
  ) : (
    getEmoji(item.category)
  )}
</div>
                  <div style={styles.itemInfo}>
                    <div style={styles.itemName}>{item.name}{item.subCategory ? ` (${item.subCategory})` : ''}</div>
                    <div style={styles.itemFarmer}>🧑‍🌾 {item.farmerName}</div>
                    <div style={styles.itemPrice}>Rs. {item.price}/kg</div>
                  </div>
                  <div style={styles.qtyControl}>
                    <button style={styles.qtyBtn} onClick={() => handleQuantityChange(item._id, item.cartQuantity - 1)}>-</button>
                    <span style={styles.qtyNum}>{item.cartQuantity}</span>
                    <button style={styles.qtyBtn} onClick={() => handleQuantityChange(item._id, item.cartQuantity + 1)}>+</button>
                    <span style={{ fontSize: '12px', color: '#999' }}>kg</span>
                  </div>
                  <div style={styles.itemTotal}>Rs. {calculateBatchPrice(item, item.cartQuantity)}</div>
                  <button style={styles.removeBtn} onClick={() => handleRemove(item._id)}>Remove</button>
                </div>
              ))}
            </div>

            {/* Middle column: Delivery Address Form */}
            <div style={styles.summary}>
              <h3 style={{ color: '#2d5a27', marginBottom: '5px' }}>🚚 Delivery Address</h3>
              <div style={styles.infoBox}>Estimated Delivery: 1-3 Business Days</div>

              <label style={styles.label}>Full Name</label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Enter full name"
                style={styles.input}
              />

              <label style={styles.label}>Phone Number</label>
              <input
                value={phone}
                onChange={handlePhoneChange}
                placeholder="07XXXXXXXX"
                inputMode="numeric"
                style={styles.input}
              />

              <label style={styles.label}>Address Line 1</label>
              <input
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                placeholder="House No, Street"
                style={styles.input}
              />

              <label style={styles.label}>Address Line 2 (optional)</label>
              <input
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                placeholder="Apartment, Landmark"
                style={styles.input}
              />

              <label style={styles.label}>City</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Kandy"
                style={styles.input}
              />

              <label style={styles.label}>District</label>
              <select value={district} onChange={handleDistrictChange} style={styles.input}>
                <option value="">Select District</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <label style={styles.label}>Postal Code</label>
              <input value={postalCode} readOnly style={styles.readonlyInput} />
            </div>

            {/* Right column: Order Summary */}
            <div style={styles.summary}>
              <h3 style={{ color: '#2d5a27', marginBottom: '15px' }}>📋 Order Summary</h3>

              {cartItems.map(item => (
                <div key={item._id} style={styles.summaryRow}>
                <span>{item.name}{item.subCategory ? ` (${item.subCategory})` : ''} x {item.cartQuantity}kg</span>
                <span>Rs. {calculateBatchPrice(item, item.cartQuantity)}</span>
              </div>
              ))}

              <div style={styles.summaryRow}>
  <span>Subtotal</span>
  <span>Rs. {totalAmount}</span>
</div>
<div style={styles.summaryRow}>
  <span>🚚 Delivery Fee</span>
  <span>Rs. {DELIVERY_FEE}</span>
</div>
<div style={styles.totalRow}>
  <span>Total</span>
  <span>Rs. {grandTotal}</span>
</div>

              <div style={styles.secureBox}>
                🔒 Secure Checkout<br />
                Your information is protected and encrypted
              </div>

              <button style={styles.checkoutBtn} onClick={handleCheckout}>
                💳 Proceed to Checkout
              </button>
              <button style={styles.continueBtn} onClick={() => navigate('/consumer')}>
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;