program credits.aleo {
    // On-chain storage of an `account` map, with `address` as the key,
    // and `u64` as the value.
    mapping account: address => u64;

    record credits {
        // The token owner.
        owner: address,
        // The token amount.
        microcredits: u64,
    }

    // The function `transfer_private_to_public` turns a specified token amount from a token record into public tokens for the specified receiver.
    // This function preserves privacy for the sender's record, however it publicly reveals the token receiver and the token amount.
    transition transfer_private_to_public(sender: credits, public receiver: address, public amount: u64) -> credits {
        // Checks the given token record has a sufficient token amount.
        // This `sub` operation is safe, and the proof will fail if an underflow occurs.
        // `difference` holds the change amount for the caller.
        let difference: u64 = sender.microcredits - amount;

        // Produces a token record with the change amount for the caller.
        let remaining: credits = credits {
            owner: sender.owner,
            microcredits: difference,
        };

        // Output the sender's change record.
        // Increment the token amount publicly for the token receiver.
        return remaining then finalize(receiver, amount);
    }

    finalize transfer_private_to_public(public receiver: address, public amount: u64) {
        // Increments `account[receiver]` by `amount`.
        // If `account[receiver]` does not exist, it will be created.
        // If `account[receiver] + amount` overflows, `transfer_private_to_public` is reverted.
        let current_amount: u64 = Mapping::get_or_use(account, receiver, 0u64);
        Mapping::set(account, receiver, current_amount + amount);
    }

    // The function `transfer_private` sends the specified token amount to the token receiver from the specified token record.
    transition transfer_private(sender: credits, receiver: address, amount: u64) -> (credits, credits) {
        // Checks the given token record has sufficient balance.
        // This `sub` operation is safe, and the proof will fail if an overflow occurs.
        // `difference` holds the change amount to be returned to sender.
        let difference: u64 = sender.microcredits - amount;

        // Produce a token record with the change amount for the sender.
        let remaining: credits = credits {
            owner: sender.owner,
            microcredits: difference,
        };

        // Produce a token record for the specified receiver.
        let transferred: credits = credits {
            owner: receiver,
            microcredits: amount,
        };

        // Output the sender's change record and the receiver's record.
        return (remaining, transferred);
    }

}