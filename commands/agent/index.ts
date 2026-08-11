import { Command } from "commander";
import { readConfig } from "../../services/config";
import { readAuth } from "../../services/auth";
import { GoogleGenAI } from "@google/genai";
import fs from "fs"

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

        for (let turn = 0; turn < 10; turn++ ) {
            const stream = await ai.interactions.create({
                model: config.model,
                input,
                stream: true,
                tools: [readFileTool],
                previous_interaction_id
            });
    
            const currentCalls = new Map();
            let toolCalls: { type: string; id: string; name: string; arguments: { path: string } }[] = [];
    
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
                }
            }
    
            if (toolCalls.length === 0) {
                return;
            }
    
            input = toolCalls.map(call => ({
                type: "function_result",
                call_id: call.id,
                name: call.name,
                result: fs.readFileSync(call.arguments.path, "utf-8")
            }));
        }
    });