const transactionBlock = TransactionBlock.from(sponsorSignedTransaction?.transactionBlockBytes);
    const transactionDigest = await transactionBlock.getDigest();
    transactionList.push({
      action,
      transactionHash: transactionDigest,
    });
    if (setTransactionList) {
      setTransactionList(transactionList);
    }

    let senderSignedTransaction;
    try {
      senderSignedTransaction = await wallet.signTransactionBlock({
        transactionBlock,
      });
    } catch (err) {
      setTransactionResult(transactionDigest, 2);
    }
    const provider = createSuiProvider();

    const executeResponse = await provider.executeTransactionBlock({
      transactionBlock: sponsorSignedTransaction?.transactionBlockBytes,
      signature: [sponsorSignedTransaction?.signatureBytes, senderSignedTransaction.signature],
      options: { showEffects: true },
      requestType: 'WaitForLocalExecution',
    });

    writeTransactionList(transactionList, 3);
    const result = await waitForTransactionConfirmation(executeResponse.digest);
    setTransactionResult(
      executeResponse.digest,
      executeResponse?.effects.status.status === 'failure' ? 2 : 1,
    );
    if (executeResponse?.effects.status.status === 'failure') {
      throw new Error('Transaction Failed');
    }
    ReactGA.event({
      category: 'Users',
      action: 'sui_sponsor_transaction_completed',
    });
    return result;
  };
