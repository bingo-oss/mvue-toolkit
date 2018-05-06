/**
 * 运行的vue上下文参数
 */

var context={
    vue:null
}

export default {
    init:function (vue) {
        context.vue=vue;
    },
    getContext:function () {
        return context;
    },
    getCurrentVue:function () {
        return context.vue;
    }
}