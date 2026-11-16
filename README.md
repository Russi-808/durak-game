# 🃏 Durak Card Game (Classic & Passing)

A fully functional, modern web-based version of the popular Russian card game **"Durak"**. Built with pure Vanilla JavaScript (ES6+ Modules), HTML5, and responsive CSS3, featuring a smart **Expert AI mode** and full mobile responsiveness.

🚀 **[Play the game live here!](https://russi-808.github.io/durak-game/)**

---

## 🎮 Features

* **Complete Game Rules:** Classic and passing game modes, card beating, drawing from the deck, transfer mechanics, and win/loss state handling.
* **🧠 Advanced Expert AI:** 
  * **Card Memory:** Tracks seen cards (`seenCards`) in the discard pile and on the table.
  * **Tactical Attack Strategies:** Targets void suits (predicting missing suits in the opponent's hand), executes combo-building (matching ranks), and manages endgame high-card/trump dumping.
  * **Dynamic Weighting:** Evaluates card values and game phases (adjusting weights when the deck is empty).
* **📱 Fully Responsive UI:** 
  * Optimized layout for desktop, tablets, and mobile devices using CSS Flexbox and media queries.
  * Smooth horizontal touch-scrolling for card hands to prevent overflow on small screens.
* **⚡ Pure Web Stack:** Zero heavy external dependencies or frameworks—clean, modular vanilla JavaScript.

---

## 🛠️ Project Structure

The project follows a clean, modular ES6 architecture:
* `index.html` - Core structure and layout of the game screen.
* `style.css` - Visual styling, card layouts, animations, and adaptive media queries.
* `main.js` - Main game state, loop, and controller logic.
* `ai.js` - AI decision-making algorithms, split into "Simple" and "Expert" logic with custom memory and card weighting.
* `settings.js` - Game configurations, modes, and card reference parameters.

---

## ⚙️ How to Run Locally

1. Clone the repository:
   ```bash
   git clone [https://github.com/Russi-808/durak-game.git](https://github.com/Russi-808/durak-game.git)
2. cd durak-game
   ---
*Created by [Russi-808](https://github.com/Russi-808)*
