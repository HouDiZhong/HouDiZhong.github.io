/*试读结束，购买流程文件*/

var showingBuyDialog = false; // 是否正在显示购买弹窗，避免重复显示
/*显示试读结束弹窗*/
function showReadEndDialog(){
	// 如果是阅读，就不显示购买弹窗
	if(pdfType == 2){
		return;
	}
	if(showingBuyDialog){
		return;
	}else{
		showingBuyDialog = true;
	}
	var token = localStorage.getItem('AUTHORIZATION');

	token = token ? JSON.parse(token) : ''
	// 获取图书信息
	$.ajax({
		url : APP_SETTING_API_BASE + '/book/shade?id=' + resId,
		type : 'post',
		cache : false,
		async:false,
		dataType : 'json',
		contentType : "application/json;charset=utf-8",
		headers: {
			Authorization: token
		},
		success : function(res){
			showLayerBuyDialog(res)
		},
		error : function(err){
			console.log(err);
			alert('获取图书信息出现错误');
			return false;
		}
	});
	// 通过接口去请求数据
//	util.post('/book/order/' + id,null,getBookInfo);
}

/**
 * 显示购买layer弹窗
 * param res {Object} 图书信息对象
 * */
function showLayerBuyDialog(res){
	var result = res.data;
	var html = '', len = 12,
		title = result.titleCn,
		leng = result.titleCn.length,
		btname = '';
	// btname = '立刻购买&nbsp;&nbsp;' + result.price + '<i class="foze ten">有米</i>';

	if(leng > len){
		title = title.substring(0, len)+'...';
	}

	// 作者
	var authString = '';
	if(result.principalAuthorList && result.principalAuthorList.length > 0){
		for(var i = 0; i<result.principalAuthorList.length;i++){
			authString += result.principalAuthorList[i].nameCn +'['+ (result.principalAuthorList[i].countryName || '中') +']' + '&nbsp;';
		}
	}
	// 其他作者
	if(result.otherAuthorList && result.otherAuthorList.length > 0){
		for(var i = 0; i<result.otherAuthorList.length;i++){
			authString += result.otherAuthorList[i].nameCn +'['+ (result.otherAuthorList[i].countryName || '中') +']' +  '&nbsp;';
		}
	}

	html =
		'<div class="tryLayer">' +
			'<div class="closeIoc">' +
				'<span class="closebtn iconfont iconfont-close"></span>' +
			'</div>' +
			'<div class="tryBookInfo">' +
				'<img src="'+ result.imgUrl +'">' +
				'<p class="title" title='+ result.titleCn +'>'+ title +'</p>' +
				'<p class="part-authors">' + authString + '</p>' +
			'</div>' +
			'<div class="fixedInfo">' +
				'<p class="ftitle">试读结束</p>' +
				// '<p class="fconcent">点击购买，继续阅读后续精彩内容 :）</p>' +
			'</div>' +
		'</div>'

	openLayer(btname,html);
}

//使用layer.js的弹窗展示数据
var openLayer = function(btname,html) {

    layer.open({
		type: 1,
        btn: btname,
        title: false,
		id: 'buyBook',
        area: ['270px','290px'],
        shadeClose: false,
		closeBtn: 0,
        skin: 'layerTryBook',
		content: html,
		yes: function(i) {
			layer.close(i);
			showingBuyDialog = false;
			parent.window.location.href = '/book/detail?id=' + pdfId;
		},
		end: function() {   // 弹出框销毁时执行
			showingBuyDialog = false;
		}
    });
};

$(function(){
	//点击弹窗叉号关闭弹窗
	$('body').on('click','.closebtn', function() {
		layer.closeAll();
	});
})
