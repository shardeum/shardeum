const crypto = require('@shardus/crypto-utils')
crypto.init('69fa4195670576c0160d660c3be36556ff8d504725be8a59b5a96509e0c994bc')

let keyPair = crypto.generateKeypair()

console.log(Utils.safeStringify(keyPair))
