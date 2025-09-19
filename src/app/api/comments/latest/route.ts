import { NextResponse } from 'next/server';
import { Comment } from '~/lib/mongo';

export const runtime = "nodejs";

export async function GET() {
  try {
    const latestComments = await Comment.aggregate([
      {
        $lookup: {
          from: 'movies',
          localField: 'movieId',
          foreignField: '_id',
          as: 'movie'
        }
      },
      { $unwind: '$movie' },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },
      {
        $project: {
          id: '$_id',
          content: 1,
          address: 1,
          movieTitle: '$movie.title',
          moviePoster: '$movie.posterUrl',
          createdAt: 1,
          likesCount: { $size: { $ifNull: ['$likes', []] } }
        }
      }
    ]);

    return NextResponse.json({ 
      success: true, 
      comments: latestComments
    });
  } catch (error) {
    console.error('Error fetching latest comments:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}