/**
 * SSO客户端
 */

var Config=require("../../config/config.js");
var Base64=require("js-base64").Base64;
var http=require("axios");
var _=require("../tools/lodash_loader").default;
var qs=require("qs");

/**
 * 跳转到sso登录页面
 */
function gotoLogin(returnUrl) {
  var ssoclientUrl=window.location.href;
  if(ssoclientUrl.indexOf("#")>0){
    ssoclientUrl=ssoclientUrl=ssoclientUrl.substring(0,ssoclientUrl.indexOf("#"));
  }
  ssoclientUrl+="#/ssoclient?returnUrl="+encodeURIComponent(returnUrl);

  var url="";
  if(Config.getSSOVersion()=="v2"){
    url=buildLoginUrlForV2(ssoclientUrl);
  }else{
    url=buildLoginUrlForV3(ssoclientUrl);
    if(Config.getOAuth2FlowType()=="implicit"){
      url+="&response_type=token";
    }else if(Config.getOAuth2FlowType()=="accessCode"){
      url+="&response_type=code";
    }else{
      url+="&response_type="+encodeURIComponent("code id_token");
    }
    window.location=url;
  }
}

function buildLoginUrlForV2(returnUrl){
  var url=Config.getSSOServerUrl();
  url+="/v2?openid.mode=checkid_setup&openid.ex.client_id="+(Config.getClientId()||"clientId");
  url+="&openid.return_to="+encodeURIComponent(returnUrl);
  return url;
}
function buildLoginUrlForV3(returnUrl){
  var url=Config.getSSOServerUrl();
  url+="/oauth2/authorize?client_id="+Config.getClientId();
  url+="&redirect_uri="+encodeURIComponent(returnUrl);
  url+="&logout_uri="+encodeURIComponent(window.location.protocol+window.location.host+window.location.pathname+"#/ssoclient?logout=1&_inframe=true");
  return url;
}

/**
 * 处理sso回调
 */
function onSSOCallback(callback){
  if(Config.getSSOVersion()=="v2"){
    return processCallbackForV2(callback);
  }
  return processCallbackForV3(callback);
}

/**
 * v2流程校验serviceticket，获取access_token
 * @param callback
 */
function processCallbackForV2(callback) {
    var params = resolveParams(window.location.href) || {};
    var ticket = params["openid.ex.service_ticket"];
    var tokenUrl = Config.getSSOServerUrl() + "/v2";
    var reqParam = {
        "openid.mode": "check_authentication",
        "openid.ex.client_id": Config.getClientId(),
        "openid.ex.client_secret": Config.getClientSecret(),
        "openid.ex.service_ticke": ticket,
        "openid.ex.logout_url": window.location.href + "#/logout",
        "openid.ex.get_oauth_access_token": "y"
    };

    http.post(tokenUrl, qs.stringify(reqParam), {"responseType": "text"})
        .then(function ({data}) {
            var arrItems = data.replace(/\r/g, "").split("\\n");
            var respMap = {};
            _.forEach(arrItems, function (item, index) {
                if (_.isEmpty(item)) {
                    return;
                }
                var entry = item.split(":");
                if (entry.length != 2) {
                    return;
                }
                respMap[entry[0]] = entry[1];
            })
            if (respMap["mode"] != "ok") {
                alert("ticket " + ticket + " 无效，错误信息：" + respMap["error"]);
                return;
            }
            var tokenInfo = {
                accessToken: respMap["ex.oauth_access_token"],
                identity: respMap["identity"],
                expiresIn: token["ex.oauth_access_token_expires"],
                refreshToken: token["ex.oauth_refresh_token"],
                user:{
                    name: respMap["identity"],
                    userId: respMap["identity"]
                }
            };
            if (callback) {
                callback(tokenInfo);
            }
        }).catch(function (error) {
        console.log(error.response.data);
    });
}

/**
 * v3版SSO回调 ，验证accessCode获取access_token
 * @param callback
 */
function processCallbackForV3(callback){
  if(Config.getOAuth2FlowType()=="implicit"){
    return onImplictFlow(callback);
  }else{
    return onAccessCodeFlow(callback);
  }
}

/**
 * 处理隐式流程
 * @param callback
 */
function onImplictFlow(callback){
  var params=resolveParams(window.location.href)||{};
  var tokenInfo={
      accessToken:params["access_token"],
      expiresIn:params["expires_in"],
      state:params["state"]
  };
    getUserInfo(tokenInfo).then(function (userInfo) {
        if(callback){
            callback(tokenInfo);
        }
    });
}

function getUserInfo(tokenInfo) {
    var url=Config.getSSOServerUrl()+"/oauth2/userinfo";
    return new Promise(function (resolve,reject) {
        http.get(url,{"headers":{"Authorization":"Bearer "+tokenInfo.accessToken}})
            .then(function ({data}) {
               var user={
                   name:data["name"] || data["username"],
                   userId:data["sub"],
                   anonymous:false
               };
                tokenInfo["user"]=user;
               resolve(user);
            }).catch(function (error) {
                resolve(null);
        });
    });
}

/**
 * 处理授权码流程
 * @param callback
 */
function onAccessCodeFlow(callback) {
  var params=resolveParams(window.location.href)||{};
  var code=params["code"];
  checkAccessCode(code,function (token) {
    var tokenInfo={
      accessToken:token["access_token"],
      expiresIn:token["expires_in"],
      state:token["state"],
      refreshToken:token["refresh_token"]
    };
    getUserInfo(tokenInfo).then(function (userInfo) {
          if(callback){
              callback(tokenInfo);
          }
      });
  });
}

function checkAccessCode(accessCode,callback) {
    var tokenUrl = Config.getSSOServerUrl() + "/oauth2/token";
    var reqParam = {
        "grant_type": "authorization_code",
        "code": accessCode
    };
    var basicAuth = getClientAuth();
    http.post(tokenUrl, qs.stringify(reqParam), {headers: {'Authorization': basicAuth}})
        .then(function ({data}) {
            if (callback) {
                callback(data);
            }
        }).catch(function (error) {
        console.log(error.message);
    });

}

function resolveParams(url) {
  if(!url) return;
  url = url + '';
  var index = url.indexOf('?');
  if(index > -1) {
    url = url.substring(index + 1, url.length);
  }
  var pairs = url.split('&'), params = {};
  for(var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var indexEq = pair.indexOf('='), key = pair, value = null;
    if(indexEq > 0) {
      key = pair.substring(0, indexEq);
      value = decodeURIComponent(pair.substring(indexEq + 1, pair.length));
    }
    params[key] = value;
  }
  return params;
}

function getClientAuth() {
  var clientId=Config.getClientId();
  var clientSecret=Config.getClientSecret();
  return "Basic "+Base64.encode(clientId+":"+clientSecret);
}

function ssoLogout(returnUrl) {
  var url=Config.getSSOServerUrl();
  if(Config.getSSOVersion()=="v2"){
    url+="/v2?openid.mode=logout";
    url+="&openid.return_to="+encodeURIComponent(returnUrl);
  }else{
    url+="/oauth2/logout?post_logout_redirect_uri="+encodeURIComponent(returnUrl);
  }
  window.location=url;
}


module.exports={
  gotoLogin:function(returnUrl)  {
    gotoLogin(returnUrl);
  },
  onSSOCallback:function (callback) {
    onSSOCallback(callback);
  },
  ssoLogout:function (returnUrl) {
    ssoLogout(returnUrl);
  }
}



