const API_BASE = 'https://deckofcardsapi.com/api/deck';
const SOUNDS = {
    flip: 'sound/flip.mp3', chips: 'sound/chips.mp3', 
    win: 'sound/win.mp3', lose: 'sound/lose.mp3', fold: 'sound/fold.mp3'
};

// --- Audio Engine ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
const audioCache = {};
function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    for (const [k, p] of Object.entries(SOUNDS)) {
        const a = new Audio(p); a.preload='auto';
        a.addEventListener('canplaythrough', ()=>audioCache[k]=a);
    }
}
const Synth = {
    tone: (f,t,d) => {
        if(!audioCtx) return;
        const o=audioCtx.createOscillator(), g=audioCtx.createGain();
        o.type=t; o.frequency.value=f; g.gain.setValueAtTime(0.1,audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+d);
        o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+d);
    },
    noise: (d) => {
        if(!audioCtx) return;
        const b=audioCtx.createBuffer(1,audioCtx.sampleRate*d,audioCtx.sampleRate), dt=b.getChannelData(0);
        for(let i=0;i<dt.length;i++) dt[i]=Math.random()*2-1;
        const s=audioCtx.createBufferSource(); s.buffer=b;
        const g=audioCtx.createGain(); g.gain.value=0.1;
        s.connect(g); g.connect(audioCtx.destination); s.start();
    },
    play: (n) => {
        if(audioCache[n]) { audioCache[n].currentTime=0; audioCache[n].play().catch(()=>{}); }
        else {
            if(n=='chips') Synth.tone(2000,'sine',0.1);
            else if(n=='flip') Synth.noise(0.1);
            else if(n=='win') { Synth.tone(523,'sine',0.2); setTimeout(()=>Synth.tone(784,'sine',0.4),200); }
            else if(n=='lose') { Synth.tone(400,'sawtooth',0.4); setTimeout(()=>Synth.tone(300,'sawtooth',0.6),300); }
            else if(n=='fold') Synth.noise(0.3);
        }
    }
};

// --- Game Classes ---
class Player {
    constructor(id, isUser, name) {
        this.id = id;
        this.isUser = isUser;
        this.name = name;
        this.balance = 1000;
        this.hand = [];
        this.currentBet = 0; // Amount in front of player
        this.status = ''; // 'Folded', 'Check', 'Call', 'Raise'
        this.folded = false;
        this.allIn = false;
        this.discards = []; // Indices to discard
    }
    resetRound() {
        this.hand = [];
        this.currentBet = 0;
        this.status = '';
        this.folded = false;
        this.allIn = false;
        this.discards = [];
    }
}

// --- Game State ---
const VALUES = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'JACK':11,'QUEEN':12,'KING':13,'ACE':14 };
let game = {
    deckId: null,
    players: [],
    pot: 0,
    dealerIndex: 0,
    turnIndex: 0,
    highestBet: 0, // The amount needed to stay in (total for round)
    phase: 'SETUP', // SETUP, PRE_DRAW, DRAW, POST_DRAW, SHOWDOWN
    lastRaiserIndex: -1
};

// --- Constants ---
const CPU_NAMES = [
    "Maverick", "Ace", "Spike", "Rusty", "Duke", "Viper", "Lucky", "Shadow", "Bandit", "Tex"
];

// --- Core Logic ---

async function startGame(numCpu) {
    initAudio();
    const nameInput = document.getElementById('user-name-input');
    const userName = nameInput.value.trim() || "YOU";

    document.getElementById('setup-screen').style.display = 'none';
    
    // Init Players
    game.players = [new Player(0, true, userName)];
    
    // Shuffle names
    const names = [...CPU_NAMES].sort(() => 0.5 - Math.random());
    
    for(let i=1; i<=numCpu; i++) {
        const cpuName = names[i-1] || `CPU ${i}`;
        game.players.push(new Player(i, false, cpuName));
        const seat = document.getElementById(`seat-${i}`);
        seat.style.display = 'flex';
        seat.querySelector('.p-name').textContent = cpuName;
    }
    
    // Update User Name in UI
    document.querySelector('#seat-0 .p-name').textContent = userName;
    
    // Init Deck
    try {
        const res = await fetch(`${API_BASE}/new/shuffle/?deck_count=1`);
        const data = await res.json();
        game.deckId = data.deck_id;
        startRound();
    } catch(e) { alert("Deck Error"); }
}

