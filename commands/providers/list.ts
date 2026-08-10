import { Command } from "commander";
import { getCatalog } from "../../services/models";

export const listCommand = new Command("list")
    .description("List supported providers")
    .action(async () => {
        const catalog = await getCatalog();

        for(const provider of Object.keys(catalog)) {
            console.log(provider);
        };
    });
