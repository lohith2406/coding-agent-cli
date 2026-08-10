import { Command } from "commander";
import { setModelCommand } from "./set";
import { getCatalog } from "../../services/models";

export const modelsCommand = new Command("models")
    .description("List all supported models")
    .action(async () => {
        const catalog = await getCatalog();
        
        for (const [provider, data] of Object.entries(catalog)) {
            console.log(provider);

            for (const model of Object.keys(data.models)) {
                console.log(`   ${model}`)
            }
        };
    })
    .addCommand(setModelCommand);