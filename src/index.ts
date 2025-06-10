if (process.env.NODE_ENV !== "production") console.clear();

import { blue, red, yellow } from "colorette";
import { Client, Collection, Partials } from "discord.js";
import * as DotEnv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Bucket from "./utils/Bucket.js";
import Cooldown from "./utils/Cooldown.js";
import { values } from '../values.js';
DotEnv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global maps
globalThis.Cooldowns = Cooldown;
globalThis.Buckets = Bucket;
globalThis.V = values;

process.on("unhandledRejection", (reason) => {
	console.error("Unhandled Rejection at:", (reason as Error).stack || reason);
});
process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
});

const shutdown = async () => {
	console.log(yellow("Shutting down..."));
	await mongoose.connection.close();
	await Bot.destroy();
	process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

(async () => {
	try {
		await mongoose.connect(process.env.DB_URL!);

		globalThis.Bot = new Client({
			enforceNonce: false,
			failIfNotExists: false,
			intents: [
				"GuildMembers",
				"Guilds",
				"GuildMessages",
				"MessageContent",
			],
			partials: [
				Partials.Channel,
				Partials.Message,
				Partials.GuildMember,
				Partials.User,
			],
		}) as Bot;

		const eventsPath = path.join(__dirname, "./events/");
		const eventFiles = await fs.promises.readdir(eventsPath, {
			withFileTypes: true,
		});

		for await (const event of eventFiles) {
			if (!event.isFile()) continue;

			const eventModule = (await import(
				"file://" + path.join(eventsPath, event.name)
			)).event as BotEvent;

			if (!eventModule) {
				console.warn(yellow(`Event '${event.name}' has no event export.`));
				continue;
			}

			const handler = async (...args: any[]) => {
				try {
					await eventModule.run(...args as any);
				} catch (err) {
					console.error(err);
				}
			};

			if (eventModule.once) {
				Bot.once(eventModule.name as string, (...args) => handler(...args));
			} else {
				Bot.on(eventModule.name as string, (...args) => handler(...args));
			}
		}

		await Bot.login(process.env.TOKEN!);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
})();
