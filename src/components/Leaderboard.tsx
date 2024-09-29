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
  currentScore?: number;
  showOnlyUserStats?: boolean;
}

export function Leaderboard({ localUserData, currentScore, showOnlyUserStats = false }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userPlace, setUserPlace] = useState<number | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard')
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      setLeaderboard(data)
      console.log('Fetched leaderboard data:', data)

      if (localUserData) {
        // Calculate rank based on the fetched leaderboard
        const rank = data.findIndex((entry: LeaderboardEntry) => entry.score <= localUserData.highestScore) + 1
        setUserPlace(rank)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [localUserData])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard, currentScore])

  if (isLoading) {
    return <div>Loading leaderboard...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (showOnlyUserStats) {
    return (
      <div className="text-center">
        <p className="font-semibold text-lg">Your Score: {currentScore || 0}</p>
        {localUserData && (
          <>
            <p className="font-semibold text-lg">Your All-Time Highest Score: {localUserData.highestScore}</p>
            <p className="font-semibold text-lg">Your Current Place: {userPlace || 'N/A'}</p>
            {currentScore !== undefined && currentScore > localUserData.highestScore && (
              <p className="font-semibold text-lg text-green-600">New Personal Best!</p>
            )}
          </>
        )}
      </div>
    )
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
              <TableRow key={index} className={getRankStyle(index)}>
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
      {localUserData && userPlace && (
        <div className="mt-4 text-center">
          <p className="font-semibold">Your All-Time Highest Score: {localUserData.highestScore}</p>
          <p className="font-semibold">Your Current Place: {userPlace}</p>
        </div>
      )}
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