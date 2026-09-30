import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, CheckCircle, Clock, LogOut, ShoppingBag, UtensilsCrossed, BarChart3, Users, LayoutList } from 'lucide-react';
import api from '../api';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'analytics' | 'users'
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Secure Admin Verification & Initial Data Fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/adminlogin');
      return;
    }
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 8000);
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      const [ordersRes, usersRes] = await Promise.all([
        api.get('/admin/orders').catch(() => ({ data: [] })),
        api.get('/admin/users').catch(() => ({ data: [] }))
      ]);

      let orderData = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data.orders || [];
      setOrders(orderData.reverse()); // Newest first

      let userData = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users || [];
      setUsers(userData);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
      setError('Failed to sync admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      // Correct PATCH request sending JSON body
      await api.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus
      });
      await fetchAdminData();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/adminlogin');
  };

  // Status Badges
  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'PREPARING') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
          <ChefHat size={14} /> Preparing
        </span>
      );
    }
    if (s === 'SERVED' || s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
          <CheckCircle size={14} /> Served
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold">
        <Clock size={14} /> Pending
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const s = (status || 'UNPAID').toUpperCase();
    return s === 'PAID' ? (
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">Paid</span>
    ) : (
      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">Unpaid</span>
    );
  };

  // Calculate quick analytics metrics
  const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || o.totalPrice || 0), 0);
  const pendingCount = orders.filter(o => (o.status || '').toUpperCase() === 'PENDING').length;
  const preparingCount = orders.filter(o => (o.status || '').toUpperCase() === 'PREPARING').length;
  const servedCount = orders.filter(o => (o.status || '').toUpperCase() === 'SERVED').length;

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto bg-gray-50 min-h-screen pb-20 font-sans text-gray-900 p-5">
      
      {/* Admin Header */}
      <header className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black shadow-md shadow-orange-500/20">
            <UtensilsCrossed size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">Admin Command Center</h1>
            <p className="text-xs text-gray-400 font-medium">Manage kitchen operations, sales metrics, and user accounts</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-2xl text-xs font-bold transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders' ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <LayoutList size={16} /> Live Orders Queue
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics' ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <BarChart3 size={16} /> Sales & Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users' ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users size={16} /> User Management
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl text-sm mb-6 font-medium">{error}</div>}

      {/* TAB 1: LIVE ORDERS QUEUE */}
      {activeTab === 'orders' && (
        <>
          {orders.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
              <h2 className="text-lg font-bold text-gray-800 mb-1">No Active Orders</h2>
              <p className="text-gray-400 text-sm">Kitchen queue is completely clear right now.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {orders.map((order) => {
                const currentStatus = (order.status || 'PENDING').toUpperCase();

                return (
                  <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between space-y-4">
                    
                    {/* Order Top Meta */}
                    <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black text-gray-900">Order #{order.id}</span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-lg font-bold">
                            Table #{order.tableName || order.tableNumber || 'Takeaway'}
                          </span>
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"} • Mode: <span className="font-bold text-gray-700">{order.paymentMode || 'CASH_AT_COUNTER'}</span>
                        </p>
                      </div>
                      <div>{getStatusBadge(order.status)}</div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 py-1">
                      {(order.items || order.orderItems || []).map((item, idx) => {
                        const unitPrice = item.priceAtTimeOfOrder || item.price || item.unitPrice || 0;
                        const itemName = item.productName || item.product?.name || "Menu Item";

                        return (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-800 font-medium">
                              <span className="font-bold text-orange-600 mr-2">{item.quantity}x</span> 
                              {itemName}
                            </span>
                            <span className="font-bold text-gray-900">${(unitPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer Actions & Sequential Flow */}
                    <div className="border-t border-gray-100 pt-4 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Total Amount</span>
                        <span className="text-lg font-black text-orange-600">${(order.totalAmount || order.totalPrice || 0).toFixed(2)}</span>
                      </div>

                      {/* Sequential Workflow Buttons */}
                      <div className="flex items-center gap-2">
                        {currentStatus === 'PENDING' && (
                          <button
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
                          >
                            Mark Preparing
                          </button>
                        )}

                        {currentStatus === 'PREPARING' && (
                          <button
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
                          >
                            Mark Served
                          </button>
                        )}

                        {currentStatus === 'SERVED' && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                            Order Completed ✓
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: SALES & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Revenue</span>
              <span className="text-3xl font-black text-orange-600">${totalRevenue.toFixed(2)}</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Pending Orders</span>
              <span className="text-3xl font-black text-blue-600">{pendingCount}</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">In Kitchen</span>
              <span className="text-3xl font-black text-amber-600">{preparingCount}</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Served Orders</span>
              <span className="text-3xl font-black text-emerald-600">{servedCount}</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
            <BarChart3 size={40} className="mx-auto text-gray-300 mb-2" />
            <h3 className="text-lg font-extrabold text-gray-800">Sales Performance Overview</h3>
            <p className="text-gray-400 text-xs mt-1">Real-time revenue tracking across all active tables and payment modes.</p>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
          <h2 className="text-base font-black text-gray-900 mb-4">Registered Platform Users</h2>
          {users.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-10">No user records returned from the endpoint.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 font-bold">ID</th>
                    <th className="pb-3 font-bold">Username / Name</th>
                    <th className="pb-3 font-bold">Email</th>
                    <th className="pb-3 font-bold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u, i) => (
                    <tr key={u.id || i} className="text-xs font-semibold text-gray-800">
                      <td className="py-3 text-gray-400">#{u.id || i + 1}</td>
                      <td className="py-3">{u.username || u.name || 'N/A'}</td>
                      <td className="py-3 text-gray-500">{u.email || 'N/A'}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          u.role === 'ADMIN' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role || 'USER'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminDashboardPage;