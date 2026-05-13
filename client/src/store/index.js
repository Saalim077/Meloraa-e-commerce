import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI, productAPI, categoryAPI, orderAPI, analyticsAPI, returnAPI } from '../utils/api';

// ─── Auth Slice ───────────────────────────────────────────────────────────────
export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try { const res = await authAPI.login(data); return res.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Login failed'); }
});
export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try { const res = await authAPI.register(data); return res.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Registration failed'); }
});
export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try { const res = await authAPI.me(); return res.data; } catch (e) { return rejectWithValue(e.response?.data?.message); }
});
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authAPI.logout(); return null;
});
export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try { const res = await authAPI.updateProfile(data); return res.data; } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const authSlice = createSlice({
  name: 'auth', initialState: { user: null, loading: false, error: null, initialized: false },
  reducers: { clearError: (s) => { s.error = null; } },
  extraReducers: (b) => {
    const handle = (thunk) => {
      b.addCase(thunk.pending, (s) => { s.loading = true; s.error = null; });
      b.addCase(thunk.fulfilled, (s, a) => {
        s.loading = false;
        if (a.payload?.user) s.user = a.payload.user;
        if (thunk === logoutUser) { s.user = null; }
        if (thunk === fetchMe) { s.user = a.payload?.user || null; s.initialized = true; }
      });
      b.addCase(thunk.rejected, (s, a) => { s.loading = false; s.error = a.payload; if (thunk === fetchMe) s.initialized = true; });
    };
    [loginUser, registerUser, fetchMe, logoutUser, updateProfile].forEach(handle);
  },
});

// ─── Cart Slice ───────────────────────────────────────────────────────────────
const loadCart = () => { try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; } };
const saveCart = (items) => localStorage.setItem('cart', JSON.stringify(items));

const cartSlice = createSlice({
  name: 'cart', initialState: { items: loadCart(), open: false },
  reducers: {
    addToCart: (s, a) => {
      const { quantity = 1 } = a.payload;
      const existing = s.items.find(i => i._id === a.payload._id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, a.payload.stock || 99);
      } else {
        s.items.push({ ...a.payload, quantity });
      }
      saveCart(s.items);
    },
    removeFromCart: (s, a) => { s.items = s.items.filter(i => i._id !== a.payload); saveCart(s.items); },
    updateQty: (s, a) => {
      const item = s.items.find(i => i._id === a.payload.id);
      if (item) {
        item.quantity = a.payload.qty;
        if (item.quantity <= 0) s.items = s.items.filter(i => i._id !== a.payload.id);
      }
      saveCart(s.items);
    },
    clearCart: (s) => { s.items = []; localStorage.removeItem('cart'); },
    toggleCart: (s) => { s.open = !s.open; },
    openCart: (s) => { s.open = true; },
    closeCart: (s) => { s.open = false; },
  },
});

// ─── Products Slice ───────────────────────────────────────────────────────────
export const fetchProducts = createAsyncThunk('products/fetch', async (params) => {
  const res = await productAPI.getAll(params); return res.data;
});
export const fetchProduct = createAsyncThunk('products/fetchOne', async (slug) => {
  const res = await productAPI.getOne(slug); return res.data;
});

const productsSlice = createSlice({
  name: 'products', initialState: { items: [], current: null, loading: false, error: null, pagination: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchProducts.pending, (s) => { s.loading = true; });
    b.addCase(fetchProducts.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.products; s.pagination = a.payload.pagination; });
    b.addCase(fetchProducts.rejected, (s, a) => { s.loading = false; s.error = a.error.message; });
    b.addCase(fetchProduct.pending, (s) => { s.loading = true; s.current = null; });
    b.addCase(fetchProduct.fulfilled, (s, a) => { s.loading = false; s.current = a.payload.product; });
    b.addCase(fetchProduct.rejected, (s) => { s.loading = false; });
  },
});

