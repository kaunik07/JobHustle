
'use client';

import type { Application } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, FileText, BarChart, Users, Award, XCircle, ArrowUp } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface AnalyticsOverviewProps {
  applications: Application[];
}

export function AnalyticsOverview({ applications }: AnalyticsOverviewProps) {
  const uniqueAppsAddedToday = React.useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const todaysApps = applications.filter(app => {
      const createdAtDate = new Date(app.createdAt);
      return createdAtDate >= startOfToday;
    });

    return new Set(todaysApps.map(a => a.jobUrl)).size;
  }, [applications]);
  
  const uniqueAppsAddedYesterday = React.useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfYesterday = new Date(startOfYesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const yesterdaysApps = applications.filter(app => {
      const createdAtDate = new Date(app.createdAt);
      return createdAtDate >= startOfYesterday && createdAtDate <= endOfYesterday;
    });

    return new Set(yesterdaysApps.map(a => a.jobUrl)).size;
  }, [applications]);

  const stats = React.useMemo(() => {
    const now = new Date();
    const uniqueApplications = new Set(applications.map(a => a.jobUrl)).size;
    
    const oaApplications = applications.filter(app => app.status === 'OA');
    const notCompletedOas = oaApplications.filter(app => !app.oaCompletedOn);

    const missedOaCount = notCompletedOas.filter(
      app => app.oaDueDate && new Date(app.oaDueDate) < now
    ).length;
    
    const dueOaCount = notCompletedOas.length - missedOaCount;
    const completedOaCount = oaApplications.length - notCompletedOas.length;

    return {
      unique: uniqueApplications,
      total: applications.length,
      'Yet to Apply': applications.filter(a => a.status === 'Yet to Apply').length,
      Applied: applications.filter(a => a.status === 'Applied').length,
      OA: { due: dueOaCount, completed: completedOaCount, missed: missedOaCount },
      Interview: applications.filter(a => a.status === 'Interview').length,
      Offer: applications.filter(a => a.status === 'Offer').length,
      Rejected: applications.filter(a => a.status === 'Rejected').length,
      Missed: applications.filter(a => a.status === 'Missed').length,
    };
  }, [applications]);

  const statItems = [
    { title: 'Total Applications', value: stats.unique, icon: Package, color: 'text-foreground' },
    { title: 'Yet to Apply', value: stats['Yet to Apply'], icon: Clock, color: 'text-muted-foreground' },
    { title: 'Applied', value: stats.Applied, icon: FileText, color: 'text-primary' },
    { title: 'OA', value: stats.OA, icon: BarChart, color: 'text-chart-4' },
    { title: 'Interview', value: stats.Interview, icon: Users, color: 'text-chart-1' },
    { title: 'Offers', value: stats.Offer, icon: Award, color: 'text-chart-2' },
    { title: 'Rejections & Misses', value: { rejected: stats.Rejected, missed: stats.Missed }, icon: XCircle, color: 'text-muted-foreground' },
  ];

  const firstItem = statItems[0];
  const otherItems = statItems.slice(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* First item spanning two rows */}
      <Card key={firstItem.title} className="lg:row-span-2 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{firstItem.title}</CardTitle>
          <firstItem.icon className={`h-4 w-4 ${firstItem.color}`} />
        </CardHeader>
        <CardContent className="flex flex-1 flex-col items-center justify-center gap-1">
          <div className="flex items-baseline gap-4">
            <div className="text-6xl font-bold">{firstItem.value}</div>
            <div className={cn(
                "flex items-center gap-1 text-sm font-semibold",
                uniqueAppsAddedToday > 0 ? "text-chart-4" : "text-muted-foreground"
            )}>
              {uniqueAppsAddedToday > 0 ? <ArrowUp className="h-4 w-4" /> : null}
              <span>
                {uniqueAppsAddedToday > 0 ? `+${uniqueAppsAddedToday}` : uniqueAppsAddedToday}
              </span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {uniqueAppsAddedYesterday} yesterday
          </p>
        </CardContent>
      </Card>
      
      {/* Other items */}
      {otherItems.map(item => {
        if (typeof item.value === 'object') {
            return (
                <Card key={item.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                    </CardHeader>
                    <CardContent className="pt-2">
                        {'due' in item.value ? (
                            <div className="flex items-center justify-around">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{item.value.due}</div>
                                    <p className="text-xs text-muted-foreground">Due</p>
                                </div>
                                <div className="text-2xl font-light text-muted-foreground">|</div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{item.value.completed}</div>
                                    <p className="text-xs text-muted-foreground">Completed</p>
                                </div>
                                <div className="text-2xl font-light text-muted-foreground">|</div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-destructive">{item.value.missed}</div>
                                    <p className="text-xs text-muted-foreground">Missed</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-around">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-500">{item.value.rejected}</div>
                                    <p className="text-xs text-muted-foreground">Rejected</p>
                                </div>
                                <div className="text-2xl font-light text-muted-foreground">|</div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-destructive">{item.value.missed}</div>
                                    <p className="text-xs text-muted-foreground">Missed</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        }
        return (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value as number}</div>
          </CardContent>
        </Card>
      )})}
    </div>
  );
}
