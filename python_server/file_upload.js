

function ShowLoadFileDialog(cb) {
	var file_input=document.getElementById("file_upload").test;
	$("upload_info").show(); // workaround
	file_input.onchange=function(){};
	file_input.value="";
	file_input.onchange=function(){
		console.log("File selected");
		var file = file_input.files[0];
		if (file) {
		    var reader = new FileReader();
		    reader.readAsText(file, "UTF-8");
		    reader.onload = function (evt) {
		        //document.getElementById("fileContents").innerHTML = evt.target.result;
		        cb(evt.target.result);
		    }
		    reader.onerror = function (evt) {
		        //document.getElementById("fileContents").innerHTML = "error reading file";
		    }
		}
		//cb();
	}
	file_input.click();
}


function UploadLogs() {
	ShowLoadFileDialog(function(result){
		$("upload_info").show();
		$("upload_menu_item").hide();
		$("#upload_size").text(HumanSize(result.length));
		$.ajax({
	          type: "POST",
	          data: result,
	          url: "api?action=log&file="+target_file,
	          success: function(result) {
	        	  $("upload_info").hide();
	        	  $("upload_menu_item").show();
	          },
	        });
	});
	
}