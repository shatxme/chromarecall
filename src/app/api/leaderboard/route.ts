import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { MongoClient, Collection, Document } from 'mongodb';

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

export async function GET() {
  let client: MongoClient | null = null;
  try {
    client = await clientPromise;
    const db = client.db("colormemorygame");
    const collection = db.collection("scores");

    // Check if we have a valid cache
    if (leaderboardCache) {
      // Return cached data immediately
      NextResponse.json(leaderboardCache);

      // Check if cache is stale
      if (Date.now() - lastCacheTime >= CACHE_DURATION) {
        // Fetch new data in the background
        updateLeaderboardCache(collection);
      }
    } else {
      // If no cache, fetch from database
      const leaderboard = await fetchLeaderboard(collection);
      return NextResponse.json(leaderboard);
    }
  } catch (error: unknown) {
    return NextResponse.json({ 
      message: 'Error processing leaderboard request', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function fetchLeaderboard(collection: Collection<Document>) {
  const leaderboardData = await collection
    .aggregate([
      {
        $group: {
          _id: "$userId",
          username: { $first: "$username" },
          score: { $max: "$score" },
          level: { $max: "$level" }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, userId: 0 } }
    ])
    .toArray();

  return leaderboardData.map((entry: Document) => ({
    username: entry.username as string,
    score: entry.score as number,
    level: entry.level as number
  }));
}

async function updateLeaderboardCache(collection: Collection<Document>) {
  const leaderboard = await fetchLeaderboard(collection);
  leaderboardCache = leaderboard;
  lastCacheTime = Date.now();
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("colormemorygame");
    const collection = db.collection("scores");

    const { userId, username, score, level } = await request.json();

    // Insert the new score
    await collection.insertOne({
      userId,
      username,
      score,
      level,
      createdAt: new Date()
    });

    // Invalidate cache on new score
    leaderboardCache = null;

    // Get the user's highest score
    const userHighestScore = await collection
      .find({ userId: userId })
      .sort({ score: -1 })
      .limit(1)
      .toArray();

    const highestScore = userHighestScore.length > 0 ? userHighestScore[0].score : score;

    // Calculate the user's rank based on their highest score
    const rank = await collection.countDocuments({ score: { $gt: highestScore } });
    const isTopTen = rank < 10;

    return NextResponse.json({ 
      message: "Score saved successfully", 
      highestScore: highestScore,
      isTopTen,
      rank: rank + 1
    }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ 
      message: 'Error saving score', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}