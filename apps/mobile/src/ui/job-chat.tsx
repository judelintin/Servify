import {useRef,type ComponentRef,type ReactNode,type RefObject} from 'react';
import {ScrollView,TextInput,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors as c} from '../theme/tokens';
import {Button,EmptyState,Input,Page,Type} from './primitives';
export type ChatBubble={id:string;sender:string;text:string;mine:boolean;stamp:string;state?:'sending'|'failed';retry?:()=>void};
export const messageStamp=(date:string)=>new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Lagos'}).format(new Date(date))+' WAT';
/** Shared approved conversation layout; transport is supplied by the caller. */
export function JobChat({title,description,messages,text,onText,onSend,sendLabel,inputLabel='Message',error,disabled,busy,field,scroll,nearBottom:nearBottomRef,emptyDescription,footer,header,onEarlier,loadingEarlier=false}:{
 title?:string;description:string;messages:ChatBubble[];text:string;onText:(value:string)=>void;onSend:()=>void;sendLabel:string;inputLabel?:string;error:string;disabled?:boolean;busy?:boolean;
 field:RefObject<ComponentRef<typeof TextInput>|null>;scroll:RefObject<ComponentRef<typeof ScrollView>|null>;nearBottom:RefObject<boolean>;emptyDescription:string;footer?:ReactNode;header?:ReactNode;onEarlier?:()=>void;loadingEarlier?:boolean;
}){
 const insets=useSafeAreaInsets(),offset=useRef(0),height=useRef(0),older=useRef<{height:number;offset:number}|null>(null);
 return <Page title="Job conversation" subtitle={title} back scroll={false} bottom={<View style={{padding:16,paddingBottom:Math.max(insets.bottom,16),backgroundColor:c.warm,gap:8,borderTopWidth:1,borderColor:c.line}}><Input ref={field} label={inputLabel} value={text} onChangeText={onText} multiline maxLength={2000} style={{maxHeight:120}} placeholder="Keep job details together. No private contact information."/>{!!error&&<Type accessibilityRole="alert" color={c.error}>{error}</Type>}<Button label={sendLabel} disabled={disabled} busy={busy} onPress={onSend}/></View>}>
 <View style={{flex:1,minHeight:0}}><Type variant="caption" color={c.muted} accessibilityLiveRegion="polite">{description}</Type>{header}
 <ScrollView ref={scroll} style={{flex:1}} keyboardShouldPersistTaps="handled" onScroll={e=>{const n=e.nativeEvent;offset.current=n.contentOffset.y;nearBottomRef.current=n.contentSize.height-n.layoutMeasurement.height-n.contentOffset.y<90;}} scrollEventThrottle={100} onContentSizeChange={(_,h)=>{if(older.current){scroll.current?.scrollTo({y:older.current.offset+h-older.current.height,animated:false});older.current=null;}else if(nearBottomRef.current)scroll.current?.scrollToEnd({animated:false});height.current=h;}} contentContainerStyle={{gap:14,paddingVertical:18}}>
 {onEarlier&&<Button label="Load earlier messages" variant="secondary" busy={loadingEarlier} onPress={()=>{nearBottomRef.current=false;older.current={height:height.current,offset:offset.current};onEarlier();}}/>}
 {!messages.length&&<EmptyState compact title="Start with a useful detail." description={emptyDescription}/>}
 {messages.map(m=><View key={m.id} style={{alignSelf:m.mine?'flex-end':'flex-start',maxWidth:'92%',padding:14,borderRadius:14,backgroundColor:m.mine?c.paleBlue:c.white,borderWidth:1,borderColor:c.line}}><Type variant="caption" color={c.blue}>{m.sender}</Type><Type selectable>{m.text}</Type><Type variant="caption" color={m.state==='failed'?c.error:c.muted}>{m.stamp}</Type>{m.retry&&<Button label="Retry message" variant="ghost" onPress={m.retry}/>}</View>)}
 {footer}</ScrollView></View></Page>;
}
