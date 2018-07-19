/**
 * 工具方法
 * Created by tonyyls on 2016/10/28.
 */

var _=require("./tools/lodash_loader").default;

function getCurPos($textarea){
    var e=$textarea.get(0),pos=e.value.length;
    if(e.selectionStart){    //FF
        pos= e.selectionStart;
    }else if(document.selection){    //IE
        var r = document.selection.createRange();
        if (r == null) {
            pos= e.value.length;
        }else{
            var re = e.createTextRange();
            var rc = re.duplicate();
            re.moveToBookmark(r.getBookmark());
            rc.setEndPoint('EndToStart', re);
            pos= rc.text.length;
        }
    }
    return pos;
};
function setCurPos($textarea,pos) {
    var e=$textarea.get(0);
    e.focus();
    if (e.setSelectionRange) {
        e.setSelectionRange(pos, pos);
    } else if (e.createTextRange) {
        var range = e.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
    }
};
//在textarea的指定位置插入字符
function insertAtCursor($textarea,val){
    var $t=$textarea[0];
    var startPos=getCurPos($textarea);
    if(startPos===undefined){
        $t.value= $t.value+val;
    }else{
        $t.value = $t.value.substring(0, startPos) + val + $t.value.substring(startPos, $t.value.length); 
    }
    setCurPos($textarea,startPos+val.length);
}

