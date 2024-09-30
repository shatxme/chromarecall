import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { MongoClient, Collection, Document } from 'mongodb';

// Define the LeaderboardEntry type
interface LeaderboardEntry {
  username: string;
  score: number;
  level: number;
}

let leaderboardCache: LeaderboardEntry[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

export async function GET() {
  // Remove the 'request' parameter as it's not being used
  let client: MongoClient | null = null;
  try {
    client = await clientPromise;
    const db = client.db("colormemorygame");
    const collection = db.collection("scores");

    // Check if we have a valid cache
    if (leaderboardCache && Date.now() - lastCacheTime < CACHE_DURATION) {
      return NextResponse.json({ leaderboard: leaderboardCache });
    }

    // If no cache or cache is stale, fetch from database
    const leaderboard = await fetchLeaderboard(collection);
    
    // Update cache
    leaderboardCache = leaderboard;
    lastCacheTime = Date.now();

    return NextResponse.json({ leaderboard });
  } catch (error: unknown) {
    return NextResponse.json({ 
      message: 'Error processing leaderboard request', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function fetchLeaderboard(collection: Collection<Document>): Promise<LeaderboardEntry[]> {
  const leaderboardData = await collection
    .aggregate([
      { $sort: { score: -1 } },
      { $group: { 
        _id: "$username", 
        score: { $max: "$score" },
        level: { $first: "$level" }
      }},
      { $sort: { score: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, username: "$_id", score: 1, level: 1 } }
    ])
    .toArray();

  console.log('Fetched leaderboard data:', leaderboardData);

  return leaderboardData as LeaderboardEntry[];
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("colormemorygame");
    const collection = db.collection("scores");

    const { username, score, level } = await request.json();

    // Insert new score entry
    await collection.insertOne({
      username,
      score,
      level,
      createdAt: new Date()
    });

    // Invalidate cache on new score
    leaderboardCache = null;

    // Get the user's highest score
    const highestScore = await collection.find({ username })
      .sort({ score: -1 })
      .limit(1)
      .toArray();

    return NextResponse.json({ 
      message: "Score saved successfully", 
      highestScore: highestScore[0]?.score || score,
    }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ 
      message: 'Error saving score', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}