'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Trophy } from 'lucide-react'

type LeaderboardEntry = {
  username: string
  score: number
  level: number
}

interface LeaderboardProps {
  currentUserId?: string
  currentUserScore?: number
}

export function Leaderboard({ currentUserId, currentUserScore }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userPlace, setUserPlace] = useState<number | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard')
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard')
        }
        const data = await response.json()
        setLeaderboard(data)

        // Calculate user's place if they have a score
        if (currentUserId && currentUserScore !== undefined) {
          const userEntry = data.find((entry: LeaderboardEntry) => entry.username === currentUserId)
          const scoreToUse = Math.max(userEntry?.score || 0, currentUserScore)
          
          // Count how many scores are higher than the user's score
          const higherScores = data.filter((entry: LeaderboardEntry) => entry.score > scoreToUse).length
          
          // User's place is the number of higher scores plus one
          const place = higherScores + 1
          setUserPlace(place)
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [currentUserId, currentUserScore])

  if (isLoading) {
    return <div>Loading leaderboard...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  const getRankStyle = (index: number) => {
    switch(index) {
      case 0: return "bg-yellow-100 text-yellow-800";
      case 1: return "bg-gray-100 text-gray-800";
      case 2: return "bg-orange-100 text-orange-800";
      default: return "";
    }
  }

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1: return <Trophy className="w-5 h-5 text-gray-500" />;
      case 2: return <Trophy className="w-5 h-5 text-orange-500" />;
      default: return null;
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Rank</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Level</TableHead>
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
              <TableCell>{entry.score}</TableCell>
              <TableCell>{entry.level}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {userPlace && (
        <div className="mt-4 text-center">
          <p className="font-semibold">Your Place: {userPlace}</p>
        </div>
      )}
    </>
  )
}