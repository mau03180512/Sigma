import chalk from 'chalk';
import { MODELS } from '../types.js';
import { printHeader } from '../utils/render.js';

export async function modelsCommand(): Promise<void> {
  printHeader();
  console.log(`  ${chalk.bold('Available Models:')}\n`);

  for (const model of MODELS) {
    const tagColor = model.tag === 'Versatile' ? chalk.cyan
      : model.tag === 'Vision' ? chalk.magenta
      : model.tag === 'Lightweight' ? chalk.green
      : chalk.yellow;

    console.log(`  ${chalk.bold(model.label)}`);
    console.log(`    ${chalk.dim('ID:')}     ${model.id}`);
    console.log(`    ${chalk.dim('Tag:')}    ${tagColor(model.tag)}`);
    console.log(`    ${chalk.dim('Best:')}   ${model.bestFor}`);
    console.log(``);
  }
}
