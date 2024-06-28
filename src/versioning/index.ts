import { nestedCountersInstance } from '@shardus/core'
import { isEqualOrNewerVersion } from '../utils'
import { Migration as Migrate } from './types'

const appliedMigrations = new Set<string>()

/**
 * Called when the network account activeVersion is updated. It performs some
 * migrations to ensure all nodes have the same configuration for the current
 * version
 *
 * Throws an error if a migration in the migrations array does not have a corresponding
 * migration file
 *
 * @param newActiveVersion
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const onActiveVersionChange = async (newActiveVersion: string) => {
  // For future migrations, add a file under ./migrations and add the version here
  const migrations = ['1.9.1', '1.10.2', '1.11.2', '1.11.3']

  for (let index = 0; index < migrations.length; index++) {
    const migrationVersion = migrations[index] // eslint-disable-line security/detect-object-injection

    const { migrate } = (await import(`./migrations/${migrationVersion}`)) as { migrate: Migrate } // eslint-disable-line no-unsanitized/method

    const needsMigration =
      !appliedMigrations.has(migrationVersion) && isEqualOrNewerVersion(migrationVersion, newActiveVersion)

    if (needsMigration) {
      try {
        await migrate()
      } catch (error) {
        nestedCountersInstance.countEvent('migration-failed', `failed to apply migration ${migrationVersion}`)
      } finally {
        appliedMigrations.add(migrationVersion)
      }
    }
  }
}
