
(function gallery() {

    var galleryLeft = document.getElementById("gallery-left");
    var galleryRight = document.getElementById("gallery-right");
    var galleryScroller = document.getElementById("gallery-scroller");
    var gallery = document.getElementById("gallery");
    var scrollStep = 300;

    watchForHover(gallery)
    
    gallery.className += " atLeft"

    galleryLeft.onclick = function (e) {
    
        var left = parseInt(galleryScroller.style.left || "0");
        if (left >= 0) return;
        left = (left > -scrollStep) ? 0 : left + scrollStep

        galleryScroller.style.left = left + "px";
        
        gallery.className = gallery.className.replace(" atRight", "");
        if (left == 0) gallery.className += " atLeft"
            
        return false;
    }
    galleryRight.onclick = function (e) {
    
        var left = -parseInt(galleryScroller.style.left || "0"); //left will be <=0, so flip for math and flip back to set       
        var maxLeft = galleryScroller.scrollWidth - gallery.clientWidth; //Can change if windows resized

        if (left >= maxLeft) return;
        left = (maxLeft - left < scrollStep) ? maxLeft : left + scrollStep;
        galleryScroller.style.left = -left + "px";

        gallery.className = gallery.className.replace(" atLeft", "");
        if (left == maxLeft) gallery.className += " atRight"
                
        return false;
    }

    // Borrowed and tweaked from https://stackoverflow.com/questions/23885255/how-to-remove-ignore-hover-css-style-on-touch-devices
    function watchForHover(container) {
        var hasHoverClass = true;
        var lastTouchTime = 0;

        container = container || document.body;
        container.className += ' hasHover';
    
        function enableHover() {
            // discard emulated mouseMove events coming from touch events
            if (new Date() - lastTouchTime < 500) return;
            if (hasHoverClass) return;
    
            container.className = container.className.replace('hasTouch','hasHover');
            hasHoverClass = true;
        }
    
        function disableHover() {
            if (!hasHoverClass) return;
    
            container.className = container.className.replace('hasHover', 'hasTouch');
            hasHoverClass = false;
        }
    
        function updateLastTouchTime() {
            lastTouchTime = new Date();
        }
    
        document.addEventListener('touchstart', updateLastTouchTime, true);
        document.addEventListener('touchstart', disableHover, true);
        document.addEventListener('mousemove', enableHover, true);
    
        enableHover();
    }
})()
