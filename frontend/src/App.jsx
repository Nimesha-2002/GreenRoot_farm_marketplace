import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import ConsumerDashboard from './pages/ConsumerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Products from './pages/Products';
import Farmers from './pages/Farmers';
import Payment from './pages/Payment';
import Cart from './pages/Cart';
import { useState, useEffect } from 'react';


function App() {

  const [userId, setUserId] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return 'guest';
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.id || 'guest';
    } catch {
      return 'guest';
    }
  });

  const [cartItems, setCartItems] = useState(() => {
    const token = localStorage.getItem('token');
    let initialUserId = 'guest';
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        initialUserId = decoded.id || 'guest';
      } catch {}
    }
    const savedCart = localStorage.getItem(`cart_${initialUserId}`);
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cartItems));
  }, [cartItems, userId]);

  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setUserId('guest');
        const savedCart = localStorage.getItem('cart_guest');
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
        return;
      }
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const newUserId = decoded.id || 'guest';
        setUserId(newUserId);
        const savedCart = localStorage.getItem(`cart_${newUserId}`);
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
      } catch {
        setUserId('guest');
        const savedCart = localStorage.getItem('cart_guest');
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
      }
    };

    const handleCartClear = () => {
      setCartItems([]);
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('cart-clear', handleCartClear);
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('cart-clear', handleCartClear);
    };
  }, []);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/farmer" element={<FarmerDashboard />} />
        <Route path="/consumer" element={<ConsumerDashboard cartItems={cartItems} setCartItems={setCartItems} />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/products" element={<Products cartItems={cartItems} setCartItems={setCartItems} />} />
        <Route path="/farmers" element={<Farmers />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/cart" element={<Cart cartItems={cartItems} setCartItems={setCartItems} />} />
      </Routes>
    </Router>
  );
}

export default App;