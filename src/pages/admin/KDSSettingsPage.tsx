import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, MonitorCheck, MonitorOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useProductStore, Product } from "../../store/productStore";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";

export default function KDSSettingsPage() {
  const { products, categories, updateProduct } = useProductStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state to handle fast toggling before debounce sync
  const [localToggles, setLocalToggles] = useState<Record<string, boolean>>({});

  // Initialize local toggles from store (defaulting to true if undefined)
  useEffect(() => {
    const initialToggles: Record<string, boolean> = {};
    products.forEach(p => {
      initialToggles[p.id] = p.showOnKds !== false;
    });
    setLocalToggles(initialToggles);
  }, [products]);

  // Debounced Save Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      // Check for differences between localToggles and store
      let hasChanges = false;
      products.forEach(p => {
        const currentVal = p.showOnKds !== false;
        const localVal = localToggles[p.id];
        if (localVal !== undefined && localVal !== currentVal) {
          hasChanges = true;
          updateProduct(p.id, { showOnKds: localVal });
        }
      });

      if (hasChanges) {
        setIsSaving(true);
        // Simulate network delay
        setTimeout(() => {
          setIsSaving(false);
          toast.success("KDS Preferences Saved", { id: "kds-save" });
        }, 500);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [localToggles, products, updateProduct]);

  const handleToggle = useCallback((productId: string, val: boolean) => {
    setLocalToggles(prev => ({ ...prev, [productId]: val }));
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      categories.find(c => c.id === p.categoryId)?.name.toLowerCase().includes(q)
    );
  }, [products, categories, searchQuery]);

  const handleBulkToggle = useCallback((val: boolean) => {
    const newToggles: Record<string, boolean> = {};
    filteredProducts.forEach(p => {
      newToggles[p.id] = val;
    });
    setLocalToggles(prev => ({ ...prev, ...newToggles }));
  }, [filteredProducts]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Kitchen Display Settings</h1>
            {isSaving && (
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 animate-pulse">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Choose which products appear on the Kitchen Display System screens.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search products..."
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Bulk Actions Header */}
        <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
          <span className="text-sm font-medium text-slate-600">
            {filteredProducts.length} Products Found
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkToggle(true)} className="hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors">
              <MonitorCheck className="w-4 h-4 mr-2" /> Enable All
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkToggle(false)} className="hover:bg-slate-100 transition-colors">
              <MonitorOff className="w-4 h-4 mr-2" /> Disable All
            </Button>
          </div>
        </div>

        {/* Product Table */}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-1/2">Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Show on KDS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                  No products match your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId);
                const isEnabled = localToggles[product.id] ?? (product.showOnKds !== false);

                return (
                  <TableRow key={product.id} className="transition-colors hover:bg-slate-50/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isEnabled ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className={isEnabled ? "text-slate-900" : "text-slate-500"}>
                          {product.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {category ? (
                        <Badge variant="outline" className={`${category.color} bg-opacity-10 text-slate-700 border-none`}>
                          {category.name}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 text-sm">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(val) => handleToggle(product.id, val)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
