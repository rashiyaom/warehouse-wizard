import { Package, Warehouse, AlertTriangle, Activity, DollarSign, TrendingUp, BarChart3, PieChart, LineChart, Database } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useDashboardStats, useMovementSummary, useInventoryValuation } from "@/hooks/useReportData";
import { useInventory, useWarehouses, useMovements } from "@/hooks/useInventoryData";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line, Legend,
  AreaChart, Area, RadialBarChart, RadialBar
} from "recharts";

const APPLE_COLORS = [
  "#007AFF", // Apple Blue
  "#34C759", // Apple Green  
  "#FF9500", // Apple Orange
  "#FF3B30", // Apple Red
  "#AF52DE", // Apple Purple
  "#5AC8FA", // Apple Teal
  "#FFCC00", // Apple Yellow
  "#FF2D92", // Apple Pink
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats } = useDashboardStats();
  const { data: inventory } = useInventory();
  const { data: warehouses } = useWarehouses();
  const { data: movements } = useMovements();
  const { data: valuation } = useInventoryValuation();
  const { data: movementSummary } = useMovementSummary(30);

  // Stats with proper fallbacks
  const totalProducts = Number(stats?.total_products ?? 0);
  const totalWarehouses = Number(stats?.total_warehouses ?? 0);
  const lowStockItems = Number(stats?.low_stock_count ?? 0);
  const totalMovements = Number(stats?.total_movements ?? 0);
  const totalValue = Number(stats?.total_value ?? 0);
  const totalStock = Number(stats?.total_stock ?? 0);

  // Enhanced chart data processing
  const warehouseMetrics = valuation?.map((v) => ({
    name: v.warehouse_name.length > 8 ? v.warehouse_name.substring(0, 8) + '...' : v.warehouse_name,
    fullName: v.warehouse_name,
    stock: Number(v.total_quantity),
    value: Number(v.total_value),
    items: Number(v.total_items),
    utilization: Math.min(100, (Number(v.total_quantity) / 1000) * 100), // Mock utilization
  })) ?? [];

  // Category distribution with enhanced data
  const categoryMap: Record<string, { quantity: number; value: number; products: number }> = {};
  inventory?.forEach((i) => {
    const cat = i.products?.categories?.name ?? "Uncategorized";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { quantity: 0, value: 0, products: 0 };
    }
    categoryMap[cat].quantity += i.quantity;
    categoryMap[cat].value += i.quantity * (i.products?.unit_price ?? 0);
    categoryMap[cat].products += 1;
  });

  const categoryData = Object.entries(categoryMap).map(([name, data]) => ({
    name: name.length > 12 ? name.substring(0, 12) + '...' : name,
    fullName: name,
    ...data,
  }));

  // Movement trends with smooth data
  const movementTrends = movementSummary?.map((m, index) => ({
    date: new Date(m.movement_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    incoming: Number(m.incoming_qty),
    outgoing: Number(m.outgoing_qty),
    transfer: Number(m.transfer_qty),
    net: Number(m.incoming_qty) - Number(m.outgoing_qty),
    day: index + 1,
  })).reverse().slice(-14) ?? []; // Last 14 days

  // Performance metrics
  const performanceData = [
    { metric: "Efficiency", value: 87, target: 90, color: "#34C759" },
    { metric: "Accuracy", value: 94, target: 95, color: "#007AFF" },
    { metric: "Speed", value: 78, target: 85, color: "#FF9500" },
    { metric: "Quality", value: 96, target: 90, color: "#AF52DE" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">      {/* Header with modern typography */}
      <div className="text-center md:text-left relative">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Analytics Overview
        </h1>
        <p className="text-muted-foreground text-lg mt-2 font-medium">
          Real-time insights powered by advanced analytics
        </p>
        
        {/* Secret Query Visualization Button */}
        <button
          onClick={() => navigate('/query-visualization')}
          className="absolute top-0 right-0 p-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 transform hover:scale-110 group opacity-60 hover:opacity-100"
          title="Advanced Query Visualization"
        >
          <Database className="w-5 h-5 text-blue-600 group-hover:text-purple-600 transition-colors duration-300" />
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 animate-slide-up">
        <StatCard 
          title="Total Products" 
          value={totalProducts.toLocaleString()} 
          icon={Package} 
          color="primary"
          subtitle={`${categoryData.length} categories`}
        />
        <StatCard 
          title="Warehouses" 
          value={totalWarehouses} 
          icon={Warehouse} 
          color="success"
          subtitle="Active locations"
        />
        <StatCard 
          title="Stock Alerts" 
          value={lowStockItems} 
          icon={AlertTriangle} 
          color="warning"
          subtitle="Low inventory"
        />
        <StatCard 
          title="Total Stock" 
          value={totalStock.toLocaleString()} 
          icon={TrendingUp} 
          color="info"
          subtitle="Units in inventory"
        />
        <StatCard 
          title="Movements" 
          value={totalMovements.toLocaleString()} 
          icon={Activity} 
          color="destructive"
          subtitle="Total transactions"
        />
        <StatCard 
          title="Inventory Value" 
          value={`$${(totalValue / 1000).toFixed(1)}k`} 
          icon={DollarSign} 
          color="success"
          subtitle="Total worth"
        />
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Warehouse Distribution */}
        <div className="chart-container xl:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Warehouse Analytics</h3>
              <p className="text-sm text-muted-foreground">Stock distribution and utilization</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={warehouseMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px", 
                    fontSize: 12,
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)"
                  }}
                />
                <Bar dataKey="stock" fill={APPLE_COLORS[0]} radius={[8, 8, 0, 0]} name="Stock Units" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-green-50 border border-green-100">
              <PieChart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Categories</h3>
              <p className="text-sm text-muted-foreground">Stock by category</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie 
                  data={categoryData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={40}
                  outerRadius={80} 
                  paddingAngle={4} 
                  dataKey="quantity"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={APPLE_COLORS[index % APPLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: 12
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Movement Trends */}
        <div className="chart-container xl:col-span-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-100">
              <LineChart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Movement Trends</h3>
              <p className="text-sm text-muted-foreground">14-day inventory flow analysis</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={APPLE_COLORS[1]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={APPLE_COLORS[1]} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="outgoingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={APPLE_COLORS[3]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={APPLE_COLORS[3]} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: 12
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="incoming" 
                  stackId="1"
                  stroke={APPLE_COLORS[1]} 
                  fill="url(#incomingGrad)"
                  name="Incoming"
                />
                <Area 
                  type="monotone" 
                  dataKey="outgoing" 
                  stackId="2"
                  stroke={APPLE_COLORS[3]} 
                  fill="url(#outgoingGrad)"
                  name="Outgoing"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>        {/* Performance Metrics */}
        <div className="chart-container xl:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-orange-50 border border-orange-100">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Performance KPIs</h3>
              <p className="text-sm text-muted-foreground">Operational excellence metrics</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={performanceData}>
                <RadialBar dataKey="value" cornerRadius={10} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: 12
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          
          {/* KPI Explanations */}
          <div className="mt-4 space-y-3">
            {performanceData.map((kpi, index) => (
              <div key={kpi.metric} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: kpi.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{kpi.metric}</p>
                    <p className="text-xs text-muted-foreground">
                      {kpi.metric === 'Efficiency' && 'Overall warehouse operational efficiency'}
                      {kpi.metric === 'Accuracy' && 'Inventory accuracy and order fulfillment precision'}
                      {kpi.metric === 'Speed' && 'Average processing time for orders and movements'}
                      {kpi.metric === 'Quality' && 'Product quality standards and customer satisfaction'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{kpi.value}%</p>
                  <p className="text-xs text-muted-foreground">Target: {kpi.target}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="chart-container">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-pink-50 border border-pink-100">
              <Activity className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Live Activity</h3>
              <p className="text-sm text-muted-foreground">Recent transactions</p>
            </div>
          </div>
          <div className="space-y-4">
            {movements?.slice(0, 6).map((movement, index) => (
              <div key={movement.id} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/30 border border-border/30">
                <div className={`w-3 h-3 rounded-full ${
                  movement.movement_type === "incoming" ? "bg-green-500" :
                  movement.movement_type === "outgoing" ? "bg-red-500" :
                  "bg-blue-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {movement.products?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {movement.movement_type} • {movement.quantity} units
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(movement.created_at).toLocaleDateString()}
                </span>
              </div>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
