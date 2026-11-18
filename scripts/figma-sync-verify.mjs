import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const planPath = resolve(root, '.figma/run-plan.json')
const resultPath = resolve(root, '.figma/sync-result.json')
const summaryPath = resolve(root, '.figma/sync-summary.md')

if (!existsSync(planPath)) throw new Error('Missing .figma/run-plan.json')
if (!existsSync(resultPath)) throw new Error('Missing .figma/sync-result.json')

const plan = JSON.parse(readFileSync(planPath, 'utf8'))
const result = JSON.parse(readFileSync(resultPath, 'utf8'))
const errors = []

if (!['success', 'noop', 'failed'].includes(result.status)) errors.push(`Invalid status: ${result.status}`)
if (plan.syncRequired && result.status !== 'success') errors.push(`Synchronization required but result status is ${result.status}`)

const reportedTargets = new Set(result.targets ?? [])
for (const target of plan.targets) {
  if (!reportedTargets.has(target)) errors.push(`Missing target in result: ${target}`)
}

const screenTargets = plan.targets.filter((target) => ['dashboard', 'inventoryList', 'productDetailModal'].includes(target))
for (const target of screenTargets) {
  const screenshot = (result.screenshots ?? []).find((item) => item.target === target)
  if (!screenshot) errors.push(`Missing screenshot validation: ${target}`)
  else if (screenshot.status !== 'pass') errors.push(`Screenshot validation did not pass: ${target}`)
}

const lines = [
  '# Figma synchronization result',
  '',
  `- Status: **${errors.length ? 'failed' : result.status}**`,
  `- Targets: ${plan.targets.length ? plan.targets.join(', ') : 'none'}`,
  `- Changed files: ${plan.changedFiles.length}`,
  `- Summary: ${result.summary ?? 'No summary provided.'}`,
  '',
  '## Changed nodes',
  '',
  ...((result.changedNodes?.length ?? 0) ? result.changedNodes.map((item) => `- ${item.target} / ${item.nodeId}: ${item.change}`) : ['- None']),
  '',
  '## Screenshot checks',
  '',
  ...((result.screenshots?.length ?? 0) ? result.screenshots.map((item) => `- ${item.target} / ${item.nodeId}: **${item.status}** - ${item.notes}`) : ['- None']),
  '',
  '## Warnings',
  '',
  ...((result.warnings?.length ?? 0) ? result.warnings.map((warning) => `- ${warning}`) : ['- None']),
]

if (errors.length) {
  lines.push('', '## Verification errors', '', ...errors.map((error) => `- ${error}`))
}

writeFileSync(summaryPath, `${lines.join('\n')}\n`)

if (process.env.GITHUB_STEP_SUMMARY) {
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`, { flag: 'a' })
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log(`Figma synchronization verified: ${result.status}`)
