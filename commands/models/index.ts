import { Command } from "commander";
import { setModelCommand } from "./set";

export const modelsCommand = new Command("models")
    .description("List all supported models")
    .action((options) => {
        console.log("Listing models...")
        console.log(options)
    })
    .addCommand(setModelCommand);