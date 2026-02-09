import { Head, useForm, Link } from '@inertiajs/react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Heading from '@/components/heading';
import {
  ArrowLeft,
  Save,
  Pill,
  DollarSign,
  Package,
  Beaker,
  Building,
  Calendar,
  Barcode,
  AlertCircle,
  Tag,
  Boxes,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Medicine, MedicineCategory } from '@/types/pharmacy';

interface MedicineEditProps {
  medicine: Medicine;
  categories: MedicineCategory[];
}

// Dosage form options
const dosageForms = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'syrup', label: 'Syrup' },
  { value: 'injection', label: 'Injection' },
  { value: 'cream', label: 'Cream' },
  { value: 'ointment', label: 'Ointment' },
  { value: 'drops', label: 'Drops' },
  { value: 'inhaler', label: 'Inhaler' },
  { value: 'powder', label: 'Powder' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'gel', label: 'Gel' },
  { value: 'patch', label: 'Patch' },
];

export default function MedicineEdit({ medicine, categories }: MedicineEditProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: medicine.name,
    medicine_id: medicine.medicine_id,
    description: medicine.description || '',
    category_id: medicine.category_id.toString(),
    manufacturer: medicine.manufacturer || '',
    dosage_form: medicine.dosage_form || '',
    strength: medicine.strength || '',
    batch_number: medicine.batch_number || '',
    barcode: '', // Add barcode field if needed
    unit_price: medicine.unit_price,
    stock_quantity: medicine.stock_quantity,
    reorder_level: medicine.reorder_level,
    expiry_date: medicine.expiry_date ? new Date(medicine.expiry_date).toISOString().split('T')[0] : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/pharmacy/medicines/${medicine.id}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(name as keyof typeof data, 
      name === 'unit_price' ? parseFloat(value) || 0 : 
      name === 'stock_quantity' || name === 'reorder_level' ? parseInt(value) || 0 : 
      value
    );
  };

  const handleSelectChange = (name: string, value: string) => {
    setData(name as keyof typeof data, value);
  };

  const selectedCategory = categories.find(c => c.id.toString() === data.category_id);

  // Determine stock status
  const getStockStatus = (): import('@/components/pharmacy').StockStatus => {
    if (data.stock_quantity <= 0) return 'out-of-stock';
    if (data.stock_quantity <= data.reorder_level * 0.5) return 'critical';
    if (data.stock_quantity <= data.reorder_level) return 'low-stock';
    return 'in-stock';
  };

  // Determine expiry status
  const getExpiryStatus = (): import('@/components/pharmacy').ExpiryStatus => {
    if (!data.expiry_date) return 'valid';
    const expiry = new Date(data.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'valid';
  };

  const stockStatus = getStockStatus();
  const expiryStatus = getExpiryStatus();

  return (
    <PharmacyLayout>
      <Head title={`Edit Medicine - ${medicine.medicine_id}`} />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title={`Edit Medicine: ${medicine.name}`} />
            <p className="text-muted-foreground mt-1">
              Medicine ID: <span className="font-mono text-sm">{medicine.medicine_id}</span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <Link href={`/pharmacy/medicines/${medicine.id}`}>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </Link>
            <Link href="/pharmacy/medicines">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Medicines
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={cn(
            "border-l-4",
            stockStatus === 'in-stock' && "border-l-emerald-500",
            stockStatus === 'low-stock' && "border-l-amber-500",
            stockStatus === 'critical' && "border-l-orange-500",
            stockStatus === 'out-of-stock' && "border-l-red-500",
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    stockStatus === 'in-stock' && "text-emerald-600",
                    stockStatus === 'low-stock' && "text-amber-600",
                    stockStatus === 'critical' && "text-orange-600",
                    stockStatus === 'out-of-stock' && "text-red-600",
                  )}>
                    {data.stock_quantity}
                  </p>
                </div>
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  stockStatus === 'in-stock' && "bg-emerald-500/20",
                  stockStatus === 'low-stock' && "bg-amber-500/20",
                  stockStatus === 'critical' && "bg-orange-500/20",
                  stockStatus === 'out-of-stock' && "bg-red-500/20",
                )}>
                  <Package className={cn(
                    "h-5 w-5",
                    stockStatus === 'in-stock' && "text-emerald-600",
                    stockStatus === 'low-stock' && "text-amber-600",
                    stockStatus === 'critical' && "text-orange-600",
                    stockStatus === 'out-of-stock' && "text-red-600",
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-l-4",
            expiryStatus === 'valid' && "border-l-emerald-500",
            expiryStatus === 'expiring-soon' && "border-l-amber-500",
            expiryStatus === 'expired' && "border-l-red-500",
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Status</p>
                  <p className={cn(
                    "text-lg font-bold capitalize",
                    expiryStatus === 'valid' && "text-emerald-600",
                    expiryStatus === 'expiring-soon' && "text-amber-600",
                    expiryStatus === 'expired' && "text-red-600",
                  )}>
                    {expiryStatus.replace('-', ' ')}
                  </p>
                </div>
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  expiryStatus === 'valid' && "bg-emerald-500/20",
                  expiryStatus === 'expiring-soon' && "bg-amber-500/20",
                  expiryStatus === 'expired' && "bg-red-500/20",
                )}>
                  <Calendar className={cn(
                    "h-5 w-5",
                    expiryStatus === 'valid' && "text-emerald-600",
                    expiryStatus === 'expiring-soon' && "text-amber-600",
                    expiryStatus === 'expired' && "text-red-600",
                  )} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unit Price</p>
                  <p className="text-2xl font-bold text-primary">
                    ${data.unit_price.toFixed(2)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="text-lg font-bold">
                    {selectedCategory?.name || 'Uncategorized'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Pill className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Medicine name, code, and categorization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Medicine Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Medicine Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Pill className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      value={data.name}
                      onChange={handleChange}
                      placeholder="e.g., Paracetamol"
                      className={cn("pl-9", errors.name && "border-destructive")}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>
                
                {/* Medicine Code */}
                <div className="space-y-2">
                  <Label htmlFor="medicine_id">
                    Medicine Code <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="medicine_id"
                      name="medicine_id"
                      value={data.medicine_id}
                      onChange={handleChange}
                      placeholder="e.g., MED-001PAR-ABCD"
                      className={cn("pl-9", errors.medicine_id && "border-destructive")}
                    />
                  </div>
                  {errors.medicine_id && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.medicine_id}
                    </p>
                  )}
                </div>
                
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category_id">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={data.category_id} 
                    onValueChange={(value) => handleSelectChange('category_id', value)}
                  >
                    <SelectTrigger className={cn(errors.category_id && "border-destructive")}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.category_id}
                    </p>
                  )}
                </div>
                
                {/* Dosage Form */}
                <div className="space-y-2">
                  <Label htmlFor="dosage_form">Dosage Form</Label>
                  <Select 
                    value={data.dosage_form} 
                    onValueChange={(value) => handleSelectChange('dosage_form', value)}
                  >
                    <SelectTrigger className={cn(errors.dosage_form && "border-destructive")}>
                      <SelectValue placeholder="Select dosage form" />
                    </SelectTrigger>
                    <SelectContent>
                      {dosageForms.map((form) => (
                        <SelectItem key={form.value} value={form.value}>
                          <div className="flex items-center gap-2">
                            <Beaker className="h-4 w-4 text-muted-foreground" />
                            <span>{form.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.dosage_form && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.dosage_form}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={data.description}
                  onChange={handleChange}
                  placeholder="Enter a detailed description of the medicine..."
                  rows={3}
                  className={cn(errors.description && "border-destructive")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manufacturer & Batch Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Manufacturer & Batch</CardTitle>
                  <CardDescription>Manufacturer details and batch information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Manufacturer */}
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">
                    Manufacturer <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="manufacturer"
                      name="manufacturer"
                      value={data.manufacturer}
                      onChange={handleChange}
                      placeholder="e.g., Pfizer, GSK"
                      className={cn("pl-9", errors.manufacturer && "border-destructive")}
                    />
                  </div>
                  {errors.manufacturer && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.manufacturer}
                    </p>
                  )}
                </div>
                
                {/* Strength */}
                <div className="space-y-2">
                  <Label htmlFor="strength">Strength</Label>
                  <div className="relative">
                    <Beaker className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="strength"
                      name="strength"
                      value={data.strength}
                      onChange={handleChange}
                      placeholder="e.g., 500mg, 10ml"
                      className={cn("pl-9", errors.strength && "border-destructive")}
                    />
                  </div>
                  {errors.strength && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.strength}
                    </p>
                  )}
                </div>
                
                {/* Batch Number */}
                <div className="space-y-2">
                  <Label htmlFor="batch_number">
                    Batch Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Boxes className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="batch_number"
                      name="batch_number"
                      value={data.batch_number}
                      onChange={handleChange}
                      placeholder="e.g., BATCH-2024-001"
                      className={cn("pl-9", errors.batch_number && "border-destructive")}
                    />
                  </div>
                  {errors.batch_number && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.batch_number}
                    </p>
                  )}
                </div>
                
                {/* Expiry Date */}
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">
                    Expiry Date <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="expiry_date"
                      name="expiry_date"
                      type="date"
                      value={data.expiry_date}
                      onChange={handleChange}
                      className={cn("pl-9", errors.expiry_date && "border-destructive")}
                    />
                  </div>
                  {errors.expiry_date && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.expiry_date}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Stock Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle>Pricing & Stock</CardTitle>
                  <CardDescription>Price and inventory management</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Unit Price */}
                <div className="space-y-2">
                  <Label htmlFor="unit_price">
                    Unit Price <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="unit_price"
                      name="unit_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={data.unit_price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={cn("pl-9", errors.unit_price && "border-destructive")}
                    />
                  </div>
                  {errors.unit_price && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.unit_price}
                    </p>
                  )}
                </div>
                
                {/* Stock Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">
                    Stock Quantity <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="stock_quantity"
                      name="stock_quantity"
                      type="number"
                      min="0"
                      value={data.stock_quantity}
                      onChange={handleChange}
                      placeholder="0"
                      className={cn("pl-9", errors.stock_quantity && "border-destructive")}
                    />
                  </div>
                  {errors.stock_quantity && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.stock_quantity}
                    </p>
                  )}
                </div>
                
                {/* Reorder Level */}
                <div className="space-y-2">
                  <Label htmlFor="reorder_level">
                    Reorder Level <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <AlertCircle className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reorder_level"
                      name="reorder_level"
                      type="number"
                      min="0"
                      value={data.reorder_level}
                      onChange={handleChange}
                      placeholder="10"
                      className={cn("pl-9", errors.reorder_level && "border-destructive")}
                    />
                  </div>
                  {errors.reorder_level && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.reorder_level}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Alert will be triggered when stock falls below this level
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Link href="/pharmacy/medicines">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={processing}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {processing ? 'Saving...' : 'Update Medicine'}
            </Button>
          </div>
        </form>
      </div>
    </PharmacyLayout>
  );
}
