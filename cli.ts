import { program } from 'commander';
import { modelsCommand } from './commands/models/';
import { agentCommand } from './commands/agent';
import { providersCommand } from './commands/providers';

program
    .name('opencode')
    .description('Coding agent cli')
    .version('0.1.0')
    .addCommand(providersCommand)
    .addCommand(modelsCommand)
    .addCommand(agentCommand);

await program.parseAsync();