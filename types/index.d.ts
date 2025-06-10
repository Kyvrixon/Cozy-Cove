/* eslint-disable no-var */
import {
	Client,
	ClientEvents,
	Collection,
	Message
} from "discord.js";
import Cooldown from "../src/utils/Cooldown.js";
import Bucket from "../src/utils/Bucket.js";
import Configs from '../src/models/config.js';
import { values } from '../values.js';

declare global {
	var Buckets: typeof Bucket;
	/** The bot */
	var Bot: Bot;
	/** Cooldowns */
	var Cooldowns: typeof Cooldown;
	/** Configs */
	var Config: typeof Configs;
	/** Values */
	var V: typeof values;

	type BotCommand = {
		name: string;
		enabled: boolean;
		category: string;
		description: string;
		usage: string;
		run: (message: Message, args: Array<string>) => Promise<void>;
	};

	type BotEvent<E extends keyof ClientEvents = keyof ClientEvents> = {
		name: E;
		once: boolean;
		run: (...args: ClientEvents[E]) => void | Promise<void>;
	};

	interface Bot extends Client {
		commands: Collection<string, BotCommand>;
	};

	type Router = (message: Message) => Promise<void>;
}
