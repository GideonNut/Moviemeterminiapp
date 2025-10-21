import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createWalletClient, createPublicClient, http } from "viem";
import { celo } from "viem/chains";

async function generateWallet() {
  try {
    console.log("🔐 Generating new wallet...");
    
    // Generate a new private key
    const privateKey = generatePrivateKey();
    
    // Create account from private key
    const account = privateKeyToAccount(privateKey);
    
    console.log("\n✅ New Wallet Generated:");
    console.log("=" .repeat(50));
    console.log("Private Key:", privateKey);
    console.log("Address:", account.address);
    console.log("=" .repeat(50));
    
    console.log("\n📋 Add these to your environment variables:");
    console.log(`THIRDWEB_PRIVATE_KEY=${privateKey}`);
    console.log(`THIRDWEB_FROM_ADDRESS=${account.address}`);
    
    console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
    console.log("1. Keep your private key SECRET - never share it!");
    console.log("2. Store it securely in environment variables");
    console.log("3. Never commit it to version control");
    console.log("4. Make sure this wallet has CELO tokens for gas fees");
    
    console.log("\n💰 Next Steps:");
    console.log("1. Send some CELO tokens to this address for gas fees");
    console.log("2. Add the private key to your environment variables");
    console.log("3. Test the normal signing method");
    
  } catch (error) {
    console.error("❌ Error generating wallet:", error);
  }
}

generateWallet();
