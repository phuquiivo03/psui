import { useState } from 'react';
import { TransactionBlock } from '@mysten/sui';
import { toB64 } from '@mysten/bcs';
import { useSignTransaction } from '@mysten/dapp-kit';
import { enokiClient } from '../lib/enokiClient';
import { PACKAGE_ID, NETWORK } from '../config';

export function useCreateCounterSponsored() {
  const { mutateAsync: signTransaction } = useSignTransaction();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSponsored(initialValue: number) {
    setLoading(true);
    setError(null);

    try {
      const tx = new TransactionBlock();
      tx.moveCall({
        target: `${PACKAGE_ID}::counter::create`,
        arguments: [tx.pure(initialValue)],
      });

      const txBytes = await tx.build({ client: /* SuiClient */, onlyTransactionKind: true });
      const sponsored = await enokiClient.createSponsoredTransaction({
        network: NETWORK,
        transactionKindBytes: toB64(txBytes),
        sender: /* your user address */,
        allowedMoveCallTargets: [`${PACKAGE_ID}::counter::create`],
        allowedAddresses: [ /* maybe user address */ ],
      });

      const { signature } = await signTransaction({ transaction: tx });
      await enokiClient.executeSponsoredTransaction({
        digest: sponsored.digest,
        signature,
      });

      return sponsored;
    } catch (err: any) {
      setError(err.message ?? 'Sponsored tx failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    runSponsored,
    loading,
    error,
  };
}