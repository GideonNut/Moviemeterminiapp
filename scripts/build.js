import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { mnemonicToAccount } from 'viem/accounts';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import dotenv from 'dotenv';
import crypto from 'crypto';

// ANSI color codes
const yellow = '\x1b[33m';
const italic = '\x1b[3m';
const reset = '\x1b[0m';

// Load environment variables in specific order
// First load .env for main config
dotenv.config({ path: '.env' });

async function lookupFidByCustodyAddress(custodyAddress) {
  const lowerCasedCustodyAddress = custodyAddress.toLowerCase();

  try {
    // Try the primary endpoint first
    const response = await fetch(
      `https://api.farcaster.xyz/v2/users?custody_address=${lowerCasedCustodyAddress}`,
      {
        headers: {
          'accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to lookup FID: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if we have users in the response
    if (data.users && Array.isArray(data.users) && data.users.length > 0) {
      return data.users[0].fid;
    }

    // If no users found, try alternative endpoint
    console.log('No users found with primary endpoint, trying alternative...');
    const altResponse = await fetch(
      `https://api.farcaster.xyz/v2/user_by_custody_address?custody_address=${lowerCasedCustodyAddress}`,
      {
        headers: {
          'accept': 'application/json',
        }
      }
    );

    if (altResponse.ok) {
      const altData = await altResponse.json();
      if (altData.user && altData.user.fid) {
        return altData.user.fid;
      }
    }

    throw new Error('No FID found for this custody address');
  } catch (error) {
    throw new Error(`Failed to lookup FID: ${error.message}`);
  }
}

async function loadEnvLocal() {
  try {
    if (fs.existsSync('.env.local')) {
      const { loadLocal } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'loadLocal',
          message: 'Found .env.local, likely created by the install script - would you like to load its values?',
          default: false
        }
      ]);

      if (loadLocal) {
        console.log('Loading values from .env.local...');
        const localEnv = dotenv.parse(fs.readFileSync('.env.local'));
        
        // Copy all values except SEED_PHRASE to .env
        const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') + '\n' : '';
        let newEnvContent = envContent;
        
        for (const [key, value] of Object.entries(localEnv)) {
          if (key !== 'SEED_PHRASE') {
            // Update process.env
            process.env[key] = value;
            // Add to .env content if not already there
            if (!envContent.includes(`${key}=`)) {
              newEnvContent += `${key}="${value}"\n`;
            }
          }
        }
        
        // Write updated content to .env
        fs.writeFileSync('.env', newEnvContent);
        console.log('✅ Values from .env.local have been written to .env');
      }
    }

    // Always try to load SEED_PHRASE from .env.local
    if (fs.existsSync('.env.local')) {
      const localEnv = dotenv.parse(fs.readFileSync('.env.local'));
      if (localEnv.SEED_PHRASE) {
        process.env.SEED_PHRASE = localEnv.SEED_PHRASE;
      }
    }
  } catch (error) {
    // Error reading .env.local, which is fine
    console.log('Note: No .env.local file found');
  }
}

// TODO: make sure rebuilding is supported

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

async function validateDomain(domain) {
  // Remove http:// or https:// if present
  const cleanDomain = domain.replace(/^https?:\/\//, '');
  
  // Basic domain validation
  if (!cleanDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/)) {
    throw new Error('Invalid domain format');
  }

  return cleanDomain;
}

async function validateSeedPhrase(seedPhrase) {
  try {
    // Try to create an account from the seed phrase
    const account = mnemonicToAccount(seedPhrase);
    return account.address;
  } catch (error) {
    throw new Error('Invalid seed phrase');
  }
}

