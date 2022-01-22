
import { getMessages, deleteMessages } from 'https://deno.land/x/discordeno@13.0.0-rc18/mod.ts';

import { Roles } from '../config.js';
import { createCommand, error, card } from '../parser.js';

const invalid = error(
	'Clean Command',
	'Please specify a valid number of messages to delete (`2 ... 100`).',
);

const internal = error(
	'Clean Command',
	'Internal error. Please try again later.',
);

createCommand({
	name: 'clear', emoji: '🗑', hidden: true,
	aliases: [ 'clean', 'delete', 'erase' ],
	description: 'Clear messages in a text channel.',
	permissions: Roles.moderator,
	execute: async message => {
		const content = message.content.split(/[ \t]+/g)[1];
		if (content == undefined) return invalid;
		const n = parseInt(content);
		if (isNaN(n) || n < 2 || n > 100) return invalid;
		try {
			const messages = await getMessages(message.bot, message.channelId, { limit: n });
			await deleteMessages(message.bot, message.channelId, messages.map(m => m.id));
		} catch(e) { return internal; }
		return card('Clear Command', `🗑 Successfully cleared \`${n}\` messages.`);
	}
});
