import { Command } from "commander";
import { removeAuth } from "../../services/auth";

export const logoutCommand = new Command("logout")
    .description("Log out of a provider")
    .requiredOption("-p, --provider <providerName>", "Name of the provider")
    .action((options) => {
        if (removeAuth(options.provider)) {
            console.log(`Logged out of ${options.provider}`);
        } else {
            console.log(`Not logged in to ${options.provider}`);
        }
    })