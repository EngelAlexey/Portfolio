(() => {
	const scope = '.sf, .sf-overlay, dialog[open], .cm-tooltip';
	const controls = 'button, a[href], summary, [role="button"], [role="menuitem"], [role="tab"], [role="option"], label, legend, .sf-help, .sf-bubble-text, .sf-relate-preview, .sf-relate-warning, .sf-palette-hint, .sf-palette-empty, .sf-palette-group-title, .sf-finder-hint, .sf-finder-none, .sf-row-more';
	const canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	const context = canvas.getContext('2d', { willReadFrequently: true });

	const rgba = (css) => {
		context.clearRect(0, 0, 1, 1);
		context.fillStyle = '#000';
		context.fillStyle = css;
		context.fillRect(0, 0, 1, 1);
		const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
		return { r, g, b, a: a / 255 };
	};

	const over = (top, base) => ({
		r: top.r * top.a + base.r * (1 - top.a),
		g: top.g * top.a + base.g * (1 - top.a),
		b: top.b * top.a + base.b * (1 - top.a),
		a: 1
	});

	const background = (element) => {
		const layers = [];
		for (let node = element; node; node = node.parentElement) {
			const color = rgba(getComputedStyle(node).backgroundColor);
			if (color.a > 0) layers.push(color);
			if (color.a >= 0.999) break;
		}
		return layers.reduceRight((base, layer) => over(layer, base), { r: 255, g: 255, b: 255, a: 1 });
	};

	const channel = (value) => {
		const s = value / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	const luminance = ({ r, g, b }) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
	const ratio = (a, b) => {
		const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
		return (high + 0.05) / (low + 0.05);
	};

	const visible = (element) => {
		const box = element.getBoundingClientRect();
		const style = getComputedStyle(element);
		return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
	};

	const owners = (control) => {
		const found = new Set();
		const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
		for (let node = walker.nextNode(); node; node = walker.nextNode()) {
			if (node.textContent.trim() && node.parentElement && visible(node.parentElement)) found.add(node.parentElement);
		}
		return [...found];
	};

	const describe = (element) => {
		const classes = [...element.classList].slice(0, 3).join('.');
		const action = element.dataset.action || element.dataset.tool || '';
		return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ''}${action ? `[${action}]` : ''}`;
	};

	const seen = new Set();
	const failures = [];
	let checked = 0;
	for (const control of document.querySelectorAll(controls)) {
		if (seen.has(control) || !control.closest(scope) || control.disabled || control.getAttribute('aria-disabled') === 'true' || !visible(control)) continue;
		seen.add(control);
		for (const owner of owners(control)) {
			const style = getComputedStyle(owner);
			const base = background(owner);
			const text = over(rgba(style.color), base);
			const size = parseFloat(style.fontSize);
			const large = size >= 24 || (Number(style.fontWeight) >= 700 && size >= 18.66);
			const needed = large ? 3 : 4.5;
			const value = ratio(text, base);
			checked++;
			if (value < needed) failures.push({ control: describe(control), text: owner.textContent.trim().slice(0, 30), ratio: Math.round(value * 100) / 100, needed });
		}
	}

	const theme = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark (system)' : 'light (system)');
	return JSON.stringify({ theme, width: innerWidth, checked, failed: failures.length, failures });
})()
