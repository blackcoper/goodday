$(document).ready(function() {
	$('#register-popup').on('click', '.btn-submit', function(e){
		ga('send', 'event', 'button', 'click', 'Submit Register');
		e.preventDefault();
		var name = $('#register-popup input[name=name]').val();
		var email = $('#register-popup input[name=email]').val();
		var password = $('#register-popup input[name=pass]').val();
		var cpassword = $('#register-popup input[name=conf_pass]').val();
		var phone = $('#register-popup input[name=phone]').val();
		var city = $('#register-popup select[name=city]').val();
		$.ajax({
            type: "POST",
            url: './users/register',
            data: { name:name, email:email, pass:password, conf_pass:cpassword, phone:phone, city:city, _csrf:_csrf },
            dataType: 'json',
            success: function(ret){
            	$('#register-popup .error_msg').hide();
            	$('#register-popup input, #register-popup select').removeClass('error');
                if(ret.status==true){
                    window.location.href = ret.url;
                }else{
                    $.each(ret.errors, function(i, value){
                    	if(i=="city"){
                    		$('#register-popup select[name='+i+']').addClass('error');
                    	}else if(i==0){
                            $('#register-popup .global_error').html(value.msg);
                            $('#register-popup .global_error').show();
                        }else{
                    		$('#register-popup input[name='+i+']').addClass('error');
                    	}
                    	$('#register-popup .'+i+'_error').html(value.msg);
                    	$('#register-popup .'+i+'_error').show();
                    });
                }
            },
        });
	});

	$('#login-popup').on('click', '.login', function(e){
		e.preventDefault();
		login();
	});

    $('#login-popup').on('keypress', 'input[name=pass]', function(evt){
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if(charCode==13){
            login();
        }
    });

	$('#login-popup').on('click', '.register', function(e){
		e.preventDefault();
		$('#login-popup').removeClass('block');
		$('#register-popup').addClass('block')
	});

    function login(){
				ga('send', 'event', 'button', 'click', 'Login');
        var email = $('#login-popup input[name=email]').val();
        var password = $('#login-popup input[name=pass]').val();

        $.ajax({
            type: "POST",
            url: './users/login',
            data: { email:email, pass:password, _csrf:_csrf },
            dataType: 'json',
            success: function(ret){
                $('#login-popup .error_msg').hide();
                $('#login-popup input').removeClass('error');
                if(ret.status==true){
                    window.location.href = ret.url;
                }else{
                    $.each(ret.errors, function(i, value){
                        if(i==0){
                            $('#login-popup .global_error').html(value.msg);
                            $('#login-popup .global_error').show();
                        }else{
                            $('#login-popup input[name='+i+']').addClass('error');
                            $('#login-popup .'+i+'_error').html(value.msg);
                            $('#login-popup .'+i+'_error').show();
                        }
                    });
                }
            },
        });
    }
});
