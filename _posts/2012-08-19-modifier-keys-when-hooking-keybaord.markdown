---
layout: post
title:  "Determining the state of modifier keys when hooking keyboard input"
date:   2012-08-19 10:59:33 +0000
categories: C#, WinApi
---

As part of a utility I was writing recently I wanted to hook keyboard input. In particular I was interested in global hooks (ie input to any program, not just mine), and I needed to handle complex key inputs, for example `Ctrl-Alt-G`, i.e. keys plus modifiers. The usual way to do this is to use `SetWindowsHookEx`.

Looking around I quickly found a class over on [CodeProject here](http://www.codeproject.com/Articles/19004/A-Simple-C-Global-Low-Level-Keyboard-Hook). The `globalKeyboardHook` class deals with the hooking, allows you to specify which keys you are interested in and disregards the rest. The events are raised using the delegate type <a href="http://msdn.microsoft.com/en-us/library/system.windows.forms.keyeventhandler.aspx">`KeyEventHandler`</a>. `KeyEventHandler` uses `KeyEventArgs` and has easily referenced properties for each of the modifier keys. So far so good.

However I found that the instance of `KeyEventArgs` I was receiving in my event handler never had the modifier properties set to `true`. Looking at the code for the class I couldn't see anything there that would set the properties in the call back function for `SetWindowsHookEx`.

The pertinent section of the original `globalKeyboardHook` class looks like this:


{% highlight csharp %}
    public int hookProc(int code, int wParam, 
        ref keyboardHookStruct lParam) {

        if (code >= 0) {

            Keys key = (Keys)lParam.vkCode;

            if (HookedKeys.Contains(key)) {

                KeyEventArgs kea = new KeyEventArgs(key);

                if ((wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN) 
                    && (KeyDown != null)) {

                    KeyDown(this, kea) ;
                } else if ((wParam == WM_KEYUP || wParam == WM_SYSKEYUP)
                    && (KeyUp != null)) {

                    KeyUp(this, kea);
                }
                if (kea.Handled)
                    return 1;
            }
        }
        return CallNextHookEx(hhook, code, wParam, ref lParam);
    }
{% endhighlight %}

While this code does return a `KeyEventArgs`, there is no effort made to populate the modifier indicating properties on the class.

Googling around on the problem (for quite a while!), I found another reference to another WinApi command, `GetKeyState` in [this CodeProject article](http://www.codeproject.com/Articles/14485/Low-level-Windows-API-hooks-from-C-to-stop-unwante). There is documentation for `GetKeyState` on the [MSDN Dev Center](http://msdn.microsoft.com/en-us/library/windows/desktop/ms646301%28v=vs.85%29.aspx). `GetKeyState` is declared as follows:

{% highlight csharp %}
    /// <summary>
    /// Gets the state of modifier keys for a given keycode.
    /// </summary>
    /// <param name="keyCode">The keyCode</param>
    /// <returns></returns>
    [DllImport("user32.dll", CharSet = CharSet.Auto, 
        ExactSpelling = true, 
        CallingConvention = CallingConvention.Winapi)]
    public static extern short GetKeyState(int keyCode);

    //Modifier key vkCode constants
    private const int VK_SHIFT = 0x10;
    private const int VK_CONTROL = 0x11;
    private const int VK_MENU = 0x12;
    private const int VK_CAPITAL = 0x14;
{% endhighlight %}

We use a method to call GetKeyState for each vk constant above. It then adds each active key to the key code, so that, when KeyEventArgs is populated from keyCode, the modifier properties are set as we would expect.

{% highlight csharp %}
    /// <summary>
    /// Checks whether Alt, Shift, Control or CapsLock
    /// is pressed at the same time as the hooked key.
    /// Modifies the keyCode to include the pressed keys.
    /// </summary>
    private Keys AddModifiers(Keys key)
    {
        //CapsLock
        if ((GetKeyState(VK_CAPITAL) & 0x0001) != 0) key = key | Keys.CapsLock;

        //Shift
        if ((GetKeyState(VK_SHIFT) & 0x8000) != 0) key = key | Keys.Shift;

        //Ctrl
        if ((GetKeyState(VK_CONTROL) & 0x8000) != 0) key = key | Keys.Control;

        //Alt
        if ((GetKeyState(VK_MENU) & 0x8000) != 0) key = key | Keys.Alt;

        return key;
    }
{% endhighlight %}

Finally this method is included in the original hook processing code:

{% highlight csharp %}
    public int hookProc(int code, int wParam, ref keyboardHookStruct lParam) {
        if (code >= 0) {

            Keys key = (Keys)lParam.vkCode;

        if (HookedKeys.Contains(key)) {

            //Get modifiers
            key = AddModifiers(key);

            KeyEventArgs kea = new KeyEventArgs(key);
        ...
{% endhighlight %}

The returned KeyEventArgs passed in the `KeyDown` and `KeyUp` events will now in include the correct values of the modifier properties.

The full (and latest) implementation of `globalKeyboardHook` can be found in the source for the I was working on in [GitHub here](https://github.com/jonegerton/Jon.ScreenGrabber/tree/master/Jon.ScreenGrabber).