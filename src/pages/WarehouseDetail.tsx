import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Package, AlertTriangle, DollarSign, TrendingUp, BarChart3, Activity, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWarehouses } from "@/hooks/useInventoryData";
import { useWarehouseInventory } from "@/hooks/useReportData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartCard } from "@/components/ChartCard";
import { useState } from "react";

const APPLE_COLORS = ["#007AFF", "#34C759", "#FF9500", "#FF3B30", "#AF52DE", "#5AC8FA", "#FF2D92", "#8E8E93"];

export default function WarehouseDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: warehouses } = useWarehouses();
  const { data: items, isLoading } = useWarehouseInventory(id ?? null);
  
  // State for product selection and filtering
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const warehouse = warehouses?.find((w) => w.id === id);

  // Filter items based on search
  const filteredItems = items?.filter(item => 
    item.product_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.category_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchFilter.toLowerCase())
  ) ?? [];

  const totalValue = filteredItems?.reduce((sum, i) => sum + Number(i.stock_value ?? 0), 0) ?? 0;
  const totalQty = filteredItems?.reduce((sum, i) => sum + (i.quantity ?? 0), 0) ?? 0;
  const lowStockCount = filteredItems?.filter((i) => i.is_low_stock).length ?? 0;

  // Chart data with selection highlighting
  const chartData = filteredItems?.map((i) => ({
    name: i.product_name?.length > 15 ? i.product_name.substring(0, 15) + "…" : i.product_name,
    fullName: i.product_name,
    quantity: i.quantity,
    min: i.min_stock_level,
    isSelected: selectedProducts.includes(i.product_name || ''),
    id: i.inventory_id
  })) ?? [];

  // Handle product selection
  const toggleProductSelection = (productName: string) => {
    setSelectedProducts(prev => 
      prev.includes(productName) 
        ? prev.filter(p => p !== productName)
        : [...prev, productName]
    );
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  // Custom bar colors based on selection
  const getBarColor = (entry: any, index: number) => {
    if (selectedProducts.length === 0) {
      return APPLE_COLORS[0]; // Default color when no selection
    }
    return entry.isSelected ? APPLE_COLORS[1] : APPLE_COLORS[7]; // Highlight selected, dim others
  };

  return (
    <div className="space-y-6">      <div className="flex items-center gap-4">
        <Link to="/warehouses">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{warehouse?.name ?? "Warehouse"}</h1>
          <p className="text-muted-foreground text-sm mt-1">{warehouse?.location ?? ""} — Inventory breakdown</p>
        </div>
      </div>

      {/* Search and Selection Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products, categories, or SKU..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-10 bg-muted/30 border-border/50 focus:bg-background"
          />
        </div>
        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-700">
              {selectedProducts.length} selected
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearSelection}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10"><Package className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Products / Qty</p>
            <p className="text-xl font-bold text-card-foreground">{items?.length ?? 0} / {totalQty}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10"><DollarSign className="w-5 h-5 text-success" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-xl font-bold text-card-foreground">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/10"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
          <div>
            <p className="text-xs text-muted-foreground">Low Stock Items</p>
            <p className="text-xl font-bold text-card-foreground">{lowStockCount}</p>
          </div>
        </div>
      </div>      {/* Enhanced Chart with Selection */}
      {chartData.length > 0 && (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Stock vs Minimum Level</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Click on bars to highlight specific products • Selected: {selectedProducts.length} products
              </p>
            </div>
            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#34C759]"></div>
                  <span className="text-xs text-muted-foreground">Selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#8E8E93] opacity-50"></div>
                  <span className="text-xs text-muted-foreground">Others</span>
                </div>
              </div>
            )}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 46%)" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(0,0%,100%)", 
                    border: "1px solid hsl(214,20%,90%)", 
                    borderRadius: "8px", 
                    fontSize: 12 
                  }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
                          <p className="font-semibold text-foreground">{data.fullName}</p>
                          <p className="text-sm text-muted-foreground">Current Stock: {payload[0].value}</p>
                          <p className="text-sm text-muted-foreground">Min Required: {data.min}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {data.isSelected ? "✓ Selected" : "Click to select"}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="quantity" 
                  radius={[0, 6, 6, 0]} 
                  name="Current Stock"
                  onClick={(data) => toggleProductSelection(data.fullName)}
                  style={{ cursor: 'pointer' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry, index)}
                      stroke={entry.isSelected ? APPLE_COLORS[1] : 'transparent'}
                      strokeWidth={entry.isSelected ? 2 : 0}
                    />
                  ))}
                </Bar>
                <Bar 
                  dataKey="min" 
                  radius={[0, 6, 6, 0]} 
                  name="Min Required" 
                  opacity={0.4}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`min-cell-${index}`} 
                      fill={selectedProducts.length === 0 ? "#FF3B30" : (entry.isSelected ? "#FF3B30" : "#8E8E93")}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}      {/* Enhanced Table with Selection */}
      <div className="stat-card overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">Inventory Items</h3>
            <p className="text-xs text-muted-foreground">
              Showing {filteredItems?.length ?? 0} of {items?.length ?? 0} products
              {selectedProducts.length > 0 && ` • ${selectedProducts.length} selected`}
            </p>
          </div>
          {selectedProducts.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Selected products highlighted in blue
            </div>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Product</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">SKU</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Category</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Qty</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Min</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Unit Price</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Value</th>
              <th className="text-center py-3 px-3 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems?.map((item) => {
              const isSelected = selectedProducts.includes(item.product_name || '');
              return (
                <tr 
                  key={item.inventory_id} 
                  className={`border-b border-border/50 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-50 hover:bg-blue-100 border-blue-200' 
                      : 'hover:bg-muted/30'
                  }`}
                  onClick={() => toggleProductSelection(item.product_name || '')}
                  title={`Click to ${isSelected ? 'deselect' : 'select'} ${item.product_name}`}
                >
                <td className="py-3 px-3 font-medium text-card-foreground">
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    )}
                    {item.product_name}
                  </div>
                </td>
                <td className="py-3 px-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                <td className="py-3 px-3">
                  {item.category_name ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.category_color ?? "#6366f1" }} />
                      {item.category_name}
                    </span>
                  ) : "—"}
                </td>
                <td className={`py-3 px-3 text-right font-mono font-bold ${item.is_low_stock ? "text-destructive" : "text-success"}`}>
                  {item.quantity}
                </td>
                <td className="py-3 px-3 text-right font-mono text-muted-foreground">{item.min_stock_level}</td>
                <td className="py-3 px-3 text-right text-card-foreground">${Number(item.unit_price).toFixed(2)}</td>
                <td className="py-3 px-3 text-right font-medium text-card-foreground">${Number(item.stock_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="py-3 px-3 text-center">
                  {item.is_low_stock ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                      <TrendingUp className="w-3 h-3 rotate-180" /> Low
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">OK</span>
                  )}
                </td>              </tr>
            )})}
            {filteredItems?.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">
                {searchFilter ? 'No products match your search' : 'No inventory in this warehouse'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
