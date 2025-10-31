(function() {
    // User Agent check করা
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Messenger বা Facebook in-app browser detect করা
    const isFacebookApp = userAgent.indexOf("FBAN") > -1 || userAgent.indexOf("FBAV") > -1;
    const isMessengerApp = userAgent.indexOf("Messenger") > -1 || userAgent.indexOf("FB_IAB") > -1;
    const isInstagramApp = userAgent.indexOf("Instagram") > -1;
    
    // যদি Facebook/Messenger/Instagram app browser হয়
    if (isFacebookApp || isMessengerApp || isInstagramApp) {
        
        // Current page URL নেওয়া
        const currentUrl = window.location.href;
        
        // Chrome এ open করার জন্য intent URL তৈরি করা
        // Android এর জন্য
        const isAndroid = /Android/i.test(userAgent);
        
        if (isAndroid) {
            // Android Chrome intent URL
            const chromeIntent = "intent://" + 
                currentUrl.replace(/^https?:\/\//, "") + 
                "#Intent;scheme=https;package=com.android.chrome;end";
            
            window.location.href = chromeIntent;
        } else {
            // iOS এর জন্য - একটা message দেখানো
            const openInBrowser = confirm(
                "এই পেজটি সঠিকভাবে দেখার জন্য আপনার ব্রাউজারে খুলুন।\n\n" +
                "iOS: উপরে ডানদিকে তিনটি ডট (...) ক্লিক করে 'Open in Safari' অথবা 'Open in Chrome' সিলেক্ট করুন।"
            );
            
            // Alternative: iOS এর জন্য Safari তে redirect (Chrome সরাসরি possible না)
            if (openInBrowser) {
                // Try to open in external browser using googlechrome:// scheme
                window.location.href = "googlechrome://" + currentUrl.replace(/^https?:\/\//, "");
                
                // Fallback to regular https if Chrome not installed
                setTimeout(function() {
                    window.location.href = currentUrl;
                }, 500);
            }
        }
    }
})();