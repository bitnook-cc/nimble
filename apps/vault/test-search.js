// Simple test script for search functionality
import { searchService } from './src/lib/search-service.ts'

console.log('Testing Fuse.js Search Implementation\n')
console.log('======================================\n')

// Test 1: Basic search
console.log('Test 1: Search for "combat"')
const results1 = searchService.search('combat', [], 5)
console.log(`Found ${results1.length} results:`)
results1.forEach(r => console.log(`  - ${r.title} (${Math.round((1 - r.score) * 100)}% match)`))

// Test 2: Fuzzy search with typo
console.log('\nTest 2: Fuzzy search for "combt" (typo)')
const results2 = searchService.search('combt', [], 5)
console.log(`Found ${results2.length} results:`)
results2.forEach(r => console.log(`  - ${r.title} (${Math.round((1 - r.score) * 100)}% match)`))

// Test 3: Search with access control
console.log('\nTest 3: Search "advanced" with patron access')
const results3 = searchService.search('advanced', ['patron'], 5)
console.log(`Found ${results3.length} results:`)
results3.forEach(r => console.log(`  - ${r.title} (Access: ${r.access.join(', ')})`))

// Test 4: Search without patron access
console.log('\nTest 4: Search "advanced" without patron access')
const results4 = searchService.search('advanced', [], 5)
console.log(`Found ${results4.length} results:`)
results4.forEach(r => console.log(`  - ${r.title}`))

// Test 5: Multi-word search
console.log('\nTest 5: Search for "character creation"')
const results5 = searchService.search('character creation', [], 5)
console.log(`Found ${results5.length} results:`)
results5.forEach(r => console.log(`  - ${r.title} (${Math.round((1 - r.score) * 100)}% match)`))

console.log('\n✅ Search tests complete!')