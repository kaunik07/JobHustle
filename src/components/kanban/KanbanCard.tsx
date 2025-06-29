'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Application } from '@/lib/types';
import { ApplicationDetailsDialog } from '@/components/applications/ApplicationDetailsDialog';

interface KanbanCardProps {
  application: Application;
}

export function KanbanCard({ application }: KanbanCardProps) {
  return (
    <ApplicationDetailsDialog application={application}>
      <Card className="cursor-pointer transition-colors hover:border-primary">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 rounded-lg">
              <AvatarImage data-ai-hint={`${application.companyName} logo`} src={`https://placehold.co/48x48.png`} alt={application.companyName} />
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
            <p className="text-xs text-muted-foreground">Added Today</p>
            <Badge variant="outline">{application.status}</Badge>
          </div>
        </CardContent>
      </Card>
    </ApplicationDetailsDialog>
  );
}
