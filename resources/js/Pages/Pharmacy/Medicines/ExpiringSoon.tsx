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
  Clock,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Medicine, MedicineCategory } from '@/types/medicine';

interface ExpiringSoonProps {
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

export default function ExpiringSoon({ medicines, categories }: ExpiringSoonProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique categories from medicines for the filter
  const categoryMap = useMemo(() => {
    const map: Record<number, MedicineCategory> = {};
    categories.forEach(cat => {
      map[cat.id] = cat;
    });
    return map;
  }, [categories]);

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return { label: 'Unknown', variant: 'secondary' as const };
    if (days <= 0) return { label: 'Expired', variant: 'destructive' as const };
    if (days <= 7) return { label: `${days} days`, variant: 'destructive' as const };
    if (days <= 30) return { label: `${days} days`, variant: 'default' as const };
    return { label: `${days} days`, variant: 'secondary' as const };
  };

  const getExpiryColor = (expiryDate: string | null) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days === null) return 'text-gray-600';
    if (days <= 0) return 'text-red-600';
    if (days <= 7) return 'text-red-600';
    if (days <= 30) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const formatExpiryDate = (expiryDate: string | null) => {
    if (!expiryDate) return 'N/A';
    return new Date(expiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate stats
  const expiredCount = medicines.data.filter(m => {
    const days = getDaysUntilExpiry(m.expiry_date);
    return days !== null && days <= 0;
  }).length;

  const criticalCount = medicines.data.filter(m => {
    const days = getDaysUntilExpiry(m.expiry_date);
    return days !== null && days > 0 && days <= 7;
  }).length;

  const warningCount = medicines.data.filter(m => {
    const days = getDaysUntilExpiry(m.expiry_date);
    return days !== null && days > 7 && days <= 30;
  }).length;

  return (
    <PharmacyLayout>
      <Head title="Expiring Soon Medicines - Pharmacy" />

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
              <Heading title="Expiring Soon Medicines" description="Medicines that are expiring within the next 30 days" />
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
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Already Expired</p>
                  <p className="text-2xl font-bold">{expiredCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Critical (7 days)</p>
                  <p className="text-2xl font-bold">{criticalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warning (30 days)</p>
                  <p className="text-2xl font-bold">{warningCount}</p>
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
              <p className="text-lg font-medium">No medicines expiring soon</p>
              <p className="text-muted-foreground">All medicines are within their valid expiration period</p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicines.data.map((medicine) => {
              const expiryStatus = getExpiryStatus(medicine.expiry_date);
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
                      <Badge variant={expiryStatus.variant}>{expiryStatus.label}</Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expiry Date</span>
                        <span className={cn('font-medium', getExpiryColor(medicine.expiry_date))}>
                          {formatExpiryDate(medicine.expiry_date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stock</span>
                        <span>{medicine.stock_quantity} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category</span>
                        <span>{categoryMap[medicine.category_id]?.name || 'N/A'}</span>
                      </div>
                      {medicine.batch_number && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Batch #</span>
                          <span>{medicine.batch_number}</span>
                        </div>
                      )}
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
                  const expiryStatus = getExpiryStatus(medicine.expiry_date);
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
                          <p className={cn('font-medium', getExpiryColor(medicine.expiry_date))}>
                            {formatExpiryDate(medicine.expiry_date)}
                          </p>
                          <Badge variant={expiryStatus.variant} className="text-xs">
                            {expiryStatus.label}
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
