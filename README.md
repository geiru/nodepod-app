nodepod-app
===========

Nodepod is a tool for visual testing of websites on multiple devices.

It allows you to test your responsive webpage on multiple devices by controlling all devices from your chrome browser.
There is no need to refresh or load pages on every device - its all done automatically by navigating the webpage on you desktop browser.
You can use it in conjunction with `weinre` (http://people.apache.org/~pmuellr/weinre/docs/latest/) to remote debug the webpage on every single device.

Nodepod is still under development and is to be considered an early beta - so use at your own risk.


# How does it work

Nodepod is a tool consisting of a nodejs (http://nodejs.org/) app and a chrome extension. You can find the chrome extension here: https://github.com/geiru/nodepod-chrome_extension.
The nodejs app acts as a reverse proxy that all devices connect to. The reverse proxy delivers the target webpage to the devices. The target webpage is the page, that is currently
loaded in the chrome browser.
The communication between the devices, nodejs app and chrome extension is handled via websockets (or an appropriate fallback). This is done with the great
framework `socket.io` (https://github.com/LearnBoost/socket.io).
Whenever the user loads a new webpage or clicks a link in the chrome browser, the extension sends a new message to the nodejs app. The app in turn, sends a message to all devices to reload
 and get the new content. The content is delivered via a reverse proxy that injects some javascript code in every page.

# How to install

- install nodejs (http://nodejs.org/)
- if you want to remote debug, you should install weinre (http://people.apache.org/~pmuellr/weinre/docs/latest/)
- download or clone this respository (all required node modules are contained in the repository)
- install the chrome extension (https://github.com/geiru/nodepod-chrome_extension)

# How to use

In the following WEINRE_HOST and NODEPOD_HOST denote ip addresses, that must be accessible by the devices. This is usually something like 192.168.xxx.xxx.
You can use ifconfig (Mac and Linux) or ipconfig (Win) to determine your ip address.
WEINRE_PORT and NODEPOD_PORT are ports, that the programms are bound to. You can chose any (available) port you want. This could be something like 8080 or 3124. Be sure to use different port for weinre and nodepod.

## With weinre

Make sure weinre is in your path.

### start nodepod
Go to nodepod directory and type `node app --host NODEPOD_HOST --port NODEPOD_PORT --weinre_host WEINRE_HOST --weinre_port WEINRE_PORT`
If NODEPOD_HOST is the same as WEINRE_HOST (which usually should be the case), you can omit the option --weinre_host WEINRE_HOST. Just type
`node app --host NODEPOD_HOST --port NODEPOD_PORT --weinre_port WEINRE_PORT`

You should see something like
```
info  - socket.io started
Server running on NODEPOD_HOST:NODEPOD_PORT
Trying to start weinre on WEINRE_HOST:WEINRE_PORT
```

## Without weinre

### start nodepod
Go to nodepod directory and type `node app --host NODEPOD_HOST --port NODEPOD_PORT`

You should see something like
```
info  - socket.io started
Server running on NODEPOD_HOST:NODEPOD_PORT
```

## Chrome extension

Now, that nodepod (and weinre) is running, you can start your chrome browser and use the chrome extension (if already installed). You should see the icon next to the address bar.
Click on it and you will see a popup with some inputs ("address", "port" and "name") and a button ("create master"). Fill in the ip address and port that nodepod is running on
(NODEPOD_HOST and NODEPOD_PORT) and click "create master" (you can leave "name" empty). If you connected successfully, you should see a name, a client port and an url in the popup window.

You can now load a webpage that you want to test in any chrome tab.

## Connect a device

Now get your device (or another browser on your desktop) and open `NODEPOD_HOST:NODEPOD_PORT` in your browser. You should now see a button "Connect as client". Click on it and you get redirected.
It should now open the page that you are viewing in your chrome browser.


# Supported platforms

- the server (nodepod-app) can run on any platform that supports nodejs (Linux, Mac, Win)
- the extension at least runs on chrome 23 and up
- every device that has a browser that supports socket.io can use nodepod (see http://socket.io/#browser-support for details); nodepod has been tested on Andoid, iOs and Windows devices
- weinre currently supports Android browsers, iOS browser and others as debug targets (see http://people.apache.org/~pmuellr/weinre/docs/latest/ for details)



# Develop

There is still a lot to do:
 - as of now, only utf-8 encoded target pages are supported
 - no support for authentication of target pages (needs to be done on every device currently)
 - security
 - https support
 - no fancy ui

If you want to contribute, clone the repository.

There are a few unit tests under `test/`. You need to install `https://github.com/caolan/nodeunit` to run the tests.

# dependecies

- nodejs (http://nodejs.org/)
- socket.io (https://github.com/LearnBoost/socket.io)
- weinre (http://people.apache.org/~pmuellr/weinre/docs/latest/) [optional]
- see package.json for dependecies on other node modules