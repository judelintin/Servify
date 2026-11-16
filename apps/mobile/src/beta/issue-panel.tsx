import {useState} from 'react';
import {View} from 'react-native';
import {issueCategories,canReportIssue} from '../domain/delivery';
import {Badge,Button,Input,Type} from '../ui/primitives';
import {Chips,Confirm,s} from '../features/marketplace/components';
import {messageStamp} from '../ui/job-chat';
import {useTrustCommand,TrustPending} from './use-trust-command';
import {commandId} from './commands';
import type {SharedFeedback} from './trust';
export function SharedIssues({user,snapshot,refresh,disabled}:{user:string;snapshot:SharedFeedback;refresh:()=>Promise<void>;disabled:boolean}){
 const j=snapshot.job,command=useTrustCommand(user,'issues',j.id),[category,setCategory]=useState('quality'),[text,setText]=useState(''),[intent,setIntent]=useState<Parameters<typeof command.send>[0]|null>(null),[error,setError]=useState(''),[saved,setSaved]=useState('');
 const done=async()=>{setIntent(null);setSaved('Issue report saved. Case status comes from your account; no support response is guaranteed.');await refresh();};
 return <>{user===j.customer_id&&canReportIssue(j)&&<View style={s.card}><Type variant="section">Something unresolved?</Type><Chips label="Issue category" value={category} options={Object.entries(issueCategories)} onChange={setCategory}/><Input label="Describe the issue" value={text} onChangeText={setText} multiline maxLength={2000} placeholder="Describe unresolved work in at least 15 characters."/><Button label="Review issue report" variant="secondary" disabled={disabled||!command.ready||!!command.pending||command.busy} onPress={()=>{if(text.trim().length<15){setError('Describe the issue in 15 to 2,000 characters.');return;}setError('');setIntent({kind:'feedback',args:{p_command:commandId(),p_job:j.id,p_revision:j.revision,p_action:'issue',p_rating:0,p_body:text,p_category:category}});}}/>{!!error&&<Type accessibilityRole="alert">{error}</Type>}</View>}
 {snapshot.issues.map(i=><View key={i.id} style={s.card}><Badge tone="orange">Issue reported · {i.case_status}</Badge><Type>{issueCategories[i.category]}</Type><Type selectable>{i.description}</Type><Type variant="caption">{messageStamp(i.created_at)} · private to job participants and authorized administrators</Type></View>)}<TrustPending command={command} onConfirmed={done} onRefresh={refresh}/>{!!saved&&<Type accessibilityRole="alert">{saved}</Type>}<Confirm visible={!!intent} title="Submit shared issue report?" action="Confirm issue report" busy={command.busy} confirmDisabled={!command.ready||!!command.pending} onCancel={()=>setIntent(null)} onConfirm={()=>{if(intent)void command.send(intent).then(done).catch(e=>setError(e instanceof Error?e.message:'Issue report not confirmed.'));}}><Type>This records an unresolved issue and pauses this job at Issue reported. It does not settle a dispute or promise a support response.</Type><Type>{text}</Type>{!!error&&<Type accessibilityRole="alert">{error}</Type>}</Confirm></>;
}
