import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'consumer' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await registerUser(form);
      setMessage('Registration successful! Please login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage('Registration failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
     style={{ backgroundImage: 'url(/farm5.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-green-700">🌱 Create Account</h2>
          <p className="text-gray-500 mt-1">Join GreenRoot today</p>
        </div>
        {message && <p className="text-green-600 text-center mb-4">{message}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Full Name</label>
          <input name="name" type="text" placeholder="Enter your full name"
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Email</label>
          <input name="email" type="email" placeholder="kamal@gmail.com"
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">Password</label>
          <input name="password" type="password" placeholder="••••••••"
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-1">I am a</label>
          <select name="role" onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500">
            <option value="consumer">Consumer</option>
            <option value="farmer">Farmer</option>
          </select>
        </div>
        <button onClick={handleSubmit}
          className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition duration-200">
          Register
        </button>
        <p className="text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <span onClick={() => navigate('/login')}
            className="text-green-700 font-semibold cursor-pointer hover:underline">
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;