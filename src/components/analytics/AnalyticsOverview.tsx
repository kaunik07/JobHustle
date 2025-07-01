'use client';

import type { Application } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Clock, FileText, BarChart, Users, Award, XCircle } from 'lucide-react';

interface AnalyticsOverviewProps {
  applications: Application[];
}

export function AnalyticsOverview({ applications }: AnalyticsOverviewProps) {
  const stats = {
    total: applications.length,
    'Yet to Apply': applications.filter(a => a.status === 'Yet to Apply').length,
    Applied: applications.filter(a => a.status === 'Applied').length,
    OA: applications.filter(a => a.status === 'OA').length,
    Interview: applications.filter(a => a.status === 'Interview').length,
    Offer: applications.filter(a => a.status === 'Offer').length,
    Rejected: applications.filter(a => a.status === 'Rejected').length,
  };

  const statItems = [
    { title: 'Total', value: stats.total, icon: Briefcase, color: 'text-primary' },
    { title: 'Yet to Apply', value: stats['Yet to Apply'], icon: Clock, color: 'text-muted-foreground' },
    { title: 'Applied', value: stats.Applied, icon: FileText, color: 'text-primary' },
    { title: 'OA', value: stats.OA, icon: BarChart, color: 'text-chart-4' },
    { title: 'Interview', value: stats.Interview, icon: Users, color: 'text-chart-1' },
    { title: 'Offers', value: stats.Offer, icon: Award, color: 'text-chart-2' },
    { title: 'Rejected', value: stats.Rejected, icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
      {statItems.map(item => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
