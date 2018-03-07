$(document).ready(function(){
	$(".deleteCategory").on('click', function(){
		var _id = "/admin/categories/delete/" + $(this).attr("_id");
		var name = $(this).attr("name");
		$("#sureDelete").attr("href",_id);
		$("#deleteMsg").html("确认删除选中分类:" + name + "吗？");
		$("#deleteModal").modal('show');
	});
});