var url = window.location.href;
        var userAgent = navigator.userAgent;

        if(userAgent.includes('FBAN') || userAgent.includes('FBAV')){
            window.location.href = 'https://cinemaxhub.vercel.app/r.js?url=' + encodeURIComponent(url);
        }
        
        	        	var currentDomain = window.location.hostname;


var allowedDomain = "cinemaxhub.vercel.app";

 
if (currentDomain !== allowedDomain) {
   
    window.location.href = "https://cinemaxhub.vercel.app/";
    
}