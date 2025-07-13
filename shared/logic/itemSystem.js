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
exports.RoyalScrutinyGlass = RoyalScrutinyGlass;
exports.VerdictAmplifier = VerdictAmplifier;
exports.CrownDisavowal = CrownDisavowal;
exports.RoyalChainOrder = RoyalChainOrder;
exports.SovereignPotion = SovereignPotion;
exports.ChronicleLedger = ChronicleLedger;
exports.ParadoxDial = ParadoxDial;
exports.ThiefTooth = ThiefTooth;
exports.Item = Item;
var aiLogic_1 = require("./aiLogic");
// Royal Scrutiny Glass: Reveals the type (Poisonous/Holy) of the current goblet
function RoyalScrutinyGlass(game) {
    var goblets = game.goblets, currentGobletIndex = game.currentGobletIndex;
    var isPoisonous = goblets[currentGobletIndex];
    if (game.players[game.activePlayerIndex].isAI) {
        aiLogic_1.gobletMemory[currentGobletIndex] = isPoisonous ? 'poisonous' : 'holy';
    }
    var actionMessage = {
        type: 'artifact_used',
        item: 'royal_scrutiny_glass',
        userId: game.players[game.activePlayerIndex].id,
        result: isPoisonous ? 'POISONOUS' : 'HOLY',
    };
    return { updatedGame: game, actionMessage: actionMessage };
}
// Verdict Amplifier: Doubles the effect of the next poisonous/holy goblet
function VerdictAmplifier(game) {
    var players = game.players, activePlayerIndex = game.activePlayerIndex;
    var updatedPlayer = __assign(__assign({}, players[activePlayerIndex]), { statusEffects: __spreadArray(__spreadArray([], players[activePlayerIndex].statusEffects, true), ['amplified'], false) });
    var updatedPlayers = __spreadArray([], players, true);
    updatedPlayers[activePlayerIndex] = updatedPlayer;
    var updatedGame = __assign(__assign({}, game), { players: updatedPlayers });
    var actionMessage = {
        type: 'artifact_used',
        item: 'verdict_amplifier',
        userId: game.players[activePlayerIndex].id,
        result: 'AMPLIFIED',
    };
    return { updatedGame: updatedGame, actionMessage: actionMessage };
}
// Crown Disavowal: Removes the current goblet
function CrownDisavowal(game) {
    var goblets = game.goblets, currentGobletIndex = game.currentGobletIndex, gobletsRemaining = game.gobletsRemaining;
    var updatedGoblets = __spreadArray([], goblets, true);
    var removedGoblet = updatedGoblets.splice(currentGobletIndex, 1)[0];
    var updatedGame = __assign(__assign({}, game), { goblets: updatedGoblets, gobletsRemaining: gobletsRemaining - 1 });
    if (removedGoblet) {
        aiLogic_1.gobletCountMemory.poisonousGoblets--; // poison
    }
    else {
        aiLogic_1.gobletCountMemory.holyGoblets--; // holy
    }
    var actionMessage = {
        type: 'artifact_used',
        item: 'crown_disavowal',
        userId: game.players[game.activePlayerIndex].id,
        result: removedGoblet ? 'POISONOUS' : 'HOLY',
    };
    return { updatedGame: updatedGame, actionMessage: actionMessage };
}
// Royal Chain Order: Cuffs the target player
function RoyalChainOrder(game, targetPlayerId) {
    var updatedPlayers = game.players.map(function (player) {
        return player.id === targetPlayerId
            ? __assign(__assign({}, player), { statusEffects: __spreadArray(__spreadArray([], player.statusEffects, true), ['chained'], false) }) : player;
    });
    var updatedGame = __assign(__assign({}, game), { players: updatedPlayers });
    var actionMessage = {
        type: 'artifact_used',
        item: 'royal_chain_order',
        userId: game.players[game.activePlayerIndex].id,
        targetId: targetPlayerId,
        result: 'CHAINED',
    };
    return { updatedGame: updatedGame, actionMessage: actionMessage };
}
// Sovereign Potion: Heals 1 life
function SovereignPotion(game) {
    var players = game.players, activePlayerIndex = game.activePlayerIndex;
    var updatedPlayers = __spreadArray([], players, true);
    updatedPlayers[activePlayerIndex] = __assign(__assign({}, updatedPlayers[activePlayerIndex]), { lives: updatedPlayers[activePlayerIndex].lives + 1 });
    var updatedGame = __assign(__assign({}, game), { players: updatedPlayers });
    var actionMessage = {
        type: 'artifact_used',
        item: 'sovereign_potion',
        userId: game.players[activePlayerIndex].id,
        result: 'HEALED',
    };
    return { updatedGame: updatedGame, actionMessage: actionMessage };
}
// Chronicle Ledger: Peeks at any random non-current goblet
function ChronicleLedger(game) {
    var goblets = game.goblets, currentGobletIndex = game.currentGobletIndex;
    var availableIndices = goblets
        .map(function (_, i) { return i; })
        .filter(function (i) { return i !== currentGobletIndex; });
    var randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    var isPoisonous = goblets[randomIndex];
    if (game.players[game.activePlayerIndex].isAI) {
        aiLogic_1.gobletMemory[randomIndex] = isPoisonous ? 'poisonous' : 'holy';
    }
    var actionMessage = {
        type: 'artifact_used',
        item: 'chronicle_ledger',
        userId: game.players[game.activePlayerIndex].id,
        result: "".concat(isPoisonous ? 'POISONOUS' : 'HOLY', ":").concat(randomIndex),
    };
    return { updatedGame: game, actionMessage: actionMessage };
}
// Paradox Dial: Flips current goblet’s type
function ParadoxDial(game) {
    var goblets = game.goblets, currentGobletIndex = game.currentGobletIndex;
    var updatedGoblets = __spreadArray([], goblets, true);
    updatedGoblets[currentGobletIndex] = !updatedGoblets[currentGobletIndex];
    var updatedGame = __assign(__assign({}, game), { goblets: updatedGoblets });
    var actionMessage = {
        type: 'artifact_used',
        item: 'paradox_dial',
        userId: game.players[game.activePlayerIndex].id,
        result: "".concat(updatedGoblets[currentGobletIndex] ? 'POISONOUS' : 'HOLY', ":INVERTED"),
    };
    return { updatedGame: updatedGame, actionMessage: actionMessage };
}
// Thief Tooth: Steals a item from target player
function ThiefTooth(game) {
    var players = game.players, activePlayerIndex = game.activePlayerIndex;
    var hasItemToSteal = players.some(function (p, i) { return i !== activePlayerIndex && p.items.length > 0; });
    var updatedPlayers = __spreadArray([], players, true);
    if (!hasItemToSteal) {
        // No item to steal → just remove thief's tooth from active player's inventory
        var updatedPlayer_1 = __assign(__assign({}, players[activePlayerIndex]), { items: players[activePlayerIndex].items.filter(function (item) { return item !== 'thiefs_tooth'; }) });
        updatedPlayers[activePlayerIndex] = updatedPlayer_1;
        var updatedGame_1 = __assign(__assign({}, game), { players: updatedPlayers });
        var actionMessage_1 = {
            type: 'artifact_used',
            item: 'thiefs_tooth',
            userId: game.players[activePlayerIndex].id,
            result: 'FAILED_NO_TARGET',
        };
        return { updatedGame: updatedGame_1, actionMessage: actionMessage_1 };
    }
    var updatedPlayer = __assign(__assign({}, players[activePlayerIndex]), { statusEffects: __spreadArray(__spreadArray([], players[activePlayerIndex].statusEffects, true), ['thief'], false) });
    updatedPlayers[activePlayerIndex] = updatedPlayer;
    var updatedGame = __assign(__assign({}, game), { players: updatedPlayers });
    var actionMessage = {
        type: 'artifact_used',
        item: 'thiefs_tooth',
        userId: game.players[activePlayerIndex].id,
        result: 'STEAL',
    };
    return { updatedGame: updatedGame, actionMessage: actionMessage };
}
// Generic item handler
function Item(game, itemType, targetPlayerId) {
    var activePlayer = game.players[game.activePlayerIndex];
    if (!activePlayer.items.includes(itemType)) {
        throw new Error("Item ".concat(itemType, " not available or already used this turn"));
    }
    var itemIndex = activePlayer.items.findIndex(function (item) { return item === itemType; });
    var updatedItems = __spreadArray(__spreadArray([], activePlayer.items.slice(0, itemIndex), true), activePlayer.items.slice(itemIndex + 1), true);
    var updatedPlayer = __assign(__assign({}, activePlayer), { items: updatedItems });
    var updatedPlayers = __spreadArray([], game.players, true);
    updatedPlayers[game.activePlayerIndex] = updatedPlayer;
    var updatedGame = __assign(__assign({}, game), { players: updatedPlayers });
    switch (itemType) {
        case 'royal_scrutiny_glass': return RoyalScrutinyGlass(updatedGame);
        case 'verdict_amplifier': return VerdictAmplifier(updatedGame);
        case 'crown_disavowal': return CrownDisavowal(updatedGame);
        case 'royal_chain_order':
            if (!targetPlayerId)
                throw new Error('Target required for royal_chain_order');
            return RoyalChainOrder(updatedGame, targetPlayerId);
        case 'sovereign_potion': return SovereignPotion(updatedGame);
        case 'chronicle_ledger': return ChronicleLedger(updatedGame);
        case 'paradox_dial': return ParadoxDial(updatedGame);
        case 'thiefs_tooth': return ThiefTooth(updatedGame);
        default: throw new Error("Unknown item: ".concat(itemType));
    }
}
