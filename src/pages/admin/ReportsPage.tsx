import React, { useState, useMemo, useEffect } from "react";
import { format, subDays, isWithinInterval, startOfDay, endOfDay, isSameDay } from "date-fns";
import { 
  Printer, PenSquare, FilePlus, UserCircle2, Menu, X, ArrowUpCircle, ArrowDownCircle,
  Calendar as CalendarIcon, ChevronDown, Download, Search, LayoutDashboard, FileText,
  Filter, Check, FileSpreadsheet, Utensils, Banknote
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Sector, Brush } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- MOCK DATA ENGINE ---

const USERS = ["All Users", "Waiter 1", "Waiter 2", "Waiter 3", "Manager"];
const SESSIONS = ["All Sessions", "Breakfast", "Lunch", "Dinner", "Night Shift"];
const PRODUCTS = ["Pizza", "Burger", "Drink", "Appetizer", "Dessert"];

const CATEGORY_COLORS = {
  'Pizza': '#e28743',
  'Burger': '#eab676',
  'Drink': '#76b5c5',
  'Appetizer': '#abdbe3',
  'Dessert': '#eeeee4'
};

const generateMockOrders = () => {
  const orders = [];
  const now = new Date();
  for (let i = 0; i < 200; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 60); // past 60 days
    const orderDate = subDays(now, randomDaysAgo);
    const session = SESSIONS[Math.floor(Math.random() * (SESSIONS.length - 1)) + 1];
    const user = USERS[Math.floor(Math.random() * (USERS.length - 1)) + 1];
    
    // items
    const numItems = Math.floor(Math.random() * 5) + 1;
    const items = [];
    let total = 0;
    for(let j=0; j<numItems; j++) {
      const prodCategory = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const price = Math.floor(Math.random() * 30) + 5;
      const qty = Math.floor(Math.random() * 3) + 1;
      total += (price * qty);
      items.push({
        id: `item-${i}-${j}`,
        name: `${prodCategory} Special ${j+1}`,
        category: prodCategory,
        price,
        qty,
        total: price * qty
      });
    }

    orders.push({
      id: `ORD-${20000 + i}`,
      session,
      pos: `Terminal ${Math.floor(Math.random() * 5) + 1}`,
      date: orderDate,
      customer: Math.random() > 0.3 ? `Customer ${Math.floor(Math.random() * 100)}` : 'Walk-in',
      employee: user,
      total: total + (total * 0.05), // with 5% tax
      tax: total * 0.05,
      subtotal: total,
      items
    });
  }
  // Sort by date desc
  return orders.sort((a, b) => b.date.getTime() - a.date.getTime());
};

const MOCK_ORDERS = generateMockOrders();

// --- COMPONENTS ---

// Custom Active Shape for Donut Chart
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 10} outerRadius={outerRadius + 15} fill={fill} />
    </g>
  );
};

