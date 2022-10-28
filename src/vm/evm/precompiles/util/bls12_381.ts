import { padToEven, BN } from 'ethereumjs-util'
import { VmError, ERROR } from '../../../exceptions'

// base field modulus as described in the EIP
const fieldModulus = new BN(
  '1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab',
  16
)

// convert an input Buffer to a mcl G1 point
// this does /NOT/ do any input checks. the input Buffer needs to be of length 128
// it does raise an error if the point is not on the curve.
function BLS12_381_ToG1Point(input: Buffer, mcl: any): any {
  const p_x = input.slice(16, 64).toString('hex')
  const p_y = input.slice(80, 128).toString('hex')

  const ZeroString48Bytes = '0'.repeat(96)
  if (p_x == p_y && p_x == ZeroString48Bytes) {
    return new mcl.G1()
  }

  const Fp_X = new mcl.Fp()
  const Fp_Y = new mcl.Fp()
  const One = new mcl.Fp()

  Fp_X.setStr(p_x, 16)
  Fp_Y.setStr(p_y, 16)
  One.setStr('1', 16)

  const G1 = new mcl.G1()

  G1.setX(Fp_X)
  G1.setY(Fp_Y)
  G1.setZ(One)

  if (!G1.isValidOrder()) {
    throw new VmError(ERROR.BLS_12_381_POINT_NOT_ON_CURVE)
  }

  // Check if these coordinates are actually on the curve.
  if (!G1.isValid()) {
    throw new VmError(ERROR.BLS_12_381_POINT_NOT_ON_CURVE)
  }

  return G1
}

// input: a mcl G1 point
// output: a 128-byte Buffer
function BLS12_381_FromG1Point(input: any): Buffer {
  // TODO: figure out if there is a better way to decode these values.
  const decodeStr = input.getStr(16) //return a string of pattern "1 <x_coord> <y_coord>"
  const decoded = decodeStr.match(/"?[0-9a-f]+"?/g) // match above pattern.

  if (decodeStr == '0') {
    return Buffer.alloc(128, 0)
  }

  // note: decoded[0] == 1
  const xval = padToEven(decoded[1])
  const yval = padToEven(decoded[2])

  // convert to buffers.

  const xBuffer = Buffer.concat([Buffer.alloc(64 - xval.length / 2, 0), Buffer.from(xval, 'hex')])
  const yBuffer = Buffer.concat([Buffer.alloc(64 - yval.length / 2, 0), Buffer.from(yval, 'hex')])

  return Buffer.concat([xBuffer, yBuffer])
}

// convert an input Buffer to a mcl G2 point
// this does /NOT/ do any input checks. the input Buffer needs to be of length 256
function BLS12_381_ToG2Point(input: Buffer, mcl: any): any {
  const p_x_1 = input.slice(0, 64)
  const p_x_2 = input.slice(64, 128)
  const p_y_1 = input.slice(128, 192)
  const p_y_2 = input.slice(192, 256)

  const ZeroBytes64 = Buffer.alloc(64, 0)
  // check if we have to do with a zero point
  if (
    p_x_1.equals(p_x_2) &&
    p_x_1.equals(p_y_1) &&
    p_x_1.equals(p_y_2) &&
    p_x_1.equals(ZeroBytes64)
  ) {
    return new mcl.G2()
  }

  const Fp2X = BLS12_381_ToFp2Point(p_x_1, p_x_2, mcl)
  const Fp2Y = BLS12_381_ToFp2Point(p_y_1, p_y_2, mcl)

  const FpOne = new mcl.Fp()
  FpOne.setStr('1', 16)

  const FpZero = new mcl.Fp()
  FpZero.setStr('0', 16)

  const Fp2One = new mcl.Fp2()

  Fp2One.set_a(FpOne)
  Fp2One.set_b(FpZero)

  const mclPoint = new mcl.G2()

  mclPoint.setX(Fp2X)
  mclPoint.setY(Fp2Y)
  mclPoint.setZ(Fp2One)

  if (!mclPoint.isValidOrder()) {
    throw new VmError(ERROR.BLS_12_381_POINT_NOT_ON_CURVE)
  }

  if (!mclPoint.isValid()) {
    throw new VmError(ERROR.BLS_12_381_POINT_NOT_ON_CURVE)
  }

  return mclPoint
}

