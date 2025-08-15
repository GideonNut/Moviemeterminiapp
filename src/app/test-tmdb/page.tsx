"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { constructTmdbImageUrl, constructPosterUrl, constructBackdropUrl } from '~/lib/tmdb';

export default function TestTmdbPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testImageUrls = () => {
    setLoading(true);
    
    // Test cases
    const tests = {
      posterPath: constructPosterUrl('/1E5baAaEse26fej7uHcjOgEE2t2.jpg', 'w500'),
      backdropPath: constructBackdropUrl('/backdrop_example.jpg', 'w1280'),
      svgPath: constructTmdbImageUrl('/logo_example.svg', 'original'),
      customSize: constructTmdbImageUrl('/1E5baAaEse26fej7uHcjOgEE2t2.jpg', 'w780'),
      nullPath: constructTmdbImageUrl(null),
      emptyPath: constructTmdbImageUrl(''),
    };

    setTestResults(tests);
    setLoading(false);
  };

  useEffect(() => {
    testImageUrls();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-white">🧪 TMDB Image URL Test</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Results */}
          <div className="bg-[#18181B] p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-white">Test Results</h2>
            
            {loading ? (
              <div className="text-white/70">Testing...</div>
            ) : testResults ? (
              <div className="space-y-3">
                {Object.entries(testResults).map(([key, value]) => (
                  <div key={key} className="p-3 bg-[#2D2D33] rounded">
                    <div className="text-sm font-medium text-white/70">{key}:</div>
                    <div className="text-sm text-white break-all">{String(value) || 'undefined'}</div>
                  </div>
                ))}
              </div>
            ) : null}
            
            <button
              onClick={testImageUrls}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Run Tests Again
            </button>
          </div>

          {/* Sample Images */}
          <div className="bg-[#18181B] p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-white">Sample Images</h2>
            
            <div className="space-y-4">
              {/* Test with a real TMDB poster path */}
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-2">Sample Poster (w500)</h3>
                <div className="relative w-32 h-48 bg-[#2D2D33] rounded overflow-hidden">
                  <Image
                    src="https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg"
                    alt="Sample Poster"
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <div className="text-xs text-white/50 mt-1">w500 size</div>
              </div>

              {/* Test with a different size */}
              <div>
                <h3 className="text-sm font-medium text-white/70 mb-2">Sample Poster (w780)</h3>
                <div className="relative w-32 h-48 bg-[#2D2D33] rounded overflow-hidden">
                  <Image
                    src="https://image.tmdb.org/t/p/w780/1E5baAaEse26fej7uHcjOgEE2t2.jpg"
                    alt="Sample Poster"
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <div className="text-xs text-white/50 mt-1">w780 size</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-[#18181B] p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-white">How to Fix TMDB Images</h2>
          
          <div className="text-white/70 space-y-2">
            <p>✅ <strong>Image URLs are now properly constructed</strong> using the correct TMDB base URL and size parameters.</p>
            <p>✅ <strong>SVG files</strong> automatically use the "original" size as recommended by TMDB.</p>
            <p>✅ <strong>Multiple image sizes</strong> are supported (w92, w154, w185, w342, w500, w780, w1280, original).</p>
            <p>✅ <strong>Error handling</strong> is in place for missing or invalid file paths.</p>
          </div>

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded">
            <h3 className="text-lg font-medium text-blue-400 mb-2">What Was Fixed:</h3>
            <ul className="text-blue-300 space-y-1 text-sm">
              <li>• Removed hardcoded image base URL</li>
              <li>• Added proper image URL construction functions</li>
              <li>• Added support for different image sizes</li>
              <li>• Added SVG handling for logos</li>
              <li>• Added debugging and error logging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