export default function ReportsPage() {
  // --- STATE ---
  
  // Filters
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({ 
    from: subDays(new Date(), 7), 
    to: new Date() 
  });
  const [selectedUser, setSelectedUser] = useState("All Users");
  const [selectedSession, setSelectedSession] = useState("All Sessions");
  const [selectedProducts, setSelectedProducts] = useState<string[]>(PRODUCTS); // all selected by default
  
  // UI State
  const [isProductFilterOpen, setIsProductFilterOpen] = useState(false);
  
  // Chart Interaction State
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  // Table State
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // --- DATA PROCESSING (MOCK ENGINE) ---

  const filteredOrders = useMemo(() => {
    return MOCK_ORDERS.filter(order => {
      // Date Filter
      if (dateRange.from && dateRange.to) {
        if (!isWithinInterval(order.date, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) })) {
          return false;
        }
      } else if (dateRange.from) {
        if (!isSameDay(order.date, dateRange.from) && order.date < dateRange.from) return false;
      }

      // User Filter
      if (selectedUser !== "All Users" && order.employee !== selectedUser) return false;
      
      // Session Filter
      if (selectedSession !== "All Sessions" && order.session !== selectedSession) return false;

      // Product Filter (Order must contain at least one selected product category)
      const hasSelectedProduct = order.items.some(item => selectedProducts.includes(item.category));
      if (!hasSelectedProduct) return false;

      return true;
    });
  }, [dateRange, selectedUser, selectedSession, selectedProducts]);

  // Aggregations
  const { kpis, chartData, topCategoriesData, topProductsData } = useMemo(() => {
    let totalRevenue = 0;
    let totalOrders = filteredOrders.length;
    
    // Group by Date for Area Chart
    const revenueByDate: Record<string, number> = {};
    
    // Group by Category for Pie Chart
    const categoryStats: Record<string, { revenue: number, qty: number }> = {};
    
    // Group by Product
    const productStats: Record<string, { revenue: number, qty: number }> = {};

    filteredOrders.forEach(order => {
      totalRevenue += order.total;
      
      const dateStr = format(order.date, 'MMM dd');
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + order.total;

      order.items.forEach(item => {
        // Only count selected products
        if (selectedProducts.includes(item.category)) {
          // Category Stats
          if (!categoryStats[item.category]) categoryStats[item.category] = { revenue: 0, qty: 0 };
          categoryStats[item.category].revenue += item.total;
          categoryStats[item.category].qty += item.qty;

          // Product Stats
          if (!productStats[item.name]) productStats[item.name] = { revenue: 0, qty: 0 };
          productStats[item.name].revenue += item.total;
          productStats[item.name].qty += item.qty;
        }
      });
    });

    // Formatting for charts
    const chartDataFormatted = Object.keys(revenueByDate).sort((a,b) => new Date(a).getTime() - new Date(b).getTime()).map(date => ({
      date,
      revenue: Math.round(revenueByDate[date])
    }));

    const topCategoriesFormatted = Object.keys(categoryStats).map(cat => ({
      name: cat,
      revenue: categoryStats[cat].revenue,
      qty: categoryStats[cat].qty,
      color: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || '#cbd5e1'
    })).sort((a, b) => b.revenue - a.revenue);

    const topProductsFormatted = Object.keys(productStats).map(prod => ({
      name: prod,
      revenue: productStats[prod].revenue,
      qty: productStats[prod].qty
    })).sort((a, b) => b.qty - a.qty).slice(0, 10); // Top 10

    return {
      kpis: {
        orders: totalOrders,
        revenue: totalRevenue,
        avgOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0
      },
      chartData: chartDataFormatted,
      topCategoriesData: topCategoriesFormatted,
      topProductsData: topProductsFormatted
    };
  }, [filteredOrders, selectedProducts]);

  // --- ACTIONS ---
  
  const handleExport = (type: 'pdf' | 'xls') => {
    toast.success(`Exporting report as ${type.toUpperCase()}...`, {
      icon: "📥"
    });
  };

  const toggleCategoryVisibility = (categoryName: string) => {
    const newHidden = new Set(hiddenCategories);
    if (newHidden.has(categoryName)) {
      newHidden.delete(categoryName);
    } else {
      newHidden.add(categoryName);
    }
    setHiddenCategories(newHidden);
  };

  // --- RENDER HELPERS ---
  
  const visiblePieData = topCategoriesData.filter(d => !hiddenCategories.has(d.name));

  // Pagination for Top Orders
  const searchedOrders = filteredOrders.filter(o => 
    o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) || 
    o.customer.toLowerCase().includes(orderSearchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(searchedOrders.length / itemsPerPage);
  const paginatedOrders = searchedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-6 space-y-6">
      
      {/* ----------------- HEADER ----------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Analyze your sales, popular items, and staff performance.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-md border shadow-sm p-4 md:p-6 space-y-8">
        
        {/* ----------------- ADVANCED FILTERS BAR ----------------- */}
        <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between border-b pb-4 gap-4">
          
          <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm">
            
            {/* Start Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                  {dateRange.from ? format(dateRange.from, "LLL dd, y") : <span>Start Date</span>}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => setDateRange({ ...dateRange, from: date || undefined })}
                  initialFocus
                  className="p-3"
                />
              </PopoverContent>
            </Popover>

            <span className="text-slate-500 font-medium px-2">to</span>

            {/* End Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                  {dateRange.to ? format(dateRange.to, "LLL dd, y") : <span>End Date</span>}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => setDateRange({ ...dateRange, to: date || undefined })}
                  initialFocus
                  className="p-3"
                />
              </PopoverContent>
            </Popover>

            {/* User Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4 text-green-500" />
                  {selectedUser}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Filter by User</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {USERS.map(user => (
                  <DropdownMenuItem key={user} onClick={() => setSelectedUser(user)} className="cursor-pointer">
                    {user} {selectedUser === user && <Check className="ml-auto h-4 w-4 text-blue-500"/>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Session Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-orange-500" />
                  {selectedSession}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Filter by Session</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SESSIONS.map(session => (
                  <DropdownMenuItem key={session} onClick={() => setSelectedSession(session)} className="cursor-pointer">
                    {session} {selectedSession === session && <Check className="ml-auto h-4 w-4 text-blue-500"/>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Product Filter */}
            <Popover open={isProductFilterOpen} onOpenChange={setIsProductFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-pink-500" />
                  Products ({selectedProducts.length})
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm border-b pb-2">Filter Categories</h4>
                  {PRODUCTS.map(prod => (
                    <div key={prod} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
                         onClick={() => {
                           if (selectedProducts.includes(prod)) {
                             setSelectedProducts(selectedProducts.filter(p => p !== prod));
                           } else {
                             setSelectedProducts([...selectedProducts, prod]);
                           }
                         }}>
                      <Checkbox checked={selectedProducts.includes(prod)} />
                      <span className="text-sm">{prod}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedProducts(PRODUCTS)} className="text-xs h-7">Select All</Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedProducts([])} className="text-xs h-7 text-red-500">Clear</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

          </div>
          
          {/* Export Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 w-full xl:w-auto mt-4 xl:mt-0">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer gap-2">
                <FileText className="h-4 w-4 text-red-500" /> Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xls')} className="cursor-pointer gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-500" /> Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

        {/* ----------------- KPI SUMMARY CARDS ----------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Total Orders", value: kpis.orders, prefix: "", suffix: "", trend: 12.5, icon: LayoutDashboard },
            { title: "Total Revenue", value: kpis.revenue, prefix: "₹", suffix: "", trend: 8.2, icon: Banknote },
            { title: "Avg Order Value", value: kpis.avgOrder, prefix: "₹", suffix: "", trend: -2.4, icon: FileText }
          ].map((kpi, index) => (
            <motion.div 
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border p-5 rounded-xl bg-white shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <kpi.icon className="w-16 h-16" />
              </div>
              <div className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">{kpi.title}</div>
              <motion.div 
                key={kpi.value} // re-animates when value changes
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl md:text-5xl font-light mb-4 text-slate-800"
              >
                {kpi.prefix}{kpi.value.toLocaleString(undefined, {maximumFractionDigits: 2})}{kpi.suffix}
              </motion.div>
              <div className={`text-sm flex items-center gap-1 font-medium ${kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.trend >= 0 ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />} 
                {Math.abs(kpi.trend)}% 
                <span className="text-slate-500 font-normal ml-1">vs previous period</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ----------------- CHARTS ROW ----------------- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Sales Chart (Takes 2 columns on desktop) */}
          <div className="xl:col-span-2 border rounded-xl p-4 bg-slate-50/50">
            <h3 className="text-slate-800 font-medium text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-sm inline-block"></span>
              Sales Analytics
            </h3>
            <div className="h-[350px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} 
                      itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    {/* Brush for zooming */}
                    <Brush dataKey="date" height={30} stroke="#cbd5e1" fill="#f8fafc" tickFormatter={() => ''} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">No data available for selected filters</div>
              )}
            </div>
          </div>

          {/* Product Distribution Chart */}
          <div className="border rounded-xl p-4 bg-slate-50/50 flex flex-col">
            <h3 className="text-slate-800 font-medium text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-orange-500 rounded-sm inline-block"></span>
              Product Distribution
            </h3>
            <div className="flex-1 flex flex-col justify-center relative min-h-[300px]">
              {visiblePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      data={visiblePieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="revenue"
                      stroke="none"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onClick={(_, index) => setActivePieIndex(index)}
                      cursor="pointer"
                    >
                      {visiblePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                      contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">No categories visible</div>
              )}
              
              {/* Interactive Legend */}
              <div className="mt-auto grid grid-cols-2 gap-2 text-xs pt-4 border-t">
                {topCategoriesData.map(cat => (
                  <div 
                    key={cat.name} 
                    className={`flex items-center gap-2 cursor-pointer p-1.5 rounded transition-colors ${hiddenCategories.has(cat.name) ? 'opacity-40 hover:opacity-70' : 'hover:bg-slate-100'}`}
                    onClick={() => toggleCategoryVisibility(cat.name)}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="truncate text-slate-700 font-medium">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ----------------- TOP ORDERS TABLE ----------------- */}
        <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-green-600 text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-6 bg-green-500 rounded-sm inline-block"></span>
              Top Orders
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search orders..." 
                className="pl-9 bg-slate-50"
                value={orderSearchQuery}
                onChange={(e) => {
                  setOrderSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Session</th>
                  <th className="px-4 py-3 font-medium">POS Terminal</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length > 0 ? paginatedOrders.map((order, idx) => (
                  <tr 
                    key={order.id} 
                    className={`border-b hover:bg-slate-50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-4 py-3 font-medium text-blue-600">{order.id}</td>
                    <td className="px-4 py-3 text-slate-600">{format(order.date, 'MMM dd, yyyy HH:mm')}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="bg-slate-100 border px-2 py-1 rounded text-xs">{order.session}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.pos}</td>
                    <td className="px-4 py-3 text-slate-700">{order.customer}</td>
                    <td className="px-4 py-3 text-slate-600">{order.employee}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 text-right">₹{order.total.toFixed(2)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No orders found matching your criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between bg-slate-50">
              <div className="text-xs text-slate-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, searchedOrders.length)} of {searchedOrders.length} entries
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
                <div className="flex items-center justify-center px-3 text-sm font-medium text-slate-700">{currentPage} / {totalPages}</div>
                <Button variant="outline" size="sm" className="h-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>

        {/* ----------------- BOTTOM TABLES ROW ----------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Top Products Table */}
          <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <h3 className="text-blue-600 text-lg font-semibold p-4 border-b bg-slate-50 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-sm inline-block"></span>
              Top Products
            </h3>
            <div className="p-4">
              <div className="grid grid-cols-12 text-xs uppercase text-slate-500 font-semibold mb-3 px-2">
                <div className="col-span-6">Product Name</div>
                <div className="col-span-3 text-right">Qty Sold</div>
                <div className="col-span-3 text-right">Revenue</div>
              </div>
              <div className="space-y-2">
                {topProductsData.map((p, i) => (
                  <div key={i} className="grid grid-cols-12 items-center text-sm p-2 rounded hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="col-span-6 text-slate-900 font-medium flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-500 shrink-0">{i+1}</span>
                      <span className="truncate">{p.name}</span>
                    </div>
                    <div className="col-span-3 text-right text-slate-600 font-mono bg-slate-50 rounded px-2 py-0.5 w-fit ml-auto">{p.qty}</div>
                    <div className="col-span-3 text-right text-green-600 font-medium">₹{p.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Categories Table */}
          <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
            <h3 className="text-pink-600 text-lg font-semibold p-4 border-b bg-slate-50 flex items-center gap-2">
              <span className="w-2 h-6 bg-pink-600 rounded-sm inline-block"></span>
              Top Categories
            </h3>
            <div className="p-4">
              <div className="grid grid-cols-12 text-xs uppercase text-slate-500 font-semibold mb-3 px-2">
                <div className="col-span-6">Category Name</div>
                <div className="col-span-3 text-right">Qty Sold</div>
                <div className="col-span-3 text-right">Revenue</div>
              </div>
              <div className="space-y-2">
                {topCategoriesData.map((c, i) => (
                  <div key={i} className="grid grid-cols-12 items-center text-sm p-2 rounded hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="col-span-6 text-slate-900 font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: c.color}}></div>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="col-span-3 text-right text-slate-600 font-mono bg-slate-50 rounded px-2 py-0.5 w-fit ml-auto">{c.qty}</div>
                    <div className="col-span-3 text-right text-green-600 font-medium">₹{c.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ----------------- ORDER DETAILS MODAL ----------------- */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden">
          {selectedOrder && (
            <>
              <div className="p-6 border-b bg-slate-50 flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900">
                    Order <span className="text-blue-600">{selectedOrder.id}</span>
                  </DialogTitle>
                  <DialogDescription className="text-slate-500 mt-1">
                    {format(selectedOrder.date, "EEEE, MMMM do, yyyy 'at' h:mm a")}
                  </DialogDescription>
                </div>
                <div className="text-right">
                  <div className="bg-white text-slate-700 px-3 py-1 rounded text-sm font-medium border inline-block mb-1">
                    {selectedOrder.pos}
                  </div>
                  <div className="text-sm text-slate-500">{selectedOrder.session}</div>
                </div>
              </div>
              
              <ScrollArea className="max-h-[60vh]">
                <div className="p-6 space-y-6">
                  
                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Customer</div>
                      <div className="font-medium text-slate-800">{selectedOrder.customer}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Employee</div>
                      <div className="font-medium text-slate-800">{selectedOrder.employee}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Table</div>
                      <div className="font-medium text-slate-800">Table {Math.floor(Math.random() * 20) + 1}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</div>
                      <div className="font-medium text-green-600 flex items-center gap-1"><Check className="h-3 w-3"/> Paid</div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-slate-800 border-b pb-2">Ordered Items</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border">
                          <div>
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-500">{item.category} • ₹{item.price} each</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-slate-600 bg-slate-50 px-2 py-1 rounded text-sm">x{item.qty}</div>
                            <div className="font-bold text-slate-900 w-16 text-right">₹{item.total}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Billing Summary */}
                  <div className="bg-slate-50 p-5 rounded-lg border w-full md:w-1/2 ml-auto space-y-2">
                    <div className="flex justify-between text-slate-600 text-sm">
                      <span>Subtotal</span>
                      <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-sm">
                      <span>Tax (5%)</span>
                      <span>₹{selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 text-sm">
                      <span>Discount</span>
                      <span>₹0.00</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-slate-900 font-bold text-lg">
                      <span>Total</span>
                      <span className="text-blue-600">₹{selectedOrder.total.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t flex justify-between text-xs text-slate-500">
                      <span>Payment Method</span>
                      <span className="uppercase text-slate-600">CASH / CARD</span>
                    </div>
                  </div>

                </div>
              </ScrollArea>
              
              <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2" onClick={() => handleExport('pdf')}>
                  <Printer className="h-4 w-4" /> Print Receipt
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
