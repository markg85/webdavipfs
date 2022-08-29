# WebDAV IPFS
This project is a proof of concept (POC) to demonstrate IPFS over WebDAV. With that, a few hefty disclaimers are necessary.

**Disclaimers**
1. WebDAV is meant to give you more control over data on a webserver. It essentially transforms your webserver into a fileserver with quite some interesting functionality. In the context of IPFS the "webserver" is your (kubo) node. The functionality you get is the ability to browse your files (if you know the CID of the parent folder) and open them. This is all read-only! You get **nothing** of the WebDAV writing functionality.
2. Serves as a proof of concept for future kubo gateway development. WebDAV defines a set of http methods that might be valuable to have.
3. Very mixed experience on where you use this.
4. Requires access to your IPFS API (port 5001). As this is intended for future gateway development, it made sense to rely in the IPFS API.
5. There will be lots of bugs!

## Setting expectations
| *testcase* | Windows | Linux (KDE) | Android (Solid Explorer) |
| ---------- | ------- | ----- | --------------- |
| File opens |:cry::cry:|:cry::cry:|:smile::smile:|
| Streaming  |:angry::angry:|:angry::angry:|:unicorn::smile:|
| Browsing |:cry::cry:|:smile::smile:|:cry::cry:|
| Metadata works |:smile::smile:|:smile::smile:|:smile::smile:|
| Write prevents |:angry::angry:|:angry::angry:|:angry::angry:|
| Copy |:cry::cry:|:smile::smile:|:smile::smile:|
| Placeholder readme|:smile::smile:|:smile::smile:|:smile::smile:|

Legend:
You see 2 smiles in each column. First smile: my webdav implementation. Second smile, the rclone webdav implementation.
:angry: = Not working at all. No clear path to fix it either.
:cry: = Works in specific condition or needs manual steps. See note for specific app.
:smile: = All good.
:unicorn: Anyone's guess, not able to properly test but looks to be working great.

The idea in this table is for a happy smiley face for the "testcase" to work how you'd expect. So say for example opening a file would have the natural expectation of the file just opening.

Another example is file browsing. You'd expect you can browse to `/ipfs/<cid>`, and you'd be right when using the Dolphin file browser under KDE. But on Android and Windows it just doesn't work that way. The reason here is complicated. Say on Windows you want to browse to `/ipfs/<cid>`, you can if your `/ipfs` folder has that `<cid>` as subfolder. But you don't have that. You don't know which CID's you can browser in `/ipfs` thus windows (and Solid Explorer on android) just don't work. They don't know the child in the given parent. KDE's Dolphin simply doesn't care in this case and tries to open it regardless which is why it works there. For Windows and Android (Solid Explorer) you therefore have to specify the exact point you want to browse at the moment of making a WebDAV connection. So if you made a connection to `/ipfs/<cid_x>` and you then want to browse to `/ipfs/<cid_y>` then you have to edit your WebDAV connection to that new CID you want to browse.

Write prevents, i do have to specifically highlight these. WebDAV itself doesn't have an explicit read only mode. Therefore what i'm trying here isn't fully supported by WebDAV to begin with. Here the disclaimer of "There will be lots of bugs!" applies. Handling this gracefully is just an implementation detail i didn't bother to further implement.

Placeholder readme, these are magical files that you will see on `/ipfs` and `/ipns`. These readme files are just stub single-line files to demonstrate that can be done too. If you're using Windows or Android you likely never see these ad you have to make a mapping there directly to `/ipfs/<cid>`.

Lastly, the "Streaming" testcase. The way WebDAV implementation *mostly* work is by downloading a file you open before they actually open it. On windows you're limited to the WebDAV filesize limit which is 50MB (can be changed in the registry). On Dolpin it will open any file you click but will still download it first. Do note that this is entirely a lack of implementation details in the WebDAV for - in this case - Windows and KDE's Dolphin (KIO to be specific). In the case of Android (with Solid Explorer) things work really well. It magically supports streaming of files from the server meaning it does what you expect, it incrementally gets file chunks allowing you to actually open a file while it's being downloaded. If that file is a video for example then it would "sort of instantly" begin playing. Neat!

With that i've set a bit of a mindset of what to expect and when a smile doesn't look happy.

## Requirements
You need an IPFS node where you have access to the IPFS API (port 5001 by default). You cannot run this project without it.
Nodejs is a hard requirement too.

## How to run this?
The application uses 2 environment variables:
```
# Set to your IPFS API address. Like http://127.0.0.1:5001
IPFS_API

# n which port do you want this server to run? Default is 1900
WEBDAV_PORT
```

If you run a default IPFS node locally then you don't need to specify any environment variables.

Run the following:
```
# git clone https://github.com/markg85/webdavipfs
# cd webdavipfs
# npm install
# node index.js
```

Of if you have your node running somewhere else, specify the IPFS_API environment variable too:
```
# IPFS_API=<your node>:5001 node index.js
```

This should give you an output like like: `WebDAV IPFS running on 127.0.0.1:1900`

## Browsing your WebDAV folder
I'm only going to mention KDE's dolphin here as anything else has it's own specific ways.

In dolphin, edit the URL bar to say: `webdav://<webdav server>:1900/ipfs/<cid>`
Depending on your distribution packages this might work. If your packages are in order then you should see a file/folder listing for your CID. Provided that the CID you filled in is a UnixFS folder tree (added to IPFS with `ipfs add -r <folder>`).

## Future development and contributing
Development in this project is probably done mostly. There might be a few bug fixes every now and then. Other then that no major development is expected here.

You can definitely have a look at the code and help improve it if you like to see this move forward! Patches are definitely welcome!
