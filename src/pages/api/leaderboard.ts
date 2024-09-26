import { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'
import { MongoClient } from 'mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let client: MongoClient | null = null;
  try {
    client = await clientPromise;
    const db = client.db("colormemorygame");

    if (req.method === 'GET') {
      const collection = db.collection("scores");
      const leaderboard = await collection
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();

      res.status(200).json(leaderboard);
    } else if (req.method === 'POST') {
      const { userId, username, score, level } = req.body;

      const collection = db.collection("scores");
      const result = await collection.insertOne({
        userId,
        username,
        score,
        level,
        createdAt: new Date()
      });

      res.status(201).json({ message: "Score saved successfully", id: result.insertedId });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: unknown) {
    console.error('Leaderboard API error:', error);
    res.status(500).json({ 
      message: 'Error processing leaderboard request', 
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
}