import { Command } from "commander";
import { readConfig } from "../../services/config";
import { readAuth } from "../../services/auth";
import { GoogleGenAI } from "@google/genai";
import fs from "fs"

type ToolCall = { 
    type: string; 
    id: string; 
    name: string; 
    arguments: { 
        path: string;
        content?: string;
    } 
}

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

function executeTool(name: string, args: { path: string, content?: string}): string {
    if (name === "write_file") {
        fs.writeFileSync(args.path, args.content ?? "", "utf-8");
        return `Wrote ${args.content?.length ?? 0} bytes to ${args.path}`;
    }

    return fs.readFileSync(args.path, "utf-8");
}

export const agentCommand = new Command("agent")
    .description("Runs the agent")
    .requiredOption("-p, --prompt <prompt>", "Prompt")
    .action(async (options) => {
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

        let input = options.prompt;
        let previous_interaction_id: string | undefined;

        while (true) {
            const stream = await ai.interactions.create({
                model: config.model,
                system_instruction: "You are a coding agent. Use the tools to read and write files",
                input,
                stream: true,
                tools: [readFileTool, writeFileTool],
                previous_interaction_id
            });
    
            const currentCalls = new Map();
            let toolCalls: ToolCall[] = [];
    
            for await (const event of stream) {
                const evType = event.event_type;
                if (evType === 'interaction.created') {
                    previous_interaction_id = event.interaction.id;
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
                        type: 'function_call',
                        id: call.id,
                        name: call.name,
                        arguments: call.arguments ? JSON.parse(call.arguments) : {}
                    }));
                } else if (evType === 'error') {
                    console.error(`Error: ${event.error?.message ?? "unknown error"}`);
                    process.exitCode = 1;
                    return;
                }
            }
    
            if (toolCalls.length === 0) {
                return;
            }

            input = toolCalls.map(call => ({
                type: "function_result",
                call_id: call.id,
                name: call.name,
                result: executeTool(call.name, call.arguments)
            }));
        }
    });