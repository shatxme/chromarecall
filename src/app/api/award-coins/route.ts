import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { username, selectionTime, maxSelectionTime, idempotencyKey = uuidv4() } = await request.json();

    if (!username || typeof selectionTime !== 'number' || typeof maxSelectionTime !== 'number') {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Check if this request has already been processed
    const existingAward = await db.collection('coinAwards').findOne({ idempotencyKey });
    if (existingAward) {
      return NextResponse.json({ 
        message: 'Coins already awarded', 
        awardedCoins: existingAward.awardedCoins,
        totalCoins: existingAward.totalCoins
      });
    }

    // Calculate coins based on selection speed
    const speedFactor = 1 - (selectionTime / maxSelectionTime);
    const baseCoins = 10; // Minimum coins awarded
    const maxSpeedBonus = 40; // Maximum additional coins for speed
    const awardedCoins = Math.round(baseCoins + (speedFactor * maxSpeedBonus));

    // Try to find the user, if not found, create a new user
    const user = await db.collection('users').findOneAndUpdate(
      { username },
      { $inc: { coins: awardedCoins }, $setOnInsert: { highestScore: 0 } },
      { upsert: true, returnDocument: 'after' }
    );

    if (!user.value) {
      return NextResponse.json({ message: 'Failed to update or create user' }, { status: 500 });
    }

    // Record this coin award to prevent duplicates
    await db.collection('coinAwards').insertOne({
      idempotencyKey,
      username,
      awardedCoins,
      totalCoins: user.value.coins,
      timestamp: new Date()
    });

    return NextResponse.json({ 
      message: 'Coins awarded successfully', 
      awardedCoins, 
      totalCoins: user.value.coins 
    });
  } catch (error) {
    console.error('Error awarding coins:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}