import {useState} from 'react';
import {useBetaAccount} from '../beta/account';
import {BetaActiveJobs} from '../beta/lifecycle-screen';
import {BetaSessionNotice} from '../beta/workspace';
import {ActiveJobs} from '../features/marketplace/lifecycle';
export default function ActiveJobsRoute(){const account=useBetaAccount(),[local,setLocal]=useState(false);if(account.status==='loading'||account.status==='error')return <BetaSessionNotice/>;return account.user&&!local?<BetaActiveJobs onLocal={()=>setLocal(true)}/>:<ActiveJobs onBeta={account.user?()=>setLocal(false):undefined}/>;}
