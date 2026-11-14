import {useState} from 'react';
import {useBetaAccount} from '../../beta/account';
import {BetaInbox} from '../../beta/inbox';
import {BetaSessionNotice} from '../../beta/workspace';
import {Conversations} from '../../features/marketplace/lifecycle';
export default function Messages(){
 const account=useBetaAccount(),[local,setLocal]=useState(false);
 if(account.status==='loading'||account.status==='error')return <BetaSessionNotice/>;
 if(!account.user)return <Conversations/>;
 return local?<Conversations onBeta={()=>setLocal(false)}/>:<BetaInbox onLocal={()=>setLocal(true)}/>;
}
