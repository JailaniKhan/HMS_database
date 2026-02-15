/**
 * BillItemManager Component
 *
 * Manages bill items including adding, editing, and removing items.
 * Supports adding items from various sources (appointments, lab tests, pharmacy, services, manual).
 */

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { useBillCalculations } from '@/hooks/billing/useBillCalculations';
import {
    ItemType,
    type BillItemFormData,
    type Doctor,
    type Department,
} from '@/types/billing';

// Extended interfaces for bill item sources
interface Appointment {
    id: number;
    appointment_date: string;
    appointment_time: string;
    doctor?: Doctor;
}

interface LabTest {
    id: number;
    name: string;
    category?: string;
    price?: number;
}

interface Medicine {
    id: number;
    name: string;
    generic_name?: string;
    selling_price?: number;
}

interface DepartmentService {
    id: number;
    name: string;
    price?: number;
    department?: Department;
}
import {
    Plus,
    Trash2,
    Calendar,
    FlaskConical,
    Pill,
    Stethoscope,
    FileText,
    Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillItemManagerProps {
    items: BillItemFormData[];
    onItemsChange: (items: BillItemFormData[]) => void;
    availableAppointments?: Appointment[];
    availableLabTests?: LabTest[];
    availableMedicines?: Medicine[];
    availableServices?: DepartmentService[];
    readOnly?: boolean;
    currency?: string;
}

interface ItemSourceOption {
    type: 'appointment' | 'lab_test' | 'medicine' | 'service' | 'manual';
    label: string;
    icon: React.ReactNode;
    description: string;
}

const ITEM_TYPE_OPTIONS: { value: ItemType; label: string }[] = [
    { value: ItemType.SERVICE, label: 'Service' },
    { value: ItemType.CONSULTATION, label: 'Consultation' },
    { value: ItemType.PROCEDURE, label: 'Procedure' },
    { value: ItemType.MEDICATION, label: 'Medication' },
    { value: ItemType.LAB_TEST, label: 'Lab Test' },
    { value: ItemType.ROOM_CHARGE, label: 'Room Charge' },
    { value: ItemType.EQUIPMENT, label: 'Equipment' },
    { value: ItemType.SUPPLY, label: 'Supply' },
    { value: ItemType.OTHER, label: 'Other' },
];

const SOURCE_OPTIONS: ItemSourceOption[] = [
    {
        type: 'appointment',
        label: 'From Appointment',
        icon: <Calendar className="h-4 w-4" />,
        description: 'Add charges from patient appointments',
    },
    {
        type: 'lab_test',
        label: 'From Lab Test',
        icon: <FlaskConical className="h-4 w-4" />,
        description: 'Add laboratory test charges',
    },
    {
        type: 'medicine',
        label: 'From Pharmacy',
        icon: <Pill className="h-4 w-4" />,
        description: 'Add medication charges',
    },
    {
        type: 'service',
        label: 'From Service',
        icon: <Stethoscope className="h-4 w-4" />,
        description: 'Add department service charges',
    },
    {
        type: 'manual',
        label: 'Manual Entry',
        icon: <FileText className="h-4 w-4" />,
        description: 'Manually add a bill item',
    },
];

export function BillItemManager({
    items,
    onItemsChange,
    availableAppointments = [],
    availableLabTests = [],
    availableMedicines = [],
    availableServices = [],
    readOnly = false,
    currency = 'AFN',
}: BillItemManagerProps) {
    const [showAddDialog, setShowAddDialog] = React.useState(false);
    const [selectedSource, setSelectedSource] = React.useState<ItemSourceOption['type'] | null>(null);
    const [editingItem, setEditingItem] = React.useState<BillItemFormData | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');

    // TODO: Implement edit functionality when needed
    // The editingItem state is prepared for future edit feature
    React.useEffect(() => {
        if (editingItem) {
            // Future: Populate form with editingItem data
            setEditingItem(null);
        }
    }, [editingItem]);

    // Form state for manual entry
    const [manualForm, setManualForm] = React.useState<Partial<BillItemFormData>>({
        item_type: ItemType.SERVICE,
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        discount_percentage: 0,
    });

    // Calculate totals
    const { calculations, calculateItemTotal, calculateNetItemPrice } = useBillCalculations({
        items,
    });

    // Add item from source
    const addItemFromSource = React.useCallback(
        (sourceType: ItemSourceOption['type'], sourceId: number) => {
            let newItem: BillItemFormData;

            switch (sourceType) {
                case 'appointment': {
                    const appointment = availableAppointments.find((a) => a.id === sourceId);
                    if (!appointment) return;
                    newItem = {
                        item_type: ItemType.CONSULTATION,
                        source_type: 'appointment',
                        source_id: appointment.id,
                        category: 'Consultation',
                        item_description: `Consultation with Dr. ${appointment.doctor?.full_name || 'Unknown'}`,
                        quantity: 1,
                        unit_price: appointment.doctor?.fees || 0,
                        discount_amount: 0,
                        discount_percentage: 0,
                    };
                    break;
                }
                case 'lab_test': {
                    const labTest = availableLabTests.find((t) => t.id === sourceId);
                    if (!labTest) return;
                    newItem = {
                        item_type: ItemType.LAB_TEST,
                        source_type: 'lab_test',
                        source_id: labTest.id,
                        category: 'Laboratory',
                        item_description: labTest.name,
                        quantity: 1,
                        unit_price: labTest.price || 0,
                        discount_amount: 0,
                        discount_percentage: 0,
                    };
                    break;
                }
                case 'medicine': {
                    const medicine = availableMedicines.find((m) => m.id === sourceId);
                    if (!medicine) return;
                    newItem = {
                        item_type: ItemType.MEDICATION,
                        source_type: 'medicine',
                        source_id: medicine.id,
                        category: 'Pharmacy',
                        item_description: medicine.name,
                        quantity: 1,
                        unit_price: medicine.selling_price || 0,
                        discount_amount: 0,
                        discount_percentage: 0,
                    };
                    break;
                }
                case 'service': {
                    const service = availableServices.find((s) => s.id === sourceId);
                    if (!service) return;
                    newItem = {
                        item_type: ItemType.SERVICE,
                        source_type: 'department_service',
                        source_id: service.id,
                        category: service.department?.name || 'Service',
                        item_description: service.name,
                        quantity: 1,
                        unit_price: service.price || 0,
                        discount_amount: 0,
                        discount_percentage: 0,
                    };
                    break;
                }
                default:
                    return;
            }

            onItemsChange([...items, newItem]);
            setShowAddDialog(false);
            setSelectedSource(null);
        },
        [items, onItemsChange, availableAppointments, availableLabTests, availableMedicines, availableServices]
    );

    // Add manual item
    const addManualItem = React.useCallback(() => {
        if (!manualForm.item_description || !manualForm.unit_price) return;

        const newItem: BillItemFormData = {
            item_type: manualForm.item_type || ItemType.SERVICE,
            item_description: manualForm.item_description,
            category: manualForm.category || 'General',
            quantity: manualForm.quantity || 1,
            unit_price: manualForm.unit_price || 0,
            discount_amount: manualForm.discount_amount || 0,
            discount_percentage: manualForm.discount_percentage || 0,
        };

        onItemsChange([...items, newItem]);
        setShowAddDialog(false);
        setSelectedSource(null);
        setManualForm({
            item_type: ItemType.SERVICE,
            quantity: 1,
            unit_price: 0,
            discount_amount: 0,
            discount_percentage: 0,
        });
    }, [items, onItemsChange, manualForm]);

    // Remove item
    const removeItem = React.useCallback(
        (index: number) => {
            const newItems = items.filter((_, i) => i !== index);
            onItemsChange(newItems);
        },
        [items, onItemsChange]
    );

    // Update item
    const updateItem = React.useCallback(
        (index: number, updates: Partial<BillItemFormData>) => {
            const newItems = items.map((item, i) => (i === index ? { ...item, ...updates } : item));
            onItemsChange(newItems);
        },
        [items, onItemsChange]
    );

    // Get item type badge
    const getItemTypeBadge = (type: ItemType) => {
        const colors: Record<ItemType, string> = {
            [ItemType.SERVICE]: 'bg-blue-100 text-blue-800',
            [ItemType.CONSULTATION]: 'bg-purple-100 text-purple-800',
            [ItemType.PROCEDURE]: 'bg-orange-100 text-orange-800',
            [ItemType.MEDICATION]: 'bg-green-100 text-green-800',
            [ItemType.LAB_TEST]: 'bg-cyan-100 text-cyan-800',
            [ItemType.ROOM_CHARGE]: 'bg-pink-100 text-pink-800',
            [ItemType.EQUIPMENT]: 'bg-gray-100 text-gray-800',
            [ItemType.SUPPLY]: 'bg-yellow-100 text-yellow-800',
            [ItemType.OTHER]: 'bg-slate-100 text-slate-800',
        };
        return (
            <Badge variant="outline" className={cn('text-xs', colors[type] || colors[ItemType.OTHER])}>
                {type.replace('_', ' ')}
            </Badge>
        );
    };

    // Filter available items based on search - implemented inline for each source type

    return (
        <div className="space-y-4">
            {/* Items Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Bill Items</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {items.length} item{items.length !== 1 ? 's' : ''} • Total:{' '}
                            <CurrencyDisplay amount={calculations.totalAmount} currency={currency} />
                        </p>
                    </div>
                    {!readOnly && (
                        <Button onClick={() => setShowAddDialog(true)} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {items.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Unit Price</TableHead>
                                        <TableHead className="text-right">Discount</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        {!readOnly && <TableHead className="w-[50px]"></TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => {
                                        const itemTotal = calculateItemTotal(item);
                                        const netPrice = calculateNetItemPrice(item);
                                        const hasDiscount =
                                            (item.discount_amount || 0) > 0 || (item.discount_percentage || 0) > 0;

                                        return (
                                            <TableRow key={index}>
                                                <TableCell>{getItemTypeBadge(item.item_type)}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{item.item_description}</span>
                                                        {item.category && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {item.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {readOnly ? (
                                                        item.quantity
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) =>
                                                                updateItem(index, {
                                                                    quantity: parseInt(e.target.value) || 1,
                                                                })
                                                            }
                                                            className="w-20 ml-auto text-right"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {readOnly ? (
                                                        <CurrencyDisplay
                                                            amount={item.unit_price}
                                                            currency={currency}
                                                        />
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unit_price}
                                                            onChange={(e) =>
                                                                updateItem(index, {
                                                                    unit_price: parseFloat(e.target.value) || 0,
                                                                })
                                                            }
                                                            className="w-28 ml-auto text-right"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {readOnly ? (
                                                        hasDiscount ? (
                                                            <span className="text-green-600">
                                                                -
                                                                <CurrencyDisplay
                                                                    amount={itemTotal - netPrice}
                                                                    currency={currency}
                                                                    showSymbol={false}
                                                                />
                                                            </span>
                                                        ) : (
                                                            '-'
                                                        )
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                placeholder="Amount"
                                                                value={item.discount_amount || ''}
                                                                onChange={(e) =>
                                                                    updateItem(index, {
                                                                        discount_amount:
                                                                            parseFloat(e.target.value) || 0,
                                                                    })
                                                                }
                                                                className="w-20 text-right"
                                                            />
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                placeholder="%"
                                                                value={item.discount_percentage || ''}
                                                                onChange={(e) =>
                                                                    updateItem(index, {
                                                                        discount_percentage:
                                                                            parseFloat(e.target.value) || 0,
                                                                    })
                                                                }
                                                                className="w-16 text-right"
                                                            />
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <CurrencyDisplay amount={netPrice} currency={currency} />
                                                </TableCell>
                                                {!readOnly && (
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeItem(index)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No items added yet</p>
                            {!readOnly && (
                                <Button variant="link" onClick={() => setShowAddDialog(true)} className="mt-2">
                                    Add your first item
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Item Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Bill Item</DialogTitle>
                        <DialogDescription>
                            Choose a source to add items to the bill
                        </DialogDescription>
                    </DialogHeader>

                    {!selectedSource ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                            {SOURCE_OPTIONS.map((source) => (
                                <button
                                    key={source.type}
                                    onClick={() => setSelectedSource(source.type)}
                                    className="flex items-start gap-3 p-4 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors text-left"
                                >
                                    <div className="p-2 bg-primary/10 rounded-md">{source.icon}</div>
                                    <div>
                                        <h4 className="font-medium">{source.label}</h4>
                                        <p className="text-sm text-muted-foreground">{source.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : selectedSource === 'manual' ? (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="item_type">Item Type</Label>
                                    <Select
                                        value={manualForm.item_type}
                                        onValueChange={(value) =>
                                            setManualForm({ ...manualForm, item_type: value as ItemType })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ITEM_TYPE_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Input
                                        id="category"
                                        value={manualForm.category || ''}
                                        onChange={(e) =>
                                            setManualForm({ ...manualForm, category: e.target.value })
                                        }
                                        placeholder="e.g., General, Surgery"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Input
                                    id="description"
                                    value={manualForm.item_description || ''}
                                    onChange={(e) =>
                                        setManualForm({ ...manualForm, item_description: e.target.value })
                                    }
                                    placeholder="Enter item description"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={manualForm.quantity}
                                        onChange={(e) =>
                                            setManualForm({
                                                ...manualForm,
                                                quantity: parseInt(e.target.value) || 1,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="unit_price">Unit Price *</Label>
                                    <Input
                                        id="unit_price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={manualForm.unit_price}
                                        onChange={(e) =>
                                            setManualForm({
                                                ...manualForm,
                                                unit_price: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="discount">Discount</Label>
                                    <Input
                                        id="discount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={manualForm.discount_amount || ''}
                                        onChange={(e) =>
                                            setManualForm({
                                                ...manualForm,
                                                discount_amount: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                        placeholder="Amount"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto border rounded-md">
                                {selectedSource === 'appointment' && (
                                    <div className="divide-y">
                                        {availableAppointments.filter(apt => 
                                            apt.doctor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map((apt) => (
                                            <button
                                                key={apt.id}
                                                onClick={() => addItemFromSource('appointment', apt.id)}
                                                className="w-full flex items-center justify-between p-3 hover:bg-muted text-left"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        Dr. {apt.doctor?.full_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {apt.appointment_date} at {apt.appointment_time}
                                                    </p>
                                                </div>
                                                <CurrencyDisplay
                                                    amount={apt.doctor?.fees || 0}
                                                    currency={currency}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedSource === 'lab_test' && (
                                    <div className="divide-y">
                                        {availableLabTests.filter(test => 
                                            test.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map((test) => (
                                            <button
                                                key={test.id}
                                                onClick={() => addItemFromSource('lab_test', test.id)}
                                                className="w-full flex items-center justify-between p-3 hover:bg-muted text-left"
                                            >
                                                <div>
                                                    <p className="font-medium">{test.name}</p>
                                                    <p className="text-sm text-muted-foreground">{test.category}</p>
                                                </div>
                                                <CurrencyDisplay amount={test.price || 0} currency={currency} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedSource === 'medicine' && (
                                    <div className="divide-y">
                                        {availableMedicines.filter(med => 
                                            med.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map((med) => (
                                            <button
                                                key={med.id}
                                                onClick={() => addItemFromSource('medicine', med.id)}
                                                className="w-full flex items-center justify-between p-3 hover:bg-muted text-left"
                                            >
                                                <div>
                                                    <p className="font-medium">{med.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {med.generic_name}
                                                    </p>
                                                </div>
                                                <CurrencyDisplay amount={med.selling_price || 0} currency={currency} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedSource === 'service' && (
                                    <div className="divide-y">
                                        {availableServices.filter(service => 
                                            service.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map((service) => (
                                            <button
                                                key={service.id}
                                                onClick={() => addItemFromSource('service', service.id)}
                                                className="w-full flex items-center justify-between p-3 hover:bg-muted text-left"
                                            >
                                                <div>
                                                    <p className="font-medium">{service.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {service.department?.name}
                                                    </p>
                                                </div>
                                                <CurrencyDisplay amount={service.price || 0} currency={currency} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (selectedSource) {
                                    setSelectedSource(null);
                                } else {
                                    setShowAddDialog(false);
                                }
                            }}
                        >
                            {selectedSource ? 'Back' : 'Cancel'}
                        </Button>
                        {selectedSource === 'manual' && (
                            <Button
                                onClick={addManualItem}
                                disabled={!manualForm.item_description || !manualForm.unit_price}
                            >
                                Add Item
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
