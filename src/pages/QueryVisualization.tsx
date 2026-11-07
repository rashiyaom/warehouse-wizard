import React, { useState, useEffect } from "react";
import { 
  Database, 
  Play, 
  Save, 
  Download, 
  Copy, 
  Code2, 
  BarChart3, 
  Table, 
  Settings,
  Clock,
  Zap,
  FileText,
  Eye,
  TrendingUp,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartCard } from "@/components/ChartCard";
import { StatCard } from "@/components/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  Treemap,
  RadialBarChart,
  RadialBar
} from "recharts";

// Apple-inspired color palette
const CHART_COLORS = [
  "#007AFF", // Apple Blue
  "#34C759", // Apple Green  
  "#FF9500", // Apple Orange
  "#FF3B30", // Apple Red
  "#AF52DE", // Apple Purple
  "#5AC8FA", // Apple Teal
  "#FF2D92", // Apple Pink
  "#8E8E93"  // Apple Gray
];

interface QueryResult {
  columns: string[];
  rows: any[];
  executionTime: number;
  rowCount: number;
}

interface SavedQuery {
  id: string;
  name: string;
  query: string;
  created: Date;
  category: string;
}

// Pre-built query templates
const QUERY_TEMPLATES = [
  {
    id: "inventory_overview",
    name: "Inventory Overview",
    category: "Analytics",
    description: "Complete inventory status across all warehouses",
    query: `SELECT 
  w.name as warehouse_name,
  COUNT(i.id) as product_count,
  SUM(i.quantity) as total_quantity,
  SUM(i.quantity * p.unit_price) as total_value,
  AVG(i.quantity) as avg_quantity
FROM warehouses w
LEFT JOIN inventory i ON w.id = i.warehouse_id
LEFT JOIN products p ON i.product_id = p.id
GROUP BY w.id, w.name
ORDER BY total_value DESC;`
  },
  {
    id: "movement_analysis",
    name: "Movement Analysis",
    category: "Operations",
    description: "30-day movement trends and patterns",
    query: `SELECT 
  DATE(m.created_at) as movement_date,
  m.movement_type,
  COUNT(*) as transaction_count,
  SUM(m.quantity) as total_quantity,
  AVG(m.quantity) as avg_quantity
FROM movements m
WHERE m.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(m.created_at), m.movement_type
ORDER BY movement_date DESC;`
  },
  {
    id: "category_performance",
    name: "Category Performance",
    category: "Performance",
    description: "Product category analysis and valuation",
    query: `SELECT 
  c.name as category_name,
  COUNT(p.id) as product_count,
  SUM(i.quantity) as total_stock,
  SUM(i.quantity * p.unit_price) as category_value,
  AVG(p.unit_price) as avg_price,
  MAX(p.unit_price) as max_price,
  MIN(p.unit_price) as min_price
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
LEFT JOIN inventory i ON p.id = i.product_id
GROUP BY c.id, c.name
ORDER BY category_value DESC;`
  },
  {
    id: "low_stock_alert",
    name: "Low Stock Analysis",
    category: "Alerts",
    description: "Products requiring immediate attention",
    query: `SELECT 
  p.name as product_name,
  c.name as category,
  w.name as warehouse,
  i.quantity as current_stock,
  i.min_quantity as minimum_required,
  (i.min_quantity - i.quantity) as shortage,
  (i.quantity * p.unit_price) as stock_value
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN warehouses w ON i.warehouse_id = w.id
WHERE i.quantity <= i.min_quantity
ORDER BY shortage DESC;`
  },
  {
    id: "warehouse_utilization",
    name: "Warehouse Utilization",
    category: "Analytics",
    description: "Space and capacity analysis",
    query: `SELECT 
  w.name as warehouse_name,
  w.location,
  COUNT(DISTINCT i.product_id) as unique_products,
  SUM(i.quantity) as total_units,
  SUM(i.quantity * p.unit_price) as inventory_value,
  ROUND(AVG(i.quantity), 2) as avg_stock_per_product,
  COUNT(DISTINCT p.category_id) as category_diversity
FROM warehouses w
LEFT JOIN inventory i ON w.id = i.warehouse_id
LEFT JOIN products p ON i.product_id = p.id
GROUP BY w.id, w.name, w.location
ORDER BY inventory_value DESC;`
  },
  {
    id: "monthly_revenue_trends",
    name: "Monthly Revenue Trends",
    category: "Financial",
    description: "Revenue analysis by month with growth metrics",
    query: `SELECT 
  DATE_TRUNC('month', m.created_at) as month,
  SUM(CASE WHEN m.movement_type = 'outgoing' THEN m.quantity * p.unit_price ELSE 0 END) as revenue,
  COUNT(CASE WHEN m.movement_type = 'outgoing' THEN 1 END) as sales_count,
  AVG(CASE WHEN m.movement_type = 'outgoing' THEN m.quantity * p.unit_price END) as avg_sale_value,
  SUM(CASE WHEN m.movement_type = 'incoming' THEN m.quantity * p.unit_price ELSE 0 END) as procurement_cost,
  COUNT(DISTINCT p.category_id) as categories_sold
FROM movements m
JOIN products p ON m.product_id = p.id
WHERE m.created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', m.created_at)
ORDER BY month DESC;`
  },
  {
    id: "top_selling_products",
    name: "Top Selling Products",
    category: "Sales",
    description: "Best performing products by revenue and quantity",
    query: `SELECT 
  p.name as product_name,
  c.name as category,
  COUNT(m.id) as total_transactions,
  SUM(m.quantity) as total_sold,
  SUM(m.quantity * p.unit_price) as total_revenue,
  AVG(m.quantity) as avg_quantity_per_sale,
  MAX(m.created_at) as last_sale_date,
  ROUND(SUM(m.quantity * p.unit_price) / COUNT(m.id), 2) as avg_revenue_per_transaction
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN movements m ON p.id = m.product_id
WHERE m.movement_type = 'outgoing' 
  AND m.created_at >= NOW() - INTERVAL '90 days'
GROUP BY p.id, p.name, c.name
ORDER BY total_revenue DESC
LIMIT 20;`
  },
  {
    id: "warehouse_efficiency_report",
    name: "Warehouse Efficiency Report",
    category: "Operations",
    description: "Operational efficiency metrics by warehouse",
    query: `SELECT 
  w.name as warehouse_name,
  w.location,
  COUNT(DISTINCT DATE(m.created_at)) as active_days,
  COUNT(m.id) as total_movements,
  COUNT(CASE WHEN m.movement_type = 'incoming' THEN 1 END) as inbound_count,
  COUNT(CASE WHEN m.movement_type = 'outgoing' THEN 1 END) as outbound_count,
  COUNT(CASE WHEN m.movement_type = 'transfer' THEN 1 END) as transfer_count,
  ROUND(COUNT(m.id)::decimal / NULLIF(COUNT(DISTINCT DATE(m.created_at)), 0), 2) as avg_daily_movements,
  SUM(i.quantity * p.unit_price) as current_inventory_value,
  COUNT(DISTINCT i.product_id) as product_variety
FROM warehouses w
LEFT JOIN movements m ON w.id = m.warehouse_id 
  AND m.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN inventory i ON w.id = i.warehouse_id
LEFT JOIN products p ON i.product_id = p.id
GROUP BY w.id, w.name, w.location
ORDER BY avg_daily_movements DESC NULLS LAST;`
  },
  {
    id: "inventory_turnover_analysis",
    name: "Inventory Turnover Analysis",
    category: "Performance",
    description: "Product turnover rates and velocity metrics",
    query: `SELECT 
  p.name as product_name,
  c.name as category,
  w.name as warehouse,
  i.quantity as current_stock,
  COALESCE(SUM(CASE WHEN m.movement_type = 'outgoing' AND m.created_at >= NOW() - INTERVAL '30 days' THEN m.quantity END), 0) as sold_last_30_days,
  CASE 
    WHEN i.quantity > 0 THEN ROUND((COALESCE(SUM(CASE WHEN m.movement_type = 'outgoing' AND m.created_at >= NOW() - INTERVAL '30 days' THEN m.quantity END), 0) * 30.0) / i.quantity, 2)
    ELSE 0 
  END as turnover_rate,
  CASE 
    WHEN COALESCE(SUM(CASE WHEN m.movement_type = 'outgoing' AND m.created_at >= NOW() - INTERVAL '30 days' THEN m.quantity END), 0) > 0 
    THEN ROUND(i.quantity / (COALESCE(SUM(CASE WHEN m.movement_type = 'outgoing' AND m.created_at >= NOW() - INTERVAL '30 days' THEN m.quantity END), 0) / 30.0), 1)
    ELSE 999 
  END as days_of_supply,
  i.quantity * p.unit_price as stock_value
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN warehouses w ON i.warehouse_id = w.id
LEFT JOIN movements m ON p.id = m.product_id AND w.id = m.warehouse_id
GROUP BY p.id, p.name, c.name, w.name, i.quantity, p.unit_price
HAVING i.quantity > 0
ORDER BY turnover_rate DESC;`
  }
];

