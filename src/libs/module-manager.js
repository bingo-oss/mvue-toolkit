var mods=[];
function add(mod){
    mods.push(mod);
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
export default {
    add,
    initAfterAppCtxCreated,
    initAfterAppStarted
}