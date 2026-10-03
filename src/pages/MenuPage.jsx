import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Plus, Minus, MapPin, ChevronRight, Filter, ClipboardList, LogOut, User, Utensils } from 'lucide-react';
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
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  // --- 2. SIGNED QUANTITY CART UPDATER ---
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

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentTableId');
    navigate('/login');
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f6f2] text-stone-500">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-stone-200 border-t-emerald-800" />
      <p className="text-sm font-medium">Preparing the menu...</p>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-5">
      <div className="max-w-md rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <p className="mb-2 text-lg font-semibold text-stone-900">We couldn’t load the menu</p>
        <p className="text-sm leading-6 text-stone-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#f7f6f2] pb-32 font-sans text-stone-900">
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-900 text-amber-300 shadow-sm">
              <Utensils size={19} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-stone-900">DineFlow</h1>
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 sm:block">Good food, made easy</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => navigate('/my-orders')}
                  className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 sm:flex"
                >
                  <ClipboardList size={17} /> My orders
                </button>
                <button
                  onClick={() => navigate('/checkout')}
                  aria-label={`Open cart${totalCartItems > 0 ? ` with ${totalCartItems} items` : ''}`}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition hover:border-stone-300 hover:bg-stone-50"
                >
                  <ShoppingCart size={19} />
                  {totalCartItems > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-amber-500 px-1 text-[10px] font-bold text-stone-950">
                      {totalCartItems}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-stone-500 transition hover:bg-red-50 hover:text-red-700 sm:flex"
                >
                  <LogOut size={16} /> Log out
                </button>
                <div className="relative sm:hidden">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    aria-label="Open account menu"
                    aria-expanded={showUserMenu}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-700"
                  >
                    <User size={18} />
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-stone-100 bg-white py-1 shadow-xl">
                      <button
                        onClick={() => { setShowUserMenu(false); navigate('/my-orders'); }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-stone-700 hover:bg-stone-50"
                      >
                        <ClipboardList size={16} className="text-emerald-800" /> My orders
                      </button>
                      <button
                        onClick={() => { setShowUserMenu(false); handleLogout(); }}
                        className="flex w-full items-center gap-2 border-t border-stone-100 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} /> Log out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => navigate('/login?redirect=/menu')}
                className="rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 sm:px-8">
        <section className="pt-8 sm:pt-12">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#173c32] px-6 py-9 text-white shadow-xl shadow-emerald-950/10 sm:px-10 sm:py-12 lg:px-14">
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[1px] border-white/10" />
            <div className="absolute -right-2 -top-10 h-56 w-56 rounded-full border-[1px] border-white/10" />
            <div className="absolute -bottom-32 right-1/4 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative max-w-2xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Made fresh, served with care</p>
              <h2 className="max-w-xl font-serif text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                A good meal is just a few taps away.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-emerald-50/75 sm:text-base">
                Explore our kitchen’s favorites, prepared with fresh ingredients and a little extra love.
              </p>
              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur">
                <MapPin size={16} className={tableInfo ? 'text-amber-300' : 'text-emerald-100/70'} />
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                  {tableInfo ? `Table ${tableInfo.tableNumber}` : 'Order for pickup or dine in'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-5 pt-10 sm:pt-14">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">From our kitchen</p>
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Explore the menu</h2>
              <p className="mt-2 text-sm text-stone-500">Find something delicious for every appetite.</p>
            </div>
            <p className="text-sm font-medium text-stone-500">
              {displayedProducts.length} {displayedProducts.length === 1 ? 'dish' : 'dishes'}
            </p>
          </div>

          <div className="mb-7 space-y-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="search"
                  aria-label="Search menu"
                  placeholder="Search dishes or ingredients"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-800/10"
                />
              </label>
              <label className="flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-3 text-stone-500 focus-within:border-emerald-700">
                <Filter size={16} />
                <span className="sr-only">Sort menu items</span>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="cursor-pointer bg-transparent text-sm font-semibold text-stone-700 outline-none"
                >
                  <option value="default">Recommended</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </label>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {uniqueCategoryNames.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-900 text-white shadow-sm'
                      : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {displayedProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-5 py-16 text-center">
              <Search className="mx-auto mb-3 text-stone-300" size={28} />
              <p className="font-semibold text-stone-800">No dishes found</p>
              <p className="mt-1 text-sm text-stone-500">Try another search or choose a different category.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayedProducts.map((product) => {
                const quantity = getProductQuantityInCart(product.id);
                const catName = getCategoryName(product.categoryId);

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-900/5"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:8080${product.imageUrl}`}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                          <Utensils className="text-stone-300" size={32} />
                        </div>
                      )}
                      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-900 shadow-sm backdrop-blur">
                        {catName}
                      </span>
                    </div>
                    <div className="flex min-h-[190px] flex-col p-5">
                      <h3 className="text-lg font-bold leading-snug text-stone-900">{product.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500">
                        {product.description || 'Freshly prepared with quality ingredients.'}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <span className="text-xl font-bold tracking-tight text-stone-900">${product.price.toFixed(2)}</span>
                        {quantity === 0 ? (
                          <button
                            onClick={() => updateCart(product.id, 1)}
                            disabled={isUpdatingCart}
                            aria-label={`Add ${product.name} to cart`}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Plus size={17} strokeWidth={2.5} /> Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 rounded-xl border border-emerald-900/10 bg-emerald-50 px-2 py-1.5">
                            <button
                              onClick={() => updateCart(product.id, -1)}
                              disabled={isUpdatingCart}
                              aria-label={`Remove one ${product.name}`}
                              className="rounded-lg p-1.5 text-emerald-900 transition hover:bg-white disabled:opacity-50"
                            >
                              <Minus size={16} strokeWidth={2.5} />
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-stone-900">
                              {isUpdatingCart ? '...' : quantity}
                            </span>
                            <button
                              onClick={() => updateCart(product.id, 1)}
                              disabled={isUpdatingCart}
                              aria-label={`Add one ${product.name}`}
                              className="rounded-lg p-1.5 text-emerald-900 transition hover:bg-white disabled:opacity-50"
                            >
                              <Plus size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {totalCartItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 px-5 py-3 shadow-[0_-8px_32px_rgba(28,25,23,0.08)] backdrop-blur-md sm:px-8 sm:py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                {totalCartItems} {totalCartItems === 1 ? 'item' : 'items'} in your cart
              </p>
              <p className="mt-0.5 text-xl font-bold tracking-tight text-stone-900">${totalCartPrice.toFixed(2)}</p>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 sm:px-7"
            >
              View cart & checkout <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;