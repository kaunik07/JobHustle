'use client';

import * as React from 'react';
import { Briefcase, Upload } from 'lucide-react';
import { AddApplicationDialog } from '@/components/kanban/AddApplicationDialog';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HeaderProps {
  users: User[];
}

export function Header({ users }: HeaderProps) {
  const mainUser = users.find(u => u.name === 'U');
  const otherUsers = users.filter(u => u.name !== 'U');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2">
        <Briefcase className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-2xl font-bold">JobTracker <span className="text-primary">Pro</span></h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        {mainUser && (
            <Avatar>
                <AvatarImage src={mainUser.avatarUrl} alt={mainUser.name} />
                <AvatarFallback>{mainUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
        )}
        <div className="flex -space-x-2">
            {otherUsers.map(user => (
                 <Avatar key={user.id} className="border-2 border-background">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
            ))}
        </div>
        <Select defaultValue="all-roles">
            <SelectTrigger className="w-[180px] hidden md:flex">
                <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all-roles">All Roles</SelectItem>
            </SelectContent>
        </Select>
        <Button variant="outline" className='hidden sm:flex'>
            <Upload className="mr-2 h-4 w-4" />
            Resume Library
        </Button>
        <AddApplicationDialog users={users}>
           <Button>+ Add Application</Button>
        </AddApplicationDialog>
      </div>
    </header>
  );
}
