import os from "os";
import path from "path";
import fs from "fs";

type Config = {
    provider?: string;
    model?: string;
};

export function getConfigPath(): string {
    return path.join(os.homedir(), ".local", "share", "coding-agent-cli", "config.json");
};

export function readConfig(): Config {
    const configPath = getConfigPath();

    if (!fs.existsSync(configPath)) {
        return {}
    };

    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
};

export function writeConfig(config: Config): void {
    const configPath = getConfigPath();

    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

