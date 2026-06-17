// Client-side API fallback for static deployments
// Loads seed-data.json and intercepts fetch calls to /api/* routes

import type { Customer, Product, Sale, SaleItem, Appointment, LabOrder, Expense, Due, Staff, Prescription, Visit, Campaign, Notification } from './types';

interface SeedData {
  Customer?: Record<string, any>[];
  Product?: Record<string, any>[];
  Sale?: Record<string, any>[];
  SaleItem?: Record<string, any>[];
  Appointment?: Record<string, any>[];
  LabOrder?: Record<string, any>[];
  Expense?: Record<string, any>[];
  Due?: Record<string, any>[];
  Staff?: Record<string, any>[];
  Prescription?: Record<string, any>[];
  Visit?: Record<string, any>[];
  Campaign?: Record<string, any>[];
  Notification?: Record<string, any>[];
  Return?: Record<string, any>[];
  Attendance?: Record<string, any>[];
  SalaryRecord?: Record<string, any>[];
  PurchaseOrder?: Record<string, any>[];
}

let seed: SeedData | null = null;
let dataLoaded = false;
let dataPromise: Promise<void> | null = null;

function parseDate(s: string): Date | null {
  if (!s) return null;
  try { return new Date(s); } catch { return null; }
}

// For demo: treat ALL seed data as current month/today
function isSameDay(_d: Date, dateStr: string): boolean {
  return !!dateStr;
}

function isThisMonth(_d: Date, dateStr: string): boolean {
  return !!dateStr;
}

async function loadData(): Promise<void> {
  if (dataLoaded) return;
  if (dataPromise) { await dataPromise; return; }
  dataPromise = (async () => {
    try {
      const basePath = (document.querySelector('base')?.href || '').replace(/\/$/, '');
      const url = `${basePath || ''}/seed-data.json`;
      const res = await fetch(url);
      seed = await res.json();
      dataLoaded = true;
    } catch (e) {
      console.warn('Failed to load seed-data.json:', e);
      seed = {};
      dataLoaded = true;
    }
  })();
  await dataPromise;
}

