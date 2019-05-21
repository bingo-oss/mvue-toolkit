/**
 * 当前会话
 */
import ssoclient from './ssoclient';

var Cookies=require("js-cookie");
var store = require('store2');
var _=require("../tools/lodash_loader").default;
var utils=require('../utils').default;
var AES = require("crypto-js/aes");
var encUTF8 = require("crypto-js/enc-utf8");



var sessionKeyPrefix="_session_";
var sessionCookieKey="m_vue_session_id";
var anonymousSession= {
    sessionId: null,
    loginTime: null,
    expires: 0,
    token: {
        mode:"",
        accessToken: null,
        refreshToken: null,
        expiresIn: 0,
    },
    user: {
        anonymous: true,
        name: "匿名用户",
        userId: ""
    }
};
var session=_.extend({},anonymousSession);
var events={
    onSignIn:[],
    onSignOut:[]
}

if(store.has(getSessionKey())){
   var storedSession=getStoredSession();
   if(storedSession){
       session=storedSession;
   }
}

function createLoginRouter(returnUrl){
  return {
    path: '/login',
    query: {redirect: returnUrl}
  };
}

function isLoginAction(router){
  if(_.isEqual("/login",router.path)){
    return true;
  }
  return false;
}
function isSSOClientAction(router){
  if(_.isEqual("/ssoclient",router.path)){
    return true;
  }
  return false;
}

function onSSOCallback(callback){
  ssoclient.onSSOCallback(function (tokenInfo) {
    signIn(tokenInfo);
    if(callback){
      callback(tokenInfo);
    }
  });
}

/**
 * 判断当前会话是否登录
 * @returns {boolean}
 */
function isLogin() {
  var sessionId=Cookies.get(sessionCookieKey);
  if(_.isEmpty(sessionId)||sessionId!=session.sessionId){
    return false;
  }
  if(_.now().valueOf()>session.expires){
    removeSession();
  }
  return true;
}

async function signIn(tokenInfo) {
   //其它窗口已经登录，并且cookie值与store中的数据保存一致，丢弃该授权码，使用本地数据
    var sessionId=Cookies.get(sessionCookieKey);
    var storeSession = getStoredSession();
    if (storeSession && storeSession.sessionId==sessionId) {
        session = storeSession;
        return session;
    }
    //登录
    session.token = tokenInfo;
    session.user = tokenInfo.user || _.assign({}, anonymousSession.user);
    session.user["anonymous"] = false;
    session.loginTime = _.now().valueOf();
    session.sessionId = "session_id_" + session.loginTime;
    if(tokenInfo.expiresIn){
        session.expires = session.loginTime + tokenInfo.expiresIn * 1000 - 60000;
    }
    Cookies.set(sessionCookieKey, session.sessionId, {
        path: utils.getWebContext()
    });

    var crypto=AES.encrypt(JSON.stringify(session),session.sessionId);
    store.set(getSessionKey(), crypto.toString());
    for(var i=0;i<events.onSignIn.length;i++){
        var func=events.onSignIn[i];
        await func(session);
    }
    return session;
}

function getStoredSession() {
    var sessionId=Cookies.get(sessionCookieKey);
    if(!sessionId){
      return null;
    }
    try{
        var decrypt=AES.decrypt(store.get(getSessionKey()),sessionId);
        session=JSON.parse(decrypt.toString(encUTF8));
        return session;
    }catch(ex){
      return null;
    }
}

async function signOut(returnUrl) {
    removeSession();
    if (_.isEmpty(returnUrl)) {
        returnUrl = window.location.href;
    }
    for(var i=0;i<events.onSignOut.length;i++){
        var func=events.onSignOut[i];
        await func(session);
    }
    ssoclient.ssoLogout(returnUrl);
}

function removeSession() {
  session=_.extend({},anonymousSession);
  store.remove(getSessionKey());
  Cookies.remove(sessionCookieKey,{path:utils.getWebContext()});
  console.log("session logout!");
}

function getSessionKey() {
  return sessionKeyPrefix+utils.getWebContext();
}

export default {
    isLogin: function () {
        return isLogin();
    },
    getToken: function () {
        if (this.hasToken()) {
            return session.token.accessToken;
        }
        return null;
    },
    hasToken: function () {
        if (isLogin() && session.token.accessToken) {
            return true;
        }
        return false;
    },
    doSignIn: async function (tokenInfo) {
       return signIn(tokenInfo);
    },
    doLogout:async function (returnUrl) {
       return signOut(returnUrl);
    },
    doLogin: function (returnUrl) {
        store.remove(getSessionKey());
        ssoclient.gotoLogin(returnUrl);
    },
    getCurrentUser: function () {
        return session.user;
    },
    doFilter: function (to, from, next) {
        //因为to.matched会从父到子放置所有匹配的路由，所以从最后一个路由向上判断是否定义了requiresAuth就可以确定了
        let len = to.matched.length;
        let requiresAuth = false;
        for (let i = len - 1; i >= 0; --i) {
            let m = to.matched[i];
            if (m.meta.requiresAuth) {//路由配置指定了需要验证
                requiresAuth = true;
                break;
            } else if (m.meta.requiresAuth === false) {//路由配置指定了匿名
                requiresAuth = false;
                break;
            }
        }
        if (requiresAuth) {
            if (this.isLogin()) {  // 通过vuex state获取当前的token是否存在
                next();
            } else {
                //中转
                let nextTo=ssoclient.gotoLogin(to.fullPath);
                if(nextTo){
                    next(nextTo);
                }
            }
        } else {
            next();
        }
    },
    onSignIn:function (func) {
        events.onSignIn.push(func);
    },
    onSignOut:function (func) {
        events.onSignOut.push(func);
    }
};

