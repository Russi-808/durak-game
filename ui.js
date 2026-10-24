"use strict";

import { Game } from "./main.js";
import { gameSettings } from "./settings.js";

// ==========================================
// 1. INITIALIZATION AND DOM ELEMENTS
// ==========================================
const game = new Game();

// Screen containers
const menuContainer = document.getElementById("menu-container");
const gameContainer = document.getElementById("game-container");

// Menu and control buttons
const btn36 = document.getElementById("btn-36");
const btn52 = document.getElementById("btn-52");
const startGameBtn = document.getElementById("start-game-btn");
const actionBtn = document.getElementById("action-btn");
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings-btn");

const btnClassic = document.getElementById("btn-classic");
const btnTransfer = document.getElementById("btn-transfer");
// Game zones
const botHandEl = document.getElementById("bot-hand");
const tableZoneEl = document.getElementById("table-zone");
const playerHandEl = document.getElementById("player-hand");
const gameMessageEl = document.getElementById("game-message");
const deckCountBubbleEl = document.getElementById("deck-count-bubble");
const trumpCardSlotEl = document.getElementById("trump-card-slot");

// UI state
let isBotThinking = false;

// ==========================================
// 2. SETTINGS AND START HANDLERS
// ==========================================
if (btn36 && btn52) {
  btn36.addEventListener("click", () => {
    gameSettings.deckSize = 36;
    btn36.classList.add("active");
    btn52.classList.remove("active");
  });

  btn52.addEventListener("click", () => {
    gameSettings.deckSize = 52;
    btn52.classList.add("active");
    btn36.classList.remove("active");
  });
}
startGameBtn.addEventListener("click", () => {
  menuContainer.classList.add("hidden");
  gameContainer.classList.remove("hidden");

  game.startNewGame();
  updateUI();

  if (game.attacker.type === "bot") {
    triggerBotTurn();
  }
});
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.remove("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

if (btnClassic && btnTransfer) {
  btnClassic.addEventListener("click", () => {
    gameSettings.mode = "classic";
    btnClassic.classList.add("active");
    btnTransfer.classList.remove("active");
  });

  btnTransfer.addEventListener("click", () => {
    gameSettings.mode = "transfer";
    btnTransfer.classList.add("active");
    btnClassic.classList.remove("active");
  });
}
// ==========================================
// 3. HELPER FUNCTIONS AND RENDERING (RENDER)
// ==========================================
function showGameMessage(text) {
  if (!gameMessageEl) return;
  gameMessageEl.innerText = text;
  gameMessageEl.classList.remove("message-hidden");
  setTimeout(() => {
    if (gameMessageEl.innerText === text) {
      gameMessageEl.classList.add("message-hidden");
    }
  }, 3000);
}

function createCardDOM(cardObj, isBot = false) {
  const cardDiv = document.createElement("div");
  cardDiv.classList.add("card-ui");

  if (isBot) {
    cardDiv.classList.add("shirt");
    cardDiv.innerText = "🂠";
    return cardDiv;
  }

  if (cardObj.suit === "Heart" || cardObj.suit === "Diamond") {
    cardDiv.classList.add("red");
  }

  const suitSymbols = { Spade: "♠", Heart: "♥", Diamond: "♦", Club: "♣" };
  const symbol = suitSymbols[cardObj.suit] || cardObj.suit;
  cardDiv.innerHTML = `<div>${cardObj.rank}</div><div>${symbol}</div>`;

  return cardDiv;
}

function updateUI() {
  // 1. Deck and Trump
  if (deckCountBubbleEl && game.deckManager?.cards) {
    deckCountBubbleEl.innerText = game.deckManager.cards.length;
  }

  if (game.trumpSuit && trumpCardSlotEl) {
    const suitSymbols = { Spade: "♠", Heart: "♥", Diamond: "♦", Club: "♣" };
    const symbol = suitSymbols[game.trumpSuit] || game.trumpSuit;
    trumpCardSlotEl.innerText = symbol;

    if (game.trumpSuit === "Heart" || game.trumpSuit === "Diamond") {
      trumpCardSlotEl.classList.add("red");
    } else {
      trumpCardSlotEl.classList.remove("red");
    }
  }

  // 2. Player Hand
  playerHandEl.innerHTML = "";
  game.players[0].hand.forEach((cardObj, index) => {
    const cardDiv = createCardDOM(cardObj);
    cardDiv.addEventListener("click", () => handlePlayerCardClick(index));
    playerHandEl.appendChild(cardDiv);
  });

  // 3. Bot Hand
  botHandEl.innerHTML = "";
  game.players[1].hand.forEach((cardObj) => {
    const cardDiv = createCardDOM(cardObj, true);
    botHandEl.appendChild(cardDiv);
  });

  // 4. Game table
  tableZoneEl.innerHTML = "";
  game.table.forEach((pair) => {
    const pairDiv = document.createElement("div");
    pairDiv.classList.add("table-pair");

    const attackCardDiv = createCardDOM(pair.attackCard);
    attackCardDiv.classList.add("attack-card");
    pairDiv.appendChild(attackCardDiv);

    if (pair.defendCard) {
      const defendCardDiv = createCardDOM(pair.defendCard);
      defendCardDiv.classList.add("defend-card");
      pairDiv.appendChild(defendCardDiv);
    }
    tableZoneEl.appendChild(pairDiv);
  });

  // 5. Action button
  const hasUnbeatenCards = game.table.some((pair) => pair.defendCard === null);
  if (game.attacker.type === "human") {
    actionBtn.innerText = "Done";
    actionBtn.disabled = game.table.length === 0;
  } else {
    if (game.table.length > 0 && !hasUnbeatenCards) {
      actionBtn.innerText = "Done (Your Turn)";
      actionBtn.disabled = false;
    } else {
      actionBtn.innerText = "Take Cards";
      actionBtn.disabled = game.table.length === 0;
    }
  }

  // 6. Check game over
  const winner = game.checkGameOver();
  if (winner) {
    isBotThinking = false;
    if (winner === "draw") showGameMessage("Draw! Game Over.");
    else if (winner === "human" || winner?.type === "human")
      showGameMessage("You Won! Congratulations!");
    else showGameMessage("Bot Won! Better luck next time.");
    actionBtn.disabled = true;
  }
}

// ==========================================
// 4. GAME LOGIC AND UI EVENTS
// ==========================================
function handlePlayerCardClick(index) {
  if (isBotThinking) return;

  if (game.attacker.type === "human") {
    const oldTableLength = game.table.length;
    game.attack(index);

    if (game.table.length > oldTableLength) {
      game.botsThrowIn(); // Bots throw in if possible
      updateUI();
      triggerBotTurn();
    } else {
      showGameMessage("You cannot attack with this card.");
    }
  } else {
    const targetPairIndex = game.table.findIndex(
      (pair) => pair.defendCard === null,
    );

    if (targetPairIndex !== -1) {
      const oldDefendCard = game.table[targetPairIndex].defendCard;
      game.defense(index, targetPairIndex);

      if (game.table[targetPairIndex].defendCard !== oldDefendCard) {
        updateUI();
        const hasUnbeatenCards = game.table.some(
          (pair) => pair.defendCard === null,
        );
        if (!hasUnbeatenCards && game.attacker.type === "bot") {
          triggerBotTurn();
        }
      } else {
        showGameMessage("You cannot defend with this card.");
      }
    }
  }
}

actionBtn.addEventListener("click", () => {
  if (isBotThinking) return;
  const hasUnbeatenCards = game.table.some((pair) => pair.defendCard === null);

  if (game.table.length === 0) {
    showGameMessage("You must play a card first.");
    return;
  }

  if (game.attacker.type === "human") {
    game.endTurn("beat");
    showGameMessage("Cards moved to discard pile.");
    updateUI();
    triggerBotTurn();
  } else {
    if (game.table.length > 0 && !hasUnbeatenCards) {
      game.endTurn("beat");
      showGameMessage("Successful defense! Your turn to attack.");
    } else {
      game.endTurn("take");
      showGameMessage("You took the cards.");
    }
    updateUI();
    if (game.attacker.type === "bot") {
      triggerBotTurn();
    }
  }
});

// ==========================================
// 5. BOT TURN LOGIC
// ==========================================
function triggerBotTurn() {
  if (game.checkGameOver()) return;
  isBotThinking = true;
  setTimeout(botTurn, 600);
}

function botTurn() {
  if (game.checkGameOver()) {
    isBotThinking = false;
    return;
  }

  if (game.attacker.type === "bot") {
    const attackedCard = game.players[1].botAttack(game);
    if (attackedCard) {
      showGameMessage("Bot attacks!");
      updateUI();
      isBotThinking = false;
    } else {
      if (game.table.length > 0) {
        game.endTurn("beat");
        showGameMessage("Successful defense! Your turn to attack.");
      }
      updateUI();
      isBotThinking = false;
    }
  } else {
    const success = game.players[1].botDefense(game);
    if (success) {
      showGameMessage("Bot successfully defended!");
      updateUI();
      isBotThinking = false;
    } else {
      showGameMessage("Bot couldn't defend and took cards!");
      updateUI();
      isBotThinking = false;
    }
  }
}