async function generateFarcasterMetadata(domain, fid, accountAddress, seedPhrase, webhookUrl) {
  const header = {
    type: 'custody',
    key: accountAddress,
    fid,
  };
  const encodedHeader = Buffer.from(JSON.stringify(header), 'utf-8').toString('base64');

  const payload = {
    domain
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');

  const account = mnemonicToAccount(seedPhrase);
  const signature = await account.signMessage({ 
    message: `${encodedHeader}.${encodedPayload}`
  });
  const encodedSignature = Buffer.from(signature, 'utf-8').toString('base64url');

  const tags = process.env.NEXT_PUBLIC_FRAME_TAGS?.split(',');

  return {
    accountAssociation: {
      header: encodedHeader,
      payload: encodedPayload,
      signature: encodedSignature
    },
    frame: {
      version: "1",
      name: process.env.NEXT_PUBLIC_FRAME_NAME,
      iconUrl: `https://${domain}/icon.png`,
      homeUrl: `https://${domain}`,
      imageUrl: `https://${domain}/api/opengraph-image`,
      buttonTitle: process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT,
      splashImageUrl: `https://${domain}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl,
      description: process.env.NEXT_PUBLIC_FRAME_DESCRIPTION,
      primaryCategory: process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY,
      tags,
    },
  };
}

async function main() {
  try {
    console.log('\n📝 Checking environment variables...');
    console.log('Loading values from .env...');
    
    // Load .env.local if user wants to
    await loadEnvLocal();

    // Get domain from user
    const { domain } = await inquirer.prompt([
      {
        type: 'input',
        name: 'domain',
        message: 'Enter your domain (e.g., myapp.vercel.app):',
        default: process.env.NEXT_PUBLIC_URL?.replace('https://', '') || '',
        validate: async (input) => {
          try {
            await validateDomain(input);
            return true;
          } catch (error) {
            return error.message;
          }
        }
      }
    ]);

    // Get frame name from user
    const { frameName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'frameName',
        message: 'Enter the name for your mini app (e.g., My Cool Mini App):',
        default: process.env.NEXT_PUBLIC_FRAME_NAME,
        validate: (input) => {
          if (input.trim() === '') {
            return 'Mini app name cannot be empty';
          }
          return true;
        }
      }
    ]);

    // Get button text from user
    const { buttonText } = await inquirer.prompt([
      {
        type: 'input',
        name: 'buttonText',
        message: 'Enter the text for your mini app button:',
        default: process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT || 'Launch Mini App',
        validate: (input) => {
          if (input.trim() === '') {
            return 'Button text cannot be empty';
          }
          return true;
        }
      }
    ]);

    // Get seed phrase from user
    let seedPhrase = process.env.SEED_PHRASE;
    if (!seedPhrase) {
      const { seedPhrase: inputSeedPhrase } = await inquirer.prompt([
        {
          type: 'password',
          name: 'seedPhrase',
          message: 'Your farcaster custody account seed phrase is required to create a signature proving this app was created by you.\n' +
          `⚠️ ${yellow}${italic}seed phrase is only used to sign the mini app manifest, then discarded${reset} ⚠️\n` +
          'Seed phrase:',
          validate: async (input) => {
            try {
              await validateSeedPhrase(input);
              return true;
            } catch (error) {
              return error.message;
            }
          }
        }
      ]);
      seedPhrase = inputSeedPhrase;
    } else {
      console.log('Using existing seed phrase from .env');
    }

    // Validate seed phrase and get account address
    const accountAddress = await validateSeedPhrase(seedPhrase);
    console.log('✅ Generated account address from seed phrase');

    // Look up FID using native Farcaster API
    console.log('🔍 Looking up FID using Farcaster API...');
    let fid;
    try {
      fid = await lookupFidByCustodyAddress(accountAddress);
      console.log(`✅ Found FID: ${fid}`);
    } catch (error) {
      console.log('❌ Could not automatically find FID:', error.message);
      console.log('💡 You can manually enter your FID if you know it.');
      
      const { manualFid } = await inquirer.prompt([
        {
          type: 'input',
          name: 'manualFid',
          message: 'Enter your Farcaster ID (FID) manually (or press Enter to skip):',
          default: process.env.FID || '',
          validate: (input) => {
            if (input.trim() === '') {
              return true; // Allow empty input to skip
            }
            const num = parseInt(input);
            if (isNaN(num) || num <= 0) {
              return 'FID must be a positive number';
            }
            return true;
          }
        }
      ]);
      
      if (manualFid.trim()) {
        fid = parseInt(manualFid);
        console.log(`✅ Using manually entered FID: ${fid}`);
      } else {
        console.log('⚠️  No FID provided. The manifest will be generated without FID association.');
        fid = null;
      }
    }

    // Generate and sign manifest
    console.log('\n🔨 Generating mini app manifest...');
    
    // Use native webhook URL
    const webhookUrl = `${domain}/api/webhook`;

    let metadata;
    if (fid) {
      metadata = await generateFarcasterMetadata(domain, fid, accountAddress, seedPhrase, webhookUrl);
      console.log('\n✅ Mini app manifest generated and signed');
    } else {
      // Generate metadata without account association
      metadata = {
        frame: {
          version: "1",
          name: process.env.NEXT_PUBLIC_FRAME_NAME,
          iconUrl: `https://${domain}/icon.png`,
          homeUrl: `https://${domain}`,
          imageUrl: `https://${domain}/api/opengraph-image`,
          buttonTitle: process.env.NEXT_PUBLIC_FRAME_BUTTON_TEXT,
          splashImageUrl: `https://${domain}/splash.png`,
          splashBackgroundColor: "#f7f7f7",
          webhookUrl,
          description: process.env.NEXT_PUBLIC_FRAME_DESCRIPTION,
          primaryCategory: process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY,
          tags: process.env.NEXT_PUBLIC_FRAME_TAGS?.split(','),
        },
      };
      console.log('\n✅ Mini app manifest generated (without account association)');
    }

    // Read existing .env file or create new one
    const envPath = path.join(projectRoot, '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    // Add or update environment variables
    const newEnvVars = [
      // Base URL
      `NEXT_PUBLIC_URL=https://${domain}`,

      // Frame metadata
      `NEXT_PUBLIC_FRAME_NAME="${frameName}"`,
      `NEXT_PUBLIC_FRAME_DESCRIPTION="${process.env.NEXT_PUBLIC_FRAME_DESCRIPTION || ''}"`,
      `NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY="${process.env.NEXT_PUBLIC_FRAME_PRIMARY_CATEGORY || ''}"`,
      `NEXT_PUBLIC_FRAME_TAGS="${process.env.NEXT_PUBLIC_FRAME_TAGS || ''}"`,
      `NEXT_PUBLIC_FRAME_BUTTON_TEXT="${buttonText}"`,

      // FID (only if it exists)
      ...(fid ? [`FID="${fid}"`] : []),

      // NextAuth configuration
      `NEXTAUTH_SECRET="${process.env.NEXTAUTH_SECRET || crypto.randomBytes(32).toString('hex')}"`,
      `NEXTAUTH_URL="https://${domain}"`,

      // Frame manifest with signature
      `FRAME_METADATA=${JSON.stringify(metadata)}`,
    ];

    // Filter out empty values and join with newlines
    const validEnvVars = newEnvVars.filter(line => {
      const [, value] = line.split('=');
      return value && value !== '""';
    });

    // Update or append each environment variable
    validEnvVars.forEach(varLine => {
      const [key] = varLine.split('=');
      if (envContent.includes(`${key}=`)) {
        envContent = envContent.replace(new RegExp(`${key}=.*`), varLine);
      } else {
        envContent += `\n${varLine}`;
      }
    });

    // Write updated .env file
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Environment variables updated');

    // Run next build
    console.log('\nBuilding Next.js application...');
    const nextBin = path.normalize(path.join(projectRoot, 'node_modules', '.bin', 'next'));
    execSync(`"${nextBin}" build`, { 
      cwd: projectRoot, 
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    console.log('\n✨ Build complete! Your mini app is ready for deployment. 🪐');
    console.log('📝 Make sure to configure the environment variables from .env in your hosting provider');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
