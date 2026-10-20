"use strict";
const game = new Game(card);
game.startNewGame();
const botHandEl = document.getElementById("bot-hand");
const tableZoneEl = document.getElementById("table-zone");
const playerHandEl = document.getElementById("player-hand");
const actionBtn = document.getElementById("action-btn");
const trumpSuitDisplayEl = document.getElementById("trump-suit-display");
const deckCountDisplayEl = document.getElementById("deck-count-display");
const gameMessageEl = document.getElementById("game-message");
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
  if (deckCountDisplayEl && game.deck) {
    deckCountDisplayEl.innerText = game.deck.length;
  }
  if (game.trumpSuit && trumpSuitDisplayEl) {
    const suitSymbols = { Spade: "♠", Heart: "♥", Diamond: "♦", Club: "♣" };
    const symbol = suitSymbols[game.trumpSuit] || game.trumpSuit;
    trumpSuitDisplayEl.innerText = symbol;
    if (game.trumpSuit === "Heart" || game.trumpSuit === "Diamond") {
      trumpSuitDisplayEl.classList.add("red");
    } else {
      trumpSuitDisplayEl.classList.remove("red");
    }
  }
  playerHandEl.innerHTML = "";
  game.playerHand.forEach((cardObj, index) => {
    const cardDiv = createCardDOM(cardObj);
    cardDiv.addEventListener("click", () => {
      if (game.attacker === "player") {
        game.attack(index);
        updateUI();
        setTimeout(botTurn, 600);
      } else {
        const targetPairIndex = game.table.findIndex(
          (pair) => pair.defendCard === null,
        );
        if (targetPairIndex !== -1) {
          game.defense(index, targetPairIndex);
          updateUI();

          const hasUnbeatenCards = game.table.some(
            (pair) => pair.defendCard === null,
          );
          if (!hasUnbeatenCards && game.attacker === "bot") {
            setTimeout(botTurn, 800);
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
  } else {
    if (game.table.length > 0 && !hasUnbeatenCards) {
      actionBtn.innerText = "Done (Your Turn)";
    } else {
      actionBtn.innerText = "Take Cards";
    }
  }
  if (game.checkGameOver()) {
    if (game.playerHand.length === 0 && game.botHand.length === 0) {
      showGameMessage("Draw! Game Over.");
    } else if (game.playerHand.length === 0) {
      showGameMessage("You Won! Congratulations!");
    } else if (game.botHand.length === 0) {
      showGameMessage("Bot Won! Better luck next time.");
    }
  }
}
actionBtn.addEventListener("click", () => {
  const hasUnbeatenCards = game.table.some((pair) => pair.defendCard === null);
  if (game.table.length === 0) {
    showGameMessage("You must play a card first.");
    return;
  }
  if (game.attacker === "player") {
    game.endTurn("beat");
    showGameMessage("Cards moved to discard pile.");
    updateUI();
    setTimeout(botTurn, 600);
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
      setTimeout(botTurn, 600);
    }
  }
});
function botTurn() {
  if (game.checkGameOver()) return;
  if (game.attacker === "bot") {
    const attackedCard = game.botAttack();
    if (attackedCard) {
      showGameMessage("Bot attacks!");
    }
    updateUI();
    if (attackedCard) {
      const hasUnbeatenCards = game.table.some(
        (pair) => pair.defendCard === null,
      );
      if (!hasUnbeatenCards) {
        setTimeout(botTurn, 1000);
      }
    }
  } else {
    const success = game.botDefense();
    if (success) {
      showGameMessage("Bot successfully defended!");
    } else {
      showGameMessage("Bot couldn't defend and took cards!");
    }
    updateUI();
  }
}
if (game.attacker === "bot") {
  setTimeout(botTurn, 600);
}
updateUI();
