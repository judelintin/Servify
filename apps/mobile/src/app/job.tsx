import {useLocalSearchParams} from 'expo-router';
import {JobScreen} from '../features/marketplace/lifecycle';
import {BetaJob} from '../beta/lifecycle-screen';
export default function JobRoute(){const {id,source}=useLocalSearchParams<{id:string;source?:string}>();return source==='beta'?<BetaJob job={id}/>:<JobScreen/>;}
