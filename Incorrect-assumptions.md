1. updateNode ends up being called on every cycle for every node
  - added counters for updateNode (`updateNode for node ${update.id}`)
  - should see cycles * number of nodes of this counter: `updateNode called`
2. when updateNode is called, it can always (or pretty much always) find the node in the nodelist
  - added counter for the else in updatenode (shouldnt see `could not find node ${update.id} in nodelist`)
3. refuteCycles is initialized once per node
  - counter in nodeList add node & counter in update node (`initializing refuteCycles for node ${node.id}`)
  - only one of these per node:
    - nodeList add node: `initializing refuteCycles for node ${node.id} in addNode`
    - update node: `initializing refuteCycles for node ${node.id} in updateNode`
5. all nodes end up with the same nodelist hash, so the initialization of refuteCycles is not being wiped away by peers updating their nodelists from eachother
6. On the cycle where the FF goes active, there should be 1 counter for initialization of refuteCycles per node.
7. its ok to addNode to the nodelist without initializing refuteCycles
8. maybe the refuteCycles being a map stored on the node itself is causing a de/serialization issue


Found to be Correct:
1. update node is not called every cycle for every node - its only called when there are changes.
  - in our case, a node being marked as refuted / lost does not trigger an updateNode call
  - solution: updateProblematicNodeTracking in updateNode + Sync::applyNodeListChange update

2. updateNode is not the best place to initialize refuteCycles, because then nodes will be added without it initialized
  - solution: initialize refuteCycles in addNode if the flag is on, dont check activationCycle

3. nodelist gossip is broken because it can't serialize Set properly
  - solution: change refuteCycles to be an array

required changes:
 - initialize refuteCycles in addNode if the flag is on, dont check activationCycle
 - initialize refuteCycles in updateNode, dont check activationCycle
 - updateProblematicNodeTracking in updateNode + Sync::applyNodeListChange update