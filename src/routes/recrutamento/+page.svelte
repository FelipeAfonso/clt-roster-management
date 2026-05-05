<script lang="ts">
	import RecruitmentForm from '$lib/components/recruitment/RecruitmentForm.svelte';
</script>

<svelte:head>
	<title>Candidatura | Cartel Lucros Taxados</title>
	<meta
		name="description"
		content="Candidate-se ao Cartel Lucros Taxados. Conte um pouco sobre voc&ecirc;, sua experi&ecirc;ncia e por que quer entrar na guilda."
	/>
</svelte:head>

<div class="mx-auto max-w-2xl p-4">
	<header class="mb-6">
		<h1 class="text-2xl font-bold">Candidatura ao CLT</h1>
		<p class="mt-2 text-sm text-muted-foreground">
			Cartel Lucros Taxados &mdash; preencha os passos abaixo para se candidatar. Levam cerca de
			5&ndash;10 minutos. Seus dados ficam salvos no navegador, ent&atilde;o voc&ecirc; pode pausar
			e voltar depois.
		</p>
	</header>

	<RecruitmentForm />
</div>
