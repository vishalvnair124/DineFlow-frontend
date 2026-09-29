import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, Banknote, ChevronDown, CheckCircle2 } from 'lucide-react';
import api from '../api';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH_AT_COUNTER');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tableWarning, setTableWarning] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartRes, tablesRes] = await Promise.all([
          api.get('/cart'),
          api.get('/tables')
        ]);
        setCart(cartRes.data);
        setTables(Array.isArray(tablesRes.data) ? tablesRes.data : tablesRes.data.tables || []);
        
        const savedTable = localStorage.getItem('currentTableId');
        if (savedTable) {
          setSelectedTableId(savedTable);
        }
      } catch (err) {
        console.error("Failed to load checkout data:", err);
        setError('Failed to load checkout details. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedTableId) {
      setTableWarning("Please select a dining table before placing your order.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setTableWarning('');
    setIsSubmitting(true);
    try {
      await api.post('/orders/checkout', {
        tableId: Number(selectedTableId),
        paymentMode: paymentMode
      });
      
      setOrderSuccess(true);
      localStorage.removeItem('currentTableId');
    } catch (err) {
      console.error("Order placement failed:", err);
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500"></div>
    </div>
  );

  if (orderSuccess) return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white font-sans">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">✓</div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Order Placed Successfully!</h1>
      <p className="text-gray-500 text-sm mb-6">Your kitchen ticket has been sent. You can track its live preparation progress on your orders page.</p>
      <div className="w-full space-y-3">
        <button onClick={() => navigate('/my-orders')} className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 transition-colors shadow-sm">
          View My Orders
        </button>
        <button onClick={() => navigate('/menu')} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
          Back to Menu
        </button>
      </div>
    </div>
  );

  const cartItems = cart?.cartItems || cart?.items || [];
  const totalPrice = cart?.totalPrice || cartItems.reduce((acc, item) => {
    const unitPrice = item.product?.price || item.price || item.unitPrice || 0;
    return acc + (unitPrice * item.quantity);
  }, 0);

  return (
    <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen pb-32 font-sans text-gray-900 p-5">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/menu')} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-extrabold">Checkout</h1>
      </div>

      {error && <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl text-sm mb-4 font-medium">{error}</div>}
      {tableWarning && <div className="bg-amber-50 text-amber-700 border border-amber-200 p-4 rounded-2xl text-sm mb-4 font-bold">{tableWarning}</div>}

      <div className="space-y-6">
        
        {/* Compact & Clean Table Selector */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dining Table</h2>
            <p className="text-xs text-gray-500 font-medium">Where are you seated?</p>
          </div>

          <div className="relative w-44">
            <select
              value={selectedTableId}
              onChange={(e) => {
                setSelectedTableId(e.target.value);
                setTableWarning('');
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-xs font-bold text-gray-800 appearance-none focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15 transition-all cursor-pointer"
            >
              <option value="">Select Table...</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  Table #{table.tableNumber}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Order Summary</h2>
          {cartItems.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Your cart is empty.</p>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item, idx) => {
                const itemPrice = item.product?.price || item.price || item.unitPrice || 0;
                const itemName = item.product?.name || item.productName || "Menu Item";

                return (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-800 font-medium">
                      <span className="font-bold text-orange-600 mr-2">{item.quantity}x</span>
                      {itemName}
                    </span>
                    <span className="font-bold text-gray-900">
                      ${(itemPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center mt-3">
                <span className="font-extrabold text-gray-800">Total Amount</span>
                <span className="text-xl font-extrabold text-orange-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Mode Selection */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Payment Mode</h2>
          <div className="grid grid-cols-3 gap-3">
            
            <button
              type="button"
              onClick={() => setPaymentMode('CASH_AT_COUNTER')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center font-bold text-xs transition-all ${
                paymentMode === 'CASH_AT_COUNTER' 
                  ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm' 
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Banknote size={20} />
              Cash at Counter
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('CARD')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center font-bold text-xs transition-all ${
                paymentMode === 'CARD' 
                  ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm' 
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CreditCard size={20} />
              Card
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('UPI')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 text-center font-bold text-xs transition-all ${
                paymentMode === 'UPI' 
                  ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm' 
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Wallet size={20} />
              UPI / Online
            </button>

          </div>
        </div>

      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg max-w-2xl mx-auto">
        <button
          disabled={isSubmitting || cartItems.length === 0}
          onClick={handlePlaceOrder}
          className="w-full bg-orange-500 text-white font-extrabold py-4 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-sm"
        >
          {isSubmitting ? "Placing Order..." : `Confirm & Place Order ($${totalPrice.toFixed(2)})`}
        </button>
      </div>

    </div>
  );
};

export default CheckoutPage;