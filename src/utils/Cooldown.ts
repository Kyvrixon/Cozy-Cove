import { schedule } from "node-cron";

const cds = new Map<string, Map<string, number>>();

type CooldownType = {
	set: (uid: string, cmd: string, ttl: number) => void;
	has: (uid: string, cmd: string) => false | number;
	del: (uid: string, cmd: string) => void;
	list: () => Record<string, Record<string, number>>;
	clean: () => void;
};

const Cooldown: CooldownType = {
	set(uid, cmd, ttl) {
		if (ttl <= 0) return;

		const expiry = Date.now() + ttl;
		if (!cds.has(uid)) {
			cds.set(uid, new Map());
		}
		cds.get(uid)!.set(cmd, expiry);
	},

	has(uid, cmd) {
		const expiry = cds.get(uid)?.get(cmd);
		if (!expiry) return false;

		const remaining = expiry - Date.now();
		if (remaining > 0) return remaining;

		this.del(uid, cmd); // auto-clean stale entry
		return false;
	},

	del(uid, cmd) {
		const userCmds = cds.get(uid);
		if (!userCmds) return;

		userCmds.delete(cmd);
		if (userCmds.size === 0) cds.delete(uid);
		return;
	},

	list() {
		const result: Record<string, Record<string, number>> = {};
		for (const [uid, cmds] of cds) {
			result[uid] = Object.fromEntries(cmds);
		}
		return result;
	},

	clean(): void {
		const now = Date.now();
		for (const [uid, cmds] of cds) {
			for (const [cmd, expiry] of cmds) {
				if (expiry < now) {
					cmds.delete(cmd);
				}
			}
			if (cmds.size === 0) cds.delete(uid);
		}
	},
};

// Kick off cleanup schedule immediately
schedule("* * * * *", () => Cooldown.clean());

export default Cooldown;
