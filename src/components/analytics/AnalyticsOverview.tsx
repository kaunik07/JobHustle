'use client';

import type { Application } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, FileText, BarChart, Users, Award, XCircle } from 'lucide-react';
import * as React from 'react';

interface AnalyticsOverviewProps {
  applications: Application[];
}

export function AnalyticsOverview({ applications }: AnalyticsOverviewProps) {
  const stats = React.useMemo(() => {
    const uniqueApplications = new Set(applications.map(a => a.jobUrl)).size;
    return {
      unique: uniqueApplications,
      total: applications.length,
      'Yet to Apply': applications.filter(a => a.status === 'Yet to Apply').length,
      Applied: applications.filter(a => a.status === 'Applied').length,
      OA: applications.filter(a => a.status === 'OA').length,
      Interview: applications.filter(a => a.status === 'Interview').length,
      Offer: applications.filter(a => a.status === 'Offer').length,
      Rejected: applications.filter(a => a.status === 'Rejected').length,
    };
  }, [applications]);

  const statItems = [
    { title: 'Unique Applications', value: stats.unique, icon: Package, color: 'text-foreground', description: `${stats.total} Total Applications` },
    { title: 'Yet to Apply', value: stats['Yet to Apply'], icon: Clock, color: 'text-muted-foreground' },
    { title: 'Applied', value: stats.Applied, icon: FileText, color: 'text-primary' },
    { title: 'OA', value: stats.OA, icon: BarChart, color: 'text-chart-4' },
    { title: 'Interview', value: stats.Interview, icon: Users, color: 'text-chart-1' },
    { title: 'Offers', value: stats.Offer, icon: Award, color: 'text-chart-2' },
    { title: 'Rejected', value: stats.Rejected, icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map(item => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            {item.description && (
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
