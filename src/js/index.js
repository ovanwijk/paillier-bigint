import * as bcu from 'bigint-crypto-utils'
import PublicKey from './PublicKey'
import PrivateKey, { L } from './PrivateKey'

export { default as PublicKey } from './PublicKey'
export { default as PrivateKey } from './PrivateKey'

export function multiplyOtherN2 (c, k, n2) {
  return bcu.modPow(BigInt(c), BigInt(k), n2)
}

export function generateDualG (n1, n2) {
  var r = 0
  do {
    r = bcu.randBetween(n1)
  } while (bcu.gcd(r, n1) !== 1n && bcu.gcd(r, n2) !== 1n)
  return r
}

/**
 * @typedef {Object} KeyPair
 * @property {PublicKey} publicKey - a Paillier's public key
 * @property {PrivateKey} privateKey - the associated Paillier's private key
 */

/**
 * Generates a pair private, public key for the Paillier cryptosystem.
 *
 * @param {number} [bitlength = 3072] - the bit length of the public modulo
 * @param {boolean} [simplevariant = false] - use the simple variant to compute the generator (g=n+1). This is REQUIRED if you want to be able to recover the random integer factor used when encrypting with the public key
 *
 * @returns {Promise<KeyPair>} - a promise that resolves to a {@link KeyPair} of public, private keys
 */
export async function generateRandomKeys (bitlength = 3072, simpleVariant = false) {
  let p, q, n, g, lambda, mu
  // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLength)
  do {
    p = await bcu.prime(Math.floor(bitlength / 2) + 1)
    q = await bcu.prime(Math.floor(bitlength / 2))
    n = p * q
  } while (q === p || bcu.bitLength(n) !== bitlength)

  if (simpleVariant === true) {
    // If using p,q of equivalent length, a simpler variant of the key
    // generation steps would be to set
    // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
    g = n + 1n
    lambda = (p - 1n) * (q - 1n)
    mu = bcu.modInv(lambda, n)
  } else {
    const n2 = n ** 2n
    g = getGenerator(n, n2)
    lambda = bcu.lcm(p - 1n, q - 1n)
    mu = bcu.modInv(L(bcu.modPow(g, lambda, n2), n), n)
  }

  const publicKey = new PublicKey(n, g)
  const privateKey = new PrivateKey(lambda, mu, publicKey, p, q)
  return { publicKey, privateKey }
}

/**
 * Generates a pair private, public key for the Paillier cryptosystem in synchronous mode.
 * Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.
 *
 * @param {number} [bitlength = 3072] - the bit length of the public modulo
 * @param {boolean} [simplevariant = false] - use the simple variant to compute the generator (g=n+1)
 *
 * @returns {KeyPair} - a {@link KeyPair} of public, private keys
 */
export function generateRandomKeysSync (bitlength = 3072, simpleVariant = false) {
  let p, q, n, g, lambda, mu
  // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLength)
  do {
    p = bcu.primeSync(Math.floor(bitlength / 2) + 1)
    q = bcu.primeSync(Math.floor(bitlength / 2))
    n = p * q
  } while (q === p || bcu.bitLength(n) !== bitlength)

  if (simpleVariant === true) {
    // If using p,q of equivalent length, a simpler variant of the key
    // generation steps would be to set
    // g=n+1, lambda=(p-1)(q-1), mu=lambda.invertm(n)
    g = n + 1n
    lambda = (p - 1n) * (q - 1n)
    mu = bcu.modInv(lambda, n)
  } else {
    const n2 = n ** 2n
    g = getGenerator(n, n2)
    lambda = bcu.lcm(p - 1n, q - 1n)
    mu = bcu.modInv(L(bcu.modPow(g, lambda, n2), n), n)
  }

  const publicKey = new PublicKey(n, g)
  const privateKey = new PrivateKey(lambda, mu, publicKey, p, q)
  return { publicKey, privateKey }
}

/**
 * Generates a pair private, public key for the Paillier cryptosystem in synchronous mode.
 * Synchronous mode is NOT RECOMMENDED since it won't use workers and thus it'll be slower and may freeze thw window in browser's javascript.
 *
 * @param {bigint}  - p prime
 * @param {bigint}  - q prime
 * @param {boolean} [simplevariant = false] - use the simple variant to compute the generator (g=n+1)
 *
 * @returns {KeyPair} - a {@link KeyPair} of public, private keys
 */
export function keysFromPrimes (p, q, g) {
  let n, lambda, mu
  // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLength)
  n = p * q

  const n2 = n ** 2n
  g = g || getGenerator(n, n2)
  lambda = bcu.lcm(p - 1n, q - 1n)
  mu = bcu.modInv(L(bcu.modPow(g, lambda, n2), n), n)

  const publicKey = new PublicKey(n, g)
  const privateKey = new PrivateKey(lambda, mu, publicKey, p, q)
  return { publicKey, privateKey }
}

function getGenerator (n, n2) { // n2 = n*n
  const alpha = bcu.randBetween(n)
  const beta = bcu.randBetween(n)
  return ((alpha * n + 1n) * bcu.modPow(beta, n, n2)) % n2
}
