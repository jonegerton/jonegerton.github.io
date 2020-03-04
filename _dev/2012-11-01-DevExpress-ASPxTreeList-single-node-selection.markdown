---
layout: post
title:  "DevExpress ASPxTreeList - Single node selection via client side JavaScript."
date:   2012-11-01 15:26:00 +0000
categories: ASPxTreeList DevExpress jquery javascript
permalink: /web/devexpress-aspxtreelist-single-node-selection-via-client-side-javascript/
---
Using the DevExpress ASPxTreeList control recently I came across the problem of how to only allow one node checkbox to be selected at once.

There are [examples on the DevExpress support site](http://devexpress.com/Support/Center/p/E325.aspx) of implementing this using server side code and postbacks, however this isn't so desirable, as incurring a postback for every time a node is clicked is fairly expensive.

I had a look into how to implement this using the [ASPxClientTreeList](http://documentation.devexpress.com/#AspNet/clsDevExpressWebASPxTreeListScriptsASPxClientTreeListtopic) functionality available to deselect nodes when other nodes are selected. The solution I worked out works reasonably well, with one caveat which is covered at the end.

Before I go further, its worth noting that this functionality was coded against v11.2.7 of the DevExpress ASPx libraries. In future versions it may not work, the limitations might be fixed, or there may even be a built in way to do the clientside filtering automatically.

I implemented the following javascript. It handles the `ClientSideEvents.SelectionChanged` event:

{% highlight javascript %}
//Cater for client side single click in DevExpress AspxTreeList
var globalTreeClickHandler = new function() {

    /*
    Applies single click functionality on the client side.
    For details of the functions used, see http://documentation.devexpress.com/#AspNet/clsDevExpressWebASPxTreeListScriptsASPxClientTreeListtopic
    */

    var self = this;
    this.debug = false;

    //Define the persistence of last selected nodes
    this.lastSelectedNodeKeys = new Object;

    this.singleClickHandler = function(s, e) {

        if (self.debug) alert("single click handler: " + s.name);

        //If more than one selected
        if (s.GetVisibleSelectedNodeKeys().length &gt; 1) {

            //Deselect the last selected node key.
            if (self.debug) alert("Last Selected Key: " + self.lastSelectedNodeKeys[s.name]);
            if (self.lastSelectedNodeKeys[s.name] != undefined) {
                s.SelectNode(self.lastSelectedNodeKeys[s.name], false);
            }

        }

        //Save the currently selected key for next time
        var selectedKeys = s.GetVisibleSelectedNodeKeys();
        if (self.debug) alert("Selected Key: " + selectedKeys[0]);
        self.lastSelectedNodeKeys[s.name] = selectedKeys[0];

    }

}
{% endhighlight %}

To get your instance of ASPxTreeList to call the code, set the following line in your ASPxTreeList control setup code:


{% highlight javascript %}
treeList.ClientSideEvents.SelectionChanged = "globalTreeClickHandler.singleClickHandler";
{% endhighlight %}

or in the markup:

{% highlight javascript %}
ClientSideEvents.SelectionChanged="globalTreeClickHandler.singleClickHandler"
{% endhighlight %}

### Features:

- The previously selected node is held in a object (effectively a dictionary) using the name of the AspxClientTreeList instance as the key. This allows the code to handle multiple ASPxTreeList controls at once.</
- Setting `this.debug = true;` will cause the code to output debugging message to aid understanding if there are problems

### Known Limitations:

- The `GetVisibleSelectedNodeKeys` and `SelectNode` methods only work on visible nodes. So, if a user selects a node, hides it (by collapsing a parent node), and then selects another, the first node will not be deslected. I think this is because the tree only actually contains the nodes that are displayed - expanding and collapsing causes a DevExpress callback, which regenerates the nodes. For this reason it is still necessary to validate that only one node has been selected on the server side after the form is submitted.