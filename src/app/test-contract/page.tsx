"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/Button";
import Header from "~/components/navigation/Header";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

interface ContractMovie {
  id: number;
  contractId?: string;
  title?: string;
  yesVotes?: string;
  noVotes?: string;
  getVotesYes?: string;
  getVotesNo?: string;
  error?: string;
}

interface ContractTestResult {
  success: boolean;
  contractAddress: string;
  chainId: number;
  chainName: string;
  movieCount: string;
  contractMovies: ContractMovie[];
  message: string;
}

export default function TestContractPage() {
  const [testResult, setTestResult] = useState<ContractTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testContract = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-contract');
      const data = await response.json();
      
      if (data.success) {
        setTestResult(data);
      } else {
        setError(data.error || 'Failed to test contract');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testContract();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4">
      <Header showSearch={false} />
      
      <div className="mt-10 mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Smart Contract Test</h1>
        <p className="text-white/60">Check what movies exist on the voting smart contract</p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={testContract} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Testing...' : 'Test Contract'}
        </Button>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={20} />
              <span>Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {testResult && (
        <div className="space-y-6">
          {/* Contract Info */}
          <Card className="bg-[#18181B] border-white/10">
            <CardContent className="p-6">
              <CardTitle className="text-white mb-4">Contract Information</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/60">Address:</span>
                  <span className="text-white ml-2 font-mono">{testResult.contractAddress}</span>
                </div>
                <div>
                  <span className="text-white/60">Chain:</span>
                  <span className="text-white ml-2">{testResult.chainName} (ID: {testResult.chainId})</span>
                </div>
                <div>
                  <span className="text-white/60">Total Movies:</span>
                  <span className="text-white ml-2">{testResult.movieCount}</span>
                </div>
                <div>
                  <span className="text-white/60">Status:</span>
                  <span className="text-green-400 ml-2 flex items-center gap-1">
                    <CheckCircle size={16} />
                    Connected
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movies List */}
          <Card className="bg-[#18181B] border-white/10">
            <CardContent className="p-6">
              <CardTitle className="text-white mb-4">Movies on Contract</CardTitle>
              
              {testResult.contractMovies.length === 0 ? (
                <p className="text-white/60">No movies found on the contract</p>
              ) : (
                <div className="space-y-3">
                  {testResult.contractMovies.map((movie) => (
                    <div key={movie.id} className="p-3 border border-white/10 rounded-lg">
                      {movie.error ? (
                        <div className="text-red-400 text-sm">
                          <span className="font-medium">ID {movie.id}:</span> {movie.error}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">ID:</span>
                            <span className="text-white ml-2">{movie.id} (Contract: {movie.contractId})</span>
                          </div>
                          <div>
                            <span className="text-white/60">Title:</span>
                            <span className="text-white ml-2">{movie.title}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Votes:</span>
                            <span className="text-white ml-2">
                              Yes: {movie.yesVotes} | No: {movie.noVotes}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
