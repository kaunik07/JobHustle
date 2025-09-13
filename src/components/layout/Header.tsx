
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Briefcase, Plus, Trash2, Paperclip, Pencil, Download, LogOut, Users } from 'lucide-react';
import { AddApplicationDialog } from '@/components/kanban/AddApplicationDialog';
import type { User, Application, Session } from '@/lib/types';
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
import { EditUserDialog } from '../user/EditUserDialog';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { logout } from '@/app/auth/actions';
import { cn } from '@/lib/utils';

interface HeaderProps {
  session: Session;
  users: User[];
  selectedUser: string;
  onUserChange?: (userId: string) => void;
  onUserRemoved?: (userId: string) => void;
  allLocations: string[];
  applications: Application[];
}

export function Header({ session, users, selectedUser, onUserChange, onUserRemoved, allLocations, applications }: HeaderProps) {
  const selectedUserDetails = users.find(u => u.id === selectedUser);
  const loggedInUsername = session.user?.username.toLowerCase();
  const isAdmin = loggedInUsername === 'admin';
  const isManvi = loggedInUsername === 'manvi';
  const isKaunik = loggedInUsername === 'kaunik';


  const handleExport = () => {
    const dataToExport = applications.map(app => {
        const baseData: Record<string, any> = {
          companyName: app.companyName,
          jobTitle: app.jobTitle,
          locations: app.locations.join(', '),
          status: app.status,
          jobUrl: app.jobUrl,
          appliedOn: app.appliedOn ? format(new Date(app.appliedOn), 'yyyy-MM-dd') : '',
          oaDueDate: app.oaDueDate ? format(new Date(app.oaDueDate), 'yyyy-MM-dd') : '',
          oaCompletedOn: app.oaCompletedOn ? format(new Date(app.oaCompletedOn), 'yyyy-MM-dd') : '',
          notes: app.notes,
          category: app.category,
          type: app.type,
          workArrangement: app.workArrangement,
          appliedBy: `${app.user?.firstName || ''} ${app.user?.lastName || ''}`.trim(),
        };

        // Add interview dates dynamically
        for (let i = 1; i <= 10; i++) {
            const dateKey = `interviewDate${i}` as keyof Application;
            const interviewDate = app[dateKey] as Date | null | undefined;
            baseData[`interviewDate${i}`] = interviewDate ? format(new Date(interviewDate), 'yyyy-MM-dd') : '';
        }

        return baseData;
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const userName = selectedUserDetails ? `${selectedUserDetails.firstName}_${selectedUserDetails.lastName}` : 'all_users';
    link.setAttribute('download', `applications_${userName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const usersToShow = React.useMemo(() => {
    if (isAdmin) {
      // Admin sees all users except itself in the selectable list
      return users.filter(u => u.username.toLowerCase() !== 'admin');
    }
    if (isKaunik || isManvi) {
      return users.filter(u => ['kaunik', 'manvi'].includes(u.username.toLowerCase()));
    }
    // Standard user
    return users.filter(u => u.id === session.user?.id);
  }, [users, isAdmin, isKaunik, isManvi, session.user?.id]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
      <Link href="/" className="flex items-center gap-2 text-foreground no-underline">
        <Briefcase className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-2xl font-bold">JobTrackr</h1>
      </Link>
      
      <div className="flex items-center gap-2 ml-auto">
        <TooltipProvider>
          <div className="flex items-center gap-2">
              {isAdmin && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn('rounded-full h-10 w-10', selectedUser === 'all' && 'ring-2 ring-primary ring-offset-2 ring-offset-background')} onClick={() => onUserChange?.('all')} disabled={!onUserChange}>
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-foreground text-background text-xs font-bold">Admin</AvatarFallback>
                            </Avatar>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>All Users</p></TooltipContent>
                </Tooltip>
              )}
               {(isKaunik || isManvi) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'rounded-full h-10 w-10',
                        selectedUser === 'kaunik-and-manvi' && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      )}
                      onClick={() => onUserChange?.('kaunik-and-manvi')}
                      disabled={!onUserChange}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-foreground text-background">
                            <Users className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Combined View</p></TooltipContent>
                </Tooltip>
              )}
              {usersToShow.map(user => (
                   <Tooltip key={user.id}>
                      <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className={cn('rounded-full h-10 w-10', selectedUser === user.id && 'ring-2 ring-primary ring-offset-2 ring-offset-background')} onClick={() => onUserChange?.(user.id)} disabled={!onUserChange}>
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
                )
              )}
          </div>
        </TooltipProvider>

        {isAdmin && <AddUserDialog />}

        {selectedUserDetails && isAdmin && (
          <EditUserDialog user={selectedUserDetails}>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit User</span>
            </Button>
          </EditUserDialog>
        )}

        {(isAdmin || isKaunik) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" className="rounded-full h-10 w-10" disabled={!onUserRemoved || !selectedUserDetails || selectedUserDetails.id === session.user?.id}>
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
                <AlertDialogAction onClick={() => onUserRemoved?.(selectedUser)}>
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
            <>
                <Button variant="outline" onClick={handleExport} disabled={applications.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
                </Button>
                <BulkAddDialog />
            </>
        )}
        <AddApplicationDialog users={users} selectedUserId={selectedUser} allLocations={allLocations} session={session} />
        <form action={logout}>
          <Button type="submit" variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </form>
      </div>
    </header>
  );
}

    