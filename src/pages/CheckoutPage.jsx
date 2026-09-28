import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, CheckCircle2, MapPin } from 'lucide-react';
import api from '../api';

const CheckoutPage = () => {
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]); // For table selection fallback
  const [selectedTableId, setSelectedTableId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Fetch Cart, Products, and Tables on load
  const fetchCheckoutData = async () => {
    try {
      const [cartRes, menuRes] = await Promise.all([
        api.get('/cart'),
        api.get('/menu/products')
      ]);

      const rawCart = cartRes.data.items || cartRes.data.cartItems || cartRes.data || [];
      setCartItems(rawCart);
      setProducts(menuRes.data);

      // Check if table was already saved via QR scan
      const savedTableId = localStorage.getItem('currentTableId');
      if (savedTableId) {
        setSelectedTableId(savedTableId);
      } else {
        // Fallback: Try fetching available tables if user didn't scan a QR code
        try {
          const tableRes = await api.get('/tables'); // Adjust route if your public table list endpoint differs
          setTables(tableRes.data);
        } catch (tErr) {
          console.warn("Could not fetch table list automatically.");
        }
      }
    } catch (err) {
      console.error("Failed to load checkout data:", err);
      setError('Failed to load your cart. Please try logging in again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckoutData();
  }, []);

  const updateQuantity = async (productId, change) => {
    try {
      await api.post('/cart/add', { productId, quantity: change });
      await fetchCheckoutData();
    } catch (err) {
      alert("Failed to update cart item.");
    }
  };

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      // Calls your exact backend checkout route: POST /api/v1/orders/checkout
      await api.post('/orders/checkout', {
        tableId: selectedTableId ? Number(selectedTableId) : null
      });
      
      setOrderSuccess(true);
      localStorage.removeItem('currentTableId');
    } catch (err) {
      console.error("Order failed:", err);
      alert(err.response?.data?.message || "Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
    </div>
  );

  if (orderSuccess) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-green-100 p-4 rounded-full mb-4">
        <CheckCircle2 size={48} className="text-green-600" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Order Placed Successfully!</h1>
      <p className="text-gray-500 max-w-sm mb-8">Your order has been sent to the kitchen. Sit back and relax while we prepare your food.</p>
      <button 
        onClick={() => navigate('/menu')} 
        className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
      >
        Back to Menu
      </button>
    </div>
  );

  const getProductDetails = (item) => {
    const productId = item.productId || item.product?.id || item.id;
    const matched = products.find(p => p.id === productId);
    return {
      id: productId,
      name: matched?.name || item.productName || item.name || 'Delicious Item',
      price: matched?.price || item.price || 0,
      imageUrl: matched?.imageUrl || item.imageUrl || null
    };
  };

  const totalPrice = cartItems.reduce((acc, item) => {
    const product = getProductDetails(item);
    return acc + (product.price * item.quantity);
  }, 0);

  return (
    <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen pb-32 font-sans text-gray-900 p-5">
      
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/menu')} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-extrabold">Your Cart & Checkout</h1>
      </div>

      {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-4 font-medium">{error}</div>}

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm mt-10">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-1">Your cart is empty</h2>
          <p className="text-gray-400 text-sm mb-6">Explore our menu and add some delicious food!</p>
          <button onClick={() => navigate('/menu')} className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors">
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TABLE SELECTION BOX */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Dining Table</h3>
                <p className="text-xs text-gray-500">
                  {selectedTableId ? `Assigned to Table #${selectedTableId}` : "No table scanned or selected"}
                </p>
              </div>
            </div>

            {/* If no table was scanned, let them pick from a dropdown */}
            {!localStorage.getItem('currentTableId') && tables.length > 0 && (
              <select 
                value={selectedTableId} 
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-sm font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select Table</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>Table {t.tableNumber || t.id}</option>
                ))}
              </select>
            )}
          </div>

          {/* Items List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {cartItems.map((item, index) => {
              const product = getProductDetails(item);
              const subtotal = product.price * item.quantity;

              return (
                <div key={product.id || index} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:8080${product.imageUrl}`} 
                        alt={product.name} 
                        className="w-16 h-16 object-cover rounded-xl border border-gray-100"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs font-medium">No Img</div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">{product.name}</h3>
                      <p className="text-sm font-extrabold text-orange-600">${product.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1">
                      <button onClick={() => updateQuantity(product.id, -1)} className="text-gray-600 hover:text-black p-1">
                        <Minus size={14} strokeWidth={2.5} />
                      </button>
                      <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(product.id, 1)} className="text-gray-600 hover:text-black p-1">
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                    
                    <span className="font-extrabold text-gray-900 w-16 text-right">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bill Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
            <h3 className="font-bold text-gray-800 text-lg mb-2">Order Summary</h3>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-bold text-gray-800">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax & Service Fee (5%)</span>
              <span className="font-bold text-gray-800">${(totalPrice * 0.05).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-lg font-extrabold text-gray-900">
              <span>Total Amount</span>
              <span className="text-orange-600">${(totalPrice * 1.05).toFixed(2)}</span>
            </div>
          </div>

          {/* Place Order Button */}
          <button 
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:bg-orange-300"
          >
            {isSubmitting ? 'Placing Order...' : 'Confirm & Place Order'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;