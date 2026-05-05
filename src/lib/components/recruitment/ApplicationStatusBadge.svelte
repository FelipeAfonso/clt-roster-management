<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import {
		STATUS_LABELS,
		STATUS_VARIANTS,
		type ApplicationStatus
	} from '$lib/constants/recruitment';

	let {
		status
	}: {
		status: ApplicationStatus;
	} = $props();
</script>

<Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