// ─── Orders Slice ─────────────────────────────────────────────────────────────
export const createOrder = createAsyncThunk('orders/create', async (data, { rejectWithValue }) => {
  try { const res = await orderAPI.create(data); return res.data; } catch (e) { return rejectWithValue(e.response?.data?.message); }
});
export const fetchMyOrders = createAsyncThunk('orders/myOrders', async () => {
  const res = await orderAPI.myOrders(); return res.data;
});
export const fetchAllOrders = createAsyncThunk('orders/allOrders', async (params) => {
  const res = await orderAPI.getAll(params); return res.data;
});
export const cancelOrder = createAsyncThunk('orders/cancel', async (id, { rejectWithValue }) => {
  try { const res = await orderAPI.cancel(id); return res.data; } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const ordersSlice = createSlice({
  name: 'orders', initialState: { myOrders: [], allOrders: [], lastOrder: null, loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(createOrder.pending, (s) => { s.loading = true; });
    b.addCase(createOrder.fulfilled, (s, a) => { s.loading = false; s.lastOrder = a.payload.order; });
    b.addCase(createOrder.rejected, (s) => { s.loading = false; });
    b.addCase(fetchMyOrders.fulfilled, (s, a) => { s.myOrders = a.payload.orders; });
    b.addCase(fetchAllOrders.fulfilled, (s, a) => { s.allOrders = a.payload.orders; });
    b.addCase(cancelOrder.fulfilled, (s, a) => {
      const idx = s.myOrders.findIndex(o => o._id === a.payload.order._id);
      if (idx > -1) s.myOrders[idx] = { ...s.myOrders[idx], ...a.payload.order };
    });
  },
});

// ─── Categories Slice ─────────────────────────────────────────────────────────
export const fetchCategories = createAsyncThunk('categories/fetch', async () => {
  const res = await categoryAPI.getAll(); return res.data;
});

const categoriesSlice = createSlice({
  name: 'categories', initialState: { items: [], loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchCategories.pending, (s) => { s.loading = true; });
    b.addCase(fetchCategories.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.categories; });
    b.addCase(fetchCategories.rejected, (s) => { s.loading = false; });
  },
});

// ─── Wishlist Slice ───────────────────────────────────────────────────────────
const loadWishlist = () => { try { return JSON.parse(localStorage.getItem('wishlist')) || []; } catch { return []; } };
const wishlistSlice = createSlice({
  name: 'wishlist', initialState: { items: loadWishlist() },
  reducers: {
    toggleWishlist: (s, a) => {
      const idx = s.items.findIndex(i => i._id === a.payload._id);
      if (idx > -1) s.items.splice(idx, 1);
      else s.items.push(a.payload);
      localStorage.setItem('wishlist', JSON.stringify(s.items));
    },
    clearWishlist: (s) => { s.items = []; localStorage.removeItem('wishlist'); },
  },
});

// ─── Analytics Slice ──────────────────────────────────────────────────────────
export const fetchAnalytics = createAsyncThunk('analytics/fetch', async () => {
  const res = await analyticsAPI.summary(); return res.data;
});
const analyticsSlice = createSlice({
  name: 'analytics', initialState: { data: null, loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAnalytics.pending, (s) => { s.loading = true; });
    b.addCase(fetchAnalytics.fulfilled, (s, a) => { s.loading = false; s.data = a.payload; });
    b.addCase(fetchAnalytics.rejected, (s) => { s.loading = false; });
  },
});

export const { clearError } = authSlice.actions;
export const { addToCart, removeFromCart, updateQty, clearCart, toggleCart, openCart, closeCart } = cartSlice.actions;
export const { toggleWishlist, clearWishlist } = wishlistSlice.actions;

// ─── Returns Slice ────────────────────────────────────────────────────────────
export const createReturn = createAsyncThunk('returns/create', async (data, { rejectWithValue }) => {
  try { const res = await returnAPI.create(data); return res.data; } catch (e) { return rejectWithValue(e.response?.data?.message); }
});
export const fetchMyReturns = createAsyncThunk('returns/myReturns', async () => {
  const res = await returnAPI.myReturns(); return res.data;
});
export const fetchReturn = createAsyncThunk('returns/fetchOne', async (id) => {
  const res = await returnAPI.getOne(id); return res.data;
});
export const cancelReturn = createAsyncThunk('returns/cancel', async (id) => {
  const res = await returnAPI.cancel(id); return res.data;
});
export const fetchAllReturns = createAsyncThunk('returns/allReturns', async (params) => {
  const res = await returnAPI.getAll(params); return res.data;
});
export const updateReturnStatus = createAsyncThunk('returns/updateStatus', async ({ id, data }, { rejectWithValue }) => {
  try { const res = await returnAPI.updateStatus(id, data); return res.data; } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const returnsSlice = createSlice({
  name: 'returns', initialState: { myReturns: [], allReturns: [], currentReturn: null, loading: false, pagination: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(createReturn.pending, (s) => { s.loading = true; });
    b.addCase(createReturn.fulfilled, (s) => { s.loading = false; });
    b.addCase(createReturn.rejected, (s) => { s.loading = false; });
    b.addCase(fetchMyReturns.fulfilled, (s, a) => { s.myReturns = a.payload.returns; });
    b.addCase(fetchReturn.fulfilled, (s, a) => { s.currentReturn = a.payload.rma; });
    b.addCase(fetchAllReturns.fulfilled, (s, a) => { s.allReturns = a.payload.returns; s.pagination = a.payload.pagination; });
  },
});

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
    products: productsSlice.reducer,
    orders: ordersSlice.reducer,
    categories: categoriesSlice.reducer,
    wishlist: wishlistSlice.reducer,
    analytics: analyticsSlice.reducer,
    returns: returnsSlice.reducer,
  },
});

export default store;
