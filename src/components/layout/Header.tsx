
'use client';

import * as React from 'react';
import { Briefcase, Plus } from 'lucide-react';
import { AddApplicationDialog } from '@/components/kanban/AddApplicationDialog';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { AddUserDialog } from '../user/AddUserDialog';

interface HeaderProps {
  users: User[];
  selectedUser: string;
  onUserChange: (userId: string) => void;
}

export function Header({ users, selectedUser, onUserChange }: HeaderProps) {

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2">
        <Briefcase className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-2xl font-bold">HustleHub</h1>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        <TooltipProvider>
          <div className="flex items-center gap-2">
              {users.map(user => (
                   <Tooltip key={user.id}>
                      <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className={`rounded-full h-10 w-10 ${selectedUser === user.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`} onClick={() => onUserChange(user.id)}>
                            <Avatar className="h-10 w-10">
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>{user.name}</p>
                      </TooltipContent>
                   </Tooltip>
              ))}
          </div>
        </TooltipProvider>

        <AddUserDialog>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add User</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </AddUserDialog>
      </div>

      <div className="flex items-center gap-4">
        <AddApplicationDialog users={users}>
           <Button>+ Add Application</Button>
        </AddApplicationDialog>
      </div>
    </header>
  );
}
