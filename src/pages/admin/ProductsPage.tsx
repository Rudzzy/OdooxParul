import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

import { useProductStore } from "../../store/productStore";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
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
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";

export default function ProductsPage() {
  const { products, categories, deleteProduct, fetchCategories, fetchProducts } = useProductStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || product.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your catalog of items and categories.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/products/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto justify-start bg-transparent p-0 space-x-2">
          <TabsTrigger 
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border rounded-full px-4 py-2"
          >
            All
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border rounded-full px-4 py-2"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {product.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {category && (
                        <Badge variant="outline" className={`${category.color} text-white border-transparent`}>
                          {category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={product.isVeg ? "border-green-500 text-green-600 bg-green-50" : "border-red-500 text-red-600 bg-red-50"}
                      >
                        {product.isVeg ? "Veg" : "Non-Veg"}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={product.status === "available" ? "default" : "secondary"}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/products/${product.id}/edit`}>
                            <Pencil className="w-4 h-4" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the product "{product.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteProduct(product.id)}
                                className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
