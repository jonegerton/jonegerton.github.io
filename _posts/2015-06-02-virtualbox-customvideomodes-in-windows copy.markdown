---
layout: post
title:  "Confusion around VirtualBox CustomVideoModes in Windows"
date:   2015-06-02 07:53:00 +0000
categories: VirtualBox Windows
---

There are plenty of instances in online forums (eg [here](https://forums.virtualbox.org/viewtopic.php?f=7&amp;t=58572) and [here](http://superuser.com/questions/643064/custom-resolution-in-virtualbox-windows-8-with-guest-additions) of questions about setting CustomVideoModes in VirtualBox when running Windows as the client OS.

#### What is CustomVideoMode?
A CustomVideoMode is an additional screen resolution made available to the VirtualBox guest OS over and above those that are already present by default in VirtualBox.

The command to set a CustomVideoMode in VirtualBox is:

    VBoxManage setextradata "VM Name" CustomVideoMode1 1920x1080x32

This command is run from your VirtualBox installation location in the host OS. The VM Name must be the name of your virtual machine, CustomVideoMode1 can change to CustomVideoMode2 etc to allow for additional extra modes, and the resolution part should be set to the resolutions you need.

#### What actually happens in Windows
This isn't actually the proper way to deal with resolutions in Windows guests. Instead, the Guest Additions should be installed into the client OS, and then the option to use `Auto-resize Guest Display` will resize the guest to whatever size it's containing window is at. In fact, if you use the above command to add custom video modes, and then look at the options in the display properties on the guest, then they won't even be shown - usually there will just be the VirtualBox defaults plus whatever size the guest happens to have sized itself to at that moment.

In my recent experience however this isn't the full story here. I often find that, on my running virtual machines, the auto-resize stops working, particularly after the host sleeps, or the number of monitors attached to the host changes (I use a laptop most of the time, and plug into a dock at home).

#### What's going on?
VirtualBox Guest Additions installs a VirtualBox Display adapter driver - this is what handles the auto-resize for us. Unfortunately, I find that this crashes and gets disabled by the guest OS fairly frequently. I can see errors in my guest event log such as:

> Display driver VBoxVideoW8 stopped responding and has been successfully disabled.

I suspect I'm getting this more than most as I've been running the preview builds of Windows 10 for quite a while in my guests, and my use of a laptop means that my display switches relatively often.

As the message says the VBoxVideoW8 driver is disabled. This is what stops the resizing from working. Instead we fallback to using the `Microsoft Basic Display Driver`, and we're stuck with the original defaults. When the guest OS is rebooted the VirtualBox driver will usually work again, but rebooting is usually undesirable as our current workspace is lost. Alternatively we can try to reinitialize the VirtualBox driver by going through the `Update driver` dialogs and manually selecting the `Oracle Corporation >> VirtualBox Device` driver. Unfortunately I find that this tends to require a reboot to take effect anyway.

#### CustomVideoMode to the rescue
Helpfully, the `Microsoft Basic Display Driver` does pick up settings made using the CustomVideoMode. This means we can have a nice fallback when the VirtualBox driver stops. Adding our normal working resolutions lets us manually switch between then as required in the guest display properties dialog.

Therefore I tend to install my Windows VMs with the following two statements that cover my two main display resolutions:

    VBoxManage setextradata "VM Name" CustomVideoMode1 1920x1080x32
    VBoxManage setextradata "VM Name" CustomVideoMode2 1366x768x32

With these set, I can easily switch the guest to work nicely in full screen on whichever display I need without an annoying reboot or mis-sized guest.