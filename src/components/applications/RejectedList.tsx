
'use client';

import { KanbanCard } from "@/components/kanban/KanbanCard";
import type { Application } from "@/lib/types";
import { XCircle } from "lucide-react";

interface RejectedListProps {
    applications: Application[];
}

export function RejectedList({ applications }: RejectedListProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <XCircle className="h-6 w-6 text-destructive" />
                <h2 className="text-2xl font-bold tracking-tight">Rejected ({applications.length})</h2>
            </div>
            {applications.length > 0 ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {applications.map(app => (
                        <KanbanCard key={app.id} application={app} />
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-24 rounded-md border-2 border-dashed">
                    <p className="text-muted-foreground">No rejected applications yet.</p>
                </div>
            )}
        </div>
    );
}
