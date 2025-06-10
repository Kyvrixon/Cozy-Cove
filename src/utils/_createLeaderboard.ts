import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	ContainerBuilder,
	DMChannel,
	EmbedBuilder,
	FileBuilder,
	MediaGalleryBuilder,
	MessageFlags,
	ModalBuilder,
	SectionBuilder,
	SeparatorBuilder,
	TextChannel,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";
import genId from "./genId.js";

const createLeaderboard = async (
	title: string,
	list: Array<string>,
	interaction: ButtonInteraction | ChatInputCommandInteraction,
	pageCount: number = 5,
	metadata: Array<
		Array<
			| "buttons"
			| TextDisplayBuilder
			| SeparatorBuilder
			| SectionBuilder
			| FileBuilder
			| MediaGalleryBuilder
			| ActionRowBuilder<any>
		>
	>,
	replacements?: Record<string, string>,
	styling?: Array<{
		accent_color?: number;
		spoiler?: boolean;
	}>,
	ephemeral?: boolean
) => {

	let hasEnded = false;
	try {
		const uID = genId(6);
		const sendNoDataMessage = async (msg: string) => {
			const embed = new EmbedBuilder()
				.setTitle(title)
				.setDescription(msg)
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
			return sendNoDataMessage("No data to be shown.");
		}

		const totalPages = Math.ceil(list.length / pageCount);

		if (totalPages > metadata.length) {
			return sendNoDataMessage("Invalid data stucture. You are missing " + (totalPages - metadata.length) + " pages.");
		};
		let currentIndex = 0;

		// Generate embed for the leaderboard
		const generateContainer = (start: number): ContainerBuilder => {
			return new ContainerBuilder({
				components: metadata[start].map((item, i) => {
					if (typeof item === "string") {
						const row = getPaginationRow(currentIndex);
						return JSON.parse(JSON.stringify(row));
					}

					const raw = item.toJSON?.();
					if (!raw) throw new Error(`Invalid component at index ${i}: toJSON() undefined`);

					let replaced = JSON.stringify(raw).replace("{{content}}", list.slice(start, start + pageCount).join("\n"))

					if (replacements) {
						Object.entries(replacements).forEach(([key, value]) => {
							replaced = replaced.replaceAll(key, value);
						});
					}

					return JSON.parse(replaced);
				}).flat(),
				accent_color: styling?.[start]?.accent_color,
				spoiler: styling?.[start]?.spoiler
			});
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
					.setDisabled(hasEnded || currentIndex === 0),
				new ButtonBuilder()
					.setCustomId(`_${uID}_page_info`)
					.setLabel(`${Math.floor(currentIndex / pageCount) + 1}/${totalPages}`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(hasEnded || totalPages === 1),
				new ButtonBuilder()
					.setCustomId(`_${uID}_forward_button`)
					.setLabel("Next")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(hasEnded || currentIndex + pageCount >= list.length),
			);
			return [row];
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

		const embed = generateContainer(currentIndex);
		await interaction.editReply({
			components: [
				embed
			],
			flags: "IsComponentsV2"
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
			const embed = generateContainer(currentIndex);
			await interaction.editReply({
				components: [embed],
				flags: "IsComponentsV2"
			});
		});

		collector.on("end", async () => {
			try {
				await interaction.editReply({
					components: [
						generateContainer(currentIndex)
					],
					flags: "IsComponentsV2"
				});
			} catch { }
		});
	} catch (e) {
		throw e;
	}
};

export default createLeaderboard;
