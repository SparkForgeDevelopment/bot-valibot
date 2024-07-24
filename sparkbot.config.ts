import { ActivityType, GatewayIntentBits } from 'discord.js';
import type { SecretsVaultSchema, SparkBotSchema } from './lib/config';

export const secretsVaultPluginConfig: SecretsVaultSchema = {
	prod: {
		module: '@sparkbot/plugin-secrets-azure',
		options: { vaultURL: 'https://sparkforge-discord-bots.vault.azure.net/' },
	},
	dev: {
		module: '@sparkbot/plugin-secrets',
	},
};

export const sparkBotConfig: SparkBotSchema = {
	discordAPIKey: { secretVaultKey: 'valibot-discordAPIKey' },
	discordAppID: { secretVaultKey: 'valibot-discordAppID' },
	discordIntents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
	],
	enabledPartials: [],
	defaultPresence: {
		status: 'online',
		activities: [
			{
				name: 'your data.',
				type: ActivityType.Watching,
			},
		],
	},
	loggingLibraryPlugin: {
		prod: {
			module: '@sparkbot/plugin-logger-pino',
			options: {
				transports: [
					{
						target: '@axiomhq/pino',
						options: {
							dataset: { secretVaultKey: 'valibot-axiomDataset' },
							token: { secretVaultKey: 'valibot-axiomToken' },
						},
						level: 'info',
					},
				],
			},
		},
		dev: {
			module: '@sparkbot/plugin-logger-pino',
			options: {
				transports: [
					{
						target: 'pino-pretty',
						options: {
							colorize: true,
						},
						level: 'debug',
					},
				],
			},
		},
	},
};
