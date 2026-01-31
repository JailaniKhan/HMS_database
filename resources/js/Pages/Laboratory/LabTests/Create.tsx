import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Heading from '@/components/heading';
import {
  ArrowLeft,
  Save,
  FlaskConical,
  DollarSign,
  Clock,
  FileText,
  Activity,
  Droplets,
  Microscope,
  Beaker,
  Tag,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Category configuration with icons and colors
const categoryConfig: Record<string, { 
  label: string; 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
  description: string;
}> = {
  hematology: { 
    label: 'Hematology', 
    icon: Droplets, 
    color: 'text-lab-hematology',
    bgColor: 'bg-lab-hematology/10 border-lab-hematology/30',
    description: 'Blood-related tests including CBC, coagulation studies'
  },
  biochemistry: { 
    label: 'Biochemistry', 
    icon: FlaskConical, 
    color: 'text-lab-biochemistry',
    bgColor: 'bg-lab-biochemistry/10 border-lab-biochemistry/30',
    description: 'Chemical analysis of blood, enzymes, and metabolites'
  },
  microbiology: { 
    label: 'Microbiology', 
    icon: Microscope, 
    color: 'text-lab-microbiology',
    bgColor: 'bg-lab-microbiology/10 border-lab-microbiology/30',
    description: 'Bacterial cultures, sensitivity tests, and pathogen identification'
  },
  immunology: { 
    label: 'Immunology', 
    icon: Activity, 
    color: 'text-lab-immunology',
    bgColor: 'bg-lab-immunology/10 border-lab-immunology/30',
    description: 'Antibody tests, immune function, and autoimmune markers'
  },
  urinalysis: { 
    label: 'Urinalysis', 
    icon: Beaker, 
    color: 'text-lab-urinalysis',
    bgColor: 'bg-lab-urinalysis/10 border-lab-urinalysis/30',
    description: 'Urine chemistry, microscopy, and culture tests'
  },
};

// Generate test code based on category and name
const generateTestCode = (category: string, name: string): string => {
  const prefix = category.substring(0, 3).toUpperCase();
  const namePart = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 4);
  const timestamp = Date.now().toString(36).substring(0, 4).toUpperCase();
  return `${prefix}-${namePart}-${timestamp}`;
};

