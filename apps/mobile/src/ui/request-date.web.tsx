import { Input, Type } from './primitives';
export function RequestDate({value,onChange}:{value:string;onChange:(date:string)=>void}){return <><Input label="Preferred date (YYYY-MM-DD)" placeholder="YYYY-MM-DD" value={value} onChangeText={onChange} maxLength={10} inputMode="numeric"/><Type variant="caption">A preference, not a confirmed booking.</Type></>;}
