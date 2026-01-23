function isPrime(num) {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

let numbers = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100) + 1);
let result = numbers.map(n => `${n}-${isPrime(n) ? 'yes' : 'no'}`).join(', ');

console.log(result);