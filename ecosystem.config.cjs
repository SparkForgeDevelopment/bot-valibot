module.exports = {
	apps: [
		{
			name: 'Valibot',
			script: './index.ts',
			env: {
				NODE_ENV: 'production',
			},
			interpreter: '/home/discord-bots-azure/.bun/bin/bun',
		},
	],
};
