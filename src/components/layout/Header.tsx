
'use client';

import * as React from 'react';
import { Briefcase, Plus, Trash2, Paperclip } from 'lucide-react';
import { AddApplicationDialog } from '@/components/kanban/AddApplicationDialog';
import type { User, Application } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { AddUserDialog } from '../user/AddUserDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getUserColor } from '@/lib/utils';
import { BulkAddDialog } from '../applications/BulkAddDialog';

interface HeaderProps {
  users: User[];
  selectedUser: string;
  onUserChange: (userId: string) => void;
  onUserRemoved: (userId: string) => void;
  allLocations: string[];
}

export function Header({ users, selectedUser, onUserChange, onUserRemoved, allLocations }: HeaderProps) {

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2">
        <Briefcase className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-2xl font-bold">JobTrackr</h1>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        <TooltipProvider>
          <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className={`rounded-full h-10 w-10 ${selectedUser === 'all' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`} onClick={() => onUserChange('all')}>
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-foreground text-background">All</AvatarFallback>
                        </Avatar>
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>All Users</p></TooltipContent>
              </Tooltip>
              {users.map(user => (
                   <Tooltip key={user.id}>
                      <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className={`rounded-full h-10 w-10 ${selectedUser === user.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`} onClick={() => onUserChange(user.id)}>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatarUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
                                <AvatarFallback className={getUserColor(user.id)}>{user.firstName.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                          <p>{`${user.firstName} ${user.lastName}`.trim()}</p>
                      </TooltipContent>
                   </Tooltip>
              ))}
          </div>
        </TooltipProvider>

        <AddUserDialog />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="rounded-full h-10 w-10" disabled={!users.some(u => u.id === selectedUser) || selectedUser === 'all'}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove Selected User</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected user and all of their applications.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onUserRemoved(selectedUser)}>
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex items-center gap-2">
        <BulkAddDialog />
        <AddApplicationDialog users={users} selectedUserId={selectedUser} allLocations={allLocations} />
      </div>
    </header>
  );
}
