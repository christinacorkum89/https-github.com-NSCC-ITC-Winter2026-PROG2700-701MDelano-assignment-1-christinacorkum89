# Poker Hand Project: A Beginner's Guide

## What is this project?
This is a simple web application that "talks" to another computer on the internet (a server) to get information about a Poker Hand (like cards in a card game). It then displays that information to you behind the scenes.

## The Files
There are two main files in this folder. Think of them like a car:
1.  **`index.html` (The Body)**: This is the structure of the car. It doesn't do much on its own, but it holds everything together.
2.  **`main.js` (The Engine)**: This is the JavaScript code. It does the actual work of driving to the internet, picking up data, and bringing it back.

---

## Detailed Code Explanation

### 1. The Engine (`main.js`)
This file is written in **JavaScript**, the language that makes websites interactive. Here is what happens, line by line:

#### Step A: Setting the Destination
```javascript
const url = 'https://poker-hand-test-api.onrender.com/pokerhandtest/twopair'
```
*   **`const`**: Short for "Constant". This tells the computer, "I am creating a label that won't change."
*   **`url`**: This is the name of our label.
*   **The Link**: This is the address of the server (API) we want to talk to.
*   **Analogy**: It's like writing down the address of a pizza place so you don't forget it.

#### Step B: The Backup Options (Comments)
```javascript
// const url = '.../highcard'
// const url = '.../fullhouse'
```
*   **`//`**: Any line starting with two slashes is a **Comment**. The computer ignores these lines completely.
*   **Why use them?**: We use them to keep backup code or notes. In this file, they act like a switchboard. If you want to get a "Full House" instead of a "Two Pair", you can move the `//` to comment out the first line and uncomment the Full House line.

#### Step C: Making the Call (`fetch`)
```javascript
fetch(url)
```
*   **`fetch()`**: This is a built-in command that says, "Go to this URL and get me whatever is there."
*   **Analogy**: This is like dialing the phone number of the pizza place.

#### Step D: Handling the Wait (`.then`)
```javascript
.then(response => response.json())
```
*   **`.then()`**: The internet is not instant. It takes time for the signal to travel. `.then()` means "Wait for the fetch to finish, and **then** do this next step."
*   **`response`**: This is what the server sent back (the raw data).
*   **`.json()`**: The data comes in a package that might look like messy text. This command cleans it up and turns it into a **JSON Object** (a structured format that JavaScript understands easily).

#### Step E: Showing the Result
```javascript
.then(json => console.log(json))
```
*   **`json`**: This is our clean, ready-to-use data.
*   **`console.log()`**: This prints the data to a special tool called the "Console." It doesn't show up on the web page itself; it shows up in a tool for developers.

---

### 2. The Body (`index.html`)
This file is **HTML** (HyperText Markup Language). It defines the structure of the page.

*   **`<html>`, `<head>`, `<body>`**: These are standard tags that every website has. They set up the page.
*   **The Critical Line**:
    ```html
    <script src="./main.js"></script>
    ```
    *   This tag acts like a bridge. It tells the HTML file, "Please load the `main.js` file and run the code inside it."
    *   Without this line, your `main.js` engine would sit in the garage and never start.

---

## Will it run?
**YES**, the code is correct and will run as is.

**Important Note:**
The server (`onrender.com`) is on a free plan. If no one has used it recently, it might go to sleep.
*   **First Run:** It might take **30-60 seconds** to wake up.
*   **What to do:** If you don't see anything in the console immediately, **wait one minute**, then refresh the page.

---

## How to Run It (Homework Instructions)

Since this code prints to the "Console" instead of the screen, you need to know how to look under the hood.

1.  **Open the File**:
    Double-click `index.html` to open it in your web browser (Chrome, Firefox, Safari, etc.). You will see a blank white page. This is normal!

2.  **Open Developer Tools**:
    *   **Right-click** anywhere on the white page.
    *   Select **Inspect** or **Inspect Element**.
    *   A panel will open (usually on the right or bottom).

3.  **Find the Console**:
    *   Look for a tab named **Console** at the top of that new panel.
    *   Click it.

4.  **See the Data**:
    *   You should see some text or an object (like `{card1: "Ace", card2: "King"...}`).
    *   Click on the little arrow `>` next to it to expand it and see the details of the poker hand.

5.  **Experiment**:
    *   Open `main.js` in a text editor (like Notepad or VS Code).
    *   Add `//` in front of the "Two Pair" line.
    *   Remove `//` from in front of the "Flush" line.
    *   Save the file.
    *   Refresh your web browser page.
    *   Check the console again to see the new hand!