// Dashboard handler
function handleDashboard(): Response {
  const customers = seed?.Customer || [];
  const sales = seed?.Sale || [];
  const products = seed?.Product || [];
  const appointments = seed?.Appointment || [];
  const labOrders = seed?.LabOrder || [];
  const dues = seed?.Due || [];
  const now = new Date();

  const todaySales = sales.filter(s => isSameDay(now, s.createdAt));
  const monthSales = sales.filter(s => isThisMonth(now, s.createdAt));

  const lowStockProducts = products.filter(p => p.stock < p.minStock);

  const customerMap = Object.fromEntries(customers.map((c: any) => [c.id, c]));

  const recentSales = sales.slice(-5).reverse().map(s => ({
    invoiceNo: s.invoiceNo,
    customerName: customerMap[s.customerId]?.name || 'Walk-in',
    amount: s.totalAmount,
    date: s.createdAt,
    paymentMode: s.paymentMode,
  }));

  const todayAppts = appointments.filter(a => isSameDay(now, a.date)).map(a => {
    const d = parseDate(a.date);
    const timeStr = d ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
    return {
      time: timeStr,
      customerName: customerMap[a.customerId]?.name || 'Unknown',
      purpose: a.purpose || 'General Visit',
      status: a.status?.toLowerCase() === 'confirmed' ? 'confirmed' : 'pending',
    };
  });

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const revenueByDay = days.map(day => {
    const daySales = monthSales.filter(s => { const d = parseDate(s.createdAt); return d && days[d.getDay()] === day; });
    return { day, revenue: Math.round(daySales.reduce((a: number, s: any) => a + s.totalAmount, 0)) };
  });

  const thisMonthCount = customers.filter(c => isThisMonth(now, c.createdAt)).length;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthCount = customers.filter(c => isThisMonth(lastMonth, c.createdAt)).length;

  const pendingDues = dues.filter(d => d.status === 'Pending' || d.status === 'Partial' || d.status === 'Overdue')
    .reduce((a, d: any) => a + d.amount - d.paid, 0);

  const body = {
    stats: {
      totalCustomers: customers.length,
      todaySales: Math.round(todaySales.reduce((a, s: any) => a + s.totalAmount, 0)),
      monthlyRevenue: Math.round(monthSales.reduce((a, s: any) => a + s.totalAmount, 0)),
      lowStockAlerts: lowStockProducts.length,
      pendingLabOrders: labOrders.filter(l => l.status !== 'Delivered').length,
      pendingDues: Math.round(pendingDues),
      overdueAppointments: appointments.filter(a => parseDate(a.date)! < now && a.status === 'Scheduled').length,
    },
    recentSales,
    appointments: todayAppts,
    lowStock: lowStockProducts.slice(0, 5).map(p => ({ name: p.name, stock: p.stock, minStock: p.minStock })),
    customerAcquisition: { thisMonth: thisMonthCount, lastMonth: lastMonthCount, byGroup: { New: 0, Regular: 0, Wholesale: 0, Premium: 0 } },
    revenueByDayOfWeek: revenueByDay,
    comparison: { revenueChange: 0, customerChange: 0 },
    pendingTasks: {
      labOrdersPending: labOrders.filter(l => l.status !== 'Delivered').length,
      duesOverdue: dues.filter(d => d.status === 'Overdue').length,
      appointmentsToday: appointments.filter(a => isSameDay(now, a.date)).length,
      lowStockItems: lowStockProducts.length,
    },
    todayPaymentModes: todaySales.reduce((acc: any, s: any) => {
      const mode = s.paymentMode || 'Cash';
      acc[mode] = acc[mode] || { mode, amount: 0, count: 0 };
      acc[mode].amount += s.totalAmount;
      acc[mode].count++;
      return acc;
    }, {}),
    todayAvgOrderValue: todaySales.length ? Math.round(todaySales.reduce((a, s: any) => a + s.totalAmount, 0) / todaySales.length) : 0,
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}

// Customers handler
function handleCustomers(url: URL): Response {
  const customers = seed?.Customer || [];
  const prescriptions = seed?.Prescription || [];
  const visits = seed?.Visit || [];
  const sales = seed?.Sale || [];

  const search = url.searchParams.get('search') || '';
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const page = parseInt(url.searchParams.get('page') || '1');

  const filtered = customers.filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const prescMap = prescriptions.reduce((acc: any, p: any) => {
    acc[p.customerId] = (acc[p.customerId] || 0) + 1;
    return acc;
  }, {});
  const visitMap = visits.reduce((acc: any, v: any) => {
    acc[v.customerId] = (acc[v.customerId] || 0) + 1;
    return acc;
  }, {});
  const salesMap = sales.reduce((acc: any, s: any) => {
    if (s.customerId) acc[s.customerId] = (acc[s.customerId] || 0) + 1;
    return acc;
  }, {});

  const data = paged.map((c: any) => ({
    ...c,
    _count: {
      prescriptions: prescMap[c.id] || 0,
      visits: visitMap[c.id] || 0,
      sales: salesMap[c.id] || 0,
    },
  }));

  return new Response(JSON.stringify({ data, total, page, limit, totalPages }), { headers: { 'Content-Type': 'application/json' } });
}

// Sales handler
function handleSales(url: URL): Response {
  const sales = seed?.Sale || [];
  const saleItems = seed?.SaleItem || [];
  const customers = seed?.Customer || [];
  const customerMap = Object.fromEntries(customers.map((c: any) => [c.id, c]));

  const limit = parseInt(url.searchParams.get('limit') || '10');
  const page = parseInt(url.searchParams.get('page') || '1');

  const itemsPerSale = saleItems.reduce((acc: any, si: any) => {
    acc[si.saleId] = (acc[si.saleId] || 0) + 1;
    return acc;
  }, {});

  const data = sales.map((s: any) => ({
    id: s.id,
    invoiceNo: s.invoiceNo,
    customerName: customerMap[s.customerId]?.name || 'Walk-in',
    itemsCount: itemsPerSale[s.id] || 0,
    subtotal: s.subtotal,
    discount: s.discount,
    cgst: s.cgst,
    sgst: s.sgst,
    total: s.totalAmount,
    paymentMode: s.paymentMode,
    status: s.status,
    createdAt: s.createdAt?.slice(0, 10) || s.createdAt,
  }));

  const total = data.length;
  const reversed = data.reverse();
  const paged = reversed.slice((page - 1) * limit, page * limit);

  return new Response(JSON.stringify({ sales: paged, total, page, pageSize: limit }), { headers: { 'Content-Type': 'application/json' } });
}

// Products handler
function handleProducts(url: URL): Response {
  const products = (seed?.Product || []).filter(p => p.isActive !== false);
  const lowStock = products.filter(p => p.stock < p.minStock);
  const limit = parseInt(url.searchParams.get('pageSize') || url.searchParams.get('limit') || '10');
  const page = parseInt(url.searchParams.get('page') || '1');
  const total = products.length;

  const reversed = [...products].reverse();
  const paged = reversed.slice((page - 1) * limit, page * limit);

  return new Response(JSON.stringify({
    products: paged, total, page, pageSize: limit, totalPages: Math.ceil(total / limit),
    lowStockCount: lowStock.length, lowStockItems: lowStock.slice(0, 20),
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Low stock handler
function handleLowStock(): Response {
  const products = (seed?.Product || []).filter(p => p.isActive !== false);
  const items = products.filter(p => p.stock < p.minStock).map((p: any) => ({
    id: p.id, name: p.name, category: p.category, brand: p.brand,
    stock: p.stock, minStock: p.minStock, needed: p.minStock - p.stock,
    sku: p.sku, costPrice: p.costPrice, reorderCost: (p.minStock - p.stock) * (p.costPrice || 0),
    supplier: p.supplier, supplierPhone: p.supplierPhone,
  }));

  const byCategory: Record<string, number> = {};
  items.forEach((i: any) => { byCategory[i.category] = (byCategory[i.category] || 0) + 1; });

  return new Response(JSON.stringify({
    total: items.length, byCategory,
    totalReorderValue: items.reduce((a, i: any) => a + i.reorderCost, 0),
    items,
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Appointments handler
function handleAppointments(url: URL): Response {
  const appointments = seed?.Appointment || [];
  const customers = seed?.Customer || [];
  const customerMap = Object.fromEntries(customers.map((c: any) => [c.id, c]));

  const data = appointments.map((a: any) => ({
    ...a,
    customer: { id: a.customerId, name: customerMap[a.customerId]?.name || '', phone: customerMap[a.customerId]?.phone || '', email: customerMap[a.customerId]?.email || null },
  }));

  const limit = parseInt(url.searchParams.get('limit') || '100');
  const page = parseInt(url.searchParams.get('page') || '1');
  const total = data.length;

  return new Response(JSON.stringify({
    data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Lab orders handler
function handleLabOrders(url: URL): Response {
  const orders = seed?.LabOrder || [];
  const customers = seed?.Customer || [];
  const customerMap = Object.fromEntries(customers.map((c: any) => [c.id, c]));
  const products = seed?.Product || [];
  const productMap = Object.fromEntries(products.map((p: any) => [p.id, p]));

  const status = url.searchParams.get('status');
  const searchType = url.searchParams.get('searchType');
  const limit = 20;
  const page = parseInt(url.searchParams.get('page') || '1');

  if (searchType === 'customers') {
    return new Response(JSON.stringify({
      results: customers.slice(0, 20).map((c: any) => ({
        id: c.id, name: c.name, phone: c.phone,
        lastPrescription: null,
      })),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (searchType === 'frames') {
    return new Response(JSON.stringify({
      results: products.filter(p => p.category === 'Frames').slice(0, 20).map((p: any) => ({
        id: p.id, name: p.name, brand: p.brand, price: p.price,
        frameWidth: p.frameWidth, bridge: p.bridge, temple: p.temple,
      })),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  const filtered = orders.filter((o: any) => !status || status === 'all' || o.status === status);
  const data = filtered.map((o: any) => ({
    ...o,
    customerName: customerMap[o.customerId]?.name || null,
    customerPhone: customerMap[o.customerId]?.phone || null,
    frameName: o.frameId ? productMap[o.frameId]?.name : null,
  }));

  const total = data.length;
  const paged = data.slice((page - 1) * limit, page * limit);

  return new Response(JSON.stringify({
    orders: paged, totalPages: Math.ceil(total / limit), total,
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Expenses handler
function handleExpenses(url: URL): Response {
  const expenses = seed?.Expense || [];
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const page = parseInt(url.searchParams.get('page') || '1');
  const total = expenses.length;
  const paged = expenses.slice((page - 1) * limit, page * limit);

  return new Response(JSON.stringify({
    data: paged, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    summary: { totalAmount: expenses.reduce((a, e: any) => a + e.amount, 0) },
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Dues handler
function handleDues(url: URL): Response {
  const dues = seed?.Due || [];
  const customers = seed?.Customer || [];
  const customerMap = Object.fromEntries(customers.map((c: any) => [c.id, c]));
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const page = parseInt(url.searchParams.get('page') || '1');
  const total = dues.length;

  const data = dues.map((d: any) => ({
    ...d,
    customer: { id: d.customerId, name: customerMap[d.customerId]?.name || '', phone: customerMap[d.customerId]?.phone || '' },
  }));
  const paged = data.slice((page - 1) * limit, page * limit);

  return new Response(JSON.stringify({
    data: paged, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    summary: {
      totalDue: dues.reduce((a, d: any) => a + d.amount, 0),
      totalPaid: dues.reduce((a, d: any) => a + d.paid, 0),
      totalOutstanding: dues.reduce((a, d: any) => a + d.amount - d.paid, 0),
    },
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Reports handler
function handleReports(url: URL): Response {
  const type = url.searchParams.get('type') || '';
  const sales = seed?.Sale || [];
  const saleItems = seed?.SaleItem || [];
  const products = seed?.Product || [];
  const customers = seed?.Customer || [];
  const visits = seed?.Visit || [];

  if (type === 'sales-trend') {
    const data = sales.map((s: any) => {
      const d = s.createdAt?.slice(0, 10) || '';
      const dayItems = saleItems.filter((si: any) => si.saleId === s.id);
      return { date: d, total: s.totalAmount, count: dayItems.length };
    });
    return new Response(JSON.stringify({ report: 'sales-trend', period: 'last-30-days', data }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (type === 'top-products') {
    const productSales: Record<string, { qty: number; revenue: number }> = {};
    saleItems.forEach((si: any) => {
      if (!productSales[si.productId]) productSales[si.productId] = { qty: 0, revenue: 0 };
      productSales[si.productId].qty += si.qty;
      productSales[si.productId].revenue += si.total || si.qty * si.price;
    });
    const productMap = Object.fromEntries(products.map((p: any) => [p.id, p]));
    const data = Object.entries(productSales)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 10)
      .map(([id, stats]) => {
        const p = productMap[id] || {};
        return { productId: id, name: (p as any).name || '', sku: (p as any).sku || '', category: (p as any).category || '', brand: (p as any).brand || '', price: (p as any).price || 0, currentStock: (p as any).stock || 0, totalQtySold: stats.qty, totalRevenue: Math.round(stats.revenue) };
      });
    return new Response(JSON.stringify({ report: 'top-products', data }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (type === 'top-customers') {
    const customerSales: Record<string, number> = {};
    sales.forEach((s: any) => { if (s.customerId) customerSales[s.customerId] = (customerSales[s.customerId] || 0) + s.totalAmount; });
    const customerMap = Object.fromEntries(customers.map((c: any) => [c.id, c]));
    const prescCount: Record<string, number> = {};
    (seed?.Prescription || []).forEach((p: any) => { prescCount[p.customerId] = (prescCount[p.customerId] || 0) + 1; });
    const visitCount: Record<string, number> = {};
    visits.forEach((v: any) => { visitCount[v.customerId] = (visitCount[v.customerId] || 0) + 1; });
    const salesCount: Record<string, number> = {};
    sales.forEach((s: any) => { if (s.customerId) salesCount[s.customerId] = (salesCount[s.customerId] || 0) + 1; });

    const data = Object.entries(customerSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, spent]) => {
        const c = customerMap[id] || {};
        return { id, name: (c as any).name || '', phone: (c as any).phone || '', email: (c as any).email, group: (c as any).group, loyaltyPoints: (c as any).loyaltyPoints || 0, totalSpent: spent, _count: { sales: salesCount[id] || 0, visits: visitCount[id] || 0, prescriptions: prescCount[id] || 0 } };
      });
    return new Response(JSON.stringify({ report: 'top-customers', data }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (type === 'inventory-turnover') {
    const productSales: Record<string, number> = {};
    saleItems.forEach((si: any) => { productSales[si.productId] = (productSales[si.productId] || 0) + si.qty; });
    const data = products.filter(p => p.isActive !== false).map((p: any) => ({
      productId: p.id, name: p.name, sku: p.sku, category: p.category, brand: p.brand,
      price: p.price, costPrice: p.costPrice, currentStock: p.stock, minStock: p.minStock,
      totalQtySold: productSales[p.id] || 0, isActive: true, isLowStock: p.stock < p.minStock,
      turnoverRatio: p.stock > 0 ? parseFloat(((productSales[p.id] || 0) / p.stock).toFixed(2)) : 0,
    })).sort((a: any, b: any) => b.totalQtySold - a.totalQtySold);
    return new Response(JSON.stringify({ report: 'inventory-turnover', totalProducts: products.length, data }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (type === 'revenue-comparison') {
    const now = new Date();
    const thisMonth = sales.filter(s => isThisMonth(now, s.createdAt));
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthSales = sales.filter(s => isThisMonth(lastMonth, s.createdAt));
    const summary = (arr: any[]) => ({
      total: arr.reduce((a, s) => a + s.totalAmount, 0),
      orders: arr.length,
      cgst: arr.reduce((a, s) => a + s.cgst, 0),
      sgst: arr.reduce((a, s) => a + s.sgst, 0),
      igst: arr.reduce((a, s) => a + s.igst, 0),
    });
    return new Response(JSON.stringify({
      report: 'revenue-comparison',
      summary: { thisMonth: summary(thisMonth), lastMonth: summary(lastMonthSales), changePercent: 0 },
      thisMonthData: [], lastMonthData: [],
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (type === 'product-performance') {
    const productSales: Record<string, { qty: number; revenue: number }> = {};
    saleItems.forEach((si: any) => {
      if (!productSales[si.productId]) productSales[si.productId] = { qty: 0, revenue: 0 };
      productSales[si.productId].qty += si.qty;
      productSales[si.productId].revenue += si.total || si.qty * si.price;
    });
    const catRevenue: Record<string, { revenue: number; qty: number; products: number }> = {};
    products.forEach(p => {
      const stats = productSales[p.id] || { qty: 0, revenue: 0 };
      const cat = (p as any).category || 'Other';
      if (!catRevenue[cat]) catRevenue[cat] = { revenue: 0, qty: 0, products: 0 };
      catRevenue[cat].revenue += stats.revenue;
      catRevenue[cat].qty += stats.qty;
      catRevenue[cat].products++;
    });
    const productMap = Object.fromEntries(products.map((p: any) => [p.id, p]));
    const productData = Object.entries(productSales).map(([id, stats]) => {
      const p = productMap[id] || {};
      return { productId: id, name: (p as any).name, category: (p as any).category, brand: (p as any).brand, price: (p as any).price, costPrice: (p as any).costPrice, currentStock: (p as any).stock, totalQtySold: stats.qty, totalRevenue: Math.round(stats.revenue), profitMargin: (p as any).price > 0 ? Math.round(((p as any).price - ((p as any).costPrice || 0)) / (p as any).price * 100) : 0 };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const categoryData = Object.entries(catRevenue).map(([category, d]) => ({ category, ...d })).sort((a, b) => b.revenue - a.revenue);
    return new Response(JSON.stringify({
      report: 'product-performance', categoryData, productData,
      totalProducts: products.length, totalRevenue: categoryData.reduce((a, c) => a + c.revenue, 0),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (type === 'customer-acquisition') {
    return new Response(JSON.stringify({ report: 'customer-acquisition', period: 'last-30-days', totalNew: customers.length, thisWeekNew: 0, data: [] }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ report: type, data: [] }), { headers: { 'Content-Type': 'application/json' } });
}

// Staff handler
function handleStaff(url: URL): Response {
  const staff = seed?.Staff || [];
  return new Response(JSON.stringify({
    data: staff,
    pagination: { page: 1, limit: 100, total: staff.length, totalPages: 1 },
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Notifications handler
function handleNotifications(): Response {
  const notifications = seed?.Notification || [];
  // Generate some demo notifications if empty
  const demo = notifications.length > 0 ? notifications : [
    { id: 'n1', title: 'Welcome to Lotus Vision CRM', message: 'Your CRM is ready to use. Explore all 12 sections from the sidebar.', type: 'info', isRead: false, link: null, createdAt: new Date().toISOString() },
    { id: 'n2', title: 'Low Stock Alert', message: `${(seed?.Product || []).filter(p => p.stock < p.minStock).length} products are below minimum stock level.`, type: 'warning', isRead: false, link: null, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'n3', title: 'Lab Orders Pending', message: `${(seed?.LabOrder || []).filter(l => l.status === 'Pending').length} lab orders are pending.`, type: 'warning', isRead: false, link: null, createdAt: new Date(Date.now() - 7200000).toISOString() },
  ];
  return new Response(JSON.stringify({
    notifications: demo.slice(0, 20),
    unreadCount: demo.filter(n => !n.isRead).length,
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Purchase orders handler
function handlePurchaseOrders(url: URL): Response {
  const pos = seed?.PurchaseOrder || [];
  return new Response(JSON.stringify({
    purchaseOrders: pos, total: pos.length, page: 1, totalPages: 1,
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Visits handler
function handleVisits(url: URL): Response {
  const visits = seed?.Visit || [];
  const customers = seed?.Customer || [];
  const customerMap = Object.fromEntries(customers.map((c: any) => [c.id, c]));
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const page = parseInt(url.searchParams.get('page') || '1');

  const data = visits.map((v: any) => ({
    ...v, customer: { id: v.customerId, name: customerMap[v.customerId]?.name || '', phone: customerMap[v.customerId]?.phone || '', email: customerMap[v.customerId]?.email || null },
  }));
  const total = data.length;
  const paged = data.slice((page - 1) * limit, page * limit);

  return new Response(JSON.stringify({ data: paged, total, page, limit, totalPages: Math.ceil(total / limit) }), { headers: { 'Content-Type': 'application/json' } });
}

// Prescriptions handler
function handlePrescriptions(url: URL): Response {
  const customerId = url.searchParams.get('customerId');
  const prescriptions = (seed?.Prescription || []).filter(p => !customerId || p.customerId === customerId);
  return new Response(JSON.stringify({ prescriptions: prescriptions.slice(0, 10) }), { headers: { 'Content-Type': 'application/json' } });
}

// Accounting handler
function handleAccounting(): Response {
  const sales = seed?.Sale || [];
  const expenses = seed?.Expense || [];
  const totalIncome = sales.reduce((a, s: any) => a + s.totalAmount, 0);
  const totalExpense = expenses.reduce((a, e: any) => a + e.amount, 0);
  return new Response(JSON.stringify({
    accounting: [], summary: { totalIncome: Math.round(totalIncome), totalExpense: Math.round(totalExpense), netProfit: Math.round(totalIncome - totalExpense) },
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Campaigns handler
function handleCampaigns(): Response {
  const campaigns = seed?.Campaign || [];
  return new Response(JSON.stringify({
    data: campaigns, pagination: { page: 1, limit: 25, total: campaigns.length, totalPages: 1 },
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Route dispatcher
async function handleApiRequest(url: URL): Promise<Response | null> {
  await loadData();
  if (!seed) return null;

  const path = url.pathname.replace(/\/lotus-vision-crm/, '');

  try {
    if (path.match(/\/api\/dashboard$/)) return handleDashboard();
    if (path.match(/\/api\/customers$/)) return handleCustomers(url);
    if (path.match(/\/api\/sales$/)) return handleSales(url);
    if (path.match(/\/api\/products\/low-stock$/)) return handleLowStock();
    if (path.match(/\/api\/products$/)) return handleProducts(url);
    if (path.match(/\/api\/appointments$/)) return handleAppointments(url);
    if (path.match(/\/api\/lab-orders$/)) return handleLabOrders(url);
    if (path.match(/\/api\/expenses$/)) return handleExpenses(url);
    if (path.match(/\/api\/dues$/)) return handleDues(url);
    if (path.match(/\/api\/reports$/)) return handleReports(url);
    if (path.match(/\/api\/staff$/)) return handleStaff(url);
    if (path.match(/\/api\/staff\/salary$/)) return new Response(JSON.stringify({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }), { headers: { 'Content-Type': 'application/json' } });
    if (path.match(/\/api\/staff\/attendance$/)) return new Response(JSON.stringify({ data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } }), { headers: { 'Content-Type': 'application/json' } });
    if (path.match(/\/api\/notifications$/)) return handleNotifications();
    if (path.match(/\/api\/notifications\/mark-read$/)) return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    if (path.match(/\/api\/purchase-orders$/)) return handlePurchaseOrders(url);
    if (path.match(/\/api\/visits$/)) return handleVisits(url);
    if (path.match(/\/api\/prescriptions$/)) return handlePrescriptions(url);
    if (path.match(/\/api\/accounting$/)) return handleAccounting();
    if (path.match(/\/api\/campaigns$/)) return handleCampaigns();
  } catch (e) {
    console.error('Mock API error:', e);
  }

  return null;
}

// Patch fetch
export function initMockApi() {
  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('/api/')) {
      const urlObj = new URL(url, window.location.origin);
      const mockResponse = await handleApiRequest(urlObj);
      if (mockResponse) return mockResponse;
    }
    return originalFetch(input, init);
  };
}