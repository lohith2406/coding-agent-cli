import { Command } from "commander";
import { readAuth, writeAuth } from "../../services/auth";
import { getCatalog } from "../../services/models";

export const loginCommand = new Command("login")
    .description("Log in to a provider (use it as default)")
    .requiredOption("-p, --provider <providerName>", "Name of the provider (anthropic, google, openai etc)")
    .requiredOption("-a, --api-key <apiKey>", "Your api key")
    .action(async (options) => {
        const catalog = await getCatalog();

        if (!(options.provider in catalog)) {
            console.error(`Unknown provider ${options.provider}.`);
            process.exitCode = 1; // so that && commands fail too
            return;
        }

        const auth = readAuth();

        auth[options.provider] = {
            type: "api",
            key: options.apiKey
        }

        writeAuth(auth);
        console.log(`Logged in to ${options.provider}`);
    })