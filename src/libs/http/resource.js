/**
 * Service for interacting with RESTful services.
 */
import  axios from "axios";
import session from "../security/session";
import  urlTemplate from "./url_template";
import loading from "../tools/loading";
import modal from "../tools/modal";
import _ from "../tools/lodash_loader"


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
            if (/^(POST|PUT|PATCH)$/i.test(options.method)) {
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
    var token = session.getToken();
    if (token) {
        config.headers['Authorization']='Bearer '+ token;
    }
    if(config.showLoading){
        var id=_.uniqueId("req");
        config["uid"]=id;
        pendingRequests[id]=true;
        // 请求发送前加载中提示（延迟）
        window.setTimeout(function () {
            defaultHttpOption;
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

    var errorHandler=error.config["onError"] || http.onResponseError;
    if (errorHandler) {
        let handled = errorHandler;
        if (typeof  errorHandler == "function") {
            handled = errorHandler(error);
        }
        if (handled) {
            return Promise.reject(error);
        }
    }

    var response=error.response;
    if(!response){
        console.error("can't get response from :"+error.config.url);
        modal.error({
            title: "系统提示",
            content: "服务器异常，地址："+error.config.url
        });
        throw error;
    }
    if(response.status === 401) {
        session.doLogin(window.location.href);
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
            modal.error({
                title: "系统提示",
                content: message
            });
        }else if(response.status==400){
            modal.warning({
                title: "系统提示",
                content: message
            });
        }else{
            modal.error({
                title: "系统提示",
                content: "服务器异常:"+message
            });
        }
    }else if(response.status == 0){
        console.error(response.data);
        modal.error({
            title: "系统提示",
            content: "请求出现异常，请检查网络连接！"
        });
    }
    return Promise.reject(error);
});


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
                var baseUrl=this.baseUrl || defaultHttpOption.baseUrl;
                if(!_.isEmpty(baseUrl)){
                    httpConfig["baseURL"]=baseUrl;
                }
                let parsedUrl=urlTemplate.parse(httpConfig.url);
                var actionUrl=parsedUrl.expand(httpConfig.params);
                _.forIn(parsedUrl.vars,function (item) {
                    delete httpConfig.params[item];
                })
                httpConfig.url=actionUrl;
                return http.request(httpConfig);
            }
    }
}

export default function Resource(url, actions,_options) {
    var self = this || {}, resource =ResourceBase();
    var options=_options||{};
    //基本地址参数覆盖，root兼容Vue-resource的参数
    resource.baseUrl=options.root||options.baseUrl||resource.baseUrl;

    actions = _.assign({},
        Resource.actions,
        actions
    );

    _.forIn(actions, (action, name) => {
        action = _.merge({
            "url":url,
            "showLoading":true
        }, action);
        resource[name] = function () {
            var args = Array.prototype.slice.call(arguments);
            let httpConfig = opts(action,args,name);
            return resource.request(httpConfig);
        };
    });
    return resource;
}


var defaultHttpOption={
    baseUrl:""
};
export function defaultOption(options) {
    _.assign(defaultHttpOption,options);
}