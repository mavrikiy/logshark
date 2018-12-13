

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
		    reader.readAsBinaryString(file, "UTF-8");
		    reader.progress= function (evt) {
		        console.log(evt.loaded);
		
		    }
		    reader.onloadend = function (evt) {
		        //document.getElementById("fileContents").innerHTML = evt.target.result;
		        cb(evt.target.result, evt.loaded);
		    }
		    reader.onerror = function (evt) {
		        //document.getElementById("fileContents").innerHTML = "error reading file";
		    	ShowMessage("Can't read file");
		    }
		}
		//cb();
	}
	file_input.click();
}

var upload_cache = {
		data: "",
		size: 0,
		proceed: 0,
		lines: 0,
}

var upload_chunk_size = 10*1024*1024;

function ProcessUploadChunck() {

	var pos = upload_cache.proceed;
	var target_pos = pos+upload_chunk_size;
	
	if (target_pos > (upload_cache.size-1)) {
		target_pos=(upload_cache.size-1);
	}
	var upload = false;
	while (pos<target_pos) {
		var index = upload_cache.data.indexOf("\n", pos+1);
		if (index >= 0) {
			pos=index;
			upload_cache.lines++;
			upload=true;
		} else {
			break;
		}
	}
	
	if (upload) {
		var chunk = upload_cache.data.slice(upload_cache.proceed, pos)+"\n";
		upload_cache.proceed=pos;
	
		$.ajax({
	        type: "POST",
	        data: chunk,
	        url: "api?action=log&file="+target_file,
	        success: function(result) {
	              ProcessUploadChunck();
	        },
	      });
	} else {
		$("#upload_info").hide();
		$("#upload_menu_item").show();
		ShowMessage("Upload done: " + upload_cache.lines + " lines");
	}
}

function UploadLogs() {
	ShowLoadFileDialog(function(result, size){
		if (size != result.length) {
			ShowMessage("Can't upload file: "+HumanSize(size));
			return;
		}
		$("#upload_info").show();
		$("#upload_menu_item").hide();
		$("#upload_size").text(HumanSize(size));
		ShowMessage("Starting upload: "+HumanSize(size));
		upload_cache.data=result;
		upload_cache.size=size;
		upload_cache.proceed=0;
		upload_cache.lines=0;
		ProcessUploadChunck();
		
	});
	
}