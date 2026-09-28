import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Plus, Minus, MapPin, ChevronRight, Filter } from 'lucide-react';
import api from '../api';

const MenuPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableToken = searchParams.get('table');

  const [tableInfo, setTableInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');
  
  const [cartItems, setCartItems] = useState([]);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);

  const isLoggedIn = !!localStorage.getItem('token');

  // --- 1. FETCH DATA FROM BACKEND ---
  useEffect(() => {
    const fetchData = async () => {
      // Table scan verification
      if (tableToken) {
        try {
          const tableRes = await api.get(`/tables/scan/${tableToken}`);
          setTableInfo(tableRes.data);
          localStorage.setItem('currentTableId', tableRes.data.id);
        } catch (err) {
          console.warn("Invalid table token.");
          localStorage.removeItem('currentTableId');
        }
      }

      try {
        // Fetch products and categories concurrently using your PublicMenuController endpoints
        const [productRes, categoryRes] = await Promise.all([
          api.get('/menu/products'),
          api.get('/menu/categories')
        ]);
        
        setProducts(productRes.data);
        setCategories(categoryRes.data);
      } catch (err) {
        console.error("Menu fetch error:", err);
        setError('Failed to load menu. Please check your connection.');
      } finally {
        setLoading(false);
      }

      // Fetch backend cart if authenticated
      if (isLoggedIn) {
        fetchBackendCart();
      }
    };
    
    fetchData();
  }, [tableToken, isLoggedIn]);

  const fetchBackendCart = async () => {
    try {
      const res = await api.get('/cart');
      setCartItems(res.data.items || res.data || []); 
    } catch (err) {
      console.error("Could not fetch cart:", err);
    }
  };

  const getProductQuantityInCart = (productId) => {
    const item = cartItems.find(item => (item.product?.id === productId) || (item.productId === productId));
    return item ? item.quantity : 0;
  };

  // --- 2. SIGNED QUANTITY CART UPDATER (+1 for add, -1 for reduce) ---
  const updateCart = async (productId, quantityChange) => {
    if (!isLoggedIn) {
      navigate('/login?redirect=/menu');
      return;
    }

    setIsUpdatingCart(true);
    try {
      await api.post('/cart/add', { 
        productId: productId, 
        quantity: quantityChange 
      });
      await fetchBackendCart(); 
    } catch (err) {
      alert("Failed to update cart.");
    } finally {
      setIsUpdatingCart(false);
    }
  };

  // --- 3. CATEGORY MAPPER ---
  const getCategoryName = (categoryId) => {
    const matchedCategory = categories.find(c => c.id === categoryId);
    return matchedCategory ? matchedCategory.name : 'General';
  };

  const uniqueCategoryNames = ['All', ...categories.map(c => c.name)];

  // --- 4. FILTERING & SORTING ---
  let displayedProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const catName = getCategoryName(product.categoryId);
    const matchesCategory = selectedCategory === 'All' || catName === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (sortOrder === 'price-asc') {
    displayedProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === 'price-desc') {
    displayedProducts.sort((a, b) => b.price - a.price);
  }

  // --- 5. SECURE CART TOTALS ---
  const totalCartItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const totalCartPrice = cartItems.reduce((total, item) => {
    const productId = item.product?.id || item.productId;
    const menuProduct = products.find(p => p.id === productId);
    const price = menuProduct ? menuProduct.price : (item.price || 0);
    return total + (price * item.quantity);
  }, 0);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
    </div>
  );
  
  if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto bg-gray-50 min-h-screen pb-28 font-sans text-gray-900 relative">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">DineFlow</h1>
        <div className="flex items-center gap-4">
          {!isLoggedIn && (
             <button onClick={() => navigate('/login?redirect=/menu')} className="text-sm font-bold text-orange-500 hover:text-orange-600">
               Login
             </button>
          )}
          <button onClick={() => navigate('/checkout')} className="relative p-2 bg-white shadow-sm border border-gray-100 rounded-full hover:bg-gray-50">
            <ShoppingCart size={22} className="text-gray-800" />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* WELCOME HERO */}
      <section className="px-5 pt-6 pb-2 max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <h2 className="text-xl font-medium text-gray-200 mb-1">Welcome to</h2>
          <h3 className="text-3xl font-extrabold mb-4">Our Restaurant</h3>
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <MapPin size={16} className={tableInfo ? "text-orange-400" : "text-gray-400"} />
            <span className="text-sm font-semibold tracking-wide">
              {tableInfo ? `TABLE ${tableInfo.tableNumber}` : "ORDER ANYTIME"}
            </span>
          </div>
        </div>
      </section>

      {/* SEARCH, CATEGORIES & SORTING */}
      <div className="px-5 py-4 sticky top-[73px] z-40 bg-gray-50/95 backdrop-blur-sm max-w-3xl mx-auto space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search delicious food..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-none shadow-sm rounded-full py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            {uniqueCategoryNames.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                  selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm shrink-0">
            <Filter size={16} className="text-gray-400" />
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRODUCT GRID */}
      <main className="px-5 mt-2 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
        {displayedProducts.length === 0 ? (
          <div className="text-center text-gray-500 py-10 col-span-full">No items found matching your filters.</div>
        ) : (
          displayedProducts.map((product) => {
            const quantity = getProductQuantityInCart(product.id);
            const catName = getCategoryName(product.categoryId);
            
            return (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex gap-4 hover:shadow-md transition-shadow">
                
                {/* Product Image */}
                <div className="relative shrink-0">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:8080${product.imageUrl}`} 
                      alt={product.name} 
                      className="w-28 h-28 object-cover rounded-xl shadow-inner"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                      <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">No Image</span>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 flex flex-col justify-center py-1">
                  <span className="text-[10px] uppercase tracking-wider text-orange-500 font-bold mb-1">
                    {catName}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{product.name}</h3>
                  <p className="text-gray-500 text-xs line-clamp-2 mb-3 leading-relaxed">
                    {product.description || "Freshly prepared with quality ingredients."}
                  </p>
                  
                  <div className="mt-auto flex justify-between items-end">
                    <span className="text-lg font-extrabold text-gray-900">${product.price.toFixed(2)}</span>
                    
                    {/* Cart Controller Controls */}
                    {quantity === 0 ? (
                      <button 
                        onClick={() => updateCart(product.id, 1)} 
                        disabled={isUpdatingCart} 
                        className="bg-orange-50 text-orange-600 border border-orange-200 p-2 rounded-xl hover:bg-orange-500 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Plus size={20} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-2 py-1.5">
                        <button 
                          onClick={() => updateCart(product.id, -1)} 
                          disabled={isUpdatingCart} 
                          className="text-orange-600 hover:text-orange-800 p-1 disabled:opacity-50"
                        >
                          <Minus size={16} strokeWidth={3} />
                        </button>
                        <span className="font-bold text-sm text-gray-900 w-4 text-center">
                          {isUpdatingCart ? '...' : quantity}
                        </span>
                        <button 
                          onClick={() => updateCart(product.id, 1)} 
                          disabled={isUpdatingCart} 
                          className="text-orange-600 hover:text-orange-800 p-1 disabled:opacity-50"
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* FLOATING CHECKOUT BAR */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">{totalCartItems} {totalCartItems === 1 ? 'Item' : 'Items'}</p>
              <p className="text-xl font-extrabold text-gray-900">${totalCartPrice.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => navigate('/checkout')} 
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors w-full sm:w-auto justify-center"
            >
              View Cart & Checkout <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default MenuPage;