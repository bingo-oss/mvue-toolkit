/**
 * Service for interacting with RESTful services.
 */
import  axios from "axios";
import session from "../security/session";
import  urlTemplate from "./url_template";
import loading from "../tools/loading";
import modal from "../tools/modal";
import _ from "../tools/lodash_loader"
import pathToRegexp from "path-to-regexp";
import utils from "../utils";
import  configHelper from "../../config/config";


let defaultHttpOption={
    baseUrl:"",
    onError:null,
    showLoading:true,
};

Resource.actions = {
    get: {method: 'GET'},
    save: {method: 'POST'},
    query: {method: 'GET'},
    update: {method: 'PATCH'},
    remove: {method: 'DELETE'},
    delete: {method: 'DELETE'}
};



function opts(action, args, name) {
    var options = _.assign({}, action), params = {}, body, _options = {};
    switch (args.length) {
        case 3:
            params = args[0];
            body = args[1];
            _options = args[2];
            break;
        case 2:
            if (/^(POST|PUT|PATCH|DELETE)$/i.test(options.method)) {
                params = args[0];
                body = args[1];
            } else {
                params = args[0];
                _options = args[1];
            }
            break;
        case 1:
            if (/^(POST|PUT|PATCH)$/i.test(options.method)) {
                body = args[0];
            } else {
                params = args[0];
            }
            break;
        case 0:
            break;
        default:
            throw 'Expected up to 3 arguments [params, body,_options], got ' + args.length + ' arguments';
    }
    options.data = body;
    options.params = _.assign({}, options.params, params);
    return Object.assign(options, _options);
}

export const http = axios.create();
// Add a request interceptor
var pendingRequests={};


http.interceptors.request.use(function (config) {
    config.headers['Cache-Control']="no-cache";
    config.headers["Pragma"]="no-cache";
    let token = session.getToken();
    if (token) {
        config.headers['Authorization']='Bearer '+ token;
    }
    //将不支持的http方法进行转义
    let methodOverride=configHelper.getConfigVal("system.http.method.override."+config.method.toLowerCase());
    if(methodOverride){
        config.headers["X-HTTP-Method-Override"]=config.method;
        config.method=methodOverride;
    }
    //如果请求配置了showLoading，用请求配置的
    //如果没配置用默认的
    if(config.showLoading||(_.isUndefined(config.showLoading)&&defaultHttpOption.showLoading)){
        var id=_.uniqueId("req");
        config["uid"]=id;
        pendingRequests[id]=true;
        // 请求发送前加载中提示（延迟）
        window.setTimeout(function () {
            if(!_.isEmpty(pendingRequests)){
                loading.showLoading();
            }
        },200);
    }
    return config;
}, function (error) {
    modal.error({
        title: "系统异常",
        content: "请求发送异常，请检查网络连接！"
    });
    console.error(error);
    // Do something with request error
    return Promise.reject(error);
});

// Add a response interceptor
let isLogining=false;
http.interceptors.response.use(function (response) {
    if(response.config.uid){
         delete pendingRequests[response.config.uid];
        loading.hideLoading();
    }
    return response;
}, function (error) {
    if(error.config.uid){
        delete pendingRequests[error.config.uid];
        loading.errorLoading();
    }

    var errorHandler=error.config["onError"] || http.onResponseError || defaultHttpOption.onError;
    var errorShowType="notice"; //ignore、popup、notice；
    if (errorHandler) {
        errorShowType = errorHandler;
        if (typeof  errorHandler == "function") {
            errorShowType = errorHandler(error);
        }
        if (errorShowType===true || errorShowType==="ignore") {
            return Promise.reject(error);
        }
    }

    var response=error.response;
    if(!response){
        showError({
            key:true,
            title: "系统提示",
            content: "服务器异常，地址："+error.config.url,
            duration:10
        },errorShowType);
        throw error;
    }
    if(response.status === 401) {
        let route=session.doLogin(window.location.href);
        if(route && !isLogining){
            isLogining=true;
            window.setTimeout(()=>{
                isLogining=false;
                window.location="#"+route.path;
            },100);
        }
    }else if(response.status==404){
        //not found
    }else if (response.status>=400){
        var message=response.data;
        if(!!message.message){
            message=message.message||`${message.error}:${message.error_description}`;
        }
        if(!message){
            message=response.statusText;
        }
        if(response.status==403){
            message="您没有此操作权限";
            showError({
                key:403,
                title: "系统提示",
                content: message,
                duration:10
            },errorShowType);
        }else if(response.status==400){
            showError({
                key:400,
                title: "系统提示",
                content: message,
                duration:10
            },errorShowType);
        }else{
            showError({
                key:true,
                title: "系统提示",
                content: "服务器异常:"+message,
                duration:10
            },errorShowType);
        }
    }else if(response.status == 0){
        console.error(response.data);
        showError({
            key:true,
            title: "系统提示",
            content: "请求出现异常，请检查网络连接！",
            duration:10
        },errorShowType);
    }
    return Promise.reject(error);
});


