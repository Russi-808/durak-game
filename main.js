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
    this.playerHand = [];
    this.botHand = [];
    this.table = [];
    this.discardPile = [];
    this.attacker = null;
    this.defender = null;
    this.deckManager = new Deck(cardRef);
  }
  startNewGame() {
    this.table = [];
    this.discardPile = [];
    this.deckManager.shuffleDeck();
    const trumpCard = this.deckManager.cards[this.deckManager.cards.length - 1];
    this.trumpSuit = trumpCard.suit;
    this.playerHand = this.deckManager.dealHand(6);
    this.botHand = this.deckManager.dealHand(6);
    this.firstPlayer();
    alert("Start the game:", this);
  }
  firstPlayer() {
    let playerMinRankValue = Infinity;
    let botMinRankValue = Infinity;
    for (const currentCard of this.playerHand) {
      if (
        currentCard.suit === this.trumpSuit &&
        currentCard.value < playerMinRankValue
      ) {
        playerMinRankValue = currentCard.value;
      }
    }
    for (const currentCard of this.botHand) {
      if (
        currentCard.suit === this.trumpSuit &&
        currentCard.value < botMinRankValue
      ) {
        botMinRankValue = currentCard.value;
      }
    }
    if (playerMinRankValue === Infinity && botMinRankValue === Infinity) {
      this.attacker = "player";
      this.defender = "bot";
    } else if (playerMinRankValue < botMinRankValue) {
      this.attacker = "player";
      this.defender = "bot";
    } else {
      this.attacker = "bot";
      this.defender = "player";
    }
    if (this.attacker === "player") {
      alert("You start the game!");
    } else {
      alert("Bot starts the game!");
    }
  }
  attack(cardIndex) {
    const attackerHand =
      this.attacker === "player" ? this.playerHand : this.botHand;
    const chosenCard = attackerHand[cardIndex];
    if (!chosenCard) {
      return;
    }
    if (this.table.length === 0) {
      attackerHand.splice(cardIndex, 1);
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
    attackerHand.splice(cardIndex, 1);
    this.table.push({ attackCard: chosenCard, defendCard: null });
    alert(`Card played: ${chosenCard.suit} ${chosenCard.rank}`);
  }
  defense(defenseCardIndex, tablePairIndex) {
    const defenderHand =
      this.defender === "player" ? this.playerHand : this.botHand;
    const chosenDefenseCard = defenderHand[defenseCardIndex];
    const targetPair = this.table[tablePairIndex];
    if (!chosenDefenseCard || !targetPair) {
      alert("invalid card! Choose another one.");
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
      defenderHand.splice(defenseCardIndex, 1);
      targetPair.defendCard = chosenDefenseCard;
      alert("Card successfully defended!");
    } else {
      alert("This card cannot be used to defend the card on the table!");
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
    const defenderHand =
      this.defender === "player" ? this.playerHand : this.botHand;
    for (const pair of this.table) {
      defenderHand.push(pair.attackCard);
      if (pair.defendCard) {
        defenderHand.push(pair.defendCard);
      }
    }
    this.table = [];
  }
  refillHands() {
    const attackerHand =
      this.attacker === "player" ? this.playerHand : this.botHand;
    const defenderHand =
      this.defender === "player" ? this.playerHand : this.botHand;
    const attackerNeed = 6 - attackerHand.length;
    if (attackerNeed > 0 && this.deckManager.cards.length > 0) {
      const countToDraw = Math.min(attackerNeed, this.deckManager.cards.length);
      const drawnCards = this.deckManager.dealHand(countToDraw);
      attackerHand.push(...drawnCards);
    }
    const defenderNeed = 6 - defenderHand.length;
    if (defenderNeed > 0 && this.deckManager.cards.length > 0) {
      const countToDraw = Math.min(defenderNeed, this.deckManager.cards.length);
      const drawnCards = this.deckManager.dealHand(countToDraw);
      defenderHand.push(...drawnCards);
    }
  }
  endTurn(action) {
    if (action === "beat") {
      this.beatCard();
      [this.attacker, this.defender] = [this.defender, this.attacker];
    }
    if (action === "take") {
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
    const defenderHand =
      this.defender === "player" ? this.playerHand : this.botHand;
    if (tableCardCount >= defenderHand.length || tableCardCount >= 6) {
      alert("Cannot add more cards.!");
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
  botAttack() {
    if (this.botHand.length === 0) return null;
    if (this.table.length === 0) {
      let bestCardIndex = 0;
      for (let i = 1; i < this.botHand.length; i++) {
        const currentCard = this.botHand[i];
        const bestCard = this.botHand[bestCardIndex];
        const bestIsTrump = bestCard.suit === this.trumpSuit;
        const currentIsTrump = currentCard.suit === this.trumpSuit;
        if (bestIsTrump && !currentIsTrump) {
          bestCardIndex = i;
        } else if (bestIsTrump === currentIsTrump) {
          if (currentCard.value < bestCard.value) {
            bestCardIndex = i;
          }
        }
      }
      const cardToAttack = this.botHand[bestCardIndex];
      this.attack(bestCardIndex);
      return cardToAttack;
    }
    for (let i = 0; i < this.botHand.length; i++) {
      const botCard = this.botHand[i];
      if (this.canThrowIn(botCard)) {
        if (
          botCard.suit === this.trumpSuit &&
          this.deckManager.cards.length > 0
        ) {
          continue;
        }
        this.attack(i);
        return botCard;
      }
    }
    return null;
  }
  botDefense() {
    let targetPairIndex = -1;
    for (let i = 0; i < this.table.length; i++) {
      if (this.table[i].defendCard === null) {
        targetPairIndex = i;
        break;
      }
    }
    if (targetPairIndex === -1) return false;
    const attackCard = this.table[targetPairIndex].attackCard;
    const candidates = [];
    for (let i = 0; i < this.botHand.length; i++) {
      const botCard = this.botHand[i];
      const isSameSuitAndHigher =
        botCard.suit === attackCard.suit && botCard.value > attackCard.value;
      const isTrumpOverNormal =
        botCard.suit === this.trumpSuit && attackCard.suit !== this.trumpSuit;
      const isTrumpOverTrump =
        botCard.suit === this.trumpSuit &&
        attackCard.suit === this.trumpSuit &&
        botCard.value > attackCard.value;
      if (isSameSuitAndHigher || isTrumpOverNormal || isTrumpOverTrump) {
        candidates.push({ cardObj: botCard, index: i });
      }
    }
    if (candidates.length === 0) {
      alert("Bot cannot defend and takes the cards.");
      this.endTurn("take");
      return false;
    }
    let bestCandidate = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
      const current = candidates[i];
      const best = bestCandidate;
      const bestIsTrump = best.cardObj.suit === this.trumpSuit;
      const currentIsTrump = current.cardObj.suit === this.trumpSuit;
      if (bestIsTrump && !currentIsTrump) {
        bestCandidate = current;
      } else if (bestIsTrump === currentIsTrump) {
        if (current.cardObj.value < best.cardObj.value) {
          bestCandidate = current;
        }
      }
    }
    alert(
      `Bot defends ${attackCard.suit} ${attackCard.rank} with ${bestCandidate.cardObj.suit} ${bestCandidate.cardObj.rank}`,
    );
    this.defense(bestCandidate.index, targetPairIndex);
    return true;
  }
  checkGameOver() {
    if (this.deckManager.cards.length === 0 && this.table.length === 0) {
      if (this.playerHand.length === 0 && this.botHand.length === 0) {
        alert("It's a draw!");
        return "draw";
      } else if (this.playerHand.length === 0) {
        alert("You win!");
        return "player";
      } else if (this.botHand.length === 0) {
        alert("Bot wins. Game over!");
        return "bot";
      }
    }
    return false;
  }
}
