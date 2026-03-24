import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

/**
 * Poll watched Discord channels for new messages every 2 minutes.
 *
 * This replaces a persistent gateway connection — the tradeoff is
 * up to ~2 minutes of latency for detecting new channel messages.
 */
crons.interval(
	'Poll Discord channels',
	{ minutes: 2 },
	internal.discord.channelPoller.pollChannels
);

export default crons;
