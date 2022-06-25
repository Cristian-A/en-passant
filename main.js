
import {
	createBot, startBot, editBotStatus, sendMessage, GatewayIntents
} from 'https://deno.land/x/discordeno@13.0.0-rc45/mod.ts';
import { enableCachePlugin, enableCacheSweepers }
from 'https://deno.land/x/discordeno_cache_plugin@0.0.21/mod.ts';

import { TwitchChat } from 'https://deno.land/x/tmi@v1.0.5/mod.ts';
import { serve } from "https://deno.land/std@0.145.0/http/server.ts";

import {
	parse, text, fetchLog, log, executeTasks, dispatch, resolve, reloadActions
} from './parser.js';
import { Channels, Welcome, Actions, Streamer, Time } from './config.js';

export const PID = Math.floor(Math.random() * 10000);
log('status', 'PID ' + PID);

// ==== Actions ============================

import './actions/info.js';
import './actions/queue.js';

// ==== Commands ===========================

import './commands/actions.js';
import './commands/ping.js';
import './commands/poll.js';
import './commands/links.js';
import './commands/clear.js';
import './commands/fen.js';
import './commands/rating.js';
import './commands/task.js';
import './commands/shutdown.js';
import './commands/record.js';
import './commands/vote.js';

// ==== Attachments ========================

import './attachments/pgn.js';

// ==== Tasks ==============================

import './tasks/quote.js';
import './tasks/schedule.js';
import './tasks/youtube.js';
import './tasks/twitch.js';
import './tasks/move.js';
import './tasks/reddit.js';

// =========================================

export function setRandomAction() {
	const action = Actions[
		Math.floor(Math.random() * Actions.length)
	];
	editBotStatus(bot, {
		activities: [{
			name: action.status,
			type: action.type,
			createdAt: Date.now()
		}],
		since: Date.now(),
		afk: false,
		status: 'online'
	});
}

const baseBot = await createBot({
	botId: Deno.env.get('ID'),
	token: Deno.env.get('TOKEN'),
	intents: (
		GatewayIntents.Guilds            |
		GatewayIntents.GuildMembers      |
		GatewayIntents.GuildMessages     |
		GatewayIntents.GuildIntegrations |
		GatewayIntents.MessageContent
	),
	events: {
		// _ is bot, but it is not necessary
		messageCreate(_, message) { parse(message); },
		guildMemberAdd(bot, member, _) {
			const message = Welcome[Math.floor(Math.random() * Welcome.length)];
			sendMessage(bot, Channels.general, text(`**Welcome** <@${member.id}>, ${message}`));
		},
		interactionCreate(_, interaction) { dispatch(interaction); }
	}
});

export const bot = enableCachePlugin(baseBot);
enableCacheSweepers(bot);
log('status', 'en-passant ready');
setRandomAction();

// =========================================

// web server for constant uptime:
serve(request => {
	return new Response(fetchLog(), {
		headers: { 'content-type': 'text/plain' },
		status: 200
	});
});
log('status', 'web server ready');

// tasks interval:
setInterval(executeTasks, Time.minutes(5));

// =========================================

// twitch bot:
export const chat = new TwitchChat(
	Deno.env.get('TWITCH_OAUTH_BOT'), 'en_passant_bot'
);
// current scopes generated by https://twitchapps.com/tokengen/:
// https://dev.twitch.tv/docs/authentication/scopes#twitch-access-token-scopes
// channel:read:subscriptions
// moderation:read moderator:read:chat_settings
// channel:moderate
// chat:edit chat:read
// whispers:read whispers:edit
try {
	await chat.connect();
	const channel = chat.joinChannel(Streamer);
	channel.addEventListener('privmsg', data => resolve(data, channel));
} catch (e) { console.error(e); }
reloadActions(); // loads the twitch actions from database
log('status', 'twitch chat ready');

// =========================================

await startBot(bot);
