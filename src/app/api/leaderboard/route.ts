import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { MongoClient, Collection, Document } from 'mongodb';
import { cache } from 'react';

// Define the LeaderboardEntry type
interface LeaderboardEntry {
  username: string;
  score: number;
  level: number;
}

let leaderboardCache: LeaderboardEntry[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

const getLeaderboard = cache(async () => {
  let client: MongoClient | null = null;
  try {
    client = await clientPromise;
    const db = client.db("colormemorygame");
    const collection = db.collection("scores");

    // Check if we have a valid cache
    if (leaderboardCache && Date.now() - lastCacheTime < CACHE_DURATION) {
      return leaderboardCache;
    }

    // If no cache or cache is stale, fetch from database
    const leaderboard = await fetchLeaderboard(collection);
    
    // Update cache
    leaderboardCache = leaderboard;
    lastCacheTime = Date.now();

    return leaderboard;
  } catch (error: unknown) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
});

export async function GET() {
  const leaderboard = await getLeaderboard();
  return NextResponse.json({ leaderboard });
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

async function isScoreInTop10(collection: Collection<Document>, score: number): Promise<boolean> {
  const topScores = await collection
    .find()
    .sort({ score: -1 })
    .limit(10)
    .toArray();

  if (topScores.length < 10) {
    return true; // If we have less than 10 scores, any new score is in the top 10
  }

  const lowestTopScore = topScores[topScores.length - 1].score;
  return score > lowestTopScore;
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("colormemorygame");
    const collection = db.collection("scores");

    const { username, score, level } = await request.json();

    // Find the existing document for this user
    const existingScore = await collection.findOne({ username });

    if (!existingScore || score > existingScore.score) {
      // If no existing score or new score is higher, update or insert
      await collection.updateOne(
        { username },
        { $set: { username, score, level, updatedAt: new Date() } },
        { upsert: true }
      );

      // Invalidate cache on new top score
      leaderboardCache = null;

      return NextResponse.json({ 
        message: "New high score saved successfully", 
        highestScore: score,
        isTop10: true
      }, { status: 201 });
    } else {
      // If the new score is not higher, don't update the database
      return NextResponse.json({ 
        message: "Score not saved - not higher than existing score", 
        highestScore: existingScore.score,
        isTop10: false
      }, { status: 200 });
    }
  } catch (error: unknown) {
    return NextResponse.json({ 
      message: 'Error processing score', 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}