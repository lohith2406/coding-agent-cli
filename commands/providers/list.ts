import { Command } from "commander";

export const listCommand = new Command("list")
    .description("List supported providers")
    .action(() => {
        console.log("Listing providers...");
    });
