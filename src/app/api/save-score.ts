import { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '../../lib/mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, username, score, level } = req.body

    try {
      const client = await clientPromise
      const db = client.db("your_database_name")

      if (process.env.NODE_ENV === 'production') {
        await db.collection("scores").insertOne({
          userId,
          username,
          score,
          level,
          createdAt: new Date()
        })
      } else {
        console.log('Mock: Saving score', { userId, username, score, level })
      }

      res.status(200).json({ message: 'Score saved successfully' })
    } catch (error) {
      console.error('Error saving score:', error)
      res.status(500).json({ message: 'Error saving score' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}