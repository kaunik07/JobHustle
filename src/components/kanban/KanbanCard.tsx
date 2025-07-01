
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Application, ApplicationCategory, ApplicationType } from '@/lib/types';
import { ApplicationDetailsDialog } from '@/components/applications/ApplicationDetailsDialog';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn, getUserColor } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KanbanCardProps {
  application: Application;
  selectedUserId: string;
}

const categoryStyles: Record<ApplicationCategory, string> = {
  'SWE': 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  'SRE/Devops': 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  'Quant': 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  'Systems': 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  'Data Scientist': 'bg-chart-5/20 text-chart-5 border-chart-5/30',
};

const applicationTypeStyles: Record<ApplicationType, string> = {
  'Full-Time': 'bg-primary/20 text-primary border-primary/30',
  'Internship': 'bg-accent/20 text-accent border-accent/30',
};

export function KanbanCard({ application, selectedUserId }: KanbanCardProps) {
  const companyDomain = application.companyName.toLowerCase().replace(/[^a-z0-9]/gi, '') + '.com';
  const { user } = application;

  const renderDate = () => {
    if (application.dueDate && ['OA', 'Interview'].includes(application.status)) {
        return `Due ${format(new Date(application.dueDate), "MMM d")}`;
    }
    if (application.appliedOn) {
        return `Applied ${format(new Date(application.appliedOn), "MMM d")}`;
    }
    if (application.createdAt) {
      const formattedDate = format(new Date(application.createdAt), "MMM d");
      if (application.status === 'Yet to Apply') {
        const timeAgo = formatDistanceToNow(new Date(application.createdAt), { addSuffix: true });
        return `Added ${formattedDate} (${timeAgo})`;
      }
      return `Added ${formattedDate}`;
    }
    return 'Added recently';
  }

  return (
    <ApplicationDetailsDialog application={application}>
      <Card className="cursor-pointer transition-shadow hover:shadow-lg relative">
        {selectedUserId === 'all' && user && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-2 right-2 z-10">
                  <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={user.avatarUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className={cn('text-xs', getUserColor(user.id))}>
                          {user.firstName?.charAt(0)}
                      </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{`${user.firstName} ${user.lastName}`.trim()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 rounded-lg">
              <AvatarImage 
                data-ai-hint={`${application.companyName} logo`} 
                src={`https://logo.clearbit.com/${companyDomain}`} 
                alt={application.companyName}
              />
              <AvatarFallback className="rounded-lg text-lg">{application.companyName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{application.companyName}</p>
              <p className="text-sm text-muted-foreground">{application.jobTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("capitalize", categoryStyles[application.category])}>
              {application.category}
            </Badge>
            <Badge variant="outline" className={cn(applicationTypeStyles[application.type])}>
              {application.type}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {renderDate()}
            </p>
            <Badge variant="outline">{application.status}</Badge>
          </div>
        </CardContent>
      </Card>
    </ApplicationDetailsDialog>
  );
}
