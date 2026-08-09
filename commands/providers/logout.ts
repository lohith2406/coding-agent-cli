import { Command } from "commander";

export const logoutCommand = new Command("logout")
    .description("Log out of a provider")
    .requiredOption("-p, --provider <providerName>", "Name of the provider")
    .action((options) => {
        console.log(`Logging out of ${options.provider}`)
    })