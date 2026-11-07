import { useState } from "react";
import { Plus, Search, Package, Edit3, Trash2, Tag, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useCategories, useInventory } from "@/hooks/useInventoryData";
import { toast } from "sonner";

export default function Products() {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: inventory } = useInventory();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", sku: "", category_id: "" as string | null, unit_price: 0, min_stock_level: 10, description: "",
  });

  const resetForm = () => {
    setForm({ name: "", sku: "", category_id: null, unit_price: 0, min_stock_level: 10, description: "" });
    setEditing(null);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.sku) { toast.error("Name and SKU are required"); return; }
    try {
      const payload = { ...form, category_id: form.category_id || null };
      if (editing) {
        await updateProduct.mutateAsync({ id: editing, ...payload });
        toast.success("Product updated successfully");
      } else {
        await createProduct.mutateAsync(payload);
        toast.success("Product created successfully");
      }
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message || "Operation failed");
    }
  };

  const handleEdit = (p: any) => {
    setForm({
      name: p.name, sku: p.sku, category_id: p.category_id ?? "",
      unit_price: p.unit_price, min_stock_level: p.min_stock_level, description: p.description ?? "",
    });
    setEditing(p.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };
  const getTotalStock = (productId: string) =>
    inventory?.filter((i) => i.product_id === productId).reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const filtered = products
    ?.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    )
    ?.sort((a, b) => {
      // Sort by creation date (newest first)
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Product Catalog</h1>
          <p className="text-muted-foreground mt-2">Manage your inventory products with ease</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="btn-primary gap-2 px-6">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editing ? "Edit Product" : "Create New Product"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Product Name</Label>
                  <Input 
                    className="input-minimal" 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SKU Code</Label>
                  <Input 
                    className="input-minimal" 
                    value={form.sku} 
                    onChange={(e) => setForm({ ...form, sku: e.target.value })} 
                    placeholder="e.g., PROD-001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Unit Price</Label>
                  <Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Min Stock Level</Label>
                  <Input type="number" value={form.min_stock_level} onChange={(e) => setForm({ ...form, min_stock_level: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category_id ?? ""} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={createProduct.isPending || updateProduct.isPending}>
                {editing ? "Update" : "Create"} Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>      <div className="stat-card overflow-x-auto">
        <div className="flex items-center justify-between mb-4 px-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>Showing {filtered?.length || 0} products (sorted by newest first)</span>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Product</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">SKU</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Category</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Price</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Stock</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map((p) => {
              const stock = getTotalStock(p.id);
              const isLow = stock <= p.min_stock_level;
              return (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-3 font-medium text-card-foreground">{p.name}</td>
                  <td className="py-3 px-3 font-mono text-muted-foreground text-xs">{p.sku}</td>
                  <td className="py-3 px-3">
                    {p.categories ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                        {p.categories.name}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-3 px-3 text-right text-card-foreground">${Number(p.unit_price).toFixed(2)}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-mono font-bold ${isLow ? "text-destructive" : "text-success"}`}>
                      {stock}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(p)}>
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered?.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
