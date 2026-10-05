const DAY=24*60*60*1000;

function clone(value){return value==null?value:structuredClone(value);}
function ageExpired(date,now,days){return now.getTime()-new Date(date).getTime()>days*DAY;}

export function createMemoryStorage(){
  let current=null;
  let failSnapshot=false;
  const snapshots=new Map();
  const intake={pending:new Map(),reviewed:new Map(),rejected:new Map()};
  return {
    failNextSnapshotWrite(){failSnapshot=true;},
    async writeSnapshot(snapshot){
      if(failSnapshot){failSnapshot=false;throw new Error('simulated snapshot write failure');}
      snapshots.set(snapshot.snapshot_id,clone(snapshot));
      current=snapshot.snapshot_id;
      return {snapshot_id:current};
    },
    async readCurrentSnapshot(){return current?clone(snapshots.get(current)):null;},
    async storeIntake(record){const state=record.state||'pending';intake[state].set(record.id,clone({...record,state}));return {id:record.id};},
    async listIntake(state){return [...intake[state].values()].map(clone).sort((a,b)=>a.received_at.localeCompare(b.received_at));},
    async getIntake(id,state='pending'){return clone(intake[state].get(id)??null);},
    async moveIntake(id,fromState,toState){const value=intake[fromState].get(id);if(!value)throw new Error('intake not found');intake[fromState].delete(id);intake[toState].set(id,{...value,state:toState,state_changed_at:new Date().toISOString()});},
    async deleteIntake(id,state){return intake[state].delete(id);},
    async purgeExpiredIntake(now=new Date()){
      const counts={pending:0,reviewed:0,rejected:0};
      for(const [state,days] of Object.entries({pending:60,reviewed:7,rejected:7})){
        for(const [id,record] of intake[state]){
          const basis=state==='pending'?record.received_at:(record.state_changed_at||record.received_at);
          if(ageExpired(basis,now,days)){intake[state].delete(id);counts[state]++;}
        }
      }
      return counts;
    }
  };
}