export default function QueryVisualization() {
  const [activeQuery, setActiveQuery] = useState<string>(QUERY_TEMPLATES[0].query);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<Array<{
    query: string;
    timestamp: Date;
    executionTime: number;
    rowCount: number;
  }>>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(QUERY_TEMPLATES[0].id);
  const [visualizationType, setVisualizationType] = useState<'table' | 'chart'>('chart');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radial'>('bar');

  // Simulate query execution
  const executeQuery = async (query: string) => {
    setIsExecuting(true);
    
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate mock data based on query type
    let mockData = generateMockData(query);
    const executionTime = Math.random() * 150 + 50;
    
    const result: QueryResult = {
      columns: mockData.columns,
      rows: mockData.rows,
      executionTime,
      rowCount: mockData.rows.length
    };
    
    setQueryResult(result);
    setExecutionHistory(prev => [{
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      timestamp: new Date(),
      executionTime,
      rowCount: mockData.rows.length
    }, ...prev.slice(0, 9)]);
    
    setIsExecuting(false);
  };
  const generateMockData = (query: string) => {
    if (query.includes('warehouse_name') && query.includes('total_value')) {
      return {
        columns: ['warehouse_name', 'product_count', 'total_quantity', 'total_value', 'avg_quantity'],
        rows: [
          { warehouse_name: 'Central Warehouse', product_count: 145, total_quantity: 12500, total_value: 2750000, avg_quantity: 86.2 },
          { warehouse_name: 'North Distribution', product_count: 98, total_quantity: 8600, total_value: 1890000, avg_quantity: 87.8 },
          { warehouse_name: 'South Hub', product_count: 76, total_quantity: 6200, total_value: 1450000, avg_quantity: 81.6 },
          { warehouse_name: 'East Storage', product_count: 112, total_quantity: 9800, total_value: 2100000, avg_quantity: 87.5 },
          { warehouse_name: 'West Depot', product_count: 89, total_quantity: 7300, total_value: 1680000, avg_quantity: 82.0 }
        ]
      };
    } else if (query.includes('movement_date')) {
      const dates = Array.from({length: 15}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();
      
      return {
        columns: ['movement_date', 'movement_type', 'transaction_count', 'total_quantity', 'avg_quantity'],
        rows: dates.flatMap(date => [
          { movement_date: date, movement_type: 'incoming', transaction_count: Math.floor(Math.random() * 20) + 10, total_quantity: Math.floor(Math.random() * 500) + 200, avg_quantity: Math.floor(Math.random() * 20) + 15 },
          { movement_date: date, movement_type: 'outgoing', transaction_count: Math.floor(Math.random() * 15) + 8, total_quantity: Math.floor(Math.random() * 400) + 150, avg_quantity: Math.floor(Math.random() * 18) + 12 },
          { movement_date: date, movement_type: 'transfer', transaction_count: Math.floor(Math.random() * 10) + 3, total_quantity: Math.floor(Math.random() * 200) + 50, avg_quantity: Math.floor(Math.random() * 15) + 8 }
        ])
      };
    } else if (query.includes('category_name')) {
      return {
        columns: ['category_name', 'product_count', 'total_stock', 'category_value', 'avg_price', 'max_price', 'min_price'],
        rows: [
          { category_name: 'Electronics', product_count: 85, total_stock: 3200, category_value: 1250000, avg_price: 390.63, max_price: 1200, min_price: 45 },
          { category_name: 'Clothing', product_count: 156, total_stock: 8900, category_value: 890000, avg_price: 100.00, max_price: 350, min_price: 15 },
          { category_name: 'Home & Garden', product_count: 67, total_stock: 2100, category_value: 420000, avg_price: 200.00, max_price: 800, min_price: 25 },
          { category_name: 'Sports', product_count: 92, total_stock: 4500, category_value: 675000, avg_price: 150.00, max_price: 450, min_price: 20 },
          { category_name: 'Books', product_count: 234, total_stock: 12000, category_value: 360000, avg_price: 30.00, max_price: 120, min_price: 8 }
        ]
      };
    } else if (query.includes('product_name') && query.includes('shortage')) {
      return {
        columns: ['product_name', 'category', 'warehouse', 'current_stock', 'minimum_required', 'shortage', 'stock_value'],
        rows: [
          { product_name: 'iPhone 15 Pro', category: 'Electronics', warehouse: 'Central Warehouse', current_stock: 5, minimum_required: 20, shortage: 15, stock_value: 4995 },
          { product_name: 'Gaming Headset', category: 'Electronics', warehouse: 'North Distribution', current_stock: 8, minimum_required: 25, shortage: 17, stock_value: 1200 },
          { product_name: 'Running Shoes', category: 'Sports', warehouse: 'South Hub', current_stock: 12, minimum_required: 30, shortage: 18, stock_value: 1800 },
          { product_name: 'Office Chair', category: 'Furniture', warehouse: 'East Storage', current_stock: 3, minimum_required: 15, shortage: 12, stock_value: 750 },
          { product_name: 'Bluetooth Speaker', category: 'Electronics', warehouse: 'West Depot', current_stock: 6, minimum_required: 20, shortage: 14, stock_value: 900 }
        ]
      };
    } else if (query.includes('month') && query.includes('revenue')) {
      const months = Array.from({length: 12}, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toISOString().slice(0, 7) + '-01';
      }).reverse();
      
      return {
        columns: ['month', 'revenue', 'sales_count', 'avg_sale_value', 'procurement_cost', 'categories_sold'],
        rows: months.map(month => ({
          month,
          revenue: Math.floor(Math.random() * 500000) + 200000,
          sales_count: Math.floor(Math.random() * 150) + 50,
          avg_sale_value: Math.floor(Math.random() * 2000) + 500,
          procurement_cost: Math.floor(Math.random() * 300000) + 100000,
          categories_sold: Math.floor(Math.random() * 8) + 5
        }))
      };
    } else if (query.includes('total_sold') && query.includes('total_revenue')) {
      return {
        columns: ['product_name', 'category', 'total_transactions', 'total_sold', 'total_revenue', 'avg_quantity_per_sale', 'last_sale_date', 'avg_revenue_per_transaction'],
        rows: [
          { product_name: 'MacBook Pro 16"', category: 'Electronics', total_transactions: 45, total_sold: 47, total_revenue: 117500, avg_quantity_per_sale: 1.04, last_sale_date: '2026-03-23', avg_revenue_per_transaction: 2611.11 },
          { product_name: 'Nike Air Max', category: 'Sports', total_transactions: 89, total_sold: 134, total_revenue: 20100, avg_quantity_per_sale: 1.51, last_sale_date: '2026-03-24', avg_revenue_per_transaction: 225.84 },
          { product_name: 'Coffee Maker', category: 'Home & Garden', total_transactions: 67, total_sold: 78, total_revenue: 11700, avg_quantity_per_sale: 1.16, last_sale_date: '2026-03-22', avg_revenue_per_transaction: 174.63 },
          { product_name: 'Gaming Mouse', category: 'Electronics', total_transactions: 125, total_sold: 156, total_revenue: 9360, avg_quantity_per_sale: 1.25, last_sale_date: '2026-03-24', avg_revenue_per_transaction: 74.88 },
          { product_name: 'Yoga Mat', category: 'Sports', total_transactions: 78, total_sold: 89, total_revenue: 4450, avg_quantity_per_sale: 1.14, last_sale_date: '2026-03-23', avg_revenue_per_transaction: 57.05 }
        ]
      };
    } else if (query.includes('active_days') && query.includes('avg_daily_movements')) {
      return {
        columns: ['warehouse_name', 'location', 'active_days', 'total_movements', 'inbound_count', 'outbound_count', 'transfer_count', 'avg_daily_movements', 'current_inventory_value', 'product_variety'],
        rows: [
          { warehouse_name: 'Central Warehouse', location: 'New York', active_days: 28, total_movements: 456, inbound_count: 198, outbound_count: 189, transfer_count: 69, avg_daily_movements: 16.29, current_inventory_value: 2750000, product_variety: 145 },
          { warehouse_name: 'North Distribution', location: 'Boston', active_days: 26, total_movements: 312, inbound_count: 134, outbound_count: 142, transfer_count: 36, avg_daily_movements: 12.00, current_inventory_value: 1890000, product_variety: 98 },
          { warehouse_name: 'South Hub', location: 'Atlanta', active_days: 25, total_movements: 289, inbound_count: 123, outbound_count: 119, transfer_count: 47, avg_daily_movements: 11.56, current_inventory_value: 1450000, product_variety: 76 },
          { warehouse_name: 'East Storage', location: 'Philadelphia', active_days: 27, total_movements: 298, inbound_count: 128, outbound_count: 126, transfer_count: 44, avg_daily_movements: 11.04, current_inventory_value: 2100000, product_variety: 112 },
          { warehouse_name: 'West Depot', location: 'Chicago', active_days: 24, total_movements: 234, inbound_count: 102, outbound_count: 98, transfer_count: 34, avg_daily_movements: 9.75, current_inventory_value: 1680000, product_variety: 89 }
        ]
      };
    } else if (query.includes('turnover_rate') && query.includes('days_of_supply')) {
      return {
        columns: ['product_name', 'category', 'warehouse', 'current_stock', 'sold_last_30_days', 'turnover_rate', 'days_of_supply', 'stock_value'],
        rows: [
          { product_name: 'iPhone 15', category: 'Electronics', warehouse: 'Central Warehouse', current_stock: 45, sold_last_30_days: 67, turnover_rate: 44.67, days_of_supply: 20.1, stock_value: 44955 },
          { product_name: 'Samsung TV 55"', category: 'Electronics', warehouse: 'North Distribution', current_stock: 12, sold_last_30_days: 23, turnover_rate: 57.50, days_of_supply: 15.7, stock_value: 7188 },
          { product_name: 'Nike Sneakers', category: 'Sports', warehouse: 'South Hub', current_stock: 89, sold_last_30_days: 45, turnover_rate: 15.17, days_of_supply: 59.3, stock_value: 8010 },
          { product_name: 'Coffee Machine', category: 'Home & Garden', warehouse: 'East Storage', current_stock: 23, sold_last_30_days: 34, turnover_rate: 44.35, days_of_supply: 20.3, stock_value: 3450 },
          { product_name: 'Gaming Laptop', category: 'Electronics', warehouse: 'West Depot', current_stock: 8, sold_last_30_days: 12, turnover_rate: 45.00, days_of_supply: 20.0, stock_value: 9592 }
        ]
      };
    }
    
    // Default fallback data
    return {
      columns: ['name', 'value', 'category', 'status'],
      rows: Array.from({length: 10}, (_, i) => ({
        name: `Item ${i + 1}`,
        value: Math.floor(Math.random() * 1000) + 100,
        category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        status: ['Active', 'Pending', 'Completed'][Math.floor(Math.random() * 3)]
      }))
    };
  };

  const renderChart = () => {
    if (!queryResult || queryResult.rows.length === 0) return null;

    const data = queryResult.rows.slice(0, 20); // Limit for better visualization

    switch (chartType) {
      case 'bar':
        const barKey = Object.keys(data[0]).find(key => typeof data[0][key] === 'number') || '';
        const labelKey = Object.keys(data[0]).find(key => typeof data[0][key] === 'string') || '';
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
              }} />
              <Bar dataKey={barKey} fill="#007AFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        const lineKey = Object.keys(data[0]).find(key => typeof data[0][key] === 'number') || '';
        const xKey = Object.keys(data[0])[0];
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} stroke="#6B7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
              <Tooltip contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
              }} />
              <Line type="monotone" dataKey={lineKey} stroke="#007AFF" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = data.slice(0, 8).map((item, index) => ({
          name: Object.values(item)[0] as string,
          value: Object.values(item).find(v => typeof v === 'number') as number,
          fill: CHART_COLORS[index % CHART_COLORS.length]
        }));
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
              }} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

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
          PostgreSQL Query Visualization
        </h1>
        <p className="text-muted-foreground text-lg">
          Interactive query builder with real-time data visualization
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Query Templates" 
          value={QUERY_TEMPLATES.length} 
          icon={Database} 
          color="primary"
          subtitle="Pre-built queries"
        />
        <StatCard 
          title="Execution History" 
          value={executionHistory.length} 
          icon={Clock} 
          color="success"
          subtitle="Recent executions"
        />
        <StatCard 
          title="Avg Exec Time" 
          value={executionHistory.length > 0 ? `${Math.round(executionHistory.reduce((sum, h) => sum + h.executionTime, 0) / executionHistory.length)}ms` : "—"} 
          icon={Zap} 
          color="info"
          subtitle="Performance metric"
        />
        <StatCard 
          title="Total Rows" 
          value={queryResult?.rowCount.toLocaleString() ?? "—"} 
          icon={Table} 
          color="warning"
          subtitle="Last result set"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Query Builder Panel */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <ChartCard
            title="Query Builder"
            subtitle="Write and execute PostgreSQL queries"
          >
            <div className="space-y-6">
              {/* Template Selector */}
              <div className="flex flex-wrap gap-2">
                {QUERY_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setActiveQuery(template.query);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedTemplate === template.id
                        ? "bg-[#007AFF] text-white shadow-lg"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>

              {/* Query Editor */}
              <div className="relative">
                <textarea
                  value={activeQuery}
                  onChange={(e) => setActiveQuery(e.target.value)}
                  className="w-full h-64 p-4 bg-muted/30 border border-border/50 rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF]/50 transition-all duration-200"
                  placeholder="Enter your PostgreSQL query here..."
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="p-2 bg-background/80 hover:bg-background border border-border/50 rounded-lg transition-colors">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 bg-background/80 hover:bg-background border border-border/50 rounded-lg transition-colors">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Query Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => executeQuery(activeQuery)}
                    disabled={isExecuting || !activeQuery.trim()}
                    className="flex items-center gap-2 px-6 py-3 bg-[#007AFF] hover:bg-[#007AFF]/90 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExecuting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {isExecuting ? "Executing..." : "Execute Query"}
                  </motion.button>
                  
                  <button className="flex items-center gap-2 px-4 py-3 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-xl font-medium transition-colors">
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setVisualizationType('table')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        visualizationType === 'table' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Table className="w-4 h-4" />
                      Table
                    </button>
                    <button
                      onClick={() => setVisualizationType('chart')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        visualizationType === 'chart' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Chart
                    </button>
                  </div>

                  {visualizationType === 'chart' && (
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value as any)}
                      className="px-3 py-2 bg-muted border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
                    >
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="pie">Pie Chart</option>
                      <option value="area">Area Chart</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </ChartCard>
        </motion.div>

        {/* Query Templates & History */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Template Details */}
          <ChartCard
            title="Template Info"
            subtitle="Query details and description"
          >
            <div className="space-y-4">
              {(() => {
                const template = QUERY_TEMPLATES.find(t => t.id === selectedTemplate);
                if (!template) return null;
                
                return (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{template.name}</h3>
                      <span className="inline-block px-2 py-1 bg-[#007AFF]/10 text-[#007AFF] rounded-md text-xs font-medium mt-1">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                );
              })()}
            </div>
          </ChartCard>

          {/* Execution History */}
          <ChartCard
            title="Recent Executions"
            subtitle="Query execution history"
          >
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {executionHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No executions yet</p>
                </div>
              ) : (
                executionHistory.map((execution, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        {execution.timestamp.toLocaleTimeString()}
                      </span>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                          {execution.executionTime.toFixed(0)}ms
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {execution.rowCount} rows
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {execution.query}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ChartCard>
        </motion.div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {queryResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <ChartCard
              title="Query Results"
              subtitle={`${queryResult.rowCount} rows returned in ${queryResult.executionTime.toFixed(1)}ms`}
            >
              {visualizationType === 'chart' ? (
                <div className="space-y-4">
                  {renderChart()}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        {queryResult.columns.map((column) => (
                          <th key={column} className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.slice(0, 50).map((row, index) => (
                        <tr key={index} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                          {queryResult.columns.map((column) => (
                            <td key={column} className="py-3 px-4 text-sm">
                              {typeof row[column] === 'number' 
                                ? row[column].toLocaleString() 
                                : String(row[column] ?? '—')
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                      {queryResult.rows.length > 50 && (
                        <tr>
                          <td colSpan={queryResult.columns.length} className="text-center py-4 text-muted-foreground text-sm">
                            Showing first 50 of {queryResult.rowCount} results
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/20">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Execution time: {queryResult.executionTime.toFixed(1)}ms</span>
                  <span>•</span>
                  <span>{queryResult.rowCount} rows</span>
                  <span>•</span>
                  <span>{queryResult.columns.length} columns</span>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium transition-colors">
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>
            </ChartCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
