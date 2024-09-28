import { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'
import { MongoClient } from 'mongodb'

// Simple in-memory cache
let leaderboardCache: any = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let client: MongoClient | null = null;
  try {
    client = await clientPromise;
    const db = client.db("colormemorygame");
    const collection = db.collection("scores");

    if (req.method === 'GET') {
      // Check if we have a valid cache
      if (leaderboardCache && Date.now() - lastCacheTime < CACHE_DURATION) {
        return res.status(200).json(leaderboardCache);
      }

      // If no valid cache, fetch from database
      const leaderboard = await collection
        .find({}, { projection: { _id: 0, userId: 0, createdAt: 0 } })
        .hint({ score: -1 })
        .limit(10)
        .toArray();

      // Update cache
      leaderboardCache = leaderboard;
      lastCacheTime = Date.now();

      res.status(200).json(leaderboard);
    } else if (req.method === 'POST') {
      const { userId, username, score, level } = req.body;

      const result = await collection.insertOne({
        userId,
        username,
        score,
        level,
        createdAt: new Date()
      });

      // Invalidate cache on new score
      leaderboardCache = null;

      const rank = await collection.countDocuments({ score: { $gt: score } });
      const isTopTen = rank < 10;

      res.status(201).json({ 
        message: "Score saved successfully", 
        id: result.insertedId,
        isTopTen
      });
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