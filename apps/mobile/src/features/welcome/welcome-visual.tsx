import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { Icon, Type, type IconName } from '../../ui/primitives';
import { colors as c } from '../../theme/tokens';
import { currency } from '../../domain/marketplace';

const electrician=require('../../../assets/images/electrician.jpg');
const cleaning=require('../../../assets/images/cleaning.jpg');
const workshop=require('../../../assets/images/craftsperson.jpg');
function Photo({source,width,height}:{source:ImageSourcePropType;width:number;height:number}){return <View style={{width,height,borderRadius:16,overflow:'hidden',backgroundColor:c.navy}}><Image source={source} resizeMode="cover" style={{position:'absolute',top:0,left:0,width:'100%',height:'100%'}}/></View>;}
function Service({icon,label}:{icon:IconName;label:string}){return <View style={[s.card,{flexDirection:'row',alignItems:'center',gap:9,padding:11}]}><View style={s.icon}><Icon name={icon} size={17} color={c.blue}/></View><Type style={{fontSize:12,lineHeight:16,fontWeight:'600'}}>{label}</Type></View>;}
/** Noninteractive illustrations built from the application's existing typography,
 * category icons, request and offer vocabulary; never stored marketplace records. */
export function WelcomeVisual({index,width,height}:{index:number;width:number;height:number}){const k=width/300,scale=(n:number)=>n*k;return <View accessible accessibilityRole="image" accessibilityLabel={index===0?'Editorial service discovery collage with electrical and cleaning photography and Servify service categories. No registered professionals are depicted.':index===1?'Illustrative Servify job request and two example offers. Prices demonstrate comparison only; there is no live customer activity.':'Editorial craftsmanship and electrical work photographs arranged with an illustrative professional portfolio. No registered or verified profile is shown.'} style={{height,width,borderRadius:24,backgroundColor:index===1?'#EDF1FC':'#F2F0E9',overflow:'hidden'}}>
 <View style={{position:'absolute',width:scale(245),height:scale(245),borderRadius:scale(125),backgroundColor:index===2?'#E2E8F4':'#E5EAF8',top:height*.13,left:scale(26)}}/>
 {index===0&&<>
  <View style={{position:'absolute',left:scale(17),top:height*.09,transform:[{rotate:'-7deg'}]}}><Photo source={electrician} width={scale(160)} height={height*.62}/></View>
  <View style={{position:'absolute',right:scale(13),top:height*.19,transform:[{rotate:'8deg'}]}}><Photo source={cleaning} width={scale(106)} height={height*.47}/></View>
  <View style={{position:'absolute',left:scale(24),top:height*.63,transform:[{rotate:'-3deg'}]}}><Service icon="zap" label="Electrical"/></View>
  <View style={{position:'absolute',right:scale(18),top:height*.74,transform:[{rotate:'4deg'}]}}><Service icon="droplet" label="Plumbing"/></View>
  <View style={{position:'absolute',right:scale(25),top:height*.08,width:34,height:34,borderRadius:17,backgroundColor:c.orange,alignItems:'center',justifyContent:'center'}}><Icon name="arrow-up-right" size={18} color={c.navy}/></View>
 </>}
 {index===1&&<>
  <View style={[s.card,{position:'absolute',left:scale(20),right:scale(20),top:height*.08,padding:16,gap:8,transform:[{rotate:'-3deg'}]}]}><View style={{flexDirection:'row',gap:8,alignItems:'center'}}><Icon name="zap" size={16} color={c.blue}/><Type style={s.micro}>EXAMPLE REQUEST</Type></View><Type style={{fontSize:18,lineHeight:21,fontWeight:'700'}}>Help with a faulty socket</Type><Type style={s.caption}>Ibadan · Electrical · Need quotes</Type><View style={{height:1,backgroundColor:c.line,marginTop:2}}/><Type style={s.caption}>Describe the work. Compare your options.</Type></View>
  <View style={[s.card,{position:'absolute',left:scale(13),right:scale(38),top:height*.46,padding:14,gap:6,transform:[{rotate:'-5deg'}]}]}><View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:6}}><Type style={[s.micro,{fontSize:8,letterSpacing:.4}]}>OFFER A · EXAMPLE</Type><Type style={{fontSize:20,lineHeight:24,fontWeight:"700",color:c.blue}}>{currency('15000')}</Type></View><Type style={s.caption}>Scope of work · Proposed timeframe</Type></View>
  <View style={[s.card,{position:'absolute',left:scale(44),right:scale(12),top:height*.63,padding:14,gap:5,borderColor:'#B8C8F1',transform:[{rotate:'4deg'}]}]}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Type style={s.micro}>OFFER B · EXAMPLE</Type><Icon name="file-text" size={15} color={c.blue}/></View><Type style={{fontSize:22,lineHeight:26,fontWeight:'700',color:c.ink}}>{currency('18500')}</Type><Type style={s.caption}>Price · scope · availability</Type></View>
 </>}
 {index===2&&<>
  <View style={{position:'absolute',left:scale(24),right:scale(24),top:height*.07,height:height*.68,borderRadius:18,overflow:'hidden',backgroundColor:c.navy}}><Image source={workshop} resizeMode="cover" style={{position:'absolute',width:'100%',height:'100%'}}/></View>
  <View style={[s.card,{position:'absolute',left:scale(12),right:scale(43),top:height*.55,padding:13,gap:7,transform:[{rotate:'-4deg'}]}]}><View style={{flexDirection:'row',gap:10,alignItems:'center'}}><View style={s.icon}><Icon name="tool" size={19} color={c.blue}/></View><View style={{flex:1}}><Type style={{fontSize:16,lineHeight:20,fontWeight:'700'}}>Your professional profile</Type><Type style={s.caption}>Your services. Your experience.</Type></View></View><View style={{height:3,backgroundColor:c.paleBlue,borderRadius:2}}/></View>
  <View style={[s.card,{position:'absolute',right:scale(12),bottom:height*.065,padding:7,transform:[{rotate:'7deg'}]}]}><Photo source={electrician} width={scale(80)} height={height*.22}/><Type style={[s.caption,{paddingTop:4,fontWeight:'600'}]}>Your work, on show</Type></View>
 </>}
 <View style={{position:'absolute',left:0,right:0,bottom:0,alignItems:'center',paddingVertical:7,backgroundColor:'#FFFBF5F5'}}><Type style={{fontSize:9,lineHeight:12,color:c.muted}}>{index===1?'ILLUSTRATIVE UI · NO LIVE REQUESTS OR OFFERS':'EDITORIAL PHOTOGRAPHY · NOT LISTED PROVIDERS'}</Type></View>
 </View>;}
const s=StyleSheet.create({card:{borderRadius:15,borderWidth:1,borderColor:'#E0E4ED',backgroundColor:c.white,boxShadow:'0px 8px 22px rgba(21,26,45,0.08)'},icon:{width:32,height:32,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:c.paleBlue},micro:{fontSize:9,lineHeight:13,letterSpacing:.7,fontWeight:'600',color:c.blue},caption:{fontSize:10,lineHeight:15,color:c.muted}});
