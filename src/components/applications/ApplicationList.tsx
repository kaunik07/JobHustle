'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Application, statuses } from "@/lib/types";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import { Button } from "@/components/ui/button";
import { Maximize, Clock } from "lucide-react";

interface ApplicationListProps {
    applications: Application[];
}

export function ApplicationList({ applications }: ApplicationListProps) {
  const groupedApplications = statuses.map(status => ({
    status,
    applications: applications.filter(app => app.status === status),
  })).filter(group => group.applications.length > 0);

  return (
    <div className="space-y-4">
        <div className="flex justify-end items-center">
            <Button variant="ghost">
                <Maximize className="mr-2 h-4 w-4" />
                Expand All
            </Button>
        </div>
      <Accordion type="multiple" className="w-full space-y-4" defaultValue={statuses}>
        {groupedApplications.map(({ status, applications }) => (
            <AccordionItem value={status} key={status} className="bg-transparent border-none">
              <AccordionTrigger className="hover:no-underline p-0 mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span className="font-bold text-lg">{status}</span>
                    <span className="text-sm text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{applications.length}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {applications.map(app => (
                    <KanbanCard key={app.id} application={app} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
