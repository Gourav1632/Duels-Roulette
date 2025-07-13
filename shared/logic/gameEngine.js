"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipIfChained = void 0;
exports.initializeGame = initializeGame;
exports.startRound = startRound;
exports.playTurn = playTurn;
exports.nextRound = nextRound;
exports.getNextPlayerIndex = getNextPlayerIndex;
exports.generateRoundConfig = generateRoundConfig;
exports.refillChambers = refillChambers;
const itemSystem_1 = require("./itemSystem");
const aiLogic_1 = require("./aiLogic");
// Initialize a new game
function initializeGame(players) {
    return {
        players,
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
    const roundConfig = generateRoundConfig(roundNumber);
    if (!roundConfig)
        throw new Error(`Invalid round number: ${roundNumber}`);
    const { poisnousGoblets, holyGoblets } = roundConfig;
    aiLogic_1.gobletCountMemory.poisonousGoblets = poisnousGoblets;
    aiLogic_1.gobletCountMemory.holyGoblets = holyGoblets;
    const goblets = [];
    for (let i = 0; i < poisnousGoblets; i++)
        goblets.push(true);
    for (let i = 0; i < holyGoblets; i++)
        goblets.push(false);
    shuffleArray(goblets);
    const itemsPerPlayer = roundConfig.itemCount;
    const updatedPlayers = game.players.map(player => ({
        ...player,
        lives: roundConfig.lives,
        items: getRandomItems(itemsPerPlayer),
        statusEffects: [],
    }));
    return {
        ...game,
        goblets,
        currentGobletIndex: 0,
        gobletsRemaining: goblets.length,
        players: updatedPlayers,
        gameState: 'playing',
        currentRound: roundConfig,
    };
}
// Play a turn
function playTurn(game, action) {
    const { activePlayerIndex, players, goblets, currentGobletIndex, turnOrderDirection } = game;
    const activePlayer = players[activePlayerIndex];
    if (action.type === 'drink') {
        const targetPlayerId = action.targetPlayerId;
        const targetPlayerIndex = players.findIndex(p => p.id === targetPlayerId);
        if (targetPlayerIndex === -1) {
            return { updatedGame: game, actionMessage: { type: 'drink', userId: activePlayer.id, result: 'Target player not found.' } };
        }
        const updatedPlayers = [...players];
        const hasAmplified = activePlayer.statusEffects.includes('amplified');
        if (hasAmplified) {
            updatedPlayers[activePlayerIndex] = {
                ...activePlayer,
                statusEffects: activePlayer.statusEffects.filter(e => e !== 'amplified'),
            };
        }
        const isPoisonous = goblets[currentGobletIndex];
        if (isPoisonous) {
            const damage = hasAmplified ? 2 : 1;
            updatedPlayers[targetPlayerIndex] = {
                ...updatedPlayers[targetPlayerIndex],
                lives: updatedPlayers[targetPlayerIndex].lives - damage,
            };
        }
        else {
            if (targetPlayerIndex === activePlayerIndex) {
                const nextGame = {
                    ...game,
                    players: updatedPlayers,
                    currentGobletIndex: (currentGobletIndex + 1) % goblets.length,
                    gobletsRemaining: game.gobletsRemaining - 1,
                };
                return {
                    updatedGame: nextGame,
                    actionMessage: {
                        type: 'drink',
                        userId: activePlayer.id,
                        targetId: targetPlayerId,
                        result: 'HOLY',
                    },
                };
            }
        }
        const updatedGame = {
            ...game,
            players: updatedPlayers,
            currentGobletIndex: (currentGobletIndex + 1) % goblets.length,
            gobletsRemaining: game.gobletsRemaining - 1,
            activePlayerIndex: getNextPlayerIndex(activePlayerIndex, players.length, turnOrderDirection),
        };
        if (isPoisonous) {
            aiLogic_1.gobletCountMemory.poisonousGoblets--;
        }
        else {
            aiLogic_1.gobletCountMemory.holyGoblets--;
        }
        return {
            updatedGame,
            actionMessage: {
                type: 'drink',
                userId: activePlayer.id,
                targetId: targetPlayerId,
                result: isPoisonous ? 'POISON' : 'HOLY',
            }
        };
    }
    else if (action.type === 'use_item' && action.itemType) {
        const itemType = action.itemType;
        // if status is thief
        const isThief = activePlayer.statusEffects.includes("thief");
        if (isThief) {
            const targetPlayer = game.players.find((p) => p.id == action.targetPlayerId);
            if (targetPlayer) {
                const itemIndex = targetPlayer.items.indexOf(action.itemType);
                // simulating stealing by moving the item from target to active player inventory
                targetPlayer.items.splice(itemIndex, 1);
                activePlayer.items.push(action.itemType);
                // Remove "thief" status effect
                activePlayer.statusEffects = activePlayer.statusEffects.filter(effect => effect !== "thief");
            }
        }
        if (!activePlayer.items.includes(itemType))
            return { updatedGame: game, actionMessage: { type: 'artifact_used', userId: activePlayer.id, result: `Item ${itemType} not found.` } };
        const updatedGame = (0, itemSystem_1.Item)(game, itemType, action.targetPlayerId);
        return updatedGame;
    }
    return { updatedGame: game, actionMessage: { type: 'drink', userId: activePlayer.id, result: 'Invalid action type.' } };
}
// End a round
function nextRound(game, roundNumber) {
    const { players } = game;
    const nextRoundConfig = generateRoundConfig(roundNumber);
    if (!nextRoundConfig)
        throw new Error(`Invalid round number: ${roundNumber}`);
    if (players.length <= 1) {
        return { ...game, gameState: 'game_over' };
    }
    return {
        ...game,
        currentRound: nextRoundConfig,
        gameState: 'playing',
    };
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
function getRandomItems(count) {
    const allItems = [
        'royal_scrutiny_glass',
        'verdict_amplifier',
        'crown_disavowal',
        'royal_chain_order',
        'sovereign_potion',
        'chronicle_ledger',
        'paradox_dial',
        'thiefs_tooth',
    ];
    const shuffled = [...allItems];
    shuffleArray(shuffled);
    return shuffled.slice(0, count);
}
function getNextPlayerIndex(currentIndex, totalPlayers, direction) {
    return direction === 'clockwise'
        ? (currentIndex + 1) % totalPlayers
        : (currentIndex - 1 + totalPlayers) % totalPlayers;
}
function generateRoundConfig(round) {
    let poisnousGoblets = 1;
    let holyGoblets = 1;
    let lives = 2;
    let itemCount = 0;
    let suddenDeath = false;
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
        round,
        poisnousGoblets,
        holyGoblets,
        lives,
        itemCount,
        suddenDeath,
    };
}
function refillChambers(game) {
    const sameRoundConfig = generateRoundConfig(game.currentRound.round);
    const newGoblets = [];
    aiLogic_1.gobletCountMemory.poisonousGoblets = sameRoundConfig.poisnousGoblets;
    aiLogic_1.gobletCountMemory.holyGoblets = sameRoundConfig.holyGoblets;
    for (let i = 0; i < sameRoundConfig.poisnousGoblets; i++)
        newGoblets.push(true);
    for (let i = 0; i < sameRoundConfig.holyGoblets; i++)
        newGoblets.push(false);
    shuffleArray(newGoblets);
    const itemsPerPlayer = sameRoundConfig.itemCount;
    const updatedPlayers = game.players.map(player => ({
        ...player,
        items: getRandomItems(itemsPerPlayer),
        statusEffects: [],
    }));
    return {
        ...game,
        players: updatedPlayers,
        goblets: newGoblets,
        currentGobletIndex: 0,
        gobletsRemaining: newGoblets.length,
    };
}
const skipIfChained = (game, player) => {
    if (player.statusEffects.includes('chained')) {
        const updatedPlayers = game.players.map((p, idx) => idx === game.activePlayerIndex
            ? { ...p, statusEffects: p.statusEffects.filter(effect => effect !== 'chained') }
            : p);
        const updatedGame = {
            ...game,
            players: updatedPlayers,
            activePlayerIndex: getNextPlayerIndex(game.activePlayerIndex, game.players.length, game.turnOrderDirection),
        };
        return {
            updatedGame,
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