async function startRound() {
    // Reset State
    game.pot = 0;
    game.phase = 'PRE_DRAW';
    game.highestBet = 10; // Ante
    game.lastRaiserIndex = -1; // Reset
    
    // Collect Antes
    game.players.forEach(p => {
        p.resetRound();
        if(p.balance >= 10) {
            p.balance -= 10;
            game.pot += 10;
        } else {
            p.balance = 0; // All in ante?
            game.pot += p.balance;
        }
        updatePlayerUI(p);
    });
    
    renderPot();
    
    // Deal 5 cards each
    const totalCards = game.players.length * 5;
    const cards = await drawCards(totalCards);
    game.players.forEach((p, i) => {
        p.hand = cards.slice(i*5, (i+1)*5);
        renderHand(p);
    });
    
    Synth.play('flip');
    
    // Start Betting Round 1
    // Player after dealer starts. For simplicity, User (0) always starts or rotates?
    // Let's rotate.
    game.turnIndex = (game.dealerIndex + 1) % game.players.length;
    game.lastRaiserIndex = game.turnIndex; // Conceptually checks start here
    
    nextTurn();
}

function nextTurn() {
    // Check if round should end
    // Round ends if:
    // 1. All players matched the highest bet (or folded/all-in)
    // 2. AND we have gone full circle since last raise
    
    // Simple check: do we stop?
    if (isBettingRoundComplete()) {
        advancePhase();
        return;
    }
    
    // Find next active player
    let loops = 0;
    while(game.players[game.turnIndex].folded || game.players[game.turnIndex].allIn) {
        game.turnIndex = (game.turnIndex + 1) % game.players.length;
        loops++;
        if(loops > game.players.length) { advancePhase(); return; } // Everyone folded/allin
    }
    
    const p = game.players[game.turnIndex];
    highlightSeat(p.id);
    
    if (p.isUser) {
        showUserControls();
    } else {
        setTimeout(() => cpuTurn(p), 1000);
    }
}

function isBettingRoundComplete() {
    // Round is complete if everyone active has matched highestBet
    // AND we've visited everyone at least once (handled by lastRaiser logic usually)
    // Simplified: If turnIndex == lastRaiserIndex AND current player has matched, we done?
    // Not quite. 
    
    // Better logic: Count active players who haven't matched.
    const active = game.players.filter(p => !p.folded && !p.allIn);
    if (active.length === 0 || active.length === 1) return true; // Only 1 left
    
    // Have we circled back to the aggressor?
    // If the current turn player HAS matched the bet, and they were the last raiser (or we circled full), end.
    
    // My Logic:
    // We store `lastRaiserIndex`. If turnIndex reaches it again, and they don't raise themselves, round over?
    // Wait, Standard Poker: Betting ends when all active players equal the bet.
    
    const pending = game.players.some(p => !p.folded && !p.allIn && p.currentBet < game.highestBet);
    
    // But we also need to ensure everyone got a chance.
    // So we use the turn loop. If we are back at the start and no one raised, stop.
    // I'll implement this inside `nextTurn` via a simple flag `betsSettled`.
    
    // Actually, simply: If (turnIndex === lastRaiserIndex) AND (everyone matched), proceed.
    // But initially lastRaiser is start.
    
    // Let's do this:
    // nextTurn calls CPU/User. They act.
    // After Action, we update `lastRaiserIndex` if they raised.
    // If they checked/called, we check: Is next player `lastRaiserIndex`?
    
    return false; // Handled explicitly in actions
}

// --- Actions ---

