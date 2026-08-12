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
bun cli.ts agent -p "what dependencies are in package.json?"
```

The agent loops: it may ask to call a tool, the CLI runs it and sends the result
back, and this repeats until the model answers. Available tools:

| Tool | Description |
| --- | --- |
| `read_file` | Read a file from the local filesystem |
| `write_file` | Create or overwrite a file |

`write_file` overwrites whatever path the model names, with no confirmation.
Commit your work before pointing the agent at a repository you care about.

## Storage

| File | Contents |
| --- | --- |
| `~/.local/share/coding-agent-cli/auth.json` | API keys, per provider |
| `~/.local/share/coding-agent-cli/config.json` | Default provider and model |

Built with [Bun](https://bun.com).
