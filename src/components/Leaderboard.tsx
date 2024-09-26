'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

type LeaderboardEntry = {
  username: string
  score: number
  level: number
}

const mockLeaderboard: LeaderboardEntry[] = [
  { username: "Player1", score: 1000, level: 10 },
  { username: "Player2", score: 900, level: 9 },
  { username: "Player3", score: 800, level: 8 },
  { username: "Player4", score: 700, level: 7 },
  { username: "Player5", score: 600, level: 6 },
]

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (process.env.NODE_ENV === 'development') {
        // Use mock data in development
        setLeaderboard(mockLeaderboard)
      } else {
        try {
          const response = await fetch('/api/leaderboard')
          if (!response.ok) {
            throw new Error('Failed to fetch leaderboard')
          }
          const data = await response.json()
          setLeaderboard(data)
        } catch (error) {
          console.error('Error fetching leaderboard:', error)
          // Fallback to mock data if there's an error
          setLeaderboard(mockLeaderboard)
        }
      }
    }

    fetchLeaderboard()
  }, [])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Level</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaderboard.map((entry, index) => (
          <TableRow key={index}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{entry.username}</TableCell>
            <TableCell>{entry.score}</TableCell>
            <TableCell>{entry.level}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}