import fs from 'fs'
import { FilePaths } from '../shardeum/shardeumFlags'
import { Utils } from '@shardeum-foundation/lib-types'

export let operatorCLIVersion = ''
export let operatorGUIVersion = ''

export function readOperatorVersions(): { operatorCLIVersion: string; operatorGUIVersion: string } {
  let cliVersion = ''
  let guiVersion = ''
  
  // Read the operator version from the CLI
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const operatorCLIPackageJson = Utils.safeJsonParse(fs.readFileSync(FilePaths.CLI_PACKAGE).toString())
    cliVersion = operatorCLIPackageJson.version || ''
  } catch (e) {
    cliVersion = ''
  }

  // Read the operator version from the GUI
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const operatorGUIPackageJson = Utils.safeJsonParse(fs.readFileSync(FilePaths.GUI_PACKAGE).toString())
    guiVersion = operatorGUIPackageJson.version || ''
  } catch (e) {
    guiVersion = ''
  }

  // Update the module-level variables
  operatorCLIVersion = cliVersion
  operatorGUIVersion = guiVersion

  return { operatorCLIVersion: cliVersion, operatorGUIVersion: guiVersion }
}
