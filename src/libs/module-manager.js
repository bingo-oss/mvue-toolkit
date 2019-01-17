var mods=[],syncMods={},asyncMods={};
//旧的接口，同步添加模块库
function add(mod){
    mods.push(mod);
}
//添加同步模块库
function addSync(modName,mod){
    if((!!modName) && (!!mod)){
        //已经注册过，返回
        if(syncMods[modName]){
            return;
        }
        syncMods[modName]=mod;
        mods.push(mod);
    }
}
//异步添加模块库
function addAsync(modName,mod,appCtx,homeBase,pageIndex){
    if((!!modName) && (!!mod)){
        //已经注册过，返回
        if(asyncMods[modName]){
            return;
        }
        asyncMods[modName]=mod;
        mods.push(mod);
        if(mod.pages&&mod.pages.routes&&appCtx&&appCtx.getRouter){
            let modRoutes=_.cloneDeep(homeBase);
            modRoutes.name=`${modName}-${modRoutes.name}`;
            mod.pages.routes.forEach(route=>{
                if(!route.component){
                    route.component=pageIndex;
                }
            });
            modRoutes.children=mod.pages.routes;
            appCtx.getRouter().addRoutes([modRoutes]);
            //更新vuex中存储的页面配置
            appCtx.getStore&&appCtx.getStore().commit("core/setAutoPageConfs",appCtx.getAutoPageConfs());
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
    //如果routePath参数就是模块key，且异步模块中有此key，表示已加载
    if(asyncMods[routePath]){
        return true;
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
function addRouterInterceptor(router,opts){
    mods.forEach(mod => {
        mod.addRouterInterceptor && 
        mod.addRouterInterceptor(router,opts);
    });
}
export default {
    add,
    initAfterAppCtxCreated,
    initAfterAppStarted,
    addRouterInterceptor,
    mods,
    addSync,
    addAsync,
    isAsyncModLoaded
}