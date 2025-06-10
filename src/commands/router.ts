import { existsSync } from "fs";
import path from "path";
import { errorContainer, infoContainer, successContainer, warnContainer } from "../utils/containers.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const router: Router = async (message) => {
    const content = message.content;
    const splitContent = content.split(" ");
    const command = splitContent[0].replace(".", "");
    const args = splitContent.splice(1);

    let commandPath = "";
    if (args.length === 0) {
        commandPath = path.join(__dirname, command, "index.js");
    } else {
        commandPath = path.join(__dirname, command, args.join("\\"), "index.js");
    };

    if (existsSync(commandPath)) {
        const commandModule = (await import("file://" + commandPath)) as BotCommand;
        if (!commandModule) return;

        if (!commandModule.enabled) {
            await message.reply({
                components: [
                    errorContainer("This is an error"),
                    warnContainer("This is a warning"),
                    successContainer("This is a success"),
                    infoContainer("This is an info")
                ],
                flags: ["IsComponentsV2", "SuppressNotifications"]
            });
        };
    } else {
        console.log("Doesnt exist: " + commandPath);
    }
};