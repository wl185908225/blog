$(document).ready(function(){
	$(".deleteAuthor").on('click', function(){
		var _id = "/admin/users/delete/" + $(this).attr("_id");
		var name = $(this).attr("name");
		$("#sureDelete").attr("href",_id);
		$("#deleteMsg").html("确认删除选中作者:" + name + "吗？");
		$("#deleteModal").modal('show');
	});
});