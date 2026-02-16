<script lang="ts">
	import { getAuth } from '$lib/auth.svelte';
	import { page } from '$app/state';
	import { ClipboardList, Home, LogOut, Menu } from '@lucide/svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';

	const auth = getAuth();

	let { children } = $props();

	const navItems = [
		{ href: '/app', label: 'In\u00edcio', icon: Home },
		{ href: '/app/enquete', label: 'Enquete', icon: ClipboardList }
	];

	let currentPath = $derived(page.url.pathname);
</script>

{#if auth.isLoading}
	<div class="flex h-screen items-center justify-center">
		<p class="text-muted-foreground">Carregando...</p>
	</div>
{:else if !auth.isAuthenticated}
	<div class="flex h-screen flex-col items-center justify-center gap-4">
		<h1 class="text-2xl font-bold">Cartel Lucros Taxados</h1>
		<p class="text-muted-foreground">
			Voc&ecirc; precisa estar logado para acessar esta p&aacute;gina.
		</p>
		<div class="flex gap-2">
			<Button onclick={() => auth.signIn()}>Entrar</Button>
			<Button variant="outline" onclick={() => auth.signUp()}>Criar conta</Button>
		</div>
		<Button variant="link" href="/">Voltar para o in&iacute;cio</Button>
	</div>
{:else}
	<Sidebar.Provider>
		<Sidebar.Root>
			<Sidebar.Header class="p-4">
				<span class="text-sm font-bold">CLT Roster</span>
			</Sidebar.Header>
			<Sidebar.Content>
				<Sidebar.Group>
					<Sidebar.GroupLabel>Navega&ccedil;&atilde;o</Sidebar.GroupLabel>
					<Sidebar.GroupContent>
						<Sidebar.Menu>
							{#each navItems as item (item.href)}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton isActive={currentPath === item.href}>
										{#snippet child({ props })}
											<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- static routes -->
											<a href={item.href} {...props}>
												<item.icon class="size-4" />
												<span>{item.label}</span>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							{/each}
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			</Sidebar.Content>
			<Sidebar.Footer>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuButton {...props} class="w-full">
										<Avatar.Root class="size-6">
											{#if auth.user?.profilePictureUrl}
												<Avatar.Image
													src={auth.user.profilePictureUrl}
													alt={auth.user.firstName ?? 'Avatar'}
												/>
											{/if}
											<Avatar.Fallback class="text-xs">
												{(auth.user?.firstName?.[0] ?? auth.user?.email?.[0] ?? '?').toUpperCase()}
											</Avatar.Fallback>
										</Avatar.Root>
										<span class="truncate text-sm">
											{auth.user?.firstName ?? auth.user?.email ?? 'Usu\u00e1rio'}
										</span>
									</Sidebar.MenuButton>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content side="top" class="w-56">
								<DropdownMenu.Label>
									{auth.user?.email ?? ''}
								</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.Item onclick={() => auth.signOut()}>
									<LogOut class="mr-2 size-4" />
									Sair
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.Footer>
			<Sidebar.Rail />
		</Sidebar.Root>

		<Sidebar.Inset>
			<header class="flex h-12 items-center gap-2 border-b px-4">
				<Sidebar.Trigger>
					<Menu class="size-4" />
				</Sidebar.Trigger>
				<Separator orientation="vertical" class="h-4" />
				<h1 class="text-sm font-medium">
					{navItems.find((i) => currentPath.startsWith(i.href) && i.href !== '/app')?.label ??
						navItems.find((i) => currentPath === i.href)?.label ??
						''}
				</h1>
			</header>
			<main class="flex-1 overflow-auto p-4">
				{@render children()}
			</main>
		</Sidebar.Inset>
	</Sidebar.Provider>
{/if}
