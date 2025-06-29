'use client';

import * as React from 'react';
import { Briefcase } from 'lucide-react';
import { AddApplicationDialog } from '@/components/kanban/AddApplicationDialog';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '../ui/button';

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
        <h1 className="font-headline text-2xl font-bold">HustleHub</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="flex -space-x-2">
            {otherUsers.map(user => (
                 <Avatar key={user.id} className="border-2 border-background">
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
            ))}
        </div>
        {mainUser && (
            <Avatar className="ring-2 ring-primary ring-offset-2 ring-offset-background">
                <AvatarFallback>{mainUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
        )}
        <AddApplicationDialog users={users}>
           <Button>+ Add Application</Button>
        </AddApplicationDialog>
      </div>
    </header>
  );
}
