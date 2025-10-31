export const t = (strings: TemplateStringsArray, ...expr: any[]) =>
	strings.reduce((acc, s, i) => acc + s + (i < expr.length ? String(expr[i]) : ''), '').trim()
