import credits.leo;

// The 'program' program.
program aleo_name_service_v0.aleo {
    // Structure holding an address and its associated index
    struct AddressIndex {
        addr: address, // The address
        index: u64, // The index associated with the address
    }

    // Structure holding the ASCII bits of a domain name. If the length of the bits is less than 512,
    // zeros are appended in the front. The bits are then split into four parts, with n1 holding the
    // first 128 bits and n4 holding the last 128 bits.
    struct Name {
        n1: u128, // The first 128 bits of the ASCII domain name
        n2: u128, // The next 128 bits of the ASCII domain name
        n3: u128, // The next 128 bits of the ASCII domain name
        n4: u128 // The last 128 bits of the ASCII domain name
    }

    struct FullName {
        name: Name,
        parent: scalar
    }

    // Structure holding an address, its associated index, and a domain name.
    struct ANS {
        addr: address, // The address
        index: u64, // The index associated with the address
        name: Name, // The domain name
        parent: scalar
    }

    // Structure holding a name_hash and its type
    struct ResolverIndex {
        name: scalar, // The name_hash
        category: u128 // The type of the resolver, can contain 16 characters in maximum
    }

    struct OwnIndex {
        index: u64,
        count: u64
    }

    // Mappings for different data structures
    mapping names: scalar => ANS; // Mapping from a scalar(hash name) to an ANS structure
    mapping own_names: AddressIndex => scalar; // Mapping from an AddressIndex structure to a hash scalar
    mapping own_indies: address => OwnIndex; // Mapping from an address to an index
    mapping primary_names: address => scalar; // Mapping from an address to a primary name
    mapping resolvers: ResolverIndex => Name; // Mapping from a ResolverIndex structure to an Name structure(string)

    // Validate the ASCII bits of a domain name
    inline validate_name_bit(val: u128) -> bool {
        let mask: u128 = 255u128;
        for i: u8 in 0u8..16u8 {
            let new: u128 = val.shr(i * 8u8);
            let b: u128 = new & mask;
            // Check if the ASCII bit is valid, 0-9, a-z, -, _
            if (!(b == 0u128 || b == 45u128 || b == 95u128 || (b >= 48u128 && b <= 57u128) || (b >= 97u128 && b <= 122u128))) {
                return false;
            }
        }
        return true;
    }

    function validate_name(name: Name) -> bool {
        // Check if the sum of the ASCII bits is zero
        let sum: u128 = name.n1 + name.n2 + name.n3 + name.n4;
        assert(sum != 0u128);
        let n1_valid: bool = validate_name_bit(name.n1);
        let n2_valid: bool = validate_name_bit(name.n2);
        let n3_valid: bool = validate_name_bit(name.n3);
        let n4_valid: bool = validate_name_bit(name.n4);
        return n1_valid && n2_valid && n3_valid && n4_valid;
    }

    transition register(public name: Name, pay_record: credits.leo/credits) -> (public scalar, credits.leo/credits) {
        // Validate the name before registration
        assert(validate_name(name));
        let receiver: address = aleo1sr8d93usu395zc29qcl35ul2e7hl2538hl8pehe4ms88q4g70gxq3ffw0v;
        let price: u64 = 5000000u64;
        let remaining: credits = credits.leo/transfer_private_to_public(pay_record, receiver, price);
        let full_name: FullName = FullName {name: name, parent: 0scalar};
        let name_hash: scalar = Poseidon2::hash_to_scalar(full_name);
        return (name_hash, remaining) then finalize(name_hash, full_name, self.caller);
    }

    finalize register(name_hash: scalar, full_name: FullName, owner: address) {
        // Check if the name has already been registered
        assert_eq(Mapping::contains(names, name_hash), false);

        let own_index: OwnIndex = Mapping::get_or_use(own_indies, owner, OwnIndex {index: 0u64, count: 0u64});
        let address_index: AddressIndex = AddressIndex {addr: owner, index: own_index.index};
        Mapping::set(own_names, address_index, name_hash);
        Mapping::set(own_indies, owner, OwnIndex {index: own_index.index + 1u64, count: own_index.count + 1u64});

        let ans: ANS = ANS {addr: owner, index: own_index.index, name: full_name.name, parent: full_name.parent};
        Mapping::set(names, name_hash, ans);
    }

    transition register_sub(public name: Name, public parent: scalar, pay_record: credits.leo/credits) -> (public scalar, credits.leo/credits) {
        // Validate the name before registration
        assert(validate_name(name));
        let receiver: address = aleo1sr8d93usu395zc29qcl35ul2e7hl2538hl8pehe4ms88q4g70gxq3ffw0v;
        let price: u64 = 1000000u64;
        let remaining: credits = credits.leo/transfer_private_to_public(pay_record, receiver, price);
        let full_name: FullName = FullName {name: name, parent: parent};
        let name_hash: scalar = Poseidon2::hash_to_scalar(full_name);
        return (name_hash, remaining) then finalize(name_hash, full_name, self.caller);
    }

    finalize register_sub(name_hash: scalar, full_name: FullName, owner: address) {
        // Check if the parent name has already been registered by the owner
        assert_eq(Mapping::get(names, full_name.parent).addr, owner);
        // Check if the name has already been registered
        assert_eq(Mapping::contains(names, name_hash), false);

        let own_index: OwnIndex = Mapping::get_or_use(own_indies, owner, OwnIndex {index: 0u64, count: 0u64});
        let address_index: AddressIndex = AddressIndex {addr: owner, index: own_index.index};
        Mapping::set(own_names, address_index, name_hash);
        Mapping::set(own_indies, owner, OwnIndex {index: own_index.index + 1u64, count: own_index.count + 1u64});

        let ans: ANS = ANS {addr: owner, index: own_index.index, name: full_name.name, parent: full_name.parent};
        Mapping::set(names, name_hash, ans);
    }

    transition transfer(public name_hash: scalar, public receiver: address) {
        return then finalize(name_hash, self.caller, receiver);
    }

    finalize transfer(name_hash: scalar, from: address, receiver: address) {
        let old_ans: ANS = Mapping::get(names, name_hash);
        assert_eq(old_ans.addr, from);

        let old_own_index: OwnIndex = Mapping::get(own_indies, from);
        Mapping::set(own_indies, from, OwnIndex {index: old_own_index.index, count: old_own_index.count - 1u64});
        let old_address_index: AddressIndex = AddressIndex {addr: from, index: old_ans.index};
        // Mapping::remove(own_names, old_address_index);
        Mapping::set(own_names, old_address_index, 0scalar);

        let own_index: OwnIndex = Mapping::get_or_use(own_indies, receiver, OwnIndex {index: 0u64, count: 0u64});
        let address_index: AddressIndex = AddressIndex {addr: receiver, index: own_index.index};
        Mapping::set(own_names, address_index, name_hash);
        Mapping::set(own_indies, receiver, OwnIndex {index: own_index.index + 1u64, count: own_index.count + 1u64});

        let ans: ANS = ANS {addr: receiver, index: own_index.index, name: old_ans.name, parent: old_ans.parent};
        Mapping::set(names, name_hash, ans);
    }

    transition set_primary_name(public name_hash: scalar) {
        return then finalize(name_hash, self.caller);
    }

    finalize set_primary_name(name_hash: scalar, owner: address) {
        assert_eq(owner, Mapping::get(names, name_hash).addr);

        Mapping::set(primary_names, owner, name_hash);
    }

    // set resolver, category is the bits of the category string,
    // for example, "btc" is 132197865694437869286087983372569673728u128
    transition set_resolver(public name_hash: scalar, public category: u128, public content: Name) {
        assert(validate_name_bit(category));
        return then finalize(name_hash, self.caller, category, content);
    }

    finalize set_resolver(name_hash: scalar, owner: address, category: u128, content: Name) {
        assert_eq(owner, Mapping::get(names, name_hash).addr);

        let resolver_index: ResolverIndex = ResolverIndex {name: name_hash, category: category};
        Mapping::set(resolvers, resolver_index, content);
    }
}
