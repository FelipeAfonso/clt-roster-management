<script lang="ts">
	import { WOW_CLASSES, type WowClass } from '$lib/constants';
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
		raidStatus: string;
	};

	let { responses }: { responses: PollResponse[] } = $props();

	let interestedResponses = $derived(responses.filter((r) => r.raidStatus !== 'not_interested'));

	type ClassEntry = {
		name: WowClass;
		count: number;
		players: string[];
		color: string;
		textColor: string;
		borderColor: string;
		textShadow: string;
	};

	let classData = $derived.by(() => {
		const entries: ClassEntry[] = WOW_CLASSES.map((cls) => {
			const players = interestedResponses.filter((r) => r.classes.includes(cls)).map((r) => r.name);
			return {
				name: cls,
				count: players.length,
				players,
				color: WOW_CLASS_COLORS[cls],
				textColor: getClassTextColor(cls),
				borderColor: getClassBorderColor(cls),
				textShadow: getClassTextShadow(cls)
			};
		});
		return entries.sort((a, b) => b.count - a.count);
	});

	let maxCount = $derived(Math.max(...classData.map((c) => c.count), 1));
</script>

<div class="flex flex-col gap-2">
	<h2 class="font-display text-lg tracking-wide uppercase">Classes Dispon&iacute;veis</h2>
	<p class="text-xs text-muted-foreground">
		Distribui&ccedil;&atilde;o de classes entre jogadores interessados ({interestedResponses.length} jogadores)
	</p>

	<div class="mt-2 flex flex-col gap-1.5">
		{#each classData as entry (entry.name)}
			{@const widthPercent = maxCount > 0 ? (entry.count / maxCount) * 100 : 0}
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<div {...props} class="group flex items-center gap-3">
							<span
								class="w-44 shrink-0 truncate text-right text-sm font-medium"
								style="color: {entry.color}; text-shadow: {entry.textShadow};"
							>
								{entry.name}
							</span>

							<div class="relative h-7 flex-1">
								<div
									class="absolute inset-y-0 left-0 flex items-center border-2 transition-all duration-300"
									style="
										width: {widthPercent}%;
										min-width: {entry.count > 0 ? '2rem' : '0'};
										background-color: {entry.color};
										border-color: {entry.borderColor};
										opacity: {entry.count > 0 ? 1 : 0.15};
									"
								>
									{#if entry.count > 0}
										<span class="px-2 text-xs font-bold" style="color: {entry.textColor};">
											{entry.count}
										</span>
									{/if}
								</div>
								{#if entry.count === 0}
									<div class="absolute inset-y-0 left-0 flex w-full items-center">
										<span class="px-2 text-xs text-muted-foreground">&mdash;</span>
									</div>
								{/if}
							</div>
						</div>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content side="right" class="max-w-xs">
						{#if entry.count > 0}
							<p class="mb-1 text-xs font-bold" style="color: {entry.color};">
								{entry.name} ({entry.count})
							</p>
							<p class="text-xs">{entry.players.join(', ')}</p>
						{:else}
							<p class="text-xs text-muted-foreground">
								Nenhum jogador selecionou {entry.name}
							</p>
						{/if}
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		{/each}
	</div>
</div>
