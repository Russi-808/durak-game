"use strict";
import { gameSettings, getCardConfig } from "./settings.js";
// Form card
export class Card {
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
export class Deck {
  constructor() {
    this.cards = [];
    this.formCard();
  }
  formCard() {
    const cardRef = getCardConfig();
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
export class Game {
  constructor() {
    this.trumpSuit = null;
    this.deck = [];
    this.table = [];
    this.discardPile = [];
    this.attacker = null;
    this.defender = null;
    this.deckManager = new Deck();
    this.players = [];
    for (let i = 0; i < gameSettings.maxPlayers; i++) {
      if (i === 0) {
        this.players.push(new Players(i + 1, "Player", "human"));
      } else {
        this.players.push(new Bot(i + 1, `Bot ${i}`, "bot"));
      }
    }
  }
  startNewGame() {
    this.deckManager = new Deck();
    this.table = [];
    this.discardPile = [];
    this.deckManager.shuffleDeck();
    const trumpCard = this.deckManager.cards[this.deckManager.cards.length - 1];
    this.trumpSuit = trumpCard.suit;
    this.deckManager.cards.pop();
    this.deckManager.cards.unshift(trumpCard);
    for (const player of this.players) {
      player.receiveCards(this.deckManager.dealHand(6));
    }
    this.firstPlayer();
  }
  firstPlayer() {
    let minTrumpValue = Infinity;
    let firstIndex = 0;
    this.players.forEach((player, index) => {
      const playerMin = player.getMinTrump(this.trumpSuit);
      if (playerMin < minTrumpValue) {
        minTrumpValue = playerMin;
        firstIndex = index;
      }
    });
    this.attacker = this.players[firstIndex];
    const defenderIndex = (firstIndex + 1) % this.players.length;
    this.defender = this.players[defenderIndex];
  }
  attack(cardIndex, attackingPlayer = this.attacker) {
    const chosenCard = attackingPlayer.hand[cardIndex];
    if (!chosenCard) {
      return;
    }
    if (this.table.length === 0) {
      attackingPlayer.removeCard(cardIndex);
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
    attackingPlayer.removeCard(cardIndex);
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
  botsThrowIn() {
    let cardWasThrown = false;
    do {
      cardWasThrown = false;
      for (const player of this.players) {
        if (player.type === "human" || player === this.defender) continue;
        const thrownCard = player.botAttack(this);
        if (thrownCard) {
          cardWasThrown = true;
          break;
        }
      }
    } while (cardWasThrown);
  }
  refillHands() {
    const attackerIndex = this.players.indexOf(this.attacker);
    const numPlayers = this.players.length;
    for (let i = 0; i < numPlayers; i++) {
      const playerIndex = (attackerIndex + i) % numPlayers;
      const player = this.players[playerIndex];
      if (player === this.defender) continue;
      const need = 6 - player.hand.length;
      if (need > 0 && this.deckManager.cards.length > 0) {
        const countToDraw = Math.min(need, this.deckManager.cards.length);
        const drawnCards = this.deckManager.dealHand(countToDraw);
        player.receiveCards(drawnCards);
      }
    }
    const defenderNeed = 6 - this.defender.hand.length;
    if (defenderNeed > 0 && this.deckManager.cards.length > 0) {
      const countToDraw = Math.min(defenderNeed, this.deckManager.cards.length);
      const drawnCards = this.deckManager.dealHand(countToDraw);
      this.defender.receiveCards(drawnCards);
    }
  }
  endTurn(action) {
    const defenderIndex = this.players.indexOf(this.defender);
    if (action === "beat") {
      this.beatCard();
      this.attacker = this.defender;
      this.defender = this.players[(defenderIndex + 1) % this.players.length];
    } else if (action === "take") {
      this.takeCard();
      this.attacker = this.players[(defenderIndex + 1) % this.players.length];
      this.defender = this.players[(defenderIndex + 2) % this.players.length];
    }
    this.refillHands();
  }
  checkGameOver() {
    if (this.deckManager.cards.length === 0 && this.table.length === 0) {
      const playersWithCards = this.players.filter(
        (player) => player.hand.length > 0,
      );
      if (playersWithCards.length === 0) {
        return "draw";
      }
      if (playersWithCards.length > 1) {
        return false;
      }
      const loser = playersWithCards[0];
      return loser;
    }
    return false;
  }
}
export class Players {
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
export class Bot extends Players {
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
      game.attack(bestCardIndex, this);
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
        game.attack(i, this);
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
