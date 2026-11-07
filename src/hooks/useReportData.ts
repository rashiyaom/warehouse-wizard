import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats");
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: ["low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_low_stock_items");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInventoryValuation() {
  return useQuery({
    queryKey: ["inventory-valuation"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_inventory_valuation");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWarehouseInventory(warehouseId: string | null) {
  return useQuery({
    queryKey: ["warehouse-inventory", warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];
      const { data, error } = await supabase.rpc("get_warehouse_inventory", {
        p_warehouse_id: warehouseId,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!warehouseId,
  });
}

export function useMovementSummary(days = 30) {
  return useQuery({
    queryKey: ["movement-summary", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_movement_summary", {
        p_days: days,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ["product-search", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const { data, error } = await supabase.rpc("search_products", {
        p_query: query,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: query.trim().length > 0,
  });
}
