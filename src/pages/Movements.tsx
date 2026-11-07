import { useState } from "react";
import { Plus, ArrowRight, Activity, Package, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMovements, useCreateMovement, useProducts, useWarehouses } from "@/hooks/useInventoryData";
import { toast } from "sonner";

export default function Movements() {
  const { data: movements, isLoading } = useMovements();
  const { data: products } = useProducts();
  const { data: warehouses } = useWarehouses();
  const createMovement = useCreateMovement();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    product_id: "", movement_type: "incoming" as string,
    from_warehouse_id: "" as string | null, to_warehouse_id: "" as string | null,
    quantity: 1, notes: "",
  });

  const resetForm = () => setForm({ product_id: "", movement_type: "incoming", from_warehouse_id: null, to_warehouse_id: null, quantity: 1, notes: "" });

  const handleSubmit = async () => {
    if (!form.product_id) { toast.error("Select a product"); return; }
    if (form.movement_type === "incoming" && !form.to_warehouse_id) { toast.error("Select destination warehouse"); return; }
    if (form.movement_type === "outgoing" && !form.from_warehouse_id) { toast.error("Select source warehouse"); return; }
    if (form.movement_type === "transfer" && (!form.from_warehouse_id || !form.to_warehouse_id)) { toast.error("Select both warehouses"); return; }

    try {
      await createMovement.mutateAsync({
        product_id: form.product_id,
        movement_type: form.movement_type,
        from_warehouse_id: form.from_warehouse_id || null,
        to_warehouse_id: form.to_warehouse_id || null,
        quantity: form.quantity,
        notes: form.notes || null,
      });
      toast.success("Movement recorded");
      setOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Movements</h1>
          <p className="text-muted-foreground text-sm mt-1">Track incoming, outgoing, and transfer operations</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />New Movement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Movement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Movement Type</Label>
                <Select value={form.movement_type} onValueChange={(v) => setForm({ ...form, movement_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Product</Label>
                <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(form.movement_type === "outgoing" || form.movement_type === "transfer") && (
                <div>
                  <Label>From Warehouse</Label>
                  <Select value={form.from_warehouse_id ?? ""} onValueChange={(v) => setForm({ ...form, from_warehouse_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(form.movement_type === "incoming" || form.movement_type === "transfer") && (
                <div>
                  <Label>To Warehouse</Label>
                  <Select value={form.to_warehouse_id ?? ""} onValueChange={(v) => setForm({ ...form, to_warehouse_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Quantity</Label>
                <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={createMovement.isPending}>
                Record Movement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Type</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Product</th>
              <th className="text-right py-3 px-3 text-muted-foreground font-medium">Qty</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Route</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Notes</th>
              <th className="text-left py-3 px-3 text-muted-foreground font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {movements?.map((m) => (
              <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-3 px-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    m.movement_type === "incoming" ? "bg-success/10 text-success" :
                    m.movement_type === "outgoing" ? "bg-destructive/10 text-destructive" :
                    m.movement_type === "transfer" ? "bg-info/10 text-info" :
                    "bg-warning/10 text-warning"
                  }`}>
                    {m.movement_type}
                  </span>
                </td>
                <td className="py-3 px-3 text-card-foreground font-medium">{m.products?.name}</td>
                <td className="py-3 px-3 text-right font-mono text-card-foreground">{m.quantity}</td>
                <td className="py-3 px-3 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {m.from_warehouse?.name ?? "External"}
                    <ArrowRight className="w-3 h-3" />
                    {m.to_warehouse?.name ?? "External"}
                  </span>
                </td>
                <td className="py-3 px-3 text-muted-foreground max-w-[200px] truncate">{m.notes ?? "—"}</td>
                <td className="py-3 px-3 text-muted-foreground">{new Date(m.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {movements?.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No movements yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
