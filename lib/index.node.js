'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

var bcu = require('bigint-crypto-utils')

/**
 * Class for a Paillier public key
 */
class PublicKey {
  /**
     * Creates an instance of class PublicKey
     * @param {bigint} n - the public modulo
     * @param {bigint} g - the public generator
     */
  constructor (n, g) {
    this.n = n
    this._n2 = this.n ** 2n // cache n^2
    this.g = g
  }

  /**
     * Get the bit length of the public modulo
     * @returns {number} - bit length of the public modulo
     */
  get bitLength () {
    return bcu.bitLength(this.n)
  }

  /**
     * Paillier public-key encryption
     *
     * @param {bigint} m - a bigint representation of a cleartext message
     * @param {bigint} [r] - the random integer factor for encryption. By default is a random in (1,n)
     *
     * @returns {bigint} - the encryption of m with this public key
     */
  encrypt (m, r = null) {
    if (r === null) {
      do {
        r = bcu.randBetween(this.n)
      } while (bcu.gcd(r, this.n) !== 1n)
    }
    return (bcu.modPow(this.g, m, this._n2) * bcu.modPow(r, this.n, this._n2)) % this._n2
  }

  encryptOtherNA (m, r, n2) {
    return (bcu.modPow(this.g, m, this._n2) * bcu.modPow(r, this.n, this._n2)) % n2
  }

  encryptOtherNB (m, r, n2) {
    return (bcu.modPow(this.g, m, n2) * bcu.modPow(r, this.n, this._n2)) % this._n2
  }

  encryptOtherNC (m, r, n2) {
    return (bcu.modPow(this.g, m, this._n2) * bcu.modPow(r, this.n, n2)) % this._n2
  }

  encryptOtherNF (m, r, n2) {
    return (bcu.modPow(this.g, m, this._n2) * bcu.modPow(r, this.n, n2)) % n2
  }

  encryptOtherND (m, r, n2) {
    return (bcu.modPow(this.g, m, n2) * bcu.modPow(r, this.n, n2)) % this._n2
  }

  encryptOtherNE (m, r, n2) {
    return (bcu.modPow(this.g, m, n2) * bcu.modPow(r, this.n, n2)) % this._n2
  }

  /**
     * Homomorphic addition
     *
     * @param {...bigint} ciphertexts - n >= 2 ciphertexts (c_1,..., c_n) that are the encryption of (m_1, ..., m_n) with this public key
     *
     * @returns {bigint} - the encryption of (m_1 + ... + m_2) with this public key
     */
  addition (...ciphertexts) {
    return ciphertexts.reduce((sum, next) => sum * next % (this._n2), 1n)
  }

  /**
     * Pseudo-homomorphic Paillier multiplication
     *
     * @param {bigint} c - a number m encrypted with this public key
     * @param {bigint | number} k - either a bigint or a number
     *
     * @returns {bigint} - the encryption of k·m with this public key
     */
  multiply (c, k) {
    return bcu.modPow(BigInt(c), BigInt(k), this._n2)
  }
}

/**
 * Class for Paillier private keys.
 */
class PrivateKey {
  /**
     * Creates an instance of class PrivateKey
     *
     * @param {bigint} lambda
     * @param {bigint} mu
     * @param {PublicKey} publicKey
     * @param {bigint} [p = null] - a big prime
     * @param {bigint} [q = null] - a big prime
     */
  constructor (lambda, mu, publicKey, p = null, q = null) {
    this.lambda = lambda
    this.mu = mu
    this._p = p || null
    this._q = q || null
    this.publicKey = publicKey
  }

  /**
     * Get the bit length of the public modulo
     * @returns {number} - bit length of the public modulo
     */
  get bitLength () {
    return bcu.bitLength(this.publicKey.n)
  }

  /**
     * Get the public modulo n=p·q
     * @returns {bigint} - the public modulo n=p·q
     */
  get n () {
    return this.publicKey.n
  }

  /**
   * Paillier private-key decryption
   *
   * @param {bigint} c - a bigint encrypted with the public key
   *
   * @returns {bigint} - the decryption of c with this private key
   */
  decrypt (c) {
    return (L(bcu.modPow(c, this.lambda, this.publicKey._n2), this.publicKey.n) * this.mu) % this.publicKey.n
  }

  /**
   * Recover the random factor used for encrypting a message with the complementary public key.
   * The recovery function only works if the public key generator g was using the simple variant
   * g = 1 + n
   *
   * @param {bigint} c - the encryption using the public of message m with random factor r
   *
   * @returns {bigint} - the random factor (mod n)
   *
   * @throws {RangeError} - Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true) )
   */
  getRandomFactor (c) {
    if (this.publicKey.g !== this.n + 1n) throw RangeError('Cannot recover the random factor if publicKey.g != publicKey.n + 1. You should generate yout keys using the simple variant, e.g. generateRandomKeys(3072, true) )')
    const m = this.decrypt(c)
    const phi = (this._p - 1n) * (this._q - 1n)
    const nInvModPhi = bcu.modInv(this.n, phi)
    const c1 = c * (1n - m * this.n) % this.publicKey._n2
    return bcu.modPow(c1, nInvModPhi, this.n)
  }
}

function L (a, n) {
  return (a - 1n) / n
}

function multiplyOtherN2 (c, k, n2) {
  return bcu.modPow(BigInt(c), BigInt(k), n2)
}

function generateDualG (n1, n2) {
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
async function generateRandomKeys (bitlength = 3072, simpleVariant = false) {
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
function generateRandomKeysSync (bitlength = 3072, simpleVariant = false) {
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
function keysFromPrimesSimple (p, q) {
  // let n, lambda, mu
  // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLength)
  const n = p * q

  // const n2 = n ** 2n
  const g = n + 1n
  const lambda = (p - 1n) * (q - 1n)
  const mu = bcu.modInv(lambda, n)

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
 * @param {bigint}  - g manual G
 *
 * @returns {KeyPair} - a {@link KeyPair} of public, private keys
 */
function keysFromPrimes (p, q, g) {
  // let n, lambda, mu
  // if p and q are bitLength/2 long ->  2**(bitLength - 2) <= n < 2**(bitLength)
  const n = p * q

  const n2 = n ** 2n
  g = g || getGenerator(n, n2)
  const lambda = bcu.lcm(p - 1n, q - 1n)
  const mu = bcu.modInv(L(bcu.modPow(g, lambda, n2), n), n)

  const publicKey = new PublicKey(n, g)
  const privateKey = new PrivateKey(lambda, mu, publicKey, p, q)
  return { publicKey, privateKey }
}

function getGenerator (n, n2) { // n2 = n*n
  const alpha = bcu.randBetween(n)
  const beta = bcu.randBetween(n)
  return ((alpha * n + 1n) * bcu.modPow(beta, n, n2)) % n2
}

exports.PrivateKey = PrivateKey
exports.PublicKey = PublicKey
exports.generateDualG = generateDualG
exports.generateRandomKeys = generateRandomKeys
exports.generateRandomKeysSync = generateRandomKeysSync
exports.keysFromPrimes = keysFromPrimes
exports.keysFromPrimesSimple = keysFromPrimesSimple
exports.multiplyOtherN2 = multiplyOtherN2
