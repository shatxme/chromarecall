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

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');
  
  let client: MongoClient | null = null;
  try {
    client = await clientPromise;
    const db = client.db("colormemorygame");
    const collection = db.collection("scores");

    // Check if we have a valid cache
    if (leaderboardCache && Date.now() - lastCacheTime < CACHE_DURATION) {
      const userRank = username ? await getUserRank(collection, username) : null;
      return NextResponse.json({ leaderboard: leaderboardCache, userRank });
    }

    // If no cache or cache is stale, fetch from database
    const leaderboard = await fetchLeaderboard(collection);
    
    // Update cache
    leaderboardCache = leaderboard;
    lastCacheTime = Date.now();

    const userRank = username ? await getUserRank(collection, username) : null;

    return NextResponse.json({ leaderboard, userRank });
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

async function getUserRank(collection: Collection<Document>, username: string): Promise<number> {
  const userScore = await collection.findOne({ username }, { sort: { score: -1 }, projection: { score: 1 } });
  if (!userScore) return 0;

  const rank = await collection.countDocuments({ score: { $gt: userScore.score } });
  return rank + 1;
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

    // Calculate the user's rank based on their highest score
    const rank = await collection.countDocuments({ 
      $or: [
        { score: { $gt: score } },
        { score: score, username: { $lt: username } }
      ]
    }) + 1;
    const isTopTen = rank <= 10;

    // Get the user's highest score
    const highestScore = await collection.find({ username })
      .sort({ score: -1 })
      .limit(1)
      .toArray();

    return NextResponse.json({ 
      message: "Score saved successfully", 
      highestScore: highestScore[0]?.score || score,
      isTopTen,
      rank: rank
    }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ 
      message: 'Error saving score', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}