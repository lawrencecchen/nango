#!/usr/bin/env node

/*
 * Copyright (c) 2024 Nango, all rights reserved.
 */

import { Command } from 'commander';
import fs from 'fs';
import chalk from 'chalk';
import figlet from 'figlet';
import path from 'path';
import * as dotenv from 'dotenv';

import { nangoConfigFile } from '@nangohq/shared';
import { init, generate, tscWatch, configWatch, dockerRun, version } from './cli.js.js';
import deployService from './services/deploy.service.js.js';
import { compileAllFiles } from './services/compile.service.js.js';
import verificationService from './services/verification.service.js.js';
import dryrunService from './services/dryrun.service.js.js';
import configService from './services/config.service.js.js';
import { v1toV2Migration, directoryMigration } from './services/migration.service.js.js';
import { getNangoRootPath, upgradeAction, NANGO_INTEGRATIONS_LOCATION, printDebug } from './utils.js.js';
import type { ENV, DeployOptions } from './types.js.js';

class NangoCommand extends Command {
    override createCommand(name: string) {
        const cmd = new Command(name);
        cmd.option('--auto-confirm', 'Auto confirm yes to all prompts.');
        cmd.option('--debug', 'Run cli in debug mode, outputting verbose logs.');
        cmd.hook('preAction', async function (this: Command, actionCommand: Command) {
            const { debug } = actionCommand.opts();
            if (debug) {
                printDebug('Debug mode enabled');
                if (fs.existsSync('.env')) {
                    printDebug('.env file detected and loaded');
                }
            }

            await upgradeAction(debug);
        });

        return cmd;
    }
}

const program = new NangoCommand();

dotenv.config();

program.name('nango').description(
    `The CLI requires that you set the NANGO_SECRET_KEY_DEV and NANGO_SECRET_KEY_PROD env variables.

In addition for self-Hosting: set the NANGO_HOSTPORT env variable.

Global flag: --auto-confirm - automatically confirm yes to all prompts.

Available environment variables available:

# Recommendation: in a ".env" file in ./nango-integrations.

# Authenticates the CLI (get the keys in the dashboard's Environment Settings).
NANGO_SECRET_KEY_DEV=xxxx-xxx-xxxx
NANGO_SECRET_KEY_PROD=xxxx-xxx-xxxx

# Nango's instance URL (OSS: change to http://localhost:3003 or your instance URL).
NANGO_HOSTPORT=https://api.nango.dev # Default value

# How to handle CLI upgrades ("prompt", "auto" or "ignore").
NANGO_CLI_UPGRADE_MODE=prompt # Default value

# Whether to prompt before deployments.
NANGO_DEPLOY_AUTO_CONFIRM=false # Default value
`
);

program.addHelpText('before', chalk.green(figlet.textSync('Nango CLI')));

program
    .command('version')
    .description('Print the version of the Nango CLI and Nango Server.')
    .action(function (this: Command) {
        const { debug } = this.opts();
        version(debug);
    });

program
    .command('init')
    .description('Initialize a new Nango project')
    .action(async function (this: Command) {
        const { debug } = this.opts();
        const fullPath = process.cwd();
        await init({ absolutePath: fullPath, debug });

        console.log(chalk.green(`Nango integrations initialized!`));
    });

program
    .command('generate')
    .description('Generate a new Nango integration')
    .action(async function (this: Command) {
        const { debug } = this.opts();
        await generate({ fullPath: process.cwd(), debug });
    });

program
    .command('dryrun')
    .description('Dry run the sync|action process to help with debugging against an existing connection in cloud.')
    .arguments('name connection_id')
    .option('-e [environment]', 'The Nango environment, defaults to dev.', 'dev')
    .option(
        '-l, --lastSyncDate [lastSyncDate]',
        'Optional (for syncs only): last sync date to retrieve records greater than this date. The format is any string that can be successfully parsed by `new Date()` in JavaScript'
    )
    .option(
        '-i, --input [input]',
        'Optional (for actions only): input to pass to the action script. The `input` can be supplied in either JSON format or as a plain string. For example --input \'{"foo": "bar"}\'  --input \'foobar\''
    )
    .option(
        '-m, --metadata [metadata]',
        'Optional (for syncs only): metadata to stub for the sync script supplied in JSON format, for example --metadata \'{"foo": "bar"}\''
    )
    .option(
        '--integration-id [integrationId]',
        'Optional: The integration id to use for the dryrun. If not provided, the integration id will be retrieved from the nango.yaml file. This is useful using nested directories and script names are repeated'
    )
    .action(async function (this: Command, sync: string, connectionId: string) {
        const { autoConfirm, debug, e: environment, integrationId } = this.opts();
        const fullPath = process.cwd();
        await verificationService.necessaryFilesExist({ fullPath, autoConfirm, debug });
        dryrunService.run({ ...this.opts(), sync, connectionId, optionalEnvironment: environment, optionalProviderConfigKey: integrationId }, debug);
    });

program
    .command('dev')
    .description('Watch tsc files while developing. Set --no-compile-interfaces to disable watching the config file')
    .option('--no-compile-interfaces', `Watch the ${nangoConfigFile} and recompile the interfaces on change`, true)
    .action(async function (this: Command) {
        const { compileInterfaces, autoConfirm, debug } = this.opts();
        const fullPath = process.cwd();
        await verificationService.necessaryFilesExist({ fullPath, autoConfirm, debug, checkDist: false });

        if (compileInterfaces) {
            configWatch({ fullPath, debug });
        }

        await tscWatch({ fullPath, debug });
    });

