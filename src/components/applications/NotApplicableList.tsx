
'use client';

import { KanbanCard } from "@/components/kanban/KanbanCard";
import type { Application } from "@/lib/types";
import { Slash } from "lucide-react";

interface NotApplicableListProps {
    applications: Application[];
    selectedUserId: string;
}

export function NotApplicableList({ applications, selectedUserId }: NotApplicableListProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Slash className="h-6 w-6 text-muted-foreground" />
                <h2 className="text-2xl font-bold tracking-tight">Not Applicable ({applications.length})</h2>
            </div>
            {applications.length > 0 ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {applications.map(app => (
                        <KanbanCard key={app.id} application={app} selectedUserId={selectedUserId} />
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-24 rounded-md border-2 border-dashed">
                    <p className="text-muted-foreground">No applications marked as not applicable.</p>
                </div>
            )}
        </div>
    );
}
