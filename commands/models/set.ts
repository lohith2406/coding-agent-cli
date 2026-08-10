import { Command } from "commander";
import { getCatalog } from "../../services/models";
import { readConfig, writeConfig } from "../../services/config";

export const setModelCommand = new Command("set")
    .description("Set the default model")
    .requiredOption("-p, --provider <providerName>", "Provider that serves the model")
    .argument("<model>", "Model to set as default")
    .action(async (model, options) => {
        const catalog = await getCatalog();
        const provider = catalog[options.provider];

        if (!provider) {
            console.error(`Unknown provider ${options.provider}`);
            process.exitCode = 1;
            return;
        }

        if (!(model in provider.models)) {
            console.error(`Provider ${options.provider} has no model ${model}`);
            process.exitCode = 1;
            return;
        }

        const config = readConfig();
        config.provider = options.provider;
        config.model = model;
        writeConfig(config);

        console.log(`Default model set to ${model} (${options.provider})`);
    });