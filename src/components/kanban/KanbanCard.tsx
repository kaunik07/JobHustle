
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Application, ApplicationCategory, ApplicationType, ApplicationWorkArrangement } from '@/lib/types';
import { ApplicationDetailsDialog } from '@/components/applications/ApplicationDetailsDialog';
import { format, formatDistance, formatDistanceToNow } from 'date-fns';
import { Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { cn, getUserColor } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateApplication } from '@/app/actions';

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
  'Full-Time': 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  'Internship': 'bg-chart-4/20 text-chart-4 border-chart-4/30',
};

const workArrangementStyles: Record<ApplicationWorkArrangement, string> = {
  'On-site': 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  'Remote': 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  'Hybrid': 'bg-chart-4/20 text-chart-4 border-chart-4/30',
};

export function KanbanCard({ application, selectedUserId }: KanbanCardProps) {
  const companyDomain = application.companyName.toLowerCase().replace(/[^a-z0-9]/gi, '') + '.com';
  const { user } = application;
  const { toast } = useToast();

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateApplication(application.id, {
        status: 'Applied',
        appliedOn: new Date(),
      });
      toast({
        title: 'Application Updated',
        description: `Moved ${application.jobTitle} at ${application.companyName} to "Applied".`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Could not update the application. Please try again.',
      });
    }
  };

  const renderDate = () => {
    if (application.status === 'Interview') {
      const interviewDates = [
        application.interviewDate1,
        application.interviewDate2,
        application.interviewDate3,
        application.interviewDate4,
        application.interviewDate5,
        application.interviewDate6,
        application.interviewDate7,
        application.interviewDate8,
        application.interviewDate9,
        application.interviewDate10,
      ].filter((d): d is Date | string => !!d).map(d => new Date(d));

      const now = new Date();
      
      const upcomingInterviews = interviewDates
        .filter(d => d > now)
        .sort((a, b) => a.getTime() - b.getTime());

      if (upcomingInterviews.length > 0) {
        return `Next interview ${formatDistanceToNow(upcomingInterviews[0], { addSuffix: true })}`;
      }

      const pastInterviews = interviewDates.sort((a, b) => b.getTime() - a.getTime());
      if (pastInterviews.length > 0) {
        return `Last interview ${formatDistanceToNow(pastInterviews[0], { addSuffix: true })}`;
      }
    }
    
    if (application.status === 'OA') {
        if (application.oaCompletedOn) {
            const completedDate = new Date(application.oaCompletedOn);
            const now = new Date();
            const distance = formatDistance(completedDate, now);
            // If the completion date is somehow in the future, it's more like a due date.
            if (completedDate > now) {
                return `Due in ${distance}`;
            }
            return `Completed ${distance} ago`;
        }
        if (application.oaDueDate) {
            return `Due ${formatDistanceToNow(new Date(application.oaDueDate), { addSuffix: true })}`;
        }
    }
    if (application.appliedOn) {
        return `Applied ${formatDistanceToNow(new Date(application.appliedOn), { addSuffix: true })}`;
    }
    if (application.createdAt) {
        return `Added ${formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}`;
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
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 rounded-lg">
              <AvatarImage 
                data-ai-hint={`${application.companyName} logo`} 
                src={`https://logo.clearbit.com/${companyDomain}`} 
                alt={application.companyName}
              />
              <AvatarFallback className="rounded-lg text-lg">{application.companyName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">{application.companyName}</p>
              <p className="text-sm text-muted-foreground">{application.jobTitle}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                  <MapPin className="h-3 w-3" />
                  {application.location}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("capitalize", categoryStyles[application.category])}>
              {application.category}
            </Badge>
            <Badge variant="outline" className={cn(applicationTypeStyles[application.type])}>
              {application.type}
            </Badge>
            {application.workArrangement && (
              <Badge variant="outline" className={cn(workArrangementStyles[application.workArrangement])}>{application.workArrangement}</Badge>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {renderDate()}
            </p>
            <div className="flex items-center gap-1">
              <Badge variant="outline">{application.status}</Badge>
              {application.status === 'Yet to Apply' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-green-500 hover:bg-green-500/10 hover:text-green-500"
                        onClick={handleApply}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="sr-only">Mark as Applied</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Mark as Applied</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </ApplicationDetailsDialog>
  );
}
