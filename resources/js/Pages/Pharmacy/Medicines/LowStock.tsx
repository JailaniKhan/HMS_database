import { Head, Link, router } from '@inertiajs/react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import {
  Plus,
  Pill,
  Package,
  AlertTriangle,
  AlertCircle,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Medicine, MedicineCategory } from '@/types/medicine';

interface LowStockProps {
  medicines: {
    data: Medicine[];
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
  categories: MedicineCategory[];
}

export default function LowStock({ medicines, categories }: LowStockProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique categories from medicines for the filter
  const categoryMap = useMemo(() => {
    const map: Record<number, MedicineCategory> = {};
    categories.forEach(cat => {
      map[cat.id] = cat;
    });
    return map;
  }, [categories]);

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.stock_quantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    }
    if (medicine.stock_quantity <= 5) {
      return { label: 'Critical', variant: 'destructive' as const };
    }
    return { label: 'Low Stock', variant: 'secondary' as const };
  };

  const getStockColor = (quantity: number) => {
    if (quantity === 0) return 'text-red-600';
    if (quantity <= 5) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <PharmacyLayout>
      <Head title="Low Stock Medicines - Pharmacy" />

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pharmacy/medicines">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <Heading title="Low Stock Medicines" description="Medicines that need to be reordered" />
            </div>
          </div>
          <Link href="/pharmacy/medicines/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Medicine
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Low Stock</p>
                  <p className="text-2xl font-bold">{medicines.meta.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Critical Stock</p>
                  <p className="text-2xl font-bold">
                    {medicines.data.filter(m => m.stock_quantity <= 5).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold">
                    {medicines.data.filter(m => m.stock_quantity === 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Medicines List */}
        {medicines.data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No low stock medicines</p>
              <p className="text-muted-foreground">All medicines are adequately stocked</p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicines.data.map((medicine) => {
              const stockStatus = getStockStatus(medicine);
              return (
                <Card key={medicine.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Pill className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{medicine.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {medicine.description || medicine.name}
                          </p>
                        </div>
                      </div>
                      <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Stock</span>
                        <span className={cn('font-medium', getStockColor(medicine.stock_quantity))}>
                          {medicine.stock_quantity} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reorder Level</span>
                        <span>{medicine.reorder_level || 10} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category</span>
                        <span>{categoryMap[medicine.category_id]?.name || 'N/A'}</span>
                      </div>
                    </div>

                    <Link href={`/pharmacy/medicines/${medicine.id}`}>
                      <Button variant="outline" className="w-full mt-4">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {medicines.data.map((medicine) => {
                  const stockStatus = getStockStatus(medicine);
                  return (
                    <div
                      key={medicine.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <Pill className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{medicine.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {categoryMap[medicine.category_id]?.name || 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={cn('font-medium', getStockColor(medicine.stock_quantity))}>
                            {medicine.stock_quantity} units
                          </p>
                          <Badge variant={stockStatus.variant} className="text-xs">
                            {stockStatus.label}
                          </Badge>
                        </div>
                        <Link href={`/pharmacy/medicines/${medicine.id}`}>
                          <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {medicines.meta.links && medicines.meta.links.length > 3 && (
          <div className="flex items-center justify-center gap-2">
            {medicines.meta.links.map((link, index) => (
              <Link
                key={index}
                href={link.url || '#'}
                onClick={(e) => {
                  if (!link.url) {
                    e.preventDefault();
                    return;
                  }
                  e.preventDefault();
                  router.get(link.url);
                }}
              >
                <Button
                  variant={link.active ? 'default' : 'outline'}
                  size="icon"
                  disabled={!link.url}
                  className="w-10 h-10"
                >
                  {link.label.includes('Previous') ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : link.label.includes('Next') ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    link.label
                  )}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PharmacyLayout>
  );
}
