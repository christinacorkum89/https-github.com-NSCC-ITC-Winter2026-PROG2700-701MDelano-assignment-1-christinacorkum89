function longestConsecutiveSum(arr) {
    let maxSum = 0;
    let currentSum = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] === arr[i - 1] + 1) {
            currentSum += arr[i];
        } else {
            if (currentSum > maxSum) maxSum = currentSum;
            currentSum = arr[i];
        }
    }
    return Math.max(maxSum, currentSum);
}

// Test
console.log(longestConsecutiveSum([1, 2, 3, 6, 9, 34, 2, 6])); // 6