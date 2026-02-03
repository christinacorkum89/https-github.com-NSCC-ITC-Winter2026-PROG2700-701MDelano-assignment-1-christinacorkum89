function processString(str) {
    let cleaned = str.replace(/\d/g, '');
    if (cleaned.toLowerCase() === cleaned.toLowerCase().split('').reverse().join('')) {
        return "Palindrome detected!";
    }
    let first = cleaned[0].toLowerCase();
    let last = cleaned[cleaned.length - 1].toLowerCase();
    if (first === last) {
        return cleaned.split('').reverse().join('');
    } else {
        return cleaned.slice(1, -1);
    }
}

// Test
console.log(processString("Triscuit"));  // "tiucsirT"
console.log(processString("Cracker"));   // "racke"