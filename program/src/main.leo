import credits.leo;

// The 'program' program.
program aleo_name_service_v2.aleo {
    // Structure holding the ASCII bits of a domain name. If the length of the bits is less than 512,
    // zeros are appended in the end. The bits are then split into four parts, with n1 holding the
    // first 128 bits and n4 holding the last 128 bits.
    struct Name {
        data1: u128, // The first 128 bits of the ASCII domain name
        data2: u128, // The next 128 bits of the ASCII domain name
        data3: u128, // The next 128 bits of the ASCII domain name
        data4: u128 // The last 128 bits of the ASCII domain name
    }

    // base uri ascii bits. Include as many data pieces as necessary to encapsulate the uri. Padded with 0s at the end.
    struct BaseURI {
        data0: u128, // Part 1 of the base uri in bits. Bits should be the representation of the hexadecimal bytes for the ASCII text of the URL
        data1: u128,
        data2: u128,
        data3: u128
    }

    // Structure holding a name_hash and its type
    struct ResolverIndex {
        name: field, // The name_hash
        category: u128 // The type of the resolver, can contain 16 characters in maximum
    }

    struct TokenId {
        data1: u128, // data1 to data4 store the Name structure
        data2: u128,
        data3: u128,
        data4: u128,
        parent: field
    }

    record NFT {
        owner: address,
        data: TokenId,
        editon: scalar
    }

    // Mappings for different data structures
    mapping nft_owners: field => address;
    mapping has_sub_names: field => bool; // Mapping from a field to a bool indicating if it has sub names, key not exists means not registeed
    mapping names: field => TokenId; // Mapping from a field(hash name) to an TokenId structure
    mapping primary_names: address => field; // Mapping from an address to a primary name
    mapping resolvers: ResolverIndex => Name; // Mapping from a ResolverIndex structure to an Name structure(string)
    mapping general_settings: u8 => u128;
    mapping toggle_settings: u8 => u32;

    // Validate the ASCII bits of a domain name
    inline validate_name_bit(val: u128) -> bool {
        let mask: u128 = 255u128;
        for i: u8 in 0u8 .. 16u8 {
            let new: u128 = val.shr(i * 8u8);
            let b: u128 = new & mask;
            // Check if the ASCII bit is valid, 0-9, a-z, -, _
            if (! (b == 0u128 || b == 45u128 || b == 95u128 || (b >= 48u128 && b <= 57u128) || (b >= 97u128 && b <= 122u128))) {
                return false;
            }
        }
        return true;
    }

    function validate_name(name: Name) -> bool {
        // Check if the sum of the ASCII bits is zero
        let sum: u128 = name.data1 + name.data2 + name.data3 + name.data4;
        assert(sum != 0u128);
        let n1_valid: bool = validate_name_bit(name.data1);
        let n2_valid: bool = validate_name_bit(name.data2);
        let n3_valid: bool = validate_name_bit(name.data3);
        let n4_valid: bool = validate_name_bit(name.data4);
        return n1_valid && n2_valid && n3_valid && n4_valid;
    }

    transition initialize_collection(
        public total: u128,
        public symbol: u128,
        public base_uri: BaseURI,
    ) {
        assert_eq(self.caller, aleo1sr8d93usu395zc29qcl35ul2e7hl2538hl8pehe4ms88q4g70gxq3ffw0v);
        return then finalize(total, symbol, base_uri);
    }

    finalize initialize_collection(
        public total: u128,
        public symbol: u128,
        public base_uri: BaseURI,
    ) {
        // Ensure initialize cannot be called twice!
        let toggle_settings_status: u32 = toggle_settings.get_or_use(0u8, 0u32);
        let is_initialized: u32 = toggle_settings_status & 1u32;
        assert_eq(is_initialized, 0u32);

        general_settings.set(0u8, total); // This setting is for the Leo wallet, no real effect on the contract
        general_settings.set(1u8, total); // This setting is for the Leo wallet, no real effect on the contract
        general_settings.set(2u8, symbol); // Symbol for the NFT
        general_settings.set(3u8, base_uri.data0); // Base URI for NFT
        general_settings.set(4u8, base_uri.data1);
        general_settings.set(5u8, base_uri.data2);
        general_settings.set(6u8, base_uri.data3);
        // initialized flag = 0b0000...0001 = 1u32
        // minting flag = 0b0000...0010 = 2u32
        // frozen flag = 0b0000...1000 = 8u32
        // defaults -- not frozen, not minting, initialized
        // 0b0000...0001 = 1u32.
        toggle_settings.set(0u8, 1u32);
        toggle_settings.set(1u8, 0u32); // block height when mint is allowed
    }

    transition set_mint_block(public mint_block: u32) {
        assert_eq(self.caller, aleo1sr8d93usu395zc29qcl35ul2e7hl2538hl8pehe4ms88q4g70gxq3ffw0v);
        return then finalize(mint_block);
    }

    finalize set_mint_block(public mint_block: u32) {
        // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        toggle_settings.set(1u8, mint_block);
    }

    transition update_base_uri(public base_uri: BaseURI) {
        assert_eq(self.caller, aleo1sr8d93usu395zc29qcl35ul2e7hl2538hl8pehe4ms88q4g70gxq3ffw0v);
        return then finalize(base_uri);
    }

    finalize update_base_uri(public base_uri: BaseURI) {
        // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        general_settings.set(3u8, base_uri.data0); // Base URI for NFT
        general_settings.set(4u8, base_uri.data1);
        general_settings.set(5u8, base_uri.data2);
        general_settings.set(6u8, base_uri.data3);
    }

    // call this function to toggle minting, the whitelist requirement, or to permanently freeze the contract
    transition update_toggle_settings(public toggle_settings_bitstring: u32) {
        assert_eq(self.caller, aleo1sr8d93usu395zc29qcl35ul2e7hl2538hl8pehe4ms88q4g70gxq3ffw0v);
        return then finalize(toggle_settings_bitstring);
    }

    finalize update_toggle_settings(public toggle_settings_bitstring: u32) {
        // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        // Ensure updated settings are not uninitializing the collection.
        let still_initialized: u32 = toggle_settings_bitstring & 1u32;
        assert_eq(still_initialized, 1u32);

        toggle_settings.set(0u8, toggle_settings_bitstring);
    }

    transition register(
        name: Name,
        pay_record: credits.leo/credits
    ) -> NFT {
        // Validate the name before registration
        assert(validate_name(name));
        let receiver: address = aleo1sr8d93usu395zc29qcl35ul2e7hl2538hl8pehe4ms88q4g70gxq3ffw0v;
        let price: u64 = 5000000u64;
        credits.leo/transfer_private_to_public(pay_record, receiver, price);
        let token_id: TokenId = TokenId {
            data1: name.data1,
            data2: name.data2,
            data3: name.data3,
            data4: name.data4,
            parent: 0field
        };
        let name_hash: field = Poseidon2::hash_to_field(token_id);
        let nft: NFT = NFT {
            owner: self.caller,
            data: token_id,
            editon: 0scalar
        };
        return nft then finalize(name_hash);
    }

    finalize register(name_hash: field) {
        // Check if the name has already been registered
        assert_eq(has_sub_names.contains(name_hash), false);

        // Ensure mint block height is less than current block height
        let mint_block: u32 = toggle_settings.get(1u8);
        let passed_height_check: bool = mint_block <= block.height;
        assert_eq(passed_height_check, true);

        // Ensure minting is allowed, and is initialized,
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // frozen & minting & initialized flags = 0b0000...1011 = 11u32
        // what the settings should be = 0b0000...0011 = 3u32
        let collection_settings_met: u32 = toggle_settings_status & 11u32;
        assert_eq(collection_settings_met, 3u32);

        has_sub_names.set(name_hash, false);
    }

    transition register_sub(
        name: Name,
        parent: field
    ) -> NFT {
        // Validate the name before registration
        assert(validate_name(name));
        let token_id: TokenId = TokenId {
            data1: name.data1,
            data2: name.data2,
            data3: name.data3,
            data4: name.data4,
            parent: parent
        };
        let name_hash: field = Poseidon2::hash_to_field(token_id);
        let nft: NFT = NFT { owner: self.caller, data: token_id, editon: 0scalar};
        return nft then finalize(name_hash, parent, self.caller);
    }

    // Register subdomain of a name
    // The parent domain must public, and the caller must be the owner of the parent domain
    finalize register_sub(name_hash: field, parent: field, caller: address) {
        // Check if the callar is the owner of the parent name
        assert_eq(caller, nft_owners.get(parent));
        // Check if the name has already been registered
        assert_eq(has_sub_names.contains(name_hash), false);

        // Ensure mint block height is less than current block height
        let mint_block: u32 = toggle_settings.get(1u8);
        let passed_height_check: bool = mint_block <= block.height;
        assert_eq(passed_height_check, true);

        // Ensure minting is allowed, and is initialized,
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // frozen & minting & initialized flags = 0b0000...1011 = 11u32
        // what the settings should be = 0b0000...0011 = 3u32
        let collection_settings_met: u32 = toggle_settings_status & 11u32;
        assert_eq(collection_settings_met, 3u32);

        has_sub_names.set(name_hash, false);
        has_sub_names.set(parent, true);
    }

    // Proof that you own an nft without revealing the nft.
    // this never actually destroys the nft as the finalize
    // block is guaranteed to fail.
    transition authorize(
        nft: NFT
    )
    {
        return then finalize();
    }

    finalize authorize(
    )
    {
        // fails on purpose, so that the nft is not burned.
        assert_eq(0u8, 1u8);
    }

    // this will actually destroys the nft
    transition burn(
        nft: NFT
    )
    {
        let name_hash: field = Poseidon2::hash_to_field(nft.data);
        return then finalize(name_hash);
    }

    finalize burn(name_hash: field)
    {
        has_sub_names.remove(name_hash);
    }

    transition is_avaiable(
        name_hash: field
    ) -> bool {
        return then finalize(name_hash);
    }

    finalize is_avaiable(name_hash: field) {
        assert_eq(has_sub_names.contains(name_hash), false);
    }

    transition transfer_private(
        nft: NFT,
        private receiver: address
    ) -> NFT
    {
        return NFT {
            owner: receiver,
            data: nft.data,
            editon: 0scalar
        };
    }

    transition transfer_public(
        private receiver: address,
        private name_hash: field
    )
    {
        return then finalize(receiver, name_hash, self.caller);
    }

    finalize transfer_public(
        receiver: address,
        name_hash: field,
        caller: address
    )
    {
        assert_eq(caller, nft_owners.get(name_hash));
        nft_owners.set(name_hash, receiver);
    }

    transition convert_private_to_public(
        nft: NFT
    )
    {
        let name_hash: field = Poseidon2::hash_to_field(nft.data);
        return then finalize(self.caller, name_hash, nft.data);
    }

    finalize convert_private_to_public(
        public owner: address,
        public name_hash: field,
        public token_id: TokenId
    )
    {
        nft_owners.set(name_hash, owner);
        names.set(name_hash, token_id);
    }

    transition convert_public_to_private(
        private token_id: TokenId
    ) -> NFT
    {
        let name_hash: field = Poseidon2::hash_to_field(token_id);
        return NFT {
            owner: self.caller,
            data: token_id,
            editon: 0scalar
        } then finalize(self.caller, name_hash);
    }

    finalize convert_public_to_private(
        public owner: address,
        public name_hash: field
    )
    {
        assert_eq(owner, nft_owners.get(name_hash));
        nft_owners.remove(name_hash);
    }

    transition set_primary_name(name_hash: field) {
        return then finalize(name_hash, self.caller);
    }

    finalize set_primary_name(name_hash: field, owner: address) {
        assert_eq(owner, nft_owners.get(name_hash));

        primary_names.set(owner, name_hash);
    }

    // set resolver
    // category is the bits of the category string, u128 can store max of 16 caracters
    // for example, "btc" is 6517858u128, "eth" is 6845541u128, "twitter" is 32199698188695412u128
    transition set_resolver(name_hash: field, category: u128, content: Name) {
        assert(validate_name_bit(category));
        return then finalize(name_hash, self.caller, category, content);
    }

    finalize set_resolver(name_hash: field, owner: address, category: u128, content: Name) {
        assert_eq(owner, nft_owners.get(name_hash));

        let resolver_index: ResolverIndex = ResolverIndex { name: name_hash, category: category };
        resolvers.set(resolver_index, content);
    }
}
