

import { Channels } from '../config.js';
import { Database } from '../database.js';
import { createTask, send, text } from '../parser.js';

const ENDPOINT = 'https://www.reddit.com/r/thechessnerd/hot.json?limit=1';

createTask({
	name: 'reddit', emoji: ':large_orange_diamond:', time: '9:55',
	description: 'Sends out the hot reddit post.',
	execute: async () => {
		const id = Database.get('reddit_id');
		const data = await fetch(ENDPOINT);
		if (data == null || data == undefined) return;
		if (id != data.data.children[0].data.id) {
			Database.set('reddit_id', data.data.children[0].data.id);
			send(Channels.reddit, text(
				'Hey @everyone, check out our new **HOT** __reddit__ post!' +
				'https://www.reddit.com' + data.data.children[0].data.permalink
			));
		}
	}
});
