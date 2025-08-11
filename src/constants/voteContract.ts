import type { Abi } from 'viem';

export const VOTE_CONTRACT_ADDRESS = "0x6d83eF793A7e82BFa20B57a60907F85c06fB8828" as `0x${string}`;
export const VOTE_CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "movieId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "voter", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "vote", "type": "bool" }
    ],
    "name": "Voted",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" }
    ],
    "name": "addMovie",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_movieId", "type": "uint256" }
    ],
    "name": "getVotes",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "movieCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "movies",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "uint256", "name": "yesVotes", "type": "uint256" },
      { "internalType": "uint256", "name": "noVotes", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_movieId", "type": "uint256" },
      { "internalType": "bool", "name": "_vote", "type": "bool" }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const satisfies Abi;