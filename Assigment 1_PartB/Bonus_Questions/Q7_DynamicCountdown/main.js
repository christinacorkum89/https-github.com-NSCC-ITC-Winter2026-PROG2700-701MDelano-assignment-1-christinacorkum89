/**
 * Advanced birthday countdown with live updates
 * @param {string} birthdayStr - Birthday in MM-DD format
 */
function birthdayCountdown(birthdayStr) {
    // Validate input format
    if (!/^\d{2}-\d{2}$/.test(birthdayStr)) {
        console.error("Please use MM-DD format (e.g., '12-25' for December 25th)");
        return;
    }
    
    const [month, day] = birthdayStr.split('-').map(Number);
    
    // Validate month and day
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        console.error("Invalid date. Month must be 01-12, day must be 01-31");
        return;
    }
    
    let intervalId;
    
    // Function to calculate next birthday
    function calculateNextBirthday() {
        const now = new Date();
        const currentYear = now.getFullYear();
        
        // Check for leap year
        function isLeapYear(year) {
            return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        }
        
        // Validate day for the given month
        const daysInMonth = [
            31, isLeapYear(currentYear) ? 29 : 28, 31, 30, 31, 30,
            31, 31, 30, 31, 30, 31
        ];
        
        if (day > daysInMonth[month - 1]) {
            console.error(`Invalid day for month ${month}. Maximum is ${daysInMonth[month - 1]}`);
            clearInterval(intervalId);
            return null;
        }
        
        // Create this year's birthday
        const thisYearBirthday = new Date(currentYear, month - 1, day);
        
        // If birthday has passed this year, use next year
        let nextBirthday;
        if (now > thisYearBirthday) {
            nextBirthday = new Date(currentYear + 1, month - 1, day);
            // Adjust for leap year if moving to February 29th
            if (month === 2 && day === 29 && !isLeapYear(currentYear + 1)) {
                nextBirthday = new Date(currentYear + 1, 1, 28); // Feb 28th
            }
        } else {
            nextBirthday = thisYearBirthday;
        }
        
        return nextBirthday;
    }
    
    // Function to update countdown display
    function updateCountdown() {
        const nextBirthday = calculateNextBirthday();
        if (!nextBirthday) return;
        
        const now = new Date();
        const diffMs = nextBirthday - now;
        
        // Calculate time components
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        // Clear console and display
        console.clear();
        console.log("=== BIRTHDAY COUNTDOWN ===");
        console.log(`Birthday: ${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
        console.log(`Next occurrence: ${nextBirthday.toDateString()}`);
        console.log("\nTime until birthday:");
        console.log(`  ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
        console.log("\nPress Ctrl+C to stop the countdown");
        
        // Check if birthday is today
        if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
            console.log("\n🎉🎂 HAPPY BIRTHDAY! 🎂🎉");
            clearInterval(intervalId);
        }
    }
    
    // Initial update and start interval
    updateCountdown();
    intervalId = setInterval(updateCountdown, 1000);
    
    // Return function to stop the countdown
    return () => clearInterval(intervalId);
}

// Test the countdown
console.log("=== Testing Advanced Birthday Countdown ===");
console.log("Starting countdown for birthday: 12-25 (Christmas)");
console.log("Note: In a real environment, this would update every second.");
console.log("For demonstration, showing one snapshot:\n");

// Simulate one update for demonstration
const stopCountdown = birthdayCountdown("12-25");
// In a real environment, this would run continuously
// To stop: stopCountdown();