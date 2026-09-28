import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Utensils, ArrowRight, User } from 'lucide-react';
import api from '../api';

const WelcomePage = () => {
  const [searchParams] = useSearchParams();
  const tableToken = searchParams.get('table');
  const [tableName, setTableName] = useState('');
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem('token'); // Check if user already logged in

  useEffect(() => {
    // If they scanned a QR code, verify the table secretly in the background
    const verifyTable = async () => {
      if (tableToken) {
        try {
          const res = await api.get(`/tables/scan/${tableToken}`);
          localStorage.setItem('currentTableId', res.data.id);
          setTableName(res.data.tableNumber);
        } catch (err) {
          console.warn("Invalid table token from QR code.");
        }
      }
    };
    verifyTable();
  }, [tableToken]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Top Navbar */}
      <header className="p-5 flex justify-between items-center">
        <div className="font-extrabold text-2xl tracking-tighter flex items-center gap-2">
          <Utensils className="text-orange-500" /> DineFlow
        </div>
        
        {isLoggedIn ? (
          <button onClick={handleLogout} className="text-sm font-bold text-gray-500 hover:text-red-500">
            Logout
          </button>
        ) : (
          <Link to="/login" className="flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50">
            <User size={16} /> Login
          </Link>
        )}
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-orange-100 p-4 rounded-full mb-6">
          <Utensils size={40} className="text-orange-500" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 leading-tight">
          Delicious food, <br /> delivered to your table.
        </h1>
        
        <p className="text-gray-500 mb-10 text-lg max-w-md">
          {tableName 
            ? `You are seated at Table ${tableName}. Browse our digital menu and order instantly.` 
            : "Browse our fresh, chef-prepared digital menu. Dine-in or order ahead."}
        </p>

        <Link 
          to="/menu" 
          className="bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-orange-600 hover:shadow-xl transition-all flex items-center gap-3 w-full max-w-xs justify-center"
        >
          Order Now <ArrowRight size={20} />
        </Link>
      </main>
    </div>
  );
};

export default WelcomePage;