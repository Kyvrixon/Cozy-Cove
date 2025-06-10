import { ContainerBuilder, TextDisplayBuilder } from "discord.js"

export const errorContainer = (text: string) => {
    return new ContainerBuilder()
        .setAccentColor(V.colors.error)
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    V.emojis.error + " " + text
                )
        )
}
export const warnContainer = (text: string) => {
    return new ContainerBuilder()
        .setAccentColor(V.colors.warning)
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    V.emojis.warning + " " + text
                )
        )
}

export const successContainer = (text: string) => {
    return new ContainerBuilder()
        .setAccentColor(V.colors.success)
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    V.emojis.success + " " + text
                )
        )
}

export const infoContainer = (text: string) => {
    return new ContainerBuilder()
        .setAccentColor(V.colors.info)
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    V.emojis.info + " " + text
                )
        )
}