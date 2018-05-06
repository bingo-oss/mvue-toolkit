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
        var process=tryShowInfoByIView();
        if(!process){
            tryShowInfoByElement();
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
        var process=tryShowWarnByIView();
        if(!process){
            tryShowWarnByElement();
        }
    },
    error: function (opts) {
        var process=tryShowErrorByIView();
        if(!process){
            tryShowErrorByElement();
        }
    },
    confirm: function (opts) {
        var process=tryShowConfirmByIView();
        if(!process){
            tryShowConfirmByElement();
        }
    }
}
