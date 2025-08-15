import { constructTmdbImageUrl, constructPosterUrl, constructBackdropUrl } from './tmdb';

// Test function to verify TMDB image URL construction
export function testTmdbImageUrls() {
  console.log('🧪 Testing TMDB Image URL Construction...\n');
  
  // Test cases
  const testCases = [
    {
      name: 'Poster Path (w500)',
      input: '/1E5baAaEse26fej7uHcjOgEE2t2.jpg',
      expected: 'https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg'
    },
    {
      name: 'Backdrop Path (w1280)',
      input: '/backdrop_example.jpg',
      expected: 'https://image.tmdb.org/t/p/w1280/backdrop_example.jpg'
    },
    {
      name: 'SVG Logo (original)',
      input: '/logo_example.svg',
      expected: 'https://image.tmdb.org/t/p/original/logo_example.svg'
    },
    {
      name: 'Null Path',
      input: null,
      expected: undefined
    },
    {
      name: 'Empty String',
      input: '',
      expected: undefined
    }
  ];
  
  testCases.forEach(testCase => {
    const result = constructTmdbImageUrl(testCase.input);
    const passed = result === testCase.expected;
    
    console.log(`${passed ? '✅' : '❌'} ${testCase.name}`);
    console.log(`  Input: ${testCase.input}`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Got: ${result}`);
    console.log('');
  });
  
  // Test specific helper functions
  console.log('🔧 Testing Helper Functions...\n');
  
  const posterUrl = constructPosterUrl('/poster_example.jpg', 'w780');
  console.log(`Poster URL (w780): ${posterUrl}`);
  
  const backdropUrl = constructBackdropUrl('/backdrop_example.jpg', 'w1920');
  console.log(`Backdrop URL (w1920): ${backdropUrl}`);
  
  console.log('\n✨ TMDB Image URL Test Complete!');
}

// Function to validate existing image URLs
export function validateImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Check if it's a valid TMDB URL
  if (url.includes('image.tmdb.org')) {
    return true;
  }
  
  // Check if it's a valid external URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Function to get image size from TMDB URL
export function getImageSizeFromUrl(url: string): string | null {
  if (!url || !url.includes('image.tmdb.org')) {
    return null;
  }
  
  const match = url.match(/\/t\/p\/([^\/]+)\//);
  return match ? match[1] : null;
}

// Export for use in other files
export { constructTmdbImageUrl, constructPosterUrl, constructBackdropUrl };
