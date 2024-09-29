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
}

export function Leaderboard({ currentUserId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userPlace, setUserPlace] = useState<number | null>(null)
  const [userHighestScore, setUserHighestScore] = useState<number | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard')
        if (!response.ok) {
          throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        setLeaderboard(data)

        if (currentUserId) {
          // Fetch the user's highest score
          const userScoreResponse = await fetch(`/api/user-score?userId=${currentUserId}`)
          if (userScoreResponse.ok) {
            const { highestScore } = await userScoreResponse.json()
            setUserHighestScore(highestScore)

            // Calculate user's place
            const higherScores = data.filter((entry: LeaderboardEntry) => entry.score > highestScore).length
            setUserPlace(higherScores + 1)
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [currentUserId])

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
      <Table className="w-full">
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
      {userPlace && userHighestScore !== null && (
        <div className="mt-4 text-center">
          <p className="font-semibold">Your Highest Score: {userHighestScore}</p>
          <p className="font-semibold">Your Place: {userPlace}</p>
        </div>
      )}
    </>
  )
}