const nextBirthday = new Date(new Date().getFullYear(), 10, 15); // Example: Nov 15
const now = new Date();
if (nextBirthday < now) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
}

const diff = nextBirthday - now;
const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24));
const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
const seconds = Math.floor((diff % (1000 * 60)) / 1000);

console.log(`There are ${weeks} weeks, ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds until my next birthday!`);