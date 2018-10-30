/**
 * 对话框类控件
 */
import  context from "../extend/context";
function tryShowInfoByIView(opts) {
    var vue=context.getCurrentVue();
    if(vue.$Modal) {
        if (opts && opts.noTimeout) {
            vue.$Modal.info(opts);
        } else {
            setTimeout(function () {
                vue.$Modal.info(opts);
            }, 300);
        }
        return true;
    }
    return false;
}

function tryShowInfoByElement(opts) {
    var vue=context.getCurrentVue();
    if(vue.$msgbox) {
        if (opts && opts.noTimeout) {
            vue.$msgbox(opts);
        } else {
            setTimeout(function () {
                vue.$msgbox.info(opts);
            }, 300);
        }
        return true;
    }
    return false;
}

function tryShowErrorByIView(opts) {
    var vue=context.getCurrentVue();
    if(vue.$Modal){
        if (opts && opts.noTimeout) {
            vue.$Modal.error(opts);
        } else {
            setTimeout(function () {
                vue.$Modal.error(opts);
            }, 300);
        }
        return true;
    }
    return false;
}

function tryShowErrorByElement(opts) {
    var vue=context.getCurrentVue();

}

function tryShowWarnByIView(opts) {
    var vue=context.getCurrentVue();
    if(vue.$Modal){
        if (opts && opts.noTimeout) {
            vue.$Modal.error(opts);
        } else {
            setTimeout(function () {
                vue.$Modal.error(opts);
            }, 300);
        }
        return true;
    }
    return false;
}

function tryShowWarnByElement(opts) {
    var vue=context.getCurrentVue();

}

function tryShowConfirmByIView(opts) {
    var vue=context.getCurrentVue();
    if(vue.$Modal){
        vue.$Modal.confirm(opts);
        return true;
    }
    return false;
}

function tryShowConfirmByElement(opts) {
    var vue=context.getCurrentVue();

}

export default {
    info: function (opts) {
        var process=tryShowInfoByIView(opts);
        if(!process){
            tryShowInfoByElement(opts);
        }
    },
    success: function (opts) {
        if (opts && opts.noTimeout) {
            vue.$Modal.success(opts);
        } else {
            setTimeout(function () {
                vue.$Modal.success(opts);
            }, 300);
        }
    },
    warning: function (opts) {
        var process=tryShowWarnByIView(opts);
        if(!process){
            tryShowWarnByElement(opts);
        }
    },
    error: function (opts) {
        var process=tryShowErrorByIView(opts);
        if(!process){
            tryShowErrorByElement(opts);
        }
    },
    confirm: function (opts) {
        var process=tryShowConfirmByIView(opts);
        if(!process){
            tryShowConfirmByElement(opts);
        }
    },
    notice: function (opts,type) {
        if(type==null || typeof type=="undefined"){
            type="open";
        }
        if(opts!=null && typeof opts=="string"){
            opts={
                title:opts
            };
        }
        context.getCurrentVue().$Notice[type](opts);
    }
}
