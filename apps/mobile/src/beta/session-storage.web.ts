// Browser preview uses its own session namespace; no shared business keys.
export const sessionStorage={
 async getItem(key:string){return globalThis.sessionStorage.getItem('servify.beta.'+key);},
 async setItem(key:string,value:string){globalThis.sessionStorage.setItem('servify.beta.'+key,value);},
 async removeItem(key:string){globalThis.sessionStorage.removeItem('servify.beta.'+key);},
};
