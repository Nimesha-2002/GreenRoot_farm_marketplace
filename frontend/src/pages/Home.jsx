import { useNavigate, Link } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-green-700 text-white px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xl font-bold">
          🌱 GreenRoot
        </div>
        <div className="flex gap-6">
          <span className="cursor-pointer hover:underline">Home</span>
          <span onClick={() => navigate('/products')} className="cursor-pointer hover:underline">Products</span>
          <span onClick={() => navigate('/farmers')} className="cursor-pointer hover:underline">Farmers</span>
          <span onClick={() => navigate('/login')} className="cursor-pointer hover:underline">Login</span>
          <span onClick={() => navigate('/register')} className="cursor-pointer hover:underline">Register</span>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-green-800 text-white text-center py-32 px-8"
        style={{ backgroundImage: 'url(/farm5.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-4">🌾 Fresh From the Farm</h1>
          <p className="text-xl mb-2">Connecting Sri Lankan farmers directly with consumers.</p>
          <p className="text-lg mb-8">No middlemen. Just fresh, honest food.</p>
          <button onClick={() => navigate('/login')}
            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full text-lg font-semibold">
            Shop Now
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-8 px-16 py-16 bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3">🧑‍🌾</div>
          <h3 className="text-xl font-bold mb-2">Direct from Farmers</h3>
          <p className="text-gray-600">Buy fresh produce directly from local Sri Lankan farmers.</p>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-3">💰</div>
          <h3 className="text-xl font-bold mb-2">Fair Prices</h3>
          <p className="text-gray-600">AI powered price suggestions ensure fair deals for everyone.</p>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-3">🚚</div>
          <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
          <p className="text-gray-600">Get fresh produce delivered straight to your doorstep.</p>
        </div>
      </div>


      {/* Statistics */}
<div className="bg-white py-16">
  <div className="grid grid-cols-4 gap-8 text-center px-16">
    <div>
      <h2 className="text-4xl font-bold text-green-700">500+</h2>
      <p className="text-gray-600 mt-2">Registered Farmers</p>
    </div>

    <div>
      <h2 className="text-4xl font-bold text-green-700">2000+</h2>
      <p className="text-gray-600 mt-2">Products Listed</p>
    </div>

    <div>
      <h2 className="text-4xl font-bold text-green-700">5000+</h2>
      <p className="text-gray-600 mt-2">Successful Orders</p>
    </div>

    <div>
      <h2 className="text-4xl font-bold text-green-700">25</h2>
      <p className="text-gray-600 mt-2">District Coverage</p>
    </div>
  </div>
</div>

{/* Mission & Vision */}
<div className="bg-green-50 py-16 px-16">
  <h2 className="text-3xl font-bold text-center text-green-700 mb-12">
    About GreenRoot
  </h2>

  <div className="grid grid-cols-2 gap-10">

    <div className="bg-white p-8 rounded-xl shadow-md">
      <h3 className="text-2xl font-bold text-green-700 mb-4">
        🎯 Our Mission
      </h3>

      <p className="text-gray-600 leading-7">
        To empower Sri Lankan farmers by providing a digital marketplace
        where they can directly connect with consumers, receive fair prices,
        and reduce dependence on middlemen.
      </p>
    </div>

    <div className="bg-white p-8 rounded-xl shadow-md">
      <h3 className="text-2xl font-bold text-green-700 mb-4">
        👁️ Our Vision
      </h3>

      <p className="text-gray-600 leading-7">
        To become Sri Lanka's most trusted agricultural marketplace,
        creating a sustainable future for farmers and consumers through
        technology and innovation.
      </p>
    </div>

  </div>
</div>

{/* Quick Navigation */}
<div className="py-16 bg-white">
  <h2 className="text-3xl font-bold text-center text-green-700 mb-10">
    Quick Access
  </h2>

  <div className="grid grid-cols-4 gap-6 px-16">

    <div
      onClick={() => navigate('/products')}
      className="bg-green-50 p-6 rounded-xl shadow cursor-pointer hover:shadow-lg transition"
    >
      <div className="text-4xl mb-3">🥬</div>
      <h3 className="font-bold">Browse Products</h3>
    </div>

    <div
      onClick={() => navigate('/farmers')}
      className="bg-green-50 p-6 rounded-xl shadow cursor-pointer hover:shadow-lg transition"
    >
      <div className="text-4xl mb-3">🧑‍🌾</div>
      <h3 className="font-bold">Find Farmers</h3>
    </div>

    <div
      onClick={() => navigate('/register')}
      className="bg-green-50 p-6 rounded-xl shadow cursor-pointer hover:shadow-lg transition"
    >
      <div className="text-4xl mb-3">📝</div>
      <h3 className="font-bold">Create Account</h3>
    </div>

    <div
      onClick={() => navigate('/login')}
      className="bg-green-50 p-6 rounded-xl shadow cursor-pointer hover:shadow-lg transition"
    >
      <div className="text-4xl mb-3">🔐</div>
      <h3 className="font-bold">Login</h3>
    </div>

  </div>
</div>

      {/* Footer */}
      <footer className="bg-green-800 text-white pt-12">

  <div className="grid md:grid-cols-4 grid-cols-2 gap-10 px-16 pb-10">

    <div>
      <h3 className="text-xl font-bold mb-3">🌱 GreenRoot</h3>
      <p className="text-gray-300">
        Connecting farmers and consumers across Sri Lanka through a
        trusted digital marketplace.
      </p>
    </div>

    <div>
  <h3 className="font-bold text-lg mb-3">Quick Links</h3>

  <Link to="/" className="block mb-2 text-gray-300 hover:text-white transition duration-200">
    Home
  </Link>

  <Link to="/products" className="block mb-2 text-gray-300 hover:text-white transition duration-200">
    Products
  </Link>

  <Link to="/farmers" className="block mb-2 text-gray-300 hover:text-white transition duration-200">
    Farmers
  </Link>

  <Link to="/login" className="block mb-2 text-gray-300 hover:text-white transition duration-200">
    Login
  </Link>

  <Link to="/register" className="block text-gray-300 hover:text-white transition duration-200">
    Register
  </Link>
</div>

    <div>
      <h3 className="font-bold text-lg mb-3">Contact Us</h3>

      <p>📍 Kandy, Sri Lanka</p>
      <p>📞 +94 77 123 4567</p>
      <p>✉️ support@greenroot.lk</p>
    </div>
    <div>
      <h3 className="font-bold text-lg mb-3">Follow Us</h3>

      <p>📘 Facebook</p>
  <p>📷 Instagram</p>
  <p>🐦 Twitter</p>
    </div>

  </div>

  <div className="border-t border-green-500 text-center py-4">
    © 2026 GreenRoot. All Rights Reserved.
  </div>

</footer>
    </div>
  );
}

export default Home;