"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipIfChained = void 0;
exports.initializeGame = initializeGame;
exports.startRound = startRound;
exports.playTurn = playTurn;
exports.nextRound = nextRound;
exports.getNextPlayerIndex = getNextPlayerIndex;
exports.generateRoundConfig = generateRoundConfig;
exports.refillChambers = refillChambers;
var itemSystem_1 = require("./itemSystem");
var aiLogic_1 = require("./aiLogic");
// Initialize a new game
function initializeGame(players) {
    return {
        players: players,
        currentRound: generateRoundConfig(1),
        activePlayerIndex: Math.floor(Math.random() * players.length),
        goblets: [],
        currentGobletIndex: 0,
        gobletsRemaining: 0,
        turnOrderDirection: 'clockwise',
        gameState: 'loading',
    };
}
// Start a new round
function startRound(game, roundNumber) {
    var roundConfig = generateRoundConfig(roundNumber);
    if (!roundConfig)
        throw new Error("Invalid round number: ".concat(roundNumber));
    var poisnousGoblets = roundConfig.poisnousGoblets, holyGoblets = roundConfig.holyGoblets;
    aiLogic_1.gobletCountMemory.poisonousGoblets = poisnousGoblets;
    aiLogic_1.gobletCountMemory.holyGoblets = holyGoblets;
    var goblets = [];
    for (var i = 0; i < poisnousGoblets; i++)
        goblets.push(true);
    for (var i = 0; i < holyGoblets; i++)
        goblets.push(false);
    shuffleArray(goblets);
    var itemsPerPlayer = roundConfig.itemCount;
    var updatedPlayers = game.players.map(function (player) { return (__assign(__assign({}, player), { lives: roundConfig.lives, items: getRandomItems(itemsPerPlayer), statusEffects: [] })); });
    return __assign(__assign({}, game), { goblets: goblets, currentGobletIndex: 0, gobletsRemaining: goblets.length, players: updatedPlayers, gameState: 'playing', currentRound: roundConfig });
}
// Play a turn
function playTurn(game, action) {
    var activePlayerIndex = game.activePlayerIndex, players = game.players, goblets = game.goblets, currentGobletIndex = game.currentGobletIndex, turnOrderDirection = game.turnOrderDirection;
    var activePlayer = players[activePlayerIndex];
    if (action.type === 'drink') {
        var targetPlayerId_1 = action.targetPlayerId;
        var targetPlayerIndex = players.findIndex(function (p) { return p.id === targetPlayerId_1; });
        if (targetPlayerIndex === -1) {
            return { updatedGame: game, actionMessage: { type: 'drink', userId: activePlayer.id, result: 'Target player not found.' } };
        }
        var updatedPlayers = __spreadArray([], players, true);
        var hasAmplified = activePlayer.statusEffects.includes('amplified');
        if (hasAmplified) {
            updatedPlayers[activePlayerIndex] = __assign(__assign({}, activePlayer), { statusEffects: activePlayer.statusEffects.filter(function (e) { return e !== 'amplified'; }) });
        }
        var isPoisonous = goblets[currentGobletIndex];
        if (isPoisonous) {
            var damage = hasAmplified ? 2 : 1;
            updatedPlayers[targetPlayerIndex] = __assign(__assign({}, updatedPlayers[targetPlayerIndex]), { lives: updatedPlayers[targetPlayerIndex].lives - damage });
        }
        else {
            if (targetPlayerIndex === activePlayerIndex) {
                var nextGame = __assign(__assign({}, game), { players: updatedPlayers, currentGobletIndex: (currentGobletIndex + 1) % goblets.length, gobletsRemaining: game.gobletsRemaining - 1 });
                return {
                    updatedGame: nextGame,
                    actionMessage: {
                        type: 'drink',
                        userId: activePlayer.id,
                        targetId: targetPlayerId_1,
                        result: 'HOLY',
                    },
                };
            }
        }
        var updatedGame = __assign(__assign({}, game), { players: updatedPlayers, currentGobletIndex: (currentGobletIndex + 1) % goblets.length, gobletsRemaining: game.gobletsRemaining - 1, activePlayerIndex: getNextPlayerIndex(activePlayerIndex, players.length, turnOrderDirection) });
        if (isPoisonous) {
            aiLogic_1.gobletCountMemory.poisonousGoblets--;
        }
        else {
            aiLogic_1.gobletCountMemory.holyGoblets--;
        }
        return {
            updatedGame: updatedGame,
            actionMessage: {
                type: 'drink',
                userId: activePlayer.id,
                targetId: targetPlayerId_1,
                result: isPoisonous ? 'POISON' : 'HOLY',
            }
        };
    }
    else if (action.type === 'use_item' && action.itemType) {
        var itemType = action.itemType;
        // if status is thief
        var isThief = activePlayer.statusEffects.includes("thief");
        if (isThief) {
            var targetPlayer = game.players.find(function (p) { return p.id == action.targetPlayerId; });
            if (targetPlayer) {
                var itemIndex = targetPlayer.items.indexOf(action.itemType);
                // simulating stealing by moving the item from target to active player inventory
                targetPlayer.items.splice(itemIndex, 1);
                activePlayer.items.push(action.itemType);
                // Remove "thief" status effect
                activePlayer.statusEffects = activePlayer.statusEffects.filter(function (effect) { return effect !== "thief"; });
            }
        }
        if (!activePlayer.items.includes(itemType))
            return { updatedGame: game, actionMessage: { type: 'artifact_used', userId: activePlayer.id, result: "Item ".concat(itemType, " not found.") } };
        var updatedGame = (0, itemSystem_1.Item)(game, itemType, action.targetPlayerId);
        return updatedGame;
    }
    return { updatedGame: game, actionMessage: { type: 'drink', userId: activePlayer.id, result: 'Invalid action type.' } };
}
// End a round
function nextRound(game, roundNumber) {
    var players = game.players;
    var nextRoundConfig = generateRoundConfig(roundNumber);
    if (!nextRoundConfig)
        throw new Error("Invalid round number: ".concat(roundNumber));
    if (players.length <= 1) {
        return __assign(__assign({}, game), { gameState: 'game_over' });
    }
    return __assign(__assign({}, game), { currentRound: nextRoundConfig, gameState: 'playing' });
}
function shuffleArray(array) {
    var _a;
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [array[j], array[i]], array[i] = _a[0], array[j] = _a[1];
    }
}
function getRandomItems(count) {
    var allItems = [
        'royal_scrutiny_glass',
        'verdict_amplifier',
        'crown_disavowal',
        'royal_chain_order',
        'sovereign_potion',
        'chronicle_ledger',
        'paradox_dial',
        'thiefs_tooth',
    ];
    var shuffled = __spreadArray([], allItems, true);
    shuffleArray(shuffled);
    return shuffled.slice(0, count);
}
function getNextPlayerIndex(currentIndex, totalPlayers, direction) {
    return direction === 'clockwise'
        ? (currentIndex + 1) % totalPlayers
        : (currentIndex - 1 + totalPlayers) % totalPlayers;
}
function generateRoundConfig(round) {
    var poisnousGoblets = 1;
    var holyGoblets = 1;
    var lives = 2;
    var itemCount = 0;
    var suddenDeath = false;
    if (round === 1) {
        poisnousGoblets = 1 + Math.floor(Math.random() * 2);
        holyGoblets = 1 + Math.floor(Math.random() * 2);
        lives = 2;
        itemCount = 0;
    }
    else if (round === 2) {
        poisnousGoblets = 2 + Math.floor(Math.random() * 2);
        holyGoblets = 2 + Math.floor(Math.random() * 2);
        lives = 4;
        itemCount = 2;
    }
    else if (round === 3) {
        poisnousGoblets = 3 + Math.floor(Math.random() * 2);
        holyGoblets = 3 + Math.floor(Math.random() * 2);
        lives = 5;
        itemCount = 4;
        suddenDeath = true;
    }
    else {
        poisnousGoblets = 2 + Math.floor(Math.random() * 3);
        holyGoblets = 2 + Math.floor(Math.random() * 3);
        lives = 6;
        itemCount = 2 + Math.floor(round / 2);
        suddenDeath = true;
    }
    return {
        round: round,
        poisnousGoblets: poisnousGoblets,
        holyGoblets: holyGoblets,
        lives: lives,
        itemCount: itemCount,
        suddenDeath: suddenDeath,
    };
}
function refillChambers(game) {
    var sameRoundConfig = generateRoundConfig(game.currentRound.round);
    var newGoblets = [];
    aiLogic_1.gobletCountMemory.poisonousGoblets = sameRoundConfig.poisnousGoblets;
    aiLogic_1.gobletCountMemory.holyGoblets = sameRoundConfig.holyGoblets;
    for (var i = 0; i < sameRoundConfig.poisnousGoblets; i++)
        newGoblets.push(true);
    for (var i = 0; i < sameRoundConfig.holyGoblets; i++)
        newGoblets.push(false);
    shuffleArray(newGoblets);
    var itemsPerPlayer = sameRoundConfig.itemCount;
    var updatedPlayers = game.players.map(function (player) { return (__assign(__assign({}, player), { items: getRandomItems(itemsPerPlayer), statusEffects: [] })); });
    return __assign(__assign({}, game), { players: updatedPlayers, goblets: newGoblets, currentGobletIndex: 0, gobletsRemaining: newGoblets.length });
}
var skipIfChained = function (game, player) {
    if (player.statusEffects.includes('chained')) {
        var updatedPlayers = game.players.map(function (p, idx) {
            return idx === game.activePlayerIndex
                ? __assign(__assign({}, p), { statusEffects: p.statusEffects.filter(function (effect) { return effect !== 'chained'; }) }) : p;
        });
        var updatedGame = __assign(__assign({}, game), { players: updatedPlayers, activePlayerIndex: getNextPlayerIndex(game.activePlayerIndex, game.players.length, game.turnOrderDirection) });
        return {
            updatedGame: updatedGame,
            actionMessage: {
                type: 'skip',
                userId: player.id,
                result: 'Player is chained and skips turn.',
            },
        };
    }
    return null;
};
exports.skipIfChained = skipIfChained;
