import {
	ActionRowBuilder,
	BaseMessageOptions,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	TextChannel,
} from "discord.js";

type T = (err: Error, reason?: string) => Promise<void>;
let c: TextChannel;
export const handleError: T = async (err, reason) => {
	console.log(err);
	try {
		let errChannel: TextChannel;
		if (!c) {
			c = (await Bot.channels.fetch("1364038188321996860")!) as TextChannel;
			errChannel = c;
		} else {
			errChannel = c;
		}

		if (errChannel) {
			const payload: BaseMessageOptions = {
				content: "<@981755777754755122>",
				embeds: [
					new EmbedBuilder()
						.setAuthor({ name: "An error occured" })
						.setTitle((reason ?? err.message) || null)
						.setDescription(`\`\`\`\n${err.stack}\n\`\`\``),
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId("errorhandler_read")
							.setStyle(ButtonStyle.Secondary)
							.setLabel("Mark as done"),
					),
				],
			};
			await (errChannel as TextChannel).send(payload);
		}
	} catch (e) {
		console.log(e);
	}
};

export default handleError;
