import { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const client = await clientPromise
      const db = client.db("colormemorygame")

      const leaderboard = await db
        .collection("scores")
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray()

      res.status(200).json(leaderboard)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      res.status(500).json({ message: 'Error fetching leaderboard' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}