function handleAction(p, action, amount=0) {
    if(action === 'fold') {
        p.folded = true;
        p.status = 'Fold';
        Synth.play('fold');
    }
    else if(action === 'check') {
        p.status = 'Check';
    }
    else if(action === 'call') {
        const needed = game.highestBet - p.currentBet;
        p.balance -= needed;
        p.currentBet += needed;
        p.status = 'Call';
        Synth.play('chips');
    }
    else if(action === 'bet' || action === 'raise') {
        // Amount is the INCREASE over current highest
        // OR amount is total? Let's say amount is the ADDED value.
        // Actually, easiest is: Player puts in chips to match highest + raise amount.
        
        const callPart = game.highestBet - p.currentBet;
        const raisePart = amount; 
        const total = callPart + raisePart;
        
        p.balance -= total;
        p.currentBet += total;
        game.highestBet = p.currentBet;
        game.lastRaiserIndex = p.id; // Reset circle
        p.status = `Raise ${raisePart}`;
        if(action === 'bet') p.status = `Bet ${raisePart}`;
        Synth.play('chips');
    }
    
    updatePlayerUI(p);
    renderPlayerChips(p);
    
    // Check End Condition
    // If this player was the last active one to act and we are back to lastRaiser?
    
    // Simple Next:
    game.turnIndex = (game.turnIndex + 1) % game.players.length;
    
    // Check if we looped back to the person who set the price (meaning everyone called/folded)
    if(game.turnIndex === game.lastRaiserIndex) {
        advancePhase();
    } else {
        nextTurn();
    }
}

// --- AI Logic ---
function cpuTurn(p) {
    const ev = evaluateHand(p.hand);
    const cost = game.highestBet - p.currentBet;
    const isStrong = ev.rank >= 1; // Pair+
    
    if(cost === 0) {
        // Check or Bet
        if(isStrong || Math.random() > 0.8) handleAction(p, 'bet', 25);
        else handleAction(p, 'check');
    } else {
        // Call, Raise, Fold
        if(cost > 50 && !isStrong) handleAction(p, 'fold');
        else if(isStrong && Math.random() > 0.7) handleAction(p, 'raise', 25);
        else handleAction(p, 'call');
    }
}

// --- User Input Wrappers ---
function userAct(act, amt) {
    document.getElementById('controls').style.display = 'none';
    handleAction(game.players[0], act, amt);
}

function updateSliderVal(val) {
    document.getElementById('slider-display').textContent = `$${val}`;
}

function showUserControls() {
    const el = document.getElementById('controls');
    el.innerHTML = '';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    
    const p = game.players[0];
    const cost = game.highestBet - p.currentBet;
    
    // Fold
    el.innerHTML += `<button class="btn btn-fold" onclick="userAct('fold')">FOLD</button>`;
    
    // Check/Call
    if(cost === 0) {
        el.innerHTML += `<button class="btn btn-check" onclick="userAct('check')">CHECK</button>`;
    } else {
        el.innerHTML += `<button class="btn btn-call" onclick="userAct('call')">CALL $${cost}</button>`;
    }
    
    // Bet/Raise Slider
    // Min Raise is usually big blind or prev bet. Let's stick to 5-500.
    const sliderContainer = document.createElement('div');
    sliderContainer.style.display = 'flex';
    sliderContainer.style.flexDirection = 'column';
    sliderContainer.style.alignItems = 'center';
    sliderContainer.style.marginLeft = '20px';
    sliderContainer.style.background = '#333';
    sliderContainer.style.padding = '10px';
    sliderContainer.style.borderRadius = '10px';
    
    const range = document.createElement('input');
    range.type = 'range';
    range.min = 5;
    range.max = 500;
    range.step = 5;
    range.value = 25;
    range.style.width = '150px';
    range.oninput = (e) => updateSliderVal(e.target.value);
    
    const label = document.createElement('div');
    label.id = 'slider-display';
    label.style.color = '#f1c40f';
    label.style.fontWeight = 'bold';
    label.textContent = '$25';
    
    const btnAction = document.createElement('button');
    btnAction.className = 'btn btn-bet';
    btnAction.innerText = (cost === 0) ? 'BET' : 'RAISE';
    btnAction.style.marginTop = '5px';
    btnAction.onclick = () => userAct(cost === 0 ? 'bet' : 'raise', parseInt(range.value));
    
    sliderContainer.appendChild(label);
    sliderContainer.appendChild(range);
    sliderContainer.appendChild(btnAction);
    
    el.appendChild(sliderContainer);
}

