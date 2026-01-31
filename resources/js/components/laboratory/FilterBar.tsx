import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  Filter,
  X,
  Calendar,
  ChevronDown,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';

export type FilterType = 'search' | 'select' | 'date' | 'date-range';

export interface FilterOption {
  label: string;
  value: string;
  icon?: LucideIcon;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  placeholder?: string;
  icon?: LucideIcon;
}

export interface FilterState {
  [key: string]: string | string[] | undefined;
}

export interface FilterBarProps {
  filters: FilterConfig[];
  value: FilterState;
  onChange: (filters: FilterState) => void;
  onReset?: () => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  showFilterChips?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  (
    {
      className,
      filters,
      value,
      onChange,
      onReset,
      onSearch,
      searchPlaceholder = 'Search...',
      showSearch = true,
      showFilterChips = true,
      collapsible = true,
      defaultCollapsed = false,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(!defaultCollapsed);
    const [searchQuery, setSearchQuery] = React.useState('');

    const activeFiltersCount = Object.values(value).filter(
      (v) => v !== undefined && v !== '' && v !== 'all'
    ).length;

    const handleFilterChange = (filterId: string, filterValue: string | undefined) => {
      onChange({
        ...value,
        [filterId]: filterValue,
      });
    };

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      onSearch?.(searchQuery);
    };

    const handleReset = () => {
      setSearchQuery('');
      onReset?.();
    };

    const getActiveFilterChips = () => {
      const chips: { id: string; label: string; value: string }[] = [];

      filters.forEach((filter) => {
        const filterValue = value[filter.id];
        if (filterValue && filterValue !== 'all' && filterValue !== '') {
          const option = filter.options?.find((opt) => opt.value === filterValue);
          chips.push({
            id: filter.id,
            label: filter.label,
            value: option?.label || String(filterValue),
          });
        }
      });

      return chips;
    };

    const renderFilterInput = (filter: FilterConfig) => {
      const FilterIcon = filter.icon || Filter;

      switch (filter.type) {
        case 'search':
          return (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={filter.placeholder || 'Search...'}
                value={value[filter.id] || ''}
                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                className="pl-9 w-full md:w-[200px]"
              />
            </div>
          );

        case 'select':
          return (
            <Select
              onValueChange={(val) => handleFilterChange(filter.id, val === 'all' ? undefined : val)}
            >
              <SelectTrigger className="w-full md:w-[180px] gap-2">
                <FilterIcon className="size-4 text-muted-foreground" />
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon && <option.icon className="size-4" />}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case 'date':
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-[180px] justify-start gap-2"
                >
                  <Calendar className="size-4 text-muted-foreground" />
                  {value[filter.id] ? (
                    <span>{value[filter.id]}</span>
                  ) : (
                    <span className="text-muted-foreground">{filter.label}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                {/* Date picker would go here - using input for now */}
                <div className="p-4">
                  <Input
                    type="date"
                    value={value[filter.id] || ''}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                  />
                </div>
              </PopoverContent>
            </Popover>
          );

        case 'date-range':
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-[220px] justify-start gap-2"
                >
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{filter.label}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">From</label>
                    <Input
                      type="date"
                      value={value[`${filter.id}_from`] || ''}
                      onChange={(e) =>
                        onChange({ ...value, [`${filter.id}_from`]: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">To</label>
                    <Input
                      type="date"
                      value={value[`${filter.id}_to`] || ''}
                      onChange={(e) =>
                        onChange({ ...value, [`${filter.id}_to`]: e.target.value })
                      }
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          );

        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        role="search"
        aria-label="Filter and search"
        className={cn('space-y-3', className)}
        {...props}
      >
        {/* Main Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          {/* Search Input */}
          {showSearch && (
            <form onSubmit={handleSearch} className="w-full md:w-auto" role="search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-[280px]"
                  aria-label="Search"
                  type="search"
                />
              </div>
            </form>
          )}

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Quick Filters (visible when collapsed or always) */}
            {(!collapsible || isExpanded) &&
              filters.slice(0, collapsible && !isExpanded ? 2 : undefined).map((filter) => (
                <div key={filter.id}>{renderFilterInput(filter)}</div>
              ))}

            {/* Expand/Collapse Button */}
            {collapsible && filters.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="gap-1"
              >
                {isExpanded ? 'Less' : 'More'}
                <ChevronDown
                  className={cn('size-4 transition-transform', isExpanded && 'rotate-180')}
                />
              </Button>
            )}

            {/* Filter Button with Badge */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="size-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filters</h4>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleReset}>
                        <RotateCcw className="size-4 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {filters.map((filter) => (
                      <div key={filter.id} className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          {filter.label}
                        </label>
                        {renderFilterInput(filter)}
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Reset Button */}
            {(activeFiltersCount > 0 || searchQuery) && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
                <X className="size-4" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {showFilterChips && activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {getActiveFilterChips().map((chip) => (
              <Badge
                key={chip.id}
                variant="secondary"
                className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => handleFilterChange(chip.id, undefined)}
              >
                <span className="text-muted-foreground">{chip.label}:</span>
                <span>{chip.value}</span>
                <X className="size-3 ml-1" />
              </Badge>
            ))}
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleReset}
              >
                Clear all
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);

FilterBar.displayName = 'FilterBar';

export { FilterBar };
