export enum SQLDataTypes {
  STRING = 'TEXT',
  TEXT = 'TEXT',
  INTEGER = 'INTEGER',
  SMALLINT = 'INTEGER',
  BIGINT = 'INTEGER',
  BOOLEAN = 'NUMERIC',
  FLOAT = 'REAL',
  DOUBLE = 'REAL',
  DATE = 'NUMERIC',
  JSON = 'JSON',
}

export type ColumnDescription = {
  type: string
  allowNull?: boolean
  primaryKey?: boolean
  unique?: boolean
}
