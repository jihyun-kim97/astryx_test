import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = process.cwd()
const mapPath = resolve(root, '.figma/sync-map.json')
const planPath = resolve(root, '.figma/run-plan.json')
const resultPath = resolve(root, '.figma/sync-result.json')
const syncMap = JSON.parse(readFileSync(mapPath, 'utf8'))

const force = /^(1|true|yes)$/i.test(process.env.FIGMA_SYNC_FORCE ?? '')
const baseSha = process.env.FIGMA_SYNC_BASE_SHA?.trim()
const headSha = process.env.FIGMA_SYNC_HEAD_SHA?.trim() || 'HEAD'

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

function changedFiles() {
  if (force) return syncMap.watch.map((entry) => entry.glob)
  if (process.env.FIGMA_SYNC_CHANGED_FILES) {
    return process.env.FIGMA_SYNC_CHANGED_FILES.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
  }
  try {
    if (baseSha && !/^0+$/.test(baseSha)) {
      return git(['diff', '--name-only', '--diff-filter=ACMR', baseSha, headSha]).split(/\r?\n/).filter(Boolean)
    }
    return git(['show', '--pretty=', '--name-only', '--diff-filter=ACMR', headSha]).split(/\r?\n/).filter(Boolean)
  } catch (error) {
    throw new Error(`Unable to determine changed files: ${error.message}`)
  }
}

function globToRegExp(glob) {
  let pattern = '^'

  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index]

    if (character === '*' && glob[index + 1] === '*') {
      const followedBySlash = glob[index + 2] === '/'
      pattern += followedBySlash ? '(?:.*/)?' : '.*'
      index += followedBySlash ? 2 : 1
    } else if (character === '*') {
      pattern += '[^/]*'
    } else if (character === '?') {
      pattern += '[^/]'
    } else {
      pattern += character.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    }
  }

  return new RegExp(`${pattern}$`)
}

const files = [...new Set(changedFiles().map((file) => file.replaceAll('\\', '/')))].sort()
const matched = []
const targets = new Set()

for (const rule of syncMap.watch) {
  const regex = globToRegExp(rule.glob)
  const matches = files.filter((file) => regex.test(file))
  if (!matches.length && !force) continue
  rule.targets.forEach((target) => targets.add(target))
  matched.push({ glob: rule.glob, files: matches, targets: rule.targets, reason: rule.reason })
}

const plan = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  force,
  baseSha: baseSha || null,
  headSha,
  changedFiles: files,
  matchedRules: matched,
  targets: [...targets],
  syncRequired: targets.size > 0,
  figma: syncMap.figma,
}

writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`)

if (!plan.syncRequired) {
  writeFileSync(resultPath, `${JSON.stringify({
    status: 'noop',
    summary: 'No mapped UI or design-system files changed.',
    targets: [],
    changedNodes: [],
    screenshots: [],
    warnings: [],
  }, null, 2)}\n`)
}

const output = process.env.GITHUB_OUTPUT
if (output) {
  appendFileSync(output, `sync_required=${plan.syncRequired}\n`)
  appendFileSync(output, `targets=${JSON.stringify(plan.targets)}\n`)
  appendFileSync(output, `changed_count=${plan.changedFiles.length}\n`)
}

console.log(JSON.stringify(plan, null, 2))
