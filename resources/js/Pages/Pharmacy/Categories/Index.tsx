import { Head, Link, router } from '@inertiajs/react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import {
  Plus,
  Tag,
  FolderOpen,
  Edit,
  Trash2,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { MedicineCategory } from '@/types/pharmacy';

interface CategoryIndexProps {
  categories: {
    data: (MedicineCategory & { medicines_count: number })[];
    links: {
      first: string;
      last: string;
      prev: string | null;
      next: string | null;
    };
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      links: {
        url: string | null;
        label: string;
        active: boolean;
      }[];
      path: string;
      per_page: number;
      to: number;
      total: number;
    };
  };
}

export default function CategoryIndex({ categories }: CategoryIndexProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = categories.data.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sanitize user input to prevent XSS
  const sanitizeForDisplay = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const handleDelete = (categoryId: number, categoryName: string, medicineCount: number) => {
    // Security: Sanitize categoryName before displaying in UI
    const sanitizedName = sanitizeForDisplay(categoryName);
    
    if (medicineCount > 0) {
      // Use a modal or toast notification instead of alert for production
      // For now, sanitize the input to prevent XSS
      alert(`Cannot delete the selected category because it contains ${medicineCount} medicine(s). Please reassign or delete these medicines first.`);
      return;
    }
    
    if (confirm(`Are you sure you want to delete this category? This action cannot be undone.`)) {
      router.delete(`/pharmacy/categories/${categoryId}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <PharmacyLayout>
      <Head title="Medicine Categories" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/pharmacy/medicines">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <Heading title="Medicine Categories" />
              <p className="text-muted-foreground mt-1">
                Manage medicine categories and classifications
              </p>
            </div>
          </div>
          
          <Link href="/pharmacy/categories/create">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Categories</p>
                  <p className="text-2xl font-bold">{categories.meta?.total || 0}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Medicines</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {categories.data.reduce((sum, cat) => sum + cat.medicines_count, 0)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Medicines/Category</p>
                  <p className="text-2xl font-bold text-green-600">
                    {categories.meta?.total 
                      ? Math.round(categories.data.reduce((sum, cat) => sum + cat.medicines_count, 0) / categories.meta.total)
                      : 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Categories List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Medicines</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          #{category.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Tag className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
                            {category.description || 'No description'}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={category.medicines_count > 0 ? 'default' : 'secondary'}
                            className={cn(
                              category.medicines_count > 0 && "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                            )}
                          >
                            {category.medicines_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(category.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/pharmacy/categories/${category.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleDelete(category.id, category.name, category.medicines_count)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {searchTerm ? 'No categories found matching your search' : 'No categories found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {(categories.meta?.last_page || 0) > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing <strong>{categories.meta?.from || 0}</strong> to <strong>{categories.meta?.to || 0}</strong> of{' '}
                  <strong>{categories.meta?.total || 0}</strong> categories
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!categories.links.prev}
                    onClick={() => categories.links.prev && router.visit(categories.links.prev)}
                  >
                    Previous
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!categories.links.next}
                    onClick={() => categories.links.next && router.visit(categories.links.next)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Empty State */}
        {categories.data.length === 0 && !searchTerm && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No categories found</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                Get started by creating your first medicine category
              </p>
              <Link href="/pharmacy/categories/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </PharmacyLayout>
  );
}
