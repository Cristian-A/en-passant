
import { Option, command, error } from '../parser.js';
import { Chess } from 'https://deno.land/x/beta_chess@v1.0.1/chess.js';
import { diagram } from '../components/diagram/diagram.js';

command({
	name: 'fen', emoji: ':page_with_curl:',
	description: '📋 Displays a chess board diagram from FEN.',
	options: [{
		description: 'Forsyth–Edwards Notation', name: 'fen',
		type: Option.String, required: true,
	}, {
		description: 'Perspective of the board',
		name: 'perspective', type: Option.String, required: false,
		choices: [
			{ name: `⬜️ White`, value: 'white' },
			{ name: `⬛️ Black`, value: 'black' }
		]
	}],
	execute: async interaction => {
		const title = 'Chess Diagram';
		const fen = interaction.data.options[0].value.trim();
		const game = new Chess(fen);
		if (game == null || game.fen() != fen)
			return error(title, 'Invalid FEN string / position!');
		let status = '';
		if (game.ended()) {
			if (game.draw()) status = '½-½ ・ Draw';
			else if (game.checkmate())
				status = game.turn == 'w' ? '0-1 ・ ⬛️ Black Won' : '1-0 ・ ⬜️ White Won';
		} else status = game.turn == 'w' ? '⬜️ White to Move' : '⬛️ Black to Move';
		const data = await diagram(game.board, game.turn);
		let perspective = game.turn;
		if (interaction.data.options.length > 1)
			perspective = interaction.data.options[1].value[0];
		return {
			file: [{
				blob: new Blob([ await diagram(game.board, perspective) ]),
				name: 'board.png',
			}],
			embeds: [{
				type: 'image', title, color: game.turn == 'w' ? 0xFFFFFF : 0x000000,
				image: { url: 'attachment://board.png', height: 800, width: 800 },
				description: fen, footer: { text: status },
			}]
		};
	}
});

