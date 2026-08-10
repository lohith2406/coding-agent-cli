import os from "os";
import path from "path";
import fs from "fs";

export type Auth = {
    type: string,
    key: string
};

export function getAuthPath(): string {
    return path.join(os.homedir(), ".local", "share", "coding-agent-cli", "auth.json");
};

export function readAuth(): Record<string, Auth> {
    const authPath = getAuthPath();

    if (!fs.existsSync(authPath)) {
        return {};
    }

    return JSON.parse(fs.readFileSync(authPath, "utf-8"));
};

export function writeAuth(auth: Record<string, Auth>): void {
    const authPath = getAuthPath();

    fs.mkdirSync(path.dirname(authPath), { recursive: true }) // recursive: true = create if doesn't exist
    fs.writeFileSync(authPath, JSON.stringify(auth, null, 2));
}

export function removeAuth(provider: string): boolean {
    const auth = readAuth();

    if (!auth[provider]) {
        return false;
    }

    delete auth[provider];
    writeAuth(auth);
    return true;
}