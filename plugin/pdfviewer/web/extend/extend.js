// 日期格式化
$(function(){

	// 复制限制字数
	document.body.addEventListener('copy', function (e) {
		var maxLen = 100,
			selecTxt = window.getSelection().toString(),
			clipboardData = e.clipboardData || window.clipboardData

		if(selecTxt.length > 100 && clipboardData) {
			e.preventDefault()
			selecTxt = selecTxt.slice(0, maxLen)
			clipboardData.setData('text/html', selecTxt)
			clipboardData.setData('text/plain', selecTxt)
		}
	})

	var closeSidebar = function() {
		$('.sidebarOpen').removeClass('sidebarOpen')
	}

	let toKen = JSON.parse(localStorage.getItem('AUTHORIZATION'))
	// 添加书签按钮
	var $createBookmarkBtn = $('#extend-create-bookmark-btn');
	// 管理书签按钮
	var $manageBookmarkBtn = $('#extend-manage-bookmark-btn');
	// 管理书签弹窗
	var $manageBookmarkDialog = $('#extend-manage-bookmark-dialog');
	// 关闭书签弹窗按钮
	var $closeBookmarkDialogBtn = $('#bookmark-close-btn');
	// 书签数组
	var bookMarksArr = [];
	// 轮询内容是否已经渲染完成，如果已渲染完成则在内容页显示书签
	function onLoopPageViewMarks(){
		// 获取当前页数
		var currentPage = $('#pageNumber').val();
		// 判断当前页是否为空，以此来判断pdf文档是否已开始渲染
		if(!currentPage || parseInt(currentPage) === 0){
			setTimeout(function(){
				closeSidebar()
				onLoopPageViewMarks()
			}, 1000);
		}else{
			setTimeout(function(){
				// 获取书签列表
				getBookmarks(true);
			}, 2000);
		}
	}
	// 执行轮询事件
	onLoopPageViewMarks();

	// 获取用户登陆状态
	function getLoginState(callback,noAlert){

		toKen ? callback() : !noAlert && window.parent.extendTriggerLoginClick()
	}
	// 显示管理书签弹窗事件
	$manageBookmarkBtn.on('click',function(){
		// 获取当前页数
		var currentPage = $('#pageNumber').val();
		// 判断当前页是否为空，以此来判断pdf文档是否已开始渲染
		if(!currentPage || parseInt(currentPage) === 0){
			return;
		}

		// 判断当前是否已经登录
		getLoginState(function(){
			if(bookMarksArr.length === 0){
				// 如果书签列表为空，需要重新获取刷新一次
				getBookmarks(false);
			}
			$manageBookmarkDialog.show();
		})

	})
	// 关闭管理书签弹窗事件
	$closeBookmarkDialogBtn.on('click',function(){
		$manageBookmarkDialog.hide();
	})
	// 添加书签事件
	$createBookmarkBtn.on('click',function(){
		// 获取当前页数
		var currentPage = $('#pageNumber').val();
		// 判断当前页是否为空，以此来判断pdf文档是否已开始渲染
		if(!currentPage || parseInt(currentPage) === 0){
			return;
		}
		// 判断当前是否已经登录
		getLoginState(function(){
			// ajax 添加书签
			ajaxCreateBookmark();
		})
	})

	$('body').on('click', '#viewerContainer', function(e) {
		var $doc = $('.click-toggle'), $meun = $('.sidebarOpen')

		if($meun.length) {
			$meun.removeClass('sidebarOpen')
		}else {
			$doc.toggle()
		}
	})


	// 点击目录收起目录
	$('body').on('click', '.outlineItem', closeSidebar)

	// 点击书签页进行跳转
	$('#bookmark-list-out').on('click','.item',function(e){
		// 不是删除按钮才触发事件
		if(!$(e.target).is('.delete-btn')) {
			// 获取当前书签的页数
			var bookmarkPage = $(this).data('page');
			// 由于获取到的数值为index，需要加1
			bookmarkPage = parseInt(bookmarkPage) + 1;
			// 调用跳转到某一页的方法
			toPages(bookmarkPage);
		}
	})

	// 删除书签事件
	$('#bookmark-list-out').on('click','.delete-btn',function(){
		// 获取当前书签id
		var bookmarkId = $(this).data('id');
		// 调用书签删除方法
		bookmarkDelete(bookmarkId);
	})

	// 跳转到某一页
	function toPages(page){
		// 使用viewer.js的跳转方法
		$('#pageNumber').val(page);
		$('#pageNumber').trigger('change');
		// 页面跳转后，需要关闭书签弹窗
		$manageBookmarkDialog.hide();
	}

	function ajaxCreateBookmark(){
		// 获取当前页数
		var currentPage = $('#pageNumber').val();
		// 判断当前页是否为空，以此来判断pdf文档是否已开始渲染
		if(!currentPage || parseInt(currentPage) === 0){
			return;
		}
		// 判断当前页是否已有书签
		if(currentHadBookmark()){
			alert('此页已有书签');
			return false;
		}

		// 保存的书签是index，需要将获取到的当前页数减去1
		currentPage = parseInt(currentPage) - 1;
		// 使用ajax调用接口
        var param ={
        	pageNo:	currentPage,
        	type: pdfType,
        	resId: resId
        };
        $.ajax({
			url : APP_SETTING_API_BASE + '/book/auth/markAdd',
			type : 'post',
			cache : false,
			async: true,
			data: JSON.stringify(param),
			dataType : 'json',
			headers: {
				Authorization: toKen
			},
			contentType : "application/json;charset=utf-8",
			success : function(res){
				layer.msg('书签添加成功',{
	                offset: '80px',
	                time: 2000 //2秒关闭（如果不配置，默认是3秒）
				});
				// 重新获取书签
				getBookmarks(false);
			},
			error : function(err){
				console.log(err);
				return false;
			}
		});
	}

	// 判断添加的当前页是否已有书签
	function currentHadBookmark(){
		// 获取当前页数,向后台存储的页数是index，需要获取的页数减1
		var currentPage = parseInt($('#pageNumber').val()) - 1;
		// 是否已有书签
		var hadBookmark = false;
		if(bookMarksArr.length === 0){
			return false;
		}else{
			for(var i = 0; i< bookMarksArr.length; i++ ){
				if(currentPage === parseInt(bookMarksArr[i].pageNo)){
					hadBookmark = true;
					break;
				}
			}
			return hadBookmark;
		}
	}

	// 获取书签列表
	function getBookmarks(noAlert){
		// 获取当前页数
		var currentPage = $('#pageNumber').val();
		// 判断当前页是否为空，以此来判断pdf文档是否已开始渲染
		if(!currentPage || parseInt(currentPage) === 0){
			return;
		}
		// 判断当前是否已经登录
		getLoginState(function(){
			// 使用ajax调用接口
	        var param ={
	        	id: resId
	        };
	        $.ajax({
				url : APP_SETTING_API_BASE + '/book/auth/markList',
				type : 'get',
				cache : false,
				async:true,
				data: param,
				dataType : 'json',
				headers: {
					Authorization: toKen
				},
				contentType : "application/json;charset=utf-8",
				success : function(res){
					//更新书签数组
					bookMarksArr = res.data || [];
		            // 渲染书签
					renderBookMarks();
					// 图书内容页面显示书签
					pdfPagesViewMarks();
				},
				error : function(err){
					console.log(err);
				}
			});
		},noAlert)
	}

	// 删除书签
	function bookmarkDelete(bookmarkId){
		// 使用ajax调用接口
        var param ={
        	markId:	bookmarkId,
        };
        $.ajax({
			url : APP_SETTING_API_BASE + '/book/auth/markDel',
			type : 'get',
			cache : false,
			async:true,
			data: param,
			dataType : 'json',
			headers: {
				Authorization: toKen
			},
			contentType : "application/json;charset=utf-8",
			success : function(res){
				// 重新获取书签
				getBookmarks(false);
			},
			error : function(err){
				console.log(err);
			}
		});
	}

	// 书签数组渲染到页面
	function renderBookMarks(){
		var bookmarksHtml='';
		if(bookMarksArr.length === 0){
			bookmarksHtml='<span class="no-bookmark">【暂无书签】</span>';
		}else{
			bookmarksHtml = '<ul class="bookmark-list">'
			for(var i = 0; i<bookMarksArr.length; i++){
				bookmarksHtml += `<li class="item" data-page="${bookMarksArr[i].pageNo}">
					<div class="item-top">
						<i class="bookmarker fa fa-bookmark"></i>
						<span class="pages" >第${parseInt(bookMarksArr[i].pageNo) + 1}页</span>
					</div>
					<div class="item-bottom">
						<div class="times">${dateFormat(bookMarksArr[i].createDate,'yyyy-MM-dd HH:mm')}</div>
						<div class="delete-btn" data-id="${bookMarksArr[i].id}">删除</div>
					</div>
				</li>`;
			}
			bookmarksHtml += '</ul>'
		}
		$('#bookmark-list-out').empty().html(bookmarksHtml);
	}

	// 图书内容页面显示书签
	function pdfPagesViewMarks(){
		// 先删除所有书签
		$('#viewer .page.has-mark').removeClass('has-mark');
		// 添加书签
		for(var i =0;i<bookMarksArr.length;i++){
			var markPage = parseInt(bookMarksArr[i].pageNo)+1;
			$('#viewer .page[data-page-number="'+ markPage +'"]').addClass('has-mark');
		}
	}
	// 图书内容页面去除书签
	function pdfPagesRemoveMarks(pageNum){
		$('#viewer .page[data-page-number="'+ pageNum +'"]').removeClass('has-mark');
	}

	Date.prototype.format = function(format) {
		var o = {
			// 月份
			'M+': this.getMonth() + 1,
			// 日
			'd+': this.getDate(),
			// 小时(12小时)
			'h+': this.getHours() % 12 == 0 ? 12 : this.getHours() % 12,
			// 小时(24小时)
			'H+': this.getHours(),
			// 分
			'm+': this.getMinutes(),
			// 秒
			's+': this.getSeconds(),
			// 季度
			'q+': Math.floor((this.getMonth() + 3) / 3),
			// 毫秒
			'S': this.getMilliseconds()
		};
		var week = {
			'0': '/u65e5',
			'1': '/u4e00',
			'2': '/u4e8c',
			'3': '/u4e09',
			'4': '/u56db',
			'5': '/u4e94',
			'6': '/u516d'
		};
		if (/(y+)/.test(format)) {
			format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
		}
		if (/(E+)/.test(format)) {
			format = format.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? '/u661f/u671f' : '/u5468') : '') + week[this.getDay() + '']);
		}
		for (var k in o) {
			if (new RegExp('(' + k + ')').test(format)) {
					format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
			}
		}
		return format
	}

	/*
	 * Long类型日期格式化
	 */
	function dateFormat(value, format) {
		if(!value){
			return '';
		}
		var dateStr = value.toString();
		if (dateStr.length == 12) {
			dateStr += '00';
		}
		var year = dateStr.substring(0, 4);
		var month = parseInt(dateStr.substring(4, 6), 10) - 1;
		var day = dateStr.substring(6, 8);
		var hour = dateStr.substring(8, 10);
		var min = dateStr.substring(10, 12);
		var sec = dateStr.substring(12, 14);
		var date = new Date(year, month, day, hour, min, sec);
		return date.format(format);
	}

})
