import { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise
    const db = client.db("colormemorygame")

    if (req.method === 'GET') {
      const leaderboard = await db
        .collection("scores")
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray()

      res.status(200).json(leaderboard)
    } else if (req.method === 'POST') {
      const { userId, username, score, level } = req.body

      const result = await db.collection("scores").insertOne({
        userId,
        username,
        score,
        level,
        createdAt: new Date()
      })

      res.status(201).json({ message: "Score saved successfully", id: result.insertedId })
    } else {
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error: unknown) {
    console.error('Leaderboard API error:', error)
    res.status(500).json({ 
      message: 'Error processing leaderboard request', 
      error: error instanceof Error ? error.message : String(error)
    })
  }
}