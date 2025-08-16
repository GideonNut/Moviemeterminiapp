import { constructPosterUrl, constructBackdropUrl } from './tmdb';

// Test TMDB image paths
const testPaths = [
  '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg',  // Example poster path
  '/backdrop_path_example.jpg',           // Example backdrop path
  '9PFonBhy4cQy7Jz20NpMygczOkv.jpg',    // Path without leading slash
  null,                                   // Null path
  undefined,                              // Undefined path
];

console.log('🧪 Testing TMDB Image URL Construction...\n');

testPaths.forEach((path, index) => {
  console.log(`Test ${index + 1}: Path = ${path}`);
  
  const posterUrl = constructPosterUrl(path, 'w500');
  const backdropUrl = constructBackdropUrl(path, 'w1280');
  
  console.log(`  Poster URL: ${posterUrl}`);
  console.log(`  Backdrop URL: ${backdropUrl}`);
  console.log('');
});

// Test the specific issue from Stack Overflow
console.log('🔍 Testing Stack Overflow Issue...\n');

const base_url = "https://image.tmdb.org/t/p/w500/";  // WITH trailing slash (WRONG)
const base_url_fixed = "https://image.tmdb.org/t/p/w500";  // WITHOUT trailing slash (CORRECT)

const moviePath = '/9PFonBhy4cQy7Jz20NpMygczOkv.jpg';

console.log('❌ WRONG (with trailing slash):');
console.log(`  ${base_url}${moviePath}`);
console.log('  Result:', base_url + moviePath);

console.log('\n✅ CORRECT (without trailing slash):');
console.log(`  ${base_url_fixed}${moviePath}`);
console.log('  Result:', base_url_fixed + moviePath);

console.log('\n🎯 Your MovieMeter Implementation:');
const yourUrl = constructPosterUrl(moviePath, 'w500');
console.log(`  ${yourUrl}`);

// Test if URLs are accessible
console.log('\n🌐 Testing URL Accessibility...');
const testUrl = 'https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg';
console.log(`Test URL: ${testUrl}`);
console.log('Note: This URL might not be accessible due to CORS or the image not existing');
