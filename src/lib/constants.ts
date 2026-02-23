export const WOW_CLASSES = [
	'Cavaleiro da Morte',
	'Ca\u00e7ador de Dem\u00f4nios',
	'Druida',
	'Conjurante',
	'Ca\u00e7ador',
	'Mago',
	'Monge',
	'Paladino',
	'Sacerdote',
	'Ladino',
	'Xam\u00e3',
	'Bruxo',
	'Guerreiro'
] as const;

export type WowClass = (typeof WOW_CLASSES)[number];

export const ROLES = ['Tank', 'Healer', 'DPS a Dist\u00e2ncia', 'DPS Corpo a Corpo'] as const;

export type Role = (typeof ROLES)[number];

export const RAID_STATUSES = ['ready', 'later', 'not_interested'] as const;

export type RaidStatus = (typeof RAID_STATUSES)[number];

export const RAID_STATUS_LABELS: Record<RaidStatus, string> = {
	ready: 'Vou come\u00e7ar a upar dia 03/03 e estarei pronto pra raid at\u00e9 16/03',
	later: 'Interessado, mas s\u00f3 consigo depois de 16/03',
	not_interested: 'N\u00e3o tenho interesse em raidar'
};

export const DAYS_OF_WEEK = [
	{ key: 'monday', label: 'Segunda' },
	{ key: 'tuesday', label: 'Ter\u00e7a' },
	{ key: 'wednesday', label: 'Quarta' },
	{ key: 'thursday', label: 'Quinta' },
	{ key: 'friday', label: 'Sexta' },
	{ key: 'saturday', label: 'S\u00e1bado' },
	{ key: 'sunday', label: 'Domingo' }
] as const;

export type DayKey = (typeof DAYS_OF_WEEK)[number]['key'];

export function generateTimeSlots(): string[] {
	const slots: string[] = [];
	// 18:00 to 23:30 (same day)
	for (let hour = 18; hour <= 23; hour++) {
		slots.push(`${hour.toString().padStart(2, '0')}:00`);
		slots.push(`${hour.toString().padStart(2, '0')}:30`);
	}
	// 00:00 to 01:30 (next day)
	for (let hour = 0; hour <= 1; hour++) {
		slots.push(`${hour.toString().padStart(2, '0')}:00`);
		slots.push(`${hour.toString().padStart(2, '0')}:30`);
	}
	return slots;
}

export const TIME_SLOTS = generateTimeSlots();

export function makeSlotKey(day: string, time: string): string {
	return `${day}-${time}`;
}

export const LOCAL_STORAGE_KEY = 'clt-poll-player-name';
