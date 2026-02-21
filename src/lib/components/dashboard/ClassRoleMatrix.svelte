<script lang="ts">
	import { WOW_CLASSES, ROLES, type WowClass, type Role } from '$lib/constants';
	import {
		WOW_CLASS_COLORS,
		getClassTextColor,
		getClassBorderColor,
		getClassTextShadow
	} from '$lib/constants/wowClassColors';
	import * as Tooltip from '$lib/components/ui/tooltip';

	type PollResponse = {
		name: string;
		classes: string[];
		roles: string[];
		raidStatus: string;
	};

	let { responses }: { responses: PollResponse[] } = $props();

	let interestedResponses = $derived(responses.filter((r) => r.raidStatus !== 'not_interested'));

	type MatrixCell = {
		players: string[];
		count: number;
	};

	type MatrixRow = {
		className: WowClass;
		color: string;
		textColor: string;
		borderColor: string;
		textShadow: string;
		totalPlayers: number;
		cells: Record<Role, MatrixCell>;
	};

	let matrixData = $derived.by(() => {
		const rows: MatrixRow[] = WOW_CLASSES.map((cls) => {
			const playersForClass = interestedResponses.filter((r) => r.classes.includes(cls));
			const cells = {} as Record<Role, MatrixCell>;
			for (const role of ROLES) {
				const players = playersForClass.filter((r) => r.roles.includes(role)).map((r) => r.name);
				cells[role] = { players, count: players.length };
			}
			return {
				className: cls,
				color: WOW_CLASS_COLORS[cls],
				textColor: getClassTextColor(cls),
				borderColor: getClassBorderColor(cls),
				textShadow: getClassTextShadow(cls),
				totalPlayers: playersForClass.length,
				cells
			};
		});
		return rows.filter((r) => r.totalPlayers > 0).sort((a, b) => b.totalPlayers - a.totalPlayers);
	});

	let maxCell = $derived.by(() => {
		let max = 1;
		for (const row of matrixData) {
			for (const role of ROLES) {
				if (row.cells[role].count > max) max = row.cells[role].count;
			}
		}
		return max;
	});

	function getCellOpacity(count: number): number {
		if (count === 0) return 0;
		return 0.25 + (count / maxCell) * 0.75;
	}

	const ROLE_SHORT_LABELS: Record<Role, string> = {
		Tank: 'Tank',
		Healer: 'Healer',
		'DPS a Dist\u00e2ncia': 'DPS Dist.',
		'DPS Corpo a Corpo': 'DPS CC'
	};
</script>

<div class="flex flex-col gap-2">
	<h2 class="font-display text-lg tracking-wide uppercase">Classes &times; Roles</h2>
	<p class="text-xs text-muted-foreground">Cruzamento entre classes e roles selecionados</p>

	<div class="mt-2 overflow-x-auto">
		<table class="w-full border-collapse">
			<thead>
				<tr>
					<th
						class="border-2 border-border bg-muted px-3 py-2 text-left text-xs font-bold uppercase"
					>
						Classe
					</th>
					{#each ROLES as role (role)}
						<th
							class="border-2 border-border bg-muted px-3 py-2 text-center text-xs font-bold uppercase"
						>
							{ROLE_SHORT_LABELS[role]}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each matrixData as row (row.className)}
					<tr>
						<td
							class="border-2 px-3 py-2 text-sm font-medium"
							style="
								border-color: {row.borderColor};
								color: {row.color};
								text-shadow: {row.textShadow};
							"
						>
							{row.className}
						</td>
						{#each ROLES as role (role)}
							{@const cell = row.cells[role]}
							<td class="border-2 border-border p-0 text-center">
								{#if cell.count > 0}
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<div
													{...props}
													class="flex h-full min-h-10 items-center justify-center px-2 py-2 font-bold transition-colors"
													style="
														background-color: {row.color};
														opacity: {getCellOpacity(cell.count)};
														color: {row.textColor};
													"
												>
													{cell.count}
												</div>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Portal>
											<Tooltip.Content class="max-w-xs">
												<p class="mb-1 text-xs font-bold" style="color: {row.color};">
													{row.className} &mdash; {ROLE_SHORT_LABELS[role]}
												</p>
												<p class="text-xs">{cell.players.join(', ')}</p>
											</Tooltip.Content>
										</Tooltip.Portal>
									</Tooltip.Root>
								{:else}
									<div
										class="flex min-h-10 items-center justify-center text-xs text-muted-foreground"
									>
										&mdash;
									</div>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if matrixData.length === 0}
		<p class="mt-2 text-center text-sm text-muted-foreground">Nenhum jogador interessado ainda.</p>
	{/if}
</div>
