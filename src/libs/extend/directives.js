//限定某个文本dom的长度，超过length用...
var WordLimit=function($dom,value){
    value.length=value.length||20;
    value.text=value.text||"";
    if($dom&&value.text.length>value.length){
        var _text=value.text.substring(0,value.length)+"...";
        if(_text!=$dom.text()){
            $dom.text(_text);
            $dom.attr("title",value.text);
        }
    }else if($dom&&value.text&&$dom.text()!=value.text){
        $dom.text(value.text);
        $dom.attr("title",value.text);
    }
};
module.exports = function CustomDirectives(Vue) {
    //自动根据设置的长度设置文本的...样式，如：v-wordlimit='{length:50,text:"文本值"}'表示超过50个字符出现...
    Vue.directive('wordlimit', {
        inserted: function (el,binding,vnode,oldVnode) {
            var value=binding.value||{};
            WordLimit($(el),value);
        },
        componentUpdated:function (el,binding,vnode,oldVnode) {
            var value=binding.value||{};
            WordLimit($(el),value);
        }
    });
    //固定元素的高度，并设置自动滚动条，如:v-autoscroll='60'
    function autoscroll(value,el){
        var windowHeight=$(window).height();
        console.log('#######top:'+$(el).offset().top);
        let top=$(el).offset().top;
        if(!value){
            $(el).css({
                height:windowHeight-top+'px',
                overflow:'auto'
            });
        }else{
            value=_.toNumber(value);
            let height=windowHeight-top-value>0?windowHeight-top-value:windowHeight;
            $(el).css({
                height:height+'px',
                overflow:'auto'
            });
        }
    }
    Vue.directive('autoscroll', {
        inserted: function (el,binding,vnode,oldVnode) {
            var value=binding.value;
            autoscroll(value,el);
            $(window).resize(function(){
                autoscroll(value,el);
            });
        }
    });
};

