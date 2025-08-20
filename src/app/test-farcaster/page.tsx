'use client';

import { useState } from 'react';
import { getFarcasterUser, getAllChannels, getChannel } from '@/lib/farcaster';

export default function TestFarcasterPage() {
  const [fid, setFid] = useState('6841');
  const [user, setUser] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGetUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await getFarcasterUser(parseInt(fid));
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testGetChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const channelsData = await getAllChannels();
      setChannels(channelsData.slice(0, 5)); // Show first 5 channels
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testGetChannel = async () => {
    setLoading(true);
    setError(null);
    try {
      const channelData = await getChannel('illustrations');
      if (channelData) {
        setChannels([channelData]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Farcaster API Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Lookup Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Test User Lookup</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              value={fid}
              onChange={(e) => setFid(e.target.value)}
              placeholder="Enter FID"
              className="border rounded px-3 py-2 flex-1"
            />
            <button
              onClick={testGetUser}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Get User'}
            </button>
          </div>
          
          {user && (
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-semibold">User Data:</h3>
              <pre className="text-sm overflow-auto">{JSON.stringify(user, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Channels Test */}
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Test Channels API</h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={testGetChannels}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Get All Channels'}
            </button>
            <button
              onClick={testGetChannel}
              disabled={loading}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Get Illustrations Channel'}
            </button>
          </div>
          
          {channels.length > 0 && (
            <div className="bg-gray-50 p-3 rounded">
              <h3 className="font-semibold">Channels Data:</h3>
              <pre className="text-sm overflow-auto">{JSON.stringify(channels, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold">Error:</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-blue-800 font-semibold">Setup Notes:</h3>
        <ul className="text-blue-700 text-sm space-y-1 mt-2">
          <li>• Make sure you have a `.env.local` file with Farcaster credentials for authenticated calls</li>
          <li>• Channel APIs work without authentication</li>
          <li>• Check browser console for authentication status</li>
          <li>• See FARCASTER_SETUP.md for detailed setup instructions</li>
        </ul>
      </div>
    </div>
  );
}