export default function LabTestCreate() {
  const [autoGenerateCode, setAutoGenerateCode] = useState(true);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    code: '',
    description: '',
    procedure: '',
    normal_values: '',
    unit: '',
    category: '',
    cost: 0,
    turnaround_time: 24,
    status: 'active',
  });

  // Auto-generate code when name or category changes
  useEffect(() => {
    if (autoGenerateCode && data.name && data.category) {
      const newCode = generateTestCode(data.category, data.name);
      setData('code', newCode);
    }
  }, [data.name, data.category, autoGenerateCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/laboratory/lab-tests');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(name as keyof typeof data, 
      name === 'cost' ? parseFloat(value) || 0 : 
      name === 'turnaround_time' ? parseInt(value) || 0 : 
      value
    );
  };

  const handleSelectChange = (name: string, value: string) => {
    setData(name as keyof typeof data, value);
  };

  const regenerateCode = () => {
    if (data.category && data.name) {
      const newCode = generateTestCode(data.category, data.name);
      setData('code', newCode);
    }
  };

  const selectedCategoryConfig = categoryConfig[data.category];
  const CategoryIcon = selectedCategoryConfig?.icon || FlaskConical;

  return (
    <>
      <Head title="Add New Lab Test" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Add New Lab Test" />
            <p className="text-muted-foreground mt-1">
              Create a new laboratory test with complete details
            </p>
          </div>
          
          <Link href="/laboratory/lab-tests">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tests
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Test name, code, and categorization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Test Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Test Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <FlaskConical className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      value={data.name}
                      onChange={handleChange}
                      placeholder="e.g., Complete Blood Count"
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
                
                {/* Test Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="code">
                      Test Code <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={autoGenerateCode}
                        onCheckedChange={setAutoGenerateCode}
                        id="auto-code"
                        size="sm"
                      />
                      <Label htmlFor="auto-code" className="text-xs text-muted-foreground cursor-pointer">
                        Auto-generate
                      </Label>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="code"
                      name="code"
                      value={data.code}
                      onChange={handleChange}
                      placeholder="e.g., HEM-CBC-ABCD"
                      readOnly={autoGenerateCode}
                      className={cn(
                        "pr-10",
                        autoGenerateCode && "bg-muted/50",
                        errors.code && "border-destructive"
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
                  {errors.code && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.code}
                    </p>
                  )}
                </div>
                
                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={data.category} 
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger className={cn(errors.category && "border-destructive")}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className={cn("h-4 w-4", config.color)} />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.category}
                    </p>
                  )}
                  {selectedCategoryConfig && (
                    <p className="text-xs text-muted-foreground">
                      {selectedCategoryConfig.description}
                    </p>
                  )}
                </div>
                
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={data.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Active</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span>Inactive</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Inactive tests won't be available for new requests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Timing Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle>Pricing & Timing</CardTitle>
                  <CardDescription>Cost and turnaround time information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cost */}
                <div className="space-y-2">
                  <Label htmlFor="cost">
                    Cost <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={data.cost}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={cn("pl-9", errors.cost && "border-destructive")}
                    />
                  </div>
                  {errors.cost && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.cost}
                    </p>
                  )}
                </div>
                
                {/* Turnaround Time */}
                <div className="space-y-2">
                  <Label htmlFor="turnaround_time">
                    Turnaround Time (hours) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="turnaround_time"
                      name="turnaround_time"
                      type="number"
                      min="1"
                      value={data.turnaround_time}
                      onChange={handleChange}
                      placeholder="24"
                      className={cn("pl-9", errors.turnaround_time && "border-destructive")}
                    />
                  </div>
                  {errors.turnaround_time && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.turnaround_time}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {data.turnaround_time < 24 
                      ? `${data.turnaround_time} hours` 
                      : `${Math.floor(data.turnaround_time / 24)} day${Math.floor(data.turnaround_time / 24) > 1 ? 's' : ''}${data.turnaround_time % 24 > 0 ? ` ${data.turnaround_time % 24}h` : ''}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Details Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Clinical Details</CardTitle>
                  <CardDescription>Description, normal values, and procedure</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={data.description}
                    onChange={handleChange}
                    placeholder="Enter a detailed description of the test purpose and methodology..."
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
                
                {/* Normal Values */}
                <div className="space-y-2">
                  <Label htmlFor="normal_values">Normal Values / Reference Range</Label>
                  <Textarea
                    id="normal_values"
                    name="normal_values"
                    value={data.normal_values}
                    onChange={handleChange}
                    placeholder="e.g., Male: 13.5-17.5 g/dL, Female: 12.0-16.0 g/dL"
                    rows={2}
                    className={cn(errors.normal_values && "border-destructive")}
                  />
                  {errors.normal_values && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.normal_values}
                    </p>
                  )}
                </div>
                
                {/* Unit */}
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measurement</Label>
                  <Input
                    id="unit"
                    name="unit"
                    value={data.unit}
                    onChange={handleChange}
                    placeholder="e.g., g/dL, mmol/L, IU/L"
                    className={cn(errors.unit && "border-destructive")}
                  />
                  {errors.unit && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.unit}
                    </p>
                  )}
                </div>
                
                {/* Procedure */}
                <div className="space-y-2">
                  <Label htmlFor="procedure">Procedure / Instructions</Label>
                  <Textarea
                    id="procedure"
                    name="procedure"
                    value={data.procedure}
                    onChange={handleChange}
                    placeholder="Enter collection instructions, preparation requirements, and testing procedure..."
                    rows={4}
                    className={cn(errors.procedure && "border-destructive")}
                  />
                  {errors.procedure && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.procedure}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Preview */}
          {selectedCategoryConfig && (
            <Card className={cn("border-l-4", selectedCategoryConfig.bgColor)} style={{ borderLeftColor: `hsl(var(--lab-${data.category}))` }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", selectedCategoryConfig.bgColor)}>
                    <CategoryIcon className={cn("h-6 w-6", selectedCategoryConfig.color)} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      {data.name || 'New Test'}
                      <Badge variant="outline" className={selectedCategoryConfig.bgColor}>
                        {selectedCategoryConfig.label}
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {data.cost > 0 ? `$${data.cost.toFixed(2)}` : 'No price set'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {data.turnaround_time} hours
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {data.code || 'No code'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
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
            <Link href="/laboratory/lab-tests">
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
              {processing ? 'Saving...' : 'Create Lab Test'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
