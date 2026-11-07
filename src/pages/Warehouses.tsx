import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Warehouse, Plus, Edit3, Trash2, MapPin, Package, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse, useInventory } from "@/hooks/useInventoryData";
import { toast } from "sonner";

export default function Warehouses() {
  const navigate = useNavigate();
  const { data: warehouses, isLoading } = useWarehouses();
  const { data: inventory } = useInventory();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", location: "", description: "", capacity: 0 });

  const resetForm = () => { setForm({ name: "", location: "", description: "", capacity: 0 }); setEditing(null); };

  const handleSubmit = async () => {
    if (!form.name) { toast.error("Name is required"); return; }
    try {
      if (editing) {
        await updateWarehouse.mutateAsync({ id: editing, ...form });
        toast.success("Warehouse updated");
      } else {
        await createWarehouse.mutateAsync(form);
        toast.success("Warehouse created");
      }
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEdit = (w: any) => {
    setForm({ name: w.name, location: w.location ?? "", description: w.description ?? "", capacity: w.capacity ?? 0 });
    setEditing(w.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this warehouse?")) return;
    try {
      await deleteWarehouse.mutateAsync(id);
      toast.success("Warehouse deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getWarehouseStock = (warehouseId: string) =>
    inventory?.filter((i) => i.warehouse_id === warehouseId).reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const getWarehouseProducts = (warehouseId: string) =>
    inventory?.filter((i) => i.warehouse_id === warehouseId).length ?? 0;
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Warehouse Network</h1>
          <p className="text-muted-foreground mt-2">Manage your storage facilities and locations</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary gap-2 px-6">
              <Plus className="w-4 h-4" />
              New Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editing ? "Edit Warehouse" : "Add New Warehouse"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Warehouse Name</Label>
                <Input 
                  className="input-minimal" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="e.g., Main Distribution Center" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Location</Label>
                <Input 
                  className="input-minimal" 
                  value={form.location} 
                  onChange={(e) => setForm({ ...form, location: e.target.value })} 
                  placeholder="e.g., New York, USA" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Storage Capacity</Label>
                <Input 
                  className="input-minimal" 
                  type="number" 
                  value={form.capacity} 
                  onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })} 
                  placeholder="Maximum storage units"
                />              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea 
                  className="input-minimal min-h-[80px]" 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  placeholder="Optional warehouse description"
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                className="btn-primary w-full" 
                disabled={createWarehouse.isPending || updateWarehouse.isPending}
              >
                {editing ? "Update Warehouse" : "Create Warehouse"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-32 bg-muted/30 rounded-xl"></div>
            </div>
          ))}
        </div>      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses?.map((w) => (
            <div key={w.id} className="stat-card group hover:scale-[1.02] transition-all duration-300 cursor-pointer">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <Warehouse className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl hover:bg-blue-50" 
                    onClick={() => navigate(`/warehouses/${w.id}`)}
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl hover:bg-orange-50" 
                    onClick={() => handleEdit(w)}
                  >
                    <Edit3 className="w-4 h-4 text-orange-600" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl hover:bg-red-50 text-red-600" 
                    onClick={() => handleDelete(w.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <h3 className="text-lg font-semibold mt-3 text-card-foreground">{w.name}</h3>
              {w.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />{w.location}
                </p>
              )}
              <div className="flex gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="text-lg font-bold text-card-foreground">{getWarehouseProducts(w.id)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Stock</p>
                  <p className="text-lg font-bold text-card-foreground">{getWarehouseStock(w.id)}</p>
                </div>
                {w.capacity ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="text-lg font-bold text-card-foreground">{w.capacity}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {warehouses?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No warehouses yet. Create one to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
