import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Code2, Database, Function as FunctionIcon } from "lucide-react";

export default function DatabaseSchema() {
  const [activeTab, setActiveTab] = useState("tables");

  const tables = [
    {
      name: "categories",
      description: "Product categories",
      columns: [
        { name: "id", type: "UUID", constraint: "PRIMARY KEY" },
        { name: "name", type: "TEXT", constraint: "NOT NULL, UNIQUE" },
        { name: "description", type: "TEXT", constraint: "" },
        { name: "color", type: "TEXT", constraint: "DEFAULT '#6366f1'" },
        { name: "created_at", type: "TIMESTAMP", constraint: "DEFAULT now()" },
      ],
    },
    {
      name: "warehouses",
      description: "Warehouse locations and details",
      columns: [
        { name: "id", type: "UUID", constraint: "PRIMARY KEY" },
        { name: "name", type: "TEXT", constraint: "NOT NULL" },
        { name: "location", type: "TEXT", constraint: "" },
        { name: "description", type: "TEXT", constraint: "" },
        { name: "capacity", type: "INTEGER", constraint: "DEFAULT 0" },
        { name: "created_at", type: "TIMESTAMP", constraint: "DEFAULT now()" },
        { name: "updated_at", type: "TIMESTAMP", constraint: "DEFAULT now()" },
      ],
    },
    {
      name: "products",
      description: "Product inventory items",
      columns: [
        { name: "id", type: "UUID", constraint: "PRIMARY KEY" },
        { name: "name", type: "TEXT", constraint: "NOT NULL" },
        { name: "sku", type: "TEXT", constraint: "NOT NULL, UNIQUE" },
        { name: "category_id", type: "UUID", constraint: "FOREIGN KEY → categories" },
        { name: "description", type: "TEXT", constraint: "" },
        { name: "unit_price", type: "NUMERIC(12,2)", constraint: "DEFAULT 0" },
        { name: "image_url", type: "TEXT", constraint: "" },
        { name: "min_stock_level", type: "INTEGER", constraint: "DEFAULT 10" },
        { name: "created_at", type: "TIMESTAMP", constraint: "DEFAULT now()" },
        { name: "updated_at", type: "TIMESTAMP", constraint: "DEFAULT now()" },
      ],
    },
    {
      name: "inventory",
      description: "Stock tracking per product per warehouse",
      columns: [
        { name: "id", type: "UUID", constraint: "PRIMARY KEY" },
        { name: "product_id", type: "UUID", constraint: "FOREIGN KEY → products" },
        { name: "warehouse_id", type: "UUID", constraint: "FOREIGN KEY → warehouses" },
        { name: "quantity", type: "INTEGER", constraint: "CHECK (>= 0)" },
        { name: "created_at", type: "TIMESTAMP", constraint: "DEFAULT now()" },
        { name: "updated_at", type: "TIMESTAMP", constraint: "DEFAULT now()" },
      ],
      indexes: ["idx_inventory_product", "idx_inventory_warehouse"],
    },
    {
      name: "inventory_movements",
      description: "Audit trail of all stock movements",
      columns: [
        { name: "id", type: "UUID", constraint: "PRIMARY KEY" },
        { name: "product_id", type: "UUID", constraint: "FOREIGN KEY → products" },
        { name: "from_warehouse_id", type: "UUID", constraint: "FOREIGN KEY → warehouses" },
        { name: "to_warehouse_id", type: "UUID", constraint: "FOREIGN KEY → warehouses" },
        { name: "quantity", type: "INTEGER", constraint: "CHECK (> 0)" },
        { name: "movement_type", type: "TEXT", constraint: "IN (incoming, outgoing, transfer, adjustment)" },
        { name: "notes", type: "TEXT", constraint: "" },
        { name: "created_at", type: "TIMESTAMP", constraint: "DEFAULT now()" },
      ],
      indexes: ["idx_movements_product", "idx_movements_date"],
    },
  ];

  const functions = [
    {
      name: "get_dashboard_stats()",
      description: "Returns overall dashboard statistics",
      returns: {
        total_warehouses: "integer",
        total_products: "integer",
        total_inventory_value: "numeric",
        low_stock_items: "integer",
        total_movements: "bigint",
      },
      usage: "useDashboardStats() in Dashboard",
      type: "Analytics",
    },
    {
      name: "get_low_stock_items()",
      description: "Returns products below minimum stock level with alert details",
      returns: {
        product_id: "uuid",
        product_name: "text",
        sku: "text",
        warehouse_name: "text",
        current_quantity: "integer",
        min_stock_level: "integer",
        deficit: "integer",
      },
      usage: "useLowStockItems() in Reports",
      type: "Analytics",
    },
    {
      name: "get_inventory_valuation()",
      description: "Calculates total inventory value per warehouse",
      returns: {
        warehouse_id: "uuid",
        warehouse_name: "text",
        warehouse_location: "text",
        total_items: "bigint",
        total_quantity: "bigint",
        total_value: "numeric",
      },
      usage: "useInventoryValuation() in Reports",
      type: "Analytics",
    },
    {
      name: "get_warehouse_inventory(p_warehouse_id)",
      description: "Lists all products in a specific warehouse",
      params: { p_warehouse_id: "uuid" },
      returns: {
        inventory_id: "uuid",
        product_id: "uuid",
        product_name: "text",
        sku: "text",
        category_name: "text",
        quantity: "integer",
        stock_value: "numeric",
        is_low_stock: "boolean",
      },
      usage: "useWarehouseInventory(warehouseId) in WarehouseDetail",
      type: "Reporting",
    },
    {
      name: "get_movement_summary(p_days)",
      description: "Returns movement trends over specified time period",
      params: { p_days: "integer (default: 30)" },
      returns: {
        movement_type: "text",
        total_quantity: "bigint",
        movement_count: "bigint",
        avg_quantity: "numeric",
        last_movement_date: "timestamp",
      },
      usage: "useMovementSummary(days) in Reports",
      type: "Analytics",
    },
    {
      name: "search_products(p_query)",
      description: "Full-text search across products by name, SKU, or description",
      params: { p_query: "text" },
      returns: {
        id: "uuid",
        name: "text",
        sku: "text",
        description: "text",
        category_name: "text",
        unit_price: "numeric",
        match_score: "integer",
      },
      usage: "useProductSearch(query) in Product Search",
      type: "Utility",
    },
    {
      name: "process_inventory_movement(p_product_id, p_movement_type, p_quantity, ...)",
      description: "ACID-compliant function for atomic inventory updates with validation",
      params: {
        p_product_id: "uuid",
        p_movement_type: "text (incoming|outgoing|transfer|adjustment)",
        p_quantity: "integer",
        p_from_warehouse_id: "uuid (optional)",
        p_to_warehouse_id: "uuid (optional)",
        p_notes: "text (optional)",
      },
      returns: { movement_id: "uuid" },
      usage: "useCreateMovement() in Movements Page",
      type: "Business Logic",
      features: ["Validates stock availability", "Updates inventory atomically", "Records audit trail", "Prevents race conditions"],
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Database Schema & Queries</h1>
        <p className="text-gray-600">Complete overview of Supabase tables and functions used in Warehouse Wizard</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Tables (5)
          </TabsTrigger>
          <TabsTrigger value="functions" className="flex items-center gap-2">
            <FunctionIcon className="w-4 h-4" />
            Functions (7)
          </TabsTrigger>
        </TabsList>

        {/* TABLES TAB */}
        <TabsContent value="tables" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 gap-6">
            {tables.map((table, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardHeader className="bg-blue-50 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-mono">{table.name}</CardTitle>
                      <CardDescription>{table.description}</CardDescription>
                    </div>
                    <Badge variant="outline">TABLE</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3 text-sm">Columns:</h4>
                      <div className="bg-gray-50 rounded-lg overflow-hidden border">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 border-b">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold">Column</th>
                              <th className="px-4 py-2 text-left font-semibold">Type</th>
                              <th className="px-4 py-2 text-left font-semibold">Constraint</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.columns.map((col, i) => (
                              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="px-4 py-2 font-mono text-blue-600">{col.name}</td>
                                <td className="px-4 py-2 font-mono text-gray-600">{col.type}</td>
                                <td className="px-4 py-2 text-xs text-gray-500">{col.constraint || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {table.indexes && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm">Indexes:</h4>
                        <div className="flex flex-wrap gap-2">
                          {table.indexes.map((idx, i) => (
                            <Badge key={i} variant="secondary" className="font-mono">
                              {idx}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* FUNCTIONS TAB */}
        <TabsContent value="functions" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 gap-6">
            {functions.map((func, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardHeader className="bg-purple-50 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-mono mb-1">{func.name}</CardTitle>
                      <CardDescription>{func.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-purple-100">
                        {func.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Parameters */}
                  {(func.params || Object.keys(func.params || {}).length > 0) && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Code2 className="w-4 h-4" />
                        Parameters:
                      </h4>
                      <div className="bg-gray-50 p-3 rounded font-mono text-sm space-y-1">
                        {typeof func.params === "object" &&
                          Object.entries(func.params).map(([key, val], i) => (
                            <div key={i}>
                              <span className="text-blue-600">{key}</span>
                              <span className="text-gray-500">: </span>
                              <span className="text-gray-700">{val}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Returns */}
                  <div>
                    <h4 className="font-semibold mb-2">Returns:</h4>
                    <div className="bg-gray-50 p-3 rounded font-mono text-sm space-y-1">
                      {typeof func.returns === "object" &&
                        Object.entries(func.returns).map(([key, val], i) => (
                          <div key={i}>
                            <span className="text-green-600">{key}</span>
                            <span className="text-gray-500">: </span>
                            <span className="text-gray-700">{val}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Usage */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">React Hook Usage:</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="font-mono text-sm text-blue-900">{func.usage}</p>
                    </div>
                  </div>

                  {/* Features */}
                  {func.features && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm">Features:</h4>
                      <ul className="space-y-1">
                        {func.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Section */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle>Architecture Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-blue-600">5</p>
            <p className="text-sm text-gray-600">Tables</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">7</p>
            <p className="text-sm text-gray-600">Functions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">6</p>
            <p className="text-sm text-gray-600">Indexes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">5</p>
            <p className="text-sm text-gray-600">RLS Policies</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
