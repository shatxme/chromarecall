import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("colormemorygame");
    const collection = db.collection("scores");

    const highestScore = await collection
      .find({ userId: userId })
      .sort({ score: -1 })
      .limit(1)
      .toArray();

    if (highestScore.length > 0) {
      return NextResponse.json({ highestScore: highestScore[0].score });
    } else {
      return NextResponse.json({ highestScore: 0 });
    }
  } catch (error) {
    console.error('Error fetching user score:', error);
    return NextResponse.json({ message: 'Error fetching user score', error: String(error) }, { status: 500 });
  }
}