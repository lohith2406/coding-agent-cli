import { Command } from "commander";
import { readConfig } from "../../services/config";
import { readAuth } from "../../services/auth";
import { GoogleGenAI } from "@google/genai";
import fs from "fs"
import { execSync } from "child_process";
import readline from "readline";

type ReadFileToolCall = { 
    id: string; 
    name: "read_file"; 
    arguments: { 
        path: string 
    } 
}

type WriteFileToolCall = { 
    id: string; 
    name: "write_file"; 
    arguments: { 
        path: string;
        content: string;
    } 
}

type BashToolCall = { 
    id: string; 
    name: "bash"; 
    arguments: { 
        command: string 
    } 
}

type ToolCall = ReadFileToolCall | WriteFileToolCall | BashToolCall;

type FunctionResult = { 
    type: "function_result"; 
    name: string; 
    call_id: string; 
    result: string 
};

const readFileTool = {
    type: "function" as const,
    name: "read_file",
    description: "Read the contents of file from the local file system",
    parameters: {
        type: "object",
        properties: {
            path: { type: "string", description: "Path to the file" }
        },
        required: ["path"]
    }
};

const writeFileTool = {
    type: "function" as const,
    name: "write_file",
    description: "Write content to a file on the local file system, creating or overwriting it",
    parameters: {
        type: "object",
        properties: {
            path: { type: "string", description: "Path to the file" },
            content: { type: "string", description: "Full content to write to the file" }
        },
        required: ["path", "content"]
    }
};

const bashTool = {
    type: "function" as const,
    name: "bash",
    description: "Run a shell command in the current directory and return its output",
    parameters: {
        type: "object",
        properties: {
            command: { type: "string", description: "The shell command to run" },
        },
        required: ["command"]
    }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout})

function askQuestion(question: string) {
    return new Promise<string>((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        })
    })
}
async function executeTool(call: ToolCall): Promise<string> {
    if (call.name === "write_file") {
        fs.writeFileSync(call.arguments.path, call.arguments.content, "utf-8");
        return `Wrote ${call.arguments.content.length} bytes to ${call.arguments.path}`;
    } else if (call.name === "read_file") {
        return fs.readFileSync(call.arguments.path, "utf-8");
    } else {
        console.log(call.arguments.command);
        const answer = await askQuestion("Run this command (y/n) ");
        if (answer.trim().toLowerCase() !== "y") {
            return "User denied this command"
        }
        try {
            return execSync(call.arguments.command, { cwd: process.cwd(), encoding: "utf8"});
        } catch (err: any) {
            return `Command failed (exit ${err.status})\n${err.stdout ?? ""}${err.stderr ?? ""}`;
        }
    }
}

async function agentLoop(ai: GoogleGenAI, model: string, prompt: string, previousId: string | undefined): Promise<string | undefined> {
    let input: string | FunctionResult[] = prompt;
    while (true) {
        const stream = await ai.interactions.create({
            model,
            system_instruction: "You are a coding agent. You can read files, write to files or run bash commands",
            input,
            stream: true,
            tools: [readFileTool, writeFileTool, bashTool],
            previous_interaction_id: previousId
        });

        const currentCalls = new Map();
        let toolCalls: ToolCall[] = [];

        for await (const event of stream) {
            const evType = event.event_type;
            if (evType === 'interaction.created') {
                previousId = event.interaction.id;
            }
            else if (evType === 'step.start') {
                if (event.step.type === 'function_call') {
                    currentCalls.set(event.index, {
                        id: event.step.id,
                        name: event.step.name,
                        arguments: ''
                    });
                }
            } else if (evType === 'step.delta') {
                if (event.delta.type === 'arguments_delta') {
                    if (currentCalls.has(event.index)) {
                        currentCalls.get(event.index).arguments += event.delta.arguments;
                    }
                } else if (event.delta.type === 'text') {
                    process.stdout.write(event.delta.text);
                }
            } else if (evType === 'interaction.completed') {
                toolCalls = Array.from(currentCalls.values()).map(call => ({
                    id: call.id,
                    name: call.name,
                    arguments: call.arguments ? JSON.parse(call.arguments) : {}
                }));
            } else if (evType === 'error') {
                console.error(`Error: ${event.error?.message ?? "unknown error"}`);
                process.exitCode = 1;
                return previousId;
            }
        }

        if (toolCalls.length === 0) {
            return previousId;
        }
        
        const results: FunctionResult[] = [];
        for (const call of toolCalls) { //for...of runs tools one at a time. an async map would start them all at once and show several y/n prompts together
            results.push({
                type: "function_result",
                name: call.name,
                call_id: call.id,
                result: await executeTool(call) // await inside for...of pauses until tool finishes before the next one starts
            })
        }

        input = results;
    }
}

export const agentCommand = new Command("agent")
    .description("Runs the agent")
    .action(async () => {
        const config = readConfig();
        if (!config.provider || !config.model) {
            console.error("No default model set. Try: opencode models set -p anthropic <model>");
            process.exitCode = 1;
            return;
        }

        const auth = readAuth();
        const entry = auth[config.provider];
        if (!entry) {
            console.error(`Not logged into ${config.provider}. Try opencode providers login -p ${config.provider} -a <apiKey>`);
            process.exitCode = 1;
            return;
        }

        const ai = new GoogleGenAI({ apiKey: entry.key });

        let previousId: string | undefined;

        while (true) {
            const line = (await askQuestion("> ")).trim();
            if (line === "exit") break;
            previousId = await agentLoop(ai, config.model, line, previousId);
        }

        rl.close();
    });