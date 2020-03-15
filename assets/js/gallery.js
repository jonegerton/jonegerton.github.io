
(function gallery() {

    var galleryLeft = document.getElementById("gallery-left");
    var galleryRight = document.getElementById("gallery-right");
    var galleryScroller = document.getElementById("gallery-scroller");
    
    galleryLeft.onclick = function (e) {
    
        var left = parseInt(galleryScroller.style.left || "0");
        galleryScroller.style.left = (left + 300) + "px";
    
        return false;
    }
    galleryRight.onclick = function (e) {
    
        var left = parseInt(galleryScroller.style.left || "0");
        galleryScroller.style.left = (left - 300) + "px";
    
        return false;
    }

})()
