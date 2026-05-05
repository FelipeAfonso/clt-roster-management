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

// Specs por classe (chaves em pt-BR para casar com WOW_CLASSES; valores em ingl\u00eas
// por conven\u00e7\u00e3o usada na comunidade brasileira de WoW).
export const WOW_SPECS_BY_CLASS: Record<WowClass, readonly string[]> = {
	'Cavaleiro da Morte': ['Blood', 'Frost', 'Unholy'],
	'Ca\u00e7ador de Dem\u00f4nios': ['Havoc', 'Vengeance', 'Devourer'],
	Druida: ['Balance', 'Feral', 'Guardian', 'Restoration'],
	Conjurante: ['Devastation', 'Preservation', 'Augmentation'],
	'Ca\u00e7ador': ['Beast Mastery', 'Marksmanship', 'Survival'],
	Mago: ['Arcane', 'Fire', 'Frost'],
	Monge: ['Brewmaster', 'Mistweaver', 'Windwalker'],
	Paladino: ['Holy', 'Protection', 'Retribution'],
	Sacerdote: ['Discipline', 'Holy', 'Shadow'],
	Ladino: ['Assassination', 'Outlaw', 'Subtlety'],
	'Xam\u00e3': ['Elemental', 'Enhancement', 'Restoration'],
	Bruxo: ['Affliction', 'Demonology', 'Destruction'],
	Guerreiro: ['Arms', 'Fury', 'Protection']
};

export function specsForClass(cls: string): readonly string[] {
	return WOW_SPECS_BY_CLASS[cls as WowClass] ?? [];
}

export const ROSTER_ROLES = [
	'Tank',
	'Healer',
	'Flex Healer',
	'DPS a Dist\u00e2ncia',
	'DPS Corpo a Corpo'
] as const;

export type RosterRole = (typeof ROSTER_ROLES)[number];

export const ACTIVITY_OPTIONS = [
	{ value: 'raider', label: 'Raider' },
	{ value: 'monday_only', label: 'Só Segunda' },
	{ value: 'thursday_only', label: 'Só Quinta' },
	{ value: 'mythic_plus_pusher', label: 'M+ Pusher' },
	{ value: 'sometimes', label: 'Às Vezes' },
	{ value: 'inactive', label: 'Inativo' },
	{ value: 'full', label: 'Full' }
] as const;

export type Activity = (typeof ACTIVITY_OPTIONS)[number]['value'];

export const ACTIVITY_LABEL_MAP: Record<string, string> = Object.fromEntries(
	ACTIVITY_OPTIONS.map((o) => [o.value, o.label])
);

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
