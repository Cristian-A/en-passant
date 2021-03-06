
import { Database } from '../database.js';

export async function hasVoted(id) {
	return (await Database.get(`votes/${id}`)) != null;
}

export function vote(id, move) {
	Database.set(`votes/${id}`, move);
}

export function clearVotes() {
	Database.set('votes', {});
}

export async function count() {
	const votes = await Database.get(`votes`);
	if (votes == null) return undefined;
	const counts = {};
	for (const id in votes) {
		const move = votes[id];
		if (move in counts) counts[move]++;
		else counts[move] = 1;
	}
	return counts;
}

export function endGame() {
	Database.delete('game');
	Database.delete('status');
	Database.delete('moves');
	Database.set('votes', {});
}

export function setGame(gameid, statusid, moves) {
	Database.set('game', gameid.toString());
	Database.set('status', statusid.toString());
	Database.set('moves', moves.toString());
}

export async function getGame() {
	return [
		await Database.get('game'),
		await Database.get('status'),
		await Database.get('moves')
	];
}

/// checks if there is a game in progress.
export async function playing() {
	const id = await Database.get('game');
	if (id == null) return false;
	const g = game(id);
	if (g == undefined || g.isFinished) {
		await Database.delete('game');
		await Database.delete('status');
		return false;
	} else return true;
}

/// gets daily game from chess.com given its
/// id returns undefined in case of error.
export async function game(id) {
	const API_BASE_URL = 'https://www.chess.com/callback/daily/game/';
	let g = undefined;
	try {
		g = await fetch(API_BASE_URL + id).then(
			r => r.status == 200 ? r.json() : undefined
		);
	} catch { return undefined; }
	if (g != undefined) return g.game;
}

// https://github.com/andyruwruw/chess-web-api/issues/10#issuecomment-779735204
const SQUARES = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?';
const FILES = 'abcdefgh';

// https://github.com/andyruwruw/chess-web-api/issues/11#issuecomment-783687021
const PROMOTIONS = '#@$_[]^()~{}';
const PIECES = 'brnq';

/// decodes a move into algebraic notation or pawn promotion.
/// - move: string of two characters.
function decode(move) {
	let index = SQUARES.indexOf(move[0]);
	const f1 = FILES[index % 8], r1 = Math.floor(index / 8) + 1;
	index = SQUARES.indexOf(move[1]);
	let p, f2, r2;
	if (index == -1) {
		index = PROMOTIONS.indexOf(move[1]);
		p = PIECES[Math.floor(index / 3)];
		f2 = FILES.indexOf(f1);
		const l = index % 3 == 1, r = index % 3 == 2;
		if (l) f2--; else if (r) f2++; // capture left or right
		f2 = FILES[f2];
		if (r1 == 2) r2 = 1; else r2 = 8;
	} else { f2 = FILES[index % 8]; r2 = Math.floor(index / 8) + 1; }
	return { from: `${f1}${r1}`, to: `${f2}${r2}`, promotion: p };
}

/// decodes a list of moves from a string.
export function moves(m) {
	let list = [];
	for (let i = 0; i < m.length; i += 2) {
		const move = decode(m.substring(i, i + 2));
		list.push(move);
	}
	return list;
}
