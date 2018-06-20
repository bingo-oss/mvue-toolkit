/**
 * 加载类兼容控件
 */
import  context from "../extend/context";
function tryShowLoadingByIView() {
    var vue=context.getCurrentVue();
    if(vue.$Loading){
        vue.$Loading.start();
        return true;
    }
    return false;
}

function tryHideLoadingByIView() {
    var vue=context.getCurrentVue();
    if(vue.$Loading){
        vue.$Loading.finish();
        return true;
    }
    return false;
}

function tryErrorLoadingByIView() {
    var vue=context.getCurrentVue();
    if(vue.$Loading){
        vue.$Loading.error();
        return true;
    }
    return false;
}

export  default {
    showLoading:function () {
        var processed=tryShowLoadingByIView();
        if(!processed){
            tryShowLoadingByElement();
        }
    },
    hideLoading:function () {
        var processed=tryHideLoadingByIView();
        if(!processed){
            tryHideLoadingByElement();
        }
    },
    errorLoading:function () {
        var processed=tryErrorLoadingByIView();
        if(!processed){
            tryErrorLoadingByIView();
        }
    }
}
