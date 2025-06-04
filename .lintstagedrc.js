module.exports = {
	// TypeScript files
	'*.{ts,tsx}': [
		'eslint --fix',
		'prettier --write',
		'jest --bail --findRelatedTests --passWithNoTests',
	],

	// JSON files
	'*.json': ['prettier --write'],

	// Markdown files
	'*.md': ['prettier --write'],

	// YAML files
	'*.{yml,yaml}': ['prettier --write'],

	// Docker files
	'Dockerfile*': ['prettier --write'],

	// Package.json
	'package.json': [
		'prettier --write',
		// Verificar que las dependencias estén ordenadas
		'npx sort-package-json',
	],
};
