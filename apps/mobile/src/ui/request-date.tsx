import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform } from 'react-native';
import { Button, Type } from './primitives';
import { today } from '../domain/requests';
export function RequestDate({value,onChange}:{value:string;onChange:(date:string)=>void}){
  const [open,setOpen]=useState(false),[pending,setPending]=useState(new Date(`${value||today()}T12:00:00`));
  function choose(date:Date){onChange(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`);setOpen(false);}
  return <>
    <Button label={value?`Preferred date: ${value}`:'Choose a preferred date'} variant="secondary" icon="calendar" onPress={()=>{setPending(new Date(`${value||today()}T12:00:00`));setOpen(true);}}/>
    {open&&<>
      <DateTimePicker value={pending} minimumDate={new Date(`${today()}T00:00:00`)} mode="date" display={Platform.OS==='ios'?'spinner':'default'} onChange={(event,date)=>{
        if(Platform.OS==='ios'){if(date)setPending(date);}
        else{setOpen(false);if(event.type==='set'&&date)choose(date);}
      }}/>
      {Platform.OS==='ios'&&<>
        <Button label="Use selected date" onPress={()=>choose(pending)}/>
        <Button label="Cancel date selection" variant="ghost" onPress={()=>setOpen(false)}/>
      </>}
    </>}
    <Type variant="caption">A preference, not a confirmed booking.</Type>
  </>;
}
