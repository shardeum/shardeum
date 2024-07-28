


Access lists are a difficult topic with multiple constraints.


EIP2930 is an Ethereum standard for providing an access list to a transaction.
This has limits because it does not specify contract code addresses.
Also it does not have knowlege of memory access patterns.
Using this directly is also a security vulnerablity for complex reasons.




Shardeum Validators run AALG which is automatica access list generation.
This access list contains addressess used and a list of mermory access patterns.




async function generateAccessList


this needs to be upgraded to support an existing access list for warm up purposes




