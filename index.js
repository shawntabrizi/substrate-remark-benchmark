var { ApiPromise, WsProvider } = require('@polkadot/api');

// Main function which needs to run at start
async function main() {
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

  // Subscribe to new blocks being produced, not necessarily finalized ones.
  const unsubscribe = await api.rpc.chain.subscribeNewHeads(async header => {
    await api.rpc.chain.getBlock(header.hash, async block => {
      // Try to never crash
      try {
        // The block number
        let blockNumber = block.block.header.number.toNumber();
        // Extrinsics in the block
        let extrinsics = await block.block.extrinsics;

        console.log(`Block ${blockNumber} had ${extrinsics.length} extrinsics`);

        // // Check each extrinsic in the block
        // for (extrinsic of extrinsics) {
        //   // This specific call index [0,1] represents `system.remark`
        //   if (extrinsic.callIndex[0] == 0 && extrinsic.callIndex[1] == 1) {

        //   }
        // }
      } catch (e) {
        console.log(e);
      }
    });
  });
}

main().catch(console.error);
