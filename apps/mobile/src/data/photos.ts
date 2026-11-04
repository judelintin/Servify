import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { newId, type Photo } from '../domain/requests';
import { keepPhoto, removePhoto } from './photo-files';

export async function selectPhotos(limit:number):Promise<Photo[]>{
  // The modern system photo picker grants scoped access without broad library permission.
  const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsMultipleSelection:limit>1,selectionLimit:limit,quality:1});
  if(result.canceled)return [];
  const kept:Photo[]=[];
  try{for(const asset of result.assets.slice(0,limit)){
    if(asset.fileSize&&asset.fileSize>10*1024*1024)throw Error('Choose images under 10 MB.');
    if(asset.mimeType&&!['image/jpeg','image/png','image/webp','image/heic','image/heif','image/avif'].includes(asset.mimeType))throw Error('Choose a JPEG, PNG, WebP, HEIC or AVIF image.');
    if(!asset.width||!asset.height)throw Error('This image could not be read. Choose a valid photograph.');
    if(asset.width*asset.height>60_000_000)throw Error('Choose an image under 60 megapixels.');
    const context=ImageManipulator.manipulate(asset.uri);const longest=Math.max(asset.width,asset.height);if(longest>1600)context.resize(asset.width>=asset.height?{width:1600}:{height:1600});
    const image=await context.renderAsync();let rendered;
    try{rendered=await image.saveAsync({format:SaveFormat.JPEG,compress:.78});}finally{image.release();context.release();}
    const id=newId();await keepPhoto(id,rendered.uri);kept.push({id,alt:'Customer-supplied photograph of the requested work'});
  }return kept;}catch(e){await Promise.all(kept.map(p=>removePhoto(p.id).catch(()=>{})));throw e;}
}
