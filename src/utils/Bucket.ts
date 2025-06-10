import { RateLimitData } from "discord.js";

const delay = async (t: number): Promise<void> => {
	await new Promise((resolve) => setTimeout(resolve, t));
};

const taskQueues = new Map<string, Promise<void>>();
const rateLimitDelays = new Map<string, number>();

/**
 * Runs a task while respecting Discord's rate limits.
 * Each ID will be throttled to prevent hitting the rate limit dynamically.
 *
 * Throws an error if the task fails.
 * @param id A unique identifier for the bucket (e.g. "message-edit").
 * @param fn The task to execute (must be a promise).
 * @example
 * ```ts
 * // Remember to wrap in a try/catch or add .catch()
 * const channel = await Bucket("fetch-channel", client.channels.fetch("mychannelid"));
 * ```
 */
async function Bucket<T = any>(
	id: string,
	fn: (() => Promise<T>) | Promise<T>,
): Promise<T> {
	id = id.toLowerCase().replaceAll(" ", "");

	const rateLimitHandler = (info: RateLimitData) => {
		rateLimitDelays.set(id, info.retryAfter);
	};

	const runTask = async (): Promise<T> => {
		Bot.rest.once("rateLimited", rateLimitHandler);

		try {
			while (true) {
				const retryAfter = rateLimitDelays.get(id);
				if (!retryAfter) break;

				await delay(retryAfter > 50 ? retryAfter : 50);
				rateLimitDelays.delete(id);
			}

			const execFn = typeof fn === "function" ? fn : () => fn;
			return await execFn();
		} finally {
			Bot.rest.removeListener("rateLimited", rateLimitHandler);
		}
	};

	const previous = taskQueues.get(id) ?? Promise.resolve();
	let resolve!: () => void;
	const next = new Promise<void>((res) => (resolve = res));

	taskQueues.set(
		id,
		previous.then(() => next),
	);

	try {
		await previous;
		return (await runTask()) as T;
	} finally {
		resolve();
		if (taskQueues.get(id) === next) {
			taskQueues.delete(id);
		}
	}
}

export default Bucket;
