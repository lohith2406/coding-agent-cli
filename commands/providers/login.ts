import { Command } from "commander";

export const loginCommand = new Command("login")
    .description("Log in to a provider (use it as default")
    .requiredOption("-p, --provider <providerName>", "Name of the provider (gemini, claude etc)")
    .requiredOption("-a, --api-key <apiKey>", "Your api key")
    .action((options) => {
        console.log(`Logging into ${options.provider}`);
    })