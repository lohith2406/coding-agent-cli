# coding-agent-cli

A coding agent CLI. Log in to a model provider, pick a default model, and give the
agent a prompt — it can read and write files on your machine to answer.

## Install

```bash
bun install
```

## Usage

### Providers

List the supported providers (sourced from [models.dev](https://models.dev)):

```bash
bun cli.ts providers list
```

Log in with an API key:

```bash
bun cli.ts providers login -p google -a <your-api-key>
```

The provider name must be a models.dev provider id — `google`, `anthropic`,
`openai` — not a model family name like `gemini` or `claude`.

Log out:

```bash
bun cli.ts providers logout -p google
```

### Models

List every model, grouped by provider:

```bash
bun cli.ts models
```

Set the default model. The provider is required because the same model id is often
served by several providers:

```bash
bun cli.ts models set -p google gemini-2.5-flash
```

### Agent

```bash
bun cli.ts agent
```

Starts a chat. Type a request at the `>` prompt; the agent keeps the conversation,
so follow-up questions can refer to earlier answers. Type `exit` to quit.

For each request the agent loops: the model may ask to call tools, the CLI runs
them one at a time and sends all the results back, and this repeats until the
model answers. Available tools:

| Tool | Description |
| --- | --- |
| `read_file` | Read a file from the local filesystem |
| `write_file` | Create or overwrite a file |
| `bash` | Run a shell command in the current directory |

Every `bash` command is shown first and runs only if you answer `y`; answering
`n` tells the model the command was denied, and it carries on without it. A
command that fails returns its exit code and output to the model rather than
stopping the agent.

`write_file` overwrites whatever path the model names, with no confirmation.
Commit your work before pointing the agent at a repository you care about.

## Storage

| File | Contents |
| --- | --- |
| `~/.local/share/coding-agent-cli/auth.json` | API keys, per provider |
| `~/.local/share/coding-agent-cli/config.json` | Default provider and model |

## Future plan

- **Permission choices**: answer `always` to allow a tool for the rest of the session, and a `--yes` flag to skip prompts. Today every bash command asks y/n.
- **Permission prompts for `write_file`** as well as bash.
- **Path guard**: refuse `read_file` and `write_file` paths outside the current directory.
- **Timeout** on bash commands, so a hanging command can't hang the agent.
- **Output truncation**: cap tool results (around 10,000 characters) so one big output can't fill the model's context.
- **Async bash**: run commands without blocking, and stream output live (`spawn` instead of `execSync`).
- **Errors as results for every tool**: `bash` already does this; a missing file in `read_file` still stops the agent.
- **Typed tool arguments**: one zod schema per tool for validation, types and the JSON schema sent to the model.
- **Provider-agnostic models**: a shared message format, with adapters for Anthropic, OpenAI and Gemini.
- **Loop cap**: stop after a set number of steps.
- **Quit from a prompt**: answer `q` at a y/n prompt to stop the current request.
- **Typing while the agent works**: queue a message and hand it to the model at the next step (needs a TUI, e.g. Ink).
- **Saved sessions and memory**: resume past conversations, and keep project facts in a memory file between sessions.
- **Compaction**: summarise older turns once a conversation gets long, to stay within the context window.

Built with [Bun](https://bun.com).
