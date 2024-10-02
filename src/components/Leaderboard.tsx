'use client'

import { useEffect, useState, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Trophy } from 'lucide-react'
import type { LocalUserData } from "../types"

type LeaderboardEntry = {
  username: string
  score: number
  level: number
}

interface LeaderboardProps {
  localUserData: LocalUserData | null;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export function Leaderboard({ localUserData, isLoading, setIsLoading }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard')
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      setLeaderboard(data.leaderboard)
      
      if (localUserData) {
        const userEntry = data.leaderboard.find((entry: LeaderboardEntry) => entry.username === localUserData.username)
        if (userEntry && userEntry.score > localUserData.highestScore) {
          const updatedUserData = { ...localUserData, highestScore: userEntry.score }
          localStorage.setItem('userData', JSON.stringify(updatedUserData))
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [localUserData, setIsLoading])

  useEffect(() => {
    if (isLoading) {
      fetchLeaderboard()
    }
  }, [fetchLeaderboard, isLoading])

  if (isLoading) {
    return <div>Loading leaderboard...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
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
            {leaderboard.map((entry, index) => (
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
            ))}
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