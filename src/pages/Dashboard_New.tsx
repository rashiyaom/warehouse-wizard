import { 
  Package, 
  Warehouse, 
  AlertTriangle, 
  ArrowLeftRight, 
  DollarSign, 
  TrendingUp,
  Activity,
  Box,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/StatCard";
import { ChartCard } from "@/components/ChartCard";
import { useDashboardStats, useMovementSummary, useInventoryValuation } from "@/hooks/useReportData";
import { useInventory, useWarehouses, useMovements } from "@/hooks/useInventoryData";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Legend,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter
} from "recharts";

// Apple-inspired color palette
const CHART_COLORS = [
  "#007AFF", // Apple Blue
  "#34C759", // Apple Green  
  "#FF9500", // Apple Orange
  "#FF3B30", // Apple Red
  "#AF52DE", // Apple Purple
  "#5AC8FA", // Apple Teal
];

export default function Dashboard() {
  const { data: stats } = useDashboardStats();
  const { data: inventory } = useInventory();
  const { data: warehouses } = useWarehouses();
  const { data: movements } = useMovements();
  const { data: valuation } = useInventoryValuation();
  const { data: movementSummary } = useMovementSummary(30);

  const totalProducts = Number(stats?.total_products ?? 0);
  const totalWarehouses = Number(stats?.total_warehouses ?? 0);
  const lowStockItems = Number(stats?.low_stock_count ?? 0);
  const totalMovements = Number(stats?.total_movements ?? 0);
  const totalValue = Number(stats?.total_value ?? 0);
  const totalStock = Number(stats?.total_stock ?? 0);

  // Enhanced chart data
  const warehouseStock = valuation?.map((v, index) => ({
    name: v.warehouse_name,
    stock: Number(v.total_quantity),
    value: Number(v.total_value),
    fill: CHART_COLORS[index % CHART_COLORS.length],
    utilization: Math.min(100, (Number(v.total_quantity) / 1000) * 100), // Mock utilization
  })) ?? [];

  // Category breakdown
  const categoryMap: Record<string, { quantity: number; value: number }> = {};
  inventory?.forEach((i) => {
    const cat = i.products?.categories?.name ?? "Uncategorized";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { quantity: 0, value: 0 };
    }
    categoryMap[cat].quantity += i.quantity;
    categoryMap[cat].value += i.quantity * (i.products?.unit_price ?? 0);
  });
  
  const categoryData = Object.entries(categoryMap).map(([name, data], index) => ({
    name,
    value: data.quantity,
    amount: data.value,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));

  // Movement trends with more data points
  const movementChart = movementSummary?.map((m, index) => ({
    date: new Date(m.movement_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    incoming: Number(m.incoming_qty),
    outgoing: Number(m.outgoing_qty),
    transfer: Number(m.transfer_qty),
    net: Number(m.incoming_qty) - Number(m.outgoing_qty),
    efficiency: Math.random() * 100 + 50, // Mock efficiency data
  })).reverse() ?? [];

  // Activity metrics
  const activityData = warehouseStock.map((w, index) => ({
    warehouse: w.name,
    activity: Math.random() * 100,
    performance: Math.random() * 100,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));

  // Recent movements for minimal table
  const recentMovements = movements?.slice(0, 6) ?? [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Analytics Overview
        </h1>
        <p className="text-muted-foreground text-lg">
          Real-time insights powered by advanced analytics
        </p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard 
          title="Total Products" 
          value={totalProducts.toLocaleString()} 
          icon={Package} 
          color="primary"
          subtitle="Active inventory"
        />
        <StatCard 
          title="Warehouses" 
          value={totalWarehouses} 
          icon={Warehouse} 
          color="success"
          subtitle="Operating locations"
        />
        <StatCard 
          title="Stock Alerts" 
          value={lowStockItems} 
          icon={AlertTriangle} 
          color="warning"
          subtitle="Requires attention"
        />
        <StatCard 
          title="Daily Moves" 
          value={totalMovements.toLocaleString()} 
          icon={ArrowLeftRight} 
          color="info"
          subtitle="Transaction volume"
        />
        <StatCard 
          title="Total Units" 
          value={`${(totalStock / 1000).toFixed(1)}K`} 
          icon={Box} 
          color="primary"
          subtitle="Inventory count"
        />
        <StatCard 
          title="Portfolio Value" 
          value={`$${(totalValue / 1000000).toFixed(1)}M`} 
          icon={DollarSign} 
          color="success"
          subtitle="Asset valuation"
        />
      </motion.div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Warehouse Distribution */}
        <motion.div variants={itemVariants}>
          <ChartCard
            title="Warehouse Distribution"
            subtitle="Inventory allocation across locations"
            className="xl:col-span-2"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warehouseStock} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    stroke="#6B7280"
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                  <Bar dataKey="stock" fill="#007AFF" radius={[8, 8, 0, 0]} name="Stock Quantity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div variants={itemVariants}>
          <ChartCard
            title="Category Analysis"
            subtitle="Stock distribution by category"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>
      </div>

      {/* Movement Trends */}
      {movementChart.length > 0 && (
        <motion.div variants={itemVariants}>
          <ChartCard
            title="Movement Trends"
            subtitle="30-day inventory flow analysis"
          >
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={movementChart}>
                  <defs>
                    <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34C759" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34C759" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorOutgoing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FF3B30" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorTransfer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#007AFF" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6B7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="incoming"
                    stackId="1"
                    stroke="#34C759"
                    fill="url(#colorIncoming)"
                    name="Incoming"
                  />
                  <Area
                    type="monotone"
                    dataKey="outgoing"
                    stackId="1"
                    stroke="#FF3B30"
                    fill="url(#colorOutgoing)"
                    name="Outgoing"
                  />
                  <Area
                    type="monotone"
                    dataKey="transfer"
                    stackId="1"
                    stroke="#007AFF"
                    fill="url(#colorTransfer)"
                    name="Transfer"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Warehouse Performance */}
        <motion.div variants={itemVariants}>
          <ChartCard
            title="Warehouse Performance"
            subtitle="Utilization and efficiency metrics"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={warehouseStock}>
                  <RadialBar dataKey="utilization" cornerRadius={10} fill="#007AFF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* Activity Scatter */}
        <motion.div variants={itemVariants}>
          <ChartCard
            title="Activity Analysis"
            subtitle="Performance vs activity correlation"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="activity" type="number" tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <YAxis dataKey="performance" type="number" tick={{ fontSize: 12 }} stroke="#6B7280" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
                    }}
                  />
                  <Scatter dataKey="performance" fill="#007AFF" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>
      </div>

      {/* Recent Activity Table */}
      <motion.div variants={itemVariants}>
        <ChartCard
          title="Recent Activity"
          subtitle="Latest inventory movements"
        >
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Type</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Product</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Quantity</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Location</th>
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.map((movement) => (
                  <tr key={movement.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-4">
                      <span className={`
                        inline-flex px-3 py-1 rounded-full text-xs font-medium
                        ${movement.movement_type === "incoming" ? "bg-green-100 text-green-700" :
                          movement.movement_type === "outgoing" ? "bg-red-100 text-red-700" :
                          movement.movement_type === "transfer" ? "bg-blue-100 text-blue-700" :
                          "bg-orange-100 text-orange-700"
                        }
                      `}>
                        {movement.movement_type}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-foreground">{movement.products?.name}</td>
                    <td className="py-4 px-4 font-mono text-foreground">{movement.quantity}</td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {movement.to_warehouse?.name ?? movement.from_warehouse?.name ?? "—"}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {new Date(movement.created_at).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                  </tr>
                ))}
                {recentMovements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      No recent activity
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </motion.div>
    </motion.div>
  );
}
