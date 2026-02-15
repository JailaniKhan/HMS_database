import { Head, useForm, Link } from '@inertiajs/react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Heading from '@/components/heading';
import {
  ArrowLeft,
  Save,
  Pill,
  Currency,
  Package,
  Beaker,
  Building,
  Calendar,
  Barcode,
  AlertCircle,
  RefreshCw,
  Tag,
  Boxes,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { MedicineCategory } from '@/types/pharmacy';

interface MedicineCreateProps {
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

// Generate medicine code based on category and name
const generateMedicineCode = (categoryId: string, name: string): string => {
  const prefix = 'MED';
  const catPart = categoryId ? categoryId.padStart(2, '0') : '00';
  const namePart = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 3);
  const timestamp = Date.now().toString(36).substring(0, 4).toUpperCase();
  return `${prefix}-${catPart}${namePart}-${timestamp}`;
};

export default function MedicineCreate({ categories }: MedicineCreateProps) {
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    medicine_id: '',
    description: '',
    category_id: '',
    manufacturer: '',
    dosage_form: '',
    strength: '',
    batch_number: '',
    barcode: '',
    cost_price: 0,
    sale_price: 0,
    stock_quantity: 0,
    reorder_level: 10,
    expiry_date: '',
  });

  // Auto-generate code when name or category changes
  useEffect(() => {
    if (autoGenerateCode && data.name && data.category_id) {
      const newCode = generateMedicineCode(data.category_id, data.name);
      setData('medicine_id', newCode);
    }
  }, [data.name, data.category_id, autoGenerateCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/pharmacy/medicines');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(name as keyof typeof data, 
      name === 'cost_price' || name === 'sale_price' ? parseFloat(value) || 0 : 
      name === 'stock_quantity' || name === 'reorder_level' ? parseInt(value) || 0 : 
      value
    );
  };

  const handleSelectChange = (name: string, value: string) => {
    setData(name as keyof typeof data, value);
  };

  const regenerateCode = () => {
    if (data.category_id && data.name) {
      const newCode = generateMedicineCode(data.category_id, data.name);
      setData('medicine_id', newCode);
    }
  };

  const selectedCategory = categories.find(c => c.id.toString() === data.category_id);

  return (
    <PharmacyLayout>
      <Head title="Add New Medicine" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Add New Medicine" />
            <p className="text-muted-foreground mt-1">
              Create a new medicine with complete inventory details
            </p>
          </div>
          
          <Link href="/pharmacy/medicines">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Medicines
            </Button>
          </Link>
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="medicine_id">
                      Medicine Code <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={autoGenerateCode}
                        onCheckedChange={setAutoGenerateCode}
                        id="auto-code"
                      />
                      <Label htmlFor="auto-code" className="text-xs text-muted-foreground cursor-pointer">
                        Auto-generate
                      </Label>
                    </div>
                  </div>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="medicine_id"
                      name="medicine_id"
                      value={data.medicine_id}
                      onChange={handleChange}
                      placeholder="e.g., MED-001PAR-ABCD"
                      readOnly={autoGenerateCode}
                      className={cn(
                        "pl-9 pr-10",
                        autoGenerateCode && "bg-muted/50",
                        errors.medicine_id && "border-destructive"
                      )}
                    />
                    {autoGenerateCode && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0"
                        onClick={regenerateCode}
                        title="Regenerate code"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
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
                  {selectedCategory && (
                    <p className="text-xs text-muted-foreground">
                      {selectedCategory.description || 'No description available'}
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
                
                {/* Barcode */}
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode (Optional)</Label>
                  <div className="relative">
                    <Barcode className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="barcode"
                      name="barcode"
                      value={data.barcode}
                      onChange={handleChange}
                      placeholder="e.g., 123456789012"
                      className={cn("pl-9", errors.barcode && "border-destructive")}
                    />
                  </div>
                  {errors.barcode && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.barcode}
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
                  <Currency className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle>Pricing & Stock</CardTitle>
                  <CardDescription>Cost, sale price, and inventory details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cost Price */}
                <div className="space-y-2">
                  <Label htmlFor="cost_price">
                    Cost Price <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Currency className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cost_price"
                      name="cost_price"
                      type="number"
                      step="1"
                      value={data.cost_price}
                      onChange={handleChange}
                      placeholder="0"
                      className={cn("pl-9", errors.cost_price && "border-destructive")}
                    />
                  </div>
                  {errors.cost_price && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.cost_price}
                    </p>
                  )}
                </div>
                
                {/* Sale Price */}
                <div className="space-y-2">
                  <Label htmlFor="sale_price">
                    Sale Price <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Currency className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="sale_price"
                      name="sale_price"
                      type="number"
                      step="1"
                      min="0"
                      value={data.sale_price}
                      onChange={handleChange}
                      placeholder=""
                      className={cn("pl-9", errors.sale_price && "border-destructive")}
                    />
                  </div>
                  {errors.sale_price && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.sale_price}
                    </p>
                  )}
                  {data.sale_price > 0 && data.cost_price > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Profit margin: {((data.sale_price - data.cost_price) / data.cost_price * 100).toFixed(1)}%
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
                      value={data.stock_quantity}
                      onChange={handleChange}
                      placeholder=""
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
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={processing}
            >
              Reset Form
            </Button>
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
              {processing ? 'Saving...' : 'Create Medicine'}
            </Button>
          </div>
        </form>
      </div>
    </PharmacyLayout>
  );
}
