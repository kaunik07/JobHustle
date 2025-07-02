
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
import { TrendingUp, Users, Zap } from 'lucide-react';

interface AllUsersAnalyticsProps {
  users: User[];
  applications: Application[];
}

// Define a more vibrant and distinct color palette for the trend chart
const VIBRANT_COLORS = [
    'hsl(220, 80%, 60%)', // Vibrant Blue
    'hsl(140, 70%, 50%)', // Bright Green
    'hsl(280, 80%, 60%)', // Sharp Purple
    'hsl(330, 85%, 60%)', // Hot Pink
    'hsl(190, 80%, 55%)', // Vivid Cyan
];


export function AllUsersAnalytics({ users, applications }: AllUsersAnalyticsProps) {
  // --- Pie Chart Logic ---
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

    // Corrected Logic: Count unique applications added per day based on jobUrl
    const addedPerDay = applications.reduce((acc, app) => {
        if (app.createdAt && app.jobUrl) {
            const dateKey = format(startOfDay(new Date(app.createdAt)), 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = { count: 0, urls: new Set<string>() };
            }
            if (!acc[dateKey].urls.has(app.jobUrl)) {
                acc[dateKey].urls.add(app.jobUrl);
                acc[dateKey].count += 1;
            }
        }
        return acc;
    }, {} as Record<string, { count: number; urls: Set<string> }>);

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
            'Total Added': addedPerDay[dateKey]?.count || 0,
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
        label: 'Unique Jobs Added', // Updated label for clarity
        color: VIBRANT_COLORS[0],
      },
    };
    users.forEach((user, index) => {
      config[user.id] = {
        label: `${user.firstName} Applied`,
        color: VIBRANT_COLORS[(index + 1) % VIBRANT_COLORS.length],
      };
    });
    return config;
  }, [users]);
  
  // --- User Performance Metrics Logic ---
  const userPerformanceData = React.useMemo(() => {
    return users.map(user => {
        const userApps = applications.filter(app => app.userId === user.id);

        // Metric 1: OA Conversion (Applied -> OA)
        const oaEligibleApps = userApps.filter(app => app.status !== 'Yet to Apply' && !app.oaSkipped);
        const oasReceived = oaEligibleApps.filter(app => ['OA', 'Interview', 'Offer'].includes(app.status));
        const oaConversionRate = oaEligibleApps.length > 0 ? (oasReceived.length / oaEligibleApps.length) * 100 : 0;
        
        // Metric 2: Interview Conversion (OA Completed -> Interview)
        const oasCompleted = userApps.filter(app => !!app.oaCompletedOn);
        const interviewsFromOa = oasCompleted.filter(app => ['Interview', 'Offer'].includes(app.status));
        const interviewConversionRate = oasCompleted.length > 0 ? (interviewsFromOa.length / oasCompleted.length) * 100 : 0;

        // Metric 3: Direct Interviews (Applied -> Interview, OA Skipped)
        const directInterviews = userApps.filter(app => app.oaSkipped && ['Interview', 'Offer'].includes(app.status)).length;
        
        return {
            user,
            hasData: oaEligibleApps.length > 0 || oasCompleted.length > 0 || directInterviews > 0,
            stats: {
                oaConversion: {
                    rate: oaConversionRate,
                    applied: oaEligibleApps.length,
                    oas: oasReceived.length
                },
                interviewConversion: {
                    rate: interviewConversionRate,
                    completed: oasCompleted.length,
                    interviews: interviewsFromOa.length
                },
                directInterviews: {
                    count: directInterviews
                }
            }
        };
    }).filter(data => data.hasData); // Only include users with some data to show
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
                      labelLine={false}
                      label={({ value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="hsl(var(--primary-foreground))"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-base font-bold"
                          >
                            {value}
                          </text>
                        );
                      }}
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
                <CardDescription>Unique jobs added vs. applications applied in the last 30 days.</CardDescription>
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
        <h3 className="text-xl font-bold tracking-tight">User Performance Metrics</h3>
        {userPerformanceData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userPerformanceData.map(({ user, stats }) => (
              <Card key={user.id} className="bg-card/50">
                <CardHeader className="p-4">
                  <CardTitle className="text-xl">{`${user.firstName} ${user.lastName}`.trim()}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Card className="group relative aspect-square overflow-hidden rounded-lg transition-all duration-300 ease-in-out hover:shadow-xl">
                        <div className="flex h-full flex-col p-4 transition-all duration-300 group-hover:scale-105">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium">OA Conversion</p>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-1 items-center justify-center">
                            <p className="text-4xl font-bold">{stats.oaConversion.rate.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-card/80 p-4 text-center backdrop-blur-sm transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                          <p className="text-sm text-card-foreground">
                            {stats.oaConversion.oas} OAs from {stats.oaConversion.applied} eligible apps
                          </p>
                        </div>
                      </Card>

                      <Card className="group relative aspect-square overflow-hidden rounded-lg transition-all duration-300 ease-in-out hover:shadow-xl">
                        <div className="flex h-full flex-col p-4 transition-all duration-300 group-hover:scale-105">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium">Interview Conversion</p>
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-1 items-center justify-center">
                            <p className="text-4xl font-bold">{stats.interviewConversion.rate.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-card/80 p-4 text-center backdrop-blur-sm transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                          <p className="text-sm text-card-foreground">
                            {stats.interviewConversion.interviews} interviews from {stats.interviewConversion.completed} completed OAs
                          </p>
                        </div>
                      </Card>
                      
                      <Card className="group relative aspect-square overflow-hidden rounded-lg transition-all duration-300 ease-in-out hover:shadow-xl">
                        <div className="flex h-full flex-col p-4 transition-all duration-300 group-hover:scale-105">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium">Direct Interviews</p>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-1 items-center justify-center">
                            <p className="text-4xl font-bold">{stats.directInterviews.count}</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center bg-card/80 p-4 text-center backdrop-blur-sm transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                          <p className="text-sm text-card-foreground">
                            Applications that skipped OA stage
                          </p>
                        </div>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex h-24 w-full items-center justify-center rounded-lg border-2 border-dashed p-4">
            <p className="text-sm text-muted-foreground">No application data available to calculate performance metrics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
