import fs from 'node:fs'

const css = fs.readFileSync('src/App.css', 'utf8')
const lines = css.split('\n')
const sections = [
  ['app-shell.css', 0, 14],
  ['header.css', 14, 125],
  ['boot-sync.css', 126, 161],
  ['auth.css', 162, 332],
  ['icons.css', 333, 353],
  ['layout.css', 354, 377],
  ['calendar.css', 378, 703],
  ['tasks.css', 704, 1082],
  ['tooltip.css', 1083, 1125],
  ['modal.css', 1126, 1217],
  ['sidebar.css', 1218, 1339],
  ['backlog.css', 1340, 1491],
  ['assign-dialog.css', 1492, 1604],
  ['responsive.css', 1605, lines.length],
]

fs.mkdirSync('src/styles', { recursive: true })

for (const [name, start, end] of sections) {
  const content = `${lines.slice(start, end).join('\n').trimEnd()}\n`
  fs.writeFileSync(`src/styles/${name}`, content)
}

const imports = sections.map(([name]) => `@import './${name}';`).join('\n')
fs.writeFileSync('src/styles/index.css', `${imports}\n`)

console.log(`Split into ${sections.length} files`)
