import { Head, Link, router } from '@inertiajs/react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MedicineCard } from '@/components/pharmacy';
import { FilterBar, type FilterConfig, type FilterState } from '@/components/pharmacy/FilterBar';
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
  Search,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Medicine, MedicineCategory } from '@/types/pharmacy';

interface MedicineIndexProps {
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
  query?: string;
  category_id?: string;
  stock_status?: string;
  expiry_status?: string;
}

export default function MedicineIndex({ 
  medicines, 
  categories,
  query = '', 
  category_id = '',
  stock_status = '',
  expiry_status = ''
}: MedicineIndexProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    query,
    category_id,
    stock_status,
    expiry_status,
  });

  // Category options for filter
  const categoryOptions = useMemo(() => 
    categories.map(cat => ({
      label: cat.name,
      value: cat.id.toString(),
    })),
    [categories]
  );

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      id: 'category_id',
      label: 'Category',
      type: 'select',
      options: categoryOptions,
    },
    {
      id: 'stock_status',
      label: 'Stock Status',
      type: 'stock-status',
    },
    {
      id: 'expiry_status',
      label: 'Expiry Status',
      type: 'expiry-status',
    },
  ], [categoryOptions]);

  // Statistics
  const stats = useMemo(() => {
    const total = medicines.meta?.total || 0;
    const inStock = medicines.data?.filter(m => m.stock_quantity > m.reorder_level).length || 0;
    const lowStock = medicines.data?.filter(m => m.stock_quantity > 0 && m.stock_quantity <= m.reorder_level).length || 0;
    const outOfStock = medicines.data?.filter(m => m.stock_quantity <= 0).length || 0;
    return { total, inStock, lowStock, outOfStock };
  }, [medicines]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    router.get('/pharmacy/medicines', newFilters, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleReset = () => {
    setFilters({});
    router.get('/pharmacy/medicines', {}, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Determine stock status
  const getStockStatus = (medicine: Medicine): import('@/components/pharmacy').StockStatus => {
    if (medicine.stock_quantity <= 0) return 'out-of-stock';
    if (medicine.stock_quantity <= medicine.reorder_level * 0.5) return 'critical';
    if (medicine.stock_quantity <= medicine.reorder_level) return 'low-stock';
    return 'in-stock';
  };

  // Determine expiry status
  const getExpiryStatus = (medicine: Medicine): import('@/components/pharmacy').ExpiryStatus => {
    if (!medicine.expiry_date) return 'valid';
    const expiry = new Date(medicine.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'valid';
  };

  return (
    <PharmacyLayout>
      <Head title="Medicines" />
      
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Medicine Management" />
            <p className="text-muted-foreground mt-1">
              Manage medicines, inventory, and stock levels
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/pharmacy/medicines/create">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add New Medicine
              </Button>
            </Link>
            <Link href="/pharmacy/categories">
              <Button variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Categories
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Medicines</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filterConfigs}
          value={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
          searchPlaceholder="Search medicines by name, manufacturer, or batch..."
          showFilterChips={true}
        />

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {medicines.data?.length || 0} of {medicines.meta?.total || 0} medicines
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Medicines Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicines.data.map((medicine) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onView={() => router.visit(`/pharmacy/medicines/${medicine.id}`)}
                onEdit={() => router.visit(`/pharmacy/medicines/${medicine.id}/edit`)}
                onDuplicate={() => {
                  // Handle duplicate action - could navigate to create with pre-filled data
                  router.get('/pharmacy/medicines/create', { duplicate: medicine.id });
                }}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {medicines.data.map((medicine) => {
                  const stockStatus = getStockStatus(medicine);
                  const expiryStatus = getExpiryStatus(medicine);
                  
                  return (
                    <div
                      key={medicine.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Pill className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{medicine.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{medicine.medicine_id}</span>
                            <span>•</span>
                            <span>{medicine.category?.name || 'Uncategorized'}</span>
                            <span>•</span>
                            <span>{formatCurrency(medicine.unit_price)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            stockStatus === 'in-stock' ? 'default' : 
                            stockStatus === 'out-of-stock' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {medicine.stock_quantity} in stock
                        </Badge>
                        {medicine.expiry_date && (
                          <Badge 
                            variant={
                              expiryStatus === 'expired' ? 'destructive' : 
                              expiryStatus === 'expiring-soon' ? 'secondary' : 
                              'outline'
                            }
                          >
                            {formatDate(medicine.expiry_date)}
                          </Badge>
                        )}
                        <Link href={`/pharmacy/medicines/${medicine.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/pharmacy/medicines/${medicine.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
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

        {/* Empty State */}
        {(medicines.data?.length || 0) === 0 && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No medicines found</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                {filters.query || filters.category_id || filters.stock_status || filters.expiry_status
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by adding your first medicine.'}
              </p>
              {(filters.query || filters.category_id || filters.stock_status || filters.expiry_status) && (
                <Button variant="outline" onClick={handleReset}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {(medicines.meta?.last_page || 0) > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {medicines.meta?.from || 0} to {medicines.meta?.to || 0} of {medicines.meta?.total || 0} results
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={medicines.links.prev || '#'}
                className={cn(
                  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                  'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                  !medicines.links.prev && 'pointer-events-none opacity-50'
                )}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Link>
              <div className="flex items-center gap-1">
                {medicines.meta.links
                  .filter(link => !link.label.includes('Previous') && !link.label.includes('Next'))
                  .map((link, index) => (
                    <Link
                      key={index}
                      href={link.url || '#'}
                      className={cn(
                        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 w-9',
                        link.active
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                        !link.url && 'pointer-events-none opacity-50'
                      )}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
              </div>
              <Link
                href={medicines.links.next || '#'}
                className={cn(
                  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                  'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                  !medicines.links.next && 'pointer-events-none opacity-50'
                )}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </PharmacyLayout>
  );
}
