(function collapsible() {

    var collapsibles = document.getElementsByClassName("collapsible");
    
    
    for (var i = 0; i < collapsibles.length; i++) {
        var collapsible = collapsibles[i];

        var container = document.createElement("div");
        container.innerHTML = collapsible.innerHTML;
        collapsible.innerHTML = "";
        collapsible.appendChild(container);

        //If container is small then remove collapsible style entirely
        //and don't add the expander button
        if (container.clientHeight < 240) {
            collapsible.className = collapsible.className.replace(" collapsible","");
            return;
        }
        
        var expander = document.createElement("div");
        expander.className = "expander";
        expander.innerText = "˅";
        collapsible.appendChild(expander);

        expander.onclick = function() {
            if (collapsible.className.indexOf("expanded") > -1) {
                expander.innerText = "˅";
                collapsible.style.height = "180px";
                collapsible.className = collapsible.className.replace(" expanded","");
            } else {
                expander.innerText = "˄";
                collapsible.style.height = (container.clientHeight + 36) + "px";
                collapsible.className += " expanded";
            }
        }
        
    }
})();