// --- Phase Management ---

async function advancePhase() {
    // Collect bets into pot
    collectBets();
    
        if(game.phase === 'PRE_DRAW') {
            game.phase = 'DRAW';
            // Check if only 1 player left
            if(checkWinnerByFold()) return;
            
            // Allow User to Draw
            document.getElementById('controls').innerHTML = `
                <div style="color: white; font-weight: bold; margin-right: 15px;">Select cards to discard</div>
                <button class="btn btn-bet" onclick="performDraw()">CONFIRM DISCARD</button>
            `;
            document.getElementById('controls').style.display = 'flex';
            // (CPU draws automatically in performDraw)
        }      else if(game.phase === 'POST_DRAW') {
        game.phase = 'SHOWDOWN';
        showdown();
    }
}

function collectBets() {
    game.players.forEach(p => {
        game.pot += p.currentBet;
        p.currentBet = 0;
        p.status = '';
        updatePlayerUI(p);
        renderPlayerChips(p);
    });
    renderPot();
    game.highestBet = 0;
    game.lastRaiserIndex = (game.dealerIndex + 1) % game.players.length;
    game.turnIndex = game.lastRaiserIndex;
}

async function performDraw() {
    document.getElementById('controls').style.display = 'none';
    Synth.play('flip');
    
    // User Draw
    const p0 = game.players[0];
    if(!p0.folded) {
        const keep = p0.hand.filter((_,i)=>!p0.discards.includes(i));
        const newC = await drawCards(5 - keep.length);
        p0.hand = keep.concat(newC);
        p0.discards = [];
        renderHand(p0);
    }
    
    // CPU Draw
    for(let i=1; i<game.players.length; i++) {
        const p = game.players[i];
        if(!p.folded) {
            const ev = evaluateHand(p.hand);
            // Basic Keep logic
            // (If simple implementation needed, keep 5 or drop non-pairs)
            // Just simulate draw for visual speed
        }
    }
    
    game.phase = 'POST_DRAW';
    nextTurn();
}

function checkWinnerByFold() {
    const active = game.players.filter(p => !p.folded);
    if(active.length === 1) {
        endGame(active[0]);
        return true;
    }
    return false;
}

function showdown() {
    // Reveal all
    game.players.forEach(p => { if(!p.folded) renderHand(p, true); });
    
    // Find Winner
    let winner = null;
    let bestScore = -1;
    
    game.players.forEach(p => {
        if(p.folded) return;
        const ev = evaluateHand(p.hand);
        p.status = ev.name;
        updatePlayerUI(p);
        if(ev.score > bestScore) { bestScore = ev.score; winner = p; }
    });
    
    endGame(winner);
}

function endGame(winner) {
    Synth.play('win');
    winner.balance += game.pot;
    game.pot = 0;
    renderPot();
    updatePlayerUI(winner);
    
    // Show Overlay
    const overlay = document.getElementById('game-over-overlay');
    const title = document.getElementById('winner-title');
    const desc = document.getElementById('winner-desc');
    
    if (winner.isUser) {
        title.textContent = "YOU WON!";
        title.style.color = "#2ecc71"; // Green
    } else {
        title.textContent = `${winner.name} WINS`;
        title.style.color = "#e74c3c"; // Red
    }
    
    // Determine winning hand name
    let handName = winner.status || "High Card";
    if (handName.startsWith("Raise") || handName.startsWith("Call") || handName.startsWith("Bet")) {
        // If status was just their last action, re-eval to get hand name
        const ev = evaluateHand(winner.hand);
        handName = ev.name;
    }
    
    desc.textContent = `Winning Hand: ${handName}`;
    
    overlay.style.display = 'flex';
    document.getElementById('controls').style.display = 'none';
}

function closeGameOver() {
    document.getElementById('game-over-overlay').style.display = 'none';
    startRound();
}


// --- Rendering & Helpers ---

