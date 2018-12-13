function ChooseFilename(name) {
	 $("#filename-dialog input.id-filename").val(name);
     SetFilename(name);
     $("#filename-dialog")[0].close();
     //filename_dialog.close();
}

function RequestFileList(path) {
	
	var template = Handlebars.compile(document.getElementById("filelist-ul-template").innerHTML);
	$(".dlg-file-list").html("");
	$.ajax({
        type: "GET",
        url: "api?action=list_dir&file="+path,
        success: function(result) {
          console.log(result);
          var list = result;
          
          for (var i in list.dir) {
              var file = list.dir[i];
              $(".dlg-file-list").append(template({
                  icon: "folder",
                  name: file.name,
                  
                  created: vis.moment.unix(file.create).fromNow(),
                  modified: vis.moment.unix(file.change).fromNow(),
                  onclick: "RequestFileList('"+path+"/"+file.name+"')",
              }));
           }
          
          for (var i in list.files) {
             var file = list.files[i];
             $(".dlg-file-list").append(template({
                 icon: "insert_drive_file",
                 name: file.name,
                 size: HumanSize(file.size),
                 created: vis.moment.unix(file.create).fromNow(),
                 modified: vis.moment.unix(file.change).fromNow(),
                 onclick: "ChooseFilename('"+path+"/"+file.name+"')",
             }));
          }
          

          
        },
      });
}