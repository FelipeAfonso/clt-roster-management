import { v } from 'convex/values';
import { internalAction } from './_generated/server';

// Rótulos de intent (espelham src/lib/constants/recruitment.ts). Inline porque
// o bundler do Convex não resolve o alias `$lib` do SvelteKit.
const INTENT_LABELS: Record<string, string> = {
	community_only: 'Apenas a comunidade',
	dungeons_only: 'Apenas Mythic+',
	raids_only: 'Apenas Raids',
	raids_and_dungeons: 'Raids e Mythic+'
};

const intentValidator = v.union(
	v.literal('community_only'),
	v.literal('dungeons_only'),
	v.literal('raids_only'),
	v.literal('raids_and_dungeons')
);

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Envia um e-mail de notificação para a guilda quando uma nova candidatura é
 * recebida. Disparado via `ctx.scheduler` a partir de `submitApplication`, então
 * roda após o commit da mutation — qualquer falha aqui nunca afeta o envio da
 * candidatura.
 *
 * Variáveis de ambiente (configuradas no deployment Convex, não no `.env`):
 * - RESEND_API_KEY        — obrigatória; sem ela, apenas loga e retorna.
 * - RECRUITMENT_NOTIFY_EMAIL — destinatário (default: fmunhozafonso@gmail.com).
 * - RECRUITMENT_FROM_EMAIL   — remetente (default: onboarding@resend.dev, sandbox).
 * - APP_BASE_URL          — base para o link da candidatura no painel.
 */
export const sendApplicationNotification = internalAction({
	args: {
		applicationId: v.id('guildApplications'),
		displayName: v.string(),
		discord: v.string(),
		intent: intentValidator
	},
	handler: async (_ctx, args) => {
		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey) {
			console.warn('[email] RESEND_API_KEY ausente — pulando notificação de candidatura.');
			return;
		}

		const to = process.env.RECRUITMENT_NOTIFY_EMAIL ?? 'fmunhozafonso@gmail.com';
		const from = process.env.RECRUITMENT_FROM_EMAIL ?? 'onboarding@resend.dev';
		const baseUrl = process.env.APP_BASE_URL ?? 'https://clt.felipeafonso.com';

		const intentLabel = INTENT_LABELS[args.intent] ?? args.intent;
		const link = `${baseUrl.replace(/\/$/, '')}/app/recrutamento/${args.applicationId}`;
		const subject = `Nova candidatura: ${args.displayName}`;

		const html = `
			<div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5;">
				<h2 style="margin: 0 0 12px;">Nova candidatura recebida</h2>
				<p style="margin: 0 0 4px;"><strong>Nome:</strong> ${escapeHtml(args.displayName)}</p>
				<p style="margin: 0 0 4px;"><strong>Discord:</strong> ${escapeHtml(args.discord)}</p>
				<p style="margin: 0 0 16px;"><strong>Interesse:</strong> ${escapeHtml(intentLabel)}</p>
				<p style="margin: 0;">
					<a href="${link}" style="color: #6366f1;">Ver candidatura no painel</a>
				</p>
			</div>
		`.trim();

		try {
			const res = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ from, to, subject, html })
			});

			if (!res.ok) {
				const body = await res.text();
				console.error(`[email] Resend respondeu ${res.status}: ${body}`);
				return;
			}

			console.log(`[email] Notificação de candidatura enviada para ${to}.`);
		} catch (err) {
			console.error('[email] Falha ao enviar notificação de candidatura:', err);
		}
	}
});
