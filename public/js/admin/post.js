$(document).ready(function(){


	//list page
	var ndCategory = $("#js-category");
	var ndAuthor = $("#js-author");
	var ndKeyword = $("#js-keyword");

	$("#js-filter-submit").on('click', function(){
		var query = queryString.parse(location.search);
		var category = ndCategory.val();
		var author = ndAuthor.val();
		var keyword = ndKeyword.val();

		if(category) {
			query.category = category;
		} else {
			delete query.category;
		}

		if(author) {
			query.author = author;
		} else {
			delete query.author;
		}

		if(keyword) {
			query.keyword = keyword;
		} else {
			delete query.keyword;
		}

		console.log(queryString.stringify(query));
		window.location.href = window.location.origin + window.location.pathname + queryString.stringify(query);
	});

	//删除文章
	$(".deletePost").on('click', function(){

		var _id ="/admin/posts/delete/"  + $(this).attr("_id");
		var title = $(this).attr("title");
		console.log(title);
		$("#sureDelete").attr("href",_id);
		$("#deleteMsg").html("确认删除选中分类:" + title + "吗？");
		$("#deleteModal").modal('show');
	});

	//add page
	if(typeof CKEDITOR !== 'undefined') {
		CKEDITOR.replace('js-post-content');
	}
});