function updatePlayerUI(p) {
    const div = document.getElementById(`seat-${p.id}`);
    if(p.folded) div.classList.add('folded'); else div.classList.remove('folded');
    div.querySelector('.p-balance').textContent = `$${p.balance}`;
    div.querySelector('.p-status').textContent = p.status;
}

function highlightSeat(id) {
    document.querySelectorAll('.player-seat').forEach(e => e.classList.remove('active-turn'));
    document.getElementById(`seat-${id}`).classList.add('active-turn');
}

function renderPlayerChips(p) {
    const el = document.getElementById(`bet-${p.id}`);
    renderChipsGeneric(el, p.currentBet);
}

function renderPot() {
    renderChipsGeneric(document.getElementById('pot-chips-container'), game.pot);
    document.getElementById('main-pot').textContent = game.pot;
}

function renderChipsGeneric(el, amount) {
    el.innerHTML = '';
    if(amount <= 0) return;
    
    const denoms = [{v:500,c:'c-purple'}, {v:100,c:'c-black'}, {v:25,c:'c-green'}, {v:10,c:'c-blue'}, {v:5,c:'c-red'}];
    
    denoms.forEach(d => {
        let count = Math.floor(amount / d.v);
        amount %= d.v;
        if(count > 0) {
            let col = document.createElement('div'); col.className = 'chip-col';
            for(let i=0; i<Math.min(count, 10); i++) {
                let c = document.createElement('div');
                c.className = `chip ${d.c}`;
                col.appendChild(c);
            }
            el.appendChild(col);
        }
    });
}

function renderHand(p, reveal=false) {
    const el = document.getElementById(`hand-${p.id}`);
    el.innerHTML = '';
    p.hand.forEach((c, i) => {
        const img = document.createElement('img');
        img.className = 'card-img';
        if(p.isUser) {
            img.src = c.image;
            img.className = 'card-img user-card'; // Reset classes to base
            if(p.discards.includes(i)) img.classList.add('discard-selected');
            
            img.onclick = () => {
                if(game.phase === 'DRAW') {
                    if(p.discards.includes(i)) {
                        p.discards = p.discards.filter(x=>x!==i);
                        img.classList.remove('discard-selected');
                    } else {
                        p.discards.push(i);
                        img.classList.add('discard-selected');
                    }
                }
            };
        } else {
            img.src = reveal ? c.image : 'https://deckofcardsapi.com/static/img/back.png';
        }
        el.appendChild(img);
    });
}

async function drawCards(n) {
    if(!game.deckId) return [];
    let r = await fetch(`${API_BASE}/${game.deckId}/draw/?count=${n}`);
    let d = await r.json();
    if(!d.success) {
        await fetch(`${API_BASE}/${game.deckId}/shuffle/`);
        r = await fetch(`${API_BASE}/${game.deckId}/draw/?count=${n}`);
        d = await r.json();
    }
    return d.cards;
}

// Minimal Eval
function evaluateHand(h) {
    const v=h.map(c=>VALUES[c.value]).sort((a,b)=>a-b);
    const s=h.map(c=>c.suit);
    const counts={}; v.forEach(x=>counts[x]=(counts[x]||0)+1);
    const cv=Object.values(counts);
    const isFl=s.every(x=>x===s[0]);
    let isSt=false; if(v.length===5 && v[4]-v[0]===4 && new Set(v).size===5) isSt=true;
    
    let r=0,n="High Card";
    if(isFl&&isSt){r=8;n="Str. Flush";}
    else if(cv.includes(4)){r=7;n="Quads";}
    else if(cv.includes(3)&&cv.includes(2)){r=6;n="Full House";}
    else if(isFl){r=5;n="Flush";}
    else if(isSt){r=4;n="Straight";}
    else if(cv.includes(3)){r=3;n="Trips";}
    else if(cv.filter(x=>x===2).length===2){r=2;n="2 Pair";}
    else if(cv.includes(2)){r=1;n="Pair";}
    
    let sc=r*1e6 + v.reduce((a,b,i)=>a+b*Math.pow(15,i),0);
    return {rank:r, name:n, score:sc};
}