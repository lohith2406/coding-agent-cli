import { Command } from "commander";

export const setModelCommand = new Command("set")
    .description("Set the default model")
    .argument("<modelName>", "Model to set as default")
    .action((options) => {
        console.log(`setting default model tp ${options.model}`)
    });