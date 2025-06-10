export const event: BotEvent<"interactionCreate"> = {
    name: "interactionCreate",
    once: true,
    run: async (i) => {
        console.log("Bot is ready!");
    }
}