import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, UtensilsCrossed } from 'lucide-react';
import api from '../api';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); // Matches your backend's expected field name
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Calls your standard backend login endpoint
      const res = await api.post('/auth/login', { 
        identifier: identifier, 
        password: password 
      });
      
      const { token, role } = res.data;

      // STRICT CHECK: Verify if role returned from backend is ADMIN
      if (!token || (role !== 'ADMIN' && role !== 'ROLE_ADMIN')) {
        setError('Access Denied: This account does not possess administrator privileges.');
        setLoading(false);
        return;
      }

      // Save token and route securely to admin dashboard
      localStorage.setItem('token', token);
      navigate('/admin');
    } catch (err) {
      console.error("Admin login failed:", err);
      setError(err.response?.data?.message || "Invalid credentials or unauthorized access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-5 font-sans">
      <div className="max-w-md w-full bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/20">
            <UtensilsCrossed size={22} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Admin Portal</h1>
          <p className="text-gray-400 text-xs font-medium">Sign in with your administrator account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl text-xs font-semibold mb-6 text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email, Username, or Phone</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@dineflow.com or username"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Verifying Credentials..." : "Access Admin Dashboard"} <ArrowRight size={18} />
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLoginPage;