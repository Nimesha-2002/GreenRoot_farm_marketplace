import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../services/api';

function Farmers() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);

  useEffect(() => {
    getAllProducts().then(res => {
      // Get unique farmers from products
      const farmerMap = {};
      res.data.forEach(p => {
        if (!farmerMap[p.farmer]) {
          farmerMap[p.farmer] = {
            id: p.farmer,
            name: p.farmerName,
            products: [],
          };
        }
        farmerMap[p.farmer].products.push(p);
      });
      setFarmers(Object.values(farmerMap));
    }).catch(err => console.log(err));
  }, []);

  const styles = {
    container: { minHeight: '100vh', fontFamily: 'Arial, sans-serif', background: '#f5f5f5' },
    navbar: { background: '#2d5a27', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    navTitle: { fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' },
    navLinks: { display: 'flex', gap: '20px', fontSize: '14px' },
    navLink: { cursor: 'pointer', color: 'white' },
    main: { padding: '30px' },
    pageTitle: { fontSize: '26px', fontWeight: 'bold', color: '#2d5a27', marginBottom: '20px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
    card: { background: 'white', borderRadius: '10px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    avatar: { width: '70px', height: '70px', background: '#c8e6c9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', marginBottom: '15px' },
    farmerName: { fontWeight: 'bold', fontSize: '18px', color: '#2d5a27', marginBottom: '5px' },
    farmerInfo: { fontSize: '13px', color: '#777', marginBottom: '15px' },
    productList: { borderTop: '1px solid #eee', paddingTop: '15px' },
    productTitle: { fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' },
    productItem: { fontSize: '13px', color: '#777', padding: '5px 0', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between' },
    btnGreen: { background: '#2d5a27', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginTop: '15px', width: '100%' },
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
        <div style={styles.pageTitle}>🧑‍🌾 Our Farmers</div>
        {farmers.length === 0 ? (
          <div style={styles.emptyMsg}>No farmers found!</div>
        ) : (
          <div style={styles.grid}>
            {farmers.map(f => (
              <div key={f.id} style={styles.card}>
                <div style={styles.avatar}>🧑‍🌾</div>
                <div style={styles.farmerName}>{f.name}</div>
                <div style={styles.farmerInfo}>📦 {f.products.length} products available</div>
                <div style={styles.productList}>
                  <div style={styles.productTitle}>Products:</div>
                  {f.products.map(p => (
                  <div key={p._id} style={{ ...styles.productItem, alignItems: 'center', gap: '10px' }}>
                    {p.image ? (
                      <img
                        src={`http://localhost:5000${p.image}`}
                        alt={p.name}
                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <span style={{ fontSize: '25px' }}>
                        {p.category === 'Fruits' ? '🍎' : p.category === 'Grains' ? '🌾' : '🥦'}
                      </span>
                    )}
                    <span>{p.name}{p.subCategory ? ` (${p.subCategory})` : ''}</span>
                    <span style={{ color: '#2d5a27', fontWeight: 'bold', marginLeft: 'auto' }}>Rs. {p.price}/kg</span>
                  </div>
                ))}
                </div>
                <button style={styles.btnGreen} onClick={() => navigate('/products')}>View Products</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Farmers;