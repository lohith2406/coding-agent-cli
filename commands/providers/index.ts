import { Command } from "commander";
import { loginCommand } from "./login";
import { logoutCommand } from "./logout";
import { listCommand } from "./list";

export const providersCommand = new Command("providers")
    .description("Manage providers")
    .addCommand(listCommand)
    .addCommand(loginCommand)
    .addCommand(logoutCommand);