// input: a mcl G2 point
// output: a 256-byte Buffer
function BLS12_381_FromG2Point(input: any): Buffer {
  // TODO: figure out if there is a better way to decode these values.
  const decodeStr = input.getStr(16) //return a string of pattern "1 <x_coord_1> <x_coord_2> <y_coord_1> <y_coord_2>"
  if (decodeStr == '0') {
    return Buffer.alloc(256, 0)
  }
  const decoded = decodeStr.match(/"?[0-9a-f]+"?/g) // match above pattern.

  // note: decoded[0] == 1
  const x_1 = padToEven(decoded[1])
  const x_2 = padToEven(decoded[2])
  const y_1 = padToEven(decoded[3])
  const y_2 = padToEven(decoded[4])

  // convert to buffers.

  const xBuffer1 = Buffer.concat([Buffer.alloc(64 - x_1.length / 2, 0), Buffer.from(x_1, 'hex')])
  const xBuffer2 = Buffer.concat([Buffer.alloc(64 - x_2.length / 2, 0), Buffer.from(x_2, 'hex')])
  const yBuffer1 = Buffer.concat([Buffer.alloc(64 - y_1.length / 2, 0), Buffer.from(y_1, 'hex')])
  const yBuffer2 = Buffer.concat([Buffer.alloc(64 - y_2.length / 2, 0), Buffer.from(y_2, 'hex')])

  return Buffer.concat([xBuffer1, xBuffer2, yBuffer1, yBuffer2])
}

// input: a 32-byte hex scalar Buffer
// output: a mcl Fr point

function BLS12_381_ToFrPoint(input: Buffer, mcl: any): any {
  const mclHex = mcl.fromHexStr(input.toString('hex'))
  const Fr = new mcl.Fr()
  Fr.setBigEndianMod(mclHex)
  return Fr
}

// input: a 64-byte buffer
// output: a mcl Fp point

function BLS12_381_ToFpPoint(fpCoordinate: Buffer, mcl: any): any {
  // check if point is in field
  if (new BN(fpCoordinate).gte(fieldModulus)) {
    throw new VmError(ERROR.BLS_12_381_FP_NOT_IN_FIELD)
  }

  const fp = new mcl.Fp()

  fp.setBigEndianMod(mcl.fromHexStr(fpCoordinate.toString('hex')))

  return fp
}

// input: two 64-byte buffers
// output: a mcl Fp2 point

function BLS12_381_ToFp2Point(fpXCoordinate: Buffer, fpYCoordinate: Buffer, mcl: any): any {
  // check if the coordinates are in the field
  if (new BN(fpXCoordinate).gte(fieldModulus)) {
    throw new VmError(ERROR.BLS_12_381_FP_NOT_IN_FIELD)
  }
  if (new BN(fpYCoordinate).gte(fieldModulus)) {
    throw new VmError(ERROR.BLS_12_381_FP_NOT_IN_FIELD)
  }

  const fp_x = new mcl.Fp()
  const fp_y = new mcl.Fp()

  const fp2 = new mcl.Fp2()
  fp_x.setStr(fpXCoordinate.slice(16).toString('hex'), 16)
  fp_y.setStr(fpYCoordinate.slice(16).toString('hex'), 16)

  fp2.set_a(fp_x)
  fp2.set_b(fp_y)

  return fp2
}

export {
  BLS12_381_ToG1Point,
  BLS12_381_FromG1Point,
  BLS12_381_ToG2Point,
  BLS12_381_FromG2Point,
  BLS12_381_ToFrPoint,
  BLS12_381_ToFpPoint,
  BLS12_381_ToFp2Point,
}
