import { Head, Link, router } from '@inertiajs/react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockBadge, ExpiryBadge, PriceDisplay } from '@/components/pharmacy';
import Heading from '@/components/heading';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Pill,
  Package,
  Beaker,
  Building,
  Calendar,
  Tag,
  Boxes,
  TrendingUp,
  ShoppingCart,
  History,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Medicine, MedicineCategory, SalesItem, StockMovement } from '@/types/pharmacy';

interface MedicineShowProps {
  medicine: Medicine & {
    category?: MedicineCategory;
  };
  recentSales: SalesItem[];
  stockHistory: StockMovement[];
}

export default function MedicineShow({ medicine, recentSales, stockHistory }: MedicineShowProps) {
  // Determine stock status
  const getStockStatus = (): import('@/components/pharmacy').StockStatus => {
    if (medicine.stock_quantity <= 0) return 'out-of-stock';
    if (medicine.stock_quantity <= medicine.reorder_level * 0.5) return 'critical';
    if (medicine.stock_quantity <= medicine.reorder_level) return 'low-stock';
    return 'in-stock';
  };

  // Determine expiry status
  const getExpiryStatus = (): import('@/components/pharmacy').ExpiryStatus => {
    if (!medicine.expiry_date) return 'valid';
    const expiry = new Date(medicine.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'valid';
  };

  const getDaysUntilExpiry = (): number | undefined => {
    if (!medicine.expiry_date) return undefined;
    const expiry = new Date(medicine.expiry_date);
    const today = new Date();
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const stockStatus = getStockStatus();
  const expiryStatus = getExpiryStatus();
  const daysUntilExpiry = getDaysUntilExpiry();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) {
      router.delete(`/pharmacy/medicines/${medicine.id}`);
    }
  };

  // Calculate total sales
  const totalSalesQuantity = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalSalesRevenue = recentSales.reduce((sum, sale) => sum + sale.total_price, 0);

  return (
    <PharmacyLayout>
      <Head title={`${medicine.name} - Medicine Details`} />
      
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
              <Heading title={medicine.name} />
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground font-mono">{medicine.medicine_id}</span>
                <span className="text-muted-foreground">•</span>
                <Badge variant="outline" className="text-xs">
                  {medicine.category?.name || 'Uncategorized'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/pharmacy/medicines/${medicine.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Medicine
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        {(stockStatus === 'out-of-stock' || stockStatus === 'critical' || expiryStatus === 'expired') && (
          <div className={cn(
            "p-4 rounded-lg border flex items-center gap-3",
            stockStatus === 'out-of-stock' || expiryStatus === 'expired'
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-orange-50 border-orange-200 text-orange-800"
          )}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">
                {stockStatus === 'out-of-stock' && 'This medicine is currently out of stock'}
                {stockStatus === 'critical' && 'This medicine has critically low stock'}
                {expiryStatus === 'expired' && 'This medicine has expired'}
              </p>
              <p className="text-sm opacity-90">
                {stockStatus === 'out-of-stock' && 'Please restock immediately to avoid shortages'}
                {stockStatus === 'critical' && `Only ${medicine.stock_quantity} units remaining. Reorder level: ${medicine.reorder_level}`}
                {expiryStatus === 'expired' && 'This medicine should not be dispensed'}
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className="text-2xl font-bold">{medicine.stock_quantity}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-2">
                <StockBadge status={stockStatus} size="sm" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unit Price</p>
                  <p className="text-2xl font-bold">
                    <PriceDisplay amount={medicine.unit_price} size="lg" />
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales (30 days)</p>
                  <p className="text-2xl font-bold">{totalSalesQuantity}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Revenue: <PriceDisplay amount={totalSalesRevenue} size="sm" />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <p className="text-lg font-bold">
                    {medicine.expiry_date ? formatDate(medicine.expiry_date) : 'N/A'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              {medicine.expiry_date && (
                <div className="mt-2">
                  <ExpiryBadge 
                    status={expiryStatus} 
                    expiryDate={medicine.expiry_date}
                    daysUntilExpiry={daysUntilExpiry}
                    size="sm" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="sales">Recent Sales</TabsTrigger>
            <TabsTrigger value="stock">Stock History</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Pill className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>Medicine identification details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Medicine Name</p>
                      <p className="font-medium">{medicine.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Medicine Code</p>
                      <p className="font-medium font-mono">{medicine.medicine_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{medicine.category?.name || 'Uncategorized'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dosage Form</p>
                      <div className="flex items-center gap-2">
                        <Beaker className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium capitalize">{medicine.dosage_form || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Strength</p>
                      <p className="font-medium">{medicine.strength || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Batch Number</p>
                      <div className="flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{medicine.batch_number || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {medicine.description && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{medicine.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manufacturer & Pricing */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Building className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Manufacturer & Pricing</CardTitle>
                      <CardDescription>Supplier and pricing information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Manufacturer</p>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{medicine.manufacturer || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expiry Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {medicine.expiry_date ? formatDate(medicine.expiry_date) : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unit Price</p>
                      <p className="font-medium text-lg">
                        <PriceDisplay amount={medicine.unit_price} size="lg" variant="total" />
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reorder Level</p>
                      <p className="font-medium">{medicine.reorder_level} units</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Stock Value</p>
                        <p className="text-xl font-bold">
                          <PriceDisplay 
                            amount={medicine.stock_quantity * medicine.unit_price} 
                            size="xl" 
                            variant="total"
                          />
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Inventory Status</p>
                        <StockBadge status={stockStatus} size="md" quantity={medicine.stock_quantity} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Sales Tab */}
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Recent Sales</CardTitle>
                      <CardDescription>Last 30 days sales history</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold">
                      <PriceDisplay amount={totalSalesRevenue} size="lg" variant="total" />
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recentSales.length > 0 ? (
                  <div className="divide-y">
                    {recentSales.map((sale, index) => (
                      <div key={index} className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Sale #{sale.sale_id}</p>
                            <p className="text-sm text-muted-foreground">
                              {sale.created_at ? formatDateTime(sale.created_at) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{sale.quantity} units</p>
                          <p className="text-sm text-muted-foreground">
                            <PriceDisplay amount={sale.total_price} size="sm" />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No recent sales</h3>
                    <p className="text-muted-foreground">This medicine hasn't been sold in the last 30 days</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock History Tab */}
          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <History className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle>Stock History</CardTitle>
                    <CardDescription>Stock movements and adjustments</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {stockHistory.length > 0 ? (
                  <div className="divide-y">
                    {stockHistory.map((movement, index) => (
                      <div key={index} className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center",
                            movement.type === 'in' && "bg-green-500/10",
                            movement.type === 'out' && "bg-red-500/10",
                            movement.type === 'adjustment' && "bg-amber-500/10"
                          )}>
                            <History className={cn(
                              "h-5 w-5",
                              movement.type === 'in' && "text-green-600",
                              movement.type === 'out' && "text-red-600",
                              movement.type === 'adjustment' && "text-amber-600"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium capitalize">
                              {movement.type.replace('_', ' ')}
                              {movement.reference_type && ` • ${movement.reference_type}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(movement.created_at)}
                            </p>
                            {movement.notes && (
                              <p className="text-sm text-muted-foreground">{movement.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-medium",
                            movement.type === 'in' && "text-green-600",
                            movement.type === 'out' && "text-red-600",
                            movement.type === 'adjustment' && "text-amber-600"
                          )}>
                            {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}
                            {movement.quantity}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {movement.previous_stock} → {movement.new_stock}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No stock history</h3>
                    <p className="text-muted-foreground">No stock movements recorded for this medicine</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PharmacyLayout>
  );
}
