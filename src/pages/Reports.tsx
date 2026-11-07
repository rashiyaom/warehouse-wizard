import { useState } from "react";
import { DollarSign, AlertTriangle, TrendingUp, BarChart3, Package, PieChart, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLowStockItems, useInventoryValuation, useMovementSummary } from "@/hooks/useReportData";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, PieChart as RechartsPieChart, Pie, Cell,
  AreaChart, Area, ComposedChart
} from "recharts";

// Apple-inspired color palette
const APPLE_COLORS = [
  "#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE", "#5AC8FA"
];

export default function Reports() {
  const { data: lowStock } = useLowStockItems();
  const { data: valuation } = useInventoryValuation();
  const { data: movementSummary } = useMovementSummary(30);

  const totalValue = valuation?.reduce((s, v) => s + Number(v.total_value ?? 0), 0) ?? 0;
  const totalLowStock = lowStock?.length ?? 0;
  const totalItems = valuation?.reduce((s, v) => s + Number(v.total_items ?? 0), 0) ?? 0;

  const valuationChart = valuation?.map((v) => ({
    name: v.warehouse_name.length > 8 ? v.warehouse_name.substring(0, 8) + '...' : v.warehouse_name,
    fullName: v.warehouse_name,
    value: Number(v.total_value),
    items: Number(v.total_items),
    quantity: Number(v.total_quantity),
  })) ?? [];

  const movementChart = movementSummary?.map((m) => ({
    date: new Date(m.movement_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    incoming: Number(m.incoming_qty),
    outgoing: Number(m.outgoing_qty),
    transfer: Number(m.transfer_qty),
    net: Number(m.incoming_qty) - Number(m.outgoing_qty),
  })).reverse().slice(-14) ?? [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Advanced Analytics
        </h1>
        <p className="text-muted-foreground text-lg mt-2 font-medium">
          Comprehensive business intelligence and reporting
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="stat-card group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <DollarSign className="w-7 h-7 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
              <p className="text-2xl font-bold text-foreground">${totalValue.toLocaleString()}</p>
              <p className="text-xs text-green-600 font-medium">Portfolio Worth</p>
            </div>
          </div>
        </div>
        <div className="stat-card group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Stock Alerts</p>
              <p className="text-2xl font-bold text-foreground">{totalLowStock}</p>
              <p className="text-xs text-red-600 font-medium">Needs Attention</p>
            </div>
          </div>
        </div>        <div className="stat-card group hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <Package className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold text-foreground">{totalItems.toLocaleString()}</p>
              <p className="text-xs text-blue-600 font-medium">Active Products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-1 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl">Overview</TabsTrigger>
          <TabsTrigger value="valuation" className="rounded-xl">Valuation</TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-xl">Alerts</TabsTrigger>
          <TabsTrigger value="trends" className="rounded-xl">Trends</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warehouse Value Distribution */}
            <div className="chart-container">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Warehouse Distribution</h3>
                  <p className="text-sm text-muted-foreground">Value distribution across locations</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valuationChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                    <Bar dataKey="value" fill={APPLE_COLORS[0]} radius={[8, 8, 0, 0]} name="Value ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>            {/* Movement Trends */}
            <div className="chart-container">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-green-50 border border-green-100">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Activity Trends</h3>
                  <p className="text-sm text-muted-foreground">14-day movement analysis</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={movementChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="incomingArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={APPLE_COLORS[1]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={APPLE_COLORS[1]} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="outgoingArea" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#incomingArea)"
                      name="Incoming"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="outgoing" 
                      stackId="2"
                      stroke={APPLE_COLORS[3]} 
                      fill="url(#outgoingArea)"
                      name="Outgoing"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>        {/* VALUATION TAB */}
        <TabsContent value="valuation" className="space-y-6">
          <div className="chart-container">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-green-50 border border-green-100">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Warehouse Valuation</h3>
                <p className="text-sm text-muted-foreground">Total inventory value by location</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valuationChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: 12,
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)"
                    }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]}
                  />
                  <Bar dataKey="value" fill={APPLE_COLORS[1]} radius={[8, 8, 0, 0]} name="Value ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>          
          {/* Valuation Table */}
          <div className="chart-container">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Detailed Breakdown</h3>
                <p className="text-sm text-muted-foreground">Warehouse inventory summary</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Warehouse</th>
                    <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Location</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Products</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Total Qty</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {valuation?.map((v) => (
                    <tr key={v.warehouse_id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-4 font-semibold text-foreground">{v.warehouse_name}</td>
                      <td className="py-4 px-4 text-muted-foreground">{v.warehouse_location ?? "—"}</td>
                      <td className="py-4 px-4 text-right font-mono text-foreground">{String(v.total_items)}</td>
                      <td className="py-4 px-4 text-right font-mono text-foreground">{Number(v.total_quantity).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-green-600">
                        ${Number(v.total_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {!valuation?.length && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        No warehouse data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>        {/* LOW STOCK TAB */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="chart-container">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-red-50 border border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Stock Alerts</h3>
                <p className="text-sm text-muted-foreground">Items below minimum stock level</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Product</th>
                    <th className="text-left py-4 px-4 text-muted-foreground font-semibold">SKU</th>
                    <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Category</th>
                    <th className="text-left py-4 px-4 text-muted-foreground font-semibold">Warehouse</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Current</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Minimum</th>
                    <th className="text-right py-4 px-4 text-muted-foreground font-semibold">Deficit</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock?.map((item, idx) => (
                    <tr key={idx} className="border-b border-border/30 hover:bg-red-50/30 transition-colors">
                      <td className="py-4 px-4 font-semibold text-foreground">{item.product_name}</td>
                      <td className="py-4 px-4 font-mono text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                        {item.sku}
                      </td>
                      <td className="py-4 px-4">
                        {item.category_name ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-muted/50">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.category_color ?? "#6366f1" }} 
                            />
                            {item.category_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">{item.warehouse_name}</td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-red-600">
                        {item.current_quantity}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-muted-foreground">
                        {item.min_stock_level}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <TrendingUp className="w-3 h-3 rotate-180" /> 
                          -{item.deficit}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!lowStock || lowStock.length === 0) && (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                            <Package className="w-8 h-8 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">All Stock Levels Healthy!</h3>
                            <p className="text-sm text-muted-foreground">No items are below minimum stock levels</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>        {/* MOVEMENT TRENDS TAB */}
        <TabsContent value="trends" className="space-y-4">
          <div className="stat-card">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Daily Movement Quantities (Last 14 Days)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movementChart}>
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
                  <Line type="monotone" dataKey="incoming" stroke={APPLE_COLORS[1]} strokeWidth={3} dot={{ r: 4 }} name="Incoming" />
                  <Line type="monotone" dataKey="outgoing" stroke={APPLE_COLORS[3]} strokeWidth={3} dot={{ r: 4 }} name="Outgoing" />
                  <Line type="monotone" dataKey="transfer" stroke={APPLE_COLORS[0]} strokeWidth={3} dot={{ r: 4 }} name="Transfer" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
