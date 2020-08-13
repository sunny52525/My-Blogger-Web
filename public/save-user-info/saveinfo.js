
  
$(document).ready(function () {

    $('#profile').click(function () {

        $('#imgInp').click();
    });
    function readURL(input) {
      
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('#profile').attr('src', e.target.result);
            }

            reader.readAsDataURL(input.files[0]);
        }
    }

    $("#imgInp").change(function () {
        readURL(this);
    });


});


function sendFormData() {
    
    $(".error-username").removeClass("visible");
    $(".error-name").removeClass("visible");
  $(".progress").addClass("visible");
  document.getElementById("submitButton").disabled = true;
  const file= $('#imgInp').prop('files')[0]; 
 var username=$('#username').val();
     var name=$('#name').val();
     var bio=$('#bio').val();
  var fd = new FormData();
  fd.append("file",file);



    $.ajax({
        type: "POST",
        url: "verify?username="+username +"&name="+name+"&bio="+bio,
        data: fd,
        contentType: false,
    processData: false,
        enctype:'multipart/form-data',
        success: function (data) {
      
            if (data == "username-error") {
                $(".error-username").addClass("visible");
                
  document.getElementById("submitButton").disabled = false;
            } else if (data == "username-empty") {
                $(".error-username").addClass("visible");
                
  document.getElementById("submitButton").disabled = false;
            } else if (data == "name-empty") {
                $(".error-name").addClass("visible");
                
  document.getElementById("submitButton").disabled = false;
            } else if(data=="username-invalid"){
                alert("Invalid username\n"+
                " Username can only contain\n "
                +"characters, Numbers"
                + " and -(dash) , _ (hypen)"
                );
                $(".error-username").addClass("visible");

            }

            else if (data == "ok") {
                location.href = "home";
            }

            $(".progress").removeClass("visible");

        },
        error: function (textstatus, errorThrown) {

            alert('text status ' + textstatus + ', err ' + errorThrown);
        }
    });
} 
