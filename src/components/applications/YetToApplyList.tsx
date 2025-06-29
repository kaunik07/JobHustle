
'use client';

import { KanbanCard } from "@/components/kanban/KanbanCard";
import type { Application } from "@/lib/types";
import { FilePlus2 } from "lucide-react";

interface YetToApplyListProps {
    applications: Application[];
}

export function YetToApplyList({ applications }: YetToApplyListProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <FilePlus2 className="h-6 w-6" />
                <h2 className="text-2xl font-bold tracking-tight">To Apply ({applications.length})</h2>
            </div>
            {applications.length > 0 ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {applications.map(app => (
                        <KanbanCard key={app.id} application={app} />
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-24 rounded-md border-2 border-dashed">
                    <p className="text-muted-foreground">No applications to apply to yet.</p>
                </div>
            )}
        </div>
    );
}
