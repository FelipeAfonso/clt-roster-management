<script lang="ts">
	import { useAuthState, useAuthActions } from '$lib/auth.svelte';
	import { Button } from '$lib/components/ui/button';

	const auth = useAuthState();
	const authActions = useAuthActions();
</script>

<svelte:head>
	<title>Cartel Lucros Taxados</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Anton&family=Roboto+Condensed:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="relative min-h-screen overflow-x-hidden bg-cream">
	<!-- Background layers -->
	<div class="bg-burst pointer-events-none fixed inset-0 opacity-50"></div>
	<div class="bg-stripes pointer-events-none fixed inset-0"></div>
	<div class="bg-grain pointer-events-none fixed inset-0"></div>

	<!-- Main Content Container -->
	<main class="relative z-10 mx-auto max-w-7xl px-4 py-8 lg:px-8">
		<!-- Hero Section - Desktop: Side by side, Mobile: Stacked -->
		<section class="mb-8 grid items-end gap-8 lg:grid-cols-2 lg:gap-12">
			<!-- Goblin Image -->
			<div class="relative flex justify-center lg:justify-end">
				<div class="relative">
					<img
						src="/goblin_sam.webp"
						alt="O Cartel Precisa de Voc&ecirc;!"
						class="relative z-10 w-48 drop-shadow-[4px_4px_0_#8b1428] md:w-64 lg:w-80"
					/>
					<div
						class="absolute top-1/2 left-1/2 z-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(201,162,39,0.3),transparent_70%)] md:h-80 md:w-80"
					></div>
				</div>
			</div>

			<!-- Headlines -->
			<div class="text-center lg:text-left">
				<h1 class="leading-[0.9]">
					<span
						class="block font-display text-3xl tracking-[0.1em] text-black md:text-4xl lg:text-5xl"
					>
						O CARTEL
					</span>
					<span
						class="block font-display text-6xl text-red drop-shadow-[4px_4px_0_#1a1a1a] md:text-7xl lg:text-8xl"
					>
						PRECISA
					</span>
					<span
						class="block font-display text-6xl text-black drop-shadow-[4px_4px_0_#c41e3a] md:text-7xl lg:text-8xl"
					>
						DE VOC&Ecirc;!
					</span>
				</h1>
			</div>
		</section>

		<!-- Slogan Marquee -->
		<section class="relative z-10 -mx-4 overflow-hidden bg-red py-3 lg:-mx-8">
			<div class="animate-marquee flex w-max">
				{#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as idx (idx)}
					<span class="ml-2 font-display text-lg tracking-[0.15em] text-cream md:text-xl">
						ALISTE-SE HOJE &bull; GL&Oacute;RIA AO LOOT &bull;
					</span>
				{/each}
			</div>
		</section>

		<!-- Content Grid - Desktop: 3 columns, Mobile: stacked -->
		<section class="mt-8 grid gap-8 lg:grid-cols-3">
			<!-- Left Column: Convocação -->
			<div class="space-y-6">
				<div>
					<h2
						class="mb-3 border-b-[3px] border-black pb-2 font-display text-xl tracking-[0.1em] text-red md:text-2xl"
					>
						CONVOCA&Ccedil;&Atilde;O OFICIAL
					</h2>
					<p class="text-base leading-relaxed md:text-lg">
						O <strong class="text-red">CARTEL LUCROS TAXADOS</strong> convoca todos os trabalhadores de
						Azeroth para se juntarem &agrave;s nossas fileiras!
					</p>
				</div>

				<div>
					<h3 class="mb-3 font-display text-lg tracking-[0.1em] text-red md:text-xl">
						OBJETIVOS DO PARTIDO
					</h3>
					<ul class="space-y-2">
						<li class="flex items-center gap-3 border-b border-black/10 pb-2 text-base md:text-lg">
							<span class="text-xl text-red">&starf;</span>
							Conquista do HER&Oacute;ICO em Midnight
						</li>
						<li class="flex items-center gap-3 border-b border-black/10 pb-2 text-base md:text-lg">
							<span class="text-xl text-red">&starf;</span>
							Progress&atilde;o em MYTHIC+
						</li>
						<li class="flex items-center gap-3 border-b border-black/10 pb-2 text-base md:text-lg">
							<span class="text-xl text-red">&starf;</span>
							Comunidade AL&Eacute;M de WoW
						</li>
					</ul>
				</div>
			</div>

			<!-- Center Column: Stats + CTA -->
			<div class="space-y-6">
				<!-- Stats Row -->
				<div class="flex justify-center gap-4 bg-black p-4 md:gap-8 md:p-6">
					<div class="text-center">
						<span class="block font-display text-3xl text-cream md:text-4xl">2x</span>
						<span class="mt-1 block text-xs tracking-[0.15em] text-gold">POR SEMANA</span>
					</div>
					<div class="text-center">
						<span class="block font-display text-3xl text-cream md:text-4xl">2h30</span>
						<span class="mt-1 block text-xs tracking-[0.15em] text-gold">POR SESS&Atilde;O</span>
					</div>
					<div class="text-center">
						<span class="block font-display text-3xl text-cream md:text-4xl">100%</span>
						<span class="mt-1 block text-xs tracking-[0.15em] text-gold">CASUAL</span>
					</div>
				</div>

				<!-- CTA Box -->
				<div class="border-4 border-black bg-gradient-to-br from-red to-red-dark p-4 md:p-6">
					<div class="flex flex-col items-center gap-4 md:flex-row">
						<div class="flex-1 text-center text-cream md:text-left">
							<h2 class="font-display text-2xl tracking-[0.1em] md:text-3xl">N&Atilde;O ESPERE!</h2>
							<p class="mt-1 text-sm md:text-base">
								Entre para o Discord e assine sua carteira agora!
							</p>
						</div>
					</div>
					<div class="mt-4 flex flex-wrap justify-center gap-3">
						<Button
							href="https://discord.gg/xsBcqCQX"
							target="_blank"
							rel="noopener"
							variant="secondary"
							class="font-display text-base tracking-[0.1em]"
						>
							ASSINAR CARTEIRA
						</Button>
						<Button
							href="/enquete"
							variant="outline"
							class="border-cream font-display text-base tracking-[0.1em] text-cream hover:bg-cream/10"
						>
							RESPONDER ENQUETE
						</Button>
					</div>
				</div>
			</div>

			<!-- Right Column: Inclusion + Auth -->
			<div class="space-y-6">
				<!-- Inclusion Banner -->
				<div class="bg-black p-4 text-center md:p-6">
					<h3 class="mb-3 font-display text-lg tracking-[0.15em] text-gold md:text-xl">
						POL&Iacute;TICA DE INCLUS&Atilde;O
					</h3>
					<p class="text-sm text-cream md:text-base">
						O CARTEL aceita todos os g&ecirc;neros, origens e credos. Preconceito &eacute; crime
						contra o partido!
					</p>
					<p class="mt-2 text-sm font-bold text-red-bright md:text-base">
						PUNI&Ccedil;&Atilde;O: Kick + Blacklist + Maldi&ccedil;&atilde;o Vudu Eterna
					</p>
				</div>

				<!-- Auth Card for Existing Members -->
				<div class="border-4 border-black bg-cream p-4 md:p-6">
					<div class="mb-3 border-b-[3px] border-red pb-2 text-center">
						<h3 class="font-display text-lg tracking-[0.15em] text-black md:text-xl">
							J&Aacute; &Eacute; S&Oacute;CIO?
						</h3>
					</div>
					<p class="mb-4 text-center text-sm text-black/70 md:text-base">
						Acesse o painel administrativo do partido para gerenciar sua ficha.
					</p>
					{#if auth.isAuthenticated}
						<div class="flex flex-col gap-3">
							<Button href="/app" class="w-full font-display text-base tracking-[0.1em]">
								ACESSAR PAINEL
							</Button>
							<Button
								onclick={() => authActions.signOut()}
								variant="outline"
								class="w-full font-display text-sm tracking-[0.1em]"
							>
								SAIR DO SISTEMA
							</Button>
						</div>
					{:else}
						<Button
							onclick={() => authActions.signIn()}
							class="w-full font-display text-base tracking-[0.1em]"
						>
							ENTRAR NO SISTEMA
						</Button>
					{/if}
				</div>
			</div>
		</section>

		<!-- Fine Print -->
		<footer class="mt-8 border-t-[3px] border-black pt-6">
			<div class="mb-2 font-display text-sm tracking-[0.15em] text-red">
				INFORMA&Ccedil;&Otilde;ES DO PARTIDO
			</div>
			<p class="text-xs text-black/60">
				[1] CLT = Cartel Lucros Taxados. Nenhum v&iacute;nculo com leis trabalhistas reais. Nenhum
				direito garantido em Azeroth.
			</p>
			<p class="mt-1 text-xs text-black/60">
				[2] A Diretoria n&atilde;o se responsabiliza por wipes em +2, Gnomos usados como
				proj&eacute;teis, ou crises existenciais durante progress&atilde;o.
			</p>
		</footer>
	</main>
</div>
