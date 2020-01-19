var { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
var { cryptoWaitReady } = require('@polkadot/util-crypto');

// Main function which needs to run at start
async function main() {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });
  // Substrate node we are connected to and listening to remarks
  const provider = new WsProvider('ws://localhost:9944');
  //const provider = new WsProvider('wss://kusama-rpc.polkadot.io/');

  const api = await ApiPromise.create({ provider });

  // Get general information about the node we are connected to
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);
  console.log(
    `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
  );

  // Add account with URI
  let account = keyring.addFromUri('//Alice', { name: 'Alice default' });
  // Add account with Polkadot JS JSON
  // let input_json = require('./account.json');
  // await keyring.addFromJson(input_json);
  // await keyring.getPair(input_json.address).decodePkcs8('password');
  // let account = keyring.getPair(input_json.address);

  // Subscribe to new blocks being produced, not necessarily finalized ones.
  const unsubscribe = await api.rpc.chain.subscribeNewHeads(async header => {
    await api.rpc.chain.getBlock(header.hash, async block => {
        // The block number
        let blockNumber = block.block.header.number.toNumber();
        // Extrinsics in the block
		let extrinsics = await block.block.extrinsics;
		// Current account nonce:
		let accountNonce = await api.query.system.accountNonce(account.address);

        console.log(`Block ${blockNumber} had ${extrinsics.length} extrinsics and Alice has nonce ${accountNonce}`);

        let promises = [];
        let tx_batch_size = 400;
        // Create transactions
        for (let i = 0; i < tx_batch_size; i += 1) {
          let txNonce = parseInt(accountNonce) + parseInt(i);
          promises.push(
            api.tx.system.remark('').signAndSend(account, { nonce: txNonce })
          );
        }
		Promise.all(promises)
    });
  });
}

// Suppress error messages from RPC Core
console.error = function() {}

main().catch(console.error);
