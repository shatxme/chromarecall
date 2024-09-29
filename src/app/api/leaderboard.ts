import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { MongoClient, WithId, Document } from 'mongodb';

// Define the LeaderboardEntry type
interface LeaderboardEntry {
  username: string;
  score: number;
  level: number;
}

// Replace 'any' with a more specific type
let leaderboardCache: LeaderboardEntry[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  try {
    client = await clientPromise;
    const db = client.db("colormemorygame");
    const collection = db.collection("scores");

    // Check if we have a valid cache
    if (leaderboardCache && Date.now() - lastCacheTime < CACHE_DURATION) {
      return NextResponse.json(leaderboardCache);
    }

    // If no valid cache, fetch from database
    const leaderboardData = await collection
      .find({}, { projection: { _id: 0, userId: 0, createdAt: 0 } })
      .sort({ score: -1 })
      .limit(10)
      .toArray();

    // Transform the data to match LeaderboardEntry type
    const leaderboard: LeaderboardEntry[] = leaderboardData.map((entry: WithId<Document>) => ({
      username: entry.username as string,
      score: entry.score as number,
      level: entry.level as number
    }));

    // Update cache
    leaderboardCache = leaderboard;
    lastCacheTime = Date.now();

    return NextResponse.json(leaderboard);
  } catch (error: unknown) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ 
      message: 'Error processing leaderboard request', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("colormemorygame");
    const collection = db.collection("scores");

    const { userId, username, score, level } = await request.json();

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

    return NextResponse.json({ 
      message: "Score saved successfully", 
      id: result.insertedId,
      isTopTen
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Save score API error:', error);
    return NextResponse.json({ 
      message: 'Error saving score', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}