
(function gallery() {

    var left = document.getElementById("gallery-left");
    var right = document.getElementById("gallery-right");
    var scroller = document.getElementById("gallery-scroller");
    var close = document.getElementById("gallery-close");
    var max = document.getElementById("gallery-max");
    var popup = document.getElementById("gallery-popup");
    var image = document.getElementById("gallery-image");
    var gallery = document.getElementById("gallery");
    var items = document.getElementsByClassName("gallery-item");
    var scrollStep = 300;

    watchForHover(gallery);
    
    left.className += " atEnd"

    for (var i = 0; i < items.length; i++) {
        items[i].onclick = thumbClick
    }

    function thumbClick (e) {

        image.setAttribute("src", e.currentTarget.getAttribute("data-image-src"));
        image.setAttribute("alt", e.currentTarget.getAttribute("data-image-alt"));
        max.setAttribute("href", e.currentTarget.getAttribute("data-image-src"));
        
        if (popup.className.indexOf("gallery-popup-show") == -1) {
            popup.className += " gallery-popup-show";
        }

        return false;
    }

    left.onclick = function (e) {
    
        var leftPos = parseInt(scroller.style.left || "0");
        if (leftPos >= 0) return;
        leftPos = (leftPos > -scrollStep) ? 0 : leftPos + scrollStep

        scroller.style.left = leftPos + "px";
        
        right.className = right.className.replace(" atEnd", "");
        if (leftPos == 0) left.className += " atEnd"
            
        return false;
    }
    right.onclick = function (e) {
    
        var leftPos = -parseInt(scroller.style.left || "0"); //left will be <=0, so flip for math and flip back to set       
        var maxLeft = scroller.scrollWidth - gallery.clientWidth; //Can change if windows resized

        if (leftPos >= maxLeft) return;
        leftPos = (maxLeft - leftPos < scrollStep) ? maxLeft : leftPos + scrollStep;
        scroller.style.left = -leftPos + "px";

        left.className = left.className.replace(" atEnd", "");
        if (leftPos == maxLeft) right.className += " atEnd"
                
        return false;
    }

    close.onclick = function (e) {
        popup.className = popup.className.replace(" gallery-popup-show", "");
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
