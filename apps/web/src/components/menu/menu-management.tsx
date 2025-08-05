"use client";

import { useState, useEffect } from "react";
import { usePollingData as useRealTimeData } from "@/hooks/usePollingData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Coffee, 
  Edit,
  Eye,
  EyeOff,
  DollarSign
} from "lucide-react";
import type { MenuItem, Category } from "@/types";
import { MenuItemDialog } from "./menu-item-dialog";
import { CategoryDialog } from "./category-dialog";

export function MenuManagement() {
  const { menuItems: allMenuItems, loading } = useRealTimeData();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items");

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
      
      const response = await fetch(`${API_BASE_URL}/api/menu/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleItemSaved = () => {
    setShowItemDialog(false);
    setSelectedItem(null);
  };

  const handleCategorySaved = () => {
    fetchCategories();
    setShowCategoryDialog(false);
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setShowItemDialog(true);
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      const token = localStorage.getItem("auth-token");
      const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
      
      await fetch(`${API_BASE_URL}/api/menu/items/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isAvailable: !item.isAvailable,
        }),
      });
      // Real-time update will handle the UI update
    } catch (error) {
      console.error("Error updating item availability:", error);
    }
  };

  const filteredMenuItems = allMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading menu data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2">
        <Button 
          variant={activeTab === "items" ? "default" : "outline"}
          onClick={() => setActiveTab("items")}
        >
          Menu Items
        </Button>
        <Button 
          variant={activeTab === "categories" ? "default" : "outline"}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </Button>
      </div>

      {/* Menu Items Tab */}
      {activeTab === "items" && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button onClick={() => setShowItemDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMenuItems.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Coffee className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No menu items found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || selectedCategory 
                        ? "No items match your search criteria." 
                        : "Get started by adding your first menu item."
                      }
                    </p>
                    <Button onClick={() => setShowItemDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Menu Item
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredMenuItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {item.description}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleItemAvailability(item)}
                        className={item.isAvailable ? "text-green-600" : "text-red-600"}
                      >
                        {item.isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary">
                        {item.category?.name}
                      </Badge>
                      <div className="flex items-center gap-1 font-medium text-lg">
                        <DollarSign className="h-4 w-4" />
                        {Number(item.price).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant={item.isAvailable ? "default" : "secondary"}>
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Menu Categories</h3>
              <p className="text-sm text-muted-foreground">
                Organize your menu items into categories
              </p>
            </div>
            <Button onClick={() => setShowCategoryDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Coffee className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No categories found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create categories to organize your menu items.
                    </p>
                    <Button onClick={() => setShowCategoryDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              categories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>
                      {category.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {category._count?.menuItems || 0} items
                      </Badge>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      <MenuItemDialog
        open={showItemDialog}
        onOpenChange={setShowItemDialog}
        item={selectedItem}
        categories={categories}
        onSaved={handleItemSaved}
      />

      <CategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onSaved={handleCategorySaved}
      />
    </div>
  );
}