"use strict";
// Cards and ranks
const card = {
  suit: ["Spade", "Heart", "Diamond", "Club"],
  rank: ["6", "7", "8", "9", "10", "J", "Q", "K", "A"],
};
// Class representing a single card
class Card {
  constructor(suit, rank, value) {
    this.suit = suit;
    this.rank = rank;
    this.value = value;
  }
  isTrump(currentTrumpSuit) {
    return this.suit === currentTrumpSuit;
  }
}
// Creates a deck of cards and provides methods to shuffle and deal hands
class Deck {
  constructor(cardRef) {
    this.cards = [];
    this.formCard(cardRef);
  }
  formCard(cardRef) {
    for (const currentSuit of cardRef.suit) {
      for (let i = 0; i < cardRef.rank.length; i++) {
        const currentRank = cardRef.rank[i];
        const currentValue = i;
        const newCard = new Card(currentSuit, currentRank, currentValue);
        this.cards.push(newCard);
      }
    }
  }
  shuffleDeck() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  dealHand(count = 6) {
    const hand = [];
    for (let i = 0; i < count; i++) {
      hand.push(this.cards.pop());
    }
    return hand;
  }
}
// Main game class that manages the game state, player and bot hands, and game logic
class Game {
  constructor(cardRef) {
    this.trumpSuit = null;
    this.deck = [];
    this.table = [];
    this.discardPile = [];
    this.attacker = null;
    this.defender = null;
    this.deckManager = new Deck(cardRef);
    this.players = [
      new Players(1, "Player", "human"),
      new Bot(2, "Bot", "bot"),
    ];
  }
  startNewGame() {
    this.table = [];
    this.discardPile = [];
    this.deckManager.shuffleDeck();
    const trumpCard = this.deckManager.cards[this.deckManager.cards.length - 1];
    this.trumpSuit = trumpCard.suit;
    this.deckManager.cards.pop();
    this.deckManager.cards.unshift(trumpCard);
    this.players[0].receiveCards(this.deckManager.dealHand(6));
    this.players[1].receiveCards(this.deckManager.dealHand(6));
    this.firstPlayer();
  }
  firstPlayer() {
    const playerMin = this.players[0].getMinTrump(this.trumpSuit);
    const botMin = this.players[1].getMinTrump(this.trumpSuit);
    if (playerMin === Infinity && botMin === Infinity) {
      this.attacker = this.players[0];
      this.defender = this.players[1];
    } else if (playerMin < botMin) {
      this.attacker = this.players[0];
      this.defender = this.players[1];
    } else {
      this.attacker = this.players[1];
      this.defender = this.players[0];
    }
  }
  attack(cardIndex) {
    const chosenCard = this.attacker.hand[cardIndex];
    if (!chosenCard) {
      return;
    }
    if (this.table.length === 0) {
      this.attacker.removeCard(cardIndex);
      this.table.push({ attackCard: chosenCard, defendCard: null });
      return;
    }
    const tableRanks = [];
    for (const pair of this.table) {
      tableRanks.push(pair.attackCard.rank);
      if (pair.defendCard) {
        const defendRank = pair.defendCard.rank;
        tableRanks.push(defendRank);
      }
    }
    if (!tableRanks.includes(chosenCard.rank)) {
      return false;
    }
    this.attacker.removeCard(cardIndex);
    this.table.push({ attackCard: chosenCard, defendCard: null });
  }
  defense(defenseCardIndex, tablePairIndex) {
    const chosenDefenseCard = this.defender.hand[defenseCardIndex];
    const targetPair = this.table[tablePairIndex];
    if (!chosenDefenseCard || !targetPair) {
      return;
    }
    if (targetPair.defendCard !== null) {
      return;
    }
    const attackCard = targetPair.attackCard;
    const isSameSuitAndHigher =
      chosenDefenseCard.suit === attackCard.suit &&
      chosenDefenseCard.value > attackCard.value;
    const isTrumpOverNormal =
      chosenDefenseCard.suit === this.trumpSuit &&
      attackCard.suit !== this.trumpSuit;
    const isTrumpOverTrump =
      chosenDefenseCard.suit === this.trumpSuit &&
      attackCard.suit === this.trumpSuit &&
      chosenDefenseCard.value > attackCard.value;
    if (isSameSuitAndHigher || isTrumpOverNormal || isTrumpOverTrump) {
      this.defender.removeCard(defenseCardIndex);
      targetPair.defendCard = chosenDefenseCard;
    }
  }
  beatCard() {
    for (const pair of this.table) {
      this.discardPile.push(pair.attackCard);
      if (pair.defendCard) {
        this.discardPile.push(pair.defendCard);
      }
    }
    this.table = [];
  }
  takeCard() {
    const cardsToTake = [];
    for (const pair of this.table) {
      cardsToTake.push(pair.attackCard);
      if (pair.defendCard) {
        cardsToTake.push(pair.defendCard);
      }
    }
    this.defender.receiveCards(cardsToTake);
    this.table = [];
  }
  refillHands() {
    const attackerNeed = 6 - this.attacker.hand.length;
    if (attackerNeed > 0 && this.deckManager.cards.length > 0) {
      const countToDraw = Math.min(attackerNeed, this.deckManager.cards.length);
      const drawnCards = this.deckManager.dealHand(countToDraw);
      this.attacker.receiveCards(drawnCards);
    }
    const defenderNeed = 6 - this.defender.hand.length;
    if (defenderNeed > 0 && this.deckManager.cards.length > 0) {
      const countToDraw = Math.min(defenderNeed, this.deckManager.cards.length);
      const drawnCards = this.deckManager.dealHand(countToDraw);
      this.defender.receiveCards(drawnCards);
    }
  }
  endTurn(action) {
    if (action === "beat") {
      this.beatCard();
      [this.attacker, this.defender] = [this.defender, this.attacker];
    } else if (action === "take") {
      this.takeCard();
    }
    this.refillHands();
  }
  canThrowIn(chosenCard) {
    if (this.table.length === 0) return false;
    let tableCardCount = 0;
    for (const pair of this.table) {
      tableCardCount++;
      if (pair.defendCard) tableCardCount++;
    }
    if (tableCardCount >= this.defender.hand.length || tableCardCount >= 6) {
      return false;
    }
    const tableRanks = [];
    for (const pair of this.table) {
      tableRanks.push(pair.attackCard.rank);
      if (pair.defendCard) {
        tableRanks.push(pair.defendCard.rank);
      }
    }
    return tableRanks.includes(chosenCard.rank);
  }
  checkGameOver() {
    if (this.deckManager.cards.length === 0 && this.table.length === 0) {
      const playerHandLength = this.players[0].hand.length;
      const botHandLength = this.players[1].hand.length;
      if (playerHandLength === 0 && botHandLength === 0) {
        return "draw";
      } else if (playerHandLength === 0) {
        return "human";
      } else if (botHandLength === 0) {
        return "bot";
      }
    }
    return false;
  }
}
class Players {
  constructor(id, name, type = "human") {
    this.id = id;
    this.name = name;
    this.type = type;
    this.hand = [];
  }
  getMinTrump(trumpSuit) {
    let minRankValue = Infinity;
    for (const currentCard of this.hand) {
      if (currentCard.suit === trumpSuit && currentCard.value < minRankValue) {
        minRankValue = currentCard.value;
      }
    }
    return minRankValue;
  }
  receiveCards(drawnCards) {
    this.hand.push(...drawnCards);
  }
  removeCard(cardIndex) {
    if (cardIndex < 0 || cardIndex >= this.hand.length) return null;
    return this.hand.splice(cardIndex, 1)[0];
  }
}
class Bot extends Players {
  constructor(id, name, type = "bot") {
    super(id, name, type);
  }
  botAttack(game) {
    if (this.hand.length === 0) return null;
    if (game.table.length === 0) {
      let bestCardIndex = 0;
      for (let i = 1; i < this.hand.length; i++) {
        const currentCard = this.hand[i];
        const bestCard = this.hand[bestCardIndex];
        const bestIsTrump = bestCard.suit === game.trumpSuit;
        const currentIsTrump = currentCard.suit === game.trumpSuit;
        if (bestIsTrump && !currentIsTrump) {
          bestCardIndex = i;
        } else if (bestIsTrump === currentIsTrump) {
          if (currentCard.value < bestCard.value) {
            bestCardIndex = i;
          }
        }
      }
      const cardToAttack = this.hand[bestCardIndex];
      game.attack(bestCardIndex);
      return cardToAttack;
    }
    for (let i = this.hand.length - 1; i >= 0; i--) {
      const botCard = this.hand[i];
      if (game.canThrowIn(botCard)) {
        if (
          botCard.suit === game.trumpSuit &&
          game.deckManager.cards.length > 0
        ) {
          continue;
        }
        game.attack(i);
        return botCard;
      }
    }
    return null;
  }
  botDefense(game) {
    let targetPairIndex = -1;
    for (let i = 0; i < game.table.length; i++) {
      if (game.table[i].defendCard === null) {
        targetPairIndex = i;
        break;
      }
    }
    if (targetPairIndex === -1) return false;
    const attackCard = game.table[targetPairIndex].attackCard;
    const candidates = [];
    for (let i = 0; i < this.hand.length; i++) {
      const botCard = this.hand[i];
      const isSameSuitAndHigher =
        botCard.suit === attackCard.suit && botCard.value > attackCard.value;
      const isTrumpOverNormal =
        botCard.suit === game.trumpSuit && attackCard.suit !== game.trumpSuit;
      const isTrumpOverTrump =
        botCard.suit === game.trumpSuit &&
        attackCard.suit === game.trumpSuit &&
        botCard.value > attackCard.value;
      if (isSameSuitAndHigher || isTrumpOverNormal || isTrumpOverTrump) {
        candidates.push({ cardObj: botCard, index: i });
      }
    }
    if (candidates.length === 0) {
      game.endTurn("take");
      return false;
    }
    let bestCandidate = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
      const current = candidates[i];
      const best = bestCandidate;
      const bestIsTrump = best.cardObj.suit === game.trumpSuit;
      const currentIsTrump = current.cardObj.suit === game.trumpSuit;
      if (bestIsTrump && !currentIsTrump) {
        bestCandidate = current;
      } else if (bestIsTrump === currentIsTrump) {
        if (current.cardObj.value < best.cardObj.value) {
          bestCandidate = current;
        }
      }
    }
    game.defense(bestCandidate.index, targetPairIndex);
    return true;
  }
}
