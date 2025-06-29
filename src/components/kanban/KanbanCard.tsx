
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Application } from '@/lib/types';
import { ApplicationDetailsDialog } from '@/components/applications/ApplicationDetailsDialog';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

interface KanbanCardProps {
  application: Application;
  onApplicationUpdate: (appId: string, data: Partial<Application>) => void;
}

export function KanbanCard({ application, onApplicationUpdate }: KanbanCardProps) {
  const companyDomain = application.companyName.toLowerCase().replace(/[^a-z0-9]/gi, '') + '.com';

  const renderDate = () => {
    if (application.dueDate && ['OA', 'Interview'].includes(application.status)) {
        return `Due ${format(new Date(application.dueDate), "MMM d")}`;
    }
    if (application.appliedOn) {
        return `Applied ${format(new Date(application.appliedOn), "MMM d")}`;
    }
    return 'Added Today';
  }

  return (
    <ApplicationDetailsDialog application={application} onApplicationUpdate={onApplicationUpdate}>
      <Card className="cursor-pointer transition-shadow hover:shadow-lg">
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
          
          <Badge variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
            {application.category}
          </Badge>
          
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
