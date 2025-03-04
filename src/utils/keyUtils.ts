export function keyListAsLeveledKeys(
  keyList: string[],
  securityLevel: number
): Record<string, number> {
  if (!keyList) {
    return {};
  }
  return keyList.reduce((acc, key) => {
    acc[key] = securityLevel;
    return acc;
  }, {} as Record<string, number>);
}