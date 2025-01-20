


Access lists are a difficult topic with multiple constraints.


EIP2930 is an Ethereum standard for providing an access list to a transaction.
This has limits because it does not specify contract code addresses.
Also it does not have knowledge of memory access patterns.
Using this directly is also a security vulnerability for complex reasons.




Shardeum Validators run AALG which is automatic access list generation.
This access list contains addresses used and a list of memory access patterns.




async function generateAccessList


this needs to be upgraded to support an existing access list for warm up purposes




