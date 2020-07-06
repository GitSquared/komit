#!/usr/bin/env node
const fs = require('fs')
const cp = require('child_process')
const path = require('path')
const { forceStdinTty } = require('force-stdin-tty')
const { prompt } = require('enquirer')
const c = require('ansi-colors')
const pkg = require('./package.json')

const msgPath = path.resolve(process.cwd(), process.argv[process.argv.length - 1])
const scopesRc = path.resolve(process.cwd(), '.commitscopesrc')

const scopes = []

let type, scope, headerPrefix, maxTitleLength

process.stdout.write(c.bold('\n👮 Welcome to Komit\n') + c.dim(`v${pkg.version}\n\n`))

let overwroteStdin = false
try {
	overwroteStdin = forceStdinTty()
} catch {
	process.stdout.write(c.bold.red("⚠️  Komit couldn't access your stdin stream.\n"))
	process.exit(1)
}

try {
	fs.readFileSync(scopesRc, {
		encoding: 'utf8'
	}).split('\n').forEach(line => {
		if (line.startsWith('#') || line.trim().length === 0) return
		scopes.push(line.toLowerCase().trim().replace(/ /g, '-'))
	})
} catch(error) {
	// ignore
}

function scopeSuggest(input, choices) {
	let newPrompt = true
	const list = choices.filter(ch => {
		if (ch.name === 'new' || ch.name === '(unscoped)') return false

		const test = ch.message.toLowerCase()
		if (test === input.toLowerCase().trim().replace(/ /g, '-')) {
			newPrompt = false
		}

		return test.includes(input.toLowerCase().trim().replace(/ /g, '-'))
	})

	if (newPrompt && input) {
		list.push({
			name: 'new',
			normalized: true,
			message: `🏷️ New scope: ${input.toLowerCase().trim().replace(/ /g, '-')}`,
			value: input.toLowerCase().trim().replace(/ /g, '-')
		})
	}

	if (input.length === 0) {
		list.unshift({
			name: '(unscoped)',
			normalized: true,
			message: '(unscoped)',
			value: '(unscoped)'
		})
	}

	return list
}

prompt([
	{
		type: 'autocomplete',
		name: 'type',
		message: 'Commit type:',
		choices: [
			'build',
			'ci',
			'chore',
			'docs',
			'feat',
			'fix',
			'perf',
			'refactor',
			'revert',
			'style',
			'test'
		],
		result: result => {
			type = result
			return result
		}
	},
	{
		type: 'autocomplete',
		name: 'scope',
		message: 'Scope:',
		choices: [
			'(unscoped)',
			...scopes
		],
		suggest: scopeSuggest,
		result: result => {
			scope = result
			headerPrefix = `${type}${(scope !== '(unscoped)') ? `(${scope})` : ''}: `
			maxTitleLength = 100 - headerPrefix.length
			return result
		}
	},
	{
		type: 'input',
		name: 'title',
		message: 'Title:',
		validate: title => {
			if (title.length === 0) {
				return 'Commit title cannot be empty!'
			}
			if (title.length > maxTitleLength) {
				return `Title is too long (${title.length}/${maxTitleLength}) characters)`
			}
			if (title[0].charCodeAt(0) !== title[0].toLowerCase().charCodeAt(0)) {
				return 'Title must start in lowercase'
			}
			if (title[title.length - 1] === '.') {
				return 'Title cannot end with a full stop "."'
			}
			return true
		}
	}
]).then(answer => {
	if (answer.scope !== '(unscoped)' && !scopes.includes(answer.scope)) {
		scopes.push(answer.scope)
		fs.writeFileSync(scopesRc, scopes.join('\n'))
		process.stdout.write(c.dim('Updated commit scopes file at .commitscopesrc, adding file to commit.\n'))
		cp.execSync(`git add ${scopesRc}`, {
			cwd: process.cwd()
		})
	}

	const commitHeader = `${headerPrefix}${answer.title}`
	process.stdout.write(
		'\n' +
		c.bold.green(type) +
		(scope !== '(unscoped)' ? `(${c.italic.blue(scope)}): ` : ': ') +
		c.bold.underline(answer.title) +
		'\n'
	)

	fs.writeFileSync(msgPath, commitHeader)

	if (overwroteStdin) {
		process.stdin.destroy()
	}

	process.exit(0)
}).catch(error => {

	if (overwroteStdin) {
		process.stdin.destroy()
	}

	if (error !== '') {
		process.stdout.write(c.bold.red(`${error}\n`))
		process.exit(1)
	} else {
		process.stdout.write('\nGot SIGINT, bypassing prompts...\n')
		process.exit(0)
	}
})
