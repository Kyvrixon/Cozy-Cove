import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	DMChannel,
	EmbedBuilder,
	MessageFlags,
	ModalBuilder,
	TextChannel,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import genId from "./genId.js";

const createLeaderboard = async (
	title: string,
	list: Array<string>,
	interaction: ButtonInteraction | ChatInputCommandInteraction,
	pageCount: number = 5,
	ephemeral?: boolean,
	metadata?: Array<any>,
	extras?: Array<ActionRowBuilder<any>>,
) => {
	try {
		const uID = genId(6);

		// Helper function to handle "No Data" scenario
		const sendNoDataMessage = async () => {
			const embed = new EmbedBuilder()
				.setTitle(title)
				.setDescription("No data to be shown.")
				.setColor("DarkButNotBlack");

			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					embeds: [embed],
					flags: ephemeral ? MessageFlags.Ephemeral : undefined,
				});
			} else {
				await interaction.editReply({
					embeds: [embed],
				});
			}
		};

		// If no data, return early
		if (list.length === 0) {
			return sendNoDataMessage();
		}

		const totalPages = Math.ceil(list.length / pageCount);
		let currentIndex = 0;

		// Generate embed for the leaderboard
		const generateEmbed = (start: number) => {
			let data: any = {};
			if (metadata && metadata.length > 0) {
				data = metadata[start] || {};
			}

			const embed = new EmbedBuilder()
				.setTitle(title)
				.setDescription(list.slice(start, start + pageCount).join("\n"))
				.setColor("DarkButNotBlack");

			if (data?.thumbnail && /^https?:\/\//.test(data.thumbnail)) {
				embed.setThumbnail(data.thumbnail);
			}

			if (data?.title) embed.setTitle(data.title);
			if (data?.color) embed.setColor(data.color);
			if (data?.desc) {
				const currentDesc = embed.data.description ?? "";
				const spaceForNewText = 4096 - (currentDesc.length + 1);
				let newDesc = data.desc;

				if (newDesc.length > spaceForNewText) {
					newDesc = newDesc.slice(0, spaceForNewText - 4) + " ...";
				}

				embed.setDescription(currentDesc + "\n" + newDesc);
			}

			if (data?.author && data.author.name) embed.setAuthor(data.author);
			if (typeof data.timestamp === "number")
				embed.setTimestamp(data.timestamp);
			if (data?.fields && data.fields.length > 0) embed.addFields(data.fields);
			if (data?.footer && data.footer?.text) embed.setFooter(data.footer);

			return embed;
		};

		// Generate the pagination row with buttons
		const getPaginationRow = (
			currentIndex: number,
		): Array<ActionRowBuilder<ButtonBuilder>> => {
			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`_${uID}_back_button`)
					.setLabel("Prev")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(currentIndex === 0),
				new ButtonBuilder()
					.setCustomId(`_${uID}_page_info`)
					.setLabel(`${Math.floor(currentIndex / pageCount) + 1}/${totalPages}`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(totalPages === 1),
				new ButtonBuilder()
					.setCustomId(`_${uID}_forward_button`)
					.setLabel("Next")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(currentIndex + pageCount >= list.length),
			);

			const extraRow = extras?.[currentIndex];
			return extraRow ? [row, extraRow] : [row];
		};

		// Defer reply if not already done
		if (!interaction.replied && !interaction.deferred) {
			await interaction
				.deferReply({
					withResponse: true,
					flags: ephemeral ? MessageFlags.Ephemeral : undefined,
				})
				.catch(() => null);
		}

		const embed = generateEmbed(currentIndex);
		const components = getPaginationRow(currentIndex);
		await interaction.editReply({
			content: null,
			embeds: [embed],
			components,
		});

		// Message component collector
		const collector = (
			interaction.channel as TextChannel | DMChannel
		).createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60000,
		});

		collector.on("collect", async (btn: ButtonInteraction) => {
			// Validate button interaction
			if (
				![
					`_${uID}_back_button`,
					`_${uID}_page_info`,
					`_${uID}_forward_button`,
				].includes(btn.customId)
			) {
				return;
			}

			if (btn.user.id !== interaction.user.id) {
				collector.resetTimer();
				return btn.reply({
					content: "This ain't yours bucko, hands off!",
					flags: MessageFlags.Ephemeral,
				});
			}

			if (btn.customId === `_${uID}_page_info`) {
				collector.resetTimer();
				const modal = new ModalBuilder()
					.setCustomId(`_${uID}_page_modal`)
					.setTitle("Page Indexer")
					.addComponents(
						new ActionRowBuilder<TextInputBuilder>().addComponents(
							new TextInputBuilder()
								.setCustomId(uID + "_page_number")
								.setLabel("Enter page number")
								.setStyle(TextInputStyle.Short)
								.setRequired(true),
						),
					);

				await btn.showModal(modal);
				const modalSubmit = await btn
					.awaitModalSubmit({ time: 15000 })
					.catch(() => null);

				if (!modalSubmit) {
					collector.resetTimer();
					return btn.followUp({
						content: "Modal timed out. Please try again.",
						flags: MessageFlags.Ephemeral,
					});
				}

				await modalSubmit.deferUpdate();

				const pageNumber = parseInt(
					modalSubmit.fields.getTextInputValue(uID + "_page_number"),
					10,
				);

				if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
					collector.resetTimer();
					await modalSubmit.reply({
						content: `Invalid page number! Please choose a number between 1 and ${totalPages}.`,
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				currentIndex = (pageNumber - 1) * pageCount;
			} else {
				// Update currentIndex based on button clicked
				if (btn.customId === `_${uID}_back_button`) {
					currentIndex = Math.max(0, currentIndex - pageCount);
				} else if (btn.customId === `_${uID}_forward_button`) {
					currentIndex = Math.min(list.length - 1, currentIndex + pageCount);
				}

				await btn.deferUpdate().catch(() => null);
			}

			// Update embed and components
			const embed = generateEmbed(currentIndex);
			const components = getPaginationRow(currentIndex);
			await interaction.editReply({
				content: null,
				embeds: [embed],
				components,
			});
		});

		collector.on("end", async () => {
			try {
				await interaction.editReply({
					components: [
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							new ButtonBuilder()
								.setCustomId(`_${uID}_expired`)
								.setLabel("Expired")
								.setStyle(ButtonStyle.Secondary)
								.setDisabled(true),
						),
					],
				});
			} catch {}
		});
	} catch (e) {
		throw e;
	}
};

export default createLeaderboard;
