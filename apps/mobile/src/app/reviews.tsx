import {useLocalSearchParams} from 'expo-router';
import {useBetaAccount} from '../beta/account';
import {BetaSessionNotice} from '../beta/workspace';
import {SharedReviews} from '../beta/trust-screen';
import {ReviewsScreen} from '../features/marketplace/reviews';
export default function ReviewsRoute(){const {source,jobId,professionalId}=useLocalSearchParams<{source?:string;jobId?:string;professionalId?:string}>(),account=useBetaAccount();if(source==='local'||(jobId&&source!=='beta'))return <ReviewsScreen/>;if(source==='beta')return <SharedReviews jobId={jobId} professionalId={professionalId}/>;if(account.status==='loading'||account.status==='error')return <BetaSessionNotice/>;return account.user?<SharedReviews/>:<ReviewsScreen/>;}
