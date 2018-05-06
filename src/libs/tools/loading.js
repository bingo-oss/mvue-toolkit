/**
 * 加载类兼容控件
 */
import  context from "../extend/context";
function tryShowLoadingByIView() {
    var vue=context.getCurrentVue();
    if(vue.$Spin){
        vue.$Spin.show();
        return true;
    }
    return false;
}

function tryHideLoadingByIView() {
    var vue=context.getCurrentVue();
    if(vue.$Spin){
        vue.$Spin.hide();
        return true;
    }
    return false;
}

function tryShowLoadingByElement() {
    var vue=context.getCurrentVue();
    if(vue.$loading){
        var loading =vue.$loading({
            lock: true,
            text: 'Loading',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.9)'
        });
        return true;
    }
    return false;
}

function tryHideLoadingByElement() {
    //TODO;
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
    }
}
