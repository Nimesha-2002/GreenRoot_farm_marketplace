import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../services/api';

function Products({ cartItems = [], setCartItems }) {
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

const handleAddToCart = (p) => {
  if (!token || role !== 'consumer') {
    navigate('/login');
    return;
  }
  const existing = cartItems.find(i => i._id === p._id);
  if (existing) {
    setCartItems(cartItems.map(i => i._id === p._id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i));
  } else {
    setCartItems([...cartItems, { ...p, cartQuantity: 1 }]);
  }
  alert(`${p.name} added to cart! 🛒`);
};

const handleBuyNow = (p) => {
  if (!token || role !== 'consumer') {
    navigate('/login');
    return;
  }
  const existing = cartItems.find(i => i._id === p._id);
  if (!existing) {
    setCartItems([...cartItems, { ...p, cartQuantity: 1 }]);
  }
  navigate('/cart');
};
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    getAllProducts().then(res => setProducts(res.data)).catch(err => console.log(err));
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  const getEmoji = (cat) => cat === 'Fruits' ? '🍎' : cat === 'Grains' ? '🌾' : '🥦';

  const styles = {
    container: { minHeight: '100vh', fontFamily: 'Arial, sans-serif', background: '#f5f5f5' },
    navbar: { background: '#2d5a27', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    navTitle: { fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' },
    navLinks: { display: 'flex', gap: '20px', fontSize: '14px' },
    navLink: { cursor: 'pointer', color: 'white' },
    main: { padding: '30px' },
    pageTitle: { fontSize: '26px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '20px' },
    searchBar: { display: 'flex', gap: '10px', marginBottom: '25px' },
    searchInput: { flex: 1, border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '14px' },
    searchSelect: { border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '14px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
    card: { background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    cardImg: { background: '#c8e6c9', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px' },
    cardInfo: { padding: '15px' },
    cardName: { fontWeight: 'bold', fontSize: '15px', marginBottom: '5px' },
    cardFarmer: { fontSize: '12px', color: '#999', marginBottom: '5px' },
    cardPrice: { color: '#2d5a27', fontWeight: 'bold', fontSize: '16px', marginBottom: '10px' },
    cardBtn: { background: '#2d5a27', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', width: '100%' },
    emptyMsg: { textAlign: 'center', color: '#999', padding: '60px', fontSize: '16px' },
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navTitle} onClick={() => navigate('/')}>🌱 GreenRoot</div>
        <div style={styles.navLinks}>
          <span style={styles.navLink} onClick={() => navigate('/')}>Home</span>
          <span style={styles.navLink} onClick={() => navigate('/products')}>Products</span>
          <span style={styles.navLink} onClick={() => navigate('/farmers')}>Farmers</span>
          <span style={styles.navLink} onClick={() => navigate('/login')}>Login</span>
          <span style={styles.navLink} onClick={() => navigate('/register')}>Register</span>
        </div>
      </nav>

      <div style={styles.main}>
        <div style={styles.pageTitle}>🛍️ All Products</div>
        <div style={styles.searchBar}>
          <input style={styles.searchInput} placeholder="🔍 Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          <select style={styles.searchSelect} value={category} onChange={e => setCategory(e.target.value)}>
            <option>All</option>
            <option>Vegetables</option>
            <option>Fruits</option>
            <option>Grains</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <div style={styles.emptyMsg}>No products found!</div>
        ) : (
          <div style={styles.grid}>
            {filtered.map(p => (
              <div key={p._id} style={styles.card}>
                <div style={styles.cardImg}>
                {p.image ? (
                  <img
                    src={`http://localhost:5000${p.image}`}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  getEmoji(p.category)
                )}
              </div>
                <div style={styles.cardInfo}>
                  <div style={styles.cardName}>{p.name}</div>
                  {p.subCategory && <div style={{ fontSize: '20px', color: '#777', marginBottom: '5px' }}>🏷️ {p.subCategory}</div>}
                  <div style={styles.cardFarmer}>🧑‍🌾 {p.farmerName}</div>
                  <div style={styles.cardPrice}>Rs. {p.price}/kg</div>
                  <div style={{ fontSize: '12px', color: '#777', marginBottom: '10px' }}>📦 {p.quantity} kg available</div>
                  <button 
                    style={p.quantity === 0 ? { ...styles.cardBtn, background: '#ccc', cursor: 'not-allowed' } : styles.cardBtn} 
                    disabled={p.quantity === 0}
                    onClick={() => handleBuyNow(p)}
                  >
                    {p.quantity === 0 ? '🚫 Out of Stock' : 'Buy Now'}
                  </button>
                  <button 
                    style={p.quantity === 0 ? { ...styles.cardBtn, background: '#ccc', cursor: 'not-allowed', marginTop: '5px' } : { ...styles.cardBtn, background: '#ff9800', marginTop: '5px' }} 
                    disabled={p.quantity === 0}
                    onClick={() => handleAddToCart(p)}
                  >
                    {p.quantity === 0 ? '🚫 Out of Stock' : '🛒 Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;