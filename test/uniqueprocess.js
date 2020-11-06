const _pkg = require('../lib/index.node')
const chai = require('chai')
// <--

const bcu = require('bigint-crypto-utils')

async function test () {
  var t = Date.now()
  const bitSize = 32
  var key1 = await _pkg.generateRandomKeys(bitSize)//3072
  var key2 = await _pkg.generateRandomKeys(bitSize)
  // 99381809994539659796150025039002442890n
  var commonG = _pkg.generateDualG(bcu.max(key1.publicKey.n, key2.publicKey.n), bcu.min(key1.publicKey._n2, key2.publicKey._n2))
  key1 = _pkg.keysFromPrimes(key1.privateKey._p, key1.privateKey._q, commonG)// 3072
  key2 = _pkg.keysFromPrimes(key2.privateKey._p, key2.privateKey._q, commonG)// 3072

//   key2 = _pkg.keysFromPrimes(5384241119n, 3318976091n, 99381809994539659796150025039002442890n)// 3072
//   key1 = _pkg.keysFromPrimes(4402246181n, 3965006653n, 99381809994539659796150025039002442890n)// 3072
  console.log("_pkg.keysFromPrimes("+key1.privateKey._p+", "+key1.privateKey._1+", )");
  console.log("_pkg.keysFromPrimes("+key2.privateKey._p+", "+key2.privateKey._1+", )");
  
  console.log(key2.publicKey.n - key1.publicKey.n)
  var nDiff = key2.publicKey.n - key1.publicKey.n
  var nDiff2 = key2.publicKey._n2 - key1.publicKey._n2
  var min_N = bcu.min(key1.publicKey.n, key2.publicKey.n)
  var max_N = bcu.max(key1.publicKey.n, key2.publicKey.n)
  var g2 = 224654617019937347829780904830903736603n
  var multiplier = bcu.randBetween(max_N, max_N / 2n)// 115042541n //1577390195004483534n
  
  var start_value = bcu.randBetween(max_N/ 2n, max_N / 4n)//115042541n //10343936545358346415n
  var encrypted1 = key1.publicKey.encrypt(start_value, g2)
  var encrypted2 = key2.publicKey.encrypt(start_value, g2)
  console.log('Timer ms:', Date.now() - t); t = Date.now()
  console.log(encrypted1, encrypted2)
  console.log(key1.privateKey.decrypt(encrypted1), key2.privateKey.decrypt(encrypted2))

  for (var i = 0; i < 50; i++) {
    // encrypted1 = key1.publicKey.multiply(encrypted1, multiplier)
    encrypted1 = key1.publicKey.addition(encrypted1, key1.publicKey.encrypt(multiplier, g2))
    // encrypted2 = key2.publicKey.multiply(encrypted2, multiplier)//_pkg.multiplyOtherN2(encrypted2, multiplier, key1.publicKey._n2);
    //encrypted2 = key2.publicKey.addition(encrypted2, key2.publicKey.encryptOtherNA(multiplier, g2, min_N * min_N))
    encrypted2 = key2.publicKey.addition(encrypted2, key2.publicKey.encrypt(multiplier, g2, min_N * min_N))
    var dec1 = key1.privateKey.decrypt(encrypted1)
    var dec2 = key2.privateKey.decrypt(encrypted2)
    var isInv = (dec1 - dec2) >= nDiff
    var diffPick = nDiff
    console.log(i,
        (dec1 == dec2), dec1, dec2, dec1-dec2,
        (dec1-dec2) / diffPick,
        ((dec1-dec2) % diffPick) == 0,
        // (dec1-dec2)/ multiplier,
        // (dec1-dec2) % multiplier
        // ,
         encrypted1, encrypted2
        ,(encrypted1-encrypted2) / diffPick
        ) 
        
  }

  console.log('Timer ms:', Date.now() - t); t = Date.now()
  // console.log(key1, key2,commonG)
  // paillierBigint.keysFromPrimes(
  //     122009864698315368365167214258684670454171111953598444392343444313714145457830604667267388390841463549796980241274261174176175359177905061195230071833985445986194366950503655600652129058084698770578962747495370991827013777982573435194782479956342441637366355883784225553602993319381452026428318854835611285607n,
  //     104370450007200224254763121150593427374586721175751191171020694587561712299857012305601914501572391994297011844872259506945742146007150030352934042048808028845859516213168386889382634084954880742383377914773084389474170505630090472645801356165463420476289486226389348168949144103055857805759357402564117133567n
  // );
}

test()
