"use strict";
export const gameSettings = {
  deckSize: 36,
  maxPlayers: 2,
  mode: "classic",
};
export function getCardConfig() {
  const suits = ["Spade", "Heart", "Diamond", "Club"];
  const ranks36 = ["6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const ranks52 = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];

  return {
    suit: suits,
    rank: gameSettings.deckSize === 52 ? ranks52 : ranks36,
  };
}
