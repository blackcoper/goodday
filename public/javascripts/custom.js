// (function($){

  /* ---------------------------------------------- /*
	 * Preloader
	/* ---------------------------------------------- */

	function css_browser_selector(u){var ua=u.toLowerCase(),is=function(t){return ua.indexOf(t)>-1},g='gecko',w='webkit',s='safari',o='opera',m='mobile',h=document.documentElement,b=[(!(/opera|webtv/i.test(ua))&&/msie\s(\d)/.test(ua))?('ie ie'+RegExp.$1):is('firefox/2')?g+' ff2':is('firefox/3.5')?g+' ff3 ff3_5':is('firefox/3.6')?g+' ff3 ff3_6':is('firefox/3')?g+' ff3':is('gecko/')?g:is('opera')?o+(/version\/(\d+)/.test(ua)?' '+o+RegExp.$1:(/opera(\s|\/)(\d+)/.test(ua)?' '+o+RegExp.$2:'')):is('konqueror')?'konqueror':is('blackberry')?m+' blackberry':is('android')?m+' android':is('chrome')?w+' chrome':is('iron')?w+' iron':is('applewebkit/')?w+' '+s+(/version\/(\d+)/.test(ua)?' '+s+RegExp.$1:''):is('mozilla/')?g:'',is('j2me')?m+' j2me':is('iphone')?m+' iphone':is('ipod')?m+' ipod':is('ipad')?m+' ipad':is('mac')?'mac':is('darwin')?'mac':is('webtv')?'webtv':is('win')?'win'+(is('windows nt 6.0')?' vista':''):is('freebsd')?'freebsd':(is('x11')||is('linux'))?'linux':'','js']; c = b.join(' '); h.className += ' '+c; return c;}; css_browser_selector(navigator.userAgent);
	
	$(window).load(function() {
		$('#status').fadeOut();
		$('#preloader').delay(300).fadeOut('slow');
	});

	$(document).ready(function() {
    
		paceOptions = {
	      // Disable the 'elements' source
	      elements: false,

	      // Only show the progress on regular and ajax-y page navigation,
	      // not every request
	      restartOnRequestAfter: false
	    }
  
	    $(".content-syarat-ketentuan").mCustomScrollbar({
	      scrollButtons:{enable:true},
	    }); 

	    $('select').selectric({
	      	disableOnMobile: false
	    });

	    //range slider
	    var selector = '[data-rangeslider]'; 
		var $inputRange = $(selector);
		$inputRange.rangeslider({ polyfill: false }); 
	    
	   	set_heightWrapper();
	    $(window).resize($.debounce(500, function(){

	    	set_heightWrapper();
	    }));

	    //show login popup
	    $('#login-btn').click(function(){
	    	if($('#register-popup').hasClass('block')) {
	    		
	    		$('#register-popup').removeClass('block');
	    		$('#login-popup').addClass('block');
	    	}else {
	    		
	    		$('#login-popup').addClass('block');
	    	}
	    });

	    //close login popup
	    $('#close-login').click(function(){

	    	$('#login-popup').removeClass('block');
	    });

	    //show register pop up
	    $('#register-btn').click(function(){

	    	if($('#login-popup').hasClass('block')) {
	    		
	    		$('#login-popup').removeClass('block');
	    		$('#register-popup').addClass('block');
	    	}else {

	    		$('#register-popup').addClass('block');
	    	}
	    });

	    //close register pop up
	    $('#close-register').click(function(){
	    	$('#register-popup').removeClass('block');
	    })

	     //slacknav
	    $('#menu').slicknav();

	});

  	function set_heightWrapper() {    
    	var winHeight    = $(window).height();
    	var headerHeight = parseFloat($('#header').css('height'));
    	var cloudBottom  = parseFloat($('.wrapper-cloud-bottom').css('height'));
    	var parent 		 = document.querySelector('.wrapper-content');
    	var contentHeight= ''; //parseFloat($('.window-maudy').css('height'));
    	var bodyHeight 	 = winHeight - headerHeight;

    	//set height wrapper
    	if (parent.querySelector('.window-maudy') !== null) {

	      	contentHeight = parseFloat($('.window-maudy').css('height')) + 30;
	    }else if (parent.querySelector('.wrapper-frame-absolute') !== null) {

	      	contentHeight = parseFloat($('.wrapper-frame-absolute').css('height')) + headerHeight + cloudBottom;
	    }else {

	    	contentHeight = 0;	
	    }
    	
    	if(winHeight < contentHeight) {

    		$('.wrapper-content').css({'height': (contentHeight)+'px'});	
    	}else {

    		$('.wrapper-content').css({'height': bodyHeight+'px'});
    	}

    	//set line home page
    	if (parent.querySelector('.window-maudy') !== null) {

    		//declare height wrapper and height maudy
    		var wrapH = $('.wrapper').height();
    		var maudy = parseFloat($('.window-maudy').css('height'));

    		$('.line-sun').css({'height': (wrapH - maudy)+ 30 +'px'});
    		$('.line-good-day-left').css({'height': (wrapH - maudy)+ 40 +'px'});
    		$('.line-good-day-right').css({'height': (wrapH - maudy)+ 40 +'px'});
    		$('.line-good-day-cloud').css({'height': (wrapH - maudy)+ 30 +'px'});
  		}

  		//set line frame
  		if(parent.querySelector('.wrapper-frame-absolute') != null) {
  			//declare height wrapper and height maudy
    		var wrapH = $('.wrapper').outerHeight(true);
    		var wrapA = parseFloat($('.wrapper-frame-absolute').css('height')) + cloudBottom;

    		$('.line-cloud-left').css({'height': (wrapH - wrapA) + 20 + 'px'});
    		$('.line-frame-left').css({'height': (wrapH - wrapA)+ 40 +'px'});
    		$('.line-header-left').css({'height': (wrapH - wrapA)+ 40 +'px'});
    		$('.line-header-right').css({'height': (wrapH - wrapA)+ 40 +'px'});

    		if( $(window).width() <= 768) {
    			
    			$('.line-frame-right').css({'height': (wrapH - wrapA) + 5 +'px'});
    		}else {

    			$('.line-frame-right').css({'height': (wrapH - wrapA)+ 40 +'px'});
    		}
    		
    		$('.line-cloud-right').css({'height': (wrapH - wrapA)+ 50 +'px'});
  		} 

  		//set wrapper class big
  		if(winHeight > 1000) {

	  		$('.wrapper').addClass('big');	
  		}else {
  			$('.wrapper').removeClass('big');
  		}
  	};
// })(jQuery);