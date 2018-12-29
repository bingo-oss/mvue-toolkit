var mods=[],asyncMods={};
//同步添加模块库
function add(mod){
    mods.push(mod);
}
//异步添加模块库
function addAsync(modName,mod,appCtx,homeBase,pageIndex){
    if((!!modName) && (!!mod)){
        mods.push(mod);
        asyncMods[modName]=mod;
        if(mod.pages&&mod.pages.routes&&appCtx&&appCtx.getRouter){
            let modRoutes=_.cloneDeep(homeBase);
            mod.pages.routes.forEach(route=>{
                if(!route.component){
                    route.component=pageIndex;
                }
            });
            modRoutes.children=mod.pages.routes;
            appCtx.getRouter().addRoutes([modRoutes]);
        }

        mod.initAfterAppCtxCreated && 
        mod.initAfterAppCtxCreated(appCtx);

        mod.initAfterAppStarted && 
        mod.initAfterAppStarted(appCtx);
    }
}
function initAfterAppCtxCreated(appCtx){
    mods.forEach(mod => {
        mod.initAfterAppCtxCreated && 
        mod.initAfterAppCtxCreated(appCtx);
    });
}
function initAfterAppStarted(appCtx){
    mods.forEach(mod => {
        mod.initAfterAppStarted && 
        mod.initAfterAppStarted(appCtx);
    });
}
function isAsyncModLoaded(routePath){
    if(!routePath){
        return false;
    }
    for (const key in asyncMods) {
        if (asyncMods.hasOwnProperty(key)) {
            if(routePath.indexOf(`/pages/${key}/`)>-1){
                return true;
            }
        }
    }
    return false;
}
export default {
    add,
    initAfterAppCtxCreated,
    initAfterAppStarted,
    mods,
    addAsync,
    isAsyncModLoaded
}