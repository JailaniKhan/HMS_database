import { Head, useForm, Link } from '@inertiajs/react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Heading from '@/components/heading';
import {
  ArrowLeft,
  Save,
  FolderOpen,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CategoryCreate() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/pharmacy/categories');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(name as keyof typeof data, value);
  };

  return (
    <PharmacyLayout>
      <Head title="Add New Category" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/pharmacy/categories">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <Heading title="Add New Category" />
              <p className="text-muted-foreground mt-1">
                Create a new medicine category
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Category Information</CardTitle>
                  <CardDescription>Enter the category details below</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Category Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    value={data.name}
                    onChange={handleChange}
                    placeholder="e.g., Antibiotics, Pain Relief, Vitamins"
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
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={data.description}
                  onChange={handleChange}
                  placeholder="Enter a description for this category..."
                  rows={4}
                  className={cn(errors.description && "border-destructive")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Provide a brief description to help identify the purpose of this category
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          {data.name && (
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{data.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        New Category
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
            <Link href="/pharmacy/categories">
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
              {processing ? 'Saving...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </PharmacyLayout>
  );
}
