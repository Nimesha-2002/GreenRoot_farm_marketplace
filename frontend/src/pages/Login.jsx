import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, requestForgotPasswordOTP, verifyForgotPasswordOTP } from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState('login'); // 'login', 'forgot-password', 'verify-otp'
  const [form, setForm] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError('');
    try {
      const res = await loginUser(form);
      const { token, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('name', res.data.name);
      localStorage.setItem('email', res.data.email);
      window.dispatchEvent(new Event('auth-change'));
      if (role === 'farmer') navigate('/farmer');
      else if (role === 'consumer') navigate('/consumer');
      else if (role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  const handleSendOtp = async () => {
    setError('');
    setMessage('');
    if (!forgotEmail) {
      setError('Please enter your email');
      return;
    }
    try {
      const res = await requestForgotPasswordOTP(forgotEmail);
      setMessage(res.data.message || 'OTP sent to your email successfully.');
      setStep('verify-otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your email.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setMessage('');
    if (!otp) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    try {
      const res = await verifyForgotPasswordOTP(forgotEmail, otp);
      const { token, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('name', res.data.name);
      localStorage.setItem('email', res.data.email || forgotEmail);
      window.dispatchEvent(new Event('auth-change'));
      if (role === 'farmer') navigate('/farmer');
      else if (role === 'consumer') navigate('/consumer');
      else if (role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ backgroundImage: 'url(/farm5.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        
        {step === 'login' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-green-700">🌱 Welcome Back</h2>
              <p className="text-gray-500 mt-1">Sign in to GreenRoot</p>
            </div>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <input name="email" type="email" placeholder="kamal@gmail.com"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500" />
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 font-medium mb-1">Password</label>
              <input name="password" type="password" placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500" />
            </div>
            <div className="text-right mb-6">
              <span onClick={() => { setStep('forgot-password'); setError(''); setMessage(''); }}
                className="text-green-700 font-medium cursor-pointer hover:underline text-sm">
                Forgot Password?
              </span>
            </div>
            <button onClick={handleSubmit}
              className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition duration-200">
              Login
            </button>
          </>
        )}

        {step === 'forgot-password' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-green-700">🔑 Forgot Password</h2>
              <p className="text-gray-500 mt-1">Enter email to receive standard 6-digit OTP</p>
            </div>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-1">Email Address</label>
              <input type="email" placeholder="your-email@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-green-500" />
            </div>
            <button onClick={handleSendOtp}
              className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition duration-200 mb-4">
              Send OTP
            </button>
            <div className="text-center">
              <span onClick={() => { setStep('login'); setError(''); setMessage(''); }}
                className="text-green-700 font-semibold cursor-pointer hover:underline">
                Back to Login
              </span>
            </div>
          </>
        )}

        {step === 'verify-otp' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-green-700">🔒 Enter OTP</h2>
              <p className="text-gray-500 mt-1">Enter the 6-digit OTP sent to {forgotEmail}</p>
            </div>
            {message && <p className="text-green-600 text-center mb-4 font-semibold">{message}</p>}
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-1">Verification Code</label>
              <input type="text" placeholder="123456" maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-300 text-center tracking-widest text-2xl font-bold rounded-lg px-4 py-3 focus:outline-none focus:border-green-500" />
            </div>
            <button onClick={handleVerifyOtp}
              className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition duration-200 mb-4">
              Verify & Login
            </button>
            <div className="text-center flex justify-between px-2">
              <span onClick={handleSendOtp}
                className="text-green-700 font-semibold cursor-pointer hover:underline text-sm">
                Resend OTP
              </span>
              <span onClick={() => { setStep('login'); setError(''); setMessage(''); }}
                className="text-green-700 font-semibold cursor-pointer hover:underline text-sm">
                Back to Login
              </span>
            </div>
          </>
        )}

        {step === 'login' && (
          <p className="text-center text-gray-500 mt-6">
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')}
              className="text-green-700 font-semibold cursor-pointer hover:underline">
              Register here
            </span>
          </p>
        )}

      </div>
    </div>
  );
}

export default Login;