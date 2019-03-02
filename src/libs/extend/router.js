import Config from "../../config/config.js";
import _ from "../tools/lodash_loader";
import Utils from "../utils";
//将arr2的路由基础数据合并到arr1中
function mergeData(arr1, arr2) {
  for (var i = 0; i < arr2.length; i++) {
    var Bhas = false;
    var iNow = 0;
    for (var j = 0; j < (arr1.length + iNow); j++) {
      if (arr2[i].name == arr1[j].name) {
        Bhas = true;
        if (arr2[i].component && (arr1[j].component != arr2[i].component)) {
          arr1[j].component = arr2[i].component;
        }
        if (arr1[j].children && arr2[i].children) {
          mergeData(arr1[j].children, arr2[i].children);
        }
      }
    }
    if (!Bhas) {  //没有
      arr1.push(arr2[i]);
      iNow--;
      Bhas = false;
    }
  }
  return arr1;
}
//根据moduleName过滤，返回属于这个模块的路由
function filterRoutesByModuleName(_data, moduleName) {
  var routes = [];
  for (var i = 0; i < _data.length; i++) {
    var item = _data[i];
    if (item.meta && item.meta.module && (item.meta.module === moduleName)) {
      routes.push(item);
    }
  }
  return routes;
}
//根据传入的require函数r转换component
function toRealRouteData(_data, r) {
  var routes = [];
  for (var i = 0; i < _data.length; i++) {
    var item = _data[i];
    var obj = {};
    if (item.name) {
      obj.name = item.name;
    }
    obj.path = item.path||item.route_path;
    //这个地方引用组件通过动态的r函数require，由各模块自己提供
    if (item.component) {
      if(_.isString(item.component)){
        try{
            obj.component = r(item.component);
        }catch (ex){
            console.log("fail to load :"+item.component);
            continue;
        }
      }else{
        obj.component=item.component;
      }
    }
    if (item.alias) {
      obj.alias = item.alias;
    }
    if (item.redirect) {
      obj.redirect = item.redirect;
    }
    if (item.props) {
      obj.props = item.props;
    }
    if (item.beforeEnter) {
      obj.beforeEnter = item.beforeEnter;
    }
    if (item.meta) {
      obj.meta = item.meta;
    }
    if (item.children && item.children.length) {
      obj.children = toRealRouteData(item.children, r);
    }
    routes.push(obj);
  }
  return routes;
}
//module 模块名称，r 是此模块require的模块动态加载函数
function getModuleRoutes(module, routersBaseData,r,routersExData) {
  var filteredData = filterRoutesByModuleName(routersBaseData, module);
  var moduleRoutersExData = routersExData&&routersExData[module];
  if (!!moduleRoutersExData) {
    filteredData = mergeData(filteredData, moduleRoutersExData);
  }
  var routersData = toRealRouteData(filteredData, r);
  return routersData;
}

/**
 * 初始化远程定义的路由信息
 * @param routeComponent
 */
function initRemoteRoutes(defaultRouteComponent) {
  let remoteRoutes=Config.getConfigVal("routes");
  if(!remoteRoutes){
    return null;
  }
  Utils.visitTree(remoteRoutes,(route,parent,index)=>{
    if(!route.path){
      return;
    }
    if(!route.name){
      route.name=route.path.replace(/\//g,"-");
    }
    if(!route.component){
      route.component=defaultRouteComponent;
    }
    route.fullPath=`pages/${route.path}`;
    if(parent){
      route.path=route.fullPath.substr(parent.fullPath.length+1);
    }else{
      route.path=route.fullPath;
    }
  });
  return remoteRoutes;
}


export default {
  getModuleRoutes:getModuleRoutes,
  toRealRoutes:toRealRouteData,
  initRemoteRoutes:initRemoteRoutes
};
