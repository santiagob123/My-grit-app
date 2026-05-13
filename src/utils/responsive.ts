import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Basamos nuestros cálculos en un diseño estándar de iPhone 11/13 (375px de ancho)
const baseWidth = 375;
const baseHeight = 812;

const widthScale = SCREEN_WIDTH / baseWidth;
const heightScale = SCREEN_HEIGHT / baseHeight;

/**
 * Escala un tamaño basado en el ancho de la pantalla.
 * Ideal para: Iconos, márgenes horizontales, anchos de botones.
 */
export const scale = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * widthScale));

/**
 * Escala un tamaño basado en el alto de la pantalla.
 * Ideal para: Alturas de contenedores, márgenes verticales.
 */
export const verticalScale = (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * heightScale));

/**
 * Escala un tamaño de forma moderada. 
 * Ideal para: Fuentes. Evita que en tablets el texto sea gigantesco.
 */
export const moderateScale = (size: number, factor = 0.5) => 
  Math.round(PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor));

export { SCREEN_WIDTH, SCREEN_HEIGHT };
