export const commandModule: BotCommand = {
    name: "hello",
    enabled: false,
    category: "General",
    description: "Says hello",
    usage: "hello",
    run: async (message, args) => {
        message.reply("hello!");
    },
}