function clone(value){return value==null?value:structuredClone(value);}

export function createMemoryStorage(){
  let current=null;
  let failSnapshot=false;
  const snapshots=new Map();
  return {
    failNextSnapshotWrite(){failSnapshot=true;},
    async writeSnapshot(snapshot){
      if(failSnapshot){failSnapshot=false;throw new Error('simulated snapshot write failure');}
      snapshots.set(snapshot.snapshot_id,clone(snapshot));
      current=snapshot.snapshot_id;
      return {snapshot_id:current};
    },
    async readCurrentSnapshot(){return current?clone(snapshots.get(current)):null;}
  };
}
