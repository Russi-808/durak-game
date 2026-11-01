"use strict";
import { gameSettings, getCardConfig } from "./settings.js";
export function botAttack(bot, game) {
  if (gameSettings.ai === "expert") {
    return expertBotAttack(bot, game);
  }
  return simpleBotAttack(bot, game);
}

export function botDefense(bot, game) {
  if (gameSettings.ai === "expert") {
    return expertBotDefense(bot, game);
  }
  return simpleBotDefense(bot, game);
}
export function cardWeight(card, trumpSuit, isDeckEmpty = false) {
  let weight = card.value;
  if (card.isTrump(trumpSuit)) {
    weight += isDeckEmpty ? 25 : 15;
  }
  return weight;
}
export function botMemory(bot, game) {
  const cardRef = getCardConfig();
  const allPossibleCards = [];
  for (const suit of cardRef.suit) {
    for (let i = 0; i < cardRef.rank.length; i++) {
      allPossibleCards.push({ suit: suit, rank: cardRef.rank[i], value: i });
    }
  }
  let seenCards = [...game.discardPile];
  game.table.forEach((pair) => {
    if (pair.attackCard) seenCards.push(pair.attackCard);
    if (pair.defendCard) seenCards.push(pair.defendCard);
  });
  const unknownCards = allPossibleCards.filter((fullCard) => {
    const isInSeen = seenCards.some(
      (card) => card.suit === fullCard.suit && card.value === fullCard.value,
    );
    const isInBotHand = bot.hand.some(
      (card) => card.suit === fullCard.suit && card.value === fullCard.value,
    );

    return !isInSeen && !isInBotHand;
  });
  return {
    seenCards,
    unknownCards,
  };
}
export function expertBotAttack(bot, game) {
  if (bot.hand.length === 0) return null;
  const memory = botMemory(bot, game);
  if (game.table.length === 0) {
    let bestCardIndex = 0;
    let lowestWeight = cardWeight(bot.hand[0], game);
    for (let i = 1; i < bot.hand.length; i++) {
      const currentCard = bot.hand[i];
      const currentWeight = cardWeight(currentCard, game);
      if (currentWeight < lowestWeight) {
        lowestWeight = currentWeight;
        bestCardIndex = i;
      }
    }
    const cardToAttack = bot.hand[bestCardIndex];
    game.attack(bestCardIndex, bot);
    return cardToAttack;
  }
  const possibleThrowIn = [];
  for (let i = 0; i < bot.hand.length; i++) {
    const botCard = bot.hand[i];
    if (game.canThrowIn(botCard)) {
      possibleThrowIn.push({ card: botCard, index: i });
    }
  }
  if (possibleThrowIn.length === 0) {
    return null;
  }
  let bestThrowIn = possibleThrowIn[0];
  let lowestThrowIn = cardWeight(bestThrowIn.card, game);
  for (let i = 1; i < possibleThrowIn.length; i++) {
    const current = possibleThrowIn[i];
    const currentWeight = cardWeight(current.card, game);
    const isCurrentTrump = current.card.suit === game.trumpSuit;
    const isBestTrump = bestThrowIn.card.suit === game.trumpSuit;
    const deckHasCard =
      game.deckManager.cards && game.deckManager.cards.length > 0;

    if (deckHasCard && isBestTrump && !isCurrentTrump) {
      bestThrowIn = current;
      lowestThrowIn = currentWeight;
    } else if (
      isCurrentTrump === isBestTrump &&
      currentWeight < lowestThrowIn
    ) {
      bestThrowIn = current;
      lowestThrowIn = currentWeight;
    }
  }
  game.attack(bestThrowIn.index, bot);
  return bestThrowIn.card;
}
export function expertBotDefense(bot, game) {
  if (gameSettings.mode === "transfer") {
    for (let i = 0; i < bot.hand.length; i++) {
      if (game.canTransfer(bot.hand[i])) {
        game.transfer(i, bot);
        return "transferred";
      }
    }
  }
  while (game.table.some((pair) => pair.defendCard === null)) {
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
    for (let i = 0; i < bot.hand.length; i++) {
      const botCard = bot.hand[i];
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
    let lowestWeight = cardWeight(bestCandidate.cardObj, game);
    for (let i = 1; i < candidates.length; i++) {
      const current = candidates[i];
      const currentWeight = cardWeight(current.cardObj, game);
      if (currentWeight < lowestWeight) {
        lowestWeight = currentWeight;
        bestCandidate = current;
      }
    }
    const actualIndex = bot.hand.indexOf(bestCandidate.cardObj);
    if (actualIndex !== -1) {
      game.defense(actualIndex, targetPairIndex);
    }
  }

  return true;
}
export function simpleBotAttack(bot, game) {
  if (bot.hand.length === 0) return null;
  if (game.table.length === 0) {
    let bestCardIndex = 0;
    for (let i = 1; i < bot.hand.length; i++) {
      const currentCard = bot.hand[i];
      const bestCard = bot.hand[bestCardIndex];
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
    const cardToAttack = bot.hand[bestCardIndex];
    game.attack(bestCardIndex, bot);
    return cardToAttack;
  }
  for (let i = bot.hand.length - 1; i >= 0; i--) {
    const botCard = bot.hand[i];
    if (game.canThrowIn(botCard)) {
      if (
        botCard.suit === game.trumpSuit &&
        game.deckManager.cards.length > 0
      ) {
        continue;
      }
      game.attack(i, bot);
      return botCard;
    }
  }
  return null;
}
export function simpleBotDefense(bot, game) {
  if (gameSettings.mode === "transfer") {
    for (let i = 0; i < bot.hand.length; i++) {
      if (game.canTransfer(bot.hand[i])) {
        game.transfer(i, bot);
        return "transferred";
      }
    }
  }
  while (game.table.some((pair) => pair.defendCard === null)) {
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
    for (let i = 0; i < bot.hand.length; i++) {
      const botCard = bot.hand[i];
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
    const actualIndex = bot.hand.indexOf(bestCandidate.cardObj);
    if (actualIndex !== -1) {
      game.defense(actualIndex, targetPairIndex);
    }
  }
  return true;
}
