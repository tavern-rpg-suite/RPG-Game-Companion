import { getContext, extension_settings } from '../../../extensions.js';
import { eventSource, event_types, saveSettingsDebounced, characters } from '../../../../script.js';

const MODULE_NAME = 'rpg_game_companion';

const defaultSettings = {
    enabled: false,
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    model: 'google/gemma-4-31b-it',
    temperature: 0.8,
    contextMessages: 10,
    language: 'en'
};

let settings = {};

function escapeHtml(x) {
    return String(x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function langName() { return settings.language === 'ru' ? 'Russian' : 'English'; }

const I18N = {
    en: {
        opp_getting_ready: 'Opponent is getting ready…',
        chess_start: 'Chess vs {name} has started! Your move (White).',
        ttt_start: 'Tic-Tac-Toe has started! Your move (X).',
        bs_start: 'Battleship has started! Fire at the enemy grid.',
        bs_miss_turn: "Miss! {name}'s turn to fire...",
        bs_opp_hit: 'The opponent hit your ship!',
        bs_opp_miss: 'The opponent missed.',
        bj_start: '21 (Blackjack) vs {name}! Get closer to 21 than your opponent without going over. "Hit" draws a card, "Stand" stops.',
        bj_bust: 'Bust! You are over 21.',
        bj_reveal: '{name} reveals their cards...',
        rps_start: 'Rock-Paper-Scissors vs {name}! First to 3 wins.',
        rps_tied: 'Round tied.',
        rps_won: 'You won the round!',
        rps_lost: 'Round goes to {name}.',
        poker_start: 'Poker (5-card draw) vs {name}! 100 chips each, ante 5. Click your cards to mark them for exchange.',
        poker_swapped: '{name} swapped cards. Your bet.',
        poker_you_bet: 'You bet {amt}.',
        poker_you_check: 'You check.',
        poker_opp_bets: '{name} bets {amt}. Call or fold?',
        poker_opp_checks: '{name} checks.',
        poker_opp_folds: '{name} folds. The pot is yours!',
        poker_opp_calls: '{name} calls.',
        poker_opp_raises: '{name} raises by {amt}. Call or fold?',
        poker_you_fold: 'You fold.',
        poker_you_call: 'You call.',
        poker_you_pot: 'You take the pot (🪙 {pot})',
        poker_opp_pot: '{name} takes the pot (🪙 {pot})',
        poker_tie: 'Tie ({hand}). The pot is split.',
        pig_start: 'Dice "Pig" vs {name}! Your turn total builds up, but rolling a 1 wipes it. "Bank" keeps your points. First to 50 wins.',
        pig_you_one: 'Rolled a 1! Your points for this turn are gone.',
        pig_you_roll: 'You rolled {roll}. Turn total: {total}.',
        pig_you_bank: 'You banked {total}.',
        pig_opp_pickup: '{name} picks up the die...',
        pig_opp_bank: '{name} banks {total}.',
        pig_opp_one: '{name} rolled a 1 — turn points gone!',
        pig_opp_roll: '{name} rolled {roll} (turn: {total}).',
        whist_start: 'Whist vs {name}! Trump is {trump}. 7 cards each — take more tricks. You lead first; when following you must follow suit if you can, and trump beats other suits.',
        whist_follow_suit: 'You must follow suit: {suit}',
        whist_you_led: 'You led {card}.',
        whist_opp_led: '{name} led {card}. Your turn.',
        whist_trick_you: 'Trick goes to you.',
        whist_trick_opp: 'Trick goes to {name}.',
        whist_over: 'Game over: tricks {a} — {b}.',
        your_turn: 'Your turn.',
        result_win: 'Victory! You won this game!',
        result_lose: 'Defeat! {name} won this time.',
        result_draw: 'Draw! Good game.',
        surrendered: 'You surrendered and ended the game.',
        thinking: '{name} is thinking...',
        menu_title: 'What shall we play with {name}?',
        g_chess: 'Chess', g_bj: '21 (Blackjack)', g_poker: 'Poker (5-card)', g_whist: 'Whist',
        g_bs: 'Battleship (6×6)', g_ttt: 'Tic-Tac-Toe', g_rps: 'Rock-Paper-Scissors', g_pig: 'Dice "Pig"',
        menu: 'Menu', surrender: 'Surrender',
        your_fleet: 'Your fleet', enemy_grid: 'Enemy grid',
        you: 'You', hit: 'Hit', stand: 'Stand',
        exchange: 'Exchange', check: 'Check', bet: 'Bet', call: 'Call', fold: 'Fold', next_hand: 'Next hand',
        pig_to: 'to {target}', this_turn: 'This turn', roll: 'Roll', bank: 'Bank',
        trump: 'Trump', tricks: 'Tricks',
        send_result: 'Send result to chat', play_again: 'Play again',
        game_table: 'Game Table', at_table: 'at the table', say_something: 'Say something to your opponent...',
        result_added: 'Result added to the input field — press Send.',
        gn_ttt: 'Tic-Tac-Toe', gn_bs: 'Battleship', gn_chess: 'Chess', gn_bj: '21 (Blackjack)',
        gn_rps: 'Rock-Paper-Scissors', gn_poker: 'Poker', gn_pig: 'Dice', gn_whist: 'Whist',
        res_draw: 'in a draw', res_user: 'in my favor', res_bot: "in {name}'s favor",
        summary_line: '*{user} and {char} played a game of {game}. It ended {result}.*',
        hand_0: 'High Card', hand_1: 'Pair', hand_2: 'Two Pair', hand_3: 'Three of a Kind', hand_4: 'Straight',
        hand_5: 'Flush', hand_6: 'Full House', hand_7: 'Four of a Kind', hand_8: 'Straight Flush', hand_9: 'Royal Flush',
        set_title: 'Game Companion (Mini-games)', set_enable: 'Enable Games', set_api: 'API Settings',
        set_url: 'URL', set_key: 'API Key', set_model: 'Model', set_ctx: 'Messages to analyze personality:',
        set_lang: 'Language:', set_hint: 'The character secretly decides whether to play fair, throw, or cheat — based on their personality and what is happening in the chat.'
    },
    ru: {
        opp_getting_ready: 'Противник готовится…',
        chess_start: 'Шахматы против {name} начались! Твой ход (белые).',
        ttt_start: 'Крестики-нолики начались! Твой ход (X).',
        bs_start: 'Морской бой начался! Стреляй по полю противника.',
        bs_miss_turn: 'Мимо! Очередь {name} стрелять...',
        bs_opp_hit: 'Противник попал в твой корабль!',
        bs_opp_miss: 'Противник промахнулся.',
        bj_start: '21 (блэкджек) против {name}! Набери ближе к 21, чем противник, но не больше. «Ещё» — взять карту, «Хватит» — остановиться.',
        bj_bust: 'Перебор! У тебя больше 21.',
        bj_reveal: '{name} раскрывает карты...',
        rps_start: 'Камень-ножницы-бумага против {name}! Кто первым до 3 побед.',
        rps_tied: 'Раунд вничью.',
        rps_won: 'Ты выиграл раунд!',
        rps_lost: 'Раунд за {name}.',
        poker_start: 'Покер (5-карточный) против {name}! По 100 фишек, анте 5. Кликай по картам, чтобы отметить их на обмен.',
        poker_swapped: '{name} меняет карты. Твоя ставка.',
        poker_you_bet: 'Ты ставишь {amt}.',
        poker_you_check: 'Ты чек.',
        poker_opp_bets: '{name} ставит {amt}. Уравнять или сбросить?',
        poker_opp_checks: '{name} чек.',
        poker_opp_folds: '{name} сбрасывает. Банк твой!',
        poker_opp_calls: '{name} уравнивает.',
        poker_opp_raises: '{name} повышает на {amt}. Уравнять или сбросить?',
        poker_you_fold: 'Ты сбрасываешь.',
        poker_you_call: 'Ты уравниваешь.',
        poker_you_pot: 'Банк твой (🪙 {pot})',
        poker_opp_pot: '{name} забирает банк (🪙 {pot})',
        poker_tie: 'Ничья ({hand}). Банк делится.',
        pig_start: 'Кости «Свинья» против {name}! Очки за ход копятся, но выпавшая 1 их обнуляет. «В банк» — сохранить очки. Кто первым до 50.',
        pig_you_one: 'Выпала 1! Очки за этот ход сгорели.',
        pig_you_roll: 'Ты выбросил {roll}. За ход: {total}.',
        pig_you_bank: 'Ты отложил в банк {total}.',
        pig_opp_pickup: '{name} берёт кость...',
        pig_opp_bank: '{name} откладывает в банк {total}.',
        pig_opp_one: 'У {name} выпала 1 — очки за ход сгорели!',
        pig_opp_roll: '{name} выбросил {roll} (за ход: {total}).',
        whist_start: 'Вист против {name}! Козырь — {trump}. По 7 карт — бери больше взяток. Ты ходишь первым; отвечая, нужно ходить в масть, если есть, а козырь бьёт другие масти.',
        whist_follow_suit: 'Нужно ходить в масть: {suit}',
        whist_you_led: 'Ты сыграл {card}.',
        whist_opp_led: '{name} сыграл {card}. Твой ход.',
        whist_trick_you: 'Взятка твоя.',
        whist_trick_opp: 'Взятка достаётся {name}.',
        whist_over: 'Игра окончена: взятки {a} — {b}.',
        your_turn: 'Твой ход.',
        result_win: 'Победа! Ты выиграл!',
        result_lose: 'Поражение! На этот раз победил {name}.',
        result_draw: 'Ничья! Хорошая игра.',
        surrendered: 'Ты сдался и завершил игру.',
        thinking: '{name} думает...',
        menu_title: 'Во что сыграем с {name}?',
        g_chess: 'Шахматы', g_bj: '21 (блэкджек)', g_poker: 'Покер (5 карт)', g_whist: 'Вист',
        g_bs: 'Морской бой (6×6)', g_ttt: 'Крестики-нолики', g_rps: 'Камень-ножницы-бумага', g_pig: 'Кости «Свинья»',
        menu: 'Меню', surrender: 'Сдаться',
        your_fleet: 'Твой флот', enemy_grid: 'Поле противника',
        you: 'Ты', hit: 'Ещё', stand: 'Хватит',
        exchange: 'Обмен', check: 'Чек', bet: 'Ставка', call: 'Уравнять', fold: 'Сброс', next_hand: 'Следующая раздача',
        pig_to: 'до {target}', this_turn: 'За ход', roll: 'Бросок', bank: 'В банк',
        trump: 'Козырь', tricks: 'Взятки',
        send_result: 'Отправить результат в чат', play_again: 'Сыграть ещё',
        game_table: 'Игровой стол', at_table: 'за столом', say_something: 'Скажи что-нибудь противнику...',
        result_added: 'Результат добавлен в поле ввода — нажми «Отправить».',
        gn_ttt: 'крестики-нолики', gn_bs: 'морской бой', gn_chess: 'шахматы', gn_bj: '21 (блэкджек)',
        gn_rps: 'камень-ножницы-бумага', gn_poker: 'покер', gn_pig: 'кости', gn_whist: 'вист',
        res_draw: 'вничью', res_user: 'в мою пользу', res_bot: 'в пользу {name}',
        summary_line: '*{user} и {char} сыграли в {game}. Партия закончилась {result}.*',
        hand_0: 'Старшая карта', hand_1: 'Пара', hand_2: 'Две пары', hand_3: 'Тройка', hand_4: 'Стрит',
        hand_5: 'Флеш', hand_6: 'Фулл-хаус', hand_7: 'Каре', hand_8: 'Стрит-флеш', hand_9: 'Роял-флеш',
        set_title: 'Game Companion (мини-игры)', set_enable: 'Включить игры', set_api: 'Настройки API',
        set_url: 'URL', set_key: 'API-ключ', set_model: 'Модель', set_ctx: 'Сообщений для анализа характера:',
        set_lang: 'Язык:', set_hint: 'Персонаж тайно решает, играть честно, поддаться или жульничать — исходя из своего характера и того, что происходит в чате.'
    }
};
function t(key, vars) {
    const lang = settings.language === 'ru' ? 'ru' : 'en';
    let str = (I18N[lang] && I18N[lang][key] !== undefined) ? I18N[lang][key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
    if (vars) for (const k in vars) str = str.split('{' + k + '}').join(vars[k]);
    return str;
}


let gameState = {
    active: false,
    gameType: null,            // 'ttt', 'bs', 'chess', 'bj', 'rps'
    opponentName: "",
    chatLog: [],
    turn: 'user',
    winner: null,
    selectedSquare: null,
    tttBoard: Array(9).fill(null),
    bsUserGrid: Array(36).fill(null),
    bsBotGrid: Array(36).fill(null),
    // hidden difficulty
    disposition: { mode: 'fair', skill: 3, reason: '' },
    // 21
    deck: [], playerCards: [], dealerCards: [], blackjackPhase: 'player',
    // RPS
    rpsPlayerScore: 0, rpsBotScore: 0, rpsLast: null,
    // Poker
    poker: null,
    // Dice (Pig)
    pig: null,
    // Whist
    whist: null
};

const CHESS_PIECE_SYMBOLS = {
    'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
    'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
};

let chessInstance = null;

function loadChessScript() {
    if (typeof Chess === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js';
        script.onload = () => console.log("[RPG Game] chess.js loaded.");
        document.head.appendChild(script);
    }
}

function loadSettings() {
    if (!extension_settings[MODULE_NAME]) extension_settings[MODULE_NAME] = {};
    settings = Object.assign({}, defaultSettings, extension_settings[MODULE_NAME]);
}
function saveSettings() { extension_settings[MODULE_NAME] = settings; saveSettingsDebounced(); }

function userName() { const c = getContext(); return (c && c.name1) ? c.name1 : 'Player'; }

// === SHARED API CALL ===
async function callApi(messages, { json = false, maxTokens = 120 } = {}) {
    if (!settings.apiKey) throw new Error('No API key');
    const url = (settings.baseUrl || 'https://openrouter.ai/api/v1').replace(/\/$/, '') + '/chat/completions';
    const body = { model: settings.model, messages, temperature: settings.temperature, max_tokens: maxTokens };
    if (json) body.response_format = { type: 'json_object' };
    const r = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${settings.apiKey.trim()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('API ' + r.status);
    const data = await r.json();
    return data.choices[0].message.content.trim();
}

// === HIDDEN DIFFICULTY (personality + context) ===
async function determineDisposition() {
    gameState.disposition = { mode: 'fair', skill: 3, reason: '' };
    if (!settings.apiKey) return;
    try {
        const context = getContext();
        const char = characters.find(c => c.name === gameState.opponentName) || characters[context.characterId];
        const persona = char ? `${char.description || ''}\n${char.personality || ''}` : '';
        const num = Math.min(settings.contextMessages || 10, context.chat.length);
        const recent = context.chat.slice(-num).filter(m => !m.is_system).map(m => `${m.name}: ${m.mes}`).join('\n\n');

        const sys = `You secretly decide HOW the character "${gameState.opponentName}" plays a casual game against the user. This is a hidden difficulty/attitude.
Character personality:
${persona.substring(0, 1200)}

Recent scene:
${recent.substring(0, 1500)}

Pick a mode (DEFAULT is "fair" — most characters simply play to win normally):
- "fair": plays normally and tries to win. CHOOSE THIS unless there is a strong, specific in-character reason not to.
- "cheat": bends the rules to win (clear tricksters, schemers, demons/supernatural, arrogant or ruthlessly competitive types). A clever or proud character is FAR more likely to cheat than to throw.
- "throw": deliberately loses. RARE. Only when the character clearly WANTS the user to win right now (deeply smitten and indulgent, drunk/badly hurt/exhausted, or openly not caring about winning). NEVER throw for a proud, competitive, intelligent, or antagonistic character.
Also pick "skill": integer 1-5 (1 = clumsy/weak, 5 = sharp/strategic). Smart/strategic characters = 4-5.
Important: "throw" must be UNCOMMON. If unsure, pick "fair". A mastermind, schemer or genius is "cheat" or a high-skill "fair" — essentially never "throw".
"reason": one short English sentence, in character.
Output ONLY JSON: {"mode":"fair","skill":3,"reason":"..."}`;

        const raw = await callApi([{ role: 'system', content: sys }], { json: true, maxTokens: 120 });
        const m = raw.match(/\{[\s\S]*\}/);
        const res = JSON.parse(m ? m[0] : raw);
        if (res && ['fair', 'throw', 'cheat'].includes(res.mode)) {
            gameState.disposition = {
                mode: res.mode,
                skill: Math.max(1, Math.min(5, parseInt(res.skill) || 3)),
                reason: (res.reason || '').toString()
            };
        }
        console.log('[RPG Game] disposition:', gameState.disposition);
    } catch (e) { console.error('[RPG Game] disposition error:', e); }
}

// === AI COMMENTATOR ===
let lastCommentAt = 0;
async function generateAiCommentary(gameEvent, force = false) {
    if (!settings.apiKey) return;
    const now = Date.now();
    if (!force) {
        if (now - lastCommentAt < 6000) return;   // no more than once per ~6s
        if (Math.random() < 0.5) return;           // and sometimes just stays silent
    }
    lastCommentAt = now;
    const context = getContext();
    const charName = gameState.opponentName;
    const num = Math.min(settings.contextMessages || 10, context.chat.length);
    const mainHistory = context.chat.slice(-num).filter(m => !m.is_system).map(m => `${m.name}: ${m.mes}`).join('\n\n');
    const gameHistoryText = gameState.chatLog.slice(-5).map(m => `${m.sender === 'user' ? userName() : charName}: ${m.text}`).join('\n');

    const moodHint = gameState.disposition.mode === 'cheat'
        ? 'Secretly you are bending the rules to win — act sly/confident, but NEVER openly admit cheating.'
        : gameState.disposition.mode === 'throw'
            ? 'Secretly you are letting them win — be warm/playful/encouraging, but NEVER admit you are throwing the game.'
            : 'Play it straight and natural.';

    const systemPrompt = `You are the character "${charName}" playing a mini-game with ${userName()}.
Story context:
${mainHistory}

Game chat so far:
${gameHistoryText}

Hidden attitude: ${moodHint} (${gameState.disposition.reason})

Task: react to this game event, in character, spoken aloud.
Event: ${gameEvent}

Rules:
1. Speak as "${charName}", in ${langName()}, stay in character.
2. Very short (1-2 sentences).
3. Output ONLY the spoken line — no code, no coordinates, no stage directions.`;

    addGameChatMessage('typing', t('thinking', {name: charName}));
    try {
        const comment = await callApi([{ role: 'system', content: systemPrompt }], { maxTokens: 100 });
        removeTypingIndicator();
        if (comment) addGameChatMessage('bot', comment);
    } catch (e) {
        removeTypingIndicator();
        console.error("Commentary error:", e);
    }
}

// === GAME START (with hidden difficulty) ===
async function startGame(type) {
    gameState.active = true;
    gameState.gameType = type;
    gameState.winner = null;
    gameState.chatLog = [];
    gameState.disposition = { mode: 'fair', skill: 3, reason: '' };

    const canvas = $('#rpg-game-canvas');
    canvas.html('<div class="rpg-game-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> ' + t('opp_getting_ready') + '</div>');

    try { await determineDisposition(); } catch (e) {}

    if (type === 'chess') initChessGame();
    else if (type === 'ttt') initTicTacToe();
    else if (type === 'bs') initBattleship();
    else if (type === 'bj') initBlackjack();
    else if (type === 'rps') initRps();
    else if (type === 'poker') initPoker();
    else if (type === 'pig') initPig();
    else if (type === 'whist') initWhist();
}

/* ============================================================
   CHESS
   ============================================================ */
function initChessGame() {
    loadChessScript();
    if (typeof Chess === 'undefined') { setTimeout(initChessGame, 120); return; }
    chessInstance = new Chess();
    gameState.selectedSquare = null;
    gameState.turn = 'user';
    gameState.winner = null;
    addGameChatMessage('system', t('chess_start', {name: gameState.opponentName}));
    renderGameArea();
}

function chessPieceVal(t) { return ({ p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 })[t] || 0; }

function pickChessMove(moves) {
    if (!moves.length) return null;
    const d = gameState.disposition.mode;
    const skill = gameState.disposition.skill;

    if (d === 'cheat') {
        let best = null, bestScore = -Infinity;
        for (const mv of moves) {
            let s = Math.random() * 0.5;
            if (mv.captured) s += chessPieceVal(mv.captured) * 10;
            if (mv.san.includes('#')) s += 1000;
            else if (mv.san.includes('+')) s += 3;
            if (mv.promotion) s += 8;
            if (s > bestScore) { bestScore = s; best = mv; }
        }
        return best;
    }
    if (d === 'throw') {
        const quiet = moves.filter(m => !m.captured && !m.san.includes('+') && !m.san.includes('#'));
        const pool = quiet.length ? quiet : moves;
        return pool[Math.floor(Math.random() * pool.length)];
    }
    // fair: higher skill captures pieces more often
    const captures = moves.filter(m => m.captured);
    if (captures.length && Math.random() < (skill / 6)) {
        return captures[Math.floor(Math.random() * captures.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
}

function handleChessClick(squareName) {
    if (gameState.winner || gameState.turn !== 'user') return;
    const piece = chessInstance.get(squareName);

    if (gameState.selectedSquare === null) {
        if (piece && piece.color === 'w') { gameState.selectedSquare = squareName; renderGameArea(); }
    } else {
        const move = chessInstance.move({ from: gameState.selectedSquare, to: squareName, promotion: 'q' });
        if (move) {
            gameState.selectedSquare = null;
            renderGameArea();
            if (chessInstance.game_over()) { resolveChessWinner(); return; }
            gameState.turn = 'bot';
            setTimeout(() => {
                const moves = chessInstance.moves({ verbose: true });
                const selectedMove = pickChessMove(moves);
                if (selectedMove) {
                    chessInstance.move(selectedMove);
                    renderGameArea();
                    if (chessInstance.game_over()) { resolveChessWinner(); return; }
                    gameState.turn = 'user';
                    generateAiCommentary(`${userName()} moved. You replied with ${selectedMove.san}. Now it's ${userName()}'s turn.`);
                }
            }, 900);
        } else {
            gameState.selectedSquare = (piece && piece.color === 'w') ? squareName : null;
            renderGameArea();
        }
    }
}

function resolveChessWinner() {
    if (chessInstance.in_checkmate()) gameState.winner = chessInstance.turn() === 'b' ? 'user' : 'bot';
    else gameState.winner = 'draw';
    renderGameArea();
    resolveGame();
}

/* ============================================================
   TIC-TAC-TOE
   ============================================================ */
function initTicTacToe() {
    gameState.tttBoard = Array(9).fill(null);
    gameState.turn = 'user';
    gameState.winner = null;
    addGameChatMessage('system', t('ttt_start'));
    renderGameArea();
}

function tttEmpties(b) { const e = []; b.forEach((c, i) => { if (!c) e.push(i); }); return e; }

function tttWinnerOf(b) {
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const [a, c, d] of lines) { if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]; }
    if (!b.includes(null)) return 'draw';
    return null;
}

function tttMinimax(b, player) {
    const w = tttWinnerOf(b);
    if (w === 'O') return { score: 10 };
    if (w === 'X') return { score: -10 };
    if (w === 'draw') return { score: 0 };
    const empties = tttEmpties(b);
    if (player === 'O') {
        let best = { score: -Infinity };
        for (const i of empties) { b[i] = 'O'; const r = tttMinimax(b, 'X'); b[i] = null; if (r.score > best.score) best = { score: r.score, index: i }; }
        return best;
    } else {
        let best = { score: Infinity };
        for (const i of empties) { b[i] = 'X'; const r = tttMinimax(b, 'O'); b[i] = null; if (r.score < best.score) best = { score: r.score, index: i }; }
        return best;
    }
}

function findWinningTttMove(symbol) {
    const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    for (const line of lines) {
        const vals = [gameState.tttBoard[line[0]], gameState.tttBoard[line[1]], gameState.tttBoard[line[2]]];
        if (vals.filter(v => v === symbol).length === 2 && vals.indexOf(null) !== -1) return line[vals.indexOf(null)];
    }
    return null;
}

function pickTttMove() {
    const d = gameState.disposition.mode;
    const b = gameState.tttBoard;
    const empties = tttEmpties(b);
    if (!empties.length) return null;

    if (d === 'cheat') { const r = tttMinimax(b, 'O'); return (r.index !== undefined) ? r.index : empties[0]; }
    if (d === 'throw') {
        let cand = empties.filter(i => { b[i] = 'O'; const win = tttWinnerOf(b) === 'O'; b[i] = null; return !win; });
        if (!cand.length) cand = empties;
        return cand[Math.floor(Math.random() * cand.length)];
    }
    // fair: always tries to win; blocks more often with higher skill
    let mv = findWinningTttMove('O');
    if (mv === null && Math.random() < (gameState.disposition.skill / 5)) mv = findWinningTttMove('X');
    if (mv === null) mv = empties[Math.floor(Math.random() * empties.length)];
    return mv;
}

function handleTttClick(index) {
    if (gameState.tttBoard[index] || gameState.winner || gameState.turn !== 'user') return;
    gameState.tttBoard[index] = 'X';
    renderGameArea();
    if (checkTttWinner()) { resolveGame(); return; }
    gameState.turn = 'bot';
    setTimeout(async () => {
        const botMove = pickTttMove();
        if (botMove !== null && botMove !== undefined) {
            gameState.tttBoard[botMove] = 'O';
            renderGameArea();
            if (checkTttWinner()) { resolveGame(); return; }
            gameState.turn = 'user';
            await generateAiCommentary(`${userName()} made a move. You placed an 'O'.`);
        } else { gameState.winner = 'draw'; resolveGame(); }
    }, 800);
}

function checkTttWinner() {
    const w = tttWinnerOf(gameState.tttBoard);
    if (w === 'X') { gameState.winner = 'user'; return true; }
    if (w === 'O') { gameState.winner = 'bot'; return true; }
    if (w === 'draw') { gameState.winner = 'draw'; return true; }
    return false;
}

/* ============================================================
   BATTLESHIP (6x6)
   ============================================================ */
function initBattleship() {
    gameState.bsUserGrid = Array(36).fill(null);
    gameState.bsBotGrid = Array(36).fill(null);
    gameState.turn = 'user';
    gameState.winner = null;
    placeShipsRandomly(gameState.bsUserGrid);
    placeShipsRandomly(gameState.bsBotGrid);
    addGameChatMessage('system', t('bs_start'));
    renderGameArea();
}

function placeShipsRandomly(grid) {
    const sizes = [3, 2, 1];
    sizes.forEach(size => {
        let placed = false;
        while (!placed) {
            let isH = Math.random() > 0.5;
            let row = Math.floor(Math.random() * 6);
            let col = Math.floor(Math.random() * (6 - size + 1));
            if (!isH) { row = Math.floor(Math.random() * (6 - size + 1)); col = Math.floor(Math.random() * 6); }
            let collision = false;
            for (let i = 0; i < size; i++) { const idx = isH ? (row * 6 + col + i) : ((row + i) * 6 + col); if (grid[idx] === 'ship') { collision = true; break; } }
            if (!collision) { for (let i = 0; i < size; i++) { const idx = isH ? (row * 6 + col + i) : ((row + i) * 6 + col); grid[idx] = 'ship'; } placed = true; }
        }
    });
}

async function handleBsClick(index) {
    if (gameState.winner || gameState.turn !== 'user') return;
    if (gameState.bsBotGrid[index] === 'miss' || gameState.bsBotGrid[index] === 'hit') return;
    const hit = gameState.bsBotGrid[index] === 'ship';
    gameState.bsBotGrid[index] = hit ? 'hit' : 'miss';
    renderGameArea();
    if (hit) {
        if (!gameState.bsBotGrid.includes('ship')) { gameState.winner = 'user'; resolveGame(); return; }
        await generateAiCommentary(`${userName()} fired and HIT your ship!`);
    } else {
        gameState.turn = 'bot';
        addGameChatMessage('system', t('bs_miss_turn', {name: gameState.opponentName}));
        await generateAiCommentary(`${userName()} fired and MISSED.`);
        setTimeout(botBsTurn, 1000);
    }
}

function pickBsMove() {
    const g = gameState.bsUserGrid;
    const d = gameState.disposition.mode;
    const unshot = [];
    g.forEach((c, i) => { if (c !== 'miss' && c !== 'hit') unshot.push(i); });
    if (!unshot.length) return null;

    if (d === 'cheat') {                       // sees ships through the fog
        const ships = unshot.filter(i => g[i] === 'ship');
        if (ships.length) return ships[Math.floor(Math.random() * ships.length)];
    }
    if (d === 'throw') {                        // fires only at water
        const water = unshot.filter(i => g[i] === null);
        if (water.length) return water[Math.floor(Math.random() * water.length)];
    }
    // fair: hunter mode — finishes off damaged ships
    const hitCells = [];
    g.forEach((c, i) => { if (c === 'hit') hitCells.push(i); });
    for (const hit of hitCells) {
        const row = Math.floor(hit / 6), col = hit % 6;
        const adj = [];
        if (row > 0) adj.push((row - 1) * 6 + col);
        if (row < 5) adj.push((row + 1) * 6 + col);
        if (col > 0) adj.push(row * 6 + col - 1);
        if (col < 5) adj.push(row * 6 + col + 1);
        const unshotAdj = adj.filter(idx => g[idx] === 'ship' || g[idx] === null);
        if (unshotAdj.length) return unshotAdj[Math.floor(Math.random() * unshotAdj.length)];
    }
    return unshot[Math.floor(Math.random() * unshot.length)];
}

async function botBsTurn() {
    const move = pickBsMove();
    if (move === null) return;
    const hit = gameState.bsUserGrid[move] === 'ship';
    gameState.bsUserGrid[move] = hit ? 'hit' : 'miss';
    renderGameArea();
    if (hit) {
        addGameChatMessage('system', t('bs_opp_hit'));
        if (!gameState.bsUserGrid.includes('ship')) { gameState.winner = 'bot'; resolveGame(); return; }
        await generateAiCommentary(`You fired and HIT ${userName()}'s ship!`);
        setTimeout(botBsTurn, 1000);
    } else {
        addGameChatMessage('system', t('bs_opp_miss'));
        gameState.turn = 'user';
        await generateAiCommentary(`You fired and MISSED.`);
    }
}

/* ============================================================
   21 / BLACKJACK
   ============================================================ */
function buildDeck() {
    const suits = [['♠', false], ['♣', false], ['♥', true], ['♦', true]];
    const ranks = [['A', 11], ['2', 2], ['3', 3], ['4', 4], ['5', 5], ['6', 6], ['7', 7], ['8', 8], ['9', 9], ['10', 10], ['J', 10], ['Q', 10], ['K', 10]];
    const d = [];
    for (const [s, red] of suits) for (const [r, v] of ranks) d.push({ rank: r, suit: s, val: v, red });
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    return d;
}
function bjDraw() { if (!gameState.deck.length) gameState.deck = buildDeck(); return gameState.deck.pop(); }
function handValue(cards) {
    let v = cards.reduce((a, c) => a + c.val, 0);
    let aces = cards.filter(c => c.rank === 'A').length;
    while (v > 21 && aces > 0) { v -= 10; aces--; }
    return v;
}

function initBlackjack() {
    gameState.deck = buildDeck();
    gameState.playerCards = [bjDraw(), bjDraw()];
    gameState.dealerCards = [bjDraw(), bjDraw()];
    gameState.blackjackPhase = 'player';
    gameState.winner = null;
    addGameChatMessage('system', t('bj_start', {name: gameState.opponentName}));
    renderGameArea();
    if (handValue(gameState.playerCards) === 21) { gameState.blackjackPhase = 'dealer'; setTimeout(dealerPlay, 700); }
}

function bjHit() {
    if (gameState.blackjackPhase !== 'player' || gameState.winner) return;
    gameState.playerCards.push(bjDraw());
    renderGameArea();
    if (handValue(gameState.playerCards) > 21) {
        gameState.blackjackPhase = 'done';
        gameState.winner = 'bot';
        renderGameArea();
        addGameChatMessage('system', t('bj_bust'));
        resolveGame();
        generateAiCommentary(`${userName()} busted (over 21) in 21. You win.`, true);
    }
}

function bjStand() {
    if (gameState.blackjackPhase !== 'player' || gameState.winner) return;
    gameState.blackjackPhase = 'dealer';
    addGameChatMessage('system', t('bj_reveal', {name: gameState.opponentName}));
    renderGameArea();
    setTimeout(dealerPlay, 700);
}

function dealerPlay() {
    const d = gameState.disposition.mode;
    const pv = handValue(gameState.playerCards);
    let safety = 0;

    if (d === 'throw') {
        // throw: if already winning, draws until bust; otherwise stands (lets the player win)
        while (handValue(gameState.dealerCards) > pv && handValue(gameState.dealerCards) <= 21 && gameState.deck.length && safety < 12) {
            gameState.dealerCards.push(bjDraw()); safety++;
        }
    } else if (d === 'cheat') {
        // cheat: "pulls" the needed card from the deck to beat the player without busting
        while (handValue(gameState.dealerCards) <= pv && handValue(gameState.dealerCards) < 21 && gameState.deck.length && safety < 14) {
            let idx = gameState.deck.findIndex(c => { const v = handValue(gameState.dealerCards.concat(c)); return v <= 21 && v > pv; });
            if (idx < 0) idx = gameState.deck.findIndex(c => handValue(gameState.dealerCards.concat(c)) <= 21);
            if (idx < 0) break;
            gameState.dealerCards.push(gameState.deck.splice(idx, 1)[0]); safety++;
        }
    } else {
        // fair: draws to 17
        while (handValue(gameState.dealerCards) < 17 && gameState.deck.length && safety < 12) {
            gameState.dealerCards.push(bjDraw()); safety++;
        }
    }
    resolveBlackjack();
}

function resolveBlackjack() {
    gameState.blackjackPhase = 'done';
    const pv = handValue(gameState.playerCards), dv = handValue(gameState.dealerCards);
    if (pv > 21) gameState.winner = 'bot';
    else if (dv > 21) gameState.winner = 'user';
    else if (pv > dv) gameState.winner = 'user';
    else if (dv > pv) gameState.winner = 'bot';
    else gameState.winner = 'draw';
    renderGameArea();
    resolveGame();
    const who = gameState.winner === 'user' ? userName() : (gameState.winner === 'bot' ? 'you' : 'a tie');
    generateAiCommentary(`21 result — ${userName()}: ${pv}, you: ${dv}. Winner: ${who}.`, true);
}

/* ============================================================
   ROCK-PAPER-SCISSORS (first to 3 wins)
   ============================================================ */
function initRps() {
    gameState.rpsPlayerScore = 0;
    gameState.rpsBotScore = 0;
    gameState.rpsLast = null;
    gameState.winner = null;
    addGameChatMessage('system', t('rps_start', {name: gameState.opponentName}));
    renderGameArea();
}

async function rpsPlay(choice) {
    if (gameState.winner) return;
    const beats = { rock: 'scissors', paper: 'rock', scissors: 'paper' };  // choice beats value
    const losesTo = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
    const names = { rock: 'Rock', paper: 'Paper', scissors: 'Scissors' };
    const emo = { rock: '✊', paper: '✋', scissors: '✌️' };
    const d = gameState.disposition.mode;

    let bot;
    if (d === 'cheat') bot = losesTo[choice];        // peeks and counters your choice
    else if (d === 'throw') bot = beats[choice];     // deliberately picks the losing move
    else bot = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];

    let res;
    if (choice === bot) res = t('rps_tied');
    else if (beats[choice] === bot) { res = t('rps_won'); gameState.rpsPlayerScore++; }
    else { res = t('rps_lost', {name: gameState.opponentName}); gameState.rpsBotScore++; }

    gameState.rpsLast = `You: ${emo[choice]} ${names[choice]} · ${gameState.opponentName}: ${emo[bot]} ${names[bot]} — ${res}`;

    if (gameState.rpsPlayerScore >= 3) gameState.winner = 'user';
    else if (gameState.rpsBotScore >= 3) gameState.winner = 'bot';

    renderGameArea();
    if (gameState.winner) resolveGame();
    else await generateAiCommentary(`Rock-paper-scissors round: ${userName()} chose ${choice}, you chose ${bot}. ${res} Score ${userName()} ${gameState.rpsPlayerScore} : ${gameState.rpsBotScore} you.`);
}

/* ============================================================
   POKER (5-card draw, heads-up)
   ============================================================ */
function rankValue(r) { return ({ 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 })[r]; }

function evalHand(cards) {
    const vals = cards.map(c => rankValue(c.rank)).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);
    const isFlush = suits.every(s => s === suits[0]);
    const uniq = [...new Set(vals)].sort((a, b) => b - a);
    let isStraight = false, straightHigh = 0;
    if (uniq.length === 5) {
        if (uniq[0] - uniq[4] === 4) { isStraight = true; straightHigh = uniq[0]; }
        else if (uniq[0] === 14 && uniq[1] === 5 && uniq[2] === 4 && uniq[3] === 3 && uniq[4] === 2) { isStraight = true; straightHigh = 5; }
    }
    const counts = {}; vals.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const groups = Object.entries(counts).map(([v, c]) => [c, parseInt(v)]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    const countsArr = groups.map(g => g[0]);
    const orderedVals = groups.map(g => g[1]);
    let cat;
    if (isStraight && isFlush) cat = (straightHigh === 14) ? 9 : 8;
    else if (countsArr[0] === 4) cat = 7;
    else if (countsArr[0] === 3 && countsArr[1] === 2) cat = 6;
    else if (isFlush) cat = 5;
    else if (isStraight) cat = 4;
    else if (countsArr[0] === 3) cat = 3;
    else if (countsArr[0] === 2 && countsArr[1] === 2) cat = 2;
    else if (countsArr[0] === 2) cat = 1;
    else cat = 0;
    let tb;
    if (cat === 4 || cat === 8) tb = [straightHigh];
    else if (cat === 5 || cat === 0) tb = vals;
    else tb = orderedVals;
    return [cat, ...tb];
}
function cmpHand(a, b) { const x = evalHand(a), y = evalHand(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { const xa = x[i] || 0, yb = y[i] || 0; if (xa !== yb) return xa - yb; } return 0; }
function handName(cards) { return t('hand_' + evalHand(cards)[0]); }

function initPoker() {
    gameState.poker = { playerChips: 100, botChips: 100 };
    gameState.winner = null;
    pokerDealHand();
    addGameChatMessage('system', t('poker_start', {name: gameState.opponentName}));
}
function pokerDealHand() {
    const p = gameState.poker;
    p.deck = buildDeck();
    p.playerHand = [p.deck.pop(), p.deck.pop(), p.deck.pop(), p.deck.pop(), p.deck.pop()];
    p.botHand = [p.deck.pop(), p.deck.pop(), p.deck.pop(), p.deck.pop(), p.deck.pop()];
    p.selected = [];
    p.revealed = false;
    p.handResult = '';
    const ante = Math.min(5, p.playerChips, p.botChips);
    p.playerChips -= ante; p.botChips -= ante; p.pot = ante * 2;
    p.callAmount = 0;
    p.phase = 'draw';
    renderGameArea();
}
function pokerToggleDiscard(i) {
    if (gameState.poker.phase !== 'draw') return;
    const s = gameState.poker.selected;
    const idx = s.indexOf(i);
    if (idx >= 0) s.splice(idx, 1); else s.push(i);
    renderGameArea();
}
function pokerKeepMask(hand) {
    const counts = {}; hand.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
    const suitCounts = {}; hand.forEach(c => suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1);
    let flushSuit = null; for (const s in suitCounts) if (suitCounts[s] >= 4) flushSuit = s;
    const keep = hand.map(c => flushSuit ? c.suit === flushSuit : counts[c.rank] >= 2);
    if (keep.every(k => !k)) { let hi = 0, hv = -1; hand.forEach((c, i) => { const v = rankValue(c.rank); if (v > hv) { hv = v; hi = i; } }); keep[hi] = true; }
    return keep;
}
function pokerCheatImprove() {
    const p = gameState.poker; let safety = 0;
    while (cmpHand(p.botHand, p.playerHand) <= 0 && p.deck.length && safety < 25) {
        let wi = 0, wv = 99; p.botHand.forEach((c, i) => { const v = rankValue(c.rank); if (v < wv) { wv = v; wi = i; } });
        let bestIdx = -1, bestCmp = cmpHand(p.botHand, p.playerHand);
        for (let k = 0; k < p.deck.length; k++) {
            const saved = p.botHand[wi]; p.botHand[wi] = p.deck[k];
            const c = cmpHand(p.botHand, p.playerHand); p.botHand[wi] = saved;
            if (c > bestCmp) { bestCmp = c; bestIdx = k; }
        }
        if (bestIdx < 0) break;
        p.botHand[wi] = p.deck.splice(bestIdx, 1)[0]; safety++;
    }
}
function pokerThrowWeaken() {
    const p = gameState.poker; let safety = 0;
    while (cmpHand(p.botHand, p.playerHand) >= 0 && p.deck.length && safety < 25) {
        let hi = 0, hv = -1; p.botHand.forEach((c, i) => { const v = rankValue(c.rank); if (v > hv) { hv = v; hi = i; } });
        let li = 0, lv = 99; p.deck.forEach((c, k) => { const v = rankValue(c.rank); if (v < lv) { lv = v; li = k; } });
        p.botHand[hi] = p.deck.splice(li, 1)[0]; safety++;
    }
}
function pokerAiDraw() {
    const p = gameState.poker; const d = gameState.disposition.mode;
    let keep;
    if (d === 'throw') { keep = p.botHand.map(() => false); let lo = 0, lv = 99; p.botHand.forEach((c, i) => { const v = rankValue(c.rank); if (v < lv) { lv = v; lo = i; } }); keep[lo] = true; }
    else keep = pokerKeepMask(p.botHand);
    for (let i = 0; i < 5; i++) { if (!keep[i] && p.deck.length) p.botHand[i] = p.deck.pop(); }
    if (d === 'cheat') pokerCheatImprove();
    if (d === 'throw') pokerThrowWeaken();
}
function pokerConfirmDraw() {
    const p = gameState.poker;
    if (p.phase !== 'draw') return;
    p.selected.forEach(i => { if (p.deck.length) p.playerHand[i] = p.deck.pop(); });
    p.selected = [];
    pokerAiDraw();
    p.phase = 'p_bet';
    addGameChatMessage('system', t('poker_swapped', {name: gameState.opponentName}));
    renderGameArea();
}
function pokerBet(action) {
    const p = gameState.poker;
    if (p.phase !== 'p_bet') return;
    if (action === 'bet') {
        const amt = Math.min(10, p.playerChips);
        p.playerChips -= amt; p.pot += amt;
        addGameChatMessage('system', t('poker_you_bet', {amt}));
        p.phase = 'wait'; renderGameArea();
        setTimeout(() => pokerAiVsBet(amt), 650);
    } else {
        addGameChatMessage('system', t('poker_you_check'));
        p.phase = 'wait'; renderGameArea();
        setTimeout(pokerAiVsCheck, 650);
    }
}
function pokerAiVsCheck() {
    const p = gameState.poker; const d = gameState.disposition.mode;
    const cat = evalHand(p.botHand)[0];
    const ahead = cmpHand(p.botHand, p.playerHand) > 0;
    let bet;
    if (d === 'cheat') bet = ahead;
    else if (d === 'throw') bet = false;
    else bet = cat >= 2 || (cat >= 1 && Math.random() < gameState.disposition.skill / 6);
    if (bet && p.botChips > 0) {
        const amt = Math.min(10, p.botChips);
        p.botChips -= amt; p.pot += amt; p.callAmount = amt; p.phase = 'p_respond';
        addGameChatMessage('system', t('poker_opp_bets', {name: gameState.opponentName, amt}));
        renderGameArea(); return;
    }
    addGameChatMessage('system', t('poker_opp_checks', {name: gameState.opponentName}));
    pokerShowdown();
}
function pokerAiVsBet(amount) {
    const p = gameState.poker; const d = gameState.disposition.mode;
    const cat = evalHand(p.botHand)[0];
    const ahead = cmpHand(p.botHand, p.playerHand) > 0;
    let action;
    if (d === 'cheat') action = ahead ? 'raise' : 'fold';
    else if (d === 'throw') action = 'fold';
    else { if (cat >= 4) action = 'raise'; else if (cat >= 1) action = 'call'; else action = (Math.random() < gameState.disposition.skill / 8) ? 'call' : 'fold'; }
    if (action === 'fold') { addGameChatMessage('system', t('poker_opp_folds', {name: gameState.opponentName})); pokerAward('user', false); return; }
    if (action === 'call' || p.botChips <= amount) {
        const amt = Math.min(amount, p.botChips); p.botChips -= amt; p.pot += amt;
        addGameChatMessage('system', t('poker_opp_calls', {name: gameState.opponentName}));
        pokerShowdown(); return;
    }
    const callPart = Math.min(amount, p.botChips); p.botChips -= callPart; p.pot += callPart;
    const raisePart = Math.min(10, p.botChips); p.botChips -= raisePart; p.pot += raisePart;
    p.callAmount = raisePart; p.phase = 'p_respond';
    addGameChatMessage('system', t('poker_opp_raises', {name: gameState.opponentName, amt: raisePart}));
    renderGameArea();
}
function pokerRespond(action) {
    const p = gameState.poker;
    if (p.phase !== 'p_respond') return;
    if (action === 'fold') { addGameChatMessage('system', t('poker_you_fold')); pokerAward('bot', false); return; }
    const amt = Math.min(p.callAmount, p.playerChips); p.playerChips -= amt; p.pot += amt;
    addGameChatMessage('system', t('poker_you_call'));
    pokerShowdown();
}
function pokerShowdown() {
    const p = gameState.poker;
    const c = cmpHand(p.playerHand, p.botHand);
    pokerAward(c > 0 ? 'user' : (c < 0 ? 'bot' : 'draw'), true);
}
function pokerAward(who, isShowdown) {
    const p = gameState.poker;
    p.revealed = !!isShowdown;
    if (who === 'user') { p.playerChips += p.pot; p.handResult = t('poker_you_pot', {pot: p.pot}) + (isShowdown ? ` — ${handName(p.playerHand)}` : '') + '.'; }
    else if (who === 'bot') { p.botChips += p.pot; p.handResult = t('poker_opp_pot', {name: gameState.opponentName, pot: p.pot}) + (isShowdown ? ` — ${handName(p.botHand)}` : '') + '.'; }
    else { const half = Math.floor(p.pot / 2); p.playerChips += half; p.botChips += p.pot - half; p.handResult = t('poker_tie', {hand: handName(p.playerHand)}); }
    p.pot = 0; p.phase = 'result';
    renderGameArea();
    addGameChatMessage('system', p.handResult);
    generateAiCommentary(`Poker hand finished. ${p.handResult} Chips now — ${userName()}: ${p.playerChips}, you: ${p.botChips}.`, true);
    if (p.playerChips <= 0) { gameState.winner = 'bot'; resolveGame(); }
    else if (p.botChips <= 0) { gameState.winner = 'user'; resolveGame(); }
}
function pokerNextHand() { pokerDealHand(); }

/* ============================================================
   DICE "PIG" (to 50)
   ============================================================ */
function initPig() {
    gameState.pig = { phase: 'player', playerScore: 0, botScore: 0, turnTotal: 0, lastRoll: null, message: '', target: 50 };
    gameState.winner = null;
    addGameChatMessage('system', t('pig_start', {name: gameState.opponentName}));
    renderGameArea();
}
function pigRoll() {
    const pig = gameState.pig;
    if (pig.phase !== 'player' || gameState.winner) return;
    const roll = 1 + Math.floor(Math.random() * 6);
    pig.lastRoll = roll;
    if (roll === 1) {
        pig.turnTotal = 0;
        pig.message = t('pig_you_one');
        pig.phase = 'bot';
        renderGameArea();
        setTimeout(botPigTurn, 900);
    } else {
        pig.turnTotal += roll;
        pig.message = t('pig_you_roll', {roll, total: pig.turnTotal});
        renderGameArea();
    }
}
function pigBank() {
    const pig = gameState.pig;
    if (pig.phase !== 'player' || gameState.winner || pig.turnTotal === 0) return;
    pig.playerScore += pig.turnTotal;
    pig.message = t('pig_you_bank', {total: pig.turnTotal});
    pig.turnTotal = 0; pig.lastRoll = null;
    if (pig.playerScore >= pig.target) { gameState.winner = 'user'; pig.phase = 'over'; renderGameArea(); resolveGame(); return; }
    pig.phase = 'bot';
    renderGameArea();
    setTimeout(botPigTurn, 800);
}
function botRollDie() {
    const d = gameState.disposition.mode;
    if (d === 'cheat') return 2 + Math.floor(Math.random() * 5);            // loaded — never a 1
    if (d === 'throw') return (Math.random() < 0.55) ? 1 : (2 + Math.floor(Math.random() * 5)); // busts often
    return 1 + Math.floor(Math.random() * 6);
}
function botShouldBank() {
    const pig = gameState.pig; const d = gameState.disposition.mode;
    if (pig.botScore + pig.turnTotal >= pig.target) return true;
    if (d === 'throw') return false;                                        // never banks — plays until it busts
    if (d === 'cheat') return pig.turnTotal >= 24;
    return pig.turnTotal >= (14 + gameState.disposition.skill * 2);          // 16..24 by skill
}
function botPigTurn() {
    const pig = gameState.pig;
    pig.phase = 'bot';
    pig.turnTotal = 0;
    pig.message = t('pig_opp_pickup', {name: gameState.opponentName});
    renderGameArea();
    setTimeout(botPigStep, 700);
}
function botPigStep() {
    const pig = gameState.pig;
    if (pig.phase !== 'bot' || gameState.winner) return;
    if (pig.turnTotal > 0 && botShouldBank()) {
        pig.botScore += pig.turnTotal;
        pig.message = t('pig_opp_bank', {name: gameState.opponentName, total: pig.turnTotal});
        pig.turnTotal = 0; pig.lastRoll = null;
        renderGameArea();
        if (pig.botScore >= pig.target) {
            gameState.winner = 'bot'; pig.phase = 'over';
            renderGameArea(); resolveGame();
            generateAiCommentary(`You reached ${pig.target} and won the dice game (Pig).`, true);
            return;
        }
        pig.phase = 'player'; renderGameArea();
        return;
    }
    const roll = botRollDie();
    pig.lastRoll = roll;
    if (roll === 1) {
        pig.turnTotal = 0;
        pig.message = t('pig_opp_one', {name: gameState.opponentName});
        renderGameArea();
        pig.phase = 'player';
        setTimeout(renderGameArea, 400);
        generateAiCommentary(`You rolled a 1 in the dice game and lost your turn's points.`);
        return;
    }
    pig.turnTotal += roll;
    pig.message = t('pig_opp_roll', {name: gameState.opponentName, roll, total: pig.turnTotal});
    renderGameArea();
    setTimeout(botPigStep, 850);
}

/* ============================================================
   WHIST (heads-up, tricks & trump, 7 cards each)
   ============================================================ */
function sortWhistHand(h) { const order = { '♠': 0, '♥': 1, '♣': 2, '♦': 3 }; h.sort((a, b) => order[a.suit] - order[b.suit] || rankValue(b.rank) - rankValue(a.rank)); }
function whistRemove(hand, card) { const i = hand.indexOf(card); if (i >= 0) hand.splice(i, 1); }
function whistStrength(c, led, trump) { if (c.suit === trump) return 200 + rankValue(c.rank); if (c.suit === led) return 100 + rankValue(c.rank); return rankValue(c.rank); }
function whistTrickWinner(uc, bc, led, trump) { return whistStrength(uc, led, trump) > whistStrength(bc, led, trump) ? 'user' : 'bot'; }

function initWhist() {
    const deck = buildDeck();
    const trump = deck[deck.length - 1].suit;
    gameState.whist = {
        trump,
        playerHand: deck.slice(0, 7),
        botHand: deck.slice(7, 14),
        table: { user: null, bot: null },
        ledSuit: null,
        turn: 'user',
        playerTricks: 0, botTricks: 0,
        message: ''
    };
    sortWhistHand(gameState.whist.playerHand);
    gameState.winner = null;
    addGameChatMessage('system', t('whist_start', {name: gameState.opponentName, trump}));
    renderGameArea();
}

function whistPlayerPlay(index) {
    const w = gameState.whist;
    if (gameState.winner || w.turn !== 'user') return;
    const card = w.playerHand[index];
    if (!card) return;
    const isFollower = w.table.bot !== null;
    if (isFollower) {
        if (w.playerHand.some(c => c.suit === w.ledSuit) && card.suit !== w.ledSuit) { toastr.info(t('whist_follow_suit', {suit: w.ledSuit})); return; }
        w.table.user = card; whistRemove(w.playerHand, card);
        resolveWhistTrick();
    } else {
        w.ledSuit = card.suit; w.table.user = card; whistRemove(w.playerHand, card);
        w.turn = 'bot'; w.message = t('whist_you_led', {card: card.rank + card.suit});
        renderGameArea();
        setTimeout(botWhistFollow, 750);
    }
}

function whistLegalBot(led) { const w = gameState.whist; return w.botHand.some(c => c.suit === led) ? w.botHand.filter(c => c.suit === led) : [...w.botHand]; }

function botWhistFollow() {
    const w = gameState.whist;
    const led = w.ledSuit, trump = w.trump, d = gameState.disposition.mode;
    const legal = whistLegalBot(led);
    const pStr = whistStrength(w.table.user, led, trump);
    const winners = legal.filter(c => whistStrength(c, led, trump) > pStr).sort((a, b) => whistStrength(a, led, trump) - whistStrength(b, led, trump));
    const losers = legal.filter(c => whistStrength(c, led, trump) <= pStr).sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
    let card;
    if (d === 'throw') { card = losers.length ? losers[losers.length - 1] : winners[0]; }              // throw: avoids winning, discards a high card
    else { card = winners.length ? winners[0] : (losers.length ? losers[0] : legal[0]); }              // takes cheaply, otherwise discards a low card
    w.table.bot = card; whistRemove(w.botHand, card);
    resolveWhistTrick();
}

function botWhistLead() {
    const w = gameState.whist;
    const trump = w.trump, d = gameState.disposition.mode;
    let card;
    const byHigh = [...w.botHand].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
    const byLow = [...w.botHand].sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
    if (d === 'throw') card = byLow[0];
    else if (d === 'cheat') { const tr = byHigh.filter(c => c.suit === trump); card = tr.length ? tr[0] : byHigh[0]; }
    else { const nt = byHigh.filter(c => c.suit !== trump); card = nt.length ? nt[0] : byHigh[0]; }
    w.ledSuit = card.suit; w.table.bot = card; whistRemove(w.botHand, card);
    w.turn = 'user'; w.message = t('whist_opp_led', {name: gameState.opponentName, card: card.rank + card.suit});
    renderGameArea();
}

function resolveWhistTrick() {
    const w = gameState.whist;
    renderGameArea();
    const winner = whistTrickWinner(w.table.user, w.table.bot, w.ledSuit, w.trump);
    if (winner === 'user') w.playerTricks++; else w.botTricks++;
    w.message = winner === 'user' ? t('whist_trick_you') : t('whist_trick_opp', {name: gameState.opponentName});
    renderGameArea();
    generateAiCommentary(`Whist trick won by ${winner === 'user' ? userName() : 'you'}. Tricks ${userName()} ${w.playerTricks} : ${w.botTricks} you.`);
    setTimeout(() => {
        w.table.user = null; w.table.bot = null; w.ledSuit = null;
        if (w.playerHand.length === 0 && w.botHand.length === 0) { finishWhist(); return; }
        if (winner === 'bot') { w.turn = 'bot'; renderGameArea(); setTimeout(botWhistLead, 650); }
        else { w.turn = 'user'; w.message = t('your_turn'); renderGameArea(); }
    }, 1000);
}

function finishWhist() {
    const w = gameState.whist;
    gameState.winner = w.playerTricks > w.botTricks ? 'user' : (w.botTricks > w.playerTricks ? 'bot' : 'draw');
    w.turn = 'over';
    w.message = t('whist_over', {a: w.playerTricks, b: w.botTricks});
    renderGameArea();
    resolveGame();
    generateAiCommentary(`Whist game over. Tricks ${userName()} ${w.playerTricks}, you ${w.botTricks}. Winner: ${gameState.winner === 'user' ? userName() : (gameState.winner === 'bot' ? 'you' : 'a tie')}.`, true);
}

/* ============================================================
   RESULT
   ============================================================ */
function resolveGame() {
    let resultText = "";
    if (gameState.winner === 'user') resultText = t('result_win');
    else if (gameState.winner === 'bot') resultText = t('result_lose', {name: gameState.opponentName});
    else resultText = t('result_draw');
    addGameChatMessage('system', resultText);
    $('#rpg-game-summary-btn').fadeIn();
    $('#rpg-replay-btn').fadeIn();
}

/* ============================================================
   RENDER
   ============================================================ */
function cardHtml(c, hidden) {
    if (hidden) return `<div class="rpg-card back"><span>?</span></div>`;
    return `<div class="rpg-card ${c.red ? 'red' : 'black'}"><span class="rpg-card-rank">${c.rank}</span><span class="rpg-card-suit">${c.suit}</span></div>`;
}

function renderGameArea() {
    const canvas = $('#rpg-game-canvas');
    canvas.empty();

    if (!gameState.active) {
        canvas.html(`
            <div class="rpg-menu-container">
                <div class="rpg-menu-title">${t('menu_title', {name: gameState.opponentName})}</div>
                <button class="rpg-game-select-btn" data-game="chess"><i class="fa-solid fa-chess"></i> ${t('g_chess')}</button>
                <button class="rpg-game-select-btn" data-game="bj"><i class="fa-solid fa-clone"></i> ${t('g_bj')}</button>
                <button class="rpg-game-select-btn" data-game="poker"><i class="fa-solid fa-diamond"></i> ${t('g_poker')}</button>
                <button class="rpg-game-select-btn" data-game="whist"><i class="fa-solid fa-heart"></i> ${t('g_whist')}</button>
                <button class="rpg-game-select-btn" data-game="bs"><i class="fa-solid fa-anchor"></i> ${t('g_bs')}</button>
                <button class="rpg-game-select-btn" data-game="ttt"><i class="fa-solid fa-hashtag"></i> ${t('g_ttt')}</button>
                <button class="rpg-game-select-btn" data-game="rps"><i class="fa-solid fa-hand-scissors"></i> ${t('g_rps')}</button>
                <button class="rpg-game-select-btn" data-game="pig"><i class="fa-solid fa-dice"></i> ${t('g_pig')}</button>
            </div>
        `);
        $('.rpg-game-select-btn[data-game]').on('click', function () { startGame($(this).data('game')); });
        return;
    }

    canvas.append(`
        <button class="rpg-back-btn" id="rpg-back-btn"><i class="fa-solid fa-arrow-left"></i> ${t('menu')}</button>
        <button class="rpg-surrender-btn" id="rpg-surrender-btn"><i class="fa-solid fa-flag"></i> ${t('surrender')}</button>
    `);
    $('#rpg-back-btn').on('click', () => {
        gameState.active = false;
        gameState.chatLog = [];
        renderGameArea();
    });
    $('#rpg-surrender-btn').on('click', () => {
        addGameChatMessage('system', t('surrendered'));
        gameState.active = false;
        gameState.chatLog = [];
        renderGameArea();
    });

    if (gameState.gameType === 'chess' && chessInstance) {
        const board = $('<div class="rpg-chess-board"></div>');
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const sqName = files[col] + ranks[row];
                const piece = chessInstance.get(sqName);
                const isDark = (row + col) % 2 === 1;
                const isSel = gameState.selectedSquare === sqName;
                let pieceHtml = "";
                if (piece) {
                    const symbol = CHESS_PIECE_SYMBOLS[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
                    pieceHtml = `<span class="rpg-chess-piece ${piece.color === 'w' ? 'white' : 'black'}">${symbol}</span>`;
                }
                const sq = $(`<div class="rpg-chess-square ${isDark ? 'dark' : 'light'} ${isSel ? 'selected' : ''}">${pieceHtml}</div>`);
                sq.on('click', () => handleChessClick(sqName));
                board.append(sq);
            }
        }
        canvas.append(board);
    }
    else if (gameState.gameType === 'ttt') {
        const grid = $('<div class="rpg-ttt-grid"></div>');
        gameState.tttBoard.forEach((cell, i) => {
            const el = $(`<div class="rpg-ttt-cell ${cell ? 'taken ' + cell.toLowerCase() : ''}">${cell || ''}</div>`);
            el.on('click', () => handleTttClick(i));
            grid.append(el);
        });
        canvas.append(grid);
    }
    else if (gameState.gameType === 'bs') {
        const container = $('<div class="rpg-bs-container"></div>');
        const grids = $('<div class="rpg-bs-grids"></div>');
        const userGrid = $(`<div class="rpg-bs-grid-wrapper"><div class="rpg-bs-grid-title">${t('your_fleet')}</div><div class="rpg-bs-grid"></div></div>`);
        gameState.bsUserGrid.forEach((cell) => { userGrid.find('.rpg-bs-grid').append(`<div class="rpg-bs-cell ${cell || ''}"></div>`); });
        const botGrid = $(`<div class="rpg-bs-grid-wrapper"><div class="rpg-bs-grid-title">${t('enemy_grid')}</div><div class="rpg-bs-grid"></div></div>`);
        gameState.bsBotGrid.forEach((cell, i) => {
            const el = $(`<div class="rpg-bs-cell ${cell === 'miss' || cell === 'hit' ? cell : ''}"></div>`);
            el.on('click', () => handleBsClick(i));
            botGrid.find('.rpg-bs-grid').append(el);
        });
        grids.append(userGrid).append(botGrid);
        container.append(grids);
        canvas.append(container);
    }
    else if (gameState.gameType === 'bj') {
        const hideHole = gameState.blackjackPhase === 'player';
        const pv = handValue(gameState.playerCards);
        const dvShown = hideHole ? `${handValue([gameState.dealerCards[0]])} + ?` : handValue(gameState.dealerCards);
        const wrap = $('<div class="rpg-bj-wrap"></div>');
        wrap.append(`
            <div class="rpg-bj-side">
                <div class="rpg-bj-label">${gameState.opponentName} · <b>${dvShown}</b></div>
                <div class="rpg-bj-cards">${gameState.dealerCards.map((c, i) => cardHtml(c, hideHole && i > 0)).join('')}</div>
            </div>
            <div class="rpg-bj-side">
                <div class="rpg-bj-label">${t('you')} · <b>${pv}</b></div>
                <div class="rpg-bj-cards">${gameState.playerCards.map(c => cardHtml(c, false)).join('')}</div>
            </div>
        `);
        if (gameState.blackjackPhase === 'player' && !gameState.winner) {
            wrap.append(`
                <div class="rpg-bj-controls">
                    <button class="rpg-game-action-btn" id="rpg-bj-hit"><i class="fa-solid fa-plus"></i> ${t('hit')}</button>
                    <button class="rpg-game-action-btn alt" id="rpg-bj-stand"><i class="fa-solid fa-hand"></i> ${t('stand')}</button>
                </div>
            `);
        }
        canvas.append(wrap);
        $('#rpg-bj-hit').on('click', bjHit);
        $('#rpg-bj-stand').on('click', bjStand);
    }
    else if (gameState.gameType === 'rps') {
        const wrap = $('<div class="rpg-rps-wrap"></div>');
        wrap.append(`<div class="rpg-rps-score">${t('you')} <b>${gameState.rpsPlayerScore}</b> : <b>${gameState.rpsBotScore}</b> ${gameState.opponentName}</div>`);
        if (gameState.rpsLast) wrap.append(`<div class="rpg-rps-last">${gameState.rpsLast}</div>`);
        if (!gameState.winner) {
            wrap.append(`
                <div class="rpg-rps-choices">
                    <button class="rpg-rps-btn" data-c="rock" title="Rock">✊</button>
                    <button class="rpg-rps-btn" data-c="paper" title="Paper">✋</button>
                    <button class="rpg-rps-btn" data-c="scissors" title="Scissors">✌️</button>
                </div>
            `);
        }
        canvas.append(wrap);
        $('.rpg-rps-btn').on('click', function () { rpsPlay($(this).data('c')); });
    }
    else if (gameState.gameType === 'poker') {
        const p = gameState.poker;
        const reveal = p.revealed || p.phase === 'showdown' || p.phase === 'result';
        const wrap = $('<div class="rpg-poker-wrap"></div>');
        wrap.append(`
            <div class="rpg-poker-side">
                <div class="rpg-poker-label">${gameState.opponentName} · 🪙 ${p.botChips}${reveal ? ` · ${handName(p.botHand)}` : ''}</div>
                <div class="rpg-bj-cards">${p.botHand.map(c => cardHtml(c, !reveal)).join('')}</div>
            </div>
            <div class="rpg-poker-pot">Pot: 🪙 ${p.pot}</div>
        `);
        if (p.handResult) wrap.append(`<div class="rpg-poker-result">${p.handResult}</div>`);
        const phand = $(`<div class="rpg-poker-side"><div class="rpg-poker-label">${t('you')} · 🪙 ${p.playerChips}${reveal ? ` · ${handName(p.playerHand)}` : ''}</div></div>`);
        const pcards = $('<div class="rpg-bj-cards"></div>');
        p.playerHand.forEach((c, i) => {
            const el = $(cardHtml(c, false));
            if (p.phase === 'draw') { el.addClass('selectable'); if (p.selected.includes(i)) el.addClass('discard'); el.on('click', () => pokerToggleDiscard(i)); }
            pcards.append(el);
        });
        phand.append(pcards);
        wrap.append(phand);
        const ctrl = $('<div class="rpg-bj-controls"></div>');
        if (p.phase === 'draw') ctrl.append(`<button class="rpg-game-action-btn" id="rpg-poker-draw"><i class="fa-solid fa-right-left"></i> ${t('exchange')} (${p.selected.length})</button>`);
        else if (p.phase === 'p_bet') {
            ctrl.append(`<button class="rpg-game-action-btn alt" id="rpg-poker-check"><i class="fa-solid fa-hand"></i> ${t('check')}</button>`);
            ctrl.append(`<button class="rpg-game-action-btn" id="rpg-poker-bet"><i class="fa-solid fa-coins"></i> ${t('bet')} 10</button>`);
        } else if (p.phase === 'p_respond') {
            ctrl.append(`<button class="rpg-game-action-btn" id="rpg-poker-call"><i class="fa-solid fa-check"></i> ${t('call')} ${p.callAmount}</button>`);
            ctrl.append(`<button class="rpg-game-action-btn alt" id="rpg-poker-fold"><i class="fa-solid fa-xmark"></i> ${t('fold')}</button>`);
        } else if (p.phase === 'result' && !gameState.winner) {
            ctrl.append(`<button class="rpg-game-action-btn" id="rpg-poker-next"><i class="fa-solid fa-forward"></i> ${t('next_hand')}</button>`);
        }
        wrap.append(ctrl);
        canvas.append(wrap);
        $('#rpg-poker-draw').on('click', pokerConfirmDraw);
        $('#rpg-poker-check').on('click', () => pokerBet('check'));
        $('#rpg-poker-bet').on('click', () => pokerBet('bet'));
        $('#rpg-poker-call').on('click', () => pokerRespond('call'));
        $('#rpg-poker-fold').on('click', () => pokerRespond('fold'));
        $('#rpg-poker-next').on('click', pokerNextHand);
    }
    else if (gameState.gameType === 'pig') {
        const pig = gameState.pig;
        const dieFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const wrap = $('<div class="rpg-pig-wrap"></div>');
        wrap.append(`
            <div class="rpg-pig-scores">
                <span class="${pig.phase === 'player' ? 'turn' : ''}">${t('you')} · <b>${pig.playerScore}</b></span>
                <span class="rpg-pig-target">${t('pig_to', {target: pig.target})}</span>
                <span class="${pig.phase === 'bot' ? 'turn' : ''}">${gameState.opponentName} · <b>${pig.botScore}</b></span>
            </div>
            <div class="rpg-pig-die">${pig.lastRoll ? dieFaces[pig.lastRoll] : '🎲'}</div>
            <div class="rpg-pig-turn">${t('this_turn')}: <b>${pig.turnTotal}</b></div>
        `);
        if (pig.message) wrap.append(`<div class="rpg-pig-msg">${pig.message}</div>`);
        if (pig.phase === 'player' && !gameState.winner) {
            wrap.append(`
                <div class="rpg-bj-controls">
                    <button class="rpg-game-action-btn" id="rpg-pig-roll"><i class="fa-solid fa-dice"></i> ${t('roll')}</button>
                    <button class="rpg-game-action-btn alt" id="rpg-pig-bank"><i class="fa-solid fa-vault"></i> ${t('bank')} (${pig.turnTotal})</button>
                </div>
            `);
        }
        canvas.append(wrap);
        $('#rpg-pig-roll').on('click', pigRoll);
        $('#rpg-pig-bank').on('click', pigBank);
    }
    else if (gameState.gameType === 'whist') {
        const w = gameState.whist;
        const redSuit = (s) => (s === '♥' || s === '♦') ? 'red' : '';
        const wrap = $('<div class="rpg-whist-wrap"></div>');
        wrap.append(`<div class="rpg-whist-info">${t('trump')}: <b class="${redSuit(w.trump)}">${w.trump}</b> &nbsp;·&nbsp; ${t('tricks')} — ${t('you')} <b>${w.playerTricks}</b> : <b>${w.botTricks}</b> ${gameState.opponentName}</div>`);
        wrap.append(`<div class="rpg-whist-bothand">${w.botHand.map(() => '<div class="rpg-card back mini"><span>?</span></div>').join('')}</div>`);
        const tbl = $('<div class="rpg-whist-table"></div>');
        tbl.append(`<div class="rpg-whist-slot">${w.table.bot ? cardHtml(w.table.bot, false) : '<div class="rpg-card empty"></div>'}</div>`);
        tbl.append(`<div class="rpg-whist-slot">${w.table.user ? cardHtml(w.table.user, false) : '<div class="rpg-card empty"></div>'}</div>`);
        wrap.append(tbl);
        if (w.message) wrap.append(`<div class="rpg-whist-msg">${w.message}</div>`);
        const phand = $('<div class="rpg-whist-hand"></div>');
        const isFollower = w.table.bot !== null;
        const mustFollow = isFollower && w.playerHand.some(c => c.suit === w.ledSuit);
        w.playerHand.forEach((c, i) => {
            const el = $(cardHtml(c, false));
            const legal = !mustFollow || c.suit === w.ledSuit;
            if (w.turn === 'user' && !gameState.winner && legal) { el.addClass('selectable'); el.on('click', () => whistPlayerPlay(i)); }
            else if (w.turn === 'user' && !legal) { el.addClass('disabled'); }
            phand.append(el);
        });
        wrap.append(phand);
        canvas.append(wrap);
    }

    canvas.append(`
        <button class="rpg-summary-btn" id="rpg-game-summary-btn">${t('send_result')}</button>
        <button class="rpg-summary-btn" id="rpg-replay-btn" style="bottom: 56px; background: linear-gradient(180deg,#6b5077,#54395f); display: none;"><i class="fa-solid fa-rotate-left"></i> ${t('play_again')}</button>
    `);
    $('#rpg-game-summary-btn').on('click', injectGameSummaryToChat);
    $('#rpg-replay-btn').on('click', () => {
        gameState.winner = null;
        $('#rpg-game-summary-btn').hide();
        $('#rpg-replay-btn').hide();
        if (gameState.gameType === 'ttt') initTicTacToe();
        else if (gameState.gameType === 'bs') initBattleship();
        else if (gameState.gameType === 'chess') initChessGame();
        else if (gameState.gameType === 'bj') initBlackjack();
        else if (gameState.gameType === 'rps') initRps();
        else if (gameState.gameType === 'poker') initPoker();
        else if (gameState.gameType === 'pig') initPig();
        else if (gameState.gameType === 'whist') initWhist();
    });

    if (gameState.winner) { $('#rpg-game-summary-btn').show(); $('#rpg-replay-btn').show(); }
}

function renderGameModal() {
    let modal = $('#rpg-game-modal');
    if (modal.length === 0) {
        const char = characters.find(c => c.name === gameState.opponentName);
        const avatarUrl = char ? `/characters/${char.avatar}` : "";
        const name = gameState.opponentName;
        $('body').append(`
            <div id="rpg-game-modal">
                <div class="rpg-game-header" id="rpg-game-drag">
                    <span><i class="fa-solid fa-dice"></i> ${t('game_table')}</span>
                    <i class="fa-solid fa-xmark rpg-game-close"></i>
                </div>
                <div class="rpg-game-body">
                    <div class="rpg-game-area" id="rpg-game-canvas"></div>
                    <div class="rpg-game-sidebar">
                        <div class="rpg-game-opponent">
                            <img src="${avatarUrl}" class="rpg-game-opp-avatar" onerror="this.style.display='none'">
                            <div>
                                <div class="rpg-game-opp-name" id="rpg-game-opp-name">${name}</div>
                                <div class="rpg-game-opp-status">${t('at_table')}</div>
                            </div>
                        </div>
                        <div class="rpg-game-chat" id="rpg-game-chat-log"></div>
                        <div class="rpg-game-input-container">
                            <input type="text" class="rpg-game-input" id="rpg-game-input-field" placeholder="${t('say_something')}">
                            <button class="rpg-game-send" id="rpg-game-send-btn"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        modal = $('#rpg-game-modal');
        makeModalDraggable(document.getElementById('rpg-game-modal'), document.getElementById('rpg-game-drag'));
    }
    // Refresh opponent name + avatar every time (so switching characters in a group updates the table)
    modal = $('#rpg-game-modal');
    const oppChar = characters.find(c => c.name === gameState.opponentName);
    const oppAvatar = oppChar ? `/characters/${oppChar.avatar}` : "";
    $('#rpg-game-opp-name').text(gameState.opponentName);
    const $oppImg = modal.find('.rpg-game-opp-avatar');
    if (oppAvatar) { $oppImg.attr('src', oppAvatar).show(); } else { $oppImg.hide(); }
    $('.rpg-game-close').off('click').on('click', () => modal.removeClass('visible'));
    $('#rpg-game-send-btn').off('click').on('click', sendGameMessage);
    $('#rpg-game-input-field').off('keypress').on('keypress', (e) => { if (e.which === 13) sendGameMessage(); });
    renderGameArea();
}

function makeModalDraggable(elmnt, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.addEventListener('mousedown', dragMouseDown);
    function dragMouseDown(e) {
        if (e.target.closest('.rpg-game-close')) return;
        e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = closeDragElement; document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px"; elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
    function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
}

function addGameChatMessage(sender, text) {
    gameState.chatLog.push({ sender, text });
    const log = $('#rpg-game-chat-log');
    if (log.length > 0) {
        const msgClass = sender === 'system' ? 'system' : (sender === 'user' ? 'user' : (sender === 'typing' ? 'bot rpg-typing' : 'bot'));
        log.append(`<div class="rpg-gmsg ${msgClass}">${escapeHtml(text)}</div>`);
        log.scrollTop(log[0].scrollHeight);
    }
}
function removeTypingIndicator() {
    $('.rpg-gmsg.rpg-typing').remove();
    gameState.chatLog = gameState.chatLog.filter(m => m.sender !== 'typing');
}

async function sendGameMessage() {
    const input = $('#rpg-game-input-field');
    const text = input.val().trim();
    if (!text) return;
    input.val('');
    addGameChatMessage('user', text);
    await generateAiCommentary(`${userName()} said in game chat: "${text}"`, true);
}

function injectGameSummaryToChat() {
    const charName = gameState.opponentName;
    const gameName = t('gn_' + gameState.gameType);
    let resultWord = t('res_draw');
    if (gameState.winner === 'user') resultWord = t('res_user');
    if (gameState.winner === 'bot') resultWord = t('res_bot', {name: charName});
    const dialogue = gameState.chatLog
        .filter(m => m.sender === 'user' || m.sender === 'bot')
        .map(m => m.sender === 'user' ? `${userName()}: ${m.text}` : `${charName}: ${m.text}`)
        .join('\n');
    let summaryText = t('summary_line', {user: userName(), char: charName, game: gameName, result: resultWord});
    if (dialogue) summaryText += `\n\n${dialogue}`;
    $('#send_textarea').val(summaryText).trigger('input');
    $('#rpg-game-modal').removeClass('visible');
    gameState.active = false;
    gameState.chatLog = [];
    toastr.success(t('result_added'));
}

/* ============================================================
   SETTINGS / BUTTON / INIT
   ============================================================ */
function renderSettingsUI() {
    const html = `
<div class="extension_settings rpg-game-settings">
    <div class="inline-drawer">
        <div class="rpg-game-toggle inline-drawer-header" style="cursor: pointer;">
            <b><i class="fa-solid fa-gamepad"></i> ${t('set_title')}</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content" style="display: none; padding-top: 10px;">
            <label class="checkbox_label"><input type="checkbox" id="rpg-game-enabled"> ${t('set_enable')}</label>
            <div class="flex-container alignitemscenter flexgap5 margin-b-10" style="margin-top:8px;">
                <label>${t('set_lang')}</label>
                <select id="rpg-game-lang" class="text_pole" style="width:auto;">
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                </select>
            </div>
            <hr class="sysHR">
            <h4>🔌 ${t('set_api')}</h4>
            <input type="text" id="rpg-game-base" class="text_pole margin-b-10" placeholder="${t('set_url')}" style="width:100%;">
            <input type="password" id="rpg-game-key" class="text_pole margin-b-10" placeholder="${t('set_key')}" style="width:100%;">
            <input type="text" id="rpg-game-model" class="text_pole margin-b-10" placeholder="${t('set_model')}" style="width:100%;">
            <div class="flex-container alignitemscenter flexgap5 margin-b-10">
                <label>${t('set_ctx')}</label>
                <input type="number" id="rpg-game-ctx" class="text_pole" min="2" style="width:55px;">
            </div>
            <small style="opacity:0.7;">${t('set_hint')}</small>
        </div>
    </div>
</div>`;
    $('#extensions_settings').append(html);
    $('.rpg-game-settings .rpg-game-toggle').on('click', function () {
        $(this).next('.inline-drawer-content').slideToggle();
        $(this).find('.inline-drawer-icon').toggleClass('down up');
    });
    $('#rpg-game-enabled').prop('checked', settings.enabled).on('change', function () { settings.enabled = this.checked; saveSettings(); initUI(); });
    $('#rpg-game-lang').val(settings.language || 'en').on('change', function () {
        settings.language = $(this).val(); saveSettings();
        $('.rpg-game-settings').remove();
        renderSettingsUI();
        $('.rpg-game-settings .inline-drawer-content').show();
        $('.rpg-game-settings .inline-drawer-icon').removeClass('down').addClass('up');
        $('#rpg-game-modal').remove();
    });
    $('#rpg-game-base').val(settings.baseUrl).on('change', function () { settings.baseUrl = $(this).val(); saveSettings(); });
    $('#rpg-game-key').val(settings.apiKey).on('change', function () { settings.apiKey = $(this).val(); saveSettings(); });
    $('#rpg-game-model').val(settings.model).on('change', function () { settings.model = $(this).val(); saveSettings(); });
    $('#rpg-game-ctx').val(settings.contextMessages).on('change', function () { settings.contextMessages = parseInt($(this).val()) || 10; saveSettings(); });
}

function initUI() {
    let container = $('#rpg-buttons-container');
    if (container.length === 0) {
        container = $('<div id="rpg-buttons-container" style="position:fixed; bottom:20px; right:20px; display:flex; gap:15px; z-index:3000;"></div>');
        $('body').append(container);
    }
    let btn = $('#rpg-game-btn');
    if (btn.length === 0) {
        btn = $(`<div class="rpg-floating-btn" id="rpg-game-btn" title="Games with the bot" style="position:static; width:50px; height:50px; margin:0; display:flex;"><i class="fa-solid fa-gamepad"></i></div>`);
        container.prepend(btn);
    }
    $('#rpg-game-btn-standalone').remove();
    if (!settings.enabled || !isChatOpen()) { btn.hide(); return; }
    btn.show();
    btn.off('click').on('click', () => {
        const opponent = getCurrentOpponent();
        if (gameState.opponentName && gameState.opponentName !== opponent.name) {
            gameState.active = false;
            gameState.chatLog = [];
        }
        gameState.opponentName = opponent.name;
        renderGameModal();
        $('#rpg-game-modal').toggleClass('visible');
    });
}

function isChatOpen() {
    const c = getContext();
    if (!c) return false;
    if (c.groupId) return true;
    if (c.characterId !== undefined && c.characterId !== null) return true;
    return false;
}

function getCurrentOpponent() {
    const context = getContext();
    if (context.chat && context.chat.length > 0) {
        for (let i = context.chat.length - 1; i >= 0; i--) {
            const msg = context.chat[i];
            if (!msg.is_user && !msg.is_system && msg.name) {
                const char = characters.find(c => c.name === msg.name);
                if (char) return char;
            }
        }
    }
    return characters[context.characterId] || { name: "Character", avatar: "" };
}

jQuery(() => {
    loadSettings();
    renderSettingsUI();
    initUI();
    eventSource.on(event_types.CHAT_CHANGED, () => {
        initUI();
        gameState.active = false;
        $('#rpg-game-modal').remove();
    });
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, () => { initUI(); });
});
