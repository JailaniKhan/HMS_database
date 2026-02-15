/**
 * AddItemDialog Component
 * 
 * Reusable modal dialog for adding bill items including services, medicines, and other billable items.
 * Features item type tabs, search functionality, quantity/price inputs, and auto-calculation.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { BillItemFormData, ItemType } from '@/types/billing';
import type { DepartmentService } from '@/types/department';
import type { Medicine } from '@/types/medicine';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay } from './CurrencyDisplay';
import { SearchInput } from '@/components/ui/search-simple';

// ============================================================================
// Types
// ============================================================================

export interface SelectableItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  code?: string;
  in_stock?: boolean;
  quantity?: number;
}

export interface AddItemDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when item is added to bill */
  onAddItem: (item: BillItemFormData) => void;
  /** Available services for selection */
  services?: DepartmentService[];
  /** Available medicines for selection */
  medicines?: Medicine[];
  /** Currency code for display */
  currency?: string;
  /** Maximum discount percentage allowed */
  maxDiscountPercent?: number;
  /** Whether to show other items tab */
  showOtherTab?: boolean;
  /** Custom title for the dialog */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

interface AddItemFormState {
  selectedTab: 'services' | 'medicines' | 'other';
  searchQuery: string;
  selectedItem: SelectableItem | null;
  quantity: number;
  unitPrice: number;
  discountType: 'percentage' | 'amount';
  discountValue: number;
  customDescription: string;
  customCategory: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CURRENCY = 'AFN';
const DEFAULT_MAX_DISCOUNT = 100;
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 999;
const MIN_PRICE = 0;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate discount amount for display
 */
function calculateDiscountAmount(
  quantity: number,
  unitPrice: number,
  discountValue: number,
  discountType: 'percentage' | 'amount'
): number {
  const subtotal = quantity * unitPrice;
  
  if (discountType === 'percentage') {
    return subtotal * (discountValue / 100);
  } else {
    return discountValue;
  }
}

// ============================================================================
// AddItemDialog Component
// ============================================================================

export function AddItemDialog({
  open,
  onOpenChange,
  onAddItem,
  services = [],
  medicines = [],
  currency = DEFAULT_CURRENCY,
  maxDiscountPercent = DEFAULT_MAX_DISCOUNT,
  showOtherTab = true,
  title = 'Add Bill Item',
  className,
}: AddItemDialogProps) {
  // Form state
  const [formState, setFormState] = React.useState<AddItemFormState>({
    selectedTab: 'services',
    searchQuery: '',
    selectedItem: null,
    quantity: 1,
    unitPrice: 0,
    discountType: 'percentage',
    discountValue: 0,
    customDescription: '',
    customCategory: '',
  });

  // Validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setFormState({
        selectedTab: 'services',
        searchQuery: '',
        selectedItem: null,
        quantity: 1,
        unitPrice: 0,
        discountType: 'percentage',
        discountValue: 0,
        customDescription: '',
        customCategory: '',
      });
      setErrors({});
    }
  }, [open]);

  // Update unit price when selected item changes
  React.useEffect(() => {
    if (formState.selectedItem) {
      setFormState((prev) => ({
        ...prev,
        unitPrice: prev.selectedItem?.price ?? prev.unitPrice,
      }));
    }
  }, [formState.selectedItem]);

  /**
   * Handle tab change
   */
  function handleTabChange(value: string) {
    setFormState((prev) => ({
      ...prev,
      selectedTab: value as AddItemFormState['selectedTab'],
      selectedItem: null,
      searchQuery: '',
      unitPrice: 0,
    }));
  }

  /**
   * Handle item selection
   */
  function handleItemSelect(item: SelectableItem) {
    setFormState((prev) => ({
      ...prev,
      selectedItem: item,
      unitPrice: item.price,
      searchQuery: item.name,
    }));
    clearError('item');
  }

  /**
   * Handle quantity change
   */
  function handleQuantityChange(value: string) {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity) || quantity < MIN_QUANTITY) {
      setFormState((prev) => ({ ...prev, quantity: MIN_QUANTITY }));
    } else if (quantity > MAX_QUANTITY) {
      setFormState((prev) => ({ ...prev, quantity: MAX_QUANTITY }));
    } else {
      setFormState((prev) => ({ ...prev, quantity }));
    }
    clearError('quantity');
  }

  /**
   * Handle unit price change
   */
  function handleUnitPriceChange(value: string) {
    const price = parseFloat(value);
    if (isNaN(price) || price < MIN_PRICE) {
      setFormState((prev) => ({ ...prev, unitPrice: MIN_PRICE }));
    } else {
      setFormState((prev) => ({ ...prev, unitPrice: price }));
    }
    clearError('price');
  }

  /**
   * Handle discount value change
   */
  function handleDiscountChange(value: string) {
    const discountValue = parseFloat(value);
    if (isNaN(discountValue) || discountValue < 0) {
      setFormState((prev) => ({ ...prev, discountValue: 0 }));
    } else if (formState.discountType === 'percentage' && discountValue > maxDiscountPercent) {
      setFormState((prev) => ({ ...prev, discountValue: maxDiscountPercent }));
    } else {
      setFormState((prev) => ({ ...prev, discountValue }));
    }
    clearError('discount');
  }

  /**
   * Handle discount type change
   */
  function handleDiscountTypeChange(value: 'percentage' | 'amount') {
    setFormState((prev) => ({ ...prev, discountType: value, discountValue: 0 }));
  }

  /**
   * Handle custom description change
   */
  function handleCustomDescriptionChange(value: string) {
    setFormState((prev) => ({ ...prev, customDescription: value }));
    clearError('description');
  }

  /**
   * Handle custom category change
   */
  function handleCustomCategoryChange(value: string) {
    setFormState((prev) => ({ ...prev, customCategory: value }));
  }

  /**
   * Clear specific error
   */
  function clearError(field: string) {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }

  /**
   * Validate form
   */
  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    // Validate item selection
    if (!formState.selectedItem && !formState.customDescription) {
      newErrors.item = 'Please select an item or enter a custom description';
    }

    // Validate quantity
    if (formState.quantity < MIN_QUANTITY) {
      newErrors.quantity = `Quantity must be at least ${MIN_QUANTITY}`;
    }

    // Validate unit price
    if (formState.unitPrice < MIN_PRICE) {
      newErrors.price = 'Price must be greater than 0';
    }

    // Validate discount
    if (formState.discountType === 'percentage' && formState.discountValue > maxDiscountPercent) {
      newErrors.discount = `Discount cannot exceed ${maxDiscountPercent}%`;
    }

    // Validate description
    if (formState.customDescription && formState.customDescription.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /**
   * Handle form submission
   */
  function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    // Build item description
    const description = formState.selectedItem
      ? formState.selectedItem.name
      : formState.customDescription;

    // Build category
    const category = formState.selectedItem?.category || formState.customCategory;

    // Calculate totals
    const subtotal = formState.quantity * formState.unitPrice;
    const discountAmount = calculateDiscountAmount(
      formState.quantity,
      formState.unitPrice,
      formState.discountValue,
      formState.discountType
    );
    const discountPercentage = formState.discountType === 'percentage'
      ? formState.discountValue
      : (discountAmount / subtotal) * 100;

    // Determine item type
    const itemType: ItemType = formState.selectedTab === 'services'
      ? ItemType.SERVICE
      : formState.selectedTab === 'medicines'
        ? ItemType.MEDICATION
        : ItemType.OTHER;

    // Build form data
    const formData: BillItemFormData = {
      item_type: itemType,
      source_type: formState.selectedTab === 'services'
        ? 'department_service'
        : formState.selectedTab === 'medicines'
          ? 'medicine'
          : 'custom',
      source_id: formState.selectedItem?.id,
      category: category || itemType,
      item_description: description,
      quantity: formState.quantity,
      unit_price: formState.unitPrice,
      discount_amount: discountAmount,
      discount_percentage: discountPercentage,
    };

    // Call callback
    onAddItem(formData);

    // Close dialog
    onOpenChange(false);
  }

  /**
   * Handle dialog close
   */
  function handleClose() {
    setFormState({
      selectedTab: 'services',
      searchQuery: '',
      selectedItem: null,
      quantity: 1,
      unitPrice: 0,
      discountType: 'percentage',
      discountValue: 0,
      customDescription: '',
      customCategory: '',
    });
    setErrors({});
    onOpenChange(false);
  }

  // Calculate derived values
  const lineSubtotal = formState.quantity * formState.unitPrice;
  const lineDiscount = calculateDiscountAmount(
    formState.quantity,
    formState.unitPrice,
    formState.discountValue,
    formState.discountType
  );
  const lineTotal = lineSubtotal - lineDiscount;

  // Filter items based on search
  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(formState.searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(formState.searchQuery.toLowerCase())
  );

  const filteredMedicines = medicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(formState.searchQuery.toLowerCase()) ||
      medicine.medicine_id?.toLowerCase().includes(formState.searchQuery.toLowerCase())
  );

  // Other items list (custom/common items)
  const otherItems: SelectableItem[] = [
    { id: 1, name: 'Registration Fee', description: 'Patient registration fee', price: 50, category: 'Administrative' },
    { id: 2, name: 'Consultation Fee', description: 'Doctor consultation fee', price: 100, category: 'Consultation' },
    { id: 3, name: 'Procedure Charge', description: 'General procedure charge', price: 200, category: 'Procedure' },
    { id: 4, name: 'Medical Supplies', description: 'Consumable medical supplies', price: 25, category: 'Supplies' },
    { id: 5, name: 'Lab Services', description: 'Laboratory services', price: 75, category: 'Laboratory' },
    { id: 6, name: 'Imaging Services', description: 'X-ray, Ultrasound, CT, MRI', price: 150, category: 'Imaging' },
  ];

  const filteredOtherItems = otherItems.filter(
    (item) =>
      item.name.toLowerCase().includes(formState.searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(formState.searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-w-2xl', className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Search and select services, medicines, or add custom billable items.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={formState.selectedTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="medicines">Medicines</TabsTrigger>
            {showOtherTab && <TabsTrigger value="other">Other</TabsTrigger>}
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4 mt-4">
            <SearchInput
              placeholder="Search services..."
              onSearch={(query) => setFormState((prev) => ({ ...prev, searchQuery: query }))}
              className="w-full"
            />

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredServices.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {formState.searchQuery ? 'No services found' : 'No services available'}
                </p>
              ) : (
                filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className={cn(
                      'flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-colors',
                      formState.selectedItem?.id === service.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() =>
                      handleItemSelect({
                        id: service.id,
                        name: service.name,
                        description: service.description || undefined,
                        price: service.final_cost,
                        category: undefined,
                      })
                    }
                  >
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                    </div>
                    <CurrencyDisplay amount={service.final_cost} currency={currency} />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Medicines Tab */}
          <TabsContent value="medicines" className="space-y-4 mt-4">
            <SearchInput
              placeholder="Search medicines..."
              onSearch={(query) => setFormState((prev) => ({ ...prev, searchQuery: query }))}
              className="w-full"
            />

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredMedicines.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {formState.searchQuery ? 'No medicines found' : 'No medicines available'}
                </p>
              ) : (
                filteredMedicines.map((medicine) => (
                  <div
                    key={medicine.id}
                    className={cn(
                      'flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-colors',
                      formState.selectedItem?.id === medicine.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() =>
                      handleItemSelect({
                        id: medicine.id,
                        name: medicine.name,
                        description: medicine.description || undefined,
                        price: medicine.unit_price,
                        category: medicine.category?.name,
                        code: medicine.medicine_id,
                        in_stock: medicine.stock_quantity > 0,
                        quantity: medicine.stock_quantity,
                      })
                    }
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{medicine.name}</p>
                        {medicine.stock_quantity <= medicine.reorder_level && (
                          <Badge variant="secondary" className="text-xs">
                            Low Stock
                          </Badge>
                        )}
                        {medicine.stock_quantity === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {medicine.medicine_id && (
                          <span className="font-mono">{medicine.medicine_id}</span>
                        )}
                        {medicine.category && (
                          <span>• {medicine.category.name}</span>
                        )}
                        <span>• Stock: {medicine.stock_quantity}</span>
                      </div>
                    </div>
                    <CurrencyDisplay amount={medicine.unit_price} currency={currency} />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Other Tab */}
          {showOtherTab && (
            <TabsContent value="other" className="space-y-4 mt-4">
              <SearchInput
                placeholder="Search other items..."
                onSearch={(query) => setFormState((prev) => ({ ...prev, searchQuery: query }))}
                className="w-full"
              />

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredOtherItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {formState.searchQuery ? 'No items found' : 'No items available'}
                  </p>
                ) : (
                  filteredOtherItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-colors',
                        formState.selectedItem?.id === item.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => handleItemSelect(item)}
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        {item.category && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      <CurrencyDisplay amount={item.price} currency={currency} />
                    </div>
                  ))
                )}
              </div>

              {/* Custom item option */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-2">Or add a custom item:</p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="custom-description">Description</Label>
                    <Input
                      id="custom-description"
                      placeholder="Enter item description"
                      value={formState.customDescription}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCustomDescriptionChange(e.target.value)}
                      className={cn(errors.description && 'border-destructive')}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive mt-1">{errors.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="custom-category">Category</Label>
                      <Select
                        value={formState.customCategory}
                        onValueChange={handleCustomCategoryChange}
                      >
                        <SelectTrigger id="custom-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrative">Administrative</SelectItem>
                          <SelectItem value="Consultation">Consultation</SelectItem>
                          <SelectItem value="Procedure">Procedure</SelectItem>
                          <SelectItem value="Supplies">Supplies</SelectItem>
                          <SelectItem value="Laboratory">Laboratory</SelectItem>
                          <SelectItem value="Imaging">Imaging</SelectItem>
                          <SelectItem value="Miscellaneous">Miscellaneous</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="custom-price">Unit Price</Label>
                      <Input
                        id="custom-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formState.unitPrice}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitPriceChange(e.target.value)}
                        className={cn(errors.price && 'border-destructive')}
                      />
                      {errors.price && (
                        <p className="text-sm text-destructive mt-1">{errors.price}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Selected Item Details */}
        {formState.selectedItem && (
          <div className="bg-muted/50 rounded-lg p-3 mt-4">
            <p className="text-sm text-muted-foreground mb-1">Selected Item</p>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{formState.selectedItem.name}</p>
                {formState.selectedItem.description && (
                  <p className="text-sm text-muted-foreground">{formState.selectedItem.description}</p>
                )}
                {formState.selectedItem.category && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {formState.selectedItem.category}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setFormState((prev) => ({ ...prev, selectedItem: null, searchQuery: '' }))
                }
              >
                Change
              </Button>
            </div>
          </div>
        )}

        {/* Item Details Form */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={MIN_QUANTITY}
              max={MAX_QUANTITY}
              value={formState.quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityChange(e.target.value)}
              className={cn(errors.quantity && 'border-destructive')}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Unit Price */}
          <div>
            <Label htmlFor="unit-price">Unit Price</Label>
            <Input
              id="unit-price"
              type="number"
              min="0"
              step="0.01"
              value={formState.unitPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUnitPriceChange(e.target.value)}
              className={cn(errors.price && 'border-destructive')}
            />
            {errors.price && !errors.quantity && (
              <p className="text-sm text-destructive mt-1">{errors.price}</p>
            )}
          </div>

          {/* Discount Type */}
          <div>
            <Label htmlFor="discount-type">Discount Type</Label>
            <Select
              value={formState.discountType}
              onValueChange={(value) => handleDiscountTypeChange(value as 'percentage' | 'amount')}
            >
              <SelectTrigger id="discount-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (%)</SelectItem>
                <SelectItem value="amount">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discount Value */}
          <div>
            <Label htmlFor="discount-value">
              Discount ({formState.discountType === 'percentage' ? '%' : currency})
            </Label>
            <Input
              id="discount-value"
              type="number"
              min="0"
              step={formState.discountType === 'percentage' ? '1' : '0.01'}
              max={formState.discountType === 'percentage' ? maxDiscountPercent : undefined}
              value={formState.discountValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDiscountChange(e.target.value)}
              className={cn(errors.discount && 'border-destructive')}
            />
            {errors.discount && (
              <p className="text-sm text-destructive mt-1">{errors.discount}</p>
            )}
          </div>
        </div>

        {/* Line Total */}
        <div className="bg-muted/50 rounded-lg p-4 mt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <CurrencyDisplay amount={lineSubtotal} currency={currency} />
            </div>
            {lineDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-<CurrencyDisplay amount={lineDiscount} currency={currency} /></span>
              </div>
            )}
            <hr className="border-t border-border" />
            <div className="flex justify-between font-semibold">
              <span>Line Total:</span>
              <CurrencyDisplay amount={lineTotal} currency={currency} size="lg" weight="bold" />
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {errors.item && (
          <p className="text-sm text-destructive text-center">{errors.item}</p>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
