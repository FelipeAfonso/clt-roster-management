<script lang="ts">
	import { DAYS_OF_WEEK, TIME_SLOTS, makeSlotKey } from '$lib/constants';
	import * as Tooltip from '$lib/components/ui/tooltip';

	type PollResponse = {
		name: string;
		raidStatus: string;
		availability?: Record<string, boolean>;
	};

	let { responses }: { responses: PollResponse[] } = $props();

	let readyResponses = $derived(
		responses.filter((r) => r.raidStatus === 'ready' && r.availability)
	);
	let laterResponses = $derived(
		responses.filter((r) => r.raidStatus === 'later' && r.availability)
	);

	type SlotData = {
		readyCount: number;
		laterCount: number;
		totalCount: number;
		readyPlayers: string[];
		laterPlayers: string[];
	};

	let heatmapData = $derived.by(() => {
		const data: Record<string, SlotData> = {};
		for (const day of DAYS_OF_WEEK) {
			for (const time of TIME_SLOTS) {
				const key = makeSlotKey(day.key, time);
				const readyPlayers = readyResponses.filter((r) => r.availability?.[key]).map((r) => r.name);
				const laterPlayers = laterResponses.filter((r) => r.availability?.[key]).map((r) => r.name);
				data[key] = {
					readyCount: readyPlayers.length,
					laterCount: laterPlayers.length,
					totalCount: readyPlayers.length + laterPlayers.length,
					readyPlayers,
					laterPlayers
				};
			}
		}
		return data;
	});

	let maxTotal = $derived.by(() => {
		let max = 1;
		for (const slot of Object.values(heatmapData)) {
			if (slot.totalCount > max) max = slot.totalCount;
		}
		return max;
	});

	let peakSlots = $derived.by(() => {
		const peak = Math.max(...Object.values(heatmapData).map((s) => s.totalCount));
		if (peak === 0) return new Set<string>();
		return new Set(
			Object.entries(heatmapData)
				.filter(([, s]) => s.totalCount === peak)
				.map(([key]) => key)
		);
	});

	function getHeatColor(slot: SlotData): string {
		if (slot.totalCount === 0) return 'transparent';
		const intensity = slot.totalCount / maxTotal;
		// Red channel from theme, with opacity based on intensity
		const readyRatio = slot.readyCount / slot.totalCount;
		// Blend between gold (later-heavy) and red (ready-heavy)
		if (readyRatio >= 0.5) {
			// More ready -> red tones
			const alpha = 0.15 + intensity * 0.85;
			return `rgba(196, 30, 58, ${alpha})`;
		}
		// More later -> gold tones
		const alpha = 0.15 + intensity * 0.85;
		return `rgba(201, 162, 39, ${alpha})`;
	}

	function getTextColor(slot: SlotData): string {
		if (slot.totalCount === 0) return 'var(--muted-foreground)';
		const intensity = slot.totalCount / maxTotal;
		if (intensity > 0.5) return '#f5f0e1';
		return 'var(--foreground)';
	}

	const DAY_SHORT_LABELS: Record<string, string> = {
		monday: 'Seg',
		tuesday: 'Ter',
		wednesday: 'Qua',
		thursday: 'Qui',
		friday: 'Sex',
		saturday: 'S\u00e1b',
		sunday: 'Dom'
	};
</script>

<div class="flex flex-col gap-2">
	<h2 class="font-display text-lg tracking-wide uppercase">
		Mapa de Calor &mdash; Disponibilidade
	</h2>
	<p class="text-xs text-muted-foreground">
		Intersec&ccedil;&atilde;o de hor&aacute;rios dispon&iacute;veis (prontos + interessados)
	</p>

	<div class="mt-2 overflow-x-auto">
		<table class="w-full border-collapse">
			<thead>
				<tr>
					<th class="border-2 border-border bg-muted px-2 py-2 text-xs font-bold uppercase">
						Hor&aacute;rio
					</th>
					{#each DAYS_OF_WEEK as day (day.key)}
						<th
							class="border-2 border-border bg-muted px-2 py-2 text-center text-xs font-bold uppercase"
						>
							{DAY_SHORT_LABELS[day.key]}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each TIME_SLOTS as time (time)}
					<tr>
						<td class="border-2 border-border bg-muted px-2 py-1.5 text-xs font-medium">
							{time}
						</td>
						{#each DAYS_OF_WEEK as day (day.key)}
							{@const key = makeSlotKey(day.key, time)}
							{@const slot = heatmapData[key]}
							{@const isPeak = peakSlots.has(key)}
							<td class="border-2 border-border p-0">
								<Tooltip.Root delayDuration={100}>
									<Tooltip.Trigger
										class="flex min-h-8 w-full cursor-default items-center justify-center px-1 py-1 text-center text-xs font-bold transition-colors {isPeak
											? 'ring-2 ring-gold ring-inset'
											: ''}"
										style="
											background-color: {getHeatColor(slot)};
											color: {getTextColor(slot)};
										"
										type="button"
									>
										{#if slot.totalCount > 0}
											<span>{slot.totalCount}</span>
											{#if slot.laterCount > 0}
												<span class="ml-0.5 text-[0.6rem] opacity-70">
													+{slot.laterCount}
												</span>
											{/if}
										{/if}
									</Tooltip.Trigger>
									<Tooltip.Content class="max-w-xs">
										<p class="mb-1 text-xs font-bold">
											{DAY_SHORT_LABELS[day.key]}
											{time}
											{#if isPeak}
												&mdash; Pico!
											{/if}
										</p>
										{#if slot.totalCount === 0}
											<p class="text-xs text-muted-foreground">Nenhum jogador dispon&iacute;vel</p>
										{:else}
											{#if slot.readyCount > 0}
												<p class="text-xs">
													<span class="font-bold" style="color: #c41e3a;"
														>Prontos ({slot.readyCount}):</span
													>
													{slot.readyPlayers.join(', ')}
												</p>
											{/if}
											{#if slot.laterCount > 0}
												<p class="mt-0.5 text-xs">
													<span class="font-bold" style="color: #c9a227;"
														>Mais tarde ({slot.laterCount}):</span
													>
													{slot.laterPlayers.join(', ')}
												</p>
											{/if}
										{/if}
									</Tooltip.Content>
								</Tooltip.Root>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Legend -->
	<div class="mt-3 flex flex-wrap items-center gap-4 text-xs">
		<div class="flex items-center gap-2">
			<span class="font-medium">Legenda:</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div
				class="h-4 w-4 border-2 border-border"
				style="background-color: rgba(196, 30, 58, 0.15);"
			></div>
			<span>Poucos</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div
				class="h-4 w-4 border-2 border-border"
				style="background-color: rgba(196, 30, 58, 0.55);"
			></div>
			<span>M&eacute;dio</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div
				class="h-4 w-4 border-2 border-border"
				style="background-color: rgba(196, 30, 58, 1);"
			></div>
			<span>Muitos</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div
				class="h-4 w-4 border-2 border-border"
				style="background-color: rgba(201, 162, 39, 0.55);"
			></div>
			<span>Maioria &quot;mais tarde&quot;</span>
		</div>
		<div class="flex items-center gap-1.5">
			<div class="h-4 w-4 border-2 border-border ring-2 ring-gold ring-inset"></div>
			<span>Pico</span>
		</div>
		<div class="text-muted-foreground">
			N&uacute;mero: total dispon&iacute;vel | <span class="opacity-70">+N</span>: inclui &quot;mais
			tarde&quot;
		</div>
	</div>
</div>
