import { Command } from "commander";
import os from "os";
import path from "path";
import fs from "fs";

type Auth = {
    type: string;
    key: string;
};

export const loginCommand = new Command("login")
    .description("Log in to a provider (use it as default")
    .requiredOption("-p, --provider <providerName>", "Name of the provider (gemini, claude etc)")
    .requiredOption("-a, --api-key <apiKey>", "Your api key")
    .action((options) => {
        const authDir = path.join(os.homedir(), ".local", "share", "coding-agent-cli");
        const authPath = path.join(authDir, "auth.json");

        fs.mkdirSync(authDir, { recursive: true }); // recursive: true = create if doesn't exist

        let auth: Record<string, Auth> = {};
        
        if (fs.existsSync(authPath)) {
            auth = JSON.parse(fs.readFileSync(authPath, "utf-8"));
        }

        auth[options.provider] = {
            type: "api",
            key: options.apiKey
        };

        fs.writeFileSync(authPath, JSON.stringify(auth, null, 2));
    })