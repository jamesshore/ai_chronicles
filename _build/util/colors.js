// Copyright Titanium I.T. LLC.

const COLOR_STYLES = {
	bold: "1;",
	dim: "2;",
	underline: "4;",
	blink: "5;",
	inverse: "7;",
};

// this brute-force approach works better with IDE code completion than building the object at run-time.
export const black = colorFn(30);
export const red = colorFn(31);
export const green = colorFn(32);
export const yellow = colorFn(33);
export const blue = colorFn(34);
export const purple = colorFn(35);
export const cyan = colorFn(36);
export const white = colorFn(37);
export const brightBlack = colorFn(90);
export const brightRed = colorFn(91);
export const brightGreen = colorFn(92);
export const brightYellow = colorFn(93);
export const brightBlue = colorFn(94);
export const brightPurple = colorFn(95);
export const brightCyan = colorFn(96);
export const brightWhite = colorFn(97);

function colorFn(color) {
	const fn = encodeFn("", color);
	combinatorialize(fn, "", color, COLOR_STYLES);
	return fn;

	function encodeFn(style, color) {
		return (text) => {
			return `\u001b[${style}${color}m${text}\u001b[0m`;
		};
	}

	function combinatorialize(fn, baseStyle, color, styles) {
		// adds .bold, .dim, etc. to fn, and does so recursively.
		Object.keys(styles).forEach(styleKey => {
			const myStyle = baseStyle + styles[styleKey];
			fn[styleKey] = encodeFn(myStyle, color);

			const remainingStyles = { ...styles };
			delete remainingStyles[styleKey];
			combinatorialize(fn[styleKey], myStyle, color, remainingStyles);
		});
	}
}
