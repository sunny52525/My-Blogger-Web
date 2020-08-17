
tinymce.init({


  selector: 'textarea#autocompleter',
  content_css: '//www.tiny.cloud/css/codepen.min.css',
  height: 250,
  
  plugins: [
    "advlist autolink lists link image charmap print preview anchor paste"
  ],
  
  paste_as_text: true,
  image_title: true,
  file_picker_types: 'image',
  
  images_upload_url:"/upload-image",
  toolbar: "insertfile undo redo | styleselect | bold italic blockquote | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link || image ",
  file_picker_callback: function (cb, value, meta) {
    var input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');


    input.onchange = function () {
      var file = this.files[0];

      var reader = new FileReader();
      reader.onload = function () {
        /*
          Note: Now we need to register the blob in TinyMCEs image blob
          registry. In the next release this part hopefully won't be
          necessary, as we are looking to handle it internally.
        */
        var id = 'blobid' + (new Date()).getTime();
        var blobCache =  tinymce.activeEditor.editorUpload.blobCache;
        var base64 = reader.result.split(',')[1];
        var blobInfo = blobCache.create(id, file, base64);
        blobCache.add(blobInfo);

        /* call the callback and populate the Title field with the file name */
        cb(blobInfo.blobUri(), { title: file.name });
      };
      reader.readAsDataURL(file);
    };

    input.click();
  },

});

