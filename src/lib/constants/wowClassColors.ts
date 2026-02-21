import type { WowClass } from '$lib/constants';

/**
 * Official WoW class colors (hex) mapped to Brazilian Portuguese class names.
 * Source: https://wowpedia.fandom.com/wiki/Class_colors
 */
export const WOW_CLASS_COLORS: Record<WowClass, string> = {
	'Cavaleiro da Morte': '#C41E3A',
	'Ca\u00e7ador de Dem\u00f4nios': '#A330C9',
	Druida: '#FF7C0A',
	Conjurante: '#33937F',
	'Ca\u00e7ador': '#AAD372',
	Mago: '#3FC7EB',
	Monge: '#00FF98',
	Paladino: '#F48CBA',
	Sacerdote: '#FFFFFF',
	Ladino: '#FFF468',
	'Xam\u00e3': '#0070DD',
	Bruxo: '#8788EE',
	Guerreiro: '#C69B6D'
};

/**
 * Classes whose hex color is too light for white/light backgrounds.
 * These need special treatment (dark text, visible border).
 */
const LIGHT_CLASSES: WowClass[] = ['Sacerdote', 'Ladino'];

/**
 * Returns the appropriate text color (black or white) for a given class color
 * to ensure readability.
 */
export function getClassTextColor(wowClass: WowClass): string {
	return LIGHT_CLASSES.includes(wowClass) ? '#1a1a1a' : '#ffffff';
}

/**
 * Returns a CSS-friendly border color for light classes that would otherwise
 * be invisible against light backgrounds.
 */
export function getClassBorderColor(wowClass: WowClass): string {
	return LIGHT_CLASSES.includes(wowClass) ? '#1a1a1a' : WOW_CLASS_COLORS[wowClass];
}

/**
 * Returns a CSS text-shadow value appropriate for the class color.
 * Light classes (Priest, Rogue) get a heavy multi-layered dark shadow
 * so the label text remains readable on any background.
 */
export function getClassTextShadow(wowClass: WowClass): string {
	if (LIGHT_CLASSES.includes(wowClass)) {
		return '0 0 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.9)';
	}
	return '0 0 2px rgba(0,0,0,0.5)';
}
