import { useState } from "react";
import { Plus, Trash2, Tag, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/useInventoryData";
import { toast } from "sonner";

export default function Categories() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", color: "#007AFF" });

  const colorOptions = [
    "#007AFF", "#34C759", "#FF9500", "#FF3B30", 
    "#AF52DE", "#5AC8FA", "#FFCC00", "#FF2D92"
  ];

  const handleSubmit = async () => {
    if (!form.name) { toast.error("Category name is required"); return; }
    try {
      await createCategory.mutateAsync(form);
      toast.success("Category created successfully");
      setOpen(false);
      setForm({ name: "", color: "#007AFF" });
    } catch (e: any) {
      toast.error(e.message || "Failed to create category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory.mutateAsync(id);
      toast.success("Category deleted successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Product Categories</h1>
          <p className="text-muted-foreground mt-2">Organize and manage your product classifications</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary gap-2 px-6">
              <Plus className="w-4 h-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Electronics" />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={createCategory.isPending}>Create Category</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories?.map((c) => (
          <div key={c.id} className="stat-card group flex items-center gap-3">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.color ?? "#6366f1" }} />
            <span className="flex-1 font-medium text-card-foreground">{c.name}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(c.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        {categories?.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">No categories yet</div>
        )}
      </div>
    </div>
  );
}
