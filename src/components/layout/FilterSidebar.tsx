
'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applicationTypes, categories } from '@/lib/types';
import { Filter } from 'lucide-react';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

interface FilterSidebarProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  locationQuery: string;
  onLocationChange: (location: string) => void;
  companyQuery: string;
  onCompanyChange: (company: string) => void;
}

export function FilterSidebar({ 
  selectedType, onTypeChange, 
  selectedCategory, onCategoryChange,
  locationQuery, onLocationChange,
  companyQuery, onCompanyChange
}: FilterSidebarProps) {
  const [isTypeSelectOpen, setIsTypeSelectOpen] = React.useState(false);
  const [isCategorySelectOpen, setIsCategorySelectOpen] = React.useState(false);

  return (
    <div 
        className={cn(
            "group fixed left-0 top-0 z-40 h-screen overflow-hidden bg-card transition-all duration-[600ms] ease-in-out border-r border-border",
            "w-16 hover:w-64 focus-within:w-64"
        )}
    >
      <div className="flex h-full flex-col space-y-8 p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-6 w-6 flex-shrink-0 text-primary" />
          <h2 className={cn(
            "font-headline text-lg font-semibold transition-opacity duration-200",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          )}>
            Filters
          </h2>
        </div>
        <div className={cn(
            "flex flex-col space-y-6 transition-opacity delay-100 duration-200",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        )}>
          <div className="space-y-2">
            <Label>Application Type</Label>
            <Select value={selectedType} onValueChange={onTypeChange} onOpenChange={setIsTypeSelectOpen}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {applicationTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Job Category</Label>
            <Select value={selectedCategory} onValueChange={onCategoryChange} onOpenChange={setIsCategorySelectOpen}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input 
              placeholder="Filter by location"
              value={locationQuery}
              onChange={(e) => onLocationChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input 
              placeholder="Filter by company"
              value={companyQuery}
              onChange={(e) => onCompanyChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
