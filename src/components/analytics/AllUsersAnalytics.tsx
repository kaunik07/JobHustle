'use client';

import * as React from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
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

interface AllUsersAnalyticsProps {
  users: User[];
  applications: Application[]; // These are already filtered for 'Yet to Apply'
}

export function AllUsersAnalytics({ users, applications }: AllUsersAnalyticsProps) {
  const dataByUser = React.useMemo(() => {
    return users.map(user => ({
      user: `${user.firstName} ${user.lastName}`.trim(),
      count: applications.filter(app => app.userId === user.id).length,
      userId: user.id
    })).filter(d => d.count > 0);
  }, [users, applications]);

  const totalYetToApply = applications.length;

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    dataByUser.forEach((data, index) => {
      config[data.userId] = {
        label: data.user,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
  }, [dataByUser]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight">To Apply Analytics</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Applications to Apply by User</CardTitle>
            <CardDescription>
              A total of {totalYetToApply} applications are pending across {dataByUser.length} user(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            {totalYetToApply > 0 ? (
              <ChartContainer
                config={chartConfig}
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
                          fill={chartConfig[entry.userId]?.color}
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
      </div>
    </div>
  );
}
