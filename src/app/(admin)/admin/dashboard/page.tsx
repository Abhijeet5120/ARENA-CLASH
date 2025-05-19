// src/app/(admin)/admin/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart as BarChartRecharts, LineChart as LineChartRecharts, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Line, Tooltip as RechartsTooltip } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useAdminContext } from '@/context/AdminContext'; 
import { getAllTournaments, type Tournament } from '@/data/tournaments';
import { getAllUsers, type UserRecord } from '@/data/users'; 
import { getAllGames, type Game } from '@/data/games';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { parseISO } from 'date-fns';
import { ListChecks, CalendarDays, Archive, Users, Gamepad2, Landmark, Trophy, TrendingUp, AreaChart, LineChartIcon as LucideLineChartIcon, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';


interface TournamentsByGameData {
  gameName: string;
  count: number;
}

interface TournamentFillRateData {
  name: string;
  filled: number;
  remaining: number;
  total: number;
}

interface UserRegistrationTrendPoint {
  month: string; // YYYY-MM
  count: number;
}

const gameChartConfig = {
  count: {
    label: "Tournaments",
    color: "hsl(var(--chart-1))",
    icon: ListChecks,
  },
} satisfies ChartConfig;

const fillRateChartConfig = {
  filled: {
    label: "Filled Spots",
    color: "hsl(var(--chart-2))",
    icon: Users,
  },
  remaining: {
    label: "Remaining Spots",
    color: "hsl(var(--muted))",
    icon: Users,
  },
} satisfies ChartConfig;

const userRegistrationChartConfig = {
  count: {
    label: "New Users",
    color: "hsl(var(--chart-3))",
    icon: Users,
  },
} satisfies ChartConfig;


const parsePrizePoolValue = (prizePool: string): number => {
  if (!prizePool) return 0;
  // Try to match common currency symbols and numbers with commas/decimals
  const match = prizePool.match(/[$₹€]?\s*(\d{1,3}(,\d{3})*(\.\d{1,2})?)/);
  if (match && match[1]) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  // If no currency symbol, try to find numbers directly
  const numbers = prizePool.match(/\d+(\.\d+)?/g);
  if (numbers) {
    return numbers.reduce((sum, num) => sum + parseFloat(num), 0);
  }
  return 0;
};


export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { adminSelectedRegion } = useAdminContext(); 
  const [tournamentsData, setTournamentsData] = useState<Tournament[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [upcomingTournamentsCount, setUpcomingTournamentsCount] = useState(0);
  const [hostedTournamentsCount, setHostedTournamentsCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPrizePayout, setTotalPrizePayout] = useState(0);
  const [netRevenue, setNetRevenue] = useState(0);
  const [tournamentsByGame, setTournamentsByGame] = useState<TournamentsByGameData[]>([]);
  const [tournamentFillRate, setTournamentFillRate] = useState<TournamentFillRateData[]>([]);
  const [userRegistrationTrend, setUserRegistrationTrend] = useState<UserRegistrationTrendPoint[]>([]);
  const [supportedGamesCount, setSupportedGamesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedTournaments, allFetchedUsersPlatform, fetchedGames] = await Promise.all([
        getAllTournaments(adminSelectedRegion), 
        getAllUsers(), 
        getAllGames()
      ]);
      
      setTournamentsData(fetchedTournaments); 

      const regionalUsers = allFetchedUsersPlatform.filter(u => u.region === adminSelectedRegion);
      setTotalUsersCount(regionalUsers.length);
      
      setSupportedGamesCount(fetchedGames.length); 

      const now = new Date();
      const upcoming = fetchedTournaments.filter(t => {
        try {
          return parseISO(t.tournamentDate) > now;
        } catch (e) { return false; }
      });
      setUpcomingTournamentsCount(upcoming.length);

      const hosted = fetchedTournaments.filter(t => {
        try {
          return parseISO(t.tournamentDate) <= now; 
        } catch (e) { return false; }
      });
      setHostedTournamentsCount(hosted.length);

      let calculatedTotalRevenue = 0;
      let calculatedTotalPrizePayout = 0;
      fetchedTournaments.forEach(t => { 
        // Revenue only from tournaments in the selected admin region
        const spotsFilled = t.totalSpots - t.spotsLeft;
        calculatedTotalRevenue += spotsFilled * t.entryFee; 
        // Prize payout only for tournaments in the selected admin region
        calculatedTotalPrizePayout += parsePrizePoolValue(t.prizePool); 
      });
      setTotalRevenue(calculatedTotalRevenue);
      setTotalPrizePayout(calculatedTotalPrizePayout);
      setNetRevenue(calculatedTotalRevenue - calculatedTotalPrizePayout);

      const byGame: Record<string, number> = {};
      fetchedTournaments.forEach(t => { 
        // TournamentsByGame is for the selected region
        const gameName = fetchedGames.find(g => g.id === t.gameId)?.name || 'Unknown Game';
        byGame[gameName] = (byGame[gameName] || 0) + 1;
      });
      setTournamentsByGame(Object.entries(byGame).map(([gameName, count]) => ({ gameName, count })));
      
      const sortedUpcoming = upcoming
        .sort((a, b) => parseISO(a.tournamentDate).getTime() - parseISO(b.tournamentDate).getTime())
        .slice(0, 5); 
      
      setTournamentFillRate(sortedUpcoming.map(t => ({
        name: t.name.length > 20 ? t.name.substring(0, 17) + "..." : t.name,
        filled: t.totalSpots - t.spotsLeft,
        remaining: t.spotsLeft,
        total: t.totalSpots
      })));

      // User Registration Trend should be platform-wide
      const userTrend: Record<string, number> = {};
      allFetchedUsersPlatform.forEach(u => { 
        if (u.createdAt) {
          try {
            const date = new Date(u.createdAt);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            userTrend[monthYear] = (userTrend[monthYear] || 0) + 1;
          } catch (e) {
            console.warn("Invalid date for user during trend calculation", u.uid, u.createdAt);
          }
        }
      });
      const sortedUserTrendData = Object.entries(userTrend)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));
      setUserRegistrationTrend(sortedUserTrendData);

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load data for the dashboard.",
        variant: "destructive",
      });
      setTournamentsData([]);
      setTotalUsersCount(0);
      setUpcomingTournamentsCount(0);
      setHostedTournamentsCount(0);
      setTotalRevenue(0);
      setTotalPrizePayout(0);
      setNetRevenue(0);
      setTournamentsByGame([]);
      setTournamentFillRate([]);
      setUserRegistrationTrend([]);
      setSupportedGamesCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [toast, adminSelectedRegion]); 

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const statsItems = useMemo(() => {
    const financialCurrencyCode = adminSelectedRegion === 'INDIA' ? 'INR' : 'USD';
    
    return [
      { title: `Total Tournaments (${adminSelectedRegion})`, value: tournamentsData.length, desc: "Managed tournaments in this region", Icon: ListChecks },
      { title: `Upcoming (${adminSelectedRegion})`, value: upcomingTournamentsCount, desc: "Scheduled events in this region", Icon: CalendarDays },
      { title: `Hosted (${adminSelectedRegion})`, value: hostedTournamentsCount, desc: "Past events in this region", Icon: Archive },
      { title: `Users (${adminSelectedRegion})`, value: totalUsersCount, desc: `Users registered in ${adminSelectedRegion}`, Icon: Users },
      { title: "Supported Games", value: supportedGamesCount, desc: "Platform-wide game support", Icon: Gamepad2 },
      { title: `Revenue (${adminSelectedRegion})`, value: formatCurrency(totalRevenue, financialCurrencyCode), desc: "Gross revenue in this region", Icon: Landmark },
      { title: `Prize Payout (${adminSelectedRegion})`, value: formatCurrency(totalPrizePayout, financialCurrencyCode), desc: "Est. prizes in this region", Icon: Trophy },
      { title: `Net Revenue (${adminSelectedRegion})`, value: formatCurrency(netRevenue, financialCurrencyCode), desc: "Est. net in this region", Icon: TrendingUp },
    ];
  }, [adminSelectedRegion, tournamentsData.length, upcomingTournamentsCount, hostedTournamentsCount, totalUsersCount, supportedGamesCount, totalRevenue, totalPrizePayout, netRevenue]);


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Admin Dashboard ({adminSelectedRegion})</h1>
        <p className="text-lg text-muted-foreground">Welcome back, {user?.displayName || user?.email}!</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Spinner size="large" />
          <p className="ml-4 text-muted-foreground">Loading dashboard data for {adminSelectedRegion}...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statsItems.map((item, idx) => (
              <Card 
                key={item.title} 
                className="shadow-lg hover:shadow-primary/20 transition-all duration-300 ease-in-out transform hover:scale-105 bg-card/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 hover:bg-card/70 hover:backdrop-blur-md"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  <item.Icon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{item.value}</div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card className="shadow-xl bg-card/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300" style={{ animationDelay: `${statsItems.length * 100}ms` }}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <BarChart3 className="mr-2 h-6 w-6 text-primary" />
                  Tournaments by Game ({adminSelectedRegion})
                </CardTitle>
                <CardDescription>Distribution of tournaments across games in {adminSelectedRegion}.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] md:h-[350px]">
                {tournamentsByGame.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ChartContainer config={gameChartConfig} className="min-h-[200px] w-full">
                      <BarChartRecharts data={tournamentsByGame} layout="vertical" margin={{ right: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" dataKey="count" />
                        <YAxis dataKey="gameName" type="category" width={100} tick={{ fontSize: 12 }} />
                        <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                      </BarChartRecharts>
                    </ChartContainer>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Not enough data to display tournaments by game.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-xl bg-card/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300" style={{ animationDelay: `${(statsItems.length + 1) * 100}ms` }}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <AreaChart className="mr-2 h-6 w-6 text-primary" />
                  Upcoming Fill Rate ({adminSelectedRegion})
                </CardTitle>
                <CardDescription>Spot utilization for next 5 upcoming tournaments in {adminSelectedRegion}.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] md:h-[350px]">
                {tournamentFillRate.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ChartContainer config={fillRateChartConfig} className="min-h-[200px] w-full">
                      <BarChartRecharts data={tournamentFillRate} margin={{ top: 5, right: 5, left: 5, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" angle={-30} textAnchor="end" height={50} interval={0} tick={{ fontSize: 10 }} />
                        <YAxis />
                        <RechartsTooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Legend content={<ChartLegendContent />} />
                        <Bar dataKey="filled" stackId="a" fill="var(--color-filled)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="remaining" stackId="a" fill="var(--color-remaining)" radius={[4, 4, 0, 0]} />
                      </BarChartRecharts>
                    </ChartContainer>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Not enough data to display upcoming fill rate.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-xl bg-card/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 hover:bg-card/70 hover:backdrop-blur-md transition-all duration-300" style={{ animationDelay: `${(statsItems.length + 2) * 100}ms` }}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <LucideLineChartIcon className="mr-2 h-6 w-6 text-primary" /> 
                User Registration Trend (Platform-wide)
              </CardTitle>
              <CardDescription>New user registrations per month across all regions.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] md:h-[350px]">
              {userRegistrationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ChartContainer config={userRegistrationChartConfig} className="min-h-[200px] w-full">
                    <LineChartRecharts data={userRegistrationTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip content={<ChartTooltipContent />} />
                      <Legend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))", stroke: "hsl(var(--primary))" }} activeDot={{ r: 6, fill: "hsl(var(--primary))" }} />
                    </LineChartRecharts>
                  </ChartContainer>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Not enough data to display user registration trend.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
