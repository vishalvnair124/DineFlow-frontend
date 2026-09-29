import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ShoppingBag, CheckCircle, ChefHat } from 'lucide-react';
import api from '../api';

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

const fetchMyOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      let data = Array.isArray(res.data) ? res.data : res.data.orders || [];
      
      // REVERSE THE ARRAY: Latest on top, oldest at the bottom
      data = data.reverse(); 
      // OR if you want to sort strictly by ID or date:
      // data = data.sort((a, b) => b.id - a.id);

      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError('Failed to load your order history. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
    // Auto-refresh every 10 seconds for live kitchen updates
    const interval = setInterval(fetchMyOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // 1. Kitchen Order Workflow Status Badge
  const getKitchenStatusBadge = (status) => {
    const currentStatus = (status || 'PENDING').toUpperCase();
    switch (currentStatus) {
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
            <ChefHat size={13} /> Kitchen: Preparing
          </span>
        );
      case 'SERVED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-bold">
            <CheckCircle size={13} /> Served / Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-xs font-bold">
            <Clock size={13} /> Order Received
          </span>
        );
    }
  };

  // 2. Payment Mode Badge (How they chose to pay)
  const getPaymentModeBadge = (mode) => {
    const m = (mode || 'CASH_AT_COUNTER').toUpperCase();
    if (m === 'UPI') {
      return (
        <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
          UPI / Online
        </span>
      );
    }
    if (m === 'CARD') {
      return (
        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
          Card
        </span>
      );
    }
    return (
      <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
        Cash at Counter
      </span>
    );
  };

  // 3. Payment Status Badge (Paid vs Unpaid)
  const getPaymentStatusBadge = (status) => {
    const s = (status || 'UNPAID').toUpperCase();
    if (s === 'PAID') {
      return (
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
          Paid
        </span>
      );
    }
    return (
      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
        Unpaid
      </span>
    );
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 min-h-screen pb-28 font-sans text-gray-900 p-5">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/menu')} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-extrabold">My Orders & Receipts</h1>
      </div>

      {error && <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl text-sm mb-4 font-medium">{error}</div>}

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm mt-10">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-1">No orders found</h2>
          <p className="text-gray-400 text-sm mb-6">You haven't placed any orders yet. Ready to grab some food?</p>
          <button onClick={() => navigate('/menu')} className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors">
            Explore Menu
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4 transition-all">
              
              {/* Order Card Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-gray-400 font-medium">Order #{order.id}</p>
                    {getPaymentModeBadge(order.paymentMode)}
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Recent Order"}
                  </p>
                </div>
                {getKitchenStatusBadge(order.status)}
              </div>

              {/* Order Items List with Snapshot Pricing */}
              <div className="space-y-2">
                {(order.items || order.orderItems || []).map((item, idx) => {
                  const unitPrice = item.priceAtTimeOfOrder || item.price || item.unitPrice || item.product?.price || 0;
                  const itemSubtotal = unitPrice * item.quantity;
                  const productName = item.productName || item.product?.name || "Menu Item";

                  return (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-800 font-medium">
                        <span className="font-bold text-orange-600 mr-2">{item.quantity}x</span> 
                        {productName}
                      </span>
                      <span className="font-bold text-gray-900">
                        ${itemSubtotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Order Card Footer / Total */}
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {order.tableName || order.tableNumber ? `Table #${order.tableName || order.tableNumber}` : "Counter / Takeaway"}
                </span>
                <div className="text-right">
                  <span className="text-xs text-gray-500 mr-2">Total Amount:</span>
                  <span className="text-lg font-extrabold text-orange-600">
                    ${(order.totalAmount || order.totalPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;