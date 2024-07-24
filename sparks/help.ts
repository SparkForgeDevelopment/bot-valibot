import { join } from 'node:path';
import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from 'discord.js';
import { CommandSpark } from '../lib/sparks';

const command = new SlashCommandBuilder();
command
	.setName('help')
	.setDescription('Let me tell you all the things I can do.');

export class Command extends CommandSpark {
	override command = command;
	override id = command.name;
	override execute(interaction: ChatInputCommandInteraction): void {
		const embed = new EmbedBuilder()
			.setTitle('About Me')
			.setDescription(
				'Hello, I am Valibot - Discord Edition.  I am here to help manage the server and provide all my users with helpful utilities.  If you have feedback about me or want to help my development, please visit <#1255497491395248209>.\n\n### My Commands\nHere are the commands you can use to request me to do something for you.',
			)
			.addFields(
				{
					name: 'Valibot Documentation Links',
					value:
						'I will search my databanks and post a link to part of my documentation.',
					inline: false,
				},
				{
					name: '`/doc API *topic*`',
					value:
						'I will post a link to one of my API topics. As long as you know the first few letters, I can help you find the exact topic.',
					inline: true,
				},
				{
					name: '`/doc guide *topic*`',
					value:
						'I will post a link to one of my guides. As long as you know the first few letters, I can help you find the exact name.',
					inline: true,
				},
				{
					name: 'Playground Links',
					value:
						'I can help create and format playground links. Please note though that Discord limits posts to 2000 characters, so keep your code short.',
					inline: false,
				},
				{
					name: '`/playground *link*`',
					value:
						'I will extract the code from an existing link and post it in a code block along with a link to the playground.',
					inline: true,
				},
				{
					name: '`!pg *code block*` post',
					value:
						'I will take the code you put inside a ts code block and create a playground link. Please note this is not a command; instead, it is a message or reply that begins with `!pg`. My maker made a screenshot to help you with the correct format.',
					inline: true,
				},
			)
			.setImage('attachment://pg-screenshot.png')
			.setColor('#38bdf8');

		interaction
			.reply({
				embeds: [embed],
				files: [
					{
						attachment: join(
							import.meta.dir,
							'../assets/images/pg-screenshot.png',
						),
						name: 'pg-screenshot.png',
					},
				],
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
