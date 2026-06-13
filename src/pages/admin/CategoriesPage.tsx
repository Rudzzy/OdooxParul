import { useState, useEffect } from "react";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { useProductStore, Category } from "../../store/productStore";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

const CATEGORY_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-teal-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-slate-500",
  "bg-stone-500",
];

export default function CategoriesPage() {
  const { categories, products, addCategory, updateCategory, deleteCategory, reorderCategories, fetchCategories, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);
  
  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Deletion state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [affectedProductsCount, setAffectedProductsCount] = useState(0);

  // New category drafting state
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderCategories(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleNameChange = (id: string, newName: string) => {
    updateCategory(id, { name: newName });
  };

  const handleColorChange = (id: string, newColor: string) => {
    updateCategory(id, { color: newColor });
  };

  const promptDelete = (category: Category) => {
    const count = products.filter((p) => p.categoryId === category.id).length;
    setCategoryToDelete(category);
    setAffectedProductsCount(count);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      toast.success("Category deleted");
      setCategoryToDelete(null);
    }
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    addCategory({ name: newCategoryName.trim(), color: newCategoryColor });
    setNewCategoryName("");
    setNewCategoryColor(CATEGORY_COLORS[0]);
    setIsAdding(false);
    toast.success("Category created");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your product categories and their visual appearance.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          New
        </Button>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-1/3">Product Category</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="w-16 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category, index) => (
              <TableRow 
                key={category.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={draggedIndex === index ? "opacity-50" : ""}
              >
                <TableCell className="text-muted-foreground cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4" />
                </TableCell>
                <TableCell>
                  <Input 
                    value={category.name}
                    onChange={(e) => handleNameChange(category.id, e.target.value)}
                    className="border-transparent hover:border-input focus:border-input bg-transparent"
                    placeholder="Category Name"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2 items-center">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(category.id, color)}
                        className={`w-6 h-6 rounded-full transition-all ${color} ${
                          category.color === color 
                            ? "ring-2 ring-offset-2 ring-slate-800 scale-110" 
                            : "hover:scale-110 border border-black/10"
                        }`}
                        title={color.replace('bg-', '').replace('-500', '')}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => promptDelete(category)}
                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {isAdding && (
              <TableRow className="bg-slate-50/50">
                <TableCell className="text-muted-foreground">
                  <GripVertical className="w-4 h-4 opacity-50" />
                </TableCell>
                <TableCell>
                  <Input 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNewCategory();
                      if (e.key === 'Escape') setIsAdding(false);
                    }}
                    autoFocus
                    className="bg-white border-primary"
                    placeholder="New Category Name..."
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2 items-center">
                    {CATEGORY_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewCategoryColor(color)}
                        className={`w-6 h-6 rounded-full transition-all ${color} ${
                          newCategoryColor === color 
                            ? "ring-2 ring-offset-2 ring-slate-800 scale-110" 
                            : "hover:scale-110 border border-black/10"
                        }`}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddNewCategory}>
                      Save
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isAdding && categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No categories found. Click "New" to add one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{categoryToDelete?.name}" category?
              {affectedProductsCount > 0 && (
                <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
                  <strong>Warning:</strong> This category is currently assigned to {affectedProductsCount} product{affectedProductsCount === 1 ? '' : 's'}. Deleting it will leave these products uncategorized.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
