'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

type LeaderboardEntry = {
  username: string
  score: number
  level: number
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to fetch leaderboard')
        }
        const data = await response.json()
        setLeaderboard(data)
      } catch (error: unknown) {
        console.error('Error fetching leaderboard:', error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (isLoading) {
    return <div>Loading leaderboard...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

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