
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applicationTypes, categories } from '@/lib/types';
import { Filter } from 'lucide-react';
import { Label } from '../ui/label';

interface FilterSidebarProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function FilterSidebar({ selectedType, onTypeChange, selectedCategory, onCategoryChange }: FilterSidebarProps) {
  return (
    <div className="group fixed left-0 top-0 z-40 h-screen w-16 overflow-hidden bg-card transition-all duration-300 ease-in-out hover:w-64 border-r border-border">
      <div className="flex h-full flex-col space-y-8 p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-6 w-6 flex-shrink-0 text-primary" />
          <h2 className="font-headline text-lg font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Filters
          </h2>
        </div>
        <div className="flex flex-col space-y-6 opacity-0 transition-opacity delay-100 duration-200 group-hover:opacity-100">
          <div className="space-y-2">
            <Label>Application Type</Label>
            <Select value={selectedType} onValueChange={onTypeChange}>
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
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
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
        </div>
      </div>
    </div>
  );
}
