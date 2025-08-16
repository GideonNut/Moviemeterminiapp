'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { constructPosterUrl } from '~/lib/tmdb';

export default function TestImagesPage() {
  const [testImages, setTestImages] = useState<Array<{
    id: string;
    title: string;
    poster_path: string;
    backdrop_path: string;
  }>>([]);

  useEffect(() => {
    // Test with some sample TMDB data
    setTestImages([
      {
        id: '1',
        title: 'Test Movie 1',
        poster_path: '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg',
        backdrop_path: '/backdrop1.jpg'
      },
      {
        id: '2',
        title: 'Test Movie 2',
        poster_path: '/poster2.jpg',
        backdrop_path: '/backdrop2.jpg'
      }
    ]);
  }, []);

  const testUrlConstruction = () => {
    console.log('🧪 Testing URL Construction...');
    testImages.forEach(movie => {
      const posterUrl = constructPosterUrl(movie.poster_path, 'w500');
      const backdropUrl = constructPosterUrl(movie.backdrop_path, 'w1280');
      
      console.log(`Movie: ${movie.title}`);
      console.log(`  Poster Path: ${movie.poster_path}`);
      console.log(`  Poster URL: ${posterUrl}`);
      console.log(`  Backdrop Path: ${movie.backdrop_path}`);
      console.log(`  Backdrop URL: ${backdropUrl}`);
      console.log('');
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-white mb-8">🧪 TMDB Image Display Test</h1>
        
        <div className="mb-8">
          <button 
            onClick={testUrlConstruction}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test URL Construction (Check Console)
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testImages.map((movie) => {
            const posterUrl = constructPosterUrl(movie.poster_path, 'w500');
            const backdropUrl = constructPosterUrl(movie.backdrop_path, 'w1280');
            
            return (
              <div key={movie.id} className="bg-[#18181B] rounded-lg p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">{movie.title}</h3>
                
                <div className="space-y-4">
                  {/* Poster Image */}
                  <div>
                    <h4 className="text-sm text-white/70 mb-2">Poster Image (w500)</h4>
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-800">
                      {posterUrl ? (
                        <Image
                          src={posterUrl}
                          alt={`${movie.title} poster`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            console.error('Poster image failed to load:', posterUrl);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Poster image loaded successfully:', posterUrl);
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-400">No poster path</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      Path: {movie.poster_path}
                    </p>
                    <p className="text-xs text-white/50">
                      URL: {posterUrl || 'undefined'}
                    </p>
                  </div>

                  {/* Backdrop Image */}
                  <div>
                    <h4 className="text-sm text-white/70 mb-2">Backdrop Image (w1280)</h4>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-800">
                      {backdropUrl ? (
                        <Image
                          src={backdropUrl}
                          alt={`${movie.title} backdrop`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            console.error('Backdrop image failed to load:', backdropUrl);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Backdrop image loaded successfully:', backdropUrl);
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-gray-400">No backdrop path</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      Path: {movie.backdrop_path}
                    </p>
                    <p className="text-xs text-white/50">
                      URL: {backdropUrl || 'undefined'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-[#18181B] rounded-lg border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">🔍 Debug Information</h2>
          <div className="space-y-2 text-sm text-white/70">
            <p>• Check the browser console for URL construction logs</p>
            <p>• Check the Network tab to see if images are being requested</p>
            <p>• Look for any CORS errors or 404 responses</p>
            <p>• Verify that TMDB_API_KEY is set in your .env.local</p>
          </div>
        </div>
      </div>
    </div>
  );
}