program
    .command('deploy')
    .description('Deploy a Nango integration')
    .arguments('environment')
    .option('-v, --version [version]', 'Optional: Set a version of this deployment to tag this integration with. Can be used for rollbacks.')
    .option('-s, --sync [syncName]', 'Optional deploy only this sync name.')
    .option('-a, --action [actionName]', 'Optional deploy only this action name.')
    .option('--no-compile-interfaces', `Don't compile the ${nangoConfigFile}`, true)
    .action(async function (this: Command, environment: string) {
        const options = this.opts();
        (async (options: DeployOptions) => {
            const { debug } = options;
            const fullPath = process.cwd();
            await deployService.prep({ fullPath, options: { ...options, env: 'production' as ENV }, environment, debug });
        })(options as DeployOptions);
    });

program
    .command('migrate-config')
    .description('Migrate the nango.yaml from v1 (deprecated) to v2')
    .action(async function (this: Command) {
        await v1toV2Migration(path.resolve(process.cwd(), NANGO_INTEGRATIONS_LOCATION));
    });

program
    .command('migrate-to-directories')
    .description('Migrate the script files from root level to structured directories.')
    .action(async function (this: Command) {
        const { debug } = this.opts();
        await directoryMigration(path.resolve(process.cwd(), NANGO_INTEGRATIONS_LOCATION), debug);
    });

// Hidden commands //

program
    .command('deploy:local', { hidden: true })
    .alias('dl')
    .description('Deploy a Nango integration to local')
    .arguments('environment')
    .option('-v, --version [version]', 'Optional: Set a version of this deployment to tag this integration with. Can be used for rollbacks.')
    .option('--no-compile-interfaces', `Don't compile the ${nangoConfigFile}`, true)
    .action(async function (this: Command, environment: string) {
        const options = this.opts();
        (async (options: DeployOptions) => {
            const fullPath = process.cwd();
            await deployService.prep({ fullPath, options: { ...options, env: 'local' }, environment, debug: options.debug });
        })(options as DeployOptions);
    });

program
    .command('cli-location', { hidden: true })
    .alias('cli')
    .action(() => {
        getNangoRootPath(true);
    });

program
    .command('deploy:staging', { hidden: true })
    .alias('ds')
    .description('Deploy a Nango integration to local')
    .arguments('environment')
    .option('-v, --version [version]', 'Optional: Set a version of this deployment to tag this integration with. Can be used for rollbacks.')
    .option('--no-compile-interfaces', `Don't compile the ${nangoConfigFile}`, true)
    .action(async function (this: Command, environment: string) {
        const options = this.opts();
        (async (options: DeployOptions) => {
            const fullPath = process.cwd();
            await deployService.prep({ fullPath, options: { ...options, env: 'staging' }, environment, debug: options.debug });
        })(options as DeployOptions);
    });

program
    .command('compile', { hidden: true })
    .description('Compile the integration files to JavaScript')
    .action(async function (this: Command) {
        const { autoConfirm, debug } = this.opts();
        const fullPath = process.cwd();
        await verificationService.necessaryFilesExist({ fullPath, autoConfirm, debug });
        await verificationService.filesMatchConfig({ fullPath });
        const success = await compileAllFiles({ fullPath, debug });
        if (!success) {
            process.exitCode = 1;
        }
    });

program
    .command('sync:dev', { hidden: true })
    .description('Work locally to develop integration code')
    .option('--no-compile-interfaces', `Watch the ${nangoConfigFile} and recompile the interfaces on change`, true)
    .action(async function (this: Command) {
        const { compileInterfaces, autoConfirm, debug } = this.opts();
        const fullPath = process.cwd();
        await verificationService.necessaryFilesExist({ fullPath, autoConfirm, debug });
        if (compileInterfaces) {
            configWatch({ fullPath, debug });
        }

        tscWatch({ fullPath, debug });
        await dockerRun(debug);
    });

program
    .command('sync:docker.run', { hidden: true })
    .description('Run the docker container locally')
    .action(async function (this: Command) {
        const { debug } = this.opts();
        await dockerRun(debug);
    });

program
    .command('sync:config.check', { hidden: true })
    .alias('scc')
    .description('Verify the parsed sync config and output the object for verification')
    .action(async function (this: Command) {
        const { autoConfirm } = this.opts();
        const fullPath = process.cwd();
        await verificationService.necessaryFilesExist({ fullPath, autoConfirm });
        const { success, error, response: config } = await configService.load(path.resolve(fullPath, NANGO_INTEGRATIONS_LOCATION));

        if (!success || !config) {
            console.log(chalk.red(error?.message));
            process.exitCode = 1;
        }

        console.log(chalk.green(JSON.stringify(config, null, 2)));
    });

// admin only commands
program
    .command('admin:deploy', { hidden: true })
    .description('Deploy a Nango integration to an account')
    .arguments('environmentName')
    .action(async function (this: Command, environmentName: string) {
        const { debug } = this.opts();
        const fullPath = process.cwd();
        await deployService.admin({ fullPath, environmentName, debug });
    });

program.parse();
