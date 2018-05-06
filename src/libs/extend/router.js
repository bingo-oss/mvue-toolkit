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
//构造模块_moduleName的路由数据
function toRealRouteData(_data, _moduleName, r) {
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
        try{
            var file=r(item.component);
            obj.component = r(item.component);
        }catch (ex){
            console.log("fail to load :"+item.component);
            continue;
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
      obj.children = toRealRouteData(item.children, _moduleName, r);
    }
    routes.push(obj);
  }
  return routes;
}
//module 模块名称，r 是此模块require的模块动态加载函数
function getModuleRoutes(module,routersBaseData, r) {
    var filteredData = filterRoutesByModuleName(routersBaseData, module);
    var parentRouter=filteredData;
    if(parentRouter.length>0 && filteredData[0].children){
        parentRouter=filteredData[0].children;
    }

    parentRouter.push({
        meta: {
            requireAuth: true
        },
        name: "defaultEntityList",
        component: "metabase/list",
        path: "entities/:entityName/list",
        beforeEnter: function (to, from, next) {
            propsResolve(to);
            next();
        }
    });
    parentRouter.push({
        meta: {
            requireAuth: true
        },
        name: "defaultCreateForm",
        component: 'metabase/form',
        path: "entities/:entityName/create",
        beforeEnter: function (to, from, next) {
            propsResolve(to);
            next();
        }
    });
    parentRouter.push({
        meta: {
            requireAuth: true
        },
        name: "defaultEditForm",
        component: 'metabase/form',
        path: "entities/:entityName/edit/:id",
        beforeEnter: function (to, from, next) {
            propsResolve(to);
            next();
        }
    });

    var routersData = toRealRouteData(filteredData, module, r);
    return routersData;
}

function propsResolve(router) {
    if (!_.isEmpty(router.params.menu)) {
        router.meta["menu"] = router.params.menu;
    }
};

export  default {
  getModuleRoutes:getModuleRoutes
};
