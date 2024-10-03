'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Trophy } from 'lucide-react'
import type { LocalUserData } from "../types"
import useSWR from 'swr'
import { Skeleton } from "@/components/ui/skeleton"

type LeaderboardEntry = {
  username: string
  score: number
  level: number
}

interface LeaderboardProps {
  localUserData: LocalUserData | null;
  isLoading: boolean;  // Add this back
  setIsLoading: (isLoading: boolean) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function Leaderboard({ localUserData, isLoading, setIsLoading }: LeaderboardProps) {
  const { data, error } = useSWR<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const [optimisticLeaderboard, setOptimisticLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (data) {
      setOptimisticLeaderboard(data.leaderboard);
      setIsLoading(false);
    }
  }, [data, setIsLoading]);

  useEffect(() => {
    if (localUserData) {
      setOptimisticLeaderboard((prevLeaderboard) => {
        const userIndex = prevLeaderboard.findIndex((entry) => entry.username === localUserData.username);
        if (userIndex === -1 && localUserData.highestScore > 0) {
          // Add user to leaderboard if they're not there
          const newLeaderboard = [...prevLeaderboard, { username: localUserData.username, score: localUserData.highestScore, level: 0 }];
          return newLeaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
        } else if (userIndex !== -1 && localUserData.highestScore > prevLeaderboard[userIndex].score) {
          // Update user's score if it's higher
          const newLeaderboard = [...prevLeaderboard];
          newLeaderboard[userIndex] = { ...newLeaderboard[userIndex], score: localUserData.highestScore };
          return newLeaderboard.sort((a, b) => b.score - a.score);
        }
        return prevLeaderboard;
      });
    }
  }, [localUserData]);

  if (error) {
    return <div>Error loading leaderboard</div>;
  }

  return (
    <div className="overflow-x-hidden">
      <div className="overflow-x-auto max-w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] sm:w-[100px]">Rank</TableHead>
              <TableHead>Username</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading || !data ? (
              // Skeleton loader
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              optimisticLeaderboard.map((entry, index) => (
                <TableRow key={entry.username} className={getRankStyle(index)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(index)}
                      <span>{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell>{entry.username}</TableCell>
                  <TableCell className="text-right">{entry.score}</TableCell>
                  <TableCell className="text-right">{entry.level}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function getRankStyle(index: number): string {
  switch (index) {
    case 0: return 'bg-yellow-100'
    case 1: return 'bg-gray-100'
    case 2: return 'bg-orange-100'
    default: return ''
  }
}

function getRankIcon(index: number) {
  switch (index) {
    case 0: return <Trophy className="h-5 w-5 text-yellow-500" />
    case 1: return <Trophy className="h-5 w-5 text-gray-500" />
    case 2: return <Trophy className="h-5 w-5 text-orange-500" />
    default: return null
  }
}