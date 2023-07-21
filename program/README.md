# Aleo Names Contract Source Code Documentation

AleoNames is a contract written in the Leo language for the Aleo platform. It provides a name service, similar to ENS, on the Aleo blockchain.

The contract defines several data structures and functions for the name service. Here is a brief overview of the main components:

## Data Structures

1. `AddressIndex`: Holds an address and its associated index.
2. `Name`: Holds the ASCII bits of a domain name.
3. `FullName`: Holds a Name struct and its parent's hash.
4. `ANS`: Holds an address, its associated index, and a domain name.
5. `ResolverIndex`: Holds a name_hash and its category.
6. `OwnIndex`: Holds the index and count of owned names.

## Mappings

1. `names`: Maps a scalar (name hash) to an ANS structure.
2. `own_names`: Maps an AddressIndex structure to a hash scalar.
3. `own_indies`: Maps an address to an OwnIndex structure.
4. `primary_names`: Maps an address to a primary name.
5. `resolvers`: Maps a ResolverIndex structure to a Name structure.

## Transitions

1. `register`: Registers a new domain name.
2. `register_sub`: Registers a new subdomain.
3. `transfer`: Transfers the ownership of a domain name to another address.
4. `set_primary_name`: Sets the primary name of an address.
5. `set_resolver`: Sets the resolver for a domain name.


## Note

The contract includes several utility functions to validate the name and to perform operations like adding and removing entries from the mappings.

## Contributing

Contributions to the AleoNames contract are welcome. Please feel free to submit a pull request or open an issue if you encounter any problems or have suggestions for improvements.
