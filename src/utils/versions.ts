import fs from 'fs'

export let operatorCLIVersion = ''
export let operatorGUIVersion = ''

export function readOperatorVersions(): { operatorCLIVersion: string; operatorGUIVersion: string } {
  // Read the operator version from the CLI
  try {
    const operatorCLIPackageJson = JSON.parse(fs.readFileSync('/home/node/app/cli/package.json').toString())
    operatorCLIVersion = operatorCLIPackageJson.version
  } catch (e) {
    operatorCLIVersion = ''
  }

  // Read the operator version from the GUI
  try {
    const operatorGUIPackageJson = JSON.parse(fs.readFileSync('/home/node/app/gui/package.json').toString())
    operatorGUIVersion = operatorGUIPackageJson.version
  } catch (e) {
    operatorGUIVersion = ''
  }

  return { operatorCLIVersion, operatorGUIVersion }
}
