/**
 * Advanced string processing function with bonus features
 * @param {string} str - The input string to process
 * @param {boolean} forceReverse - Optional: force reverse regardless of conditions
 * @returns {string} Processed result
 */
function processString(str, forceReverse = false) {
    // 1. Remove digits from the string
    let processedStr = str.replace(/\d+/g, '');
    
    // 2. Check for palindrome (ignoring case, spaces, and punctuation)
    const cleanStr = processedStr.toLowerCase().replace(/[^a-z]/g, '');
    const isPalindrome = cleanStr === cleanStr.split('').reverse().join('');
    
    // 3. Handle palindrome detection
    if (isPalindrome && !forceReverse) {
        return "Palindrome detected!";
    }
    
    // 4. Original logic: check first/last character or force reverse
    const firstChar = processedStr.charAt(0).toLowerCase();
    const lastChar = processedStr.charAt(processedStr.length - 1).toLowerCase();
    
    if (firstChar === lastChar && !forceReverse) {
        // Trim first and last character
        return processedStr.length <= 2 ? '' : processedStr.slice(1, -1);
    } else {
        // Reverse the string
        return processedStr.split('').reverse().join('');
    }
}

// Test cases
console.log("=== Testing Advanced String Function ===");
console.log("1. With digits: 'ab12cd34ef' ->", processString("ab12cd34ef"));
console.log("2. Palindrome: 'A man a plan a canal Panama' ->", processString("A man a plan a canal Panama"));
console.log("3. Palindrome with force: 'racecar' ->", processString("racecar", true));
console.log("4. First/last match: 'hello world!' ->", processString("hello world!"));
console.log("5. First/last diff: 'javascript' ->", processString("javascript"));
console.log("6. With digits and palindrome check: '123 level 456' ->", processString("123 level 456"));