var utils = {
    insertAtCursor:insertAtCursor,
    appendParams:function(url,params){
        if(!url){
            return "";
        }
        if(!params || params.length<1){
            return url+"";
        }
        var _url= url.indexOf("?")>-1?url+"&":url+"?";
        for(var i=0;i<params.length;++i){
            if(i==0){
                _url+=params[i].key+"="+encodeURIComponent(params[i].value);
            }else{
                _url+="&"+params[i].key+"="+encodeURIComponent(params[i].value);
            }
        }
        return _url;
    },
    appendParam:function(url,paramName,paramVal){
        if(!paramName){
            return url+"";
        }
        if(paramVal==null || typeof(paramVal)=="undefined"){
            paramVal="";
        }
        var _url= url.indexOf("?")>0?url+"&":url+"?";
        _url+=paramName+"="+encodeURIComponent(paramVal);
        return _url;
    },
    urlPattern:function(url,paramName,paramVal){
        if(!paramName){
            return url+"";
        }
        if(paramVal==null || typeof(paramVal)=="undefined"){
            paramVal="";
        }
        url=url.replace(":"+paramName,paramVal);
        return url;
    },
    //复制model的数据，清除更新对象不需要的属性
    reduceModelForUpdate:function(model,moreFields){
        var copyModel=_.cloneDeep(model);
        if(_.has(copyModel,"id")){
            delete copyModel.id;
        }
        if(_.has(copyModel,"createdBy")){
            delete copyModel.createdBy;
        }
        if(_.has(copyModel,"createdAt")){
            delete copyModel.createdAt;
        }
        if(_.has(copyModel,"updatedBy")){
            delete copyModel.updatedBy;
        }
        if(_.has(copyModel,"updatedAt")){
            delete copyModel.updatedAt;
        }
        if(_.isString(moreFields) && _.has(copyModel,moreFields)){
            delete copyModel[moreFields];
        }else if(_.isArray(moreFields)){
            _(moreFields).forEach(function (item) {
                if(_.has(copyModel,item)){
                    delete copyModel[item];
                }
            })
        }

        return copyModel;
    },
    //_this:当前vue实例
    //_model:当前待验证的数据
    smartValidate:function(_this,_model,_validator,callback,failback){
        _this.changedQueue=_this.changedQueue||[];
        //如果数据变化，先往变化队列推一条数据
        _this.changedQueue.push(true);
        //记录当前变化队列的长度
        var length=_this.changedQueue.length;
        var __validator=_validator||_this.$validator;
        setTimeout(function(){
            //再次计算变化队列的长度，如果和之前的长度一致则表示用户已经停止输入，可以做校验了；
            //如果不一致说明用户正在快速输入暂时不做验证，等到用户停止输入了就继续验证
            var _length=_this.changedQueue.length;
            if(_length===length){
                _this.changedQueue=[];
                __validator.validateAll(_model).then(function(){
                    _this.valid=true;
                    callback&&callback();
                }).catch(function(){
                    _this.valid=false;
                    failback&&failback();
                });
            }
        },500);
    },
    //_this:当前vue实例
    //智能搜索包装器，在用户快速输入时先不查询，直到用户输入完毕再查询
    smartSearch:function(_this,callback,_changedQueueKey,_duration){
        utils.smartAction(_this,_changedQueueKey,callback,_duration);
    },
    //_this:当前vue实例
    //_changedQueueKey:变化的队列key
    //callback:执行的操作回调函数
    //_duration:指定操作等待的时长毫秒为单位
    //智能操作包装器，
    smartAction:function(_this,_changedQueueKey,callback,_duration){
        var changedQueueKey=_changedQueueKey;
        var duration=_duration||500;
        _this[changedQueueKey]=_this[changedQueueKey]||[];
        //如果数据变化，先往变化队列推一条数据
        _this[changedQueueKey].push(true);
        //记录当前变化队列的长度
        var length=_this[changedQueueKey].length;
        setTimeout(function(){
            //再次计算变化队列的长度，如果和之前的长度一致则表示等待时间到了，可以做相关操作了；
            //如果不一致说明数据还在变化，等到数据不再持续变化了再继续执行操作
            var _length=_this[changedQueueKey].length;
            if(_length===length){
                _this[changedQueueKey]=[];
                callback&&callback();
            }
        },duration);
    },
    randomString: function (len) {
        len = len || 32;
        var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
        /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
        var maxPos = $chars.length;
        var pwd = '';
        for (var i = 0; i < len; i++) {
            pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
        }
        return pwd;
    },
    camelToUnderscore: function (str) {
      str = str.replace(/([A-Z])/g,"_$1").toLowerCase();

      if(str[0] == '_') str = str.slice(1);

      return str;
    },
    closeWindow:function(){
        if (navigator.userAgent.indexOf("Firefox") != -1 || navigator.userAgent.indexOf("Chrome") !=-1) {  
            window.location.href="about:blank";  
            window.close();  
        } else {  
            window.opener = null;  
            window.open("", "_self");  
            window.close();  
        }  
    },
    leapQueryValueEncode(value){//leap 框架查询值单引号需要转义
        if(value){
            value=value.replace(/'/ig,"''");
        }
        return value;
    },
    getMomentFormat(format){//将iview组件日期的格式化串转为moment的格式化串
        //iview:"yyyy-MM-dd HH:mm:ss" moment:"YYYY-MM-DD HH:mm:ss"
        if(!format){
            return "YYYY-MM-DD HH:mm:ss";
        }
        return format.replace("yyyy","YYYY").replace("dd","DD");
    },
    /**
     * 将userPermVal和operationPermVal求与，如果结果等于operationPermVal表示有权限，否则无权限
     * @param {*} userPermVal 用户的权限，二进制对应的整数表示
     * @param {*} operationPermVal 操作的权限，二进制对应的整数表示
     */
    hasPerm(userPermVal,operationPermVal){
        //如果数据没定义任何权限，那就不控制权限
        if(!userPermVal){
            return true;
        }
        return (userPermVal & operationPermVal)===operationPermVal;
    },
    /** 快捷方法，判断当前用户是否对item数据的btn操作有权限
     * @param {*} item 记录数据对象
     * @param {*} btn 操作对象
     */
    hasDataPerm(item,btn){
        let userPermVal=item[Utils.dataPermField];
        //如果数据没定义任何权限，那就不控制权限
        if(!userPermVal){
            return true;
        }
        let operationPermVal=btn[Utils.dataPermField];
        //如果未设置权限，则默认没有权限
        if(!operationPermVal){
            return false;
        }
        return Utils.hasPerm(userPermVal,operationPermVal);
    },
    dataPermField:"permVal",
    permValues:{
        "view":1,
        "create":2,
        "edit":4,
        "del":8,
        "publish":16,
        "manage":32,
        "changeOwner":64
    },
    queryKeys:{
        action:"_action",
        hideSuiteNavbar:"_hideSuiteNavbar"
    },
    formActions:{
        create:"create",
        view:"view",
        edit:"edit"
    },
    ignoreSpecialQuery(query){
        let _query=_.cloneDeep(query);
        _.forIn(Utils.queryKeys,function(key){
            if(_.has(_query,key)){
                delete _query[key];
            }
        });
        return _query;
    },
    getWebContext() {
        var webContext=window.location.pathname;
        if(webContext.indexOf('/')>1){
            webContext=webContext.substring(0,webContext.lastIndexOf('/'));
        }
        return webContext;
    }
};

export  default  utils;
