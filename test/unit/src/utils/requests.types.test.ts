import { getUserIp, unsafeGetClientIp } from '../../../../src/utils/requests'

// Utility types for compile-time assertions
// Equal compares two types for equality
// Assert will fail to compile if the condition is false

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assertGetUserIp: Equal<ReturnType<typeof getUserIp>, string | null> = true
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assertUnsafeGetClientIp: Equal<ReturnType<typeof unsafeGetClientIp>, string | null> = true

test('type checks for getUserIp and unsafeGetClientIp', () => {
  // runtime assertion just to satisfy Jest
  expect(true).toBe(true)
})
