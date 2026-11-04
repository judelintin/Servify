import { Directory, File, Paths } from 'expo-file-system';
export type PhotoNamespace='requests'|'professional';
const directory=(namespace:PhotoNamespace)=>new Directory(Paths.document,namespace==='professional'?'servify-professional-photos':'servify-request-photos');
const file=(id:string,namespace:PhotoNamespace)=>{if(!/^[a-z0-9-]{8,80}$/.test(id))throw Error('Invalid photo reference.');return new File(directory(namespace),`${id}.jpg`);};
export async function keepPhoto(id:string,uri:string,namespace:PhotoNamespace='requests'){const dir=directory(namespace);dir.create({idempotent:true,intermediates:true});const target=file(id,namespace);new File(uri).copy(target);if(target.size>1024*1024){target.delete();throw Error('The compressed photo is too large. Choose a smaller image.');}}
export async function photoUri(id:string,namespace:PhotoNamespace='requests'){const f=file(id,namespace);if(!f.exists)throw Error('Photo is unavailable on this device.');return f.uri;}
export async function removePhoto(id:string,namespace:PhotoNamespace='requests'){const f=file(id,namespace);if(f.exists)f.delete();}
/** Only app-owned JPEGs older than a week; never delete a referenced image. */
export async function cleanPhotos(referenced:Set<string>,namespace:PhotoNamespace='requests'){const dir=directory(namespace);if(!dir.exists)return;for(const f of dir.list()){if(f instanceof File&&/^[a-z0-9-]{8,80}\.jpg$/.test(f.name)&&!referenced.has(f.name.slice(0,-4))&&(f.modificationTime??Date.now())<Date.now()-7*86400000)f.delete();}}
