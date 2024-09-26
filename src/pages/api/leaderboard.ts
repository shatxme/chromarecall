import { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await clientPromise
  const db = client.db('your_database_name')

  const leaderboard = await db
    .collection('scores')
    .find({})
    .sort({ score: -1 })
    .limit(10)
    .toArray()

  res.status(200).json(leaderboard)
}