var { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
var { cryptoWaitReady } = require('@polkadot/util-crypto');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function which needs to run at start
async function main() {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });

  // Substrate node we are connected to and listening to remarks
  const provider = new WsProvider('ws://localhost:9944');
  //const provider = new WsProvider('wss://kusama-rpc.polkadot.io/');
  //const provider = new WsProvider('wss://cc3-5.kusama.network/');

  const api = await ApiPromise.create({ provider });

  // Add account with URI
  let account = keyring.addFromUri('//Alice', { name: 'Alice default' });
  // Add account with Polkadot JS JSON
  // let input_json = require('./account.json');
  // await keyring.addFromJson(input_json);
  // await keyring.getPair(input_json.address).decodePkcs8('password');
  // let account = keyring.getPair(input_json.address);

  // Get general information about the node we are connected to
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);
  console.log(
    `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
  );

  let accountNonce = await api.query.system.accountNonce(account.address);

  // Total number of transactions to send
  let total_transactions = 1000000;

  // How many transactions to send out at once
  let tx_batch_size = 3;
  // How long to pause before the next batch (ms).
  let pause_time = 100;

  for (let i = 0; i < total_transactions; i += 1) {
    try {
      let txNonce = parseInt(accountNonce) + parseInt(i);

      // Send a batch of transactions then pause
      if (i % tx_batch_size == 0) {
        await sleep(pause_time);
      }

      const unsub = await api.tx.system
        .remark('')
        .signAndSend(account, { nonce: txNonce }, async function(result) {
          console.log(`${i}: Current status is ${result.status}`);

          if (result.status.isFinalized) {
            console.log(
              `${i}: Transaction included at blockHash ${result.status.asFinalized}`
            );
            // Unsubscribe from sign and send.
            unsub();
          }
        });
    } catch (e) {
      console.error(e);
      // Update account nonce
      accountNonce = await api.query.system.accountNonce(account.address);
    }
  }
}

main().catch(console.error);
