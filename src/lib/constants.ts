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

export const WOW_CLASS_COLORS_BY_ID: Record<number, string> = {
	1: '#C69B3A',
	2: '#F58CBA',
	3: '#ABD473',
	4: '#FFF569',
	5: '#FFFFFF',
	6: '#C41F3B',
	7: '#0070DE',
	8: '#69CCF0',
	9: '#9482C9',
	10: '#00FF96',
	11: '#FF7D0A',
	12: '#A330C9',
	13: '#40C7EB'
};

export const GEAR_SLOT_ORDER = [
	'HEAD',
	'NECK',
	'SHOULDER',
	'BACK',
	'CHEST',
	'WRIST',
	'HANDS',
	'WAIST',
	'LEGS',
	'FEET',
	'FINGER_1',
	'FINGER_2',
	'TRINKET_1',
	'TRINKET_2',
	'MAIN_HAND',
	'OFF_HAND'
];

export const GEAR_SLOT_LABELS: Record<string, string> = {
	HEAD: 'Cabe\u00e7a',
	NECK: 'Pesco\u00e7o',
	SHOULDER: 'Ombros',
	BACK: 'Costas',
	CHEST: 'Peitoral',
	WRIST: 'Pulso',
	HANDS: 'M\u00e3os',
	WAIST: 'Cintura',
	LEGS: 'Pernas',
	FEET: 'P\u00e9s',
	FINGER_1: 'Anel 1',
	FINGER_2: 'Anel 2',
	TRINKET_1: 'Talism\u00e3 1',
	TRINKET_2: 'Talism\u00e3 2',
	MAIN_HAND: 'M\u00e3o Principal',
	OFF_HAND: 'M\u00e3o Secund\u00e1ria'
};
