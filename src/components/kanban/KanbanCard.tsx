'use client';

import {
  Code,
  Cpu,
  Database,
  ExternalLink,
  GitCommit,
  Sigma,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Application, ApplicationCategory } from '@/lib/types';
import Link from 'next/link';

interface KanbanCardProps {
  application: Application;
}

const categoryIcons: Record<ApplicationCategory, React.ElementType> = {
  SWE: Code,
  'SRE/Devops': GitCommit,
  Quant: Sigma,
  Systems: Cpu,
  'Data Scientist': Database,
};

export function KanbanCard({ application }: KanbanCardProps) {
  const CategoryIcon = categoryIcons[application.category] || Code;

  return (
    <Card className="transform transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="font-headline text-lg">{application.companyName}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={application.jobUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Job Posting</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>{application.jobTitle}</CardDescription>
      </CardHeader>
      <CardContent>
         <Badge variant="secondary" className="flex w-fit items-center gap-2 border border-accent/20 bg-accent/10 text-accent">
            <CategoryIcon className="h-3 w-3" />
            <span>{application.category}</span>
          </Badge>
      </CardContent>
      <CardFooter>
        {application.user && (
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={application.user.avatarUrl} alt={application.user.name} />
                  <AvatarFallback>{application.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{application.user.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
}
