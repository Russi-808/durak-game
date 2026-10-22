"use strict";
const game = new Game(card);

const menuContainer = document.getElementById("menu-container");
const gameContainer = document.getElementById("game-container");
const startGameBtn = document.getElementById("start-game-btn");

const botHandEl = document.getElementById("bot-hand");
const tableZoneEl = document.getElementById("table-zone");
const playerHandEl = document.getElementById("player-hand");
const actionBtn = document.getElementById("action-btn");
const gameMessageEl = document.getElementById("game-message");

const deckCountBubbleEl = document.getElementById("deck-count-bubble");
const trumpCardSlotEl = document.getElementById("trump-card-slot");
let isBotThinking = false;

startGameBtn.addEventListener("click", () => {
  menuContainer.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  game.startNewGame();
  updateUI();
  if (game.attacker === "bot") {
    triggerBotTurn();
  }
});

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
  playerHandEl.innerHTML = "";
  game.playerHand.forEach((cardObj, index) => {
    const cardDiv = createCardDOM(cardObj);
    cardDiv.addEventListener("click", () => {
      if (isBotThinking) return;

      if (game.attacker === "player") {
        const oldTableLength = game.table.length;
        game.attack(index);

        if (game.table.length > oldTableLength) {
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
            if (!hasUnbeatenCards && game.attacker === "bot") {
              triggerBotTurn();
            }
          } else {
            showGameMessage("You cannot defend with this card.");
          }
        }
      }
    });
    playerHandEl.appendChild(cardDiv);
  });
  botHandEl.innerHTML = "";
  game.botHand.forEach((cardObj) => {
    const cardDiv = createCardDOM(cardObj, true);
    botHandEl.appendChild(cardDiv);
  });
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
  const hasUnbeatenCards = game.table.some((pair) => pair.defendCard === null);
  if (game.attacker === "player") {
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
  const winner = game.checkGameOver();
  if (winner) {
    isBotThinking = false;
    if (winner === "draw") showGameMessage("Draw! Game Over.");
    else if (winner === "player") showGameMessage("You Won! Congratulations!");
    else if (winner === "bot")
      showGameMessage("Bot Won! Better luck next time.");
    actionBtn.disabled = true;
  }
}

actionBtn.addEventListener("click", () => {
  if (isBotThinking) return;
  const hasUnbeatenCards = game.table.some((pair) => pair.defendCard === null);

  if (game.table.length === 0) {
    showGameMessage("You must play a card first.");
    return;
  }

  if (game.attacker === "player") {
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
    if (game.attacker === "bot") {
      triggerBotTurn();
    }
  }
});

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

  if (game.attacker === "bot") {
    const attackedCard = game.botAttack();
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
    const success = game.botDefense();
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
