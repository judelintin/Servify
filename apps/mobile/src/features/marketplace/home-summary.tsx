import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMarketplace } from '../../data/marketplace';
import { useProfessional } from '../../data/professional-store';
import { discover, emptyFilters } from '../../domain/marketplace';
import { colors as c } from '../../theme/tokens';
import { Button, EmptyState, Type } from '../../ui/primitives';
import { OpportunityCard, s } from './components';
export function HomeOpportunities(){const market=useMarketplace(),{profile}=useProfessional(),router=useRouter(),jobs=discover(market.data,{...emptyFilters(),matching:true},profile);return <View style={{gap:12}}>{!market.ready?<Type>Restoring local opportunities…</Type>:jobs.length?<><Type variant="caption" color={c.muted}>{jobs.length} local {jobs.length===1?'request matches':'requests match'} your services and areas.</Type><OpportunityCard job={jobs[0]!}/><Button label="Explore all requests" variant="secondary" onPress={()=>router.push('/jobs')}/></>:<EmptyState compact icon="search" title="Good matches take context." description="No open local requests match your services and areas yet. Browse all requests or publish a complete customer request on this device." action="Browse Find Jobs" onAction={()=>router.push('/jobs')}/>}</View>;}
export function HomeOfferStats(){const {data,ready}=useMarketplace(),router=useRouter();const submitted=data.offers.filter(o=>o.status==='submitted').length,selected=data.offers.filter(o=>o.status==='selected').length;return <View style={s.card}><Type variant="section">Your local offers</Type><Type color={c.muted}>{ready?`${submitted} pending · ${selected} selected`:'Restoring offers…'}</Type><Type variant="caption" color={c.muted}>Selected is a preview choice. Open job progress for acceptance, scheduling and completion.</Type><Button label="Manage your offers" variant="secondary" onPress={()=>router.push('/activity')}/></View>;}
