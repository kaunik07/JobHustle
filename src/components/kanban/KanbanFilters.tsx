'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, categories } from '@/lib/types';

interface KanbanFiltersProps {
  users: User[];
  selectedUser: string;
  onUserChange: (userId: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function KanbanFilters({
  users,
  selectedUser,
  onUserChange,
  selectedCategory,
  onCategoryChange,
}: KanbanFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <Select value={selectedUser} onValueChange={onUserChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by user" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          {users.map(user => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map(category => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
