import { createVaultClient, createAccessToken } from "@thirdweb-dev/vault-sdk";

async function generateVaultToken() {
  try {
    console.log("Creating vault client...");
    
    const client = await createVaultClient({
      secretKey: process.env.THIRDWEB_SECRET_KEY,
    });

    console.log("Generating access token with proper permissions...");
    
    const response = await createAccessToken({
      client,
      request: {
        auth: { adminKey: process.env.THIRDWEB_SECRET_KEY },
        options: {
          policies: [
            {
              type: "eoa:signTransaction",
              allowlist: [process.env.THIRDWEB_FROM_ADDRESS],
            },
            {
              type: "eoa:signAuthorization", // This is the missing permission!
              allowlist: [process.env.THIRDWEB_FROM_ADDRESS],
            },
          ],
          expiresAt: new Date("2030-01-01").toISOString(),
          metadata: { 
            env: "prod", 
            owner: "backend",
            purpose: "movie-batch-operations"
          },
        },
      },
    });

    console.log("\n✅ Generated Vault Access Token:");
    console.log("=" .repeat(50));
    console.log(response.data.accessToken);
    console.log("=" .repeat(50));
    console.log("\n📋 Add this to your environment variables:");
    console.log(`THIRDWEB_VAULT_ACCESS_TOKEN=${response.data.accessToken}`);
    console.log("\n🔧 Token includes permissions:");
    console.log("- eoa:signTransaction");
    console.log("- eoa:signAuthorization");
    console.log(`- Wallet: ${process.env.THIRDWEB_FROM_ADDRESS}`);
    console.log(`- Expires: 2030-01-01`);
    
  } catch (error) {
    console.error("❌ Error generating vault token:", error);
    console.error("\nMake sure you have:");
    console.error("1. THIRDWEB_SECRET_KEY environment variable set");
    console.error("2. THIRDWEB_FROM_ADDRESS environment variable set");
    console.error("3. @thirdweb-dev/vault-sdk package installed");
    console.error("\n💡 You can set them temporarily like this:");
    console.error("$env:THIRDWEB_SECRET_KEY='your_secret_key'");
    console.error("$env:THIRDWEB_FROM_ADDRESS='your_wallet_address'");
    console.error("node scripts/generate-vault-token.js");
  }
}

// Check environment variables
if (!process.env.THIRDWEB_SECRET_KEY) {
  console.error("❌ THIRDWEB_SECRET_KEY environment variable is required");
  console.error("\n💡 Set it temporarily in PowerShell:");
  console.error("$env:THIRDWEB_SECRET_KEY='your_secret_key_here'");
  console.error("$env:THIRDWEB_FROM_ADDRESS='your_wallet_address_here'");
  console.error("node scripts/generate-vault-token.js");
  process.exit(1);
}

if (!process.env.THIRDWEB_FROM_ADDRESS) {
  console.error("❌ THIRDWEB_FROM_ADDRESS environment variable is required");
  console.error("\n💡 Set it temporarily in PowerShell:");
  console.error("$env:THIRDWEB_SECRET_KEY='your_secret_key_here'");
  console.error("$env:THIRDWEB_FROM_ADDRESS='your_wallet_address_here'");
  console.error("node scripts/generate-vault-token.js");
  process.exit(1);
}

generateVaultToken();
