/**
 * 当前会话
 */
var ssoclient=require("./ssoclient");
var Cookies=require("js-cookie");
var store = require('store2');
var _=require("../tools/lodash_loader").default;
var utils=require('../utils').default;

var sessionKeyPrefix="_session_";
var sessionCookieKey="m_vue_session_id";
var anonymousSession={
  sessionId:null,
  loginTime:null,
  expires:0,
  token:{
    accessToken:null,
    refreshToken:null,
    expiresIn:0,
  },
  user:{
    anonymous:true,
    name:"匿名用户",
    userId:""
  }
};
var session=_.extend({},anonymousSession);

if(store.has(getSessionKey())){
  session=store.get(getSessionKey());
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

function signIn(tokenInfo){
  session.token=tokenInfo;
  session.user=tokenInfo.user ||_.assign({},anonymousSession.user);
  session.user["anonymous"]=false;
  session.loginTime=_.now().valueOf();
  session.expires=session.loginTime+tokenInfo.expiresIn*1000-60000;
  session.sessionId="session_id_"+session.loginTime;
  Cookies.set(sessionCookieKey,session.sessionId,{
    path:utils.getWebContext()
  });
  store.set(getSessionKey(),session);
}

function signOut(returnUrl) {
  removeSession();
  if(_.isEmpty(returnUrl)){
    returnUrl=window.location.href;
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

module.exports={
  getToken:function(){
    if(!isLogin()){
      return null;
    }
    return session.token.accessToken;
  },
  hasToken:function () {
    if(!isLogin()|| _.isEmpty(session.token.accessToken)){
      return false;
    }
    return true;
  },
  doSignIn:function (tokenInfo) {
    signIn(tokenInfo);
  },
  doLogout:function (returnUrl) {
    signOut(returnUrl);
  },
  doLogin:function (returnUrl) {
    ssoclient.gotoLogin(returnUrl);
  },
  getCurrentUser:function(){
    return session.user;
  },
  doFilter:function(to,from,next){
    //因为to.matched会从父到子放置所有匹配的路由，所以从最后一个路由向上判断是否定义了requiresAuth就可以确定了
    let len=to.matched.length;
    let requiresAuth=false;
    for(let i=len-1;i>=0;--i){
      let m=to.matched[i];
      if(m.meta.requiresAuth){//路由配置指定了需要验证
        requiresAuth=true;
        break;
      }else if(m.meta.requiresAuth===false){//路由配置指定了匿名
        requiresAuth=false;
        break;
      }
    }
    if(requiresAuth){
      if (this.hasToken()) {  // 通过vuex state获取当前的token是否存在
        next();
      }else {
        //中转
        ssoclient.gotoLogin(to.fullPath);
      }
    }else{
      next();
    }
  }
};

