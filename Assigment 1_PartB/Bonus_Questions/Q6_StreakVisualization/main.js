/**
 * Enhanced streak analysis with visualization
 * @param {number[]} arr - Input array of numbers
 * @param {number} stepSize - Optional: step size for streaks (default: 1)
 * @returns {Object} Streak analysis object
 */
function analyzeStreaks(arr, stepSize = 1) {
    if (!arr || arr.length === 0) {
        return {
            longestStreak: [],
            sum: 0,
            startIndex: -1,
            visual: "No data to analyze"
        };
    }
    
    let currentStreak = [arr[0]];
    let longestStreak = [arr[0]];
    let currentStart = 0;
    let longestStart = 0;
    
    // Find the longest streak
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] === arr[i - 1] + stepSize) {
            currentStreak.push(arr[i]);
        } else {
            currentStreak = [arr[i]];
            currentStart = i;
        }
        
        // Update longest streak if current is longer
        if (currentStreak.length > longestStreak.length) {
            longestStreak = [...currentStreak];
            longestStart = currentStart;
        }
    }
    
    // Calculate sum of longest streak
    const sum = longestStreak.reduce((acc, val) => acc + val, 0);
    
    // Create visual representation
    let visual = "Array: [" + arr.join(", ") + "]\n";
    visual += "Longest Streak (+" + stepSize + "): [";
    visual += longestStreak.join(", ") + "]\n";
    visual += "Visual: ";
    
    for (let i = 0; i < arr.length; i++) {
        if (i >= longestStart && i < longestStart + longestStreak.length) {
            visual += `[${arr[i]}] `;
        } else {
            visual += `${arr[i]} `;
        }
    }
    
    visual += "\n" + " ".repeat(10 + longestStart * 3);
    visual += "^".repeat(longestStreak.length * 3 - 2);
    
    // Log the visualization
    console.log("\n" + visual);
    
    return {
        longestStreak,
        sum,
        startIndex: longestStart,
        length: longestStreak.length,
        visual: visual
    };
}

// Test cases
console.log("\n=== Testing Enhanced Streak Analysis ===");

// Test 1: Default step size (1)
const test1 = [1, 2, 3, 5, 6, 7, 10, 11, 12, 13];
console.log("\nTest 1 - Default step:");
const result1 = analyzeStreaks(test1);
console.log("Result object:", result1);

// Test 2: Custom step size (2)
const test2 = [2, 4, 6, 7, 9, 11, 13, 15, 16];
console.log("\nTest 2 - Step size 2:");
const result2 = analyzeStreaks(test2, 2);
console.log("Result object:", result2);

// Test 3: Multiple streaks
const test3 = [1, 2, 3, 1, 2, 3, 4, 1, 2];
console.log("\nTest 3 - Multiple streaks:");
const result3 = analyzeStreaks(test3);
console.log("Result object:", result3);