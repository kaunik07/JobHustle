
'use client';

import * as React from 'react';
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import type { Application, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';

interface AllUsersAnalyticsProps {
  users: User[];
  applications: Application[];
}

export function AllUsersAnalytics({ users, applications }: AllUsersAnalyticsProps) {
  // --- Pie Chart Logic (with internal filtering) ---
  const yetToApplyApplications = React.useMemo(
    () => applications.filter((app) => app.status === 'Yet to Apply'),
    [applications]
  );

  const dataByUser = React.useMemo(() => {
    return users.map(user => ({
      user: `${user.firstName} ${user.lastName}`.trim(),
      count: yetToApplyApplications.filter(app => app.userId === user.id).length,
      userId: user.id
    })).filter(d => d.count > 0);
  }, [users, yetToApplyApplications]);

  const totalYetToApply = yetToApplyApplications.length;

  const pieChartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    dataByUser.forEach((data, index) => {
      config[data.userId] = {
        label: data.user,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
  }, [dataByUser]);

  // --- Trend Chart Logic ---
  const trendChartData = React.useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 29);
    const dateRange = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() });

    const addedPerDay = applications.reduce((acc, app) => {
        if (app.createdAt) {
            const dateKey = format(startOfDay(new Date(app.createdAt)), 'yyyy-MM-dd');
            acc[dateKey] = (acc[dateKey] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const appliedPerUserPerDay = applications.reduce((acc, app) => {
        if (app.appliedOn && app.userId) {
            const dateKey = format(startOfDay(new Date(app.appliedOn)), 'yyyy-MM-dd');
            const userDateKey = `${dateKey}_${app.userId}`;
            acc[userDateKey] = (acc[userDateKey] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    return dateRange.map(date => {
        const displayDate = format(date, 'MMM d');
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayData: Record<string, string | number> = {
            date: displayDate,
            'Total Added': addedPerDay[dateKey] || 0,
        };
        users.forEach(user => {
            const userDateKey = `${dateKey}_${user.id}`;
            dayData[user.id] = appliedPerUserPerDay[userDateKey] || 0;
        });
        return dayData;
    });
  }, [applications, users]);

  const trendChartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      'Total Added': {
        label: 'Total Added',
        color: 'hsl(var(--chart-1))',
      },
    };
    users.forEach((user, index) => {
      config[user.id] = {
        label: `${user.firstName} Applied`,
        color: `hsl(var(--chart-${(index % 4) + 2}))`, // Use chart-2 to chart-5
      };
    });
    return config;
  }, [users]);
  
  // --- Conversion Rate Logic ---
  const conversionRateData = React.useMemo(() => {
    return users.map(user => {
      const userApps = applications.filter(app => app.userId === user.id);
      
      // Exclude applications where OA was not part of the process
      const oaEligibleApps = userApps.filter(app => !app.oaSkipped);
      
      // Denominator: All eligible apps that have been submitted
      const denominator = oaEligibleApps.filter(app => app.status !== 'Yet to Apply').length;
      
      // Numerator: All eligible apps that got an OA (or better)
      const numerator = oaEligibleApps.filter(app => 
        ['OA', 'Interview', 'Offer'].includes(app.status)
      ).length;

      const percentage = denominator > 0 ? (numerator / denominator) * 100 : 0;

      return {
        user,
        eligibleCount: denominator,
        oaCount: numerator,
        percentage,
      };
    }).filter(data => data.eligibleCount > 0); // Only show users who have eligible applications
  }, [users, applications]);


  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight">All Users Analytics</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Applications to Apply</CardTitle>
            <CardDescription>
              A total of {totalYetToApply} applications are pending across {dataByUser.length} user(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            {totalYetToApply > 0 ? (
              <ChartContainer
                config={pieChartConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel nameKey="userId" />}
                    />
                    <Pie
                      data={dataByUser}
                      dataKey="count"
                      nameKey="userId"
                      innerRadius={60}
                      strokeWidth={5}
                    >
                      {dataByUser.map((entry) => (
                        <Cell
                          key={`cell-${entry.userId}`}
                          fill={pieChartConfig[entry.userId]?.color}
                          className="stroke-background"
                        />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="userId" />}
                      className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-full min-h-[300px] w-full items-center justify-center rounded-lg border-2 border-dashed p-4">
                <p className="text-sm text-muted-foreground">No pending applications to analyze.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Application Trends</CardTitle>
                <CardDescription>New applications added vs. applied in the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendChartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                allowDecimals={false}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Line
                                dataKey="Total Added"
                                type="monotone"
                                stroke="var(--color-Total Added)"
                                strokeWidth={2}
                                dot={false}
                            />
                            {users.map(user => (
                                <Line
                                    key={user.id}
                                    dataKey={user.id}
                                    type="monotone"
                                    stroke={`var(--color-${user.id})`}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight">User Conversion Rates (Applied to OA)</h3>
        {conversionRateData.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {conversionRateData.map(({ user, eligibleCount, oaCount, percentage }) => (
                <Card key={user.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{`${user.firstName} ${user.lastName}`.trim()}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{percentage.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {oaCount} OA from {eligibleCount} eligible applications
                        </p>
                    </CardContent>
                </Card>
            ))}
          </div>
        ) : (
          <div className="flex h-24 w-full items-center justify-center rounded-lg border-2 border-dashed p-4">
            <p className="text-sm text-muted-foreground">No submitted applications to calculate conversion rates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
