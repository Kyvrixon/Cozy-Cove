import { router } from "../commands/router.js";

export const event: BotEvent<"messageCreate"> = {
    name: "messageCreate",
    once: false,
    run: async (message) => {
        if (
            !message.guild ||
            !message.content ||
            message.author.bot ||
            message.webhookId ||
            !message.content.startsWith(".") ||
            ![0, 19].includes(message.type)
        ) return;

        router(message);
        return;
    },
};