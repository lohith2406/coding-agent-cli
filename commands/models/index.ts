import { Command } from "commander";
import { setModelCommand } from "./set";
import { getModels } from "../../services/models";

export const modelsCommand = new Command("models")
    .description("List all supported models")
    .action(async () => {
        const models = await getModels();
        
        for (const [provider, data] of Object.entries(models)) {
            console.log(provider);

            for (const model of Object.values(data.models)) {
                console.log(`   ${model.id}`)
            }
        };
    })
    .addCommand(setModelCommand);