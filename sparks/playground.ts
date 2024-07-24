import {
	type ChatInputCommandInteraction,
	Events,
	type Message,
	SlashCommandBuilder,
} from 'discord.js';
import * as v from 'valibot';
import lz from 'lz-string';
import { CommandSpark, GatewayEventSpark } from '../lib/sparks';

const linkSchema = v.pipe(
	v.string(),
	v.url('Invalid URL format.'),
	v.startsWith(
		'https://valibot.dev/playground/?code=',
		'Not a Valibot playground link.',
	),
	v.maxLength(1900, 'Link to long for Discord posts.'),
);

const command = new SlashCommandBuilder();
command
	.setName('playground')
	.setDescription('Post a formatted playground link')
	.addStringOption((option) =>
		option
			.setName('link')
			.setDescription('Playground link to post')
			.setRequired(true),
	);

export class Command extends CommandSpark {
	override command = command;
	override id = command.name;
	override async execute(interaction: ChatInputCommandInteraction) {
		const link = v.safeParse(
			linkSchema,
			interaction.options.getString('link', true),
		);

		if (link.success) {
			const codeIndex = link.output.indexOf('code=') + 'code='.length;
			const code = lz.decompressFromEncodedURIComponent(
				link.output.slice(codeIndex),
			);

			let messageContent = `[Try this code in my playground](<${link.output}>)\n\`\`\`ts\n`;
			messageContent +=
				messageContent.length + code.length + 4 < 2000
					? code + '\n```'
					: 'Code to long to post.\n```';

			interaction.reply(messageContent).catch((exception: unknown) => {
				if (exception instanceof Error) {
					interaction.client.logger.warn(exception);
				} else {
					interaction.client.logger.warn(String(exception));
				}
			});
		} else {
			interaction
				.reply({
					content: `I apologize for the inconvenience but the link you provided is not valid.  My internal processors tell me the the error was: ${link.issues[0].message}`,
					ephemeral: true,
				})
				.catch((exception: unknown) => {
					if (exception instanceof Error) {
						interaction.client.logger.warn(exception);
					} else {
						interaction.client.logger.warn(String(exception));
					}
				});
		}
	}
}

const codeBlockSchema = v.pipe(
	v.string(),
	v.startsWith('```ts\n'),
	v.endsWith('\n```'),
	v.transform((input) => input.slice(('```ts\n'.length, '\n```'.length * -1))),
);

export class GatewayEvent extends GatewayEventSpark<Events.MessageCreate> {
	override eventType = Events.MessageCreate as const;

	override async execute(message: Message): Promise<void> {
		if (
			message.channel.isTextBased() &&
			!message.channel.isDMBased() &&
			message.content.startsWith('!pg')
		) {
			const codeBlock = v.safeParse(
				codeBlockSchema,
				message.content.slice('!pg'.length + 1),
			);

			if (codeBlock.success) {
				let messageContent = `[Try this code in my playground](<https://valibot.dev/playground/?code=${lz.compressToEncodedURIComponent(codeBlock.output)}>)\n`;
				if (
					messageContent.length +
						message.content.slice('!pg'.length + 1).length <
					2000
				)
					messageContent += message.content.slice('!pg'.length + 1);

				if (message.reference?.messageId) {
					const orgMessage = await message.channel.messages.fetch(
						message.reference.messageId,
					);
					orgMessage.reply(messageContent).catch((exception: unknown) => {
						if (exception instanceof Error) {
							message.client.logger.warn(exception);
						} else {
							message.client.logger.warn(String(exception));
						}
					});
				} else {
					await message.channel
						.send(messageContent)
						.catch((exception: unknown) => {
							if (exception instanceof Error) {
								message.client.logger.warn(exception);
							} else {
								message.client.logger.warn(String(exception));
							}
						});
				}

				if (message.channel.manageable) {
					message.delete().catch((exception: unknown) => {
						if (exception instanceof Error) {
							message.client.logger.warn(exception);
						} else {
							message.client.logger.warn(String(exception));
						}
					});
				} else {
					message.client.logger.warn(
						`${import.meta.path}: Cannot delete messages in channel ${message.channel.name}`,
					);
				}
			} else {
				message
					.reply({
						content:
							'I apologize for the inconvenience but your message does not appear to be correctly formatted.  Please remember your code must be inside code blocks and may not contain other content.\n\n> \\```ts\n> your code\n> \\```',
					})
					.catch((exception: unknown) => {
						if (exception instanceof Error) {
							message.client.logger.warn(exception);
						} else {
							message.client.logger.warn(String(exception));
						}
					});
			}
		}
	}
}
