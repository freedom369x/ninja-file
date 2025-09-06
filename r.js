<script>
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');

    if (!url) {
        document.write("No URL provided.");
        return;
    }

    try {
        new URL(url); // validate
    } catch (e) {
        document.write("Invalid URL.");
        return;
    }

    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (userAgent.includes("FBAN") || userAgent.includes("FBAV")) {
        // Inside Facebook/Messenger
        if (userAgent.includes("Android")) {
            // Android -> open Chrome via intent
            const parsed = new URL(url);
            const fullPath = parsed.pathname + (parsed.search || "");
            window.location.href =
                `intent://${parsed.host}${fullPath}#Intent;scheme=https;package=com.android.chrome;end`;
        } else {
            // iOS or others
            window.location.href = url;
        }
    } else {
        // Not FB browser
        window.location.href = url;
    }
})();
</script>