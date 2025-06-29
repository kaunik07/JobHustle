'use client';

import * as React from 'react';
import { Briefcase, User as UserIcon } from 'lucide-react';
import { AddApplicationDialog } from '@/components/kanban/AddApplicationDialog';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';

interface HeaderProps {
  users: User[];
}

export function Header({ users }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2">
        <Briefcase className="h-6 w-6 text-primary" />
        <h1 className="font-headline text-2xl font-semibold">JobTrackr</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <AddApplicationDialog users={users}>
           <Button>Add Application</Button>
        </AddApplicationDialog>
        <Avatar>
            <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" />
            <AvatarFallback>
                <UserIcon />
            </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
