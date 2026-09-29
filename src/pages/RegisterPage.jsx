import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); 
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // 1. Validate that at least ONE contact method is provided
    if (!username.trim() && !email.trim() && !phone.trim()) {
      setError('Please provide at least a Username, Email, or Phone number.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 2. Build a strictly clean payload (No empty strings sent to backend!)
      const payload = {
        password: password
        // Notice we don't send 'role' here anymore because your backend securely defaults to CUSTOMER!
      };
      
      if (username.trim()) payload.username = username.trim();
      if (email.trim()) payload.email = email.trim();
      if (phone.trim()) payload.phone = phone.trim();

      // 3. Hit the Register API
      await api.post('/auth/register', payload);
      
      setSuccess('Account created! Logging you in automatically...');

      // 4. Figure out which identifier they successfully used so we can log them in
      const loginIdentifier = payload.email || payload.username || payload.phone;

      // 5. Fire the Login API immediately
      const loginRes = await api.post('/auth/login', {
        identifier: loginIdentifier,
        password: password
      });

      // 6. Save the token and redirect to the Menu
      localStorage.setItem('token', loginRes.data.token);
      setTimeout(() => navigate('/menu'), 1500);

    } catch (err) {
      console.error("Registration Error:", err);
      // Give the user a friendly error message
      setError(err.response?.data?.message || 'Registration failed. That Username or Email or Phone might already be in use.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Create an Account</h1>
          <p className="text-gray-500 text-sm mt-1">Provide at least one contact method</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-medium mb-4 text-center border border-red-100">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm font-medium mb-4 text-center border border-green-100">{success}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Username <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. foodlover123"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. 9876543210"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password <span className="text-orange-500">*</span></label>
            <input 
              type="password" 
              required
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || success !== ''} 
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors mt-4 disabled:bg-orange-300 shadow-sm"
          >
            {loading ? 'Processing...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-orange-500 font-bold hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;