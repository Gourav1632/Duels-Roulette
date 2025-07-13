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
exports.gobletCountMemory = exports.gobletMemory = void 0;
exports.automatonTakeTurn = automatonTakeTurn;
var gameEngine_1 = require("./gameEngine");
exports.gobletMemory = {};
exports.gobletCountMemory = {
    poisonousGoblets: 0,
    holyGoblets: 0
};
function calculateActionScore(game, action, aiPlayer, opponent, pPoisonous) {
    var score = 0;
    score += 1;
    switch (action.type) {
        case 'use_item':
            switch (action.itemType) {
                case 'sovereign_potion':
                    if (aiPlayer.lives <= 1)
                        score += 1000;
                    else if (aiPlayer.lives === 2)
                        score += 500;
                    else
                        score += 50;
                    break;
                case 'crown_disavowal':
                    if (pPoisonous > 0.6 && aiPlayer.lives <= 1)
                        score += 900;
                    else if (pPoisonous > 0.5)
                        score += 400;
                    else
                        score += 50;
                    break;
                case 'verdict_amplifier':
                    if (opponent && opponent.lives <= 2)
                        score += 800;
                    else if (opponent)
                        score += 300;
                    break;
                case 'royal_chain_order':
                    if (opponent && opponent.lives > 0) {
                        var opponentItemCount = opponent.items.length;
                        score += 500 + opponentItemCount * 50;
                    }
                    break;
                case 'royal_scrutiny_glass':
                    if (pPoisonous > 0 && pPoisonous < 1)
                        score += 600;
                    else
                        score += 10;
                    break;
                case 'chronicle_ledger':
                    if (opponent)
                        score += 550 + opponent.items.length * 20;
                    else
                        score += 50;
                    break;
                case 'paradox_dial':
                    if (pPoisonous > 0.6 && aiPlayer.lives <= 2)
                        score += 700;
                    else if (pPoisonous < 0.4 && opponent && opponent.lives <= 2)
                        score += 650;
                    else
                        score += 100;
                    break;
                case 'thiefs_tooth':
                    score = 50;
                    if (opponent && opponent.items.length > 0) {
                        var maxStolenScore = 0;
                        for (var _i = 0, _a = opponent.items; _i < _a.length; _i++) {
                            var stolenItem = _a[_i];
                            if (stolenItem === 'thiefs_tooth')
                                continue;
                            var hypotheticalAction = { type: 'use_item', itemType: stolenItem, targetPlayerId: opponent.id };
                            var itemScore = calculateActionScore(game, hypotheticalAction, aiPlayer, opponent, pPoisonous);
                            maxStolenScore = Math.max(maxStolenScore, itemScore);
                        }
                        score += maxStolenScore;
                    }
                    else {
                        score -= 200;
                    }
                    break;
                default:
                    score += 10;
                    break;
            }
            break;
        case 'drink':
            if (action.targetPlayerId === (opponent === null || opponent === void 0 ? void 0 : opponent.id) && opponent) {
                if (pPoisonous === 1 && opponent.lives === 1)
                    score += 2000;
                else if (pPoisonous >= 0.7 && opponent.lives === 1)
                    score += 1800;
                else if (pPoisonous >= 0.5)
                    score += 500 * pPoisonous;
                else
                    score += 100 * pPoisonous;
            }
            else if (action.targetPlayerId === aiPlayer.id) {
                if (pPoisonous === 0)
                    score += 700;
                else if (pPoisonous < 0.3 && aiPlayer.lives > 1)
                    score += 300 * (1 - pPoisonous);
                else if (pPoisonous >= 0.5 && aiPlayer.lives <= 1)
                    score -= 1500;
                else
                    score -= 100;
            }
            break;
    }
    return score;
}
function automatonTakeTurn(game) {
    var players = game.players, activePlayerIndex = game.activePlayerIndex;
    var aiPlayer = players[activePlayerIndex];
    if (!aiPlayer.isAI) {
        throw new Error('Automaton Enforcer is not the active player');
    }
    var poisonousGoblets = exports.gobletCountMemory.poisonousGoblets;
    var totalGoblets = exports.gobletCountMemory.poisonousGoblets + exports.gobletCountMemory.holyGoblets;
    var pPoisonous = totalGoblets > 0 ? poisonousGoblets / totalGoblets : 0;
    var opponent = players.find(function (p) { return !p.isAI; });
    var bestAction = null;
    var highestScore = -Infinity;
    if (aiPlayer.statusEffects.includes('thief') && opponent && opponent.items.length > 0) {
        for (var _i = 0, _a = opponent.items; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item === 'thiefs_tooth')
                continue;
            var action = { type: 'use_item', itemType: item, targetPlayerId: opponent.id };
            var score = calculateActionScore(game, action, aiPlayer, opponent, pPoisonous);
            if (score > highestScore) {
                highestScore = score;
                bestAction = action;
            }
        }
        if (bestAction && bestAction.type === 'use_item') {
            var useItemAction_1 = bestAction;
            var updatedPlayers = game.players.map(function (p, i) {
                if (i === activePlayerIndex) {
                    return __assign(__assign({}, p), { statusEffects: p.statusEffects.filter(function (s) { return s !== 'thief'; }) });
                }
                return p;
            });
            var finalPlayers = updatedPlayers.map(function (p) {
                if (p.id === opponent.id) {
                    var newItems = __spreadArray([], p.items, true);
                    var index = newItems.indexOf(useItemAction_1.itemType);
                    if (index > -1)
                        newItems.splice(index, 1);
                    return __assign(__assign({}, p), { items: newItems });
                }
                if (p.id === aiPlayer.id) {
                    return __assign(__assign({}, p), { items: __spreadArray(__spreadArray([], p.items, true), [useItemAction_1.itemType], false) });
                }
                return p;
            });
            var finalGame = __assign(__assign({}, game), { players: finalPlayers });
            return (0, gameEngine_1.playTurn)(finalGame, bestAction);
        }
    }
    for (var _b = 0, _c = aiPlayer.items; _b < _c.length; _b++) {
        var item = _c[_b];
        var targetPlayerId = undefined;
        if ((item === 'royal_chain_order' || item === 'thiefs_tooth') && opponent) {
            targetPlayerId = opponent.id;
        }
        var action = { type: 'use_item', itemType: item, targetPlayerId: targetPlayerId };
        var score = calculateActionScore(game, action, aiPlayer, opponent, pPoisonous);
        if (score > highestScore) {
            highestScore = score;
            bestAction = action;
        }
    }
    if (opponent) {
        var drinkOpponent = { type: 'drink', targetPlayerId: opponent.id };
        var score = calculateActionScore(game, drinkOpponent, aiPlayer, opponent, pPoisonous);
        if (score > highestScore) {
            highestScore = score;
            bestAction = drinkOpponent;
        }
    }
    var drinkSelf = { type: 'drink', targetPlayerId: aiPlayer.id };
    var scoreSelf = calculateActionScore(game, drinkSelf, aiPlayer, opponent, pPoisonous);
    if (scoreSelf > highestScore) {
        highestScore = scoreSelf;
        bestAction = drinkSelf;
    }
    if (!bestAction) {
        bestAction = { type: 'drink', targetPlayerId: opponent ? opponent.id : aiPlayer.id };
    }
    return (0, gameEngine_1.playTurn)(game, bestAction);
}