let obj={};
function showError(error,errorShowType) {
    if(errorShowType=="popup"){
        if(error.key){
            utils.smartAction(obj,error.key,()=>{
                modal.error(error);
            },500);
        }else{
            modal.error(error);
        }
    }else{
        if(!error.desc && error.content){
            error["desc"]=error.content;
        }
        if(error.key){
            utils.smartAction(obj,error.key,()=>{
                modal.notice(error, "warning");
            },500);
        }else {
            modal.notice(error, "warning");
        }
    }
}

function ResourceBase(){
    return {
            baseUrl:null,
            setBaseUrl:function (url) {
                this.baseUrl=url;
            },
            getHttp:function () {
                return http;
            },
            getAccessToken:function () {
                return session.getToken();
            },
            extend:function (opt) {
                return _.extend(this,opt);
            },
            request:function (httpConfig) {
                var baseUrl = this.baseUrl || defaultHttpOption.baseUrl;
                //url是绝对路径，不能设置baseUrl
                if(!(httpConfig.url.indexOf('http')==0)){
                    if (!_.isEmpty(baseUrl)) {
                        httpConfig["baseURL"] = baseUrl;
                    }
                }
                var actionUrl = httpConfig.url;
                if (actionUrl.indexOf("{") > 0) {
                    let parsedUrl = urlTemplate.parse(httpConfig.url);
                    actionUrl = parsedUrl.expand(httpConfig.params);
                    _.forIn(parsedUrl.vars, function (item) {
                        delete httpConfig.params[item];
                    })
                }else if(!(httpConfig.url.indexOf('http')==0)){
                    var tokens=pathToRegexp.parse(actionUrl);
                    actionUrl=pathToRegexp.compile(actionUrl)(httpConfig.params);
                    _.forEach(tokens,token=>{
                        if(token.name){
                            delete httpConfig.params[token.name];
                        }
                    });
                }
                httpConfig.url=actionUrl;
                return http.request(httpConfig);
            }
    }
}

export default function Resource(url, actions,_options) {
    var self = this || {}, resource =ResourceBase();
    var options=_options||{};
    if(url.indexOf('http')==0){
        //url是绝对路径，不能设置baseUrl
        resource.baseUrl=null;
    }else{
        //基本地址参数覆盖，root兼容Vue-resource的参数
        resource.baseUrl=options.root||options.baseUrl||resource.baseUrl;
    }

    actions = _.assign({},
        Resource.actions,
        actions
    );

    _.forIn(actions, (action, name) => {
        action = _.merge({
            "url":url
        }, action);
        resource[name] = function () {
            var args = Array.prototype.slice.call(arguments);
            let httpConfig = opts(action,args,name);
            try{
                return resource.request(httpConfig);
            }catch (ex){
                console.log(ex);
                throw ex;
            }
        };
    });
    return resource;
}

export function defaultOption(options) {
    _.assign(defaultHttpOption,options);
}
