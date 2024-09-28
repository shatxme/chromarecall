import { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { userId } = req.query

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: 'User ID is required' })
  }

  try {
    const client = await clientPromise
    const db = client.db("colormemorygame")
    const collection = db.collection("scores")

    const highestScore = await collection
      .find({ userId: userId })
      .sort({ score: -1 })
      .limit(1)
      .toArray()

    if (highestScore.length > 0) {
      res.status(200).json({ highestScore: highestScore[0].score })
    } else {
      res.status(200).json({ highestScore: 0 })
    }
  } catch (error) {
    console.error('Error fetching user score:', error)
    res.status(500).json({ message: 'Error fetching user score', error: String(error) })
  }
}