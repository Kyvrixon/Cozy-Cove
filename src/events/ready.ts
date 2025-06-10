export const event: BotEvent = {
    name: "ready",
    once: true,
    run: async () => {
        console.log("Bot is ready!");
    }
}