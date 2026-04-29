#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';
import { parseTokens } from './parser.js';
import { formatCss } from './formatters/css.js';
import { formatTailwind } from './formatters/tailwind.js';
import { formatJson } from './formatters/json.js';

const program = new Command();

program
  .name('token-forge')
  .description('Transform design token YAML to platform-specific formats')
  .version('2.0.0');

program
  .command('build')
  .description('Build tokens from YAML source')
  .requiredOption('-i, --input <file>', 'Input YAML token file')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .option('-f, --format <format>', 'Output format: css, tailwind, json, json-resolved, json-legacy', 'css')
  .option('--prefix <prefix>', 'CSS variable prefix')
  .option('--selector <selector>', 'CSS selector scope', ':root')
  .option('--color-format <format>', 'Color format: hsl, hex', 'hsl')
  .action((options) => {
    try {
      const inputPath = resolve(options.input);
      const yamlContent = readFileSync(inputPath, 'utf8');
      const tokens = parseTokens(yamlContent);

      let output: string;
      switch (options.format) {
        case 'css':
          output = formatCss(tokens, {
            prefix: options.prefix,
            selector: options.selector,
            format: options.colorFormat,
          });
          break;
        case 'tailwind':
          output = formatTailwind(tokens, {
            prefix: options.prefix,
          });
          break;
        case 'json':
          output = formatJson(tokens, 'raw');
          break;
        case 'json-resolved':
          output = formatJson(tokens, 'resolved');
          break;
        case 'json-legacy':
          output = formatJson(tokens, 'legacy');
          break;
        default:
          console.error(chalk.red(`Unknown format: ${options.format}`));
          process.exit(1);
      }

      if (options.output) {
        const outputPath = resolve(options.output);
        mkdirSync(dirname(outputPath), { recursive: true });
        writeFileSync(outputPath, output);
        console.log(
          chalk.green('✓') +
            ` ${tokens.name} v${tokens.version} → ${options.format} → ${outputPath}`
        );
      } else {
        process.stdout.write(output);
      }
    } catch (err) {
      console.error(chalk.red('Error:'), (err as Error).message);
      process.exit(1);
    }
  });

program.parse();
