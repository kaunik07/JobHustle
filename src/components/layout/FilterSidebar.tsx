'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applicationTypes, categories } from '@/lib/types';
import { PanelLeft, LayoutDashboard, FileText } from 'lucide-react';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface FilterSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentView: 'board' | 'resumes';
  onViewChange: (view: 'board' | 'resumes') => void;
  selectedUserId: string;
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
  isOpen, onToggle,
  currentView, onViewChange,
  selectedUserId,
  selectedType, onTypeChange, 
  selectedCategory, onCategoryChange,
  locationQuery, onLocationChange,
  companyQuery, onCompanyChange
}: FilterSidebarProps) {

  return (
    <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300",
        isOpen ? "w-64" : "w-16"
    )}>
      <div className="flex flex-col h-full">
        <div className="relative flex h-16 items-center border-b px-4">
            <h2 className={cn("font-bold transition-opacity whitespace-nowrap", isOpen ? "opacity-100" : "opacity-0")}>
                Filters
            </h2>
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2"
            >
                <PanelLeft className={cn("transition-transform duration-300", isOpen && "rotate-180")} />
            </Button>
        </div>

        <div className={cn(
            "flex-1 overflow-y-auto transition-opacity",
            isOpen ? "opacity-100 delay-200" : "opacity-0"
        )}>
            <div className="p-4 space-y-6">
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
        
        <Separator />

        <div className="p-2">
            <nav className="flex flex-col gap-1">
                <Button 
                    variant={currentView === 'board' ? 'secondary' : 'ghost'} 
                    className="justify-start"
                    onClick={() => onViewChange('board')}
                >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className={cn("ml-4", !isOpen && "hidden")}>Job Board</span>
                </Button>
                {selectedUserId !== 'all' && (
                    <Button 
                        variant={currentView === 'resumes' ? 'secondary' : 'ghost'} 
                        className="justify-start"
                        onClick={() => onViewChange('resumes')}
                    >
                        <FileText className="h-5 w-5" />
                        <span className={cn("ml-4", !isOpen && "hidden")}>My Resumes</span>
                    </Button>
                )}
            </nav>
        </div>
      </div>
    </aside>
  );
}
